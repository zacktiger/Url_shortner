import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getMyUrls, deleteMyUrl } from '../controllers/userController.js';

const router = express.Router();

router.use(requireAuth);

router.get('/urls', getMyUrls);
router.delete('/urls/:shortCode', deleteMyUrl);

export default router;
