"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import UrlShortenerForm from '@/components/UrlShortenerForm';
import UrlCard from '@/components/UrlCard';
import SnapDemo from '@/components/SnapDemo';
import { Loader2, LogIn } from 'lucide-react';

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

export default function Home() {
    const { user, loading } = useAuth();
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

                {/* Shortener form — signed-in users only, since every link needs an owner */}
                <div className="mt-5">
                    {loading ? (
                        // Session check is in flight; don't flash the sign-in gate at a signed-in user.
                        <div className="card p-5 flex items-center gap-2.5 text-sm text-stone-500">
                            <Loader2 className="w-4 h-4 text-accent-bright animate-spin" />
                            <span>Checking your session…</span>
                        </div>
                    ) : user ? (
                        <div className="card p-5">
                            <UrlShortenerForm onSuccess={(record) => setCreatedUrl(record)} />

                            {createdUrl && (
                                <div className="mt-6 animate-slideUp">
                                    <UrlCard url={createdUrl} />
                                </div>
                            )}
                        </div>
                    ) : (
                        // Signed-out gate: the form needs an owner for the link, so we
                        // ask for the account up front rather than failing on submit.
                        <div className="card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div className="min-w-0">
                                <h2 className="text-[17px] font-semibold text-white">
                                    Sign in with Google to start shortening links.
                                </h2>
                                <p className="text-[13px] leading-relaxed text-stone-400 mt-2 max-w-md">
                                    Links are owned by your account — you get the QR code and every
                                    click&apos;s country, device, browser and referrer.
                                </p>
                            </div>
                            <button
                                onClick={handleGoogleLogin}
                                className="btn-primary shrink-0 px-5 py-3 text-sm self-start sm:self-auto"
                            >
                                <LogIn className="w-4 h-4" />
                                <span>Sign in with Google</span>
                            </button>
                        </div>
                    )}
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
