'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  userId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  userId: null,
  isAuthenticated: false,
  isLoading: true,
  refreshSession: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/vote/status');
      if (res.ok) {
        const data = await res.json();
        setUserId(data.userId || null);
      } else {
        setUserId(null);
      }
    } catch (err) {
      console.error('Session check failed:', err);
      setUserId(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        userId,
        isAuthenticated: !!userId,
        isLoading,
        refreshSession: fetchSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom Hook for clean consumption
export const useAuth = () => useContext(AuthContext);