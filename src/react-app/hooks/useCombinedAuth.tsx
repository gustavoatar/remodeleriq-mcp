import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@getmocha/users-service/react';

// Magic link user type
interface MagicLinkUser {
  id: number;
  email: string;
  name: string | null;
  isPremium: boolean;
  premiumEndsAt: string | null;
}

// Combined user type that works with both auth systems
export interface CombinedUser {
  id: string;
  email: string;
  name?: string | null;
  picture?: string | null;
  isPremium?: boolean;
  premiumEndsAt?: string | null;
  authType: 'google' | 'magic-link';
  // Original profile data if from Google auth
  profile?: {
    isPremium?: boolean;
    premiumEndsAt?: string | null;
    premiumPurchasedAt?: string | null;
  };
}

interface CombinedAuthContextValue {
  user: CombinedUser | null;
  isPending: boolean;
  logout: () => Promise<void>;
  redirectToLogin: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const CombinedAuthContext = createContext<CombinedAuthContextValue | null>(null);

export function CombinedAuthProvider({ children }: { children: ReactNode }) {
  const googleAuth = useAuth();
  const [magicLinkUser, setMagicLinkUser] = useState<MagicLinkUser | null>(null);
  const [magicLinkPending, setMagicLinkPending] = useState(true);

  // Fetch magic link user on mount and when needed
  const fetchMagicLinkUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setMagicLinkUser(data.user || null);
      } else {
        setMagicLinkUser(null);
      }
    } catch {
      setMagicLinkUser(null);
    } finally {
      setMagicLinkPending(false);
    }
  }, []);

  useEffect(() => {
    fetchMagicLinkUser();
  }, [fetchMagicLinkUser]);

  // Combined user: prefer Google auth if present, otherwise use magic link
  const combinedUser: CombinedUser | null = (() => {
    // Check Google auth first
    if (googleAuth.user) {
      const profile = (googleAuth.user as any)?.profile;
      return {
        id: googleAuth.user.id,
        email: googleAuth.user.email,
        name: googleAuth.user.google_user_data?.name,
        picture: googleAuth.user.google_user_data?.picture,
        isPremium: profile?.isPremium,
        premiumEndsAt: profile?.premiumEndsAt,
        authType: 'google' as const,
        profile,
      };
    }
    
    // Check magic link auth
    if (magicLinkUser) {
      return {
        id: String(magicLinkUser.id),
        email: magicLinkUser.email,
        name: magicLinkUser.name,
        picture: null,
        isPremium: magicLinkUser.isPremium,
        premiumEndsAt: magicLinkUser.premiumEndsAt,
        authType: 'magic-link' as const,
        profile: {
          isPremium: magicLinkUser.isPremium,
          premiumEndsAt: magicLinkUser.premiumEndsAt,
          premiumPurchasedAt: null,
        },
      };
    }
    
    return null;
  })();

  const isPending = googleAuth.isPending || magicLinkPending;

  const logout = async () => {
    // Logout from both systems
    if (googleAuth.user) {
      await googleAuth.logout();
    }
    if (magicLinkUser) {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch (err) {
        console.error('Magic link logout error:', err);
      }
      setMagicLinkUser(null);
    }
  };

  const refetchUser = async () => {
    await Promise.all([
      googleAuth.fetchUser(),
      fetchMagicLinkUser(),
    ]);
  };

  return (
    <CombinedAuthContext.Provider
      value={{
        user: combinedUser,
        isPending,
        logout,
        redirectToLogin: googleAuth.redirectToLogin,
        refetchUser,
      }}
    >
      {children}
    </CombinedAuthContext.Provider>
  );
}

export function useCombinedAuth(): CombinedAuthContextValue {
  const context = useContext(CombinedAuthContext);
  if (!context) {
    throw new Error('useCombinedAuth must be used within a CombinedAuthProvider');
  }
  return context;
}
