"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import UrlShortenerForm from '@/components/UrlShortenerForm';
import UrlCard from '@/components/UrlCard';
import { BarChart3, Link2, MousePointerClick, Loader2, RefreshCw, Search, Sparkles } from 'lucide-react';

interface UrlRecord {
    id: number;
    shortCode: string;
    longUrl: string;
    clicks: number;
    createdAt: string;
}

interface DashboardStats {
    totalUrls: number;
    totalClicks: number;
    urls: UrlRecord[];
}

export default function Dashboard() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const loadDashboardData = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchApi('/analytics/dashboard');
            if (data.success && data.dashboard) {
                setStats(data.dashboard);
            } else {
                setError('Failed to fetch dashboard statistics.');
            }
        } catch (err: any) {
            setError(err.message || 'Error loading dashboard. Please check backend connection.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.replace('/');
            } else {
                loadDashboardData();
            }
        }
    }, [user, authLoading, router]);

    const handleNewUrl = (newRecord: any) => {
        loadDashboardData();
    };

    const handleDelete = (shortCode: string) => {
        if (stats) {
            const deletedUrl = stats.urls.find(u => u.shortCode === shortCode);
            const clicksToDeduct = deletedUrl ? deletedUrl.clicks : 0;
            setStats({
                totalUrls: stats.totalUrls - 1,
                totalClicks: Math.max(0, stats.totalClicks - clicksToDeduct),
                urls: stats.urls.filter(url => url.shortCode !== shortCode)
            });
        }
    };

    if (authLoading || (user && loading && !stats)) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-[#030712]">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                <p className="text-slate-400 text-sm font-medium">Loading dashboard workspace...</p>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="flex-1 bg-[#030712] px-4 py-12 sm:px-6 lg:px-8 grid-bg">
            <div className="max-w-6xl mx-auto space-y-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/[0.06] pb-8">
                    <div>
                        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Workspace</span>
                        </div>
                        <h1 className="text-3xl font-extrabold text-white tracking-tight">Your Dashboard</h1>
                        <p className="text-sm text-slate-400 font-medium mt-1">Manage and monitor link redirections & stats</p>
                    </div>
                    <button
                        onClick={loadDashboardData}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-900/80 hover:bg-slate-800 border border-white/[0.06] hover:border-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all duration-200"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        <span>Refresh Workspace</span>
                    </button>
                </div>

                {/* Dashboard Metrics */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="glass-card rounded-2xl p-6 flex items-center gap-5 border border-white/[0.04] bg-[#0c1020]/45">
                            <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-400 shadow-[inset_0_2px_4px_rgba(99,102,241,0.1)]">
                                <Link2 className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Active Links</span>
                                <h2 className="text-3xl font-bold text-white mt-1 tracking-tight">{stats.totalUrls}</h2>
                            </div>
                        </div>

                        <div className="glass-card rounded-2xl p-6 flex items-center gap-5 border border-white/[0.04] bg-[#0c1020]/45">
                            <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-400 shadow-[inset_0_2px_4px_rgba(16,185,129,0.1)]">
                                <MousePointerClick className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Accumulated Clicks</span>
                                <h2 className="text-3xl font-bold text-white mt-1 tracking-tight">{stats.totalClicks}</h2>
                            </div>
                        </div>
                    </div>
                )}

                {/* Shortener Box */}
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/[0.06] rounded-3xl p-6 sm:p-8 shadow-xl">
                    <h3 className="text-sm font-bold text-white mb-5 uppercase tracking-wider text-slate-350">Shorten a new URL</h3>
                    <UrlShortenerForm onSuccess={handleNewUrl} />
                </div>

                {/* Links List */}
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h3 className="text-lg font-bold text-white">Your Shortened Links</h3>
                        
                        {/* Search Input */}
                        {stats && stats.urls.length > 0 && (
                            <div className="relative w-full sm:w-80">
                                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Search by code or destination URL..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-[#050814]/75 border border-white/[0.08] rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-sm text-white placeholder-slate-600 transition-all duration-300 outline-none"
                                />
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="p-4 bg-red-950/20 border border-red-900/30 text-red-400 text-sm rounded-xl">
                            {error}
                        </div>
                    )}

                    {!loading && stats?.urls.length === 0 && (
                        <div className="bg-slate-900/20 border border-white/[0.05] rounded-3xl p-16 text-center max-w-2xl mx-auto shadow-md">
                            <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl w-fit mx-auto mb-5 text-slate-500">
                                <Link2 className="w-8 h-8" />
                            </div>
                            <h4 className="text-base font-bold text-slate-300">No links generated yet</h4>
                            <p className="text-sm text-slate-500 mt-1 font-medium">Shorten your first link above to start tracking clicks!</p>
                        </div>
                    )}

                    {!loading && stats && stats.urls.length > 0 && (
                        (() => {
                            const filtered = stats.urls.filter(url => 
                                url.shortCode.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                url.longUrl.toLowerCase().includes(searchQuery.toLowerCase())
                            );

                            if (filtered.length === 0) {
                                return (
                                    <div className="bg-slate-900/20 border border-white/[0.05] rounded-2xl p-12 text-center">
                                        <p className="text-slate-400 text-sm font-semibold">No links matching &quot;{searchQuery}&quot; found.</p>
                                    </div>
                                );
                            }

                            return (
                                <div className="space-y-4">
                                    {filtered.map((url) => (
                                        <UrlCard key={url.id} url={url} onDelete={handleDelete} />
                                    ))}
                                </div>
                            );
                        })()
                    )}
                </div>
            </div>
        </div>
    );
}
