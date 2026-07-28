import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '@/react-app/lib/auth';
import Header from '@/react-app/components/Header';
import PageSEO from '@/react-app/components/PageSEO';
import useLocationSavings, { DEFAULT_SAVINGS, DEFAULT_LOCATION } from '@/react-app/hooks/useLocationSavings';
import {
  Crown, Lock, ArrowLeft, Check, Gem,
  Loader2, Sparkles, Infinity as InfinityIcon, BarChart3, MessageSquareText,
  AlertCircle, CheckCircle, TrendingUp, Zap, Clock
} from 'lucide-react';
import { PREMIUM_MODE_ENABLED, FREE_TOTAL_ANALYSES } from '@/shared/featureFlags';

type PaidTier = 'project' | 'remodeler' | 'lifetime';

export default function PremiumPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, redirectToLogin } = useAuth();
  const [checkoutLoading, setCheckoutLoading] = useState<PaidTier | null>(null);
  const [error, setError] = useState<string | null>(null);
  const locationSavings = useLocationSavings();

  const paymentStatus = searchParams.get('payment');
  const isGuestPayment = searchParams.get('guest') === 'true';
  const isPremium = (user as { profile?: { isPremium?: boolean } } | null)?.profile?.isPremium;

  const savingsLocation = locationSavings?.location ?? DEFAULT_LOCATION;
  const savingsAmount = locationSavings?.savings ?? DEFAULT_SAVINGS;

  // Redirect to join page if premium mode is disabled
  useEffect(() => {
    if (!PREMIUM_MODE_ENABLED) {
      navigate('/join', { replace: true });
    }
  }, [navigate]);

  // Fire the conversion event when Stripe redirects back with payment=success.
  useEffect(() => {
    if (paymentStatus === 'success') {
      const w = window as unknown as { gtag?: (...a: unknown[]) => void };
      w.gtag?.('event', 'premium_purchase', { guest: isGuestPayment });
    }
  }, [paymentStatus, isGuestPayment]);

  // Don't render anything while redirecting
  if (!PREMIUM_MODE_ENABLED) {
    return null;
  }

  // Show success message for guest payments
  if (paymentStatus === 'success' && isGuestPayment) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="pt-24 pb-16 px-4">
          <div className="max-w-lg mx-auto text-center">
            <div className="card-glass p-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-bold text-navy-900 mb-2">Welcome to Premium!</h1>
              <p className="text-navy-600 mb-6">
                Your payment was successful. Check your email for your welcome message with premium access details.
              </p>
              <button
                onClick={() => navigate('/')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all"
              >
                Start Analyzing Bids
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const handleCheckout = async (tier: PaidTier) => {
    setCheckoutLoading(tier);
    setError(null);

    try {
      const tierPath = tier === 'project' ? 'project-pass' : tier === 'remodeler' ? 'remodeler-pass' : 'lifetime-pass';

      // Guests use the no-auth checkout endpoints; account holders get the
      // session tied to their user via the authenticated ones.
      const endpoint = user
        ? `/api/subscription/${tierPath}`
        : `/api/subscription/guest/${tierPath}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Checkout error response:', data);
        throw new Error(data.error || 'Failed to start checkout');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to start checkout';
      setError(errorMessage);
      setCheckoutLoading(null);
    }
  };

  if (isPremium) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="pt-24 pb-16 px-4">
          <div className="max-w-lg mx-auto text-center">
            <div className="card-glass p-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-bold text-navy-900 mb-2">You're Already Premium!</h1>
              <p className="text-navy-600 mb-6">
                Enjoy unlimited bid analyses with your RemodelerIQ pass.
              </p>
              <button
                onClick={() => navigate('/settings')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all"
              >
                Go to Settings
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <PageSEO
        title="Premium Plans & Pricing"
        description={`Analyze unlimited contractor bids with Project Pass ($19.99/mo), Remodeler Pass ($39.99/3 months), or Lifetime Pass ($99.99 one-time). Start with ${FREE_TOTAL_ANALYSES} free analyses — homeowners save an average of $${DEFAULT_SAVINGS.toLocaleString()} per project.`}
        path="/premium"
        keywords="contractor bid analyzer premium, RemodelerIQ pricing, unlimited renovation analysis, home improvement savings tool, negotiation help for contractors"
      />
      <Header />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-navy-600 hover:text-navy-900 font-medium mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {/* Payment cancelled notice */}
          {paymentStatus === 'cancelled' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <p className="text-amber-700">
                Payment was cancelled. You can try again when you're ready.
              </p>
            </div>
          )}

          {/* Plan Comparison Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-navy-900 mb-3">
              Simple, Transparent Pricing
            </h1>
            <p className="text-navy-600 max-w-xl mx-auto">
              Your first {FREE_TOTAL_ANALYSES} analyses are free — the complete product, nothing held back.
              Go unlimited when the remodel gets real. Cancel anytime.
            </p>
          </div>

          {/* Plan Cards */}
          <div className="grid gap-6 mb-8 md:grid-cols-3">
            {/* Free Plan */}
            <div className="card-glass p-6 border-2 border-teal-200 bg-teal-50/30 relative overflow-visible">
              {user && !isPremium && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-teal-600 text-white text-xs font-semibold rounded-full shadow-lg z-10 whitespace-nowrap">
                  YOUR CURRENT PLAN
                </div>
              )}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-navy-900">Free</h3>
                  <p className="text-xs text-navy-500">{user && !isPremium ? 'Your plan' : 'No card needed'}</p>
                </div>
              </div>

              <div className="mb-4">
                <span className="text-3xl font-bold text-navy-900">$0</span>
              </div>

              <ul className="space-y-2 mb-6 text-sm">
                <PlanFeature included>The complete analysis, {FREE_TOTAL_ANALYSES} times</PlanFeature>
                <PlanFeature included>Market Analysis & Negotiation included</PlanFeature>
                <PlanFeature included>Contractor verification</PlanFeature>
                <PlanFeature included>No card. No signup. No catch.</PlanFeature>
              </ul>

              <button
                onClick={user ? () => navigate('/?view=upload') : redirectToLogin}
                className="w-full py-3 rounded-xl font-semibold border-2 border-teal-300 text-teal-700 hover:bg-teal-50 transition-colors"
              >
                {user ? 'Analyze a Bid' : 'Start Free'}
              </button>
            </div>

            {/* Project Pass */}
            <div className="card-glass p-6 border-2 border-navy-200 relative overflow-visible">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-navy-900">Project Pass</h3>
                  <p className="text-xs text-navy-500">Monthly unlimited</p>
                </div>
              </div>

              <div className="mb-4">
                <span className="text-3xl font-bold text-navy-900">$19.99</span>
                <span className="text-navy-500 text-sm">/month</span>
              </div>

              <ul className="space-y-2 mb-6 text-sm">
                <PlanFeature included premium>Unlimited analyses</PlanFeature>
                <PlanFeature included premium>Every revised bid, re-scored</PlanFeature>
                <PlanFeature included premium>Multi-bid comparison</PlanFeature>
                <PlanFeature included premium>Priority AI processing</PlanFeature>
                <PlanFeature included premium>Saved analysis history</PlanFeature>
              </ul>

              <button
                onClick={() => handleCheckout('project')}
                disabled={checkoutLoading !== null}
                className="w-full py-3 rounded-xl font-semibold bg-navy-800 hover:bg-navy-900 text-white transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {checkoutLoading === 'project' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Get Project Pass'
                )}
              </button>
              <p className="text-xs text-navy-400 text-center mt-3">Cancel anytime</p>
            </div>

            {/* Remodeler Pass */}
            <div className="card-glass p-6 border-2 border-emerald-400 bg-emerald-50 relative overflow-visible">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-full shadow-lg z-10">
                BEST VALUE
              </div>

              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center shadow-md">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-navy-900">Remodeler Pass</h3>
                  <p className="text-xs text-navy-500">3 months unlimited</p>
                </div>
              </div>

              <div className="mb-4">
                <span className="text-3xl font-bold text-navy-900">$39.99</span>
                <span className="text-navy-500 text-sm">/3 months</span>
                <p className="text-emerald-700 text-xs font-semibold mt-1">Save 33% vs monthly</p>
              </div>

              <ul className="space-y-2 mb-6 text-sm">
                <PlanFeature included premium>Everything in Project Pass</PlanFeature>
                <PlanFeature included premium>Quarterly market report</PlanFeature>
                <PlanFeature included premium>Advanced contractor research</PlanFeature>
                <PlanFeature included premium>Covers your whole remodel</PlanFeature>
              </ul>

              <button
                onClick={() => handleCheckout('remodeler')}
                disabled={checkoutLoading !== null}
                className="w-full py-3 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {checkoutLoading === 'remodeler' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Get Remodeler Pass'
                )}
              </button>
              <p className="text-xs text-navy-400 text-center mt-3">Cancel anytime</p>
            </div>
          </div>

          {/* Lifetime Pass - Full Width */}
          <div className="mb-12">
            <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 rounded-2xl p-6 md:p-8 border-2 border-amber-400 shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-md">
                    <Gem className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-navy-900">Lifetime Pass</h3>
                      <span className="px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full">VIP</span>
                    </div>
                    <p className="text-sm text-navy-500">One-time purchase, unlimited forever</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-8">
                  <ul className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-navy-600">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-amber-600" />
                      Unlimited forever
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-amber-600" />
                      Never billed again
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-amber-600" />
                      Beta invites & events
                    </li>
                  </ul>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-3xl font-bold text-amber-600">$99.99</span>
                      <span className="text-navy-500 text-sm ml-1">once</span>
                    </div>
                    <button
                      onClick={() => handleCheckout('lifetime')}
                      disabled={checkoutLoading !== null}
                      className="px-6 py-3 rounded-xl font-bold text-white bg-amber-600 hover:bg-amber-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                    >
                      {checkoutLoading === 'lifetime' ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Get Lifetime Access'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 max-w-md mx-auto text-center flex items-center justify-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Premium Benefits Detail */}
          <div className="card-glass p-8 max-w-3xl mx-auto">
            <h2 className="text-xl font-bold text-navy-900 mb-6 text-center flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-500" />
              Why Go Premium?
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <BenefitCard
                icon={<InfinityIcon className="w-6 h-6" />}
                title="Unlimited Analyses"
                description="Analyze as many bids as you need. Compare contractors, review revisions, and negotiate with confidence."
              />
              <BenefitCard
                icon={<BarChart3 className="w-6 h-6" />}
                title="Full Market Data"
                description="Access BLS labor rates, material trends, and regional cost benchmarks to validate every quote."
              />
              <BenefitCard
                icon={<MessageSquareText className="w-6 h-6" />}
                title="Negotiation Scripts"
                description="Get AI-powered talking points customized to your specific bid issues and local regulations."
              />
              <BenefitCard
                icon={<TrendingUp className="w-6 h-6" />}
                title="Save Real Money"
                description={`Homeowners in ${savingsLocation} save $${savingsAmount.toLocaleString()} on average by catching inflated pricing and hidden costs early.`}
              />
            </div>

            <div className="mt-8 pt-6 border-t border-navy-200 flex flex-wrap items-center justify-center gap-6 text-sm text-navy-500">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span>Secure Stripe checkout</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>30-day money-back guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Instant access</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function PlanFeature({ children, included = false, premium = false }: { children: React.ReactNode; included?: boolean; premium?: boolean }) {
  return (
    <li className={`flex items-center gap-2 ${included ? 'text-navy-700' : 'text-navy-400'}`}>
      {included ? (
        <CheckCircle className={`w-4 h-4 flex-shrink-0 ${premium ? 'text-brand-500' : 'text-emerald-500'}`} />
      ) : (
        <div className="w-4 h-4 flex-shrink-0 border border-navy-300 rounded-full" />
      )}
      <span className={!included ? 'line-through' : ''}>{children}</span>
    </li>
  );
}

function BenefitCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center text-brand-600">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-navy-900 mb-1">{title}</h3>
        <p className="text-navy-600 text-sm">{description}</p>
      </div>
    </div>
  );
}
