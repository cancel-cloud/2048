// src/app/api/route.ts
import {NextRequest, NextResponse} from 'next/server';
import {bestMove, checkGameOver, GameState, generateInitialBoard, move, saveScore} from '../../helpers/gameLogic';

let gameState: GameState = {
    board: generateInitialBoard(),
    score: 0,
};

export async function POST(req: NextRequest) {
    const {direction, username, score} = await req.json();

    if (direction === 'reset') {
        gameState = {
            board: generateInitialBoard(),
            score: 0,
        };
        return NextResponse.json(gameState);
    }

    if (direction === 'save-score') {
        // Save score and return success
        await saveScore(score || gameState.score, username);
        return NextResponse.json({ success: true });
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
        await saveScore(gameState.score, username);
        return NextResponse.json({...gameState, gameOver: true});
    }

    return NextResponse.json(gameState);
}
