import express from 'express';
import { handleGenerateShortUrl, handleRedirect } from '../controllers/urlController.js';
import { optionalAuth } from '../middleware/auth.js';
import { urlCreationLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/', urlCreationLimiter, optionalAuth, handleGenerateShortUrl);
router.get('/:shortCode', handleRedirect);

export default router;
