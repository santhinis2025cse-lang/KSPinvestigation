'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from 'cmdk';
import {
  Search,
  LayoutDashboard,
  MessageSquareCode,
  Map,
  Users2,
  Share2,
  Briefcase,
  FileText,
  AlertTriangle,
  Zap,
} from 'lucide-react';

export const CommandPalette: React.FC = () => {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const navigate = (path: string) => {
    router.push(path);
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-2xl bg-[#0B0B0F]/95 border border-slate-800 rounded-xl overflow-hidden shadow-2xl shadow-black/80 max-h-[55vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <Command className="flex flex-col" shouldFilter={true}>
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 border-b border-slate-900 bg-slate-950/40">
            <Search className="w-4 h-4 text-slate-500 shrink-0" />
            <CommandInput
              autoFocus
              placeholder="Search FIRs, suspects, or navigate pages (Ctrl+K)..."
              className="w-full h-12 bg-transparent text-sm text-slate-200 outline-none placeholder-slate-600 border-none focus:ring-0"
            />
            <kbd className="text-[10px] bg-slate-900 border border-slate-800 rounded text-slate-500 font-mono py-0.5 px-1.5 shrink-0">
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <CommandList className="overflow-y-auto p-2 max-h-[42vh]">
            <CommandEmpty className="p-6 text-center text-xs text-slate-600">
              No intelligence matches found. Try a different keyword.
            </CommandEmpty>

            {/* Quick AI Actions */}
            <CommandGroup heading="AI Command Tasks" className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-purple-400 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1">
              <CommandItem
                onSelect={() => navigate('/map?action=predict')}
                className="flex items-center gap-3 px-3 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-900/60 rounded-md cursor-pointer transition-colors duration-150 aria-selected:bg-slate-900/60 aria-selected:text-white"
              >
                <Zap className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>Run Hotspot Predictive Analysis (AI Model)</span>
              </CommandItem>
              <CommandItem
                onSelect={() => navigate('/criminals?status=ACTIVE&riskMin=75')}
                className="flex items-center gap-3 px-3 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-900/60 rounded-md cursor-pointer transition-colors duration-150 aria-selected:bg-slate-900/60 aria-selected:text-white"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Filter High-Risk Repeat Offenders</span>
              </CommandItem>
            </CommandGroup>

            {/* Navigation */}
            <CommandGroup heading="Navigation" className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-slate-500 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1">
              {[
                { label: 'Command Dashboard', icon: LayoutDashboard, path: '/dashboard' },
                { label: 'KSP Investigation Copilot', icon: MessageSquareCode, path: '/assistant' },
                { label: 'GIS Crime Map', icon: Map, path: '/map' },
                { label: 'Criminal Network Graph', icon: Share2, path: '/network' },
                { label: 'Investigation Workspace', icon: Briefcase, path: '/workspace' },
                { label: 'Criminal Profiles', icon: Users2, path: '/criminals' },
              ].map((item) => (
                <CommandItem
                  key={item.path}
                  onSelect={() => navigate(item.path)}
                  className="flex items-center gap-3 px-3 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-900/60 rounded-md cursor-pointer transition-colors duration-150 aria-selected:bg-slate-900/60 aria-selected:text-white"
                >
                  <item.icon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Go to {item.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>

            {/* Recent Cases */}
            <CommandGroup heading="Recent Case Files (FIRs)" className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-slate-500 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1">
              {[
                { fir: 'FIR-2026-0045', label: 'Robbery · Koramangala' },
                { fir: 'FIR-2026-0056', label: 'Burglary · Indiranagar' },
                { fir: 'FIR-2026-0062', label: 'Cybercrime · Whitefield' },
              ].map((item) => (
                <CommandItem
                  key={item.fir}
                  onSelect={() => navigate(`/search?q=${item.fir}`)}
                  className="flex items-center gap-3 px-3 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-900/60 rounded-md cursor-pointer transition-colors duration-150 aria-selected:bg-slate-900/60 aria-selected:text-white"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="font-mono font-bold">{item.fir}</span>
                  <span className="text-slate-500">[{item.label}]</span>
                </CommandItem>
              ))}
            </CommandGroup>

            {/* Criminal Records */}
            <CommandGroup heading="Criminal Database Records" className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-slate-500 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1">
              {[
                { id: 'crim-1', name: "Ramesh 'Kulla' Kumar", risk: 85 },
                { id: 'crim-2', name: "Shaji 'Doctor' Mathew", risk: 92 },
                { id: 'crim-3', name: "Syed 'Bhai' Karim", risk: 78 },
              ].map((c) => (
                <CommandItem
                  key={c.id}
                  onSelect={() => navigate(`/criminals/${c.id}`)}
                  className="flex items-center gap-3 px-3 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-900/60 rounded-md cursor-pointer transition-colors duration-150 aria-selected:bg-slate-900/60 aria-selected:text-white"
                >
                  <Users2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>{c.name}</span>
                  <span className="text-rose-500 font-mono font-bold text-[10px]">Risk: {c.risk}%</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    </div>
  );
};
