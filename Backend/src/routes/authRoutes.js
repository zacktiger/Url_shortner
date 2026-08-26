import express from 'express';
import passport from '../config/passport.js';
import { handleGoogleCallback, getMe } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { FRONTEND_URL } from '../config/urls.js';

const router = express.Router();

// Route to initiate Google OAuth
router.get(
    '/google',
    passport.authenticate('google', {
        session: false,
        scope: ['profile', 'email'],
    })
);

// Route for Google callback
//
// A custom callback rather than passport's `failureRedirect`, because that
// option only fires when the strategy calls fail() — the user denying consent.
// Everything else is an error(): a rejected code-for-token exchange (expired or
// replayed code, redirect_uri mismatch) throws a TokenError that skips
// failureRedirect entirely and lands in errorHandler as a bare 500 with a JSON
// body, stranding the user on a blank page. Handling both branches here means
// every outcome ends up back at the frontend callback, which already reads
// `?error=`.
router.get(
    '/google/callback',
    (req, res, next) => {
        passport.authenticate('google', { session: false }, (err, user) => {
            if (err || !user) {
                // Worth a log line: the reason we hand the frontend is coarse
                // on purpose, so the detail only survives here.
                if (err) console.error('Google OAuth callback failed:', err);

                const reason = err?.code || 'google_auth_failed';
                return res.redirect(
                    `${FRONTEND_URL}/auth/callback?error=${encodeURIComponent(reason)}`
                );
            }

            // session: false, so passport does not populate req.user itself.
            req.user = user;
            return next();
        })(req, res, next);
    },
    handleGoogleCallback
);

// Route to get authenticated user profile
router.get('/me', requireAuth, getMe);

export default router;
