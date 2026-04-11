// src/components/UserProfile.tsx
'use client';
import {useEffect, useState} from 'react';

interface UserProfileProps {
    onUsernameChange?: (newUsername: string) => void;
}

const UserProfile = ({onUsernameChange}: UserProfileProps) => {
    const [username, setUsername] = useState<string>('');

    useEffect(() => {
        initializeUsername();
    }, []);

    const initializeUsername = async () => {
        try {
            // Check localStorage first
            const storedUsername = localStorage.getItem('username');
            if (storedUsername) {
                setUsername(storedUsername);
                return;
            }

            // Fetch random name from names.txt
            try {
                const response = await fetch('/names.txt');
                const text = await response.text();
                const names = text.trim().split('\n').filter(name => name.trim().length > 0);
                
                if (names.length > 0) {
                    const randomName = names[Math.floor(Math.random() * names.length)].trim();
                    localStorage.setItem('username', randomName);
                    setUsername(randomName);
                    return;
                }
            } catch (error) {
                console.warn('Failed to fetch random name from names.txt:', error);
            }

            // Fallback to Player + 3-digit suffix
            const fallbackName = `Player${Math.floor(Math.random() * 900 + 100)}`;
            localStorage.setItem('username', fallbackName);
            setUsername(fallbackName);
        } catch (error) {
            console.warn('Error initializing username:', error);
            // Final fallback
            const fallbackName = `Player${Math.floor(Math.random() * 900 + 100)}`;
            setUsername(fallbackName);
        }
    };

    const handleChangeUsername = () => {
        const newUsername = prompt('Enter new username (max 24 characters, letters, numbers, spaces, ._- allowed):');
        
        if (newUsername === null) return; // User cancelled

        // Validate and clean the input
        const trimmed = newUsername.trim();
        if (trimmed.length === 0) {
            alert('Username cannot be empty');
            return;
        }

        if (trimmed.length > 24) {
            alert('Username must be 24 characters or less');
            return;
        }

        // Allow letters, numbers, spaces, ._-
        const validPattern = /^[a-zA-Z0-9\s._-]+$/;
        if (!validPattern.test(trimmed)) {
            alert('Username can only contain letters, numbers, spaces, periods, underscores, and hyphens');
            return;
        }

        // Save and update
        localStorage.setItem('username', trimmed);
        setUsername(trimmed);
        
        // Notify parent component if callback provided
        if (onUsernameChange) {
            onUsernameChange(trimmed);
        }
    };

    return (
        <div className="hidden md:block fixed right-1/4 top-1/2 transform translate-x-1/2 -translate-y-1/2 p-4 bg-white shadow-lg rounded-md min-w-[200px]">
            <h2 className="text-xl font-bold mb-4">User Profile</h2>
            <div className="space-y-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Username:
                    </label>
                    <div className="text-lg font-semibold text-gray-900 break-words">
                        {username || 'Loading...'}
                    </div>
                </div>
                <button
                    className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded button-hover"
                    onClick={handleChangeUsername}
                    disabled={!username}
                >
                    Change
                </button>
            </div>
        </div>
    );
};

export default UserProfile;