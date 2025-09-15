// src/app/page.tsx
'use client';
import {useEffect, useState, useCallback} from 'react';
import axios from 'axios';
import Head from 'next/head';
import {GameState} from '@/helpers/gameLogic';
import {detectDevice} from '@/helpers/utils';
import RecentScores from "@/components/RecentScores";
import UserProfile from "@/components/UserProfile";
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
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUsername, setCurrentUsername] = useState<string>('');
    const [scoreSavedThisSession, setScoreSavedThisSession] = useState<boolean>(false);

    // Function to get current username from localStorage
    const getCurrentUsername = (): string => {
        try {
            return localStorage.getItem('username') || '';
        } catch (error) {
            console.warn('Error reading username from localStorage:', error);
            return '';
        }
    };

    const saveScoreToAPI = async (scoreToSave: number, username: string, runId?: string) => {
        try {
            await axios.post('/api/score', {
                timestamp: new Date().toISOString(),
                score: scoreToSave,
                username: username || undefined,
                runId
            });
            // Force refresh of scores to show the new entry
            window.dispatchEvent(new CustomEvent('scoresUpdated'));
        } catch (error) {
            console.warn('Failed to save score:', error);
        }
    };

    const initializeGame = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            // Save score on reset if score > 0 and not already saved this session
            if (score > 0 && !scoreSavedThisSession) {
                const username = getCurrentUsername();
                await saveScoreToAPI(score, username, `reset-${Date.now()}`);
                setScoreSavedThisSession(true);
            }
            
            const response = await axios.post<GameState>('/api', {direction: 'reset'});
            console.log('API Response:', response.data);
            if (response.data && response.data.board) {
                setBoard(response.data.board);
                setScore(response.data.score);
                setGameOver(false);
                setScoreSavedThisSession(false); // Reset for new game session
            } else {
                console.error('Invalid response structure:', response.data);
                setError('Failed to initialize game. Please try again.');
            }
        } catch (error) {
            console.error('Error initializing game:', error);
            setError('Failed to initialize game. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [score, scoreSavedThisSession]); // Removed currentUsername as it's accessed via getCurrentUsername()

    useEffect(() => {
        initializeGame();
        detectDevice(setIsMobile);
        window.addEventListener('resize', () => detectDevice(setIsMobile));
        return () => {
            window.removeEventListener('resize', () => detectDevice(setIsMobile));
        };
    }, [initializeGame]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!gameOver && !isLoading) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameOver, isLoading]);

    const handleMove = async (direction: string) => {
        if (isLoading) return; // Prevent moves while loading
        
        try {
            setIsLoading(true);
            setError(null);
            const username = getCurrentUsername();
            const response = await axios.post<GameState>('/api', {direction, username});
            console.log('API Response:', response.data);
            if (response.data && response.data.board) {
                setBoard(response.data.board);
                setScore(response.data.score);
                if (response.data.gameOver) {
                    setGameOver(true);
                    setScoreSavedThisSession(true); // Mark as saved (API handles saving)
                    // Force refresh of scores to show the new entry
                    window.dispatchEvent(new CustomEvent('scoresUpdated'));
                }
            } else {
                console.error('Invalid response structure:', response.data);
                // Treat invalid responses as potential game-over situations
                // Save score before setting game over
                const username = getCurrentUsername();
                await saveScoreToAPI(score, username, `error-${Date.now()}`);
                setGameOver(true);
                setScoreSavedThisSession(true); // Mark as saved
            }
        } catch (error) {
            console.error('Error handling move:', error);
            // Treat network/API errors as potential game-over situations
            // Save score before setting game over
            const username = getCurrentUsername();
            await saveScoreToAPI(score, username, `error-${Date.now()}`);
            setGameOver(true);
            setScoreSavedThisSession(true); // Mark as saved
        } finally {
            setIsLoading(false);
        }
    };

    const renderBoard = () => {
        if (error) {
            return (
                <div className="flex flex-col items-center justify-center p-8 bg-red-100 rounded-lg">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded button-hover"
                        onClick={initializeGame}
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        if (!Array.isArray(board) || board.length === 0) {
            return (
                <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-2048-title"></div>
                    <span className="ml-4 text-2048-title">Loading game...</span>
                </div>
            );
        }

        const tileSize = isMobile ? '20vw' : '100px';

        return (
            <div
                id="board"
                className={`grid grid-cols-4 gap-2 bg-2048-board rounded-lg shadow-md game-container ${isLoading ? 'loading' : ''}`}
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
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-sm mx-4">
                    <h2 className="text-2xl font-bold mb-4 text-gray-800">Game Over</h2>
                    <p className="mb-2 text-gray-600">No moves left. Final score has been saved.</p>
                    <p className="mb-6 text-lg font-semibold text-gray-800">Your score: {score}</p>
                    <div className="flex space-x-3 justify-center">
                        <button
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                            onClick={initializeGame}
                        >
                            Try Again
                        </button>
                        <button
                            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                            onClick={() => setGameOver(false)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    useEffect(() => {
        if (autoMove && !gameOver && !isLoading) {
            const interval = setInterval(() => {
                handleMove('best');
            }, 500);
            return () => clearInterval(interval);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoMove, gameOver, isLoading]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-2048-bg">
            <Head>
                <title>2048 Game</title>
            </Head>

            <main className="flex flex-col items-center justify-center flex-1 px-4 text-center space-y-4 md:px-20">
                <RecentScores/>
                <UserProfile onUsernameChange={(newUsername) => setCurrentUsername(newUsername)}/>
                <h1 className="text-4xl md:text-6xl font-bold text-2048-title">2048 Game</h1>
                <div className="text-xl md:text-2xl text-2048-score">Score: {score}</div>
                {renderBoard()}
                <div className="flex flex-col space-y-2 md:space-y-0 md:space-x-4 md:flex-row">
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded button-hover disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleMove('best')}
                        disabled={isLoading || gameOver}
                    >
                        {isLoading ? 'Processing...' : 'Next Move'}
                    </button>
                    <button
                        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded button-hover disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={initializeGame}
                        disabled={isLoading}
                    >
                        Reset
                    </button>
                    <label className="inline-flex items-center bg-gray-200 px-4 py-2 rounded">
                        <input
                            type="checkbox"
                            className="form-checkbox h-5 w-5 text-green-600"
                            checked={autoMove}
                            onChange={() => setAutoMove(!autoMove)}
                            disabled={isLoading || gameOver}
                        />
                        <span className="ml-2 text-gray-700">Auto</span>
                    </label>
                </div>
                {isMobile && (
                    <div className="fixed inset-x-0 bottom-0 flex justify-around p-4 bg-2048-bg">
                        <button
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded button-hover disabled:opacity-50"
                            onClick={() => handleMove('up')}
                            disabled={isLoading || gameOver}
                        >
                            ↑
                        </button>
                        <button
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded button-hover disabled:opacity-50"
                            onClick={() => handleMove('left')}
                            disabled={isLoading || gameOver}
                        >
                            ←
                        </button>
                        <button
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded button-hover disabled:opacity-50"
                            onClick={() => handleMove('right')}
                            disabled={isLoading || gameOver}
                        >
                            →
                        </button>
                        <button
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded button-hover disabled:opacity-50"
                            onClick={() => handleMove('down')}
                            disabled={isLoading || gameOver}
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
