"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, setJwtToken } from "@/lib/api";
import type { AuthResponse } from "@/lib/types";

type AuthContextValue = {
  token: string | null;
  user: AuthResponse | null;
  login: (payload: { username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  ready: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function isBoardMember(user: AuthResponse | null) {
  return user?.roles.includes("DIRECTIVA") ?? false;
}

function getHomePath(user: AuthResponse | null) {
  if (!user) return "/login";
  if (user.roles.includes("DIRECTIVA")) return "/dashboard";
  if (user.roles.includes("DIRECCION_ESCUELA")) return "/escuela";
  return "/mi-agenda";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    apiRequest<AuthResponse>("/api/auth/me")
      .then((response) => {
        if (response.token) {
          setJwtToken(response.token);
          setToken(response.token);
        } else {
          setToken("session");
        }
        setUser(response);
      })
      .catch(() => {
        setToken(null);
        setUser(null);
      })
      .finally(() => setReady(true));
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
      if (response.token) {
        setJwtToken(response.token);
        setToken(response.token);
      } else {
        setToken("session");
      }
      setUser(response);
      router.push(getHomePath(response));
    },
    async logout() {
      try {
        await apiRequest("/api/auth/logout", { method: "POST" });
      } catch {
        // Si la sesión ya ha sido invalidada en backend, igualmente cerramos la sesión en cliente.
      }
      setJwtToken(null);
      setToken(null);
      setUser(null);
      router.push("/login");
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
