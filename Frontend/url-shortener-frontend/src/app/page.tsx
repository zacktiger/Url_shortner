"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import UrlShortenerForm from '@/components/UrlShortenerForm';
import UrlCard from '@/components/UrlCard';
import SnapDemo from '@/components/SnapDemo';
import { LogIn } from 'lucide-react';

// Three true facts about the system, shown as a numbered spec sheet instead of
// decorative feature cards. Copy matches the backend implementation.
const SPECS = [
    {
        num: '01',
        label: 'Redirect',
        text: 'Redis cache-aside lookups serve hot links from memory, keeping the database quiet.',
    },
    {
        num: '02',
        label: 'Short codes',
        text: '7-character random base62 IDs, collision-checked, with optional custom aliases.',
    },
    {
        num: '03',
        label: 'Analytics',
        text: 'Country, device, browser and referrer per click, plus a 30-day trend for every link.',
    },
];

/*
 * Landing page, and the shortest path through the app: paste a link, get a
 * short one back — without signing in and without leaving this page.
 *
 * The form is open to everyone. Signing in is an upsell shown underneath it,
 * not a gate: an account adds ownership (a dashboard, deletion, stats kept
 * private), while an anonymous link belongs to whoever holds the code. Holding
 * the freshly created link in local state rather than redirecting is
 * deliberate — the user sees the result, the QR toggle and the copy button
 * immediately.
 */
export default function Home() {
    const { user, loading } = useAuth();
    // Only the most recent create — the dashboard is where the full list lives.
    const [createdUrl, setCreatedUrl] = useState<any>(null);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    const handleGoogleLogin = () => {
        window.location.href = `${API_URL}/auth/google`;
    };

    return (
        <div className="flex-1 px-4 py-16 sm:py-24 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto stagger">
                {/* Hero */}
                <span className="section-label">URL shortener · click analytics</span>

                <h1 className="font-display text-[2.6rem] leading-[1.05] sm:text-6xl font-bold tracking-tight text-white mt-4 text-balance">
                    Cut long links <span className="text-accent-bright">down to size.</span>
                </h1>

                {/* Reserve the height so the hero doesn't jump when the short
                    link lands on the second line. */}
                <div className="mt-8 min-h-[3.5rem]">
                    <SnapDemo />
                </div>

                {/* Shortener form — open to everyone, signed in or not */}
                <div className="mt-5">
                    <div className="card p-5">
                        <UrlShortenerForm onSuccess={(record) => setCreatedUrl(record)} />

                        {/* Sign-in prompt, not a gate. Held back while the session
                            check is in flight so it never flashes at a signed-in
                            user on a hard refresh. */}
                        {!loading && !user && (
                            <div className="mt-4 pt-4 border-t border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <p className="text-[13px] leading-relaxed text-stone-400 max-w-md">
                                    Shortening works without an account. Sign in to keep your links in
                                    a dashboard, delete them, and keep their click stats to yourself.
                                </p>
                                <button
                                    onClick={handleGoogleLogin}
                                    className="btn-secondary shrink-0 px-4 py-2.5 text-[13px] self-start sm:self-auto"
                                >
                                    <LogIn className="w-4 h-4" />
                                    <span>Sign in with Google</span>
                                </button>
                            </div>
                        )}

                        {createdUrl && (
                            <div className="mt-6 animate-slideUp">
                                <UrlCard url={createdUrl} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Spec sheet */}
                <div className="mt-16 pt-10 border-t border-hairline grid grid-cols-1 sm:grid-cols-3 gap-8">
                    {SPECS.map(({ num, label, text }) => (
                        <div key={label}>
                            <div className="flex items-baseline gap-2">
                                <span className="font-mono text-[10.5px] font-medium text-accent">{num}</span>
                                <span className="section-label">{label}</span>
                            </div>
                            <p className="text-sm text-stone-400 leading-relaxed mt-2">{text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
