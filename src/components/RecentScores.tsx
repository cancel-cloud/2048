// src/components/RecentScores.tsx
'use client';
import {useEffect, useState} from 'react';
import axios from 'axios';

interface Score {
    timestamp: string;
    score: number;
    username?: string; // Optional for backward compatibility
}

const RecentScores = () => {
    const [scores, setScores] = useState<Score[]>([]);

    const fetchScores = async () => {
        try {
            const response = await axios.get('/api/scores');
            console.log('Fetched scores:', response.data); // Debug log
            setScores(response.data.scores);
        } catch (error) {
            console.error('Error fetching scores:', error);
        }
    };

    useEffect(() => {
        fetchScores();
        
        // Listen for scores update events
        const handleScoresUpdate = () => {
            fetchScores();
        };
        
        window.addEventListener('scoresUpdated', handleScoresUpdate);
        
        return () => {
            window.removeEventListener('scoresUpdated', handleScoresUpdate);
        };
    }, []);

    return (
        <div
            className="hidden md:block fixed left-1/4 top-1/2 transform -translate-y-1/2 -translate-x-1/2 p-4 bg-white shadow-lg rounded-md">
            <h2 className="text-xl font-bold mb-4">Recent Scores</h2>
            <ul className="space-y-2">
                {scores.slice(0, 10).map((score, index) => (
                    <li key={index} className="flex flex-col space-y-1">
                        <div className="flex justify-between">
                            <span className="text-sm">{new Date(score.timestamp).toLocaleString()}</span>
                            <span className="font-bold">{score.score}</span>
                        </div>
                        {score.username && (
                            <div className="text-xs text-gray-600 italic">
                                by {score.username}
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default RecentScores;
