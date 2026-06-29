import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import prisma from './db.js';

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID || 'dummy_client_id',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_client_secret',
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
