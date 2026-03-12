// src/app/api/route.ts
import {NextRequest, NextResponse} from 'next/server';
import {bestMove, checkGameOver, checkWinCondition, GameState, generateInitialBoard, generateRunId, move} from '../../helpers/gameLogic';
import {createScoreStore} from '../../helpers/scoreStore';

let gameState: GameState = {
    board: generateInitialBoard(),
    score: 0,
    status: "playing",
    runId: generateRunId(),
};

export async function POST(req: NextRequest) {
    const {direction, username} = await req.json();

    if (direction === 'reset') {
        gameState = {
            board: generateInitialBoard(),
            score: 0,
            status: "playing",
            runId: generateRunId(),
        };
        return NextResponse.json(gameState);
    }

    // Only process moves if game is still playing
    if (gameState.status !== "playing") {
        return NextResponse.json(gameState);
    }

    // Process the user's requested direction (accept all inputs)
    let moveResult;
    if (direction === 'best') {
        const bestDirection = bestMove(gameState.board);
        moveResult = move(gameState.board, bestDirection);
    } else {
        moveResult = move(gameState.board, direction);
    }

    gameState.board = moveResult.board;
    gameState.score += moveResult.score;

    // Check for terminal states after move and tile spawn
    let terminalStateReached = false;
    
    // Check for win condition first (player reached 2048)
    if (checkWinCondition(gameState.board)) {
        gameState.status = "won";
        terminalStateReached = true;
    }
    // Check for loss condition (no moves possible)
    else if (checkGameOver(gameState.board)) {
        gameState.status = "lost";
        terminalStateReached = true;
    }

    // Save score ONLY on terminal state transitions
    if (terminalStateReached) {
        try {
            const store = createScoreStore();
            const entry = {
                timestamp: new Date().toISOString(),
                score: gameState.score,
                username,
                runId: gameState.runId
            };
            await store.addScore(entry);
        } catch (error) {
            console.error('Failed to save score on terminal state:', error);
        }
    }

    return NextResponse.json(gameState);
}
