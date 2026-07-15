import PDFDocument from 'pdfkit';
import { Response } from 'express';

interface FIRData {
  firNumber: string;
  status: string;
  dateOfRegistration: Date | string;
  dateOfOffence: Date | string;
  summary: string;
  address: string;
  complainantName: string;
  complainantPhone: string;
  latitude?: number | null;
  longitude?: number | null;
  policeStation?: { name: string };
  district?: { name: string };
  crimeCategory?: { name: string; code: string };
  suspects?: Array<{
    criminal?: { name: string; riskScore: number; status: string };
    role: string;
    arrestStatus: string;
  }>;
  evidence?: Array<{
    type: string;
    description: string;
    storageLocation: string;
    serialNumber?: string;
    collectedBy: string;
  }>;
  timeline?: Array<{
    action: string;
    description: string;
    performedByName: string;
    createdAt: Date | string;
  }>;
}

const KSP_COLORS = {
  navy: '#1a237e',
  gold: '#f57f17',
  darkGray: '#37474f',
  lightGray: '#eceff1',
  red: '#b71c1c',
  green: '#1b5e20',
};

/**
 * Stream a professionally formatted KSP FIR PDF report directly to the HTTP response.
 * Uses PDFKit to generate a police-grade document with official headers and classifications.
 */
export const generateFIRPDF = (firData: FIRData, res: Response): void => {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 60, bottom: 60, left: 60, right: 60 },
    info: {
      Title: `KSP FIR Report — ${firData.firNumber}`,
      Author: 'Karnataka State Police — Crime Intelligence Platform',
      Subject: `First Information Report ${firData.firNumber}`,
      Keywords: 'KSP, FIR, Police Report, Karnataka',
    },
  });

  // Pipe directly to HTTP response
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="KSP_FIR_${firData.firNumber}.pdf"`);
  doc.pipe(res);

  // ── HEADER ─────────────────────────────────────────────────────────────────
  // Navy header bar
  doc.rect(0, 0, doc.page.width, 100).fill(KSP_COLORS.navy);

  // KSP Title
  doc
    .fillColor('white')
    .font('Helvetica-Bold')
    .fontSize(18)
    .text('KARNATAKA STATE POLICE', 60, 22, { align: 'center' });

  doc
    .fontSize(11)
    .text('CRIME INTELLIGENCE PLATFORM — OFFICIAL DOCUMENT', 60, 46, { align: 'center' });

  doc
    .fontSize(9)
    .text('RESTRICTED — FOR AUTHORISED LAW ENFORCEMENT USE ONLY', 60, 64, { align: 'center' });

  // Gold accent line
  doc.rect(0, 100, doc.page.width, 4).fill(KSP_COLORS.gold);

  // ── DOCUMENT CLASSIFICATION ─────────────────────────────────────────────────
  doc.moveDown(1);
  doc.rect(60, 118, doc.page.width - 120, 28).fill(KSP_COLORS.lightGray);
  doc
    .fillColor(KSP_COLORS.red)
    .font('Helvetica-Bold')
    .fontSize(10)
    .text('CLASSIFICATION: LAW ENFORCEMENT SENSITIVE', 60, 127, { align: 'center' });

  // ── FIR TITLE BLOCK ─────────────────────────────────────────────────────────
  doc.moveDown(2);
  doc
    .fillColor(KSP_COLORS.navy)
    .font('Helvetica-Bold')
    .fontSize(14)
    .text('FIRST INFORMATION REPORT (FIR)', { align: 'center' });

  doc.moveDown(0.3);
  doc
    .fillColor(KSP_COLORS.darkGray)
    .font('Helvetica')
    .fontSize(10)
    .text(`FIR Number: ${firData.firNumber}  |  Status: ${firData.status}`, { align: 'center' });

  doc.moveDown(1.5);

  // ── SECTION HELPER ───────────────────────────────────────────────────────────
  const sectionHeader = (title: string) => {
    doc.moveDown(0.5);
    doc.rect(60, doc.y, doc.page.width - 120, 20).fill(KSP_COLORS.navy);
    doc
      .fillColor('white')
      .font('Helvetica-Bold')
      .fontSize(9)
      .text(title, 68, doc.y - 14);
    doc.moveDown(0.8);
  };

  const field = (label: string, value: string | null | undefined) => {
    doc
      .fillColor(KSP_COLORS.darkGray)
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .text(`${label}: `, { continued: true })
      .font('Helvetica')
      .fillColor('#212121')
      .text(value || 'N/A');
  };

  // ── SECTION 1: CASE DETAILS ─────────────────────────────────────────────────
  sectionHeader('1. CASE REGISTRATION DETAILS');
  field('FIR Number', firData.firNumber);
  field('Police Station', firData.policeStation?.name || 'N/A');
  field('District', firData.district?.name || 'N/A');
  field('Crime Category', firData.crimeCategory?.name || 'N/A');
  field('IPC/BNS Code', firData.crimeCategory?.code || 'N/A');
  field('Case Status', firData.status);
  field('Date of Registration', new Date(firData.dateOfRegistration).toLocaleString('en-IN'));
  field('Date of Offence', new Date(firData.dateOfOffence).toLocaleString('en-IN'));
  field('Location of Offence', firData.address || 'N/A');
  if (firData.latitude && firData.longitude) {
    field('GPS Coordinates', `${firData.latitude.toFixed(5)}°N, ${firData.longitude.toFixed(5)}°E`);
  }

  // ── SECTION 2: COMPLAINANT ────────────────────────────────────────────────
  sectionHeader('2. COMPLAINANT / VICTIM DETAILS');
  field('Complainant Name', firData.complainantName);
  field('Contact Number', firData.complainantPhone);

  // ── SECTION 3: SUMMARY ───────────────────────────────────────────────────────
  sectionHeader('3. INCIDENT NARRATIVE');
  doc
    .fillColor('#212121')
    .font('Helvetica')
    .fontSize(8.5)
    .text(firData.summary || 'No summary provided.', { align: 'justify', lineGap: 3 });
  doc.moveDown(0.5);

  // ── SECTION 4: SUSPECTS ─────────────────────────────────────────────────────
  if (firData.suspects && firData.suspects.length > 0) {
    sectionHeader('4. SUSPECTS & ACCUSED');
    firData.suspects.forEach((s, idx) => {
      doc
        .fillColor(KSP_COLORS.darkGray)
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .text(`Suspect ${idx + 1}: ${s.criminal?.name || 'Unknown'}`)
        .font('Helvetica')
        .fillColor('#212121')
        .text(`  Role: ${s.role}  |  Arrest Status: ${s.arrestStatus}  |  Risk Score: ${s.criminal?.riskScore || 'N/A'}%`);
      doc.moveDown(0.3);
    });
  }

  // ── SECTION 5: EVIDENCE ───────────────────────────────────────────────────────
  if (firData.evidence && firData.evidence.length > 0) {
    sectionHeader('5. EVIDENCE INVENTORY');
    firData.evidence.forEach((e, idx) => {
      doc
        .fillColor(KSP_COLORS.darkGray)
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .text(`[${idx + 1}] ${e.type} — ${e.serialNumber || 'No Serial'}`)
        .font('Helvetica')
        .fillColor('#212121')
        .text(`  ${e.description}`)
        .text(`  Storage: ${e.storageLocation}  |  Collected by: ${e.collectedBy}`);
      doc.moveDown(0.3);
    });
  }

  // ── SECTION 6: INVESTIGATION TIMELINE ─────────────────────────────────────────
  if (firData.timeline && firData.timeline.length > 0) {
    sectionHeader('6. INVESTIGATION TIMELINE');
    firData.timeline.forEach((t) => {
      doc
        .fillColor(KSP_COLORS.darkGray)
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .text(`▸ ${t.action}  (${new Date(t.createdAt).toLocaleString('en-IN')})`)
        .font('Helvetica')
        .fillColor('#212121')
        .text(`  ${t.description}`)
        .text(`  Officer: ${t.performedByName}`);
      doc.moveDown(0.3);
    });
  }

  // ── FOOTER ──────────────────────────────────────────────────────────────────
  const bottomY = doc.page.height - 70;
  doc.rect(0, bottomY, doc.page.width, 2).fill(KSP_COLORS.gold);
  doc
    .fillColor(KSP_COLORS.darkGray)
    .font('Helvetica')
    .fontSize(7.5)
    .text(
      `Generated by KSP Crime Intelligence Platform  |  ${new Date().toLocaleString('en-IN')}  |  Authorised use only — Karnataka State Police`,
      60,
      bottomY + 8,
      { align: 'center' }
    );

  doc.end();
};

interface CriminalData {
  name: string;
  aliases?: string | null;
  aadhaarNumber?: string | null;
  dateOfBirth?: Date | string | null;
  gender?: string | null;
  riskScore: number;
  status: string;
  vehicles?: Array<{ registrationNumber: string; make: string; model: string; color: string }>;
  phones?: Array<{ phoneNumber: string; carrier: string }>;
  associations?: Array<{
    role: string;
    arrestStatus: string;
    fir: { firNumber: string; crimeCategory: { name: string }; policeStation: { name: string } };
  }>;
}

/**
 * Stream a Criminal Dossier PDF to the HTTP response.
 */
export const generateCriminalPDF = (data: CriminalData, res: Response): void => {
  const doc = new PDFDocument({ size: 'A4', margins: { top: 60, bottom: 60, left: 60, right: 60 } });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="KSP_CRIMINAL_${data.name.replace(/\s+/g, '_')}.pdf"`);
  doc.pipe(res);

  // Header
  doc.rect(0, 0, doc.page.width, 90).fill(KSP_COLORS.navy);
  doc.fillColor('white').font('Helvetica-Bold').fontSize(16).text('KARNATAKA STATE POLICE', 60, 20, { align: 'center' });
  doc.fontSize(10).text('CRIMINAL INTELLIGENCE DOSSIER — RESTRICTED', 60, 44, { align: 'center' });
  doc.rect(0, 90, doc.page.width, 4).fill(KSP_COLORS.gold);

  doc.moveDown(2);
  doc.fillColor(KSP_COLORS.navy).font('Helvetica-Bold').fontSize(13).text(data.name.toUpperCase(), { align: 'center' });
  doc.fillColor(KSP_COLORS.red).font('Helvetica').fontSize(10).text(`RISK LEVEL: ${data.riskScore >= 80 ? 'EXTREME' : data.riskScore >= 60 ? 'HIGH' : 'MODERATE'} (${data.riskScore}%)`, { align: 'center' });
  doc.moveDown(1);

  const field = (label: string, value: string | null | undefined) => {
    doc.fillColor(KSP_COLORS.darkGray).font('Helvetica-Bold').fontSize(8.5).text(`${label}: `, { continued: true }).font('Helvetica').fillColor('#212121').text(value || 'N/A');
  };

  doc.fillColor(KSP_COLORS.navy).font('Helvetica-Bold').fontSize(9).text('PERSONAL DETAILS');
  doc.rect(60, doc.y, doc.page.width - 120, 1).fill(KSP_COLORS.navy);
  doc.moveDown(0.5);
  field('Aliases / Monikers', data.aliases);
  field('Aadhaar Number (Simulated)', data.aadhaarNumber);
  field('Date of Birth', data.dateOfBirth ? new Date(data.dateOfBirth).toLocaleDateString('en-IN') : 'N/A');
  field('Gender', data.gender);
  field('Current Status', data.status);
  field('Risk Score', `${data.riskScore} / 100`);
  doc.moveDown(1);

  if (data.vehicles && data.vehicles.length > 0) {
    doc.fillColor(KSP_COLORS.navy).font('Helvetica-Bold').fontSize(9).text('ASSOCIATED VEHICLES');
    doc.rect(60, doc.y, doc.page.width - 120, 1).fill(KSP_COLORS.navy);
    doc.moveDown(0.5);
    data.vehicles.forEach(v => {
      doc.fillColor('#212121').font('Helvetica').fontSize(8.5).text(`• ${v.registrationNumber} — ${v.color} ${v.make} ${v.model}`);
    });
    doc.moveDown(1);
  }

  if (data.associations && data.associations.length > 0) {
    doc.fillColor(KSP_COLORS.navy).font('Helvetica-Bold').fontSize(9).text('CASE INVOLVEMENT HISTORY');
    doc.rect(60, doc.y, doc.page.width - 120, 1).fill(KSP_COLORS.navy);
    doc.moveDown(0.5);
    data.associations.forEach(a => {
      doc.fillColor('#212121').font('Helvetica').fontSize(8.5)
        .text(`• [${a.fir.firNumber}] ${a.fir.crimeCategory.name} at ${a.fir.policeStation.name} — Role: ${a.role}, Arrest: ${a.arrestStatus}`);
    });
  }

  const bottomY = doc.page.height - 70;
  doc.rect(0, bottomY, doc.page.width, 2).fill(KSP_COLORS.gold);
  doc.fillColor(KSP_COLORS.darkGray).font('Helvetica').fontSize(7.5)
    .text(`Generated by KSP Crime Intelligence Platform  |  ${new Date().toLocaleString('en-IN')}  |  RESTRICTED`, 60, bottomY + 8, { align: 'center' });

  doc.end();
};
