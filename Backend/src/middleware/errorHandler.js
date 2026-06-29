/**
 * Express error handler middleware to catch all unhandled exceptions
 * and return structured JSON error responses.
 */
export function errorHandler(err, req, res, next) {
    console.error('Unhandled Error Captured:', err);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal server error';

    return res.status(statusCode).json({
        success: false,
        message: process.env.NODE_ENV === 'production' ? 'Internal server error' : message,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    });
}
