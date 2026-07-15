import { Router } from 'express';
import { getAllCriminals, getCriminalById, getCriminalNetwork } from '../controllers/criminalController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Protect all criminal investigation routes
router.use(requireAuth as any);

router.get('/', getAllCriminals as any);
router.get('/network', getCriminalNetwork as any);
router.get('/:id', getCriminalById as any);

export default router;
