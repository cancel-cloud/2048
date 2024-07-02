// src/components/RecentScores.tsx
'use client';
import {useEffect, useState} from 'react';
import axios from 'axios';

interface Score {
    timestamp: string;
    score: number;
}

const RecentScores = () => {
    const [scores, setScores] = useState<Score[]>([]);

    useEffect(() => {
        const fetchScores = async () => {
            try {
                const response = await axios.get('/api/scores');
                console.log('Fetched scores:', response.data); // Debug log
                setScores(response.data.scores);
            } catch (error) {
                console.error('Error fetching scores:', error);
            }
        };
        fetchScores();
    }, []);

    return (
        <div
            className="hidden md:block fixed left-1/4 top-1/2 transform -translate-y-1/2 -translate-x-1/2 p-4 bg-white shadow-lg rounded-md">
            <h2 className="text-xl font-bold mb-4">Recent Scores</h2>
            <ul className="space-y-2">
                {scores.slice(0, 10).map((score, index) => (
                    <li key={index} className="flex justify-between">
                        <span>{new Date(score.timestamp).toLocaleString()}</span>
                        <span>{score.score}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default RecentScores;
