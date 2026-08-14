"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Copy, Check, ExternalLink, QrCode, BarChart3, Trash2 } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { sparkPath, SPARK_WIDTH, SPARK_HEIGHT } from '@/lib/spark';

/*
 * One shortened link, rendered two ways.
 *
 * This is where the frontend meets the two backend endpoints that aren't
 * fetched with JavaScript: the short link itself (a plain <a> that the browser
 * follows to the API, which does the Redis lookup and the 302) and the QR
 * image (a plain <img> pointing at the API's QR route).
 *
 * Fields are optional because the same component renders a record from
 * POST /url (fresh, no clicks yet) and one from the dashboard list.
 */
interface UrlRecord {
    id?: number;
    shortCode: string;
    longUrl: string;
    clicks?: number;
    expiresAt?: string | null;
    // Daily click counts for the last 30 days, oldest first. Dashboard only.
    series?: number[];
}

interface UrlCardProps {
    url: UrlRecord;
    onDelete?: (shortCode: string) => void;
    /**
     * 'card' stands alone (the freshly-created link on the home page).
     * 'row' sits flush inside the dashboard's list card, and gains the
     * performance column and sparkline.
     */
    variant?: 'card' | 'row';
    /** Share of the account's total clicks, 0-100. Row variant only. */
    sharePercent?: number;
}

// Short human date like "Jul 27, 2026" for the expiry badge.
function formatExpiry(expiresAt: string) {
    return new Date(expiresAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export default function UrlCard({ url, onDelete, variant = 'card', sharePercent = 0 }: UrlCardProps) {
    const [copied, setCopied] = useState(false);
    const [showQr, setShowQr] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Short links are built from the API origin, not the frontend's — the
    // redirect is handled by Express (GET /:shortCode), so pointing them at
    // Vercel would 404. This is the same value BASE_URL holds on the backend.
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const shortUrl = `${API_URL}/${url.shortCode}`;
    const qrCodeUrl = `${API_URL}/url/${url.shortCode}/qr`;

    const isRow = variant === 'row';

    // Whether this link has an expiry, and if so whether it's already passed.
    // Judged in the browser purely to pick a badge; the API is the real
    // authority and returns 410 Gone regardless of what this says.
    const hasExpiry = Boolean(url.expiresAt);
    const isExpired = hasExpiry && new Date(url.expiresAt as string).getTime() <= Date.now();

    const trend = isRow ? sparkPath(url.series) : null;

    // Clipboard write is async and can be refused (denied permission, or a
    // non-secure origin), hence the try/catch. The 2s timeout flips the button
    // back from "Copied" on its own — a tiny bit of state that acts as feedback.
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
        // Deleting cascades to the link's analytics rows, so it's irreversible.
        if (!confirm('Are you sure you want to delete this link? This will delete all click analytics associated with it.')) {
            return;
        }

        setDeleting(true);
        try {
            const res = await fetchApi(`/user/urls/${url.shortCode}`, {
                method: 'DELETE',
            });
            // Only tell the parent to drop the row once the server confirms, so
            // the list can't disappear a link that's actually still there. The
            // backend also re-checks ownership — this UI hides the button for
            // links you don't own, but hiding a button isn't a permission check.
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

    // The row variant is a flush strip inside the dashboard's list card; the
    // card variant carries its own surface and border.
    const shell = isRow
        ? 'px-4 sm:px-[18px] py-3.5 border-t border-white/[0.05] first:border-t-0 transition-colors hover:bg-white/[0.015]'
        : 'card card-hover p-4';

    return (
        <div className={shell}>
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                {/* Identity: short link, status badges, destination */}
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* A real anchor, not a router link: following it hands
                            the browser to the API, which looks the code up
                            (Redis first, Postgres on a miss), records the click,
                            and 302s to the destination. rel="noopener" stops
                            the opened page from touching window.opener. */}
                        <a
                            href={shortUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-sm sm:text-[14.5px] font-medium text-accent-bright hover:text-white transition-colors flex items-center gap-1.5 break-all"
                        >
                            {shortUrl}
                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>

                        {/* In the row variant the click count lives in the
                            performance column instead, so it isn't repeated here. */}
                        {!isRow && typeof url.clicks === 'number' && (
                            <span className="inline-flex items-center px-[7px] py-0.5 rounded-md font-mono text-[11px] font-medium bg-emerald-500/10 text-emerald-400">
                                {url.clicks}
                            </span>
                        )}

                        {hasExpiry && (
                            isExpired ? (
                                <span className="inline-flex items-center px-[7px] py-0.5 rounded-md font-mono text-[10.5px] font-medium bg-rose-500/10 text-rose-400">
                                    Expired
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-[7px] py-0.5 rounded-md font-mono text-[10.5px] font-medium bg-amber-500/10 text-amber-400">
                                    Expires {formatExpiry(url.expiresAt as string)}
                                </span>
                            )
                        )}
                    </div>
                    <p className="text-[11.5px] text-stone-500 truncate max-w-sm md:max-w-md lg:max-w-[420px]" title={url.longUrl}>
                        {url.longUrl}
                    </p>
                </div>

                {/* Performance: how this link is doing relative to the account.
                    Hidden on small screens, where the row stacks. */}
                {isRow && (
                    <div className="hidden md:block flex-none w-[190px]">
                        <div className="flex items-baseline justify-between gap-2">
                            <span className="font-mono text-[13px] font-semibold text-emerald-400">
                                {url.clicks ?? 0}
                            </span>
                            <span className="font-mono text-[10.5px] text-faint">
                                {sharePercent}% of clicks
                            </span>
                        </div>
                        <div className="bar-track h-[3px] mt-1.5 bg-white/[0.05]">
                            <div
                                className="bg-emerald-400/75"
                                // Give any link with clicks a visible sliver, so "1 click"
                                // doesn't render as an empty track.
                                style={{ width: `${Math.max(sharePercent, (url.clicks ?? 0) > 0 ? 2 : 0)}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* 30-day shape. Widest breakpoint only — it's the first thing
                    worth dropping when space runs out. */}
                {isRow && trend && (
                    <svg
                        width={SPARK_WIDTH}
                        height={SPARK_HEIGHT}
                        viewBox={`0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}`}
                        className="hidden lg:block flex-none"
                        aria-hidden="true"
                    >
                        <path
                            d={trend}
                            fill="none"
                            stroke="#6b93ff"
                            strokeWidth={1.5}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                        />
                    </svg>
                )}

                {/* Actions: labelled copy, then the segmented icon group */}
                <div className="flex-none flex items-center gap-1.5">
                    <button
                        onClick={handleCopy}
                        className={
                            copied
                                ? 'inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium bg-emerald-500/10 border border-emerald-500/[0.28] text-emerald-400'
                                : 'btn-secondary h-8 px-3 text-xs'
                        }
                    >
                        {copied ? (
                            <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Copied</span>
                            </>
                        ) : (
                            <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                            </>
                        )}
                    </button>

                    <div className="icon-group">
                        <button
                            onClick={() => setShowQr(!showQr)}
                            className={showQr ? 'is-active' : undefined}
                            title="Show QR code"
                            aria-label="Show QR code"
                            aria-pressed={showQr}
                        >
                            <QrCode className="w-[15px] h-[15px]" />
                        </button>

                        <Link
                            href={`/stats/${url.shortCode}`}
                            title="View analytics"
                            aria-label="View analytics"
                        >
                            <BarChart3 className="w-[15px] h-[15px]" />
                        </Link>

                        {onDelete && (
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="danger"
                                title="Delete link"
                                aria-label="Delete link"
                            >
                                <Trash2 className="w-[15px] h-[15px]" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Collapsible QR code: white plate keeps the code scannable on the dark canvas */}
            {showQr && (
                <div className="mt-3.5 pt-3.5 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center gap-4 animate-fadeIn">
                    <div className="flex-none p-2.5 bg-white rounded-[10px] self-start">
                        {/* A plain <img>, not next/image: the QR is generated
                            per short code by the API, so there's nothing for
                            Next's optimizer to pre-process. It's also why the
                            QR route is public — an <img> can't send the
                            Authorization header, and the code only encodes the
                            already-public short link. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={qrCodeUrl}
                            alt={`QR code for ${shortUrl}`}
                            width={150}
                            height={150}
                            className="block"
                        />
                    </div>
                    <div>
                        <p className="text-[13px] font-medium text-stone-200">Scan to open the short link</p>
                        <p className="text-xs leading-relaxed text-stone-500 mt-1.5 max-w-[280px]">
                            Served by the API at{' '}
                            <span className="font-mono text-[11.5px] text-stone-400">
                                /url/{url.shortCode}/qr
                            </span>
                            . The white plate keeps the code scannable on the dark canvas.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
