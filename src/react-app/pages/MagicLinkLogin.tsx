import { useState } from 'react';
import { Link } from 'react-router';
import Header from '@/react-app/components/Header';
import { Mail, ArrowLeft, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/react-app/lib/auth';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export default function MagicLinkLoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const { redirectToLogin } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) return;

    setStatus('sending');
    setErrorMessage('');

    try {
      const response = await fetch('/api/auth/magic-link/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus('error');
        setErrorMessage(data.error || 'Something went wrong. Please try again.');
        return;
      }

      setStatus('sent');
    } catch (err) {
      console.error('Magic link request error:', err);
      setStatus('error');
      setErrorMessage('Unable to send email. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-md mx-auto">
          {/* Back Button */}
          <Link 
            to="/join" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-navy-100 hover:bg-navy-200 text-navy-700 rounded-lg font-medium text-sm transition-all mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="px-8 py-6 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <Mail className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold">Sign in with Email</h1>
              <p className="text-emerald-100 mt-1">
                No password needed — we'll send you a secure link
              </p>
            </div>

            {/* Content */}
            <div className="p-8">
              {status === 'sent' ? (
                /* Success State */
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h2 className="text-xl font-bold text-navy-900 mb-2">Check your inbox</h2>
                  <p className="text-navy-600 mb-4">
                    We sent a sign-in link to
                  </p>
                  <p className="font-semibold text-navy-900 mb-6 bg-slate-100 py-2 px-4 rounded-lg inline-block">
                    {email}
                  </p>
                  <p className="text-sm text-navy-500">
                    Click the link in the email to sign in. The link expires in 30 minutes.
                  </p>
                  <p className="text-xs text-navy-400 mt-3 bg-amber-50 border border-amber-200 rounded-lg py-2 px-3">
                    💡 Don't see it? Check your <strong>Spam</strong> or <strong>Junk</strong> folder and mark it "Not Spam" to allow future emails.
                  </p>
                  
                  <button
                    onClick={() => {
                      setStatus('idle');
                      setEmail('');
                    }}
                    className="mt-6 text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                  >
                    Use a different email
                  </button>
                </div>
              ) : (
                /* Form State */
                <form onSubmit={handleSubmit}>
                  <label htmlFor="email" className="block text-sm font-medium text-navy-700 mb-2">
                    Email address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    disabled={status === 'sending'}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500"
                  />

                  {status === 'error' && (
                    <div className="mt-3 flex items-start gap-2 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'sending' || !email.trim()}
                    className="w-full mt-6 flex items-center justify-center gap-2 text-white py-3 px-6 rounded-xl font-semibold transition-all shadow-md disabled:opacity-70"
                    style={{ backgroundColor: '#1F9C4C' }}
                    onMouseEnter={(e) => status !== 'sending' && (e.currentTarget.style.backgroundColor = '#1a8a42')}
                    onMouseLeave={(e) => status !== 'sending' && (e.currentTarget.style.backgroundColor = '#1F9C4C')}
                  >
                    {status === 'sending' ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Sign-in Link
                      </>
                    )}
                  </button>

                  <p className="mt-4 text-xs text-navy-400 text-center">
                    By signing in, you agree to our{' '}
                    <Link to="/terms" className="text-emerald-600 hover:underline">Terms</Link>
                    {' '}and{' '}
                    <Link to="/privacy" className="text-emerald-600 hover:underline">Privacy Policy</Link>.
                  </p>
                </form>
              )}
            </div>
          </div>

          {/* Alternative: Google Sign In */}
          <div className="mt-6 text-center">
            <p className="text-navy-500 text-sm mb-3">Or sign in with</p>
            <button
              onClick={() => redirectToLogin()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-navy-700 rounded-lg font-medium text-sm transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              Google
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
