import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../utils/db';
import { createAuditLog } from '../middleware/auth';
import { logger } from '../utils/logger';

export const getWorkspace = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // Find or create workspace for this user
    let workspace = await db.investigationWorkspace.findFirst({
      where: { userId: req.user.id },
      include: {
        pinnedCases: {
          include: {
            fir: {
              include: {
                policeStation: true,
                crimeCategory: true,
              },
            },
          },
        },
      },
    });

    if (!workspace) {
      workspace = await db.investigationWorkspace.create({
        data: {
          userId: req.user.id,
          notes: '=== KSP Investigation Workspace ===\nUse this canvas to cross-examine cases, correlate evidence, and draft investigations.',
        },
        include: {
          pinnedCases: {
            include: {
              fir: {
                include: {
                  policeStation: true,
                  crimeCategory: true,
                },
              },
            },
          },
        },
      });
    }

    return res.json(workspace);
  } catch (error) {
    logger.error('Error fetching workspace', { error });
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const pinCase = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const { firId } = req.body;

  if (!firId) {
    return res.status(400).json({ error: 'FIR ID is required to pin a case' });
  }

  try {
    // Find workspace
    let workspace = await db.investigationWorkspace.findFirst({
      where: { userId: req.user.id },
    });

    if (!workspace) {
      workspace = await db.investigationWorkspace.create({
        data: { userId: req.user.id },
      });
    }

    // Check if case is already pinned
    const existingPin = await db.pinnedCase.findFirst({
      where: {
        workspaceId: workspace.id,
        firId,
      },
    });

    if (existingPin) {
      return res.status(400).json({ error: 'Case is already pinned to this workspace' });
    }

    // Verify target case exists
    const fir = await db.fIR.findUnique({ where: { id: firId } });
    if (!fir) {
      return res.status(404).json({ error: 'Target case FIR not found' });
    }

    const pin = await db.pinnedCase.create({
      data: {
        workspaceId: workspace.id,
        firId,
      },
    });

    await createAuditLog(
      req.user.id,
      req.user.badgeNumber,
      'WORKSPACE_PIN_CASE',
      `Pinned case ${fir.firNumber} to active workspace (Pin ID: ${pin.id})`,
      req
    );

    return res.status(201).json(pin);
  } catch (error) {
    logger.error('Error pinning case to workspace', { error });
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const unpinCase = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const { firId } = req.params;

  try {
    const workspace = await db.investigationWorkspace.findFirst({
      where: { userId: req.user.id },
    });

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    const deleted = await db.pinnedCase.deleteMany({
      where: {
        workspaceId: workspace.id,
        firId,
      },
    });

    if (deleted.count === 0) {
      return res.status(404).json({ error: 'Case was not pinned in this workspace' });
    }

    // Lookup case number for log
    const fir = await db.fIR.findUnique({ where: { id: firId }, select: { firNumber: true } });

    await createAuditLog(
      req.user.id,
      req.user.badgeNumber,
      'WORKSPACE_UNPIN_CASE',
      `Unpinned case ${fir?.firNumber || firId} from workspace`,
      req
    );

    return res.json({ success: true, message: 'Case unpinned successfully' });
  } catch (error) {
    logger.error('Error unpinning case from workspace', { error });
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateNotes = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const { notes } = req.body;

  try {
    let workspace = await db.investigationWorkspace.findFirst({
      where: { userId: req.user.id },
    });

    if (!workspace) {
      workspace = await db.investigationWorkspace.create({
        data: { userId: req.user.id, notes },
      });
    } else {
      workspace = await db.investigationWorkspace.update({
        where: { id: workspace.id },
        data: { notes },
      });
    }

    // Do not flood audit logs for every single character save; log occasionally or skip for quiet edits.
    // Just log to debug uploader
    logger.debug(`Workspace notes autosaved for user ${req.user.badgeNumber}`);

    return res.json(workspace);
  } catch (error) {
    logger.error('Error updating workspace notes', { error });
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
