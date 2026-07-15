import { Router, Response } from 'express';
import { requireAuth, requireRoles } from '../middleware/auth';
import { db } from '../utils/db';
import { logger } from '../utils/logger';
import { Role } from '../utils/enums';

const router = Router();

// Protect audit logs using auth and restricting to Admin roles
router.use(requireAuth as any);
router.use(requireRoles([Role.SYSTEM_ADMINISTRATOR, Role.SCRB_ADMINISTRATOR]) as any);

router.get('/', async (req, res: Response) => {
  const { page = 1, limit = 20, search } = req.query;

  try {
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {};

    if (search) {
      const searchStr = String(search);
      where.OR = [
        { badge: { contains: searchStr } },
        { action: { contains: searchStr } },
        { details: { contains: searchStr } },
      ];
    }

    const [logs, totalCount] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take,
      }),
      db.auditLog.count({ where }),
    ]);

    return res.json({
      data: logs,
      pagination: {
        page: Number(page),
        limit: take,
        totalCount,
        totalPages: Math.ceil(totalCount / take),
      },
    });
  } catch (error) {
    logger.error('Error fetching audit logs', { error });
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;


