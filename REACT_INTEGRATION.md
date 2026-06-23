# React Integration Guide - FastAPI Authentication

This guide details how to integrate your decoupled React frontend with the implemented FastAPI authentication endpoints. 

---

## 1. Authentication Endpoints Summary

| Endpoint | Method | Content-Type | Request Body | Response Body |
| :--- | :--- | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | `application/json` | `{ email, full_name, role, consent_given, password }` | `{ id, email, full_name, role, consent_given }` |
| `/api/auth/login` | `POST` | `application/json` | `{ email, password }` | `{ access_token, token_type, role, user_id, full_name }` |
| `/api/auth/me` | `GET` | *None* | *None* (Requires `Authorization: Bearer <token>`) | `{ id, email, full_name, role, consent_given }` |

---

## 2. API Client Setup (Native Fetch Wrapper)

Configure a lightweight API fetch client using standard browser native `fetch` that automatically attaches the JWT Bearer token to outgoing requests and handles unauthorized (`401`) errors.

```typescript
// src/api/client.ts
const API_URL = 'http://127.0.0.1:8000';

interface FetchOptions extends RequestInit {
  json?: any;
}

export async function apiFetch<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { json, headers, ...customConfig } = options;
  const token = localStorage.getItem('token');

  // Set default Headers
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const config: RequestInit = {
    method: json ? 'POST' : 'GET',
    headers: {
      ...defaultHeaders,
      ...headers,
    },
    ...customConfig,
  };

  if (json) {
    config.body = JSON.stringify(json);
  }

  const response = await fetch(`${API_URL}${endpoint}`, config);

  // Catch expired or invalid tokens (401)
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = '/login';
    throw new Error('Session unauthorized or expired');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'API request failed');
  }

  return response.json();
}
```

---

## 3. React Auth Context (`AuthContext.tsx`)

Implement a global Authentication Provider to maintain the user's logged-in state, role, and profile details across React components using the native `apiFetch` helper.

```tsx
// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../api/client';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'patient' | 'clinician';
  consent_given: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: str) => Promise<void>;
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
        }
      }
      setLoading(false);
    };
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: str) => {
    setLoading(true);
    try {
      const loginData = await apiFetch<{ access_token: string; role: string }>('/api/auth/login', {
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
```

---

## 4. Protected Route Wrapper (`ProtectedRoute.tsx`)

Guard specific pages so they are only accessible to authenticated users with the appropriate role (e.g., patient vs. clinician).

```tsx
// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('patient' | 'clinician')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-spinner">Loading authentication session...</div>;
  }

  // Redirect to login if user is not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to unauthorized access screen if user's role is not allowed
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
```

---

## 5. Usage Example (React Router Integration)

Inject the Auth Provider and Route Guards into your React application routes.

```tsx
// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PatientDashboard from './pages/PatientDashboard';
import ClinicianDashboard from './pages/ClinicianDashboard';

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected Patient Routes */}
          <Route 
            path="/patient/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Protected Clinician Routes */}
          <Route 
            path="/clinician/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['clinician']}>
                <ClinicianDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Fallback */}
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
```
