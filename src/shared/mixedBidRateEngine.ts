// Mixed Bid Rate Engine
// Calculates realistic market rates by combining:
// - BLS wage data (by trade and location)
// - Trade mix weights (by project type)
// - Labor burden multipliers
// - Overhead & profit factors
// - Material cost ratios

import { 
  CONSTRUCTION_SOC_CODES, 
  NATIONAL_WAGE_DATA, 
  STATE_WAGE_DATA, 
  MSA_WAGE_DATA,
  type OewsWageData 
} from './blsOewsData';
import { getMSAFromZip, getStateFromZip } from './msaLookup';
import { PROJECT_PRODUCTIVITY } from './productivityRates';

// ============================================================================
// CONSTANTS & MULTIPLIERS
// ============================================================================

/**
 * Labor Burden - costs employers pay on top of wages
 * Includes: FICA (7.65%), FUTA, SUTA, Workers Comp (~5-15%), Health Insurance, etc.
 * Industry standard: 25-35% of wages
 */
export const LABOR_BURDEN = 1.25;

/**
 * Overhead & Profit - contractor's business costs and margin
 * Overhead: Office, trucks, tools, insurance, admin, marketing (~15-25%)
 * Profit: Contractor's margin (~10-20%)
 * Combined industry standard: 50-100% markup on labor+burden
 */
export const OVERHEAD_PROFIT = 1.65;

/**
 * Material Factor - materials as a ratio of labor cost
 * For remodeling, materials typically equal 40-60% of the job
 * This multiplier converts labor-only cost to labor+materials
 * 2.0 = 50/50 labor/material split (materials cost as much as labor)
 */
export const MATERIAL_FACTOR = 2.0;

/**
 * Combined multiplier for converting raw BLS wage to billed rate
 * Raw wage → Burdened labor → With O&P → With materials
 * $25/hr → $31.25 → $51.56 → $103.12 billed equivalent
 */
export const TOTAL_MULTIPLIER = LABOR_BURDEN * OVERHEAD_PROFIT * MATERIAL_FACTOR;
// = 1.25 * 1.65 * 2.0 = 4.125

// ============================================================================
// TRADE DEFINITIONS
// ============================================================================

export type TradeCode = 
  | 'carpenter'
  | 'electrician'
  | 'plumber'
  | 'hvac'
  | 'painter'
  | 'roofer'
  | 'tile-setter'
  | 'flooring'
  | 'drywall'
  | 'laborer';

export interface TradeInfo {
  code: TradeCode;
  socCode: string;
  name: string;
  description: string;
}

export const TRADES: Record<TradeCode, TradeInfo> = {
  'carpenter': {
    code: 'carpenter',
    socCode: CONSTRUCTION_SOC_CODES.CARPENTERS,
    name: 'Carpenter',
    description: 'Framing, cabinetry, trim, finish work',
  },
  'electrician': {
    code: 'electrician',
    socCode: CONSTRUCTION_SOC_CODES.ELECTRICIANS,
    name: 'Electrician',
    description: 'Wiring, panels, fixtures, devices',
  },
  'plumber': {
    code: 'plumber',
    socCode: CONSTRUCTION_SOC_CODES.PLUMBERS,
    name: 'Plumber',
    description: 'Pipes, fixtures, water heaters, drains',
  },
  'hvac': {
    code: 'hvac',
    socCode: CONSTRUCTION_SOC_CODES.HVAC,
    name: 'HVAC Technician',
    description: 'Heating, cooling, ductwork, ventilation',
  },
  'painter': {
    code: 'painter',
    socCode: CONSTRUCTION_SOC_CODES.PAINTERS,
    name: 'Painter',
    description: 'Interior/exterior painting, staining, finishing',
  },
  'roofer': {
    code: 'roofer',
    socCode: CONSTRUCTION_SOC_CODES.ROOFERS,
    name: 'Roofer',
    description: 'Shingles, flashing, gutters, repairs',
  },
  'tile-setter': {
    code: 'tile-setter',
    socCode: CONSTRUCTION_SOC_CODES.TILE_SETTERS,
    name: 'Tile Setter',
    description: 'Floor tile, wall tile, backsplash, stone',
  },
  'flooring': {
    code: 'flooring',
    socCode: CONSTRUCTION_SOC_CODES.FLOOR_LAYERS,
    name: 'Flooring Installer',
    description: 'Hardwood, LVP, carpet, vinyl',
  },
  'drywall': {
    code: 'drywall',
    socCode: CONSTRUCTION_SOC_CODES.DRYWALL,
    name: 'Drywall Installer',
    description: 'Hanging, taping, mudding, finishing',
  },
  'laborer': {
    code: 'laborer',
    socCode: CONSTRUCTION_SOC_CODES.CONSTRUCTION_LABORERS,
    name: 'General Laborer',
    description: 'Demo, cleanup, material handling, assistance',
  },
};

/**
 * Reverse lookup: SOC code → TradeCode
 * Used when customTradeMix is provided with SOC codes instead of trade names
 */
const SOC_TO_TRADE_CODE: Record<string, TradeCode> = Object.entries(TRADES).reduce(
  (acc, [tradeCode, info]) => {
    acc[info.socCode] = tradeCode as TradeCode;
    return acc;
  },
  {} as Record<string, TradeCode>
);

/**
 * Normalize a trade mix that might have SOC codes as keys to use trade codes
 */
export function normalizeTradeMix(mix: TradeMix): TradeMix {
  const normalized: TradeMix = {};
  for (const [key, weight] of Object.entries(mix)) {
    // Check if key is a SOC code (format: XX-XXXX)
    if (/^\d{2}-\d{4}$/.test(key)) {
      const tradeCode = SOC_TO_TRADE_CODE[key];
      if (tradeCode) {
        normalized[tradeCode] = (normalized[tradeCode] || 0) + weight;
      } else {
        console.warn(`[MixedRate] Unknown SOC code: ${key}`);
      }
    } else {
      // Already a trade code
      normalized[key] = weight;
    }
  }
  return normalized;
}

// ============================================================================
// PROJECT TRADE MIXES
// ============================================================================

export type ProjectType = 
  | 'kitchen-remodel'
  | 'bathroom-remodel'
  | 'basement-remodel'
  | 'basement-refinishing'
  | 'countertops'
  | 'full-remodel'
  | 'flooring'
  | 'painting'
  | 'roofing'
  | 'roofing-repair'
  | 'roofing-storm'
  | 'roofing-hail'
  | 'roofing-fire'
  | 'roofing-insurance'
  | 'windows-doors'
  | 'window-repair'
  | 'door-interior'
  | 'door-patio'
  | 'door-french'
  | 'electrical'
  | 'plumbing'
  | 'hvac'
  | 'tile'
  | 'drywall'
  | 'garage-door'
  | 'cabinet-refinishing'
  | 'cabinet-refacing'
  | 'cabinet-replacement'
  | 'cabinet-new-line'
  // Linear foot project types
  | 'fence'
  | 'gutter'
  | 'railing'
  | 'retaining-wall'
  | 'crown-molding'
  | 'baseboards'
  | 'general';

export interface TradeMix {
  [tradeCode: string]: number; // Trade code → weight (0-1, should sum to 1)
}

/**
 * Default trade mixes by project type
 * Weights represent approximate labor cost allocation
 * Based on industry estimates and contractor experience
 */
export const PROJECT_TRADE_MIX: Record<ProjectType, TradeMix> = {
  'kitchen-remodel': {
    'carpenter': 0.40,    // Cabinetry, counters, trim
    'electrician': 0.15,  // Lighting, outlets, appliances
    'plumber': 0.15,      // Sink, disposal, dishwasher
    'tile-setter': 0.15,  // Backsplash, flooring
    'painter': 0.10,      // Walls, cabinets
    'laborer': 0.05,      // Demo, cleanup
  },
  'bathroom-remodel': {
    'plumber': 0.30,      // Fixtures, shower, toilet
    'tile-setter': 0.25,  // Floor, shower walls
    'electrician': 0.15,  // Lighting, exhaust, outlets
    'carpenter': 0.15,    // Vanity, trim, door
    'painter': 0.10,      // Walls, ceiling
    'laborer': 0.05,      // Demo, cleanup
  },
  'basement-remodel': {
    'carpenter': 0.30,    // Framing, trim, built-ins
    'drywall': 0.20,      // Walls, ceilings
    'electrician': 0.15,  // Lighting, outlets, panel
    'plumber': 0.10,      // Bathroom rough-in, egress
    'flooring': 0.10,     // LVP, carpet, tile
    'painter': 0.10,      // Walls, ceiling
    'laborer': 0.05,      // Demo, cleanup
  },
  'basement-refinishing': {
    'drywall': 0.25,      // Repair, patching
    'painter': 0.30,      // Walls, ceiling refresh
    'flooring': 0.25,     // New flooring over existing
    'electrician': 0.10,  // Lighting updates
    'carpenter': 0.05,    // Trim, minor repairs
    'laborer': 0.05,      // Prep, cleanup
  },
  'countertops': {
    'tile-setter': 0.70,  // Countertop fabrication/installation (stone work)
    'plumber': 0.15,      // Sink disconnect/reconnect
    'carpenter': 0.10,    // Support brackets, adjustments
    'laborer': 0.05,      // Demo old counters, cleanup
  },
  'full-remodel': {
    'carpenter': 0.30,    // Framing, trim, cabinets
    'electrician': 0.15,  // Rewiring, panels
    'plumber': 0.15,      // Re-piping, fixtures
    'drywall': 0.15,      // Walls, ceilings
    'painter': 0.10,      // Throughout
    'flooring': 0.10,     // All floors
    'laborer': 0.05,      // Demo, cleanup
  },
  'flooring': {
    'flooring': 0.85,     // Primary trade
    'carpenter': 0.10,    // Transitions, trim
    'laborer': 0.05,      // Moving furniture, cleanup
  },
  'painting': {
    'painter': 0.90,      // Primary trade
    'laborer': 0.10,      // Prep, cleanup
  },
  'roofing': {
    'roofer': 0.85,       // Primary trade
    'carpenter': 0.10,    // Fascia, decking repairs
    'laborer': 0.05,      // Cleanup
  },
  'windows-doors': {
    'carpenter': 0.80,    // Installation
    'painter': 0.10,      // Touch-up, caulking
    'laborer': 0.10,      // Removal, cleanup
  },
  'electrical': {
    'electrician': 0.90,  // Primary trade
    'laborer': 0.10,      // Assistance
  },
  'plumbing': {
    'plumber': 0.90,      // Primary trade
    'laborer': 0.10,      // Assistance
  },
  'hvac': {
    'hvac': 0.85,         // Primary trade
    'electrician': 0.10,  // Wiring, disconnect
    'laborer': 0.05,      // Assistance
  },
  'tile': {
    'tile-setter': 0.85,  // Primary trade
    'laborer': 0.15,      // Prep, cleanup, mixing
  },
  'drywall': {
    'drywall': 0.85,      // Primary trade
    'painter': 0.10,      // Primer coat
    'laborer': 0.05,      // Cleanup
  },
  'general': {
    'carpenter': 0.25,
    'electrician': 0.15,
    'plumber': 0.15,
    'painter': 0.15,
    'laborer': 0.30,
  },
  // === Linear Foot Project Types ===
  'fence': {
    'carpenter': 0.70,    // Fence building is carpentry
    'laborer': 0.30,      // Post holes, concrete, cleanup
  },
  'gutter': {
    'roofer': 0.80,       // Gutter installation
    'laborer': 0.20,      // Cleanup, hauling
  },
  'railing': {
    'carpenter': 0.75,    // Railing/handrail installation
    'laborer': 0.25,      // Prep, cleanup
  },
  'retaining-wall': {
    'carpenter': 0.50,    // Framing, structure
    'laborer': 0.50,      // Excavation, backfill, concrete
  },
  'crown-molding': {
    'carpenter': 0.85,    // Trim carpentry
    'painter': 0.10,      // Caulk, paint
    'laborer': 0.05,      // Cleanup
  },
  'baseboards': {
    'carpenter': 0.80,    // Trim carpentry
    'painter': 0.15,      // Paint, caulk
    'laborer': 0.05,      // Cleanup
  },
  // === Roofing Types ===
  'roofing-repair': {
    'roofer': 0.80,       // Primary trade - patch/repair work
    'carpenter': 0.10,    // Decking/fascia repairs
    'laborer': 0.10,      // Cleanup
  },
  'roofing-storm': {
    'roofer': 0.75,       // Storm damage repair
    'carpenter': 0.15,    // Structural repairs
    'laborer': 0.10,      // Debris cleanup
  },
  'roofing-hail': {
    'roofer': 0.80,       // Hail damage often full replacement
    'carpenter': 0.10,    // Decking repairs
    'laborer': 0.10,      // Cleanup
  },
  'roofing-fire': {
    'roofer': 0.60,       // Roof replacement
    'carpenter': 0.25,    // Structural rebuild
    'laborer': 0.15,      // Demo, cleanup
  },
  'roofing-insurance': {
    'roofer': 0.75,       // Typically full replacement
    'carpenter': 0.15,    // Fascia, decking
    'laborer': 0.10,      // Cleanup
  },
  // === Door Types ===
  'door-interior': {
    'carpenter': 0.85,    // Door installation, trim
    'painter': 0.10,      // Touch-up
    'laborer': 0.05,      // Cleanup
  },
  'door-patio': {
    'carpenter': 0.75,    // Installation, framing adjustments
    'painter': 0.10,      // Trim, touch-up
    'laborer': 0.15,      // Removal, cleanup
  },
  'door-french': {
    'carpenter': 0.80,    // Installation, trim work
    'painter': 0.10,      // Touch-up, finishing
    'laborer': 0.10,      // Removal, cleanup
  },
  // === Window Types ===
  'window-repair': {
    'carpenter': 0.70,    // Sash repair, hardware
    'painter': 0.20,      // Touch-up, caulking
    'laborer': 0.10,      // Cleanup
  },
  // === Garage Door ===
  'garage-door': {
    'carpenter': 0.60,    // Installation, framing
    'electrician': 0.30,  // Opener wiring, sensors
    'laborer': 0.10,      // Removal, cleanup
  },
  // === Cabinet Types ===
  'cabinet-refinishing': {
    'painter': 0.70,      // Refinishing, painting
    'carpenter': 0.20,    // Hardware, adjustments
    'laborer': 0.10,      // Prep, cleanup
  },
  'cabinet-refacing': {
    'carpenter': 0.75,    // Veneer application, doors
    'painter': 0.15,      // Touch-up
    'laborer': 0.10,      // Demo old faces
  },
  'cabinet-replacement': {
    'carpenter': 0.65,    // Installation
    'plumber': 0.15,      // Sink disconnect/reconnect
    'electrician': 0.10,  // Appliance disconnects
    'laborer': 0.10,      // Demo, cleanup
  },
  'cabinet-new-line': {
    'carpenter': 0.70,    // Installation
    'electrician': 0.15,  // Under-cabinet lighting
    'painter': 0.10,      // Touch-up
    'laborer': 0.05,      // Cleanup
  },
};

// ============================================================================
// LIVE BLS RATES INTERFACE
// ============================================================================

/**
 * Live rates fetched from BLS API (passed from frontend)
 * Key is SOC code, value contains hourly rate and metadata
 */
export interface LiveBlsRates {
  [socCode: string]: {
    hourly: number;
    annual: number;
    source: 'live' | 'cached' | 'static';
    fetchedAt?: string;
  };
}

// ============================================================================
// WAGE LOOKUP FUNCTIONS
// ============================================================================

/**
 * Get wage data for a specific SOC code and location
 * Priority: Live BLS → MSA → State → National
 */
export function getWageData(
  socCode: string,
  zipCode?: string,
  liveRates?: LiveBlsRates
): OewsWageData | null {
  // If live rates are provided and have this SOC code with valid data
  if (liveRates && liveRates[socCode] && liveRates[socCode].hourly > 0) {
    const live = liveRates[socCode];
    // Convert to OewsWageData format
    return {
      soc_code: socCode,
      occupation_title: 'Live BLS Data',
      area_type: 'msa', // Treat live as MSA-level precision
      area_code: 'LIVE',
      area_name: 'Live BLS Data',
      hourly_10: live.hourly * 0.65,
      hourly_25: live.hourly * 0.80,
      hourly_median: live.hourly,
      hourly_75: live.hourly * 1.20,
      hourly_90: live.hourly * 1.45,
      annual_median: live.annual,
    };
  }
  // Try MSA-level data first (most accurate)
  if (zipCode) {
    const msaInfo = getMSAFromZip(zipCode);
    if (msaInfo) {
      const msaWage = MSA_WAGE_DATA.find(
        w => w.soc_code === socCode && w.area_code === msaInfo.msaCode
      );
      if (msaWage) return msaWage;
    }

    // Try state-level data
    const stateCode = getStateFromZip(zipCode);
    if (stateCode) {
      const stateWage = STATE_WAGE_DATA.find(
        w => w.soc_code === socCode && w.area_code === stateCode
      );
      if (stateWage) return stateWage;
    }
  }

  // Fall back to national data
  const nationalWage = NATIONAL_WAGE_DATA.find(w => w.soc_code === socCode);
  return nationalWage || null;
}

/**
 * Get the median hourly wage for a trade at a location
 * Supports live BLS rates when provided (for premium users)
 */
export function getTradeWage(
  tradeCode: TradeCode,
  zipCode?: string,
  liveRates?: LiveBlsRates
): { hourly: number; source: 'msa' | 'state' | 'national' | 'live'; areaName: string } | null {
  const trade = TRADES[tradeCode];
  if (!trade) return null;

  const wageData = getWageData(trade.socCode, zipCode, liveRates);
  if (!wageData) return null;

  return {
    hourly: wageData.hourly_median,
    source: wageData.area_code === 'LIVE' ? 'live' : wageData.area_type,
    areaName: wageData.area_name,
  };
}

/**
 * Convert raw wage to fully burdened billed rate
 */
export function getBurdenedRate(rawHourlyWage: number): number {
  return rawHourlyWage * TOTAL_MULTIPLIER;
}

// ============================================================================
// MIXED RATE CALCULATION
// ============================================================================

export interface MixedRateResult {
  // Primary outputs
  marketPsfLow: number;      // Low estimate $/SF
  marketPsfMedian: number;   // Median estimate $/SF
  marketPsfHigh: number;     // High estimate $/SF
  
  // Calculation details
  weightedHourlyWage: number;  // Blended raw wage before burden
  burdenedHourlyRate: number;  // After labor burden
  billedHourlyRate: number;    // After O&P
  effectiveRate: number;       // After materials
  
  // Breakdown by trade
  tradeBreakdown: {
    trade: TradeCode;
    weight: number;
    rawWage: number;
    contribution: number;
    source: 'msa' | 'state' | 'national' | 'live';
  }[];
  
  // Metadata
  projectType: ProjectType;
  zipCode: string | null;
  dataSource: 'msa' | 'state' | 'national' | 'live' | 'mixed';
  laborHoursPerSf: number;
  usedLiveRates: boolean;  // Whether live BLS rates were used
}

/**
 * Calculate the mixed market rate for a project type at a location
 * Supports live BLS rates when provided (for premium users)
 */
export function calculateMixedRate(
  projectType: ProjectType,
  zipCode?: string,
  customTradeMix?: TradeMix,
  liveRates?: LiveBlsRates
): MixedRateResult {
  // Normalize custom trade mix (handles SOC codes from Gemini analysis)
  const normalizedCustomMix = customTradeMix ? normalizeTradeMix(customTradeMix) : undefined;
  const tradeMix = normalizedCustomMix || PROJECT_TRADE_MIX[projectType] || PROJECT_TRADE_MIX['general'];
  
  // Calculate weighted wage across all trades in the mix
  let weightedWage = 0;
  let totalWeight = 0;
  const tradeBreakdown: MixedRateResult['tradeBreakdown'] = [];
  const sources = new Set<'msa' | 'state' | 'national' | 'live'>();
  let usedLiveRates = false;
  
  for (const [tradeCode, weight] of Object.entries(tradeMix)) {
    if (weight <= 0) continue;
    
    const wageInfo = getTradeWage(tradeCode as TradeCode, zipCode, liveRates);
    if (!wageInfo) continue;
    
    const contribution = wageInfo.hourly * weight;
    weightedWage += contribution;
    totalWeight += weight;
    sources.add(wageInfo.source);
    
    if (wageInfo.source === 'live') {
      usedLiveRates = true;
    }
    
    tradeBreakdown.push({
      trade: tradeCode as TradeCode,
      weight,
      rawWage: wageInfo.hourly,
      contribution,
      source: wageInfo.source,
    });
  }
  
  // Normalize if weights don't sum to 1
  if (totalWeight > 0 && totalWeight !== 1) {
    weightedWage = weightedWage / totalWeight;
  }
  
  // If no wage data found, use a reasonable default
  if (weightedWage === 0) {
    weightedWage = 25; // ~$25/hr national average for construction
  }
  
  // Apply multipliers
  const burdenedRate = weightedWage * LABOR_BURDEN;
  const billedRate = burdenedRate * OVERHEAD_PROFIT;
  const effectiveRate = billedRate * MATERIAL_FACTOR;
  
  // Get productivity info to convert hourly to PSF
  const productivityKey = projectType === 'general' ? 'full-remodel' : projectType;
  const productivityConfig = PROJECT_PRODUCTIVITY[productivityKey];
  
  // Labor hours per SF (how long it takes to complete 1 SF)
  let laborHoursPerSf = 0.1; // Default: 10 SF per hour
  if (productivityConfig) {
    // Crew works together, so divide by crew size to get "project hours"
    // Then multiply by hoursPerSfMultiplier for complexity
    const baseProductivity = 20; // Base SF per hour
    laborHoursPerSf = (1 / baseProductivity) * productivityConfig.hoursPerSfMultiplier;
  }
  
  // Calculate PSF rates
  // PSF = hourly rate × hours per SF
  const marketPsfMedian = effectiveRate * laborHoursPerSf;
  const marketPsfLow = marketPsfMedian * 0.75;    // 25% below median
  const marketPsfHigh = marketPsfMedian * 1.35;   // 35% above median
  
  // Determine overall data source
  let dataSource: 'msa' | 'state' | 'national' | 'live' | 'mixed' = 'national';
  if (sources.size === 1) {
    dataSource = [...sources][0];
  } else if (sources.size > 1) {
    dataSource = 'mixed';
  }
  
  return {
    marketPsfLow: Math.round(marketPsfLow * 100) / 100,
    marketPsfMedian: Math.round(marketPsfMedian * 100) / 100,
    marketPsfHigh: Math.round(marketPsfHigh * 100) / 100,
    weightedHourlyWage: Math.round(weightedWage * 100) / 100,
    burdenedHourlyRate: Math.round(burdenedRate * 100) / 100,
    billedHourlyRate: Math.round(billedRate * 100) / 100,
    effectiveRate: Math.round(effectiveRate * 100) / 100,
    tradeBreakdown,
    projectType,
    zipCode: zipCode || null,
    dataSource,
    laborHoursPerSf: Math.round(laborHoursPerSf * 1000) / 1000,
    usedLiveRates,
  };
}

// ============================================================================
// PROJECT COST ESTIMATION
// ============================================================================

export interface ProjectCostEstimate {
  laborCostLow: number;
  laborCostMedian: number;
  laborCostHigh: number;
  totalCostLow: number;     // With materials
  totalCostMedian: number;
  totalCostHigh: number;
  psfLow: number;
  psfMedian: number;
  psfHigh: number;
  laborHours: number;
  breakdown: MixedRateResult;
}

/**
 * Estimate total project cost given square footage
 * Supports live BLS rates when provided (for premium users)
 */
export function estimateProjectCost(
  projectType: ProjectType,
  squareFootage: number,
  zipCode?: string,
  customTradeMix?: TradeMix,
  liveRates?: LiveBlsRates
): ProjectCostEstimate {
  const mixedRate = calculateMixedRate(projectType, zipCode, customTradeMix, liveRates);
  
  const totalCostLow = mixedRate.marketPsfLow * squareFootage;
  const totalCostMedian = mixedRate.marketPsfMedian * squareFootage;
  const totalCostHigh = mixedRate.marketPsfHigh * squareFootage;
  
  // Labor is roughly half of total (before material factor)
  const laborCostLow = totalCostLow / MATERIAL_FACTOR;
  const laborCostMedian = totalCostMedian / MATERIAL_FACTOR;
  const laborCostHigh = totalCostHigh / MATERIAL_FACTOR;
  
  const laborHours = mixedRate.laborHoursPerSf * squareFootage;
  
  return {
    laborCostLow: Math.round(laborCostLow),
    laborCostMedian: Math.round(laborCostMedian),
    laborCostHigh: Math.round(laborCostHigh),
    totalCostLow: Math.round(totalCostLow),
    totalCostMedian: Math.round(totalCostMedian),
    totalCostHigh: Math.round(totalCostHigh),
    psfLow: mixedRate.marketPsfLow,
    psfMedian: mixedRate.marketPsfMedian,
    psfHigh: mixedRate.marketPsfHigh,
    laborHours: Math.round(laborHours),
    breakdown: mixedRate,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Map common project type strings to our ProjectType enum
 */
export function normalizeProjectType(input: string): ProjectType {
  const normalized = input.toLowerCase().trim();
  
  // Direct matches
  if (normalized in PROJECT_TRADE_MIX) {
    return normalized as ProjectType;
  }
  
  // Fuzzy matching
  // Check specialty types BEFORE room types (e.g., "Kitchen Countertop" → countertops, not kitchen)
  
  // Garage door - check early (specific product type)
  if (normalized.includes('garage door') || normalized.includes('garage opener') ||
      normalized.includes('liftmaster') || normalized.includes('chamberlain') ||
      normalized.includes('amarr') || normalized.includes('clopay')) {
    return 'garage-door';
  }
  
  // Cabinet types - check BEFORE kitchen to catch "Kitchen Cabinet Refinishing"
  if (normalized.includes('cabinet')) {
    if (normalized.includes('refinish') || normalized.includes('repaint') || normalized.includes('restain')) {
      return 'cabinet-refinishing';
    }
    if (normalized.includes('reface') || normalized.includes('veneer')) {
      return 'cabinet-refacing';
    }
    if (normalized.includes('replace') || normalized.includes('new cabinet') || normalized.includes('install')) {
      return 'cabinet-replacement';
    }
    if (normalized.includes('new line') || normalized.includes('additional')) {
      return 'cabinet-new-line';
    }
    // Default cabinet work to refinishing (most common)
    return 'cabinet-refinishing';
  }
  
  // Countertops - check BEFORE kitchen since "Kitchen Countertop Installation" is countertops
  if (normalized.includes('countertop') || normalized.includes('counter top') ||
      normalized.includes('granite') || normalized.includes('quartz') ||
      normalized.includes('marble counter') || normalized.includes('stone counter')) {
    return 'countertops';
  }
  
  // Basement - check BEFORE kitchen since "basement, kitchen" should prioritize basement
  if (normalized.includes('basement')) {
    // Handle explicit types from extractDetectedData first
    if (normalized === 'basement refinishing' || normalized === 'basement-refinishing') {
      return 'basement-refinishing';
    }
    if (normalized === 'basement remodel' || normalized === 'basement-remodel') {
      return 'basement-remodel';
    }
    
    // Detect refinishing vs full finish from context
    // "flood" indicates repair work, "finishing" with "repair" is refinishing not new finish
    // Only use basement-remodel for clearly new/unfinished basement conversions
    if (normalized.includes('refinish') || normalized.includes('refresh') || 
        normalized.includes('update') || normalized.includes('repair') ||
        normalized.includes('flood') || normalized.includes('restore') ||
        normalized.includes('cosmetic') || normalized.includes('freshen')) {
      return 'basement-refinishing';
    }
    // Check for full basement finishing indicators
    if (normalized.includes('unfinished') || normalized.includes('convert') ||
        normalized.includes('finish out') || normalized.includes('full finish') ||
        normalized.includes('new basement') || normalized.includes('buildout')) {
      return 'basement-remodel';
    }
    // Default to refinishing for ambiguous "basement" projects
    // Full basement remodels are typically clearly stated as such
    return 'basement-refinishing';
  }
  if (normalized.includes('kitchen')) return 'kitchen-remodel';
  if (normalized.includes('bath')) return 'bathroom-remodel';
  if (normalized.includes('floor') || normalized.includes('hardwood') || normalized.includes('lvp') || normalized.includes('carpet')) return 'flooring';
  if (normalized.includes('paint')) return 'painting';
  
  // Roofing types - check for specific damage/repair types
  if (normalized.includes('roof')) {
    if (normalized.includes('repair') || normalized.includes('patch') || normalized.includes('leak')) {
      return 'roofing-repair';
    }
    if (normalized.includes('storm') || normalized.includes('wind')) {
      return 'roofing-storm';
    }
    if (normalized.includes('hail')) {
      return 'roofing-hail';
    }
    if (normalized.includes('fire')) {
      return 'roofing-fire';
    }
    if (normalized.includes('insurance') || normalized.includes('claim')) {
      return 'roofing-insurance';
    }
    return 'roofing'; // Full roof replacement
  }
  
  // Window/door types - check for specific types
  if (normalized.includes('window')) {
    if (normalized.includes('repair') || normalized.includes('fix') || normalized.includes('restore')) {
      return 'window-repair';
    }
    return 'windows-doors';
  }
  if (normalized.includes('door')) {
    if (normalized.includes('french')) {
      return 'door-french';
    }
    if (normalized.includes('patio') || normalized.includes('sliding')) {
      return 'door-patio';
    }
    if (normalized.includes('interior') || normalized.includes('bedroom') || normalized.includes('closet')) {
      return 'door-interior';
    }
    return 'windows-doors'; // Entry doors, general
  }
  
  if (normalized.includes('electric')) return 'electrical';
  if (normalized.includes('plumb')) return 'plumbing';
  if (normalized.includes('hvac') || normalized.includes('heating') || normalized.includes('air condition')) return 'hvac';
  if (normalized.includes('tile') || normalized.includes('backsplash')) return 'tile';
  if (normalized.includes('drywall') || normalized.includes('sheetrock')) return 'drywall';
  if (normalized.includes('remodel') || normalized.includes('renovation')) return 'full-remodel';
  
  // Linear foot project types
  if (normalized.includes('fence') || normalized.includes('fencing')) return 'fence';
  if (normalized.includes('gutter') || normalized.includes('downspout')) return 'gutter';
  if (normalized.includes('railing') || normalized.includes('handrail') || normalized.includes('banister')) return 'railing';
  if (normalized.includes('retaining wall') || normalized.includes('retaining-wall')) return 'retaining-wall';
  if (normalized.includes('crown') || normalized.includes('crown molding') || normalized.includes('crown-molding')) return 'crown-molding';
  if (normalized.includes('baseboard') || normalized.includes('base board')) return 'baseboards';
  
  return 'general';
}

/**
 * Get human-readable name for a project type
 */
export function getProjectTypeName(projectType: ProjectType): string {
  const names: Record<ProjectType, string> = {
    'kitchen-remodel': 'Kitchen Remodel',
    'bathroom-remodel': 'Bathroom Remodel',
    'basement-remodel': 'Basement Remodel',
    'basement-refinishing': 'Basement Refinishing',
    'countertops': 'Countertop Installation',
    'full-remodel': 'Full Remodel',
    'flooring': 'Flooring Installation',
    'painting': 'Painting',
    'roofing': 'Roofing',
    'roofing-repair': 'Roof Repair',
    'roofing-storm': 'Storm Damage Repair',
    'roofing-hail': 'Hail Damage Repair',
    'roofing-fire': 'Fire Damage Repair',
    'roofing-insurance': 'Insurance Roofing Claim',
    'windows-doors': 'Windows & Doors',
    'window-repair': 'Window Repair',
    'door-interior': 'Interior Door Installation',
    'door-patio': 'Patio Door Installation',
    'door-french': 'French Door Installation',
    'electrical': 'Electrical Work',
    'plumbing': 'Plumbing',
    'hvac': 'HVAC',
    'tile': 'Tile Installation',
    'drywall': 'Drywall',
    'garage-door': 'Garage Door Installation',
    'cabinet-refinishing': 'Cabinet Refinishing',
    'cabinet-refacing': 'Cabinet Refacing',
    'cabinet-replacement': 'Cabinet Replacement',
    'cabinet-new-line': 'New Cabinet Line',
    'fence': 'Fence Installation',
    'gutter': 'Gutter Installation',
    'railing': 'Railing Installation',
    'retaining-wall': 'Retaining Wall',
    'crown-molding': 'Crown Molding',
    'baseboards': 'Baseboard Installation',
    'general': 'General Construction',
  };
  return names[projectType] || 'Construction Project';
}
