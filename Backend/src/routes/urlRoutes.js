import express from 'express';
import { handleGenerateShortUrl, handleGetQrCode } from '../controllers/urlController.js';
import { requireAuth } from '../middleware/auth.js';
import { urlCreationLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Creating a link requires a signed-in (Google) account, so every link has an owner.
router.post('/', urlCreationLimiter, requireAuth, handleGenerateShortUrl);

// The QR code only encodes the public short link, so it stays open — it's rendered
// as a plain <img src>, which can't carry an Authorization header.
router.get('/:shortCode/qr', handleGetQrCode);

export default router;
