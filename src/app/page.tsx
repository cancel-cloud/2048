// src/app/page.tsx
'use client';
import {useEffect, useState} from 'react';
import axios from 'axios';
import Head from 'next/head';
import {GameState} from '@/helpers/gameLogic';
import {detectDevice} from '@/helpers/utils';
import RecentScores from "@/components/RecentScores";
import Footer from "@/components/Footer";

// @ts-ignore
const colors: { [key: number]: string } = {
    2: 'bg-2048-tile-2 text-2048-text-dark',
    4: 'bg-2048-tile-4 text-2048-text-dark',
    8: 'bg-2048-tile-8 text-2048-text-light',
    16: 'bg-2048-tile-16 text-2048-text-light',
    32: 'bg-2048-tile-32 text-2048-text-light',
    64: 'bg-2048-tile-64 text-2048-text-light',
    128: 'bg-2048-tile-128 text-2048-text-dark',
    256: 'bg-2048-tile-256 text-2048-text-dark',
    512: 'bg-2048-tile-512 text-2048-text-dark',
    1024: 'bg-2048-tile-1024 text-2048-text-dark',
    2048: 'bg-2048-tile-2048 text-2048-text-dark',
};

const Home = () => {
    const [board, setBoard] = useState<number[][]>([]);
    const [score, setScore] = useState<number>(0);
    const [autoMove, setAutoMove] = useState<boolean>(false);
    const [isMobile, setIsMobile] = useState<boolean>(false);
    const [gameOver, setGameOver] = useState<boolean>(false);

    useEffect(() => {
        initializeGame();
        detectDevice(setIsMobile);
        window.addEventListener('resize', () => detectDevice(setIsMobile));
        return () => {
            window.removeEventListener('resize', () => detectDevice(setIsMobile));
        };
    }, []);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!gameOver) {
                switch (event.key) {
                    case 'ArrowUp':
                        handleMove('up');
                        break;
                    case 'ArrowDown':
                        handleMove('down');
                        break;
                    case 'ArrowLeft':
                        handleMove('left');
                        break;
                    case 'ArrowRight':
                        handleMove('right');
                        break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [gameOver]);

    const initializeGame = async () => {
        try {
            const response = await axios.post<GameState>('/api', {direction: 'reset'});
            console.log('API Response:', response.data);
            if (response.data && response.data.board) {
                setBoard(response.data.board);
                setScore(response.data.score);
                setGameOver(false);
            } else {
                console.error('Invalid response structure:', response.data);
            }
        } catch (error) {
            console.error('Error initializing game:', error);
        }
    };

    const handleMove = async (direction: string) => {
        try {
            const response = await axios.post<GameState>('/api', {direction});
            console.log('API Response:', response.data);
            if (response.data && response.data.board) {
                setBoard(response.data.board);
                setScore(response.data.score);
                if (response.data.gameOver) {
                    setGameOver(true);
                }
            } else {
                console.error('Invalid response structure:', response.data);
            }
        } catch (error) {
            console.error('Error handling move:', error);
        }
    };

    const renderBoard = () => {
        if (!Array.isArray(board) || board.length === 0) {
            return <div>Loading...</div>;
        }

        const tileSize = isMobile ? '20vw' : '100px';

        return (
            <div
                id="board"
                className="grid grid-cols-4 gap-2 bg-2048-board rounded-lg shadow-md"
                style={{width: isMobile ? '80vw' : '450px', height: isMobile ? '80vw' : '450px'}}
            >
                {board.flat().map((tile, index) => (
                    <div
                        key={index}
                        className={`tile ${colors[tile] || colors[0]} flex items-center justify-center text-2xl font-bold rounded-md`}
                        style={{width: tileSize, height: tileSize}}
                    >
                        {tile !== 0 ? tile : ''}
                    </div>
                ))}
            </div>
        );
    };

    const renderDeathScreen = () => {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                    <h2 className="text-2xl font-bold mb-4">Game Over</h2>
                    <p className="mb-4">Your score: {score}</p>
                    <button
                        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                        onClick={initializeGame}
                    >
                        Reset
                    </button>
                </div>
            </div>
        );
    };

    useEffect(() => {
        if (autoMove && !gameOver) {
            const interval = setInterval(() => {
                handleMove('best');
            }, 500);
            return () => clearInterval(interval);
        }
    }, [autoMove, gameOver]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-2048-bg">
            <Head>
                <title>2048 Game</title>
            </Head>

            <main className="flex flex-col items-center justify-center flex-1 px-4 text-center space-y-4 md:px-20">
                <RecentScores/>
                <h1 className="text-4xl md:text-6xl font-bold text-2048-title">2048 Game</h1>
                <div className="text-xl md:text-2xl text-2048-score">Score: {score}</div>
                {renderBoard()}
                <div className="flex flex-col space-y-2 md:space-y-0 md:space-x-4 md:flex-row">
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        onClick={() => handleMove('best')}
                    >
                        Next Move
                    </button>
                    <button
                        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                        onClick={initializeGame}
                    >
                        Reset
                    </button>
                    <label className="inline-flex items-center bg-gray-200 px-4 py-2 rounded">
                        <input
                            type="checkbox"
                            className="form-checkbox h-5 w-5 text-green-600"
                            checked={autoMove}
                            onChange={() => setAutoMove(!autoMove)}
                        />
                        <span className="ml-2 text-gray-700">Auto</span>
                    </label>
                </div>
                {isMobile && (
                    <div className="fixed inset-x-0 bottom-0 flex justify-around p-4 bg-2048-bg">
                        <button
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                            onClick={() => handleMove('up')}
                        >
                            ↑
                        </button>
                        <button
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                            onClick={() => handleMove('left')}
                        >
                            ←
                        </button>
                        <button
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                            onClick={() => handleMove('right')}
                        >
                            →
                        </button>
                        <button
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                            onClick={() => handleMove('down')}
                        >
                            ↓
                        </button>
                    </div>
                )}
                {gameOver && renderDeathScreen()}
            </main>
            <Footer/>
        </div>

    );
};

export default Home;
