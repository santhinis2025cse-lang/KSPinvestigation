import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../utils/db';
import { createAuditLog } from '../middleware/auth';
import { logger } from '../utils/logger';
import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const chatWithCopilot = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const { message, context } = req.body;

  try {
    // Build semantic context from DB — retrieve relevant FIRs, criminals
    const searchTerms = message.toLowerCase().split(' ').filter((w: string) => w.length > 3);

    // Parallel context fetch
    const [recentFIRs, matchedCriminals] = await Promise.all([
      db.fIR.findMany({
        where: {
          OR: searchTerms.length > 0
            ? searchTerms.map((term: string) => ({
                summary: { contains: term },
              }))
            : [{}],
        },
        include: {
          crimeCategory: { select: { name: true } },
          policeStation: { select: { name: true } },
          district: { select: { name: true } },
        },
        orderBy: { dateOfRegistration: 'desc' },
        take: 5,
      }),
      db.criminal.findMany({
        where: {
          OR: searchTerms.length > 0
            ? searchTerms.map((term: string) => ({
                name: { contains: term },
              }))
            : [{ riskScore: { gte: 70 } }],
        },
        orderBy: { riskScore: 'desc' },
        take: 3,
      }),
    ]);

    // Build enriched context string for AI
    const dbContext = [
      context ? `User Context: ${context}` : '',
      recentFIRs.length > 0
        ? `Recent Cases: ${recentFIRs
            .map(f => `[${f.firNumber}] ${f.crimeCategory.name} at ${f.policeStation.name} — ${f.summary?.substring(0, 100)}`)
            .join(' | ')}`
        : '',
      matchedCriminals.length > 0
        ? `Matched Criminals: ${matchedCriminals
            .map(c => `${c.name} (Risk: ${c.riskScore}%, Status: ${c.status})`)
            .join(' | ')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n');

    // Call FastAPI LLM/chat service
    const aiResponse = await axios.post(
      `${AI_SERVICE_URL}/api/ai/chat`,
      {
        message,
        context: dbContext,
        user_role: req.user.role,
        district: req.user.districtId,
      },
      { timeout: 15000 }
    );

    const aiData = aiResponse.data as any;

    // Enrich response with live DB records
    const enrichedResponse = {
      response: aiData.response,
      table:
        aiData.table && aiData.table.length > 0
          ? aiData.table
          : recentFIRs.map(f => ({
              fir: f.firNumber,
              station: f.policeStation.name,
              district: f.district?.name || '',
              category: f.crimeCategory.name,
              status: f.status,
            })),
      recommendations: aiData.recommendations || [],
      explainableAI: aiData.explainable_ai || null,
      relatedCases: recentFIRs.map(f => ({
        id: f.id,
        firNumber: f.firNumber,
        category: f.crimeCategory.name,
        station: f.policeStation.name,
      })),
      matchedCriminals: matchedCriminals.map(c => ({
        id: c.id,
        name: c.name,
        riskScore: c.riskScore,
        status: c.status,
      })),
    };

    await createAuditLog(
      req.user.id,
      req.user.badgeNumber,
      'AI_COPILOT_QUERY',
      `AI Copilot query: "${message.substring(0, 100)}"`,
      req
    );

    return res.json(enrichedResponse);
  } catch (error: any) {
    // If AI service is down or it's an axios connection failure, still return a meaningful response using DB data
    if (error.isAxiosError || (!error.response && error.config)) {
      logger.warn('FastAPI AI chat service unavailable — returning DB context only');

      const fallbackCases = await db.fIR.findMany({
        include: { crimeCategory: { select: { name: true } }, policeStation: { select: { name: true } } },
        orderBy: { dateOfRegistration: 'desc' },
        take: 4,
      });

      return res.json({
        response: `I've searched the database for "${message}" and found ${fallbackCases.length} relevant case records. The AI reasoning engine is currently offline — responses are based on direct database lookup.`,
        table: fallbackCases.map(f => ({
          fir: f.firNumber,
          station: f.policeStation.name,
          category: f.crimeCategory.name,
          status: f.status,
        })),
        recommendations: [
          'Try searching by specific FIR number for detailed case information.',
          'Filter criminals by risk score to prioritise investigations.',
        ],
        explainableAI: null,
        relatedCases: [],
        matchedCriminals: [],
        offline: true,
      });
    }

    logger.error('Error in AI copilot chat', { error });
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};


