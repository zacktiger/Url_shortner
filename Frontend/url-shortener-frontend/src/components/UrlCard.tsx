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
    expiresAt?: string | null;
}

interface UrlCardProps {
    url: UrlRecord;
    onDelete?: (shortCode: string) => void;
}

// Short human date like "Jul 27, 2026" for the expiry badge.
function formatExpiry(expiresAt: string) {
    return new Date(expiresAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export default function UrlCard({ url, onDelete }: UrlCardProps) {
    const [copied, setCopied] = useState(false);
    const [showQr, setShowQr] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const shortUrl = `${API_URL}/${url.shortCode}`;
    const qrCodeUrl = `${API_URL}/url/${url.shortCode}/qr`;

    // Whether this link has an expiry, and if so whether it's already passed.
    const hasExpiry = Boolean(url.expiresAt);
    const isExpired = hasExpiry && new Date(url.expiresAt as string).getTime() <= Date.now();

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

    // Small icon-only action button used for QR / stats / delete
    const iconBtn = "flex items-center justify-center w-9 h-9 rounded-lg border border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.07] transition-colors";

    return (
        <div className="card card-hover p-5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-3 flex-wrap">
                        <a
                            href={shortUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-sm sm:text-base font-medium text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1.5 break-all"
                        >
                            {shortUrl}
                            <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                        </a>
                        {typeof url.clicks === 'number' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400">
                                {url.clicks} {url.clicks === 1 ? 'click' : 'clicks'}
                            </span>
                        )}
                        {hasExpiry && (
                            isExpired ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-rose-500/10 text-rose-400">
                                    Expired
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-amber-500/10 text-amber-400">
                                    Expires {formatExpiry(url.expiresAt as string)}
                                </span>
                            )
                        )}
                    </div>
                    <p className="text-xs text-zinc-500 truncate max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl" title={url.longUrl}>
                        {url.longUrl}
                    </p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <button
                        onClick={handleCopy}
                        className="btn-secondary flex-1 md:flex-initial px-4 h-9 text-xs"
                    >
                        {copied ? (
                            <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                            </>
                        ) : (
                            <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                            </>
                        )}
                    </button>

                    <button
                        onClick={() => setShowQr(!showQr)}
                        className={showQr ? `${iconBtn} !border-indigo-500/40 !text-indigo-400 !bg-indigo-500/10` : iconBtn}
                        title="Show QR Code"
                    >
                        <QrCode className="w-4 h-4" />
                    </button>

                    <Link
                        href={`/stats/${url.shortCode}`}
                        className={iconBtn}
                        title="View Analytics"
                    >
                        <BarChart3 className="w-4 h-4" />
                    </Link>

                    {onDelete && (
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className={`${iconBtn} hover:!text-rose-400 hover:!bg-rose-500/10 hover:!border-rose-500/20`}
                            title="Delete Link"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Collapsible QR code */}
            {showQr && (
                <div className="mt-5 pt-5 border-t border-white/[0.06] flex flex-col items-center animate-fadeIn">
                    <div className="p-3 bg-white rounded-xl mb-2.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={qrCodeUrl}
                            alt="QR Code"
                            width={150}
                            height={150}
                            className="block"
                        />
                    </div>
                    <span className="text-xs text-zinc-500">Scan to open the short link</span>
                </div>
            )}
        </div>
    );
}
