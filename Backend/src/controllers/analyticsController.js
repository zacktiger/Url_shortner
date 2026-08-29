import prisma from '../config/db.js';
import { Prisma } from '@prisma/client';

/**
 * Lists every calendar day in the last `days` days as 'YYYY-MM-DD', oldest first.
 * This is the spine we gap-fill against, so a link with no clicks still gets a
 * full-length series instead of an empty one.
 *
 * @param {number} days - How many days back to include.
 * @returns {string[]} e.g. ['2026-07-15', '2026-07-16', …]
 */
function listDayKeys(days) {
    const keys = [];
    for (let daysAgo = days - 1; daysAgo >= 0; daysAgo--) {
        const day = new Date();
        day.setUTCDate(day.getUTCDate() - daysAgo);
        keys.push(day.toISOString().slice(0, 10));
    }
    return keys;
}

/**
 * Builds a daily click count series for the last `days` days, for many URLs at
 * once. One query covers the whole dashboard — counting per link separately
 * would mean an extra round trip for every link the user owns.
 *
 * We use raw SQL because Prisma's groupBy can only group by an exact timestamp,
 * not by calendar day. Postgres' TO_CHAR truncates each click's timestamp to a
 * 'YYYY-MM-DD' string so all clicks on the same day fall into one bucket.
 *
 * The DB only returns days that actually had clicks, so we then "gap-fill":
 * we walk every day in the window and default missing days to 0. This gives the
 * frontend a continuous series (no holes) that charts cleanly.
 *
 * @param {number[]} urlIds - The URLs whose clicks we're counting.
 * @param {number} days     - How many days back to include (default 30).
 * @returns {Promise<Map<number, { date: string, count: number }[]>>} Keyed by
 *          urlId; every value is `days` entries long, oldest day first.
 */
async function getClicksByDayForUrls(urlIds, days = 30) {
    const byUrlId = new Map();
    // Prisma.join throws on an empty list, and there is nothing to count anyway.
    if (urlIds.length === 0) return byUrlId;

    // One row per (url, day) that had at least one click.
    const rowsWithClicks = await prisma.$queryRaw`
        SELECT "urlId", TO_CHAR("clickedAt", 'YYYY-MM-DD') AS date, COUNT(*)::int AS count
        FROM "Analytics"
        WHERE "urlId" IN (${Prisma.join(urlIds)})
          AND "clickedAt" >= NOW() - (${days} || ' days')::interval
        GROUP BY 1, 2
    `;

    // Nest the flat rows into urlId -> { day -> count } so gap-filling is a lookup.
    const countByUrlAndDate = new Map();
    for (const row of rowsWithClicks) {
        if (!countByUrlAndDate.has(row.urlId)) countByUrlAndDate.set(row.urlId, new Map());
        countByUrlAndDate.get(row.urlId).set(row.date, row.count);
    }

    const dayKeys = listDayKeys(days);
    for (const urlId of urlIds) {
        const counts = countByUrlAndDate.get(urlId) ?? new Map();
        byUrlId.set(urlId, dayKeys.map((date) => ({ date, count: counts.get(date) || 0 })));
    }
    return byUrlId;
}

/**
 * Single-URL convenience wrapper, so the day-window and gap-fill logic lives in
 * exactly one place.
 *
 * @param {number} urlId - The URL whose clicks we're counting.
 * @param {number} days  - How many days back to include (default 30).
 * @returns {Promise<{ date: string, count: number }[]>} Oldest day first.
 */
async function getClicksByDay(urlId, days = 30) {
    const byUrlId = await getClicksByDayForUrls([urlId], days);
    return byUrlId.get(urlId);
}

/**
 * Returns detailed analytics for a specific short URL.
 *
 * Access follows ownership: a link created while signed in is private to its
 * owner, while a link created anonymously has no owner to check against and is
 * readable by anyone holding the short code — possession of the code is the
 * only credential such a link ever had.
 */
export async function getUrlAnalytics(req, res) {
    const { shortCode } = req.params;
    const userId = req.user?.id ?? null; // optionalAuth — null when signed out

    try {
        const urlRecord = await prisma.url.findUnique({
            where: { shortCode },
            include: {
                analytics: {
                    orderBy: { clickedAt: 'desc' },
                    take: 100, // limit raw logs to last 100 for graph/display
                },
            },
        });

        if (!urlRecord) {
            return res.status(404).json({ success: false, message: 'URL not found' });
        }

        // Owned links are private to their owner; unowned ones are open (see above).
        if (urlRecord.userId !== null && urlRecord.userId !== userId) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // Aggregate statistics using Prisma GroupBy
        const countries = await prisma.analytics.groupBy({
            by: ['country'],
            where: { urlId: urlRecord.id },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
        });

        const devices = await prisma.analytics.groupBy({
            by: ['device'],
            where: { urlId: urlRecord.id },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
        });

        const browsers = await prisma.analytics.groupBy({
            by: ['browser'],
            where: { urlId: urlRecord.id },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
        });

        const referrers = await prisma.analytics.groupBy({
            by: ['referrer'],
            where: { urlId: urlRecord.id },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
        });

        // Daily click totals for the last 30 days (powers the "clicks over time" chart)
        const clicksByDay = await getClicksByDay(urlRecord.id, 30);

        return res.status(200).json({
            success: true,
            url: {
                id: urlRecord.id,
                shortCode: urlRecord.shortCode,
                longUrl: urlRecord.longUrl,
                clicks: urlRecord.clicks,
                createdAt: urlRecord.createdAt,
                expiresAt: urlRecord.expiresAt,
            },
            stats: {
                countries: countries.map((c) => ({ country: c.country || 'Unknown', count: c._count.id })),
                devices: devices.map((d) => ({ device: d.device || 'Unknown', count: d._count.id })),
                browsers: browsers.map((b) => ({ browser: b.browser || 'Unknown', count: b._count.id })),
                referrers: referrers.map((r) => ({ referrer: r.referrer || 'Direct', count: r._count.id })),
                clicksByDay,
                recentClicks: urlRecord.analytics.slice(0, 10),
            },
        });
    } catch (error) {
        console.error('Error fetching URL analytics:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

/**
 * Returns dashboard stats (summary and list of URLs) for the logged-in user.
 */
export async function getUserDashboardStats(req, res) {
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    try {
        const urls = await prisma.url.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        const totalClicks = urls.reduce((sum, url) => sum + url.clicks, 0);

        // One query for every link's 30-day trend, so each dashboard row can
        // carry a sparkline. Counts only — the sparkline plots shape, not dates.
        const seriesByUrlId = await getClicksByDayForUrls(urls.map((url) => url.id), 30);

        return res.status(200).json({
            success: true,
            dashboard: {
                totalUrls: urls.length,
                totalClicks,
                urls: urls.map((url) => ({
                    ...url,
                    series: (seriesByUrlId.get(url.id) ?? []).map((day) => day.count),
                })),
            },
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}
