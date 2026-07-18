"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import UrlShortenerForm from '@/components/UrlShortenerForm';
import UrlCard from '@/components/UrlCard';
import { Zap, ShieldCheck, BarChart3, LogIn } from 'lucide-react';

export default function Home() {
    const { user } = useAuth();
    const [createdUrl, setCreatedUrl] = useState<any>(null);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    const handleGoogleLogin = () => {
        window.location.href = `${API_URL}/auth/google`;
    };

    return (
        <div className="flex-1 relative px-4 py-16 sm:py-24 sm:px-6 lg:px-8">
            {/* Single soft accent glow behind the hero — the page's only decoration */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[640px] h-[280px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-3xl mx-auto text-center relative space-y-10">
                {/* Hero */}
                <div className="space-y-5">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white">
                        Shorten links.
                        <br />
                        <span className="text-indigo-400">Track every click.</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-base sm:text-lg text-zinc-400 leading-relaxed">
                        Clean, collision-resistant short links with Redis-cached redirects
                        and detailed click analytics — devices, browsers, referrers and more.
                    </p>
                </div>

                {/* Shortener form */}
                <div className="card p-5 sm:p-6 text-left">
                    <UrlShortenerForm onSuccess={(record) => setCreatedUrl(record)} />

                    {createdUrl && (
                        <div className="mt-6 animate-slideUp">
                            <UrlCard url={createdUrl} />
                        </div>
                    )}
                </div>

                {/* Sign-in prompt for anonymous users */}
                {!user && (
                    <div className="card p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                        <div className="space-y-1">
                            <h4 className="text-sm font-semibold text-white">
                                Want analytics on your links?
                            </h4>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                                Sign in to save URLs, generate QR codes, and track browser,
                                device, and referrer statistics.
                            </p>
                        </div>
                        <button
                            onClick={handleGoogleLogin}
                            className="btn-secondary w-full sm:w-auto shrink-0 px-4 py-2.5 text-sm"
                        >
                            <LogIn className="w-4 h-4" />
                            <span>Sign in</span>
                        </button>
                    </div>
                )}

                {/* Feature highlights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-left">
                    <div className="card card-hover p-5">
                        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 mb-4">
                            <Zap className="w-4.5 h-4.5" />
                        </div>
                        <h3 className="text-sm font-semibold text-white">Redis-cached redirects</h3>
                        <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                            Cache-aside lookups serve hot links straight from memory,
                            keeping redirects fast and the database quiet.
                        </p>
                    </div>

                    <div className="card card-hover p-5">
                        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 mb-4">
                            <BarChart3 className="w-4.5 h-4.5" />
                        </div>
                        <h3 className="text-sm font-semibold text-white">Real-time analytics</h3>
                        <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                            Per-link breakdowns of countries, devices, browsers and
                            referrers, plus a 30-day click trend.
                        </p>
                    </div>

                    <div className="card card-hover p-5">
                        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 mb-4">
                            <ShieldCheck className="w-4.5 h-4.5" />
                        </div>
                        <h3 className="text-sm font-semibold text-white">Secure & scalable</h3>
                        <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                            IP rate-limiting, stateless JWT sessions via Google OAuth,
                            and Docker-ready deployment.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
