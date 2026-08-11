import 'dotenv/config';
import app from './src/app.js';
import { validateEnv } from './src/config/env.js';
import prisma from './src/config/db.js';
import redisClient from './src/config/redis.js';

// Refuse to boot a misconfigured production instance rather than serving
// traffic with development fallbacks (see src/config/env.js).
try {
    validateEnv();
} catch (error) {
    console.error(error.message);
    process.exit(1);
}

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} on http://localhost:${PORT}/`);
});

/**
 * Container platforms send SIGTERM and then kill the process after a grace
 * period. Stop accepting new connections, let in-flight requests finish, and
 * close the DB/cache handles so deploys don't drop live requests.
 */
async function shutdown(signal) {
    console.log(`${signal} received — shutting down gracefully.`);

    server.close(async () => {
        try {
            await prisma.$disconnect();
            if (redisClient.isOpen) {
                await redisClient.quit();
            }
        } catch (error) {
            console.error('Error during shutdown:', error);
        }
        process.exit(0);
    });

    // Don't hang forever if a connection refuses to drain.
    setTimeout(() => {
        console.error('Shutdown timed out — forcing exit.');
        process.exit(1);
    }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
