import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';

// Inter for UI text; JetBrains Mono for short codes, URLs and numbers.
// Both are exposed as CSS variables consumed in globals.css (@theme).
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono' });

export const metadata: Metadata = {
    title: 'SnapLink — Fast URL Shortener with Analytics',
    description: 'Shorten URLs and track real-time analytics with Redis-cached redirects.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
            <body className="font-sans bg-canvas text-zinc-200 min-h-screen flex flex-col antialiased">
                <AuthProvider>
                    <Navbar />
                    <main className="flex-1 flex flex-col">
                        {children}
                    </main>
                    <footer className="border-t border-white/[0.06] py-6">
                        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500">
                            <span className="font-medium">SnapLink</span>
                            <span>Next.js · Express · Redis · PostgreSQL</span>
                        </div>
                    </footer>
                </AuthProvider>
            </body>
        </html>
    );
}
