// src/app/api/route.ts
import {NextRequest, NextResponse} from 'next/server';
import {bestMove, checkGameOver, GameState, generateInitialBoard, move, saveScore} from '../../helpers/gameLogic';

let gameState: GameState = {
    board: generateInitialBoard(),
    score: 0,
};

export async function POST(req: NextRequest) {
    const {direction} = await req.json();

    if (direction === 'reset') {
        gameState = {
            board: generateInitialBoard(),
            score: 0,
        };
        return NextResponse.json(gameState);
    }

    let moveResult;
    if (direction === 'best') {
        const bestDirection = bestMove(gameState.board);
        moveResult = move(gameState.board, bestDirection);
    } else {
        moveResult = move(gameState.board, direction);
    }

    gameState.board = moveResult.board;
    gameState.score += moveResult.score;

    if (checkGameOver(gameState.board)) {
        saveScore(gameState.score);
        return NextResponse.json({...gameState, gameOver: true});
    }

    return NextResponse.json(gameState);
}
