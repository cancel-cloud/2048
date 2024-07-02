// src/components/Logo.tsx
const Logo = () => {
    return (
        <div className="flex items-center space-x-2">
            <div
                className="w-10 h-10 bg-2048-tile-2048 text-2048-text-dark flex items-center justify-center text-2xl font-bold rounded-md">
                2048
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-2048-title">Game</h1>
        </div>
    );
};

export default Logo;
