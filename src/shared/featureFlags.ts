/**
 * Feature Flags - Central configuration for premium/free tier modes
 * 
 * QUICK REFERENCE:
 * - To enable premium monetization: Set PREMIUM_MODE_ENABLED = true
 * - To make everything free: Set PREMIUM_MODE_ENABLED = false
 * 
 * PRICING (v1.1):
 * - Free: 3 analyses total forever (requires login)
 * - Project Pass: $19.99/month unlimited
 * - Remodeler Pass: $39.99 every 3 months unlimited
 * - Lifetime Pass: $99.99 one-time unlimited forever
 * 
 * When PREMIUM_MODE_ENABLED is false:
 *   - Guests get 1 free analysis total
 *   - Free accounts get unlimited analyses (5/day limit)
 *   - All features are unlocked for logged-in users
 *   - Premium badges, upgrade prompts, and pricing hidden
 * 
 * When PREMIUM_MODE_ENABLED is true:
 *   - Guests cannot analyze (must sign up)
 *   - Free accounts get 3 analyses total (forever)
 *   - Premium features require subscription
 *   - Premium badges, upgrade prompts, and pricing shown
 */

// ============================================
// MASTER SWITCH
// ============================================
// Set to true to enable premium monetization mode
// Set to false for free tier growth mode
export const PREMIUM_MODE_ENABLED = true;

// ============================================
// ACCESS LIMITS
// ============================================

/** Maximum analyses for guests (not logged in) - must sign up */
export const GUEST_MAX_ANALYSES: number = 0;

/** Total analyses for free accounts (logged in, non-premium) */
export const FREE_TOTAL_ANALYSES: number = 3;

/** Legacy: Daily limit for free mode (when PREMIUM_MODE_ENABLED = false) */
export const FREE_DAILY_LIMIT: number = PREMIUM_MODE_ENABLED ? 0 : 5;

// ============================================
// DEMO / BETA ACCESS FLAGS
// ============================================
// Moved out of shared/betaUsers.ts so client code never imports that module —
// the beta email list is server-only and must not ship in the public bundle.

/** When premium mode is off, everyone (including guests) is treated as premium. */
export const EVERYONE_HAS_PREMIUM = !PREMIUM_MODE_ENABLED;

/** Investor demo mode (?demo=CODE premium bypass). Empty string = disabled. */
export const INVESTOR_DEMO_CODE = '';

// ============================================
// PRICING DISPLAY
// ============================================
export const PROJECT_PASS_PRICE = '$19.99/month';
export const REMODELER_PASS_PRICE = '$39.99 every 3 months';
export const LIFETIME_PASS_PRICE = '$99.99 one-time';

/** Legacy: Premium price */
export const PREMIUM_PRICE = PROJECT_PASS_PRICE;

// ============================================
// FEATURE GATING FLAGS
// ============================================
// When true, these features require premium subscription
// When false, these features are available to all logged-in users

/** Gate Price Analysis card (requires premium when true) */
export const GATE_PRICE_ANALYSIS = PREMIUM_MODE_ENABLED;

/** Gate Contractor Pulse card (requires premium when true) */
export const GATE_CONTRACTOR_PULSE = PREMIUM_MODE_ENABLED;

/** Gate Questions to Ask card (requires premium when true) */
export const GATE_QUESTIONS_CARD = PREMIUM_MODE_ENABLED;

/** Gate PDF Export (requires premium when true) */
export const GATE_PDF_EXPORT = PREMIUM_MODE_ENABLED;

/** Gate Market Analysis tab (requires premium when true) */
export const GATE_MARKET_ANALYSIS = PREMIUM_MODE_ENABLED;

/** Gate Negotiation tab (requires premium when true) */
export const GATE_NEGOTIATION = PREMIUM_MODE_ENABLED;

// ============================================
// UI ELEMENT FLAGS
// ============================================
// Control visibility of premium-related UI elements

/** Show crown icons and premium badges */
export const SHOW_PREMIUM_BADGES = PREMIUM_MODE_ENABLED;

/** Show pricing page with payment options */
export const SHOW_PRICING_PAGE = PREMIUM_MODE_ENABLED;

/** Show "Upgrade to unlock" prompts throughout the app */
export const SHOW_UPGRADE_PROMPTS = PREMIUM_MODE_ENABLED;

/** Show premium tier in settings/profile */
export const SHOW_PREMIUM_STATUS = PREMIUM_MODE_ENABLED;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if a feature is gated for a given user
 * Returns true if the feature should be locked
 */
export function isFeatureGated(
  featureName: 'priceAnalysis' | 'contractorPulse' | 'questionsCard' | 'pdfExport' | 'marketAnalysis' | 'negotiation',
  isPremium: boolean,
  isLoggedIn: boolean
): boolean {
  // In free mode, logged-in users have access to everything
  if (!PREMIUM_MODE_ENABLED && isLoggedIn) {
    return false;
  }
  
  // In premium mode, check specific gate flags
  const gateMap: Record<string, boolean> = {
    priceAnalysis: GATE_PRICE_ANALYSIS,
    contractorPulse: GATE_CONTRACTOR_PULSE,
    questionsCard: GATE_QUESTIONS_CARD,
    pdfExport: GATE_PDF_EXPORT,
    marketAnalysis: GATE_MARKET_ANALYSIS,
    negotiation: GATE_NEGOTIATION,
  };
  
  // If feature is gated and user is not premium, lock it
  return gateMap[featureName] && !isPremium;
}

/**
 * Get the appropriate CTA text based on mode
 */
export function getUpgradeCTA(): { text: string; link: string } {
  if (PREMIUM_MODE_ENABLED) {
    return { text: 'Subscribe to Unlock', link: '/join' };
  }
  return { text: 'Create Free Account', link: '/join' };
}

/**
 * Get remaining analyses message for guests/free users
 */
export function getRemainingMessage(remaining: number, isLoggedIn: boolean): string {
  if (!isLoggedIn) {
    // Guest
    if (remaining <= 0) {
      return 'Create a free account to continue analyzing bids';
    }
    return `${remaining} free ${remaining === 1 ? 'analysis' : 'analyses'} remaining`;
  }
  
  // Logged in free user
  if (remaining <= 0) {
    return "You've reached your daily limit. Come back tomorrow!";
  }
  return `${remaining} of ${FREE_DAILY_LIMIT} daily analyses remaining`;
}
