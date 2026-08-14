// A static before/after record of one shortening, shown under the hero.
//
// The point it makes is arithmetic, not decorative: a real 94-character
// Amazon URL becomes a 22-character short link, and the sliver at the bottom
// draws that ratio to scale. Nothing animates, so it reads the instant the
// page paints and there is no timer or reduced-motion branch to maintain.

const LONG_URL =
    'https://www.amazon.in/product/dp/B0C7QLNMZV?ref=share&tag=summer-sale&utm_source=whatsapp';
const SHORT_DOMAIN = 'snaplink.click/';
const SHORT_CODE = 'aB3x9K1';

const longLength = LONG_URL.length;
const shortLength = SHORT_DOMAIN.length + SHORT_CODE.length;
// How much of the original the short link takes up, drawn as the sliver width.
const ratioPercent = Math.round((shortLength / longLength) * 100);

export default function UrlLedger() {
    return (
        <div className="bg-black/[0.28] border border-hairline rounded-xl overflow-hidden">
            {/* In: the original, struck through and truncated */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.05]">
                <span className="shrink-0 w-8 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-faint">
                    In
                </span>
                <span className="flex-1 min-w-0 truncate font-mono text-[13px] text-faint line-through decoration-white/[0.15]">
                    {LONG_URL}
                </span>
                <span className="shrink-0 font-mono text-[11px] text-faint">{longLength} chars</span>
            </div>

            {/* Out: the short link, with the code chipped in the accent */}
            <div className="flex items-center gap-3 px-4 py-3">
                <span className="shrink-0 w-8 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-accent-bright">
                    Out
                </span>
                <span className="flex-1 min-w-0 flex items-center gap-2">
                    <span className="font-mono text-[15px] font-medium text-white">{SHORT_DOMAIN}</span>
                    <span className="font-mono text-[15px] font-semibold text-accent-bright bg-accent/[0.14] border border-accent/[0.35] rounded-md px-[7px] py-px">
                        {SHORT_CODE}
                    </span>
                </span>
                <span className="shrink-0 font-mono text-[11px] text-accent-bright">{shortLength} chars</span>
            </div>

            {/* The ratio, drawn to scale across the full width */}
            <div className="h-0.5 bg-white/[0.05]">
                <div className="h-full bg-accent" style={{ width: `${ratioPercent}%` }} />
            </div>
        </div>
    );
}
