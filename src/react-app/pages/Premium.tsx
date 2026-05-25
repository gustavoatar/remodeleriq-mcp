import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '@getmocha/users-service/react';
import Header from '@/react-app/components/Header';
import PageSEO from '@/react-app/components/PageSEO';
import { 
  Crown, Lock, ArrowLeft, 
  Loader2, Sparkles, Infinity, BarChart3, MessageSquareText,
  AlertCircle, CheckCircle, Users, TrendingUp, Zap, Clock
} from 'lucide-react';
import { PREMIUM_MODE_ENABLED } from '@/shared/featureFlags';

export default function PremiumPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, redirectToLogin } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const paymentStatus = searchParams.get('payment');
  const isGuestPayment = searchParams.get('guest') === 'true';
  const isPremium = (user as any)?.profile?.isPremium;

  // Redirect to join page if premium mode is disabled
  useEffect(() => {
    if (!PREMIUM_MODE_ENABLED) {
      navigate('/join', { replace: true });
    }
  }, [navigate]);

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

  const handleCheckout = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Use auth checkout if logged in, guest checkout otherwise
      const endpoint = user ? '/api/premium/checkout' : '/api/premium/guest-checkout';
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
      setIsProcessing(false);
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
                Enjoy unlimited bid analyses with your annual subscription.
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
        title="RemodelerIQ Premium - Unlimited Bid Analysis"
        description="Analyze unlimited contractor bids, get AI negotiation scripts, and access deep contractor research. Average member saves $2,400 on their renovation."
        path="/premium"
        keywords="contractor bid analyzer premium, unlimited renovation analysis, home improvement savings tool, negotiation help for contractors"
        noindex={true}
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
              Pre-Launch Pricing
            </h1>
            <p className="text-navy-600 max-w-xl mx-auto">
              Start free, then upgrade at a 70% discount
            </p>
          </div>

          {/* Plan Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {/* Anonymous Plan */}
            <div className="card-glass p-6 border-2 border-navy-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-navy-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-navy-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-navy-900">Guest</h3>
                  <p className="text-xs text-navy-500">No account needed</p>
                </div>
              </div>
              
              <div className="mb-4">
                <span className="text-3xl font-bold text-navy-900">Free</span>
              </div>
              
              <ul className="space-y-2 mb-6 text-sm">
                <PlanFeature included>3 free analyses total</PlanFeature>
                <PlanFeature included>Risk analysis & flags</PlanFeature>
                <PlanFeature included>AI insights</PlanFeature>
              </ul>
              
              <button
                onClick={() => navigate('/')}
                className="w-full py-3 rounded-xl font-semibold border-2 border-navy-200 text-navy-700 hover:bg-navy-50 transition-colors"
              >
                Try It Free
              </button>
            </div>

            {/* Free Account Plan */}
            <div className="card-glass p-6 border-2 border-teal-200 bg-teal-50/30">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-navy-900">Free Account</h3>
                  <p className="text-xs text-navy-500">Sign up for more</p>
                </div>
              </div>
              
              <div className="mb-4">
                <span className="text-3xl font-bold text-navy-900">Free</span>
              </div>
              
              <ul className="space-y-2 mb-6 text-sm">
                <PlanFeature included>1 analysis per day</PlanFeature>
                <PlanFeature included>All Guest features</PlanFeature>
                <PlanFeature included>Labor rate audit</PlanFeature>
                <PlanFeature included>Cost trends</PlanFeature>
              </ul>
              
              <button
                onClick={user ? () => navigate('/?view=upload') : redirectToLogin}
                className="w-full py-3 rounded-xl font-semibold bg-teal-600 hover:bg-teal-700 text-white transition-colors"
              >
                {user ? 'Analyze a Bid' : 'Create Account'}
              </button>
            </div>

            {/* Premium Plan */}
            <div className="card-glass p-6 border-2 border-emerald-400 bg-emerald-50 relative overflow-visible">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-full shadow-lg z-10">
                BEST VALUE
              </div>
              
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center shadow-md">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-navy-900">Premium</h3>
                  <p className="text-xs text-navy-500">Unlimited monthly</p>
                </div>
              </div>
              
              <div className="mb-4">
                <span className="text-3xl font-bold text-navy-900">$19.99</span>
                <span className="text-navy-500 text-sm">/month</span>
              </div>
              
              <ul className="space-y-2 mb-6 text-sm">
                <PlanFeature included premium>Unlimited analyses</PlanFeature>
                <PlanFeature included premium>Everything in Free</PlanFeature>
                <PlanFeature included premium>Priority AI processing</PlanFeature>
                <PlanFeature included premium>Negotiation scripts</PlanFeature>
              </ul>
              
              <button
                onClick={handleCheckout}
                disabled={isProcessing}
                className="w-full py-3 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Get Premium'
                )}
              </button>
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
                icon={<Infinity className="w-6 h-6" />}
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
                title="Save Thousands"
                description="Our users report saving an average of $2,400 on their projects by catching issues early."
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
