"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import UrlShortenerForm from '@/components/UrlShortenerForm';
import UrlCard from '@/components/UrlCard';
import SnapDemo from '@/components/SnapDemo';
import { ArrowRight } from 'lucide-react';

// Three true facts about the system, shown as a spec sheet instead of
// decorative feature cards. Copy matches the backend implementation.
const SPECS = [
    {
        label: 'Redirect',
        text: 'Redis cache-aside lookups serve hot links from memory, keeping the database quiet.',
    },
    {
        label: 'Short codes',
        text: '7-character random base62 IDs, collision-checked, with optional custom aliases.',
    },
    {
        label: 'Analytics',
        text: 'Country, device, browser and referrer per click, plus a 30-day trend for every link.',
    },
];

export default function Home() {
    const { user } = useAuth();
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

                <div className="mt-8 min-h-[3.5rem]">
                    <SnapDemo />
                </div>

                {/* Shortener form */}
                <div className="card p-5 sm:p-6 mt-8">
                    <UrlShortenerForm onSuccess={(record) => setCreatedUrl(record)} />

                    {createdUrl && (
                        <div className="mt-6 animate-slideUp">
                            <UrlCard url={createdUrl} />
                        </div>
                    )}
                </div>

                {/* Sign-in prompt as a sentence, not a card */}
                {!user && (
                    <p className="mt-5 text-sm text-stone-400">
                        <button
                            onClick={handleGoogleLogin}
                            className="group inline-flex items-center gap-1 text-accent-bright hover:text-white font-medium transition-colors"
                        >
                            Sign in with Google
                            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                        </button>
                        {' '}to keep your links, get QR codes, and see who clicked.
                    </p>
                )}

                {/* Spec sheet */}
                <div className="mt-16 pt-10 border-t border-white/[0.07] grid grid-cols-1 sm:grid-cols-3 gap-8">
                    {SPECS.map(({ label, text }) => (
                        <div key={label}>
                            <span className="section-label">{label}</span>
                            <p className="text-sm text-stone-400 leading-relaxed mt-2.5">{text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
