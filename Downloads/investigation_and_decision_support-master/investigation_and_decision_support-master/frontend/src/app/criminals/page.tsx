'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MOCK_CRIMINALS, MockCriminal } from '../../utils/mockData';
import { Search, UserCheck, AlertOctagon, UserX, BookOpen, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function CriminalsList() {
  const { token, isDemoMode } = useAuth();
  const [criminals, setCriminals] = useState<MockCriminal[]>(MOCK_CRIMINALS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isDemoMode) {
      let filtered = [...MOCK_CRIMINALS];
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(
          c =>
            c.name.toLowerCase().includes(q) ||
            c.aliases.toLowerCase().includes(q) ||
            c.aadhaarNumber.includes(q)
        );
      }
      if (statusFilter) {
        filtered = filtered.filter(c => c.status === statusFilter);
      }
      setCriminals(filtered);
      return;
    }

    const fetchCriminals = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.append('search', searchQuery);
        if (statusFilter) params.append('status', statusFilter);

        const res = await fetch(`http://localhost:5000/api/criminals?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const payload = await res.json();
          setCriminals(payload.data);
        }
      } catch (err) {
        console.warn('API error, falling back to mock');
      } finally {
        setLoading(false);
      }
    };

    fetchCriminals();
  }, [searchQuery, statusFilter, isDemoMode, token]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />;
      case 'IN_CUSTODY':
        return <UserCheck className="w-3.5 h-3.5 text-emerald-500" />;
      case 'ABSCONDING':
        return <AlertOctagon className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <UserX className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'bg-rose-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">KSP Repeat Offenders Database</h2>
        <p className="text-xs text-slate-500">Biometric lookups, risk profiles, and historical gang associate directories.</p>
      </div>

      {/* Search and Filters */}
      <div className="glass-card rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, alias, Aadhaar..."
            className="w-full bg-[#111118]/80 border border-slate-850 rounded-lg py-2 pl-10 pr-4 text-xs text-slate-200 outline-none focus:border-purple-600 transition"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-[#111118]/80 border border-slate-850 rounded-lg text-xs py-2 px-3 text-slate-350 focus:outline-none focus:border-purple-600 cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">ACTIVE (Wanted / Free)</option>
          <option value="IN_CUSTODY">IN CUSTODY</option>
          <option value="ABSCONDING">ABSCONDING</option>
          <option value="PAROLE">PAROLE</option>
        </select>
      </div>

      {/* Grid of Profiles */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-550 font-mono">Scanning offender indices...</p>
        </div>
      ) : criminals.length === 0 ? (
        <div className="py-24 text-center text-slate-600 text-xs font-mono">
          No matching criminal records identified.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {criminals.map(c => (
            <div key={c.id} className="glass-card rounded-xl p-5 flex flex-col justify-between h-56 relative overflow-hidden group">
              {/* Decorative top risk accent */}
              <div className={`absolute top-0 left-0 right-0 h-1.5 ${getRiskColor(c.riskScore)}`} />

              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-slate-850 border border-slate-800 flex items-center justify-center text-slate-300 font-semibold uppercase text-sm">
                      {c.name.split(' ').pop()?.substring(0, 2).toUpperCase() || 'C'}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-purple-400 transition">{c.name}</h3>
                      <p className="text-[10px] text-slate-500 font-mono truncate max-w-[150px]">{c.aliases}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-950/40 border border-slate-900 px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase">
                    {getStatusIcon(c.status)}
                    <span>{c.status.replace('_', ' ')}</span>
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>Aadhaar:</span>
                    <span className="text-slate-350">{c.aadhaarNumber || 'UNKNOWN'}</span>
                  </div>
                  {c.gang && (
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>Gang Affiliation:</span>
                      <span className="text-slate-350 truncate max-w-[130px]">{c.gang}</span>
                    </div>
                  )}
                  {/* Risk score details */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[9px] font-mono text-slate-500">
                      <span>Risk Score Factor</span>
                      <span className="text-slate-300 font-semibold">{c.riskScore}%</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                      <div className={`h-full ${getRiskColor(c.riskScore)}`} style={{ width: `${c.riskScore}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-900 mt-4 flex justify-between items-center">
                <span className="text-[9px] text-slate-500 font-mono uppercase font-semibold">KSP Intel Core Dossier</span>
                <Link
                  href={`/criminals/${c.id}`}
                  className="flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300 font-mono font-bold uppercase transition"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Open Dossier</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
