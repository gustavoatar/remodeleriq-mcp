// Nextdoor Posts
// Manual queue of standalone image+text posts for the business page.
// Copy the post → open Nextdoor → paste → mark posted. Mobile-first.

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Home, AlertCircle, Loader2, Check, X, RefreshCw,
  Copy, RotateCcw, Info, ExternalLink,
} from "lucide-react";
import AdminTabs from "@/react-app/components/AdminTabs";

type StatusFilter = "all" | "pending" | "posted";

interface NextdoorDraft {
  id: number;
  post_type: string | null;
  text: string;
  image_url: string | null;
  status: "pending" | "posted" | "skipped";
  created_at: string;
  posted_at: string | null;
}

export default function NextdoorKit() {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<NextdoorDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>("all");

  const fetchData = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const res = await fetch("/api/admin/nextdoor");
      if (res.status === 401 || res.status === 403) {
        navigate("/");
        return;
      }
      const data = await res.json();
      setDrafts(data.drafts || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Failed to load nextdoor drafts");
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const setStatus = async (id: number, status: NextdoorDraft["status"]) => {
    // Optimistic update
    setDrafts((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, status, posted_at: status === "posted" ? new Date().toISOString() : null }
          : d
      )
    );
    await fetch(`/api/admin/nextdoor/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  };

  const counts = {
    pending: drafts.filter((d) => d.status === "pending").length,
    posted: drafts.filter((d) => d.status === "posted").length,
    skipped: drafts.filter((d) => d.status === "skipped").length,
  };

  const visible = drafts.filter((d) =>
    filter === "all" ? true : filter === "pending" ? d.status === "pending" : d.status === "posted"
  );

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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-[900px] mx-auto">
        <AdminTabs />
        {/* Header */}
        <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3">
            <Home className="w-8 h-8" style={{ color: "#00a949" }} />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Nextdoor</h1>
              <p className="text-sm text-slate-600">
                Neighborhood posts for your Roswell / Atlanta page.{" "}
                <span className="text-slate-500">
                  {counts.pending} pending · {counts.posted} posted · {counts.skipped} skipped
                </span>
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
          </div>
        </div>

        {/* Info banner */}
        <div className="mb-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>Nextdoor has no posting API — copy the post, tap "Open Nextdoor", and paste it on your page. ~2–3 posts/week is a good cadence.</p>
        </div>

        {/* Filter */}
        <div className="flex gap-1 border-b border-slate-200 mb-4 overflow-x-auto">
          {(["all", "pending", "posted"] as StatusFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 font-semibold text-sm border-b-2 transition-colors whitespace-nowrap capitalize ${
                filter === f
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Cards */}
        <div className="space-y-3">
          {visible.length === 0 && (
            <div className="bg-white rounded-lg p-12 text-center border border-slate-200">
              <Check className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <p className="text-sm text-slate-600">Nothing here.</p>
            </div>
          )}
          {visible.map((d) => (
            <DraftCard key={d.id} draft={d} onStatus={setStatus} />
          ))}
        </div>
      </div>
    </div>
  );
}

function DraftCard({
  draft,
  onStatus,
}: {
  draft: NextdoorDraft;
  onStatus: (id: number, status: NextdoorDraft["status"]) => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(draft.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const tint =
    draft.status === "posted"
      ? "bg-emerald-50 border-emerald-200"
      : draft.status === "skipped"
      ? "bg-slate-100 border-slate-200 opacity-70"
      : "bg-white border-slate-200";

  return (
    <div className={`rounded-lg p-4 border ${tint}`}>
      <div className="flex items-start gap-2 mb-2">
        {draft.status === "posted" && <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-1" />}
        <div className="min-w-0 flex-1">
          {draft.post_type && (
            <span className="text-xs text-slate-500">{draft.post_type}</span>
          )}
        </div>
      </div>

      {/* Post image */}
      {draft.image_url && (
        <img src={draft.image_url} className="w-full rounded-lg mb-3 max-h-72 object-cover" alt="" />
      )}

      {/* Post text */}
      <textarea
        readOnly
        value={draft.text}
        className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-3 resize-y min-h-[140px] focus:outline-none"
      />

      {/* Copy + open Nextdoor */}
      <div className="flex flex-wrap gap-2 mt-3">
        <button
          onClick={copy}
          className="text-sm font-medium px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-2 min-h-[40px]"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          {copied ? "✓ Copied" : "Copy"}
        </button>
        <a
          href="https://nextdoor.com/pages/remodeleriq/"
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-lg text-white hover:opacity-90 min-h-[40px]"
          style={{ backgroundColor: "#00a949" }}
        >
          <ExternalLink className="w-4 h-4" />
          Open Nextdoor to post →
        </a>
      </div>

      {/* Status controls */}
      <div className="flex flex-wrap gap-2 mt-3">
        {draft.status !== "posted" && (
          <button
            onClick={() => onStatus(draft.id, "posted")}
            className="text-sm font-semibold px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 min-h-[40px]"
          >
            <Check className="w-4 h-4" /> Mark posted
          </button>
        )}
        {draft.status !== "skipped" && (
          <button
            onClick={() => onStatus(draft.id, "skipped")}
            className="text-sm font-semibold px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-2 min-h-[40px]"
          >
            <X className="w-4 h-4" /> Skip
          </button>
        )}
        {draft.status !== "pending" && (
          <button
            onClick={() => onStatus(draft.id, "pending")}
            className="text-sm font-medium px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 flex items-center gap-2 min-h-[40px]"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        )}
      </div>
    </div>
  );
}
