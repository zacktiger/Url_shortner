"use client";

import React, { useState } from 'react';
import { fetchApi } from '@/lib/api';
import { Loader2, ArrowRight, ChevronRight } from 'lucide-react';

/*
 * The create-a-link form — the write half of the app. Used in two places (the
 * landing page and the dashboard), which is why the parent decides what
 * happens after a successful create instead of this component navigating:
 * the landing page shows the new link inline, the dashboard refetches its list.
 *
 * It works signed in or out; the only difference is whether the resulting link
 * gets an owner.
 */
interface UrlShortenerFormProps {
    onSuccess: (urlRecord: any) => void;
}

export default function UrlShortenerForm({ onSuccess }: UrlShortenerFormProps) {
    const [longUrl, setLongUrl] = useState('');
    const [customAlias, setCustomAlias] = useState('');
    // '' means "never expires"; otherwise it's a number of days as a string.
    const [expiresInDays, setExpiresInDays] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!longUrl) {
            setError('Please enter a URL');
            return;
        }

        // Client-side validation is for fast feedback only — the backend
        // validates again, because anything can POST to the API directly.
        // Using the browser's own URL parser instead of a regex means
        // "google.com" (no scheme) is correctly rejected: the redirect needs
        // an absolute URL or it would resolve relative to our own domain.
        try {
            new URL(longUrl);
        } catch {
            setError('Please enter a valid absolute URL (e.g., https://google.com)');
            return;
        }

        // Turn the selected number of days into an absolute expiry timestamp.
        // Empty selection => undefined => the link never expires.
        // Sent as ISO/UTC so the stored instant doesn't depend on the user's
        // timezone; the API stores it and returns 410 Gone once it passes.
        let expiresAt: string | undefined;
        if (expiresInDays) {
            const days = parseInt(expiresInDays, 10);
            expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
        }

        // `loading` both disables the inputs and drives the spinner, which is
        // what stops a double-click creating two links.
        setLoading(true);
        try {
            // No user id in the body: the backend takes the owner from the JWT
            // that fetchApi attaches, so a client can't create links for
            // someone else — and when there's no token it creates the link
            // unowned rather than rejecting it. Optional fields are sent as
            // undefined, which JSON.stringify drops from the payload entirely.
            const result = await fetchApi('/url', {
                method: 'POST',
                body: JSON.stringify({
                    longUrl,
                    customAlias: customAlias ? customAlias.trim() : undefined,
                    expiresAt,
                }),
            });

            if (result.success) {
                onSuccess(result);
                // Clear the form so the next link starts from a clean slate —
                // in particular the alias, which can only be used once.
                setLongUrl('');
                setCustomAlias('');
                setExpiresInDays('');
            } else {
                setError(result.message || 'Failed to shorten URL');
            }
        } catch (err: any) {
            // fetchApi throws on any non-2xx, so this catches the real cases:
            // a taken alias, the 20-per-hour rate limit, an expired session.
            setError(err.message || 'An error occurred. Please try again.');
        } finally {
            // `finally` so the form unlocks on failure too, not just success.
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full space-y-3">
            <div className="flex flex-col md:flex-row gap-2.5">
                <input
                    type="text"
                    placeholder="Paste a long link, e.g. https://example.com/very/long/path"
                    value={longUrl}
                    onChange={(e) => setLongUrl(e.target.value)}
                    className="input-field flex-1 px-4 py-3 text-sm"
                    disabled={loading}
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary shrink-0 px-6 py-3 text-sm"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Shortening…</span>
                        </>
                    ) : (
                        <>
                            <span>Shorten</span>
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </div>

            {/* Toggle for the custom-alias field */}
            <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-accent-bright transition-colors"
            >
                <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${showAdvanced ? 'rotate-90' : ''}`} />
                <span>Custom alias &amp; expiry</span>
            </button>

            {showAdvanced && (
                <div className="p-4 bg-black/20 border border-white/[0.06] rounded-xl animate-slideUp space-y-4">
                    <div className="space-y-2.5">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-500 text-sm font-mono">
                                snaplink.click/
                            </div>
                            <input
                                type="text"
                                placeholder="my-custom-slug"
                                value={customAlias}
                                // Strip anything that isn't URL-safe as the user
                                // types, so an illegal alias can't be submitted
                                // in the first place. A controlled input makes
                                // this possible: React re-renders with the
                                // cleaned value rather than the raw keystroke.
                                onChange={(e) => setCustomAlias(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                                className="input-field pl-[130px] pr-4 py-2.5 text-sm font-mono"
                                disabled={loading}
                            />
                        </div>
                        <p className="text-[11px] text-stone-500">
                            Letters, numbers, hyphens (-) and underscores (_). Minimum 3 characters.
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-[11px] font-medium text-stone-400">Link expiration</label>
                        <select
                            value={expiresInDays}
                            onChange={(e) => setExpiresInDays(e.target.value)}
                            className="input-field w-full px-4 py-2.5 text-sm"
                            disabled={loading}
                        >
                            <option value="">Never expires</option>
                            <option value="1">Expires in 1 day</option>
                            <option value="7">Expires in 7 days</option>
                            <option value="30">Expires in 30 days</option>
                        </select>
                    </div>
                </div>
            )}

            {error && (
                <div className="p-3 text-sm text-rose-400 bg-rose-500/[0.08] border border-rose-500/20 rounded-lg">
                    {error}
                </div>
            )}
        </form>
    );
}
