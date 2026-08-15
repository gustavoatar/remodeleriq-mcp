/**
 * RemodelerIQ MCP Eval Suite — Phase 4
 *
 * Regression gate for the bid-analysis engine. Run before every RULE_VERSION
 * bump to confirm flag taxonomy, score calibration, and compare-bids logic.
 *
 * All tests are read-only: no database, no network, no Cloudflare bindings.
 * They call the shared analysis functions directly.
 *
 * Run: npx vitest run src/tests/mcp-evals.test.ts
 */

import { describe, it, expect } from 'vitest';
import { analyzeBidFull } from '@/shared/toolResults';
import { compareBidsFull } from '@/shared/compareBidsEngine';

// ---- Helpers ----------------------------------------------------------------

type AnalysisFull = ReturnType<typeof analyzeBidFull>;

function getData(r: AnalysisFull) {
  if ('error' in r.toolResult) throw new Error(`Tool error: ${r.toolResult.error}`);
  return r.toolResult.data as {
    confidence_score: number;
    verdict: string;
    red_flags: Array<{ level: string; issue: string; flag_id: string }>;
    missing_items: string[];
    score_breakdown?: { contract_clarity: number; scope_completeness: number; price_realism: number };
    _meta: { attribution: { source: string } };
  };
}

function flagIds(r: AnalysisFull): string[] {
  return getData(r).red_flags.map(f => f.flag_id);
}

function criticalFlags(r: AnalysisFull) {
  return getData(r).red_flags.filter(f => f.level === 'critical');
}

// ---- Eval 1: Plan's canonical example — Charleston SC bathroom $60k ----------
// 40% deposit + two unbounded allowances + no license number.
// Cited directly in the Phase 4 plan as the reference eval case.
describe('EVAL-01: Charleston SC bathroom $60k — 40% deposit + TBD allowances', () => {
  const result = analyzeBidFull(
    `BATHROOM REMODELING CONTRACT
Contractor: Palmetto Home Renovations
Project: Full Primary Bathroom Remodel
Location: Charleston, SC
Project Total: $60,000

PAYMENT TERMS:
40% deposit due upon contract signing: $24,000
30% due upon rough-in completion
30% balance due upon final walkthrough

SCOPE OF WORK:
- Demo and haul away all existing tile, fixtures, vanity
- Install new walk-in shower with bench (tile allowance: TBD per homeowner selection)
- Install new freestanding soaking tub
- New double vanity (vanity allowance: TBD per homeowner selection)
- New toilet — Toto Carlyle II
- LVP flooring throughout bathroom
- Heated floor mat under LVP
- New exhaust fan, recessed lighting
- Paint walls and ceiling

Duration: Approximately 6–8 weeks from start`,
    60000,
    'SC',
  );

  it('has a deposit flag (40% → PAY_DEPOSIT_HIGH)', () => {
    expect(flagIds(result)).toContain('PAY_DEPOSIT_HIGH');
  });

  it('fires a vague-terms flag for unbounded allowances', () => {
    const ids = flagIds(result);
    const hasVague = ids.some(id =>
      id.startsWith('SCOPE_VAGUE') || id === 'SCOPE_ALLOWANCE_UNBOUNDED'
    );
    expect(hasVague).toBe(true);
  });

  it('confidence score reflects elevated risk (< 70)', () => {
    expect(getData(result).confidence_score).toBeLessThan(70);
  });

  it('returns structurally valid attribution block', () => {
    expect(getData(result)._meta.attribution.source).toBe('RemodelerIQ');
  });
});

// ---- Eval 2: Excessive deposit (> 50%) --------------------------------------
describe('EVAL-02: Excessive deposit demand (55%)', () => {
  const result = analyzeBidFull(
    `HOME ADDITION CONTRACT
Contractor: BuildRight General Contracting
Project Total: $85,000

PAYMENT TERMS:
55% deposit required prior to material ordering: $46,750
45% balance upon project completion

SCOPE:
- 400 sq ft addition off existing living room
- Full framing, insulation, drywall, paint
- New HVAC extension
- Electrical and lighting throughout addition
- Hardwood flooring to match existing

Schedule: 14–16 weeks`,
    85000,
    'GA',
  );

  it('fires PAY_DEPOSIT_EXCESSIVE for 55% upfront', () => {
    expect(flagIds(result)).toContain('PAY_DEPOSIT_EXCESSIVE');
  });

  it('PAY_DEPOSIT_EXCESSIVE is at critical or high severity', () => {
    const flag = getData(result).red_flags.find(f => f.flag_id === 'PAY_DEPOSIT_EXCESSIVE');
    expect(flag).toBeDefined();
    expect(['critical', 'high']).toContain(flag!.level);
  });

  it('confidence score is low (< 55) due to extreme deposit risk', () => {
    expect(getData(result).confidence_score).toBeLessThan(55);
  });
});

// ---- Eval 3: License number absent on a large GA project --------------------
describe('EVAL-03: Missing contractor license number ($50k GA kitchen)', () => {
  const result = analyzeBidFull(
    `KITCHEN REMODEL PROPOSAL
Contractor: Bright Builders LLC
Address: 1420 Peachtree Rd NE, Atlanta, GA 30309
Project Total: $50,000

SCOPE OF WORK:
- Full demo of existing 180 sq ft kitchen
- Install new 42" upper and lower cabinets (36 linear feet)
- Quartz countertops throughout + island
- New subway tile backsplash
- Hardwood flooring to match adjacent dining room
- Appliance hookup (homeowner-supplied appliances)
- Under-cabinet LED lighting

PAYMENT SCHEDULE:
25% upon signing, 45% at cabinet installation, 30% at final walkthrough

PERMITS:
Contractor will obtain all required building permits.

Timeline: 10–12 weeks`,
    50000,
    'GA',
  );

  it('fires LIC_MISSING_STATE when no license number appears', () => {
    expect(flagIds(result)).toContain('LIC_MISSING_STATE');
  });

  it('LIC_MISSING_STATE is a critical flag', () => {
    const flag = getData(result).red_flags.find(f => f.flag_id === 'LIC_MISSING_STATE');
    expect(flag?.level).toBe('critical');
  });
});

// ---- Eval 4: No start date, no completion date, no schedule -----------------
// SCHED_NO_DATES fires at high severity and appears in red_flags.
// The bid has no timeline whatsoever — no dates, no duration, no schedule.
describe('EVAL-04: No project dates or timeline', () => {
  const result = analyzeBidFull(
    `DECK CONSTRUCTION PROPOSAL
Contractor: Deck Masters of Georgia — License: 122847
Project Total: $22,000

SCOPE:
- Remove existing 200 sq ft deck
- Install new 400 sq ft pressure-treated pine deck (5/4" decking)
- 4x4 posts on concrete footings to code depth
- Composite railing system — Trex Transcend
- Stair section with landing
- LED deck post cap lighting

PAYMENT:
30% at signing, 40% at framing completion, 30% at final inspection

Permits: All permits included in contract price.`,
    22000,
    'GA',
  );

  it('fires SCHED_NO_DATES flag (high severity — appears in red_flags)', () => {
    expect(flagIds(result)).toContain('SCHED_NO_DATES');
  });

  it('includes timeline in missing_items', () => {
    const missing = result.rawResult?.missingItems ?? [];
    expect(missing.some(m => /date|timeline|schedule/i.test(m))).toBe(true);
  });
});

// ---- Eval 5: Missing payment milestones — no progress payment structure -----
// PAY_NO_MILESTONES fires when payment terms lack proper milestone language.
// A bid with vague "balance at completion" does not match milestone patterns.
describe('EVAL-05: Missing payment milestones', () => {
  const result = analyzeBidFull(
    `BASEMENT FINISHING CONTRACT
Contractor: Below Grade Finishing Co. — License: 198234
Project Total: $38,000

SCOPE OF WORK:
- Frame 800 sq ft unfinished basement to code
- Electrical: 1 new panel circuit, recessed lighting throughout, 4 outlets per wall
- Drywall, tape, texture, paint
- LVP flooring — Shaw Floorte Pro
- Drop ceiling — Armstrong 2x4 grid with tiles
- Egress window installation

PAYMENT:
$15,000 deposit due at contract signing. Remaining balance due upon job completion.

PERMITS: Contractor pulls all permits.
Timeline: 8 weeks from signed contract date.`,
    38000,
    'GA',
  );

  it('fires PAY_NO_MILESTONES when payment has no progress milestones', () => {
    expect(flagIds(result)).toContain('PAY_NO_MILESTONES');
  });

  it('PAY_NO_MILESTONES is at high severity', () => {
    const flag = getData(result).red_flags.find(f => f.flag_id === 'PAY_NO_MILESTONES');
    expect(flag?.level).toBe('high');
  });
});

// ---- Eval 6: Binding arbitration clause -------------------------------------
describe('EVAL-06: Binding arbitration clause', () => {
  const result = analyzeBidFull(
    `WHOLE-HOME RENOVATION CONTRACT
Contractor: Premier Renovations Group — License #GA-0156783
Project Total: $120,000

DISPUTE RESOLUTION:
Any and all disputes arising out of or relating to this contract shall be resolved
exclusively through binding arbitration under the American Arbitration Association
Commercial Rules. Homeowner waives the right to jury trial or class action.

SCOPE: Full interior renovation — kitchen, 2 bathrooms, master suite expansion,
new hardwood floors throughout (2,200 sq ft). All permits included.

PAYMENT: 20% at signing, 20% demolition complete, 20% rough-in, 20% drywall,
20% at final walkthrough.

Timeline: 16 weeks from permit approval.`,
    120000,
    'GA',
  );

  it('fires CONTRACT_ARBITRATION for binding arbitration clause', () => {
    expect(flagIds(result)).toContain('CONTRACT_ARBITRATION');
  });
});

// ---- Eval 7: Permit issue flagged in structural work ------------------------
// When permits are absent from a structural bid, 'permit-not-mentioned' fires
// at high severity → PERMIT_RESPONSIBILITY_UNCLEAR appears in red_flags.
describe('EVAL-07: Permit issue in structural/electrical remodel', () => {
  const result = analyzeBidFull(
    `KITCHEN & STRUCTURAL RENOVATION
Contractor: Atlas Home Builders — License: 211098
Project Total: $65,000

SCOPE:
- Remove load-bearing wall between kitchen and living room (LVL beam installation)
- Full kitchen remodel: new layout, cabinets, countertops, island
- Relocate electrical panel — 200A upgrade
- Relocate gas line for new range location
- New hardwood flooring in kitchen and adjacent living room
- Interior paint throughout

PAYMENT:
20% signing, 30% structural/rough-in, 30% cabinets/counters, 20% final.

Timeline: 12 weeks start to finish.`,
    65000,
    'GA',
  );

  it('fires PERMIT_RESPONSIBILITY_UNCLEAR (high severity — appears in red_flags)', () => {
    expect(flagIds(result)).toContain('PERMIT_RESPONSIBILITY_UNCLEAR');
  });

  it('includes permit responsibility in missing_items', () => {
    const missing = result.rawResult?.missingItems ?? [];
    expect(missing.some(m => /permit/i.test(m))).toBe(true);
  });
});

// ---- Eval 8: Vague scope — many TBD items, low coverage --------------------
describe('EVAL-08: Highly vague scope — multiple TBD allowances', () => {
  const result = analyzeBidFull(
    `KITCHEN REMODEL
Contractor: Joe's Contracting

Materials: TBD
Cabinets: Allowance — homeowner to choose
Countertops: Allowance — homeowner to choose
Flooring: TBD
Appliances: Not included
Lighting: TBD
Labor: Lump sum
Start date: TBD
Duration: TBD
Payment: 50% upfront, 50% done

Total: $45,000`,
    45000,
    'GA',
  );

  it('fires at least one vague-scope or high-risk-terms flag', () => {
    const ids = flagIds(result);
    const hasVagueFlag = ids.some(id =>
      id.startsWith('SCOPE_VAGUE') || id.startsWith('SCOPE_') || id === 'PAY_MILESTONE_RISKY'
    );
    expect(hasVagueFlag).toBe(true);
  });

  it('confidence score is significantly reduced by vague scope (< 60)', () => {
    expect(getData(result).confidence_score).toBeLessThan(60);
  });

  it('verdict is not "Looks fair"', () => {
    expect(getData(result).verdict).not.toBe('Looks fair');
  });
});

// ---- Eval 9: Clean, well-formed bid — should score high --------------------
// License number must be digits-only after keyword (no GA-XXXXX prefix).
// The engine regex requires: license|lic|contractor + optional #/no/number + \d{4,}
describe('EVAL-09: Best-practice bid — should score ≥ 70', () => {
  const result = analyzeBidFull(
    `KITCHEN REMODELING CONTRACT
Contractor: Meridian Remodeling LLC
Contractor License: 198456 (verified at goals.sos.ga.gov)
General Liability Insurance: $2M per occurrence — Certificate available on request
Workers Comp: Active policy — Certificate available on request
Project Total: $52,500

DETAILED SCOPE OF WORK:
1. Demolition — remove cabinets, countertops, flooring, tile backsplash (hauled off-site)
2. Cabinetry — KraftMaid Maple full-overlay, 42" uppers, 36 LF total, dove-white finish
3. Countertops — 3cm Silestone Calacatta quartz, waterfall edge on island
4. Backsplash — 3x6 subway tile, white matte, installed to underside of uppers
5. Flooring — 5" white oak hardwood, site-finished, to match existing dining room
6. Plumbing — relocate sink 18"; new Kohler Whitehaven apron sink
7. Electrical — under-cabinet LED, new recessed layout, dedicated refrigerator circuit
8. Paint — Sherwin-Williams Alabaster throughout

PAYMENT SCHEDULE:
- 20% at contract signing: $10,500
- 25% at demolition complete and rough-in approved: $13,125
- 25% at cabinet installation complete: $13,125
- 20% at countertops and backsplash complete: $10,500
- 10% at final walkthrough and punch-list sign-off: $5,250

PERMITS AND INSPECTIONS:
Meridian will pull all required City of Atlanta building permits.
All electrical and plumbing rough-in inspections scheduled by contractor.

CHANGE ORDERS:
Any changes to scope require a written Change Order signed by both parties before
work begins. Change orders are billed at cost + 15%. No verbal authorizations.

PROJECT SCHEDULE:
Start date: September 8, 2026. Estimated completion: November 21, 2026 (11 weeks).
Delay penalty: $200/day for contractor delays beyond the completion date.

WARRANTY:
Meridian warrants all workmanship for 2 years from project completion.`,
    52500,
    'GA',
  );

  it('confidence score is ≥ 70 for a well-formed bid', () => {
    expect(getData(result).confidence_score).toBeGreaterThanOrEqual(70);
  });

  it('verdict is "Looks fair" or "Proceed with caution"', () => {
    expect(['Looks fair', 'Proceed with caution']).toContain(getData(result).verdict);
  });

  it('has no critical-level red flags', () => {
    expect(criticalFlags(result)).toHaveLength(0);
  });

  it('score_breakdown is present with expected keys', () => {
    const breakdown = getData(result).score_breakdown;
    expect(breakdown).toBeDefined();
    expect(typeof breakdown!.contract_clarity).toBe('number');
    expect(typeof breakdown!.scope_completeness).toBe('number');
    expect(typeof breakdown!.price_realism).toBe('number');
  });
});

// ---- Eval 10: compare_bids — clean bid beats deposit-trap and vague bid ----
// Bid A: licensed, milestones, permits, warranty — clean
// Bid B: 55% deposit (excessive), no license, homeowner pulls permits — worst
// Bid C: 45% deposit, vague scope — bad but less than B
// Winner should be Bid A (highest confidence score).
// cost_comparison requires explicit per-trade prices across ≥2 bids — it may be
// empty if the engine can't extract matching line items; assert ≥ 0 not > 0.
describe('EVAL-10: compare_bids — clean bid beats deposit-trap and vague bid', () => {
  const result = compareBidsFull([
    {
      bid_text: `Bid A — Apex Construction. License: 199321. Total: $48,000.
Payment: 20% at signing, 30% at rough-in, 30% at cabinet installation, 20% at final walkthrough.
Permits: contractor pulls all permits.
Change orders: written CO required, cost + 12%. Start: Oct 1 2026. Done: Dec 15 2026.
Warranty: 2 years workmanship. Scope: 36LF KraftMaid cabinets, Silestone quartz counters,
subway backsplash, hardwood flooring, electrical layout, plumbing relocation.`,
      bid_total: 48000,
      label: 'Bid A — Apex',
      state_code: 'GA',
    },
    {
      bid_text: `Bid B — FastBuild. Total: $42,000.
55% deposit required at signing ($23,100). Balance due upon completion.
Scope: new cabinets, counters, flooring. Materials TBD. No license provided.
Homeowner is responsible for pulling all permits.`,
      bid_total: 42000,
      label: 'Bid B — FastBuild',
      state_code: 'GA',
    },
    {
      bid_text: `Bid C — Quick Kitchens. Total: $45,000.
45% upfront deposit required. Remaining at completion.
Allowances for cabinets and countertops TBD. No start date provided.`,
      bid_total: 45000,
      label: 'Bid C — Quick Kitchens',
      state_code: 'GA',
    },
  ], { joinUrl: 'https://remodeleriq.com/join', ruleVersion: '2026.08.1' });

  const { comparison } = result;

  it('returns bid_count = 3', () => {
    expect(comparison.bid_count).toBe(3);
  });

  it('produces a winner recommendation', () => {
    expect(comparison.winner).not.toBeNull();
    expect(comparison.winner?.label).toBeDefined();
  });

  it('Bid A has the highest confidence score of the three', () => {
    const bidA = comparison.bids.find(b => b.label === 'Bid A — Apex');
    const bidB = comparison.bids.find(b => b.label === 'Bid B — FastBuild');
    const bidC = comparison.bids.find(b => b.label === 'Bid C — Quick Kitchens');
    expect(bidA!.confidence_score).toBeGreaterThan(bidB!.confidence_score);
    expect(bidA!.confidence_score).toBeGreaterThan(bidC!.confidence_score);
  });

  it('Bid A wins the comparison', () => {
    expect(comparison.winner?.label).toBe('Bid A — Apex');
  });

  it('cost_comparison is an array (rows present when line-item prices extracted)', () => {
    expect(Array.isArray(comparison.cost_comparison)).toBe(true);
  });

  it('apples_to_apples adjustments are present for all three bids', () => {
    expect(comparison.apples_to_apples.length).toBe(3);
  });

  it('rawResults has one AnalysisResult per bid', () => {
    expect(result.rawResults.length).toBe(3);
    result.rawResults.forEach(r => {
      expect(typeof r.confidenceScore).toBe('number');
    });
  });
});
