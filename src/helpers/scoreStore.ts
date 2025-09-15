// src/helpers/scoreStore.ts

export interface ScoreEntry {
    timestamp: string;
    score: number;
    username?: string;
}

export interface ScoreStore {
    addScore(entry: { timestamp: string; score: number; username?: string }): Promise<void>;
    getRecent(limit?: number): Promise<ScoreEntry[]>;
    exportCSV(): Promise<string>;
}

// Vercel KV Store implementation
class VercelKVScoreStore implements ScoreStore {
    private kv: any;

    constructor() {
        // Dynamic import to handle environments where @vercel/kv is not available
        try {
            const { kv } = require('@vercel/kv');
            this.kv = kv;
        } catch (error) {
            console.warn('Vercel KV not available, falling back to CSV');
            throw error;
        }
    }

    async addScore(entry: { timestamp: string; score: number; username?: string }): Promise<void> {
        const csvLine = `${entry.timestamp},${entry.score}${entry.username ? `,${entry.username}` : ''}`;
        
        try {
            // Add to recent scores list (keep last 100)
            await this.kv.lpush('recent_scores', csvLine);
            await this.kv.ltrim('recent_scores', 0, 99);
            
            // Add to leaderboard sorted set (optional for future use)
            await this.kv.zadd('leaderboard', { score: entry.score, member: csvLine });
        } catch (error) {
            console.error('KV store error:', error);
            throw error;
        }
    }

    async getRecent(limit: number = 20): Promise<ScoreEntry[]> {
        try {
            const scoreLines = await this.kv.lrange('recent_scores', 0, limit - 1) || [];
            return scoreLines.map((line: string) => this.parseScoreLine(line))
                .filter((entry: ScoreEntry | null) => entry !== null) as ScoreEntry[];
        } catch (error) {
            console.error('KV read error:', error);
            return [];
        }
    }

    async exportCSV(): Promise<string> {
        try {
            const scoreLines = await this.kv.lrange('recent_scores', 0, -1) || [];
            const header = 'timestamp,score,username\n';
            return header + scoreLines.join('\n');
        } catch (error) {
            console.error('KV export error:', error);
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
                username: parts[2] || undefined
            };
        } catch (error) {
            console.warn('Failed to parse score line:', line, error);
            return null;
        }
    }
}

class FileSystemScoreStore implements ScoreStore {
    private filePath: string;

    constructor(filePath: string) {
        this.filePath = filePath;
    }

    async addScore(entry: { timestamp: string; score: number; username?: string }): Promise<void> {
        const fs = await import('fs');
        const path = await import('path');
        
        // Ensure directory exists
        const dir = path.dirname(this.filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        const csvLine = `${entry.timestamp},${entry.score}${entry.username ? `,${entry.username}` : ''}\n`;
        
        try {
            fs.appendFileSync(this.filePath, csvLine);
        } catch (error) {
            console.warn('Failed to write to filesystem, falling back to localStorage:', error);
            // Fallback to localStorage
            const localStore = new LocalStorageScoreStore();
            await localStore.addScore(entry);
        }
    }

    async getRecent(limit: number = 20): Promise<ScoreEntry[]> {
        const fs = await import('fs');
        
        try {
            if (!fs.existsSync(this.filePath)) {
                return [];
            }

            const data = fs.readFileSync(this.filePath, 'utf-8');
            return this.parseScoreData(data).slice(0, limit);
        } catch (error) {
            console.warn('Failed to read from filesystem, falling back to localStorage:', error);
            // Fallback to localStorage
            const localStore = new LocalStorageScoreStore();
            return await localStore.getRecent(limit);
        }
    }

    async exportCSV(): Promise<string> {
        const fs = await import('fs');
        
        try {
            if (!fs.existsSync(this.filePath)) {
                return 'timestamp,score,username\n';
            }

            const data = fs.readFileSync(this.filePath, 'utf-8');
            return 'timestamp,score,username\n' + data;
        } catch (error) {
            console.warn('Failed to export from filesystem:', error);
            return 'timestamp,score,username\n';
        }
    }

    private parseScoreData(data: string): ScoreEntry[] {
        return data.trim().split('\n')
            .filter(line => line.trim())
            .map(line => {
                const parts = line.split(',');
                const timestamp = parts[0];
                const score = parseInt(parts[1], 10);
                const username = parts[2] || undefined;
                return { timestamp, score, username };
            })
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
}

class LocalStorageScoreStore implements ScoreStore {
    private readonly storageKey = '2048-scores';

    async addScore(entry: { timestamp: string; score: number; username?: string }): Promise<void> {
        if (typeof window === 'undefined') {
            // Server-side, can't use localStorage
            console.warn('localStorage not available on server-side');
            return;
        }

        try {
            const existingScores = await this.getRecent(100);
            const updatedScores = [entry, ...existingScores].slice(0, 100); // Keep only last 100 scores
            localStorage.setItem(this.storageKey, JSON.stringify(updatedScores));
        } catch (error) {
            console.warn('Failed to save to localStorage:', error);
        }
    }

    async getRecent(limit: number = 20): Promise<ScoreEntry[]> {
        if (typeof window === 'undefined') {
            // Server-side, return empty array
            return [];
        }

        try {
            const data = localStorage.getItem(this.storageKey);
            if (!data) return [];
            
            const scores = JSON.parse(data) as ScoreEntry[];
            return scores
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, limit);
        } catch (error) {
            console.warn('Failed to read from localStorage:', error);
            return [];
        }
    }

    async exportCSV(): Promise<string> {
        const scores = await this.getRecent(1000); // Get more for export
        const header = 'timestamp,score,username\n';
        const rows = scores.map(score => 
            `${score.timestamp},${score.score}${score.username ? `,${score.username}` : ''}`
        );
        return header + rows.join('\n');
    }
}

// Factory function to create appropriate store based on environment
export function createScoreStore(): ScoreStore {
    // If running on Vercel, force KV usage
    if (process.env.VERCEL === "1") {
        try {
            return new VercelKVScoreStore();
        } catch (error) {
            console.warn('KV not available in production, falling back to localStorage');
            return new LocalStorageScoreStore();
        }
    }
    
    // Local development: try CSV first, then fallback
    const path = require('path');
    const filePath = path.join(process.cwd(), 'scores.csv');
    return new FileSystemScoreStore(filePath);
}

// For client-side only usage
export function createLocalStorageStore(): ScoreStore {
    return new LocalStorageScoreStore();
}