import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';

interface WebhookStatusData {
  stripeKeyConfigured: boolean;
  stripeKeyMode: string;
  webhookSecretConfigured: boolean;
  webhookSecretPrefix: string;
}

export default function WebhookStatus() {
  const [status, setStatus] = useState<WebhookStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/webhook-status-json');
        if (!res.ok) throw new Error('Failed to fetch status');
        const data = await res.json();
        setStatus(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchStatus();
  }, []);

  const StatusIcon = ({ ok }: { ok: boolean }) => 
    ok ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-red-500" />;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-6 md:p-10">
      <div className="max-w-xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to app
        </Link>
        
        <h1 className="text-2xl font-bold text-emerald-400 mb-6 flex items-center gap-2">
          <AlertCircle className="w-6 h-6" />
          Webhook Status
        </h1>

        {loading && (
          <div className="bg-slate-800 rounded-xl p-6 animate-pulse">
            <div className="h-4 bg-slate-700 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-slate-700 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-slate-700 rounded w-2/3"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-6">
            <p className="text-red-400">Error: {error}</p>
          </div>
        )}

        {status && (
          <>
            <div className="bg-slate-800 rounded-xl p-6 mb-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-slate-700">
                  <span className="text-slate-400">Stripe Key</span>
                  <div className="flex items-center gap-2">
                    <StatusIcon ok={status.stripeKeyConfigured} />
                    <span className={status.stripeKeyConfigured ? 'text-emerald-400' : 'text-red-400'}>
                      {status.stripeKeyConfigured ? 'Configured' : 'Missing'}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b border-slate-700">
                  <span className="text-slate-400">Key Mode</span>
                  <span className={`font-semibold ${status.stripeKeyMode === 'LIVE' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {status.stripeKeyMode}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b border-slate-700">
                  <span className="text-slate-400">Webhook Secret</span>
                  <div className="flex items-center gap-2">
                    <StatusIcon ok={status.webhookSecretConfigured} />
                    <span className={status.webhookSecretConfigured ? 'text-emerald-400' : 'text-red-400'}>
                      {status.webhookSecretConfigured ? 'Configured' : 'Missing'}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center py-3">
                  <span className="text-slate-400">Secret Prefix</span>
                  <code className="bg-slate-700 px-2 py-1 rounded text-sm">{status.webhookSecretPrefix}</code>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl p-6">
              <h2 className="text-slate-400 text-sm font-medium mb-3">Expected Webhook URL:</h2>
              <code className="block bg-slate-700 px-3 py-2 rounded text-sm mb-4">
                https://remodeleriq.com/api/webhooks/stripe
              </code>
              
              <h2 className="text-slate-400 text-sm font-medium mb-3">Notes:</h2>
              <ul className="list-disc list-inside text-slate-300 space-y-2 text-sm">
                <li>Ensure your Stripe Dashboard webhook points to the URL above</li>
                <li>Webhook secret should start with <code className="bg-slate-700 px-1 rounded">whsec_</code></li>
                <li>Live mode and test mode have separate webhook secrets</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
