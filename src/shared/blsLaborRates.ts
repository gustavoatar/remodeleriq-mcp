/**
 * BLS Labor Rates Module
 * 
 * Integrates with Bureau of Labor Statistics v2 API to fetch
 * real wage data for the Atlanta-Sandy Springs-Roswell, GA MSA.
 * 
 * Area Code: 0012060 (Atlanta-Sandy Springs-Roswell, GA MSA)
 * Data Type: 03 = Mean Hourly Wage
 */

// Atlanta-Sandy Springs-Roswell, GA MSA Area Code
export const ATLANTA_MSA_AREA_CODE = '0012060';

// Trade Types with BLS SOC codes and series IDs
export type TradeType = 'carpenter' | 'electrician' | 'plumber' | 'painter' | 'roofer' | 'hvac_technician' | 'drywall_installer' | 'general_laborer' | 'landscaper' | 'tile_setter' | 'floor_installer';

export interface TradeMapping {
  trade: TradeType;
  displayName: string;
  socCode: string;
  blsSeriesId: string;
  keywords: RegExp[];
  description: string;
}

/**
 * Trade Mapping Library
 * Maps contract keywords to BLS occupational codes
 * 
 * BLS Series ID Format: OEUM{AreaCode}{IndustryCode}{OccupationCode}{DataType}
 * - OEUM = Occupational Employment and Wage
 * - AreaCode = 0012060 (Atlanta MSA)
 * - IndustryCode = 000000 (All industries)
 * - OccupationCode = SOC code without hyphen
 * - DataType = 03 (Mean Hourly Wage)
 */
export const TRADE_MAPPINGS: TradeMapping[] = [
  {
    trade: 'carpenter',
    displayName: 'Carpenters',
    socCode: '47-2031',
    blsSeriesId: 'OEUM001206000000047203103',
    keywords: [
      /fram(e|ing)/i,
      /deck\s*(build|construct|install)?/i,
      /trim\s*(work|install|carpent)?/i,
      /cabinet\s*(install|build)?/i,
      /wood\s*(work|frame|floor)?/i,
      /carpent(er|ry)/i,
      /stair(s|case)?/i,
      /door\s*(install|frame|hang)/i,
      /window\s*(install|frame)/i,
      /molding/i,
      /baseboard/i,
      /crown\s*molding/i,
      /hardwood\s*floor/i,
      /subfloor/i,
      /joist/i,
      /stud/i,
      /sheathing/i,
    ],
    description: 'Framing, decks, trim work, cabinetry',
  },
  {
    trade: 'electrician',
    displayName: 'Electricians',
    socCode: '47-2111',
    blsSeriesId: 'OEUM001206000000047211103',
    keywords: [
      /electric(al|ian)?/i,
      /wir(e|ing)/i,
      /panel\s*(upgrade|install|replace)?/i,
      /circuit\s*(breaker)?/i,
      /outlet/i,
      /switch(es)?/i,
      /light(ing|s)?\s*(install|fixture)?/i,
      /recessed\s*light/i,
      /can\s*light/i,
      /ceiling\s*fan/i,
      /gfci/i,
      /amp\s*(service|panel)/i,
      /200\s*amp/i,
      /100\s*amp/i,
      /conduit/i,
      /romex/i,
      /junction\s*box/i,
      /load\s*center/i,
    ],
    description: 'Wiring, panels, lighting installations',
  },
  {
    trade: 'plumber',
    displayName: 'Plumbers',
    socCode: '47-2152',
    blsSeriesId: 'OEUM001206000000047215203',
    keywords: [
      /plumb(er|ing)?/i,
      /pipe(s|ing)?/i,
      /sink\s*(install|replace)?/i,
      /faucet/i,
      /toilet\s*(install|replace)?/i,
      /water\s*heater/i,
      /drain/i,
      /sewer/i,
      /supply\s*line/i,
      /shut[\s-]?off\s*valve/i,
      /p[\s-]?trap/i,
      /garbage\s*disposal/i,
      /dishwasher\s*(install|connect)/i,
      /washing\s*machine\s*(hook|connect)/i,
      /shower\s*(valve|install|pan)/i,
      /tub\s*(install|replace)/i,
      /bathtub/i,
      /water\s*supply/i,
      /copper\s*pipe/i,
      /pex/i,
      /re-?pipe/i,
    ],
    description: 'Pipes, fixtures, water heater installations',
  },
  {
    trade: 'painter',
    displayName: 'Painters',
    socCode: '47-2141',
    blsSeriesId: 'OEUM001206000000047214103',
    keywords: [
      /paint(er|ing)?/i,
      /interior\s*paint/i,
      /exterior\s*paint/i,
      /wall\s*paint/i,
      /ceiling\s*paint/i,
      /primer/i,
      /stain(ing)?/i,
      /finish(ing)?.*wood/i,
      /lacquer/i,
      /varnish/i,
      /drywall\s*(finish|texture)/i,
      /texture\s*(wall|ceiling)/i,
      /spackle/i,
      /caulk(ing)?/i,
      /coat(s)?\s*(of\s*)?paint/i,
      /sherwin/i,
      /benjamin\s*moore/i,
      /behr/i,
    ],
    description: 'Interior/exterior painting, finishing',
  },
  {
    trade: 'roofer',
    displayName: 'Roofers',
    socCode: '47-2181',
    blsSeriesId: 'OEUM001206000000047218103',
    keywords: [
      /roof(ing|er)?/i,
      /shingle(s)?/i,
      /re[\s-]?roof/i,
      /asphalt\s*shingle/i,
      /architectural\s*shingle/i,
      /3[\s-]?tab/i,
      /metal\s*roof/i,
      /standing\s*seam/i,
      /tile\s*roof/i,
      /slate\s*roof/i,
      /flat\s*roof/i,
      /tpo/i,
      /epdm/i,
      /modified\s*bitumen/i,
      /built[\s-]?up\s*roof/i,
      /roof\s*(deck|decking)/i,
      /underlayment/i,
      /felt\s*paper/i,
      /ice\s*(and\s*)?water\s*shield/i,
      /drip\s*edge/i,
      /flashing/i,
      /ridge\s*(cap|vent)/i,
      /soffit/i,
      /fascia/i,
      /gutter(s)?/i,
      /downspout/i,
      /ventilation.*roof/i,
      /roof\s*vent/i,
      /boot(s)?\s*(pipe|vent)/i,
      /tear[\s-]?off/i,
      /roof\s*replacement/i,
      /roof\s*repair/i,
      /roof\s*install/i,
      /square(s)?\s*(of\s*)?(shingles?|roofing)/i,
    ],
    description: 'Roofing installation, repair, and replacement',
  },
  {
    trade: 'hvac_technician',
    displayName: 'HVAC Technicians',
    socCode: '49-9021',
    blsSeriesId: 'OEUM001206000000049902103',
    keywords: [
      /hvac/i,
      /air\s*condition(er|ing)?/i,
      /a\/?c\s*(unit|system|install|replace)/i,
      /furnace/i,
      /heat(ing)?\s*(pump|system)?/i,
      /central\s*(air|heat)/i,
      /ductwork/i,
      /duct(s)?\s*(install|replace|clean)/i,
      /mini[\s-]?split/i,
      /condensing\s*unit/i,
      /condenser/i,
      /evaporator/i,
      /air\s*handler/i,
      /thermostat/i,
      /refrigerant/i,
      /freon/i,
      /tonnage/i,
      /\d+\s*ton\s*(unit|system|a\/?c)/i,
      /seer/i,
      /btuh?/i,
      /blower/i,
      /compressor/i,
      /heat\s*exchanger/i,
      /zone\s*(system|control)/i,
    ],
    description: 'Heating, ventilation, and air conditioning',
  },
  {
    trade: 'drywall_installer',
    displayName: 'Drywall Installers',
    socCode: '47-2081',
    blsSeriesId: 'OEUM001206000000047208103',
    keywords: [
      /drywall/i,
      /sheetrock/i,
      /gypsum/i,
      /wallboard/i,
      /hang(ing)?\s*(drywall|sheetrock)/i,
      /tape\s*(and\s*)?mud/i,
      /joint\s*compound/i,
      /mud(ding)?/i,
      /skim\s*coat/i,
      /texture/i,
      /orange\s*peel/i,
      /knockdown/i,
      /popcorn\s*ceiling/i,
      /ceiling\s*texture/i,
    ],
    description: 'Drywall hanging, taping, and finishing',
  },
  {
    trade: 'general_laborer',
    displayName: 'General Laborers',
    socCode: '47-2061',
    blsSeriesId: 'OEUM001206000000047206103',
    keywords: [
      /general\s*labor/i,
      /helper/i,
      /cleanup/i,
      /debris\s*removal/i,
      /demolition/i,
      /demo/i,
      /haul(ing)?/i,
      /load(ing)?/i,
      /unload(ing)?/i,
      /site\s*prep/i,
      /preparation/i,
      /clear(ing)?/i,
    ],
    description: 'General construction labor and cleanup',
  },
  {
    trade: 'landscaper',
    displayName: 'Landscapers',
    socCode: '37-3011',
    blsSeriesId: 'OEUM001206000000037301103',
    keywords: [
      /landscap(e|ing|er)/i,
      /lawn/i,
      /sod/i,
      /mulch/i,
      /plant(ing)?/i,
      /shrub/i,
      /tree\s*(plant|install|remove)/i,
      /irrigation/i,
      /sprinkler/i,
      /drainage/i,
      /grading/i,
      /retaining\s*wall/i,
      /paver/i,
      /patio/i,
      /hardscape/i,
      /garden/i,
      /flower\s*bed/i,
      /edging/i,
    ],
    description: 'Landscaping and groundskeeping',
  },
  {
    trade: 'tile_setter',
    displayName: 'Tile Setters',
    socCode: '47-2044',
    blsSeriesId: 'OEUM001206000000047204403',
    keywords: [
      /tile\s*(set|install|lay)/i,
      /ceramic\s*tile/i,
      /porcelain\s*tile/i,
      /floor\s*tile/i,
      /wall\s*tile/i,
      /backsplash/i,
      /grout/i,
      /thinset/i,
      /mortar/i,
      /subway\s*tile/i,
      /mosaic/i,
      /marble\s*(tile|floor|install)/i,
      /travertine/i,
      /slate\s*(tile|floor)/i,
      /shower\s*tile/i,
    ],
    description: 'Tile and marble setting',
  },
  {
    trade: 'floor_installer',
    displayName: 'Floor Installers',
    socCode: '47-2042',
    blsSeriesId: 'OEUM001206000000047204203',
    keywords: [
      /floor(ing)?\s*(install|replace|lay)/i,
      /flooring/i,
      /laminate\s*(floor|plank)?/i,
      /vinyl\s*(plank|floor|tile)?/i,
      /lvp/i,
      /lvt/i,
      /luxury\s*vinyl/i,
      /hardwood\s*(floor|install|refinish)?/i,
      /engineered\s*(wood|hardwood|floor)/i,
      /wood\s*floor/i,
      /plank\s*floor/i,
      /floor\s*covering/i,
      /underlayment/i,
      /subfloor/i,
      /floor\s*(prep|level|sand)/i,
      /transition\s*strip/i,
      /quarter\s*round/i,
      /floor\s*molding/i,
      /sq\s*ft.*floor/i,
      /square\s*feet.*floor/i,
      /pergo/i,
      /shaw\s*floor/i,
      /mohawk\s*floor/i,
      /lifeproof/i,
      /coretec/i,
    ],
    description: 'Flooring installation (laminate, vinyl, hardwood)',
  },
];

/**
 * BLS API Response Types
 */
export interface BLSDataPoint {
  year: string;
  period: string;
  periodName: string;
  value: string;
  footnotes: Array<{ code: string; text: string }>;
}

export interface BLSSeriesResult {
  seriesID: string;
  data: BLSDataPoint[];
}

export interface BLSAPIResponse {
  status: string;
  responseTime: number;
  message: string[];
  Results: {
    series: BLSSeriesResult[];
  };
}

/**
 * Labor Rate Analysis Result
 */
export interface LaborRateAudit {
  trade: TradeType;
  tradeName: string;
  blsMeanWage: number;
  fairRate: number; // BLS wage × 2.8 multiplier
  bidEffectiveRate: number | null;
  bidLaborCost: number | null;
  bidHours: number | null;
  status: 'fair' | 'negotiation-point' | 'quality-warning' | 'unknown';
  percentDifference: number | null;
  insight: string;
  dataSource: 'bls-api' | 'fallback';
  lastUpdated: string;
}

/**
 * Contractor Multiplier Breakdown
 * Total: 2.8x
 * - Base Wage: 1.0x
 * - Labor Burden (taxes, insurance, benefits): 0.5x (50%)
 * - Overhead (office, trucks, tools, admin): 0.6x (60% of base, ~21% of total)
 * - Profit Margin: 0.7x (~25% markup on costs)
 */
export const CONTRACTOR_MULTIPLIER = 2.8;

/**
 * Fallback wage data for Atlanta MSA (2024 estimates)
 * Used when BLS API is unavailable
 */
export const FALLBACK_WAGES: Record<TradeType, number> = {
  carpenter: 24.50,
  electrician: 28.75,
  plumber: 29.50,
  painter: 21.25,
  roofer: 22.00,
  hvac_technician: 27.50,
  drywall_installer: 23.75,
  general_laborer: 18.50,
  landscaper: 19.25,
  tile_setter: 25.00,
  floor_installer: 23.00,
};

/**
 * State-level wage multipliers relative to national average
 * These adjust the fallback wages based on regional cost of living
 * Source: BLS regional wage data and cost of living indices (2024)
 */
export const STATE_WAGE_MULTIPLIERS: Record<string, number> = {
  // High cost states (1.15+)
  CA: 1.35, // California - highest construction wages
  NY: 1.30, // New York
  MA: 1.28, // Massachusetts
  WA: 1.25, // Washington
  CT: 1.22, // Connecticut
  NJ: 1.20, // New Jersey
  AK: 1.20, // Alaska
  HI: 1.18, // Hawaii
  MD: 1.15, // Maryland
  CO: 1.12, // Colorado
  
  // Above average states (1.05-1.14)
  OR: 1.10, // Oregon
  MN: 1.08, // Minnesota
  IL: 1.07, // Illinois
  NH: 1.06, // New Hampshire
  VT: 1.05, // Vermont
  RI: 1.05, // Rhode Island
  DC: 1.30, // Washington DC
  
  // Average states (0.95-1.04)
  PA: 1.02, // Pennsylvania
  VA: 1.00, // Virginia
  AZ: 1.00, // Arizona
  NV: 1.02, // Nevada
  UT: 0.98, // Utah
  MI: 0.97, // Michigan
  OH: 0.95, // Ohio
  WI: 0.96, // Wisconsin
  
  // Below average states (0.85-0.94)
  GA: 0.92, // Georgia (our baseline reference)
  NC: 0.92, // North Carolina
  FL: 0.94, // Florida
  TX: 0.93, // Texas
  TN: 0.90, // Tennessee
  SC: 0.90, // South Carolina
  IN: 0.92, // Indiana
  MO: 0.91, // Missouri
  KY: 0.88, // Kentucky
  
  // Lower cost states (< 0.85)
  AL: 0.85, // Alabama
  LA: 0.87, // Louisiana
  AR: 0.82, // Arkansas
  MS: 0.80, // Mississippi
  WV: 0.82, // West Virginia
  OK: 0.85, // Oklahoma
  KS: 0.86, // Kansas
  NE: 0.88, // Nebraska
  IA: 0.89, // Iowa
  ND: 0.92, // North Dakota
  SD: 0.87, // South Dakota
  MT: 0.88, // Montana
  WY: 0.90, // Wyoming
  ID: 0.90, // Idaho
  NM: 0.86, // New Mexico
  ME: 0.92, // Maine
  DE: 1.02, // Delaware
};

/**
 * Get state-adjusted wages based on state code
 * Applies regional multiplier to the fallback wages
 */
export function getStateAdjustedWages(stateCode: string): Record<TradeType, number> {
  const multiplier = STATE_WAGE_MULTIPLIERS[stateCode.toUpperCase()] ?? 1.0;
  
  const adjustedWages: Record<TradeType, number> = {} as Record<TradeType, number>;
  for (const [trade, wage] of Object.entries(FALLBACK_WAGES)) {
    adjustedWages[trade as TradeType] = Math.round(wage * multiplier * 100) / 100;
  }
  
  return adjustedWages;
}

/**
 * Get state name from code for display
 */
export function getStateName(stateCode: string): string {
  const stateNames: Record<string, string> = {
    AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
    CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'Washington DC', FL: 'Florida',
    GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana',
    IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine',
    MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi',
    MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire',
    NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota',
    OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island',
    SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah',
    VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming'
  };
  return stateNames[stateCode.toUpperCase()] ?? stateCode;
}

/**
 * Trade display names for UI
 */
export const TRADE_NAMES: Record<TradeType, string> = {
  carpenter: 'Carpenters',
  electrician: 'Electricians',
  plumber: 'Plumbers',
  painter: 'Painters',
  roofer: 'Roofers',
  hvac_technician: 'HVAC Technicians',
  drywall_installer: 'Drywall Installers',
  general_laborer: 'General Laborers',
  landscaper: 'Landscapers',
  tile_setter: 'Tile Setters',
  floor_installer: 'Floor Installers',
};

/**
 * Detect trades from bid text
 * Returns all trades detected with their match strength
 */
export function detectTrades(bidText: string): Array<{ trade: TradeMapping; matchCount: number }> {
  const results: Array<{ trade: TradeMapping; matchCount: number }> = [];
  
  for (const mapping of TRADE_MAPPINGS) {
    let matchCount = 0;
    for (const keyword of mapping.keywords) {
      const matches = bidText.match(new RegExp(keyword, 'gi'));
      if (matches) {
        matchCount += matches.length;
      }
    }
    if (matchCount > 0) {
      results.push({ trade: mapping, matchCount });
    }
  }
  
  // Sort by match count (most matches first)
  return results.sort((a, b) => b.matchCount - a.matchCount);
}

/**
 * Detect the primary trade from bid text
 * Returns the trade with the most keyword matches
 */
export function detectPrimaryTrade(bidText: string): TradeMapping | null {
  const trades = detectTrades(bidText);
  return trades.length > 0 ? trades[0].trade : null;
}

/**
 * Extract labor cost from bid text
 * Looks for patterns like "Labor: $X,XXX" or "Labor Cost: $X,XXX"
 */
export function extractLaborCost(bidText: string): number | null {
  const patterns = [
    /labor\s*(?:cost|charge|fee)?[:\s]*\$?\s*([\d,]+(?:\.\d{2})?)/i,
    /(?:total\s+)?labor[:\s]*\$?\s*([\d,]+(?:\.\d{2})?)/i,
    /labor\s+(?:and|&)\s+installation[:\s]*\$?\s*([\d,]+(?:\.\d{2})?)/i,
    /installation\s*(?:cost|charge|labor)?[:\s]*\$?\s*([\d,]+(?:\.\d{2})?)/i,
    /workmanship[:\s]*\$?\s*([\d,]+(?:\.\d{2})?)/i,
  ];
  
  for (const pattern of patterns) {
    const match = bidText.match(pattern);
    if (match) {
      const value = parseFloat(match[1].replace(/,/g, ''));
      if (value >= 100) { // Reasonable minimum labor cost
        return value;
      }
    }
  }
  
  return null;
}

/**
 * Extract estimated hours from bid text
 * Looks for patterns like "X hours" or "estimated X hrs"
 */
export function extractEstimatedHours(bidText: string): number | null {
  const patterns = [
    /(?:estimated|approx(?:imately)?|about)?\s*(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\s*(?:of\s+)?(?:labor|work)?/i,
    /labor\s*(?:hours?|hrs?)[:\s]*(\d+(?:\.\d+)?)/i,
    /(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\s*(?:×|x|@)\s*\$/i,
    /time\s*(?:estimate)?[:\s]*(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)/i,
    /(?:project|job)\s*(?:duration|time)[:\s]*(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)/i,
  ];
  
  for (const pattern of patterns) {
    const match = bidText.match(pattern);
    if (match) {
      const value = parseFloat(match[1]);
      if (value >= 1 && value <= 2000) { // Reasonable hour range
        return value;
      }
    }
  }
  
  return null;
}

/**
 * Calculate the effective hourly rate from bid
 */
export function calculateEffectiveRate(laborCost: number | null, hours: number | null): number | null {
  if (laborCost === null || hours === null || hours === 0) {
    return null;
  }
  return Math.round((laborCost / hours) * 100) / 100;
}

/**
 * Calculate the "Fair Rate" using the Price Truth Formula
 * Fair Rate = BLS Mean Wage × Contractor Multiplier (2.8)
 */
export function calculateFairRate(blsMeanWage: number): number {
  return Math.round(blsMeanWage * CONTRACTOR_MULTIPLIER * 100) / 100;
}

/**
 * Analyze labor rate and determine status
 */
export function analyzeLaborRate(
  effectiveRate: number | null,
  blsMeanWage: number,
  fairRate: number
): { status: LaborRateAudit['status']; percentDifference: number | null; insight: string } {
  if (effectiveRate === null) {
    return {
      status: 'unknown',
      percentDifference: null,
      insight: "We couldn't find explicit labor costs and hours in your bid. Ask your contractor for a line-item breakdown showing labor hours and hourly rate.",
    };
  }
  
  const percentAboveFair = ((effectiveRate - fairRate) / fairRate) * 100;
  const percentDifference = Math.round(percentAboveFair * 10) / 10;
  
  // Quality Warning: Below BLS base wage
  if (effectiveRate < blsMeanWage) {
    return {
      status: 'quality-warning',
      percentDifference,
      insight: `This rate is below what skilled tradespeople typically earn in Atlanta. This could indicate unlicensed workers, corners being cut on quality, or missing insurance/permits. Ask about their team's experience and licensing.`,
    };
  }
  
  // Negotiation Point: >20% above fair rate
  if (percentAboveFair > 20) {
    return {
      status: 'negotiation-point',
      percentDifference,
      insight: `This rate is ${Math.abs(percentDifference)}% above typical Atlanta contractor rates. Consider asking: "I've researched local labor rates—can you help me understand what's included that might justify the premium, or is there flexibility here?"`,
    };
  }
  
  // Fair: Within reasonable range
  return {
    status: 'fair',
    percentDifference,
    insight: `This labor rate is within the typical range for licensed contractors in the Atlanta area. It accounts for wages, insurance, overhead, and profit.`,
  };
}

/**
 * Generate full labor rate audit from bid text
 * Uses fallback data if BLS API data not provided
 * Optionally accepts a specific trade to analyze
 */
export function generateLaborRateAudit(
  bidText: string,
  blsWageData?: Record<TradeType, number>,
  forceTrade?: TradeType
): LaborRateAudit | null {
  // If a specific trade is requested, use that; otherwise detect from text
  let primaryTrade: TradeMapping | null;
  
  if (forceTrade) {
    primaryTrade = TRADE_MAPPINGS.find(t => t.trade === forceTrade) ?? null;
  } else {
    primaryTrade = detectPrimaryTrade(bidText);
  }
  
  if (!primaryTrade) {
    return null;
  }
  
  const laborCost = extractLaborCost(bidText);
  const hours = extractEstimatedHours(bidText);
  const effectiveRate = calculateEffectiveRate(laborCost, hours);
  
  // Use BLS data if provided, otherwise use fallback
  const blsMeanWage = blsWageData?.[primaryTrade.trade] ?? FALLBACK_WAGES[primaryTrade.trade];
  const fairRate = calculateFairRate(blsMeanWage);
  const dataSource = blsWageData ? 'bls-api' : 'fallback';
  
  const { status, percentDifference, insight } = analyzeLaborRate(effectiveRate, blsMeanWage, fairRate);
  
  return {
    trade: primaryTrade.trade,
    tradeName: primaryTrade.displayName,
    blsMeanWage,
    fairRate,
    bidEffectiveRate: effectiveRate,
    bidLaborCost: laborCost,
    bidHours: hours,
    status,
    percentDifference,
    insight,
    dataSource,
    lastUpdated: new Date().toISOString().split('T')[0],
  };
}

/**
 * Build BLS API request payload
 */
export function buildBLSRequestPayload(
  apiKey: string,
  seriesIds: string[],
  startYear?: number,
  endYear?: number
): { url: string; body: string } {
  const currentYear = new Date().getFullYear();
  const start = startYear ?? currentYear - 1;
  const end = endYear ?? currentYear;
  
  return {
    url: 'https://api.bls.gov/publicAPI/v2/timeseries/data/',
    body: JSON.stringify({
      seriesid: seriesIds,
      startyear: start.toString(),
      endyear: end.toString(),
      registrationkey: apiKey,
    }),
  };
}

/**
 * Parse BLS API response to extract wage data
 */
export function parseBLSResponse(response: BLSAPIResponse): Record<TradeType, number> | null {
  if (response.status !== 'REQUEST_SUCCEEDED' || !response.Results?.series) {
    return null;
  }
  
  const wages: Partial<Record<TradeType, number>> = {};
  
  for (const series of response.Results.series) {
    // Find which trade this series belongs to
    const tradeMapping = TRADE_MAPPINGS.find(t => t.blsSeriesId === series.seriesID);
    if (!tradeMapping) continue;
    
    // Get the most recent data point
    const latestData = series.data[0]; // BLS returns data in reverse chronological order
    if (latestData?.value) {
      wages[tradeMapping.trade] = parseFloat(latestData.value);
    }
  }
  
  // Only return if we have at least some data
  return Object.keys(wages).length > 0 ? (wages as Record<TradeType, number>) : null;
}

/**
 * Get all BLS series IDs for fetching
 */
export function getAllSeriesIds(): string[] {
  return TRADE_MAPPINGS.map(t => t.blsSeriesId);
}
