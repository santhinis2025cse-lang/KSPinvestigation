import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../utils/db';
import { logger } from '../utils/logger';
import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const getDashboardSummary = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // 1. Gather status counts — live from DB
    const [totalCrimes, activeCases, solvedCases, pendingCases, repeatOffenders] = await Promise.all([
      db.fIR.count(),
      db.fIR.count({ where: { status: 'ACTIVE' } }),
      db.fIR.count({ where: { status: 'SOLVED' } }),
      db.fIR.count({ where: { status: 'PENDING' } }),
      db.criminal.count({ where: { riskScore: { gte: 70 } } }),
    ]);

    // 2. Category distribution — live from DB
    const categoryGroup = await db.fIR.groupBy({
      by: ['crimeCategoryId'],
      _count: { id: true },
    });
    const categoryNames = await db.crimeCategory.findMany();
    const categoryDistribution = categoryGroup.map(g => {
      const cat = categoryNames.find(c => c.id === g.crimeCategoryId);
      return {
        category: cat ? cat.name : 'Unknown',
        code: cat ? cat.code : 'UNKNOWN',
        count: g._count.id,
      };
    }).sort((a, b) => b.count - a.count);

    // 3. District comparison — live from DB
    const districtGroup = await db.fIR.groupBy({
      by: ['districtId'],
      _count: { id: true },
    });
    const districtNames = await db.district.findMany();
    const districtBreakdown = districtGroup
      .map(g => {
        const dist = districtNames.find(d => d.id === g.districtId);
        return {
          district: dist ? dist.name : 'Unknown',
          code: dist ? dist.code : 'UNKNOWN',
          count: g._count.id,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate high risk district
    const highRiskDistrict = districtBreakdown.length > 0 ? districtBreakdown[0].district : 'N/A';

    // 4. Monthly trend — aggregate from actual FIR dates
    const now = new Date();
    const monthlyTrend: { month: string; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const count = await db.fIR.count({
        where: {
          dateOfRegistration: { gte: d, lt: nextD },
        },
      });
      monthlyTrend.push({
        month: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
        count,
      });
    }

    // 5. Recent Alerts stream
    const recentAlerts = await db.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // 6. Recent Cases list
    const recentCases = await db.fIR.findMany({
      include: {
        policeStation: { select: { name: true } },
        crimeCategory: { select: { name: true } },
        district: { select: { name: true } },
      },
      orderBy: { dateOfRegistration: 'desc' },
      take: 6,
    });

    // 7. Crime rate change calculation
    const thisMonth = await db.fIR.count({
      where: {
        dateOfRegistration: {
          gte: new Date(now.getFullYear(), now.getMonth(), 1),
        },
      },
    });
    const lastMonth = await db.fIR.count({
      where: {
        dateOfRegistration: {
          gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          lt: new Date(now.getFullYear(), now.getMonth(), 1),
        },
      },
    });
    const crimeRateChange =
      lastMonth > 0
        ? `${((thisMonth - lastMonth) / lastMonth * 100).toFixed(1)}% MoM`
        : '+0.0% MoM';

    return res.json({
      cards: {
        totalCrimes,
        activeCases,
        solvedCases,
        pendingCases,
        repeatOffenders,
        highRiskDistrict,
        crimeRateChange,
      },
      charts: {
        monthlyTrend,
        categoryDistribution,
        districtBreakdown,
      },
      recentCases,
      recentAlerts,
    });
  } catch (error) {
    logger.error('Error fetching dashboard summary statistics', { error });
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getHotspots = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // Collect ALL case coordinates from DB
    const cases = await db.fIR.findMany({
      select: {
        id: true,
        firNumber: true,
        latitude: true,
        longitude: true,
        address: true,
        crimeCategory: { select: { name: true, code: true } },
        district: { select: { name: true } },
        status: true,
      },
      where: {
        latitude: { not: null },
        longitude: { not: null },
      },
    });

    // Build coordinate array for DBSCAN
    const coordinates = cases
      .filter(c => c.latitude && c.longitude)
      .map(c => ({
        lat: c.latitude as number,
        lng: c.longitude as number,
        weight: c.crimeCategory.code === 'HOMICIDE' ? 1.0 : 0.6,
      }));

    let aiHotspots: any[] = [];
    let aiClusterCount = 0;

    // Call FastAPI DBSCAN clustering if service is available
    try {
      const aiResponse = await axios.post(
        `${AI_SERVICE_URL}/api/ai/predict`,
        {
          coordinates,
          eps_meters: 800,
          min_samples: 3,
        },
        { timeout: 8000 }
      );

      const aiData = aiResponse.data as any;
      aiClusterCount = aiData.cluster_count || 0;

      // Map AI clusters into enriched hotspot objects
      aiHotspots = (aiData.hotspots || []).map((cluster: any, idx: number) => ({
        id: `ai-hotspot-${idx + 1}`,
        name: `Cluster Zone ${idx + 1}`,
        latitude: cluster.center.lat,
        longitude: cluster.center.lng,
        risk: cluster.risk_index,
        density: Math.round(cluster.incident_count * 8),
        radius: cluster.estimated_radius_meters,
        incidents: cluster.incident_count,
        primaryCrime: 'Multiple IPC Offences',
        notes: `AI-detected cluster with ${cluster.incident_count} linked incidents within ${cluster.estimated_radius_meters}m radius.`,
        aiGenerated: true,
      }));
    } catch (aiError) {
      // FastAPI not running — fall back gracefully with static known hotspots
      logger.warn('FastAPI AI service unavailable — using fallback static hotspot data');
      aiHotspots = [
        {
          id: 'hotspot-1',
          name: 'Koramangala 4th Block Circle',
          latitude: 12.9348,
          longitude: 77.6189,
          risk: 'HIGH',
          density: 85,
          radius: 350,
          incidents: 12,
          primaryCrime: 'Robbery & Chain Snatching',
          notes: 'Active time window: 22:00–03:00. Patrolling recommended.',
          aiGenerated: false,
        },
        {
          id: 'hotspot-2',
          name: 'Indiranagar 12th Main Hub',
          latitude: 12.9718,
          longitude: 77.6411,
          risk: 'HIGH',
          density: 92,
          radius: 400,
          incidents: 18,
          primaryCrime: 'House Breaking & Burglary',
          notes: 'Occurs primarily during holiday seasons.',
          aiGenerated: false,
        },
        {
          id: 'hotspot-3',
          name: 'Vidyanagar Commercial Zone',
          latitude: 15.3647,
          longitude: 75.1249,
          risk: 'MEDIUM',
          density: 64,
          radius: 300,
          incidents: 7,
          primaryCrime: 'Assault & Petty Theft',
          notes: 'Correlated with weekend public gatherings.',
          aiGenerated: false,
        },
        {
          id: 'hotspot-4',
          name: 'Mysuru Palace Road Cluster',
          latitude: 12.3052,
          longitude: 76.6551,
          risk: 'MEDIUM',
          density: 54,
          radius: 280,
          incidents: 9,
          primaryCrime: 'Pickpocketing & Tourist Robbery',
          notes: 'High tourist footfall. Seasonal spikes during Dasara.',
          aiGenerated: false,
        },
        {
          id: 'hotspot-5',
          name: 'Mangaluru Port Zone',
          latitude: 12.9141,
          longitude: 74.8560,
          risk: 'HIGH',
          density: 78,
          radius: 500,
          incidents: 15,
          primaryCrime: 'Drug Trafficking & Narcotics',
          notes: 'Smuggling corridor. Night patrol essential.',
          aiGenerated: false,
        },
      ];
    }

    // Heatmap points from all case coordinates
    const heatPoints = cases.map(c => ({
      lat: c.latitude,
      lng: c.longitude,
      weight: c.crimeCategory.code === 'HOMICIDE' ? 1.0 : 0.5,
      info: `${c.firNumber}: ${c.crimeCategory.name} at ${c.address}`,
    }));

    return res.json({
      hotspots: aiHotspots,
      heatPoints,
      metadata: {
        totalCasesAnalyzed: cases.length,
        aiClustersFound: aiClusterCount,
        source: aiClusterCount > 0 ? 'DBSCAN_AI' : 'STATIC_FALLBACK',
      },
    });
  } catch (error) {
    logger.error('Error fetching hotspot geospatial data', { error });
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
