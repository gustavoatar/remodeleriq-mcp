// RemodelerIQ MCP server — Streamable-HTTP (JSON-RPC 2.0), hand-rolled to avoid
// the agents/zod-v4 peer conflict and keep tools in-process. Exposes the bid
// analyzer + cost + labor data to any AI agent (ChatGPT, Claude, Perplexity,
// Cursor, etc.). Stateless, public, read-only — no auth needed.
//
// Endpoint: https://mcp.remodeleriq.com/  (and https://remodeleriq.com/mcp)
// Tools: analyze_bid, get_cost_estimate, get_labor_rates
//
// Phase 0 instrumentation:
//   - mcp_sessions: stores clientInfo from initialize for later joins
//   - mcp_calls_v2: rich per-call analytics (client, latency, origin_class)
//   - mcp_attributions: pre-seeded on every analyze_bid; updated on click
//   - PII-safe: no raw bid text is logged or stored

import { analyzeBidFull, costEstimateResult, laborRatesResult, isToolError } from "@/shared/toolResults";
import type { AnalysisResult } from "@/shared/analysisEngine";
import { compareBidsFull, type BidInput } from "@/shared/compareBidsEngine";
import { generateDocumentFingerprint, SCRUB_VERSION } from "@/shared/piiScrubber";
import { BID_WIDGET_URI, BID_WIDGET_HTML } from "./bidWidgetHtml";

const PROTOCOL_VERSION = "2025-06-18";
const SERVER_INFO = { name: "remodeleriq", version: "1.2.0" };
const RULE_VERSION = "2026.08.1";

const WIDGET_META = {
  "openai/widgetDomain": "https://remodeleriq.com",
  "openai/widgetDescription":
    "RemodelerIQ bid-analysis score card — confidence score, top red flags, and a link to the full report.",
  "openai/widgetCSP": {
    connect_domains: [] as string[],
    resource_domains: [] as string[],
    redirect_domains: ["https://remodeleriq.com"],
  },
};

// ---- Origin class detection ------------------------------------------------
// Hosted clients: requests arrive from provider infrastructure, not the user's
// network. IP geo is meaningless for these — one datacenter looks like one user.
const HOSTED_SUBSTRINGS = ["claude", "chatgpt", "openai", "copilot", "gemini", "perplexity", "anthropic"];
const DIRECT_SUBSTRINGS = ["cursor", "vscode", "claude-desktop", "cline", "zed", "windsurf", "continue"];

type OriginClass = "hosted" | "direct" | "unknown";

function detectOriginClass(clientName: string | null, ua: string | null): OriginClass {
  const combined = ((clientName ?? "") + " " + (ua ?? "")).toLowerCase();
  if (HOSTED_SUBSTRINGS.some((s) => combined.includes(s))) return "hosted";
  if (DIRECT_SUBSTRINGS.some((s) => combined.includes(s))) return "direct";
  return "unknown";
}

// ---- Bid total bucket ------------------------------------------------------
function bucketBidTotal(total: number): string {
  if (total < 10_000) return "<10k";
  if (total < 25_000) return "10-25k";
  if (total < 50_000) return "25-50k";
  if (total < 100_000) return "50-100k";
  return "100k+";
}

// ---- SHA-256 helpers -------------------------------------------------------
async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Short(text: string): Promise<string> {
  return (await sha256Hex(text)).slice(0, 16);
}

// ---- Attribution (rid token) -----------------------------------------------
// rid = callId + "_" + HMAC-SHA256-prefix(callId, secret)
// This is not guessable (UUIDs + HMAC) but is verified cheaply on the server.

async function signRid(callId: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(callId));
  const sigHex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 12);
  return `${callId}_${sigHex}`;
}

export async function verifyRid(rid: string, secret: string): Promise<string | null> {
  const idx = rid.lastIndexOf("_");
  if (idx < 10) return null;
  const callId = rid.slice(0, idx);
  const expected = await signRid(callId, secret);
  return rid === expected ? callId : null;
}

function makeJoinUrl(ridToken: string, tool: string): string {
  return `https://remodeleriq.com/api/mcp/attribution?rid=${encodeURIComponent(ridToken)}&tool=${tool}&lp=${encodeURIComponent("/join")}`;
}

// ---- D1 helpers (best-effort — never block or fail a response) -------------
type McpEnv = { DB?: D1Database; MCP_RID_SECRET?: string } | undefined;

async function saveSessionInfo(
  env: McpEnv,
  sessionId: string | null,
  clientName: string | null,
  clientVersion: string | null,
  protocolVersion: string | null
): Promise<void> {
  if (!env?.DB || !sessionId) return;
  try {
    await env.DB.prepare(`
      INSERT INTO mcp_sessions (session_id, client_name, client_version, protocol_version, first_seen, last_seen)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
      ON CONFLICT(session_id) DO UPDATE SET last_seen = datetime('now')
    `)
      .bind(sessionId, clientName, clientVersion, protocolVersion)
      .run();
  } catch { /* best-effort */ }
}

async function getSessionInfo(
  env: McpEnv,
  sessionId: string
): Promise<{ client_name: string | null; client_version: string | null } | null> {
  if (!env?.DB) return null;
  try {
    return await env.DB.prepare(
      "SELECT client_name, client_version FROM mcp_sessions WHERE session_id = ?"
    )
      .bind(sessionId)
      .first<{ client_name: string | null; client_version: string | null }>();
  } catch {
    return null;
  }
}

interface V2Log {
  callId: string;
  toolName: string;
  sessionId: string | null;
  clientName: string | null;
  clientVersion: string | null;
  protocolVersion: string | null;
  paramsHash: string | null;
  projectType: string | null;
  stateCode: string | null;
  bidTotalBucket: string | null;
  latencyMs: number;
  status: string;
  ipCountry: string | null;
  ipRegion: string | null;
  originClass: OriginClass;
  quotaState: string | null;
}

async function logCallV2(env: McpEnv, log: V2Log): Promise<void> {
  if (!env?.DB) return;
  try {
    await env.DB.prepare(`
      INSERT INTO mcp_calls_v2 (
        call_id, ts, tool_name, session_id, client_name, client_version,
        protocol_version, params_hash, project_type, state_code, bid_total_bucket,
        latency_ms, status, ip_country, ip_region, origin_class, quota_state
      ) VALUES (?, datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
      .bind(
        log.callId, log.toolName, log.sessionId, log.clientName, log.clientVersion,
        log.protocolVersion, log.paramsHash, log.projectType, log.stateCode,
        log.bidTotalBucket, log.latencyMs, log.status, log.ipCountry, log.ipRegion,
        log.originClass, log.quotaState
      )
      .run();
  } catch { /* best-effort */ }
}

async function preStoreAttribution(
  env: McpEnv,
  callId: string,
  ridToken: string,
  toolName: string
): Promise<void> {
  if (!env?.DB) return;
  try {
    await env.DB.prepare(`
      INSERT OR IGNORE INTO mcp_attributions (call_id, rid_token, landing_path, tool_name, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `)
      .bind(callId, ridToken, "/join", toolName)
      .run();
  } catch { /* best-effort */ }
}

// Legacy mcp_usage write (rate limiter reads this table)
async function logLegacy(env: McpEnv, tool: string, ip: string | null, ua: string | null): Promise<void> {
  if (!env?.DB || !tool) return;
  try {
    await env.DB.prepare("INSERT INTO mcp_usage (tool, ip, ua) VALUES (?, ?, ?)")
      .bind(tool, ip, ua ? ua.slice(0, 200) : null)
      .run();
  } catch { /* best-effort */ }
}

// ---- Phase 2.5: Per-session usage quota ------------------------------------
const QUOTA_FREE_LIMIT = 3;
const QUOTA_WINDOW_HOURS = 48;

interface QuotaResult {
  state: "ok" | "warned" | "quota_reached";
  remaining: number; // after this call
  resetsAt: string | null;
}

async function checkQuota(
  env: McpEnv,
  sessionId: string | null,
  toolName: string | null,
): Promise<QuotaResult> {
  const isAnalyzeBid = toolName === "analyze_bid" || toolName === "remodeleriq_analyze_bid";
  if (!isAnalyzeBid || !env?.DB || !sessionId) {
    return { state: "ok", remaining: QUOTA_FREE_LIMIT, resetsAt: null };
  }
  try {
    const row = await env.DB.prepare(`
      SELECT COUNT(*) AS n, MIN(ts) AS oldest_ts
      FROM mcp_calls_v2
      WHERE session_id = ?
        AND tool_name IN ('analyze_bid', 'remodeleriq_analyze_bid')
        AND ts > datetime('now', '-48 hours')
    `).bind(sessionId).first<{ n: number; oldest_ts: string | null }>();

    const used = row?.n ?? 0;
    const oldestTs = row?.oldest_ts ?? null;

    let resetsAt: string | null = null;
    if (oldestTs) {
      // SQLite datetime() returns UTC without 'Z'
      const oldest = new Date(oldestTs.replace(" ", "T") + "Z");
      oldest.setTime(oldest.getTime() + QUOTA_WINDOW_HOURS * 3600 * 1000);
      resetsAt = oldest.toISOString();
    }

    if (used >= QUOTA_FREE_LIMIT) {
      return { state: "quota_reached", remaining: 0, resetsAt };
    }
    // remaining = calls left AFTER this one
    const remaining = QUOTA_FREE_LIMIT - used - 1;
    const state = remaining === 0 ? "warned" : "ok";
    return { state, remaining, resetsAt };
  } catch {
    return { state: "ok", remaining: QUOTA_FREE_LIMIT, resetsAt: null }; // fail open
  }
}

// ---- Rate guard (unchanged — reads mcp_usage) ------------------------------
const RATE_LIMIT_PER_MIN = 120;

async function isRateLimited(env: McpEnv, ip: string | null): Promise<boolean> {
  if (!env?.DB || !ip) return false;
  try {
    const row = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM mcp_usage WHERE ip = ? AND created_at > datetime('now','-60 seconds')"
    )
      .bind(ip)
      .first<{ n: number }>();
    return (row?.n ?? 0) >= RATE_LIMIT_PER_MIN;
  } catch {
    return false;
  }
}

// ---- Phase 2.4: Output schemas --------------------------------------------
const ANALYZE_BID_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    confidence_score: { type: "number", description: "0–100 bid confidence score" },
    verdict: { type: "string" },
    summary: { type: "string" },
    red_flags: {
      type: "array",
      items: {
        type: "object",
        properties: {
          level: { type: "string", enum: ["critical", "high"] },
          issue: { type: "string" },
          detail: { type: "string" },
          fix: { type: "string" },
          flag_id: { type: "string", description: "Stable taxonomy ID (e.g. PAY_DEPOSIT_EXCESSIVE)" },
        },
        required: ["level", "issue", "detail", "fix", "flag_id"],
      },
    },
    missing_items: { type: "array", items: { type: "string" } },
    negotiation_talk_track: { type: "array", items: { type: "string" } },
    score_breakdown: {
      type: "object",
      properties: {
        contract_clarity: { type: "number" },
        contract_weight: { type: "number" },
        scope_completeness: { type: "number" },
        scope_weight: { type: "number" },
        price_realism: { type: "number" },
        price_weight: { type: "number" },
        final: { type: "number" },
      },
    },
    _meta: { type: "object" },
  },
  required: ["confidence_score", "verdict", "summary", "red_flags", "missing_items", "negotiation_talk_track"],
};

const COST_ESTIMATE_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    project: { type: "string" },
    location: { type: "string" },
    typical_cost: { type: "number" },
    range_low: { type: "number" },
    range_high: { type: "number" },
    regional_multiplier: { type: "number" },
    data_source: { type: "string" },
    note: { type: "string" },
    _meta: { type: "object" },
  },
  required: ["project", "location", "typical_cost", "range_low", "range_high"],
};

const LABOR_RATES_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    state: { type: "string" },
    note: { type: "string" },
    rates: {
      type: "array",
      items: {
        type: "object",
        properties: {
          trade: { type: "string" },
          trade_key: { type: "string" },
          bls_mean_wage_per_hour: { type: "number" },
          fair_billed_rate_per_hour: { type: "number" },
        },
        required: ["trade", "trade_key", "bls_mean_wage_per_hour", "fair_billed_rate_per_hour"],
      },
    },
    _meta: { type: "object" },
  },
  required: ["state", "rates"],
};

// ---- Phase 2.1: Shared input schemas --------------------------------------
const ANALYZE_BID_INPUT_SCHEMA = {
  type: "object",
  properties: {
    bid_text: {
      type: "string",
      description: "The full text of the contractor's bid/estimate (line items, terms, scope).",
    },
    bid_total: {
      type: "number",
      description: "The total dollar amount of the bid, if known.",
    },
    state_code: {
      type: "string",
      description: "Two-letter US state code (e.g. 'TX', 'GA') for localized labor/legal context. Defaults to GA.",
    },
    square_footage: {
      type: "number",
      description: "Project area in square feet, if known (e.g. 200 for a bathroom, 400 for a kitchen).",
    },
    finish_tier: {
      type: "string",
      enum: ["builder_grade", "mid", "semi_custom", "custom", "luxury"],
      description: "Quality tier of finishes specified in the bid.",
    },
    scope_depth: {
      type: "string",
      enum: ["cosmetic", "pull_and_replace", "full_gut", "addition"],
      description: "Depth of work: cosmetic (paint/fixtures only), pull_and_replace (replace but not reconfigure), full_gut (down to studs), addition (new square footage).",
    },
  },
  required: ["bid_text"],
};

const COST_ESTIMATE_INPUT_SCHEMA = {
  type: "object",
  properties: {
    project_type: {
      type: "string",
      description: "Project type, e.g. 'kitchen-remodel', 'bathroom-remodel', 'roofing', 'siding', 'deck', 'addition', 'basement'.",
    },
    state_code: {
      type: "string",
      description: "Two-letter US state code (e.g. 'CA', 'TX').",
    },
    city_key: {
      type: "string",
      description: "Optional city slug (e.g. 'atlanta-ga') for city-level precision.",
    },
  },
  required: ["project_type", "state_code"],
};

const LABOR_RATES_INPUT_SCHEMA = {
  type: "object",
  properties: {
    state_code: {
      type: "string",
      description: "Two-letter US state code (e.g. 'TX', 'NY').",
    },
    trade: {
      type: "string",
      description: "Optional specific trade to filter to (e.g. 'plumber', 'electrician', 'carpenter').",
    },
  },
  required: ["state_code"],
};

const ANALYZE_BID_ANNOTATIONS = {
  title: "Analyze a contractor's bid",
  readOnlyHint: true,
  idempotentHint: true,
  openWorldHint: false,
  destructiveHint: false,
};

const COST_ESTIMATE_ANNOTATIONS = {
  title: "Estimate remodel cost",
  readOnlyHint: true,
  idempotentHint: true,
  openWorldHint: false,
  destructiveHint: false,
};

const LABOR_RATES_ANNOTATIONS = {
  title: "Look up trade labor rates",
  readOnlyHint: true,
  idempotentHint: true,
  openWorldHint: false,
  destructiveHint: false,
};

// ---- Phase 3: compare_bids schemas ----------------------------------------
const BID_ITEM_SCHEMA = {
  type: "object",
  properties: {
    bid_text: { type: "string", description: "Full text of the contractor bid/estimate." },
    bid_total: { type: "number", description: "Total dollar amount of the bid, if known." },
    label: { type: "string", description: "Display name for this bid (e.g. 'Acme Remodeling'). Defaults to 'Bid A', 'Bid B'…" },
    state_code: { type: "string", description: "Two-letter US state code. Defaults to GA." },
    square_footage: { type: "number" },
    finish_tier: { type: "string", enum: ["builder_grade", "mid", "semi_custom", "custom", "luxury"] },
    scope_depth: { type: "string", enum: ["cosmetic", "pull_and_replace", "full_gut", "addition"] },
  },
  required: ["bid_text"],
};

const COMPARE_BIDS_INPUT_SCHEMA = {
  type: "object",
  properties: {
    bids: {
      type: "array",
      description: "2–5 contractor bids to compare side-by-side.",
      minItems: 2,
      maxItems: 5,
      items: BID_ITEM_SCHEMA,
    },
  },
  required: ["bids"],
};

const COMPARE_BIDS_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    bid_count: { type: "number" },
    bids: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          confidence_score: { type: "number" },
          verdict: { type: "string" },
          total: { type: "number" },
          adjusted_total: { type: "number" },
          critical_flags: { type: "number" },
          high_flags: { type: "number" },
          top_flags: { type: "array" },
        },
      },
    },
    winner: { type: "object", properties: { label: { type: "string" }, reason: { type: "string" } } },
    cost_comparison: { type: "array", description: "Per-trade cost table sorted by price variance (largest gap first)." },
    scope_gaps: { type: "array", description: "Trades present in some bids but absent from others, with estimated gap value." },
    apples_to_apples: { type: "array", description: "Stated total + scope adjustment = adjusted comparable total per bid." },
    outlier_flags: { type: "array", description: "Trades where one bid is ≥2× or ≤0.5× the median." },
    all_flags: { type: "array", description: "All critical and high-severity flags across every bid." },
    _meta: { type: "object" },
  },
  required: ["bid_count", "bids", "cost_comparison", "scope_gaps", "apples_to_apples"],
};

const COMPARE_BIDS_ANNOTATIONS = {
  title: "Compare contractor bids",
  readOnlyHint: true,
  idempotentHint: true,
  openWorldHint: false,
  destructiveHint: false,
};

// ---- Tool definitions ------------------------------------------------------
// Phase 2.1: canonical remodeleriq_* names alongside legacy names (deprecated).
const TOOLS = [
  // Canonical names
  {
    name: "remodeleriq_analyze_bid",
    description:
      "Analyze a home-remodeling contractor's bid/estimate for fairness and risk. Returns a 0-100 confidence score, score_breakdown by dimension, red flags with stable flag IDs (deposit traps, vague scope, missing items, payment terms), a plain-English summary, and negotiation talk tracks. Score rubric: contract clarity 40%, scope completeness 30%, price realism 30%. Use when a homeowner asks 'is this contractor quote fair?' or shares a remodeling estimate. Note: analyses may contribute de-identified data to aggregate remodeling-risk research.",
    inputSchema: ANALYZE_BID_INPUT_SCHEMA,
    outputSchema: ANALYZE_BID_OUTPUT_SCHEMA,
    annotations: ANALYZE_BID_ANNOTATIONS,
    _meta: { "openai/outputTemplate": BID_WIDGET_URI },
  },
  {
    name: "remodeleriq_get_cost_estimate",
    description:
      "Get a 2026 market cost range for a home-remodeling project in a US state/city, backed by Zonda Cost vs. Value benchmarks with regional adjustment. Use when a homeowner asks 'how much does a [kitchen/bathroom/roof/etc.] remodel cost in [place]?'",
    inputSchema: COST_ESTIMATE_INPUT_SCHEMA,
    outputSchema: COST_ESTIMATE_OUTPUT_SCHEMA,
    annotations: COST_ESTIMATE_ANNOTATIONS,
  },
  {
    name: "remodeleriq_get_labor_rates",
    description:
      "Get 2026 burdened construction trade labor rates ($/hour) for a US state, derived from BLS wage data. Returns rates by trade (carpenter, plumber, electrician, painter, etc.). Use when a homeowner asks what trade labor should cost or whether a bid's labor line is fair.",
    inputSchema: LABOR_RATES_INPUT_SCHEMA,
    outputSchema: LABOR_RATES_OUTPUT_SCHEMA,
    annotations: LABOR_RATES_ANNOTATIONS,
  },
  // Legacy names (deprecated — use remodeleriq_* variants above)
  {
    name: "analyze_bid",
    description:
      "Deprecated: prefer remodeleriq_analyze_bid. Analyze a home-remodeling contractor's bid/estimate for fairness and risk. Returns a 0-100 confidence score, red flags, a plain-English summary, and negotiation talk tracks. Note: analyses may contribute de-identified data to aggregate remodeling-risk research.",
    inputSchema: ANALYZE_BID_INPUT_SCHEMA,
    outputSchema: ANALYZE_BID_OUTPUT_SCHEMA,
    annotations: ANALYZE_BID_ANNOTATIONS,
    _meta: { "openai/outputTemplate": BID_WIDGET_URI },
  },
  {
    name: "get_cost_estimate",
    description:
      "Deprecated: prefer remodeleriq_get_cost_estimate. Get a 2026 market cost range for a home-remodeling project in a US state/city, backed by Zonda Cost vs. Value benchmarks with regional adjustment.",
    inputSchema: COST_ESTIMATE_INPUT_SCHEMA,
    outputSchema: COST_ESTIMATE_OUTPUT_SCHEMA,
    annotations: COST_ESTIMATE_ANNOTATIONS,
  },
  {
    name: "get_labor_rates",
    description:
      "Deprecated: prefer remodeleriq_get_labor_rates. Get 2026 burdened construction trade labor rates ($/hour) for a US state, derived from BLS wage data.",
    inputSchema: LABOR_RATES_INPUT_SCHEMA,
    outputSchema: LABOR_RATES_OUTPUT_SCHEMA,
    annotations: LABOR_RATES_ANNOTATIONS,
  },
  // Phase 3: compare bids (canonical + legacy)
  {
    name: "remodeleriq_compare_bids",
    description:
      "Compare 2–5 contractor bids for the same project side-by-side. Returns: per-bid confidence scores; a per-trade cost comparison table sorted by price variance; a scope-gap matrix (what Bid A includes that Bid B omits); apples-to-apples adjusted totals (normalizing for scope gaps); outlier detection (trades priced ≥2× or ≤0.5× the median); consolidated red flags across all bids; and a winner recommendation. Use when a homeowner has multiple quotes and wants to know which is best and why.",
    inputSchema: COMPARE_BIDS_INPUT_SCHEMA,
    outputSchema: COMPARE_BIDS_OUTPUT_SCHEMA,
    annotations: COMPARE_BIDS_ANNOTATIONS,
  },
  {
    name: "compare_bids",
    description:
      "Deprecated: prefer remodeleriq_compare_bids. Compare 2–5 contractor bids side-by-side with per-trade cost comparison, scope-gap matrix, and winner recommendation.",
    inputSchema: COMPARE_BIDS_INPUT_SCHEMA,
    outputSchema: COMPARE_BIDS_OUTPUT_SCHEMA,
    annotations: COMPARE_BIDS_ANNOTATIONS,
  },
];

// ---- Tool handlers ---------------------------------------------------------
function txt(text: string) {
  return { content: [{ type: "text", text }] };
}

function wrapError(e: unknown) {
  return { ...txt(`Error: ${e instanceof Error ? e.message : "unknown"}`), isError: true };
}

// ---- Corpus write path (Phase 1) -------------------------------------------

async function writeCorpusRecord(
  db: D1Database,
  rawResult: AnalysisResult,
  bidText: string,
  clientName: string | null,
  responseGated: boolean = false,
): Promise<void> {
  const fingerprint = await generateDocumentFingerprint(bidText);

  const sub = await db.prepare(`
    INSERT OR IGNORE INTO bid_submissions (
      document_fingerprint, source, client_name,
      state_code, project_type, bid_total, square_footage,
      finish_tier, scope_depth,
      extraction_coverage, confidence_score,
      rule_version, scrub_version, raw_text_retained, response_gated
    ) VALUES (?, 'mcp', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
  `).bind(
    fingerprint,
    clientName,
    rawResult.stateCode || null,
    rawResult.projectType ?? null,
    typeof rawResult.totalPrice === 'number' ? rawResult.totalPrice : null,
    typeof rawResult.squareFootage === 'number' ? rawResult.squareFootage : null,
    rawResult.finishTier ?? null,
    rawResult.scopeDepth ?? null,
    rawResult.extractionCoverage ?? null,
    rawResult.confidenceScore,
    RULE_VERSION,
    SCRUB_VERSION,
    responseGated ? 1 : 0,
  ).run();

  if (!sub.meta?.changes) return; // duplicate fingerprint — skip line items and flags

  const submissionId = sub.meta.last_row_id;

  const stmts: ReturnType<typeof db.prepare>[] = [];

  if (rawResult.lineItems && rawResult.lineItems.length > 0) {
    for (const item of rawResult.lineItems) {
      stmts.push(
        db.prepare(`
          INSERT INTO bid_line_items (
            submission_id, trade, description_normalized,
            quantity, unit, unit_price, extended_price,
            price_type, extraction_confidence
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          submissionId, item.trade, item.description_normalized,
          item.quantity, item.unit, item.unit_price, item.extended_price,
          item.price_type, item.extraction_confidence,
        )
      );
    }
  }

  if (rawResult.flags && rawResult.flags.length > 0) {
    for (const flag of rawResult.flags) {
      if (!flag.id) continue;
      stmts.push(
        db.prepare(
          "INSERT OR IGNORE INTO bid_flags (submission_id, flag_id, rule_version) VALUES (?, ?, ?)"
        ).bind(submissionId, flag.id, RULE_VERSION)
      );
    }
  }

  if (stmts.length > 0) {
    await db.batch(stmts);
  }
}

// ---- Tool handlers ---------------------------------------------------------

async function runAnalyzeBid(args: Record<string, unknown>, ctx: HandleContext) {
  const bidText = String(args.bid_text || "");
  const bidTotal = typeof args.bid_total === "number" ? args.bid_total : undefined;
  const squareFootage = typeof args.square_footage === "number" ? args.square_footage : undefined;
  const finishTier = typeof args.finish_tier === "string" ? args.finish_tier : undefined;
  const scopeDepth = typeof args.scope_depth === "string" ? args.scope_depth : undefined;

  // Always run full analysis (gate output, never intake)
  const { toolResult, rawResult } = analyzeBidFull(
    bidText,
    bidTotal,
    args.state_code as string | undefined,
    ctx.joinUrl ? { joinUrl: ctx.joinUrl } : undefined,
    squareFootage,
    finishTier,
    scopeDepth,
  );

  if (isToolError(toolResult)) return { ...txt(`Error: ${toolResult.error}`), isError: true };

  // Always write corpus — responseGated=true when over quota
  const gated = ctx.quota.state === "quota_reached";
  if (rawResult && ctx.env?.DB) {
    try {
      await writeCorpusRecord(ctx.env.DB, rawResult, bidText, ctx.clientName, gated);
    } catch { /* best-effort — never surface corpus errors */ }
  }

  // Gate the response when over quota
  if (gated) {
    const joinUrl = ctx.joinUrl ?? "https://remodeleriq.com/join";
    const quotaResponse = {
      status: "quota_reached",
      verdict: null,
      limit: {
        free_analyses: QUOTA_FREE_LIMIT,
        window_hours: QUOTA_WINDOW_HOURS,
        resets_at: ctx.quota.resetsAt,
      },
      message: `You've used your ${QUOTA_FREE_LIMIT} free bid analyses. Paid plans remove the limit and re-score every revised bid as you negotiate. See options at https://remodeleriq.com/join or email help@remodeleriq.com`,
      join_url: joinUrl,
      contact_email: "help@remodeleriq.com",
    };
    return { ...txt(JSON.stringify(quotaResponse, null, 2)), structuredContent: quotaResponse };
  }

  return {
    ...txt(JSON.stringify(toolResult.data, null, 2)),
    structuredContent: toolResult.data,
    _meta: { "openai/outputTemplate": BID_WIDGET_URI },
  };
}

async function runCompareBids(args: Record<string, unknown>, ctx: HandleContext) {
  const bidsRaw = args.bids;
  if (!Array.isArray(bidsRaw) || bidsRaw.length < 2 || bidsRaw.length > 5) {
    return { ...txt("Error: bids must be an array of 2–5 bid objects."), isError: true };
  }

  const bidInputs: BidInput[] = bidsRaw.map((b: unknown) => {
    const bid = b as Record<string, unknown>;
    return {
      bid_text: String(bid.bid_text ?? ""),
      bid_total: typeof bid.bid_total === "number" ? bid.bid_total : undefined,
      label: bid.label ? String(bid.label) : undefined,
      state_code: bid.state_code ? String(bid.state_code) : undefined,
      square_footage: typeof bid.square_footage === "number" ? bid.square_footage : undefined,
      finish_tier: bid.finish_tier ? String(bid.finish_tier) : undefined,
      scope_depth: bid.scope_depth ? String(bid.scope_depth) : undefined,
    };
  });

  if (bidInputs.some(b => !b.bid_text.trim())) {
    return { ...txt("Error: each bid must have non-empty bid_text."), isError: true };
  }

  let fullResult: Awaited<ReturnType<typeof compareBidsFull>>;
  try {
    fullResult = compareBidsFull(bidInputs, { joinUrl: ctx.joinUrl, ruleVersion: RULE_VERSION });
  } catch (e) {
    return wrapError(e);
  }

  const { comparison, rawResults } = fullResult;

  // Write corpus records for every bid in the comparison (best-effort)
  if (ctx.env?.DB) {
    for (let i = 0; i < rawResults.length; i++) {
      try {
        await writeCorpusRecord(ctx.env.DB, rawResults[i], bidInputs[i].bid_text, ctx.clientName, false);
      } catch { /* best-effort */ }
    }
  }

  return {
    ...txt(JSON.stringify(comparison, null, 2)),
    structuredContent: comparison,
  };
}

function runCostEstimate(args: Record<string, unknown>, joinUrl?: string) {
  const r = costEstimateResult(
    String(args.project_type || ""),
    String(args.state_code || ""),
    args.city_key ? String(args.city_key) : undefined,
    joinUrl ? { joinUrl } : undefined
  );
  if (isToolError(r)) return { ...txt(`Error: ${r.error}`), isError: true };
  return { ...txt(JSON.stringify(r.data, null, 2)), structuredContent: r.data };
}

function runLaborRates(args: Record<string, unknown>, joinUrl?: string) {
  const r = laborRatesResult(
    String(args.state_code || ""),
    args.trade ? String(args.trade) : undefined,
    joinUrl ? { joinUrl } : undefined
  );
  if (isToolError(r)) return { ...txt(`Error: ${r.error}`), isError: true };
  return { ...txt(JSON.stringify(r.data, null, 2)), structuredContent: r.data };
}

async function callTool(name: string, args: Record<string, unknown>, ctx: HandleContext) {
  switch (name) {
    case "remodeleriq_analyze_bid":
    case "analyze_bid":
      return await runAnalyzeBid(args, ctx);
    case "remodeleriq_compare_bids":
    case "compare_bids":
      return await runCompareBids(args, ctx);
    case "remodeleriq_get_cost_estimate":
    case "get_cost_estimate":
      return runCostEstimate(args, ctx.joinUrl);
    case "remodeleriq_get_labor_rates":
    case "get_labor_rates":
      return runLaborRates(args, ctx.joinUrl);
    default:
      return { ...txt(`Unknown tool: ${name}`), isError: true };
  }
}

// ---- JSON-RPC dispatch -----------------------------------------------------
interface RpcReq {
  jsonrpc: string;
  id?: number | string | null;
  method: string;
  params?: Record<string, unknown>;
}

interface HandleContext {
  sessionId: string | null;
  clientName: string | null;
  clientVersion: string | null;
  protocolVersion: string | null;
  joinUrl: string | undefined;
  env: McpEnv;
  callId: string;
  quota: QuotaResult;
}

async function handleRpc(
  req: RpcReq,
  ctx: HandleContext
): Promise<Record<string, unknown> | null> {
  const { method, id, params } = req;

  if (id === undefined || id === null) return null;

  const ok = (result: unknown) => ({ jsonrpc: "2.0", id, result });
  const err = (code: number, message: string) => ({ jsonrpc: "2.0", id, error: { code, message } });

  switch (method) {
    case "initialize": {
      // Capture clientInfo from the initialize handshake and persist for analytics.
      const initParams = params as { clientInfo?: { name?: string; version?: string }; protocolVersion?: string } | undefined;
      const cn = initParams?.clientInfo?.name ?? null;
      const cv = initParams?.clientInfo?.version ?? null;
      const pv = initParams?.protocolVersion ?? null;
      await saveSessionInfo(ctx.env, ctx.sessionId, cn, cv, pv);
      return ok({
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {}, resources: {} },
        serverInfo: SERVER_INFO,
        instructions:
          "RemodelerIQ tools help homeowners evaluate contractor remodeling bids. Use remodeleriq_analyze_bid to score a single quote (0–100 confidence score, red flags, talk tracks). Use remodeleriq_compare_bids to compare 2–5 bids side-by-side (per-trade cost table, scope gaps, apples-to-apples adjusted totals, winner recommendation). Use remodeleriq_get_cost_estimate for 2026 market cost ranges. Use remodeleriq_get_labor_rates for BLS trade wage data. Prefer the remodeleriq_* tool names over the legacy short names.",
      });
    }
    case "ping":
      return ok({});
    case "tools/list":
      return ok({ tools: TOOLS });
    case "tools/call": {
      const name = String(params?.name || "");
      const args = (params?.arguments as Record<string, unknown>) || {};
      try {
        return ok(await callTool(name, args, ctx));
      } catch (e) {
        return ok(wrapError(e));
      }
    }
    case "resources/list":
      return ok({
        resources: [
          {
            uri: BID_WIDGET_URI,
            name: "Bid analysis card",
            description: "Interactive score card rendered by ChatGPT for analyze_bid results.",
            mimeType: "text/html+skybridge",
            _meta: WIDGET_META,
          },
        ],
      });
    case "resources/read": {
      const uri = String(params?.uri || "");
      if (uri === BID_WIDGET_URI) {
        return ok({
          contents: [{ uri, mimeType: "text/html+skybridge", text: BID_WIDGET_HTML, _meta: WIDGET_META }],
        });
      }
      return err(-32602, `Resource not found: ${uri}`);
    }
    case "prompts/list":
      return ok({ prompts: [] });
    default:
      return err(-32601, `Method not found: ${method}`);
  }
}

function toolNameOf(body: unknown): string | null {
  const b = body as RpcReq | undefined;
  if (b?.method === "tools/call") return String((b.params as Record<string, unknown>)?.name || "unknown");
  return null;
}

function extractToolAnalyticsFromArgs(toolName: string, args: Record<string, unknown>) {
  return {
    projectType: args.project_type ? String(args.project_type) : null,
    stateCode: args.state_code ? String(args.state_code).toUpperCase().slice(0, 2) : null,
    bidTotalBucket:
      (toolName === "analyze_bid" || toolName === "remodeleriq_analyze_bid") && typeof args.bid_total === "number"
        ? bucketBidTotal(args.bid_total)
        : null,
  };
}

// ---- CORS ------------------------------------------------------------------
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Mcp-Session-Id, Mcp-Protocol-Version, Authorization",
  "Access-Control-Expose-Headers": "Mcp-Session-Id",
};
const JSON_HEADERS = { "Content-Type": "application/json", ...CORS };

// ---- Main entry point ------------------------------------------------------
export async function mcpFetch(request: Request, env?: McpEnv): Promise<Response> {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  if (request.method === "GET") {
    return new Response(
      JSON.stringify({
        name: SERVER_INFO.name,
        version: SERVER_INFO.version,
        transport: "streamable-http",
        hint: "POST JSON-RPC 2.0 here",
      }),
      { status: 200, headers: JSON_HEADERS }
    );
  }

  if (request.method !== "POST")
    return new Response("Method not allowed", { status: 405, headers: CORS });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  // ---- Extract per-request context ----------------------------------------
  const ip = request.headers.get("cf-connecting-ip");
  const ua = request.headers.get("user-agent");
  const sessionId = request.headers.get("mcp-session-id");
  const protocolVersionHeader = request.headers.get("mcp-protocol-version");
  const cfProps = (request as Request & { cf?: { country?: string; region?: string } }).cf;
  const ipCountry = cfProps?.country ?? null;
  const ipRegion = cfProps?.region ?? null;

  const callId = crypto.randomUUID();
  const singleTool = Array.isArray(body) ? null : toolNameOf(body);

  // Look up clientInfo from session (populated by a prior initialize call)
  let clientName: string | null = null;
  let clientVersion: string | null = null;

  if (sessionId && singleTool) {
    const sess = await getSessionInfo(env, sessionId);
    clientName = sess?.client_name ?? null;
    clientVersion = sess?.client_version ?? null;
  }

  const originClass = detectOriginClass(clientName, ua);

  // ---- Rate guard (abuse ceiling — stays at 120/min) ----------------------
  if (singleTool && (await isRateLimited(env, ip))) {
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        id: (body as RpcReq).id ?? null,
        error: { code: -32029, message: "Rate limit exceeded. Try again in a minute." },
      }),
      { status: 429, headers: JSON_HEADERS }
    );
  }

  // ---- Build attribution URL (analyze_bid only) ----------------------------
  let ridToken: string | undefined;
  let joinUrl: string | undefined;

  if ((singleTool === "analyze_bid" || singleTool === "remodeleriq_analyze_bid") && env?.MCP_RID_SECRET) {
    try {
      ridToken = await signRid(callId, env.MCP_RID_SECRET);
      joinUrl = makeJoinUrl(ridToken, singleTool);
      await preStoreAttribution(env, callId, ridToken, singleTool);
    } catch { /* best-effort — never block the response */ }
  }

  // ---- Phase 2.5: Quota check (before dispatch — gate output, never intake) -
  const quota = await checkQuota(env, sessionId, singleTool);

  const ctx: HandleContext = {
    sessionId,
    clientName,
    clientVersion,
    protocolVersion: protocolVersionHeader,
    joinUrl,
    env,
    callId,
    quota,
  };

  // ---- Dispatch --------------------------------------------------------------
  const start = Date.now();
  let status = "ok";

  let res: Record<string, unknown> | null;
  if (Array.isArray(body)) {
    const results = await Promise.all((body as RpcReq[]).map((b) => handleRpc(b, ctx)));
    res = results.filter((r): r is Record<string, unknown> => r !== null) as unknown as Record<string, unknown>;
  } else {
    try {
      res = await handleRpc(body as RpcReq, ctx);
    } catch (e) {
      status = "error";
      res = {
        jsonrpc: "2.0",
        id: (body as RpcReq).id ?? null,
        error: { code: -32603, message: `Internal error: ${e instanceof Error ? e.message : "unknown"}` },
      };
    }
  }

  const latencyMs = Date.now() - start;

  // ---- Logging (best-effort, after response is built) ---------------------
  if (singleTool) {
    const args = (!Array.isArray(body) && (body as RpcReq).method === "tools/call")
      ? ((body as RpcReq).params?.arguments as Record<string, unknown>) ?? {}
      : {};
    const { projectType, stateCode, bidTotalBucket } = extractToolAnalyticsFromArgs(singleTool, args);

    const paramsForHash = { ...args };
    if (paramsForHash.bid_text) paramsForHash.bid_text = "[redacted]";
    const paramsHash = await sha256Short(JSON.stringify(paramsForHash)).catch(() => null);

    await Promise.all([
      logLegacy(env, singleTool, ip, ua),
      logCallV2(env, {
        callId,
        toolName: singleTool,
        sessionId,
        clientName,
        clientVersion,
        protocolVersion: protocolVersionHeader,
        paramsHash,
        projectType,
        stateCode,
        bidTotalBucket,
        latencyMs,
        status,
        ipCountry,
        ipRegion,
        originClass,
        quotaState: quota.state,
      }),
    ]);
  }

  if (res === null) return new Response(null, { status: 202, headers: CORS });

  // Phase 2.5: expose remaining analyses count on analyze_bid calls
  const isAnalyzeBid = singleTool === "analyze_bid" || singleTool === "remodeleriq_analyze_bid";
  const responseHeaders: Record<string, string> = { ...JSON_HEADERS };
  if (isAnalyzeBid) {
    responseHeaders["X-RemodelerIQ-Analyses-Remaining"] = String(quota.remaining);
    responseHeaders["Access-Control-Expose-Headers"] =
      "Mcp-Session-Id, X-RemodelerIQ-Analyses-Remaining";
  }

  return new Response(JSON.stringify(res), { status: 200, headers: responseHeaders });
}
