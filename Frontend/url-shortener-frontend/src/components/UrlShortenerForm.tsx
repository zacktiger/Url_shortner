"use client";

import React, { useState } from 'react';
import { fetchApi } from '@/lib/api';
import { Sparkles, Loader2, ArrowRight, Settings, Keyboard } from 'lucide-react';

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
        <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Paste your long link here (e.g., https://example.com/very/long/path)..."
                        value={longUrl}
                        onChange={(e) => setLongUrl(e.target.value)}
                        className="w-full px-5 py-4 bg-[#050814]/75 border border-white/[0.08] rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-white placeholder-slate-500 transition-all duration-300 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] font-medium text-sm"
                        disabled={loading}
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="glow-btn shrink-0 flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold text-sm rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(99,102,241,0.2)] hover:shadow-[0_4px_30px_rgba(168,85,247,0.3)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Shortening...</span>
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4 text-indigo-200" />
                            <span>Shorten Link</span>
                            <ArrowRight className="w-4 h-4 ml-1" />
                        </>
                    )}
                </button>
            </div>

            {/* Toggle Advanced Section */}
            <div className="flex justify-between items-center px-1">
                <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-450 hover:text-indigo-400 transition-colors"
                >
                    <Settings className={`w-3.5 h-3.5 transition-transform duration-300 ${showAdvanced ? 'rotate-90 text-indigo-400' : ''}`} />
                    <span>Advanced Options</span>
                </button>
            </div>

            {/* Advanced input fields */}
            {showAdvanced && (
                <div className="p-4 bg-[#050814]/40 border border-white/[0.05] rounded-2xl animate-slideUp space-y-3">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-455">
                        Custom Alias (Optional)
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 text-sm font-medium">
                            snaplink.click/
                        </div>
                        <input
                            type="text"
                            placeholder="my-custom-slug"
                            value={customAlias}
                            onChange={(e) => setCustomAlias(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                            className="w-full pl-[110px] pr-4 py-3 bg-[#050814]/75 border border-white/[0.08] rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-white placeholder-slate-600 transition-all duration-300 outline-none text-sm font-medium"
                            disabled={loading}
                        />
                    </div>
                    <p className="text-[10px] text-slate-500">
                        Use letters, numbers, hyphens (-), and underscores (_). Minimum 3 characters.
                    </p>
                </div>
            )}

            {error && (
                <div className="p-3.5 text-sm text-red-400 bg-red-950/20 border border-red-900/30 rounded-xl font-medium px-4">
                    {error}
                </div>
            )}
        </form>
    );
}
