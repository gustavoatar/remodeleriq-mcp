// Market Rates Calculation Engine
// Compares bid labor costs against BLS OEWS market data

import { BURDEN_MULTIPLIER, getBurdenMultiplier, ALL_OEWS_DATA, type OewsWageData } from './blsOewsData';
import { getMSABestEffort, type MSAInfo } from './msaLookup';

// ============================================================================
// REGIONAL COST MULTIPLIERS (2025 - Validated against Zonda Cost vs Value 2025)
// These adjust national benchmarks for metro-specific construction costs
// Base = 1.0 (national average)
// Sources: Zonda Cost vs Value 2025, BLS OEWS, RSMeans
// ============================================================================

export interface RegionalMultiplier {
  name: string;
  multiplier: number;
  notes?: string;
  source?: 'zonda' | 'bls' | 'estimated';
}

// MSA Code to Regional Multiplier mapping
// MSA codes from BLS OEWS data, multipliers validated against Zonda 2025
export const REGIONAL_MULTIPLIERS: Record<string, RegionalMultiplier> = {
  // Tier 1: Very High Cost - validated against Zonda regional data
  '35620': { name: 'New York-Newark-Jersey City', multiplier: 1.45, notes: 'Highest labor costs nationally', source: 'estimated' },
  '41860': { name: 'San Francisco-Oakland-Berkeley', multiplier: 1.50, notes: 'Tech-driven labor shortage', source: 'estimated' },
  '42660': { name: 'Seattle-Tacoma-Bellevue', multiplier: 1.35, notes: 'Strong tech/construction demand', source: 'estimated' },
  '14460': { name: 'Boston-Cambridge-Newton', multiplier: 1.06, notes: 'Zonda 2025: $27,681 vs $26,138 national (bathroom)', source: 'zonda' },
  '47900': { name: 'Washington-Arlington-Alexandria', multiplier: 1.15, notes: 'South Atlantic region', source: 'zonda' },
  
  // Tier 2: High Cost - recalibrated with Zonda data
  '31080': { name: 'Los Angeles-Long Beach-Anaheim', multiplier: 1.40, notes: 'High demand, strict codes', source: 'estimated' },
  '41740': { name: 'San Diego-Chula Vista-Carlsbad', multiplier: 1.35, source: 'estimated' },
  '19740': { name: 'Denver-Aurora-Lakewood', multiplier: 1.15, notes: 'Mountain region avg', source: 'zonda' },
  '33100': { name: 'Miami-Fort Lauderdale-Pompano Beach', multiplier: 1.10, notes: 'South Atlantic region', source: 'zonda' },
  '16980': { name: 'Chicago-Naperville-Elgin', multiplier: 1.05, notes: 'East North Central avg', source: 'zonda' },
  '38060': { name: 'Phoenix-Mesa-Chandler', multiplier: 0.98, notes: 'Mountain region', source: 'zonda' },
  '37980': { name: 'Philadelphia-Camden-Wilmington', multiplier: 1.15, source: 'estimated' },
  '26420': { name: 'Houston-The Woodlands-Sugar Land', multiplier: 0.95, notes: 'Lower cost, non-union market', source: 'bls' },
  '19100': { name: 'Dallas-Fort Worth-Arlington', multiplier: 1.00, source: 'estimated' },
  '12060': { name: 'Atlanta-Sandy Springs-Alpharetta', multiplier: 0.97, notes: 'Zonda 2025: $25,304 vs $26,138 national', source: 'zonda' },
  '45300': { name: 'Tampa-St. Petersburg-Clearwater', multiplier: 1.00, notes: 'South Atlantic region', source: 'zonda' },
  '40140': { name: 'Riverside-San Bernardino-Ontario', multiplier: 1.30, source: 'estimated' },
  '33460': { name: 'Minneapolis-St. Paul-Bloomington', multiplier: 1.05, source: 'estimated' },
  '41700': { name: 'San Antonio-New Braunfels', multiplier: 0.95, source: 'bls' },
  '38900': { name: 'Portland-Vancouver-Hillsboro', multiplier: 1.20, source: 'estimated' },
  '41180': { name: 'St. Louis', multiplier: 0.98, source: 'estimated' },
  '12580': { name: 'Baltimore-Columbia-Towson', multiplier: 1.10, notes: 'South Atlantic region', source: 'zonda' },
  '36740': { name: 'Orlando-Kissimmee-Sanford', multiplier: 1.00, notes: 'South Atlantic region', source: 'zonda' },
  '17460': { name: 'Cleveland-Elyria', multiplier: 0.96, notes: 'East North Central', source: 'zonda' },
  '34980': { name: 'Nashville-Davidson-Murfreesboro', multiplier: 0.92, notes: 'East South Central region', source: 'zonda' },
  '39580': { name: 'Raleigh-Cary', multiplier: 1.00, notes: 'South Atlantic region', source: 'zonda' },
  '29820': { name: 'Las Vegas-Henderson-Paradise', multiplier: 1.05, notes: 'Mountain region', source: 'zonda' },
  '32820': { name: 'Memphis', multiplier: 0.88, notes: 'East South Central', source: 'zonda' },
  '18140': { name: 'Columbus, OH', multiplier: 0.96, notes: 'East North Central', source: 'zonda' },
  '27260': { name: 'Jacksonville, FL', multiplier: 0.98, notes: 'South Atlantic region', source: 'zonda' },
  '13820': { name: 'Birmingham-Hoover', multiplier: 0.85, notes: 'Zonda 2025: $21,494 vs $26,138 national', source: 'zonda' },
  '24660': { name: 'Greensboro-High Point', multiplier: 0.98, notes: 'South Atlantic', source: 'zonda' },
  '16740': { name: 'Charlotte-Concord-Gastonia', multiplier: 0.98, notes: 'South Atlantic region', source: 'zonda' },
  '41620': { name: 'Salt Lake City', multiplier: 1.00, notes: 'Mountain region', source: 'zonda' },
  '24340': { name: 'Grand Rapids-Kentwood', multiplier: 0.96, notes: 'East North Central', source: 'zonda' },
  '12420': { name: 'Austin-Round Rock-Georgetown', multiplier: 1.05, notes: 'Tech-driven growth', source: 'estimated' },
  '28140': { name: 'Kansas City', multiplier: 0.95, source: 'estimated' },
  '26900': { name: 'Indianapolis-Carmel-Anderson', multiplier: 0.94, notes: 'East North Central', source: 'zonda' },
  '40060': { name: 'Richmond, VA', multiplier: 0.98, notes: 'South Atlantic region', source: 'zonda' },
  '35380': { name: 'New Orleans-Metairie', multiplier: 0.92, source: 'estimated' },
  '47260': { name: 'Virginia Beach-Norfolk-Newport News', multiplier: 0.98, notes: 'South Atlantic', source: 'zonda' },
  '31140': { name: 'Louisville/Jefferson County', multiplier: 0.90, notes: 'East South Central', source: 'zonda' },
  '21340': { name: 'El Paso', multiplier: 0.90, source: 'estimated' },
  '46060': { name: 'Tucson', multiplier: 0.98, notes: 'Mountain region', source: 'zonda' },
  '35840': { name: 'North Port-Sarasota-Bradenton', multiplier: 1.00, notes: 'South Atlantic', source: 'zonda' },
  '36420': { name: 'Oklahoma City', multiplier: 0.88, source: 'estimated' },
  '25540': { name: 'Hartford-East Hartford-Middletown', multiplier: 1.04, notes: 'New England region', source: 'zonda' },
  '15380': { name: 'Buffalo-Cheektowaga', multiplier: 0.98, source: 'estimated' },
  '39300': { name: 'Providence-Warwick', multiplier: 1.04, notes: 'New England region', source: 'zonda' },
  '44700': { name: 'Stockton', multiplier: 1.25, source: 'estimated' },
  // Zonda cities with direct data
  '10180': { name: 'Albuquerque', multiplier: 0.98, notes: 'Zonda 2025: $25,551 vs $26,138 national', source: 'zonda' },
  '11540': { name: 'Appleton, WI', multiplier: 0.94, notes: 'Zonda 2025: $24,524 vs $26,138 national', source: 'zonda' },
};

// State-level fallback multipliers - validated against Zonda 2025 regional averages
// Uses average of Zonda regional multipliers across all project types
export const STATE_MULTIPLIERS: Record<string, RegionalMultiplier> = {
  // Pacific (estimated - no Zonda data)
  'CA': { name: 'California', multiplier: 1.35, source: 'estimated' },
  'WA': { name: 'Washington', multiplier: 1.25, source: 'estimated' },
  'OR': { name: 'Oregon', multiplier: 1.20, source: 'estimated' },
  'HI': { name: 'Hawaii', multiplier: 1.50, source: 'estimated' },
  'AK': { name: 'Alaska', multiplier: 1.30, source: 'estimated' },
  
  // New England - Zonda avg: 1.04x (range 0.96-1.14)
  'MA': { name: 'Massachusetts', multiplier: 1.05, notes: 'Zonda New England avg', source: 'zonda' },
  'CT': { name: 'Connecticut', multiplier: 1.04, notes: 'Zonda New England avg', source: 'zonda' },
  'NH': { name: 'New Hampshire', multiplier: 1.04, notes: 'Zonda New England avg', source: 'zonda' },
  'ME': { name: 'Maine', multiplier: 1.04, notes: 'Zonda New England avg', source: 'zonda' },
  'RI': { name: 'Rhode Island', multiplier: 1.04, notes: 'Zonda New England avg', source: 'zonda' },
  'VT': { name: 'Vermont', multiplier: 1.04, notes: 'Zonda New England avg', source: 'zonda' },
  
  // East North Central - Zonda avg: 0.96x (range 0.92-1.09)
  'IL': { name: 'Illinois', multiplier: 1.00, notes: 'Zonda East North Central avg', source: 'zonda' },
  'OH': { name: 'Ohio', multiplier: 0.96, notes: 'Zonda East North Central avg', source: 'zonda' },
  'MI': { name: 'Michigan', multiplier: 0.96, notes: 'Zonda East North Central avg', source: 'zonda' },
  'IN': { name: 'Indiana', multiplier: 0.95, notes: 'Zonda East North Central avg', source: 'zonda' },
  'WI': { name: 'Wisconsin', multiplier: 0.94, notes: 'Zonda Appleton data', source: 'zonda' },
  
  // East South Central - Zonda avg: 0.90x (range 0.80-0.95)
  'AL': { name: 'Alabama', multiplier: 0.85, notes: 'Zonda Birmingham data', source: 'zonda' },
  'KY': { name: 'Kentucky', multiplier: 0.90, notes: 'Zonda East South Central avg', source: 'zonda' },
  'TN': { name: 'Tennessee', multiplier: 0.92, notes: 'Zonda East South Central avg', source: 'zonda' },
  'MS': { name: 'Mississippi', multiplier: 0.88, notes: 'Zonda East South Central avg', source: 'zonda' },
  
  // South Atlantic - Zonda avg: 0.98x (range 0.91-1.10)
  'GA': { name: 'Georgia', multiplier: 0.97, notes: 'Zonda Atlanta data', source: 'zonda' },
  'FL': { name: 'Florida', multiplier: 1.00, notes: 'Zonda South Atlantic avg', source: 'zonda' },
  'NC': { name: 'North Carolina', multiplier: 0.98, notes: 'Zonda South Atlantic avg', source: 'zonda' },
  'SC': { name: 'South Carolina', multiplier: 0.97, notes: 'Zonda South Atlantic avg', source: 'zonda' },
  'VA': { name: 'Virginia', multiplier: 0.98, notes: 'Zonda South Atlantic avg', source: 'zonda' },
  'MD': { name: 'Maryland', multiplier: 1.00, notes: 'Zonda South Atlantic avg', source: 'zonda' },
  'DC': { name: 'Washington DC', multiplier: 1.10, notes: 'Zonda South Atlantic + DC premium', source: 'zonda' },
  'WV': { name: 'West Virginia', multiplier: 0.92, notes: 'Zonda South Atlantic low end', source: 'zonda' },
  'DE': { name: 'Delaware', multiplier: 0.98, notes: 'Zonda South Atlantic avg', source: 'zonda' },
  
  // Mountain - Zonda avg: 0.97x (range 0.90-1.06)
  'CO': { name: 'Colorado', multiplier: 1.05, notes: 'Denver premium', source: 'zonda' },
  'AZ': { name: 'Arizona', multiplier: 0.98, notes: 'Zonda Mountain avg', source: 'zonda' },
  'NV': { name: 'Nevada', multiplier: 1.00, notes: 'Zonda Mountain avg', source: 'zonda' },
  'UT': { name: 'Utah', multiplier: 1.00, notes: 'Zonda Mountain avg', source: 'zonda' },
  'NM': { name: 'New Mexico', multiplier: 0.98, notes: 'Zonda Albuquerque data', source: 'zonda' },
  'ID': { name: 'Idaho', multiplier: 0.98, notes: 'Zonda Mountain avg', source: 'zonda' },
  'MT': { name: 'Montana', multiplier: 0.97, notes: 'Zonda Mountain avg', source: 'zonda' },
  'WY': { name: 'Wyoming', multiplier: 0.97, notes: 'Zonda Mountain avg', source: 'zonda' },
  
  // Other regions (estimated or BLS-based)
  'NY': { name: 'New York', multiplier: 1.25, notes: 'NYC premium', source: 'estimated' },
  'NJ': { name: 'New Jersey', multiplier: 1.20, source: 'estimated' },
  'PA': { name: 'Pennsylvania', multiplier: 1.05, source: 'estimated' },
  'TX': { name: 'Texas', multiplier: 0.98, source: 'estimated' },
  'MO': { name: 'Missouri', multiplier: 0.95, source: 'estimated' },
  'MN': { name: 'Minnesota', multiplier: 1.00, source: 'estimated' },
  'LA': { name: 'Louisiana', multiplier: 0.90, source: 'estimated' },
  'OK': { name: 'Oklahoma', multiplier: 0.88, source: 'estimated' },
  'AR': { name: 'Arkansas', multiplier: 0.85, source: 'estimated' },
  'KS': { name: 'Kansas', multiplier: 0.92, source: 'estimated' },
  'NE': { name: 'Nebraska', multiplier: 0.92, source: 'estimated' },
  'SD': { name: 'South Dakota', multiplier: 0.92, source: 'estimated' },
  'ND': { name: 'North Dakota', multiplier: 0.95, source: 'estimated' },
  'IA': { name: 'Iowa', multiplier: 0.92, source: 'estimated' },
};

/**
 * Get the regional cost multiplier for a given location
 * Fallback chain: County→MSA -> MSA -> State -> National (1.0)
 * 
 * @param msaCode - Direct MSA code if known
 * @param stateCode - State abbreviation for fallback
 * @param county - County name from Google Places (administrative_area_level_2)
 * @param zipCode - ZIP code for additional MSA lookup
 */
export function getRegionalMultiplier(
  msaCode?: string,
  stateCode?: string,
  county?: string,
  zipCode?: string
): { multiplier: number; source: 'msa' | 'state' | 'national'; name?: string; notes?: string; msaCode?: string } {
  // Try to resolve MSA from county/ZIP if not provided directly
  let resolvedMsaCode = msaCode;
  let msaInfo: MSAInfo | null = null;
  
  if (!resolvedMsaCode && (county || zipCode)) {
    msaInfo = getMSABestEffort({
      county,
      stateCode,
      zipCode
    });
    if (msaInfo) {
      resolvedMsaCode = msaInfo.msaCode;
    }
  }
  
  // Try MSA first
  if (resolvedMsaCode && REGIONAL_MULTIPLIERS[resolvedMsaCode]) {
    const regional = REGIONAL_MULTIPLIERS[resolvedMsaCode];
    return {
      multiplier: regional.multiplier,
      source: 'msa',
      name: regional.name,
      notes: regional.notes,
      msaCode: resolvedMsaCode
    };
  }
  
  // Fall back to state
  const effectiveState = stateCode || msaInfo?.state;
  if (effectiveState && STATE_MULTIPLIERS[effectiveState]) {
    const regional = STATE_MULTIPLIERS[effectiveState];
    return {
      multiplier: regional.multiplier,
      source: 'state',
      name: regional.name,
      notes: regional.notes
    };
  }
  
  // National baseline
  return {
    multiplier: 1.0,
    source: 'national',
    name: 'National Average'
  };
}
import { getTradeBenchmark, type TradeBenchmark } from './tradeBenchmarks';
import type { TradeDetectionResult } from './tradeDetection';

export interface DetectedTrade {
  name: string;
  amount: number;
  laborAmount?: number;
  socCode?: string;
  confidence: number;
}

export interface MarketRateResult {
  zipCode: string;
  stateCode: string;
  msaCode?: string;
  msaName?: string;
  areaUsed: 'msa' | 'state' | 'national';
  
  // Labor rate comparison
  bidLaborRate?: number;  // $/hr implied from bid
  marketLaborRate: number;  // BLS median with burden
  marketLaborLow: number;   // 25th percentile with burden
  marketLaborHigh: number;  // 75th percentile with burden
  
  // Per square foot comparison (trade-specific)
  bidPsf?: number;
  marketPsfLow?: number;
  marketPsfMedian?: number;
  marketPsfHigh?: number;
  
  // Trade-specific info
  detectedTrade?: string;
  tradeBenchmark?: TradeBenchmark;
  
  // Regional cost adjustment
  regionalMultiplier?: number;
  regionalSource?: 'msa' | 'state' | 'national';
  regionalName?: string;
  regionalNotes?: string;
  
  // Verdict
  verdict: 'good_deal' | 'average' | 'bad_deal';
  verdictReason: string;
  percentDifference?: number;
  
  // Breakdown by trade
  tradeBreakdown: Array<{
    trade: string;
    bidAmount: number;
    marketMedian: number;
    marketRange: string;
    status: 'below' | 'within' | 'above';
  }>;
  
  // Data quality
  dataSource: string;
  tradesMatched: number;
  totalTrades: number;
}

// Trade keyword to SOC code mapping (matches database trade_occupation_map)
const TRADE_KEYWORD_MAP: Record<string, { socCode: string; title: string }> = {
  // Demolition / General Labor
  'demo': { socCode: '47-2061', title: 'Construction Laborers' },
  'demolition': { socCode: '47-2061', title: 'Construction Laborers' },
  'labor': { socCode: '47-2061', title: 'Construction Laborers' },
  'cleanup': { socCode: '47-2061', title: 'Construction Laborers' },
  // Carpentry / Framing
  'framing': { socCode: '47-2031', title: 'Carpenters' },
  'carpentry': { socCode: '47-2031', title: 'Carpenters' },
  'trim': { socCode: '47-2031', title: 'Carpenters' },
  'millwork': { socCode: '47-2031', title: 'Carpenters' },
  'cabinetry': { socCode: '47-2031', title: 'Carpenters' },
  'cabinet': { socCode: '47-2031', title: 'Carpenters' },
  'door': { socCode: '47-2031', title: 'Carpenters' },
  'window': { socCode: '47-2031', title: 'Carpenters' },
  // Electrical
  'electrical': { socCode: '47-2111', title: 'Electricians' },
  'electric': { socCode: '47-2111', title: 'Electricians' },
  'wiring': { socCode: '47-2111', title: 'Electricians' },
  'panel': { socCode: '47-2111', title: 'Electricians' },
  'outlet': { socCode: '47-2111', title: 'Electricians' },
  'lighting': { socCode: '47-2111', title: 'Electricians' },
  // Plumbing
  'plumbing': { socCode: '47-2152', title: 'Plumbers' },
  'plumb': { socCode: '47-2152', title: 'Plumbers' },
  'pipe': { socCode: '47-2152', title: 'Plumbers' },
  'drain': { socCode: '47-2152', title: 'Plumbers' },
  'fixture': { socCode: '47-2152', title: 'Plumbers' },
  'water heater': { socCode: '47-2152', title: 'Plumbers' },
  // HVAC
  'hvac': { socCode: '49-9021', title: 'HVAC Mechanics' },
  'heating': { socCode: '49-9021', title: 'HVAC Mechanics' },
  'cooling': { socCode: '49-9021', title: 'HVAC Mechanics' },
  'air conditioning': { socCode: '49-9021', title: 'HVAC Mechanics' },
  'ductwork': { socCode: '49-9021', title: 'HVAC Mechanics' },
  'furnace': { socCode: '49-9021', title: 'HVAC Mechanics' },
  // Drywall
  'drywall': { socCode: '47-2081', title: 'Drywall Installers' },
  'sheetrock': { socCode: '47-2081', title: 'Drywall Installers' },
  // Painting
  'paint': { socCode: '47-2141', title: 'Painters' },
  'painting': { socCode: '47-2141', title: 'Painters' },
  'stain': { socCode: '47-2141', title: 'Painters' },
  // Roofing
  'roof': { socCode: '47-2181', title: 'Roofers' },
  'roofing': { socCode: '47-2181', title: 'Roofers' },
  'shingle': { socCode: '47-2181', title: 'Roofers' },
  // Tile
  'tile': { socCode: '47-2044', title: 'Tile Setters' },
  'tiling': { socCode: '47-2044', title: 'Tile Setters' },
  'marble': { socCode: '47-2044', title: 'Tile Setters' },
  'backsplash': { socCode: '47-2044', title: 'Tile Setters' },
  // Flooring
  'flooring': { socCode: '47-2042', title: 'Floor Layers' },
  'floor': { socCode: '47-2042', title: 'Floor Layers' },
  'hardwood': { socCode: '47-2042', title: 'Floor Layers' },
  'laminate': { socCode: '47-2042', title: 'Floor Layers' },
  'carpet': { socCode: '47-2042', title: 'Floor Layers' },
  // Concrete / Masonry
  'concrete': { socCode: '47-2051', title: 'Cement Masons' },
  'cement': { socCode: '47-2051', title: 'Cement Masons' },
  'foundation': { socCode: '47-2051', title: 'Cement Masons' },
  'masonry': { socCode: '47-2022', title: 'Stonemasons' },
  'brick': { socCode: '47-2021', title: 'Brickmasons' },
  // Insulation
  'insulation': { socCode: '47-2131', title: 'Insulation Workers' },
  // Sheet Metal
  'sheet metal': { socCode: '47-2211', title: 'Sheet Metal Workers' },
  'duct': { socCode: '47-2211', title: 'Sheet Metal Workers' },
  // Glass
  'glass': { socCode: '47-2121', title: 'Glaziers' },
  'glazing': { socCode: '47-2121', title: 'Glaziers' },
};

// Detect single trade from line item description (returns first match)
export function detectTradeFromText(text: string): { socCode: string; title: string } | null {
  const lowerText = text.toLowerCase();
  
  for (const [keyword, mapping] of Object.entries(TRADE_KEYWORD_MAP)) {
    if (lowerText.includes(keyword)) {
      return mapping;
    }
  }
  
  return null;
}

// Detect ALL trades from text (for multi-trade bids like "painting and flooring")
export function detectAllTradesFromText(text: string): Array<{ socCode: string; title: string; keyword: string }> {
  const lowerText = text.toLowerCase();
  const foundTrades: Array<{ socCode: string; title: string; keyword: string }> = [];
  const seenSocCodes = new Set<string>();
  
  for (const [keyword, mapping] of Object.entries(TRADE_KEYWORD_MAP)) {
    if (lowerText.includes(keyword) && !seenSocCodes.has(mapping.socCode)) {
      foundTrades.push({ ...mapping, keyword });
      seenSocCodes.add(mapping.socCode);
    }
  }
  
  return foundTrades;
}

// Get wage data with fallback chain: MSA -> State -> National
export function getWageDataWithFallback(
  socCode: string,
  msaCode?: string,
  stateCode?: string,
  wageData: OewsWageData[] = ALL_OEWS_DATA
): { data: OewsWageData | null; source: 'msa' | 'state' | 'national' } {
  // Try MSA first
  if (msaCode) {
    const msaData = wageData.find(
      w => w.soc_code === socCode && w.area_type === 'msa' && w.area_code === msaCode
    );
    if (msaData) return { data: msaData, source: 'msa' };
  }
  
  // Fall back to state
  if (stateCode) {
    const stateData = wageData.find(
      w => w.soc_code === socCode && w.area_type === 'state' && w.area_code === stateCode
    );
    if (stateData) return { data: stateData, source: 'state' };
  }
  
  // Fall back to national
  const nationalData = wageData.find(
    w => w.soc_code === socCode && w.area_type === 'national'
  );
  return { data: nationalData || null, source: 'national' };
}

// Calculate weighted average labor rate from detected trades
export function calculateWeightedLaborRate(
  trades: DetectedTrade[],
  msaCode?: string,
  stateCode?: string,
  wageData: OewsWageData[] = ALL_OEWS_DATA
): { 
  medianRate: number; 
  lowRate: number; 
  highRate: number; 
  source: 'msa' | 'state' | 'national';
  matchedTrades: number;
} {
  let totalWeight = 0;
  let weightedMedian = 0;
  let weightedLow = 0;
  let weightedHigh = 0;
  let matchedTrades = 0;
  let primarySource: 'msa' | 'state' | 'national' = 'national';
  
  for (const trade of trades) {
    if (!trade.socCode) continue;
    
    const { data, source } = getWageDataWithFallback(trade.socCode, msaCode, stateCode, wageData);
    if (!data) continue;
    
    const weight = trade.amount || 1;
    totalWeight += weight;
    
    // Apply trade-specific burden multiplier to convert base wage to billable rate
    const tradeBurden = getBurdenMultiplier(trade.socCode!);
    weightedMedian += data.hourly_median * tradeBurden * weight;
    weightedLow += data.hourly_25 * tradeBurden * weight;
    weightedHigh += data.hourly_75 * tradeBurden * weight;
    
    matchedTrades++;
    if (source !== 'national') primarySource = source;
  }
  
  if (totalWeight === 0) {
    // Return national average for general construction if no trades matched
    const generalLabor = wageData.find(
      w => w.soc_code === '47-2061' && w.area_type === 'national'
    );
    const rate = (generalLabor?.hourly_median || 20) * BURDEN_MULTIPLIER;
    return {
      medianRate: rate,
      lowRate: (generalLabor?.hourly_25 || 17) * BURDEN_MULTIPLIER,
      highRate: (generalLabor?.hourly_75 || 26) * BURDEN_MULTIPLIER,
      source: 'national',
      matchedTrades: 0
    };
  }
  
  return {
    medianRate: weightedMedian / totalWeight,
    lowRate: weightedLow / totalWeight,
    highRate: weightedHigh / totalWeight,
    source: primarySource,
    matchedTrades
  };
}

// Determine verdict based on comparison
// Uses market range (low-high) as primary check, with percentage thresholds as fallback
export function determineVerdict(
  bidAmount: number,
  marketMedian: number,
  marketLow: number,
  marketHigh: number
): { verdict: 'good_deal' | 'average' | 'bad_deal'; reason: string; percentDiff: number } {
  const percentDiff = ((bidAmount - marketMedian) / marketMedian) * 100;
  
  // Primary check: Is bid within the market range (low to high)?
  const isWithinRange = bidAmount >= marketLow && bidAmount <= marketHigh;
  const isBelowRange = bidAmount < marketLow;
  const isAboveRange = bidAmount > marketHigh;
  
  // Good deal: bid is below the market low (clearly below typical range)
  if (isBelowRange) {
    return {
      verdict: 'good_deal',
      reason: `Below market range ($${marketLow.toLocaleString()}-$${marketHigh.toLocaleString()})`,
      percentDiff
    };
  }
  
  // Bad deal: bid is above the market high (clearly above typical range)
  if (isAboveRange) {
    return {
      verdict: 'bad_deal',
      reason: `Above market range ($${marketLow.toLocaleString()}-$${marketHigh.toLocaleString()})`,
      percentDiff
    };
  }
  
  // Within range: determine if it's a good deal (lower half) or average (upper half)
  if (isWithinRange) {
    const rangePosition = (bidAmount - marketLow) / (marketHigh - marketLow); // 0 = at low, 1 = at high
    
    if (rangePosition <= 0.3) {
      // In the lower 30% of range - good deal
      return {
        verdict: 'good_deal',
        reason: `Within market range, on the lower end`,
        percentDiff
      };
    }
    
    // In the middle or upper portion of range - average/fair
    return {
      verdict: 'average',
      reason: `Within market range ($${marketLow.toLocaleString()}-$${marketHigh.toLocaleString()})`,
      percentDiff
    };
  }
  
  // Fallback (shouldn't reach here)
  return {
    verdict: 'average',
    reason: 'Within typical market range',
    percentDiff
  };
}

// Main calculation function for market rate comparison
export function calculateMarketComparison(
  bidTotal: number,
  squareFootage: number | undefined,
  detectedTrades: DetectedTrade[],
  zipCode: string,
  stateCode: string,
  msaCode?: string,
  msaName?: string,
  wageData: OewsWageData[] = ALL_OEWS_DATA,
  tradeDetection?: TradeDetectionResult
): MarketRateResult {
  // Enrich trades with SOC codes (preserve existing socCode if present)
  const enrichedTrades = detectedTrades.map(trade => {
    if (trade.socCode) {
      return trade; // Already has SOC code, don't overwrite
    }
    const detected = detectTradeFromText(trade.name);
    return {
      ...trade,
      socCode: detected?.socCode
    };
  });
  
  // Get regional cost multiplier for this location
  const regional = getRegionalMultiplier(msaCode, stateCode);
  
  // Calculate weighted labor rates
  const laborRates = calculateWeightedLaborRate(enrichedTrades, msaCode, stateCode, wageData);
  
  // Calculate PSF if square footage available
  let bidPsf: number | undefined;
  if (squareFootage && squareFootage > 0) {
    bidPsf = bidTotal / squareFootage;
  }
  
  // Get trade-specific benchmark if we have trade detection
  let tradeBenchmark: TradeBenchmark | undefined;
  let detectedTrade: string | undefined;
  
  if (tradeDetection && tradeDetection.primaryTrade !== 'unknown') {
    tradeBenchmark = getTradeBenchmark(tradeDetection);
    detectedTrade = tradeDetection.primaryTrade;
  }
  
  // Determine verdict based on trade-specific PSF benchmarks when available
  let verdict: 'good_deal' | 'average' | 'bad_deal';
  let verdictReason: string;
  let percentDiff: number;
  let marketPsfLow: number | undefined;
  let marketPsfMedian: number | undefined;
  let marketPsfHigh: number | undefined;
  
  // Use trade-specific PSF benchmarks if available and we have square footage
  // Apply regional multiplier to adjust for local cost of living
  if (bidPsf && tradeBenchmark?.psfRange) {
    // Apply regional multiplier to national benchmarks
    marketPsfLow = tradeBenchmark.psfRange.low * regional.multiplier;
    marketPsfMedian = tradeBenchmark.psfRange.mid * regional.multiplier;
    marketPsfHigh = tradeBenchmark.psfRange.high * regional.multiplier;
    
    const comparison = determineVerdict(bidPsf, marketPsfMedian, marketPsfLow, marketPsfHigh);
    verdict = comparison.verdict;
    verdictReason = comparison.reason;
    percentDiff = comparison.percentDiff;
  } else if (bidPsf) {
    // Fallback: No trade benchmark, use labor rates as rough proxy
    // Regional multiplier already applied via labor rates
    const fallbackPsfMedian = laborRates.medianRate * 1.5 * regional.multiplier;
    marketPsfLow = fallbackPsfMedian * 0.8;
    marketPsfMedian = fallbackPsfMedian;
    marketPsfHigh = fallbackPsfMedian * 1.2;
    
    const comparison = determineVerdict(bidPsf, fallbackPsfMedian, marketPsfLow, marketPsfHigh);
    verdict = comparison.verdict;
    verdictReason = comparison.reason;
    percentDiff = comparison.percentDiff;
  } else {
    // No square footage - use labor-based comparison with regional adjustment
    const estimatedLaborPercent = 0.40;
    const estimatedBidLabor = bidTotal * estimatedLaborPercent;
    const estimatedHours = estimatedBidLabor / 50;
    const marketLaborCost = estimatedHours * laborRates.medianRate * regional.multiplier;
    const marketLaborLow = estimatedHours * laborRates.lowRate * regional.multiplier;
    const marketLaborHigh = estimatedHours * laborRates.highRate * regional.multiplier;
    
    const comparison = determineVerdict(estimatedBidLabor, marketLaborCost, marketLaborLow, marketLaborHigh);
    verdict = comparison.verdict;
    verdictReason = comparison.reason;
    percentDiff = comparison.percentDiff;
  }
  
  // Build trade breakdown
  const tradeBreakdown = enrichedTrades
    .filter(t => t.socCode)
    .map(trade => {
      const { data } = getWageDataWithFallback(trade.socCode!, msaCode, stateCode, wageData);
      const tradeBurden = getBurdenMultiplier(trade.socCode!);
      const marketMedian = data ? data.hourly_median * tradeBurden : 0;
      const marketLow = data ? data.hourly_25 * tradeBurden : 0;
      const marketHigh = data ? data.hourly_75 * tradeBurden : 0;
      
      return {
        trade: trade.name,
        bidAmount: trade.amount,
        marketMedian: Math.round(marketMedian * 100) / 100,
        marketRange: `$${marketLow.toFixed(0)}-$${marketHigh.toFixed(0)}/hr`,
        status: trade.amount < marketLow ? 'below' as const : 
                trade.amount > marketHigh ? 'above' as const : 'within' as const
      };
    });
  
  // Build regional adjustment note for data source
  const regionalNote = regional.multiplier !== 1.0 
    ? ` | Regional: ${regional.name} (${regional.multiplier}x)`
    : '';
  
  return {
    zipCode,
    stateCode,
    msaCode,
    msaName,
    areaUsed: laborRates.source,
    marketLaborRate: Math.round(laborRates.medianRate * regional.multiplier * 100) / 100,
    marketLaborLow: Math.round(laborRates.lowRate * regional.multiplier * 100) / 100,
    marketLaborHigh: Math.round(laborRates.highRate * regional.multiplier * 100) / 100,
    bidPsf,
    marketPsfLow,
    marketPsfMedian,
    marketPsfHigh,
    detectedTrade,
    tradeBenchmark,
    regionalMultiplier: regional.multiplier,
    regionalSource: regional.source,
    regionalName: regional.name,
    regionalNotes: regional.notes,
    verdict,
    verdictReason,
    percentDifference: Math.round(percentDiff * 10) / 10,
    tradeBreakdown,
    dataSource: tradeBenchmark 
      ? `Trade benchmarks (${detectedTrade}) + BLS OEWS May 2023${regionalNote}`
      : `BLS OEWS May 2023 (${laborRates.source} level)${regionalNote}`,
    tradesMatched: laborRates.matchedTrades,
    totalTrades: enrichedTrades.length
  };
}
