import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '@getmocha/users-service/react';
import Header from '@/react-app/components/Header';
import PageSEO from '@/react-app/components/PageSEO';
import FAQSchema, { JOIN_FAQS } from '@/react-app/components/FAQSchema';
import { BreadcrumbSchema, BREADCRUMBS } from '@/react-app/components/StructuredData';
import { Check, Shield, ClipboardCheck, TrendingUp, MessageSquareText, ArrowLeft, Crown, Loader2, Zap, Sparkles, Gem } from 'lucide-react';
import { FREE_TOTAL_ANALYSES } from '@/shared/featureFlags';

type SubscriptionTier = 'free' | 'project_pass' | 'remodeler_pass' | 'legacy';

const TIER_NAMES: Record<SubscriptionTier, string> = {
  free: 'Free',
  project_pass: 'Project Pass',
  remodeler_pass: 'Remodeler Pass',
  legacy: 'Premium',
};

export default function JoinPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isPending, redirectToLogin } = useAuth();
  const [checkoutLoading, setCheckoutLoading] = useState<'project' | 'remodeler' | 'lifetime' | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Check for payment success from URL params
  useEffect(() => {
    const payment = searchParams.get('payment');
    if (payment === 'success') {
      setPaymentSuccess(true);
      // Clean up URL
      searchParams.delete('payment');
      searchParams.delete('plan');
      setSearchParams(searchParams, { replace: true });
    }
  }, []);

  // Fetch subscription status when user is logged in
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await fetch('/api/subscription/status');
        if (response.ok) {
          const data = await response.json();
          setSubscriptionTier(data.tier || 'free');
        } else {
          setSubscriptionTier('free');
        }
      } catch {
        setSubscriptionTier('free');
      } finally {
        setLoadingSubscription(false);
      }
    };
    
    if (user && !isPending) {
      fetchSubscription();
    } else if (!isPending) {
      setLoadingSubscription(false);
    }
  }, [user, isPending]);

  const handleSubscriptionCheckout = async (tier: 'project' | 'remodeler' | 'lifetime') => {
    setCheckoutLoading(tier);
    
    try {
      // Map tier to endpoint path
      const tierPath = tier === 'project' ? 'project-pass' : tier === 'remodeler' ? 'remodeler-pass' : 'lifetime-pass';
      
      // Use guest endpoints if not logged in, otherwise use authenticated endpoints
      const endpoint = user 
        ? `/api/subscription/${tierPath}`
        : `/api/subscription/guest/${tierPath}`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Checkout error:', data);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setCheckoutLoading(null);
    }
  };

  // Determine what to show
  const isPaidUser = subscriptionTier && subscriptionTier !== 'free';
  const showPricingCards = !user || (!isPaidUser && !loadingSubscription && !isPending);
  const showSuccessState = user && !loadingSubscription && !isPending && !showPricingCards;

  const handleGoogleSignIn = () => {
    redirectToLogin();
  };

  const handleContinueToAnalysis = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <PageSEO
        title="Pricing & Plans | RemodelerIQ"
        description="Start with 3 free bid analyses. Upgrade to unlimited access with Project Pass ($19.99/mo), Remodeler Pass ($39.99/3mo), or Lifetime Pass ($99.99). No commitment, cancel anytime."
        path="/join"
        keywords="contractor bid analysis pricing, RemodelerIQ plans, home renovation tool subscription"
      />
      <FAQSchema faqs={JOIN_FAQS} />
      <BreadcrumbSchema items={BREADCRUMBS.join} />
      <Header />
      
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Back Button */}
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-navy-100 hover:bg-navy-200 text-navy-700 rounded-lg font-medium text-sm transition-all mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-navy-900 mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-navy-600 text-lg max-w-2xl mx-auto">
              Start free, upgrade when you need unlimited access
            </p>
          </div>

          {loadingSubscription || isPending ? (
            /* Loading State */
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : showSuccessState ? (
            /* Success State - Paid Subscriber */
            <div className="max-w-md mx-auto">
              <div className="card-glass p-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {isPaidUser ? (
                    <Sparkles className="w-8 h-8 text-emerald-600" />
                  ) : (
                    <Check className="w-8 h-8 text-emerald-600" />
                  )}
                </div>
                <h2 className="text-2xl font-bold text-navy-900 mb-2">
                  {paymentSuccess ? 'Welcome to ' : 'You have '}
                  {subscriptionTier ? TIER_NAMES[subscriptionTier] : 'Premium'}!
                </h2>
                <p className="text-navy-600 mb-6">
                  {isPaidUser 
                    ? "You have unlimited bid analyses. Let's help you negotiate a better deal."
                    : `You have ${FREE_TOTAL_ANALYSES} free analyses. Let's help you negotiate a better deal.`
                  }
                </p>
                <button 
                  onClick={handleContinueToAnalysis} 
                  className="w-full text-white py-3 px-6 rounded-xl font-semibold transition-all shadow-md"
                  style={{ backgroundColor: '#1F9C4C' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a8a42'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1F9C4C'}
                >
                  {paymentSuccess ? 'Start Analyzing' : 'Continue to Analysis'}
                </button>
                
                {!isPaidUser && (
                  <div className="mt-6 pt-6 border-t border-navy-200">
                    <p className="text-sm text-navy-500 mb-4">Want unlimited access?</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleSubscriptionCheckout('project')}
                        className="flex-1 py-2 px-4 border border-navy-200 rounded-lg text-sm font-medium text-navy-700 hover:bg-navy-50 transition-all"
                      >
                        Project Pass
                      </button>
                      <button
                        onClick={() => handleSubscriptionCheckout('remodeler')}
                        className="flex-1 py-2 px-4 border rounded-lg text-sm font-medium text-white transition-all"
                        style={{ backgroundColor: '#1F9C4C', borderColor: '#1F9C4C' }}
                      >
                        Remodeler Pass
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Pricing Cards */}
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                {/* Free Card */}
                <div className="card-glass p-6 relative">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-navy-900 mb-1">Free</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-navy-900">$0</span>
                    </div>
                    <p className="text-navy-500 text-sm mt-1">{FREE_TOTAL_ANALYSES} analyses total</p>
                  </div>
                  
                  <ul className="space-y-3 mb-6">
                    <FeatureItem icon={<ClipboardCheck className="w-5 h-5" />}>
                      {FREE_TOTAL_ANALYSES} bid analyses
                    </FeatureItem>
                    <FeatureItem icon={<Shield className="w-5 h-5" />}>
                      Risk analysis & flags
                    </FeatureItem>
                    <FeatureItem icon={<Check className="w-5 h-5" />}>
                      AI-powered insights
                    </FeatureItem>
                  </ul>

                  <div className="pt-4 border-t border-navy-200">
                    {isPending ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#1F9C4C' }} />
                      </div>
                    ) : user ? (
                      <button 
                        onClick={handleContinueToAnalysis}
                        className="w-full bg-navy-100 hover:bg-navy-200 text-navy-700 py-3 px-6 rounded-xl font-semibold transition-all"
                      >
                        Continue Free
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={handleGoogleSignIn}
                          className="w-full flex items-center justify-center gap-3 bg-white border border-navy-200 hover:bg-navy-50 text-navy-700 py-3 px-6 rounded-xl font-semibold transition-all shadow-sm"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                          </svg>
                          Sign Up Free
                        </button>
                        <Link
                          to="/auth/magic-link"
                          className="block text-center mt-3 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          Sign in with email
                        </Link>
                      </>
                    )}
                  </div>
                </div>

                {/* Project Pass Card */}
                <div className="card-glass p-6 relative">
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                      <Zap className="w-3 h-3" />
                      Monthly
                    </span>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-navy-900 mb-1">Project Pass</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-navy-900">$19.99</span>
                      <span className="text-navy-500">/month</span>
                    </div>
                    <p className="text-navy-500 text-sm mt-1">Unlimited analyses</p>
                  </div>
                  
                  <ul className="space-y-3 mb-6">
                    <FeatureItem icon={<ClipboardCheck className="w-5 h-5" />} highlight>
                      Unlimited bid analyses
                    </FeatureItem>
                    <FeatureItem icon={<Check className="w-5 h-5" />} highlight>
                      Everything in Free
                    </FeatureItem>
                    <FeatureItem icon={<TrendingUp className="w-5 h-5" />} highlight>
                      Market price comparison
                    </FeatureItem>
                    <FeatureItem icon={<MessageSquareText className="w-5 h-5" />} highlight>
                      Negotiation scripts
                    </FeatureItem>
                  </ul>

                  <div className="pt-4 border-t border-navy-200">
                    <button
                      onClick={() => handleSubscriptionCheckout('project')}
                      disabled={checkoutLoading === 'project'}
                      className="w-full bg-navy-800 hover:bg-navy-900 text-white py-3 px-6 rounded-xl font-semibold transition-all shadow-md disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                      {checkoutLoading === 'project' ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        `Get Project Pass`
                      )}
                    </button>
                    <p className="text-xs text-navy-400 text-center mt-3">
                      Cancel anytime
                    </p>
                  </div>
                </div>

                {/* Remodeler Pass Card - Best Value */}
                <div className="card-glass p-6 relative bg-gradient-to-br from-brand-50 to-emerald-50" style={{ borderColor: 'rgba(31, 156, 76, 0.3)', borderWidth: '2px' }}>
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1 text-white text-xs font-semibold rounded-full" style={{ backgroundColor: '#1F9C4C' }}>
                      <Crown className="w-3 h-3" />
                      Best Value
                    </span>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-navy-900 mb-1">Remodeler Pass</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-navy-900">$39.99</span>
                      <span className="text-navy-500">/3 months</span>
                    </div>
                    <p className="text-sm mt-1" style={{ color: '#1F9C4C' }}>Save 33% vs monthly</p>
                  </div>
                  
                  <ul className="space-y-3 mb-6">
                    <FeatureItem icon={<ClipboardCheck className="w-5 h-5" />} highlight>
                      Unlimited bid analyses
                    </FeatureItem>
                    <FeatureItem icon={<Check className="w-5 h-5" />} highlight>
                      Everything in Free
                    </FeatureItem>
                    <FeatureItem icon={<TrendingUp className="w-5 h-5" />} highlight>
                      Market price comparison
                    </FeatureItem>
                    <FeatureItem icon={<MessageSquareText className="w-5 h-5" />} highlight>
                      Negotiation scripts
                    </FeatureItem>
                  </ul>

                  <div className="pt-4 border-t" style={{ borderColor: 'rgba(31, 156, 76, 0.2)' }}>
                    <button
                      onClick={() => handleSubscriptionCheckout('remodeler')}
                      disabled={checkoutLoading === 'remodeler'}
                      className="w-full text-white py-3 px-6 rounded-xl font-semibold transition-all shadow-md disabled:opacity-70 flex items-center justify-center gap-2"
                      style={{ backgroundColor: '#1F9C4C' }}
                      onMouseEnter={(e) => !checkoutLoading && (e.currentTarget.style.backgroundColor = '#1a8a42')}
                      onMouseLeave={(e) => !checkoutLoading && (e.currentTarget.style.backgroundColor = '#1F9C4C')}
                    >
                      {checkoutLoading === 'remodeler' ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        `Get Remodeler Pass`
                      )}
                    </button>
                    <p className="text-xs text-navy-400 text-center mt-3">
                      Cancel anytime
                    </p>
                  </div>
                </div>
              </div>

              {/* Lifetime Pass - Full Width Below */}
              <div className="mb-12">
                <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 rounded-2xl p-6 md:p-8 border-2 border-amber-400 shadow-lg">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-md">
                        <Gem className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold" style={{ color: '#333' }}>Lifetime Pass</h3>
                          <span className="px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full">VIP</span>
                        </div>
                        <p className="text-sm text-gray-500">One-time purchase, unlimited forever</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-8">
                      <ul className="flex flex-wrap gap-x-6 gap-y-1 text-sm" style={{ color: '#555' }}>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-4 h-4" style={{ color: '#d97706' }} />
                          Unlimited forever
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-4 h-4" style={{ color: '#d97706' }} />
                          Sneak peek new tools
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-4 h-4" style={{ color: '#d97706' }} />
                          Beta invites & events
                        </li>
                      </ul>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-3xl font-bold" style={{ color: '#d97706' }}>$99.99</span>
                          <span className="text-gray-500 text-sm ml-1">once</span>
                        </div>
                        <button
                          onClick={() => handleSubscriptionCheckout('lifetime')}
                          disabled={checkoutLoading === 'lifetime'}
                          className="px-6 py-3 rounded-xl font-bold text-white transition-all shadow-lg hover:shadow-xl disabled:opacity-70 flex items-center gap-2 whitespace-nowrap"
                          style={{ backgroundColor: '#d97706' }}
                          onMouseEnter={(e) => { if (checkoutLoading !== 'lifetime') e.currentTarget.style.backgroundColor = '#b45309'; }}
                          onMouseLeave={(e) => { if (checkoutLoading !== 'lifetime') e.currentTarget.style.backgroundColor = '#d97706'; }}
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

              {/* FAQ or Trust Section */}
              <div className="text-center text-navy-500 text-sm">
                <p>All plans include PDF export. Questions? <a href="mailto:help@remodeleriq.com" className="text-emerald-600 hover:text-emerald-700 font-medium">help@remodeleriq.com</a></p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function FeatureItem({
  children,
  icon,
  highlight = false
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <li className="flex items-start gap-3">
      <div className={`flex-shrink-0 p-1 rounded-full`} style={{ color: highlight ? '#1F9C4C' : '#10b981' }}>
        {icon}
      </div>
      <span className={`text-sm ${highlight ? 'text-navy-800 font-medium' : 'text-navy-600'}`}>
        {children}
      </span>
    </li>
  );
}
