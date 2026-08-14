import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { api } from "./api";

interface AuthStatus {
  setupDone: boolean;
  authenticated: boolean;
  teacherName: string;
  schoolName: string;
}

interface AuthContextValue extends AuthStatus {
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>({
    setupDone: false,
    authenticated: false,
    teacherName: "",
    schoolName: "",
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const s = await api.get<AuthStatus>("/auth/status");
    setStatus(s);
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const logout = useCallback(async () => {
    await api.post("/auth/logout");
    await refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ ...status, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
