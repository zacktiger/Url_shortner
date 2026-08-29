/**
 * Startup environment validation.
 *
 * Several modules fall back to safe-looking defaults for local development
 * (a hardcoded JWT secret, localhost URLs). Those defaults are fine on a laptop
 * but dangerous in production — the JWT fallback is committed to a public repo,
 * so shipping with it would let anyone forge a token for any user. We fail fast
 * at boot instead of discovering that in production.
 */

// Vars the app cannot correctly run without once NODE_ENV=production.
const REQUIRED_IN_PRODUCTION = [
    'DATABASE_URL',
    'JWT_SECRET',
    'BASE_URL',
    'FRONTEND_URL',
];

// Google sign-in is optional — shortening works signed out, and an account only
// adds ownership (dashboard, deletion, private stats). Missing credentials are
// therefore a warning, not a boot failure: the deployment is still useful, just
// without accounts. GOOGLE_CALLBACK_URL is listed too because a callback left
// pointing at localhost fails only at the very end of a real sign-in.
const GOOGLE_CREDENTIAL_VARS = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_CALLBACK_URL',
];

const MIN_JWT_SECRET_LENGTH = 32;

export function validateEnv() {
    const isProduction = process.env.NODE_ENV === 'production';
    if (!isProduction) return;

    const problems = [];

    for (const key of REQUIRED_IN_PRODUCTION) {
        if (!process.env[key]) {
            problems.push(`${key} is required in production but is not set.`);
        }
    }

    const secret = process.env.JWT_SECRET;
    if (secret && secret.length < MIN_JWT_SECRET_LENGTH) {
        problems.push(
            `JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters ` +
            `(got ${secret.length}). Generate one with: openssl rand -base64 48`
        );
    }
    if (secret && secret.includes('change_this')) {
        problems.push('JWT_SECRET is still the placeholder value from .env.example.');
    }

    const missingGoogle = GOOGLE_CREDENTIAL_VARS.filter((key) => !process.env[key]);
    if (missingGoogle.length > 0) {
        console.warn(
            `Google sign-in is disabled — missing: ${missingGoogle.join(', ')}. ` +
            'Links can still be created anonymously; accounts, the dashboard and ' +
            'per-link private stats will be unavailable.'
        );
    }

    if (problems.length > 0) {
        throw new Error(
            'Invalid production environment:\n' +
            problems.map((p) => `  - ${p}`).join('\n')
        );
    }
}
