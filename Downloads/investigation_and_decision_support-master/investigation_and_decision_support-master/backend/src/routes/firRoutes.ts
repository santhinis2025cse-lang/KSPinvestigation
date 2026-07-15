import { Router } from 'express';
import { 
  getAllFIRs, 
  getFIRById, 
  createFIR, 
  updateFIRStatus, 
  addTimelineActivity, 
  exportFIRReport 
} from '../controllers/firController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Secure all endpoints with authentication
router.use(requireAuth as any);

router.get('/', getAllFIRs as any);
router.get('/:id', getFIRById as any);
router.post('/', createFIR as any);
router.patch('/:id/status', updateFIRStatus as any);
router.post('/:id/timeline', addTimelineActivity as any);
router.get('/:id/export', exportFIRReport as any);

export default router;
