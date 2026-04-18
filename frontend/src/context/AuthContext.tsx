import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAppSelector } from '../redux/hooks';

interface UserProfile {
  _id: string;
  email: string;
  name?: string;
  role: 'CLIENT' | 'FREELANCER';
  bio?: string;
  avatar?: string;
  companyName?: string;
  industry?: string;
  website?: string;
  projectsPosted?: number;
  activeProjects?: number;
  title?: string;
  skills?: string[];
  experience?: string;
  portfolioLinks?: string[];
  github?: string;
  linkedin?: string;
  completedProjects?: number;
  rating?: number;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, token } = useAppSelector((state) => state.auth);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshProfile = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setUser(null);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/user/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else if (response.status === 401) {
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  return (
    <AuthContext.Provider value={{ user, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
