// src/app/api/route.ts
import {NextRequest, NextResponse} from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
    try {
        const filePath = path.join(process.cwd(), 'scores.csv');
        if (!fs.existsSync(filePath)) {
            console.log('Scores file does not exist');
            return NextResponse.json({scores: []});
        }

        const data = fs.readFileSync(filePath, 'utf-8');
        console.log('Scores file content:', data); // Debug log

        const scores = data.trim().split('\n').map(line => {
            const parts = line.split(',');
            const timestamp = parts[0];
            const score = parseInt(parts[1], 10);
            const username = parts[2] || undefined; // Optional third field
            return {timestamp, score, username};
        }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        console.log('Parsed scores:', scores); // Debug log

        return NextResponse.json({scores});
    } catch (error) {
        console.error('Error reading scores:', error);
        return NextResponse.json({scores: []});
    }
}
