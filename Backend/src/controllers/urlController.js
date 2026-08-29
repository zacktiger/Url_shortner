import QRCode from 'qrcode';
import prisma from '../config/db.js';
import { generateUniqueShortCode } from '../services/base62Service.js';
import { getCachedUrl, setCachedUrl, deleteCachedUrl, DEFAULT_TTL } from '../services/redisService.js';
import { trackClick } from '../services/analyticsService.js';
import { BASE_URL } from '../config/urls.js';

/**
 * True if a link has an expiry that has already passed.
 * Links with no expiry (expiresAt == null) never expire.
 */
function isExpired(expiresAt) {
    return expiresAt != null && new Date(expiresAt).getTime() <= Date.now();
}

/**
 * Validate the optional `expiresAt` value from a create request.
 * Returns `{ date }` on success — `date` is null when no expiry was given —
 * or `{ error }` with a user-facing message when the value is unusable.
 *
 * @param {*} expiresAt - Raw value from the request body (ISO string, or empty).
 * @returns {{ date: Date|null, error?: string }}
 */
function parseExpiry(expiresAt) {
    // Nothing provided — the link never expires.
    if (expiresAt === undefined || expiresAt === null || expiresAt === '') {
        return { date: null };
    }

    const date = new Date(expiresAt);
    if (isNaN(date.getTime())) {
        return { error: 'Invalid expiration date' };
    }
    if (date.getTime() <= Date.now()) {
        return { error: 'Expiration date must be in the future' };
    }
    return { date };
}

/**
 * Cache a short-code → URL mapping for fast redirects.
 *
 * We store expiresAt alongside the URL so the redirect can enforce expiry
 * straight from the cache. If the link expires sooner than the default cache
 * lifetime, we shrink the Redis TTL to match — that way the cache can never
 * outlive the link and serve an expired redirect.
 *
 * @param {object} record - A Url row (needs shortCode, id, longUrl, expiresAt).
 */
async function cacheUrlRecord(record) {
    const expiresAt = record.expiresAt ? new Date(record.expiresAt) : null;

    const payload = {
        id: record.id,
        longUrl: record.longUrl,
        expiresAt: expiresAt ? expiresAt.toISOString() : null,
    };

    if (expiresAt) {
        const secondsUntilExpiry = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
        // Clamp to [1s, default 24h] so the TTL is never zero/negative or oversized.
        const ttl = Math.max(1, Math.min(DEFAULT_TTL, secondsUntilExpiry));
        await setCachedUrl(record.shortCode, payload, ttl);
    } else {
        await setCachedUrl(record.shortCode, payload);
    }
}

// POST /url — Create a short URL
export async function handleGenerateShortUrl(req, res) {
    const { longUrl, customAlias, expiresAt } = req.body;

    if (!longUrl) {
        return res.status(400).json({ success: false, message: 'URL is required' });
    }

    try {
        new URL(longUrl);
    } catch {
        return res.status(400).json({ success: false, message: 'Invalid URL format (include http:// or https://)' });
    }

    // Optional expiration — validate before we touch the database.
    const { date: expiresAtDate, error: expiryError } = parseExpiry(expiresAt);
    if (expiryError) {
        return res.status(400).json({ success: false, message: expiryError });
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

        // optionalAuth: req.user is set only when a valid token was sent. Signed-in
        // creators own their links (dashboard, delete, private stats); anonymous
        // ones are stored with userId = null and belong to whoever holds the code.
        const userId = req.user?.id ?? null;

        const urlRecord = await prisma.url.create({
            data: {
                longUrl,
                shortCode,
                userId,
                expiresAt: expiresAtDate,
            },
        });

        // Cache the mapping for fast redirects
        await cacheUrlRecord(urlRecord);

        return res.status(201).json({
            success: true,
            shortCode: urlRecord.shortCode,
            longUrl: urlRecord.longUrl,
            clicks: urlRecord.clicks,
            createdAt: urlRecord.createdAt,
            expiresAt: urlRecord.expiresAt,
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
            // Expired links must not redirect, even on a cache hit. Drop the
            // stale entry so we stop serving it before its TTL would lapse.
            if (isExpired(cachedData.expiresAt)) {
                await deleteCachedUrl(shortCode);
                return res.status(410).json({ success: false, message: 'This link has expired' });
            }

            // Cache hit — record the click (counter + analytics, atomically) and
            // redirect immediately without waiting on the write.
            console.log(`[cache] HIT  ${shortCode}`);
            trackClick(cachedData.id, req).catch(console.error);

            return res.redirect(cachedData.longUrl);
        }

        // 2. Cache miss — query Postgres
        console.log(`[cache] MISS ${shortCode} — querying Postgres`);
        const urlRecord = await prisma.url.findUnique({ where: { shortCode } });

        if (!urlRecord) {
            return res.status(404).json({ success: false, message: 'Short URL not found' });
        }

        // Expired links are gone for good — return 410 and don't cache them.
        if (isExpired(urlRecord.expiresAt)) {
            return res.status(410).json({ success: false, message: 'This link has expired' });
        }

        // 3. Populate cache for next time
        await cacheUrlRecord(urlRecord);

        // 4. Record the click (counter + analytics, atomically)
        trackClick(urlRecord.id, req).catch(console.error);

        return res.redirect(urlRecord.longUrl);
    } catch (error) {
        console.error('Error in redirect:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

// GET /url/:shortCode/qr — QR code for the short link (PNG by default, ?format=dataurl for a JSON data URL)
export async function handleGetQrCode(req, res) {
    const { shortCode } = req.params;
    const { format } = req.query;

    try {
        const urlRecord = await prisma.url.findUnique({
            where: { shortCode },
            select: { id: true },
        });

        if (!urlRecord) {
            return res.status(404).json({ success: false, message: 'Short URL not found' });
        }

        const shortUrl = `${BASE_URL}/${shortCode}`;

        if (format === 'dataurl') {
            const dataUrl = await QRCode.toDataURL(shortUrl, { width: 300, margin: 2 });
            return res.status(200).json({ success: true, shortCode, shortUrl, qrCode: dataUrl });
        }

        const pngBuffer = await QRCode.toBuffer(shortUrl, { type: 'png', width: 300, margin: 2 });
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.status(200).send(pngBuffer);
    } catch (error) {
        console.error('Error generating QR code:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

