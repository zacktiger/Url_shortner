// Sparkline geometry for the dashboard's per-link 30-day trend.
//
// These are shape-only glyphs, not charts: no axes, no labels, no tooltip.
// Each one is scaled to its *own* peak so a quiet link still shows its
// pattern instead of flatlining next to a busy one.

export const SPARK_WIDTH = 96;
export const SPARK_HEIGHT = 26;

// Leave a little headroom top and bottom so the stroke isn't clipped.
const PLOT_TOP = 4;
const PLOT_BOTTOM = 24;

/**
 * Turns a series of daily counts into an SVG path for a 96x26 viewBox.
 *
 * @param series Daily click counts, oldest first.
 * @returns An SVG `d` attribute, or null when there is nothing to draw.
 */
export function sparkPath(series: number[] | undefined): string | null {
    // A single point has no line to draw, and no span to divide by.
    if (!series || series.length < 2) return null;

    // Scale to this link's own peak; `1` keeps an all-zero series flat on the
    // baseline rather than dividing by zero.
    const max = Math.max(...series, 1);
    const stepX = SPARK_WIDTH / (series.length - 1);
    const plotHeight = PLOT_BOTTOM - PLOT_TOP;

    const points = series.map((count, index) => {
        const x = index * stepX;
        const y = PLOT_BOTTOM - (count / max) * plotHeight;
        return `${x.toFixed(1)} ${y.toFixed(1)}`;
    });

    return `M${points.join(' L')}`;
}
