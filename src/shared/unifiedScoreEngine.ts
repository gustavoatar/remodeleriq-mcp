// Unified Score Engine
// Combines three dimensions into a single bid confidence score:
// - Contract Risk (40%): Legal protections, payment terms, license verification
// - Scope Completeness (30%): How well the bid documents what's included
// - Price Reasonableness (30%): How the bid compares to market rates

import type { AnalysisFlag, RiskLevel } from './analysisEngine';
import type { ScopeAnalysisResult } from './scopeAnalysis';
import type { PriceScoreResult, PriceVerdict, VerdictSentiment } from './priceScoreEngine';

// ============================================================================
// TYPES
// ============================================================================

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface ContractRiskDimension {
  score: number;           // 0-100
  weight: 0.40;
  flags: AnalysisFlag[];
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  summary: string;
}

export interface ScopeCompletenessDimension {
  score: number;           // 0-100
  weight: 0.30;
  includedCount: number;
  missingCount: number;
  impliedCount: number;
  criticalMissing: number;
  importantMissing: number;
  summary: string;
}

export interface PriceReasonablenessDimension {
  score: number;           // 0-100
  weight: 0.30;
  verdict: PriceVerdict;
  verdictSentiment: VerdictSentiment;
  percentDiff: number;     // Positive = above market
  bidPsf: number;
  marketPsf: number;
  summary: string;
}

export interface UnifiedScoreResult {
  overall: number;         // 0-100
  grade: Grade;
  gradeLabel: string;      // "Excellent", "Good", "Fair", "Poor", "Risky"
  dimensions: {
    contractRisk: ContractRiskDimension;
    scopeCompleteness: ScopeCompletenessDimension;
    priceReasonableness: PriceReasonablenessDimension;
  };
  summary: string;         // Overall assessment
  recommendations: string[]; // Top 3 action items
}

// ============================================================================
// SCORING CONFIGURATION
// ============================================================================

// Risk level deductions for contract risk score - "Deal Health" model (Phase 1 refactor)
// Less aggressive deductions, focused on financial risk signals
const CONTRACT_RISK_DEDUCTIONS: Record<RiskLevel, number> = {
  critical: 20,
  high: 12,
  medium: 6,
  low: 2,
};

// Grade thresholds
const GRADE_THRESHOLDS = {
  A: { min: 85, label: 'Excellent' },
  B: { min: 70, label: 'Good' },
  C: { min: 55, label: 'Fair' },
  D: { min: 40, label: 'Poor' },
  F: { min: 0, label: 'Risky' },
};

// ============================================================================
// MAIN CALCULATION
// ============================================================================

export interface UnifiedScoreInput {
  flags: AnalysisFlag[];
  scopeAnalysis: ScopeAnalysisResult;
  priceScore?: PriceScoreResult | null;  // Optional if we don't have bid total/SF
}

/**
 * Calculate the unified score combining all three dimensions
 */
export function calculateUnifiedScore(input: UnifiedScoreInput): UnifiedScoreResult {
  const { flags, scopeAnalysis, priceScore } = input;
  
  // Calculate each dimension
  const contractRisk = calculateContractRiskScore(flags);
  const scopeCompleteness = calculateScopeScore(scopeAnalysis);
  const priceReasonableness = calculatePriceReasonablenessScore(priceScore);
  
  // Calculate weighted overall score
  const overall = Math.round(
    (contractRisk.score * contractRisk.weight) +
    (scopeCompleteness.score * scopeCompleteness.weight) +
    (priceReasonableness.score * priceReasonableness.weight)
  );
  
  // Determine grade
  const { grade, gradeLabel } = determineGrade(overall);
  
  // Generate summary and recommendations
  const summary = generateOverallSummary(overall, grade, contractRisk, scopeCompleteness, priceReasonableness);
  const recommendations = generateRecommendations(contractRisk, scopeCompleteness, priceReasonableness);
  
  return {
    overall,
    grade,
    gradeLabel,
    dimensions: {
      contractRisk,
      scopeCompleteness,
      priceReasonableness,
    },
    summary,
    recommendations,
  };
}

// ============================================================================
// DIMENSION CALCULATIONS
// ============================================================================

function calculateContractRiskScore(flags: AnalysisFlag[]): ContractRiskDimension {
  let score = 100;
  
  const criticalFlags = flags.filter(f => f.level === 'critical');
  const highFlags = flags.filter(f => f.level === 'high');
  const mediumFlags = flags.filter(f => f.level === 'medium');
  const lowFlags = flags.filter(f => f.level === 'low');
  
  for (const flag of flags) {
    // Skip non-deducting flags (e.g., scope flags - already counted via scopeScore)
    if (flag.deducting === false) {
      continue;
    }
    // Deduct based on flag level
    score -= CONTRACT_RISK_DEDUCTIONS[flag.level];
  }
  
  score = Math.max(0, Math.min(100, score));
  
  // Generate summary
  let summary: string;
  if (criticalFlags.length > 0) {
    summary = `${criticalFlags.length} critical issue${criticalFlags.length > 1 ? 's' : ''} requiring immediate attention`;
  } else if (highFlags.length > 0) {
    summary = `${highFlags.length} significant concern${highFlags.length > 1 ? 's' : ''} to address before signing`;
  } else if (mediumFlags.length > 0) {
    summary = `${mediumFlags.length} moderate item${mediumFlags.length > 1 ? 's' : ''} worth discussing with contractor`;
  } else if (lowFlags.length > 0) {
    summary = `${lowFlags.length} minor suggestion${lowFlags.length > 1 ? 's' : ''} for improvement`;
  } else {
    summary = 'No significant contract issues detected';
  }
  
  return {
    score,
    weight: 0.40,
    flags,
    criticalCount: criticalFlags.length,
    highCount: highFlags.length,
    mediumCount: mediumFlags.length,
    lowCount: lowFlags.length,
    summary,
  };
}

function calculateScopeScore(scopeAnalysis: ScopeAnalysisResult): ScopeCompletenessDimension {
  const { scopeScore, includedItems, missingItems, impliedItems } = scopeAnalysis;
  
  // Use the existing scope score from scopeAnalysis
  const score = scopeScore;
  
  const criticalMissing = missingItems.filter(i => i.importance === 'critical').length;
  const importantMissing = missingItems.filter(i => i.importance === 'important').length;
  
  // Generate summary
  let summary: string;
  if (criticalMissing > 0) {
    summary = `${criticalMissing} critical item${criticalMissing > 1 ? 's' : ''} not clearly specified`;
  } else if (importantMissing > 0) {
    summary = `${importantMissing} important item${importantMissing > 1 ? 's' : ''} may need clarification`;
  } else if (missingItems.length > 0) {
    summary = `${missingItems.length} minor item${missingItems.length > 1 ? 's' : ''} could be more detailed`;
  } else {
    summary = 'Scope is well-documented';
  }
  
  return {
    score,
    weight: 0.30,
    includedCount: includedItems.length,
    missingCount: missingItems.length,
    impliedCount: impliedItems.length,
    criticalMissing,
    importantMissing,
    summary,
  };
}

function calculatePriceReasonablenessScore(priceScore?: PriceScoreResult | null): PriceReasonablenessDimension {
  // If no price score available, return neutral values
  if (!priceScore) {
    return {
      score: 75,  // Neutral default
      weight: 0.30,
      verdict: 'Fair Price',
      verdictSentiment: 'neutral',
      percentDiff: 0,
      bidPsf: 0,
      marketPsf: 0,
      summary: 'Unable to calculate price comparison (missing bid total or square footage)',
    };
  }
  
  const { score, verdict, verdictSentiment, percentDiff, bidPsf, marketPsf, explanation } = priceScore;
  
  // Use the price score directly
  // The priceScoreEngine already calculates a 0-100 score with appropriate thresholds
  
  // Generate summary based on verdict
  let summary: string;
  switch (verdictSentiment) {
    case 'positive':
      summary = `Competitive pricing at ${Math.abs(percentDiff).toFixed(0)}% below market`;
      break;
    case 'neutral':
      summary = 'Pricing aligns with market rates';
      break;
    case 'caution':
      summary = `${Math.abs(percentDiff).toFixed(0)}% above typical market rates`;
      break;
    case 'warning':
      summary = `Unusually low pricing — verify scope and quality`;
      break;
    case 'negative':
      summary = `Significantly above market at ${Math.abs(percentDiff).toFixed(0)}% premium`;
      break;
    default:
      summary = explanation;
  }
  
  return {
    score,
    weight: 0.30,
    verdict,
    verdictSentiment,
    percentDiff,
    bidPsf,
    marketPsf,
    summary,
  };
}

// ============================================================================
// GRADE & SUMMARY GENERATION
// ============================================================================

function determineGrade(score: number): { grade: Grade; gradeLabel: string } {
  if (score >= GRADE_THRESHOLDS.A.min) {
    return { grade: 'A', gradeLabel: GRADE_THRESHOLDS.A.label };
  }
  if (score >= GRADE_THRESHOLDS.B.min) {
    return { grade: 'B', gradeLabel: GRADE_THRESHOLDS.B.label };
  }
  if (score >= GRADE_THRESHOLDS.C.min) {
    return { grade: 'C', gradeLabel: GRADE_THRESHOLDS.C.label };
  }
  if (score >= GRADE_THRESHOLDS.D.min) {
    return { grade: 'D', gradeLabel: GRADE_THRESHOLDS.D.label };
  }
  return { grade: 'F', gradeLabel: GRADE_THRESHOLDS.F.label };
}

function generateOverallSummary(
  overall: number,
  grade: Grade,
  contractRisk: ContractRiskDimension,
  scopeCompleteness: ScopeCompletenessDimension,
  priceReasonableness: PriceReasonablenessDimension
): string {
  // Identify the weakest dimension
  const dimensions = [
    { name: 'contract protection', score: contractRisk.score },
    { name: 'scope documentation', score: scopeCompleteness.score },
    { name: 'price reasonableness', score: priceReasonableness.score },
  ];
  dimensions.sort((a, b) => a.score - b.score);
  const weakest = dimensions[0];
  const strongest = dimensions[2];
  
  if (grade === 'A') {
    return `This bid scores ${overall}/100 — an excellent overall assessment. ` +
      `Strong ${strongest.name} with minor areas for improvement.`;
  }
  
  if (grade === 'B') {
    return `This bid scores ${overall}/100 — a good foundation. ` +
      `Consider addressing ${weakest.name} (${weakest.score}/100) before proceeding.`;
  }
  
  if (grade === 'C') {
    return `This bid scores ${overall}/100 — acceptable but needs attention. ` +
      `${weakest.name.charAt(0).toUpperCase() + weakest.name.slice(1)} is the primary concern at ${weakest.score}/100.`;
  }
  
  if (grade === 'D') {
    return `This bid scores ${overall}/100 — significant concerns exist. ` +
      `Focus on improving ${weakest.name} and ${dimensions[1].name} before signing.`;
  }
  
  return `This bid scores ${overall}/100 — substantial issues require resolution. ` +
    `Review all flagged items carefully and consider alternative quotes.`;
}

function generateRecommendations(
  contractRisk: ContractRiskDimension,
  scopeCompleteness: ScopeCompletenessDimension,
  priceReasonableness: PriceReasonablenessDimension
): string[] {
  const recommendations: string[] = [];
  
  // Contract risk recommendations
  if (contractRisk.criticalCount > 0) {
    const criticalFlag = contractRisk.flags.find(f => f.level === 'critical');
    if (criticalFlag) {
      recommendations.push(criticalFlag.recommendation);
    }
  } else if (contractRisk.highCount > 0) {
    const highFlag = contractRisk.flags.find(f => f.level === 'high');
    if (highFlag) {
      recommendations.push(highFlag.recommendation);
    }
  }
  
  // Scope recommendations
  if (scopeCompleteness.criticalMissing > 0) {
    recommendations.push('Request clarification on critical scope items before signing');
  } else if (scopeCompleteness.importantMissing > 2) {
    recommendations.push('Ask contractor to detail what is included vs. excluded');
  }
  
  // Price recommendations
  if (priceReasonableness.verdictSentiment === 'warning') {
    recommendations.push('Verify bid includes full scope — unusually low prices often indicate exclusions');
  } else if (priceReasonableness.verdictSentiment === 'negative') {
    recommendations.push('Get 2-3 additional quotes to ensure competitive pricing');
  } else if (priceReasonableness.percentDiff > 15) {
    recommendations.push('Negotiate pricing or ask what justifies the premium');
  }
  
  // Generic recommendations if we don't have enough
  if (recommendations.length === 0) {
    recommendations.push('Verify contractor license and insurance before signing');
  }
  if (recommendations.length < 2 && contractRisk.mediumCount > 0) {
    recommendations.push('Review medium-priority flags for potential improvements');
  }
  if (recommendations.length < 3) {
    recommendations.push('Request a written change order process before work begins');
  }
  
  return recommendations.slice(0, 3);
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

/**
 * Get color class for grade
 */
export function getGradeColor(grade: Grade): string {
  switch (grade) {
    case 'A': return 'text-emerald-600';
    case 'B': return 'text-teal-600';
    case 'C': return 'text-amber-600';
    case 'D': return 'text-orange-600';
    case 'F': return 'text-red-600';
    default: return 'text-gray-600';
  }
}

/**
 * Get background color class for grade
 */
export function getGradeBgColor(grade: Grade): string {
  switch (grade) {
    case 'A': return 'bg-emerald-50 border-emerald-200';
    case 'B': return 'bg-teal-50 border-teal-200';
    case 'C': return 'bg-amber-50 border-amber-200';
    case 'D': return 'bg-orange-50 border-orange-200';
    case 'F': return 'bg-red-50 border-red-200';
    default: return 'bg-gray-50 border-gray-200';
  }
}

/**
 * Get dimension score color
 */
export function getDimensionColor(score: number): string {
  if (score >= 85) return 'text-emerald-600';
  if (score >= 70) return 'text-teal-600';
  if (score >= 55) return 'text-amber-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
}

/**
 * Format dimension score for display
 */
export function formatDimensionScore(score: number): string {
  return `${score}/100`;
}
