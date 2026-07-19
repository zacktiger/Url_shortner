import prisma from '../config/db.js';

/**
 * Parses browser and device from User-Agent string.
 * @param {string} userAgent 
 * @returns {object} { browser, device }
 */
export function parseUserAgent(userAgent) {
    if (!userAgent) {
        return { browser: 'Unknown', device: 'Desktop' };
    }

    let browser = 'Unknown';
    let device = 'Desktop';

    const ua = userAgent.toLowerCase();

    // Determine device
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
        device = 'Tablet';
    } else if (/Mobile|Android|iPhone|iPad|iPod|Windows Phone|IEMobile/i.test(userAgent)) {
        device = 'Mobile';
    } else {
        device = 'Desktop';
    }

    // Determine browser
    if (ua.includes('firefox')) {
        browser = 'Firefox';
    } else if (ua.includes('opera') || ua.includes('opr/')) {
        browser = 'Opera';
    } else if (ua.includes('edge') || ua.includes('edg/')) {
        browser = 'Edge';
    } else if (ua.includes('chrome')) {
        browser = 'Chrome';
    } else if (ua.includes('safari')) {
        browser = 'Safari';
    } else if (ua.includes('msie') || ua.includes('trident/')) {
        browser = 'Internet Explorer';
    }

    return { browser, device };
}

/**
 * Asynchronously record a click: logs its metadata AND increments the URL's
 * click counter, atomically (see the transaction below).
 * @param {number} urlId
 * @param {object} req - Express request object to extract headers
 */
export async function trackClick(urlId, req) {
    try {
        const userAgent = req.headers['user-agent'] || '';
        const referrerHeader = req.get('referrer') || req.get('referer') || '';
        
        // Extract referrer hostname or 'Direct'
        let referrer = 'Direct';
        if (referrerHeader) {
            try {
                referrer = new URL(referrerHeader).hostname;
            } catch {
                referrer = referrerHeader;
            }
        }

        // Get country from cloud headers or fallback
        const country = req.headers['cf-ipcountry'] || 
                        req.headers['x-vercel-ip-country'] || 
                        req.headers['x-country-code'] || 
                        'Unknown';

        const { browser, device } = parseUserAgent(userAgent);

        // Log the click and bump the URL's click counter in a single
        // transaction so url.clicks always matches the number of Analytics
        // rows. If either write fails, both roll back — the counter and the
        // detailed logs can never drift apart.
        await prisma.$transaction([
            prisma.analytics.create({
                data: {
                    urlId,
                    country,
                    device,
                    browser,
                    referrer
                }
            }),
            prisma.url.update({
                where: { id: urlId },
                data: { clicks: { increment: 1 } }
            })
        ]);
    } catch (error) {
        console.error('Error tracking click analytics:', error);
    }
}
