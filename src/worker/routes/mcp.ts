// RemodelerIQ MCP server — Streamable-HTTP (JSON-RPC 2.0), hand-rolled to avoid
// the agents/zod-v4 peer conflict and keep tools in-process. Exposes the bid
// analyzer + cost + labor data to any AI agent (ChatGPT, Claude, Perplexity,
// Cursor, etc.). Stateless, public, read-only — no auth needed.
//
// Endpoint: https://mcp.remodeleriq.com/  (and https://remodeleriq.com/mcp)
// Tools: analyze_bid, get_cost_estimate, get_labor_rates

import { analyzeBid } from "@/shared/analysisEngine";
import {
  getStateAdjustedWages,
  TRADE_NAMES,
  CONTRACTOR_MULTIPLIER,
  getStateName,
  type TradeType,
} from "@/shared/blsLaborRates";
import { getZondaProjectCost, mapToZondaProjectKey } from "@/shared/zondaCostData";

const PROTOCOL_VERSION = "2025-06-18";
const SERVER_INFO = { name: "remodeleriq", version: "1.0.0" };

// ---- Tool definitions (JSON Schema inputs) ---------------------------------
const TOOLS = [
  {
    name: "analyze_bid",
    description:
      "Analyze a home-remodeling contractor's bid/estimate for fairness and risk. Returns a 0-100 confidence score, red flags (deposit traps, vague scope, missing items, payment terms), a plain-English summary, and negotiation talk tracks. Use when a homeowner asks 'is this contractor quote fair?' or shares a remodeling estimate.",
    inputSchema: {
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
      },
      required: ["bid_text"],
    },
  },
  {
    name: "get_cost_estimate",
    description:
      "Get a 2026 market cost range for a home-remodeling project in a US state/city, backed by Zonda Cost vs. Value benchmarks with regional adjustment. Use when a homeowner asks 'how much does a [kitchen/bathroom/roof/etc.] remodel cost in [place]?'",
    inputSchema: {
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
    },
  },
  {
    name: "get_labor_rates",
    description:
      "Get 2026 burdened construction trade labor rates ($/hour) for a US state, derived from BLS wage data. Returns rates by trade (carpenter, plumber, electrician, painter, etc.). Use when a homeowner asks what trade labor should cost or whether a bid's labor line is fair.",
    inputSchema: {
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
    },
  },
];

// ---- Tool handlers ---------------------------------------------------------
function txt(text: string) {
  return { content: [{ type: "text", text }] };
}

function runAnalyzeBid(args: Record<string, unknown>) {
  const bidText = String(args.bid_text || "");
  if (!bidText.trim()) return { ...txt("Error: bid_text is required."), isError: true };
  const bidTotal = typeof args.bid_total === "number" ? args.bid_total : undefined;
  const state = (String(args.state_code || "GA").toUpperCase()).slice(0, 2);
  const r = analyzeBid(bidText, bidTotal, state);
  const out = {
    confidence_score: r.confidenceScore,
    verdict:
      r.confidenceScore >= 75 ? "Looks fair" : r.confidenceScore >= 50 ? "Proceed with caution" : "High risk — scrutinize",
    summary: r.summary,
    red_flags: (r.flags || [])
      .filter((f) => f.level === "critical" || f.level === "high")
      .map((f) => ({ level: f.level, issue: f.title, detail: f.description, fix: f.recommendation })),
    missing_items: r.missingItems || [],
    negotiation_talk_track: r.talkTrack || [],
    note: "Free analysis from RemodelerIQ. Full report + saved history at https://remodeleriq.com/?view=upload",
  };
  return txt(JSON.stringify(out, null, 2));
}

function runCostEstimate(args: Record<string, unknown>) {
  const projectType = String(args.project_type || "");
  const state = String(args.state_code || "").toUpperCase().slice(0, 2);
  const cityKey = args.city_key ? String(args.city_key) : undefined;
  const key = mapToZondaProjectKey(projectType);
  if (!key) {
    return {
      ...txt(
        `Unknown project type "${projectType}". Try: kitchen-remodel, bathroom-remodel, roofing, siding, deck, addition, basement, window-replacement.`
      ),
      isError: true,
    };
  }
  const res = getZondaProjectCost(key, state, cityKey);
  if (!res) return { ...txt(`No cost data for ${projectType} in ${state}.`), isError: true };
  const low = Math.round(res.cost * 0.8);
  const high = Math.round(res.cost * 1.25);
  const out = {
    project: projectType,
    location: `${getStateName(state) || state}`,
    typical_cost: res.cost,
    range_low: low,
    range_high: high,
    regional_multiplier: res.multiplier,
    data_source: res.citation || res.sourceName,
    note: `Estimate for ${state}. Get the localized guide + check your actual bid at https://remodeleriq.com/`,
  };
  return txt(JSON.stringify(out, null, 2));
}

function runLaborRates(args: Record<string, unknown>) {
  const state = String(args.state_code || "").toUpperCase().slice(0, 2);
  if (!state) return { ...txt("Error: state_code is required."), isError: true };
  const wages = getStateAdjustedWages(state);
  const tradeFilter = args.trade ? String(args.trade).toLowerCase() : null;
  const rates = Object.entries(wages)
    .map(([trade, meanWage]) => ({
      trade: TRADE_NAMES[trade as TradeType] || trade,
      trade_key: trade,
      bls_mean_wage_per_hour: meanWage,
      fair_billed_rate_per_hour: Math.round(meanWage * CONTRACTOR_MULTIPLIER * 100) / 100,
    }))
    .filter((r) => !tradeFilter || r.trade.toLowerCase().includes(tradeFilter) || r.trade_key.includes(tradeFilter));
  const out = {
    state: getStateName(state) || state,
    note: "BLS mean wage vs. the fair billed rate (incl. ~2.8x burden for overhead, profit, insurance, equipment). 2026.",
    rates,
    full_tool: "https://remodeleriq.com/labor-rates",
  };
  return txt(JSON.stringify(out, null, 2));
}

function callTool(name: string, args: Record<string, unknown>) {
  switch (name) {
    case "analyze_bid":
      return runAnalyzeBid(args);
    case "get_cost_estimate":
      return runCostEstimate(args);
    case "get_labor_rates":
      return runLaborRates(args);
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

function handleRpc(req: RpcReq): Record<string, unknown> | null {
  const { method, id, params } = req;

  // Notifications (no id) → no response.
  if (id === undefined || id === null) {
    return null;
  }

  const ok = (result: unknown) => ({ jsonrpc: "2.0", id, result });
  const err = (code: number, message: string) => ({ jsonrpc: "2.0", id, error: { code, message } });

  switch (method) {
    case "initialize":
      return ok({
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
        instructions:
          "RemodelerIQ tools help homeowners check if a contractor's remodeling bid is fair: analyze_bid (score a quote), get_cost_estimate (2026 cost ranges), get_labor_rates (BLS trade wages).",
      });
    case "ping":
      return ok({});
    case "tools/list":
      return ok({ tools: TOOLS });
    case "tools/call": {
      const name = String(params?.name || "");
      const args = (params?.arguments as Record<string, unknown>) || {};
      try {
        return ok(callTool(name, args));
      } catch (e) {
        return ok({ ...txt(`Tool error: ${e instanceof Error ? e.message : "unknown"}`), isError: true });
      }
    }
    case "resources/list":
      return ok({ resources: [] });
    case "prompts/list":
      return ok({ prompts: [] });
    default:
      return err(-32601, `Method not found: ${method}`);
  }
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Mcp-Session-Id, Mcp-Protocol-Version, Authorization",
  "Access-Control-Expose-Headers": "Mcp-Session-Id",
};

const JSON_HEADERS = { "Content-Type": "application/json", ...CORS };

// Path-agnostic fetch handler — called directly from the worker for both
// remodeleriq.com/mcp and the mcp.remodeleriq.com subdomain root. Avoids the
// Hono prefix-strip mounting quirk that swallowed /mcp into the SPA fallback.
export async function mcpFetch(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  if (request.method === "GET") {
    return new Response(
      JSON.stringify({ name: SERVER_INFO.name, version: SERVER_INFO.version, transport: "streamable-http", hint: "POST JSON-RPC 2.0 here" }),
      { status: 200, headers: JSON_HEADERS }
    );
  }

  if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: CORS });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }), { status: 400, headers: JSON_HEADERS });
  }

  if (Array.isArray(body)) {
    const responses = (body as RpcReq[]).map(handleRpc).filter((r): r is Record<string, unknown> => r !== null);
    return new Response(JSON.stringify(responses), { status: 200, headers: JSON_HEADERS });
  }

  const res = handleRpc(body as RpcReq);
  if (res === null) return new Response(null, { status: 202, headers: CORS });
  return new Response(JSON.stringify(res), { status: 200, headers: JSON_HEADERS });
}
