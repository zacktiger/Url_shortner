"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import UrlShortenerForm from '@/components/UrlShortenerForm';
import UrlCard from '@/components/UrlCard';
import { Zap, ShieldCheck, BarChart3, LogIn, ArrowRight, Sparkles } from 'lucide-react';

export default function Home() {
    const { user } = useAuth();
    const [createdUrl, setCreatedUrl] = useState<any>(null);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    const handleGoogleLogin = () => {
        window.location.href = `${API_URL}/auth/google`;
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8 grid-bg">
            {/* Ambient Background Lights */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />
            <div className="absolute bottom-20 right-10 w-80 h-80 bg-violet-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />
            <div className="absolute top-1/3 left-10 w-72 h-72 bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />

            <div className="max-w-4xl w-full text-center relative z-10 space-y-12">
                {/* Hero Headers */}
                <div className="space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.4)] animate-fadeIn">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-[11px] text-slate-350 font-bold uppercase tracking-wider">
                            Enterprise URL Management Platform
                        </span>
                    </div>
                    
                    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-none">
                        Shorten Links. <br />
                        <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent glow-text">
                            Analyze Performance.
                        </span>
                    </h1>
                    
                    <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400 font-medium leading-relaxed">
                        Create clean, collision-resistant links instantly. Deliver sub-millisecond redirects using memory caching and visualize detailed user analytics.
                    </p>
                </div>

                {/* Main Shortener Form Card */}
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/[0.06] rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-w-3xl mx-auto">
                    <UrlShortenerForm onSuccess={(record) => setCreatedUrl(record)} />
                    
                    {createdUrl && (
                        <div className="mt-8 text-left animate-slideUp">
                            <UrlCard url={createdUrl} />
                        </div>
                    )}
                </div>

                {/* Call-to-action for Anonymous Users */}
                {!user && (
                    <div className="bg-white/[0.02] border border-white/[0.05] backdrop-blur-md rounded-2xl p-6 max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
                        <div className="text-left space-y-1">
                            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                                <BarChart3 className="w-4 h-4 text-indigo-400" />
                                Want to track analytics?
                            </h4>
                            <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                Sign in with Google to save URLs, generate custom QR codes, and track browser, device, and referrer statistics.
                            </p>
                        </div>
                        <button
                          onClick={handleGoogleLogin}
                          className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-1.5 px-5 py-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white font-semibold text-xs rounded-xl shadow-md transition-all duration-300 active:scale-[0.98]"
                        >
                            <LogIn className="w-3.5 h-3.5" />
                            <span>Sign In</span>
                            <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </button>
                    </div>
                )}

                {/* Features Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                    <div className="glass-card rounded-2xl p-6 text-left border border-white/[0.04] bg-[#0c1020]/45">
                        <div className="p-3.5 bg-indigo-500/10 w-fit rounded-xl text-indigo-400 mb-5 shadow-[inset_0_2px_4px_rgba(99,102,241,0.1)]">
                            <Zap className="w-5 h-5" />
                        </div>
                        <h3 className="text-base font-bold text-white">High-Speed Cache</h3>
                        <p className="text-xs text-slate-400 mt-2 font-medium leading-relaxed">
                            Uses Redis cache-aside redirection mapping to redirect users instantly while preventing database bottlenecks.
                        </p>
                    </div>

                    <div className="glass-card rounded-2xl p-6 text-left border border-white/[0.04] bg-[#0c1020]/45">
                        <div className="p-3.5 bg-violet-500/10 w-fit rounded-xl text-violet-400 mb-5 shadow-[inset_0_2px_4px_rgba(168,85,247,0.1)]">
                            <BarChart3 className="w-5 h-5" />
                        </div>
                        <h3 className="text-base font-bold text-white">Real-Time Stats</h3>
                        <p className="text-xs text-slate-400 mt-2 font-medium leading-relaxed">
                            Access deep analytics break-downs including client geolocations, devices, web browsers, and source referrers.
                        </p>
                    </div>

                    <div className="glass-card rounded-2xl p-6 text-left border border-white/[0.04] bg-[#0c1020]/45">
                        <div className="p-3.5 bg-emerald-500/10 w-fit rounded-xl text-emerald-400 mb-5 shadow-[inset_0_2px_4px_rgba(16,185,129,0.1)]">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <h3 className="text-base font-bold text-white">Secure and Scalable</h3>
                        <p className="text-xs text-slate-400 mt-2 font-medium leading-relaxed">
                            Features strict IP rate-limiting, stateless JWT-based Google OAuth, and is fully ready for Docker deployment.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
