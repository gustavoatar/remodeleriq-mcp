// Shared tool-result shaping for RemodelerIQ's three analyzer tools.
//
// One source of truth consumed by every "agent-reachable" surface:
//   - the MCP server (src/worker/routes/mcp.ts)        — server-side JSON-RPC
//   - WebMCP (src/react-app/lib/webmcp.ts)             — client-side navigator.modelContext
//   - the concierge assistant (src/worker/routes/concierge.ts) — Gemini function-calling
//
// Pure + framework-free so it runs identically in a Worker and in the browser
// bundle. Each function returns a discriminated result: {error} or {data}.

import { analyzeBid, type AnalysisResult } from "./analysisEngine";
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

export interface ToolResultOptions {
  // Attribution URL injected by the MCP layer (mcp.ts). Not set by browser/concierge callers.
  joinUrl?: string;
}

// ---- Phase 2.3: Stable flag ID mapping ------------------------------------
// Maps existing kebab-case flag IDs to stable uppercase taxonomy IDs.
// Unmapped IDs fall back to UPPER_SNAKE via the normalizer.
const FLAG_ID_MAP: Record<string, string> = {
  // License
  "license-missing": "LIC_MISSING_STATE",
  // Payment / deposit
  "deposit-excessive": "PAY_DEPOSIT_EXCESSIVE",
  "deposit-high": "PAY_DEPOSIT_HIGH",
  "payment-schedule-missing": "PAY_NO_MILESTONES",
  "risky-payment-split": "PAY_MILESTONE_RISKY",
  // Schedule
  "missing-timeline": "SCHED_NO_DATES",
  "no-delay-penalty": "SCHED_NO_PENALTY",
  // Change orders
  "missing-change-order-process": "CO_PROCESS_MISSING",
  "financial-change-order": "CO_MARKUP_HIGH",
  "change-order-critical": "CO_MARKUP_HIGH",
  "change-order-high": "CO_MARKUP_RISKY",
  "change-order-medium": "CO_MARKUP_MODERATE",
  // Contract risk
  "binding-arbitration": "CONTRACT_ARBITRATION",
  "liability-waiver": "CONTRACT_LIABILITY_WAIVER",
  "auto-approval-extras": "CONTRACT_AUTO_APPROVAL_EXTRAS",
  "uncapped-time-materials": "CONTRACT_UNCAPPED_TM",
  // Permits
  "permit-not-mentioned": "PERMIT_RESPONSIBILITY_UNCLEAR",
  "homeowner-permit-risk": "PERMIT_HOMEOWNER_RISK",
  // Scope
  "scope-critical-missing": "SCOPE_MISSING_TRADE",
  "scope-important-missing": "SCOPE_ITEM_UNCLEAR",
  "vague-scope": "SCOPE_HIGHLY_VAGUE",
  "scope-highly-vague": "SCOPE_HIGHLY_VAGUE",
  "scope-moderately-vague": "SCOPE_MODERATELY_VAGUE",
  "vague-terms-critical": "SCOPE_VAGUE_TERMS_CRITICAL",
  "vague-terms-high": "SCOPE_VAGUE_TERMS_HIGH",
  "vague-terms-medium": "SCOPE_VAGUE_TERMS_MEDIUM",
  // Price / labor
  "labor-ratio-high": "PRICE_LABOR_HIGH",
  "labor-ratio-low": "PRICE_LABOR_LOW",
  "price-lowball-risk": "PRICE_LOWBALL_RISK",
  "price-above-market": "PRICE_ABOVE_MARKET",
  "contingency-low": "PRICE_CONTING_LOW",
  "contingency-missing": "PRICE_CONTING_MISSING",
  // Safety
  "lead-safety-missing": "SAFE_LEAD_MISSING",
  "deck-ledger-flashing": "SAFE_LEDGER_FLASHING",
  "deck-footing-depth": "SAFE_FOOTING_DEPTH",
  // Code / QOL
  "basement-egress": "CODE_EGRESS_MISSING",
  "kitchen-task-lighting": "QOL_TASK_LIGHTING",
  "kitchen-ventilation": "QOL_VENTILATION",
  "kitchen-work-triangle": "QOL_WORK_TRIANGLE",
  "basement-soundproofing": "QOL_SOUNDPROOFING",
  "basement-waterproofing": "QOL_WATERPROOFING",
  "qol-debris-removal": "QOL_DEBRIS_REMOVAL",
  "qol-daily-cleanup": "QOL_DAILY_CLEANUP",
  "qol-final-walkthrough": "QOL_FINAL_WALKTHROUGH",
};

export function toStableFlagId(rawId: string): string {
  if (!rawId) return "UNKNOWN";
  return FLAG_ID_MAP[rawId] ?? rawId.toUpperCase().replace(/-/g, "_");
}

// ---- Phase 2.2: Attribution meta block ------------------------------------
function makeAttribution(joinUrl: string) {
  return {
    source: "RemodelerIQ",
    join_url: joinUrl,
    contact: "help@remodeleriq.com",
  };
}

// ---- analyze_bid (full — returns raw AnalysisResult alongside formatted response) ---
// Used by the MCP layer to get both the tool payload AND the raw result for corpus write.
export function analyzeBidFull(
  bidText: string,
  bidTotal?: number,
  stateCodeRaw?: string,
  opts?: ToolResultOptions,
  squareFootage?: number,
  finishTier?: string,
  scopeDepth?: string,
): { toolResult: ToolResult; rawResult: AnalysisResult | null } {
  if (!bidText || !bidText.trim()) {
    return { toolResult: { error: "bid_text is required." }, rawResult: null };
  }
  const state = String(stateCodeRaw || "GA").toUpperCase().slice(0, 2);
  const r = analyzeBid(bidText, typeof bidTotal === "number" ? bidTotal : undefined, state, undefined, undefined, undefined, squareFootage, finishTier, scopeDepth);
  const joinUrl = opts?.joinUrl ?? "https://remodeleriq.com/join";

  // Phase 2.3: stable flag IDs on red_flags
  const redFlags = (r.flags || [])
    .filter((f) => f.level === "critical" || f.level === "high")
    .map((f) => ({
      level: f.level,
      issue: f.title,
      detail: f.description,
      fix: f.recommendation,
      flag_id: toStableFlagId(f.id || ""),
    }));

  // Phase 2.6: score breakdown from unified score dimensions
  const dims = r.unifiedScore?.dimensions;
  const scoreBreakdown = dims
    ? {
        contract_clarity: Math.round(dims.contractRisk.score),
        contract_weight: dims.contractRisk.weight,
        scope_completeness: Math.round(dims.scopeCompleteness.score),
        scope_weight: dims.scopeCompleteness.weight,
        price_realism: Math.round(dims.priceReasonableness.score),
        price_weight: dims.priceReasonableness.weight,
        final: r.confidenceScore,
      }
    : undefined;

  return {
    toolResult: {
      data: {
        confidence_score: r.confidenceScore,
        verdict:
          r.confidenceScore >= 75
            ? "Looks fair"
            : r.confidenceScore >= 50
            ? "Proceed with caution"
            : "High risk — scrutinize",
        summary: r.summary,
        red_flags: redFlags,
        missing_items: r.missingItems || [],
        negotiation_talk_track: r.talkTrack || [],
        ...(scoreBreakdown ? { score_breakdown: scoreBreakdown } : {}),
        // Phase 2.2: attribution moved out of data.note and into _meta
        _meta: { attribution: makeAttribution(joinUrl) },
      },
    },
    rawResult: r,
  };
}

// ---- analyze_bid -----------------------------------------------------------
export function analyzeBidResult(
  bidText: string,
  bidTotal?: number,
  stateCodeRaw?: string,
  opts?: ToolResultOptions
): ToolResult {
  if (!bidText || !bidText.trim()) return { error: "bid_text is required." };
  const state = String(stateCodeRaw || "GA").toUpperCase().slice(0, 2);
  const r = analyzeBid(bidText, typeof bidTotal === "number" ? bidTotal : undefined, state);
  const joinUrl = opts?.joinUrl ?? "https://remodeleriq.com/join";

  const redFlags = (r.flags || [])
    .filter((f) => f.level === "critical" || f.level === "high")
    .map((f) => ({
      level: f.level,
      issue: f.title,
      detail: f.description,
      fix: f.recommendation,
      flag_id: toStableFlagId(f.id || ""),
    }));

  const dims = r.unifiedScore?.dimensions;
  const scoreBreakdown = dims
    ? {
        contract_clarity: Math.round(dims.contractRisk.score),
        contract_weight: dims.contractRisk.weight,
        scope_completeness: Math.round(dims.scopeCompleteness.score),
        scope_weight: dims.scopeCompleteness.weight,
        price_realism: Math.round(dims.priceReasonableness.score),
        price_weight: dims.priceReasonableness.weight,
        final: r.confidenceScore,
      }
    : undefined;

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
      red_flags: redFlags,
      missing_items: r.missingItems || [],
      negotiation_talk_track: r.talkTrack || [],
      ...(scoreBreakdown ? { score_breakdown: scoreBreakdown } : {}),
      _meta: { attribution: makeAttribution(joinUrl) },
    },
  };
}

// ---- get_cost_estimate -----------------------------------------------------
export function costEstimateResult(
  projectType: string,
  stateCodeRaw: string,
  cityKey?: string,
  opts?: ToolResultOptions
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
      note: "2026 Zonda Cost vs. Value benchmark. Actual costs vary by city, finish tier, and site conditions.",
      _meta: {
        attribution: makeAttribution(opts?.joinUrl ?? "https://remodeleriq.com/join"),
      },
    },
  };
}

// ---- get_labor_rates -------------------------------------------------------
export function laborRatesResult(stateCodeRaw: string, tradeRaw?: string, opts?: ToolResultOptions): ToolResult {
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
      _meta: {
        attribution: makeAttribution(opts?.joinUrl ?? "https://remodeleriq.com/join"),
      },
    },
  };
}
