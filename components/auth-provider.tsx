"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import type { AuthResponse } from "@/lib/types";

type AuthContextValue = {
  token: string | null;
  user: AuthResponse | null;
  login: (payload: { username: string; password: string }) => Promise<void>;
  logout: () => void;
  ready: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "amueci-token";
const USER_KEY = "amueci-user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const storedToken = window.localStorage.getItem(TOKEN_KEY);
    const storedUser = window.localStorage.getItem(USER_KEY);
    setToken(storedToken);
    setUser(storedUser ? JSON.parse(storedUser) as AuthResponse : null);
    setReady(true);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    token,
    user,
    ready,
    async login(payload) {
      const response = await apiRequest<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      window.localStorage.setItem(TOKEN_KEY, response.token ?? "");
      window.localStorage.setItem(USER_KEY, JSON.stringify(response));
      setToken(response.token);
      setUser(response);
      router.push("/dashboard");
    },
    logout() {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(USER_KEY);
      setToken(null);
      setUser(null);
      router.push("/");
    },
  }), [ready, router, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}
