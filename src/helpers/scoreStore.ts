// src/helpers/scoreStore.ts

// Type-only import: stripped at runtime, safe in non-Vercel environments.
import type { VercelKV } from '@vercel/kv';

export interface ScoreEntry {
    timestamp: string;
    score: number;
    username?: string;
    runId?: string;
}

export interface ScoreStore {
    addScore(entry: { timestamp: string; score: number; username?: string; runId?: string }): Promise<void>;
    getRecent(limit?: number): Promise<ScoreEntry[]>;
    exportCSV(): Promise<string>;
}

// Vercel KV Store implementation
// Uses dynamic import() so it works with @vercel/kv v3 (ESM-only package).
class VercelKVScoreStore implements ScoreStore {
    // Lazily resolved kv client; shared across method calls within an instance.
    private kvCache: VercelKV | null = null;

    private async getKV(): Promise<VercelKV> {
        if (this.kvCache) return this.kvCache;

        // Validate required env vars before attempting the import.
        if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
            throw new Error(
                '[ScoreStore] Vercel KV is not configured. ' +
                'Add KV_REST_API_URL and KV_REST_API_TOKEN to your project environment variables ' +
                'by connecting a Vercel KV database at https://vercel.com/dashboard.'
            );
        }

        // Dynamic import works with ESM-only packages like @vercel/kv v3.
        const { kv } = await import('@vercel/kv');
        this.kvCache = kv;
        return kv;
    }

    async addScore(entry: { timestamp: string; score: number; username?: string; runId?: string }): Promise<void> {
        const kv = await this.getKV();
        const csvLine = `${entry.timestamp},${entry.score}${entry.username ? `,${entry.username}` : ''}`;

        try {
            // Prepend to recent scores list and keep only the latest 100.
            await kv.lpush('recent_scores', csvLine);
            await kv.ltrim('recent_scores', 0, 99);

            // Mirror to a sorted set for leaderboard queries (score as rank key).
            await kv.zadd('leaderboard', { score: entry.score, member: csvLine });
        } catch (error) {
            console.error('[ScoreStore] KV write error:', error);
            throw error;
        }
    }

    async getRecent(limit: number = 20): Promise<ScoreEntry[]> {
        const kv = await this.getKV();

        try {
            const scoreLines: string[] = await kv.lrange('recent_scores', 0, limit - 1) ?? [];
            return scoreLines
                .map((line) => this.parseScoreLine(line))
                .filter((entry): entry is ScoreEntry => entry !== null);
        } catch (error) {
            console.error('[ScoreStore] KV read error:', error);
            return [];
        }
    }

    async exportCSV(): Promise<string> {
        const kv = await this.getKV();

        try {
            const scoreLines: string[] = await kv.lrange('recent_scores', 0, -1) ?? [];
            return 'timestamp,score,username\n' + scoreLines.join('\n');
        } catch (error) {
            console.error('[ScoreStore] KV export error:', error);
            return 'timestamp,score,username\n';
        }
    }

    private parseScoreLine(line: string): ScoreEntry | null {
        try {
            const parts = line.split(',');
            if (parts.length < 2) return null;
            return {
                timestamp: parts[0],
                score: parseInt(parts[1], 10),
                username: parts[2] || undefined,
            };
        } catch {
            console.warn('[ScoreStore] Failed to parse score line:', line);
            return null;
        }
    }
}

class FileSystemScoreStore implements ScoreStore {
    private filePath: string;

    constructor(filePath: string) {
        this.filePath = filePath;
    }

    async addScore(entry: { timestamp: string; score: number; username?: string; runId?: string }): Promise<void> {
        const fs = await import('fs');
        const path = await import('path');

        // Ensure directory exists before writing.
        const dir = path.dirname(this.filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const csvLine = `${entry.timestamp},${entry.score}${entry.username ? `,${entry.username}` : ''}\n`;

        try {
            fs.appendFileSync(this.filePath, csvLine);
        } catch (error) {
            console.warn('[ScoreStore] Failed to write to filesystem:', error);
            throw error;
        }
    }

    async getRecent(limit: number = 20): Promise<ScoreEntry[]> {
        const fs = await import('fs');

        try {
            if (!fs.existsSync(this.filePath)) return [];
            const data = fs.readFileSync(this.filePath, 'utf-8');
            return this.parseScoreData(data).slice(0, limit);
        } catch (error) {
            console.warn('[ScoreStore] Failed to read from filesystem:', error);
            return [];
        }
    }

    async exportCSV(): Promise<string> {
        const fs = await import('fs');

        try {
            if (!fs.existsSync(this.filePath)) return 'timestamp,score,username\n';
            const data = fs.readFileSync(this.filePath, 'utf-8');
            return 'timestamp,score,username\n' + data;
        } catch (error) {
            console.warn('[ScoreStore] Failed to export from filesystem:', error);
            return 'timestamp,score,username\n';
        }
    }

    private parseScoreData(data: string): ScoreEntry[] {
        return data.trim().split('\n')
            .filter(line => line.trim())
            .map(line => {
                const parts = line.split(',');
                return {
                    timestamp: parts[0],
                    score: parseInt(parts[1], 10),
                    username: parts[2] || undefined,
                };
            })
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
}

class LocalStorageScoreStore implements ScoreStore {
    private readonly storageKey = '2048-scores';

    async addScore(entry: { timestamp: string; score: number; username?: string; runId?: string }): Promise<void> {
        if (typeof window === 'undefined') {
            console.warn('[ScoreStore] localStorage is not available server-side.');
            return;
        }

        try {
            const existingScores = await this.getRecent(100);
            const updatedScores = [entry, ...existingScores].slice(0, 100);
            localStorage.setItem(this.storageKey, JSON.stringify(updatedScores));
        } catch (error) {
            console.warn('[ScoreStore] Failed to save to localStorage:', error);
        }
    }

    async getRecent(limit: number = 20): Promise<ScoreEntry[]> {
        if (typeof window === 'undefined') return [];

        try {
            const data = localStorage.getItem(this.storageKey);
            if (!data) return [];
            const scores = JSON.parse(data) as ScoreEntry[];
            return scores
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, limit);
        } catch (error) {
            console.warn('[ScoreStore] Failed to read from localStorage:', error);
            return [];
        }
    }

    async exportCSV(): Promise<string> {
        const scores = await this.getRecent(1000);
        const rows = scores.map(s =>
            `${s.timestamp},${s.score}${s.username ? `,${s.username}` : ''}`
        );
        return 'timestamp,score,username\n' + rows.join('\n');
    }
}

// Factory: returns the right store for the current environment.
// On Vercel: always use KV (connection errors are caught at call time and logged clearly).
// Locally: use the CSV file in the project root.
export function createScoreStore(): ScoreStore {
    if (process.env.VERCEL === '1') {
        // VercelKVScoreStore validates env vars lazily; a missing KV_REST_API_URL /
        // KV_REST_API_TOKEN will produce a clear error message at addScore() time.
        return new VercelKVScoreStore();
    }

    // Local development — write to scores.csv in the project root.
    const filePath = `${process.cwd()}/scores.csv`;
    return new FileSystemScoreStore(filePath);
}

// For client-side only usage (browser).
export function createLocalStorageStore(): ScoreStore {
    return new LocalStorageScoreStore();
}