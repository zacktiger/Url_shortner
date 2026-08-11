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

// Google sign-in is optional. Presence of the credentials is what decides
// whether it is enabled — GOOGLE_CALLBACK_URL is deliberately excluded here
// because deployment configs commonly give it a default value, which would
// otherwise make an intentionally-disabled OAuth setup look half-configured.
const GOOGLE_CREDENTIAL_VARS = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];

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

    const googleSet = GOOGLE_CREDENTIAL_VARS.filter((key) => process.env[key]);
    if (googleSet.length === 1) {
        const missing = GOOGLE_CREDENTIAL_VARS.filter((key) => !process.env[key]);
        problems.push(`Google OAuth is partially configured — missing: ${missing.join(', ')}.`);
    }
    // Credentials present but nowhere for Google to redirect back to.
    if (googleSet.length === GOOGLE_CREDENTIAL_VARS.length && !process.env.GOOGLE_CALLBACK_URL) {
        problems.push('GOOGLE_CALLBACK_URL is required when Google OAuth credentials are set.');
    }

    if (problems.length > 0) {
        throw new Error(
            'Invalid production environment:\n' +
            problems.map((p) => `  - ${p}`).join('\n')
        );
    }
}
