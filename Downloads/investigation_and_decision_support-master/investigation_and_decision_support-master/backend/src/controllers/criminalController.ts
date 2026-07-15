import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../utils/db';
import { createAuditLog } from '../middleware/auth';
import { logger } from '../utils/logger';
import { CriminalStatus } from '../utils/enums';
import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const getAllCriminals = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const { search, riskMin, riskMax, status, page = 1, limit = 10 } = req.query;

  try {
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {};

    // District scoping for POLICE_OFFICER role
    if (req.user.role === 'POLICE_OFFICER' && req.user.districtId) {
      where.associations = {
        some: {
          fir: { districtId: req.user.districtId },
        },
      };
    }

    if (status) {
      where.status = status as CriminalStatus;
    }

    if (riskMin || riskMax) {
      where.riskScore = {};
      if (riskMin) where.riskScore.gte = Number(riskMin);
      if (riskMax) where.riskScore.lte = Number(riskMax);
    }

    if (search) {
      const searchStr = String(search);
      where.OR = [
        { name: { contains: searchStr } },
        { aliases: { contains: searchStr } },
        { aadhaarNumber: { contains: searchStr } },
      ];
    }

    const [criminals, totalCount] = await Promise.all([
      db.criminal.findMany({
        where,
        orderBy: { riskScore: 'desc' },
        skip,
        take,
        include: {
          vehicles: { select: { registrationNumber: true, make: true, model: true } },
          phones: { select: { phoneNumber: true } },
          _count: { select: { associations: true } },
        },
      }),
      db.criminal.count({ where }),
    ]);

    await createAuditLog(
      req.user.id,
      req.user.badgeNumber,
      'CRIMINAL_SEARCH',
      `Searched criminal records: query="${search || ''}", status="${status || ''}", risk="${riskMin || 0}-${riskMax || 100}". Found ${criminals.length} records.`,
      req
    );

    return res.json({
      data: criminals,
      pagination: {
        page: Number(page),
        limit: take,
        totalCount,
        totalPages: Math.ceil(totalCount / take),
      },
    });
  } catch (error) {
    logger.error('Error fetching criminals', { error });
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getCriminalById = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.params;

  try {
    const criminal = await db.criminal.findUnique({
      where: { id },
      include: {
        vehicles: true,
        phones: true,
        associations: {
          include: {
            fir: {
              include: {
                policeStation: true,
                crimeCategory: true,
                district: true,
              },
            },
          },
        },
        associates: {
          include: { associate: true },
        },
        associateOf: {
          include: { criminal: true },
        },
      },
    });

    if (!criminal) {
      return res.status(404).json({ error: 'Criminal profile record not found' });
    }

    // District isolation — POLICE_OFFICER can only view criminals linked to their district
    if (req.user.role === 'POLICE_OFFICER' && req.user.districtId) {
      const hasDistrictCase = criminal.associations.some(
        a => a.fir.districtId === req.user!.districtId
      );
      if (!hasDistrictCase) {
        return res.status(403).json({
          error: 'Access restricted — this criminal has no cases in your jurisdiction',
        });
      }
    }

    await createAuditLog(
      req.user.id,
      req.user.badgeNumber,
      'CRIMINAL_VIEW_PROFILE',
      `Viewed criminal profile: ${criminal.name} (Aadhaar: ${criminal.aadhaarNumber || 'N/A'})`,
      req
    );

    return res.json(criminal);
  } catch (error) {
    logger.error('Error fetching criminal profile', { error });
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getCriminalNetwork = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const [criminals, relations, cases, vehicles, phones, associations] = await Promise.all([
      db.criminal.findMany({ select: { id: true, name: true, riskScore: true, status: true } }),
      db.associateRelation.findMany(),
      db.fIR.findMany({ select: { id: true, firNumber: true, status: true, latitude: true, longitude: true } }),
      db.vehicle.findMany({ include: { criminals: { select: { id: true } }, cases: { select: { id: true } } } }),
      db.phone.findMany({ include: { criminals: { select: { id: true } }, cases: { select: { id: true } } } }),
      db.criminalFIRAssociation.findMany(),
    ]);

    // Build Nodes
    const nodes: any[] = [];
    const edges: any[] = [];

    criminals.forEach(c => {
      nodes.push({
        id: `criminal-${c.id}`,
        type: 'criminalNode',
        data: { label: c.name, riskScore: c.riskScore, status: c.status, type: 'CRIMINAL' },
      });
    });

    cases.forEach(f => {
      nodes.push({
        id: `case-${f.id}`,
        type: 'caseNode',
        data: { label: f.firNumber, status: f.status, type: 'CASE' },
      });
    });

    vehicles.forEach(v => {
      nodes.push({
        id: `vehicle-${v.id}`,
        type: 'vehicleNode',
        data: { label: v.registrationNumber, type: 'VEHICLE', desc: `${v.color} ${v.make} ${v.model}` },
      });
    });

    phones.forEach(p => {
      nodes.push({
        id: `phone-${p.id}`,
        type: 'phoneNode',
        data: { label: p.phoneNumber, type: 'PHONE', carrier: p.carrier },
      });
    });

    // Build Edges
    relations.forEach(r => {
      edges.push({
        id: `rel-${r.id}`,
        source: `criminal-${r.criminalId}`,
        target: `criminal-${r.associateId}`,
        label: r.relationType,
        animated: r.relationType === 'GANG_MEMBER',
      });
    });

    vehicles.forEach(v => {
      v.criminals.forEach(c => {
        edges.push({ id: `v-c-${v.id}-${c.id}`, source: `criminal-${c.id}`, target: `vehicle-${v.id}`, label: 'OWNS/DRIVES' });
      });
      v.cases.forEach(f => {
        edges.push({ id: `v-f-${v.id}-${f.id}`, source: `vehicle-${v.id}`, target: `case-${f.id}`, label: 'SPOTTED_NEAR', style: { stroke: '#EF4444' } });
      });
    });

    phones.forEach(p => {
      p.criminals.forEach(c => {
        edges.push({ id: `p-c-${p.id}-${c.id}`, source: `criminal-${c.id}`, target: `phone-${p.id}`, label: 'USES' });
      });
      p.cases.forEach(f => {
        edges.push({ id: `p-f-${p.id}-${f.id}`, source: `phone-${p.id}`, target: `case-${f.id}`, label: 'LINKED_CALL' });
      });
    });

    associations.forEach(a => {
      edges.push({
        id: `assoc-${a.id}`,
        source: `criminal-${a.criminalId}`,
        target: `case-${a.firId}`,
        label: a.role,
        style: { stroke: a.role === 'SUSPECT' ? '#EF4444' : '#F59E0B' },
      });
    });

    // --- FastAPI NetworkX Centrality Enhancement ---
    // Build edge array for NetworkX analysis
    const networkEdges = relations.map(r => ({
      source: `criminal-${r.criminalId}`,
      target: `criminal-${r.associateId}`,
      weight: 1.0,
    }));

    let centralityMap: Record<string, number> = {};

    if (networkEdges.length > 0) {
      try {
        const aiResponse = await axios.post(
          `${AI_SERVICE_URL}/api/ai/network`,
          { edges: networkEdges },
          { timeout: 8000 }
        );
        const aiData = aiResponse.data as any;
        // Build centrality lookup from AI response
        (aiData.centrality_ranking || []).forEach((entry: any) => {
          centralityMap[entry.node] = entry.centrality;
        });
        // Enhance criminal nodes with AI centrality scores
        nodes.forEach(node => {
          if (node.type === 'criminalNode' && centralityMap[node.id] !== undefined) {
            node.data.centrality = centralityMap[node.id];
            node.data.aiRanked = true;
          }
        });
      } catch (aiError) {
        logger.warn('FastAPI NetworkX service unavailable — centrality not computed');
      }
    }

    await createAuditLog(
      req.user.id,
      req.user.badgeNumber,
      'CRIMINAL_NETWORK_GRAPH',
      `Loaded Criminal Network Graph. ${nodes.length} nodes, ${edges.length} edges. AI centrality: ${Object.keys(centralityMap).length > 0 ? 'computed' : 'unavailable'}.`,
      req
    );

    return res.json({
      nodes,
      edges,
      metadata: {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        aiCentralityComputed: Object.keys(centralityMap).length > 0,
      },
    });
  } catch (error) {
    logger.error('Error generating criminal network graph', { error });
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};


