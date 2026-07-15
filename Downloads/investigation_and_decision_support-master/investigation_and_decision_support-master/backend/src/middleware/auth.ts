import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '../utils/enums';
import { db } from '../utils/db';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'ksp_crime_intel_secret_key_2026';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    badgeNumber: string;
    role: Role;
    districtId: string | null;
    policeStationId: string | null;
  };
}

export const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization token required' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedRequest['user'];
    req.user = decoded;
    next();
    return;
  } catch (error) {
    logger.error('JWT Verification failed', { error });
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
};

export const requireRoles = (allowedRoles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      // Create a warning audit log for unauthorized access attempts
      createAuditLog(
        req.user.id,
        req.user.badgeNumber,
        'UNAUTHORIZED_ACCESS_ATTEMPT',
        `User tried to access route restricted to roles: [${allowedRoles.join(', ')}]. Path: ${req.path}`,
        req
      );

      res.status(403).json({ 
        error: 'Forbidden: You do not have permissions to perform this action' 
      });
      return;
    }

    next();
    return;
  };
};

export const createAuditLog = async (
  userId: string | null,
  badge: string | null,
  action: string,
  details: string,
  req?: Request
) => {
  const ipAddress = req ? (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || null) : null;
  
  // Log to winston
  logger.info(`AUDIT: ${action} | Badge: ${badge} | Details: ${details}`, { ipAddress });

  // Log to database asynchronously so it doesn't block the request
  try {
    await db.auditLog.create({
      data: {
        userId,
        badge,
        action,
        details,
        ipAddress,
      },
    });
  } catch (dbError) {
    logger.error('Failed to save audit log to database', { error: dbError });
  }
};

