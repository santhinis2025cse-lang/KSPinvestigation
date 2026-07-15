'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MOCK_FIRS, MOCK_DISTRICTS, MOCK_STATIONS, MOCK_CATEGORIES, MockFIR } from '../../utils/mockData';
import { 
  Search, 
  Mic, 
  Download, 
  FileSpreadsheet, 
  FileDown, 
  PlusCircle, 
  SlidersHorizontal,
  ChevronRight,
  FilterX,
  History
} from 'lucide-react';
import { toast } from 'sonner';

export default function CrimeSearch() {
  const { token, isDemoMode } = useAuth();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [district, setDistrict] = useState('');
  const [station, setStation] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Results state
  const [results, setResults] = useState<MockFIR[]>(MOCK_FIRS);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Search History
  const [history, setHistory] = useState<string[]>([
    'Sony World robbery suspects',
    'Burglary Indiranagar KA-51-AB-9999',
    'Cyber fraud Whitefield'
  ]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);

    if (searchQuery && !history.includes(searchQuery)) {
      setHistory(prev => [searchQuery, ...prev.slice(0, 4)]);
    }

    if (isDemoMode) {
      setTimeout(() => {
        let filtered = [...MOCK_FIRS];

        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter(
            f =>
              f.firNumber.toLowerCase().includes(q) ||
              f.summary.toLowerCase().includes(q) ||
              f.address.toLowerCase().includes(q) ||
              f.complainantName.toLowerCase().includes(q) ||
              f.suspects.some(s => s.name.toLowerCase().includes(q))
          );
        }

        if (district) {
          const distObj = MOCK_DISTRICTS.find(d => d.id === district);
          if (distObj) {
            filtered = filtered.filter(f => f.districtName === distObj.name);
          }
        }

        if (station) {
          const psObj = MOCK_STATIONS.find(s => s.id === station);
          if (psObj) {
            filtered = filtered.filter(f => f.stationName === psObj.name);
          }
        }

        if (category) {
          const catObj = MOCK_CATEGORIES.find(c => c.id === category);
          if (catObj) {
            filtered = filtered.filter(f => f.category === catObj.name);
          }
        }

        if (status) {
          filtered = filtered.filter(f => f.status === status);
        }

        setResults(filtered);
        setLoading(false);
        toast.success(`Search completed. Found ${filtered.length} matches.`);
      }, 400);
      return;
    }

    // Production Mode Call
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (district) params.append('districtId', district);
      if (station) params.append('policeStationId', station);
      if (category) params.append('categoryId', category);
      if (status) params.append('status', status);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await fetch(`http://localhost:5000/api/fir?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const payload = await res.json();
        // Map database response to match list
        const mapped = payload.data.map((f: any) => ({
          id: f.id,
          firNumber: f.firNumber,
          category: f.crimeCategory?.name || 'Unknown',
          status: f.status,
          dateOfOffence: f.dateOfOffence,
          dateOfRegistration: f.dateOfRegistration,
          summary: f.summary,
          latitude: f.latitude,
          longitude: f.longitude,
          address: f.address,
          complainantName: f.complainantName || 'N/A',
          complainantPhone: f.complainantPhone || 'N/A',
          stationName: f.policeStation?.name || 'Unknown',
          districtName: f.district?.name || 'Unknown',
          suspects: f.suspects?.map((s: any) => ({ name: s.criminal?.name || 'Unknown' })) || []
        }));
        setResults(mapped);
        toast.success(`Active Database: Found ${mapped.length} records.`);
      }
    } catch (err) {
      console.warn('API error, executing mock search fallback');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setDistrict('');
    setStation('');
    setCategory('');
    setStatus('');
    setStartDate('');
    setEndDate('');
    setResults(MOCK_FIRS);
    toast.info('Search filters cleared.');
  };

  const startVoiceSearch = () => {
    setIsRecording(true);
    toast.info('Listening for voice commands (e.g. "Find Indiranagar burglaries")...');
    setTimeout(() => {
      setIsRecording(false);
      setSearchQuery('Burglary Indiranagar');
      toast.success('Voice search translated: "Burglary Indiranagar"');
    }, 2500);
  };

  const exportCSV = () => {
    // Generate simple mock CSV export trigger
    const headers = 'FIR Number,Crime Category,District,Station,Status,Date registered,Complainant\n';
    const rows = results.map(r => 
      `"${r.firNumber}","${r.category}","${r.districtName}","${r.stationName}","${r.status}","${r.dateOfRegistration}","${r.complainantName}"`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `KSP_Crime_Export_${new Date().toISOString().slice(0,10)}.csv`);
    a.click();
    toast.success('Crime records exported successfully as CSV.');
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">KSP Advanced Crime Database</h2>
          <p className="text-xs text-slate-500">Cross-reference FIR registrations, complainants, evidence logs, and vehicles.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 font-semibold rounded-lg transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => toast.info('Generating PDF Report...')}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 font-semibold rounded-lg transition"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Main Search Panel */}
      <div className="glass-card rounded-xl p-5 space-y-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by FIR, suspect names, vehicle registration, or keywords..."
              className="w-full bg-[#111118]/80 border border-slate-850 rounded-xl py-3 pl-11 pr-12 text-sm text-slate-200 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition"
            />
            <button
              type="button"
              onClick={startVoiceSearch}
              className={`absolute right-3 top-2.5 p-1 rounded-lg transition-colors ${
                isRecording ? 'text-rose-500 bg-rose-950/20' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Voice Search"
            >
              <Mic className={`w-4.5 h-4.5 ${isRecording ? 'animate-bounce' : ''}`} />
            </button>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition ${
                showFilters 
                  ? 'bg-slate-900 border-slate-700 text-purple-400' 
                  : 'bg-slate-950/40 border-slate-850 text-slate-400 hover:text-slate-200 hover:border-slate-800'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition"
            >
              Search
            </button>
          </div>
        </form>

        {/* Detailed Filters Drawer Panel */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 pt-4 border-t border-slate-900">
            {/* District */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-500 uppercase font-semibold">District</label>
              <select
                value={district}
                onChange={e => setDistrict(e.target.value)}
                className="w-full bg-[#111118]/80 border border-slate-850 rounded-lg text-xs py-2 px-2.5 text-slate-300 focus:outline-none focus:border-purple-600"
              >
                <option value="">All Districts</option>
                {MOCK_DISTRICTS.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Police Station */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Police Station</label>
              <select
                value={station}
                onChange={e => setStation(e.target.value)}
                className="w-full bg-[#111118]/80 border border-slate-850 rounded-lg text-xs py-2 px-2.5 text-slate-300 focus:outline-none focus:border-purple-600"
              >
                <option value="">All Stations</option>
                {MOCK_STATIONS.filter(s => !district || s.districtId === district).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Crime Category */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Crime Type</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-[#111118]/80 border border-slate-850 rounded-lg text-xs py-2 px-2.5 text-slate-300 focus:outline-none focus:border-purple-600"
              >
                <option value="">All Types</option>
                {MOCK_CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Case Status */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full bg-[#111118]/80 border border-slate-850 rounded-lg text-xs py-2 px-2.5 text-slate-300 focus:outline-none focus:border-purple-600"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">PENDING</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="SOLVED">SOLVED</option>
              </select>
            </div>

            {/* Start Date */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-500 uppercase font-semibold">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-[#111118]/80 border border-slate-850 rounded-lg text-xs py-1.5 px-2.5 text-slate-300 focus:outline-none focus:border-purple-600 font-mono"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-500 uppercase font-semibold">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full bg-[#111118]/80 border border-slate-850 rounded-lg text-xs py-1.5 px-2.5 text-slate-300 focus:outline-none focus:border-purple-600 font-mono"
              />
            </div>

            {/* Reset Controls Button */}
            <div className="col-span-full flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-850 hover:border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                <FilterX className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* History and Results split */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Search History Sidebar */}
        <div className="glass-card rounded-xl p-5 space-y-4 h-fit">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 uppercase font-semibold border-b border-slate-900 pb-2">
            <History className="w-4 h-4 text-slate-500" />
            <span>Search History</span>
          </div>
          <div className="space-y-1.5">
            {history.map((h, index) => (
              <div
                key={index}
                onClick={() => {
                  setSearchQuery(h);
                  toast.info(`Pre-filled query: "${h}"`);
                }}
                className="text-xs text-slate-400 hover:text-white cursor-pointer hover:bg-slate-900/30 p-2 rounded-lg transition-colors border border-transparent hover:border-slate-900 flex items-center justify-between"
              >
                <span className="truncate max-w-[200px]">{h}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-650" />
              </div>
            ))}
          </div>
        </div>

        {/* Results Panel */}
        <div className="glass-card rounded-xl p-5 lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-900 pb-3">
            <div>
              <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest font-semibold">Matched Records</h3>
              <p className="text-[10px] text-slate-500 font-sans">List of matching cases with active suspects.</p>
            </div>
            <span className="text-[10px] font-mono text-purple-400 font-bold bg-purple-950/20 border border-purple-900/50 px-2 py-0.5 rounded">
              {results.length} RECORD(S)
            </span>
          </div>

          {loading ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-mono">Running index lookup scan...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-24 text-center text-slate-600 text-xs font-sans">
              No matching KSP records found. Refine your query or filters.
            </div>
          ) : (
            <div className="divide-y divide-slate-900">
              {results.map(r => (
                <div key={r.id} className="py-4 hover:bg-slate-950/10 transition-colors rounded-xl px-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white font-mono">{r.firNumber}</span>
                      <span className="text-[10px] bg-slate-900 border border-slate-850 px-2 py-0.5 rounded text-slate-400">
                        {r.category}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      r.status === 'SOLVED' 
                        ? 'bg-emerald-950/20 border-emerald-900/55 text-emerald-400' 
                        : 'bg-amber-950/20 border-amber-900/55 text-amber-400'
                    }`}>
                      {r.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-350 leading-relaxed font-sans">{r.summary}</p>

                  <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-[10px] text-slate-500 font-mono">
                    <div>
                      <span>Station: </span>
                      <span className="text-slate-300 font-semibold">{r.stationName}</span>
                    </div>
                    <div>
                      <span>Complainant: </span>
                      <span className="text-slate-300 font-semibold">{r.complainantName}</span>
                    </div>
                    <div>
                      <span>Date registered: </span>
                      <span className="text-slate-300 font-semibold">
                        {new Date(r.dateOfRegistration).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
