import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter — maximum 200 requests per 15 minutes per IP.
 */
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
    },
});

/**
 * Strict URL creation rate limiter — maximum 20 short URLs created per hour per IP.
 */
export const urlCreationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many URL generation attempts from this IP, please try again in an hour.',
    },
});
