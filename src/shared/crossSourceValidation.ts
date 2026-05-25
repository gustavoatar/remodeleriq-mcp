/**
 * Cross-Source Validation Engine
 * Compares Houzz vs Zonda data to determine confidence levels
 * When sources align within 15%, show "High Confidence - Validated by 2+ sources"
 * When sources diverge >38%, we average the sources to avoid extreme estimates
 */

import { getHouzzTotalCostRange, HOUZZ_BENCHMARKS } from './houzzBenchmarks';
import { ZONDA_COST_DATA, mapToZondaProjectKey, STATE_TO_ZONDA_REGION } from './zondaCostData';
import { estimateProjectCost, normalizeProjectType, type TradeMix, type ProjectType } from './mixedBidRateEngine';
import { isMajorRenovation, getWeightedEstimate, type MajorRenovationResult } from './majorRenovationDetection';
export { isMajorRenovation };

// Variance threshold for averaging sources (38%)
const HIGH_VARIANCE_THRESHOLD = 38;

// Tier multipliers to adjust Houzz base costs by finish level
// Houzz data is typically midrange - scale up/down for other tiers
const TIER_MULTIPLIERS: Record<string, Record<'minor' | 'midrange' | 'upscale', number>> = {
  'kitchen': { minor: 0.65, midrange: 1.0, upscale: 2.2 },
  'bathroom': { minor: 0.7, midrange: 1.0, upscale: 1.8 },
  'basement': { minor: 0.75, midrange: 1.0, upscale: 1.6 },
  'default': { minor: 0.75, midrange: 1.0, upscale: 1.5 }
};

export type SourceConfidence = 'high' | 'medium' | 'low';

export interface CrossSourceResult {
  confidence: SourceConfidence;
  confidenceLabel: string;
  confidenceDescription: string;
  
  // Source data
  houzzRange: { low: number; high: number } | null;
  zondaCost: number | null;
  zondaTier: 'minor' | 'midrange' | 'upscale' | null;
  blsEstimate: { low: number; median: number; high: number } | null;
  
  // Comparison
  sourcesAgree: boolean;
  divergencePercent: number | null;
  
  // Combined estimate
  combinedLow: number;
  combinedHigh: number;
  combinedMedian: number;
  
  // Weighting info (Houzz-primary by default)
  majorRenovation: MajorRenovationResult | null;
  primarySource: 'houzz' | 'zonda' | 'averaged';
  
  // Display
  sourcesUsed: string[];
  methodology: string;
}

/**
 * Detect tier (Midrange vs Upscale) based on bid amount
 */
export function detectTier(
  projectType: string, 
  bidTotal: number
): 'minor' | 'midrange' | 'upscale' {
  const normalizedType = projectType.toLowerCase();
  
  // Kitchen tier detection
  if (normalizedType.includes('kitchen')) {
    // Minor: < $45k, Midrange: $45k-$120k, Upscale: > $120k
    if (bidTotal < 45000) return 'minor';
    if (bidTotal > 120000) return 'upscale';
    return 'midrange';
  }
  
  // Bathroom tier detection
  if (normalizedType.includes('bath')) {
    // Midrange: < $50k, Upscale: > $50k
    if (bidTotal > 50000) return 'upscale';
    return 'midrange';
  }
  
  // Default to midrange for other projects
  return 'midrange';
}

/**
 * Get Zonda benchmark for project with tier detection
 */
function getZondaBenchmarkWithTier(
  projectType: string,
  bidTotal: number,
  stateCode?: string
): { cost: number; tier: 'minor' | 'midrange' | 'upscale'; projectKey: string; source: string } | null {
  const normalizedType = projectType.toLowerCase();
  const tier = detectTier(projectType, bidTotal);
  
  // Determine the specific Zonda project key based on tier
  let zondaKey: string | null = null;
  
  if (normalizedType.includes('kitchen')) {
    if (tier === 'minor') zondaKey = 'kitchen-minor';
    else if (tier === 'upscale') zondaKey = 'kitchen-major-upscale';
    else zondaKey = 'kitchen-major-midrange';
  } else if (normalizedType.includes('bath')) {
    if (tier === 'upscale') zondaKey = 'bathroom-upscale';
    else zondaKey = 'bathroom-midrange';
  } else {
    // Use standard mapping for other project types
    zondaKey = mapToZondaProjectKey(projectType);
  }
  
  if (!zondaKey || !ZONDA_COST_DATA[zondaKey]) {
    return null;
  }
  
  const zondaData = ZONDA_COST_DATA[zondaKey];
  let cost = zondaData.nationalCost;
  let source = 'Zonda 2025 National';
  
  // Try to get regional cost if state is provided
  if (stateCode) {
    const region = STATE_TO_ZONDA_REGION[stateCode.toUpperCase()];
    if (region && zondaData.regions[region]) {
      cost = zondaData.regions[region].cost;
      source = `Zonda 2025 ${region.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`;
    }
  }
  
  return { cost, tier, projectKey: zondaKey, source };
}

/**
 * Get tier-adjusted Houzz estimate
 * Houzz data is typically midrange - scale for other finish levels
 */
function getTierAdjustedHouzz(
  houzzRange: { low: number; high: number },
  projectType: string,
  tier: 'minor' | 'midrange' | 'upscale'
): { low: number; high: number } {
  const normalizedType = projectType.toLowerCase();
  
  // Find the right multiplier category
  let multiplierKey = 'default';
  if (normalizedType.includes('kitchen')) multiplierKey = 'kitchen';
  else if (normalizedType.includes('bath')) multiplierKey = 'bathroom';
  else if (normalizedType.includes('basement')) multiplierKey = 'basement';
  
  const multiplier = TIER_MULTIPLIERS[multiplierKey][tier];
  
  return {
    low: Math.round(houzzRange.low * multiplier),
    high: Math.round(houzzRange.high * multiplier)
  };
}

/**
 * Cross-validate project costs using Houzz, Zonda, and BLS data
 * BLS estimate is calculated from bottom-up labor costs when square footage is available
 */
export function crossValidateCosts(
  projectType: string,
  bidTotal: number,
  stateCode?: string,
  squareFootage?: number,
  customTradeMix?: TradeMix,
  projectText?: string
): CrossSourceResult {
  const normalizedType = projectType.toLowerCase();
  
  // Detect if this is a major renovation (determines Houzz vs Zonda weighting)
  const majorRenovation = isMajorRenovation(bidTotal, projectType, projectText);
  
  // Get raw Houzz data
  const rawHouzzRange = getHouzzTotalCostRange(normalizedType);
  
  // Get Zonda data with tier detection
  const zondaData = getZondaBenchmarkWithTier(projectType, bidTotal, stateCode);
  const zondaCost = zondaData?.cost || null;
  const zondaTier = zondaData?.tier || 'midrange';
  
  // Adjust Houzz range based on detected tier to compare apples-to-apples
  const houzzRange = rawHouzzRange 
    ? getTierAdjustedHouzz(rawHouzzRange, projectType, zondaTier)
    : null;
  
  // Calculate BLS estimate when we have square footage
  let blsEstimate: { low: number; median: number; high: number } | null = null;
  if (squareFootage && squareFootage > 0) {
    try {
      const blsProjectType = normalizeProjectType(projectType) as ProjectType;
      const zipCode = stateCode ? `${stateCode}000` : undefined; // Construct approximate ZIP
      const blsCost = estimateProjectCost(blsProjectType, squareFootage, zipCode, customTradeMix);
      if (blsCost.totalCostLow > 0) {
        blsEstimate = {
          low: blsCost.totalCostLow,
          median: blsCost.totalCostMedian,
          high: blsCost.totalCostHigh
        };
      }
    } catch {
      // BLS estimate not available for this project type
    }
  }
  
  const sourcesUsed: string[] = [];
  const sourceMedians: number[] = [];
  
  // Collect all available source medians
  if (houzzRange) {
    sourcesUsed.push('Houzz 2024');
    sourceMedians.push((houzzRange.low + houzzRange.high) / 2);
  }
  if (zondaCost) {
    sourcesUsed.push(zondaData?.source || 'Zonda 2025');
    sourceMedians.push(zondaCost);
  }
  if (blsEstimate) {
    sourcesUsed.push('BLS OEWS');
    sourceMedians.push(blsEstimate.median);
  }
  
  // No sources available
  if (sourceMedians.length === 0) {
    return {
      confidence: 'low',
      confidenceLabel: 'Limited Data',
      confidenceDescription: 'No benchmark data available for this project type',
      houzzRange: null,
      zondaCost: null,
      zondaTier: null,
      blsEstimate: null,
      sourcesAgree: false,
      divergencePercent: null,
      combinedLow: 0,
      combinedHigh: 0,
      combinedMedian: 0,
      majorRenovation,
      primarySource: 'houzz',
      sourcesUsed: [],
      methodology: 'Unable to validate - no matching benchmarks found'
    };
  }
  
  // Calculate max divergence between any two sources
  let maxDivergence = 0;
  for (let i = 0; i < sourceMedians.length; i++) {
    for (let j = i + 1; j < sourceMedians.length; j++) {
      const div = Math.abs(sourceMedians[i] - sourceMedians[j]) / 
                  Math.max(sourceMedians[i], sourceMedians[j]) * 100;
      maxDivergence = Math.max(maxDivergence, div);
    }
  }
  const divergencePercent = sourceMedians.length > 1 ? maxDivergence : null;
  
  // Sources agree if all within 25% of each other (relaxed threshold for 3 sources)
  const AGREEMENT_THRESHOLD = sourceMedians.length >= 3 ? 25 : 15;
  const sourcesAgree = divergencePercent !== null && divergencePercent <= AGREEMENT_THRESHOLD;
  
  // Calculate combined estimate using WEIGHTED sources (Houzz-primary by default)
  let combinedLow: number;
  let combinedHigh: number;
  let primarySource: 'houzz' | 'zonda' | 'averaged' = 'houzz';
  
  const houzzMedian = houzzRange ? (houzzRange.low + houzzRange.high) / 2 : null;
  
  if (sourceMedians.length >= 2 && divergencePercent && divergencePercent > HIGH_VARIANCE_THRESHOLD) {
    // High variance (>38%): use WEIGHTED average based on major renovation status
    // Major renovations: Zonda 60%, Houzz 40%
    // Standard projects: Houzz 80%, Zonda 20%
    primarySource = 'averaged';
    
    const weightedMedian = getWeightedEstimate(
      houzzMedian,
      zondaCost,
      majorRenovation
    );
    
    if (weightedMedian !== null) {
      combinedLow = Math.round(weightedMedian * 0.85);
      combinedHigh = Math.round(weightedMedian * 1.15);
    } else {
      // Fallback to simple average if weighted calc fails
      const averagedMedian = sourceMedians.reduce((a, b) => a + b, 0) / sourceMedians.length;
      combinedLow = Math.round(averagedMedian * 0.85);
      combinedHigh = Math.round(averagedMedian * 1.15);
    }
  } else if (houzzRange && zondaCost) {
    // Both sources available and within threshold - use weighted combination
    const weightedMedian = getWeightedEstimate(houzzMedian, zondaCost, majorRenovation);
    
    if (weightedMedian !== null) {
      // Use weighted median with appropriate spread
      combinedLow = Math.round(weightedMedian * 0.88);
      combinedHigh = Math.round(weightedMedian * 1.12);
      primarySource = majorRenovation.isMajor ? 'zonda' : 'houzz';
    } else {
      combinedLow = houzzRange.low;
      combinedHigh = houzzRange.high;
    }
  } else if (houzzRange) {
    // Only Houzz available - use it as primary
    combinedLow = houzzRange.low;
    combinedHigh = houzzRange.high;
    primarySource = 'houzz';
  } else if (zondaCost) {
    // Only Zonda available - use it with ±10% range
    combinedLow = Math.round(zondaCost * 0.9);
    combinedHigh = Math.round(zondaCost * 1.1);
    primarySource = 'zonda';
  } else if (blsEstimate) {
    // Only BLS available
    combinedLow = blsEstimate.low;
    combinedHigh = blsEstimate.high;
    primarySource = 'houzz'; // Default display
  } else {
    combinedLow = 0;
    combinedHigh = 0;
  }
  
  const combinedMedian = (combinedLow + combinedHigh) / 2;
  
  // Determine confidence level
  let confidence: SourceConfidence;
  let confidenceLabel: string;
  let confidenceDescription: string;
  let methodology: string;
  
  // Build weighting description for methodology
  const weightingNote = majorRenovation.isMajor 
    ? `Major renovation (Zonda ${Math.round(majorRenovation.zondaWeight * 100)}%, Houzz ${Math.round(majorRenovation.houzzWeight * 100)}%)`
    : `Standard scope (Houzz ${Math.round(majorRenovation.houzzWeight * 100)}%, Zonda ${Math.round(majorRenovation.zondaWeight * 100)}%)`;
  
  if (sourcesAgree && sourceMedians.length >= 3) {
    confidence = 'high';
    confidenceLabel = 'High Confidence';
    confidenceDescription = `Validated by ${sourceMedians.length} sources (within ${Math.round(divergencePercent!)}% agreement)`;
    methodology = `Cross-validated using ${sourcesUsed.join(', ')}. ${weightingNote}`;
  } else if (sourcesAgree && sourceMedians.length === 2) {
    confidence = 'high';
    confidenceLabel = 'High Confidence';
    confidenceDescription = `Validated by 2 sources (within ${Math.round(divergencePercent!)}% agreement)`;
    methodology = `Cross-validated using ${sourcesUsed.join(' and ')}. ${weightingNote}`;
  } else if (sourceMedians.length >= 2) {
    // Multiple sources but don't agree
    const wasAveraged = divergencePercent! > HIGH_VARIANCE_THRESHOLD;
    confidence = 'medium';
    confidenceLabel = wasAveraged ? 'Weighted Estimate' : 'Multiple Sources';
    confidenceDescription = wasAveraged 
      ? `${sourceMedians.length} sources weighted (${Math.round(divergencePercent!)}% variance)`
      : `${sourceMedians.length} sources show ${Math.round(divergencePercent!)}% variance`;
    methodology = wasAveraged
      ? `Weighted estimate from ${sourcesUsed.join(', ')}. ${weightingNote}`
      : `Combined range from ${sourcesUsed.join(', ')}. ${weightingNote}`;
  } else {
    // Single source
    confidence = 'medium';
    confidenceLabel = 'Single Source';
    confidenceDescription = `Based on ${sourcesUsed[0] || 'available data'}`;
    if (blsEstimate) {
      methodology = `BLS labor cost estimate: $${blsEstimate.low.toLocaleString()}-$${blsEstimate.high.toLocaleString()}`;
    } else if (zondaCost) {
      methodology = `Zonda Cost vs. Value 2025 ${zondaTier} tier: $${zondaCost.toLocaleString()}`;
    } else {
      methodology = `Houzz benchmark: $${houzzRange?.low.toLocaleString()}-$${houzzRange?.high.toLocaleString()}`;
    }
  }
  
  return {
    confidence,
    confidenceLabel,
    confidenceDescription,
    houzzRange,
    zondaCost,
    zondaTier,
    blsEstimate,
    sourcesAgree,
    divergencePercent,
    combinedLow,
    combinedHigh,
    combinedMedian,
    majorRenovation,
    primarySource,
    sourcesUsed,
    methodology
  };
}

/**
 * Get tier label for display
 */
export function getTierLabel(tier: 'minor' | 'midrange' | 'upscale' | null): string {
  switch (tier) {
    case 'minor': return 'Minor/Budget';
    case 'midrange': return 'Midrange';
    case 'upscale': return 'Upscale';
    default: return 'Standard';
  }
}

/**
 * Get all available project types that have cross-source validation
 */
export function getValidatedProjectTypes(): string[] {
  const houzzTypes = Object.keys(HOUZZ_BENCHMARKS);
  const zondaTypes = Object.keys(ZONDA_COST_DATA);
  
  // Return project types that exist in both
  const validated: string[] = [];
  for (const houzzKey of houzzTypes) {
    const zondaKey = mapToZondaProjectKey(houzzKey);
    if (zondaKey && zondaTypes.includes(zondaKey)) {
      validated.push(houzzKey);
    }
  }
  
  return validated;
}
