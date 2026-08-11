import { generateToken } from '../utils/jwt.js';
import { FRONTEND_URL } from '../config/urls.js';

/**
 * Handles the redirect after Google OAuth success.
 * Signs a JWT and redirects to the frontend with the token.
 */
export function handleGoogleCallback(req, res) {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication failed' });
    }

    try {
        const payload = {
            id: req.user.id,
            email: req.user.email,
            name: req.user.name,
        };

        const token = generateToken(payload);

        return res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
    } catch (error) {
        console.error('Google callback error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

/**
 * Returns the current authenticated user's profile.
 */
export async function getMe(req, res) {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    return res.status(200).json({
        success: true,
        user: req.user,
    });
}
