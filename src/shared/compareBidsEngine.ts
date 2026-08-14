// Compare 2–5 contractor bids side-by-side.
// Returns per-trade cost comparison, scope-gap matrix, apples-to-apples adjusted totals,
// outlier flags, winner recommendation, and consolidated red flags.
//
// Each analyzed bid's AnalysisResult is also returned so the MCP layer can
// write corpus records for every bid in a single comparison call.

import { analyzeBid, type AnalysisResult, type CorpusTradeKey } from './analysisEngine';

// ---- Flag ID normalization (mirrors toolResults.ts FLAG_ID_MAP) ------------
const FLAG_ID_MAP: Record<string, string> = {
  'license-missing': 'LIC_MISSING_STATE',
  'deposit-excessive': 'PAY_DEPOSIT_EXCESSIVE',
  'deposit-high': 'PAY_DEPOSIT_HIGH',
  'payment-schedule-missing': 'PAY_NO_MILESTONES',
  'risky-payment-split': 'PAY_MILESTONE_RISKY',
  'missing-timeline': 'SCHED_NO_DATES',
  'no-delay-penalty': 'SCHED_NO_PENALTY',
  'missing-change-order-process': 'CO_PROCESS_MISSING',
  'financial-change-order': 'CO_MARKUP_HIGH',
  'change-order-critical': 'CO_MARKUP_HIGH',
  'change-order-high': 'CO_MARKUP_RISKY',
  'change-order-medium': 'CO_MARKUP_MODERATE',
  'binding-arbitration': 'CONTRACT_ARBITRATION',
  'liability-waiver': 'CONTRACT_LIABILITY_WAIVER',
  'auto-approval-extras': 'CONTRACT_AUTO_APPROVAL_EXTRAS',
  'uncapped-time-materials': 'CONTRACT_UNCAPPED_TM',
  'permit-not-mentioned': 'PERMIT_RESPONSIBILITY_UNCLEAR',
  'homeowner-permit-risk': 'PERMIT_HOMEOWNER_RISK',
  'scope-critical-missing': 'SCOPE_MISSING_TRADE',
  'scope-important-missing': 'SCOPE_ITEM_UNCLEAR',
  'vague-scope': 'SCOPE_HIGHLY_VAGUE',
  'scope-highly-vague': 'SCOPE_HIGHLY_VAGUE',
  'scope-moderately-vague': 'SCOPE_MODERATELY_VAGUE',
  'vague-terms-critical': 'SCOPE_VAGUE_TERMS_CRITICAL',
  'vague-terms-high': 'SCOPE_VAGUE_TERMS_HIGH',
  'vague-terms-medium': 'SCOPE_VAGUE_TERMS_MEDIUM',
  'labor-ratio-high': 'PRICE_LABOR_HIGH',
  'labor-ratio-low': 'PRICE_LABOR_LOW',
  'price-lowball-risk': 'PRICE_LOWBALL_RISK',
  'price-above-market': 'PRICE_ABOVE_MARKET',
  'contingency-low': 'PRICE_CONTING_LOW',
  'contingency-missing': 'PRICE_CONTING_MISSING',
  'lead-safety-missing': 'SAFE_LEAD_MISSING',
  'deck-ledger-flashing': 'SAFE_LEDGER_FLASHING',
  'deck-footing-depth': 'SAFE_FOOTING_DEPTH',
  'basement-egress': 'CODE_EGRESS_MISSING',
  'kitchen-task-lighting': 'QOL_TASK_LIGHTING',
  'kitchen-ventilation': 'QOL_VENTILATION',
  'kitchen-work-triangle': 'QOL_WORK_TRIANGLE',
  'basement-soundproofing': 'QOL_SOUNDPROOFING',
  'basement-waterproofing': 'QOL_WATERPROOFING',
  'qol-debris-removal': 'QOL_DEBRIS_REMOVAL',
  'qol-daily-cleanup': 'QOL_DAILY_CLEANUP',
  'qol-final-walkthrough': 'QOL_FINAL_WALKTHROUGH',
};

function stableId(rawId: string): string {
  if (!rawId) return 'UNKNOWN';
  return FLAG_ID_MAP[rawId] ?? rawId.toUpperCase().replace(/-/g, '_');
}

// ============================================================================
// PUBLIC TYPES
// ============================================================================

export interface BidInput {
  bid_text: string;
  bid_total?: number;
  label?: string;
  state_code?: string;
  square_footage?: number;
  finish_tier?: string;
  scope_depth?: string;
}

export interface CostComparisonRow {
  trade: string;
  values: Array<{ label: string; amount: number | null }>;
  lowest_label: string | null;
  highest_label: string | null;
  variance_pct: number | null;
}

export interface ScopeGap {
  trade: string;
  present_in: string[];
  missing_in: string[];
  estimated_gap_value: number | null;
}

export interface AdjustedBid {
  label: string;
  stated_total: number | null;
  scope_adjustment: number;
  adjusted_total: number | null;
}

export interface OutlierFlag {
  bid_label: string;
  trade: string;
  amount: number;
  vs_median_pct: number;
  direction: 'high' | 'low';
}

export interface ComparedFlag {
  bid_label: string;
  flag_id: string;
  issue: string;
  level: string;
  fix: string;
}

export interface BidSummary {
  label: string;
  confidence_score: number;
  verdict: string;
  total: number | null;
  adjusted_total: number | null;
  critical_flags: number;
  high_flags: number;
  top_flags: Array<{ flag_id: string; issue: string; level: string }>;
}

export interface BidComparisonResult {
  bid_count: number;
  bids: BidSummary[];
  winner: { label: string; reason: string } | null;
  cost_comparison: CostComparisonRow[];
  scope_gaps: ScopeGap[];
  apples_to_apples: AdjustedBid[];
  outlier_flags: OutlierFlag[];
  all_flags: ComparedFlag[];
  _meta: {
    attribution: { source: string; join_url: string; contact: string };
    rule_version: string;
  };
}

export interface CompareBidsOptions {
  joinUrl?: string;
  ruleVersion?: string;
}

// Returned by compareBidsFull so the caller can write corpus records per bid
export interface CompareBidsFullResult {
  comparison: BidComparisonResult;
  rawResults: AnalysisResult[];
}

// ============================================================================
// INTERNAL TYPE
// ============================================================================

interface AnalyzedBid {
  label: string;
  input: BidInput;
  result: AnalysisResult;
  tradeAmounts: Map<CorpusTradeKey, number>;
  presentTrades: Set<CorpusTradeKey>;
}

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================

export function compareBidsFull(
  bids: BidInput[],
  opts?: CompareBidsOptions,
): CompareBidsFullResult {
  if (bids.length < 2 || bids.length > 5) {
    throw new Error('compare_bids requires between 2 and 5 bids');
  }

  // --- Step 1: Analyze each bid ---
  const analyzed: AnalyzedBid[] = bids.map((bid, idx) => {
    const label = bid.label?.trim() || `Bid ${String.fromCharCode(65 + idx)}`;
    const stateCode = (bid.state_code || 'GA').toUpperCase().slice(0, 2);
    const result = analyzeBid(
      bid.bid_text,
      bid.bid_total,
      stateCode,
      undefined,   // marketEstimate
      undefined,   // contractorTrust
      undefined,   // yearBuilt
      bid.square_footage,
      bid.finish_tier,
      bid.scope_depth,
    );

    const tradeAmounts = new Map<CorpusTradeKey, number>();
    const presentTrades = new Set<CorpusTradeKey>();
    for (const item of result.lineItems ?? []) {
      presentTrades.add(item.trade);
      if (item.extended_price != null) {
        tradeAmounts.set(item.trade, (tradeAmounts.get(item.trade) ?? 0) + item.extended_price);
      }
    }
    return { label, input: bid, result, tradeAmounts, presentTrades };
  });

  // --- Step 2: Collect trades ---
  // sharedTrades: trades with a dollar amount in ≥2 bids (for comparison table)
  // allTrades: every trade present in any bid, excluding 'other' (for scope gaps)
  const tradePriceCounts = new Map<CorpusTradeKey, number>();
  const allTrades = new Set<CorpusTradeKey>();
  for (const a of analyzed) {
    for (const t of a.presentTrades) {
      if (t !== 'other') allTrades.add(t);
    }
    for (const t of a.tradeAmounts.keys()) {
      if (t !== 'other') tradePriceCounts.set(t, (tradePriceCounts.get(t) ?? 0) + 1);
    }
  }
  const sharedTrades = Array.from(tradePriceCounts.entries())
    .filter(([, n]) => n >= 2)
    .map(([t]) => t);

  // --- Step 3: Cost comparison table ---
  const costComparison: CostComparisonRow[] = sharedTrades
    .map(trade => {
      const values = analyzed.map(a => ({
        label: a.label,
        amount: a.tradeAmounts.get(trade) ?? null,
      }));
      const priced = values.filter(v => v.amount != null) as Array<{ label: string; amount: number }>;
      const amounts = priced.map(v => v.amount);
      const minAmt = Math.min(...amounts);
      const maxAmt = Math.max(...amounts);
      const variancePct = minAmt > 0 ? Math.round(((maxAmt - minAmt) / minAmt) * 100) : null;
      return {
        trade,
        values,
        lowest_label: priced.find(v => v.amount === minAmt)?.label ?? null,
        highest_label: priced.find(v => v.amount === maxAmt)?.label ?? null,
        variance_pct: variancePct,
      };
    })
    .sort((a, b) => (b.variance_pct ?? 0) - (a.variance_pct ?? 0)); // highest variance first

  // --- Step 4: Scope-gap matrix ---
  const scopeGaps: ScopeGap[] = [];
  for (const trade of allTrades) {
    const presentIn = analyzed.filter(a => a.presentTrades.has(trade)).map(a => a.label);
    const missingIn = analyzed.filter(a => !a.presentTrades.has(trade)).map(a => a.label);
    if (missingIn.length === 0) continue; // all bids include it — no gap
    const amounts = analyzed
      .filter(a => a.tradeAmounts.has(trade))
      .map(a => a.tradeAmounts.get(trade) as number);
    const estimatedGapValue = amounts.length > 0
      ? Math.round(amounts.reduce((s, v) => s + v, 0) / amounts.length)
      : null;
    scopeGaps.push({ trade, present_in: presentIn, missing_in: missingIn, estimated_gap_value: estimatedGapValue });
  }

  // --- Step 5: Apples-to-apples adjusted totals ---
  // For each bid, add the average cost of trades it's missing but others have.
  const applesToApples: AdjustedBid[] = analyzed.map(a => {
    const statedTotal = a.input.bid_total ?? null;
    const scopeAdjustment = scopeGaps
      .filter(g => g.missing_in.includes(a.label) && g.estimated_gap_value != null)
      .reduce((sum, g) => sum + (g.estimated_gap_value as number), 0);
    return {
      label: a.label,
      stated_total: statedTotal,
      scope_adjustment: scopeAdjustment,
      adjusted_total: statedTotal != null ? statedTotal + scopeAdjustment : null,
    };
  });

  // --- Step 6: Outlier detection (per trade, ≥2x or ≤0.5x the median) ---
  const outlierFlags: OutlierFlag[] = [];
  for (const row of costComparison) {
    const priced = row.values.filter(v => v.amount != null) as Array<{ label: string; amount: number }>;
    if (priced.length < 2) continue;
    const sorted = priced.map(v => v.amount).sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    if (median === 0) continue;
    for (const { label, amount } of priced) {
      const ratio = amount / median;
      if (ratio >= 2.0) {
        outlierFlags.push({ bid_label: label, trade: row.trade, amount, vs_median_pct: Math.round((ratio - 1) * 100), direction: 'high' });
      } else if (ratio <= 0.5) {
        outlierFlags.push({ bid_label: label, trade: row.trade, amount, vs_median_pct: Math.round((1 - ratio) * 100), direction: 'low' });
      }
    }
  }

  // --- Step 7: Consolidated flags (critical + high across all bids) ---
  const allFlags: ComparedFlag[] = analyzed.flatMap(a =>
    (a.result.flags ?? [])
      .filter(f => f.level === 'critical' || f.level === 'high')
      .map(f => ({
        bid_label: a.label,
        flag_id: stableId(f.id ?? ''),
        issue: f.title,
        level: f.level,
        fix: f.recommendation,
      }))
  );

  // --- Step 8: Winner ---
  const winner = pickWinner(analyzed, applesToApples);

  // --- Step 9: Per-bid summaries ---
  const bidSummaries: BidSummary[] = analyzed.map(a => {
    const adj = applesToApples.find(x => x.label === a.label);
    const critFlags = (a.result.flags ?? []).filter(f => f.level === 'critical');
    const highFlags = (a.result.flags ?? []).filter(f => f.level === 'high');
    return {
      label: a.label,
      confidence_score: a.result.confidenceScore,
      verdict: a.result.confidenceScore >= 75 ? 'Looks fair'
        : a.result.confidenceScore >= 50 ? 'Proceed with caution'
        : 'High risk — scrutinize',
      total: a.input.bid_total ?? null,
      adjusted_total: adj?.adjusted_total ?? null,
      critical_flags: critFlags.length,
      high_flags: highFlags.length,
      top_flags: [...critFlags, ...highFlags].slice(0, 3).map(f => ({
        flag_id: stableId(f.id ?? ''),
        issue: f.title,
        level: f.level,
      })),
    };
  });

  const joinUrl = opts?.joinUrl ?? 'https://remodeleriq.com/join';

  return {
    comparison: {
      bid_count: bids.length,
      bids: bidSummaries,
      winner,
      cost_comparison: costComparison,
      scope_gaps: scopeGaps,
      apples_to_apples: applesToApples,
      outlier_flags: outlierFlags,
      all_flags: allFlags,
      _meta: {
        attribution: { source: 'RemodelerIQ', join_url: joinUrl, contact: 'help@remodeleriq.com' },
        rule_version: opts?.ruleVersion ?? '2026.08.1',
      },
    },
    rawResults: analyzed.map(a => a.result),
  };
}

// ============================================================================
// WINNER SELECTION
// ============================================================================

function pickWinner(
  analyzed: AnalyzedBid[],
  applesToApples: AdjustedBid[],
): BidComparisonResult['winner'] {
  if (analyzed.length === 0) return null;

  const hasTotals = applesToApples.some(a => a.adjusted_total != null);

  // Penalty score per bid (lower = better):
  //   confidence penalty: 100 - score  (weak analysis engine = risk)
  //   risk penalty: critical*30 + high*12
  //   price penalty: 0 (cheapest) to 50 (most expensive adjusted)
  const scored = analyzed.map(a => {
    const adj = applesToApples.find(x => x.label === a.label);
    const critCount = (a.result.flags ?? []).filter(f => f.level === 'critical').length;
    const highCount = (a.result.flags ?? []).filter(f => f.level === 'high').length;
    return {
      label: a.label,
      adjustedTotal: adj?.adjusted_total ?? null,
      confidencePenalty: 100 - a.result.confidenceScore,
      riskPenalty: critCount * 30 + highCount * 12,
      critCount,
      score: a.result.confidenceScore,
    };
  });

  // Normalize price into a 0–50 additive penalty
  const pricePenalty = new Map<string, number>();
  if (hasTotals) {
    const totals = scored.filter(s => s.adjustedTotal != null).map(s => s.adjustedTotal as number);
    const minT = Math.min(...totals);
    const maxT = Math.max(...totals);
    const range = maxT - minT || 1;
    for (const s of scored) {
      pricePenalty.set(
        s.label,
        s.adjustedTotal != null ? Math.round(((s.adjustedTotal - minT) / range) * 50) : 50,
      );
    }
  }

  const ranked = scored
    .map(s => ({
      label: s.label,
      penalty: s.confidencePenalty + s.riskPenalty + (pricePenalty.get(s.label) ?? 0),
      critCount: s.critCount,
      score: s.score,
      adjustedTotal: s.adjustedTotal,
    }))
    .sort((a, b) => a.penalty - b.penalty);

  const best = ranked[0];

  // Build reason sentence
  const reasons: string[] = [];
  const othersHaveCrit = ranked.some(r => r.label !== best.label && r.critCount > 0);
  if (best.critCount === 0 && othersHaveCrit) reasons.push('no critical flags');
  if (best.score >= 65) reasons.push(`confidence score ${best.score}/100`);
  if (hasTotals && best.adjustedTotal != null) {
    const others = ranked.filter(r => r.label !== best.label && r.adjustedTotal != null);
    if (others.length > 0) {
      const avgOther = others.reduce((s, r) => s + (r.adjustedTotal as number), 0) / others.length;
      const diffPct = Math.round(((best.adjustedTotal - avgOther) / avgOther) * 100);
      if (diffPct <= -5) reasons.push(`${Math.abs(diffPct)}% below average adjusted total`);
    }
  }

  const reason = reasons.length > 0
    ? reasons.join('; ') + '.'
    : 'Lowest combined risk and price penalty score.';

  return { label: best.label, reason };
}
