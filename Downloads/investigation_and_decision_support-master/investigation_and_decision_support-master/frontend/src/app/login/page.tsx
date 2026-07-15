'use client';

import React, { useState } from 'react';
import { useAuth, Role } from '../../context/AuthContext';
import { ShieldCheck, Eye, EyeOff, User, Lock, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const { login, isDemoMode, toggleDemoMode } = useAuth();
  const [badgeNumber, setBadgeNumber] = useState('SI-4921');
  const [password, setPassword] = useState('Ksp@12345');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRoleSelect = (role: Role) => {
    switch (role) {
      case 'POLICE_OFFICER':
        setBadgeNumber('HC-3891');
        break;
      case 'INVESTIGATION_OFFICER':
        setBadgeNumber('SI-4921');
        break;
      case 'POLICE_INSPECTOR':
        setBadgeNumber('PI-8921');
        break;
      case 'CRIME_ANALYST':
        setBadgeNumber('AN-7731');
        break;
      case 'SCRB_ADMINISTRATOR':
        setBadgeNumber('AD-1001');
        break;
      case 'SYSTEM_ADMINISTRATOR':
        setBadgeNumber('SY-9901');
        break;
    }
    setPassword('Ksp@12345'); // Predefined password for all seed accounts
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const success = await login(badgeNumber, password);
      if (!success) {
        setError('Invalid badge number or security password.');
      }
    } catch (err) {
      setError('Connection to security gateway failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0B0B0F]">
      {/* Left side: branding/command center hero */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 border-r border-slate-900 bg-gradient-to-b from-slate-950 via-[#0B0B0F] to-purple-950/20 relative overflow-hidden">
        {/* Decorative Grid Network Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f0f15_1px,transparent_1px),linear-gradient(to_bottom,#0f0f15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60" />
        
        {/* Glow */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-900/10 blur-[120px] pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-purple-900/30">
            K
          </div>
          <div>
            <h2 className="font-bold text-white tracking-widest text-sm font-mono uppercase">KARNATAKA STATE POLICE</h2>
            <p className="text-[10px] text-purple-400 tracking-widest font-mono uppercase font-semibold">COMMAND CENTER</p>
          </div>
        </div>

        <div className="relative z-10 space-y-6 max-w-lg">
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-purple-400 font-bold tracking-widest uppercase bg-purple-950/40 border border-purple-900/60 px-2.5 py-1 rounded-full">
              KSP Datathon 2026
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-white leading-tight">
              AI-Powered Crime Intelligence & Decision Support
            </h1>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed font-sans">
            Secure multi-role platform for district analysis, crime similarity mapping, gang networks, and geospatial predictive hot zoning. Authorized personnel access only.
          </p>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-900">
            <div>
              <h4 className="text-xs font-mono text-slate-500 uppercase">CLASSIFICATION</h4>
              <p className="text-xs text-slate-300 font-medium">SECRET // KSP INTEL</p>
            </div>
            <div>
              <h4 className="text-xs font-mono text-slate-500 uppercase">JURISDICTION</h4>
              <p className="text-xs text-slate-300 font-medium">STATE OF KARNATAKA</p>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-slate-600 font-mono relative z-10">
          © 2026 Karnataka State Police (SCRB) • Secure Cryptographic Gateway v2.4.2
        </p>
      </div>

      {/* Right side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#0B0B0F] relative">
        <div className="w-full max-w-md space-y-8 relative z-10">
          {/* Logo Badge (visible on mobile) */}
          <div className="lg:hidden flex justify-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-purple-900/20">
              K
            </div>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-white tracking-tight">Security Gateway Login</h2>
            <p className="text-slate-400 text-sm">Provide your official badge credentials to access KSP systems.</p>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-950/20 border border-rose-900/40 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-400 uppercase font-semibold">Badge Number</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-600" />
                <input
                  type="text"
                  required
                  value={badgeNumber}
                  onChange={e => setBadgeNumber(e.target.value)}
                  placeholder="e.g. SI-4921"
                  className="w-full bg-[#111118]/80 border border-slate-850 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-400 uppercase font-semibold">Security Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-600" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#111118]/80 border border-slate-850 rounded-xl py-2.5 pl-10 pr-10 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-600 hover:text-slate-400"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer select-none">
                <input type="checkbox" className="rounded border-slate-800 bg-slate-900 text-purple-600 focus:ring-0" />
                <span>Remember Credentials</span>
              </label>
              <span className="text-purple-400 hover:underline cursor-pointer">Forgot Password?</span>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900 text-white font-medium text-sm py-2.5 rounded-xl transition-all duration-150 flex items-center justify-center gap-2 mt-4 hover:shadow-lg hover:shadow-purple-950/30"
            >
              {loading ? 'Decrypting credentials...' : 'Authenticate Identity'}
            </button>
          </form>

          {/* Interactive Role Presets for Demo Mode */}
          <div className="pt-6 border-t border-slate-900 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-mono text-purple-400 uppercase font-semibold">
                <Cpu className="w-4 h-4 text-purple-400" />
                <span>Datathon Role Presets</span>
              </div>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDemoMode}
                  onChange={e => toggleDemoMode(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-900 text-purple-600 focus:ring-0"
                />
                <span>Demo Mode</span>
              </label>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              Click any preset to instantly pre-fill specific credentials to test role-based permissions (Dashboard, Audit logs, reports desks etc.)
            </p>
            <div className="grid grid-cols-2 gap-2 text-center">
              <button
                onClick={() => handleRoleSelect('POLICE_OFFICER')}
                className="px-2 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 text-[10px] rounded-lg border border-slate-850 hover:border-slate-800 transition font-medium"
              >
                Police Officer
              </button>
              <button
                onClick={() => handleRoleSelect('INVESTIGATION_OFFICER')}
                className="px-2 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 text-[10px] rounded-lg border border-slate-850 hover:border-slate-800 transition font-medium"
              >
                Investigator (SI)
              </button>
              <button
                onClick={() => handleRoleSelect('POLICE_INSPECTOR')}
                className="px-2 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 text-[10px] rounded-lg border border-slate-850 hover:border-slate-800 transition font-medium"
              >
                Inspector
              </button>
              <button
                onClick={() => handleRoleSelect('CRIME_ANALYST')}
                className="px-2 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 text-[10px] rounded-lg border border-slate-850 hover:border-slate-800 transition font-medium"
              >
                Crime Analyst
              </button>
              <button
                onClick={() => handleRoleSelect('SCRB_ADMINISTRATOR')}
                className="px-2 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 text-[10px] rounded-lg border border-slate-850 hover:border-slate-800 transition font-medium"
              >
                SCRB Admin
              </button>
              <button
                onClick={() => handleRoleSelect('SYSTEM_ADMINISTRATOR')}
                className="px-2 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 text-[10px] rounded-lg border border-slate-850 hover:border-slate-800 transition font-medium"
              >
                System Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
