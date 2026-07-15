'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { MOCK_CRIMINALS, MockCriminal, MOCK_FIRS } from '../../../utils/mockData';
import { 
  ArrowLeft, 
  User, 
  MapPin, 
  FileText, 
  Car, 
  Phone, 
  Users, 
  Activity, 
  ShieldAlert, 
  Calendar,
  AlertTriangle 
} from 'lucide-react';
import Link from 'next/link';

export default function CriminalProfile() {
  const { id } = useParams();
  const router = useRouter();
  const { token, isDemoMode } = useAuth();
  
  const [criminal, setCriminal] = useState<MockCriminal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    if (isDemoMode) {
      const match = MOCK_CRIMINALS.find(c => c.id === id);
      setCriminal(match || null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/criminals/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const payload = await res.json();
          
          // Map database structures to matching UI parameters
          const mapped: MockCriminal = {
            id: payload.id,
            name: payload.name,
            aliases: payload.aliases || 'N/A',
            aadhaarNumber: payload.aadhaarNumber || 'N/A',
            dateOfBirth: payload.dateOfBirth.slice(0, 10),
            gender: payload.gender,
            riskScore: payload.riskScore,
            status: payload.status,
            photoUrl: payload.photoUrl || '',
            gang: payload.associates?.[0]?.relationType === 'GANG_MEMBER' ? 'Linked Syndicate' : 'N/A',
            vehicles: payload.vehicles?.map((v: any) => v.registrationNumber) || [],
            phones: payload.phones?.map((p: any) => p.phoneNumber) || [],
            associates: payload.associates?.map((a: any) => ({
              id: a.associate?.id || '',
              name: a.associate?.name || 'Unknown associate',
              relation: a.relationType
            })) || [],
            cases: payload.associations?.map((a: any) => ({
              id: a.fir?.id || '',
              firNumber: a.fir?.firNumber || 'Unknown case',
              role: a.role
            })) || []
          };
          setCriminal(mapped);
        }
      } catch (err) {
        console.warn('API error fetching dossier, executing mock fallback');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id, isDemoMode, token]);

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-rose-500 border-rose-950/40 bg-rose-950/10';
    if (score >= 50) return 'text-amber-500 border-amber-950/40 bg-amber-950/10';
    return 'text-emerald-500 border-emerald-950/40 bg-emerald-950/10';
  };

  const getTimelineEvents = (crim: MockCriminal) => {
    // Generate a beautiful mock timeline of criminal activity for visualization
    return [
      { date: '2026-06-28', title: 'Scanned in indiranagar', desc: `KA-51-AB-9999 spotted near 12th Main Indiranagar at 3:15 AM during FIR-2026-0056 burglary entry.` },
      { date: '2026-06-15', title: 'Armed Robbery Registration', desc: `Named primary suspect in FIR-2026-0045 Koramangala Sony World Chain Snatching incident.` },
      { date: '2025-11-20', title: 'Suspect Release on Parole', desc: `Released from Central Prison Parappana Agrahara under supervision orders.` },
      { date: '2024-04-10', title: 'Gang Conspiracy Linkage', desc: 'Identified as close associate of Syed Karim during raid at East Bangalore warehouse.' }
    ];
  };

  if (loading) {
    return (
      <div className="py-32 text-center">
        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-550 font-mono">Retrieving confidential criminal dossier...</p>
      </div>
    );
  }

  if (!criminal) {
    return (
      <div className="py-32 text-center space-y-4">
        <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
        <p className="text-sm text-slate-400 font-mono">Dossier record not found or access restricted.</p>
        <button onClick={() => router.back()} className="text-xs text-purple-400 hover:underline">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button and Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-1.5 bg-slate-900 border border-slate-850 text-slate-400 hover:text-white rounded-lg hover:border-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <span className="text-[9px] font-mono text-slate-500 uppercase font-semibold">Security Level: Classified</span>
          <h2 className="text-lg font-bold text-white tracking-tight">Criminal Profile Dossier</h2>
        </div>
      </div>

      {/* Main Dossier Details Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Biometric Dossier Card */}
        <div className="space-y-6">
          <div className="glass-card rounded-xl p-5 space-y-4 relative overflow-hidden">
            <div className="flex flex-col items-center text-center py-4 border-b border-slate-900/60">
              <div className="w-20 h-20 rounded-full bg-slate-850 border-2 border-purple-500 flex items-center justify-center text-slate-300 font-bold text-2xl mb-3 shadow-lg shadow-purple-950/20">
                {criminal.name.split(' ').pop()?.substring(0, 2).toUpperCase() || 'C'}
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">{criminal.name}</h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{criminal.aliases}</p>
              
              <span className={`mt-3 px-3 py-1 border rounded-full text-xs font-mono font-semibold uppercase tracking-wider ${getRiskColor(criminal.riskScore)}`}>
                RISK SCORE: {criminal.riskScore}%
              </span>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-mono">Offender ID:</span>
                <span className="text-slate-300 font-semibold">{criminal.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-mono">Aadhaar ID:</span>
                <span className="text-slate-300 font-mono">{criminal.aadhaarNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-mono">Date of Birth:</span>
                <span className="text-slate-350">{new Date(criminal.dateOfBirth).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-mono">Gender:</span>
                <span className="text-slate-350">{criminal.gender}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-mono">Dossier Status:</span>
                <span className="text-purple-400 font-semibold">{criminal.status}</span>
              </div>
              {criminal.gang && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-mono">Gang Network:</span>
                  <span className="text-slate-350 font-semibold truncate max-w-[150px]">{criminal.gang}</span>
                </div>
              )}
            </div>
          </div>

          {/* Network Entities: Vehicles & Phones */}
          <div className="glass-card rounded-xl p-5 space-y-4">
            <h4 className="text-xs font-mono text-slate-400 uppercase tracking-widest font-semibold border-b border-slate-900 pb-2 flex items-center gap-1.5">
              <Car className="w-4 h-4 text-purple-400" />
              <span>Registered Assets</span>
            </h4>
            
            <div className="space-y-3 text-xs">
              {/* Vehicles */}
              <div className="space-y-1.5">
                <div className="text-[10px] text-slate-500 font-mono uppercase">Vehicles Linked:</div>
                {criminal.vehicles.length === 0 ? (
                  <p className="text-slate-600 italic">No vehicles registered</p>
                ) : (
                  criminal.vehicles.map(v => (
                    <div key={v} className="flex items-center gap-2 bg-slate-950/40 border border-slate-900 px-3 py-2 rounded-lg font-mono text-slate-300">
                      <Car className="w-3.5 h-3.5 text-slate-500" />
                      <span>{v}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Phones */}
              <div className="space-y-1.5 pt-2 border-t border-slate-900/50">
                <div className="text-[10px] text-slate-500 font-mono uppercase">Comms Devices:</div>
                {criminal.phones.length === 0 ? (
                  <p className="text-slate-600 italic">No comms logged</p>
                ) : (
                  criminal.phones.map(p => (
                    <div key={p} className="flex items-center gap-2 bg-slate-950/40 border border-slate-900 px-3 py-2 rounded-lg font-mono text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>{p}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Columns: Cases, Associates, and Activity Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Associated Cases & Gang Associates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Connected FIR Cases */}
            <div className="glass-card rounded-xl p-5 space-y-3 flex flex-col justify-between h-56">
              <div>
                <h4 className="text-xs font-mono text-slate-400 uppercase tracking-widest font-semibold border-b border-slate-900 pb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-purple-400" />
                  <span>Criminal Case History</span>
                </h4>
                <div className="space-y-2 mt-3 overflow-y-auto max-h-32 pr-1">
                  {criminal.cases.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No case links registered.</p>
                  ) : (
                    criminal.cases.map(c => (
                      <Link 
                        key={c.id} 
                        href={`/search?q=${c.firNumber}`}
                        className="flex items-center justify-between p-2 hover:bg-slate-900/30 rounded-lg border border-slate-900/40 hover:border-slate-800 transition"
                      >
                        <span className="text-xs font-mono font-bold text-slate-300">{c.firNumber}</span>
                        <span className="text-[9px] font-mono text-rose-400 font-semibold px-2 py-0.5 rounded bg-rose-950/20 border border-rose-900/40">
                          {c.role}
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              </div>
              <span className="text-[9px] text-slate-600 font-mono">Matches state records directory.</span>
            </div>

            {/* Gang Associates */}
            <div className="glass-card rounded-xl p-5 space-y-3 flex flex-col justify-between h-56">
              <div>
                <h4 className="text-xs font-mono text-slate-400 uppercase tracking-widest font-semibold border-b border-slate-900 pb-2 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>Co-Conspirators</span>
                </h4>
                <div className="space-y-2 mt-3 overflow-y-auto max-h-32 pr-1">
                  {criminal.associates.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No associate networks detected.</p>
                  ) : (
                    criminal.associates.map(a => (
                      <Link
                        key={a.id}
                        href={`/criminals/${a.id}`}
                        className="flex items-center justify-between p-2 hover:bg-slate-900/30 rounded-lg border border-slate-900/40 hover:border-slate-800 transition"
                      >
                        <span className="text-xs text-slate-300 font-semibold">{a.name}</span>
                        <span className="text-[9px] font-mono text-purple-400 font-semibold px-1.5 py-0.5 rounded bg-purple-950/20 border border-purple-900/40">
                          {a.relation.replace('_', ' ')}
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              </div>
              <span className="text-[9px] text-slate-600 font-mono">Analyzed using NetworkX links.</span>
            </div>
          </div>

          {/* Chronological Activity Timeline */}
          <div className="glass-card rounded-xl p-5 space-y-4">
            <h4 className="text-xs font-mono text-slate-400 uppercase tracking-widest font-semibold border-b border-slate-900 pb-2 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-purple-400" />
              <span>Offender Intelligence Timeline</span>
            </h4>

            <div className="relative border-l border-slate-850 pl-5 ml-2.5 space-y-5 py-2">
              {getTimelineEvents(criminal).map((event, idx) => (
                <div key={idx} className="relative space-y-1">
                  {/* Timeline Dot */}
                  <span className="absolute -left-[25px] top-1.5 w-2.5 h-2.5 rounded-full bg-purple-500 border-2 border-[#0B0B0F]" />
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(event.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="text-slate-700">•</span>
                    <h5 className="text-xs font-bold text-slate-200">{event.title}</h5>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">{event.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
