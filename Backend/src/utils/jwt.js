import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_local_development_only';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Signs a JWT with the user's payload.
 * @param {object} payload - e.g., { id, email, name }
 * @returns {string} The signed JWT.
 */
export function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verifies a JWT.
 * @param {string} token 
 * @returns {object} The decoded payload.
 */
export function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
}
