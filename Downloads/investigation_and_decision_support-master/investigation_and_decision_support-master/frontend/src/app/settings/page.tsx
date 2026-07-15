'use client';

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Settings, Shield, User, Bell, Key, Cpu, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function SystemSettings() {
  const { user, isDemoMode, toggleDemoMode } = useAuth();

  const handleSave = () => {
    toast.success('System preferences updated successfully.');
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">KSP Terminal Settings</h2>
        <p className="text-xs text-slate-500">Configure your system preferences, access credentials, and security API keys.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: settings tabs / headers */}
        <div className="glass-card rounded-xl p-5 space-y-3 h-fit text-xs font-semibold text-slate-400 font-sans">
          <div className="flex items-center gap-2 p-2 bg-slate-900 text-white rounded-lg border border-slate-800">
            <User className="w-4 h-4 text-purple-400" />
            <span>Profile Information</span>
          </div>
          <div 
            onClick={() => toast.info('Notification parameters are preset for KSP alerts.')}
            className="flex items-center gap-2 p-2 hover:bg-slate-900/40 hover:text-white rounded-lg cursor-pointer transition"
          >
            <Bell className="w-4 h-4 text-slate-500" />
            <span>Notification Settings</span>
          </div>
          <div 
            onClick={() => toast.info('Crypto passwords locked by Active Directory.')}
            className="flex items-center gap-2 p-2 hover:bg-slate-900/40 hover:text-white rounded-lg cursor-pointer transition"
          >
            <Key className="w-4 h-4 text-slate-500" />
            <span>Security & Passwords</span>
          </div>
        </div>

        {/* Right Columns: actual forms */}
        <div className="md:col-span-2 space-y-6">
          {/* User profile form card */}
          <div className="glass-card rounded-xl p-5 space-y-4">
            <h4 className="text-xs font-mono text-slate-400 uppercase tracking-widest font-semibold border-b border-slate-900 pb-2 flex items-center gap-1.5">
              <User className="w-4 h-4 text-purple-400" />
              <span>Officer Biometrics</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Full Name</label>
                <input
                  type="text"
                  disabled
                  value={user?.name || ''}
                  className="w-full bg-[#111118]/80 border border-slate-850 rounded-lg py-2 px-3 text-slate-400 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Badge ID Code</label>
                <input
                  type="text"
                  disabled
                  value={user?.badgeNumber || ''}
                  className="w-full bg-[#111118]/80 border border-slate-850 rounded-lg py-2 px-3 text-slate-400 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full bg-[#111118]/80 border border-slate-850 rounded-lg py-2 px-3 text-slate-400 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Assigned Station</label>
                <input
                  type="text"
                  disabled
                  value={user?.policeStation?.name || 'KSP Headquarters'}
                  className="w-full bg-[#111118]/80 border border-slate-850 rounded-lg py-2 px-3 text-slate-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* System API Gateway (Production vs Demo selector) */}
          <div className="glass-card rounded-xl p-5 space-y-4">
            <h4 className="text-xs font-mono text-slate-400 uppercase tracking-widest font-semibold border-b border-slate-900 pb-2 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>API Gateway Configuration</span>
            </h4>

            <div className="space-y-4 text-xs">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h5 className="font-semibold text-white">System Demo Mode Toggle</h5>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    When enabled, the terminal uses pre-seeded simulated Karnataka crime datasets. Disable this to route active logins and queries to Node.js / PostgreSQL and FastAPI Python AI servers.
                  </p>
                </div>
                <div className="shrink-0 pt-1">
                  <input
                    type="checkbox"
                    checked={isDemoMode}
                    onChange={e => {
                      toggleDemoMode(e.target.checked);
                      toast.success(
                        e.target.checked 
                          ? 'Gateway redirected to Simulated Demo datasets.' 
                          : 'Gateway redirected to production REST API endpoints.'
                      );
                    }}
                    className="w-8 h-4 rounded-full bg-slate-900 text-purple-600 focus:ring-0 appearance-none border border-slate-800 checked:bg-purple-600 transition cursor-pointer relative after:content-[\'\'] after:absolute after:top-[2px] after:left-[2px] after:w-2.5 after:h-2.5 after:rounded-full after:bg-slate-400 checked:after:left-[16px] checked:after:bg-white after:transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-900/50">
                <label className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Active REST API Server URL</label>
                <input
                  type="text"
                  disabled={isDemoMode}
                  defaultValue="http://localhost:5000/api"
                  className="w-full bg-[#111118]/80 border border-slate-850 rounded-lg py-2 px-3 text-slate-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-lg transition"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
