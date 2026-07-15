import express from 'express';
import { requireAuth } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimiter';
import { validateBody, chatSchema } from '../middleware/validation';
import { chatWithCopilot } from '../controllers/aiController';

const router = express.Router();

/**
 * @swagger
 * /api/ai/chat:
 *   post:
 *     summary: AI Investigation Copilot
 *     description: Submit a natural language query to the AI copilot. It searches the database for context and forwards enriched prompts to the LLM.
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Show me recent robbery cases in Koramangala"
 *               context:
 *                 type: string
 *                 description: Optional additional context
 *     responses:
 *       200:
 *         description: AI-generated response with case data and recommendations
 */
router.post('/chat', requireAuth, aiLimiter, validateBody(chatSchema), chatWithCopilot);

export default router;
