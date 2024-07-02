import type {Config} from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
            },
            colors: {
                '2048-bg': '#faf8ef',
                '2048-board': '#bbada0',
                '2048-text-light': '#f9f6f2',
                '2048-text-dark': '#776e65',
                '2048-title': '#776e65',
                '2048-score': '#776e65',
                '2048-tile-2': '#eee4da',
                '2048-tile-4': '#ede0c8',
                '2048-tile-8': '#f2b179',
                '2048-tile-16': '#f59563',
                '2048-tile-32': '#f67c5f',
                '2048-tile-64': '#f65e3b',
                '2048-tile-128': '#edcf72',
                '2048-tile-256': '#edcc61',
                '2048-tile-512': '#edc850',
                '2048-tile-1024': '#edc53f',
                '2048-tile-2048': '#edc22e',
                '2048-tile-default': '#cdc1b4',
            },
        },
    },
    plugins: [],
};
export default config;
