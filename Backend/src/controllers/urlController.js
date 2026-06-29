import prisma from '../config/db.js';
import { generateUniqueShortCode } from '../services/base62Service.js';
import { getCachedUrl, setCachedUrl } from '../services/redisService.js';
import { trackClick } from '../services/analyticsService.js';

// POST /url — Create a short URL
export async function handleGenerateShortUrl(req, res) {
    const { longUrl, customAlias } = req.body;

    if (!longUrl) {
        return res.status(400).json({ success: false, message: 'URL is required' });
    }

    try {
        new URL(longUrl);
    } catch {
        return res.status(400).json({ success: false, message: 'Invalid URL format (include http:// or https://)' });
    }

    try {
        let shortCode;
        if (customAlias) {
            const alias = customAlias.trim();
            if (!/^[a-zA-Z0-9_-]{3,30}$/.test(alias)) {
                return res.status(400).json({ success: false, message: 'Alias must be between 3 and 30 characters, using only letters, numbers, hyphens, and underscores' });
            }
            const existing = await prisma.url.findUnique({ where: { shortCode: alias } });
            if (existing) {
                return res.status(400).json({ success: false, message: 'Custom alias is already in use' });
            }
            shortCode = alias;
        } else {
            shortCode = await generateUniqueShortCode();
        }

        const userId = req.user?.id || null;

        const urlRecord = await prisma.url.create({
            data: { 
                longUrl, 
                shortCode,
                userId
            },
        });

        // Cache the mapping for fast redirects
        await setCachedUrl(shortCode, { id: urlRecord.id, longUrl: urlRecord.longUrl });

        return res.status(201).json({
            success: true,
            shortCode: urlRecord.shortCode,
            longUrl: urlRecord.longUrl,
            clicks: urlRecord.clicks,
            createdAt: urlRecord.createdAt,
        });
    } catch (error) {
        console.error('Error generating short URL:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

// GET /:shortCode — Redirect with Redis cache-aside and analytics tracking
export async function handleRedirect(req, res) {
    const { shortCode } = req.params;

    try {
        // 1. Check Redis first
        const cachedData = await getCachedUrl(shortCode);

        if (cachedData) {
            // Cache hit — increment clicks & track analytics async, redirect immediately
            prisma.url.update({
                where: { shortCode },
                data: { clicks: { increment: 1 } },
            }).catch(console.error);

            trackClick(cachedData.id, req).catch(console.error);

            return res.redirect(cachedData.longUrl);
        }

        // 2. Cache miss — query Postgres
        const urlRecord = await prisma.url.findUnique({ where: { shortCode } });

        if (!urlRecord) {
            return res.status(404).json({ success: false, message: 'Short URL not found' });
        }

        // 3. Populate cache for next time
        await setCachedUrl(shortCode, { id: urlRecord.id, longUrl: urlRecord.longUrl });

        // 4. Increment clicks and track analytics
        prisma.url.update({
            where: { shortCode },
            data: { clicks: { increment: 1 } },
        }).catch(console.error);

        trackClick(urlRecord.id, req).catch(console.error);

        return res.redirect(urlRecord.longUrl);
    } catch (error) {
        console.error('Error in redirect:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

