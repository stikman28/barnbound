"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { apiGet } from "@/lib/client";

export type User = {
  id: string;
  email: string;
  name: string;
  location: string | null;
  role: string;
} | null;

type Ctx = {
  user: User;
  loading: boolean;
  setUser: (u: User) => void;
  refresh: () => Promise<void>;
};

const UserContext = createContext<Ctx>({
  user: null,
  loading: true,
  setUser: () => {},
  refresh: async () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { user } = await apiGet<{ user: User }>("/api/auth/me");
      setUser(user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <UserContext.Provider value={{ user, loading, setUser, refresh }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
