import { createClient } from 'redis';

const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
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

// Establish the connection asynchronously so it doesn't block server startup if Redis is down
redisClient.connect().catch((err) => {
    console.error('Failed to connect to Redis:', err);
});

export default redisClient;
