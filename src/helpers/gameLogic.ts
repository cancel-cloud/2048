// src/helpers/gameLogic.ts

import fs from 'fs';
import path from 'path';

export interface GameState {
    board: number[][];
    score: number;
    gameOver?: boolean;
}

export const generateInitialBoard = (): number[][] => {
    const board = Array.from({length: 4}, () => Array(4).fill(0));
    addRandomTile(board);
    addRandomTile(board);
    return board;
};

export const addRandomTile = (board: number[][]): boolean => {
    const emptyTiles = [];
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            if (board[r][c] === 0) emptyTiles.push({r, c});
        }
    }
    if (emptyTiles.length === 0) return false; // No space for a new tile
    const {r, c} = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
    board[r][c] = Math.random() < 0.9 ? 2 : 4;
    return true;
};

export const move = (board: number[][], direction: string): { board: number[][], score: number, moved: boolean } => {
    let rotated = board;
    let score = 0;
    let moved = false;

    switch (direction) {
        case 'up':
            rotated = rotateBoard(board, -1);
            break;
        case 'down':
            rotated = rotateBoard(board, 1);
            break;
        case 'left':
            rotated = board;
            break;
        case 'right':
            rotated = rotateBoard(board, 2);
            break;
    }

    for (let i = 0; i < 4; i++) {
        const [newRow, rowScore, rowMoved] = slideAndMerge(rotated[i]);
        rotated[i] = newRow;
        score += rowScore;
        moved = moved || rowMoved;
    }

    switch (direction) {
        case 'up':
            rotated = rotateBoard(rotated, 1);
            break;
        case 'down':
            rotated = rotateBoard(rotated, -1);
            break;
        case 'left':
            rotated = rotated;
            break;
        case 'right':
            rotated = rotateBoard(rotated, 2);
            break;
    }

    if (moved) {
        addRandomTile(rotated);
    }

    return {board: rotated, score, moved};
};


const rotateBoard = (board: number[][], times: number): number[][] => {
    const newBoard = Array.from({length: 4}, () => Array(4).fill(0));
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (times === 1) {
                newBoard[j][3 - i] = board[i][j];
            } else if (times === 2) {
                newBoard[3 - i][3 - j] = board[i][j];
            } else if (times === -1) {
                newBoard[3 - j][i] = board[i][j];
            }
        }
    }
    return newBoard;
};

const slideAndMerge = (row: number[]): [number[], number, boolean] => {
    const newRow = row.filter(tile => tile !== 0);
    let score = 0;
    let moved = false;
    for (let i = 0; i < newRow.length - 1; i++) {
        if (newRow[i] === newRow[i + 1]) {
            newRow[i] *= 2;
            newRow[i + 1] = 0;
            score += newRow[i];
            moved = true;
        }
    }
    const resultRow = newRow.filter(tile => tile !== 0).concat(Array(4 - newRow.filter(tile => tile !== 0).length).fill(0));
    moved = moved || resultRow.some((tile, idx) => tile !== row[idx]);
    return [resultRow, score, moved];
};

export const bestMove = (board: number[][]): string => {
    const directions = ['up', 'down', 'left', 'right'];
    return directions[Math.floor(Math.random() * directions.length)];
};

export const saveScore = (score: number, username?: string): void => {
    const filePath = path.join(process.cwd(), 'scores.csv');
    const csvLine = `${new Date().toISOString()},${score}${username ? `,${username}` : ''}\n`;
    fs.appendFileSync(filePath, csvLine);
};

export const checkGameOver = (board: number[][]): boolean => {
    const size = board.length;

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            // Check if the current tile is empty
            if (board[r][c] === 0) return false;

            // Check for possible merges in all four directions
            // Right
            if (c < size - 1 && board[r][c] === board[r][c + 1]) return false;
            // Left
            if (c > 0 && board[r][c] === board[r][c - 1]) return false;
            // Down
            if (r < size - 1 && board[r][c] === board[r + 1][c]) return false;
            // Up
            if (r > 0 && board[r][c] === board[r - 1][c]) return false;
        }
    }

    // If no moves are possible and no empty tiles, the game is over
    return true;
};