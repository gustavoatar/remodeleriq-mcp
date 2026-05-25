import { Link } from 'react-router';
import { Crown, Lock, UserPlus } from 'lucide-react';
import { PREMIUM_MODE_ENABLED, getUpgradeCTA } from '@/shared/featureFlags';

interface PremiumGateProps {
  isPremium: boolean;
  isLoggedIn?: boolean;
  children: React.ReactNode;
  featureName: string;
}

/**
 * Wraps premium content with a blurred overlay for free users.
 * Shows a teaser of the content with an upgrade CTA.
 * 
 * When PREMIUM_MODE_ENABLED is false:
 * - Logged in users get full access (no gate)
 * - Guests see gate prompting them to create free account
 */
export function PremiumGate({ isPremium, isLoggedIn, children, featureName }: PremiumGateProps) {
  // If premium, always show
  if (isPremium) {
    return <>{children}</>;
  }
  
  // In free mode, logged-in users get full access
  if (!PREMIUM_MODE_ENABLED && isLoggedIn) {
    return <>{children}</>;
  }

  // Determine CTA based on mode
  const ctaConfig = getUpgradeCTA();
  const targetPath = ctaConfig.link;
  const ctaText = ctaConfig.text;

  // Show a clean sign-up card without any blurred preview
  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-8 text-center">
      <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full shadow-lg mb-4 ${
        PREMIUM_MODE_ENABLED 
          ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
          : 'bg-gradient-to-br from-emerald-500 to-emerald-600'
      }`}>
        <Lock className="w-7 h-7 text-white" />
      </div>
      <h3 className="font-bold text-slate-800 mb-2 text-xl">
        {featureName}
      </h3>
      <p className="text-sm text-slate-600 mb-5 max-w-sm mx-auto">
        Subscribe to unlock {featureName.toLowerCase()}, negotiation scripts, and unlimited bid analyses.
      </p>
      <Link
        to={targetPath}
        className="inline-flex items-center gap-2 px-6 py-3 font-semibold rounded-full shadow-md hover:shadow-lg transition-all bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
      >
        <Lock className="w-4 h-4" />
        {ctaText}
      </Link>
      <p className="text-xs text-slate-500 mt-3">
        Starting at $19.99/month
      </p>
    </div>
  );
}

interface CompactPremiumGateProps {
  title: string;
  itemCount: number;
  onUpgrade: () => void;
  isLoggedIn?: boolean;
}

/**
 * Compact version for inline premium gating within cards.
 * Shows count of hidden items and upgrade button.
 */
export function CompactPremiumGate({ title, itemCount, onUpgrade, isLoggedIn: _isLoggedIn }: CompactPremiumGateProps) {
  const ctaConfig = getUpgradeCTA();
  
  return (
    <div className={`rounded-xl border p-4 ${
      PREMIUM_MODE_ENABLED 
        ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
        : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200'
    }`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Lock className={`w-4 h-4 ${PREMIUM_MODE_ENABLED ? 'text-amber-600' : 'text-emerald-600'}`} />
          <span className={`text-sm ${PREMIUM_MODE_ENABLED ? 'text-amber-800' : 'text-emerald-800'}`}>
            +{itemCount} more {title} available {PREMIUM_MODE_ENABLED ? 'with Premium' : 'with free account'}
          </span>
        </div>
        <button
          onClick={onUpgrade}
          className={`inline-flex items-center gap-1.5 px-4 py-2 text-white text-sm font-semibold rounded-full shadow transition-all ${
            PREMIUM_MODE_ENABLED 
              ? 'bg-amber-500 hover:bg-amber-600'
              : 'bg-emerald-500 hover:bg-emerald-600'
          }`}
        >
          {PREMIUM_MODE_ENABLED ? <Crown className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
          {ctaConfig.text}
        </button>
      </div>
    </div>
  );
}

interface NegotiationPremiumGateProps {
  type: string;
  isLocked: boolean;
  isLoggedIn?: boolean;
  previewContent?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Premium gate specifically for the negotiation/talk track view.
 */
export function NegotiationPremiumGate({ type, isLocked, isLoggedIn, children }: NegotiationPremiumGateProps) {
  // In free mode, logged-in users get full access
  if (!isLocked || (!PREMIUM_MODE_ENABLED && isLoggedIn)) {
    return <>{children}</>;
  }

  const ctaConfig = getUpgradeCTA();

  // Show a clean sign-up card without any blurred preview
  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-8 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full shadow-lg mb-5 bg-gradient-to-br from-emerald-500 to-emerald-600">
        <Lock className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-3">
        {type === 'negotiation' ? 'Negotiation Scripts' : 'Premium Content'}
      </h3>
      <p className="text-slate-600 mb-6 max-w-sm mx-auto">
        Subscribe to unlock personalized negotiation scripts, talking points, and leverage strategies to save thousands on your project.
      </p>
      <Link
        to={ctaConfig.link}
        className="inline-flex items-center gap-2 px-8 py-4 font-semibold rounded-full shadow-lg hover:shadow-xl transition-all text-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
      >
        <Lock className="w-5 h-5" />
        {ctaConfig.text}
      </Link>
      <p className="text-sm text-slate-500 mt-4">
        Starting at $19.99/month
      </p>
    </div>
  );
}
