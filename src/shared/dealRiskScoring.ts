/**
 * Deal Risk Scoring Module - Phase 2 of "Deal Health" Model
 * 
 * Three scoring dimensions that reward verified trust and penalize financial risk:
 * 1. Price Realism - detects lowball bids and overpriced quotes
 * 2. Financial Risk - analyzes deposit/payment terms for red flags
 * 3. Trust Buffer - rewards verified contractor reputation
 */

import type { AnalysisFlag } from './analysisEngine';
import { getExpectedLaborRatio } from './houzzBenchmarks';
import { 
  detectChangeOrderRisks, 
  getProjectChangeOrderRisks
} from './changeOrderPatterns';

// ============================================================================
// TYPES
// ============================================================================

export interface PriceRealismResult {
  adjustment: number;          // Points to add/subtract (negative = deduction)
  flag: AnalysisFlag | null;   // Risk flag if triggered
  reason: string;
}

export interface FinancialRiskResult {
  adjustment: number;          // Points to add/subtract
  flags: AnalysisFlag[];       // Risk flags triggered
  depositPercent: number | null;
  hasPaymentSchedule: boolean;
  hasRetainage: boolean;
  details: string[];
}

export interface TrustBufferResult {
  adjustment: number;          // Points to add (bonuses only, capped at +10)
  bonuses: TrustBonus[];
  penalties: TrustPenalty[];
  totalBonus: number;
  totalPenalty: number;
  details: string[];
}

export interface TrustBonus {
  type: 'reviews' | 'insurance' | 'bbb' | 'warranty';
  points: number;
  reason: string;
}

export interface TrustPenalty {
  type: 'no-reviews' | 'poor-reviews' | 'no-insurance';
  points: number;
  reason: string;
}

export interface LaborRatioResult {
  actualRatio: number | null;
  expectedLow: number;
  expectedHigh: number;
  deviation: 'low' | 'high' | 'normal' | 'unknown';
  deviationPercent: number;
  points: number;
  flag: AnalysisFlag | null;
}

export interface ContractorTrustData {
  googleReviews?: number | null;
  googleRating?: number | null;
  insuranceVerified?: boolean;
  bbbRating?: string | null;      // A+, A, B+, etc.
  warrantyMentioned?: boolean;
  hasVerifiedLicense?: boolean;   // Contractor has verified license from research
}

// ============================================================================
// TRADE-SPECIFIC LOWBALL THRESHOLDS
// ============================================================================

/**
 * Enhanced lowball detection with trade-specific thresholds
 * High-risk trades (licensed, permits required) have stricter thresholds
 */
interface TradeThreshold {
  minPercent: number;     // Trigger lowball flag below this % of market
  points: number;         // Deduction points
  reason: string;
}

const TRADE_LOWBALL_THRESHOLDS: Record<string, TradeThreshold> = {
  // === MATERIALS-HEAVY TRADES (75% threshold) ===
  // High material costs mean lowball bids likely cut material quality
  'roofing': { minPercent: 75, points: -35, reason: 'Roofing is materials-heavy (50-60% materials). Bids below 75% of market often cut corners on shingles, underlayment, or flashing - leading to leaks within 2-3 years' },
  'siding': { minPercent: 75, points: -35, reason: 'Siding is materials-heavy. Low bids often skip proper housewrap, flashing, or use thinner gauge materials' },
  'hvac': { minPercent: 75, points: -30, reason: 'HVAC is materials-heavy (60-70% equipment). Bids below 75% may indicate improper sizing, skipped load calculations, or off-brand equipment with shorter warranties' },
  'windows': { minPercent: 75, points: -25, reason: 'Windows are materials-heavy. Bids below 75% often exclude proper flashing, insulation, or use lower-grade windows with shorter warranties' },
  'flooring': { minPercent: 70, points: -20, reason: 'Flooring is moderately materials-heavy (55-70% materials). Low bids may skip proper subfloor prep, transitions, or use lower-grade materials' },
  
  // === LABOR-HEAVY TRADES (60% threshold) ===
  // High labor costs mean lowball bids likely indicate inexperienced/unlicensed workers
  'painting': { minPercent: 60, points: -20, reason: 'Painting is labor-heavy (75-85% labor). Bids below 60% often mean thin coats, no primer, skipped surface prep, or unlicensed day labor' },
  'painting-interior': { minPercent: 60, points: -20, reason: 'Interior painting is labor-heavy (75-85% labor). Bids below 60% often mean thin coats, no primer, or skipped surface prep' },
  'painting-exterior': { minPercent: 60, points: -20, reason: 'Exterior painting is labor-heavy (80-85% labor). Bids below 60% often mean inadequate prep, cheap paint, or skipped primer' },
  'drywall': { minPercent: 60, points: -20, reason: 'Drywall is labor-heavy (60-75% labor). Bids below 60% often mean rushed finishing, visible seams, or skipped skim coats' },
  'tile': { minPercent: 60, points: -25, reason: 'Tile is highly labor-heavy (70-80% labor). Bids below 60% often mean improper substrate prep, thin-set issues, or grout problems that lead to cracks and water damage' },
  'tile-installation': { minPercent: 60, points: -25, reason: 'Tile installation is highly labor-heavy (70-80% labor). Bids below 60% often indicate inexperienced installers or rushed work' },
  
  // === LICENSED TRADES (65% threshold) ===
  // Require permits and inspections - lowball may indicate unlicensed work
  'electrical': { minPercent: 65, points: -30, reason: 'Electrical is labor-heavy (65-75% labor) and requires licensed work. Bids below 65% may indicate unlicensed work, skipped permits, or code violations that wont pass inspection' },
  'plumbing': { minPercent: 65, points: -30, reason: 'Plumbing is labor-heavy (65-75% labor) and requires licensed work. Cheap bids often mean skipped permits, improper materials, or future leak risks' },
  
  // === GENERAL REMODEL TRADES (80% threshold) ===
  // Mix of labor and materials - standard threshold
  'kitchen-remodel': { minPercent: 80, points: -20, reason: 'Kitchen remodels mix labor (20-25%) and materials. Bids significantly below market often exclude permits, disposal, appliance hookups, or subfloor prep' },
  'bathroom-remodel': { minPercent: 80, points: -20, reason: 'Bathroom remodels are labor-heavy (50% labor). Low bids frequently exclude waterproofing, plumbing rough-in, or permits' },
};

// Default threshold for unspecified trades
const DEFAULT_LOWBALL_THRESHOLD: TradeThreshold = { 
  minPercent: 80, 
  points: -15, 
  reason: 'Bids significantly below market rates often indicate hidden costs, scope gaps, or quality shortcuts' 
};

/**
 * Get the lowball threshold for a specific trade
 */
export function getTradeThreshold(trade?: string): TradeThreshold {
  if (!trade) return DEFAULT_LOWBALL_THRESHOLD;
  const normalized = trade.toLowerCase().replace(/[-_\s]+/g, '-');
  return TRADE_LOWBALL_THRESHOLDS[normalized] || DEFAULT_LOWBALL_THRESHOLD;
}

// ============================================================================
// LABOR RATIO VALIDATION (HOUZZ BENCHMARKS)
// ============================================================================

/**
 * Labor ratio deviation thresholds
 */
const LABOR_RATIO_THRESHOLDS = {
  warning: 0.10,   // 10 percentage points off = medium flag
  severe: 0.20     // 20 percentage points off = high flag
};

/**
 * Calculate labor ratio risk based on Houzz industry norms
 * 
 * Detects when bids have inflated labor costs or material markups that deviate
 * significantly from industry standards.
 * 
 * Example scenarios:
 * - Kitchen bid with 50% labor (expected 20-25%) → "Labor costs appear inflated"
 * - Painting bid with 40% labor (expected 80-85%) → "Material costs appear inflated"
 * - Bathroom bid with 70% labor (expected 50%) → "Labor costs above average"
 * 
 * @param projectType - Type of project (kitchen, bathroom, roofing, etc.)
 * @param laborCost - Total labor cost from bid
 * @param materialCost - Total material cost from bid
 * @param totalCost - Total bid amount
 */
export function calculateLaborRatioRisk(
  projectType: string,
  laborCost: number | null,
  materialCost: number | null,
  totalCost: number
): LaborRatioResult {
  // Get expected ratio from Houzz benchmarks
  const expected = getExpectedLaborRatio(projectType);
  
  if (!expected) {
    return {
      actualRatio: null,
      expectedLow: 0,
      expectedHigh: 0,
      deviation: 'unknown',
      deviationPercent: 0,
      points: 0,
      flag: null
    };
  }
  
  // Calculate actual labor ratio from bid
  let actualRatio: number | null = null;
  
  if (laborCost !== null && laborCost > 0 && totalCost > 0) {
    actualRatio = laborCost / totalCost;
  } else if (materialCost !== null && materialCost > 0 && totalCost > 0) {
    // Derive labor from materials: labor = total - materials
    const derivedLabor = totalCost - materialCost;
    if (derivedLabor > 0) {
      actualRatio = derivedLabor / totalCost;
    }
  }
  
  // Can't calculate - no breakdown provided
  if (actualRatio === null) {
    return {
      actualRatio: null,
      expectedLow: expected.low,
      expectedHigh: expected.high,
      deviation: 'unknown',
      deviationPercent: 0,
      points: 0,
      flag: null
    };
  }
  
  // Determine deviation
  let deviation: 'low' | 'high' | 'normal' = 'normal';
  let deviationPercent = 0;
  
  if (actualRatio < expected.low) {
    deviation = 'low';
    deviationPercent = expected.low - actualRatio;
  } else if (actualRatio > expected.high) {
    deviation = 'high';
    deviationPercent = actualRatio - expected.high;
  }
  
  // Calculate points and flag
  let points = 0;
  let flag: AnalysisFlag | null = null;
  
  if (deviationPercent >= LABOR_RATIO_THRESHOLDS.severe) {
    // Severe deviation - high severity flag
    points = -12;
    
    if (deviation === 'high') {
      flag = {
        id: 'labor-ratio-high',
        title: 'Labor costs appear inflated',
        description: `This bid shows ${Math.round(actualRatio * 100)}% labor, but ${projectType} projects typically run ${Math.round(expected.low * 100)}-${Math.round(expected.high * 100)}% labor. The contractor may be padding labor charges.`,
        level: 'high',
        category: 'pricing',
        recommendation: 'Request a detailed breakdown of labor hours and rates. Compare hourly rates against local market standards. Consider getting additional quotes.',
        whyItMatters: 'Inflated labor percentages often indicate hidden costs or inefficient work practices that will drive up your final bill.',
      };
    } else {
      flag = {
        id: 'labor-ratio-low',
        title: 'Material costs appear inflated',
        description: `This bid shows only ${Math.round(actualRatio * 100)}% labor, but ${projectType} projects typically run ${Math.round(expected.low * 100)}-${Math.round(expected.high * 100)}% labor. The contractor may be marking up materials excessively.`,
        level: 'high',
        category: 'pricing',
        recommendation: 'Ask for itemized material costs with quantities and unit prices. Verify markup percentages are reasonable (typically 10-20% over cost).',
        whyItMatters: 'Excessive material markups can significantly inflate project costs. Transparent material pricing is a sign of an honest contractor.',
      };
    }
  } else if (deviationPercent >= LABOR_RATIO_THRESHOLDS.warning) {
    // Moderate deviation - medium severity flag
    points = -6;
    
    if (deviation === 'high') {
      flag = {
        id: 'labor-ratio-high',
        title: 'Labor costs above industry average',
        description: `This bid allocates ${Math.round(actualRatio * 100)}% to labor, which is higher than the typical ${Math.round(expected.low * 100)}-${Math.round(expected.high * 100)}% for ${projectType} projects.`,
        level: 'medium',
        category: 'pricing',
        recommendation: 'Ask the contractor to explain the higher labor allocation. It may be justified by skilled labor, complex work, or overhead costs.',
        whyItMatters: 'Understanding why labor costs are elevated helps you evaluate if you\'re paying for quality or being overcharged.',
      };
    } else {
      flag = {
        id: 'labor-ratio-low',
        title: 'Material costs above industry average',
        description: `This bid allocates only ${Math.round(actualRatio * 100)}% to labor (${Math.round((1 - actualRatio) * 100)}% materials), which is unusual for ${projectType} projects that typically run ${Math.round(expected.low * 100)}-${Math.round(expected.high * 100)}% labor.`,
        level: 'medium',
        category: 'pricing',
        recommendation: 'Request an itemized material list to understand the higher material allocation. Verify you\'re not being charged for premium materials at standard pricing.',
        whyItMatters: 'Material-heavy bids should be backed by detailed specs to ensure you\'re getting value for the cost.',
      };
    }
  }
  
  return {
    actualRatio,
    expectedLow: expected.low,
    expectedHigh: expected.high,
    deviation,
    deviationPercent,
    points,
    flag
  };
}

// ============================================================================
// PRICE REALISM
// ============================================================================

/**
 * Evaluates bid price relative to market estimate
 * Enhanced with trade-specific lowball thresholds
 * 
 * Logic:
 * - Trade-specific: below threshold triggers higher penalties for risky trades
 * - Bid < 20% below market: -15 pts (High Risk Lowball) - default
 * - Bid 5-15% below market: +3 pts (Competitive Pricing bonus)
 * - Bid > 30% above market: -5 pts (Value Warning)
 * - Otherwise: 0 pts
 */
export function calculatePriceRealism(
  bidTotal: number | null,
  marketEstimate: number | null,
  trade?: string
): PriceRealismResult {
  // Can't evaluate without both values
  if (!bidTotal || !marketEstimate || marketEstimate <= 0) {
    return {
      adjustment: 0,
      flag: null,
      reason: 'Unable to evaluate price realism (missing bid or market data)',
    };
  }

  const percentDiff = ((bidTotal - marketEstimate) / marketEstimate) * 100;
  const percentOfMarket = (bidTotal / marketEstimate) * 100;
  
  // Get trade-specific threshold
  const threshold = getTradeThreshold(trade);
  
  // Trade-specific lowball detection
  if (percentOfMarket < threshold.minPercent) {
    // Determine severity based on how far below threshold
    const level = threshold.points <= -30 ? 'critical' : 'high';
    
    return {
      adjustment: threshold.points,
      flag: {
        id: 'price-lowball-risk',
        category: 'financial',
        level,
        title: threshold.points <= -30 ? 'Dangerously Low Bid' : 'Unusually Low Bid',
        description: `This bid is ${Math.abs(percentDiff).toFixed(0)}% below typical market rates. ${threshold.reason}`,
        recommendation: trade 
          ? `For ${trade} projects, get at least 3 quotes and be wary of bids below ${threshold.minPercent}% of average. Ask for detailed line-item breakdown.`
          : 'Ask the contractor to explain how they achieve this price. Request a detailed line-item breakdown and verify nothing is excluded.',
        whyItMatters: 'Lowball bids frequently lead to change orders, substandard materials, or abandoned projects when the contractor realizes they underpriced.',
      },
      reason: `Bid at ${percentOfMarket.toFixed(0)}% of market (threshold: ${threshold.minPercent}%) - ${Math.abs(threshold.points)} pt deduction`,
    };
  }

  // Standard lowball check (20% below for trades without specific threshold)
  if (percentDiff < -20) {
    return {
      adjustment: -15,
      flag: {
        id: 'price-lowball-risk',
        category: 'financial',
        level: 'high',
        title: 'Unusually Low Bid',
        description: `This bid is ${Math.abs(percentDiff).toFixed(0)}% below typical market rates. Extremely low bids often indicate hidden costs, scope gaps, or quality shortcuts.`,
        recommendation: 'Ask the contractor to explain how they achieve this price. Request a detailed line-item breakdown and verify nothing is excluded.',
        whyItMatters: 'Lowball bids frequently lead to change orders, substandard materials, or abandoned projects when the contractor realizes they underpriced.',
      },
      reason: `Bid ${Math.abs(percentDiff).toFixed(0)}% below market - high risk lowball`,
    };
  }

  // Competitive pricing (5-15% below market) - BONUS
  if (percentDiff >= -15 && percentDiff <= -5) {
    return {
      adjustment: 3,
      flag: null,
      reason: `Competitive pricing at ${Math.abs(percentDiff).toFixed(0)}% below market`,
    };
  }

  // Significantly above market (> 30%)
  if (percentDiff > 30) {
    return {
      adjustment: -5,
      flag: {
        id: 'price-above-market',
        category: 'financial',
        level: 'medium',
        title: 'Above Market Pricing',
        description: `This bid is ${percentDiff.toFixed(0)}% above typical market rates for similar projects.`,
        recommendation: 'Get 2-3 additional quotes to ensure competitive pricing. Ask what justifies the premium (reputation, warranty, materials).',
        whyItMatters: 'While higher prices can reflect quality, a significant premium without clear justification may indicate overcharging.',
      },
      reason: `Bid ${percentDiff.toFixed(0)}% above market - value warning`,
    };
  }

  return {
    adjustment: 0,
    flag: null,
    reason: 'Price within acceptable market range',
  };
}

// ============================================================================
// FINANCIAL RISK
// ============================================================================

/**
 * Analyzes payment terms and deposit requirements for financial red flags
 * 
 * Logic:
 * - Deposit > 50%: -20 pts (Critical Risk)
 * - Deposit 35-50%: -10 pts (High Risk)
 * - Payment Schedule missing: -10 pts
 * - Retainage/final payment holdback detected: +3 pts (Bonus)
 */
export function calculateFinancialRisk(bidContent: string): FinancialRiskResult {
  const flags: AnalysisFlag[] = [];
  const details: string[] = [];
  let adjustment = 0;
  
  const textLower = bidContent.toLowerCase();
  
  // ---- Deposit Detection ----
  const depositPercent = extractDepositPercent(bidContent);
  
  if (depositPercent !== null) {
    details.push(`Deposit: ${depositPercent}%`);
    
    if (depositPercent > 50) {
      adjustment -= 20;
      flags.push({
        id: 'deposit-excessive',
        category: 'payment',
        level: 'critical',
        title: 'Excessive Deposit Required',
        description: `This bid requires a ${depositPercent}% deposit upfront. Industry standard is typically 10-33% for residential projects.`,
        recommendation: 'Negotiate a lower deposit (10-33%) or propose a milestone-based payment schedule tied to work completion.',
        whyItMatters: 'Large upfront deposits leave homeowners vulnerable if the contractor abandons the project or goes out of business.',
      });
      details.push('⚠️ Critical: Deposit over 50%');
    } else if (depositPercent > 35) {
      adjustment -= 10;
      flags.push({
        id: 'deposit-high',
        category: 'payment',
        level: 'high',
        title: 'High Deposit Requirement',
        description: `This bid requires a ${depositPercent}% deposit. While not extreme, this is higher than the typical 10-25% range.`,
        recommendation: 'Consider negotiating a lower deposit or asking for a payment schedule tied to project milestones.',
        whyItMatters: 'Higher deposits mean more financial exposure before work is completed.',
      });
      details.push('⚠️ High deposit (35-50%)');
    } else {
      details.push('✓ Deposit within normal range');
    }
  }
  
  // ---- Payment Schedule Detection ----
  const hasPaymentSchedule = detectPaymentSchedule(textLower);
  
  if (!hasPaymentSchedule) {
    // Only flag if we found a deposit mention or total - indicates payment terms section exists but is incomplete
    const hasPaymentContext = /payment|deposit|due|balance/i.test(textLower);
    if (hasPaymentContext) {
      adjustment -= 10;
      flags.push({
        id: 'payment-schedule-missing',
        category: 'payment',
        level: 'high',
        title: 'Payment Schedule Not Defined',
        description: 'The bid does not include a clear payment schedule with milestones.',
        recommendation: 'Request a written payment schedule tied to specific project phases (e.g., 30% at start, 30% at rough-in, 30% at substantial completion, 10% at final walkthrough).',
        whyItMatters: 'Without defined milestones, you may be asked to pay before work is completed.',
      });
      details.push('⚠️ No payment schedule found');
    }
  } else {
    details.push('✓ Payment schedule detected');
  }
  
  // ---- Retainage Detection (Bonus) ----
  const hasRetainage = detectRetainage(textLower);
  
  if (hasRetainage) {
    adjustment += 3;
    details.push('✓ Retainage/final holdback included (+3 bonus)');
  }
  
  return {
    adjustment,
    flags,
    depositPercent,
    hasPaymentSchedule,
    hasRetainage,
    details,
  };
}

/**
 * Extract deposit percentage from bid text
 */
function extractDepositPercent(text: string): number | null {
  // Patterns for deposit percentages
  const patterns = [
    // "50% deposit", "deposit of 50%", "50 percent down"
    /(?:deposit|down\s*payment|upfront|due\s*(?:at|upon)\s*signing)[^\d]*(\d{1,3})\s*%/i,
    /(\d{1,3})\s*%\s*(?:deposit|down|upfront|due\s*(?:at|upon)\s*signing)/i,
    // "1/2 down", "half down"
    /(?:half|1\/2)\s*(?:down|deposit|upfront)/i,
    // "$X,XXX deposit" with total mentioned - calculate percentage
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[1]) {
        const percent = parseInt(match[1], 10);
        if (percent > 0 && percent <= 100) {
          return percent;
        }
      }
      // Handle "half down"
      if (/half|1\/2/i.test(match[0])) {
        return 50;
      }
    }
  }
  
  // Try to find "$X deposit required" and "$Y total" to calculate percentage
  const depositAmountMatch = text.match(/(?:deposit|down\s*payment)[^\$]*\$\s*([\d,]+(?:\.\d{2})?)/i);
  const totalAmountMatch = text.match(/(?:total|contract\s*(?:price|amount)|project\s*cost)[^\$]*\$\s*([\d,]+(?:\.\d{2})?)/i);
  
  if (depositAmountMatch && totalAmountMatch) {
    const depositAmount = parseFloat(depositAmountMatch[1].replace(/,/g, ''));
    const totalAmount = parseFloat(totalAmountMatch[1].replace(/,/g, ''));
    if (totalAmount > 0 && depositAmount > 0) {
      const calculatedPercent = (depositAmount / totalAmount) * 100;
      if (calculatedPercent > 0 && calculatedPercent <= 100) {
        return Math.round(calculatedPercent);
      }
    }
  }
  
  return null;
}

/**
 * Detect if bid contains a payment schedule
 */
function detectPaymentSchedule(textLower: string): boolean {
  const schedulePatterns = [
    // Multiple payment stages
    /(?:first|initial|1st).*(?:payment|due).*(?:second|next|2nd|upon|at)/i,
    /payment\s*(?:#\s*)?\d.*payment\s*(?:#\s*)?\d/i,
    // Milestone-based
    /(?:at|upon)\s*(?:completion|substantial\s*completion|final\s*walkthrough|rough-in|framing)/i,
    // Progress payments
    /progress\s*payment/i,
    /milestone\s*payment/i,
    // Percentage breakdowns
    /\d+%.*(?:at|upon|when).*\d+%.*(?:at|upon|when)/i,
    // Draw schedule
    /draw\s*schedule/i,
    // Explicit payment schedule section
    /payment\s*schedule/i,
    /terms\s*of\s*payment/i,
    // Balance due at completion
    /balance\s*(?:due\s*)?(?:upon|at)\s*completion/i,
  ];
  
  return schedulePatterns.some(pattern => pattern.test(textLower));
}

/**
 * Detect retainage or final payment holdback
 */
function detectRetainage(textLower: string): boolean {
  const retainagePatterns = [
    /retainage/i,
    /retention/i,
    /final\s*(?:\d+%?\s*)?(?:payment|holdback).*(?:walkthrough|inspection|punch\s*list)/i,
    /(?:\d+%?\s*)?(?:withheld|held\s*back).*(?:completion|punch\s*list)/i,
    /(?:final|last)\s*\d+%?\s*(?:due|paid).*(?:walkthrough|inspection|satisfaction)/i,
    /\d+%?\s*(?:upon|at|after)\s*final\s*(?:walkthrough|inspection|approval)/i,
  ];
  
  return retainagePatterns.some(pattern => pattern.test(textLower));
}

// ============================================================================
// TRUST BUFFER
// ============================================================================

/**
 * Calculates trust bonuses and penalties based on contractor verification data
 * 
 * Bonuses (capped at +10 total):
 * - Google >50 reviews AND >4.5 rating: +5 pts
 * - Google 20-50 reviews AND >4.2 rating: +3 pts
 * - Insurance verified: +5 pts
 * - BBB A+ rating: +3 pts
 * - Warranty explicitly mentioned: +2 pts
 * 
 * Penalties:
 * - No reviews found: -3 pts
 * - <10 reviews AND <4.0 rating: -5 pts
 */
export function calculateTrustBuffer(contractorData: ContractorTrustData): TrustBufferResult {
  const bonuses: TrustBonus[] = [];
  const penalties: TrustPenalty[] = [];
  const details: string[] = [];
  
  let totalBonus = 0;
  let totalPenalty = 0;
  
  const { googleReviews, googleRating, insuranceVerified, bbbRating, warrantyMentioned } = contractorData;
  
  // ---- Review-Based Trust ----
  if (googleReviews !== null && googleReviews !== undefined && googleRating !== null && googleRating !== undefined) {
    if (googleReviews > 50 && googleRating >= 4.5) {
      bonuses.push({
        type: 'reviews',
        points: 5,
        reason: `Excellent reputation: ${googleReviews} reviews, ${googleRating.toFixed(1)}★`,
      });
      totalBonus += 5;
      details.push(`✓ Highly rated contractor (${googleReviews} reviews, ${googleRating.toFixed(1)}★) +5`);
    } else if (googleReviews >= 20 && googleRating >= 4.2) {
      bonuses.push({
        type: 'reviews',
        points: 3,
        reason: `Good reputation: ${googleReviews} reviews, ${googleRating.toFixed(1)}★`,
      });
      totalBonus += 3;
      details.push(`✓ Well-reviewed contractor (${googleReviews} reviews, ${googleRating.toFixed(1)}★) +3`);
    } else if (googleReviews < 10 && googleRating < 4.0) {
      penalties.push({
        type: 'poor-reviews',
        points: 5,
        reason: `Limited reviews with below-average rating: ${googleReviews} reviews, ${googleRating.toFixed(1)}★`,
      });
      totalPenalty += 5;
      details.push(`⚠️ Limited reviews with low rating -5`);
    }
  } else if (googleReviews === 0 || (googleReviews === null && googleRating === null)) {
    // Only penalize if we actively searched and found nothing
    if (contractorData.googleReviews === 0) {
      penalties.push({
        type: 'no-reviews',
        points: 3,
        reason: 'No online reviews found for this contractor',
      });
      totalPenalty += 3;
      details.push('⚠️ No online reviews found -3');
    }
  }
  
  // ---- Insurance Verification ----
  if (insuranceVerified === true) {
    bonuses.push({
      type: 'insurance',
      points: 5,
      reason: 'Insurance coverage verified',
    });
    totalBonus += 5;
    details.push('✓ Insurance verified +5');
  }
  
  // ---- BBB Rating ----
  if (bbbRating) {
    const upperRating = bbbRating.toUpperCase().trim();
    if (upperRating === 'A+' || upperRating === 'A') {
      bonuses.push({
        type: 'bbb',
        points: 3,
        reason: `BBB ${upperRating} rating`,
      });
      totalBonus += 3;
      details.push(`✓ BBB ${upperRating} rated +3`);
    }
  }
  
  // ---- Warranty ----
  if (warrantyMentioned === true) {
    bonuses.push({
      type: 'warranty',
      points: 2,
      reason: 'Explicit warranty included in bid',
    });
    totalBonus += 2;
    details.push('✓ Warranty included +2');
  }
  
  // Cap bonuses at +10
  const cappedBonus = Math.min(totalBonus, 10);
  const adjustment = cappedBonus - totalPenalty;
  
  if (totalBonus > 10) {
    details.push(`(Bonus capped at +10, was +${totalBonus})`);
  }
  
  return {
    adjustment,
    bonuses,
    penalties,
    totalBonus: cappedBonus,
    totalPenalty,
    details,
  };
}

/**
 * Detect warranty mentions in bid text
 */
export function detectWarrantyInBid(bidContent: string): boolean {
  const warrantyPatterns = [
    /warranty/i,
    /guarantee[sd]?\s+(?:work|labor|material|product)/i,
    /\d+\s*(?:year|month)\s*(?:warranty|guarantee)/i,
    /workmanship\s*(?:warranty|guarantee)/i,
    /material\s*(?:warranty|guarantee)/i,
    /manufacturer(?:'s)?\s*warranty/i,
  ];
  
  return warrantyPatterns.some(pattern => pattern.test(bidContent));
}

// ============================================================================
// VAGUE SCOPE DETECTOR (Phase 3)
// ============================================================================

export interface VagueScopeResult {
  adjustment: number;           // Points to add/subtract
  flag: AnalysisFlag | null;    // Risk flag if triggered
  quantificationRatio: number;  // 0-1, ratio of specific vs vague items
  vagueItemCount: number;
  totalLineItems: number;
  vaguePatterns: VaguePattern[];
  details: string[];
}

export interface VaguePattern {
  text: string;
  type: VaguePatternType;
  severity: 'high' | 'medium' | 'low';
}

export type VaguePatternType = 
  | 'tbd'              // "TBD", "to be determined"
  | 'misc'             // "miscellaneous", "misc work"
  | 'as-needed'        // "as needed", "if necessary"
  | 'allowance'        // "allowance for", "budget for"
  | 'approximate'      // "approximately", "about", "roughly"
  | 'unspecified'      // "various", "assorted", "other work"
  | 'placeholder'      // "TBA", "pending", "to follow"
  | 'contingency';     // "contingency", "unforeseen"

// Patterns that indicate vague, unquantified line items
const VAGUE_PATTERNS: { pattern: RegExp; type: VaguePatternType; severity: 'high' | 'medium' | 'low' }[] = [
  // High severity - completely undefined scope
  { pattern: /\btbd\b/i, type: 'tbd', severity: 'high' },
  { pattern: /\bto\s+be\s+determined\b/i, type: 'tbd', severity: 'high' },
  { pattern: /\btba\b/i, type: 'placeholder', severity: 'high' },
  { pattern: /\bto\s+be\s+announced\b/i, type: 'placeholder', severity: 'high' },
  { pattern: /\bpending\b(?!\s+(inspection|approval|permit))/i, type: 'placeholder', severity: 'high' },
  { pattern: /\bto\s+follow\b/i, type: 'placeholder', severity: 'high' },
  { pattern: /\bprice\s+upon\s+request\b/i, type: 'placeholder', severity: 'high' },
  { pattern: /\bquote\s+pending\b/i, type: 'placeholder', severity: 'high' },
  
  // Medium severity - vague quantities or scope
  { pattern: /\bmisc(ellaneous)?\s*(work|items?|materials?|costs?)?\b/i, type: 'misc', severity: 'medium' },
  { pattern: /\bas\s+needed\b/i, type: 'as-needed', severity: 'medium' },
  { pattern: /\bif\s+(needed|necessary|required)\b/i, type: 'as-needed', severity: 'medium' },
  { pattern: /\bwhen\s+necessary\b/i, type: 'as-needed', severity: 'medium' },
  { pattern: /\ballowance\s+(for|of)\b/i, type: 'allowance', severity: 'medium' },
  { pattern: /\bbudget\s+(?:allowance|for)\b/i, type: 'allowance', severity: 'medium' },
  { pattern: /\bcontingency\b/i, type: 'contingency', severity: 'medium' },
  { pattern: /\bunforeseen\s*(work|conditions|items?)?\b/i, type: 'contingency', severity: 'medium' },
  { pattern: /\bvarious\s+(items?|work|materials?)\b/i, type: 'unspecified', severity: 'medium' },
  { pattern: /\bassorted\s+(items?|work|materials?)\b/i, type: 'unspecified', severity: 'medium' },
  { pattern: /\bother\s+(work|items?|misc)\b/i, type: 'unspecified', severity: 'medium' },
  { pattern: /\bsundry\s*(items?|work)?\b/i, type: 'unspecified', severity: 'medium' },
  { pattern: /\betc\.?\b/i, type: 'unspecified', severity: 'medium' },
  
  // Low severity - approximate but still informative
  { pattern: /\bapprox(imately)?\s*\$?\d/i, type: 'approximate', severity: 'low' },
  { pattern: /\babout\s+\$?\d/i, type: 'approximate', severity: 'low' },
  { pattern: /\broughly\s+\$?\d/i, type: 'approximate', severity: 'low' },
  { pattern: /\bestimate[ds]?\s+at\b/i, type: 'approximate', severity: 'low' },
  { pattern: /\bplus\s+or\s+minus\b/i, type: 'approximate', severity: 'low' },
  { pattern: /\b\+\/-\s*\d+%/i, type: 'approximate', severity: 'low' },
];

// Patterns that indicate specific, quantified line items
const SPECIFIC_PATTERNS: RegExp[] = [
  // Exact quantities with units
  /\b\d+\s*(sq\.?\s*ft\.?|sqft|sf|square\s*feet)/i,
  /\b\d+\s*(lin\.?\s*ft\.?|lf|linear\s*feet?)/i,
  /\b\d+\s*(ea\.?|each|pcs?\.?|pieces?|units?)/i,
  /\b\d+\s*(hrs?\.?|hours?)/i,
  /\b\d+\s*(gal(lons?)?|gallons?)/i,
  /\b\d+\s*(sheets?|boards?|panels?)/i,
  /\b\d+\s*(windows?|doors?|outlets?|fixtures?)/i,
  /\b\d+\s*(rooms?|bathrooms?|bedrooms?)/i,
  
  // Specific pricing with quantities
  /\$[\d,]+(?:\.\d{2})?\s*(?:per|\/)\s*(sq\.?\s*ft|sqft|sf|linear\s*ft|lf|each|ea|unit|hour|hr)/i,
  
  // Detailed material specs
  /\b(3\/4|1\/2|1\/4|5\/8)[\s-]?(inch|in\.?|")\b/i,
  /\b\d+["']\s*x\s*\d+["']/i,
  /\b\d+\s*mm\b/i,
  
  // Brand/model specificity
  /\b(kohler|moen|delta|american\s*standard|toto|grohe)\b/i,
  /\b(sherwin[\s-]?williams|benjamin\s*moore|behr|ppg)\b/i,
  /\b(andersen|pella|marvin|milgard)\b/i,
  /\bmodel\s*[#:]?\s*\w+/i,
  /\bsku\s*[#:]?\s*\w+/i,
];

/**
 * Analyzes bid text for vague, unquantified line items
 * 
 * Logic:
 * - Scans for vague patterns (TBD, misc, as needed, etc.)
 * - Counts specific/quantified items
 * - Calculates quantification ratio
 * - Flags if >20% vague items: -10 pts
 * - Flags if >40% vague items: -15 pts (high severity)
 */
export function calculateVagueScope(bidContent: string): VagueScopeResult {
  const details: string[] = [];
  const vaguePatterns: VaguePattern[] = [];
  let adjustment = 0;
  let flag: AnalysisFlag | null = null;
  
  // Split into lines for line-item analysis
  const lines = bidContent.split(/[\n\r]+/).filter(line => line.trim().length > 10);
  
  // Count specific items (lines with quantities/specs)
  let specificCount = 0;
  for (const line of lines) {
    const hasSpecific = SPECIFIC_PATTERNS.some(pattern => pattern.test(line));
    if (hasSpecific) {
      specificCount++;
    }
  }
  
  // Find all vague patterns
  for (const { pattern, type, severity } of VAGUE_PATTERNS) {
    const matches = bidContent.match(new RegExp(pattern.source, 'gi'));
    if (matches) {
      for (const match of matches) {
        // Avoid duplicates
        if (!vaguePatterns.some(vp => vp.text.toLowerCase() === match.toLowerCase())) {
          vaguePatterns.push({ text: match, type, severity });
        }
      }
    }
  }
  
  // Calculate counts
  const vagueItemCount = vaguePatterns.length;
  const totalLineItems = Math.max(lines.length, 1);
  
  // Weight by severity: high = 1.5, medium = 1.0, low = 0.5
  const weightedVague = vaguePatterns.reduce((sum, vp) => {
    const weight = vp.severity === 'high' ? 1.5 : vp.severity === 'medium' ? 1.0 : 0.5;
    return sum + weight;
  }, 0);
  
  // Calculate ratio (lower = more vague)
  // If we have specific items, use them as the denominator
  // Otherwise use total line items
  const denominator = Math.max(specificCount + weightedVague, totalLineItems * 0.5, 1);
  const quantificationRatio = Math.min(1, specificCount / denominator);
  
  // Vague percentage based on weighted count
  const vaguePercent = (weightedVague / Math.max(totalLineItems, 1)) * 100;
  
  if (vaguePatterns.length > 0) {
    details.push(`Found ${vaguePatterns.length} vague item(s): ${vaguePatterns.slice(0, 3).map(vp => `"${vp.text}"`).join(', ')}${vaguePatterns.length > 3 ? '...' : ''}`);
    details.push(`Quantification ratio: ${(quantificationRatio * 100).toFixed(0)}% specific`);
  } else {
    details.push('✓ No vague line items detected');
    details.push(`Quantification ratio: ${(quantificationRatio * 100).toFixed(0)}% specific`);
  }
  
  // High vagueness (>40%)
  if (vaguePercent > 40 || (vaguePatterns.filter(vp => vp.severity === 'high').length >= 3)) {
    adjustment = -15;
    flag = {
      id: 'scope-highly-vague',
      category: 'vagueness',
      level: 'high',
      title: 'Highly Vague Scope',
      description: `This bid contains many undefined items (${vaguePatterns.length} vague terms found). Items like "${vaguePatterns[0]?.text || 'TBD'}" leave significant room for cost increases and scope disputes.`,
      recommendation: 'Request a detailed breakdown with specific quantities, materials, and pricing for each vague item before signing. Consider this a major red flag.',
      whyItMatters: 'Vague scope is the #1 cause of contractor disputes and budget overruns. Every undefined item is a potential surprise charge.',
    };
    details.push('⚠️ High vagueness detected (-15 pts)');
  }
  // Moderate vagueness (>20%)
  else if (vaguePercent > 20 || vaguePatterns.filter(vp => vp.severity !== 'low').length >= 2) {
    adjustment = -10;
    flag = {
      id: 'scope-moderately-vague',
      category: 'vagueness',
      level: 'medium',
      title: 'Vague Line Items Detected',
      description: `This bid contains some undefined items (${vaguePatterns.length} vague terms found). Terms like "${vaguePatterns[0]?.text || 'misc work'}" can lead to unexpected costs.`,
      recommendation: 'Ask the contractor to clarify and quantify all items marked as "misc", "as needed", "TBD", or similar before signing.',
      whyItMatters: 'Undefined line items often become change orders. Getting specifics upfront protects your budget.',
    };
    details.push('⚠️ Moderate vagueness detected (-10 pts)');
  }
  // Minor vagueness (low severity only)
  else if (vaguePatterns.length > 0) {
    adjustment = -3;
    details.push('Minor vague language detected (-3 pts)');
  }
  
  return {
    adjustment,
    flag,
    quantificationRatio,
    vagueItemCount,
    totalLineItems,
    vaguePatterns,
    details,
  };
}

// ============================================================================
// CHANGE ORDER RISK SCORING
// ============================================================================

export interface ChangeOrderRiskResult {
  adjustment: number;           // Points to add/subtract (capped at -15)
  flags: AnalysisFlag[];        // Risk flags for display
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  estimatedOverrunMin: number;  // % estimated cost overrun
  estimatedOverrunMax: number;
  detectedPatterns: Array<{
    id: string;
    title: string;
    description: string;
    riskLevel: 'high' | 'medium' | 'low';
    questionToAsk: string;
  }>;
  projectSpecificRisks: Array<{
    item: string;
    frequency: string;
    typicalCost: string;
    preventionQuestion: string;
  }>;
  details: string[];
}

/**
 * Calculate change order risk based on bid language patterns
 * 
 * Detects:
 * - Allowances (fixture, flooring, cabinet, countertop, etc.)
 * - Exclusions (permits, electrical, plumbing, disposal)
 * - Assumptions (good condition, clear access, single layer)
 * - Discovery risks (hidden damage, water/mold, asbestos/lead)
 * - Undefined items (TBD, pending selections)
 * - Code/permit risks (upgrades required, inspection contingent)
 * 
 * Point deductions (capped at -15 total):
 * - High risk items: -8 pts each
 * - Medium risk items: -4 pts each
 * - Low risk items: -2 pts each
 */
export function calculateChangeOrderRisk(
  bidContent: string,
  projectType?: string
): ChangeOrderRiskResult {
  const details: string[] = [];
  const flags: AnalysisFlag[] = [];
  
  // Detect patterns in bid text
  const { patterns, summary } = detectChangeOrderRisks(bidContent);
  
  // Get project-specific common change orders
  const projectRisks = projectType ? getProjectChangeOrderRisks(projectType) : null;
  
  // Calculate point adjustment (capped at -15)
  let rawAdjustment = 0;
  rawAdjustment -= summary.highRiskCount * 8;
  rawAdjustment -= summary.mediumRiskCount * 4;
  rawAdjustment -= summary.lowRiskCount * 2;
  
  const adjustment = Math.max(-15, rawAdjustment);
  
  // Build detected patterns list for UI
  const detectedPatterns = patterns.map(p => ({
    id: p.pattern.id,
    title: p.pattern.title,
    description: p.pattern.description,
    riskLevel: p.pattern.riskLevel,
    questionToAsk: p.pattern.questionToAsk,
  }));
  
  // Build project-specific risks list
  const projectSpecificRisks = projectRisks?.commonChangeOrders.map(co => ({
    item: co.item,
    frequency: co.frequency,
    typicalCost: co.typicalCost,
    preventionQuestion: co.preventionQuestion,
  })) || [];
  
  // Generate flags for significant risks
  if (summary.highRiskCount >= 3) {
    flags.push({
      id: 'change-order-critical',
      category: 'contract',
      level: 'critical',
      title: 'High Change Order Risk',
      description: `This bid has ${summary.highRiskCount} high-risk items that commonly lead to extra charges. Expect ${summary.estimatedOverrunMin}-${summary.estimatedOverrunMax}% in potential add-ons.`,
      recommendation: 'Request fixed pricing for all allowances and clarify every exclusion before signing. Consider adding a "not-to-exceed" clause.',
      whyItMatters: 'Multiple high-risk items compound into significant budget overruns. Industry data shows bids with 3+ high-risk items average 25-40% over final cost.',
    });
    details.push(`⚠️ Critical: ${summary.highRiskCount} high-risk change order triggers found`);
  } else if (summary.highRiskCount >= 1) {
    flags.push({
      id: 'change-order-high',
      category: 'contract',
      level: 'high',
      title: 'Change Order Risk Detected',
      description: `Found ${summary.highRiskCount} high-risk item(s): "${detectedPatterns.find(p => p.riskLevel === 'high')?.title || 'allowance/exclusion'}". These commonly trigger extra charges.`,
      recommendation: 'Ask for specific pricing or caps on these items before signing.',
      whyItMatters: 'Allowances and exclusions are the #1 source of contractor disputes. Locking in specifics protects your budget.',
    });
    details.push(`⚠️ High risk: ${summary.highRiskCount} item(s) likely to cause extras`);
  }
  
  if (summary.mediumRiskCount >= 3 && summary.highRiskCount < 1) {
    flags.push({
      id: 'change-order-medium',
      category: 'contract',
      level: 'medium',
      title: 'Moderate Change Order Risk',
      description: `Found ${summary.mediumRiskCount} medium-risk items that may lead to additional charges.`,
      recommendation: 'Review each item and ask the contractor to clarify the scope.',
      whyItMatters: 'While not critical individually, multiple vague items can add up to meaningful cost increases.',
    });
    details.push(`⚠️ Medium risk: ${summary.mediumRiskCount} items may cause extras`);
  }
  
  // Add details about what was found
  if (patterns.length > 0) {
    details.push(`Detected ${patterns.length} change order risk pattern(s)`);
    details.push(`Estimated overrun potential: ${summary.estimatedOverrunMin}-${summary.estimatedOverrunMax}%`);
  } else {
    details.push('✓ No significant change order risk patterns detected');
  }
  
  if (projectSpecificRisks.length > 0) {
    details.push(`${projectSpecificRisks.length} common change orders for this project type`);
  }
  
  return {
    adjustment,
    flags,
    highRiskCount: summary.highRiskCount,
    mediumRiskCount: summary.mediumRiskCount,
    lowRiskCount: summary.lowRiskCount,
    estimatedOverrunMin: summary.estimatedOverrunMin,
    estimatedOverrunMax: summary.estimatedOverrunMax,
    detectedPatterns,
    projectSpecificRisks,
    details,
  };
}

// ============================================================================
// COMBINED DEAL RISK CALCULATION
// ============================================================================

export interface DealRiskResult {
  totalAdjustment: number;
  priceRealism: PriceRealismResult;
  financialRisk: FinancialRiskResult;
  trustBuffer: TrustBufferResult;
  vagueScope: VagueScopeResult;
  changeOrderRisk: ChangeOrderRiskResult;
  allFlags: AnalysisFlag[];
  summary: string;
}

/**
 * Calculate combined deal risk adjustment
 * Includes: Price Realism, Financial Risk, Trust Buffer, Vague Scope, and Change Order Risk
 */
export function calculateDealRisk(
  bidContent: string,
  bidTotal: number | null,
  marketEstimate: number | null,
  contractorData: ContractorTrustData,
  trade?: string
): DealRiskResult {
  // Calculate each dimension with trade-specific thresholds
  const priceRealism = calculatePriceRealism(bidTotal, marketEstimate, trade);
  const financialRisk = calculateFinancialRisk(bidContent);
  const trustBuffer = calculateTrustBuffer(contractorData);
  const vagueScope = calculateVagueScope(bidContent);
  const changeOrderRisk = calculateChangeOrderRisk(bidContent, trade);
  
  // Combine adjustments (all five dimensions)
  const totalAdjustment = 
    priceRealism.adjustment + 
    financialRisk.adjustment + 
    trustBuffer.adjustment +
    vagueScope.adjustment +
    changeOrderRisk.adjustment;
  
  // Combine flags
  const allFlags: AnalysisFlag[] = [];
  if (priceRealism.flag) {
    allFlags.push(priceRealism.flag);
  }
  allFlags.push(...financialRisk.flags);
  if (vagueScope.flag) {
    allFlags.push(vagueScope.flag);
  }
  allFlags.push(...changeOrderRisk.flags);
  
  // Generate summary
  const summaryParts: string[] = [];
  if (priceRealism.adjustment !== 0) {
    summaryParts.push(priceRealism.reason);
  }
  if (financialRisk.adjustment !== 0) {
    summaryParts.push(`Financial terms: ${financialRisk.adjustment > 0 ? '+' : ''}${financialRisk.adjustment} pts`);
  }
  if (trustBuffer.adjustment !== 0) {
    summaryParts.push(`Trust factors: ${trustBuffer.adjustment > 0 ? '+' : ''}${trustBuffer.adjustment} pts`);
  }
  if (vagueScope.adjustment !== 0) {
    summaryParts.push(`Scope clarity: ${vagueScope.adjustment} pts`);
  }
  if (changeOrderRisk.adjustment !== 0) {
    summaryParts.push(`Change order risk: ${changeOrderRisk.adjustment} pts`);
  }
  
  const summary = summaryParts.length > 0 
    ? summaryParts.join('; ') 
    : 'No significant deal risk factors detected';
  
  return {
    totalAdjustment,
    priceRealism,
    financialRisk,
    trustBuffer,
    vagueScope,
    changeOrderRisk,
    allFlags,
    summary,
  };
}
