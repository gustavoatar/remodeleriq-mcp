import { useEffect, useState, useCallback } from 'react';
import AdminTabs from '@/react-app/components/AdminTabs';
import { Mail, Users, Send, X, RefreshCw, Eye, Pencil, Plus, Trash2 } from 'lucide-react';

// Keep in sync with ALLOWED_LINKS in routes/newsletter.ts
const LINK_OPTIONS = [
  { url: 'https://remodeleriq.com/?view=upload', label: 'Analyze a bid (upload)' },
  { url: 'https://remodeleriq.com/labor-cost-index', label: 'Labor Cost Index' },
  { url: 'https://remodeleriq.com/remodeling-cost-guides/', label: 'Cost guides' },
  { url: 'https://remodeleriq.com/remodeling-cost-guides/permits/', label: 'Building permit fees' },
  { url: 'https://remodeleriq.com/is-my-contractor-quote-fair', label: 'Is my quote fair?' },
  { url: 'https://remodeleriq.com/trusted-radar', label: 'Trusted Radar' },
  { url: 'https://remodeleriq.com/tools', label: 'All tools' },
];

interface Section { emoji?: string; header: string; body: string; link?: { label: string; url: string } }
interface EditState { id: number; subject: string; preview_text: string; sections: Section[] }

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
  const [preview, setPreview] = useState<{ id: number; subject: string; html: string } | null>(null);
  const [edit, setEdit] = useState<EditState | null>(null);

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

  const openPreview = async (id: number, subject: string) => {
    setBusy(`preview-${id}`);
    try {
      const html = await fetch(`/api/newsletter/admin/issues/${id}/preview`, { credentials: 'include' }).then((r) => r.text());
      setPreview({ id, subject, html });
    } finally {
      setBusy('');
    }
  };

  const openEdit = async (id: number) => {
    setBusy(`edit-${id}`);
    try {
      const r = await fetch(`/api/newsletter/admin/issues/${id}`, { credentials: 'include' }).then((r) => r.json());
      let content: { subject?: string; preview_text?: string; sections?: Section[] } = {};
      try { content = r.issue?.content_json ? JSON.parse(r.issue.content_json) : {}; } catch { /* fall back to row */ }
      setEdit({
        id,
        subject: content.subject ?? r.issue?.subject ?? '',
        preview_text: content.preview_text ?? r.issue?.preview_text ?? '',
        sections: (content.sections ?? []).slice(0, 3).map((s) => ({
          emoji: s.emoji ?? '', header: s.header ?? '', body: s.body ?? '',
          link: { label: s.link?.label ?? '', url: s.link?.url ?? LINK_OPTIONS[0].url },
        })),
      });
    } finally {
      setBusy('');
    }
  };

  const saveEdit = async () => {
    if (!edit) return;
    setBusy('save');
    try {
      await fetch(`/api/newsletter/admin/issues/${edit.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: edit.subject, preview_text: edit.preview_text, sections: edit.sections }),
      });
      setEdit(null);
      await load();
    } finally {
      setBusy('');
    }
  };

  const patchSection = (i: number, patch: Partial<Section>) => {
    if (!edit) return;
    const sections = edit.sections.map((s, idx) => (idx === i ? { ...s, ...patch } : s));
    setEdit({ ...edit, sections });
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
                    <button
                      onClick={() => openPreview(it.id, it.subject || '(no subject)')}
                      className="font-semibold text-slate-900 hover:text-emerald-700 hover:underline text-left truncate block max-w-full"
                      title="Preview the full email"
                    >
                      {it.subject || '(no subject)'}
                    </button>
                    <p className="text-sm text-slate-500 truncate">{it.preview_text}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {it.status === 'sent'
                        ? `Sent ${it.sent_count ?? 0} · ${it.sent_at?.slice(0, 16)}`
                        : `${it.recipient_count ?? 0} recipients · drafted ${it.created_at?.slice(0, 16)}`}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => openPreview(it.id, it.subject || '(no subject)')}
                      disabled={busy === `preview-${it.id}`}
                      className="inline-flex items-center gap-1.5 border border-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-50 disabled:opacity-60"
                    >
                      <Eye className="w-3.5 h-3.5" /> {busy === `preview-${it.id}` ? 'Loading…' : 'Preview'}
                    </button>
                    {(it.status === 'in_review' || it.status === 'approved') && (
                      <>
                        <button
                          onClick={() => openEdit(it.id)}
                          disabled={busy === `edit-${it.id}`}
                          className="inline-flex items-center gap-1.5 border border-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-50 disabled:opacity-60"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
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
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview modal — the real rendered email in an iframe */}
      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Email preview</p>
                <p className="font-semibold text-slate-900 truncate">{preview.subject}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {(() => {
                  const it = issues.find((i) => i.id === preview.id);
                  if (it && (it.status === 'in_review' || it.status === 'approved')) {
                    return (
                      <button
                        onClick={() => { setPreview(null); sendNow(preview.id); }}
                        className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-emerald-700"
                      >
                        <Send className="w-4 h-4" /> Send now
                      </button>
                    );
                  }
                  return null;
                })()}
                <button onClick={() => setPreview(null)} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100" aria-label="Close">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <iframe
              title="Newsletter preview"
              srcDoc={preview.html}
              className="w-full flex-1 min-h-[60vh] bg-slate-50"
              sandbox=""
            />
          </div>
        </div>
      )}

      {/* Edit modal — structured content, re-renders + saves on save */}
      {edit && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setEdit(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 flex-shrink-0">
              <p className="font-semibold text-slate-900">Edit newsletter</p>
              <button onClick={() => setEdit(null)} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100" aria-label="Close"><X className="w-5 h-5" /></button>
            </div>
            <div className="overflow-y-auto px-5 py-4 space-y-4">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Subject</span>
                <input value={edit.subject} onChange={(e) => setEdit({ ...edit, subject: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preview text</span>
                <input value={edit.preview_text} onChange={(e) => setEdit({ ...edit, preview_text: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </label>

              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 pt-2">Sections (max 3 · each needs a link)</p>
              {edit.sections.map((s, i) => (
                <div key={i} className="rounded-xl border border-slate-200 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input value={s.emoji || ''} onChange={(e) => patchSection(i, { emoji: e.target.value })} placeholder="📊" className="w-14 text-center rounded-lg border border-slate-200 px-2 py-2 text-sm" maxLength={4} />
                    <input value={s.header} onChange={(e) => patchSection(i, { header: e.target.value })} placeholder="Section header" className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold" />
                    <button onClick={() => setEdit({ ...edit, sections: edit.sections.filter((_, idx) => idx !== i) })} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg" aria-label="Remove section"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <textarea value={s.body} onChange={(e) => patchSection(i, { body: e.target.value })} rows={3} placeholder="Body — one paragraph" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input value={s.link?.label || ''} onChange={(e) => patchSection(i, { link: { label: e.target.value, url: s.link?.url || LINK_OPTIONS[0].url } })} placeholder="Link text (e.g. See the labor index)" className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                    <select value={s.link?.url || LINK_OPTIONS[0].url} onChange={(e) => patchSection(i, { link: { label: s.link?.label || '', url: e.target.value } })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white">
                      {LINK_OPTIONS.map((o) => <option key={o.url} value={o.url}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
              ))}
              {edit.sections.length < 3 && (
                <button onClick={() => setEdit({ ...edit, sections: [...edit.sections, { emoji: '', header: '', body: '', link: { label: '', url: LINK_OPTIONS[0].url } }] })} className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:underline">
                  <Plus className="w-4 h-4" /> Add section
                </button>
              )}
              <p className="text-xs text-slate-400 pt-1">The email always ends with two buttons: <strong>Analyze a bid free</strong> and <strong>View all our tools</strong> — added automatically.</p>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-200 flex-shrink-0">
              <button onClick={() => setEdit(null)} className="text-sm font-semibold text-slate-500 px-4 py-2 rounded-lg hover:bg-slate-100">Cancel</button>
              <button onClick={saveEdit} disabled={busy === 'save'} className="inline-flex items-center gap-1.5 bg-slate-900 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-slate-800 disabled:opacity-60">
                {busy === 'save' ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}
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
