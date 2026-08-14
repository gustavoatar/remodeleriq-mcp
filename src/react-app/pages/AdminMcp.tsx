import { useState, useEffect } from "react";

// ---- Types -----------------------------------------------------------------
interface UsageData {
  total_calls: number;
  by_tool: Array<{ tool_name: string; n: number }>;
  calls_by_day: Array<{ day: string; n: number }>;
  client_breakdown: Array<{ client: string; origin_class: string; n: number }>;
  latency: { p50_approx: number | null; p_max: number | null } | null;
  error_count_7d: number;
}

interface CorpusData {
  total_submissions: number;
  submissions_per_week: Array<{ week: string; n: number }>;
  fill_by_cell: Array<{ state_code: string; project_type: string; n: number }>;
  avg_extraction_coverage: number | null;
  top_flags: Array<{ flag_id: string; severity: string; title: string; n: number }>;
}

interface AbuseData {
  sessions_48h: Array<{
    session_id: string; client_name: string; origin_class: string;
    total_calls: number; cost_calls: number; bid_calls: number;
    first_call: string; last_call: string; scraper_ratio: number | null;
  }>;
  high_volume_sessions: Array<{ session_id: string; client_name: string; total_calls: number }>;
}

interface AttributionData {
  totals: { pre_stored: number; clicked: number; converted: number } | null;
  by_tool: Array<{ tool_name: string; pre_stored: number; clicked: number; converted: number }>;
  recent_clicks: Array<{ call_id: string; tool_name: string; landed_at: string; conversion_type: string | null; created_at: string }>;
}

// ---- Small components ------------------------------------------------------
function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: "bg-red-100 text-red-700",
    high: "bg-orange-100 text-orange-700",
    medium: "bg-yellow-100 text-yellow-700",
    low: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors[severity] ?? colors.low}`}>
      {severity}
    </span>
  );
}

function pct(a: number, b: number) {
  if (!b) return "—";
  return `${((a / b) * 100).toFixed(1)}%`;
}

// ---- Tab: Usage ------------------------------------------------------------
function UsageTab({ data }: { data: UsageData }) {
  const maxDay = Math.max(...data.calls_by_day.map((d) => d.n), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Total calls" value={data.total_calls.toLocaleString()} />
        <Stat label="Errors (7d)" value={data.error_count_7d} />
        <Stat label="Avg latency" value={data.latency?.p50_approx != null ? `${data.latency.p50_approx}ms` : "—"} />
        <Stat label="Max latency" value={data.latency?.p_max != null ? `${data.latency.p_max}ms` : "—"} />
      </div>

      {/* Calls by day sparkline */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Calls per day (last 30 days)</h3>
        <div className="flex items-end gap-1 h-20">
          {[...data.calls_by_day].reverse().map((d) => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-0.5">
              <div
                className="w-full bg-blue-500 rounded-sm min-h-0.5"
                style={{ height: `${Math.max(2, (d.n / maxDay) * 72)}px` }}
                title={`${d.day}: ${d.n}`}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* By tool */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">By tool</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b">
                <th className="text-left pb-1">Tool</th>
                <th className="text-right pb-1">Calls</th>
              </tr>
            </thead>
            <tbody>
              {data.by_tool.map((t) => (
                <tr key={t.tool_name} className="border-b border-gray-50">
                  <td className="py-1.5 font-mono text-xs text-gray-700">{t.tool_name}</td>
                  <td className="py-1.5 text-right text-gray-900">{t.n.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Client breakdown — the headline question */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Client breakdown (30d)</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b">
                <th className="text-left pb-1">Client</th>
                <th className="text-left pb-1">Origin</th>
                <th className="text-right pb-1">Calls</th>
              </tr>
            </thead>
            <tbody>
              {data.client_breakdown.map((c, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-1.5 text-gray-700 truncate max-w-[120px]">{c.client}</td>
                  <td className="py-1.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      c.origin_class === "hosted" ? "bg-purple-100 text-purple-700" :
                      c.origin_class === "direct" ? "bg-green-100 text-green-700" :
                      "bg-gray-100 text-gray-500"
                    }`}>{c.origin_class}</span>
                  </td>
                  <td className="py-1.5 text-right text-gray-900">{c.n.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---- Tab: Corpus health ----------------------------------------------------
function CorpusTab({ data }: { data: CorpusData }) {
  const TARGET = 30;
  const STATES = [...new Set(data.fill_by_cell.map((c) => c.state_code))].sort();
  const TYPES = [...new Set(data.fill_by_cell.map((c) => c.project_type))].sort();
  const cellMap = new Map(data.fill_by_cell.map((c) => [`${c.state_code}:${c.project_type}`, c.n]));

  function cellColor(n: number | undefined) {
    if (!n) return "bg-gray-50 text-gray-300";
    if (n >= TARGET) return "bg-green-100 text-green-800";
    if (n >= TARGET * 0.5) return "bg-yellow-100 text-yellow-800";
    return "bg-orange-50 text-orange-700";
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Stat label="Total submissions" value={data.total_submissions.toLocaleString()} />
        <Stat
          label="Avg extraction coverage"
          value={data.avg_extraction_coverage != null ? `${(data.avg_extraction_coverage * 100).toFixed(0)}%` : "—"}
          sub="Target: ≥40%"
        />
        <Stat
          label="Viable cells"
          value={data.fill_by_cell.filter((c) => c.n >= TARGET).length}
          sub={`of ${data.fill_by_cell.length} seen (target: ≥${TARGET} each)`}
        />
      </div>

      {/* Fill-rate heatmap */}
      {STATES.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 overflow-x-auto">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Fill rate by state × project type (target: {TARGET} submissions/cell)
          </h3>
          <table className="text-xs border-collapse">
            <thead>
              <tr>
                <th className="p-1 text-left text-gray-400 w-12">State</th>
                {TYPES.map((t) => (
                  <th key={t} className="p-1 text-center text-gray-400 whitespace-nowrap">
                    {t.replace(/-/g, " ")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STATES.map((state) => (
                <tr key={state}>
                  <td className="p-1 font-medium text-gray-600">{state}</td>
                  {TYPES.map((type) => {
                    const n = cellMap.get(`${state}:${type}`);
                    return (
                      <td key={type} className={`p-1 text-center rounded ${cellColor(n)}`}>
                        {n ?? "·"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Top flags */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Top flags fired</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 border-b">
              <th className="text-left pb-1">Flag</th>
              <th className="text-left pb-1">Severity</th>
              <th className="text-right pb-1">Count</th>
            </tr>
          </thead>
          <tbody>
            {data.top_flags.map((f) => (
              <tr key={f.flag_id} className="border-b border-gray-50">
                <td className="py-1.5">
                  <span className="font-mono text-xs text-gray-600">{f.flag_id}</span>
                  <p className="text-xs text-gray-400">{f.title}</p>
                </td>
                <td className="py-1.5"><SeverityBadge severity={f.severity} /></td>
                <td className="py-1.5 text-right text-gray-900">{f.n}</td>
              </tr>
            ))}
            {data.top_flags.length === 0 && (
              <tr><td colSpan={3} className="py-4 text-center text-gray-400 text-sm">No submissions yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---- Tab: Abuse ------------------------------------------------------------
function AbuseTab({ data }: { data: AbuseData }) {
  return (
    <div className="space-y-6">
      {data.high_volume_sessions.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-red-700 mb-2">
            High-volume sessions (≥50 calls / 48h) — review individually
          </h3>
          <div className="space-y-1">
            {data.high_volume_sessions.map((s) => (
              <div key={s.session_id} className="flex justify-between text-sm">
                <span className="font-mono text-xs text-red-600 truncate">{s.session_id}</span>
                <span className="text-red-800 font-medium ml-4">{s.total_calls} calls</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-4 overflow-x-auto">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Sessions (48h, ≥5 calls)</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 border-b">
              <th className="text-left pb-1">Session</th>
              <th className="text-left pb-1">Client</th>
              <th className="text-left pb-1">Origin</th>
              <th className="text-right pb-1">Total</th>
              <th className="text-right pb-1">Bids</th>
              <th className="text-right pb-1">Est.</th>
              <th className="text-right pb-1">Ratio</th>
            </tr>
          </thead>
          <tbody>
            {data.sessions_48h.map((s) => (
              <tr key={s.session_id} className={`border-b border-gray-50 ${s.scraper_ratio != null && s.scraper_ratio > 10 ? "bg-orange-50" : ""}`}>
                <td className="py-1.5 font-mono text-xs text-gray-500 truncate max-w-[100px]">{s.session_id.slice(0, 8)}…</td>
                <td className="py-1.5 text-gray-700 truncate max-w-[100px]">{s.client_name}</td>
                <td className="py-1.5">
                  <span className={`text-xs px-1 rounded ${
                    s.origin_class === "hosted" ? "bg-purple-100 text-purple-700" :
                    s.origin_class === "direct" ? "bg-green-100 text-green-700" :
                    "bg-gray-100 text-gray-500"
                  }`}>{s.origin_class}</span>
                </td>
                <td className="py-1.5 text-right font-medium">{s.total_calls}</td>
                <td className="py-1.5 text-right text-gray-600">{s.bid_calls}</td>
                <td className="py-1.5 text-right text-gray-600">{s.cost_calls}</td>
                <td className={`py-1.5 text-right font-mono text-xs ${s.scraper_ratio != null && s.scraper_ratio > 10 ? "text-orange-600 font-semibold" : "text-gray-500"}`}>
                  {s.scraper_ratio != null ? `${s.scraper_ratio}×` : "—"}
                </td>
              </tr>
            ))}
            {data.sessions_48h.length === 0 && (
              <tr><td colSpan={7} className="py-4 text-center text-gray-400 text-sm">No sessions</td></tr>
            )}
          </tbody>
        </table>
        <p className="text-xs text-gray-400 mt-2">Ratio = cost_estimate ÷ analyze_bid calls. &gt;10× signals cost-data scraping.</p>
      </div>
    </div>
  );
}

// ---- Tab: Attribution ------------------------------------------------------
function AttributionTab({ data }: { data: AttributionData }) {
  const t = data.totals;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Total calls → attribution pre-stored" value={t?.pre_stored.toLocaleString() ?? "—"} />
        <Stat label="Clicked (landed on site)" value={`${t?.clicked.toLocaleString() ?? "—"}`} sub={t ? pct(t.clicked, t.pre_stored) + " CTR" : undefined} />
        <Stat label="Converted" value={t?.converted ?? "—"} sub={t?.clicked ? pct(t.converted, t.clicked) + " of clicks" : undefined} />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">By tool</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 border-b">
              <th className="text-left pb-1">Tool</th>
              <th className="text-right pb-1">Pre-stored</th>
              <th className="text-right pb-1">Clicked</th>
              <th className="text-right pb-1">CTR</th>
              <th className="text-right pb-1">Converted</th>
            </tr>
          </thead>
          <tbody>
            {data.by_tool.map((r) => (
              <tr key={r.tool_name} className="border-b border-gray-50">
                <td className="py-1.5 font-mono text-xs text-gray-700">{r.tool_name}</td>
                <td className="py-1.5 text-right">{r.pre_stored}</td>
                <td className="py-1.5 text-right">{r.clicked}</td>
                <td className="py-1.5 text-right text-gray-500">{pct(r.clicked, r.pre_stored)}</td>
                <td className="py-1.5 text-right text-green-700">{r.converted}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Recent clicks</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 border-b">
              <th className="text-left pb-1">Call ID</th>
              <th className="text-left pb-1">Tool</th>
              <th className="text-left pb-1">Landed at</th>
              <th className="text-left pb-1">Converted</th>
            </tr>
          </thead>
          <tbody>
            {data.recent_clicks.map((r) => (
              <tr key={r.call_id} className="border-b border-gray-50">
                <td className="py-1.5 font-mono text-xs text-gray-400">{r.call_id.slice(0, 8)}…</td>
                <td className="py-1.5 text-xs text-gray-700">{r.tool_name}</td>
                <td className="py-1.5 text-xs text-gray-500">{r.landed_at?.slice(0, 16)}</td>
                <td className="py-1.5 text-xs">{r.conversion_type ?? "—"}</td>
              </tr>
            ))}
            {data.recent_clicks.length === 0 && (
              <tr><td colSpan={4} className="py-4 text-center text-gray-400 text-sm">No clicks yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---- Page ------------------------------------------------------------------
type Tab = "usage" | "corpus" | "abuse" | "attribution";

export default function AdminMcpPage() {
  const [tab, setTab] = useState<Tab>("usage");
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [corpus, setCorpus] = useState<CorpusData | null>(null);
  const [abuse, setAbuse] = useState<AbuseData | null>(null);
  const [attribution, setAttribution] = useState<AttributionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setError(null);
      try {
        const [u, c, a, at] = await Promise.all([
          fetch("/api/admin/mcp/usage", { credentials: "include" }).then((r) => r.json()),
          fetch("/api/admin/mcp/corpus", { credentials: "include" }).then((r) => r.json()),
          fetch("/api/admin/mcp/abuse", { credentials: "include" }).then((r) => r.json()),
          fetch("/api/admin/mcp/attribution", { credentials: "include" }).then((r) => r.json()),
        ]);
        if (u.error || c.error || a.error || at.error) {
          setError("Access denied or not logged in as admin.");
          return;
        }
        setUsage(u as UsageData);
        setCorpus(c as CorpusData);
        setAbuse(a as AbuseData);
        setAttribution(at as AttributionData);
      } catch {
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }
    void fetchAll();
  }, []);

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "usage", label: "Usage" },
    { id: "corpus", label: "Corpus health" },
    { id: "abuse", label: "Abuse" },
    { id: "attribution", label: "Attribution" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">MCP Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Telemetry for the RemodelerIQ MCP server — calls, corpus health, abuse signals, and attribution.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading…</div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-1 border-b border-gray-200 mb-6">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 text-sm font-medium rounded-t border-b-2 transition-colors ${
                  tab === t.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === "usage" && usage && <UsageTab data={usage} />}
          {tab === "corpus" && corpus && <CorpusTab data={corpus} />}
          {tab === "abuse" && abuse && <AbuseTab data={abuse} />}
          {tab === "attribution" && attribution && <AttributionTab data={attribution} />}
        </>
      )}
    </div>
  );
}
