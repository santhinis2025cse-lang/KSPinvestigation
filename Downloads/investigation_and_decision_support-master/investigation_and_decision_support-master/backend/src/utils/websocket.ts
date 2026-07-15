import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import { logger } from './logger';

interface AlertPayload {
  type: 'CRIME_SPIKE' | 'NEW_FIR' | 'SUSPECT_MATCH' | 'HOTSPOT_ALERT' | 'AI_RECOMMENDATION' | 'SYSTEM';
  title: string;
  message: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  data?: Record<string, unknown>;
  timestamp: string;
}

let wss: WebSocketServer | null = null;
const connectedClients = new Set<WebSocket>();

/**
 * Attach WebSocket server to an existing HTTP server instance.
 * Must be called once after the Express HTTP server starts.
 */
export const initWebSocket = (server: Server): void => {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req) => {
    const clientIp = req.socket.remoteAddress || 'unknown';
    logger.info(`WebSocket: Client connected from ${clientIp}. Total: ${connectedClients.size + 1}`);
    connectedClients.add(ws);

    // Send a welcome event on connect
    const welcome: AlertPayload = {
      type: 'SYSTEM',
      title: 'Connected to KSP Command Channel',
      message: 'Real-time alert channel is active. All critical events will be broadcast here.',
      severity: 'LOW',
      timestamp: new Date().toISOString(),
    };
    ws.send(JSON.stringify(welcome));

    ws.on('close', () => {
      connectedClients.delete(ws);
      logger.info(`WebSocket: Client disconnected. Remaining: ${connectedClients.size}`);
    });

    ws.on('error', (err) => {
      logger.error('WebSocket client error', { error: err.message });
      connectedClients.delete(ws);
    });
  });

  logger.info('✅ WebSocket server initialized at /ws');
};

/**
 * Broadcast an alert to ALL connected WebSocket clients.
 * Use this from any controller after a significant event.
 */
export const broadcastAlert = (payload: AlertPayload): void => {
  if (!wss) {
    logger.warn('WebSocket not initialized — cannot broadcast');
    return;
  }

  const message = JSON.stringify(payload);
  let sentCount = 0;

  connectedClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
      sentCount++;
    }
  });

  logger.debug(`WebSocket broadcast: ${payload.type} → ${sentCount} clients`);
};

/**
 * Send a crime spike alert when analytics detects unusual clustering.
 */
export const emitCrimeSpikeAlert = (district: string, crimeType: string, increase: number): void => {
  broadcastAlert({
    type: 'CRIME_SPIKE',
    title: `Crime Spike Detected — ${district}`,
    message: `${crimeType} incidents increased by ${increase}% in ${district}. Immediate patrol attention recommended.`,
    severity: increase > 30 ? 'HIGH' : 'MEDIUM',
    data: { district, crimeType, increase },
    timestamp: new Date().toISOString(),
  });
};

/**
 * Send a suspect match alert when AI detects cross-case links.
 */
export const emitSuspectMatchAlert = (suspectName: string, matchedCases: string[]): void => {
  broadcastAlert({
    type: 'SUSPECT_MATCH',
    title: `AI Suspect Match — ${suspectName}`,
    message: `Network analysis matched suspect "${suspectName}" across ${matchedCases.length} active cases: ${matchedCases.join(', ')}.`,
    severity: 'HIGH',
    data: { suspectName, matchedCases },
    timestamp: new Date().toISOString(),
  });
};

/**
 * Send a new FIR registration alert.
 */
export const emitNewFIRAlert = (firNumber: string, category: string, station: string): void => {
  broadcastAlert({
    type: 'NEW_FIR',
    title: `New FIR Registered — ${firNumber}`,
    message: `${category} case registered at ${station}.`,
    severity: category === 'Homicide' ? 'HIGH' : 'MEDIUM',
    data: { firNumber, category, station },
    timestamp: new Date().toISOString(),
  });
};

export const getConnectedClientCount = (): number => connectedClients.size;
