import express from 'express';
import passport from '../config/passport.js';
import { handleGoogleCallback, getMe } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

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
router.get(
    '/google/callback',
    passport.authenticate('google', {
        session: false,
        failureRedirect: '/auth/google/failure',
    }),
    handleGoogleCallback
);

// Route to get authenticated user profile
router.get('/me', requireAuth, getMe);

export default router;
