import { Router } from 'express';
import { getDashboardSummary, getHotspots } from '../controllers/analyticsController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Secure all analytics routes
router.use(requireAuth as any);

router.get('/dashboard', getDashboardSummary as any);
router.get('/hotspots', getHotspots as any);

export default router;
