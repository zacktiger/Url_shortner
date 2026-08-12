import express from 'express';
import { getUrlAnalytics, getUserDashboardStats } from '../controllers/analyticsController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Get summary stats for all URLs owned by logged-in user
router.get('/dashboard', requireAuth, getUserDashboardStats);

// Get detailed stats for a single short URL — sign-in required, and the
// controller additionally checks that the caller owns the link.
router.get('/:shortCode', requireAuth, getUrlAnalytics);

export default router;
