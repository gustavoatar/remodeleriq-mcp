// Shared tool-result shaping for RemodelerIQ's three analyzer tools.
//
// One source of truth consumed by every "agent-reachable" surface:
//   - the MCP server (src/worker/routes/mcp.ts)        — server-side JSON-RPC
//   - WebMCP (src/react-app/lib/webmcp.ts)             — client-side navigator.modelContext
//   - the concierge assistant (src/worker/routes/concierge.ts) — Gemini function-calling
//
// Pure + framework-free so it runs identically in a Worker and in the browser
// bundle. Each function returns a discriminated result: {error} or {data}.

import { analyzeBid } from "./analysisEngine";
import { getZondaProjectCost, mapToZondaProjectKey } from "./zondaCostData";
import {
  getStateAdjustedWages,
  TRADE_NAMES,
  CONTRACTOR_MULTIPLIER,
  getStateName,
  type TradeType,
} from "./blsLaborRates";

export type ToolResult<T = Record<string, unknown>> = { error: string } | { data: T };

export function isToolError<T>(r: ToolResult<T>): r is { error: string } {
  return "error" in r;
}

// ---- analyze_bid -----------------------------------------------------------
export function analyzeBidResult(
  bidText: string,
  bidTotal?: number,
  stateCodeRaw?: string
): ToolResult {
  if (!bidText || !bidText.trim()) return { error: "bid_text is required." };
  const state = String(stateCodeRaw || "GA").toUpperCase().slice(0, 2);
  const r = analyzeBid(bidText, typeof bidTotal === "number" ? bidTotal : undefined, state);
  return {
    data: {
      confidence_score: r.confidenceScore,
      verdict:
        r.confidenceScore >= 75
          ? "Looks fair"
          : r.confidenceScore >= 50
          ? "Proceed with caution"
          : "High risk — scrutinize",
      summary: r.summary,
      red_flags: (r.flags || [])
        .filter((f) => f.level === "critical" || f.level === "high")
        .map((f) => ({ level: f.level, issue: f.title, detail: f.description, fix: f.recommendation })),
      missing_items: r.missingItems || [],
      negotiation_talk_track: r.talkTrack || [],
      note: "Free analysis from RemodelerIQ. Full report + saved history at https://remodeleriq.com/?view=upload",
    },
  };
}

// ---- get_cost_estimate -----------------------------------------------------
export function costEstimateResult(
  projectType: string,
  stateCodeRaw: string,
  cityKey?: string
): ToolResult {
  const state = String(stateCodeRaw || "").toUpperCase().slice(0, 2);
  const key = mapToZondaProjectKey(projectType);
  if (!key) {
    return {
      error: `Unknown project type "${projectType}". Try: kitchen-remodel, bathroom-remodel, roofing, siding, deck, addition, basement, window-replacement.`,
    };
  }
  const res = getZondaProjectCost(key, state, cityKey);
  if (!res) return { error: `No cost data for ${projectType} in ${state}.` };
  const low = Math.round(res.cost * 0.8);
  const high = Math.round(res.cost * 1.25);
  return {
    data: {
      project: projectType,
      location: getStateName(state) || state,
      typical_cost: res.cost,
      range_low: low,
      range_high: high,
      regional_multiplier: res.multiplier,
      data_source: res.citation || res.sourceName,
      note: `Estimate for ${state}. Get the localized guide + check your actual bid at https://remodeleriq.com/`,
    },
  };
}

// ---- get_labor_rates -------------------------------------------------------
export function laborRatesResult(stateCodeRaw: string, tradeRaw?: string): ToolResult {
  const state = String(stateCodeRaw || "").toUpperCase().slice(0, 2);
  if (!state) return { error: "state_code is required." };
  const wages = getStateAdjustedWages(state);
  const tradeFilter = tradeRaw ? String(tradeRaw).toLowerCase() : null;
  const rates = Object.entries(wages)
    .map(([trade, meanWage]) => ({
      trade: TRADE_NAMES[trade as TradeType] || trade,
      trade_key: trade,
      bls_mean_wage_per_hour: meanWage,
      fair_billed_rate_per_hour: Math.round(meanWage * CONTRACTOR_MULTIPLIER * 100) / 100,
    }))
    .filter(
      (r) => !tradeFilter || r.trade.toLowerCase().includes(tradeFilter) || r.trade_key.includes(tradeFilter)
    );
  return {
    data: {
      state: getStateName(state) || state,
      note: "BLS mean wage vs. the fair billed rate (incl. ~2.8x burden for overhead, profit, insurance, equipment). 2026.",
      rates,
      full_tool: "https://remodeleriq.com/labor-rates",
    },
  };
}
