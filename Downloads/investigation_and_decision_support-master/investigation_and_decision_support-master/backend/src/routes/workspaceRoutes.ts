import { Router } from 'express';
import { getWorkspace, pinCase, unpinCase, updateNotes } from '../controllers/workspaceController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Secure all workspace routes
router.use(requireAuth as any);

router.get('/', getWorkspace as any);
router.post('/pin', pinCase as any);
router.delete('/pin/:firId', unpinCase as any);
router.patch('/notes', updateNotes as any);

export default router;
