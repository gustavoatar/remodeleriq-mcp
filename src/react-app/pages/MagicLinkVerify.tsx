import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router';
import Header from '@/react-app/components/Header';
import { useCombinedAuth } from '@/react-app/hooks/useCombinedAuth';
import { Loader2, CheckCircle2, XCircle, Mail, ArrowRight } from 'lucide-react';

type Status = 'verifying' | 'success' | 'error';

interface VerifiedUser {
  id: number;
  email: string;
  name: string | null;
  isPremium: boolean;
  premiumEndsAt: string | null;
}

export default function MagicLinkVerifyPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refetchUser } = useCombinedAuth();
  const [status, setStatus] = useState<Status>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [user, setUser] = useState<VerifiedUser | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setErrorMessage('No verification token found. Please request a new sign-in link.');
      return;
    }

    verifyToken(token);
  }, [searchParams]);

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch(`/api/auth/magic-link/verify?token=${encodeURIComponent(token)}`);
      const data = await response.json();

      if (!response.ok) {
        setStatus('error');
        setErrorMessage(data.error || 'Invalid or expired link. Please request a new one.');
        return;
      }

      setUser(data.user);
      setStatus('success');

      // Store user info in localStorage for the app to pick up
      if (data.user) {
        localStorage.setItem('riq_magic_user', JSON.stringify(data.user));
      }

      // Refetch user data so header updates
      await refetchUser();

      // Auto-redirect after 3 seconds
      setTimeout(() => {
        // Check if this is a new premium user (from payment flow)
        if (data.user?.isPremium) {
          navigate('/settings?welcome=premium');
        } else {
          navigate('/');
        }
      }, 3000);
    } catch (err) {
      console.error('Token verification error:', err);
      setStatus('error');
      setErrorMessage('Unable to verify your link. Please try again.');
    }
  };

  const handleContinue = () => {
    if (user?.isPremium) {
      navigate('/settings?welcome=premium');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            {status === 'verifying' && (
              /* Verifying State */
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                </div>
                <h1 className="text-2xl font-bold text-navy-900 mb-2">Verifying your link...</h1>
                <p className="text-navy-600">
                  Just a moment while we sign you in.
                </p>
              </div>
            )}

            {status === 'success' && (
              /* Success State */
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h1 className="text-2xl font-bold text-navy-900 mb-2">You're signed in!</h1>
                <p className="text-navy-600 mb-2">
                  Welcome{user?.email ? ` back, ${user.email}` : ''}!
                </p>
                {user?.isPremium && (
                  <p className="text-emerald-600 font-medium mb-4">
                    ✨ Premium access is active
                  </p>
                )}
                <p className="text-sm text-navy-400 mb-6">
                  Redirecting you automatically...
                </p>
                
                <button
                  onClick={handleContinue}
                  className="inline-flex items-center gap-2 text-white py-3 px-6 rounded-xl font-semibold transition-all shadow-md"
                  style={{ backgroundColor: '#1F9C4C' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a8a42'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1F9C4C'}
                >
                  Continue Now
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {status === 'error' && (
              /* Error State */
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-navy-900 mb-2">Link expired or invalid</h1>
                <p className="text-navy-600 mb-6">
                  {errorMessage}
                </p>
                
                <Link
                  to="/auth/magic-link"
                  className="inline-flex items-center gap-2 text-white py-3 px-6 rounded-xl font-semibold transition-all shadow-md"
                  style={{ backgroundColor: '#1F9C4C' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a8a42'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1F9C4C'}
                >
                  <Mail className="w-5 h-5" />
                  Request New Link
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
