// src/helpers/scoreStore.ts

export interface ScoreEntry {
    timestamp: string;
    score: number;
    username?: string;
}

export interface ScoreStore {
    saveScore(score: number, username?: string): Promise<void>;
    getScores(): Promise<ScoreEntry[]>;
}

class FileSystemScoreStore implements ScoreStore {
    private filePath: string;

    constructor(filePath: string) {
        this.filePath = filePath;
    }

    async saveScore(score: number, username?: string): Promise<void> {
        const fs = await import('fs');
        const csvLine = `${new Date().toISOString()},${score}${username ? `,${username}` : ''}\n`;
        
        try {
            fs.appendFileSync(this.filePath, csvLine);
        } catch (error) {
            console.warn('Failed to write to filesystem, falling back to localStorage:', error);
            // Fallback to localStorage
            const localStore = new LocalStorageScoreStore();
            await localStore.saveScore(score, username);
        }
    }

    async getScores(): Promise<ScoreEntry[]> {
        const fs = await import('fs');
        
        try {
            if (!fs.existsSync(this.filePath)) {
                return [];
            }

            const data = fs.readFileSync(this.filePath, 'utf-8');
            return this.parseScoreData(data);
        } catch (error) {
            console.warn('Failed to read from filesystem, falling back to localStorage:', error);
            // Fallback to localStorage
            const localStore = new LocalStorageScoreStore();
            return await localStore.getScores();
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

    async saveScore(score: number, username?: string): Promise<void> {
        if (typeof window === 'undefined') {
            // Server-side, can't use localStorage
            console.warn('localStorage not available on server-side');
            return;
        }

        const newEntry: ScoreEntry = {
            timestamp: new Date().toISOString(),
            score,
            username
        };

        try {
            const existingScores = await this.getScores();
            const updatedScores = [newEntry, ...existingScores].slice(0, 100); // Keep only last 100 scores
            localStorage.setItem(this.storageKey, JSON.stringify(updatedScores));
        } catch (error) {
            console.warn('Failed to save to localStorage:', error);
        }
    }

    async getScores(): Promise<ScoreEntry[]> {
        if (typeof window === 'undefined') {
            // Server-side, return empty array
            return [];
        }

        try {
            const data = localStorage.getItem(this.storageKey);
            if (!data) return [];
            
            const scores = JSON.parse(data) as ScoreEntry[];
            return scores.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        } catch (error) {
            console.warn('Failed to read from localStorage:', error);
            return [];
        }
    }
}

// Factory function to create appropriate store based on environment
export function createScoreStore(): ScoreStore {
    // In production/serverless environments, filesystem writes often fail
    // We'll try filesystem first but gracefully fall back to localStorage
    const path = require('path');
    const filePath = path.join(process.cwd(), 'scores.csv');
    
    // Always use filesystem store with localStorage fallback
    return new FileSystemScoreStore(filePath);
}

// For client-side only usage
export function createLocalStorageStore(): ScoreStore {
    return new LocalStorageScoreStore();
}