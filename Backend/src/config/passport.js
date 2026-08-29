import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import prisma from './db.js';

// Google sign-in is optional: shortening a link works signed out, and an
// account only adds ownership (a dashboard, deletion, private stats). So the
// API boots fine without credentials — it just can't offer sign-in, and
// authRoutes turns the sign-in routes into a clear error instead of leaving
// Passport to fail deep inside the OAuth exchange with "401: invalid_client".
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;

/** True when Google credentials are present and the strategy is registered. */
export const isGoogleOAuthConfigured = Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);

if (!isGoogleOAuthConfigured) {
    const missing = [
        !GOOGLE_CLIENT_ID && 'GOOGLE_CLIENT_ID',
        !GOOGLE_CLIENT_SECRET && 'GOOGLE_CLIENT_SECRET',
    ].filter(Boolean);

    console.warn(
        `Google sign-in is disabled — missing: ${missing.join(', ')}.\n` +
        'Links can still be created anonymously. To enable accounts, create a Web ' +
        'application OAuth client at https://console.cloud.google.com/apis/credentials ' +
        'and copy the values into Backend/.env.'
    );
} else {
    passport.use(
        new GoogleStrategy(
            {
                clientID: GOOGLE_CLIENT_ID,
                clientSecret: GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/auth/google/callback',
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    const email = profile.emails?.[0]?.value;
                    if (!email) {
                        return done(new Error('No email found in Google profile'), null);
                    }

                    // Upsert the user based on googleId
                    const user = await prisma.user.upsert({
                        where: { googleId: profile.id },
                        update: {
                            name: profile.displayName,
                            email: email,
                        },
                        create: {
                            googleId: profile.id,
                            email: email,
                            name: profile.displayName,
                        },
                    });

                    return done(null, user);
                } catch (error) {
                    return done(error, null);
                }
            }
        )
    );
}

export default passport;
