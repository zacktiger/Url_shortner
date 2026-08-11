import express from 'express';
import cors from 'cors';
import passport from './config/passport.js';
import urlRoutes from './routes/urlRoutes.js';
import authRoutes from './routes/authRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { handleRedirect } from './controllers/urlController.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { FRONTEND_URL } from './config/urls.js';

const app = express();

// In production the app sits behind a reverse proxy (nginx, Railway, Render...),
// so the socket address is the proxy's. Trusting one hop of X-Forwarded-For makes
// req.ip the real client IP — without it every visitor shares a single
// rate-limit bucket. Kept to an exact hop count on purpose: `true` would let a
// client spoof X-Forwarded-For and dodge the limiter entirely.
const trustProxyHops = Number(process.env.TRUST_PROXY ?? (process.env.NODE_ENV === 'production' ? 1 : 0));
app.set('trust proxy', trustProxyHops);

app.use(cors({
    origin: FRONTEND_URL,
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

// Root-level redirect — keep last so reserved prefixes above win over short codes
app.get('/:shortCode', handleRedirect);

app.use(errorHandler);

export default app;
