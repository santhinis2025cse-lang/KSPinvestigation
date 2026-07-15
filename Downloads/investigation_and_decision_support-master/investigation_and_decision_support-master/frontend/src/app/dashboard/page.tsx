'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MOCK_DASHBOARD_DATA } from '../../utils/mockData';
import { 
  FileText, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Users, 
  MapPin, 
  TrendingUp, 
  Search, 
  Bot, 
  Map, 
  ArrowUpRight 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { motion } from 'framer-motion';
import { apiFetch } from '../../utils/api';

export default function Dashboard() {
  const { token, isDemoMode } = useAuth();
  const [data, setData] = useState(MOCK_DASHBOARD_DATA);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isDemoMode) {
      setData(MOCK_DASHBOARD_DATA);
      return;
    }

    const fetchDashboard = async () => {
      setLoading(true);
      try {
        try {
          const dashboardData = await apiFetch<any>('/api/analytics/dashboard');
          setData(dashboardData);
        } catch (err) {
          console.warn('Backend connection failed, staying with mock data', err);
        }
      } catch (err) {
        console.warn('Backend connection failed, staying with mock data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [isDemoMode, token]);

  const cards = [
    { name: 'Total Crimes Registrations', value: data.cards.totalCrimes, icon: FileText, change: data.cards.crimeRateChange, trend: 'up', color: 'text-purple-400' },
    { name: 'Active Investigations', value: data.cards.activeCases, icon: ShieldAlert, change: 'Under investigation', trend: 'neutral', color: 'text-amber-500' },
    { name: 'Solved Cases (Disposed)', value: data.cards.solvedCases, icon: CheckCircle2, change: `${Math.round((data.cards.solvedCases / data.cards.totalCrimes) * 100)}% solve rate`, trend: 'up', color: 'text-emerald-400' },
    { name: 'Pending Chargesheets', value: data.cards.pendingCases, icon: Clock, change: 'Requires review', trend: 'down', color: 'text-blue-400' },
    { name: 'High-Risk Repeat Offenders', value: data.cards.repeatOffenders, icon: Users, change: 'Risk score > 70', trend: 'neutral', color: 'text-rose-500' },
    { name: 'Hotspot Alert Zone', value: data.cards.highRiskDistrict, icon: MapPin, change: 'Highest incident rate', trend: 'neutral', color: 'text-indigo-400' },
  ];

  // Recharts color palette
  const CHART_COLORS = ['#7C3AED', '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#6366F1'];

  return (
    <div className="space-y-6">
      {/* Title Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white font-sans">KSP Intelligence Command Dashboard</h2>
          <p className="text-xs text-slate-500">Real-time crime analysis, predictive hotspots, and investigation dispatch logs.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[10px] font-mono text-slate-500 uppercase">System Status:</div>
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-900/60 px-2.5 py-1 rounded-full font-mono font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            SECURE LINK ACTIVE
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.name}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="glass-card rounded-xl p-4.5 flex flex-col justify-between h-32"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase truncate max-w-[130px]">
                {card.name}
              </span>
              <card.icon className={`w-4 h-4 ${card.color} shrink-0`} />
            </div>
            <div className="my-2">
              <h3 className="text-2xl font-bold text-white tracking-tight">{card.value}</h3>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <TrendingUp className="w-3 h-3 text-slate-500" />
              <span className="truncate">{card.change}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Crime Trend Over Time */}
        <div className="glass-card rounded-xl p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest font-semibold">Time-Series Crime Trend</h3>
              <p className="text-[10px] text-slate-500 font-sans">Monthly distribution of registered cases across the state.</p>
            </div>
            <span className="text-[10px] text-purple-400 font-semibold cursor-pointer hover:underline flex items-center gap-0.5">
              12 Months <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.charts.monthlyTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="purpleGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B0B0F', borderColor: 'rgba(255,255,255,0.06)', borderRadius: '8px', fontSize: '11px', color: '#E2E8F0' }}
                  labelClassName="text-slate-500 font-mono text-[9px]"
                />
                <Area type="monotone" dataKey="count" stroke="#7C3AED" strokeWidth={2} fillOpacity={1} fill="url(#purpleGlow)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Crime Category Distribution */}
        <div className="glass-card rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest font-semibold">Category Breakdown</h3>
              <p className="text-[10px] text-slate-500 font-sans">Proportion of crimes by Indian Penal Code classification.</p>
            </div>
          </div>
          <div className="h-64 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.charts.categoryDistribution} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <XAxis type="number" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} hide />
                <YAxis dataKey="category" type="category" stroke="#94A3B8" fontSize={9} tickLine={false} axisLine={false} width={80} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B0B0F', borderColor: 'rgba(255,255,255,0.06)', borderRadius: '8px', fontSize: '11px', color: '#E2E8F0' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={12}>
                  {data.charts.categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Split Bottom Panel: Recent FIRs & Live Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Cases */}
        <div className="glass-card rounded-xl p-5 lg:col-span-2 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest font-semibold">Active Case Log</h3>
                <p className="text-[10px] text-slate-500 font-sans">Recently registered FIR cases under active investigation.</p>
              </div>
            </div>
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 text-slate-500 uppercase tracking-wider text-[9px] font-mono">
                    <th className="pb-2">FIR Number</th>
                    <th className="pb-2">Category</th>
                    <th className="pb-2">Station</th>
                    <th className="pb-2">Date registered</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-950">
                  {data.recentCases.map(c => (
                    <tr key={c.id} className="hover:bg-slate-900/10 transition-colors">
                      <td className="py-2.5 font-medium text-white font-mono">{c.firNumber}</td>
                      <td className="py-2.5 text-slate-300">{c.category || (c as any).crimeCategory?.name}</td>
                      <td className="py-2.5 text-slate-400">{c.stationName || (c as any).policeStation?.name}</td>
                      <td className="py-2.5 text-slate-400 font-mono">
                        {new Date(c.dateOfRegistration).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          c.status === 'SOLVED' 
                            ? 'bg-emerald-950/20 border-emerald-900/60 text-emerald-400' 
                            : c.status === 'ACTIVE' 
                              ? 'bg-amber-950/20 border-amber-900/60 text-amber-400' 
                              : 'bg-rose-950/20 border-rose-900/60 text-rose-400'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-900 text-right">
            <span className="text-[10px] text-purple-400 hover:text-purple-300 font-mono font-semibold uppercase tracking-wider cursor-pointer">
              Go to advanced search desk
            </span>
          </div>
        </div>

        {/* Live System Alerts Feed */}
        <div className="glass-card rounded-xl p-5 space-y-4">
          <div>
            <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest font-semibold">Active Dispatch Alerts</h3>
            <p className="text-[10px] text-slate-500 font-sans">Urgent notifications and machine learning recommendations.</p>
          </div>
          
          <div className="space-y-3.5">
            {data.recentAlerts.map(alert => (
              <div key={alert.id} className="p-3 bg-slate-950/30 border border-slate-900 hover:border-slate-850 rounded-xl transition-all duration-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    alert.type === 'CRIME_SPIKE' 
                      ? 'bg-rose-950/40 text-rose-400 border border-rose-900/50' 
                      : 'bg-purple-950/40 text-purple-400 border border-purple-900/50'
                  }`}>
                    {alert.type}
                  </span>
                  <span className="text-[9px] text-slate-600 font-mono">
                    {new Date(alert.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-slate-200">{alert.title}</h4>
                <p className="text-[11px] text-slate-400 leading-normal">{alert.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
