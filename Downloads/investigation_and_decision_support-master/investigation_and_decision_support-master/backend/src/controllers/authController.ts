import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../utils/db';
import { createAuditLog } from '../middleware/auth';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'ksp_crime_intel_secret_key_2026';
const JWT_EXPIRES_IN = '12h';

export const login = async (req: Request, res: Response) => {
  const { badgeNumber, password } = req.body;

  if (!badgeNumber || !password) {
    return res.status(400).json({ error: 'Badge number and password are required' });
  }

  try {
    // Find user by badge number
    const user = await db.user.findUnique({
      where: { badgeNumber },
      include: {
        district: true,
        policeStation: true,
      },
    });

    if (!user) {
      logger.warn(`Failed login attempt for badge: ${badgeNumber} - User not found`);
      return res.status(401).json({ error: 'Invalid badge number or password' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      logger.warn(`Failed login attempt for badge: ${badgeNumber} - Invalid password`);
      return res.status(401).json({ error: 'Invalid badge number or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        badgeNumber: user.badgeNumber,
        role: user.role,
        districtId: user.districtId,
        policeStationId: user.policeStationId,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Create Audit Log for successful login
    await createAuditLog(
      user.id,
      user.badgeNumber,
      'USER_LOGIN_SUCCESS',
      `Officer ${user.name} logged in successfully as role ${user.role}`,
      req
    );

    // Exclude password hash from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userProfile } = user;

    return res.json({
      token,
      user: userProfile,
    });
  } catch (error) {
    logger.error('Error logging in user', { error });
    return res.status(500).json({ error: 'Internal Server Error during login' });
  }
};

export const getProfile = async (req: Request & { user?: any }, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const user = await db.user.findUnique({
      where: { id: req.user.id },
      include: {
        district: true,
        policeStation: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userProfile } = user;
    return res.json(userProfile);
  } catch (error) {
    logger.error('Error fetching profile', { error });
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
