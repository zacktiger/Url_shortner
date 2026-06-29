import { verifyToken } from '../utils/jwt.js';

/**
 * Middleware to enforce authentication via Bearer JWT.
 */
export function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = verifyToken(token);
        req.user = decoded; // Contains id, email, name
        next();
    } catch (error) {
        console.error('requireAuth token verification failed:', error.message);
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
}

/**
 * Optional authentication middleware.
 * Does not block if token is invalid or missing.
 */
export function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = verifyToken(token);
            req.user = decoded;
        } catch (error) {
            // Ignore error, request proceeds as anonymous
        }
    }
    next();
}
