import { Router } from 'express';
import {
  trackVisit,
  trackPageView,
  updatePageView,
  trackEvent,
  getDashboardStats,
  getVisitDetails,
} from '../controllers/analyticsController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Public tracking endpoints (no auth required)
router.post('/visit', trackVisit);
router.post('/pageview', trackPageView);
router.post('/pageview/update', updatePageView);
router.post('/event', trackEvent);

// Admin endpoints
router.get('/dashboard', authMiddleware, getDashboardStats);
router.get('/visit/:visitId', authMiddleware, getVisitDetails);

export default router;
