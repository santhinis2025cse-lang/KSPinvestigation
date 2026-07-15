'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MOCK_FIRS, MockFIR } from '../../utils/mockData';
import { 
  Briefcase, 
  Save, 
  Trash2, 
  FileText, 
  Link, 
  PlusCircle, 
  CheckCircle2, 
  Cpu, 
  Clock, 
  BookOpen, 
  Paperclip,
  Share2
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '../../utils/api';

export default function InvestigationWorkspace() {
  const { token, isDemoMode, user } = useAuth();
  
  const [pinnedCases, setPinnedCases] = useState<MockFIR[]>([MOCK_FIRS[0], MOCK_FIRS[1]]);
  const [notes, setNotes] = useState(
    '=== KSP Active Investigation Workspace ===\n\nOFFICER LOG - ' + new Date().toLocaleDateString() + '\n\n• Currently analyzing similarities between Koramangala Sony World robbery (FIR-2026-0045) and Indiranagar Burglary (FIR-2026-0056).\n• Getaway Bolero (KA-51-AB-9999) connects both zones.\n• Recommended Action: Deploy active patrol cars around Indiranagar 12th Main Road and Sony World Signal intersections.'
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isDemoMode) return;

    // Load active workspace details from backend
    const fetchWorkspace = async () => {
      try {
        const data = await apiFetch<any>('/api/workspace');
        setNotes(data.notes || notes);
        if (data.pinnedCases) {
          setPinnedCases(data.pinnedCases.map((p: any) => p.fir));
        }
      } catch (err) {
        console.warn('API error fetching workspace');
      }
    };

    fetchWorkspace();
  }, [isDemoMode, token]);

  const handleSaveNotes = async () => {
    setIsSaving(true);
    
    if (isDemoMode) {
      setTimeout(() => {
        setIsSaving(false);
        toast.success('Investigation notes autosaved locally.');
      }, 800);
      return;
    }

    try {
      await apiFetch('/api/workspace/notes', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes })
      });
      toast.success('Workspace notes synced to KSP Database.');
    } catch (err) {
      toast.error('Failed to sync notes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnpin = async (firId: string, firNum: string) => {
    setPinnedCases(prev => prev.filter(c => c.id !== firId));
    toast.success(`Case ${firNum} unpinned from workspace.`);

    if (isDemoMode) return;

    try {
      await apiFetch(`/api/workspace/pin/${firId}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Unpin failed');
    }
  };

  const triggerSimilarityCheck = () => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 1500)),
      {
        loading: 'AI similarity analysis comparing pinned case files...',
        success: 'AI Match Found (76% Correlation): getaway scooter colors and suspect modus operandi match Ramesh Kumar gang files.',
        error: 'AI process timed out'
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Active Investigation Canvas</h2>
          <p className="text-xs text-slate-500">Cross-reference pinned crime records, evidence manifests, and construct timeline analysis.</p>
        </div>
        <button
          onClick={triggerSimilarityCheck}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-xs font-semibold text-white rounded-lg transition"
        >
          <Cpu className="w-4 h-4" />
          <span>Run AI Cross-Case Comparison</span>
        </button>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Pinned Case cards comparison deck */}
        <div className="xl:col-span-2 space-y-6">
          <div className="glass-card rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-purple-400" />
                <h4 className="text-xs font-mono text-slate-400 uppercase tracking-widest font-semibold">
                  Pinned Case Files ({pinnedCases.length})
                </h4>
              </div>
            </div>

            {pinnedCases.length === 0 ? (
              <div className="py-16 text-center text-slate-600 text-xs font-mono">
                No active case files pinned. Open Crime Search to pin FIR targets.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pinnedCases.map(c => (
                  <div key={c.id} className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl space-y-3 relative overflow-hidden flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white font-mono">{c.firNumber}</span>
                        <button
                          onClick={() => handleUnpin(c.id, c.firNumber)}
                          className="p-1 text-slate-650 hover:text-rose-400 rounded transition"
                          title="Unpin Case"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-[10px] text-purple-400 font-bold uppercase mt-1">{c.category}</div>
                      <p className="text-xs text-slate-400 leading-relaxed mt-2 font-sans line-clamp-3">{c.summary}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-900/60 mt-3 flex items-center justify-between text-[9px] text-slate-500 font-mono">
                      <span>Station: {c.stationName}</span>
                      <span className="text-slate-350">{new Date(c.dateOfRegistration).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Evidence Manifest deck */}
          <div className="glass-card rounded-xl p-5 space-y-4">
            <h4 className="text-xs font-mono text-slate-400 uppercase tracking-widest font-semibold border-b border-slate-900 pb-2 flex items-center gap-1.5">
              <Paperclip className="w-4 h-4 text-purple-400" />
              <span>Evidence Ledger</span>
            </h4>

            <div className="space-y-2">
              {pinnedCases.flatMap(c => c.evidence.map(e => ({ ...e, firNum: c.firNumber }))).map((ev, idx) => (
                <div key={idx} className="p-3 bg-slate-950/30 border border-slate-900 rounded-lg flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{ev.description}</span>
                      <span className="text-[9px] font-mono bg-slate-900 px-1.5 py-0.5 rounded text-purple-400">
                        {ev.type}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">Storage Locker: {ev.storageLocation} • Serial: {ev.serialNumber}</p>
                  </div>
                  <span className="text-[9px] text-slate-600 font-mono uppercase">{ev.firNum}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Active Notes pad */}
        <div className="glass-card rounded-xl p-5 flex flex-col justify-between h-[65vh]">
          <div className="space-y-4 flex flex-col flex-1">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
              <div className="flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-purple-400" />
                <h4 className="text-xs font-mono text-slate-400 uppercase tracking-widest font-semibold">
                  Investigation Log
                </h4>
              </div>
              {isSaving && (
                <span className="text-[9px] font-mono text-emerald-400 font-bold animate-pulse uppercase">
                  AUTOSAVING...
                </span>
              )}
            </div>

            <textarea
              value={notes}
              onChange={e => {
                setNotes(e.target.value);
                // Trigger auto save simulation
                setIsSaving(true);
                const timer = setTimeout(() => setIsSaving(false), 600);
                return () => clearTimeout(timer);
              }}
              className="flex-1 w-full bg-[#111118]/80 border border-slate-850 rounded-xl p-3.5 text-xs text-slate-200 outline-none focus:border-purple-600 font-mono resize-none leading-relaxed"
              placeholder="Draft case correlates, evidence notes, and analysis..."
            />
          </div>

          <div className="pt-4 border-t border-slate-900 flex justify-between items-center mt-4">
            <span className="text-[9px] text-slate-500 font-mono">Assoc. Badge: {user?.badgeNumber}</span>
            <button
              onClick={handleSaveNotes}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-850 hover:border-slate-800 text-[10px] font-mono font-bold text-slate-350 hover:text-white uppercase rounded-md transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Session</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
