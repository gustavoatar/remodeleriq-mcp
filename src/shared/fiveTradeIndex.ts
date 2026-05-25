/**
 * Five-Trade Finish Level Auditor
 * 
 * Benchmarks any bid in the US against localized 'Basic', 'Good', and 'Luxury' 
 * price tiers using a weighted index of 5 key construction trades.
 * 
 * The logic correctly weights different trades based on project scope:
 * - "Luxury" projects rely heavily on Tile Setters, Plumbers, and Electricians
 * - "Basic" projects rely mostly on Painters and Carpenters
 * 
 * This gives users a much more accurate "Fair Price" than generic calculators.
 */

import { FALLBACK_WAGES, type TradeType } from './blsLaborRates';

// ============================================================================
// NATIONAL BASELINES (2025/2026)
// ============================================================================

/**
 * National Mean Hourly Wages from BLS (2025 baseline)
 * These serve as the DENOMINATOR for our index calculations
 * Source: Bureau of Labor Statistics Occupational Employment Statistics
 */
export const NATIONAL_MEAN_WAGES: Record<string, number> = {
  plumber: 32.62,      // 47-2152: Plumbers, Pipefitters, and Steamfitters
  electrician: 32.60,  // 47-2111: Electricians
  carpenter: 28.51,    // 47-2031: Carpenters
  tile_setter: 25.92,  // 47-2044: Tile and Stone Setters
  painter: 24.55,      // 47-2141: Painters, Construction and Maintenance
};

/**
 * National Project Price Per Square Foot Baselines
 * Based on industry averages for bathroom/kitchen remodels
 */
export const NATIONAL_PSF_BASELINES = {
  basic: 100,   // Cosmetic: Paint, Stock Vanities, LVP flooring
  good: 160,    // Semi-Custom: Porcelain Tile, Updated Lighting, Mid-range fixtures
  luxury: 225,  // Structural: Moving Walls, Natural Stone, Wet Rooms, Custom
} as const;

export type FinishLevel = keyof typeof NATIONAL_PSF_BASELINES;

// ============================================================================
// FINISH LEVEL DEFINITIONS
// ============================================================================

export interface FinishLevelDefinition {
  level: FinishLevel;
  label: string;
  description: string;
  keywords: RegExp[];
  typicalScope: string[];
}

export const FINISH_LEVEL_DEFINITIONS: FinishLevelDefinition[] = [
  {
    level: 'basic',
    label: 'Basic / Cosmetic',
    description: 'Surface-level updates without structural changes',
    keywords: [
      /paint\s*(only|walls?|interior)/i,
      /stock\s*(cabinet|vanit)/i,
      /lvp|vinyl\s*plank|laminate/i,
      /re-?paint/i,
      /cosmetic/i,
      /refresh/i,
      /update\s*(only|basic)/i,
      /fiberglass\s*(tub|shower)/i,
      /builder[\s-]?grade/i,
    ],
    typicalScope: [
      'Paint walls and trim',
      'Stock vanity replacement',
      'LVP or laminate flooring',
      'Basic fixture swaps',
      'No plumbing relocation',
    ],
  },
  {
    level: 'good',
    label: 'Good / Semi-Custom',
    description: 'Quality upgrades with some custom elements',
    keywords: [
      /porcelain\s*tile/i,
      /ceramic\s*tile/i,
      /semi[\s-]?custom/i,
      /quartz/i,
      /updated\s*light/i,
      /new\s*light\s*fixture/i,
      /tile\s*(floor|shower|backsplash)/i,
      /undermount\s*sink/i,
      /soft[\s-]?close/i,
    ],
    typicalScope: [
      'Porcelain or ceramic tile',
      'Semi-custom cabinetry',
      'Quartz countertops',
      'Updated lighting fixtures',
      'Minor plumbing updates',
    ],
  },
  {
    level: 'luxury',
    label: 'Luxury / Custom',
    description: 'High-end finishes with structural modifications',
    keywords: [
      /marble|natural\s*stone|travertine|slate/i,
      /custom\s*(cabinet|vanit|tile)/i,
      /wet\s*room/i,
      /steam\s*shower/i,
      /radiant\s*(heat|floor)/i,
      /move\s*(wall|plumbing)/i,
      /structural/i,
      /expand/i,
      /relocat/i,
      /frameless\s*glass/i,
      /designer|luxury|high[\s-]?end/i,
      /heated\s*floor/i,
      /body\s*spray/i,
      /rain\s*head/i,
    ],
    typicalScope: [
      'Natural stone or custom tile',
      'Custom cabinetry',
      'Structural modifications',
      'Wet room / curbless shower',
      'Radiant floor heating',
      'Premium fixtures and finishes',
    ],
  },
];

// ============================================================================
// LOCAL INDEX CALCULATION
// ============================================================================

export interface TradeMarketFactor {
  trade: string;
  localWage: number;
  nationalWage: number;
  factor: number; // localWage / nationalWage
}

export interface LocalMarketIndex {
  zipCode: string;
  city: string;
  stateCode: string;
  
  // Individual trade factors
  tradeFactors: TradeMarketFactor[];
  
  // Composite indices
  luxuryIndex: number;  // Weighted toward tile/plumbing/electrical
  basicIndex: number;   // Weighted toward paint/carpentry
  goodIndex: number;    // Blend of both
  
  // Localized PSF tiers
  localBasicPSF: number;
  localGoodPSF: number;
  localLuxuryPSF: number;
  
  // Confidence and metadata
  confidence: 'high' | 'medium' | 'low';
  dataSource: 'bls-api' | 'state-average' | 'national-fallback';
  lastUpdated: string;
}

/**
 * Calculate market factor for a single trade
 */
function calculateTradeFactor(
  trade: string, 
  localWage: number, 
  nationalWage: number
): TradeMarketFactor {
  return {
    trade,
    localWage,
    nationalWage,
    factor: Math.round((localWage / nationalWage) * 100) / 100,
  };
}

/**
 * Calculate the Local Market Index for a given location
 * 
 * The key insight: different finish levels rely on different trades.
 * - Luxury remodels are driven by Tile Setters (40%), Plumbers (30%), Electricians (30%)
 * - Basic remodels are driven by Painters (50%), Carpenters (50%)
 * - Good remodels blend both: 40% Luxury + 60% Basic weighting
 * 
 * @param localWages - Local wage data for the 5 key trades
 * @param zipCode - ZIP code for the location
 * @param city - City name for display
 * @param stateCode - Two-letter state code
 * @param dataSource - Source of the wage data
 */
export function calculateLocalIndex(
  localWages: Partial<Record<TradeType, number>>,
  zipCode: string,
  city: string,
  stateCode: string,
  dataSource: LocalMarketIndex['dataSource'] = 'national-fallback'
): LocalMarketIndex {
  // Use provided wages or fall back to Atlanta MSA averages, then national
  const plumberWage = localWages.plumber ?? FALLBACK_WAGES.plumber ?? NATIONAL_MEAN_WAGES.plumber;
  const electricianWage = localWages.electrician ?? FALLBACK_WAGES.electrician ?? NATIONAL_MEAN_WAGES.electrician;
  const carpenterWage = localWages.carpenter ?? FALLBACK_WAGES.carpenter ?? NATIONAL_MEAN_WAGES.carpenter;
  const tileSetterWage = localWages.tile_setter ?? FALLBACK_WAGES.tile_setter ?? NATIONAL_MEAN_WAGES.tile_setter;
  const painterWage = localWages.painter ?? FALLBACK_WAGES.painter ?? NATIONAL_MEAN_WAGES.painter;
  
  // Calculate individual trade factors
  const tradeFactors: TradeMarketFactor[] = [
    calculateTradeFactor('plumber', plumberWage, NATIONAL_MEAN_WAGES.plumber),
    calculateTradeFactor('electrician', electricianWage, NATIONAL_MEAN_WAGES.electrician),
    calculateTradeFactor('carpenter', carpenterWage, NATIONAL_MEAN_WAGES.carpenter),
    calculateTradeFactor('tile_setter', tileSetterWage, NATIONAL_MEAN_WAGES.tile_setter),
    calculateTradeFactor('painter', painterWage, NATIONAL_MEAN_WAGES.painter),
  ];
  
  const tileFactor = tradeFactors.find(t => t.trade === 'tile_setter')!.factor;
  const plumberFactor = tradeFactors.find(t => t.trade === 'plumber')!.factor;
  const electricianFactor = tradeFactors.find(t => t.trade === 'electrician')!.factor;
  const painterFactor = tradeFactors.find(t => t.trade === 'painter')!.factor;
  const carpenterFactor = tradeFactors.find(t => t.trade === 'carpenter')!.factor;
  
  // Calculate composite indices with proper weighting
  // Luxury Index: Tile-heavy work (40% tile, 30% plumbing, 30% electrical)
  const luxuryIndex = (tileFactor * 0.4) + (plumberFactor * 0.3) + (electricianFactor * 0.3);
  
  // Basic Index: Paint and carpentry focused (50% paint, 50% carpentry)
  const basicIndex = (painterFactor * 0.5) + (carpenterFactor * 0.5);
  
  // Good Index: Blend of both (40% luxury trades, 60% basic trades)
  const goodIndex = (luxuryIndex * 0.4) + (basicIndex * 0.6);
  
  // Apply indices to national PSF baselines
  const localBasicPSF = Math.round(NATIONAL_PSF_BASELINES.basic * basicIndex);
  const localGoodPSF = Math.round(NATIONAL_PSF_BASELINES.good * goodIndex);
  const localLuxuryPSF = Math.round(NATIONAL_PSF_BASELINES.luxury * luxuryIndex);
  
  // Determine confidence based on data source
  let confidence: LocalMarketIndex['confidence'] = 'low';
  if (dataSource === 'bls-api') {
    confidence = 'high';
  } else if (dataSource === 'state-average') {
    confidence = 'medium';
  }
  
  return {
    zipCode,
    city,
    stateCode,
    tradeFactors,
    luxuryIndex: Math.round(luxuryIndex * 100) / 100,
    basicIndex: Math.round(basicIndex * 100) / 100,
    goodIndex: Math.round(goodIndex * 100) / 100,
    localBasicPSF,
    localGoodPSF,
    localLuxuryPSF,
    confidence,
    dataSource,
    lastUpdated: new Date().toISOString().split('T')[0],
  };
}

// ============================================================================
// SCOPE DETECTION
// ============================================================================

/**
 * Detect the finish level from bid text
 * Returns the most likely finish level based on keyword matching
 */
export function detectFinishLevel(bidText: string): {
  level: FinishLevel;
  confidence: 'high' | 'medium' | 'low';
  matchedKeywords: string[];
} {
  const scores: Record<FinishLevel, { count: number; keywords: string[] }> = {
    basic: { count: 0, keywords: [] },
    good: { count: 0, keywords: [] },
    luxury: { count: 0, keywords: [] },
  };
  
  for (const definition of FINISH_LEVEL_DEFINITIONS) {
    for (const pattern of definition.keywords) {
      const matches = bidText.match(pattern);
      if (matches) {
        scores[definition.level].count += matches.length;
        scores[definition.level].keywords.push(matches[0]);
      }
    }
  }
  
  // Determine winner
  const sortedLevels = (Object.entries(scores) as [FinishLevel, { count: number; keywords: string[] }][])
    .sort((a, b) => b[1].count - a[1].count);
  
  const topLevel = sortedLevels[0];
  const secondLevel = sortedLevels[1];
  
  // Determine confidence
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (topLevel[1].count >= 5) {
    confidence = 'high';
  } else if (topLevel[1].count >= 2) {
    confidence = topLevel[1].count > secondLevel[1].count * 2 ? 'high' : 'medium';
  } else if (topLevel[1].count >= 1) {
    confidence = 'low';
  }
  
  // Default to 'good' if no matches
  const level = topLevel[1].count > 0 ? topLevel[0] : 'good';
  
  return {
    level,
    confidence,
    matchedKeywords: scores[level].keywords.slice(0, 5),
  };
}

// ============================================================================
// BID ANALYSIS
// ============================================================================

export interface BidPSFAnalysis {
  // Bid details
  bidTotal: number;
  projectSqFt: number | null;
  bidPSF: number | null;
  
  // Detected scope
  detectedLevel: FinishLevel;
  levelConfidence: 'high' | 'medium' | 'low';
  
  // Market comparison
  localIndex: LocalMarketIndex;
  
  // Status
  status: 'fair' | 'above-market' | 'below-market' | 'scope-mismatch' | 'unknown';
  percentFromTier: number | null;
  
  // Appropriate tier for this bid
  appropriateTier: FinishLevel;
}

/**
 * Extract square footage from bid text
 */
export function extractSquareFootage(bidText: string): number | null {
  // Try to find explicit square footage mentions
  const patterns = [
    /(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:sq\.?\s*ft\.?|square\s*feet?|sf)/gi,
    /(?:bathroom|bath|room|space|area)[:\s]+(?:approx(?:imately)?\.?\s+)?(\d+)\s*(?:sq\.?\s*ft\.?|square\s*feet?|sf)/gi,
    /(\d+)\s*(?:sq\.?\s*ft\.?|sf)\s*(?:bathroom|bath|room)/gi,
  ];
  
  const allMatches: number[] = [];
  
  for (const pattern of patterns) {
    const matches = bidText.matchAll(pattern);
    for (const match of matches) {
      const value = parseFloat(match[1].replace(/,/g, ''));
      if (value >= 20 && value <= 5000) { // Reasonable range for bathroom/kitchen
        allMatches.push(value);
      }
    }
  }
  
  // Return the most commonly mentioned value, or the first reasonable one
  if (allMatches.length > 0) {
    return allMatches[0];
  }
  
  return null;
}

/**
 * Estimate square footage based on project type if not specified
 */
export function estimateSquareFootage(bidText: string): { sqft: number; source: 'extracted' | 'estimated' } | null {
  const extracted = extractSquareFootage(bidText);
  if (extracted) {
    return { sqft: extracted, source: 'extracted' };
  }
  
  // Estimate based on project type
  const normalizedText = bidText.toLowerCase();
  
  if (/master\s*bath|primary\s*bath/i.test(normalizedText)) {
    return { sqft: 120, source: 'estimated' }; // Average master bath
  }
  if (/half\s*bath|powder\s*room/i.test(normalizedText)) {
    return { sqft: 30, source: 'estimated' };
  }
  if (/guest\s*bath|hall\s*bath/i.test(normalizedText)) {
    return { sqft: 60, source: 'estimated' };
  }
  if (/bathroom|bath\s*remodel/i.test(normalizedText)) {
    return { sqft: 75, source: 'estimated' }; // Average bathroom
  }
  if (/kitchen\s*remodel/i.test(normalizedText)) {
    return { sqft: 150, source: 'estimated' }; // Average kitchen
  }
  
  return null;
}

/**
 * Analyze a bid against local market PSF rates
 * @param overrideSquareFootage - Optional manual override for square footage (user-provided)
 */
export function analyzeBidPSF(
  bidTotal: number,
  bidText: string,
  localIndex: LocalMarketIndex,
  overrideSquareFootage?: number
): BidPSFAnalysis {
  // Get square footage - use override if provided, otherwise detect from text
  const sqftResult = overrideSquareFootage 
    ? { sqft: overrideSquareFootage, source: 'extracted' as const }
    : estimateSquareFootage(bidText);
  const projectSqFt = sqftResult?.sqft ?? null;
  const bidPSF = projectSqFt ? Math.round(bidTotal / projectSqFt) : null;
  
  // Detect finish level from scope
  const { level: detectedLevel, confidence: levelConfidence } = detectFinishLevel(bidText);
  
  // Determine appropriate tier based on detected scope
  let appropriateTier: FinishLevel = detectedLevel;
  
  // Analyze where bid falls
  let status: BidPSFAnalysis['status'] = 'unknown';
  let percentFromTier: number | null = null;
  
  if (bidPSF !== null) {
    const { localBasicPSF, localGoodPSF, localLuxuryPSF } = localIndex;
    
    // Determine which tier the bid price actually aligns with
    if (bidPSF < localBasicPSF * 0.9) {
      // Below basic - potentially concerning
      status = 'below-market';
      percentFromTier = Math.round(((localBasicPSF - bidPSF) / localBasicPSF) * 100);
    } else if (bidPSF <= localBasicPSF * 1.1) {
      // In basic range
      appropriateTier = 'basic';
      status = detectedLevel === 'basic' ? 'fair' : 'scope-mismatch';
      percentFromTier = Math.round(((bidPSF - localBasicPSF) / localBasicPSF) * 100);
    } else if (bidPSF <= localGoodPSF * 1.1) {
      // In good range
      appropriateTier = 'good';
      status = detectedLevel === 'good' || detectedLevel === 'luxury' ? 'fair' : 'scope-mismatch';
      percentFromTier = Math.round(((bidPSF - localGoodPSF) / localGoodPSF) * 100);
    } else if (bidPSF <= localLuxuryPSF * 1.15) {
      // In luxury range
      appropriateTier = 'luxury';
      status = detectedLevel === 'luxury' ? 'fair' : 'scope-mismatch';
      percentFromTier = Math.round(((bidPSF - localLuxuryPSF) / localLuxuryPSF) * 100);
    } else {
      // Above luxury
      status = 'above-market';
      percentFromTier = Math.round(((bidPSF - localLuxuryPSF) / localLuxuryPSF) * 100);
    }
  }
  
  return {
    bidTotal,
    projectSqFt,
    bidPSF,
    detectedLevel,
    levelConfidence,
    localIndex,
    status,
    percentFromTier,
    appropriateTier,
  };
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Get the display label for a finish level
 */
export function getFinishLevelLabel(level: FinishLevel): string {
  const definition = FINISH_LEVEL_DEFINITIONS.find(d => d.level === level);
  return definition?.label ?? level;
}

/**
 * Format PSF as currency
 */
export function formatPSF(psf: number): string {
  return `$${psf}/sq ft`;
}

/**
 * Get market index display text
 */
export function formatMarketIndex(index: number): string {
  if (index >= 1.3) return `${index.toFixed(1)}× (High Cost Market)`;
  if (index >= 1.1) return `${index.toFixed(1)}× (Above Avg)`;
  if (index >= 0.9) return `${index.toFixed(1)}× (Average)`;
  if (index >= 0.7) return `${index.toFixed(1)}× (Below Avg)`;
  return `${index.toFixed(1)}× (Low Cost Market)`;
}

// ============================================================================
// TALK TRACK GENERATOR
// ============================================================================

export type NegotiationScenario = 
  | 'overpriced-basic'      // Bid PSF > Good tier but scope is Basic
  | 'luxury-markup'         // Bid PSF > Luxury tier by 15%+
  | 'too-good-to-be-true'   // Bid PSF < Basic tier by 10%+
  | 'scope-price-mismatch'  // General mismatch between scope and price
  | 'fair-pricing';         // Everything looks reasonable

export interface NegotiationScript {
  scenario: NegotiationScenario;
  title: string;
  headline: string;
  script: string;
  riskLevel: 'high' | 'medium' | 'low' | 'info';
  followUpQuestions: string[];
  negotiationLeverage: string;
}

/**
 * Generate negotiation scripts based on bid analysis
 * This is the "Talk Track" generator that produces actionable scripts
 */
export function generateNegotiationScript(
  analysis: BidPSFAnalysis,
  cityName: string
): NegotiationScript {
  const { bidPSF, detectedLevel, localIndex, status, percentFromTier, appropriateTier } = analysis;
  const { localBasicPSF, localGoodPSF, localLuxuryPSF } = localIndex;
  
  // Scenario A: Overpriced Basic
  // Trigger: Bid PSF > Local Good Tier but detected scope is 'Basic'
  if (
    bidPSF !== null && 
    detectedLevel === 'basic' && 
    bidPSF > localGoodPSF
  ) {
    return {
      scenario: 'overpriced-basic',
      title: 'Premium Price for Basic Scope',
      headline: 'You may be overpaying for a cosmetic refresh',
      script: `Your bid is priced at $${bidPSF}/sq ft, which aligns with 'Good' to 'Luxury' standards in ${cityName}. Since your scope appears to be cosmetic (paint/vanity swap), can we review the labor line items to see where the premium is coming from?`,
      riskLevel: 'high',
      followUpQuestions: [
        'Can you itemize the labor costs separately from materials?',
        'What accounts for the pricing above the typical cosmetic refresh range?',
        'Are there any structural or plumbing elements I might have missed in the scope?',
      ],
      negotiationLeverage: `In ${cityName}, cosmetic bathroom refreshes typically run $${localBasicPSF}-${Math.round(localBasicPSF * 1.2)}/sq ft. Your scope suggests you should be in this range.`,
    };
  }
  
  // Scenario B: Luxury Markup
  // Trigger: Bid PSF > Local Luxury Tier by 15%+
  if (
    bidPSF !== null && 
    percentFromTier !== null &&
    appropriateTier === 'luxury' &&
    bidPSF > localLuxuryPSF * 1.15
  ) {
    const percentAbove = Math.round(((bidPSF - localLuxuryPSF) / localLuxuryPSF) * 100);
    return {
      scenario: 'luxury-markup',
      title: 'Significantly Above Luxury Rates',
      headline: `${percentAbove}% above top-tier pricing`,
      script: `We are at $${bidPSF}/sq ft, which is ${percentAbove}% above the top-tier luxury average for ${cityName} ($${localLuxuryPSF}/sq ft). Does this include a specific site condition premium, a rush fee, or premium materials beyond standard luxury finishes?`,
      riskLevel: 'medium',
      followUpQuestions: [
        'Are there any site conditions driving this premium (access issues, structural concerns)?',
        'Is there a rush fee or expedited timeline factored in?',
        'Can you detail the premium materials or finishes included?',
        'Would adjusting the timeline or material selections affect pricing?',
      ],
      negotiationLeverage: `Even luxury remodels in ${cityName} typically fall within $${Math.round(localLuxuryPSF * 0.9)}-${localLuxuryPSF}/sq ft. There should be a clear reason for the ${percentAbove}% premium.`,
    };
  }
  
  // Scenario C: Too Good To Be True
  // Trigger: Bid PSF < Local Basic Tier by 10%+
  if (
    bidPSF !== null && 
    bidPSF < localBasicPSF * 0.9
  ) {
    const percentBelow = Math.round(((localBasicPSF - bidPSF) / localBasicPSF) * 100);
    return {
      scenario: 'too-good-to-be-true',
      title: 'Suspiciously Below Market',
      headline: 'Price significantly below market average',
      script: `This bid is ${percentBelow}% below the local market average of $${localBasicPSF}/sq ft for basic work in ${cityName}. To protect yourself, please verify that this quote includes licensed trade labor (Plumbing/Electrical) and full insurance coverage.`,
      riskLevel: 'high',
      followUpQuestions: [
        'Are all subcontractors licensed and insured?',
        'Can I see certificates of insurance for general liability and workers comp?',
        'Will you be pulling all required permits?',
        'What is your workmanship warranty?',
        'Are materials included, or am I responsible for purchasing them?',
      ],
      negotiationLeverage: `Bids significantly below $${localBasicPSF}/sq ft often indicate unlicensed workers, missing insurance, or hidden costs that appear later as "unforeseen conditions."`,
    };
  }
  
  // Scenario D: Scope/Price Mismatch (Generic)
  if (status === 'scope-mismatch' && bidPSF !== null) {
    const tierLabel = getFinishLevelLabel(appropriateTier);
    const scopeLabel = getFinishLevelLabel(detectedLevel);
    
    return {
      scenario: 'scope-price-mismatch',
      title: 'Scope vs Price Mismatch',
      headline: `${tierLabel} price for ${scopeLabel} scope`,
      script: `Your bid at $${bidPSF}/sq ft suggests ${tierLabel.toLowerCase()} finishes, but the scope description reads more like a ${scopeLabel.toLowerCase()} project. Can we align the pricing with the actual scope, or clarify what premium finishes are included?`,
      riskLevel: 'medium',
      followUpQuestions: [
        'Can you detail what finishes and materials justify this price tier?',
        'Is there room to adjust the scope to better match the budget?',
        'What would a more basic approach to this project cost?',
      ],
      negotiationLeverage: `${scopeLabel} work in ${cityName} typically runs $${detectedLevel === 'basic' ? localBasicPSF : detectedLevel === 'good' ? localGoodPSF : localLuxuryPSF}/sq ft.`,
    };
  }
  
  // Default: Fair Pricing
  const tierPSF = detectedLevel === 'basic' ? localBasicPSF : detectedLevel === 'good' ? localGoodPSF : localLuxuryPSF;
  return {
    scenario: 'fair-pricing',
    title: 'Pricing Looks Reasonable',
    headline: 'Within expected range for your market',
    script: bidPSF 
      ? `At $${bidPSF}/sq ft, this bid falls within the typical ${getFinishLevelLabel(detectedLevel).toLowerCase()} range for ${cityName} ($${Math.round(tierPSF * 0.9)}-${Math.round(tierPSF * 1.1)}/sq ft). Focus your negotiation on scope clarity and payment terms rather than overall price.`
      : `While we couldn't calculate the price per square foot, the overall pricing appears reasonable for ${cityName}. Focus on ensuring the scope is clearly defined and payment terms protect you.`,
    riskLevel: 'info',
    followUpQuestions: [
      'Can you provide a detailed line-item breakdown?',
      'What is your warranty on workmanship?',
      'How do you handle unforeseen conditions or change orders?',
      'Can we structure payments based on milestones?',
    ],
    negotiationLeverage: `Your pricing is competitive. Your leverage is in negotiating terms: payment schedule, warranty, change order process, and timeline guarantees.`,
  };
}

/**
 * Generate all relevant talk track points for a bid
 */
export function generateAllTalkTrackPoints(
  analysis: BidPSFAnalysis,
  cityName: string
): {
  primaryScript: NegotiationScript;
  additionalPoints: string[];
  marketContext: string;
} {
  const primaryScript = generateNegotiationScript(analysis, cityName);
  const { localIndex, bidPSF, detectedLevel } = analysis;
  
  // Build market context
  const marketContext = `${cityName} Market Index: ${formatMarketIndex(localIndex.goodIndex)} • ` +
    `Basic: $${localIndex.localBasicPSF}/sf • ` +
    `Good: $${localIndex.localGoodPSF}/sf • ` +
    `Luxury: $${localIndex.localLuxuryPSF}/sf`;
  
  // Additional talk track points
  const additionalPoints: string[] = [];
  
  // Add context about what drives costs in this market
  if (localIndex.luxuryIndex > 1.2) {
    additionalPoints.push(
      `Tile and plumbing work is expensive in ${cityName} (${(localIndex.luxuryIndex * 100 - 100).toFixed(0)}% above national average). If your project is tile-heavy, this affects pricing.`
    );
  }
  
  if (localIndex.basicIndex > 1.15) {
    additionalPoints.push(
      `Even basic trades (paint, carpentry) run above average in ${cityName}. This is a high-cost market overall.`
    );
  } else if (localIndex.basicIndex < 0.9) {
    additionalPoints.push(
      `Basic trades are relatively affordable in ${cityName}. Cosmetic refreshes should be economical here.`
    );
  }
  
  // Scope-specific advice
  if (detectedLevel === 'luxury' && bidPSF && bidPSF < localIndex.localGoodPSF) {
    additionalPoints.push(
      `Warning: The scope mentions luxury elements but pricing is below the "Good" tier. Verify that quoted materials match the described finishes.`
    );
  }
  
  return {
    primaryScript,
    additionalPoints,
    marketContext,
  };
}
