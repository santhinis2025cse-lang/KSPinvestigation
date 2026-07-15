'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '../../context/AuthContext';
import { MOCK_HOTSPOTS, MOCK_FIRS, MockFIR } from '../../utils/mockData';
import { Map, SlidersHorizontal, Layers, Target, Clock, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

// Import map component dynamically to disable SSR and prevent window is not defined error
const MapComponent = dynamic(() => import('../../components/MapComponent'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#08080C] flex items-center justify-center">
      <div className="text-center space-y-2">
        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-mono">Initializing GIS Engine...</p>
      </div>
    </div>
  )
});

export default function CrimeMap() {
  const { token, isDemoMode } = useAuth();
  
  const [hotspotData, setHotspotData] = useState(MOCK_HOTSPOTS);
  const [cases, setCases] = useState<MockFIR[]>(MOCK_FIRS);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [timeValue, setTimeValue] = useState(6); // month index
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isDemoMode) {
      setHotspotData(MOCK_HOTSPOTS);
      setCases(MOCK_FIRS);
      return;
    }

    const fetchMapData = async () => {
      setLoading(true);
      try {
        const [hotspotsRes, casesRes] = await Promise.all([
          fetch('http://localhost:5000/api/analytics/hotspots', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch('http://localhost:5000/api/fir', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (hotspotsRes.ok) {
          const hd = await hotspotsRes.json();
          setHotspotData(hd);
        }

        if (casesRes.ok) {
          const cd = await casesRes.json();
          // Map DB response
          const mapped = cd.data.map((f: any) => ({
            id: f.id,
            firNumber: f.firNumber,
            category: f.crimeCategory?.name || 'Unknown',
            status: f.status,
            latitude: f.latitude,
            longitude: f.longitude,
            summary: f.summary,
            stationName: f.policeStation?.name || 'Unknown',
          }));
          setCases(mapped);
        }
      } catch (err) {
        console.warn('API fetch failed for maps, staying with mock fallback');
      } finally {
        setLoading(false);
      }
    };

    fetchMapData();
  }, [isDemoMode, token]);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    
    // Filter coordinates based on selections
    if (cat === 'ALL') {
      setCases(MOCK_FIRS);
    } else {
      const filtered = MOCK_FIRS.filter(c => c.category.toUpperCase().includes(cat));
      setCases(filtered);
    }
    toast.info(`Map layer filtered: ${cat}`);
  };

  const getRiskBg = (risk: string) => {
    if (risk === 'HIGH') return 'bg-rose-950/20 border-rose-900/40 text-rose-400';
    return 'bg-amber-950/20 border-amber-900/40 text-amber-400';
  };

  return (
    <div className="h-[80vh] flex flex-col lg:flex-row gap-6">
      {/* GIS Interactive map Container */}
      <div className="flex-1 glass-card rounded-xl relative overflow-hidden flex flex-col min-h-[400px]">
        {/* Layer Controls overlay */}
        <div className="absolute top-4 left-4 z-10 bg-[#0B0B0F]/90 border border-slate-850 p-3 rounded-xl max-w-sm pointer-events-auto">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold text-white tracking-tight">GIS Layers & Filters</h3>
          </div>
          <div className="flex gap-1.5 mt-2.5">
            <button
              onClick={() => handleCategoryChange('ALL')}
              className={`px-2 py-1 text-[9px] font-mono font-bold rounded-md border uppercase transition ${
                selectedCategory === 'ALL'
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              All layers
            </button>
            <button
              onClick={() => handleCategoryChange('ROBBERY')}
              className={`px-2 py-1 text-[9px] font-mono font-bold rounded-md border uppercase transition ${
                selectedCategory === 'ROBBERY'
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              Robberies
            </button>
            <button
              onClick={() => handleCategoryChange('BURGLARY')}
              className={`px-2 py-1 text-[9px] font-mono font-bold rounded-md border uppercase transition ${
                selectedCategory === 'BURGLARY'
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              Burglaries
            </button>
          </div>
        </div>

        {/* Time Slider timeline playback control */}
        <div className="absolute bottom-4 left-4 right-4 z-10 bg-[#0B0B0F]/95 border border-slate-850 p-3 rounded-xl max-w-xl mx-auto flex items-center gap-4">
          <Clock className="w-4 h-4 text-slate-500 shrink-0" />
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-[8px] font-mono text-slate-500 uppercase font-semibold">
              <span>JAN 2026</span>
              <span>MAR 2026</span>
              <span>JUN 2026 (ACTIVE)</span>
            </div>
            <input
              type="range"
              min="1"
              max="6"
              value={timeValue}
              onChange={e => {
                setTimeValue(Number(e.target.value));
                toast.info(`Map historical playback state: Month ${e.target.value}`);
              }}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500 outline-none"
            />
          </div>
        </div>

        {/* Leaflet Dynamic Wrapper */}
        <div className="flex-1 w-full h-full">
          <MapComponent 
            hotspots={hotspotData.hotspots} 
            heatPoints={hotspotData.heatPoints} 
            cases={cases} 
          />
        </div>
      </div>

      {/* Side Hotspot Analytics Panel */}
      <div className="w-full lg:w-80 flex flex-col gap-4">
        <div className="glass-card rounded-xl p-5 space-y-4 flex-1 overflow-y-auto max-h-[70vh]">
          <div className="flex items-center gap-1.5 border-b border-slate-900 pb-2">
            <Target className="w-4 h-4 text-purple-400" />
            <h4 className="text-xs font-mono text-slate-400 uppercase tracking-widest font-semibold">
              Predictive Hotspots
            </h4>
          </div>

          <div className="space-y-3.5">
            {hotspotData.hotspots.map(h => (
              <div 
                key={h.id} 
                className="p-3.5 bg-slate-950/30 border border-slate-900 hover:border-slate-850 rounded-xl transition-all duration-200 space-y-2 cursor-pointer group"
                onClick={() => {
                  toast.success(`Panning map coordinates to: ${h.name}`);
                }}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${getRiskBg(h.risk)}`}>
                    {h.risk} RISK ZONE
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{h.incidents} incidents</span>
                </div>
                
                <h4 className="text-xs font-bold text-slate-200 group-hover:text-purple-400 transition">
                  {h.name}
                </h4>
                
                <div className="space-y-1 text-[10px] text-slate-450 leading-relaxed font-sans">
                  <p><strong>Primary Offence:</strong> {h.primaryCrime}</p>
                  <p className="text-slate-500 italic mt-1">{h.notes}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
