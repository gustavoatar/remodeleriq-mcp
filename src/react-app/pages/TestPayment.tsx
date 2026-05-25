import { useState } from 'react';
import { useSearchParams, Link } from 'react-router';
import { CreditCard, CheckCircle, XCircle, AlertTriangle, Loader2, Mail, Send, Key, Bug, RefreshCw } from 'lucide-react';

type MagicLinkStatus = 'idle' | 'sending' | 'sent' | 'error';
type DiagnosticStatus = 'idle' | 'testing' | 'done';

interface DiagnosticResult {
  success: boolean;
  email?: string;
  rawResult?: unknown;
  error?: string;
  timestamp?: string;
}

export default function TestPayment() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Magic link state
  const [email, setEmail] = useState('');
  const [magicLinkStatus, setMagicLinkStatus] = useState<MagicLinkStatus>('idle');
  const [magicLinkError, setMagicLinkError] = useState('');
  const [magicLinkResponse, setMagicLinkResponse] = useState<unknown>(null);
  
  // Diagnostic state
  const [diagnosticEmail, setDiagnosticEmail] = useState('');
  const [diagnosticStatus, setDiagnosticStatus] = useState<DiagnosticStatus>('idle');
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);

  const handleTestPayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/test-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to create checkout session');
        setIsLoading(false);
      }
    } catch (err) {
      setError('Network error - please try again');
      setIsLoading(false);
    }
  };

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) return;

    setMagicLinkStatus('sending');
    setMagicLinkError('');
    setMagicLinkResponse(null);

    try {
      const response = await fetch('/api/auth/magic-link/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();
      setMagicLinkResponse(data);

      if (!response.ok) {
        setMagicLinkStatus('error');
        setMagicLinkError(data.error || 'Something went wrong');
        return;
      }

      setMagicLinkStatus('sent');
    } catch (err) {
      setMagicLinkStatus('error');
      setMagicLinkError('Unable to send email');
    }
  };

  const handleDiagnosticTest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!diagnosticEmail.trim()) return;

    setDiagnosticStatus('testing');
    setDiagnosticResult(null);

    try {
      const response = await fetch(`/api/auth/test-email?email=${encodeURIComponent(diagnosticEmail.trim())}`);
      const data = await response.json();
      setDiagnosticResult(data);
      setDiagnosticStatus('done');
    } catch (err) {
      setDiagnosticResult({
        success: false,
        error: `Network error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      });
      setDiagnosticStatus('done');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-medium mb-4">
            <AlertTriangle className="w-4 h-4" />
            Development & QA Only
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Test Environment</h1>
          <p className="text-slate-600 mt-1">Test payment and authentication flows</p>
        </div>

        {/* Payment Test Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Stripe Payment Test</h2>
                <p className="text-white/80 text-sm">Test checkout flow ($0.50)</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {status === 'success' && (
              <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                  <div>
                    <p className="font-semibold text-emerald-800">Payment Successful!</p>
                    <p className="text-sm text-emerald-600">Test transaction completed</p>
                  </div>
                </div>
              </div>
            )}

            {status === 'cancelled' && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <XCircle className="w-6 h-6 text-amber-600" />
                  <p className="font-medium text-amber-800">Payment Cancelled</p>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <XCircle className="w-6 h-6 text-red-600" />
                  <p className="text-red-800">{error}</p>
                </div>
              </div>
            )}

            <button
              onClick={handleTestPayment}
              disabled={isLoading}
              className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Run Test Payment
                </>
              )}
            </button>
          </div>
        </div>

        {/* Magic Link Test Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-violet-600 to-purple-700 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Key className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Magic Link Test</h2>
                <p className="text-white/80 text-sm">Test passwordless login flow</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {magicLinkStatus === 'sent' ? (
              <div className="text-center py-2">
                <div className="w-14 h-14 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-7 h-7 text-violet-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Check your inbox!</h3>
                <p className="text-slate-600 mb-2">Magic link sent to:</p>
                <p className="font-semibold text-slate-900 bg-slate-100 py-2 px-4 rounded-lg inline-block mb-4">
                  {email}
                </p>
                <p className="text-sm text-slate-500 mb-4">
                  Click the link in the email to complete sign-in. Link expires in 30 minutes.
                </p>
                <button
                  onClick={() => {
                    setMagicLinkStatus('idle');
                    setEmail('');
                    setMagicLinkResponse(null);
                  }}
                  className="text-violet-600 hover:text-violet-700 font-medium text-sm"
                >
                  Send to a different email
                </button>
                
                {/* Show raw response */}
                {magicLinkResponse !== null && (
                  <div className="mt-4 p-3 bg-slate-100 rounded-lg text-left">
                    <p className="text-xs font-semibold text-slate-600 mb-1">API Response:</p>
                    <pre className="text-xs text-slate-700 overflow-auto max-h-32">
                      {JSON.stringify(magicLinkResponse, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSendMagicLink}>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your-email@example.com"
                  required
                  disabled={magicLinkStatus === 'sending'}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all disabled:bg-slate-50"
                />

                {magicLinkStatus === 'error' && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-600 text-sm mb-2">
                      <XCircle className="w-4 h-4" />
                      <span>{magicLinkError}</span>
                    </div>
                    {magicLinkResponse !== null && (
                      <div className="mt-2 p-2 bg-white/80 rounded">
                        <p className="text-xs font-semibold text-slate-600 mb-1">Raw Response:</p>
                        <pre className="text-xs text-slate-700 overflow-auto max-h-32 whitespace-pre-wrap">
                          {JSON.stringify(magicLinkResponse, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={magicLinkStatus === 'sending' || !email.trim()}
                  className="w-full mt-4 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white py-3 px-6 rounded-xl font-semibold transition-all disabled:opacity-50"
                >
                  {magicLinkStatus === 'sending' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Magic Link
                    </>
                  )}
                </button>

                <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">
                    <strong>How it works:</strong> Enter any email address. We'll send a secure login link that expires in 30 minutes. Clicking the link creates your session.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Email Diagnostics Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-red-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Bug className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Email Diagnostics</h2>
                <p className="text-white/80 text-sm">Test raw email service response</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <form onSubmit={handleDiagnosticTest}>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Test email address
              </label>
              <input
                type="email"
                value={diagnosticEmail}
                onChange={(e) => setDiagnosticEmail(e.target.value)}
                placeholder="test@example.com"
                required
                disabled={diagnosticStatus === 'testing'}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all disabled:bg-slate-50"
              />

              <button
                type="submit"
                disabled={diagnosticStatus === 'testing' || !diagnosticEmail.trim()}
                className="w-full mt-4 flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white py-3 px-6 rounded-xl font-semibold transition-all disabled:opacity-50"
              >
                {diagnosticStatus === 'testing' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    Run Diagnostic Test
                  </>
                )}
              </button>
            </form>

            {diagnosticResult && (
              <div className={`mt-4 p-4 rounded-xl border ${
                diagnosticResult.success 
                  ? 'bg-emerald-50 border-emerald-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {diagnosticResult.success ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className={`font-semibold ${
                    diagnosticResult.success ? 'text-emerald-800' : 'text-red-800'
                  }`}>
                    {diagnosticResult.success ? 'Email Sent Successfully' : 'Email Failed'}
                  </span>
                </div>
                
                <div className="mt-3 p-3 bg-white/80 rounded-lg">
                  <p className="text-xs font-semibold text-slate-600 mb-1">Raw Response:</p>
                  <pre className="text-xs text-slate-700 overflow-auto max-h-48 whitespace-pre-wrap">
                    {JSON.stringify(diagnosticResult, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            <div className="mt-4 p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500">
                <strong>Purpose:</strong> This sends a test email via the /api/auth/test-email endpoint and shows the complete raw response from the email service, including any error details.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Quick Test Links</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/login"
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-center text-sm font-medium transition-all"
            >
              Unified Login Page
            </Link>
            <Link
              to="/settings?payment=success"
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-center text-sm font-medium transition-all"
            >
              Settings (Welcome)
            </Link>
            <Link
              to="/join"
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-center text-sm font-medium transition-all"
            >
              Pricing Page
            </Link>
            <Link
              to="/"
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-center text-sm font-medium transition-all"
            >
              Home
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-slate-400 text-center">
          Internal testing only • Do not share this link publicly
        </p>
      </div>
    </div>
  );
}
