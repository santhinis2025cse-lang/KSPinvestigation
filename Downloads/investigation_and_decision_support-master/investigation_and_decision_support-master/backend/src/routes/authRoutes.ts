import { Router } from 'express';
import { login, getProfile } from '../controllers/authController';
import { requireAuth } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { validateBody, loginSchema } from '../middleware/validation';

const router = Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with credentials
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: inspector@ksp.gov.in
 *               password:
 *                 type: string
 *                 example: Ksp@12345
 *     responses:
 *       200:
 *         description: JWT token and user profile
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', authLimiter, validateBody(loginSchema), login as any);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 */
router.get('/profile', requireAuth as any, getProfile as any);

export default router;

