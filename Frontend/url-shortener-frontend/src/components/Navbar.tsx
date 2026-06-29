"use client";

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Link2, LogOut, LayoutDashboard, LogIn, Sparkles } from 'lucide-react';

export default function Navbar() {
    const { user, logout } = useAuth();
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    const handleGoogleLogin = () => {
        window.location.href = `${API_URL}/auth/google`;
    };

    return (
        <nav className="sticky top-0 z-50 bg-[#070b19]/60 backdrop-blur-xl border-b border-white/[0.06] transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo Section */}
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_20px_rgba(99,102,241,0.3)] group-hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] group-hover:scale-105 transition-all duration-300">
                                <Link2 className="w-5 h-5 text-white" />
                                <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 blur-sm opacity-30 group-hover:opacity-60 transition duration-300 -z-10" />
                            </div>
                            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent group-hover:to-white transition-all duration-300">
                                SnapLink
                            </span>
                        </Link>
                    </div>

                    {/* Navigation Actions */}
                    <div className="flex items-center gap-6">
                        {user ? (
                            <>
                                <Link
                                    href="/dashboard"
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-350 hover:text-white rounded-xl hover:bg-white/[0.04] border border-transparent hover:border-white/[0.05] transition-all duration-200"
                                >
                                    <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                                    <span>Dashboard</span>
                                </Link>
                                
                                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 border border-white/[0.05]">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-xs text-slate-400 font-medium">
                                        <span className="text-slate-500">Hello, </span>{user.name}
                                    </span>
                                </div>

                                <button
                                    onClick={logout}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-450 hover:text-rose-400 rounded-xl hover:bg-rose-500/[0.06] border border-transparent hover:border-rose-500/10 transition-all duration-200"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Logout</span>
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleGoogleLogin}
                                className="glow-btn flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold text-sm rounded-xl shadow-[0_4px_20px_rgba(99,102,241,0.25)] hover:shadow-[0_4px_30px_rgba(168,85,247,0.4)] transition-all duration-300"
                            >
                                <LogIn className="w-4 h-4" />
                                <span>Sign In with Google</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
