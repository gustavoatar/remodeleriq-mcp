/**
 * BLENDED PRICING ENGINE
 * 
 * Combines multiple data sources with weighted averaging:
 * - Zonda Cost vs Value (70% weight) - Primary source
 * - Houzz Cost Guides (15% weight) - Secondary validation
 * - BLS OEWS Wage Data (15% weight) - Labor rate validation
 * 
 * When a secondary source is missing data, the weight redistributes
 * to available sources proportionally.
 */

import { getSmartRule, getExpectedLaborRatio as getZondaLaborRatio, type PricingRange } from './smartPricingRules';
import { getHouzzBenchmark, getHouzzTotalCostRange, getHouzzPsfRange, getExpectedLaborRatio as getHouzzLaborRatio } from './houzzBenchmarks';
import { FALLBACK_WAGES, STATE_WAGE_MULTIPLIERS, CONTRACTOR_MULTIPLIER, type TradeType } from './blsLaborRates';

// ============================================================================
// WEIGHTING CONFIGURATION
// ============================================================================

export const DATA_SOURCE_WEIGHTS = {
  ZONDA: 0.70,   // Primary source - Zonda Cost vs Value
  HOUZZ: 0.15,   // Secondary - Houzz cost guides
  BLS: 0.15,     // Secondary - BLS wage data
} as const;

// Verify weights sum to 1.0
const TOTAL_WEIGHT = DATA_SOURCE_WEIGHTS.ZONDA + DATA_SOURCE_WEIGHTS.HOUZZ + DATA_SOURCE_WEIGHTS.BLS;
if (Math.abs(TOTAL_WEIGHT - 1.0) > 0.001) {
  console.warn(`Data source weights sum to ${TOTAL_WEIGHT}, expected 1.0`);
}

// ============================================================================
// TYPES
// ============================================================================

export interface BlendedPricingResult {
  // Blended pricing range
  pricing: PricingRange;
  
  // Labor percentage range (blended)
  laborPercent: { min: number; max: number };
  
  // Fair hourly rate for labor (BLS-derived)
  fairHourlyRate: number | null;
  
  // Source breakdown showing what contributed
  sources: {
    zonda: { available: boolean; weight: number; pricing?: PricingRange };
    houzz: { available: boolean; weight: number; pricing?: PricingRange };
    bls: { available: boolean; weight: number; hourlyRate?: number };
  };
  
  // Effective weights after redistribution
  effectiveWeights: {
    zonda: number;
    houzz: number;
    bls: number;
  };
  
  // Unit type
  unit: '$/SF' | '$/SQ' | '$/LF' | '$/EA' | '$/System' | 'project';
}

export interface BlendedLaborResult {
  // Blended labor percentage
  laborPercent: { min: number; max: number };
  
  // Fair hourly rate (includes overhead + profit)
  fairHourlyRate: number;
  
  // BLS base wage (before multiplier)
  blsBaseWage: number;
  
  // Sources used
  sources: {
    zonda: boolean;
    houzz: boolean;
    bls: boolean;
  };
}

// ============================================================================
// PROJECT TYPE TO TRADE MAPPING
// ============================================================================

/**
 * Maps project types to BLS trade types for labor rate lookup
 */
const PROJECT_TO_TRADE: Record<string, TradeType> = {
  // Kitchen/Bath
  'kitchen': 'carpenter',
  'kitchen-remodel': 'carpenter',
  'bathroom': 'plumber',
  'bathroom-remodel': 'plumber',
  
  // Flooring
  'flooring': 'floor_installer',
  'flooring-hardwood': 'floor_installer',
  'flooring-laminate': 'floor_installer',
  'flooring-lvp': 'floor_installer',
  'flooring-carpet': 'floor_installer',
  'hardwood': 'floor_installer',
  'laminate': 'floor_installer',
  'carpet': 'floor_installer',
  
  // Tile
  'tile': 'tile_setter',
  'tile-floor': 'tile_setter',
  'tile-backsplash': 'tile_setter',
  'tile-shower': 'tile_setter',
  
  // Roofing
  'roof': 'roofer',
  'roofing': 'roofer',
  'roofing-asphalt': 'roofer',
  'roofing-repair': 'roofer',
  
  // Painting
  'painting': 'painter',
  'paint-interior': 'painter',
  'paint-exterior': 'painter',
  'exterior-painting': 'painter',
  'interior-painting': 'painter',
  
  // HVAC
  'hvac': 'hvac_technician',
  'hvac-ac': 'hvac_technician',
  'hvac-furnace': 'hvac_technician',
  'hvac-heat-pump': 'hvac_technician',
  'ac': 'hvac_technician',
  'furnace': 'hvac_technician',
  
  // Electrical
  'electrical': 'electrician',
  'electrical-panel': 'electrician',
  'electrical-outlet': 'electrician',
  
  // Plumbing
  'plumbing': 'plumber',
  'water-heater': 'plumber',
  
  // Drywall
  'drywall': 'drywall_installer',
  
  // Carpentry/General
  'deck': 'carpenter',
  'fence': 'carpenter',
  'trim': 'carpenter',
  'trim-base': 'carpenter',
  'trim-crown': 'carpenter',
  'door-interior': 'carpenter',
  'door-entry-steel': 'carpenter',
  'door-entry-fiberglass': 'carpenter',
  'windows': 'carpenter',
  'garage-door': 'carpenter',
  'basement': 'carpenter',
  'basement-remodel': 'carpenter',
  'addition': 'carpenter',
  
  // Siding
  'siding': 'carpenter',
  'siding-vinyl': 'carpenter',
  'siding-fiber-cement': 'carpenter',
  
  // Landscaping
  'landscaping': 'landscaper',
  'patio': 'landscaper',
  'paver-patio': 'landscaper',
  'retaining-wall': 'landscaper',
  
  // Countertops (material-heavy, use carpenter for install)
  'countertops': 'carpenter',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get BLS-derived fair hourly rate for a project type
 * Applies regional multiplier and contractor overhead
 */
export function getBLSFairRate(projectType: string, stateCode?: string): number | null {
  const normalized = projectType.toLowerCase().replace(/[_\s]+/g, '-');
  const tradeType = PROJECT_TO_TRADE[normalized];
  
  if (!tradeType) {
    return null;
  }
  
  // Get base wage for trade
  const baseWage = FALLBACK_WAGES[tradeType];
  if (!baseWage) {
    return null;
  }
  
  // Apply state multiplier if provided
  const stateMultiplier = stateCode ? (STATE_WAGE_MULTIPLIERS[stateCode.toUpperCase()] ?? 1.0) : 1.0;
  const adjustedWage = baseWage * stateMultiplier;
  
  // Apply contractor multiplier (2.8x) to get fair billable rate
  const fairRate = adjustedWage * CONTRACTOR_MULTIPLIER;
  
  return Math.round(fairRate * 100) / 100;
}

/**
 * Redistribute weights when a source is unavailable
 */
function redistributeWeights(
  hasZonda: boolean,
  hasHouzz: boolean,
  hasBLS: boolean
): { zonda: number; houzz: number; bls: number } {
  const availableSources = [
    hasZonda ? DATA_SOURCE_WEIGHTS.ZONDA : 0,
    hasHouzz ? DATA_SOURCE_WEIGHTS.HOUZZ : 0,
    hasBLS ? DATA_SOURCE_WEIGHTS.BLS : 0,
  ];
  
  const totalAvailable = availableSources.reduce((sum, w) => sum + w, 0);
  
  if (totalAvailable === 0) {
    // No sources available - return equal weights
    return { zonda: 0.33, houzz: 0.33, bls: 0.34 };
  }
  
  // Normalize weights to sum to 1.0
  return {
    zonda: hasZonda ? DATA_SOURCE_WEIGHTS.ZONDA / totalAvailable : 0,
    houzz: hasHouzz ? DATA_SOURCE_WEIGHTS.HOUZZ / totalAvailable : 0,
    bls: hasBLS ? DATA_SOURCE_WEIGHTS.BLS / totalAvailable : 0,
  };
}

/**
 * Blend two pricing ranges with weights
 */
function blendPricingRanges(
  pricing1: PricingRange | null,
  weight1: number,
  pricing2: PricingRange | null,
  weight2: number
): PricingRange | null {
  if (!pricing1 && !pricing2) return null;
  if (!pricing1) return pricing2;
  if (!pricing2) return pricing1;
  
  const totalWeight = weight1 + weight2;
  if (totalWeight === 0) return pricing1;
  
  const w1 = weight1 / totalWeight;
  const w2 = weight2 / totalWeight;
  
  return {
    low: Math.round(pricing1.low * w1 + pricing2.low * w2),
    median: Math.round(pricing1.median * w1 + pricing2.median * w2),
    high: Math.round(pricing1.high * w1 + pricing2.high * w2),
  };
}

/**
 * Blend labor percentage ranges
 */
function blendLaborRanges(
  ranges: Array<{ min: number; max: number } | null>,
  weights: number[]
): { min: number; max: number } {
  let totalWeight = 0;
  let weightedMin = 0;
  let weightedMax = 0;
  
  for (let i = 0; i < ranges.length; i++) {
    const range = ranges[i];
    const weight = weights[i];
    
    if (range && weight > 0) {
      weightedMin += range.min * weight;
      weightedMax += range.max * weight;
      totalWeight += weight;
    }
  }
  
  if (totalWeight === 0) {
    // Default labor range
    return { min: 0.40, max: 0.60 };
  }
  
  return {
    min: Math.round((weightedMin / totalWeight) * 100) / 100,
    max: Math.round((weightedMax / totalWeight) * 100) / 100,
  };
}

// ============================================================================
// MAIN BLENDING FUNCTIONS
// ============================================================================

/**
 * Get blended pricing benchmark for a project type
 * Combines Zonda, Houzz, and BLS data with weighted averaging
 */
export function getBlendedBenchmark(
  projectType: string,
  options?: {
    stateCode?: string;
    squareFootage?: number;
  }
): BlendedPricingResult | null {
  const normalized = projectType.toLowerCase().replace(/[_\s]+/g, '-');
  const { stateCode, squareFootage } = options || {};
  
  // Get Zonda data
  const zondaRule = getSmartRule(normalized);
  const zondaPricing = zondaRule?.basePricing || null;
  const zondaLabor = getZondaLaborRatio(normalized);
  const hasZonda = !!zondaPricing;
  
  // Get Houzz data
  const houzzBenchmark = getHouzzBenchmark(normalized);
  let houzzPricing: PricingRange | null = null;
  
  // Convert Houzz total cost to pricing range
  const houzzCostRange = getHouzzTotalCostRange(normalized);
  if (houzzCostRange) {
    houzzPricing = {
      low: houzzCostRange.low,
      median: Math.round((houzzCostRange.low + houzzCostRange.high) / 2),
      high: houzzCostRange.high,
    };
  }
  
  // Try PSF if total cost not available
  const houzzPsfRange = getHouzzPsfRange(normalized);
  if (!houzzPricing && houzzPsfRange && squareFootage) {
    houzzPricing = {
      low: Math.round(houzzPsfRange.low * squareFootage),
      median: Math.round(((houzzPsfRange.low + houzzPsfRange.high) / 2) * squareFootage),
      high: Math.round(houzzPsfRange.high * squareFootage),
    };
  }
  
  const houzzLabor = getHouzzLaborRatio(normalized);
  const hasHouzz = !!houzzPricing || !!houzzLabor;
  
  // Get BLS data
  const blsFairRate = getBLSFairRate(normalized, stateCode);
  const hasBLS = !!blsFairRate;
  
  // If no data from any source, return null
  if (!hasZonda && !hasHouzz && !hasBLS) {
    return null;
  }
  
  // Calculate effective weights
  const weights = redistributeWeights(hasZonda, hasHouzz, hasBLS);
  
  // Blend pricing (Zonda + Houzz only - BLS is for labor validation)
  const pricingWeights = redistributeWeights(hasZonda, hasHouzz, false);
  const blendedPricing = blendPricingRanges(
    zondaPricing,
    pricingWeights.zonda,
    houzzPricing,
    pricingWeights.houzz
  );
  
  // Blend labor percentages
  const blendedLabor = blendLaborRanges(
    [zondaLabor, houzzLabor],
    [weights.zonda, weights.houzz]
  );
  
  // Determine unit type
  let unit: BlendedPricingResult['unit'] = 'project';
  if (zondaRule && 'unit' in zondaRule) {
    unit = zondaRule.unit as BlendedPricingResult['unit'];
  }
  
  return {
    pricing: blendedPricing || { low: 0, median: 0, high: 0 },
    laborPercent: blendedLabor,
    fairHourlyRate: blsFairRate,
    sources: {
      zonda: {
        available: hasZonda,
        weight: weights.zonda,
        pricing: zondaPricing || undefined,
      },
      houzz: {
        available: hasHouzz,
        weight: weights.houzz,
        pricing: houzzPricing || undefined,
      },
      bls: {
        available: hasBLS,
        weight: weights.bls,
        hourlyRate: blsFairRate || undefined,
      },
    },
    effectiveWeights: weights,
    unit,
  };
}

/**
 * Get blended labor rate analysis
 * Combines Zonda labor ratios with BLS wage data
 */
export function getBlendedLaborRate(
  projectType: string,
  stateCode?: string
): BlendedLaborResult {
  const normalized = projectType.toLowerCase().replace(/[_\s]+/g, '-');
  
  // Get Zonda labor ratio
  const zondaLabor = getZondaLaborRatio(normalized);
  const hasZonda = !!zondaLabor;
  
  // Get Houzz labor ratio
  const houzzLabor = getHouzzLaborRatio(normalized);
  const hasHouzz = !!houzzLabor;
  
  // Get BLS fair rate
  const tradeType = PROJECT_TO_TRADE[normalized];
  const blsBaseWage = tradeType ? FALLBACK_WAGES[tradeType] : null;
  const stateMultiplier = stateCode ? (STATE_WAGE_MULTIPLIERS[stateCode.toUpperCase()] ?? 1.0) : 1.0;
  const adjustedWage = blsBaseWage ? blsBaseWage * stateMultiplier : 24.00; // Default $24/hr
  const fairHourlyRate = adjustedWage * CONTRACTOR_MULTIPLIER;
  
  // Calculate weights
  const weights = redistributeWeights(hasZonda, hasHouzz, true);
  
  // Blend labor percentages
  const blendedLabor = blendLaborRanges(
    [zondaLabor, houzzLabor],
    [weights.zonda, weights.houzz]
  );
  
  return {
    laborPercent: blendedLabor,
    fairHourlyRate: Math.round(fairHourlyRate * 100) / 100,
    blsBaseWage: Math.round(adjustedWage * 100) / 100,
    sources: {
      zonda: hasZonda,
      houzz: hasHouzz,
      bls: true,
    },
  };
}

/**
 * Validate a bid price against blended benchmarks
 */
export function validateBidAgainstBlended(
  projectType: string,
  bidTotal: number,
  options?: {
    stateCode?: string;
    squareFootage?: number;
  }
): {
  verdict: 'low' | 'fair' | 'high' | 'very-high' | 'unknown';
  percentFromMedian: number;
  blendedBenchmark: BlendedPricingResult | null;
  insight: string;
} {
  const benchmark = getBlendedBenchmark(projectType, options);
  
  if (!benchmark || benchmark.pricing.median === 0) {
    return {
      verdict: 'unknown',
      percentFromMedian: 0,
      blendedBenchmark: null,
      insight: 'Insufficient benchmark data for this project type.',
    };
  }
  
  const { low, median, high } = benchmark.pricing;
  const percentFromMedian = Math.round(((bidTotal - median) / median) * 100);
  
  let verdict: 'low' | 'fair' | 'high' | 'very-high';
  let insight: string;
  
  if (bidTotal < low * 0.8) {
    verdict = 'low';
    insight = `This bid is ${Math.abs(percentFromMedian)}% below typical market rates. This could indicate missing scope, unlicensed work, or quality concerns.`;
  } else if (bidTotal <= high * 1.1) {
    verdict = 'fair';
    insight = `This bid falls within the typical market range based on our blended analysis of industry data.`;
  } else if (bidTotal <= high * 1.3) {
    verdict = 'high';
    insight = `This bid is ${percentFromMedian}% above the median. Consider requesting a detailed breakdown or getting additional quotes.`;
  } else {
    verdict = 'very-high';
    insight = `This bid is ${percentFromMedian}% above typical rates. Request justification for premium pricing or explore alternatives.`;
  }
  
  return {
    verdict,
    percentFromMedian,
    blendedBenchmark: benchmark,
    insight,
  };
}

// ============================================================================
// EXPORTS FOR DEBUGGING/DISPLAY
// ============================================================================

export { DATA_SOURCE_WEIGHTS as PRICING_WEIGHTS };
