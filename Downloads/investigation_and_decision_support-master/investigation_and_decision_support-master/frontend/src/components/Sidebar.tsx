'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, Role } from '../context/AuthContext';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Search,
  MessageSquareCode,
  Map,
  Users2,
  Share2,
  FileBarChart2,
  Briefcase,
  History,
  Settings,
  LogOut,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  className?: string;
  mobileOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ className = '', mobileOpen = false, onClose }) => {
  const pathname = usePathname();
  const { user, logout, switchRole, isDemoMode } = useAuth();

  if (!user) return null;

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: [] },
    { name: 'Crime Search', icon: Search, path: '/search', roles: [] },
    { name: 'AI Copilot', icon: MessageSquareCode, path: '/assistant', roles: [] },
    { name: 'Crime Map', icon: Map, path: '/map', roles: [] },
    { name: 'Criminal Profiles', icon: Users2, path: '/criminals', roles: [] },
    { name: 'Network Graph', icon: Share2, path: '/network', roles: [] },
    { name: 'Reports Desk', icon: FileBarChart2, path: '/reports', roles: [] },
    { name: 'Workspace', icon: Briefcase, path: '/workspace', roles: [] },
    {
      name: 'Audit Logs',
      icon: History,
      path: '/audit',
      roles: ['SYSTEM_ADMINISTRATOR', 'SCRB_ADMINISTRATOR'],
    },
    { name: 'Settings', icon: Settings, path: '/settings', roles: [] },
  ];

  const filteredItems = menuItems.filter(
    item => item.roles.length === 0 || item.roles.includes(user.role)
  );

  const rolesList: { value: Role; label: string }[] = [
    { value: 'POLICE_OFFICER', label: 'Police Officer' },
    { value: 'INVESTIGATION_OFFICER', label: 'Investigation Officer' },
    { value: 'POLICE_INSPECTOR', label: 'Police Inspector' },
    { value: 'CRIME_ANALYST', label: 'Crime Analyst' },
    { value: 'SCRB_ADMINISTRATOR', label: 'SCRB Administrator' },
    { value: 'SYSTEM_ADMINISTRATOR', label: 'System Admin' },
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-[#0B0B0F] border-r border-slate-900 flex flex-col justify-between h-screen text-slate-400 select-none transition-transform duration-300 md:static md:w-64 md:translate-x-0 md:border-r md:h-screen shadow-2xl shadow-black/60 md:shadow-none ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} ${className}`}
    >
      {/* Brand Header */}
      <div>
        <div className="p-6 border-b border-slate-900 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-900/30">
            K
          </div>
          <div>
            <h1 className="font-semibold text-white tracking-wider text-sm">KSP COMMAND</h1>
            <p className="text-[10px] text-purple-400 tracking-widest font-mono uppercase font-semibold">
              INTEL PLATFORM
            </p>
          </div>
        </div>

        {/* Main Menu Links */}
        <nav className="p-4 space-y-1">
          {filteredItems.map(item => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.name}
                href={item.path}
                onClick={() => onClose?.()}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group ${
                  isActive
                    ? 'text-white font-medium bg-slate-900/50 border border-slate-800'
                    : 'hover:text-white hover:bg-slate-900/20 border border-transparent'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-indicator"
                    className="absolute left-0 w-1 h-5 rounded-r bg-purple-500"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <item.icon
                  className={`w-4 h-4 transition-transform duration-200 group-hover:scale-105 ${
                    isActive ? 'text-purple-400' : 'text-slate-500 group-hover:text-slate-400'
                  }`}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Demo Switcher */}
      <div className="p-4 border-t border-slate-900 space-y-3">
        {/* Datathon Role Switcher */}
        {isDemoMode && (
          <div className="bg-purple-950/20 border border-purple-900/40 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-purple-400 uppercase font-semibold mb-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Demo Role Simulator</span>
            </div>
            <select
              value={user.role}
              onChange={e => switchRole(e.target.value as Role)}
              className="w-full bg-[#0B0B0F] border border-slate-850 rounded text-xs py-1.5 px-2 text-slate-300 focus:outline-none focus:border-purple-600 cursor-pointer"
            >
              {rolesList.map(r => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* User Card */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-slate-850 border border-slate-800 flex items-center justify-center text-slate-300 font-medium shrink-0">
              {user.name.split(' ').pop()?.substring(0, 2).toUpperCase() || 'P'}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-medium text-white truncate">{user.name}</h4>
              <p className="text-[10px] text-slate-500 font-mono truncate">{user.badgeNumber}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 hover:bg-slate-900 hover:text-white rounded-lg transition-colors duration-150 text-slate-500"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
