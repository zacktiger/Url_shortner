"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import UrlShortenerForm from '@/components/UrlShortenerForm';
import UrlCard from '@/components/UrlCard';
import { Link2, Loader2, RefreshCw, Search } from 'lucide-react';
import { useCountUp } from '@/lib/useCountUp';

// A summary figure folded into the page header. These used to be full-width
// tiles, which pushed the actual links below the fold.
function HeaderStat({ label, value }: { label: string; value: number }) {
    const animated = useCountUp(value);
    return (
        <div className="text-left sm:text-right">
            <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.1em] text-muted">
                {label}
            </span>
            <p className="text-[26px] leading-none font-bold text-white font-mono tabular-nums mt-1">
                {animated.toLocaleString()}
            </p>
        </div>
    );
}

interface UrlRecord {
    id: number;
    shortCode: string;
    longUrl: string;
    clicks: number;
    createdAt: string;
    expiresAt?: string | null;
    // Daily click counts for the last 30 days, oldest first — powers the sparkline.
    series?: number[];
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
                <Loader2 className="w-8 h-8 text-accent-bright animate-spin" />
                <p className="text-stone-500 text-sm">Loading dashboard…</p>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="flex-1 px-4 py-10 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto space-y-4 stagger">
                {/* Header — the two summary figures live here rather than in
                    tiles of their own, so the links start near the top. */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-hairline">
                    <div>
                        <h1 className="font-display text-[28px] font-bold text-white tracking-tight">Dashboard</h1>
                        <p className="text-[13px] text-stone-400 mt-1">Manage your links and track their performance</p>
                    </div>
                    <div className="flex items-end gap-5 sm:gap-6">
                        {stats && (
                            <>
                                <HeaderStat label="Active links" value={stats.totalUrls} />
                                <div className="hidden sm:block w-px h-[34px] bg-white/[0.08]" />
                                <HeaderStat label="Total clicks" value={stats.totalClicks} />
                            </>
                        )}
                        <button
                            onClick={loadDashboardData}
                            disabled={loading}
                            className="btn-secondary px-3 py-2 text-xs mb-0.5"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>

                {/* New link form */}
                <div className="card p-4 sm:p-5">
                    <h3 className="section-label mb-3">Shorten a new URL</h3>
                    <UrlShortenerForm onSuccess={handleNewUrl} />
                </div>

                {/* Links list */}
                <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="flex items-baseline gap-2.5">
                            <h3 className="text-[15px] font-semibold text-white">Your links</h3>
                            {stats && stats.urls.length > 0 && (
                                <span className="font-mono text-[11px] text-faint">
                                    {stats.urls.length} · newest first
                                </span>
                            )}
                        </div>

                        {stats && stats.urls.length > 0 && (
                            <div className="relative w-full sm:w-[280px]">
                                <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Search by code or destination…"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="input-field pl-9 pr-4 py-1.5 text-[13px]"
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
                        <div className="card p-8 sm:p-[34px] flex items-center gap-4">
                            <div className="flex-none flex items-center justify-center w-11 h-11 rounded-[11px] bg-white/[0.04] text-stone-500">
                                <Link2 className="w-[22px] h-[22px]" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-stone-200">No links yet</h4>
                                <p className="text-[13px] text-stone-500 mt-0.5">Shorten your first link above to start tracking clicks.</p>
                            </div>
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
                                        <p className="text-stone-400 text-sm">No links matching &quot;{searchQuery}&quot; found.</p>
                                    </div>
                                );
                            }

                            // One card holding hairline-separated rows, rather than
                            // a stack of separate cards.
                            return (
                                <div className="card overflow-hidden">
                                    {filtered.map((url) => (
                                        <UrlCard
                                            key={url.id}
                                            url={url}
                                            onDelete={handleDelete}
                                            variant="row"
                                            sharePercent={
                                                stats.totalClicks > 0
                                                    ? Math.round((url.clicks / stats.totalClicks) * 100)
                                                    : 0
                                            }
                                        />
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
