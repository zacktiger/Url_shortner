import redisClient from '../config/redis.js';

const CACHE_PREFIX = 'url:';
export const DEFAULT_TTL = 86400; // 24 hours (in seconds)

/**
 * True when the cache is actually usable. Issuing a command against a client
 * that never connected (no REDIS_URL, or Redis is down) throws on every call,
 * so we check first and let callers fall back to the database quietly.
 * @returns {boolean}
 */
function isCacheAvailable() {
    return redisClient.isOpen;
}

/**
 * Retrieves the cached URL record matching the short code.
 * @param {string} shortCode 
 * @returns {Promise<object|null>} The URL record object or null if not cached/error.
 */
export async function getCachedUrl(shortCode) {
    if (!isCacheAvailable()) return null;
    try {
        const value = await redisClient.get(`${CACHE_PREFIX}${shortCode}`);
        return value ? JSON.parse(value) : null;
    } catch (error) {
        console.error('Redis getCachedUrl error:', error);
        return null; // fallback to DB
    }
}

/**
 * Caches the mapping of short code to URL record data.
 * @param {string} shortCode 
 * @param {object} urlData 
 * @param {number} ttl 
 */
export async function setCachedUrl(shortCode, urlData, ttl = DEFAULT_TTL) {
    if (!isCacheAvailable()) return;
    try {
        await redisClient.set(`${CACHE_PREFIX}${shortCode}`, JSON.stringify(urlData), {
            EX: ttl
        });
    } catch (error) {
        console.error('Redis setCachedUrl error:', error);
    }
}

/**
 * Deletes the cached URL mapping.
 * @param {string} shortCode 
 */
export async function deleteCachedUrl(shortCode) {
    if (!isCacheAvailable()) return;
    try {
        await redisClient.del(`${CACHE_PREFIX}${shortCode}`);
    } catch (error) {
        console.error('Redis deleteCachedUrl error:', error);
    }
}
