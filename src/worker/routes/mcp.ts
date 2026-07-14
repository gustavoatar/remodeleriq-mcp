// RemodelerIQ MCP server — Streamable-HTTP (JSON-RPC 2.0), hand-rolled to avoid
// the agents/zod-v4 peer conflict and keep tools in-process. Exposes the bid
// analyzer + cost + labor data to any AI agent (ChatGPT, Claude, Perplexity,
// Cursor, etc.). Stateless, public, read-only — no auth needed.
//
// Endpoint: https://mcp.remodeleriq.com/  (and https://remodeleriq.com/mcp)
// Tools: analyze_bid, get_cost_estimate, get_labor_rates

import { analyzeBidResult, costEstimateResult, laborRatesResult, isToolError } from "@/shared/toolResults";
import { BID_WIDGET_URI, BID_WIDGET_HTML } from "./bidWidgetHtml";

const PROTOCOL_VERSION = "2025-06-18";
const SERVER_INFO = { name: "remodeleriq", version: "1.0.0" };

// Apps SDK widget metadata (required for ChatGPT app submission). The widget is
// fully self-contained (inline HTML/CSS/JS, no external fetches or assets), so
// the CSP is empty except the "full report" link out to remodeleriq.com. Both
// snake_case and *_domains variants are included to satisfy either spec version.
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
    annotations: {
      title: "Analyze a contractor's bid",
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: false,
      destructiveHint: false,
    },
    // ChatGPT Apps SDK: render the result with the bid-result card widget.
    _meta: { "openai/outputTemplate": BID_WIDGET_URI },
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
    annotations: {
      title: "Estimate remodel cost",
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: false,
      destructiveHint: false,
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
    annotations: {
      title: "Look up trade labor rates",
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: false,
      destructiveHint: false,
    },
  },
];

// ---- Tool handlers ---------------------------------------------------------
function txt(text: string) {
  return { content: [{ type: "text", text }] };
}

// Wrap a shared ToolResult into the MCP text-content envelope.
function wrap(r: ReturnType<typeof analyzeBidResult>) {
  if (isToolError(r)) return { ...txt(`Error: ${r.error}`), isError: true };
  return txt(JSON.stringify(r.data, null, 2));
}

function runAnalyzeBid(args: Record<string, unknown>) {
  const bidTotal = typeof args.bid_total === "number" ? args.bid_total : undefined;
  const r = analyzeBidResult(String(args.bid_text || ""), bidTotal, args.state_code as string | undefined);
  if (isToolError(r)) return { ...txt(`Error: ${r.error}`), isError: true };
  // Include structuredContent + widget template so ChatGPT (Apps SDK) can render
  // the bid-result card. Plain MCP clients ignore these and use the text content.
  return {
    ...txt(JSON.stringify(r.data, null, 2)),
    structuredContent: r.data,
    _meta: { "openai/outputTemplate": BID_WIDGET_URI },
  };
}

function runCostEstimate(args: Record<string, unknown>) {
  return wrap(
    costEstimateResult(
      String(args.project_type || ""),
      String(args.state_code || ""),
      args.city_key ? String(args.city_key) : undefined
    )
  );
}

function runLaborRates(args: Record<string, unknown>) {
  return wrap(laborRatesResult(String(args.state_code || ""), args.trade ? String(args.trade) : undefined));
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
        capabilities: { tools: {}, resources: {} },
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
// Minimal env shape this handler needs — D1 for usage logging + the rate guard.
type McpEnv = { DB?: D1Database } | undefined;

// Generous cap: the tools are cheap in-process lookups (no external cost), so
// this only exists to stop a runaway loop hammering the public endpoint.
const RATE_LIMIT_PER_MIN = 120;

async function isRateLimited(env: McpEnv, ip: string | null): Promise<boolean> {
  if (!env?.DB || !ip) return false;
  try {
    const row = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM mcp_usage WHERE ip = ? AND created_at > datetime('now','-60 seconds')"
    ).bind(ip).first<{ n: number }>();
    return (row?.n ?? 0) >= RATE_LIMIT_PER_MIN;
  } catch {
    return false; // never block real traffic on a logging failure
  }
}

async function logToolCall(env: McpEnv, tool: string, ip: string | null, ua: string | null): Promise<void> {
  if (!env?.DB || !tool) return;
  try {
    await env.DB.prepare("INSERT INTO mcp_usage (tool, ip, ua) VALUES (?, ?, ?)")
      .bind(tool, ip, ua ? ua.slice(0, 200) : null).run();
  } catch {
    /* best-effort — usage logging must never break a tool call */
  }
}

function toolNameOf(body: unknown): string | null {
  const b = body as RpcReq | undefined;
  if (b && b.method === "tools/call") return String((b.params as Record<string, unknown>)?.name || "unknown");
  return null;
}

export async function mcpFetch(request: Request, env?: McpEnv): Promise<Response> {
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

  const ip = request.headers.get("cf-connecting-ip");
  const ua = request.headers.get("user-agent");
  const singleTool = Array.isArray(body) ? null : toolNameOf(body);

  // Light per-IP rate guard, tool calls only.
  if (singleTool && (await isRateLimited(env, ip))) {
    return new Response(
      JSON.stringify({ jsonrpc: "2.0", id: (body as RpcReq).id ?? null, error: { code: -32029, message: "Rate limit exceeded. Try again in a minute." } }),
      { status: 429, headers: JSON_HEADERS }
    );
  }

  if (Array.isArray(body)) {
    const responses = (body as RpcReq[]).map(handleRpc).filter((r): r is Record<string, unknown> => r !== null);
    for (const b of body as RpcReq[]) {
      const t = toolNameOf(b);
      if (t) await logToolCall(env, t, ip, ua);
    }
    return new Response(JSON.stringify(responses), { status: 200, headers: JSON_HEADERS });
  }

  const res = handleRpc(body as RpcReq);
  if (singleTool) await logToolCall(env, singleTool, ip, ua);
  if (res === null) return new Response(null, { status: 202, headers: CORS });
  return new Response(JSON.stringify(res), { status: 200, headers: JSON_HEADERS });
}
