"use client";

import React, { useEffect, useState, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Link2, ArrowLeft, MousePointerClick, Globe, Monitor, Compass, Loader2, ArrowUpRight, Calendar, Sparkles } from 'lucide-react';

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
        recentClicks: ClickLog[];
    };
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
        const fetchStats = async () => {
            setLoading(true);
            setError(null);
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
                setData(null); // Clear loading state if error or set data
                setLoading(false);
            }
        };

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
            <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-[#030712]">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                <p className="text-slate-400 text-sm font-medium">Loading link analytics...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-[#030712] px-4">
                <div className="bg-slate-900 border border-white/[0.06] rounded-3xl p-8 max-w-md w-full text-center space-y-6">
                    <p className="text-red-400 font-semibold">{error || 'An unexpected error occurred.'}</p>
                    <button
                        onClick={() => router.push(user ? '/dashboard' : '/')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Go Back</span>
                    </button>
                </div>
            </div>
        );
    }

    const { url, stats } = data;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const shortUrl = `${API_URL}/url/${url.shortCode}`;

    // Helper to get progress bar gradient colors dynamically
    const getProgressBarColor = (label: string, type: 'country' | 'referrer' | 'device' | 'browser') => {
        const lower = label.toLowerCase();
        if (type === 'device') {
            if (lower.includes('mobile')) return 'from-pink-500 to-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]';
            if (lower.includes('desktop')) return 'from-blue-500 to-cyan-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]';
            if (lower.includes('tablet')) return 'from-purple-500 to-violet-500 shadow-[0_0_8px_rgba(168,85,247,0.3)]';
            return 'from-slate-500 to-slate-650';
        }
        if (type === 'browser') {
            if (lower.includes('chrome')) return 'from-amber-400 to-orange-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]';
            if (lower.includes('firefox')) return 'from-orange-500 to-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]';
            if (lower.includes('safari')) return 'from-sky-400 to-indigo-500 shadow-[0_0_8px_rgba(56,189,248,0.3)]';
            if (lower.includes('edge')) return 'from-cyan-400 to-blue-500 shadow-[0_0_8px_rgba(34,211,238,0.3)]';
            return 'from-slate-500 to-slate-655';
        }
        if (type === 'referrer') {
            if (lower.includes('direct')) return 'from-slate-600 to-slate-700';
            if (lower.includes('google')) return 'from-emerald-400 to-teal-500 shadow-[0_0_8px_rgba(52,211,153,0.3)]';
            if (lower.includes('twitter') || lower.includes('x.com') || lower.includes('t.co')) return 'from-sky-400 to-blue-500 shadow-[0_0_8px_rgba(56,189,248,0.3)]';
            if (lower.includes('facebook') || lower.includes('fb')) return 'from-blue-600 to-indigo-600 shadow-[0_0_8px_rgba(37,99,235,0.3)]';
            return 'from-violet-500 to-purple-650';
        }
        // Default Country or fallback
        if (label === 'Unknown' || label === 'None') return 'from-slate-500 to-slate-600';
        return 'from-indigo-500 to-violet-500 shadow-[0_0_8px_rgba(99,102,241,0.3)]';
    };

    // Helper to render visual progress bars
    const renderProgressBarList = (
        items: { label: string; count: number }[],
        total: number,
        type: 'country' | 'referrer' | 'device' | 'browser'
    ) => {
        if (items.length === 0) {
            return <p className="text-xs text-slate-500 italic py-6 text-center">No telemetry logged yet</p>;
        }
        return (
            <div className="space-y-4">
                {items.map((item, index) => {
                    const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
                    const colorClass = getProgressBarColor(item.label, type);
                    return (
                        <div key={index} className="space-y-2">
                            <div className="flex justify-between text-xs font-semibold">
                                <span className="text-slate-350">{item.label}</span>
                                <span className="text-slate-500 font-mono text-[10px]">{item.count} clicks ({percentage}%)</span>
                            </div>
                            <div className="w-full bg-[#050814]/75 h-2 rounded-full overflow-hidden border border-white/[0.05]">
                                <div
                                    className={`bg-gradient-to-r ${colorClass} h-full rounded-full transition-all duration-500`}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="flex-1 bg-[#030712] px-4 py-12 sm:px-6 lg:px-8 grid-bg">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Navigation Back */}
                <button
                    onClick={() => router.push(user ? '/dashboard' : '/')}
                    className="inline-flex items-center gap-2 text-slate-450 hover:text-white transition duration-200 text-xs font-bold uppercase tracking-wider"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Workspace</span>
                </button>

                {/* URL Title Information */}
                <div className="bg-slate-900/40 border border-white/[0.06] backdrop-blur-xl rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl">
                    <div className="space-y-2 min-w-0">
                        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Link Performance Analytics</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-white break-all flex items-center gap-2 leading-none tracking-tight">
                            {shortUrl}
                        </h1>
                        <a
                            href={url.longUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-slate-400 hover:text-indigo-400 transition flex items-center gap-1 mt-1 font-semibold"
                        >
                            <span className="truncate max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl">Redirects to: {url.longUrl}</span>
                            <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0" />
                        </a>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 text-slate-500 text-xs font-bold uppercase tracking-wider bg-white/[0.02] border border-white/[0.05] px-3.5 py-2 rounded-xl">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{new Date(url.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>

                {/* Aggregate Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="glass-card rounded-2xl p-6 flex items-center gap-4 border border-white/[0.04] bg-[#0c1020]/45">
                        <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 shadow-[inset_0_2px_4px_rgba(99,102,241,0.1)]">
                            <MousePointerClick className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Clicks</span>
                            <h3 className="text-xl font-extrabold text-white mt-0.5 tracking-tight">{url.clicks}</h3>
                        </div>
                    </div>

                    <div className="glass-card rounded-2xl p-6 flex items-center gap-4 border border-white/[0.04] bg-[#0c1020]/45">
                        <div className="p-3 bg-violet-500/10 rounded-xl text-violet-400 shadow-[inset_0_2px_4px_rgba(168,85,247,0.1)]">
                            <Globe className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Top Country</span>
                            <h3 className="text-xl font-extrabold text-white mt-0.5 tracking-tight">
                                {stats.countries[0]?.country || 'None'}
                            </h3>
                        </div>
                    </div>

                    <div className="glass-card rounded-2xl p-6 flex items-center gap-4 border border-white/[0.04] bg-[#0c1020]/45">
                        <div className="p-3 bg-pink-500/10 rounded-xl text-pink-400 shadow-[inset_0_2px_4px_rgba(236,72,153,0.1)]">
                            <Monitor className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Top Device</span>
                            <h3 className="text-xl font-extrabold text-white mt-0.5 tracking-tight">
                                {stats.devices[0]?.device || 'None'}
                            </h3>
                        </div>
                    </div>

                    <div className="glass-card rounded-2xl p-6 flex items-center gap-4 border border-white/[0.04] bg-[#0c1020]/45">
                        <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 shadow-[inset_0_2px_4px_rgba(16,185,129,0.1)]">
                            <Compass className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Top Browser</span>
                            <h3 className="text-xl font-extrabold text-white mt-0.5 tracking-tight">
                                {stats.browsers[0]?.browser || 'None'}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Demographics breakdowns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Country Distribution */}
                    <div className="glass-card rounded-2xl p-6 border border-white/[0.04] bg-[#0c1020]/25">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 border-b border-white/[0.05] pb-4 flex items-center gap-2">
                            <Globe className="w-4 h-4 text-indigo-400" />
                            <span>Geographic Distribution</span>
                        </h3>
                        {renderProgressBarList(
                            stats.countries.map(c => ({ label: c.country, count: c.count })),
                            url.clicks,
                            'country'
                        )}
                    </div>

                    {/* Referrers Distribution */}
                    <div className="glass-card rounded-2xl p-6 border border-white/[0.04] bg-[#0c1020]/25">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 border-b border-white/[0.05] pb-4 flex items-center gap-2">
                            <ArrowUpRight className="w-4 h-4 text-violet-400" />
                            <span>Referral Sources</span>
                        </h3>
                        {renderProgressBarList(
                            stats.referrers.map(r => ({ label: r.referrer, count: r.count })),
                            url.clicks,
                            'referrer'
                        )}
                    </div>

                    {/* Devices Distribution */}
                    <div className="glass-card rounded-2xl p-6 border border-white/[0.04] bg-[#0c1020]/25">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 border-b border-white/[0.05] pb-4 flex items-center gap-2">
                            <Monitor className="w-4 h-4 text-pink-400" />
                            <span>Device Categories</span>
                        </h3>
                        {renderProgressBarList(
                            stats.devices.map(d => ({ label: d.device, count: d.count })),
                            url.clicks,
                            'device'
                        )}
                    </div>

                    {/* Browsers Distribution */}
                    <div className="glass-card rounded-2xl p-6 border border-white/[0.04] bg-[#0c1020]/25">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 border-b border-white/[0.05] pb-4 flex items-center gap-2">
                            <Compass className="w-4 h-4 text-emerald-400" />
                            <span>Web Browsers</span>
                        </h3>
                        {renderProgressBarList(
                            stats.browsers.map(b => ({ label: b.browser, count: b.count })),
                            url.clicks,
                            'browser'
                        )}
                    </div>
                </div>

                {/* Raw logs */}
                <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/[0.04] bg-[#0c1020]/25">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 border-b border-white/[0.05] pb-4">Recent Click Stream</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="text-slate-500 border-b border-white/[0.05] font-bold uppercase tracking-wider text-[10px]">
                                    <th className="py-4 px-4">Time</th>
                                    <th className="py-4 px-4">Location</th>
                                    <th className="py-4 px-4">Device Class</th>
                                    <th className="py-4 px-4">Browser Name</th>
                                    <th className="py-4 px-4">Referrer URL</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03] text-slate-300 font-medium">
                                {stats.recentClicks.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                                            No clicks tracked yet
                                        </td>
                                    </tr>
                                ) : (
                                    stats.recentClicks.map((click) => (
                                        <tr key={click.id} className="hover:bg-white/[0.02] transition-colors duration-150">
                                            <td className="py-4 px-4 font-mono text-slate-450">
                                                {new Date(click.clickedAt).toLocaleString()}
                                            </td>
                                            <td className="py-4 px-4 font-bold text-slate-200">{click.country || 'Unknown'}</td>
                                            <td className="py-4 px-4 text-slate-400">{click.device || 'Unknown'}</td>
                                            <td className="py-4 px-4 text-slate-400">{click.browser || 'Unknown'}</td>
                                            <td className="py-4 px-4 truncate max-w-xs text-slate-450" title={click.referrer || ''}>
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
