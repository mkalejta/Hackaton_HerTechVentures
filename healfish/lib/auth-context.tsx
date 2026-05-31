"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { auth } from "@/lib/auth";
import { api, ApiUser } from "@/lib/api";

type AuthContextValue = {
  user: ApiUser | null;
  isLoggedIn: boolean;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoggedIn: false,
  loading: true,
  login: async () => {},
  logout: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const u = await api.me();
      setUser(u);
    } catch {
      auth.removeToken();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (auth.isLoggedIn()) {
      fetchUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [fetchUser]);

  const login = useCallback(async (token: string) => {
    auth.setToken(token);
    await fetchUser();
  }, [fetchUser]);

  const logout = useCallback(() => {
    auth.removeToken();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (auth.isLoggedIn()) {
      await fetchUser();
    }
  }, [fetchUser]);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
