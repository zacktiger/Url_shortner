import express from 'express';
import cors from 'cors';
import passport from './config/passport.js';
import urlRoutes from './routes/urlRoutes.js';
import authRoutes from './routes/authRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(express.json());
app.use(passport.initialize());
app.use(apiLimiter);

app.get('/', (req, res) => {
    res.send('URL Shortener Backend Running');
});

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

app.use('/auth', authRoutes);
app.use('/url', urlRoutes);
app.use('/user', userRoutes);
app.use('/analytics', analyticsRoutes);

app.use(errorHandler);

export default app;
