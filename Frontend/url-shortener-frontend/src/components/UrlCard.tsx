"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Copy, Check, ExternalLink, QrCode, BarChart3, Trash2 } from 'lucide-react';
import { fetchApi } from '@/lib/api';

interface UrlRecord {
    id?: number;
    shortCode: string;
    longUrl: string;
    clicks?: number;
}

interface UrlCardProps {
    url: UrlRecord;
    onDelete?: (shortCode: string) => void;
}

export default function UrlCard({ url, onDelete }: UrlCardProps) {
    const [copied, setCopied] = useState(false);
    const [showQr, setShowQr] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const shortUrl = `${API_URL}/${url.shortCode}`;
    const qrCodeUrl = `${API_URL}/url/${url.shortCode}/qr`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shortUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this link? This will delete all click analytics associated with it.')) {
            return;
        }

        setDeleting(true);
        try {
            const res = await fetchApi(`/user/urls/${url.shortCode}`, {
                method: 'DELETE',
            });
            if (res.success && onDelete) {
                onDelete(url.shortCode);
            }
        } catch (err) {
            console.error('Failed to delete URL: ', err);
            alert('Failed to delete link. Only owners can delete their links.');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden group/card border border-white/[0.05]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                <div className="flex-1 min-w-0 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md">
                        /{url.shortCode}
                    </span>
                    <div className="flex items-center gap-3 flex-wrap">
                        <a
                            href={shortUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-lg font-bold text-white hover:text-indigo-400 transition-colors flex items-center gap-1.5 break-all group/link"
                        >
                            {shortUrl}
                            <ExternalLink className="w-4 h-4 flex-shrink-0 text-slate-500 group-hover/link:text-indigo-400 transition-colors" />
                        </a>
                        {typeof url.clicks === 'number' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                {url.clicks} {url.clicks === 1 ? 'click' : 'clicks'}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-450">
                        <span className="font-semibold text-slate-500 flex-shrink-0">Destination:</span>
                        <span className="truncate block max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl font-medium" title={url.longUrl}>
                            {url.longUrl}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <button
                        onClick={handleCopy}
                        className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-white/[0.05] hover:border-white/10 text-white font-semibold text-xs rounded-xl transition duration-200"
                    >
                        {copied ? (
                            <>
                                <Check className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                                <span className="text-emerald-400">Copied</span>
                            </>
                        ) : (
                            <>
                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                                <span>Copy Link</span>
                            </>
                        )}
                    </button>

                    <button
                        onClick={() => setShowQr(!showQr)}
                        className={`flex items-center justify-center p-2.5 rounded-xl border transition-all duration-200 ${
                            showQr
                                ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-400'
                                : 'bg-slate-900 border-white/[0.05] hover:bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                        title="Show QR Code"
                    >
                        <QrCode className="w-4 h-4" />
                    </button>

                    <Link
                        href={`/stats/${url.shortCode}`}
                        className="flex items-center justify-center p-2.5 bg-slate-900 border border-white/[0.05] hover:border-white/10 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition duration-200"
                        title="View Analytics"
                    >
                        <BarChart3 className="w-4 h-4" />
                    </Link>

                    {onDelete && (
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="flex items-center justify-center p-2.5 bg-slate-900/60 border border-white/[0.05] hover:bg-rose-500/10 hover:border-rose-500/20 text-slate-450 hover:text-rose-400 rounded-xl transition duration-200"
                            title="Delete Link"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Collapsible QR Code Area */}
            {showQr && (
                <div className="mt-6 pt-6 border-t border-white/[0.05] flex flex-col items-center justify-center animate-fadeIn relative z-10">
                    <div className="p-4 bg-white rounded-2xl shadow-inner mb-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={qrCodeUrl}
                          alt="QR Code"
                          width={150}
                          height={150}
                          className="block"
                        />
                    </div>
                    <span className="text-xs text-slate-450 font-medium">Scan QR code to access shortened URL</span>
                </div>
            )}
        </div>
    );
}
