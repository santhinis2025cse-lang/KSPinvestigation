'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { History, ShieldAlert, Search, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface AuditEntry {
  id: string;
  badge: string;
  action: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

const MOCK_AUDITS: AuditEntry[] = [
  { id: '1', badge: 'SY-9901', action: 'AUDIT_LOGS_VIEW', details: 'System admin loaded global security logs audit trail.', ipAddress: '10.12.93.42', timestamp: '2026-07-11T13:30:00Z' },
  { id: '2', badge: 'AN-7731', action: 'FIR_REPORT_EXPORT', details: 'Exported case report for FIR-2026-0045 as PDF.', ipAddress: '10.12.95.8', timestamp: '2026-07-11T12:45:00Z' },
  { id: '3', badge: 'SI-4921', action: 'WORKSPACE_PIN_CASE', details: 'Pinned case FIR-2026-0056 to active workspace.', ipAddress: '10.12.92.11', timestamp: '2026-07-11T10:15:00Z' },
  { id: '4', badge: 'HC-3891', action: 'FIR_SEARCH', details: 'Searched cases with criteria: search="Sony World signal".', ipAddress: '10.12.90.15', timestamp: '2026-07-11T09:30:00Z' },
  { id: '5', badge: 'SI-4921', action: 'USER_LOGIN_SUCCESS', details: 'Officer SI Anitha Deshpande logged in successfully.', ipAddress: '10.12.92.11', timestamp: '2026-07-11T09:00:00Z' }
];

export default function AuditLogs() {
  const { user, token, isDemoMode } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<AuditEntry[]>(MOCK_AUDITS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // RBAC Safeguard
  useEffect(() => {
    if (!user) return;
    if (user.role !== 'SYSTEM_ADMINISTRATOR' && user.role !== 'SCRB_ADMINISTRATOR') {
      toast.error('Access Denied: Restricted to Administrators.');
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (isDemoMode) {
      const filtered = MOCK_AUDITS.filter(
        l =>
          l.badge.toLowerCase().includes(search.toLowerCase()) ||
          l.action.toLowerCase().includes(search.toLowerCase()) ||
          l.details.toLowerCase().includes(search.toLowerCase())
      );
      setLogs(filtered);
      return;
    }

    const fetchAudits = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.append('search', search);

        const res = await fetch(`http://localhost:5000/api/audit?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const payload = await res.json();
          setLogs(payload.data);
        }
      } catch (err) {
        console.warn('API error fetching audits, staying with mock fallback');
      } finally {
        setLoading(false);
      }
    };

    fetchAudits();
  }, [search, isDemoMode, token]);

  if (user?.role !== 'SYSTEM_ADMINISTRATOR' && user?.role !== 'SCRB_ADMINISTRATOR') {
    return null; // Don't flash protected layouts
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">KSP System Compliance Audits</h2>
          <p className="text-xs text-slate-500">Official log of searches, logins, AI queries, and data downloads for court transparency.</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-950/20 border border-rose-900/60 px-3 py-1 rounded-full font-mono font-semibold">
          <ShieldCheck className="w-4 h-4" />
          ADMIN COMPLIANCE PORTAL
        </span>
      </div>

      {/* Search Filter */}
      <div className="glass-card rounded-xl p-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter audit logs by badge, action ID, or details..."
            className="w-full bg-[#111118]/80 border border-slate-850 rounded-lg py-2 pl-10 pr-4 text-xs text-slate-200 outline-none focus:border-purple-600 transition"
          />
        </div>
      </div>

      {/* Audits Log Table */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
          <div className="flex items-center gap-1.5">
            <History className="w-4 h-4 text-purple-400" />
            <h4 className="text-xs font-mono text-slate-400 uppercase tracking-widest font-semibold">
              Security Compliance Ledger
            </h4>
          </div>
          <span className="text-[9px] font-mono text-slate-550">{logs.length} operations compiled</span>
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-mono">Loading compliance ledger indices...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-24 text-center text-slate-600 text-xs font-mono">
            No audit anomalies or logs matching query found.
          </div>
        ) : (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900 text-slate-500 uppercase tracking-wider text-[9px] font-mono">
                  <th className="pb-3">Timestamp</th>
                  <th className="pb-3">Badge Sign</th>
                  <th className="pb-3">Action ID</th>
                  <th className="pb-3">Description</th>
                  <th className="pb-3 text-right">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60 text-slate-350">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-950/20 transition-colors">
                    <td className="py-3 font-mono text-[10px] text-slate-450">
                      {new Date(log.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3 font-bold text-white font-mono">{log.badge}</td>
                    <td className="py-3 font-mono text-purple-400 font-semibold">{log.action}</td>
                    <td className="py-3 leading-normal max-w-sm font-sans">{log.details}</td>
                    <td className="py-3 text-right font-mono text-slate-500 text-[10px]">{log.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
