"use client";

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Link2, LogOut, LayoutDashboard, LogIn } from 'lucide-react';

export default function Navbar() {
    const { user, logout } = useAuth();
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    const handleGoogleLogin = () => {
        window.location.href = `${API_URL}/auth/google`;
    };

    return (
        <nav className="sticky top-0 z-50 bg-canvas/80 backdrop-blur-md border-b border-white/[0.06]">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500 group-hover:bg-indigo-400 transition-colors">
                            <Link2 className="w-4.5 h-4.5 text-white" />
                        </div>
                        <span className="text-lg font-semibold tracking-tight text-white">
                            SnapLink
                        </span>
                    </Link>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        {user ? (
                            <>
                                <Link
                                    href="/dashboard"
                                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.05] transition-colors"
                                >
                                    <LayoutDashboard className="w-4 h-4" />
                                    <span>Dashboard</span>
                                </Link>

                                <span className="hidden sm:block px-3 py-2 text-sm text-zinc-500 truncate max-w-[160px]">
                                    {user.name}
                                </span>

                                <button
                                    onClick={logout}
                                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/[0.08] transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span className="hidden sm:inline">Logout</span>
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleGoogleLogin}
                                className="btn-primary px-4 py-2 text-sm"
                            >
                                <LogIn className="w-4 h-4" />
                                <span>Sign in with Google</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
