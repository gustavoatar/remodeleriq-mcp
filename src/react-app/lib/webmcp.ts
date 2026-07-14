// WebMCP registration — exposes RemodelerIQ's 3 analyzer tools to AI browsers
// (Gemini-in-Chrome, agentic browsers) via the navigator.modelContext API so an
// agent can run a bid check ON the site, no copy/paste. All three tools resolve
// client-side against the shared pure functions (src/shared/toolResults.ts) — no
// network round-trip. Feature-detected: a no-op on browsers without the API
// (incl. the prerender/puppeteer pass), so it's always safe to ship.

import {
  analyzeBidResult,
  costEstimateResult,
  laborRatesResult,
  isToolError,
  type ToolResult,
} from "@/shared/toolResults";

// Minimal shape of the origin-trial API (no official TS types yet).
interface WebMcpToolDescriptor {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<{ content: Array<{ type: "text"; text: string }> }>;
}
interface ModelContext {
  registerTool?: (tool: WebMcpToolDescriptor) => void;
  provideContext?: (ctx: { tools: WebMcpToolDescriptor[] }) => void;
}

function asContent(r: ToolResult) {
  const text = isToolError(r) ? `Error: ${r.error}` : JSON.stringify(r.data, null, 2);
  return { content: [{ type: "text" as const, text }] };
}

const TOOLS: WebMcpToolDescriptor[] = [
  {
    name: "analyze_bid",
    description:
      "Analyze a home-remodeling contractor's bid/estimate for fairness and risk. Returns a 0-100 confidence score, red flags, a plain-English summary, and negotiation talk tracks. Use when a homeowner asks 'is this contractor quote fair?'",
    inputSchema: {
      type: "object",
      properties: {
        bid_text: { type: "string", description: "The full text of the contractor's bid/estimate." },
        bid_total: { type: "number", description: "The total dollar amount of the bid, if known." },
        state_code: { type: "string", description: "Two-letter US state code (e.g. 'TX', 'GA'). Defaults to GA." },
      },
      required: ["bid_text"],
    },
    execute: async (a) =>
      asContent(analyzeBidResult(String(a.bid_text || ""), typeof a.bid_total === "number" ? a.bid_total : undefined, a.state_code as string | undefined)),
  },
  {
    name: "get_cost_estimate",
    description:
      "Get a 2026 market cost range for a home-remodeling project in a US state/city, backed by Zonda Cost vs. Value benchmarks. Use when a homeowner asks 'how much does a [kitchen/bath/roof] remodel cost in [place]?'",
    inputSchema: {
      type: "object",
      properties: {
        project_type: { type: "string", description: "e.g. 'kitchen-remodel', 'bathroom-remodel', 'roofing', 'siding', 'deck', 'addition', 'basement'." },
        state_code: { type: "string", description: "Two-letter US state code." },
        city_key: { type: "string", description: "Optional city slug (e.g. 'atlanta-ga')." },
      },
      required: ["project_type", "state_code"],
    },
    execute: async (a) =>
      asContent(costEstimateResult(String(a.project_type || ""), String(a.state_code || ""), a.city_key ? String(a.city_key) : undefined)),
  },
  {
    name: "get_labor_rates",
    description:
      "Get 2026 burdened construction trade labor rates ($/hour) for a US state, derived from BLS wage data. Use when a homeowner asks what trade labor should cost.",
    inputSchema: {
      type: "object",
      properties: {
        state_code: { type: "string", description: "Two-letter US state code." },
        trade: { type: "string", description: "Optional trade filter (e.g. 'plumber', 'electrician')." },
      },
      required: ["state_code"],
    },
    execute: async (a) => asContent(laborRatesResult(String(a.state_code || ""), a.trade ? String(a.trade) : undefined)),
  },
];

export function initWebMcp(): void {
  try {
    if (typeof navigator === "undefined" || !("modelContext" in navigator)) return;
    const mc = (navigator as unknown as { modelContext?: ModelContext }).modelContext;
    if (!mc) return;
    // Prefer per-tool registration; fall back to the batch provideContext shape.
    if (typeof mc.registerTool === "function") {
      TOOLS.forEach((t) => mc.registerTool!(t));
    } else if (typeof mc.provideContext === "function") {
      mc.provideContext({ tools: TOOLS });
    }
  } catch {
    /* WebMCP is a progressive enhancement — never let it break page load */
  }
}
