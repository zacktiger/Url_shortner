import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'SnapLink - High-Performance URL Shortener',
    description: 'Shorten URLs and track real-time analytics with sub-millisecond redirect speeds.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen flex flex-col`}>
                <AuthProvider>
                    <Navbar />
                    <main className="flex-1 flex flex-col">
                        {children}
                    </main>
                </AuthProvider>
            </body>
        </html>
    );
}
