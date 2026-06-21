// Phase 7A — Unified Inbox
// Single place to triage everything: pending drafts, inbound emails,
// platform replies, engagement events. Approve all / kill all / per-item.
//
// Mobile-first — designed for morning-coffee phone triage.

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import AdminTabs from "@/react-app/components/AdminTabs";
import {
  Inbox as InboxIcon, Mail, MessageSquare, Home as HomeIcon,
  AlertCircle, Loader2, Check, X, Archive, ExternalLink,
  Send, Clock, RefreshCw, Sparkles, Layout, ThumbsUp
} from "lucide-react";

type Tab = "drafts" | "inbound" | "engagement" | "killed";

interface DigestStatus {
  pendingDrafts: number;
  lastOverride: { digest_cycle_id: string; action: string; received_at: string } | null;
  publishCronUtc: string;
}

interface Draft {
  id: number;
  cycle_id: string;
  platform: string;
  source_url: string;
  source_excerpt: string;
  source_author: string | null;
  source_subreddit_or_hood: string | null;
  pillar_tags: string | null;
  draft_reddit: string | null;
  draft_nextdoor: string | null;
  blog_brief: string | null;
  feature_ticket: string | null;
  status: string;
  persona: "bella" | "gustavo" | null;
  gustavo_notes: string | null;
  created_at: string;
}

interface InboxItem {
  id: number;
  source: string;
  external_id: string | null;
  from_handle: string | null;
  subject: string | null;
  body: string;
  related_draft_id: number | null;
  tag: string | null;
  status: string;
  proposed_reply: string | null;
  proposed_persona: "bella" | "gustavo" | null;
  received_at: string;
}

interface KilledDraft {
  id: number;
  cycle_id: string;
  platform: string;
  source_excerpt: string;
  source_author: string | null;
  source_subreddit_or_hood: string | null;
  killed_reason: string | null;
  persona: "bella" | "gustavo" | null;
  updated_at: string;
}

interface InboxData {
  drafts: Draft[];
  inbox: InboxItem[];
  killed: KilledDraft[];
  counts: { drafts: number; inbound: number; engagement: number; killed: number };
}

const TABS: { id: Tab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: "drafts", label: "Drafts", icon: Layout },
  { id: "inbound", label: "Inbound", icon: Mail },
  { id: "engagement", label: "Engagement", icon: ThumbsUp },
  { id: "killed", label: "Killed", icon: X },
];

const PERSONA_BADGE = {
  bella: "bg-pink-100 text-pink-800 border-pink-200",
  gustavo: "bg-blue-100 text-blue-800 border-blue-200",
};

export default function Inbox() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("drafts");
  const [data, setData] = useState<InboxData | null>(null);
  const [digest, setDigest] = useState<DigestStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fetchData = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const [inboxRes, digestRes] = await Promise.all([
        fetch("/api/admin/inbox"),
        fetch("/api/admin/inbox/digest-status"),
      ]);
      if (inboxRes.status === 401 || inboxRes.status === 403) {
        setError("Access denied. Admin privileges required.");
        setLoading(false);
        return;
      }
      const inboxData = await inboxRes.json();
      const digestData = digestRes.ok ? await digestRes.json() : null;
      setData(inboxData);
      setDigest(digestData);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Failed to load inbox");
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(false), 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const showToast = (msg: string, ms = 3000) => {
    setToast(msg);
    setTimeout(() => setToast(null), ms);
  };

  const approveAll = async () => {
    if (!window.confirm(`Approve all ${data?.counts.drafts || 0} drafts for publishing?`)) return;
    const res = await fetch("/api/admin/inbox/bulk/approve-all", { method: "POST" });
    const json = await res.json();
    showToast(`✓ ${json.approved} drafts approved`);
    await fetchData();
  };

  const killAll = async () => {
    const reason = window.prompt("Why are you killing all drafts? (becomes a voice guardrail)");
    if (!reason) return;
    const res = await fetch("/api/admin/inbox/bulk/kill-all", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    const json = await res.json();
    showToast(`✗ ${json.killed} drafts killed; guardrail added`);
    await fetchData();
  };

  const archiveItem = async (id: number) => {
    await fetch(`/api/admin/inbox/inbox-item/${id}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "archive" }),
    });
    showToast("Archived");
    await fetchData();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">{error}</h1>
          <button onClick={() => navigate("/")} className="text-emerald-600 font-medium hover:underline">Back home</button>
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-[1400px] mx-auto">
        <AdminTabs />
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3">
            <InboxIcon className="w-8 h-8 text-emerald-600" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Inbox</h1>
              <p className="text-sm text-slate-600">
                {digest && digest.pendingDrafts > 0 && (
                  <>
                    {digest.pendingDrafts} draft{digest.pendingDrafts === 1 ? "" : "s"} ships at 8:30 ET unless STOP{" "}
                    {digest.lastOverride && (
                      <span className="text-amber-600">
                        · override held {digest.lastOverride.action}
                      </span>
                    )}
                  </>
                )}
                {digest && digest.pendingDrafts === 0 && "All caught up"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="text-sm font-medium px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            {data.counts.drafts > 0 && (
              <>
                <button
                  onClick={approveAll}
                  className="text-sm font-semibold px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 shadow-sm"
                >
                  <Check className="w-4 h-4" /> Approve all ({data.counts.drafts})
                </button>
                <button
                  onClick={killAll}
                  className="text-sm font-semibold px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 flex items-center gap-2"
                >
                  <X className="w-4 h-4" /> Kill all
                </button>
              </>
            )}
            <button onClick={() => navigate("/admin/reddit")} className="text-sm font-medium text-slate-600 hover:text-slate-900 ml-2">
              Reddit
            </button>
            <button onClick={() => navigate("/admin/content")} className="text-sm font-medium text-slate-600 hover:text-slate-900 ml-2">
              Drafts page →
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-200 mb-6 overflow-x-auto">
          {TABS.map((t) => {
            const count = data.counts[t.id];
            const active = tab === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm border-b-2 transition-colors whitespace-nowrap ${
                  active
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
                {count > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="space-y-3">
          {tab === "drafts" && (
            <>
              {data.drafts.length === 0 && (
                <EmptyState text="No drafts pending. Cycle runs at 7am ET and 8:30am ET auto-publish." />
              )}
              {data.drafts.map((d) => (
                <DraftCard key={d.id} draft={d} onOpen={() => navigate("/admin/content")} />
              ))}
            </>
          )}

          {tab === "inbound" && (
            <>
              {data.inbox.filter((i) => ["lead", "question"].includes(i.tag || "")).length === 0 && (
                <EmptyState text="No leads or questions in the inbox." />
              )}
              {data.inbox
                .filter((i) => ["lead", "question"].includes(i.tag || ""))
                .map((item) => (
                  <InboxItemCard key={item.id} item={item} onArchive={() => archiveItem(item.id)} />
                ))}
            </>
          )}

          {tab === "engagement" && (
            <>
              {data.inbox.filter((i) => i.tag === "engagement").length === 0 && (
                <EmptyState text="No new engagement on published drafts." />
              )}
              {data.inbox
                .filter((i) => i.tag === "engagement")
                .map((item) => (
                  <InboxItemCard key={item.id} item={item} onArchive={() => archiveItem(item.id)} />
                ))}
            </>
          )}

          {tab === "killed" && (
            <>
              {data.killed.length === 0 && <EmptyState text="No drafts killed in the last 30 days." />}
              {data.killed.map((k) => (
                <KilledCard key={k.id} draft={k} />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 max-w-sm">
          <Sparkles className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}

function PersonaBadge({ persona }: { persona: "bella" | "gustavo" | null }) {
  if (!persona) return null;
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${PERSONA_BADGE[persona]}`}>
      {persona}
    </span>
  );
}

function DraftCard({ draft, onOpen }: { draft: Draft; onOpen: () => void }) {
  const tags = (draft.pillar_tags || "").split(",").map((t) => t.trim()).filter(Boolean);
  const platformIcon = draft.platform === "reddit" ? <MessageSquare className="w-4 h-4 text-orange-600" /> : <HomeIcon className="w-4 h-4 text-emerald-600" />;
  return (
    <button
      onClick={onOpen}
      className="w-full text-left bg-white hover:bg-slate-50 rounded-lg p-4 border border-slate-200 transition-colors"
    >
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {platformIcon}
        <span className="text-xs font-semibold text-slate-600">
          {draft.source_subreddit_or_hood || draft.platform}
        </span>
        {draft.source_author && <span className="text-xs text-slate-500">· {draft.source_author}</span>}
        <PersonaBadge persona={draft.persona} />
        {tags.map((t) => (
          <span key={t} className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
            {t.replace("_", " ")}
          </span>
        ))}
      </div>
      <p className="text-sm text-slate-800 line-clamp-2 mb-2">{draft.source_excerpt}</p>
      {draft.draft_reddit && (
        <p className="text-xs text-slate-600 italic line-clamp-2 bg-slate-50 p-2 rounded">
          → {draft.draft_reddit.slice(0, 200)}…
        </p>
      )}
    </button>
  );
}

function InboxItemCard({ item, onArchive }: { item: InboxItem; onArchive: () => void }) {
  const sourceIcon =
    item.source.startsWith("email") ? <Mail className="w-4 h-4 text-blue-600" /> :
    item.source.startsWith("reddit") ? <MessageSquare className="w-4 h-4 text-orange-600" /> :
    item.source.startsWith("nextdoor") ? <HomeIcon className="w-4 h-4 text-emerald-600" /> :
    <InboxIcon className="w-4 h-4 text-slate-600" />;

  return (
    <div className="bg-white rounded-lg p-4 border border-slate-200">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {sourceIcon}
        <span className="text-xs font-semibold text-slate-600">{item.source.replace("_", " ")}</span>
        {item.from_handle && <span className="text-xs text-slate-500">· {item.from_handle}</span>}
        {item.tag && (
          <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
            item.tag === "lead" ? "bg-emerald-100 text-emerald-800" :
            item.tag === "question" ? "bg-blue-100 text-blue-800" :
            item.tag === "engagement" ? "bg-purple-100 text-purple-800" :
            "bg-slate-100 text-slate-700"
          }`}>
            {item.tag}
          </span>
        )}
        <span className="text-xs text-slate-400 ml-auto flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(item.received_at).toLocaleString()}
        </span>
      </div>
      {item.subject && <p className="text-sm font-semibold text-slate-900 mb-1">{item.subject}</p>}
      <p className="text-sm text-slate-700 mb-2 whitespace-pre-wrap">{item.body.slice(0, 400)}{item.body.length > 400 ? "…" : ""}</p>
      {item.proposed_reply && (
        <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded p-3">
          <div className="text-xs font-bold text-emerald-900 uppercase mb-1 flex items-center gap-2">
            <Send className="w-3 h-3" /> Proposed reply
            <PersonaBadge persona={item.proposed_persona} />
          </div>
          <p className="text-sm text-emerald-900 whitespace-pre-wrap">{item.proposed_reply}</p>
        </div>
      )}
      <div className="flex gap-2 mt-3">
        {item.external_id && (
          <a
            href={item.external_id.startsWith("http") ? item.external_id : "#"}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-emerald-50"
          >
            <ExternalLink className="w-3 h-3" /> Open source
          </a>
        )}
        <button
          onClick={onArchive}
          className="ml-auto text-xs font-medium text-slate-600 hover:text-slate-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100"
        >
          <Archive className="w-3 h-3" /> Archive
        </button>
      </div>
    </div>
  );
}

function KilledCard({ draft }: { draft: KilledDraft }) {
  return (
    <div className="bg-white rounded-lg p-4 border border-slate-200 opacity-75">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <X className="w-4 h-4 text-red-500" />
        <span className="text-xs font-semibold text-slate-600">{draft.source_subreddit_or_hood || draft.platform}</span>
        {draft.source_author && <span className="text-xs text-slate-500">· {draft.source_author}</span>}
        <PersonaBadge persona={draft.persona} />
        <span className="text-xs text-slate-400 ml-auto">{new Date(draft.updated_at).toLocaleDateString()}</span>
      </div>
      <p className="text-sm text-slate-700 line-clamp-2 mb-2">{draft.source_excerpt}</p>
      {draft.killed_reason && (
        <p className="text-xs text-red-700 italic bg-red-50 p-2 rounded border border-red-100">
          Killed: {draft.killed_reason}
        </p>
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="bg-white rounded-lg p-12 text-center border border-slate-200">
      <Check className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
      <p className="text-sm text-slate-600">{text}</p>
    </div>
  );
}
