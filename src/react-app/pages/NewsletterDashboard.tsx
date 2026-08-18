import { useEffect, useState, useCallback } from 'react';
import AdminTabs from '@/react-app/components/AdminTabs';
import { Mail, Users, Send, X, RefreshCw } from 'lucide-react';

interface Issue {
  id: number;
  issue_cycle_id: string;
  subject: string | null;
  preview_text: string | null;
  status: string;
  recipient_count: number | null;
  sent_count: number | null;
  created_at: string;
  sent_at: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  in_review: 'bg-amber-100 text-amber-800',
  approved: 'bg-blue-100 text-blue-800',
  sending: 'bg-purple-100 text-purple-800',
  sent: 'bg-emerald-100 text-emerald-800',
  killed: 'bg-slate-200 text-slate-600',
  queued: 'bg-slate-100 text-slate-600',
};

export default function NewsletterDashboard() {
  const [subs, setSubs] = useState<Record<string, number>>({});
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string>('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, i] = await Promise.all([
        fetch('/api/newsletter/admin/stats', { credentials: 'include' }).then((r) => r.json()),
        fetch('/api/newsletter/admin/issues', { credentials: 'include' }).then((r) => r.json()),
      ]);
      setSubs(s.subscribers || {});
      setIssues(i.issues || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const generate = async () => {
    setBusy('generate');
    try {
      const r = await fetch('/api/newsletter/admin/generate', { method: 'POST', credentials: 'include' }).then((r) => r.json());
      if (!r.created) alert(r.reason || 'No new issue created (one may already exist this month).');
      await load();
    } finally {
      setBusy('');
    }
  };

  const sendNow = async (id: number) => {
    if (!confirm('Send this issue to all active subscribers now?')) return;
    setBusy(`send-${id}`);
    try {
      const r = await fetch(`/api/newsletter/admin/issues/${id}/send-now`, { method: 'POST', credentials: 'include' }).then((r) => r.json());
      if (r.error) alert(r.error);
      await load();
    } finally {
      setBusy('');
    }
  };

  const kill = async (id: number) => {
    if (!confirm('Kill this issue? It will not be sent.')) return;
    setBusy(`kill-${id}`);
    try {
      await fetch(`/api/newsletter/admin/issues/${id}/kill`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'killed from dashboard' }),
      });
      await load();
    } finally {
      setBusy('');
    }
  };

  const active = subs.active || 0;
  const pending = subs.pending || 0;
  const unsub = subs.unsubscribed || 0;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-[900px] mx-auto">
        <AdminTabs />
        <div className="mb-6 flex items-center gap-3">
          <Mail className="w-8 h-8 text-emerald-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Newsletter</h1>
            <p className="text-sm text-slate-600">Monthly owned-channel email. Auto-sends 24h after draft unless killed.</p>
          </div>
        </div>

        {/* Subscriber stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard icon={<Users className="w-4 h-4" />} label="Active" value={active} tone="emerald" />
          <StatCard label="Pending confirm" value={pending} tone="amber" />
          <StatCard label="Unsubscribed" value={unsub} tone="slate" />
        </div>

        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-900">Issues</h2>
          <div className="flex gap-2">
            <button onClick={load} className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 px-3 py-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button
              onClick={generate}
              disabled={busy === 'generate'}
              className="inline-flex items-center gap-1.5 bg-slate-900 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-slate-800 disabled:opacity-60"
            >
              {busy === 'generate' ? 'Generating…' : 'Generate this month'}
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-slate-500 text-sm">Loading…</p>
        ) : issues.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            No issues yet. Click <strong>Generate this month</strong> to draft the first one.
          </div>
        ) : (
          <div className="space-y-3">
            {issues.map((it) => (
              <div key={it.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${STATUS_COLORS[it.status] || 'bg-slate-100'}`}>
                        {it.status}
                      </span>
                      <span className="text-xs text-slate-400">{it.issue_cycle_id}</span>
                    </div>
                    <p className="font-semibold text-slate-900 truncate">{it.subject || '(no subject)'}</p>
                    <p className="text-sm text-slate-500 truncate">{it.preview_text}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {it.status === 'sent'
                        ? `Sent ${it.sent_count ?? 0} · ${it.sent_at?.slice(0, 16)}`
                        : `${it.recipient_count ?? 0} recipients · drafted ${it.created_at?.slice(0, 16)}`}
                    </p>
                  </div>
                  {(it.status === 'in_review' || it.status === 'approved') && (
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={() => sendNow(it.id)}
                        disabled={busy === `send-${it.id}`}
                        className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-emerald-700 disabled:opacity-60"
                      >
                        <Send className="w-3.5 h-3.5" /> Send now
                      </button>
                      <button
                        onClick={() => kill(it.id)}
                        disabled={busy === `kill-${it.id}`}
                        className="inline-flex items-center gap-1.5 text-rose-600 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-rose-50 disabled:opacity-60"
                      >
                        <X className="w-3.5 h-3.5" /> Kill
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, tone }: { icon?: React.ReactNode; label: string; value: number; tone: string }) {
  const toneClass =
    tone === 'emerald' ? 'text-emerald-700' : tone === 'amber' ? 'text-amber-700' : 'text-slate-600';
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {icon}
        {label}
      </div>
      <div className={`text-2xl font-bold tabular-nums mt-1 ${toneClass}`}>{value}</div>
    </div>
  );
}
