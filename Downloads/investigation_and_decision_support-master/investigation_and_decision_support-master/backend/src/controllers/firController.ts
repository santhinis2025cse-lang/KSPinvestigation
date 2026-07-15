import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../utils/db';
import { createAuditLog } from '../middleware/auth';
import { logger } from '../utils/logger';
import { FIRStatus } from '../utils/enums';
import { generateFIRPDF } from '../utils/pdfGenerator';
import { emitNewFIRAlert } from '../utils/websocket';

export const getAllFIRs = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const {
    search,
    districtId,
    policeStationId,
    status,
    categoryId,
    startDate,
    endDate,
    page = 1,
    limit = 10,
  } = req.query;

  try {
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Build query conditions
    const where: any = {};

    if (districtId) where.districtId = String(districtId);
    if (policeStationId) where.policeStationId = String(policeStationId);
    if (status) where.status = status as FIRStatus;
    if (categoryId) where.crimeCategoryId = String(categoryId);

    // Date range filtering
    if (startDate || endDate) {
      where.dateOfOffence = {};
      if (startDate) where.dateOfOffence.gte = new Date(String(startDate));
      if (endDate) where.dateOfOffence.lte = new Date(String(endDate));
    }

    // Search filter across summary, firNumber, complainant name
    if (search) {
      const searchStr = String(search);
      where.OR = [
        { firNumber: { contains: searchStr } },
        { summary: { contains: searchStr } },
        { complainantName: { contains: searchStr } },
        { address: { contains: searchStr } },
      ];
    }

    // Role-based scoping: Police officers may only see cases within their station or district
    if (req.user.role === 'POLICE_OFFICER' && req.user.policeStationId) {
      where.policeStationId = req.user.policeStationId;
    }

    // Fetch records
    const [firs, totalCount] = await Promise.all([
      db.fIR.findMany({
        where,
        include: {
          policeStation: { select: { name: true, code: true } },
          district: { select: { name: true, code: true } },
          crimeCategory: { select: { name: true, code: true } },
          suspects: {
            include: {
              criminal: { select: { name: true, riskScore: true } },
            },
          },
        },
        orderBy: { dateOfRegistration: 'desc' },
        skip,
        take,
      }),
      db.fIR.count({ where }),
    ]);

    // Audit Log the search query
    await createAuditLog(
      req.user.id,
      req.user.badgeNumber,
      'FIR_SEARCH',
      `Searched cases with criteria: search="${search || ''}", district="${districtId || ''}", station="${policeStationId || ''}", status="${status || ''}". Returned ${firs.length} of ${totalCount} results.`,
      req
    );

    return res.json({
      data: firs,
      pagination: {
        page: Number(page),
        limit: take,
        totalCount,
        totalPages: Math.ceil(totalCount / take),
      },
    });
  } catch (error) {
    logger.error('Error fetching FIR list', { error });
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getFIRById = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.params;

  try {
    const fir = await db.fIR.findUnique({
      where: { id },
      include: {
        policeStation: true,
        district: true,
        crimeCategory: true,
        suspects: {
          include: {
            criminal: true,
          },
        },
        evidence: true,
        vehicles: true,
        phones: true,
        timeline: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!fir) {
      return res.status(404).json({ error: 'FIR case file not found' });
    }

    // Role-based access validation
    if (req.user.role === 'POLICE_OFFICER' && req.user.policeStationId && fir.policeStationId !== req.user.policeStationId) {
      return res.status(403).json({ error: 'Access denied: Case is outside your police station jurisdiction.' });
    }

    // Audit Log viewing detailed file
    await createAuditLog(
      req.user.id,
      req.user.badgeNumber,
      'FIR_VIEW_DETAILS',
      `Viewed case details for FIR: ${fir.firNumber} (ID: ${fir.id})`,
      req
    );

    return res.json(fir);
  } catch (error) {
    logger.error('Error fetching FIR details', { error });
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createFIR = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const {
    firNumber,
    policeStationId,
    crimeCategoryId,
    dateOfOffence,
    summary,
    latitude,
    longitude,
    address,
    complainantName,
    complainantPhone,
    suspectIds = [], // Array of { id: string, role: 'SUSPECT' | 'ACCOMPLICE' }
  } = req.body;

  if (!firNumber || !policeStationId || !crimeCategoryId || !dateOfOffence || !summary || !latitude || !longitude || !address) {
    return res.status(400).json({ error: 'Missing required FIR parameters' });
  }

  try {
    // Lookup the police station to ensure it exists and get the district ID
    const station = await db.policeStation.findUnique({
      where: { id: policeStationId },
    });

    if (!station) {
      return res.status(400).json({ error: 'Invalid police station specified' });
    }

    // Create the case file
    const newFIR = await db.fIR.create({
      data: {
        firNumber,
        policeStationId,
        districtId: station.districtId,
        crimeCategoryId,
        dateOfOffence: new Date(dateOfOffence),
        summary,
        latitude: Number(latitude),
        longitude: Number(longitude),
        address,
        complainantName,
        complainantPhone,
        status: FIRStatus.PENDING,
        timeline: {
          create: {
            action: 'FIR REGISTERED',
            description: `FIR registered successfully by Officer ${req.user.name} (Badge: ${req.user.badgeNumber}).`,
            performedBy: req.user.badgeNumber,
            performedByName: req.user.name,
          },
        },
      },
    });

    // Create suspect associations
    if (suspectIds && suspectIds.length > 0) {
      for (const suspect of suspectIds) {
        await db.criminalFIRAssociation.create({
          data: {
            firId: newFIR.id,
            criminalId: suspect.id,
            role: suspect.role || 'SUSPECT',
            arrestStatus: 'WANTED',
          },
        });
      }
    }

    await createAuditLog(
      req.user.id,
      req.user.badgeNumber,
      'FIR_CREATE',
      `Registered new FIR: ${newFIR.firNumber} under Station ${station.name}`,
      req
    );

    // Broadcast real-time WebSocket alert
    try {
      const category = await db.crimeCategory.findUnique({ where: { id: crimeCategoryId } });
      emitNewFIRAlert(newFIR.firNumber, category?.name || 'Unknown', station.name);
    } catch (_) {}

    return res.status(201).json(newFIR);
  } catch (error: any) {
    logger.error('Error creating FIR', { error });
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'An FIR with this FIR Number already exists.' });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateFIRStatus = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.params;
  const { status, notes } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  try {
    const fir = await db.fIR.findUnique({ where: { id } });
    if (!fir) {
      return res.status(404).json({ error: 'FIR case not found' });
    }

    const updated = await db.fIR.update({
      where: { id },
      data: {
        status: status as FIRStatus,
        timeline: {
          create: {
            action: `STATUS UPDATED TO ${status}`,
            description: notes || `Case file status changed from ${fir.status} to ${status} by ${req.user.name}.`,
            performedBy: req.user.badgeNumber,
            performedByName: req.user.name,
          },
        },
      },
    });

    await createAuditLog(
      req.user.id,
      req.user.badgeNumber,
      'FIR_STATUS_UPDATE',
      `Updated status of FIR: ${fir.firNumber} to ${status}. Notes: ${notes || 'none'}`,
      req
    );

    return res.json(updated);
  } catch (error) {
    logger.error('Error updating FIR status', { error });
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const addTimelineActivity = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.params;
  const { action, description } = req.body;

  if (!action || !description) {
    return res.status(400).json({ error: 'Action header and description are required' });
  }

  try {
    const fir = await db.fIR.findUnique({ where: { id } });
    if (!fir) {
      return res.status(404).json({ error: 'FIR case not found' });
    }

    const newActivity = await db.caseActivity.create({
      data: {
        firId: id,
        action,
        description,
        performedBy: req.user.badgeNumber,
        performedByName: req.user.name,
      },
    });

    await createAuditLog(
      req.user.id,
      req.user.badgeNumber,
      'FIR_TIMELINE_ADD',
      `Added activity "${action}" to case ${fir.firNumber}`,
      req
    );

    return res.status(201).json(newActivity);
  } catch (error) {
    logger.error('Error adding case timeline activity', { error });
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const exportFIRReport = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.params;
  const { format = 'pdf' } = req.query;

  try {
    const fir = await db.fIR.findUnique({
      where: { id },
      include: {
        policeStation: true,
        district: true,
        crimeCategory: true,
        suspects: { include: { criminal: true } },
        evidence: true,
        vehicles: true,
        timeline: { orderBy: { timestamp: 'asc' } },
      },
    });

    if (!fir) return res.status(404).json({ error: 'FIR case file not found' });

    // Audit log the export request
    await createAuditLog(
      req.user.id,
      req.user.badgeNumber,
      'FIR_REPORT_EXPORT',
      `Exported official PDF for FIR ${fir.firNumber}`,
      req
    );

    if (format === 'pdf') {
      // Stream the real PDFKit-generated FIR document
      generateFIRPDF(fir as any, res);
      return;
    }

    // JSON format fallback for API consumers
    return res.json({
      success: true,
      firNumber: fir.firNumber,
      exportedAt: new Date().toISOString(),
      data: fir,
    });
  } catch (error) {
    logger.error('Error exporting FIR report', { error });
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Wire new FIR WebSocket alert when a case is created
export const createFIRAndAlert = async (req: AuthenticatedRequest, res: Response) => {
  // Delegate to createFIR, then broadcast
  const result = await createFIR(req, res);
  return result;
};


