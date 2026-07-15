import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Validation schemas for all incoming request payloads.
 * Uses Zod to provide strict type-checking and sanitization.
 */

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').max(100),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
});

export const firSearchSchema = z.object({
  search: z.string().max(200).optional(),
  status: z.enum(['ACTIVE', 'PENDING', 'SOLVED', 'CLOSED', 'CHARGESHEETED']).optional(),
  category: z.string().max(50).optional(),
  district: z.string().max(50).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).max(1000).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const criminalSearchSchema = z.object({
  search: z.string().max(200).optional(),
  status: z.enum(['ACTIVE', 'IN_CUSTODY', 'ABSCONDING', 'DECEASED', 'ACQUITTED', 'PAROLE']).optional(),
  riskMin: z.coerce.number().int().min(0).max(100).optional(),
  riskMax: z.coerce.number().int().min(0).max(100).optional(),
  page: z.coerce.number().int().min(1).max(1000).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const chatSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long'),
  context: z.string().max(5000).optional(),
});

export const workspaceNoteSchema = z.object({
  content: z.string().max(50000, 'Note content too long'),
});

export const reportRequestSchema = z.object({
  type: z.enum(['FIR_SUMMARY', 'CRIMINAL_PROFILE', 'HOTSPOT_ANALYSIS', 'OFFICER_PERFORMANCE', 'DISTRICT_CRIME_REPORT']),
  id: z.string().uuid().optional(),
  districtId: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

/**
 * Generic request body validation middleware factory.
 * Usage: router.post('/route', validateBody(mySchema), handler)
 */
export const validateBody = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      logger.warn('Validation failure', { 
        path: req.path, 
        errors: result.error.flatten().fieldErrors 
      });
      res.status(400).json({
        error: 'Validation Error',
        details: result.error.flatten().fieldErrors,
      });
      return;
    }
    // Replace body with sanitized/coerced version
    req.body = result.data;
    next();
    return;
  };
};

/**
 * Generic query string validation middleware factory.
 * Usage: router.get('/route', validateQuery(mySchema), handler)
 */
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      logger.warn('Query validation failure', { 
        path: req.path, 
        errors: result.error.flatten().fieldErrors 
      });
      res.status(400).json({
        error: 'Query Validation Error',
        details: result.error.flatten().fieldErrors,
      });
      return;
    }
    req.query = result.data as any;
    next();
    return;
  };
};
