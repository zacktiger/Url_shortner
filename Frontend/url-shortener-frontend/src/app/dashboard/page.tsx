"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import UrlShortenerForm from '@/components/UrlShortenerForm';
import UrlCard from '@/components/UrlCard';
import { Link2, MousePointerClick, Loader2, RefreshCw, Search } from 'lucide-react';

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
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                <p className="text-zinc-500 text-sm">Loading dashboard…</p>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="flex-1 px-4 py-10 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
                        <p className="text-sm text-zinc-400 mt-1">Manage your links and track their performance</p>
                    </div>
                    <button
                        onClick={loadDashboardData}
                        disabled={loading}
                        className="btn-secondary px-3.5 py-2 text-xs"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                    </button>
                </div>

                {/* Stat tiles */}
                {stats && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="card p-5 flex items-center gap-4">
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400">
                                <Link2 className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="section-label">Active links</span>
                                <p className="text-2xl font-bold text-white font-mono mt-0.5">{stats.totalUrls}</p>
                            </div>
                        </div>

                        <div className="card p-5 flex items-center gap-4">
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400">
                                <MousePointerClick className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="section-label">Total clicks</span>
                                <p className="text-2xl font-bold text-white font-mono mt-0.5">{stats.totalClicks}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* New link form */}
                <div className="card p-5 sm:p-6">
                    <h3 className="section-label mb-4">Shorten a new URL</h3>
                    <UrlShortenerForm onSuccess={handleNewUrl} />
                </div>

                {/* Links list */}
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <h3 className="text-base font-semibold text-white">Your links</h3>

                        {stats && stats.urls.length > 0 && (
                            <div className="relative w-full sm:w-72">
                                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Search by code or destination…"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="input-field pl-9 pr-4 py-2 text-sm"
                                />
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="p-3.5 text-sm text-rose-400 bg-rose-500/[0.08] border border-rose-500/20 rounded-lg">
                            {error}
                        </div>
                    )}

                    {!loading && stats?.urls.length === 0 && (
                        <div className="card p-12 text-center">
                            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/[0.04] text-zinc-500 mx-auto mb-4">
                                <Link2 className="w-6 h-6" />
                            </div>
                            <h4 className="text-sm font-semibold text-zinc-300">No links yet</h4>
                            <p className="text-sm text-zinc-500 mt-1">Shorten your first link above to start tracking clicks.</p>
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
                                    <div className="card p-10 text-center">
                                        <p className="text-zinc-400 text-sm">No links matching &quot;{searchQuery}&quot; found.</p>
                                    </div>
                                );
                            }

                            return (
                                <div className="space-y-3">
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
