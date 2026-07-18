"use client";

import React, { useEffect, useState, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, ArrowUpRight, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useCountUp } from '@/lib/useCountUp';

// Numeric tile values count up on load; text values render as-is.
function StatValue({ value }: { value: string | number }) {
    const animated = useCountUp(typeof value === 'number' ? value : 0);
    return <>{typeof value === 'number' ? animated : value}</>;
}

interface ClickLog {
    id: number;
    clickedAt: string;
    country: string | null;
    device: string | null;
    browser: string | null;
    referrer: string | null;
}

interface UrlStats {
    url: {
        id: number;
        shortCode: string;
        longUrl: string;
        clicks: number;
        createdAt: string;
    };
    stats: {
        countries: { country: string; count: number }[];
        devices: { device: string; count: number }[];
        browsers: { browser: string; count: number }[];
        referrers: { referrer: string; count: number }[];
        // One entry per day for the last 30 days (0-filled), oldest first
        clicksByDay: { date: string; count: number }[];
        recentClicks: ClickLog[];
    };
}

// Turn an ISO date like '2026-07-18' into a compact 'Jul 18' axis label
function formatDayLabel(date: string) {
    return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
}

interface StatsPageProps {
    params: Promise<{ shortCode: string }>;
}

export default function UrlStatsPage({ params }: StatsPageProps) {
    const { shortCode } = use(params);
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [data, setData] = useState<UrlStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const executeFetch = async () => {
            try {
                const res = await fetchApi(`/analytics/${shortCode}`);
                if (res.success) {
                    setData(res);
                } else {
                    setError(res.message || 'Failed to fetch analytics.');
                }
            } catch (err: any) {
                setError(err.message || 'Access denied or server error.');
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading) {
            executeFetch();
        }
    }, [shortCode, authLoading]);

    if (authLoading || loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-accent-bright animate-spin" />
                <p className="text-stone-500 text-sm">Loading link analytics…</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
                <div className="card p-8 max-w-md w-full text-center space-y-5">
                    <p className="text-rose-400 text-sm font-medium">{error || 'An unexpected error occurred.'}</p>
                    <button
                        onClick={() => router.push(user ? '/dashboard' : '/')}
                        className="btn-secondary px-4 py-2 text-xs"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Go back</span>
                    </button>
                </div>
            </div>
        );
    }

    const { url, stats } = data;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const shortUrl = `${API_URL}/${url.shortCode}`;

    // Reusable stat tile config: label + value (clicks animate via count-up)
    const statTiles: { label: string; value: string | number }[] = [
        { label: 'Total clicks', value: url.clicks },
        { label: 'Top country', value: stats.countries[0]?.country || 'None' },
        { label: 'Top device', value: stats.devices[0]?.device || 'None' },
        { label: 'Top browser', value: stats.browsers[0]?.browser || 'None' },
    ];

    // Breakdown lists all share one visual language: a single accent bar whose
    // width encodes share-of-clicks; the row label carries identity.
    const renderBreakdown = (items: { label: string; count: number }[], total: number) => {
        if (items.length === 0) {
            return <p className="text-xs text-stone-500 py-6 text-center">No clicks logged yet</p>;
        }
        return (
            <div className="space-y-3.5">
                {items.map((item, index) => {
                    const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
                    return (
                        <div key={index} className="space-y-1.5">
                            <div className="flex justify-between items-baseline text-xs">
                                <span className="font-medium text-stone-300">{item.label}</span>
                                <span className="text-stone-500 font-mono text-[11px]">{item.count} · {percentage}%</span>
                            </div>
                            <div className="w-full bg-white/[0.05] h-1.5 rounded-full overflow-hidden">
                                <div
                                    className="bg-accent-bright h-full rounded-full transition-all duration-500"
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const breakdownSections = [
        { title: 'Countries', items: stats.countries.map(c => ({ label: c.country, count: c.count })) },
        { title: 'Referrers', items: stats.referrers.map(r => ({ label: r.referrer, count: r.count })) },
        { title: 'Devices', items: stats.devices.map(d => ({ label: d.device, count: d.count })) },
        { title: 'Browsers', items: stats.browsers.map(b => ({ label: b.browser, count: b.count })) },
    ];

    return (
        <div className="flex-1 px-4 py-10 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto space-y-6 stagger">
                {/* Back navigation */}
                <button
                    onClick={() => router.push(user ? '/dashboard' : '/')}
                    className="inline-flex items-center gap-1.5 text-stone-500 hover:text-white transition-colors text-sm font-medium"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                </button>

                {/* Link header */}
                <div className="card p-5 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1.5 min-w-0">
                        <h1 className="font-mono text-lg sm:text-xl font-medium text-white break-all">
                            {shortUrl}
                        </h1>
                        <a
                            href={url.longUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-stone-400 hover:text-accent-bright transition-colors flex items-center gap-1"
                        >
                            <span className="truncate max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl">{url.longUrl}</span>
                            <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0" />
                        </a>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 text-stone-400 text-xs bg-white/[0.03] border border-white/[0.07] px-3 py-1.5 rounded-lg">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Created {new Date(url.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>

                {/* Stat tiles */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {statTiles.map(({ label, value }) => (
                        <div key={label} className="card p-5 min-w-0">
                            <span className="section-label">{label}</span>
                            <p className="text-2xl font-bold text-white font-mono tabular-nums truncate mt-1.5">
                                <StatValue value={value} />
                            </p>
                        </div>
                    ))}
                </div>

                {/* Clicks over time — 30-day trend from stats.clicksByDay */}
                <div className="card p-5 sm:p-6">
                    <h3 className="section-label mb-5">Clicks — last 30 days</h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={stats.clicksByDay} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                            {/* Cobalt fill that fades to transparent under the line */}
                            <defs>
                                <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#6b93ff" stopOpacity={0.35} />
                                    <stop offset="100%" stopColor="#6b93ff" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                            <XAxis
                                dataKey="date"
                                tickFormatter={formatDayLabel}
                                tick={{ fill: '#8a877f', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                                tickLine={false}
                                axisLine={false}
                                minTickGap={24}
                            />
                            <YAxis
                                allowDecimals={false}
                                tick={{ fill: '#8a877f', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                                tickLine={false}
                                axisLine={false}
                                width={28}
                            />
                            <Tooltip
                                cursor={{ stroke: 'rgba(107,147,255,0.3)' }}
                                contentStyle={{
                                    background: '#201f1e',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '10px',
                                    fontSize: '12px',
                                }}
                                labelStyle={{ color: '#a8a59e' }}
                                labelFormatter={(date) => formatDayLabel(date as string)}
                                formatter={(value) => [`${value} clicks`, '']}
                            />
                            <Area
                                type="monotone"
                                dataKey="count"
                                stroke="#6b93ff"
                                strokeWidth={2}
                                fill="url(#clicksGradient)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Breakdowns: countries / referrers / devices / browsers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {breakdownSections.map(({ title, items }) => (
                        <div key={title} className="card p-5 sm:p-6">
                            <h3 className="section-label mb-5">{title}</h3>
                            {renderBreakdown(items, url.clicks)}
                        </div>
                    ))}
                </div>

                {/* Recent click log */}
                <div className="card p-5 sm:p-6">
                    <h3 className="section-label mb-5">Recent clicks</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="text-stone-500 border-b border-white/[0.06]">
                                    <th className="py-3 px-3 font-medium">Time</th>
                                    <th className="py-3 px-3 font-medium">Country</th>
                                    <th className="py-3 px-3 font-medium">Device</th>
                                    <th className="py-3 px-3 font-medium">Browser</th>
                                    <th className="py-3 px-3 font-medium">Referrer</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04] text-stone-300">
                                {stats.recentClicks.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-stone-500">
                                            No clicks tracked yet
                                        </td>
                                    </tr>
                                ) : (
                                    stats.recentClicks.map((click) => (
                                        <tr key={click.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="py-3 px-3 font-mono text-stone-400 whitespace-nowrap">
                                                {new Date(click.clickedAt).toLocaleString()}
                                            </td>
                                            <td className="py-3 px-3 font-medium text-stone-200">{click.country || 'Unknown'}</td>
                                            <td className="py-3 px-3 text-stone-400">{click.device || 'Unknown'}</td>
                                            <td className="py-3 px-3 text-stone-400">{click.browser || 'Unknown'}</td>
                                            <td className="py-3 px-3 truncate max-w-xs text-stone-400" title={click.referrer || ''}>
                                                {click.referrer || 'Direct'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
