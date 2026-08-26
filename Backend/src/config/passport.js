import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import prisma from './db.js';

// Google sign-in is the only way in, so placeholder credentials would boot a
// server that looks healthy and fails much later — at Google, as a cryptic
// "401: invalid_client" — instead of here. Fail at startup with a message that
// says what to do. The callback URL keeps a local default because it is a
// genuine, correct value for development.
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    const missing = [
        !GOOGLE_CLIENT_ID && 'GOOGLE_CLIENT_ID',
        !GOOGLE_CLIENT_SECRET && 'GOOGLE_CLIENT_SECRET',
    ].filter(Boolean);

    throw new Error(
        `Google OAuth is not configured — missing: ${missing.join(', ')}.\n` +
        'Sign-in is required to create links, so the API cannot serve traffic without it.\n' +
        'Create a Web application OAuth client at https://console.cloud.google.com/apis/credentials ' +
        'and copy the values into Backend/.env.'
    );
}

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

export default passport;
