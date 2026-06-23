import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../api/client';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'patient' | 'clinician';
  consent_given: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const profileData = await apiFetch<User>('/api/auth/me');
          setUser(profileData);
        } catch (error) {
          console.error('Failed to restore authentication session:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('role');
        }
      }
      setLoading(false);
    };
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const loginData = await apiFetch<{ access_token: string; role: 'patient' | 'clinician'; user_id: number; full_name: string }>('/api/auth/login', {
        json: { email, password }
      });
      const { access_token, role } = loginData;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('role', role);
      
      // Fetch user profile info
      const profileData = await apiFetch<User>('/api/auth/me');
      setUser(profileData);
    } finally {
      setLoading(false);
    }
  };

  const register = async (regData: any) => {
    setLoading(true);
    try {
      await apiFetch('/api/auth/register', { json: regData });
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
