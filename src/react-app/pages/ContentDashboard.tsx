import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Layout, Clipboard, Check, X, Edit3, ExternalLink,
  MessageSquare, Home, Loader2, AlertCircle, Send, Hash, RefreshCw, Sparkles
} from "lucide-react";

type Status = "queued" | "drafted" | "in_review" | "approved" | "killed" | "published";

interface Draft {
  id: number;
  cycle_id: string;
  platform: "reddit" | "nextdoor";
  source_url: string;
  source_excerpt: string;
  source_author: string | null;
  source_subreddit_or_hood: string | null;
  pillar_tags: string | null;
  draft_reddit: string | null;
  draft_nextdoor: string | null;
  blog_brief: string | null;
  feature_ticket: string | null;
  status: Status;
  gustavo_notes: string | null;
  killed_reason: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  published_at: string | null;
  published_url: string | null;
}

const COLUMNS: { status: Status; label: string; color: string }[] = [
  { status: "queued",     label: "Queued",     color: "bg-slate-100 text-slate-700" },
  { status: "drafted",    label: "Drafted",    color: "bg-amber-100 text-amber-800" },
  { status: "in_review",  label: "In Review",  color: "bg-blue-100 text-blue-800" },
  { status: "approved",   label: "Approved",   color: "bg-emerald-100 text-emerald-800" },
  { status: "published",  label: "Published",  color: "bg-purple-100 text-purple-800" },
];

const PILLAR_COLORS: Record<string, string> = {
  contract_risk: "bg-red-100 text-red-700",
  price_check:   "bg-blue-100 text-blue-700",
  scope:         "bg-orange-100 text-orange-700",
};

function formatTimeAgo(d: Date): string {
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 5) return "just now";
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return d.toLocaleDateString();
}

export default function ContentDashboard() {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDraft, setOpenDraft] = useState<Draft | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [requestingCycle, setRequestingCycle] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [lastCycleRequest, setLastCycleRequest] = useState<string | null>(null);
  const [cycleToast, setCycleToast] = useState<string | null>(null);

  const fetchDrafts = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const res = await fetch("/api/admin/content");
      if (res.status === 401 || res.status === 403) {
        setError("Access denied. Admin privileges required.");
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch drafts");
      const data = await res.json();
      setDrafts(data.drafts || []);
      setLoading(false);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error(err);
      setError("Failed to load drafts");
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const fetchLastCycleRequest = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/content/cycle-requests/recent");
      if (!res.ok) return;
      const data = await res.json();
      if (data.requests && data.requests.length > 0) {
        setLastCycleRequest(data.requests[0].requested_at);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const requestNewCycle = useCallback(async () => {
    setRequestingCycle(true);
    try {
      const res = await fetch("/api/admin/content/request-cycle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Failed to request cycle");
      setCycleToast("New cycle requested — fresh drafts will land within ~2 hrs");
      setTimeout(() => setCycleToast(null), 4500);
      await fetchLastCycleRequest();
    } catch (err) {
      console.error(err);
      setCycleToast("Couldn't request cycle. Try again?");
      setTimeout(() => setCycleToast(null), 3000);
    } finally {
      setRequestingCycle(false);
    }
  }, [fetchLastCycleRequest]);

  useEffect(() => {
    fetchDrafts();
    fetchLastCycleRequest();
  }, [fetchDrafts, fetchLastCycleRequest]);

  // Auto-refresh every 60 seconds so new drafts appear without manual reload
  useEffect(() => {
    const interval = setInterval(() => fetchDrafts(false), 60000);
    return () => clearInterval(interval);
  }, [fetchDrafts]);

  const transition = async (id: number, to_status: Status, note?: string) => {
    await fetch(`/api/admin/content/${id}/transition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to_status, note }),
    });
    setOpenDraft(null);
    await fetchDrafts();
  };

  const saveEdit = async (id: number, fields: Partial<Draft>) => {
    await fetch(`/api/admin/content/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    await fetchDrafts();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">{error}</h1>
          <button onClick={() => navigate("/")} className="text-emerald-600 font-medium hover:underline">
            Back home
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  const byStatus = (s: Status) => drafts.filter((d) => d.status === s);
  const counts = COLUMNS.reduce<Record<Status, number>>((acc, c) => {
    acc[c.status] = byStatus(c.status).length;
    return acc;
  }, {} as Record<Status, number>);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      {/* Header */}
      <div className="max-w-[1600px] mx-auto mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Layout className="w-8 h-8 text-emerald-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Content Engine</h1>
            <p className="text-sm text-slate-600">
              {drafts.length} drafts · {counts.in_review} awaiting review · {counts.approved} approved
              {lastRefreshed && (
                <span className="text-xs text-slate-400 ml-2">
                  · Updated {formatTimeAgo(lastRefreshed)}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchDrafts(true)}
            disabled={refreshing}
            className="text-sm font-medium px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-2 disabled:opacity-50"
            title="Refresh the list"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={requestNewCycle}
            disabled={requestingCycle}
            className="text-sm font-semibold px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 disabled:opacity-50 shadow-sm"
            title="Signal the swarm to generate new drafts"
          >
            {requestingCycle ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {requestingCycle ? "Requesting…" : "Request new drafts"}
          </button>
          <button
            onClick={() => navigate("/admin")}
            className="text-sm font-medium text-slate-600 hover:text-slate-900 ml-2"
          >
            ← Admin
          </button>
        </div>
      </div>

      {/* Last cycle request indicator */}
      {lastCycleRequest && (
        <div className="max-w-[1600px] mx-auto mb-3 text-xs text-slate-500 px-1">
          Last cycle requested: {new Date(lastCycleRequest).toLocaleString()}
        </div>
      )}

      {/* Toast for cycle request feedback */}
      {cycleToast && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 max-w-sm">
          <Sparkles className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium">{cycleToast}</span>
        </div>
      )}

      {/* Kanban */}
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-5 gap-4">
        {COLUMNS.map((col) => (
          <div key={col.status} className="bg-white rounded-2xl border border-slate-200 p-3 min-h-[200px]">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className={`text-xs font-bold uppercase tracking-wide px-2 py-1 rounded-md ${col.color}`}>
                {col.label}
              </span>
              <span className="text-xs font-semibold text-slate-500">{counts[col.status]}</span>
            </div>
            <div className="space-y-2">
              {byStatus(col.status).map((d) => (
                <DraftCard key={d.id} draft={d} onClick={() => setOpenDraft(d)} />
              ))}
              {byStatus(col.status).length === 0 && (
                <div className="text-xs text-slate-400 text-center py-6">No drafts</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {openDraft && (
        <DraftModal
          draft={openDraft}
          onClose={() => setOpenDraft(null)}
          onTransition={transition}
          onSave={saveEdit}
        />
      )}
    </div>
  );
}

function DraftCard({ draft, onClick }: { draft: Draft; onClick: () => void }) {
  const PlatformIcon = draft.platform === "reddit" ? MessageSquare : Home;
  const tags = (draft.pillar_tags || "").split(",").map((t) => t.trim()).filter(Boolean);
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-slate-50 hover:bg-slate-100 rounded-lg p-3 border border-slate-200 transition-colors"
    >
      <div className="flex items-center gap-2 mb-2">
        <PlatformIcon className="w-3.5 h-3.5 text-slate-500" />
        <span className="text-xs font-semibold text-slate-600">
          {draft.source_subreddit_or_hood || draft.platform}
        </span>
        {draft.source_author && (
          <span className="text-xs text-slate-500">· {draft.source_author}</span>
        )}
      </div>
      <p className="text-sm text-slate-800 line-clamp-3 leading-snug">
        {draft.source_excerpt}
      </p>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {tags.map((t) => (
            <span key={t} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${PILLAR_COLORS[t] || "bg-slate-200 text-slate-700"}`}>
              {t.replace("_", " ")}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

function DraftModal({
  draft,
  onClose,
  onTransition,
  onSave,
}: {
  draft: Draft;
  onClose: () => void;
  onTransition: (id: number, to_status: Status, note?: string) => void;
  onSave: (id: number, fields: Partial<Draft>) => void;
}) {
  const [editReddit, setEditReddit] = useState(draft.draft_reddit || "");
  const [editNextdoor, setEditNextdoor] = useState(draft.draft_nextdoor || "");
  const [notes, setNotes] = useState("");
  const [publishedUrl, setPublishedUrl] = useState(draft.published_url || "");
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const hasChanges = editReddit !== (draft.draft_reddit || "") || editNextdoor !== (draft.draft_nextdoor || "");

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-5 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            {draft.platform === "reddit" ? <MessageSquare className="w-5 h-5 text-orange-600" /> : <Home className="w-5 h-5 text-emerald-600" />}
            <div>
              <div className="font-bold text-slate-900">
                {draft.source_subreddit_or_hood || draft.platform}
                {draft.source_author && <span className="text-slate-500 font-normal"> · {draft.source_author}</span>}
              </div>
              <a href={draft.source_url} target="_blank" rel="noreferrer" className="text-xs text-emerald-600 hover:underline flex items-center gap-1">
                Open source post <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Source */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Source post</div>
            <p className="text-sm text-slate-800 whitespace-pre-wrap">{draft.source_excerpt}</p>
          </div>

          {/* Reddit draft */}
          {(draft.draft_reddit || draft.status === "queued") && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Reddit reply
                </label>
                <button
                  onClick={() => copy(editReddit, "reddit")}
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-emerald-50"
                >
                  {copied === "reddit" ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Clipboard className="w-3.5 h-3.5" /> Copy</>}
                </button>
              </div>
              <textarea
                value={editReddit}
                onChange={(e) => setEditReddit(e.target.value)}
                rows={8}
                className="w-full text-sm border border-slate-300 rounded-lg p-3 font-mono text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              <div className="text-xs text-slate-500 mt-1">{editReddit.length} chars · {editReddit.trim().split(/\s+/).filter(Boolean).length} words</div>
            </div>
          )}

          {/* Nextdoor draft */}
          {draft.draft_nextdoor && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Home className="w-4 h-4" /> Nextdoor adaptation
                </label>
                <button
                  onClick={() => copy(editNextdoor, "nextdoor")}
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-emerald-50"
                >
                  {copied === "nextdoor" ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Clipboard className="w-3.5 h-3.5" /> Copy</>}
                </button>
              </div>
              <textarea
                value={editNextdoor}
                onChange={(e) => setEditNextdoor(e.target.value)}
                rows={6}
                className="w-full text-sm border border-slate-300 rounded-lg p-3 font-mono text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              <div className="text-xs text-slate-500 mt-1">{editNextdoor.length} chars · {editNextdoor.trim().split(/\s+/).filter(Boolean).length} words</div>
            </div>
          )}

          {/* Blog brief + feature ticket */}
          {draft.blog_brief && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="text-xs font-bold text-amber-900 uppercase mb-1">Blog brief</div>
              <p className="text-sm text-amber-900 whitespace-pre-wrap">{draft.blog_brief}</p>
            </div>
          )}
          {draft.feature_ticket && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <div className="text-xs font-bold text-purple-900 uppercase mb-1 flex items-center gap-1">
                <Hash className="w-3 h-3" /> Feature ticket
              </div>
              <p className="text-sm text-purple-900 whitespace-pre-wrap">{draft.feature_ticket}</p>
            </div>
          )}

          {/* Save edits */}
          {hasChanges && (
            <button
              onClick={() => onSave(draft.id, { draft_reddit: editReddit, draft_nextdoor: editNextdoor })}
              className="text-sm font-medium px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" /> Save edits (stays in current column)
            </button>
          )}

          {/* Notes for next status */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Notes (optional)</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. love the opener but cut the founder line"
              className="w-full text-sm border border-slate-300 rounded-lg p-2"
            />
          </div>

          {/* Action buttons by status */}
          <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
            {draft.status !== "approved" && draft.status !== "published" && (
              <button
                onClick={() => onTransition(draft.id, "approved", notes || undefined)}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center gap-2"
              >
                <Check className="w-4 h-4" /> Approve
              </button>
            )}
            {draft.status !== "drafted" && draft.status !== "approved" && draft.status !== "published" && (
              <button
                onClick={() => onTransition(draft.id, "drafted", notes || undefined)}
                className="px-4 py-2 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold text-sm flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" /> Back to drafted (re-run copywriter)
              </button>
            )}
            {draft.status === "approved" && (
              <>
                <input
                  value={publishedUrl}
                  onChange={(e) => setPublishedUrl(e.target.value)}
                  placeholder="Posted URL (optional)"
                  className="flex-1 text-sm border border-slate-300 rounded-lg p-2"
                />
                <button
                  onClick={async () => {
                    if (publishedUrl) await onSave(draft.id, { published_url: publishedUrl });
                    onTransition(draft.id, "published");
                  }}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm flex items-center gap-2"
                >
                  <Send className="w-4 h-4" /> Mark published
                </button>
              </>
            )}
            {draft.status !== "killed" && draft.status !== "published" && (
              <button
                onClick={() => {
                  const reason = prompt("Why are you killing this? (helps the learning loop)") || "no reason given";
                  onTransition(draft.id, "killed", reason);
                }}
                className="ml-auto px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-sm flex items-center gap-2"
              >
                <X className="w-4 h-4" /> Kill
              </button>
            )}
          </div>

          {/* Meta */}
          <div className="text-xs text-slate-500 pt-2 border-t border-slate-100">
            Cycle {draft.cycle_id} · Created {new Date(draft.created_at).toLocaleString()}
            {draft.approved_at && <> · Approved {new Date(draft.approved_at).toLocaleString()}</>}
            {draft.published_at && <> · Published {new Date(draft.published_at).toLocaleString()}</>}
            {draft.killed_reason && <> · Killed: "{draft.killed_reason}"</>}
          </div>
        </div>
      </div>
    </div>
  );
}
