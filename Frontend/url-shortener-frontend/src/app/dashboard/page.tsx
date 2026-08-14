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

/*
 * The signed-in home: every link you own, plus the totals across them.
 *
 * One request feeds the whole page. GET /analytics/dashboard returns the
 * totals, the links, and each link's 30-day series together, so the list can
 * render counts and sparklines without an extra call per row (an N+1 problem
 * that would get slower with every link added).
 *
 * Note this is a Client Component, so the data is fetched in the browser after
 * the shell paints — that's the trade-off for keeping the JWT in localStorage,
 * which a server render can't read.
 */
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

    /*
     * Route guard. Waiting on authLoading is the important part: on a fresh
     * page load `user` is briefly null while the token is being verified, so
     * redirecting immediately would bounce a legitimately signed-in user off
     * their own dashboard on every refresh.
     *
     * This is a UX guard, not security — the data is protected by the API,
     * which rejects the request without a valid JWT no matter what the UI does.
     */
    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.replace('/');
            } else {
                loadDashboardData();
            }
        }
    }, [user, authLoading, router]);

    // After a create we refetch rather than splicing the new link in: the
    // response doesn't carry the derived fields the list needs (series,
    // recomputed totals), so a round trip is the simpler correct option.
    const handleNewUrl = (newRecord: any) => {
        loadDashboardData();
    };

    /*
     * Delete goes the other way — the row is removed from local state instead
     * of refetching, so the list updates instantly. The card only calls this
     * after the API confirms the delete, and the totals are adjusted by hand to
     * match: subtract one link and that link's clicks, so the header figures
     * stay consistent with the list without a second request.
     */
    const handleDelete = (shortCode: string) => {
        if (stats) {
            const deletedUrl = stats.urls.find(u => u.shortCode === shortCode);
            const clicksToDeduct = deletedUrl ? deletedUrl.clicks : 0;
            setStats({
                totalUrls: stats.totalUrls - 1,
                // Clamped at 0 so a stale count can never render a negative total.
                totalClicks: Math.max(0, stats.totalClicks - clicksToDeduct),
                urls: stats.urls.filter(url => url.shortCode !== shortCode)
            });
        }
    };

    // Spinner only while there's nothing to show. `!stats` is what keeps a
    // manual Refresh from blanking the page you're already looking at — the
    // existing list stays put and only the button spins.
    if (authLoading || (user && loading && !stats)) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-accent-bright animate-spin" />
                <p className="text-stone-500 text-sm">Loading dashboard…</p>
            </div>
        );
    }

    // The effect above is already redirecting; render nothing for the frame or
    // two before it lands, rather than flashing an empty dashboard.
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
                            // Filtering happens in the browser over the list we
                            // already hold — no request per keystroke. Fine at
                            // personal scale; a user with thousands of links
                            // would want server-side search and pagination.
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
                                            // Keyed by database id, not array
                                            // index, so React keeps each row's
                                            // own state (open QR panel, "Copied"
                                            // flag) attached to the right link
                                            // when the list is filtered.
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
