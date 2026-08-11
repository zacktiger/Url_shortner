"use client";

import { useEffect, useState } from 'react';

/*
 * Animates a number from 0 to `target` with an ease-out curve.
 * Used by the dashboard and analytics stat tiles. Renders the final
 * value immediately when the user prefers reduced motion.
 */
export function useCountUp(target: number, durationMs = 800): number {
    const [value, setValue] = useState(0);

    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || target === 0) {
            setValue(target);
            return;
        }

        let rafId: number;
        const start = performance.now();

        const tick = (now: number) => {
            const progress = Math.min((now - start) / durationMs, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(target * eased));
            if (progress < 1) rafId = requestAnimationFrame(tick);
        };

        rafId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId);
    }, [target, durationMs]);

    return value;
}
