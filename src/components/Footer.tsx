// components/Footer.tsx
import React from 'react';
import Image from 'next/image';

const Footer: React.FC = () => {
    return (
        <footer className="bg-[#f3b27a] text-[#776e65] py-2 w-screen">
            <div className="container mx-auto flex flex-col items-center space-y-2">
                <a href="https://yourwebsite.com" className="flex items-center space-x-2">
                    <Image src="/logo.png" alt="Logo" className="w-8 h-8" width={32} height={32}/>
                    <span className="text-lg font-semibold">DevBrew Development</span>
                </a>
                <div className="flex space-x-4">
                    <a href="mailto:0rare-reputed@icloud.com" className="hover:text-[#bbada0]">
                        Contact
                    </a>
                    <a href="https://github.com/cancel-cloud" className="hover:text-[#bbada0]">
                        <svg
                            className="w-6 h-6"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                fillRule="evenodd"
                                d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.867 8.167 6.839 9.489.5.092.682-.217.682-.483 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.153-1.11-1.46-1.11-1.46-.908-.62.069-.607.069-.607 1.004.07 1.533 1.033 1.533 1.033.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.252-4.555-1.11-4.555-4.942 0-1.091.39-1.983 1.029-2.682-.103-.253-.446-1.27.098-2.646 0 0 .84-.269 2.75 1.026A9.577 9.577 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.747-1.026 2.747-1.026.546 1.376.202 2.393.1 2.646.64.699 1.027 1.591 1.027 2.682 0 3.841-2.337 4.687-4.564 4.934.359.309.679.92.679 1.855 0 1.338-.012 2.421-.012 2.75 0 .268.179.579.688.481C19.136 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </a>
                </div>
                <div className="text-center mt-2 text-sm">
                    Made by Lukas with <span className="text-red-500">&hearts;</span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
