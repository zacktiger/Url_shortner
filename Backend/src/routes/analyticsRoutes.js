import express from 'express';
import { getUrlAnalytics, getUserDashboardStats } from '../controllers/analyticsController.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Get summary stats for all URLs owned by logged-in user
router.get('/dashboard', requireAuth, getUserDashboardStats);

// Get detailed stats for a single short URL (optionalAuth to verify owner check if private)
router.get('/:shortCode', optionalAuth, getUrlAnalytics);

export default router;
