"use client";

import React, { useEffect, useState, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, ArrowUpRight, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceDot, ResponsiveContainer } from 'recharts';
import { useCountUp } from '@/lib/useCountUp';

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

// The headline figure counts up when the page loads.
function ClickCount({ value }: { value: number }) {
    const animated = useCountUp(value);
    return <>{animated.toLocaleString()}</>;
}

// The busiest day in the window, so the chart can mark it. Null when the link
// has no clicks at all — there is no peak worth pointing at on a flat line.
function findPeak(clicksByDay: { date: string; count: number }[]) {
    let peak: { date: string; count: number } | null = null;
    for (const day of clicksByDay) {
        if (day.count > 0 && (!peak || day.count > peak.count)) peak = day;
    }
    return peak;
}

// A ranked breakdown: the leader carries a thick bar and a larger label, the
// rest share a thin one. Equal-weight bars were why this page read as flat.
function Breakdown({
    title,
    items,
    total,
}: {
    title: string;
    items: { label: string; count: number }[];
    total: number;
}) {
    const share = (count: number) => (total > 0 ? Math.round((count / total) * 100) : 0);
    const [leader, ...tail] = items;

    return (
        <div className="card p-4 sm:p-[18px]">
            <div className="flex items-baseline justify-between mb-3">
                <h3 className="section-label">{title}</h3>
                <span className="font-mono text-[10.5px] text-faint">{items.length} logged</span>
            </div>

            {items.length === 0 ? (
                <p className="text-xs text-stone-500 py-6 text-center">No clicks logged yet</p>
            ) : (
                <>
                    {/* Leader */}
                    <div className="flex flex-col gap-1.5 pb-3 border-b border-white/[0.05]">
                        <div className="flex items-baseline justify-between gap-3">
                            <span className="text-[15px] font-semibold text-white truncate">{leader.label}</span>
                            <span className="flex-none font-mono text-xs font-medium text-accent-bright">
                                {leader.count} · {share(leader.count)}%
                            </span>
                        </div>
                        <div className="bar-track bar-lead">
                            <div style={{ width: `${share(leader.count)}%` }} />
                        </div>
                    </div>

                    {/* Tail */}
                    {tail.length > 0 && (
                        <div className="flex flex-col gap-2.5 mt-3">
                            {tail.map((item) => (
                                <div key={item.label} className="flex flex-col gap-1">
                                    <div className="flex items-baseline justify-between gap-3 text-xs">
                                        <span className="text-stone-400 truncate">{item.label}</span>
                                        <span className="flex-none font-mono text-[11px] text-stone-500">
                                            {item.count} · {share(item.count)}%
                                        </span>
                                    </div>
                                    <div className="bar-track bar-tail">
                                        <div style={{ width: `${share(item.count)}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// Dynamic route: the folder name [shortCode] makes this one page serve
// /stats/aB3x9K1, /stats/my-alias and so on, with the segment handed in as a
// param. In current Next it arrives as a Promise rather than a plain object.
interface StatsPageProps {
    params: Promise<{ shortCode: string }>;
}

/*
 * Per-link analytics: the read-heavy page of the app.
 *
 * Everything on it comes from one call to GET /analytics/:code, which the
 * backend answers with SQL aggregates (grouped counts per country, device,
 * browser, referrer) plus a zero-filled 30-day series — grouping in the
 * database rather than shipping every click row to the browser and counting
 * here. Sign-in isn't required to reach the page: an anonymous link's stats are
 * open to whoever holds the code, and an owned link's are refused (403) to
 * everyone but its owner.
 */
export default function UrlStatsPage({ params }: StatsPageProps) {
    // React's use() unwraps the params Promise inside a Client Component.
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

        // Wait for the session check so a signed-in owner's request isn't sent
        // before AuthContext has finished validating the stored token.
        if (authLoading) return;

        // No sign-in gate: an anonymous link's stats are readable by anyone with
        // the code, and fetchApi attaches the JWT from localStorage when there is
        // one. A link owned by someone else comes back 403 and lands in the error
        // card below, which is the honest outcome to show.
        executeFetch();
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

    // The three secondary stats share one rail. Total clicks isn't among them —
    // it moved inside the chart card, where the trend explains it.
    const share = (count: number | undefined) =>
        url.clicks > 0 && count ? `${Math.round((count / url.clicks) * 100)}%` : null;

    const railStats = [
        { label: 'Top country', top: stats.countries[0]?.country, count: stats.countries[0]?.count },
        { label: 'Top device', top: stats.devices[0]?.device, count: stats.devices[0]?.count },
        { label: 'Top browser', top: stats.browsers[0]?.browser, count: stats.browsers[0]?.count },
    ];

    const breakdownSections = [
        { title: 'Countries', items: stats.countries.map(c => ({ label: c.country, count: c.count })) },
        { title: 'Referrers', items: stats.referrers.map(r => ({ label: r.referrer, count: r.count })) },
        { title: 'Devices', items: stats.devices.map(d => ({ label: d.device, count: d.count })) },
        { title: 'Browsers', items: stats.browsers.map(b => ({ label: b.browser, count: b.count })) },
    ];

    const peak = findPeak(stats.clicksByDay);

    return (
        <div className="flex-1 px-4 py-10 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto space-y-4 stagger">
                {/* Link header — a hairline instead of a card, so the chart below
                    is the first boxed thing on the page. */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-3.5 border-b border-hairline">
                    <div className="min-w-0 flex flex-col gap-1.5">
                        <button
                            onClick={() => router.push(user ? '/dashboard' : '/')}
                            className="inline-flex items-center gap-1.5 self-start font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-stone-500 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-3 h-3" />
                            <span>Dashboard</span>
                        </button>
                        <h1 className="font-mono text-xl sm:text-[22px] leading-tight font-medium text-white break-all">
                            {API_URL}/<span className="text-accent-bright">{url.shortCode}</span>
                        </h1>
                        <a
                            href={url.longUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-stone-500 hover:text-accent-bright transition-colors flex items-center gap-1 max-w-[620px]"
                        >
                            <span className="truncate">{url.longUrl}</span>
                            <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0" />
                        </a>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 self-start md:self-auto font-mono text-[11px] text-stone-400 bg-white/[0.03] border border-hairline px-2.5 py-1.5 rounded-md">
                        <Calendar className="w-3 h-3" />
                        <span>
                            Created{' '}
                            {new Date(url.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                            })}
                        </span>
                    </div>
                </div>

                {/* Clicks over time — the trend owns the top of the page, with the
                    all-time total living inside it rather than in a tile of its own. */}
                <div className="card p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-6 mb-1.5">
                        <div>
                            <span className="section-label">Total clicks</span>
                            <div className="flex items-baseline gap-2.5 flex-wrap mt-0.5">
                                <span className="font-mono text-[40px] sm:text-[44px] leading-none font-bold tabular-nums text-white">
                                    <ClickCount value={url.clicks} />
                                </span>
                                <span className="font-mono text-[11px] text-stone-500">
                                    all time · 30-day trend below
                                </span>
                            </div>
                        </div>
                        <span className="flex-none font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-accent-bright bg-accent/[0.12] border border-accent/30 px-2.5 py-1 rounded-md">
                            Last 30 days
                        </span>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        {/* left margin stays at 0: a negative one clips two-digit y labels */}
                        <AreaChart data={stats.clicksByDay} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
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
                                width={34}
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
                            {/* Mark the busiest day, so the shape has an anchor */}
                            {peak && (
                                <ReferenceDot
                                    x={peak.date}
                                    y={peak.count}
                                    r={3.5}
                                    fill="#121110"
                                    stroke="#7fa3ff"
                                    strokeWidth={2}
                                />
                            )}
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Stat rail — the three secondary figures share one card, split
                    by hairlines, instead of taking a tile each. overflow-hidden
                    clips those hairlines to the card's rounded corners; without
                    it they run square into them. */}
                <div className="card grid grid-cols-1 sm:grid-cols-3 overflow-hidden">
                    {railStats.map(({ label, top, count }, index) => (
                        <div
                            key={label}
                            className={`px-5 py-3.5 min-w-0 ${
                                index > 0 ? 'border-t sm:border-t-0 sm:border-l border-hairline' : ''
                            }`}
                        >
                            <span className="section-label">{label}</span>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="font-mono text-xl font-semibold text-white truncate">
                                    {top || 'None'}
                                </span>
                                {share(count) && (
                                    <span className="font-mono text-[11px] text-accent-bright">{share(count)}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Breakdowns: countries / referrers / devices / browsers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {breakdownSections.map(({ title, items }) => (
                        <Breakdown key={title} title={title} items={items} total={url.clicks} />
                    ))}
                </div>

                {/* Recent click log */}
                {/* Padding is spelled out per side: a `sm:p-[18px]` shorthand would
                    re-apply 18px to the bottom too, undoing the tight edge the
                    table's own last-row border already gives us. */}
                <div className="card p-4 pb-1.5 sm:px-[18px] sm:pt-[18px]">
                    <div className="flex items-baseline justify-between mb-1.5">
                        <h3 className="section-label">Recent clicks</h3>
                        <span className="font-mono text-[10.5px] text-faint">last 10</span>
                    </div>
                    <div className="overflow-x-auto">
                        {/* min-w keeps the five columns readable on a phone: the
                            wrapper scrolls instead of crushing them. */}
                        <table className="table-dense w-full min-w-[38rem] text-xs border-collapse">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Country</th>
                                    <th>Device</th>
                                    <th>Browser</th>
                                    <th>Referrer</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recentClicks.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-7 text-center text-stone-500">
                                            No clicks tracked yet
                                        </td>
                                    </tr>
                                ) : (
                                    stats.recentClicks.map((click) => (
                                        <tr key={click.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="font-mono text-[11.5px] text-stone-500 whitespace-nowrap">
                                                {new Date(click.clickedAt).toLocaleString()}
                                            </td>
                                            <td className="font-mono text-[11.5px] font-medium text-stone-200">
                                                {click.country || 'Unknown'}
                                            </td>
                                            <td className="text-stone-400">{click.device || 'Unknown'}</td>
                                            <td className="text-stone-400">{click.browser || 'Unknown'}</td>
                                            {/* The clamp lives on an inner span, not the
                                                cell: a table-cell sizes to its content
                                                and treats max-width as a suggestion, so
                                                `truncate` on the <td> never fires and a
                                                long referrer drags the table off-card. */}
                                            <td className="font-mono text-[11.5px] text-stone-500">
                                                <span
                                                    className="block max-w-[220px] truncate"
                                                    title={click.referrer || ''}
                                                >
                                                    {click.referrer || 'Direct'}
                                                </span>
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
