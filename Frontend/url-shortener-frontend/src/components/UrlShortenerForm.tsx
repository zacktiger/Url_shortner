"use client";

import React, { useState } from 'react';
import { fetchApi } from '@/lib/api';
import { Loader2, ArrowRight, ChevronRight } from 'lucide-react';

interface UrlShortenerFormProps {
    onSuccess: (urlRecord: any) => void;
}

export default function UrlShortenerForm({ onSuccess }: UrlShortenerFormProps) {
    const [longUrl, setLongUrl] = useState('');
    const [customAlias, setCustomAlias] = useState('');
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

        // Quick client side validation
        try {
            new URL(longUrl);
        } catch {
            setError('Please enter a valid absolute URL (e.g., https://google.com)');
            return;
        }

        setLoading(true);
        try {
            const result = await fetchApi('/url', {
                method: 'POST',
                body: JSON.stringify({
                    longUrl,
                    customAlias: customAlias ? customAlias.trim() : undefined
                }),
            });

            if (result.success) {
                onSuccess(result);
                setLongUrl('');
                setCustomAlias('');
            } else {
                setError(result.message || 'Failed to shorten URL');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred. Please try again.');
        } finally {
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
                className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-indigo-400 transition-colors"
            >
                <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${showAdvanced ? 'rotate-90' : ''}`} />
                <span>Custom alias</span>
            </button>

            {showAdvanced && (
                <div className="p-4 bg-black/20 border border-white/[0.06] rounded-xl animate-slideUp space-y-2.5">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 text-sm font-mono">
                            snaplink.click/
                        </div>
                        <input
                            type="text"
                            placeholder="my-custom-slug"
                            value={customAlias}
                            onChange={(e) => setCustomAlias(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                            className="input-field pl-[130px] pr-4 py-2.5 text-sm font-mono"
                            disabled={loading}
                        />
                    </div>
                    <p className="text-[11px] text-zinc-500">
                        Letters, numbers, hyphens (-) and underscores (_). Minimum 3 characters.
                    </p>
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
