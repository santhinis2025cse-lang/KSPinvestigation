'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-[#0B0B0F] flex items-center justify-center">
      <div className="text-slate-500 font-mono text-xs animate-pulse">
        INITIALIZING SECURE SECURITY ROUTER GATEWAY...
      </div>
    </div>
  );
}
