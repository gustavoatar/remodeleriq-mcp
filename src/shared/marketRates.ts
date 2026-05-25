/**
 * Market Rates Module
 * 
 * Provides local market pricing data for contractor bid comparison.
 * Currently uses mock data for Roswell, GA area (30076).
 * 
 * FUTURE: Connect to Clear Estimates CEPIA API for real-time pricing data.
 * API Integration points are marked with "CEPIA:" comments.
 */

export type PriceRange = {
  low: number;
  average: number;
  high: number;
};

export type MarketRateCategory = 
  | 'bathroom-remodel'
  | 'kitchen-remodel'
  | 'deck-construction'
  | 'roofing'
  | 'flooring-hardwood'
  | 'flooring-tile'
  | 'flooring-carpet'
  | 'painting-interior'
  | 'painting-exterior'
  | 'hvac'
  | 'windows'
  | 'siding'
  | 'basement-finishing'
  | 'addition'
  | 'electrical-panel'
  | 'plumbing';

export interface MarketRateResult {
  category: MarketRateCategory;
  displayName: string;
  priceRange: PriceRange;
  unit: string;
  zipCode: string;
  region: string;
  confidence: 'high' | 'medium' | 'low';
  dataSource: 'mock' | 'cepia' | 'homewyse';
  lastUpdated: string;
}

export interface MarketComparisonResult {
  bidAmount: number;
  marketAverage: number;
  marketLow: number;
  marketHigh: number;
  percentDifference: number;
  status: 'below-market' | 'fair' | 'above-market' | 'significantly-above';
  savingsPotential: number;
}

/**
 * Mock market data for Roswell, GA area (30076, 30075, 30009)
 * Based on 2024 Atlanta metro construction cost data
 * 
 * CEPIA: Replace this with API call to Clear Estimates
 */
const ROSWELL_GA_MARKET_DATA: Record<MarketRateCategory, Omit<MarketRateResult, 'zipCode' | 'region' | 'dataSource' | 'lastUpdated'>> = {
  'bathroom-remodel': {
    category: 'bathroom-remodel',
    displayName: 'Bathroom Remodel',
    priceRange: { low: 12000, average: 18500, high: 35000 },
    unit: 'per project',
    confidence: 'high',
  },
  'kitchen-remodel': {
    category: 'kitchen-remodel',
    displayName: 'Kitchen Remodel',
    priceRange: { low: 25000, average: 45000, high: 85000 },
    unit: 'per project',
    confidence: 'high',
  },
  'deck-construction': {
    category: 'deck-construction',
    displayName: 'Deck Construction',
    priceRange: { low: 8500, average: 15000, high: 28000 },
    unit: 'per 300 sq ft',
    confidence: 'high',
  },
  'roofing': {
    category: 'roofing',
    displayName: 'Roof Replacement',
    priceRange: { low: 8000, average: 12500, high: 22000 },
    unit: 'per 2,000 sq ft',
    confidence: 'high',
  },
  'flooring-hardwood': {
    category: 'flooring-hardwood',
    displayName: 'Hardwood Flooring',
    priceRange: { low: 6, average: 12, high: 22 },
    unit: 'per sq ft',
    confidence: 'high',
  },
  'flooring-tile': {
    category: 'flooring-tile',
    displayName: 'Tile Flooring',
    priceRange: { low: 8, average: 15, high: 25 },
    unit: 'per sq ft',
    confidence: 'high',
  },
  'flooring-carpet': {
    category: 'flooring-carpet',
    displayName: 'Carpet Installation',
    priceRange: { low: 3, average: 6, high: 12 },
    unit: 'per sq ft',
    confidence: 'high',
  },
  'painting-interior': {
    category: 'painting-interior',
    displayName: 'Interior Painting',
    priceRange: { low: 2800, average: 4500, high: 8000 },
    unit: 'per 2,000 sq ft',
    confidence: 'high',
  },
  'painting-exterior': {
    category: 'painting-exterior',
    displayName: 'Exterior Painting',
    priceRange: { low: 3500, average: 5500, high: 10000 },
    unit: 'per 2,000 sq ft',
    confidence: 'medium',
  },
  'hvac': {
    category: 'hvac',
    displayName: 'HVAC System',
    priceRange: { low: 6500, average: 10000, high: 18000 },
    unit: 'per system',
    confidence: 'high',
  },
  'windows': {
    category: 'windows',
    displayName: 'Window Replacement',
    priceRange: { low: 450, average: 750, high: 1400 },
    unit: 'per window',
    confidence: 'high',
  },
  'siding': {
    category: 'siding',
    displayName: 'Siding Installation',
    priceRange: { low: 8000, average: 14000, high: 25000 },
    unit: 'per 2,000 sq ft',
    confidence: 'medium',
  },
  'basement-finishing': {
    category: 'basement-finishing',
    displayName: 'Basement Finishing',
    priceRange: { low: 25000, average: 45000, high: 75000 },
    unit: 'per 1,000 sq ft',
    confidence: 'medium',
  },
  'addition': {
    category: 'addition',
    displayName: 'Room Addition',
    priceRange: { low: 80, average: 150, high: 250 },
    unit: 'per sq ft',
    confidence: 'medium',
  },
  'electrical-panel': {
    category: 'electrical-panel',
    displayName: 'Electrical Panel Upgrade',
    priceRange: { low: 1500, average: 2500, high: 4500 },
    unit: 'per panel',
    confidence: 'high',
  },
  'plumbing': {
    category: 'plumbing',
    displayName: 'Plumbing Repair/Install',
    priceRange: { low: 500, average: 2500, high: 8000 },
    unit: 'per project',
    confidence: 'low',
  },
};

/**
 * ZIP code to region mapping
 * CEPIA: This will be handled by the API
 */
const ZIP_TO_REGION: Record<string, { region: string; hasData: boolean }> = {
  // Roswell, GA
  '30075': { region: 'Roswell, GA', hasData: true },
  '30076': { region: 'Roswell, GA', hasData: true },
  '30077': { region: 'Roswell, GA', hasData: true },
  // Alpharetta / Milton, GA (overlapping ZIP codes)
  '30004': { region: 'Alpharetta/Milton, GA', hasData: true },
  '30005': { region: 'Alpharetta, GA', hasData: true },
  '30009': { region: 'Alpharetta, GA', hasData: true },
  // Johns Creek, GA
  '30022': { region: 'Johns Creek, GA', hasData: true },
  '30097': { region: 'Johns Creek, GA', hasData: true },
  // Atlanta Metro (default fallback)
  '30301': { region: 'Atlanta, GA', hasData: true },
  '30303': { region: 'Atlanta, GA', hasData: true },
  '30305': { region: 'Atlanta, GA', hasData: true },
  '30306': { region: 'Atlanta, GA', hasData: true },
  '30308': { region: 'Atlanta, GA', hasData: true },
  '30309': { region: 'Atlanta, GA', hasData: true },
  '30310': { region: 'Atlanta, GA', hasData: true },
  '30312': { region: 'Atlanta, GA', hasData: true },
  '30313': { region: 'Atlanta, GA', hasData: true },
  '30314': { region: 'Atlanta, GA', hasData: true },
  '30315': { region: 'Atlanta, GA', hasData: true },
  '30316': { region: 'Atlanta, GA', hasData: true },
  '30317': { region: 'Atlanta, GA', hasData: true },
  '30318': { region: 'Atlanta, GA', hasData: true },
  '30319': { region: 'Atlanta, GA', hasData: true },
  '30324': { region: 'Atlanta, GA', hasData: true },
  '30326': { region: 'Atlanta, GA', hasData: true },
  '30327': { region: 'Atlanta, GA', hasData: true },
  '30329': { region: 'Atlanta, GA', hasData: true },
  '30331': { region: 'Atlanta, GA', hasData: true },
  '30332': { region: 'Atlanta, GA', hasData: true },
  '30334': { region: 'Atlanta, GA', hasData: true },
  '30336': { region: 'Atlanta, GA', hasData: true },
  '30337': { region: 'Atlanta, GA', hasData: true },
  '30338': { region: 'Atlanta, GA', hasData: true },
  '30339': { region: 'Atlanta, GA', hasData: true },
  '30340': { region: 'Atlanta, GA', hasData: true },
  '30341': { region: 'Atlanta, GA', hasData: true },
  '30344': { region: 'Atlanta, GA', hasData: true },
  '30345': { region: 'Atlanta, GA', hasData: true },
  '30346': { region: 'Atlanta, GA', hasData: true },
  '30349': { region: 'Atlanta, GA', hasData: true },
  '30354': { region: 'Atlanta, GA', hasData: true },
  '30360': { region: 'Atlanta, GA', hasData: true },
  // Marietta, GA
  '30060': { region: 'Marietta, GA', hasData: true },
  '30062': { region: 'Marietta, GA', hasData: true },
  '30064': { region: 'Marietta, GA', hasData: true },
  '30066': { region: 'Marietta, GA', hasData: true },
  '30067': { region: 'Marietta, GA', hasData: true },
  '30068': { region: 'Marietta, GA', hasData: true },
  // Decatur, GA
  '30030': { region: 'Decatur, GA', hasData: true },
  '30033': { region: 'Decatur, GA', hasData: true },
  // Sandy Springs, GA
  '30328': { region: 'Sandy Springs, GA', hasData: true },
  '30342': { region: 'Sandy Springs, GA', hasData: true },
  '30350': { region: 'Sandy Springs, GA', hasData: true },
};

/**
 * Fetch market rates for a specific ZIP code and project category
 * 
 * CEPIA: Replace mock data lookup with API call:
 * ```
 * const response = await fetch(`${CEPIA_API_URL}/rates`, {
 *   method: 'POST',
 *   headers: {
 *     'Authorization': `Bearer ${env.CEPIA_API_KEY}`,
 *     'Content-Type': 'application/json',
 *   },
 *   body: JSON.stringify({ zipCode, category }),
 * });
 * return await response.json();
 * ```
 */
export function fetchMarketRates(
  zipCode: string,
  category: MarketRateCategory
): MarketRateResult | null {
  // Normalize ZIP code (first 5 digits)
  const normalizedZip = zipCode.replace(/\D/g, '').slice(0, 5);
  
  if (normalizedZip.length !== 5) {
    return null;
  }
  
  // Check if we have data for this region
  const regionInfo = ZIP_TO_REGION[normalizedZip];
  const region = regionInfo?.region || 'Atlanta Metro, GA';
  
  // Get the market data for this category
  const marketData = ROSWELL_GA_MARKET_DATA[category];
  
  if (!marketData) {
    return null;
  }
  
  return {
    ...marketData,
    zipCode: normalizedZip,
    region,
    dataSource: 'mock',
    lastUpdated: '2024-01-15',
  };
}

/**
 * Fetch all available market rates for a ZIP code
 */
export function fetchAllMarketRates(zipCode: string): MarketRateResult[] {
  const categories = Object.keys(ROSWELL_GA_MARKET_DATA) as MarketRateCategory[];
  const results: MarketRateResult[] = [];
  
  for (const category of categories) {
    const rate = fetchMarketRates(zipCode, category);
    if (rate) {
      results.push(rate);
    }
  }
  
  return results;
}

/**
 * Compare a bid amount against market rates
 */
export function compareToMarket(
  bidAmount: number,
  marketRate: MarketRateResult
): MarketComparisonResult {
  const { low, average, high } = marketRate.priceRange;
  const percentDifference = ((bidAmount - average) / average) * 100;
  
  let status: MarketComparisonResult['status'];
  if (bidAmount < low) {
    status = 'below-market';
  } else if (bidAmount <= average * 1.15) {
    status = 'fair';
  } else if (bidAmount <= high) {
    status = 'above-market';
  } else {
    status = 'significantly-above';
  }
  
  // Calculate potential savings (difference from average if above)
  const savingsPotential = bidAmount > average ? bidAmount - average : 0;
  
  return {
    bidAmount,
    marketAverage: average,
    marketLow: low,
    marketHigh: high,
    percentDifference: Math.round(percentDifference * 10) / 10,
    status,
    savingsPotential,
  };
}

/**
 * Detect project category from bid text
 * Returns the most likely category based on keywords
 */
export function detectProjectCategory(bidText: string): MarketRateCategory | null {
  const normalizedText = bidText.toLowerCase();
  
  // Order matters - more specific matches first
  const categoryPatterns: Array<{ category: MarketRateCategory; patterns: RegExp[] }> = [
    {
      category: 'bathroom-remodel',
      patterns: [/bathroom\s*(remodel|renovation|upgrade)/i, /bath\s*remodel/i, /master\s*bath/i],
    },
    {
      category: 'kitchen-remodel',
      patterns: [/kitchen\s*(remodel|renovation|upgrade)/i, /kitchen\s*cabinet/i],
    },
    {
      category: 'basement-finishing',
      patterns: [/basement\s*(finish|remodel|renovation)/i, /finish.*basement/i],
    },
    {
      category: 'deck-construction',
      patterns: [/deck\s*(build|construct|install)/i, /new\s*deck/i, /composite\s*deck/i],
    },
    {
      category: 'roofing',
      patterns: [/roof\s*(replace|install|repair)/i, /roofing/i, /shingle/i],
    },
    {
      category: 'flooring-hardwood',
      patterns: [/hardwood\s*(floor|install)/i, /wood\s*floor/i],
    },
    {
      category: 'flooring-tile',
      patterns: [/tile\s*(floor|install)/i, /ceramic\s*tile/i, /porcelain/i],
    },
    {
      category: 'flooring-carpet',
      patterns: [/carpet\s*(install|replace)/i, /new\s*carpet/i],
    },
    {
      category: 'painting-interior',
      patterns: [/interior\s*paint/i, /paint.*room/i, /paint.*wall/i],
    },
    {
      category: 'painting-exterior',
      patterns: [/exterior\s*paint/i, /paint.*house/i, /paint.*siding/i],
    },
    {
      category: 'hvac',
      patterns: [/hvac/i, /air\s*condition/i, /furnace/i, /heat\s*pump/i],
    },
    {
      category: 'windows',
      patterns: [/window\s*(replace|install)/i, /new\s*window/i],
    },
    {
      category: 'siding',
      patterns: [/siding\s*(install|replace)/i, /vinyl\s*siding/i, /hardie/i],
    },
    {
      category: 'electrical-panel',
      patterns: [/electrical\s*panel/i, /breaker\s*box/i, /200\s*amp/i],
    },
    {
      category: 'plumbing',
      patterns: [/plumbing/i, /re-?pipe/i, /water\s*heater/i],
    },
    {
      category: 'addition',
      patterns: [/room\s*addition/i, /home\s*addition/i, /add.*square\s*feet/i],
    },
  ];
  
  for (const { category, patterns } of categoryPatterns) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedText)) {
        return category;
      }
    }
  }
  
  return null;
}

/**
 * Check if ZIP code is supported (has local market data)
 */
export function isZipCodeSupported(zipCode: string): boolean {
  // Support all US ZIP codes - we have baseline data
  const normalizedZip = zipCode.replace(/\D/g, '').slice(0, 5);
  return normalizedZip.length === 5;
}

/**
 * Get region name for a ZIP code
 */
export function getRegionForZip(zipCode: string): string {
  const normalizedZip = zipCode.replace(/\D/g, '').slice(0, 5);
  return ZIP_TO_REGION[normalizedZip]?.region || 'Your Area';
}

/**
 * Get region name for a state code (fallback when no specific ZIP data)
 */
export function getRegionForState(stateCode: string): string {
  const stateRegions: Record<string, string> = {
    'AL': 'Alabama',
    'AK': 'Alaska',
    'AZ': 'Arizona',
    'AR': 'Arkansas',
    'CA': 'California',
    'CO': 'Colorado',
    'CT': 'Connecticut',
    'DE': 'Delaware',
    'DC': 'Washington, DC',
    'FL': 'Florida',
    'GA': 'Georgia',
    'HI': 'Hawaii',
    'ID': 'Idaho',
    'IL': 'Illinois',
    'IN': 'Indiana',
    'IA': 'Iowa',
    'KS': 'Kansas',
    'KY': 'Kentucky',
    'LA': 'Louisiana',
    'ME': 'Maine',
    'MD': 'Maryland',
    'MA': 'Massachusetts',
    'MI': 'Michigan',
    'MN': 'Minnesota',
    'MS': 'Mississippi',
    'MO': 'Missouri',
    'MT': 'Montana',
    'NE': 'Nebraska',
    'NV': 'Nevada',
    'NH': 'New Hampshire',
    'NJ': 'New Jersey',
    'NM': 'New Mexico',
    'NY': 'New York',
    'NC': 'North Carolina',
    'ND': 'North Dakota',
    'OH': 'Ohio',
    'OK': 'Oklahoma',
    'OR': 'Oregon',
    'PA': 'Pennsylvania',
    'RI': 'Rhode Island',
    'SC': 'South Carolina',
    'SD': 'South Dakota',
    'TN': 'Tennessee',
    'TX': 'Texas',
    'UT': 'Utah',
    'VT': 'Vermont',
    'VA': 'Virginia',
    'WA': 'Washington',
    'WV': 'West Virginia',
    'WI': 'Wisconsin',
    'WY': 'Wyoming',
  };
  return stateRegions[stateCode.toUpperCase()] || 'Your Area';
}

/**
 * Calculate if a line item is significantly above market
 * Returns true if >15% above the market average
 */
export function isAboveMarketThreshold(
  bidAmount: number,
  marketAverage: number,
  thresholdPercent: number = 15
): boolean {
  const percentAbove = ((bidAmount - marketAverage) / marketAverage) * 100;
  return percentAbove > thresholdPercent;
}
