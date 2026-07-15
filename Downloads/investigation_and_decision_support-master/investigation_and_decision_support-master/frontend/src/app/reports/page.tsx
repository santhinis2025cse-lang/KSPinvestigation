'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FileText, Download, Printer, FileSpreadsheet, Cpu, FileCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function ReportsDesk() {
  const { user } = useAuth();
  const [reportType, setReportType] = useState('HOTSPOT_PREDICTION');
  const [district, setDistrict] = useState('BNG_CITY');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<any>(null);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedReport({
        id: `REP-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
        title: reportType.replace('_', ' ') + ' REPORT',
        classification: 'CONFIDENTIAL // KSP INTERNAL USE ONLY',
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
        generatedBy: user?.name || 'Crime Analyst',
        badge: user?.badgeNumber || 'AN-7731',
        sections: [
          { title: 'Executive Overview', content: 'This intelligence document aggregates KSP command-center inputs. Analytical forecasts indicate repeating crime patterns across targeted sub-divisions.' },
          { title: 'Anomalies Identified', content: 'Burglary incidents in East Division show a 25% MoM cluster hike. Modus operandi connects getaway vehicle KA-51-AB-9999 to two active robbery cases.' },
          { title: 'Tactical Deployment suggestions', content: 'Verify active warrant listings for Ramesh Kumar (wanted). Recommend nightbeat marshal saturation near Koramangala and HSR boundaries.' }
        ]
      });
      toast.success('Intelligence report compiled successfully.');
    }, 1200);
  };

  const handleExport = (format: string) => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 1000)),
      {
        loading: `Exporting document as ${format}...`,
        success: `Report downloaded successfully as ${format}.`,
        error: 'Export failed'
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">KSP Intelligence Reports Desk</h2>
        <p className="text-xs text-slate-500">Compile official crime briefings, predictive hotspot audits, and officer logs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Report compiler configuration */}
        <div className="glass-card rounded-xl p-5 space-y-4 h-fit">
          <h4 className="text-xs font-mono text-slate-400 uppercase tracking-widest font-semibold border-b border-slate-900 pb-2 flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span>Report Compiler</span>
          </h4>

          <div className="space-y-4 text-xs">
            {/* Report Type */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Classification Type</label>
              <select
                value={reportType}
                onChange={e => setReportType(e.target.value)}
                className="w-full bg-[#111118]/80 border border-slate-850 rounded-lg py-2.5 px-3 text-slate-300 focus:outline-none focus:border-purple-600 cursor-pointer"
              >
                <option value="HOTSPOT_PREDICTION">AI Hotspot Projections</option>
                <option value="DAILY_OCCURRENCE">Daily Crime Occurrence Report</option>
                <option value="WEEKLY_ANALYTICS">Weekly Trend Analysis</option>
                <option value="OFFICER_PERFORMANCE">Officer Dispatch Performance</option>
              </select>
            </div>

            {/* Jurisdiction */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Select division</label>
              <select
                value={district}
                onChange={e => setDistrict(e.target.value)}
                className="w-full bg-[#111118]/80 border border-slate-850 rounded-lg py-2.5 px-3 text-slate-300 focus:outline-none focus:border-purple-600 cursor-pointer"
              >
                <option value="BNG_CITY">Bengaluru City</option>
                <option value="MYS_DIST">Mysuru Division</option>
                <option value="MNG_CITY">Mangaluru City</option>
                <option value="HUB_DHA">Hubballi-Dharwad</option>
              </select>
            </div>

            {/* Generate Trigger */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900 text-white font-semibold text-xs py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 mt-4 uppercase tracking-wider"
            >
              {isGenerating ? 'Compiling KSP Indices...' : 'Compile Document'}
            </button>
          </div>
        </div>

        {/* Right column: generated document preview layout */}
        <div className="lg:col-span-2 space-y-4">
          {generatedReport ? (
            <div className="space-y-4">
              {/* Document actions header bar */}
              <div className="flex items-center justify-end gap-2 bg-[#111118] border border-slate-850 rounded-xl p-2.5 text-xs">
                <button
                  onClick={() => handleExport('PDF')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-750 text-[10px] font-mono font-bold text-slate-350 hover:text-white uppercase rounded-md transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => handleExport('EXCEL')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-750 text-[10px] font-mono font-bold text-slate-350 hover:text-white uppercase rounded-md transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel CSV</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-750 text-[10px] font-mono font-bold text-slate-350 hover:text-white uppercase rounded-md transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
              </div>

              {/* Printable glass report */}
              <div className="glass-card rounded-xl p-8 space-y-6 relative overflow-hidden print:bg-white print:text-black">
                {/* Header branding info */}
                <div className="border-b border-slate-900/60 pb-5 text-center space-y-1 relative">
                  <h1 className="text-sm font-bold text-white tracking-widest uppercase">KARNATAKA STATE POLICE COMMAND CENTRE</h1>
                  <h2 className="text-[10px] text-purple-400 font-mono tracking-widest font-bold uppercase">{generatedReport.title}</h2>
                  
                  <div className="grid grid-cols-2 text-left text-[9px] font-mono text-slate-500 pt-4">
                    <div>
                      <p>REPORT ID: <span className="text-slate-300 font-semibold">{generatedReport.id}</span></p>
                      <p>DATE COMPILED: <span className="text-slate-300 font-semibold">{generatedReport.date}</span></p>
                    </div>
                    <div className="text-right">
                      <p>BADGE SIGN: <span className="text-slate-300 font-semibold">{generatedReport.badge}</span></p>
                      <p>COMPILER: <span className="text-slate-300 font-semibold">{generatedReport.generatedBy}</span></p>
                    </div>
                  </div>

                  <span className="absolute top-0 right-0 text-[8px] font-mono text-rose-500 font-semibold border border-rose-950/60 bg-rose-950/20 px-1.5 py-0.5 rounded">
                    {generatedReport.classification}
                  </span>
                </div>

                {/* Content Sections */}
                <div className="space-y-5 text-xs leading-relaxed">
                  {generatedReport.sections.map((sec: any, idx: number) => (
                    <div key={idx} className="space-y-1.5">
                      <h3 className="font-bold text-white font-mono uppercase tracking-wider text-[10px] border-l-2 border-purple-500 pl-2">
                        {sec.title}
                      </h3>
                      <p className="text-slate-350 leading-relaxed font-sans">{sec.content}</p>
                    </div>
                  ))}
                </div>

                {/* Sign off */}
                <div className="pt-8 border-t border-slate-900/50 flex justify-between items-center text-[8px] font-mono text-slate-650">
                  <span>CONFIDENTIALITY PROTOCOL SECURED BY KSP GATEWAY CLIENT</span>
                  <span>PAGE 1 OF 1</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-xl p-12 text-center h-[50vh] flex flex-col items-center justify-center border border-dashed border-slate-800">
              <FileCheck className="w-8 h-8 text-slate-700 mb-3 animate-pulse" />
              <p className="text-xs text-slate-500 font-mono">Select parameters and click &quot;Compile Document&quot; to inspect reports.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
