import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { ArrowRight, TrendingUp, FileWarning, AlertTriangle, Crown, Check, Zap, Users, Star, Loader2, Gem } from 'lucide-react';
import MoneyBurst, { MoneyBurstHandle } from './MoneyBurst';
import { FREE_TOTAL_ANALYSES } from '@/shared/featureFlags';
import useLocationSavings, { DEFAULT_SAVINGS } from '@/react-app/hooks/useLocationSavings';
import { useAuth } from '@/react-app/lib/auth';
import XRayAudit from './XRayAudit';
import DataPartners from '@/react-app/components/DataPartners';
import SamplePreviewSlider from './SamplePreviewSlider';

interface HeroProps {
  onGetStarted: () => void;
  onSeeDemo?: () => void;
}

export default function Hero({ onGetStarted, onSeeDemo }: HeroProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [checkoutLoading, setCheckoutLoading] = useState<'project' | 'remodeler' | 'lifetime' | null>(null);
  const locationSavings = useLocationSavings();
  const heroButtonRef = useRef<HTMLButtonElement>(null);
  const moneyBurstRef = useRef<MoneyBurstHandle>(null);

  const handleSubscriptionCheckout = async (tier: 'project' | 'remodeler' | 'lifetime') => {
    setCheckoutLoading(tier);
    try {
      const tierPath = tier === 'project' ? 'project-pass' : tier === 'remodeler' ? 'remodeler-pass' : 'lifetime-pass';
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
        navigate('/join');
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        navigate('/join');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      navigate('/join');
    } finally {
      setCheckoutLoading(null);
    }
  };
  
  return (
    <>
      {/* Hero Section */}
      <section className="gradient-hero min-h-screen pt-8 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Money Burst Animation - hidden on mobile */}
        <MoneyBurst ref={moneyBurstRef} buttonRef={heroButtonRef} />
        
        {/* Background decorations */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Main hero content */}
          <div className="text-center max-w-4xl mx-auto pt-24 md:pt-40">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6">
              <span style={{ color: '#1F9C4C' }}>Negotiate like a pro</span>
              <br />
              <span style={{ color: '#333' }}>on your next remodel</span>
            </h1>
            
            <p className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: '#555' }}>
              AI Powered Bid Analysis checks for inflated pricing, scammers, hidden costs and red flags.
            </p>
            
            <div className="flex flex-col items-center justify-center gap-4">
              <button 
                ref={heroButtonRef}
                onClick={onGetStarted} 
                className="btn-glisten group text-white px-12 py-5 rounded-xl font-bold text-xl shadow-lg flex items-center gap-3 justify-center transition-all duration-300 ease-out hover:scale-105 hover:shadow-xl hover:-translate-y-1 active:scale-95"
                style={{ backgroundColor: '#1F9C4C', boxShadow: '0 10px 15px -3px rgba(31, 156, 76, 0.25)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1a8a42';
                  // Trigger money burst on hover
                  moneyBurstRef.current?.burst();
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#1F9C4C';
                }}
              >
                Analyze Your Bid Free
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
              
              {onSeeDemo && (
                <button
                  onClick={onSeeDemo}
                  className="mt-[34px] group text-gray-600 hover:text-emerald-600 font-medium text-base flex items-center gap-2 transition-colors"
                >
                  See How It Works
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>
          </div>

          {/* X-Ray Audit Animation */}
          <div className="mt-16 px-4">
            <XRayAudit onGetStarted={onGetStarted} />
          </div>

          {/* Feature Cards */}
          <div className="mt-16 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <FeatureCard icon={<TrendingUp className="w-6 h-6" />} title="Cost Benchmarking" description="Compare line items against local market rates to spot overpricing" color="emerald" />
            <FeatureCard icon={<FileWarning className="w-6 h-6" />} title="Missing Items" description="Identify commonly forgotten items that could lead to surprise costs" color="amber" />
            <FeatureCard icon={<AlertTriangle className="w-6 h-6" />} title="Risk Detection" description="Flag contract red flags and non-standard terms before you sign" color="red" />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            {/* Social Proof */}
            <div className="flex flex-col items-center gap-2 mb-8">
              <div className="flex flex-col xs:flex-row items-center gap-1.5 xs:gap-3">
                <div className="flex -space-x-2">
                  <img 
                    src="/mocha-assets/457745902_8353490021339301_2498062123852469522_n.jpg" 
                    alt="Satisfied homeowner who used RemodelerIQ" 
                    className="w-8 h-8 rounded-full border-2 border-emerald-400 object-cover"
                  />
                  <img 
                    src="/mocha-assets/462553277_8279697295412769_4594977589251391290_n.jpg" 
                    alt="Homeowner testimonial" 
                    className="w-8 h-8 rounded-full border-2 border-purple-400 object-cover"
                  />
                  <img 
                    src="/mocha-assets/495841161_18507081907024710_6660864889380307053_n.jpg" 
                    alt="Homeowner testimonial" 
                    className="w-8 h-8 rounded-full border-2 border-gray-300 object-cover"
                  />
                  <img 
                    src="/mocha-assets/10483460_1575954135984211_445044868_a.jpg" 
                    alt="Homeowner testimonial" 
                    className="w-8 h-8 rounded-full border-2 border-gray-300 object-cover"
                  />
                </div>
                <div className="flex items-center gap-0.5">
                  <Star className="w-4 h-4 fill-current" style={{ color: '#F2C14B' }} />
                  <Star className="w-4 h-4 fill-current" style={{ color: '#F2C14B' }} />
                  <Star className="w-4 h-4 fill-current" style={{ color: '#F2C14B' }} />
                  <Star className="w-4 h-4 fill-current" style={{ color: '#F2C14B' }} />
                  <Star className="w-4 h-4 fill-current" style={{ color: '#F2C14B' }} />
                </div>
              </div>
              <span className="text-sm text-gray-600 font-medium text-center">
                {locationSavings
                  ? `Homeowners in ${locationSavings.location} save $${locationSavings.savings.toLocaleString()} on average.`
                  : `Homeowners in your area save $${DEFAULT_SAVINGS.toLocaleString()} on average.`
                }
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#333' }}>
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: '#555' }}>
              Every analysis gets the complete product — the score, the market check, the negotiation
              scripts. Paying doesn't unlock features. It removes the limit.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Free Plan */}
            <PricingCard
              icon={<Users className="w-5 h-5 text-gray-600" />}
              iconBg="bg-gray-100"
              cardBg="bg-slate-50"
              borderColor="border-gray-200"
              title="Free"
              subtitle="The whole product, on us"
              price="$0"
              features={[`${FREE_TOTAL_ANALYSES} complete analyses — every module`, 'Negotiation scripts included', 'No card. No signup. No catch.']}
              buttonText="Start Free"
              buttonStyle="outline"
              onButtonClick={() => navigate('/join')}
            />

            {/* Project Pass */}
            <PricingCard
              icon={<Zap className="w-5 h-5 text-blue-600" />}
              iconBg="bg-blue-100"
              cardBg="bg-blue-50/50"
              borderColor="border-blue-200"
              title="Project Pass"
              subtitle="Monthly unlimited"
              price="$19.99"
              priceLabel="/month"
              features={['Unlimited analyses', 'Every revised bid, re-scored', 'Multi-bid comparison', 'Priority AI processing']}
              featureColor="blue"
              buttonText={checkoutLoading === 'project' ? 'Processing...' : 'Get Project Pass'}
              buttonStyle="blue"
              onButtonClick={() => handleSubscriptionCheckout('project')}
              isLoading={checkoutLoading === 'project'}
            />

            {/* Remodeler Pass */}
            <PricingCard
              icon={<Crown className="w-5 h-5 text-white" />}
              iconBg="bg-brand-500"
              iconStyle={{ backgroundColor: '#1F9C4C' }}
              cardBg="bg-gradient-to-br from-brand-50 via-emerald-50 to-teal-50"
              borderColor="border-brand-500"
              title="Remodeler Pass"
              subtitle="Quarterly unlimited"
              price="$39.99"
              priceLabel="/3 months"
              discount="Save 33%"
              features={['Unlimited for your whole remodel', 'Every revised bid, re-scored', 'Quarterly market report', 'Advanced contractor research']}
              featureColor="premium"
              buttonText={checkoutLoading === 'remodeler' ? 'Processing...' : 'Get Remodeler Pass'}
              buttonStyle="premium"
              onButtonClick={() => handleSubscriptionCheckout('remodeler')}
              isLoading={checkoutLoading === 'remodeler'}
              isPremium
              badge="BEST VALUE"
            />
          </div>

          {/* Lifetime Pass - Full Width Below */}
          <div className="mt-8 max-w-4xl mx-auto">
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
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#333' }}>
              How It Works
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: '#555' }}>
              Get professional-level bid analysis in minutes, not days
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <StepCard number={1} title="Upload Your Bid" description="Drop your contractor's PDF bid or estimate. We support most common formats." />
            <StepCard number={2} title="AI Analysis" description="Our AI scans for pricing issues, missing items, and contract red flags." />
            <StepCard number={3} title="Get Insights" description="Receive a detailed report with negotiation talking points and savings opportunities." />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#333' }}>
              Everything You Need
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: '#555' }}>
              Powerful tools to help you make informed decisions about your home projects
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureDetailCard title="Local Market Rates" description="Compare your bid against current pricing in your ZIP code area" icon="📊" />
            <FeatureDetailCard title="State Law Compliance" description="Ensure your contract meets your state's homeowner protections" icon="⚖️" />
            <FeatureDetailCard title="Labor Rate Audit" description="Verify labor rates against BLS data for your region" icon="👷" />
            <FeatureDetailCard title="Talk Track Generator" description="Get scripted questions to ask your contractor based on findings" icon="💬" />
            <FeatureDetailCard title="Risk Scoring" description="See an overall confidence score for your contractor's bid" icon="🎯" />
            <FeatureDetailCard title="Missing Items Check" description="Identify commonly overlooked items that could add surprise costs" icon="📋" />
          </div>
        </div>
      </section>

      {/* Sample Preview Carousel */}
      <SamplePreviewSlider />

      {/* Data Partners Section */}
      <DataPartners />
    </>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  color
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'emerald' | 'teal' | 'red' | 'amber';
}) {
  const colorStyles = {
    emerald: 'bg-emerald-100 text-emerald-600',
    teal: 'bg-teal-100 text-teal-600',
    red: 'bg-red-100 text-red-600',
    amber: 'bg-amber-100 text-amber-600'
  };
  return (
    <div className="card-glass p-6 text-center hover:shadow-lg transition-all duration-300">
      <div className={`w-14 h-14 ${colorStyles[color]} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2" style={{ color: '#333' }}>{title}</h3>
      <p className="text-sm" style={{ color: '#555' }}>{description}</p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div 
        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold shadow-lg"
        style={{ backgroundColor: '#1F9C4C', boxShadow: '0 10px 15px -3px rgba(31, 156, 76, 0.25)' }}
      >
        {number}
      </div>
      <h3 className="text-xl font-semibold mb-3" style={{ color: '#333' }}>{title}</h3>
      <p style={{ color: '#555' }}>{description}</p>
    </div>
  );
}

function FeatureDetailCard({
  title,
  description,
  icon
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-brand-300 hover:shadow-md transition-all">
      <span className="text-3xl mb-4 block">{icon}</span>
      <h3 className="text-lg font-semibold mb-2" style={{ color: '#333' }}>{title}</h3>
      <p className="text-sm" style={{ color: '#555' }}>{description}</p>
    </div>
  );
}

function PricingFeature({
  children,
  premium = false,
  color = 'default'
}: {
  children: React.ReactNode;
  premium?: boolean;
  color?: 'default' | 'blue';
}) {
  const checkColor = premium ? '#1F9C4C' : color === 'blue' ? '#2563eb' : '#10b981';
  return (
    <li className="flex items-center gap-2" style={{ color: '#555' }}>
      <Check className="w-4 h-4 flex-shrink-0" style={{ color: checkColor }} />
      <span>{children}</span>
    </li>
  );
}

function PricingCard({
  icon,
  iconBg,
  iconStyle,
  cardBg,
  borderColor,
  title,
  subtitle,
  price,
  priceLabel,
  originalPrice,
  discount,
  features,
  featureColor = 'default',
  buttonText,
  buttonStyle,
  onButtonClick,
  isLoading = false,
  isPremium = false,
  badge
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconStyle?: React.CSSProperties;
  cardBg: string;
  borderColor: string;
  title: string;
  subtitle: string;
  price: string;
  priceLabel?: string;
  originalPrice?: string;
  discount?: string;
  features: string[];
  featureColor?: 'default' | 'blue' | 'premium';
  buttonText: string;
  buttonStyle: 'outline' | 'blue' | 'premium';
  onButtonClick: () => void;
  isLoading?: boolean;
  isPremium?: boolean;
  badge?: string;
}) {
  const getButtonStyles = () => {
    switch (buttonStyle) {
      case 'outline':
        return {
          className: 'w-full py-3 rounded-xl font-semibold border-2 border-gray-300 transition-all animate__animated',
          style: { color: '#333' } as React.CSSProperties,
          hoverBg: '#f3f4f6',
          defaultBg: 'transparent'
        };
      case 'blue':
        return {
          className: 'w-full py-3 rounded-xl font-semibold text-white transition-all animate__animated',
          style: { backgroundColor: '#2563eb' } as React.CSSProperties,
          hoverBg: '#1d4ed8',
          defaultBg: '#2563eb'
        };
      case 'premium':
        return {
          className: 'w-full py-3.5 rounded-xl font-bold text-white transition-all shadow-lg hover:shadow-xl disabled:opacity-70 flex items-center justify-center gap-2 animate__animated',
          style: { backgroundColor: '#1F9C4C' } as React.CSSProperties,
          hoverBg: '#1a8a42',
          defaultBg: '#1F9C4C'
        };
    }
  };

  const btnStyles = getButtonStyles();

  return (
    <div 
      className={`${cardBg} rounded-2xl p-6 border-2 ${borderColor} transition-all duration-300 ease-out ${isPremium ? 'relative shadow-xl shadow-brand-500/20 scale-[1.02] hover:scale-[1.08]' : 'hover:scale-105 hover:shadow-xl hover:-translate-y-1'}`}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1" style={{ backgroundColor: '#1F9C4C' }}>
          <Star className="w-3 h-3" />
          {badge}
        </div>
      )}
      
      <div className={`flex items-center gap-2 mb-4 ${isPremium ? 'mt-2' : ''}`}>
        <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center ${isPremium ? 'shadow-md' : ''}`} style={iconStyle}>
          {icon}
        </div>
        <div>
          <h3 className={`font-semibold ${isPremium ? 'font-bold text-lg' : ''}`} style={{ color: '#333' }}>{title}</h3>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>
      
      <div className="mb-4">
        <span className={`font-bold ${isPremium ? 'text-4xl' : 'text-3xl'}`} style={{ color: isPremium ? '#1F9C4C' : '#333' }}>{price}</span>
        {priceLabel && <span className="text-gray-500 text-sm">{priceLabel}</span>}
        {originalPrice && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-gray-400 line-through text-sm">{originalPrice}</span>
            {discount && <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-semibold rounded-full">{discount}</span>}
          </div>
        )}
      </div>
      
      <ul className="space-y-2 mb-6 text-sm">
        {features.map((feature, index) => (
          <PricingFeature 
            key={index} 
            premium={featureColor === 'premium'} 
            color={featureColor === 'blue' ? 'blue' : 'default'}
          >
            {feature}
          </PricingFeature>
        ))}
      </ul>
      
      <button 
        onClick={onButtonClick}
        disabled={isLoading}
        className={btnStyles.className}
        style={btnStyles.style}
        onMouseEnter={(e) => {
          if (!isLoading) {
            if (buttonStyle !== 'outline') {
              e.currentTarget.style.backgroundColor = btnStyles.hoverBg;
            } else {
              e.currentTarget.style.backgroundColor = btnStyles.hoverBg;
            }
            // Trigger pulse animation
            e.currentTarget.classList.remove('animate__pulse');
            void e.currentTarget.offsetWidth;
            e.currentTarget.classList.add('animate__pulse');
          }
        }}
        onMouseLeave={(e) => {
          if (!isLoading) {
            e.currentTarget.style.backgroundColor = btnStyles.defaultBg;
          }
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'scale(0.95)';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {buttonText}
          </>
        ) : (
          buttonText
        )}
      </button>
    </div>
  );
}
