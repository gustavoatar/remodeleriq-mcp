// Location-based savings data for the hero section
// Uses market size tiers to determine savings range

export interface LocationSavings {
  location: string;
  savings: number;
}

// Market size tiers determine the savings range
// Large: $1,100 - $1,344 | Medium: $850 - $1,099 | Small: $599 - $849
type MarketTier = 'large' | 'medium' | 'small';

// Large markets - major metro areas with high construction costs
const LARGE_MARKET_CITIES = new Set([
  'new york', 'brooklyn', 'manhattan', 'los angeles', 'san francisco', 
  'san jose', 'seattle', 'boston', 'chicago', 'miami', 'san diego',
  'washington', 'denver', 'austin', 'newark', 'jersey city', 'honolulu'
]);

// Medium markets - mid-size metros
const MEDIUM_MARKET_CITIES = new Set([
  'atlanta', 'houston', 'dallas', 'phoenix', 'philadelphia', 'portland',
  'tampa', 'orlando', 'charlotte', 'nashville', 'minneapolis', 'baltimore',
  'las vegas', 'sacramento', 'raleigh', 'salt lake city', 'pittsburgh',
  'st. louis', 'kansas city', 'new orleans', 'charleston', 'scottsdale',
  'fort worth', 'san antonio', 'hartford', 'richmond', 'virginia beach',
  'milwaukee', 'columbus', 'cleveland', 'cincinnati', 'detroit', 'tacoma',
  'colorado springs', 'savannah', 'jacksonville', 'tucson', 'indianapolis',
  'buffalo', 'memphis', 'augusta'
]);

// Large market states (high cost of living)
const LARGE_MARKET_STATES = new Set(['CA', 'NY', 'MA', 'WA', 'DC', 'HI', 'NJ', 'CT']);

// Medium market states
const MEDIUM_MARKET_STATES = new Set([
  'CO', 'FL', 'TX', 'IL', 'AZ', 'OR', 'MD', 'VA', 'GA', 'NC', 'TN', 
  'MN', 'PA', 'NV', 'UT', 'RI', 'NH', 'DE', 'VT'
]);

// Simple seeded random - produces consistent number for same input
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Convert to 0-1 range
  return Math.abs((Math.sin(hash) * 10000) % 1);
}

// Get savings amount based on market tier
function getSavingsForTier(tier: MarketTier, locationSeed: string): number {
  const random = seededRandom(locationSeed);
  
  switch (tier) {
    case 'large':
      // $1,100 - $1,344
      return Math.round(1100 + (random * 244));
    case 'medium':
      // $850 - $1,099
      return Math.round(850 + (random * 249));
    case 'small':
      // $599 - $849
      return Math.round(599 + (random * 250));
  }
}

// Determine market tier for a city
function getCityTier(city: string): MarketTier {
  const cityKey = city.toLowerCase().trim();
  if (LARGE_MARKET_CITIES.has(cityKey)) return 'large';
  if (MEDIUM_MARKET_CITIES.has(cityKey)) return 'medium';
  return 'small';
}

// Determine market tier for a state
function getStateTier(state: string): MarketTier {
  const stateKey = state.toUpperCase().trim();
  if (LARGE_MARKET_STATES.has(stateKey)) return 'large';
  if (MEDIUM_MARKET_STATES.has(stateKey)) return 'medium';
  return 'small';
}

// State code to name mapping
const STATE_NAMES: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
  'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
  'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
  'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
  'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
  'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
  'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
  'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
  'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
  'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
  'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'Washington D.C.'
};

// City name formatting
function formatCityName(city: string): string {
  return city.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Default fallback
export const DEFAULT_SAVINGS: LocationSavings = {
  location: 'your area',
  savings: 972 // Middle of the range
};

export function getSavingsForLocation(city?: string, state?: string): LocationSavings {
  // Try city first (preferred)
  if (city) {
    const cityKey = city.toLowerCase().trim();
    const tier = getCityTier(cityKey);
    const savings = getSavingsForTier(tier, cityKey);
    return {
      location: formatCityName(city),
      savings
    };
  }
  
  // Fall back to state
  if (state) {
    const stateKey = state.toUpperCase().trim();
    const stateName = STATE_NAMES[stateKey];
    if (stateName) {
      const tier = getStateTier(stateKey);
      const savings = getSavingsForTier(tier, stateKey);
      return {
        location: stateName,
        savings
      };
    }
  }
  
  // Default fallback
  return DEFAULT_SAVINGS;
}
