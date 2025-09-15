// src/app/api/route.ts
import {NextRequest, NextResponse} from 'next/server';
import {bestMove, checkGameOver, GameState, generateInitialBoard, move} from '../../helpers/gameLogic';
import {createScoreStore} from '../../helpers/scoreStore';

let gameState: GameState = {
    board: generateInitialBoard(),
    score: 0,
};

export async function POST(req: NextRequest) {
    const {direction, username} = await req.json();

    if (direction === 'reset') {
        gameState = {
            board: generateInitialBoard(),
            score: 0,
        };
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

    // Check for game over after move and tile spawn
    if (checkGameOver(gameState.board)) {
        // Save score on game over
        try {
            const store = createScoreStore();
            const entry = {
                timestamp: new Date().toISOString(),
                score: gameState.score,
                username
            };
            await store.addScore(entry);
        } catch (error) {
            console.error('Failed to save score on game over:', error);
        }
        return NextResponse.json({...gameState, gameOver: true});
    }

    return NextResponse.json(gameState);
}
