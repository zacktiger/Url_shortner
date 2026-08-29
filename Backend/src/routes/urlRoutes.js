import express from 'express';
import { handleGenerateShortUrl, handleGetQrCode } from '../controllers/urlController.js';
import { optionalAuth } from '../middleware/auth.js';
import { urlCreationLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Anyone can shorten a link — sign-in is optional. When a valid token is
// present the new link is filed under that account (dashboard, delete, stats);
// without one it is created unowned, and urlCreationLimiter in front of it is
// then the only thing standing between this endpoint and abuse.
router.post('/', urlCreationLimiter, optionalAuth, handleGenerateShortUrl);

// The QR code only encodes the public short link, so it stays open — it's rendered
// as a plain <img src>, which can't carry an Authorization header.
router.get('/:shortCode/qr', handleGetQrCode);

export default router;
