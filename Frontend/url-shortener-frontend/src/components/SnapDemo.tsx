"use client";

import React, { useEffect, useRef, useState } from 'react';
import { CornerDownRight } from 'lucide-react';

/*
 * Ambient hero animation: a long URL types itself out, then "snaps" into a
 * short link. Pure setTimeout state machine, no libraries. When the user
 * prefers reduced motion we render the first example statically.
 */

const EXAMPLES = [
    {
        long: 'https://www.amazon.in/product/dp/B0C7QLNMZV?ref=share&tag=summer-sale&utm_source=whatsapp',
        short: 'snaplink.click/aB3x9K1',
    },
    {
        long: 'https://github.com/kshitij/url-shortener/blob/main/README.md#getting-started',
        short: 'snaplink.click/gh-repo',
    },
    {
        long: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgm/edit#gid=1837465',
        short: 'snaplink.click/roster',
    },
];

const TYPE_SPEED_MS = 18;      // per character while the long URL types out
const SNAP_DELAY_MS = 700;     // pause after typing before the snap
const SHORT_HOLD_MS = 2600;    // how long the finished pair stays on screen

type Phase = 'typing' | 'snapped';

export default function SnapDemo() {
    const [exampleIdx, setExampleIdx] = useState(0);
    const [charCount, setCharCount] = useState(0);
    const [phase, setPhase] = useState<Phase>('typing');
    const [reducedMotion, setReducedMotion] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setReducedMotion(true);
            return;
        }

        const example = EXAMPLES[exampleIdx];

        if (phase === 'typing') {
            if (charCount < example.long.length) {
                timerRef.current = setTimeout(() => setCharCount(charCount + 1), TYPE_SPEED_MS);
            } else {
                timerRef.current = setTimeout(() => setPhase('snapped'), SNAP_DELAY_MS);
            }
        } else {
            timerRef.current = setTimeout(() => {
                setExampleIdx((exampleIdx + 1) % EXAMPLES.length);
                setCharCount(0);
                setPhase('typing');
            }, SHORT_HOLD_MS);
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [phase, charCount, exampleIdx]);

    const example = EXAMPLES[exampleIdx];
    const snapped = reducedMotion || phase === 'snapped';
    const typedText = reducedMotion ? example.long : example.long.slice(0, charCount);

    return (
        <div className="font-mono text-[13px] sm:text-sm leading-relaxed select-none" aria-hidden="true">
            {/* The long URL: types out, then dims and gets struck through */}
            <p
                className={`truncate transition-all duration-300 ${
                    snapped ? 'text-stone-600 line-through decoration-stone-600' : 'text-stone-400'
                }`}
            >
                {typedText}
                {!snapped && !reducedMotion && <span className="text-accent-bright animate-pulse">▍</span>}
            </p>

            {/* The short link pops in on the snap */}
            <p className={`flex items-center gap-2 mt-1 ${snapped ? 'animate-snapIn' : 'invisible'}`}>
                <CornerDownRight className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                <span className="text-accent-bright font-medium">{example.short}</span>
            </p>
        </div>
    );
}
