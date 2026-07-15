'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../utils/api';

export type Role =
  | 'POLICE_OFFICER'
  | 'INVESTIGATION_OFFICER'
  | 'POLICE_INSPECTOR'
  | 'CRIME_ANALYST'
  | 'SCRB_ADMINISTRATOR'
  | 'SYSTEM_ADMINISTRATOR';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  badgeNumber: string;
  role: Role;
  districtId: string | null;
  policeStationId: string | null;
  district?: { name: string; code: string } | null;
  policeStation?: { name: string; code: string } | null;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  login: (badgeNumber: string, password: string) => Promise<boolean>;
  logout: () => void;
  toggleDemoMode: (enable: boolean) => void;
  switchRole: (role: Role) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// High-fidelity Mock Users for Demo Mode
export const MOCK_USERS: Record<Role, UserProfile> = {
  POLICE_OFFICER: {
    id: 'demo-officer-id',
    email: 'officer@ksp.gov.in',
    name: 'HC Shivashankar Gowda',
    badgeNumber: 'HC-3891',
    role: 'POLICE_OFFICER',
    districtId: 'dist-bng',
    policeStationId: 'ps-kora',
    district: { name: 'Bengaluru City', code: 'BNG_CITY' },
    policeStation: { name: 'Koramangala Police Station', code: 'PS_KORAMANGALA' }
  },
  INVESTIGATION_OFFICER: {
    id: 'demo-investigator-id',
    email: 'investigator@ksp.gov.in',
    name: 'SI Anitha Deshpande',
    badgeNumber: 'SI-4921',
    role: 'INVESTIGATION_OFFICER',
    districtId: 'dist-bng',
    policeStationId: 'ps-indira',
    district: { name: 'Bengaluru City', code: 'BNG_CITY' },
    policeStation: { name: 'Indiranagar Police Station', code: 'PS_INDIRANAGAR' }
  },
  POLICE_INSPECTOR: {
    id: 'demo-inspector-id',
    email: 'inspector@ksp.gov.in',
    name: 'Inspector Satish Kumar',
    badgeNumber: 'PI-8921',
    role: 'POLICE_INSPECTOR',
    districtId: 'dist-bng',
    policeStationId: 'ps-kora',
    district: { name: 'Bengaluru City', code: 'BNG_CITY' },
    policeStation: { name: 'Koramangala Police Station', code: 'PS_KORAMANGALA' }
  },
  CRIME_ANALYST: {
    id: 'demo-analyst-id',
    email: 'analyst@ksp.gov.in',
    name: 'Dr. Kiran Kulkarni',
    badgeNumber: 'AN-7731',
    role: 'CRIME_ANALYST',
    districtId: 'dist-bng',
    policeStationId: null,
    district: { name: 'Bengaluru City', code: 'BNG_CITY' },
    policeStation: null
  },
  SCRB_ADMINISTRATOR: {
    id: 'demo-scrb-id',
    email: 'admin@ksp.gov.in',
    name: 'Administrator SCRB',
    badgeNumber: 'AD-1001',
    role: 'SCRB_ADMINISTRATOR',
    districtId: null,
    policeStationId: null,
    district: null,
    policeStation: null
  },
  SYSTEM_ADMINISTRATOR: {
    id: 'demo-sys-id',
    email: 'sysadmin@ksp.gov.in',
    name: 'SysAdmin KSP',
    badgeNumber: 'SY-9901',
    role: 'SYSTEM_ADMINISTRATOR',
    districtId: null,
    policeStationId: null,
    district: null,
    policeStation: null
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true); // default to true for instant demo capability
  const router = useRouter();

  useEffect(() => {
    // Load saved auth from local storage
    const savedToken = localStorage.getItem('ksp_auth_token');
    const savedUser = localStorage.getItem('ksp_auth_user');
    const savedDemoMode = localStorage.getItem('ksp_demo_mode');

    if (savedDemoMode !== null) {
      setIsDemoMode(savedDemoMode === 'true');
    }

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (badgeNumber: string, password: string): Promise<boolean> => {
    if (isDemoMode) {
      // Offline mock authentication matching credentials in seed
      let roleMatch: Role = 'POLICE_OFFICER';
      if (badgeNumber.includes('HC')) roleMatch = 'POLICE_OFFICER';
      else if (badgeNumber.includes('SI')) roleMatch = 'INVESTIGATION_OFFICER';
      else if (badgeNumber.includes('PI')) roleMatch = 'POLICE_INSPECTOR';
      else if (badgeNumber.includes('AN')) roleMatch = 'CRIME_ANALYST';
      else if (badgeNumber.includes('AD')) roleMatch = 'SCRB_ADMINISTRATOR';
      else if (badgeNumber.includes('SY')) roleMatch = 'SYSTEM_ADMINISTRATOR';

      const mockProfile = MOCK_USERS[roleMatch];
      
      setUser(mockProfile);
      setToken('mock-jwt-token-for-ksp-demo');
      localStorage.setItem('ksp_auth_token', 'mock-jwt-token-for-ksp-demo');
      localStorage.setItem('ksp_auth_user', JSON.stringify(mockProfile));
      router.push('/dashboard');
      return true;
    }

    // Production backend connectivity
    try {
      const data = await apiFetch<{ token: string; user: UserProfile }>('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ badgeNumber, password }),
      }, false);

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('ksp_auth_token', data.token);
      localStorage.setItem('ksp_auth_user', JSON.stringify(data.user));
      router.push('/dashboard');
      return true;
    } catch (error) {
      console.error('Production login error, switching to demo mode', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('ksp_auth_token');
    localStorage.removeItem('ksp_auth_user');
    router.push('/login');
  };

  const toggleDemoMode = (enable: boolean) => {
    setIsDemoMode(enable);
    localStorage.setItem('ksp_demo_mode', enable ? 'true' : 'false');
  };

  const switchRole = (role: Role) => {
    const nextUser = MOCK_USERS[role];
    setUser(nextUser);
    localStorage.setItem('ksp_auth_user', JSON.stringify(nextUser));
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isDemoMode,
        login,
        logout,
        toggleDemoMode,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
