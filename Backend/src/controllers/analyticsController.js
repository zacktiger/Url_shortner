import prisma from '../config/db.js';

/**
 * Returns detailed analytics for a specific short URL.
 * Enforces ownership if the URL belongs to a registered user.
 */
export async function getUrlAnalytics(req, res) {
    const { shortCode } = req.params;
    const userId = req.user?.id; // Optional or required, depending on route middleware

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

        // If URL belongs to a user, block other users from viewing its analytics
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

        return res.status(200).json({
            success: true,
            url: {
                id: urlRecord.id,
                shortCode: urlRecord.shortCode,
                longUrl: urlRecord.longUrl,
                clicks: urlRecord.clicks,
                createdAt: urlRecord.createdAt,
            },
            stats: {
                countries: countries.map((c) => ({ country: c.country || 'Unknown', count: c._count.id })),
                devices: devices.map((d) => ({ device: d.device || 'Unknown', count: d._count.id })),
                browsers: browsers.map((b) => ({ browser: b.browser || 'Unknown', count: b._count.id })),
                referrers: referrers.map((r) => ({ referrer: r.referrer || 'Direct', count: r._count.id })),
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
