import prisma from '../config/db.js';
import { deleteCachedUrl } from '../services/redisService.js';

// GET /user/urls — List all URLs for the authenticated user
export async function getMyUrls(req, res) {
    try {
        const urls = await prisma.url.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                shortCode: true,
                longUrl: true,
                clicks: true,
                createdAt: true,
                expiresAt: true,
            },
        });

        return res.json({ success: true, urls });
    } catch (error) {
        console.error('Error fetching user URLs:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

// DELETE /user/urls/:shortCode — Delete a URL owned by the authenticated user
export async function deleteMyUrl(req, res) {
    const { shortCode } = req.params;

    try {
        const url = await prisma.url.findUnique({ where: { shortCode } });

        if (!url) {
            return res.status(404).json({ success: false, message: 'URL not found' });
        }

        if (url.userId !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // Delete analytics first (FK constraint), then the URL
        await prisma.analytics.deleteMany({ where: { urlId: url.id } });
        await prisma.url.delete({ where: { shortCode } });

        // Clear from Redis cache
        await deleteCachedUrl(shortCode);

        return res.json({ success: true, message: 'URL deleted' });
    } catch (error) {
        console.error('Error deleting URL:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}
