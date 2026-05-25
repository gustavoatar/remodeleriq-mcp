import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface AuthUser {
  id: string | number;
  email: string;
  google_user_data?: {
    email: string;
    name: string | null;
    picture: string | null;
    given_name?: string;
  };
  profile?: {
    isPremium: boolean;
    isBetaUser: boolean;
    betaFirstName?: string;
    premiumPurchasedAt: string | null;
    premiumEndsAt: string | null;
    name: string | null;
  };
}

interface AuthContextValue {
  user: AuthUser | null;
  isPending: boolean;
  redirectToLogin: () => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<AuthUser | null>;
  exchangeCodeForSessionToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(path, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isPending, setIsPending] = useState(true);

  const fetchUser = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const res = await apiFetch("/api/users/me");
      if (!res.ok) {
        setUser(null);
        return null;
      }
      const data = (await res.json()) as AuthUser;
      setUser(data);
      return data;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await fetchUser();
      if (!cancelled) setIsPending(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchUser]);

  const redirectToLogin = useCallback(async () => {
    const res = await apiFetch("/api/oauth/google/redirect_url");
    if (!res.ok) {
      throw new Error("Failed to start sign in");
    }
    const { redirectUrl } = (await res.json()) as { redirectUrl: string };
    window.location.href = redirectUrl;
  }, []);

  const logout = useCallback(async () => {
    await apiFetch("/api/logout");
    setUser(null);
  }, []);

  const exchangeCodeForSessionToken = useCallback(async () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) {
      throw new Error("Missing authorization code in URL");
    }
    const res = await apiFetch("/api/sessions", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error(`Session exchange failed: ${errBody || res.status}`);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isPending,
      redirectToLogin,
      logout,
      fetchUser,
      exchangeCodeForSessionToken,
    }),
    [user, isPending, redirectToLogin, logout, fetchUser, exchangeCodeForSessionToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
