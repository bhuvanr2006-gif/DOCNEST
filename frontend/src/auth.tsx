import { createContext, useContext, useEffect, useState } from "react";
import { api, Household, User } from "./api";

type AuthState = {
  user: User | null;
  household: Household | null;
  households: Household[];
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: Record<string, string>) => Promise<void>;
  logout: () => Promise<void>;
  setHousehold: (h: Household) => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const token = localStorage.getItem("docnest_token");
    if (!token) {
      setUser(null);
      setHouseholds([]);
      setHousehold(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api.get("/auth/me");
      const houses = await api.get("/households/mine");
      setUser(me.data);
      setHouseholds(houses.data);
      const stored = localStorage.getItem("docnest_household");
      const selected = houses.data.find((h: Household) => h.id === stored) || houses.data[0] || null;
      setHousehold(selected);
    } catch {
      localStorage.removeItem("docnest_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        household,
        households,
        loading,
        setHousehold: (h) => {
          setHousehold(h);
          localStorage.setItem("docnest_household", h.id);
        },
        refresh,
        login: async (email, password) => {
          const res = await api.post("/auth/login", { email, password });
          localStorage.setItem("docnest_token", res.data.access_token);
          await refresh();
        },
        register: async (payload) => {
          await api.post("/auth/register", payload);
          const res = await api.post("/auth/login", { email: payload.email, password: payload.password });
          localStorage.setItem("docnest_token", res.data.access_token);
          await refresh();
        },
        logout: async () => {
          try {
            await api.post("/auth/logout");
          } catch {
            /* ignore */
          }
          localStorage.removeItem("docnest_token");
          setUser(null);
          setHousehold(null);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
