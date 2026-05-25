/**
 * Research Hub Logic Engine
 * 
 * Calculates localized market factors and finish level tiers
 * based on 5-trade BLS wage data and ZIP code location.
 */

// National BLS Hourly Means (2026 Baseline)
export const NATIONAL_BLS_WAGES_2026 = {
  plumber: 32.62,
  electrician: 32.60,
  carpenter: 28.51,
  tile_setter: 25.92,
  painter: 24.55,
} as const;

// National Finish Level Baselines (Price per Square Foot)
export const NATIONAL_FINISH_PSF = {
  basic: 100,
  good: 160,
  luxury: 225,
} as const;

export type TradeKey = keyof typeof NATIONAL_BLS_WAGES_2026;
export type FinishTier = keyof typeof NATIONAL_FINISH_PSF;

export interface TradeWageComparison {
  trade: TradeKey;
  displayName: string;
  nationalMean: number;
  localWage: number;
  factor: number; // local / national
}

export interface LocalizedMarketData {
  zipCode: string;
  marketFactor: number; // 5-trade average factor
  
  // Individual trade comparisons
  tradeComparisons: TradeWageComparison[];
  
  // Localized PSF tiers
  localBasicPSF: number;
  localGoodPSF: number;
  localLuxuryPSF: number;
  
  // Where does the user's bid fall?
  bidPSF: number | null;
  bidTierPosition: 'below-basic' | 'basic' | 'good' | 'luxury' | 'above-luxury' | 'unknown';
  bidPercentFromNearestTier: number | null;
}

const TRADE_DISPLAY_NAMES: Record<TradeKey, string> = {
  plumber: 'Plumber',
  electrician: 'Electrician',
  carpenter: 'Carpenter',
  tile_setter: 'Tile Setter',
  painter: 'Painter',
};

/**
 * Get local wages based on ZIP code
 * In production, this would call a ZIP-to-MSA lookup API
 * For now, uses state-based multipliers
 */
export function getLocalWagesForZip(zipCode: string): Record<TradeKey, number> {
  // Extract state from ZIP (simplified - uses first 3 digits for region estimation)
  const prefix = zipCode.substring(0, 3);
  const prefixNum = parseInt(prefix, 10);
  
  // Regional wage multipliers based on ZIP prefix ranges
  // These correspond roughly to census regions
  let multiplier = 1.0;
  
  // Northeast (high cost): 010-149
  if (prefixNum >= 10 && prefixNum <= 149) {
    multiplier = 1.25;
  }
  // Southeast (moderate): 150-349
  else if (prefixNum >= 150 && prefixNum <= 349) {
    multiplier = 0.95;
  }
  // Great Lakes/Midwest: 350-499
  else if (prefixNum >= 350 && prefixNum <= 499) {
    multiplier = 0.98;
  }
  // South Central: 500-699
  else if (prefixNum >= 500 && prefixNum <= 699) {
    multiplier = 0.92;
  }
  // Mountain West: 700-849
  else if (prefixNum >= 700 && prefixNum <= 849) {
    multiplier = 1.05;
  }
  // Pacific (high cost): 850-999
  else if (prefixNum >= 850 && prefixNum <= 999) {
    multiplier = 1.35;
  }
  
  // Apply multiplier to national means
  return {
    plumber: Math.round(NATIONAL_BLS_WAGES_2026.plumber * multiplier * 100) / 100,
    electrician: Math.round(NATIONAL_BLS_WAGES_2026.electrician * multiplier * 100) / 100,
    carpenter: Math.round(NATIONAL_BLS_WAGES_2026.carpenter * multiplier * 100) / 100,
    tile_setter: Math.round(NATIONAL_BLS_WAGES_2026.tile_setter * multiplier * 100) / 100,
    painter: Math.round(NATIONAL_BLS_WAGES_2026.painter * multiplier * 100) / 100,
  };
}

/**
 * Calculate the Market Factor from 5-trade wage comparison
 * Market Factor = Average of (local wage / national wage) for all 5 trades
 */
export function calculateMarketFactor(localWages: Record<TradeKey, number>): {
  marketFactor: number;
  tradeComparisons: TradeWageComparison[];
} {
  const trades: TradeKey[] = ['plumber', 'electrician', 'carpenter', 'tile_setter', 'painter'];
  
  const tradeComparisons: TradeWageComparison[] = trades.map(trade => {
    const nationalMean = NATIONAL_BLS_WAGES_2026[trade];
    const localWage = localWages[trade];
    const factor = Math.round((localWage / nationalMean) * 100) / 100;
    
    return {
      trade,
      displayName: TRADE_DISPLAY_NAMES[trade],
      nationalMean,
      localWage,
      factor,
    };
  });
  
  // Average of all trade factors
  const marketFactor = Math.round(
    (tradeComparisons.reduce((sum, tc) => sum + tc.factor, 0) / tradeComparisons.length) * 100
  ) / 100;
  
  return { marketFactor, tradeComparisons };
}

/**
 * Apply market factor to national PSF baselines to get localized tiers
 */
export function calculateLocalizedPSF(marketFactor: number): {
  localBasicPSF: number;
  localGoodPSF: number;
  localLuxuryPSF: number;
} {
  return {
    localBasicPSF: Math.round(NATIONAL_FINISH_PSF.basic * marketFactor),
    localGoodPSF: Math.round(NATIONAL_FINISH_PSF.good * marketFactor),
    localLuxuryPSF: Math.round(NATIONAL_FINISH_PSF.luxury * marketFactor),
  };
}

/**
 * Determine where a bid PSF falls on the localized tier spectrum
 */
export function determineBidPosition(
  bidPSF: number | null,
  localBasicPSF: number,
  localGoodPSF: number,
  localLuxuryPSF: number
): {
  position: LocalizedMarketData['bidTierPosition'];
  percentFromTier: number | null;
} {
  if (bidPSF === null) {
    return { position: 'unknown', percentFromTier: null };
  }
  
  // Below basic (10% tolerance)
  if (bidPSF < localBasicPSF * 0.9) {
    const percent = Math.round(((localBasicPSF - bidPSF) / localBasicPSF) * 100);
    return { position: 'below-basic', percentFromTier: -percent };
  }
  
  // In basic range
  if (bidPSF <= localBasicPSF * 1.15) {
    const percent = Math.round(((bidPSF - localBasicPSF) / localBasicPSF) * 100);
    return { position: 'basic', percentFromTier: percent };
  }
  
  // In good range
  if (bidPSF <= localGoodPSF * 1.15) {
    const percent = Math.round(((bidPSF - localGoodPSF) / localGoodPSF) * 100);
    return { position: 'good', percentFromTier: percent };
  }
  
  // In luxury range
  if (bidPSF <= localLuxuryPSF * 1.15) {
    const percent = Math.round(((bidPSF - localLuxuryPSF) / localLuxuryPSF) * 100);
    return { position: 'luxury', percentFromTier: percent };
  }
  
  // Above luxury
  const percent = Math.round(((bidPSF - localLuxuryPSF) / localLuxuryPSF) * 100);
  return { position: 'above-luxury', percentFromTier: percent };
}

/**
 * Main Logic Engine: Calculate all localized market data
 */
export function calculateLocalizedMarketData(
  zipCode: string,
  bidTotal: number | null,
  squareFootage: number | null
): LocalizedMarketData {
  // Step 1: Get local wages for ZIP
  const localWages = getLocalWagesForZip(zipCode);
  
  // Step 2: Calculate market factor from 5-trade comparison
  const { marketFactor, tradeComparisons } = calculateMarketFactor(localWages);
  
  // Step 3: Apply market factor to get localized PSF tiers
  const { localBasicPSF, localGoodPSF, localLuxuryPSF } = calculateLocalizedPSF(marketFactor);
  
  // Step 4: Calculate bid PSF if we have the data
  const bidPSF = (bidTotal !== null && squareFootage !== null && squareFootage > 0)
    ? Math.round(bidTotal / squareFootage)
    : null;
  
  // Step 5: Determine where bid falls on spectrum
  const { position, percentFromTier } = determineBidPosition(
    bidPSF, localBasicPSF, localGoodPSF, localLuxuryPSF
  );
  
  return {
    zipCode,
    marketFactor,
    tradeComparisons,
    localBasicPSF,
    localGoodPSF,
    localLuxuryPSF,
    bidPSF,
    bidTierPosition: position,
    bidPercentFromNearestTier: percentFromTier,
  };
}

/**
 * Calculate effective labor rate from bid
 * Assumes standard hours based on project size
 */
export function calculateBidEffectiveRate(
  bidTotal: number,
  squareFootage: number,
  laborPercentage: number = 0.45 // Typical labor is 45% of total
): { localFairRate: number; bidEffectiveRate: number; percentAbove: number } {
  // Estimate hours based on square footage (roughly 0.5 hours per sq ft for full remodel)
  const estimatedHours = squareFootage * 0.5;
  
  // Estimate labor cost from total
  const estimatedLaborCost = bidTotal * laborPercentage;
  
  // Calculate effective rate
  const bidEffectiveRate = Math.round((estimatedLaborCost / estimatedHours) * 100) / 100;
  
  // Local fair rate (average of 5 trades × 2.5 contractor multiplier)
  const avgWage = (NATIONAL_BLS_WAGES_2026.plumber + 
                   NATIONAL_BLS_WAGES_2026.electrician + 
                   NATIONAL_BLS_WAGES_2026.carpenter + 
                   NATIONAL_BLS_WAGES_2026.tile_setter + 
                   NATIONAL_BLS_WAGES_2026.painter) / 5;
  const localFairRate = Math.round(avgWage * 2.8 * 100) / 100; // 2.8x multiplier
  
  const percentAbove = Math.round(((bidEffectiveRate - localFairRate) / localFairRate) * 100);
  
  return { localFairRate, bidEffectiveRate, percentAbove };
}
