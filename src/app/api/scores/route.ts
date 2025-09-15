// src/app/api/scores/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createScoreStore } from '@/helpers/scoreStore';

export async function GET(req: NextRequest) {
    try {
        const store = createScoreStore();
        const scores = await store.getScores();
        return NextResponse.json({ scores });
    } catch (error) {
        console.error('Error reading scores:', error);
        return NextResponse.json({ scores: [] });
    }
}
