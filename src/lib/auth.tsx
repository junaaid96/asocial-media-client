import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { SESSION_EXPIRED, api, tokenStore } from "./api";
import type { Me } from "./types";

interface AuthValue {
  me: Me | null;
  loading: boolean;
  signIn: (token: string, user: Me) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState(() => tokenStore.get());

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => api<{ user: Me }>("/auth/me").then((r) => r.user),
    enabled: !!token,
    staleTime: 5 * 60_000,
    retry: false,
  });

  const signIn = useCallback(
    (nextToken: string, user: Me) => {
      tokenStore.set(nextToken);
      queryClient.clear();
      queryClient.setQueryData(["me"], user);
      setToken(nextToken);
    },
    [queryClient],
  );

  const signOut = useCallback(() => {
    tokenStore.set(null);
    setToken(null);
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    const onExpired = () => {
      signOut();
      toast("Your session ended. Please sign in again.");
    };
    window.addEventListener(SESSION_EXPIRED, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED, onExpired);
  }, [signOut]);

  const value = useMemo<AuthValue>(
    () => ({
      me: token ? (meQuery.data ?? null) : null,
      loading: !!token && meQuery.isPending,
      signIn,
      signOut,
    }),
    [token, meQuery.data, meQuery.isPending, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
