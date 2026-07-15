'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from './Sidebar';
import { CommandPalette } from './CommandPalette';
import { Toaster } from 'sonner';
import { Bell, Command, Search, ShieldAlert, Cpu, AlertCircle, CheckCircle, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ClientLayoutWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  // If on login page, do not render layout sidebar/header
  const isLoginPage = pathname === '/login';

  const mockNotifications = [
    {
      id: 1,
      title: 'Burglary Spike Alert',
      content: 'Burglary incidents in Indiranagar have increased by 25% over the past 14 days.',
      type: 'CRIME_SPIKE',
      time: '12m ago',
    },
    {
      id: 2,
      title: 'High Risk Offender Spotted',
      content: 'KA-01-HE-7890 (Black Activa) connected to Ramesh Kumar scanned by Koramangala ANPR.',
      type: 'HIGH_RISK_ALERT',
      time: '1h ago',
    },
    {
      id: 3,
      title: 'AI Investigation Lead',
      content: 'Co-conspiracy suspect match detected between Syed Karim and new FIR-2026-0056.',
      type: 'AI_RECOMMENDATION',
      time: '3h ago',
    },
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'CRIME_SPIKE':
        return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      case 'HIGH_RISK_ALERT':
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'AI_RECOMMENDATION':
        return <Cpu className="w-4 h-4 text-purple-400" />;
      default:
        return <CheckCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  // If not authenticated and trying to access app pages, we let the page handle redirect or show login page
  if (isLoginPage || !isAuthenticated) {
    return (
      <div className="bg-[#0B0B0F] min-h-screen text-slate-100 flex flex-col justify-center">
        {children}
        <Toaster theme="dark" closeButton position="top-right" />
      </div>
    );
  }

  return (
    <div className="bg-[#0B0B0F] text-slate-100 min-h-screen flex overflow-hidden font-sans">
      {isMobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/70 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Navigation Sidebar */}
      <Sidebar
        mobileOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Panel Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Main Command Header */}
        <header className="h-16 border-b border-slate-900 px-4 sm:px-6 flex items-center justify-between bg-slate-950/20 backdrop-blur-md sticky top-0 z-30 select-none">
          {/* Quick Command Trigger Search */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              aria-label="Open navigation"
              className="md:hidden p-2 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              {isMobileSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <div className="hidden sm:flex items-center gap-2 min-w-0">
              <span className="text-xs text-slate-500 font-mono tracking-widest font-semibold uppercase">
                Command Station:
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-purple-400 truncate">
                {user?.district?.name || 'KSP Headquarters'}
              </span>
            </div>
          </div>

          {/* Action Hub */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Command Palette Tooltip Hint */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/50 border border-slate-850 hover:border-slate-800 transition-all duration-150 cursor-pointer text-slate-400 hover:text-slate-200">
              <Search className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Search Command...</span>
              <kbd className="flex items-center gap-0.5 text-[10px] font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-slate-500">
                <Command className="w-2.5 h-2.5" /> K
              </kbd>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 rounded-lg border transition-all duration-150 relative ${
                  showNotifications
                    ? 'bg-slate-900 border-slate-800 text-purple-400'
                    : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
              </button>

              {/* Notification Drawer */}
              <AnimatePresence>
                {showNotifications && (
                  <>
                    {/* Overlay Click Target */}
                    <div 
                      className="fixed inset-0 z-30" 
                      onClick={() => setShowNotifications(false)}
                    />
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-80 bg-[#0B0B0F] border border-slate-850 rounded-xl shadow-2xl shadow-black/85 z-40 overflow-hidden divide-y divide-slate-900"
                    >
                      <div className="p-3 bg-slate-950/60 flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">Live Alert Log</span>
                        <span className="text-[10px] font-mono text-purple-400 font-semibold bg-purple-950/30 border border-purple-900/50 px-1.5 py-0.5 rounded">
                          3 UNREAD
                        </span>
                      </div>
                      
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-900/50">
                        {mockNotifications.map(n => (
                          <div key={n.id} className="p-3 hover:bg-slate-900/30 transition-colors duration-150 space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 font-medium text-xs text-white">
                                {getNotificationIcon(n.type)}
                                <span>{n.title}</span>
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono">{n.time}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{n.content}</p>
                          </div>
                        ))}
                      </div>

                      <div className="p-2 text-center bg-slate-950/30">
                        <span className="text-[10px] text-slate-500 hover:text-slate-300 font-mono tracking-wider font-semibold cursor-pointer uppercase">
                          View All Security Logs
                        </span>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Dynamic Page Routing Screen Viewport */}
        <main className="flex-1 overflow-y-auto bg-[#0B0B0F] relative">
          <div className="h-full p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Global Shortcut Command Palette */}
      <CommandPalette />

      {/* Modern dark-themed sonner feedback utility */}
      <Toaster theme="dark" closeButton position="top-right" />
    </div>
  );
};
