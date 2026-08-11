/**
 * Public URLs, normalized once at startup.
 *
 * A trailing slash pasted into a dashboard is easy to miss and breaks things in
 * ways that are hard to trace:
 *   - CORS compares Access-Control-Allow-Origin to the browser's Origin as an
 *     exact string, so "https://app.example.com/" rejects every request while
 *     looking correct in curl, which does not enforce CORS.
 *   - BASE_URL is concatenated into short links, so a trailing slash yields
 *     "https://api.example.com//abc123".
 *
 * Normalizing here means configuration written either way behaves the same.
 */

/**
 * @param {string|undefined} value
 * @returns {string|undefined} The value without any trailing slashes.
 */
function stripTrailingSlash(value) {
    if (!value) return value;
    return value.replace(/\/+$/, '');
}

/** Origin the browser app is served from — the only allowed CORS origin. */
export const FRONTEND_URL = stripTrailingSlash(process.env.FRONTEND_URL) || 'http://localhost:3000';

/** Public origin of this API — short links are built from it. */
export const BASE_URL = stripTrailingSlash(process.env.BASE_URL) || 'http://localhost:5000';
