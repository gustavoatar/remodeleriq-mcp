import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@getmocha/users-service/react';
import { Loader2, RefreshCw } from 'lucide-react';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { exchangeCodeForSessionToken, fetchUser, user, redirectToLogin } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        await exchangeCodeForSessionToken();
        await fetchUser();
        setIsProcessing(false);
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('We had trouble completing sign in. This can happen due to browser privacy settings.');
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [exchangeCodeForSessionToken, fetchUser]);

  useEffect(() => {
    if (!isProcessing && user) {
      navigate('/', { replace: true });
    }
  }, [isProcessing, user, navigate]);

  const handleRetry = () => {
    redirectToLogin();
  };

  const handleContinueWithoutSignIn = () => {
    navigate('/');
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="card-glass p-8 max-w-md w-full text-center">
          <img 
            src="https://019c214f-ccaa-7d34-af84-d64251e64a7c.mochausercontent.com/remodeler-iq-svg-logo.svg" 
            alt="RemodelerIQ" 
            className="h-10 mx-auto mb-6"
          />
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-amber-600 text-2xl">!</span>
          </div>
          <h2 className="text-xl font-bold text-navy-900 mb-2">Sign In Issue</h2>
          <p className="text-navy-600 mb-6">{error}</p>
          
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
              style={{ backgroundColor: '#1F9C4C' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a8a42'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1F9C4C'}
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            
            <button
              onClick={handleContinueWithoutSignIn}
              className="w-full border border-navy-200 text-navy-700 hover:bg-navy-50 px-6 py-3 rounded-xl font-medium transition-all"
            >
              Continue Without Signing In
            </button>
          </div>
          
          <p className="text-xs text-navy-400 mt-6">
            Tip: If you're using the preview, try opening the app in a new tab or disabling third-party cookie blocking.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: '#1F9C4C' }} />
        <p className="text-navy-600 font-medium">Completing sign in...</p>
      </div>
    </div>
  );
}
