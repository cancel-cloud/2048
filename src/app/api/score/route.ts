// src/app/api/score/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createScoreStore } from '@/helpers/scoreStore';

// In-memory store for idempotency check (simple runId tracking)
const recentRunIds = new Set<string>();

export async function POST(req: NextRequest) {
    try {
        const { timestamp, score, username, runId } = await req.json();

        // Validate required fields
        if (!timestamp || score === undefined || score === null) {
            return NextResponse.json(
                { error: 'Missing required fields: timestamp and score' },
                { status: 400 }
            );
        }

        // Idempotency check: ignore duplicates if same runId was just stored
        if (runId && recentRunIds.has(runId)) {
            return NextResponse.json({ ok: true, duplicate: true });
        }

        const store = createScoreStore();
        await store.addScore({
            timestamp,
            score: parseInt(score, 10),
            username: username || undefined,
            runId
        });

        // Track runId for idempotency (keep only last 1000)
        if (runId) {
            recentRunIds.add(runId);
            if (recentRunIds.size > 1000) {
                const firstRunId = recentRunIds.values().next().value;
                recentRunIds.delete(firstRunId);
            }
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Error saving score:', error);
        return NextResponse.json(
            { error: 'Failed to save score' },
            { status: 500 }
        );
    }
}