import { useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@/react-app/lib/auth';
import PageSEO from '@/react-app/components/PageSEO';
import { BreadcrumbSchema, BREADCRUMBS } from '@/react-app/components/StructuredData';
import { Loader2, Send, CheckCircle2, AlertCircle } from 'lucide-react';

type EmailStatus = 'idle' | 'sending' | 'sent' | 'error';

export default function LoginPage() {
  const { isPending, redirectToLogin } = useAuth();
  
  const [email, setEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState<EmailStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleGoogleSignIn = () => {
    redirectToLogin();
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) return;

    setEmailStatus('sending');
    setErrorMessage('');

    try {
      const response = await fetch('/api/auth/magic-link/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setEmailStatus('error');
        setErrorMessage(data.error || 'Something went wrong. Please try again.');
        return;
      }

      setEmailStatus('sent');
    } catch (err) {
      console.error('Magic link request error:', err);
      setEmailStatus('error');
      setErrorMessage('Unable to send email. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <PageSEO
        title="Sign In to RemodelerIQ | Access Your Bid Analysis"
        description="Log in to your RemodelerIQ account to analyze contractor bids, track your projects, and access saved negotiation scripts."
        path="/login"
        keywords="RemodelerIQ login, contractor bid analyzer sign in"
      />
      <BreadcrumbSchema items={BREADCRUMBS.login} />
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: '#1F9C4C' }}
            >
              R
            </div>
            <span className="text-2xl font-bold text-slate-900">RemodelerIQ</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          {emailStatus === 'sent' ? (
            /* Email Sent Success State */
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Check your inbox</h2>
              <p className="text-slate-600 mb-4">
                We sent a sign-in link to
              </p>
              <p className="font-semibold text-slate-900 bg-slate-100 py-2 px-4 rounded-lg inline-block mb-4">
                {email}
              </p>
              <p className="text-sm text-slate-500 mb-6">
                Click the link in the email to sign in. The link expires in 30 minutes.
              </p>
              <button
                onClick={() => {
                  setEmailStatus('idle');
                  setEmail('');
                }}
                className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
              >
                Use a different email
              </button>
            </div>
          ) : (
            /* Login Form */
            <>
              <h1 className="text-2xl font-bold text-slate-900 text-center mb-8">
                Sign in to RemodelerIQ
              </h1>

              {/* Google Sign In */}
              {isPending ? (
                <div className="flex justify-center py-4 mb-6">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : (
                <button
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 py-3.5 px-6 rounded-xl font-medium transition-all shadow-sm mb-6"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Log in with Google
                </button>
              )}

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-slate-500">or</span>
                </div>
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailSubmit}>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={emailStatus === 'sending'}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500 mb-4"
                />

                {emailStatus === 'error' && (
                  <div className="mb-4 flex items-start gap-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={emailStatus === 'sending' || !email.trim()}
                  className="w-full flex items-center justify-center gap-2 text-white py-3 px-6 rounded-xl font-semibold transition-all shadow-md disabled:opacity-70"
                  style={{ backgroundColor: '#1F9C4C' }}
                  onMouseEnter={(e) => emailStatus !== 'sending' && (e.currentTarget.style.backgroundColor = '#1a8a42')}
                  onMouseLeave={(e) => emailStatus !== 'sending' && (e.currentTarget.style.backgroundColor = '#1F9C4C')}
                >
                  {emailStatus === 'sending' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Continue
                    </>
                  )}
                </button>
              </form>

              {/* Sign up link */}
              <p className="mt-6 text-center text-sm text-slate-600">
                New here?{' '}
                <Link to="/join" className="font-medium" style={{ color: '#1F9C4C' }}>
                  Learn about our plans
                </Link>
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-400">
          This site is protected by our{' '}
          <Link to="/privacy" className="underline hover:text-slate-600">Privacy Policy</Link>
          {' '}and{' '}
          <Link to="/terms" className="underline hover:text-slate-600">Terms of Service</Link>.
        </p>
      </div>
    </div>
  );
}
