import type {Metadata} from "next";
import {Inter} from "next/font/google";
import "./globals.css";
import {Analytics} from "@vercel/analytics/react";

const inter = Inter({
    subsets: ["latin"],
    display: 'swap',
    fallback: ['system-ui', 'arial']
});

export const metadata: Metadata = {
    title: "2048 FTW",
    description: "Play the 2048 game online. Combine tiles to reach the 2048 tile!",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <body className={inter.className}>
        {children}
        <Analytics/>

        </body>
        </html>
    );
}
