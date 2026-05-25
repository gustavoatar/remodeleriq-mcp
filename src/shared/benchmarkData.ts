// =============================================================================
// BLIND BID BENCHMARK DATA - 2026 Homewyse/RSMeans
// 
// @deprecated This file is being replaced by smartPricingRules.ts
// New code should import from smartPricingRules.ts instead.
// This file is retained for backward compatibility during migration.
// =============================================================================

export interface BenchmarkRange {
  low: number;
  high: number;
  sqft: number;
  laborHours: number;
}

export interface BasementBenchmark {
  low: number;
  high: number;
}

// 2026 Homewyse Benchmark Data
export const HOMEWYSE_BENCHMARKS = {
  kitchen: {
    basic: { low: 17462, high: 22175, sqft: 85, laborHours: 80 },
    mid: { low: 30784, high: 38618, sqft: 85, laborHours: 110 },
    modern: { low: 32186, high: 40241, sqft: 85, laborHours: 110 },
    minor: { low: 11106, high: 14121, sqft: 85, laborHours: 40 }
  },
  bathroom: {
    typical: { low: 12091, high: 15579, sqft: 43, laborHours: 71.7 },
    fullGut: { low: 12465, high: 16033, sqft: 43, laborHours: 80 },
    small: { low: 12584, high: 16162, sqft: 35, laborHours: 65 },
    master: { low: 14249, high: 18591, sqft: 60, laborHours: 90 }
  },
  basement: {
    dryPerSqft: { low: 30, high: 75 },
    wetPerSqft: { low: 100, high: 250 },
    framingPerSqft: { low: 4.78, high: 8.22 },
    designPlanning: { low: 2117, high: 5937 }
  }
} as const;

// =============================================================================
// LINEAR FEET BENCHMARKS - 2026 Homewyse/RSMeans
// Pricing per linear foot for fence, gutter, railing, and retaining wall projects
// =============================================================================
export interface LinearFootBenchmark {
  low: number;      // $ per linear foot - low end
  median: number;   // $ per linear foot - median
  high: number;     // $ per linear foot - high end
  materialPercent: number; // typical material % of total cost
  laborHoursPerLF: number; // labor hours per linear foot
}

export const LINEAR_FOOT_BENCHMARKS: Record<string, Record<string, LinearFootBenchmark>> = {
  fence: {
    wood: { low: 25, median: 40, high: 65, materialPercent: 0.55, laborHoursPerLF: 0.25 },
    vinyl: { low: 30, median: 50, high: 80, materialPercent: 0.65, laborHoursPerLF: 0.20 },
    chainlink: { low: 15, median: 25, high: 40, materialPercent: 0.60, laborHoursPerLF: 0.15 },
    aluminum: { low: 40, median: 65, high: 100, materialPercent: 0.70, laborHoursPerLF: 0.20 },
    wroughtIron: { low: 80, median: 120, high: 180, materialPercent: 0.60, laborHoursPerLF: 0.35 },
    compositeCapped: { low: 50, median: 80, high: 120, materialPercent: 0.65, laborHoursPerLF: 0.25 },
    general: { low: 25, median: 45, high: 75, materialPercent: 0.60, laborHoursPerLF: 0.22 }
  },
  gutter: {
    aluminum: { low: 8, median: 12, high: 18, materialPercent: 0.45, laborHoursPerLF: 0.08 },
    vinyl: { low: 5, median: 8, high: 12, materialPercent: 0.50, laborHoursPerLF: 0.06 },
    seamless: { low: 10, median: 15, high: 22, materialPercent: 0.50, laborHoursPerLF: 0.10 },
    copper: { low: 25, median: 40, high: 60, materialPercent: 0.70, laborHoursPerLF: 0.12 },
    steel: { low: 12, median: 18, high: 28, materialPercent: 0.55, laborHoursPerLF: 0.10 },
    general: { low: 8, median: 14, high: 22, materialPercent: 0.50, laborHoursPerLF: 0.09 }
  },
  railing: {
    wood: { low: 40, median: 65, high: 100, materialPercent: 0.50, laborHoursPerLF: 0.30 },
    aluminum: { low: 60, median: 90, high: 140, materialPercent: 0.65, laborHoursPerLF: 0.25 },
    wroughtIron: { low: 100, median: 150, high: 250, materialPercent: 0.60, laborHoursPerLF: 0.40 },
    cable: { low: 80, median: 130, high: 200, materialPercent: 0.70, laborHoursPerLF: 0.35 },
    glass: { low: 150, median: 225, high: 350, materialPercent: 0.75, laborHoursPerLF: 0.45 },
    composite: { low: 70, median: 110, high: 160, materialPercent: 0.60, laborHoursPerLF: 0.28 },
    general: { low: 50, median: 85, high: 140, materialPercent: 0.60, laborHoursPerLF: 0.32 }
  },
  retainingWall: {
    timberWood: { low: 25, median: 40, high: 60, materialPercent: 0.45, laborHoursPerLF: 0.35 },
    blockSegmental: { low: 35, median: 55, high: 85, materialPercent: 0.55, laborHoursPerLF: 0.40 },
    poured: { low: 50, median: 80, high: 130, materialPercent: 0.50, laborHoursPerLF: 0.50 },
    boulder: { low: 40, median: 70, high: 120, materialPercent: 0.60, laborHoursPerLF: 0.45 },
    gabion: { low: 30, median: 50, high: 80, materialPercent: 0.65, laborHoursPerLF: 0.35 },
    general: { low: 35, median: 60, high: 100, materialPercent: 0.55, laborHoursPerLF: 0.42 }
  }
} as const;

// Helper to detect linear foot material type from bid text
export function detectLinearFootMaterial(projectType: string, bidText: string): string {
  const text = bidText.toLowerCase();
  
  if (projectType === 'fence' || projectType === 'fence-repair') {
    if (text.includes('chain link') || text.includes('chainlink')) return 'chainlink';
    if (text.includes('vinyl')) return 'vinyl';
    if (text.includes('aluminum')) return 'aluminum';
    if (text.includes('wrought iron') || text.includes('iron fence')) return 'wroughtIron';
    if (text.includes('composite') || text.includes('trex')) return 'compositeCapped';
    if (text.includes('wood') || text.includes('cedar') || text.includes('pine') || text.includes('pressure treat')) return 'wood';
    return 'general';
  }
  
  if (projectType === 'gutter' || projectType === 'gutter-repair') {
    if (text.includes('copper')) return 'copper';
    if (text.includes('seamless')) return 'seamless';
    if (text.includes('steel') || text.includes('galvanized')) return 'steel';
    if (text.includes('vinyl') || text.includes('pvc')) return 'vinyl';
    if (text.includes('aluminum')) return 'aluminum';
    return 'general';
  }
  
  if (projectType === 'railing') {
    if (text.includes('glass')) return 'glass';
    if (text.includes('cable')) return 'cable';
    if (text.includes('wrought iron') || text.includes('iron railing')) return 'wroughtIron';
    if (text.includes('aluminum')) return 'aluminum';
    if (text.includes('composite') || text.includes('trex')) return 'composite';
    if (text.includes('wood') || text.includes('cedar') || text.includes('pine')) return 'wood';
    return 'general';
  }
  
  if (projectType === 'retaining-wall') {
    if (text.includes('gabion')) return 'gabion';
    if (text.includes('boulder')) return 'boulder';
    if (text.includes('poured') || text.includes('concrete wall')) return 'poured';
    if (text.includes('block') || text.includes('segmental') || text.includes('keystone') || text.includes('versa-lok')) return 'blockSegmental';
    if (text.includes('timber') || text.includes('railroad tie') || text.includes('landscape timber')) return 'timberWood';
    return 'general';
  }
  
  return 'general';
}

export interface CityTierData {
  tier: 1 | 2 | 3 | 4 | 5;
  multiplier: { low: number; high: number };
  kitchenRange: string;
  bathroomRange: string;
  basementPsf: string;
}

// City Tier Multipliers - 2026 RSMeans verified
export const CITY_TIERS: Record<string, CityTierData> = {
  // Tier 1 - High Cost (1.4-1.6x)
  'new york': { tier: 1, multiplier: { low: 1.4, high: 1.6 }, kitchenRange: '$45k-$75k+', bathroomRange: '$22k-$35k+', basementPsf: '$80-$120' },
  'nyc': { tier: 1, multiplier: { low: 1.4, high: 1.6 }, kitchenRange: '$45k-$75k+', bathroomRange: '$22k-$35k+', basementPsf: '$80-$120' },
  'manhattan': { tier: 1, multiplier: { low: 1.4, high: 1.6 }, kitchenRange: '$45k-$75k+', bathroomRange: '$22k-$35k+', basementPsf: '$80-$120' },
  'brooklyn': { tier: 1, multiplier: { low: 1.4, high: 1.6 }, kitchenRange: '$45k-$75k+', bathroomRange: '$22k-$35k+', basementPsf: '$80-$120' },
  'san francisco': { tier: 1, multiplier: { low: 1.4, high: 1.6 }, kitchenRange: '$45k-$75k+', bathroomRange: '$22k-$35k+', basementPsf: '$80-$120' },
  'san jose': { tier: 1, multiplier: { low: 1.4, high: 1.6 }, kitchenRange: '$45k-$75k+', bathroomRange: '$22k-$35k+', basementPsf: '$80-$120' },
  'seattle': { tier: 1, multiplier: { low: 1.4, high: 1.6 }, kitchenRange: '$45k-$75k+', bathroomRange: '$22k-$35k+', basementPsf: '$80-$120' },
  'boston': { tier: 1, multiplier: { low: 1.4, high: 1.6 }, kitchenRange: '$45k-$75k+', bathroomRange: '$22k-$35k+', basementPsf: '$80-$120' },
  'oakland': { tier: 1, multiplier: { low: 1.4, high: 1.6 }, kitchenRange: '$45k-$75k+', bathroomRange: '$22k-$35k+', basementPsf: '$80-$120' },
  
  // Tier 2 - Elevated (1.2-1.4x)
  'los angeles': { tier: 2, multiplier: { low: 1.2, high: 1.4 }, kitchenRange: '$35k-$55k', bathroomRange: '$18k-$28k', basementPsf: '$60-$90' },
  'la': { tier: 2, multiplier: { low: 1.2, high: 1.4 }, kitchenRange: '$35k-$55k', bathroomRange: '$18k-$28k', basementPsf: '$60-$90' },
  'chicago': { tier: 2, multiplier: { low: 1.2, high: 1.4 }, kitchenRange: '$35k-$55k', bathroomRange: '$18k-$28k', basementPsf: '$60-$90' },
  'austin': { tier: 2, multiplier: { low: 1.2, high: 1.4 }, kitchenRange: '$35k-$55k', bathroomRange: '$18k-$28k', basementPsf: '$60-$90' },
  'san diego': { tier: 2, multiplier: { low: 1.2, high: 1.4 }, kitchenRange: '$35k-$55k', bathroomRange: '$18k-$28k', basementPsf: '$60-$90' },
  'denver': { tier: 2, multiplier: { low: 1.2, high: 1.4 }, kitchenRange: '$35k-$55k', bathroomRange: '$18k-$28k', basementPsf: '$60-$90' },
  'washington': { tier: 2, multiplier: { low: 1.2, high: 1.4 }, kitchenRange: '$35k-$55k', bathroomRange: '$18k-$28k', basementPsf: '$60-$90' },
  'dc': { tier: 2, multiplier: { low: 1.2, high: 1.4 }, kitchenRange: '$35k-$55k', bathroomRange: '$18k-$28k', basementPsf: '$60-$90' },
  'miami': { tier: 2, multiplier: { low: 1.2, high: 1.4 }, kitchenRange: '$35k-$55k', bathroomRange: '$18k-$28k', basementPsf: '$60-$90' },
  'philadelphia': { tier: 2, multiplier: { low: 1.2, high: 1.4 }, kitchenRange: '$35k-$55k', bathroomRange: '$18k-$28k', basementPsf: '$60-$90' },
  'minneapolis': { tier: 2, multiplier: { low: 1.2, high: 1.4 }, kitchenRange: '$35k-$55k', bathroomRange: '$18k-$28k', basementPsf: '$60-$90' },
  'long beach': { tier: 2, multiplier: { low: 1.2, high: 1.4 }, kitchenRange: '$35k-$55k', bathroomRange: '$18k-$28k', basementPsf: '$60-$90' },
  
  // Tier 3 - Moderate (1.0-1.15x)
  'atlanta': { tier: 3, multiplier: { low: 1.0, high: 1.15 }, kitchenRange: '$28k-$42k', bathroomRange: '$14k-$22k', basementPsf: '$45-$70' },
  'roswell': { tier: 3, multiplier: { low: 1.0, high: 1.15 }, kitchenRange: '$28k-$42k', bathroomRange: '$14k-$22k', basementPsf: '$45-$70' },
  'alpharetta': { tier: 3, multiplier: { low: 1.0, high: 1.15 }, kitchenRange: '$28k-$42k', bathroomRange: '$14k-$22k', basementPsf: '$45-$70' },
  'marietta': { tier: 3, multiplier: { low: 1.0, high: 1.15 }, kitchenRange: '$28k-$42k', bathroomRange: '$14k-$22k', basementPsf: '$45-$70' },
  'smyrna': { tier: 3, multiplier: { low: 1.0, high: 1.15 }, kitchenRange: '$28k-$42k', bathroomRange: '$14k-$22k', basementPsf: '$45-$70' },
  'kennesaw': { tier: 3, multiplier: { low: 1.0, high: 1.15 }, kitchenRange: '$28k-$42k', bathroomRange: '$14k-$22k', basementPsf: '$45-$70' },
  'dallas': { tier: 3, multiplier: { low: 1.0, high: 1.15 }, kitchenRange: '$28k-$42k', bathroomRange: '$14k-$22k', basementPsf: '$45-$70' },
  'phoenix': { tier: 3, multiplier: { low: 1.0, high: 1.15 }, kitchenRange: '$28k-$42k', bathroomRange: '$14k-$22k', basementPsf: '$45-$70' },
  'charlotte': { tier: 3, multiplier: { low: 1.0, high: 1.15 }, kitchenRange: '$28k-$42k', bathroomRange: '$14k-$22k', basementPsf: '$45-$70' },
  'nashville': { tier: 3, multiplier: { low: 1.0, high: 1.15 }, kitchenRange: '$28k-$42k', bathroomRange: '$14k-$22k', basementPsf: '$45-$70' },
  'portland': { tier: 3, multiplier: { low: 1.0, high: 1.15 }, kitchenRange: '$28k-$42k', bathroomRange: '$14k-$22k', basementPsf: '$45-$70' },
  'fort worth': { tier: 3, multiplier: { low: 1.0, high: 1.15 }, kitchenRange: '$28k-$42k', bathroomRange: '$14k-$22k', basementPsf: '$45-$70' },
  'raleigh': { tier: 3, multiplier: { low: 1.0, high: 1.15 }, kitchenRange: '$28k-$42k', bathroomRange: '$14k-$22k', basementPsf: '$45-$70' },
  'colorado springs': { tier: 3, multiplier: { low: 1.0, high: 1.15 }, kitchenRange: '$28k-$42k', bathroomRange: '$14k-$22k', basementPsf: '$45-$70' },
  'sacramento': { tier: 3, multiplier: { low: 1.0, high: 1.15 }, kitchenRange: '$28k-$42k', bathroomRange: '$14k-$22k', basementPsf: '$45-$70' },
  'tampa': { tier: 3, multiplier: { low: 1.0, high: 1.15 }, kitchenRange: '$28k-$42k', bathroomRange: '$14k-$22k', basementPsf: '$45-$70' },
  
  // Tier 4 - Average (0.9-1.0x)
  'houston': { tier: 4, multiplier: { low: 0.9, high: 1.0 }, kitchenRange: '$24k-$38k', bathroomRange: '$12k-$18k', basementPsf: '$35-$55' },
  'columbus': { tier: 4, multiplier: { low: 0.9, high: 1.0 }, kitchenRange: '$24k-$38k', bathroomRange: '$12k-$18k', basementPsf: '$35-$55' },
  'san antonio': { tier: 4, multiplier: { low: 0.9, high: 1.0 }, kitchenRange: '$24k-$38k', bathroomRange: '$12k-$18k', basementPsf: '$35-$55' },
  'las vegas': { tier: 4, multiplier: { low: 0.9, high: 1.0 }, kitchenRange: '$24k-$38k', bathroomRange: '$12k-$18k', basementPsf: '$35-$55' },
  'orlando': { tier: 4, multiplier: { low: 0.9, high: 1.0 }, kitchenRange: '$24k-$38k', bathroomRange: '$12k-$18k', basementPsf: '$35-$55' },
  'jacksonville': { tier: 4, multiplier: { low: 0.9, high: 1.0 }, kitchenRange: '$24k-$38k', bathroomRange: '$12k-$18k', basementPsf: '$35-$55' },
  'indianapolis': { tier: 4, multiplier: { low: 0.9, high: 1.0 }, kitchenRange: '$24k-$38k', bathroomRange: '$12k-$18k', basementPsf: '$35-$55' },
  'arlington': { tier: 4, multiplier: { low: 0.9, high: 1.0 }, kitchenRange: '$24k-$38k', bathroomRange: '$12k-$18k', basementPsf: '$35-$55' },
  'virginia beach': { tier: 4, multiplier: { low: 0.9, high: 1.0 }, kitchenRange: '$24k-$38k', bathroomRange: '$12k-$18k', basementPsf: '$35-$55' },
  'louisville': { tier: 4, multiplier: { low: 0.9, high: 1.0 }, kitchenRange: '$24k-$38k', bathroomRange: '$12k-$18k', basementPsf: '$35-$55' },
  'kansas city': { tier: 4, multiplier: { low: 0.9, high: 1.0 }, kitchenRange: '$24k-$38k', bathroomRange: '$12k-$18k', basementPsf: '$35-$55' },
  'tulsa': { tier: 4, multiplier: { low: 0.9, high: 1.0 }, kitchenRange: '$24k-$38k', bathroomRange: '$12k-$18k', basementPsf: '$35-$55' },
  'cleveland': { tier: 4, multiplier: { low: 0.9, high: 1.0 }, kitchenRange: '$24k-$38k', bathroomRange: '$12k-$18k', basementPsf: '$35-$55' },
  'pittsburgh': { tier: 4, multiplier: { low: 0.9, high: 1.0 }, kitchenRange: '$24k-$38k', bathroomRange: '$12k-$18k', basementPsf: '$35-$55' },
  
  // Tier 5 - Value (0.75-0.9x)
  'oklahoma city': { tier: 5, multiplier: { low: 0.75, high: 0.9 }, kitchenRange: '$18k-$32k', bathroomRange: '$9k-$15k', basementPsf: '$30-$45' },
  'okc': { tier: 5, multiplier: { low: 0.75, high: 0.9 }, kitchenRange: '$18k-$32k', bathroomRange: '$9k-$15k', basementPsf: '$30-$45' },
  'el paso': { tier: 5, multiplier: { low: 0.75, high: 0.9 }, kitchenRange: '$18k-$32k', bathroomRange: '$9k-$15k', basementPsf: '$30-$45' },
  'wichita': { tier: 5, multiplier: { low: 0.75, high: 0.9 }, kitchenRange: '$18k-$32k', bathroomRange: '$9k-$15k', basementPsf: '$30-$45' },
  'memphis': { tier: 5, multiplier: { low: 0.75, high: 0.9 }, kitchenRange: '$18k-$32k', bathroomRange: '$9k-$15k', basementPsf: '$30-$45' },
  'albuquerque': { tier: 5, multiplier: { low: 0.75, high: 0.9 }, kitchenRange: '$18k-$32k', bathroomRange: '$9k-$15k', basementPsf: '$30-$45' },
  'detroit': { tier: 5, multiplier: { low: 0.75, high: 0.9 }, kitchenRange: '$18k-$32k', bathroomRange: '$9k-$15k', basementPsf: '$30-$45' },
  'fresno': { tier: 5, multiplier: { low: 0.75, high: 0.9 }, kitchenRange: '$18k-$32k', bathroomRange: '$9k-$15k', basementPsf: '$30-$45' },
  'bakersfield': { tier: 5, multiplier: { low: 0.75, high: 0.9 }, kitchenRange: '$18k-$32k', bathroomRange: '$9k-$15k', basementPsf: '$30-$45' },
  'omaha': { tier: 5, multiplier: { low: 0.75, high: 0.9 }, kitchenRange: '$18k-$32k', bathroomRange: '$9k-$15k', basementPsf: '$30-$45' },
  'milwaukee': { tier: 5, multiplier: { low: 0.75, high: 0.9 }, kitchenRange: '$18k-$32k', bathroomRange: '$9k-$15k', basementPsf: '$30-$45' },
  'birmingham': { tier: 5, multiplier: { low: 0.75, high: 0.9 }, kitchenRange: '$18k-$32k', bathroomRange: '$9k-$15k', basementPsf: '$30-$45' }
};

// State-level fallbacks when city not found
export const STATE_TIER_FALLBACKS: Record<string, 1 | 2 | 3 | 4 | 5> = {
  // Tier 1 states
  'NY': 1, 'MA': 1, 'CT': 1,
  // Tier 2 states
  'CA': 2, 'WA': 2, 'CO': 2, 'IL': 2, 'NJ': 2, 'MD': 2, 'VA': 2, 'HI': 2,
  // Tier 3 states
  'GA': 3, 'TX': 3, 'FL': 3, 'NC': 3, 'TN': 3, 'AZ': 3, 'OR': 3, 'SC': 3, 'MN': 3,
  // Tier 4 states
  'OH': 4, 'PA': 4, 'IN': 4, 'MO': 4, 'WI': 4, 'NV': 4, 'KY': 4, 'LA': 4, 'UT': 4,
  // Tier 5 states
  'OK': 5, 'KS': 5, 'NE': 5, 'NM': 5, 'MI': 5, 'AL': 5, 'AR': 5, 'MS': 5, 'WV': 5, 'IA': 5
};

// Scope density keywords for tier classification
export const SCOPE_KEYWORDS = {
  // Premium keywords: +3 points each - high-end appliances and finishes
  premium: [
    'custom cabinet', 'custom cabinetry', 'bespoke',
    'wolf', 'subzero', 'sub-zero', 'sub zero', 'thermador', 'la cornue', 'miele', 'gaggenau', 'viking',
    'marble slab', 'calacatta', 'carrara marble', 'book-matched', 'bookmatched',
    'hand-scraped', 'hand scraped', 'wide plank hardwood',
    'waterfall edge', 'waterfall island', 'waterfall countertop',
    'integrated appliance', 'panel-ready', 'panel ready',
    'custom range hood', 'custom hood', 'copper hood',
    'pot filler', 'wine cooler', 'wine refrigerator',
    'butler pantry', 'butlers pantry', 'scullery',
    'induction cooktop', 'professional range', '48" range', '48 inch range'
  ],
  
  // Upscale keywords: +2 points each - quality upgrades
  upscale: [
    'quartz', 'quartzite', 'granite', 'natural stone',
    'soft close', 'soft-close', 'slow close',
    'lvl beam', 'steel beam', 'structural beam',
    'relocate plumbing', 'move plumbing', 'plumbing relocation',
    'relocate electrical', 'electrical relocation', 'move electrical',
    'relocate gas', 'gas line relocation',
    'undermount sink', 'farmhouse sink', 'apron sink',
    'frameless cabinet', 'full overlay', 'inset cabinet',
    'glass door', 'glass front', 'mullion',
    'dovetail drawer', 'full extension drawer', 'soft-close drawer',
    'heated floor', 'radiant floor', 'floor heating',
    'under cabinet lighting', 'led lighting', 'task lighting',
    'built-in', 'built in', 'custom built',
    'double oven', 'wall oven', 'steam oven',
    'designer', 'architectural'
  ],
  
  // Midrange keywords: +1 point each - standard quality
  midrange: [
    'shaker', 'shaker style', 'shaker cabinet',
    'stainless', 'stainless steel',
    'tile backsplash', 'subway tile', 'ceramic tile', 'porcelain tile',
    'vinyl plank', 'lvp', 'luxury vinyl', 'laminate floor',
    'laminate counter', 'laminate countertop', 'formica',
    'stock cabinet', 'rta cabinet', 'semi-custom',
    'brushed nickel', 'chrome', 'matte black',
    'pendant light', 'recessed light', 'can light',
    'garbage disposal', 'disposal',
    'pull-out', 'pullout', 'lazy susan',
    'crown molding', 'trim', 'baseboard'
  ]
};

// Structural add-on patterns and costs
export const STRUCTURAL_ADDONS: Array<{ pattern: RegExp; label: string; cost: number }> = [
  // Major structural work
  { pattern: /load[- ]?bearing|bearing wall|support wall|structural wall/i, label: 'Load-bearing wall removal', cost: 10000 },
  { pattern: /lvl beam|steel beam|support beam|header beam|laminated beam/i, label: 'Beam installation', cost: 8000 },
  { pattern: /foundation|footer|footing|crawl space|pier/i, label: 'Foundation work', cost: 15000 },
  { pattern: /roof[- ]?line|raise ceiling|vault(ed)? ceiling|cathedral ceiling|tray ceiling/i, label: 'Ceiling/roof modification', cost: 12000 },
  { pattern: /\baddition\b|bump[- ]?out|expand footprint/i, label: 'Addition/expansion', cost: 25000 },
  
  // Moderate structural/system work
  { pattern: /relocate plumbing|move plumbing|plumbing relocation|rough[- ]?in plumbing/i, label: 'Plumbing relocation', cost: 5000 },
  { pattern: /electrical panel|upgrade panel|200[- ]?amp|service upgrade|main panel/i, label: 'Electrical panel upgrade', cost: 3500 },
  { pattern: /hvac|ductwork|mini[- ]?split|central air|furnace|ac unit/i, label: 'HVAC modification', cost: 4000 },
  { pattern: /remove wall|demo wall|open concept|open floor plan|knock.{0,10}wall/i, label: 'Non-bearing wall removal', cost: 3000 },
  { pattern: /window|new window|replace window|egress window/i, label: 'Window work', cost: 2500 },
  { pattern: /door|entry door|sliding door|french door/i, label: 'Door installation', cost: 1500 },
  
  // Minor add-ons
  { pattern: /permit|building permit|city permit|county permit/i, label: 'Permits', cost: 1500 },
  { pattern: /dumpster|debris removal|haul away|demo removal/i, label: 'Debris removal', cost: 800 },
  { pattern: /engineer|structural review|structural engineer|architect review/i, label: 'Engineering review', cost: 2000 },
  { pattern: /asbestos|lead paint|lead abatement|hazmat|environmental/i, label: 'Hazmat remediation', cost: 5000 },
  { pattern: /subfloor|floor leveling|leveling compound|sister joist/i, label: 'Subfloor repair', cost: 2000 }
];

// Labor vs materials baseline ratios for red flag detection
export const LABOR_MATERIALS_BASELINE = {
  kitchen: { materialsMin: 0.45, materialsMax: 0.55, laborMin: 0.45, laborMax: 0.55 },
  bathroom: { materialsMin: 0.40, materialsMax: 0.50, laborMin: 0.50, laborMax: 0.60 },
  basement: { materialsMin: 0.35, materialsMax: 0.50, laborMin: 0.50, laborMax: 0.65 },
  general: { materialsMin: 0.40, materialsMax: 0.55, laborMin: 0.45, laborMax: 0.60 }
};

// Helper to get tier multipliers from tier number
export function getTierMultipliers(tier: 1 | 2 | 3 | 4 | 5): { low: number; high: number } {
  const tierMultipliers: Record<number, { low: number; high: number }> = {
    1: { low: 1.4, high: 1.6 },
    2: { low: 1.2, high: 1.4 },
    3: { low: 1.0, high: 1.15 },
    4: { low: 0.9, high: 1.0 },
    5: { low: 0.75, high: 0.9 }
  };
  return tierMultipliers[tier];
}
