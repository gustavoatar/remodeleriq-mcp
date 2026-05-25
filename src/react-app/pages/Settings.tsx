import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useCombinedAuth } from '@/react-app/hooks/useCombinedAuth';
import Header from '@/react-app/components/Header';
import PageSEO from '@/react-app/components/PageSEO';
import { BreadcrumbSchema, BREADCRUMBS } from '@/react-app/components/StructuredData';
import { 
  User, Mail, Trash2, Crown, 
  AlertTriangle, Check, Loader2, ArrowLeft, LogOut, MapPin, Navigation,
  Database, RefreshCw, X, Sparkles
} from 'lucide-react';
import { STATE_CODES, useUserLocation } from '@/react-app/hooks/useGeolocation';
import { FREE_TOTAL_ANALYSES } from '@/shared/featureFlags';

type SubscriptionTier = 'free' | 'project_pass' | 'remodeler_pass' | 'lifetime' | 'legacy';
type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'none';

interface SubscriptionData {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
}

const TIER_DISPLAY: Record<SubscriptionTier, { name: string; description: string; price: string }> = {
  free: { name: 'Free Plan', description: `${FREE_TOTAL_ANALYSES} bid analyses total`, price: 'Free' },
  project_pass: { name: 'Project Pass', description: 'Unlimited analyses', price: '$19.99/month' },
  remodeler_pass: { name: 'Remodeler Pass', description: 'Unlimited analyses', price: '$39.99/quarter' },
  lifetime: { name: 'Lifetime Pass', description: 'Unlimited forever', price: 'One-time purchase' },
  legacy: { name: 'Premium', description: 'Unlimited analyses', price: 'Lifetime' },
};

export default function SettingsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, logout } = useCombinedAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isRefreshingBLS, setIsRefreshingBLS] = useState(false);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionData>({ tier: 'free', status: 'none', currentPeriodEnd: null });
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  
  // Check for welcome state from payment or magic link
  useEffect(() => {
    const paymentSuccess = searchParams.get('payment') === 'success';
    const welcomeFlow = searchParams.get('welcome') === 'true';
    
    if (paymentSuccess || welcomeFlow) {
      setShowWelcomeBanner(true);
      // Clean up URL params
      searchParams.delete('payment');
      searchParams.delete('welcome');
      searchParams.delete('guest');
      setSearchParams(searchParams, { replace: true });
    }
  }, []);

  // Fetch subscription status
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await fetch('/api/subscription/status');
        if (response.ok) {
          const data = await response.json();
          // API returns: tier, status, periodEnd (camelCase)
          setSubscription({
            tier: data.tier || 'free',
            status: data.status || 'none',
            currentPeriodEnd: data.periodEnd,
          });
        }
      } catch (error) {
        console.error('Failed to fetch subscription status:', error);
      } finally {
        setLoadingSubscription(false);
      }
    };
    
    if (user) {
      fetchSubscription();
    } else {
      setLoadingSubscription(false);
    }
  }, [user]);

  const handleRefreshBLSData = async () => {
    setIsRefreshingBLS(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/ppi/refresh', { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: `BLS data refreshed: ${data.insertedCount} data points updated.` });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to refresh BLS data.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to connect to refresh service.' });
    } finally {
      setIsRefreshingBLS(false);
    }
  };

  // User location with geolocation permission
  const { 
    stateCode, 
    stateName, 
    setLocation, 
    permissionStatus, 
    requestPermission,
    loading: locationLoading 
  } = useUserLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/users/account', {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete account');
      
      // Redirect to home after deletion
      navigate('/');
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete account. Please try again.' });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCancelPremium = async () => {
    setIsCancelling(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to cancel subscription');
      
      const data = await response.json();
      // API returns accessUntil with the period end date
      const endDate = data.accessUntil 
        ? new Date(data.accessUntil).toLocaleDateString() 
        : 'the end of your billing period';
      
      setMessage({ type: 'success', text: `Your subscription has been cancelled. You will retain access until ${endDate}. No further charges will be made.` });
      // Update local state
      setSubscription(prev => ({ ...prev, status: 'canceled' }));
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to cancel subscription. Please try again.' });
    } finally {
      setIsCancelling(false);
      setShowCancelConfirm(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="pt-24 px-4 text-center">
          <p style={{ color: '#555' }}>Please sign in to access settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <PageSEO
        title="Account Settings | RemodelerIQ"
        description="Manage your RemodelerIQ account settings, subscription, and preferences."
        path="/settings"
        noindex={true}
      />
      <BreadcrumbSchema items={BREADCRUMBS.settings} />
      <Header />
      
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>

          <h1 className="text-3xl font-bold mb-8" style={{ color: '#333' }}>Settings</h1>

          {/* Premium Welcome Banner */}
          {showWelcomeBanner && (
            <div className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white relative overflow-hidden">
              <button
                onClick={() => setShowWelcomeBanner(false)}
                className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-1">Welcome to Premium! 🎉</h2>
                  <p className="text-white/90 mb-3">
                    You now have unlimited bid analyses, AI-powered negotiation scripts, and priority support.
                  </p>
                  <button
                    onClick={() => {
                      setShowWelcomeBanner(false);
                      navigate('/?view=upload');
                    }}
                    className="px-4 py-2 bg-white text-emerald-600 font-semibold rounded-xl hover:bg-white/90 transition-colors"
                  >
                    Analyze Your First Bid
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
              message.type === 'success' 
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' 
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              {message.text}
            </div>
          )}

          {/* Profile Section */}
          <div className="card-glass p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: '#333' }}>
              <User className="w-5 h-5 text-brand-500" />
              Profile
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {user.picture && (
                  <img 
                    src={user.picture} 
                    alt="Profile" 
                    className="w-16 h-16 rounded-full border-2 border-gray-200"
                  />
                )}
                <div>
                  <p className="font-medium" style={{ color: '#333' }}>{user.name || 'User'}</p>
                  <p className="text-sm flex items-center gap-1" style={{ color: '#555' }}>
                    <Mail className="w-4 h-4" />
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className="card-glass p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: '#333' }}>
              <MapPin className="w-5 h-5 text-brand-500" />
              Your Location
            </h2>
            
            <div className="space-y-4">
              <p className="text-sm" style={{ color: '#555' }}>
                Your location is used to apply state-specific contractor laws, license requirements, and market rates to your bid analyses.
              </p>
              
              {/* Geolocation Permission Status */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      permissionStatus === 'granted' 
                        ? 'bg-emerald-100' 
                        : permissionStatus === 'denied' 
                          ? 'bg-red-100' 
                          : 'bg-amber-100'
                    }`}>
                      <Navigation className={`w-5 h-5 ${
                        permissionStatus === 'granted' 
                          ? 'text-emerald-600' 
                          : permissionStatus === 'denied' 
                            ? 'text-red-600' 
                            : 'text-amber-600'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm" style={{ color: '#333' }}>Location Detection</p>
                      <p className="text-xs" style={{ color: '#555' }}>
                        {permissionStatus === 'granted' && 'Enabled — detecting your location automatically'}
                        {permissionStatus === 'denied' && 'Disabled — select your state manually below'}
                        {permissionStatus === 'prompt' && 'Not set — click to enable automatic detection'}
                        {permissionStatus === 'unknown' && 'Checking permission status...'}
                      </p>
                    </div>
                  </div>
                  {(permissionStatus === 'prompt' || permissionStatus === 'unknown') && (
                    <button
                      onClick={requestPermission}
                      disabled={locationLoading}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      {locationLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Enable'
                      )}
                    </button>
                  )}
                  {permissionStatus === 'granted' && (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                      Active
                    </span>
                  )}
                </div>
              </div>
              
              {/* State Selector */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#333' }}>
                  {permissionStatus === 'granted' ? 'Detected State (or select manually)' : 'Select Your State'}
                </label>
                <select
                  value={stateCode ?? ''}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all bg-white"
                  style={{ color: '#333' }}
                >
                  {Object.entries(STATE_CODES).map(([name, code]) => (
                    <option key={code} value={code}>
                      {name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} ({code})
                    </option>
                  ))}
                </select>
              </div>
              
              <p className="text-xs" style={{ color: '#777' }}>
                Currently set to: <span className="font-medium" style={{ color: '#555' }}>{stateName}</span>
                {permissionStatus === 'denied' && (
                  <span className="block mt-1 text-amber-600">
                    To enable automatic detection, allow location access in your browser settings.
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Subscription Section */}
          <div className="card-glass p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: '#333' }}>
              <Crown className="w-5 h-5 text-brand-500" />
              Your Plan
            </h2>
            
            {loadingSubscription ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Current Plan Display */}
                <div className={`rounded-xl p-4 ${
                  subscription.tier === 'free' 
                    ? 'bg-gray-50 border border-gray-200' 
                    : 'bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold flex items-center gap-2" style={{ color: '#333' }}>
                        {subscription.tier !== 'free' && <Crown className="w-5 h-5 text-emerald-500" />}
                        {TIER_DISPLAY[subscription.tier].name}
                      </p>
                      <p className="text-sm mt-1" style={{ color: '#555' }}>
                        {TIER_DISPLAY[subscription.tier].description}
                      </p>
                      {subscription.tier !== 'free' && subscription.currentPeriodEnd && (
                        <p className={`text-xs mt-2 ${subscription.status === 'canceled' ? 'text-amber-600' : 'text-gray-500'}`}>
                          {subscription.status === 'canceled' 
                            ? `Access ends ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                            : `Renews ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                          }
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        subscription.tier === 'legacy' || subscription.tier === 'lifetime'
                          ? 'bg-amber-100 text-amber-700'
                          : subscription.status === 'active' 
                            ? 'bg-emerald-100 text-emerald-700'
                            : subscription.status === 'canceled'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-gray-100 text-gray-600'
                      }`}>
                        {subscription.tier === 'legacy' || subscription.tier === 'lifetime' ? 'Lifetime' :
                         subscription.status === 'active' ? 'Active' : 
                         subscription.status === 'canceled' ? 'Cancelled' : 
                         subscription.tier === 'free' ? 'Free' : 'Inactive'}
                      </span>
                      {subscription.tier !== 'free' && (
                        <p className="text-sm mt-2 font-medium" style={{ color: '#555' }}>
                          {TIER_DISPLAY[subscription.tier].price}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Upgrade/Downgrade Actions */}
                {subscription.tier === 'free' && (
                  <div className="pt-2">
                    <p className="text-sm mb-3" style={{ color: '#555' }}>
                      Upgrade for unlimited bid analyses and AI-powered negotiation scripts.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => navigate('/join')}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                      >
                        <Crown className="w-5 h-5" />
                        View Plans
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Cancel Link for Active Subscriptions (not for legacy or lifetime users) */}
                {subscription.tier !== 'free' && subscription.tier !== 'legacy' && subscription.tier !== 'lifetime' && subscription.status === 'active' && (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
                  >
                    Cancel Subscription
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Data Management Section */}
          <div className="card-glass p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: '#333' }}>
              <Database className="w-5 h-5 text-brand-500" />
              Data Management
            </h2>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium" style={{ color: '#333' }}>BLS Material Price Data</p>
                    <p className="text-sm mt-1" style={{ color: '#555' }}>
                      Producer Price Index data from Bureau of Labor Statistics. Auto-refreshes daily.
                    </p>
                  </div>
                  <button
                    onClick={handleRefreshBLSData}
                    disabled={isRefreshingBLS}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isRefreshingBLS ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    {isRefreshingBLS ? 'Refreshing...' : 'Refresh Now'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div className="card-glass p-6 border-red-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: '#333' }}>
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Account Actions
            </h2>
            
            <div className="space-y-4">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
              
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </button>
                <p className="text-xs mt-2" style={{ color: '#777' }}>
                  This will permanently delete your account and all associated data.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-center mb-2" style={{ color: '#333' }}>Delete Account?</h3>
            <p className="text-center mb-6" style={{ color: '#555' }}>
              This action cannot be undone. All your data will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                style={{ color: '#333' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  'Delete Account'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Subscription Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-xl font-bold text-center mb-2" style={{ color: '#333' }}>Cancel Subscription?</h3>
            <p className="text-center mb-6" style={{ color: '#555' }}>
              Your subscription will remain active until the end of your current billing period. After that, you'll revert to the free plan with {FREE_TOTAL_ANALYSES} total analyses.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                style={{ color: '#333' }}
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelPremium}
                disabled={isCancelling}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {isCancelling ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  'Cancel Subscription'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
