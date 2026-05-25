// Price Score Engine
// Compares contractor bid prices to market rates and generates a 0-100 score
// Uses the Mixed Bid Rate Engine for market rate calculations

import {
  calculateMixedRate,
  normalizeProjectType,
  getProjectTypeName,
  type ProjectType,
  type TradeMix,
  type MixedRateResult,
  type LiveBlsRates,
} from './mixedBidRateEngine';
import {
  getZondaProjectCost,
  mapToZondaProjectKey,
  ZONDA_COST_DATA,
} from './zondaCostData';
import {
  crossValidateCosts,
  detectTier,
  isMajorRenovation,
  type CrossSourceResult,
} from './crossSourceValidation';
import {
  LINEAR_FOOT_BENCHMARKS,
} from './benchmarkData';
import { isLinearFootProject } from './projectUnitConfig';
import { 
  type InflationAdjustment,
  applyInflationAdjustment 
} from './fredService';
import {
  detectComplexityMultiplier,
  detectMaterialType,
} from './smartPricingEngine';

// ============================================================================
// TYPES
// ============================================================================

export type PriceDataSource = 'zonda' | 'psf' | 'window' | 'minimum' | 'linear-foot';

export interface ZondaBenchmark {
  low: number;
  median: number;
  high: number;
  source: 'city' | 'region' | 'national';
  sourceName: string;
  citation: string;
  projectKey: string;
}

export type PriceVerdict = 
  | 'Undercutting - Seems Odd'
  | 'Great Deal'
  | 'Fair Price'
  | 'Slightly Above Market'
  | 'Premium Pricing'
  | 'Significantly Above Market';

export type VerdictSentiment = 'warning' | 'positive' | 'neutral' | 'caution' | 'negative';

export interface PriceBreakdown {
  // Input values
  bidTotal: number;
  squareFootage: number;
  projectType: ProjectType;
  projectTypeName: string;
  zipCode: string | null;
  
  // Calculated values
  bidPsf: number;
  marketPsfLow: number;
  marketPsfMedian: number;
  marketPsfHigh: number;
  
  // Comparison
  percentFromMedian: number;     // Positive = above median, negative = below
  percentFromLow: number;
  percentFromHigh: number;
  
  // Position in market range
  marketPosition: 'below-range' | 'low-end' | 'mid-range' | 'high-end' | 'above-range';
  
  // Underlying data (optional for Zonda-first pricing)
  mixedRateBreakdown?: MixedRateResult;
}

export interface PriceScoreResult {
  // Primary outputs
  score: number;              // 0-100
  verdict: PriceVerdict;
  verdictSentiment: VerdictSentiment;
  explanation: string;        // Human-readable explanation
  
  // Price comparison
  bidPsf: number;
  marketPsf: number;          // Median market rate
  percentDiff: number;        // Positive = above market, negative = below
  
  // Trade mix used
  tradeMixUsed: TradeMix;
  
  // Full breakdown
  breakdown: PriceBreakdown;
  
  // Confidence in the score
  confidence: 'high' | 'medium' | 'low';
  confidenceReason: string;
  
  // Data source used for pricing
  dataSource: PriceDataSource;
  dataSourceName?: string;
  zondaCitation?: string;
  
  // Cross-source validation
  crossSourceValidation?: CrossSourceResult;
  detectedTier?: 'minor' | 'midrange' | 'upscale';
  
  // Enhanced lowball detection
  lowballAssessment?: LowballAssessment;
}

// ============================================================================
// MINIMUM PROJECT COSTS - Validated against Zonda Cost vs Value 2025
// ============================================================================

// Projects have minimum costs regardless of square footage due to:
// - Fixed overhead (permits, design, mobilization)
// - Minimum labor hours for setup/teardown
// - Fixed fixture/equipment costs
// Sources: Zonda Cost vs Value 2025, Houzz 2024, RSMeans

interface MinimumProjectCost {
  low: number;
  median: number;
  high: number;
  reason: string;
  source?: 'zonda' | 'houzz' | 'estimated';
}

const MINIMUM_PROJECT_COSTS: Record<string, MinimumProjectCost> = {
  // ============================================================================
  // BATHROOM - Zonda 2025: $21,494 (Birmingham) to $84,165 (Boston upscale)
  // ============================================================================
  'bathroom-remodel': {
    low: 21000,      // Zonda Birmingham midrange
    median: 26000,   // Zonda national midrange: $26,138
    high: 82000,     // Zonda national upscale: $81,612
    reason: 'Zonda 2025: Bathroom remodel midrange national avg $26,138',
    source: 'zonda'
  },
  'bathroom-addition': {
    low: 50000,      // Zonda Birmingham midrange: $50,429
    median: 61000,   // Zonda national midrange: $60,645
    high: 111000,    // Zonda national upscale: $111,255
    reason: 'Zonda 2025: Bathroom addition midrange national avg $60,645',
    source: 'zonda'
  },
  
  // ============================================================================
  // KITCHEN - Zonda 2025: $26,184 (Birmingham minor) to $173,271 (Boston major)
  // ============================================================================
  'kitchen-remodel': {
    low: 26000,      // Zonda Birmingham minor: $26,184
    median: 83000,   // Zonda national major midrange: $82,793
    high: 164000,    // Zonda national major upscale: $164,104
    reason: 'Zonda 2025: Major kitchen midrange national avg $82,793',
    source: 'zonda'
  },
  'kitchen-minor': {
    low: 26000,      // Zonda Birmingham: $26,184
    median: 28500,   // Zonda national: $28,458
    high: 29000,     // Zonda Boston: $28,991
    reason: 'Zonda 2025: Minor kitchen midrange national avg $28,458',
    source: 'zonda'
  },
  
  // ============================================================================
  // BASEMENT - Zonda 2025: $43,505 (Birmingham) to $54,949 (Boston)
  // ============================================================================
  'basement-remodel': {
    low: 43500,      // Zonda Birmingham: $43,505
    median: 52000,   // Zonda national: $52,012
    high: 55000,     // Zonda Boston: $54,949
    reason: 'Zonda 2025: Basement remodel national avg $52,012',
    source: 'zonda'
  },
  
  // ============================================================================
  // ROOFING - Zonda 2025: $26,547 (Birmingham asphalt) to $58,352 (Albuquerque metal)
  // ============================================================================
  'roofing': {
    low: 26500,      // Zonda Birmingham asphalt: $26,547
    median: 32000,   // Zonda national asphalt: $31,871
    high: 52000,     // Zonda national metal: $51,865
    reason: 'Zonda 2025: Asphalt roof national avg $31,871, metal $51,865',
    source: 'zonda'
  },
  'roofing-metal': {
    low: 38000,      // Zonda Birmingham: $37,819
    median: 52000,   // Zonda national: $51,865
    high: 58000,     // Zonda Albuquerque: $58,352
    reason: 'Zonda 2025: Metal roof national avg $51,865',
    source: 'zonda'
  },
  
  // ============================================================================
  // SIDING - Zonda 2025: $13,704 (Birmingham vinyl) to $23,515 (East NC fiber)
  // ============================================================================
  'siding': {
    low: 14000,      // Zonda Birmingham vinyl: $13,704
    median: 18000,   // Zonda national vinyl: $17,950
    high: 21500,     // Zonda national fiber-cement: $21,485
    reason: 'Zonda 2025: Vinyl siding national avg $17,950',
    source: 'zonda'
  },
  'vinyl-siding': {
    low: 14000,      // Zonda Birmingham: $13,704
    median: 18000,   // Zonda national: $17,950
    high: 19500,     // Zonda Albuquerque: $19,262
    reason: 'Zonda 2025: Vinyl siding national avg $17,950',
    source: 'zonda'
  },
  'fiber-cement-siding': {
    low: 16500,      // Zonda Birmingham: $16,366
    median: 21500,   // Zonda national: $21,485
    high: 23500,     // Zonda East North Central: $23,515
    reason: 'Zonda 2025: Fiber-cement siding national avg $21,485',
    source: 'zonda'
  },
  
  // ============================================================================
  // WINDOWS - Zonda 2025: $20,593 (Birmingham vinyl) to $27,311 (Boston wood)
  // ============================================================================
  'windows-doors': {
    low: 20600,      // Zonda Birmingham vinyl: $20,593
    median: 22000,   // Zonda national vinyl: $22,073
    high: 27000,     // Zonda national wood: $26,781
    reason: 'Zonda 2025: Vinyl windows national avg $22,073',
    source: 'zonda'
  },
  
  // ============================================================================
  // DOORS - Zonda 2025: $2,264 (Birmingham steel) to $11,957 (Boston grand)
  // ============================================================================
  'entry-door': {
    low: 2300,       // Zonda Birmingham steel: $2,264
    median: 2450,    // Zonda national steel: $2,435
    high: 12000,     // Zonda national grand entrance: $11,754
    reason: 'Zonda 2025: Steel entry door national avg $2,435',
    source: 'zonda'
  },
  'garage-door': {
    low: 4300,       // Zonda Appleton: $4,287
    median: 4700,    // Zonda national: $4,672
    high: 5200,      // Zonda South Atlantic: $5,126
    reason: 'Zonda 2025: Garage door national avg $4,672',
    source: 'zonda'
  },
  
  // ============================================================================
  // DECKS & PATIOS - Zonda 2025: $14,028 (Birmingham wood) to $53,526 (Boston patio)
  // ============================================================================
  'deck': {
    low: 14000,      // Zonda Birmingham wood: $14,028
    median: 18300,   // Zonda national wood: $18,263
    high: 25000,     // Zonda national composite: $25,096
    reason: 'Zonda 2025: Wood deck national avg $18,263',
    source: 'zonda'
  },
  'deck-composite': {
    low: 22000,      // Zonda Birmingham: $21,923
    median: 25000,   // Zonda national: $25,096
    high: 26500,     // Zonda Mountain: $26,342
    reason: 'Zonda 2025: Composite deck national avg $25,096',
    source: 'zonda'
  },
  'paver-patio': {
    low: 49500,      // Zonda Birmingham: $49,517
    median: 51500,   // Zonda national: $51,454
    high: 53500,     // Zonda Boston: $53,526
    reason: 'Zonda 2025: Backyard patio national avg $51,454',
    source: 'zonda'
  },
  
  // ============================================================================
  // HVAC & ENERGY - Zonda 2025: Various
  // ============================================================================
  'hvac': {
    low: 17000,      // Zonda Birmingham electrification: $17,047
    median: 19500,   // Zonda national electrification: $19,484
    high: 22500,     // Zonda Boston electrification: $22,446
    reason: 'Zonda 2025: HVAC electrification national avg $19,484',
    source: 'zonda'
  },
  'generator': {
    low: 11700,      // Zonda Appleton: $11,662
    median: 13500,   // Zonda national: $13,534
    high: 14500,     // Zonda Boston: $14,548
    reason: 'Zonda 2025: Backup generator national avg $13,534',
    source: 'zonda'
  },
  'solar': {
    low: 48700,      // Zonda Birmingham: $48,660
    median: 56000,   // Zonda national: $55,937
    high: 59400,     // Zonda Boston: $59,366
    reason: 'Zonda 2025: Solar installation national avg $55,937',
    source: 'zonda'
  },
  
  // ============================================================================
  // ADDITIONS - Zonda 2025: Major projects
  // ============================================================================
  'home-addition': {
    low: 138000,     // Zonda Birmingham ADU: $138,415
    median: 166000,  // Zonda national ADU: $166,406
    high: 352000,    // Zonda national primary suite upscale: $351,613
    reason: 'Zonda 2025: ADU national avg $166,406',
    source: 'zonda'
  },
  'primary-suite': {
    low: 143000,     // Zonda Birmingham midrange: $143,015
    median: 170500,  // Zonda national midrange: $170,517
    high: 352000,    // Zonda national upscale: $351,613
    reason: 'Zonda 2025: Primary suite midrange national avg $170,517',
    source: 'zonda'
  },
  'adu': {
    low: 138000,     // Zonda Birmingham: $138,415
    median: 166000,  // Zonda national: $166,406
    high: 176000,    // Zonda Boston: $175,692
    reason: 'Zonda 2025: ADU national avg $166,406',
    source: 'zonda'
  },
  
  // ============================================================================
  // EXTERIOR - Zonda 2025
  // ============================================================================
  'stone-veneer': {
    low: 10800,      // Zonda Appleton: $10,753
    median: 11700,   // Zonda national: $11,702
    high: 13100,     // Zonda Boston: $13,085
    reason: 'Zonda 2025: Stone veneer national avg $11,702',
    source: 'zonda'
  },
  
  // ============================================================================
  // NON-ZONDA PROJECTS - Houzz/RSMeans data
  // ============================================================================
  'electrical': {
    low: 2500,
    median: 4000,
    high: 6000,
    reason: 'Electrical work has minimum permit and service panel costs',
    source: 'houzz'
  },
  'plumbing': {
    low: 3000,
    median: 5000,
    high: 8000,
    reason: 'Plumbing has minimum fixture and water heater costs',
    source: 'houzz'
  },
  'flooring': {
    low: 2000,
    median: 3500,
    high: 5000,
    reason: 'Flooring has minimum subfloor prep and material order costs',
    source: 'houzz'
  },
  'painting': {
    low: 1500,
    median: 2500,
    high: 4000,
    reason: 'Painting has minimum prep, materials, and labor mobilization costs',
    source: 'houzz'
  },
  'water-heater': {
    low: 600,
    median: 1050,
    high: 1500,
    reason: 'Water heater installation minimum costs',
    source: 'houzz'
  },
  'furnace': {
    low: 950,
    median: 1725,
    high: 2500,
    reason: 'Furnace installation minimum costs',
    source: 'houzz'
  },
  'ac-installation': {
    low: 2500,
    median: 4000,
    high: 5500,
    reason: 'AC installation minimum costs',
    source: 'houzz'
  },
  'countertops-granite': {
    low: 1700,
    median: 2050,
    high: 2500,
    reason: 'Granite countertops minimum costs',
    source: 'houzz'
  },
  'countertops-quartz': {
    low: 4500,
    median: 4900,
    high: 5500,
    reason: 'Quartz countertops minimum costs',
    source: 'houzz'
  },
  'countertops': {
    low: 1700,
    median: 3600,
    high: 5500,
    reason: 'Countertop installation minimum costs',
    source: 'houzz'
  },
  'hardwood-floor': {
    low: 12000,
    median: 15000,
    high: 18000,
    reason: 'Hardwood flooring minimum costs',
    source: 'houzz'
  },
  'laminate-floor': {
    low: 7000,
    median: 8500,
    high: 10000,
    reason: 'Laminate flooring minimum costs',
    source: 'houzz'
  },
  'carpet': {
    low: 1200,
    median: 3600,
    high: 6000,
    reason: 'Carpet installation minimum costs',
    source: 'houzz'
  },
  'general-remodel': {
    low: 5000,
    median: 10000,
    high: 20000,
    reason: 'General remodels have minimum overhead costs',
    source: 'estimated'
  },
  
  // ============================================================================
  // BASEMENT REFINISHING - Houzz 2024 (updating existing finished basement)
  // ============================================================================
  'basement-refinishing': {
    low: 12000,
    median: 21000,
    high: 35000,
    reason: 'Basement refinishing (updating existing finish) - Houzz 2024',
    source: 'houzz'
  },
  
  // ============================================================================
  // CABINET WORK - Houzz 2024
  // ============================================================================
  'cabinet-refinishing': {
    low: 1200,
    median: 4600,
    high: 8000,
    reason: 'Cabinet refinishing (repaint/restain) - Houzz 2024',
    source: 'houzz'
  },
  'cabinet-refacing': {
    low: 3500,
    median: 9250,
    high: 15000,
    reason: 'Cabinet refacing (new doors, keep boxes) - Houzz 2024',
    source: 'houzz'
  },
  'cabinet-replacement': {
    low: 4500,
    median: 40000,
    high: 75000,
    reason: 'Full cabinet replacement (builder to luxury) - Houzz 2024',
    source: 'houzz'
  },
  'cabinet-new-line': {
    low: 600,
    median: 3900,
    high: 7200,
    reason: 'New cabinet line addition - Houzz 2024',
    source: 'houzz'
  },
  
  // ============================================================================
  // ROOFING REPAIRS - Houzz 2024 (repairs vs full replacement)
  // ============================================================================
  'roofing-repair': {
    low: 300,
    median: 5150,
    high: 10000,
    reason: 'Roof repair (patching, leak fix, shingle replacement) - Houzz 2024',
    source: 'houzz'
  },
  'roofing-storm': {
    low: 300,
    median: 7650,
    high: 15000,
    reason: 'Storm damage roof repair - Houzz 2024',
    source: 'houzz'
  },
  'roofing-hail': {
    low: 2000,
    median: 13500,
    high: 25000,
    reason: 'Hail damage roof repair - Houzz 2024',
    source: 'houzz'
  },
  'roofing-fire': {
    low: 3000,
    median: 21500,
    high: 40000,
    reason: 'Fire damage roof repair - Houzz 2024',
    source: 'houzz'
  },
  'roofing-insurance': {
    low: 2000,
    median: 15000,
    high: 30000,
    reason: 'Insurance roofing claim (varies by damage type) - Houzz 2024',
    source: 'houzz'
  },
  
  // ============================================================================
  // DOOR INSTALLATIONS - Houzz 2024
  // ============================================================================
  'door-interior': {
    low: 150,
    median: 675,
    high: 1200,
    reason: 'Interior door installation (per door) - Houzz 2024',
    source: 'houzz'
  },
  'door-patio': {
    low: 1200,
    median: 4600,
    high: 8000,
    reason: 'Patio/sliding door installation - Houzz 2024',
    source: 'houzz'
  },
  'door-french': {
    low: 1800,
    median: 5900,
    high: 10000,
    reason: 'French door installation - Houzz 2024',
    source: 'houzz'
  },
  
  // ============================================================================
  // WINDOW REPAIR - Houzz 2024 (repair vs replacement)
  // ============================================================================
  'window-repair': {
    low: 75,
    median: 438,
    high: 800,
    reason: 'Window repair (glass, seal, hardware per window) - Houzz 2024',
    source: 'houzz'
  },
  
  // Default for unknown project types
  'default': {
    low: 2500,
    median: 5000,
    high: 8000,
    reason: 'Projects have minimum overhead, permits, and mobilization costs',
    source: 'estimated'
  }
};

/**
 * Get minimum project costs for a project type
 * Applies FRED inflation adjustment if provided
 */
function getMinimumCosts(projectType: string, inflationFactor?: InflationAdjustment | null): MinimumProjectCost {
  const normalized = projectType.toLowerCase();
  const baseCosts = MINIMUM_PROJECT_COSTS[normalized] || MINIMUM_PROJECT_COSTS['default'];
  
  // Apply inflation adjustment if available
  if (inflationFactor && inflationFactor.factor !== 1.0) {
    return {
      low: applyInflationAdjustment(baseCosts.low, inflationFactor),
      median: applyInflationAdjustment(baseCosts.median, inflationFactor),
      high: applyInflationAdjustment(baseCosts.high, inflationFactor),
      reason: `${baseCosts.reason} (adjusted +${inflationFactor.percentChange.toFixed(1)}% for inflation)`,
      source: baseCosts.source,
    };
  }
  
  return baseCosts;
}

// ============================================================================
// ZONDA BENCHMARK LOOKUP - Primary pricing source
// ============================================================================

/**
 * Extract state code from ZIP (first 3 digits map to state)
 */
function getStateFromZip(zipCode: string): string | null {
  const prefix = zipCode.substring(0, 3);
  const zipToState: Record<string, string> = {
    // Alabama
    '350': 'AL', '351': 'AL', '352': 'AL', '354': 'AL', '355': 'AL', '356': 'AL', '357': 'AL', '358': 'AL', '359': 'AL', '360': 'AL', '361': 'AL', '362': 'AL', '363': 'AL', '364': 'AL', '365': 'AL', '366': 'AL', '367': 'AL', '368': 'AL', '369': 'AL',
    // Arizona
    '850': 'AZ', '851': 'AZ', '852': 'AZ', '853': 'AZ', '855': 'AZ', '856': 'AZ', '857': 'AZ', '859': 'AZ', '860': 'AZ', '863': 'AZ', '864': 'AZ', '865': 'AZ',
    // Colorado
    '800': 'CO', '801': 'CO', '802': 'CO', '803': 'CO', '804': 'CO', '805': 'CO', '806': 'CO', '807': 'CO', '808': 'CO', '809': 'CO', '810': 'CO', '811': 'CO', '812': 'CO', '813': 'CO', '814': 'CO', '815': 'CO', '816': 'CO',
    // Connecticut
    '060': 'CT', '061': 'CT', '062': 'CT', '063': 'CT', '064': 'CT', '065': 'CT', '066': 'CT', '067': 'CT', '068': 'CT', '069': 'CT',
    // DC
    '200': 'DC', '202': 'DC', '203': 'DC', '204': 'DC', '205': 'DC',
    // Delaware
    '197': 'DE', '198': 'DE', '199': 'DE',
    // Florida
    '320': 'FL', '321': 'FL', '322': 'FL', '323': 'FL', '324': 'FL', '325': 'FL', '326': 'FL', '327': 'FL', '328': 'FL', '329': 'FL', '330': 'FL', '331': 'FL', '332': 'FL', '333': 'FL', '334': 'FL', '335': 'FL', '336': 'FL', '337': 'FL', '338': 'FL', '339': 'FL', '340': 'FL', '341': 'FL', '342': 'FL', '344': 'FL', '346': 'FL', '347': 'FL', '349': 'FL',
    // Georgia
    '300': 'GA', '301': 'GA', '302': 'GA', '303': 'GA', '304': 'GA', '305': 'GA', '306': 'GA', '307': 'GA', '308': 'GA', '309': 'GA', '310': 'GA', '311': 'GA', '312': 'GA', '313': 'GA', '314': 'GA', '315': 'GA', '316': 'GA', '317': 'GA', '318': 'GA', '319': 'GA',
    // Idaho
    '832': 'ID', '833': 'ID', '834': 'ID', '835': 'ID', '836': 'ID', '837': 'ID', '838': 'ID',
    // Illinois
    '600': 'IL', '601': 'IL', '602': 'IL', '603': 'IL', '604': 'IL', '605': 'IL', '606': 'IL', '607': 'IL', '608': 'IL', '609': 'IL', '610': 'IL', '611': 'IL', '612': 'IL', '613': 'IL', '614': 'IL', '615': 'IL', '616': 'IL', '617': 'IL', '618': 'IL', '619': 'IL', '620': 'IL', '622': 'IL', '623': 'IL', '624': 'IL', '625': 'IL', '626': 'IL', '627': 'IL', '628': 'IL', '629': 'IL',
    // Indiana
    '460': 'IN', '461': 'IN', '462': 'IN', '463': 'IN', '464': 'IN', '465': 'IN', '466': 'IN', '467': 'IN', '468': 'IN', '469': 'IN', '470': 'IN', '471': 'IN', '472': 'IN', '473': 'IN', '474': 'IN', '475': 'IN', '476': 'IN', '477': 'IN', '478': 'IN', '479': 'IN',
    // Kentucky
    '400': 'KY', '401': 'KY', '402': 'KY', '403': 'KY', '404': 'KY', '405': 'KY', '406': 'KY', '407': 'KY', '408': 'KY', '409': 'KY', '410': 'KY', '411': 'KY', '412': 'KY', '413': 'KY', '414': 'KY', '415': 'KY', '416': 'KY', '417': 'KY', '418': 'KY',
    // Massachusetts
    '010': 'MA', '011': 'MA', '012': 'MA', '013': 'MA', '014': 'MA', '015': 'MA', '016': 'MA', '017': 'MA', '018': 'MA', '019': 'MA', '020': 'MA', '021': 'MA', '022': 'MA', '023': 'MA', '024': 'MA', '025': 'MA', '026': 'MA', '027': 'MA',
    // Maryland
    '206': 'MD', '207': 'MD', '208': 'MD', '209': 'MD', '210': 'MD', '211': 'MD', '212': 'MD', '214': 'MD', '215': 'MD', '216': 'MD', '217': 'MD', '218': 'MD', '219': 'MD',
    // Maine
    '039': 'ME', '040': 'ME', '041': 'ME', '042': 'ME', '043': 'ME', '044': 'ME', '045': 'ME', '046': 'ME', '047': 'ME', '048': 'ME', '049': 'ME',
    // Michigan
    '480': 'MI', '481': 'MI', '482': 'MI', '483': 'MI', '484': 'MI', '485': 'MI', '486': 'MI', '487': 'MI', '488': 'MI', '489': 'MI', '490': 'MI', '491': 'MI', '492': 'MI', '493': 'MI', '494': 'MI', '495': 'MI', '496': 'MI', '497': 'MI', '498': 'MI', '499': 'MI',
    // Mississippi
    '386': 'MS', '387': 'MS', '388': 'MS', '389': 'MS', '390': 'MS', '391': 'MS', '392': 'MS', '393': 'MS', '394': 'MS', '395': 'MS', '396': 'MS', '397': 'MS',
    // Montana
    '590': 'MT', '591': 'MT', '592': 'MT', '593': 'MT', '594': 'MT', '595': 'MT', '596': 'MT', '597': 'MT', '598': 'MT', '599': 'MT',
    // North Carolina
    '270': 'NC', '271': 'NC', '272': 'NC', '273': 'NC', '274': 'NC', '275': 'NC', '276': 'NC', '277': 'NC', '278': 'NC', '279': 'NC', '280': 'NC', '281': 'NC', '282': 'NC', '283': 'NC', '284': 'NC', '285': 'NC', '286': 'NC', '287': 'NC', '288': 'NC', '289': 'NC',
    // New Hampshire
    '030': 'NH', '031': 'NH', '032': 'NH', '033': 'NH', '034': 'NH', '035': 'NH', '036': 'NH', '037': 'NH', '038': 'NH',
    // New Mexico
    '870': 'NM', '871': 'NM', '872': 'NM', '873': 'NM', '874': 'NM', '875': 'NM', '877': 'NM', '878': 'NM', '879': 'NM', '880': 'NM', '881': 'NM', '882': 'NM', '883': 'NM', '884': 'NM',
    // Nevada
    '889': 'NV', '890': 'NV', '891': 'NV', '893': 'NV', '894': 'NV', '895': 'NV', '897': 'NV', '898': 'NV',
    // Ohio
    '430': 'OH', '431': 'OH', '432': 'OH', '433': 'OH', '434': 'OH', '435': 'OH', '436': 'OH', '437': 'OH', '438': 'OH', '439': 'OH', '440': 'OH', '441': 'OH', '442': 'OH', '443': 'OH', '444': 'OH', '445': 'OH', '446': 'OH', '447': 'OH', '448': 'OH', '449': 'OH', '450': 'OH', '451': 'OH', '452': 'OH', '453': 'OH', '454': 'OH', '455': 'OH', '456': 'OH', '457': 'OH', '458': 'OH',
    // Rhode Island
    '028': 'RI', '029': 'RI',
    // South Carolina
    '290': 'SC', '291': 'SC', '292': 'SC', '293': 'SC', '294': 'SC', '295': 'SC', '296': 'SC', '297': 'SC', '298': 'SC', '299': 'SC',
    // Tennessee
    '370': 'TN', '371': 'TN', '372': 'TN', '373': 'TN', '374': 'TN', '376': 'TN', '377': 'TN', '378': 'TN', '379': 'TN', '380': 'TN', '381': 'TN', '382': 'TN', '383': 'TN', '384': 'TN', '385': 'TN',
    // Utah
    '840': 'UT', '841': 'UT', '842': 'UT', '843': 'UT', '844': 'UT', '845': 'UT', '846': 'UT', '847': 'UT',
    // Virginia
    '220': 'VA', '221': 'VA', '222': 'VA', '223': 'VA', '224': 'VA', '225': 'VA', '226': 'VA', '227': 'VA', '228': 'VA', '229': 'VA', '230': 'VA', '231': 'VA', '232': 'VA', '233': 'VA', '234': 'VA', '235': 'VA', '236': 'VA', '237': 'VA', '238': 'VA', '239': 'VA', '240': 'VA', '241': 'VA', '243': 'VA', '244': 'VA', '245': 'VA', '246': 'VA',
    // Vermont
    '050': 'VT', '051': 'VT', '052': 'VT', '053': 'VT', '054': 'VT', '056': 'VT', '057': 'VT', '058': 'VT', '059': 'VT',
    // West Virginia
    '247': 'WV', '248': 'WV', '249': 'WV', '250': 'WV', '251': 'WV', '252': 'WV', '253': 'WV', '254': 'WV', '255': 'WV', '256': 'WV', '257': 'WV', '258': 'WV', '259': 'WV', '260': 'WV', '261': 'WV', '262': 'WV', '263': 'WV', '264': 'WV', '265': 'WV', '266': 'WV', '267': 'WV', '268': 'WV',
    // Wisconsin
    '530': 'WI', '531': 'WI', '532': 'WI', '534': 'WI', '535': 'WI', '537': 'WI', '538': 'WI', '539': 'WI', '540': 'WI', '541': 'WI', '542': 'WI', '543': 'WI', '544': 'WI', '545': 'WI', '546': 'WI', '547': 'WI', '548': 'WI', '549': 'WI',
    // Wyoming
    '820': 'WY', '821': 'WY', '822': 'WY', '823': 'WY', '824': 'WY', '825': 'WY', '826': 'WY', '827': 'WY', '828': 'WY', '829': 'WY', '830': 'WY', '831': 'WY',
  };
  return zipToState[prefix] || null;
}

/**
 * Get Zonda-based benchmark prices for a project type
 * Returns null if no Zonda data available for this project type
 * 
 * This is the PRIMARY pricing source - provides validated real-world costs
 * from the Zonda Cost vs Value 2025 report
 * 
 * Applies FRED inflation adjustment if provided
 */
export function getZondaBenchmark(
  projectType: string,
  stateCode?: string,
  zipCode?: string,
  inflationFactor?: InflationAdjustment | null
): ZondaBenchmark | null {
  // Map internal project type to Zonda key
  const zondaKey = mapToZondaProjectKey(projectType);
  if (!zondaKey) return null;
  
  // Check if we have Zonda data for this project
  const projectData = ZONDA_COST_DATA[zondaKey];
  if (!projectData) return null;
  
  // Determine state from ZIP if not provided
  const state = stateCode || (zipCode ? getStateFromZip(zipCode) : null);
  
  // Get cost with regional adjustment
  const costData = getZondaProjectCost(zondaKey, state || undefined);
  if (!costData) return null;
  
  // Calculate low/median/high bands
  // Use Zonda's regional variance: Birmingham is typically lowest (~0.85x), Boston highest (~1.06x)
  // For regional data, create bands around the regional cost
  // National baseline: Low = Birmingham factor, High = Boston factor
  const nationalCost = projectData.nationalCost;
  const birminghamMultiplier = projectData.cities['birmingham-al']?.multiplier || 0.85;
  const bostonMultiplier = projectData.cities['boston-ma']?.multiplier || 1.06;
  
  let low: number, median: number, high: number;
  
  if (costData.source === 'city') {
    // For city-specific data, create ±10% band around the city cost
    median = costData.cost;
    low = median * 0.90;
    high = median * 1.10;
  } else if (costData.source === 'region') {
    // For regional data, use regional cost as median
    median = costData.cost;
    // Scale low/high based on regional position
    const regionMultiplier = costData.multiplier;
    if (regionMultiplier < 1.0) {
      // Below-average region: low is tighter, high has more room
      low = median * 0.92;
      high = median * 1.15;
    } else {
      // Above-average region: high is tighter, low has more room
      low = median * 0.85;
      high = median * 1.08;
    }
  } else {
    // National data: use Birmingham/Boston as low/high
    median = nationalCost;
    low = nationalCost * birminghamMultiplier;
    high = nationalCost * bostonMultiplier;
  }
  
  // Apply inflation adjustment if provided
  if (inflationFactor && inflationFactor.factor !== 1.0) {
    low = applyInflationAdjustment(low, inflationFactor);
    median = applyInflationAdjustment(median, inflationFactor);
    high = applyInflationAdjustment(high, inflationFactor);
  }
  
  return {
    low: Math.round(low),
    median: Math.round(median),
    high: Math.round(high),
    source: costData.source,
    sourceName: costData.sourceName,
    citation: inflationFactor && inflationFactor.factor !== 1.0 
      ? `${costData.citation} (adjusted +${inflationFactor.percentChange.toFixed(1)}% for inflation)`
      : costData.citation,
    projectKey: zondaKey,
  };
}

// ============================================================================
// SCORING THRESHOLDS
// ============================================================================

// Scoring logic based on percent difference from median market rate
// percentDiff: positive = above market, negative = below market
const SCORE_THRESHOLDS = {
  // Suspiciously low (> 30% below) - possible quality/scope issues
  UNDERCUT: { maxPercent: -30, score: 50, verdict: 'Undercutting - Seems Odd' as PriceVerdict },
  
  // Great deal (10-30% below) - competitive pricing
  GREAT_DEAL: { maxPercent: -10, score: 100, verdict: 'Great Deal' as PriceVerdict },
  
  // Fair price (within ±10%) - market rate
  FAIR: { maxPercent: 10, score: 85, verdict: 'Fair Price' as PriceVerdict },
  
  // Slightly above (10-25% above) - premium but reasonable
  SLIGHTLY_ABOVE: { maxPercent: 25, score: 70, verdict: 'Slightly Above Market' as PriceVerdict },
  
  // Premium (25-50% above) - high pricing
  PREMIUM: { maxPercent: 50, score: 50, verdict: 'Premium Pricing' as PriceVerdict },
  
  // Significantly above (> 50% above) - very high pricing
  VERY_HIGH: { maxPercent: Infinity, score: 30, verdict: 'Significantly Above Market' as PriceVerdict },
};

// ============================================================================
// ENHANCED LOWBALL DETECTION - Project-specific thresholds
// ============================================================================

// Critical exterior and safety trades have stricter thresholds
// because lowball pricing often means material shortcuts or unqualified labor
interface LowballConfig {
  threshold: number;  // Percent below market to trigger (e.g., 0.70 = 70% of market = 30% below)
  penalty: number;    // Score penalty to apply
  reason: string;     // Why this trade is risky when underpriced
}

const LOWBALL_CONFIG: Record<string, LowballConfig> = {
  // Critical exterior - material shortcuts are dangerous
  'roofing': { threshold: 0.70, penalty: -35, reason: 'Critical exterior - material shortcuts lead to leaks and storm damage' },
  'siding': { threshold: 0.70, penalty: -35, reason: 'Critical exterior - cheap materials mean water damage and rot' },
  
  // Safety-critical - fire, water, or health hazards
  'electrical': { threshold: 0.65, penalty: -30, reason: 'Safety-critical - fire hazard from substandard wiring' },
  'plumbing': { threshold: 0.65, penalty: -30, reason: 'Safety-critical - water damage and mold risk' },
  'hvac': { threshold: 0.65, penalty: -30, reason: 'Safety-critical - carbon monoxide and efficiency concerns' },
  
  // Exterior envelope - affects home protection
  'windows-doors': { threshold: 0.70, penalty: -25, reason: 'Exterior envelope - poor installation causes drafts and water intrusion' },
  
  // Default for other project types
  'default': { threshold: 0.60, penalty: -25, reason: 'Quality concerns - unusually low pricing often means corners cut' }
};

/**
 * Get the lowball config for a project type
 */
export function getLowballConfig(projectType: string): LowballConfig {
  const normalized = projectType.toLowerCase();
  return LOWBALL_CONFIG[normalized] || LOWBALL_CONFIG['default'];
}

/**
 * Check if a bid is dangerously low for its project type
 * Returns a lowball assessment with specific risk context
 */
export interface LowballAssessment {
  isLowball: boolean;
  thresholdUsed: number;
  bidRatio: number;  // bid / market (e.g., 0.65 = 35% below market)
  penalty: number;
  reason: string;
  projectType: string;
}

export function assessLowball(
  bidPsf: number, 
  marketPsf: number, 
  projectType: string
): LowballAssessment {
  const config = getLowballConfig(projectType);
  const bidRatio = bidPsf / marketPsf;
  
  const isLowball = bidRatio <= config.threshold;
  
  return {
    isLowball,
    thresholdUsed: config.threshold,
    bidRatio,
    penalty: isLowball ? config.penalty : 0,
    reason: isLowball ? config.reason : '',
    projectType
  };
}

// ============================================================================
// MAIN SCORING FUNCTION
// ============================================================================

export interface PriceScoreInput {
  bidTotal: number;
  squareFootage?: number;     // Required for most projects, optional for per-unit projects
  projectType: string;
  zipCode?: string;
  customTradeMix?: TradeMix;
  liveRates?: LiveBlsRates;   // Optional live BLS rates (for premium users)
  windowCount?: number;       // For window projects - uses per-unit pricing instead of PSF
  linearFeet?: number;        // For fence/gutter/railing projects - uses per-LF pricing
  inflationFactor?: InflationAdjustment | null;  // FRED-based inflation adjustment for benchmarks
  bidText?: string;           // Raw bid text for smart material/complexity detection
}

// Window per-unit pricing benchmarks (matching tradeBenchmarks.ts)
const WINDOW_UNIT_PRICING = {
  low: 450,      // Budget vinyl/basic windows
  median: 750,   // Standard vinyl/fiberglass installed
  high: 1200,    // Premium wood/specialty windows
};

/**
 * Calculate a price score comparing a bid to market rates
 * 
 * PRICING HIERARCHY (Zonda-first):
 * 1. Zonda Cost vs Value 2025 data (primary source for projects with coverage)
 * 2. PSF-based calculation with BLS wages (fallback for trades/projects without Zonda)
 * 
 * Zonda provides validated real-world project costs from completed jobs,
 * which is more accurate than theoretical PSF calculations.
 */
export function calculatePriceScore(input: PriceScoreInput): PriceScoreResult {
  const { bidTotal, squareFootage, zipCode, customTradeMix, liveRates, windowCount, linearFeet, inflationFactor } = input;
  
  // Validate inputs
  if (!bidTotal || bidTotal <= 0) {
    return createErrorResult('Invalid bid total', input);
  }
  
  // Check if this is a window project (uses per-unit pricing)
  const normalizedType = normalizeProjectType(input.projectType);
  const isWindowProject = normalizedType === 'windows-doors' && windowCount && windowCount > 0;
  
  // For window projects, use per-unit pricing
  if (isWindowProject) {
    return calculateWindowPriceScore(input, windowCount);
  }
  
  // Check if this is a linear foot project (fence, gutter, railing, etc.)
  // Uses centralized helper from projectUnitConfig
  const isLinearFootProj = isLinearFootProject(normalizedType) && linearFeet && linearFeet > 0;
  
  // For linear foot projects, use per-LF pricing
  if (isLinearFootProj) {
    return calculateLinearFootPriceScore(input, linearFeet);
  }
  
  // Normalize project type
  const projectType = normalizeProjectType(input.projectType);
  const projectTypeName = getProjectTypeName(projectType);
  
  // Derive state from ZIP code
  const stateCode = zipCode ? getStateFromZip(zipCode) : null;
  
  // ========================================================================
  // HOUZZ-PRIMARY PRICING with Zonda validation
  // Zonda is only used as PRIMARY for major renovations (>$50k + major keywords)
  // For everything else, Houzz/PSF is primary with Zonda as secondary validation
  // ========================================================================
  const zondaBenchmark = getZondaBenchmark(projectType, stateCode || undefined, zipCode, inflationFactor);
  const majorRenovation = isMajorRenovation(bidTotal, projectType);
  
  if (zondaBenchmark && majorRenovation) {
    // Use Zonda data as primary pricing source ONLY for major renovations
    // These are projects >$50k with keywords like kitchen/bathroom/basement major remodel
    return calculateZondaPriceScore(input, zondaBenchmark, projectType, projectTypeName);
  }
  
  // For non-major projects, Zonda benchmark (if available) will be included
  // through crossSourceValidation for comparison purposes
  
  // ========================================================================
  // FALLBACK: PSF-based calculation for projects without Zonda coverage
  // ========================================================================
  
  // For PSF-based projects, require square footage
  if (!squareFootage || squareFootage <= 0) {
    return createErrorResult('Invalid square footage', input);
  }
  
  // Detect complexity factors from bid text (vaulted ceilings, high walls, etc.)
  const complexityResult = detectComplexityMultiplier(projectType, '');
  const complexityMultiplier = complexityResult?.multiplier || 1.0;
  
  // Calculate bid's $/SF
  const bidPsf = bidTotal / squareFootage;
  
  // Get market rates (with live BLS rates if provided)
  const mixedRateResult = calculateMixedRate(projectType, zipCode, customTradeMix, liveRates);
  
  // Apply minimum project costs for small spaces
  // PSF-based calculations can give unrealistically low totals for small projects
  const minimums = getMinimumCosts(projectType, inflationFactor);
  const rawMarketLow = mixedRateResult.marketPsfLow * squareFootage;
  const rawMarketMedian = mixedRateResult.marketPsfMedian * squareFootage;
  const rawMarketHigh = mixedRateResult.marketPsfHigh * squareFootage;
  
  // If raw PSF-based estimates are below minimums, use minimums instead
  const adjustedMarketLow = Math.max(rawMarketLow, minimums.low) * complexityMultiplier;
  const adjustedMarketMedian = Math.max(rawMarketMedian, minimums.median) * complexityMultiplier;
  const adjustedMarketHigh = Math.max(rawMarketHigh, minimums.high) * complexityMultiplier;
  
  // Convert back to PSF for consistent display (adjusted for minimums)
  const adjustedPsfLow = adjustedMarketLow / squareFootage;
  const adjustedPsfMedian = adjustedMarketMedian / squareFootage;
  const adjustedPsfHigh = adjustedMarketHigh / squareFootage;
  
  // Determine data source
  const dataSource: PriceDataSource = 
    adjustedMarketMedian > rawMarketMedian ? 'minimum' : 'psf';
  
  // Use adjusted values for comparison
  const marketPsf = adjustedPsfMedian;
  const percentDiff = ((bidPsf - marketPsf) / marketPsf) * 100;
  
  // Calculate percent from low and high (using adjusted values)
  const percentFromLow = ((bidPsf - adjustedPsfLow) / adjustedPsfLow) * 100;
  const percentFromHigh = ((bidPsf - adjustedPsfHigh) / adjustedPsfHigh) * 100;
  
  // Determine market position (using adjusted values)
  let marketPosition: PriceBreakdown['marketPosition'];
  if (bidPsf < adjustedPsfLow) {
    marketPosition = 'below-range';
  } else if (bidPsf <= adjustedPsfLow + (adjustedPsfMedian - adjustedPsfLow) * 0.5) {
    marketPosition = 'low-end';
  } else if (bidPsf <= adjustedPsfMedian + (adjustedPsfHigh - adjustedPsfMedian) * 0.5) {
    marketPosition = 'mid-range';
  } else if (bidPsf <= adjustedPsfHigh) {
    marketPosition = 'high-end';
  } else {
    marketPosition = 'above-range';
  }
  
  // Calculate base score and verdict
  let { score, verdict, sentiment } = calculateScoreAndVerdict(percentDiff);
  
  // Apply enhanced lowball detection for safety-critical trades (using adjusted market PSF)
  const lowballAssessment = assessLowball(bidPsf, adjustedPsfMedian, projectType);
  if (lowballAssessment.isLowball) {
    // Apply trade-specific penalty (more severe for roofing, electrical, etc.)
    score = Math.max(0, score + lowballAssessment.penalty);
    // Override verdict to warning if not already
    if (sentiment !== 'warning') {
      verdict = 'Undercutting - Seems Odd';
      sentiment = 'warning';
    }
  }
  
  // Generate explanation (with lowball context if applicable)
  let explanation = generateExplanation(verdict, percentDiff, bidPsf, marketPsf, projectTypeName);
  if (lowballAssessment.isLowball) {
    explanation += ` Warning: ${lowballAssessment.reason}.`;
  }
  
  // Determine confidence
  const { confidence, confidenceReason } = calculateConfidence(mixedRateResult, squareFootage);
  
  // Build breakdown (using adjusted PSF values that account for minimums)
  const breakdown: PriceBreakdown = {
    bidTotal,
    squareFootage,
    projectType,
    projectTypeName,
    zipCode: zipCode || null,
    bidPsf: round(bidPsf),
    marketPsfLow: round(adjustedPsfLow),
    marketPsfMedian: round(adjustedPsfMedian),
    marketPsfHigh: round(adjustedPsfHigh),
    percentFromMedian: round(percentDiff),
    percentFromLow: round(percentFromLow),
    percentFromHigh: round(percentFromHigh),
    marketPosition,
    mixedRateBreakdown: mixedRateResult,
  };
  
  // Extract trade mix used
  const tradeMixUsed: TradeMix = {};
  for (const trade of mixedRateResult.tradeBreakdown) {
    tradeMixUsed[trade.trade] = trade.weight;
  }
  
  return {
    score,
    verdict,
    verdictSentiment: sentiment,
    explanation,
    bidPsf: round(bidPsf),
    marketPsf: round(marketPsf),
    percentDiff: round(percentDiff),
    tradeMixUsed,
    breakdown,
    confidence,
    confidenceReason,
    dataSource,
    dataSourceName: dataSource === 'minimum' ? 'Minimum Project Cost' : 'BLS/PSF Calculation',
    lowballAssessment,
  };
}

// ============================================================================
// ZONDA-BASED PRICE SCORING (Primary source)
// ============================================================================

/**
 * Calculate price score using Zonda Cost vs Value 2025 data
 * This is the preferred method when Zonda coverage exists for the project type
 */
function calculateZondaPriceScore(
  input: PriceScoreInput,
  zondaBenchmark: ZondaBenchmark,
  projectType: string,
  projectTypeName: string
): PriceScoreResult {
  const { bidTotal, squareFootage, zipCode } = input;
  
  // Compare bid total directly to Zonda total project cost benchmarks
  const percentDiff = ((bidTotal - zondaBenchmark.median) / zondaBenchmark.median) * 100;
  const percentFromLow = ((bidTotal - zondaBenchmark.low) / zondaBenchmark.low) * 100;
  const percentFromHigh = ((bidTotal - zondaBenchmark.high) / zondaBenchmark.high) * 100;
  
  // Determine market position
  let marketPosition: PriceBreakdown['marketPosition'];
  if (bidTotal < zondaBenchmark.low) {
    marketPosition = 'below-range';
  } else if (bidTotal <= zondaBenchmark.low + (zondaBenchmark.median - zondaBenchmark.low) * 0.5) {
    marketPosition = 'low-end';
  } else if (bidTotal <= zondaBenchmark.median + (zondaBenchmark.high - zondaBenchmark.median) * 0.5) {
    marketPosition = 'mid-range';
  } else if (bidTotal <= zondaBenchmark.high) {
    marketPosition = 'high-end';
  } else {
    marketPosition = 'above-range';
  }
  
  // Calculate base score and verdict
  let { score, verdict, sentiment } = calculateScoreAndVerdict(percentDiff);
  
  // Apply lowball detection using Zonda median as market rate
  // Convert to PSF equivalent for lowball assessment if we have SF
  const bidPsf = squareFootage && squareFootage > 0 ? bidTotal / squareFootage : 0;
  const marketPsf = squareFootage && squareFootage > 0 ? zondaBenchmark.median / squareFootage : 0;
  
  let lowballAssessment: LowballAssessment | undefined;
  if (marketPsf > 0) {
    lowballAssessment = assessLowball(bidPsf, marketPsf, projectType);
    if (lowballAssessment.isLowball) {
      score = Math.max(0, score + lowballAssessment.penalty);
      if (sentiment !== 'warning') {
        verdict = 'Undercutting - Seems Odd';
        sentiment = 'warning';
      }
    }
  }
  
  // Generate explanation
  let explanation = generateExplanation(verdict, percentDiff, bidTotal, zondaBenchmark.median, projectTypeName);
  if (lowballAssessment?.isLowball) {
    explanation += ` Warning: ${lowballAssessment.reason}.`;
  }
  
  // Cross-source validation (now includes BLS estimate when square footage available)
  const crossSource = crossValidateCosts(projectType, bidTotal, zipCode?.substring(0, 2), squareFootage, input.customTradeMix);
  const detectedTier = detectTier(projectType, bidTotal);
  
  // Use cross-source confidence if higher
  const zondaConfidence: 'high' | 'medium' | 'low' = 
    zondaBenchmark.source === 'city' ? 'high' : 
    zondaBenchmark.source === 'region' ? 'high' : 'medium';
  
  // Boost confidence if sources agree
  const confidence = crossSource.sourcesAgree ? 'high' : zondaConfidence;
  const confidenceReason = crossSource.sourcesAgree 
    ? `${crossSource.confidenceDescription}. ${zondaBenchmark.sourceName}`
    : `Based on ${zondaBenchmark.sourceName} from Zonda Cost vs Value 2025`;
  
  // Calculate PSF values for display (if we have square footage)
  const displayPsfLow = squareFootage && squareFootage > 0 ? round(zondaBenchmark.low / squareFootage) : 0;
  const displayPsfMedian = squareFootage && squareFootage > 0 ? round(zondaBenchmark.median / squareFootage) : 0;
  const displayPsfHigh = squareFootage && squareFootage > 0 ? round(zondaBenchmark.high / squareFootage) : 0;
  
  // Build breakdown
  const breakdown: PriceBreakdown = {
    bidTotal,
    squareFootage: squareFootage || 0,
    projectType: projectType as ProjectType,
    projectTypeName,
    zipCode: zipCode || null,
    bidPsf: round(bidPsf),
    marketPsfLow: displayPsfLow,
    marketPsfMedian: displayPsfMedian,
    marketPsfHigh: displayPsfHigh,
    percentFromMedian: round(percentDiff),
    percentFromLow: round(percentFromLow),
    percentFromHigh: round(percentFromHigh),
    marketPosition,
  };
  
  return {
    score,
    verdict,
    verdictSentiment: sentiment,
    explanation,
    bidPsf: round(bidPsf),
    marketPsf: round(marketPsf),
    percentDiff: round(percentDiff),
    tradeMixUsed: {},
    breakdown,
    confidence,
    confidenceReason,
    dataSource: 'zonda',
    dataSourceName: zondaBenchmark.sourceName,
    zondaCitation: zondaBenchmark.citation,
    crossSourceValidation: crossSource,
    detectedTier,
    lowballAssessment,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateScoreAndVerdict(percentDiff: number): { 
  score: number; 
  verdict: PriceVerdict; 
  sentiment: VerdictSentiment;
} {
  // Check thresholds in order
  if (percentDiff <= SCORE_THRESHOLDS.UNDERCUT.maxPercent) {
    return { 
      score: SCORE_THRESHOLDS.UNDERCUT.score, 
      verdict: SCORE_THRESHOLDS.UNDERCUT.verdict,
      sentiment: 'warning',
    };
  }
  if (percentDiff <= SCORE_THRESHOLDS.GREAT_DEAL.maxPercent) {
    return { 
      score: SCORE_THRESHOLDS.GREAT_DEAL.score, 
      verdict: SCORE_THRESHOLDS.GREAT_DEAL.verdict,
      sentiment: 'positive',
    };
  }
  if (percentDiff <= SCORE_THRESHOLDS.FAIR.maxPercent) {
    return { 
      score: SCORE_THRESHOLDS.FAIR.score, 
      verdict: SCORE_THRESHOLDS.FAIR.verdict,
      sentiment: 'neutral',
    };
  }
  if (percentDiff <= SCORE_THRESHOLDS.SLIGHTLY_ABOVE.maxPercent) {
    return { 
      score: SCORE_THRESHOLDS.SLIGHTLY_ABOVE.score, 
      verdict: SCORE_THRESHOLDS.SLIGHTLY_ABOVE.verdict,
      sentiment: 'caution',
    };
  }
  if (percentDiff <= SCORE_THRESHOLDS.PREMIUM.maxPercent) {
    return { 
      score: SCORE_THRESHOLDS.PREMIUM.score, 
      verdict: SCORE_THRESHOLDS.PREMIUM.verdict,
      sentiment: 'negative',
    };
  }
  
  return { 
    score: SCORE_THRESHOLDS.VERY_HIGH.score, 
    verdict: SCORE_THRESHOLDS.VERY_HIGH.verdict,
    sentiment: 'negative',
  };
}

function generateExplanation(
  verdict: PriceVerdict,
  percentDiff: number,
  bidPsf: number,
  marketPsf: number,
  projectTypeName: string
): string {
  const absDiff = Math.abs(percentDiff);
  const direction = percentDiff >= 0 ? 'above' : 'below';
  
  switch (verdict) {
    case 'Undercutting - Seems Odd':
      return `This bid is ${absDiff.toFixed(0)}% below typical market rates for ${projectTypeName.toLowerCase()}. ` +
        `At $${bidPsf.toFixed(2)}/sf vs. the market median of $${marketPsf.toFixed(2)}/sf, this pricing is unusually low. ` +
        `Consider asking about scope exclusions or material quality.`;
    
    case 'Great Deal':
      return `This bid is ${absDiff.toFixed(0)}% below market rates — a competitive price for ${projectTypeName.toLowerCase()}. ` +
        `At $${bidPsf.toFixed(2)}/sf compared to the market median of $${marketPsf.toFixed(2)}/sf, ` +
        `you're getting good value.`;
    
    case 'Fair Price':
      return `This bid is within ${absDiff.toFixed(0)}% of market rates for ${projectTypeName.toLowerCase()}. ` +
        `At $${bidPsf.toFixed(2)}/sf, this aligns with typical pricing in your area.`;
    
    case 'Slightly Above Market':
      return `This bid is ${absDiff.toFixed(0)}% above typical market rates. ` +
        `At $${bidPsf.toFixed(2)}/sf vs. $${marketPsf.toFixed(2)}/sf, the premium may reflect ` +
        `contractor reputation, included warranties, or higher-end materials.`;
    
    case 'Premium Pricing':
      return `This bid is ${absDiff.toFixed(0)}% above market rates at $${bidPsf.toFixed(2)}/sf. ` +
        `Consider getting additional quotes or asking what justifies the premium.`;
    
    case 'Significantly Above Market':
      return `This bid is ${absDiff.toFixed(0)}% above typical market rates — significantly higher than average. ` +
        `At $${bidPsf.toFixed(2)}/sf vs. $${marketPsf.toFixed(2)}/sf market median, ` +
        `strongly recommend getting competitive quotes.`;
    
    default:
      return `Bid is ${absDiff.toFixed(0)}% ${direction} market median of $${marketPsf.toFixed(2)}/sf.`;
  }
}

function calculateConfidence(
  mixedRateResult: MixedRateResult,
  squareFootage: number
): { confidence: 'high' | 'medium' | 'low'; confidenceReason: string } {
  // Confidence factors:
  // - Data source (MSA > state > national)
  // - Square footage (reasonable range vs. extreme)
  // - Trade data completeness
  
  const reasons: string[] = [];
  let confidenceScore = 100;
  
  // Data source quality
  if (mixedRateResult.dataSource === 'live' || mixedRateResult.usedLiveRates) {
    reasons.push('Live BLS wage data (most current)');
    confidenceScore += 5; // Bonus for live data
  } else if (mixedRateResult.dataSource === 'msa') {
    reasons.push('Local metro area wage data available');
  } else if (mixedRateResult.dataSource === 'state') {
    reasons.push('State-level wage data used');
    confidenceScore -= 10;
  } else if (mixedRateResult.dataSource === 'national') {
    reasons.push('National average wage data used (no local data)');
    confidenceScore -= 20;
  } else {
    reasons.push('Mixed data sources');
    confidenceScore -= 15;
  }
  
  // Square footage reasonableness
  if (squareFootage < 50) {
    reasons.push('Very small project area may skew PSF calculations');
    confidenceScore -= 20;
  } else if (squareFootage < 100) {
    reasons.push('Small project area');
    confidenceScore -= 10;
  } else if (squareFootage > 5000) {
    reasons.push('Large project may have volume discounts');
    confidenceScore -= 10;
  }
  
  // Trade data completeness
  const tradeCount = mixedRateResult.tradeBreakdown.length;
  if (tradeCount < 2) {
    reasons.push('Limited trade data for this project type');
    confidenceScore -= 15;
  }
  
  // Determine confidence level
  let confidence: 'high' | 'medium' | 'low';
  if (confidenceScore >= 80) {
    confidence = 'high';
  } else if (confidenceScore >= 60) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }
  
  return {
    confidence,
    confidenceReason: reasons.join('. '),
  };
}

function createErrorResult(error: string, input: PriceScoreInput): PriceScoreResult {
  const projectType = normalizeProjectType(input.projectType || 'general');
  
  return {
    score: 0,
    verdict: 'Fair Price',
    verdictSentiment: 'neutral',
    explanation: `Unable to calculate price score: ${error}`,
    bidPsf: 0,
    marketPsf: 0,
    percentDiff: 0,
    tradeMixUsed: {},
    breakdown: {
      bidTotal: input.bidTotal || 0,
      squareFootage: input.squareFootage || 0,
      projectType,
      projectTypeName: getProjectTypeName(projectType),
      zipCode: input.zipCode || null,
      bidPsf: 0,
      marketPsfLow: 0,
      marketPsfMedian: 0,
      marketPsfHigh: 0,
      percentFromMedian: 0,
      percentFromLow: 0,
      percentFromHigh: 0,
      marketPosition: 'mid-range',
      mixedRateBreakdown: calculateMixedRate(projectType),
    },
    confidence: 'low',
    confidenceReason: error,
    dataSource: 'psf',
  };
}

function round(value: number, decimals: number = 2): number {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Calculate price score for window projects using per-unit pricing
 */
function calculateWindowPriceScore(input: PriceScoreInput, windowCount: number): PriceScoreResult {
  const { bidTotal, zipCode } = input;
  const projectType = normalizeProjectType(input.projectType);
  const projectTypeName = getProjectTypeName(projectType);
  
  // Calculate per-unit price
  const bidPerUnit = bidTotal / windowCount;
  const marketLow = WINDOW_UNIT_PRICING.low;
  const marketMedian = WINDOW_UNIT_PRICING.median;
  const marketHigh = WINDOW_UNIT_PRICING.high;
  
  // Calculate percent difference from median
  const percentDiff = ((bidPerUnit - marketMedian) / marketMedian) * 100;
  const percentFromLow = ((bidPerUnit - marketLow) / marketLow) * 100;
  const percentFromHigh = ((bidPerUnit - marketHigh) / marketHigh) * 100;
  
  // Determine market position
  let marketPosition: PriceBreakdown['marketPosition'];
  if (bidPerUnit < marketLow) {
    marketPosition = 'below-range';
  } else if (bidPerUnit <= marketLow + (marketMedian - marketLow) * 0.5) {
    marketPosition = 'low-end';
  } else if (bidPerUnit <= marketMedian + (marketHigh - marketMedian) * 0.5) {
    marketPosition = 'mid-range';
  } else if (bidPerUnit <= marketHigh) {
    marketPosition = 'high-end';
  } else {
    marketPosition = 'above-range';
  }
  
  // Calculate score and verdict
  let { score, verdict, sentiment } = calculateScoreAndVerdict(percentDiff);
  
  // Apply lowball detection for windows
  const lowballAssessment = assessLowball(bidPerUnit, marketMedian, projectType);
  if (lowballAssessment.isLowball) {
    score = Math.max(0, score + lowballAssessment.penalty);
    if (sentiment !== 'warning') {
      verdict = 'Undercutting - Seems Odd';
      sentiment = 'warning';
    }
  }
  
  // Generate explanation for per-unit pricing
  let explanation = generateWindowExplanation(verdict, percentDiff, bidPerUnit, marketMedian, windowCount);
  if (lowballAssessment.isLowball) {
    explanation += ` Warning: ${lowballAssessment.reason}.`;
  }
  
  // Create breakdown with per-unit values (displayed as PSF for UI compatibility)
  const breakdown: PriceBreakdown = {
    bidTotal,
    squareFootage: windowCount, // Use windowCount for display purposes
    projectType,
    projectTypeName,
    zipCode: zipCode || null,
    bidPsf: round(bidPerUnit),       // Per-unit price
    marketPsfLow: marketLow,
    marketPsfMedian: marketMedian,
    marketPsfHigh: marketHigh,
    percentFromMedian: round(percentDiff),
    percentFromLow: round(percentFromLow),
    percentFromHigh: round(percentFromHigh),
    marketPosition,
    mixedRateBreakdown: {
      marketPsfLow: marketLow,
      marketPsfMedian: marketMedian,
      marketPsfHigh: marketHigh,
      weightedHourlyWage: 45,
      burdenedHourlyRate: 56.25,
      billedHourlyRate: 92.81,
      effectiveRate: 185.63,
      tradeBreakdown: [{
        trade: 'carpenter' as const,
        weight: 1.0,
        rawWage: 45,
        contribution: 45,
        source: 'national' as const,
      }],
      projectType: 'windows-doors' as const,
      zipCode: input.zipCode || null,
      dataSource: 'national' as const,
      laborHoursPerSf: 0,
      usedLiveRates: false,
    },
  };
  
  return {
    score,
    verdict,
    verdictSentiment: sentiment,
    explanation,
    bidPsf: round(bidPerUnit),
    marketPsf: round(marketMedian),
    percentDiff: round(percentDiff),
    tradeMixUsed: { 'windows-doors': 1.0 },
    breakdown,
    confidence: 'high',
    confidenceReason: `Window pricing based on ${windowCount} units`,
    dataSource: 'window',
    dataSourceName: 'Per-Unit Window Pricing',
    lowballAssessment,
  };
}

/**
 * Generate explanation for window per-unit pricing
 */
function generateWindowExplanation(
  verdict: PriceVerdict,
  percentDiff: number,
  bidPerUnit: number,
  marketPerUnit: number,
  windowCount: number
): string {
  const absDiff = Math.abs(percentDiff);
  
  switch (verdict) {
    case 'Undercutting - Seems Odd':
      return `At $${bidPerUnit.toFixed(0)}/window for ${windowCount} windows, this bid is ${absDiff.toFixed(0)}% below typical installed pricing ($${marketPerUnit}/window). ` +
        `Consider asking about window quality, warranty, and installation standards.`;
    
    case 'Great Deal':
      return `At $${bidPerUnit.toFixed(0)}/window for ${windowCount} windows, this is ${absDiff.toFixed(0)}% below market — competitive pricing. ` +
        `Market median is $${marketPerUnit}/window installed.`;
    
    case 'Fair Price':
      return `At $${bidPerUnit.toFixed(0)}/window for ${windowCount} windows, this is within ${absDiff.toFixed(0)}% of typical pricing ($${marketPerUnit}/window installed).`;
    
    case 'Slightly Above Market':
      return `At $${bidPerUnit.toFixed(0)}/window for ${windowCount} windows, this is ${absDiff.toFixed(0)}% above typical pricing. ` +
        `May reflect premium windows or enhanced installation.`;
    
    case 'Premium Pricing':
      return `At $${bidPerUnit.toFixed(0)}/window, this is ${absDiff.toFixed(0)}% above market. ` +
        `Ensure the quote specifies premium window features justifying the price.`;
    
    case 'Significantly Above Market':
      return `At $${bidPerUnit.toFixed(0)}/window, this is ${absDiff.toFixed(0)}% above typical installed pricing. ` +
        `Strongly recommend getting competitive quotes.`;
    
    default:
      return `Bid is $${bidPerUnit.toFixed(0)}/window for ${windowCount} windows.`;
  }
}

// ============================================================================
// LINEAR FOOT PRICING (fence, gutter, railing, retaining wall)
// ============================================================================

/**
 * Calculate price score for linear foot projects (fence, gutter, railing, etc.)
 */
function calculateLinearFootPriceScore(input: PriceScoreInput, linearFeet: number): PriceScoreResult {
  const { bidTotal, zipCode, bidText } = input;
  const projectType = normalizeProjectType(input.projectType);
  const projectTypeName = getProjectTypeName(projectType);
  
  // Map project type to benchmark key
  const benchmarkKey = projectType.replace('-repair', '').replace('retaining-wall', 'retainingWall');
  
  let marketLow: number, marketMedian: number, marketHigh: number;
  let materialType: string | null = null;
  
  // Try smart material detection if we have bid text
  if (bidText) {
    const detected = detectMaterialType(projectType, bidText);
    if (detected.confidence !== 'low') {
      materialType = detected.material;
    }
  }
  
  // Fall back to old benchmarks
  const benchmarkCategory = LINEAR_FOOT_BENCHMARKS[benchmarkKey];
  if (!benchmarkCategory) {
    return createErrorResult(`No linear foot benchmarks for project type: ${projectType}`, input);
  }
    
  // Use detected material benchmarks if available, otherwise use 'general'
  const materialKey = materialType && benchmarkCategory[materialType] ? materialType : 'general';
  const benchmarks = benchmarkCategory[materialKey] || Object.values(benchmarkCategory)[0];
  if (!benchmarks) {
    return createErrorResult(`No benchmarks found for: ${projectType}`, input);
  }
  
  marketLow = benchmarks.low;
  marketMedian = benchmarks.median;
  marketHigh = benchmarks.high;
  
  // Calculate per-LF price
  const bidPerLF = bidTotal / linearFeet;
  
  // Calculate percent difference from median
  const percentDiff = ((bidPerLF - marketMedian) / marketMedian) * 100;
  const percentFromLow = ((bidPerLF - marketLow) / marketLow) * 100;
  const percentFromHigh = ((bidPerLF - marketHigh) / marketHigh) * 100;
  
  // Determine market position
  let marketPosition: PriceBreakdown['marketPosition'];
  if (bidPerLF < marketLow) {
    marketPosition = 'below-range';
  } else if (bidPerLF <= marketLow + (marketMedian - marketLow) * 0.5) {
    marketPosition = 'low-end';
  } else if (bidPerLF <= marketMedian + (marketHigh - marketMedian) * 0.5) {
    marketPosition = 'mid-range';
  } else if (bidPerLF <= marketHigh) {
    marketPosition = 'high-end';
  } else {
    marketPosition = 'above-range';
  }
  
  // Calculate score and verdict
  let { score, verdict, sentiment } = calculateScoreAndVerdict(percentDiff);
  
  // Apply lowball detection
  const lowballAssessment = assessLowball(bidPerLF, marketMedian, projectType);
  if (lowballAssessment.isLowball) {
    score = Math.max(0, score + lowballAssessment.penalty);
    if (sentiment !== 'warning') {
      verdict = 'Undercutting - Seems Odd';
      sentiment = 'warning';
    }
  }
  
  // Generate explanation
  const unitLabel = getLinearFootUnitLabel(projectType);
  let explanation = generateLinearFootExplanation(verdict, percentDiff, bidPerLF, marketMedian, linearFeet, unitLabel, materialType);
  if (lowballAssessment.isLowball) {
    explanation += ` Warning: ${lowballAssessment.reason}.`;
  }
  
  // Create breakdown
  const breakdown: PriceBreakdown = {
    bidTotal,
    squareFootage: linearFeet, // Use linearFeet for display purposes
    projectType,
    projectTypeName,
    zipCode: zipCode || null,
    bidPsf: round(bidPerLF),       // Per-LF price
    marketPsfLow: marketLow,
    marketPsfMedian: marketMedian,
    marketPsfHigh: marketHigh,
    percentFromMedian: round(percentDiff),
    percentFromLow: round(percentFromLow),
    percentFromHigh: round(percentFromHigh),
    marketPosition,
    mixedRateBreakdown: {
      marketPsfLow: marketLow,
      marketPsfMedian: marketMedian,
      marketPsfHigh: marketHigh,
      weightedHourlyWage: 35,
      burdenedHourlyRate: 43.75,
      billedHourlyRate: 72.19,
      effectiveRate: 144.38,
      tradeBreakdown: [{
        trade: 'carpenter' as const,
        weight: 1.0,
        rawWage: 35,
        contribution: 35,
        source: 'national' as const,
      }],
      projectType: projectType as ProjectType,
      zipCode: input.zipCode || null,
      dataSource: 'national' as const,
      laborHoursPerSf: 0,
      usedLiveRates: false,
    },
  };
  
  return {
    score,
    verdict,
    verdictSentiment: sentiment,
    explanation,
    bidPsf: round(bidPerLF),
    marketPsf: round(marketMedian),
    percentDiff: round(percentDiff),
    tradeMixUsed: { [projectType]: 1.0 },
    breakdown,
    confidence: 'high',
    confidenceReason: `${projectTypeName} pricing based on ${linearFeet} linear feet`,
    dataSource: 'linear-foot',
    dataSourceName: 'Per-Linear-Foot Pricing',
    lowballAssessment,
  };
}

/**
 * Get unit label for linear foot project type
 */
function getLinearFootUnitLabel(projectType: string): string {
  switch (projectType) {
    case 'fence':
    case 'fence-repair':
      return 'fence';
    case 'gutter':
    case 'gutter-repair':
      return 'gutter';
    case 'railing':
      return 'railing';
    case 'retaining-wall':
      return 'retaining wall';
    default:
      return 'linear feet';
  }
}

/**
 * Generate explanation for linear foot per-LF pricing
 */
function generateLinearFootExplanation(
  verdict: PriceVerdict,
  percentDiff: number,
  bidPerLF: number,
  marketPerLF: number,
  linearFeet: number,
  unitLabel: string,
  material: string | null
): string {
  const absDiff = Math.abs(percentDiff);
  const materialNote = material ? ` (${material})` : '';
  
  switch (verdict) {
    case 'Undercutting - Seems Odd':
      return `At $${bidPerLF.toFixed(0)}/LF for ${linearFeet} LF of ${unitLabel}${materialNote}, this bid is ${absDiff.toFixed(0)}% below typical installed pricing ($${marketPerLF}/LF). ` +
        `Consider asking about materials, post depth, and warranty.`;
    
    case 'Great Deal':
      return `At $${bidPerLF.toFixed(0)}/LF for ${linearFeet} LF of ${unitLabel}${materialNote}, this is ${absDiff.toFixed(0)}% below market — competitive pricing. ` +
        `Market median is $${marketPerLF}/LF installed.`;
    
    case 'Fair Price':
      return `At $${bidPerLF.toFixed(0)}/LF for ${linearFeet} LF of ${unitLabel}${materialNote}, this is within ${absDiff.toFixed(0)}% of typical pricing ($${marketPerLF}/LF installed).`;
    
    case 'Slightly Above Market':
      return `At $${bidPerLF.toFixed(0)}/LF for ${linearFeet} LF of ${unitLabel}${materialNote}, this is ${absDiff.toFixed(0)}% above typical pricing. ` +
        `May reflect premium materials or difficult terrain.`;
    
    case 'Premium Pricing':
      return `At $${bidPerLF.toFixed(0)}/LF, this is ${absDiff.toFixed(0)}% above market. ` +
        `Ensure the quote specifies premium materials or features justifying the price.`;
    
    case 'Significantly Above Market':
      return `At $${bidPerLF.toFixed(0)}/LF, this is ${absDiff.toFixed(0)}% above typical installed pricing. ` +
        `Strongly recommend getting competitive quotes.`;
    
    default:
      return `Bid is $${bidPerLF.toFixed(0)}/LF for ${linearFeet} linear feet of ${unitLabel}.`;
  }
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

/**
 * Get color class for verdict sentiment
 */
export function getVerdictColor(sentiment: VerdictSentiment): string {
  switch (sentiment) {
    case 'positive': return 'text-emerald-600';
    case 'neutral': return 'text-blue-600';
    case 'caution': return 'text-amber-600';
    case 'warning': return 'text-orange-600';
    case 'negative': return 'text-red-600';
    default: return 'text-gray-600';
  }
}

/**
 * Get background color class for verdict sentiment
 */
export function getVerdictBgColor(sentiment: VerdictSentiment): string {
  switch (sentiment) {
    case 'positive': return 'bg-emerald-50 border-emerald-200';
    case 'neutral': return 'bg-blue-50 border-blue-200';
    case 'caution': return 'bg-amber-50 border-amber-200';
    case 'warning': return 'bg-orange-50 border-orange-200';
    case 'negative': return 'bg-red-50 border-red-200';
    default: return 'bg-gray-50 border-gray-200';
  }
}

/**
 * Format percent difference for display
 */
export function formatPercentDiff(percentDiff: number): string {
  const absDiff = Math.abs(percentDiff);
  if (percentDiff >= 0) {
    return `+${absDiff.toFixed(0)}% above market`;
  } else {
    return `${absDiff.toFixed(0)}% below market`;
  }
}
