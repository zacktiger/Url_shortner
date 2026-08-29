import express from 'express';
import { getUrlAnalytics, getUserDashboardStats } from '../controllers/analyticsController.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Get summary stats for all URLs owned by logged-in user
router.get('/dashboard', requireAuth, getUserDashboardStats);

// Get detailed stats for a single short URL. Sign-in is optional here because
// anonymous links exist: the controller lets an unowned link's stats through to
// anyone holding the code, and keeps an owned link's stats to its owner.
router.get('/:shortCode', optionalAuth, getUrlAnalytics);

export default router;
