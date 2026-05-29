// Shared types for worker modules

// ============================================
// SHARED TYPES FOR WORKER ROUTES
// ============================================

export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  id_token?: string;
  refresh_token?: string;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export interface UserProfile {
  id: number;
  user_id: string | null;
  email: string;
  name: string | null;
  google_id: string | null;
  google_picture: string | null;
  is_premium: number;
  premium_purchased_at: string | null;
  premium_ends_at: string | null;
  stripe_session_id: string | null;
  subscription_tier: string | null;
  subscription_status: string | null;
  current_period_end: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserSession {
  id: number;
  user_id: number;
  session_token: string;
  expires_at: string;
  created_at: string;
}

export type AppEnv = {
  Bindings: Env;
  Variables: {
    user: UserProfile;
    session: UserSession;
  };
};

// ============================================
// SHARED CONSTANTS
// ============================================

export const SESSION_COOKIE_NAME = "remodeleriq_session";
export const PUBLISHED_APP_URL = 'https://remodeleriq.com';

// ============================================
// SHARED HELPERS
// ============================================

export function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function getAppOrigin(_c: { req: { header: (name: string) => string | undefined } }): string {
  // Always return the canonical published URL — do not trust Origin/Referer headers
  return PUBLISHED_APP_URL;
}

export function getOAuthRedirectUri(): string {
  return `${PUBLISHED_APP_URL}/auth/callback`;
}
