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

// Google sign-in is mandatory: creating a link requires an authenticated user,
// so without working OAuth credentials nobody can shorten anything. Booting
// with the dummy fallbacks in passport.js would leave a live-looking but
// unusable deployment, so these are required alongside the vars above.
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
        problems.push(
            `Google OAuth is required to sign in and create links — missing: ${missingGoogle.join(', ')}.`
        );
    }

    if (problems.length > 0) {
        throw new Error(
            'Invalid production environment:\n' +
            problems.map((p) => `  - ${p}`).join('\n')
        );
    }
}
