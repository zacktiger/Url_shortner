import { createClient } from 'redis';

// Redis is an optional cache — every call site in redisService.js already falls
// back to the database on error. Some hosting setups have no Redis at all, so
// when REDIS_URL is unset in production we skip connecting entirely rather than
// let the client retry a localhost address forever and flood the logs.
const REDIS_URL = process.env.REDIS_URL
    || (process.env.NODE_ENV === 'production' ? null : 'redis://localhost:6379');

const redisClient = createClient({
    url: REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
    console.log('Redis client connecting...');
});

redisClient.on('ready', () => {
    console.log('Redis client connected and ready.');
});

if (REDIS_URL) {
    // Connect asynchronously so a slow or down cache never blocks startup.
    redisClient.connect().catch((err) => {
        console.error('Failed to connect to Redis:', err);
    });
} else {
    console.warn('REDIS_URL is not set — running without cache (every redirect hits the database).');
}

export default redisClient;
