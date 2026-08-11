import type { Metadata } from 'next';
import { Bricolage_Grotesque, Hanken_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';

// Three type roles (see globals.css): Bricolage for display headings,
// Hanken for UI text, JetBrains Mono for short codes, URLs and numbers.
const bricolage = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-bricolage' });
const hanken = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-hanken' });
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
        <html lang="en" className={`dark ${bricolage.variable} ${hanken.variable} ${jetbrainsMono.variable}`}>
            <body className="font-sans bg-canvas text-stone-200 min-h-screen flex flex-col antialiased">
                <AuthProvider>
                    <Navbar />
                    <main className="flex-1 flex flex-col">
                        {children}
                    </main>
                    <footer className="border-t border-white/[0.06] py-6">
                        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-[11px] tracking-wide text-stone-500">
                            <span>SnapLink · {new Date().getFullYear()}</span>
                            <span>Next.js · Express · Redis · PostgreSQL</span>
                        </div>
                    </footer>
                </AuthProvider>
            </body>
        </html>
    );
}
