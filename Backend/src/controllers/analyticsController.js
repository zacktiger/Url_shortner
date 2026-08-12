import prisma from '../config/db.js';

/**
 * Builds a daily click count series for the last `days` days for one URL.
 *
 * We use a raw SQL query here because Prisma's groupBy can only group by an
 * exact timestamp, not by calendar day. Postgres' TO_CHAR truncates each
 * click's timestamp down to a 'YYYY-MM-DD' string so all clicks on the same
 * day fall into one bucket.
 *
 * The DB only returns days that actually had clicks, so we then "gap-fill":
 * we walk every day in the window and default missing days to 0. This gives
 * the frontend a continuous series (no holes) that charts cleanly.
 *
 * @param {number} urlId - The URL whose clicks we're counting.
 * @param {number} days  - How many days back to include (default 30).
 * @returns {Promise<{ date: string, count: number }[]>} Oldest day first.
 */
async function getClicksByDay(urlId, days = 30) {
    // One row per day that had at least one click, e.g. { date: '2026-07-18', count: 5 }
    const rowsWithClicks = await prisma.$queryRaw`
        SELECT TO_CHAR("clickedAt", 'YYYY-MM-DD') AS date, COUNT(*)::int AS count
        FROM "Analytics"
        WHERE "urlId" = ${urlId}
          AND "clickedAt" >= NOW() - (${days} || ' days')::interval
        GROUP BY 1
        ORDER BY 1
    `;

    // Look up counts by day so gap-filling is a quick Map lookup.
    const countByDate = new Map(rowsWithClicks.map((row) => [row.date, row.count]));

    // Produce one entry for every day in the window, oldest to newest.
    const series = [];
    for (let daysAgo = days - 1; daysAgo >= 0; daysAgo--) {
        const day = new Date();
        day.setUTCDate(day.getUTCDate() - daysAgo);
        const dateKey = day.toISOString().slice(0, 10); // 'YYYY-MM-DD'
        series.push({ date: dateKey, count: countByDate.get(dateKey) || 0 });
    }
    return series;
}

/**
 * Returns detailed analytics for a specific short URL.
 * Sign-in is required (requireAuth) and only the link's owner may read its stats.
 */
export async function getUrlAnalytics(req, res) {
    const { shortCode } = req.params;
    const userId = req.user.id; // requireAuth guarantees this exists

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

        // Only the owner sees a link's analytics. Links created before sign-in was
        // enforced have no owner (userId === null) and so are readable by nobody.
        if (urlRecord.userId !== userId) {
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

        return res.status(200).json({
            success: true,
            dashboard: {
                totalUrls: urls.length,
                totalClicks,
                urls,
            },
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}
