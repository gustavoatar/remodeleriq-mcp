// =============================================================================
// UNIT TYPE ENGINE
// Determines the appropriate measurement unit for each project type
// and provides prompts for missing data
// =============================================================================

// Unit types for project pricing
export type UnitType = 'linear-feet' | 'square-feet' | 'per-unit' | 'flat-rate' | 'hybrid';

export interface UnitTypeConfig {
  unitType: UnitType;
  unitLabel: string;           // "Linear Feet", "Square Feet", "Units"
  unitAbbrev: string;          // "LF", "SF", "units"
  promptText: string;          // "How many linear feet of fencing?"
  helperText: string;          // "Tip: A typical residential fence is 150-300 linear feet"
  inputPlaceholder: string;    // "e.g., 200"
  inputMin?: number;
  inputMax?: number;
  // For hybrid projects that can use multiple units
  secondaryUnit?: {
    unitType: UnitType;
    unitLabel: string;
    unitAbbrev: string;
    promptText: string;
  };
}

// Benchmarks per unit type for sanity checking
export interface UnitBenchmark {
  low: number;
  median: number;
  high: number;
  premium?: number;
}

// =============================================================================
// PROJECT TYPE TO UNIT TYPE MAPPING
// =============================================================================

export const PROJECT_UNIT_CONFIG: Record<string, UnitTypeConfig> = {
  // LINEAR FEET PROJECTS
  'fence': {
    unitType: 'linear-feet',
    unitLabel: 'Linear Feet',
    unitAbbrev: 'LF',
    promptText: 'How many linear feet of fencing?',
    helperText: 'Tip: A typical residential fence is 100-300 linear feet. Measure the perimeter to be fenced.',
    inputPlaceholder: 'e.g., 150',
    inputMin: 10,
    inputMax: 2000,
  },
  'fence-repair': {
    unitType: 'linear-feet',
    unitLabel: 'Linear Feet',
    unitAbbrev: 'LF',
    promptText: 'How many linear feet of fence to repair?',
    helperText: 'Measure the sections that need repair or replacement.',
    inputPlaceholder: 'e.g., 50',
    inputMin: 1,
    inputMax: 500,
  },
  'gutters': {
    unitType: 'linear-feet',
    unitLabel: 'Linear Feet',
    unitAbbrev: 'LF',
    promptText: 'How many linear feet of gutters?',
    helperText: 'Measure along the roofline where gutters will be installed. Most homes are 100-200 LF.',
    inputPlaceholder: 'e.g., 150',
    inputMin: 20,
    inputMax: 500,
  },
  'railings': {
    unitType: 'linear-feet',
    unitLabel: 'Linear Feet',
    unitAbbrev: 'LF',
    promptText: 'How many linear feet of railing?',
    helperText: 'Measure the total length of railings to be installed.',
    inputPlaceholder: 'e.g., 40',
    inputMin: 4,
    inputMax: 200,
  },
  'baseboards': {
    unitType: 'linear-feet',
    unitLabel: 'Linear Feet',
    unitAbbrev: 'LF',
    promptText: 'How many linear feet of baseboard?',
    helperText: 'Measure the perimeter of rooms. Average room is 40-60 LF.',
    inputPlaceholder: 'e.g., 200',
    inputMin: 20,
    inputMax: 2000,
  },
  'crown-molding': {
    unitType: 'linear-feet',
    unitLabel: 'Linear Feet',
    unitAbbrev: 'LF',
    promptText: 'How many linear feet of crown molding?',
    helperText: 'Measure the perimeter of rooms at ceiling height.',
    inputPlaceholder: 'e.g., 150',
    inputMin: 20,
    inputMax: 1500,
  },
  'retaining-wall': {
    unitType: 'linear-feet',
    unitLabel: 'Linear Feet',
    unitAbbrev: 'LF',
    promptText: 'How many linear feet of retaining wall?',
    helperText: 'Measure the length of the wall. Height affects price significantly.',
    inputPlaceholder: 'e.g., 50',
    inputMin: 5,
    inputMax: 500,
  },
  
  // SQUARE FOOTAGE PROJECTS
  'flooring': {
    unitType: 'square-feet',
    unitLabel: 'Square Feet',
    unitAbbrev: 'SF',
    promptText: "What's the square footage to be floored?",
    helperText: 'Measure the rooms receiving new flooring. Include closets and hallways.',
    inputPlaceholder: 'e.g., 800',
    inputMin: 50,
    inputMax: 10000,
  },
  'painting-interior': {
    unitType: 'square-feet',
    unitLabel: 'Square Feet',
    unitAbbrev: 'SF',
    promptText: "What's the total square footage to paint?",
    helperText: 'Wall square footage = room perimeter × ceiling height. Most painters use home SF as proxy.',
    inputPlaceholder: 'e.g., 2000',
    inputMin: 100,
    inputMax: 20000,
  },
  'painting-exterior': {
    unitType: 'square-feet',
    unitLabel: 'Square Feet',
    unitAbbrev: 'SF',
    promptText: "What's the exterior square footage?",
    helperText: 'Exterior surface area. Many use home SF × 3 as estimate.',
    inputPlaceholder: 'e.g., 3000',
    inputMin: 500,
    inputMax: 30000,
  },
  'roofing': {
    unitType: 'square-feet',
    unitLabel: 'Square Feet',
    unitAbbrev: 'SF',
    promptText: "What's the roof square footage?",
    helperText: 'Roof area in square feet. Roofers often quote in "squares" (1 square = 100 SF).',
    inputPlaceholder: 'e.g., 2500',
    inputMin: 500,
    inputMax: 10000,
  },
  'siding': {
    unitType: 'square-feet',
    unitLabel: 'Square Feet',
    unitAbbrev: 'SF',
    promptText: "What's the siding square footage?",
    helperText: 'Exterior wall area minus windows and doors.',
    inputPlaceholder: 'e.g., 1500',
    inputMin: 200,
    inputMax: 10000,
  },
  'drywall': {
    unitType: 'square-feet',
    unitLabel: 'Square Feet',
    unitAbbrev: 'SF',
    promptText: "What's the drywall square footage?",
    helperText: 'Total wall and ceiling area to be drywalled.',
    inputPlaceholder: 'e.g., 1200',
    inputMin: 50,
    inputMax: 20000,
  },
  'deck': {
    unitType: 'square-feet',
    unitLabel: 'Square Feet',
    unitAbbrev: 'SF',
    promptText: "What's the deck square footage?",
    helperText: 'Deck surface area (length × width).',
    inputPlaceholder: 'e.g., 300',
    inputMin: 50,
    inputMax: 2000,
  },
  'tile': {
    unitType: 'square-feet',
    unitLabel: 'Square Feet',
    unitAbbrev: 'SF',
    promptText: "What's the tile square footage?",
    helperText: 'Floor and/or wall area to be tiled.',
    inputPlaceholder: 'e.g., 150',
    inputMin: 10,
    inputMax: 5000,
  },
  
  // PER-UNIT PROJECTS
  'windows': {
    unitType: 'per-unit',
    unitLabel: 'Windows',
    unitAbbrev: 'windows',
    promptText: 'How many windows?',
    helperText: 'Count each window opening. Bay/bow windows count as one.',
    inputPlaceholder: 'e.g., 8',
    inputMin: 1,
    inputMax: 100,
  },
  'doors-interior': {
    unitType: 'per-unit',
    unitLabel: 'Doors',
    unitAbbrev: 'doors',
    promptText: 'How many interior doors?',
    helperText: 'Count each door, including closet doors.',
    inputPlaceholder: 'e.g., 6',
    inputMin: 1,
    inputMax: 50,
  },
  'doors-exterior': {
    unitType: 'per-unit',
    unitLabel: 'Doors',
    unitAbbrev: 'doors',
    promptText: 'How many exterior doors?',
    helperText: 'Count entry doors, patio doors, garage service doors.',
    inputPlaceholder: 'e.g., 2',
    inputMin: 1,
    inputMax: 10,
  },
  'light-fixtures': {
    unitType: 'per-unit',
    unitLabel: 'Fixtures',
    unitAbbrev: 'fixtures',
    promptText: 'How many light fixtures?',
    helperText: 'Count each fixture to be installed or replaced.',
    inputPlaceholder: 'e.g., 10',
    inputMin: 1,
    inputMax: 100,
  },
  'outlets': {
    unitType: 'per-unit',
    unitLabel: 'Outlets',
    unitAbbrev: 'outlets',
    promptText: 'How many outlets?',
    helperText: 'Count each outlet to be installed or replaced.',
    inputPlaceholder: 'e.g., 15',
    inputMin: 1,
    inputMax: 200,
  },
  'toilets': {
    unitType: 'per-unit',
    unitLabel: 'Toilets',
    unitAbbrev: 'toilets',
    promptText: 'How many toilets?',
    helperText: 'Count each toilet to be installed or replaced.',
    inputPlaceholder: 'e.g., 2',
    inputMin: 1,
    inputMax: 20,
  },
  'hvac-units': {
    unitType: 'per-unit',
    unitLabel: 'Units',
    unitAbbrev: 'units',
    promptText: 'How many HVAC units?',
    helperText: 'Count each AC unit, furnace, or heat pump.',
    inputPlaceholder: 'e.g., 1',
    inputMin: 1,
    inputMax: 10,
  },
  'water-heaters': {
    unitType: 'per-unit',
    unitLabel: 'Units',
    unitAbbrev: 'units',
    promptText: 'How many water heaters?',
    helperText: 'Usually 1, may be 2 for larger homes.',
    inputPlaceholder: 'e.g., 1',
    inputMin: 1,
    inputMax: 5,
  },
  'appliances': {
    unitType: 'per-unit',
    unitLabel: 'Appliances',
    unitAbbrev: 'appliances',
    promptText: 'How many appliances?',
    helperText: 'Count refrigerator, stove, dishwasher, etc.',
    inputPlaceholder: 'e.g., 4',
    inputMin: 1,
    inputMax: 20,
  },
  
  // FLAT-RATE / COMPLEX PROJECTS (use square feet as proxy)
  'kitchen': {
    unitType: 'square-feet',
    unitLabel: 'Square Feet',
    unitAbbrev: 'SF',
    promptText: "What's the kitchen square footage?",
    helperText: 'Typical kitchens are 100-250 SF. Measure floor area.',
    inputPlaceholder: 'e.g., 150',
    inputMin: 50,
    inputMax: 500,
  },
  'bathroom': {
    unitType: 'square-feet',
    unitLabel: 'Square Feet',
    unitAbbrev: 'SF',
    promptText: "What's the bathroom square footage?",
    helperText: 'Typical bathrooms: half-bath 20-30 SF, full bath 40-60 SF, master 80-150 SF.',
    inputPlaceholder: 'e.g., 80',
    inputMin: 15,
    inputMax: 300,
  },
  'basement': {
    unitType: 'square-feet',
    unitLabel: 'Square Feet',
    unitAbbrev: 'SF',
    promptText: "What's the basement square footage?",
    helperText: 'Total basement area to be finished or remodeled.',
    inputPlaceholder: 'e.g., 800',
    inputMin: 100,
    inputMax: 5000,
  },
  
  // DEFAULT for unknown
  'general': {
    unitType: 'square-feet',
    unitLabel: 'Square Feet',
    unitAbbrev: 'SF',
    promptText: "What's the project square footage?",
    helperText: 'Enter the area being worked on.',
    inputPlaceholder: 'e.g., 500',
    inputMin: 10,
    inputMax: 50000,
  },
};

// =============================================================================
// UNIT BENCHMARKS (price per unit for sanity checking)
// =============================================================================

export const UNIT_BENCHMARKS: Record<string, UnitBenchmark> = {
  // Linear feet projects ($/LF)
  'fence': { low: 20, median: 35, high: 55, premium: 80 },           // Wood fence
  'fence-vinyl': { low: 25, median: 40, high: 60, premium: 85 },     // Vinyl fence
  'fence-chain': { low: 10, median: 18, high: 28 },                  // Chain link
  'fence-wrought-iron': { low: 50, median: 80, high: 120, premium: 200 },
  'fence-repair': { low: 15, median: 25, high: 40 },
  'gutters': { low: 8, median: 15, high: 25, premium: 40 },          // Seamless aluminum
  'gutters-copper': { low: 30, median: 50, high: 80 },
  'railings-wood': { low: 50, median: 100, high: 175 },
  'railings-metal': { low: 75, median: 150, high: 250, premium: 400 },
  'railings-cable': { low: 100, median: 175, high: 275 },
  'baseboards': { low: 4, median: 7, high: 12, premium: 20 },
  'crown-molding': { low: 6, median: 12, high: 20, premium: 35 },
  'retaining-wall': { low: 25, median: 50, high: 100, premium: 200 }, // Per LF, varies by height
  
  // Square feet projects ($/SF)
  'flooring-carpet': { low: 3, median: 6, high: 12 },
  'flooring-lvp': { low: 5, median: 9, high: 14 },
  'flooring-hardwood': { low: 8, median: 14, high: 22, premium: 35 },
  'flooring-tile': { low: 10, median: 18, high: 30, premium: 50 },
  'painting-interior': { low: 2, median: 4, high: 7 },
  'painting-exterior': { low: 2.5, median: 5, high: 9 },
  'roofing-asphalt': { low: 4, median: 7, high: 12 },
  'roofing-metal': { low: 10, median: 16, high: 25 },
  'siding-vinyl': { low: 5, median: 9, high: 14 },
  'siding-fiber-cement': { low: 8, median: 14, high: 22 },
  'drywall': { low: 2, median: 4, high: 7 },
  'deck-wood': { low: 25, median: 40, high: 60 },
  'deck-composite': { low: 35, median: 55, high: 85, premium: 120 },
  'tile': { low: 12, median: 22, high: 40, premium: 75 },
  
  // Per-unit projects ($/unit)
  'windows-vinyl': { low: 400, median: 700, high: 1000, premium: 1500 },
  'windows-wood': { low: 800, median: 1400, high: 2200, premium: 3500 },
  'windows-bay': { low: 1500, median: 2500, high: 4000, premium: 6000 },
  'doors-interior': { low: 200, median: 400, high: 700, premium: 1200 },
  'doors-exterior': { low: 500, median: 1200, high: 2500, premium: 5000 },
  'doors-patio': { low: 1200, median: 2500, high: 4500, premium: 8000 },
  'light-fixtures': { low: 100, median: 250, high: 500, premium: 1500 },
  'outlets': { low: 100, median: 175, high: 275 },
  'toilets': { low: 250, median: 500, high: 900, premium: 2000 },
  'hvac-units': { low: 4000, median: 7000, high: 12000, premium: 20000 },
  'water-heaters': { low: 1000, median: 1800, high: 3000, premium: 5000 },
};

// =============================================================================
// PROJECT TYPE ALIASES (maps various names to canonical keys)
// =============================================================================

const PROJECT_TYPE_ALIASES: Record<string, string> = {
  // Fence variations
  'fencing': 'fence',
  'fence build': 'fence',
  'fence installation': 'fence',
  'new fence': 'fence',
  'fence replacement': 'fence',
  'privacy fence': 'fence',
  'wood fence': 'fence',
  'vinyl fence': 'fence',
  'chain link fence': 'fence',
  'fence-repair': 'fence-repair',
  'fence repair': 'fence-repair',
  
  // Gutter variations
  'gutter': 'gutters',
  'gutter installation': 'gutters',
  'gutter replacement': 'gutters',
  'seamless gutters': 'gutters',
  
  // Railing variations
  'railing': 'railings',
  'handrail': 'railings',
  'handrails': 'railings',
  'stair railing': 'railings',
  'deck railing': 'railings',
  
  // Flooring variations
  'flooring install': 'flooring',
  'flooring installation': 'flooring',
  'new flooring': 'flooring',
  'hardwood': 'flooring',
  'lvp': 'flooring',
  'laminate': 'flooring',
  'carpet': 'flooring',
  'tile flooring': 'flooring',
  
  // Painting variations
  'painting': 'painting-interior',
  'interior painting': 'painting-interior',
  'house painting': 'painting-interior',
  'exterior painting': 'painting-exterior',
  
  // Window variations
  'window': 'windows',
  'window replacement': 'windows',
  'new windows': 'windows',
  
  // Door variations
  'interior door': 'doors-interior',
  'interior doors': 'doors-interior',
  'exterior door': 'doors-exterior',
  'exterior doors': 'doors-exterior',
  'entry door': 'doors-exterior',
  'front door': 'doors-exterior',
  
  // Kitchen/Bath variations
  'kitchen remodel': 'kitchen',
  'kitchen renovation': 'kitchen',
  'bathroom remodel': 'bathroom',
  'bath remodel': 'bathroom',
  'bathroom renovation': 'bathroom',
  
  // Deck variations
  'deck build': 'deck',
  'deck construction': 'deck',
  'new deck': 'deck',
  'deck replacement': 'deck',
  'deck/patio': 'deck',
  
  // Roofing variations
  'roof': 'roofing',
  'roof replacement': 'roofing',
  'new roof': 'roofing',
  're-roof': 'roofing',
  'reroof': 'roofing',
  
  // Basement variations
  'basement finishing': 'basement',
  'basement remodel': 'basement',
  'finish basement': 'basement',
  
  // General/other
  'full home renovation': 'general',
  'whole home remodel': 'general',
  'general contractor': 'general',
  'other': 'general',
};

// =============================================================================
// FALLBACK / LOW CONFIDENCE CATEGORIES
// These indicate we couldn't confidently classify the project
// =============================================================================

export const LOW_CONFIDENCE_CATEGORIES = [
  'general',
  'general-handyman',
  'unknown',
  'other',
];

// =============================================================================
// MAIN FUNCTIONS
// =============================================================================

/**
 * Get unit configuration for a project type
 */
export function getUnitConfig(projectType: string): UnitTypeConfig {
  const normalizedType = normalizeProjectType(projectType);
  return PROJECT_UNIT_CONFIG[normalizedType] || PROJECT_UNIT_CONFIG['general'];
}

/**
 * Normalize project type to canonical key
 */
export function normalizeProjectType(projectType: string): string {
  const lower = projectType.toLowerCase().trim();
  
  // Check direct match
  if (PROJECT_UNIT_CONFIG[lower]) {
    return lower;
  }
  
  // Check aliases
  if (PROJECT_TYPE_ALIASES[lower]) {
    return PROJECT_TYPE_ALIASES[lower];
  }
  
  // Fuzzy match - check if any key is contained
  for (const key of Object.keys(PROJECT_UNIT_CONFIG)) {
    if (lower.includes(key) || key.includes(lower)) {
      return key;
    }
  }
  
  // Check aliases with fuzzy match
  for (const [alias, canonical] of Object.entries(PROJECT_TYPE_ALIASES)) {
    if (lower.includes(alias) || alias.includes(lower)) {
      return canonical;
    }
  }
  
  return 'general';
}

/**
 * Detect if we need a specific unit measurement
 * Returns true if project requires LF, per-unit, or is SF-dependent
 */
export function requiresUnitMeasurement(projectType: string): boolean {
  const config = getUnitConfig(projectType);
  return config.unitType !== 'flat-rate';
}

/**
 * Check if a project type is a low-confidence fallback
 */
export function isLowConfidenceCategory(projectType: string): boolean {
  const lower = projectType.toLowerCase().trim();
  return LOW_CONFIDENCE_CATEGORIES.some(cat => 
    lower === cat || lower.includes(cat) || cat.includes(lower)
  );
}

/**
 * Determine if blind bid analysis would produce absurd results
 * Returns gating information
 */
export interface BlindBidGateResult {
  shouldGate: boolean;
  reason: string;
  suggestedAction: 'prompt-measurement' | 'prompt-project-type' | 'allow';
  unitConfig?: UnitTypeConfig;
}

export function checkBlindBidGate(
  projectType: string,
  hasMeasurement: boolean,
  fingerprintConfidence?: number,
  bidAmount?: number,
  estimatedMarketLow?: number,
  estimatedMarketHigh?: number
): BlindBidGateResult {
  const normalizedType = normalizeProjectType(projectType);
  const config = getUnitConfig(normalizedType);
  const isLowConfidence = isLowConfidenceCategory(normalizedType);
  
  // Gate 1: Low confidence project type without measurement
  if (isLowConfidence && !hasMeasurement) {
    return {
      shouldGate: true,
      reason: "We couldn't confidently identify this project type. Please provide more details.",
      suggestedAction: 'prompt-project-type',
      unitConfig: config,
    };
  }
  
  // Gate 2: Linear feet or per-unit project without measurement
  if ((config.unitType === 'linear-feet' || config.unitType === 'per-unit') && !hasMeasurement) {
    return {
      shouldGate: true,
      reason: `${projectType} projects are priced by ${config.unitLabel.toLowerCase()}. Please provide the quantity.`,
      suggestedAction: 'prompt-measurement',
      unitConfig: config,
    };
  }
  
  // Gate 3: Fingerprint confidence too low
  if (fingerprintConfidence !== undefined && fingerprintConfidence < 40 && !hasMeasurement) {
    return {
      shouldGate: true,
      reason: "We need more information to analyze this bid accurately.",
      suggestedAction: 'prompt-measurement',
      unitConfig: config,
    };
  }
  
  // Gate 4: Absurd variance (bid is <10% or >500% of market range)
  if (bidAmount && estimatedMarketLow && estimatedMarketHigh) {
    const bidVsLow = bidAmount / estimatedMarketLow;
    const bidVsHigh = bidAmount / estimatedMarketHigh;
    
    if (bidVsLow < 0.10 || bidVsHigh > 5) {
      return {
        shouldGate: true,
        reason: "The price variance is unusual. Please verify the project details.",
        suggestedAction: 'prompt-measurement',
        unitConfig: config,
      };
    }
  }
  
  return {
    shouldGate: false,
    reason: '',
    suggestedAction: 'allow',
    unitConfig: config,
  };
}

/**
 * Detect project type from bid text with enhanced fence/gutter/etc detection
 */
export function detectProjectTypeFromText(text: string): { 
  projectType: string; 
  confidence: 'high' | 'medium' | 'low';
  unitConfig: UnitTypeConfig;
} {
  const lower = text.toLowerCase();
  
  // Linear feet project detection
  const linearFeetPatterns = [
    { pattern: /\b(fence|fencing|privacy\s*fence|wood\s*fence|vinyl\s*fence|chain\s*link)\b/i, type: 'fence', confidence: 'high' as const },
    { pattern: /\b(gutter|gutters|seamless\s*gutter|gutter\s*install)\b/i, type: 'gutters', confidence: 'high' as const },
    { pattern: /\b(railing|railings|handrail|balustrade|deck\s*railing|stair\s*rail)\b/i, type: 'railings', confidence: 'high' as const },
    { pattern: /\b(baseboard|baseboards|base\s*board|quarter\s*round)\b/i, type: 'baseboards', confidence: 'medium' as const },
    { pattern: /\b(crown\s*molding|crown\s*moulding|cornice)\b/i, type: 'crown-molding', confidence: 'high' as const },
    { pattern: /\b(retaining\s*wall|retaining)\b/i, type: 'retaining-wall', confidence: 'high' as const },
  ];
  
  for (const { pattern, type, confidence } of linearFeetPatterns) {
    if (pattern.test(lower)) {
      return { projectType: type, confidence, unitConfig: PROJECT_UNIT_CONFIG[type] };
    }
  }
  
  // Per-unit project detection
  const perUnitPatterns = [
    { pattern: /\b(window|windows)\s*(replacement|install|new)?\b/i, type: 'windows', confidence: 'high' as const },
    { pattern: /\b(exterior\s*door|entry\s*door|front\s*door)\b/i, type: 'doors-exterior', confidence: 'high' as const },
    { pattern: /\b(interior\s*door|closet\s*door)\b/i, type: 'doors-interior', confidence: 'medium' as const },
    { pattern: /\b(outlet|outlets|receptacle)\s*(install|replace)?\b/i, type: 'outlets', confidence: 'medium' as const },
    { pattern: /\b(light\s*fixture|lighting|chandelier|pendant)\b/i, type: 'light-fixtures', confidence: 'medium' as const },
    { pattern: /\b(toilet|commode)\s*(install|replace)?\b/i, type: 'toilets', confidence: 'high' as const },
    { pattern: /\b(water\s*heater|hot\s*water\s*tank)\b/i, type: 'water-heaters', confidence: 'high' as const },
    { pattern: /\b(hvac|furnace|air\s*condition|ac\s*unit|heat\s*pump)\b/i, type: 'hvac-units', confidence: 'high' as const },
  ];
  
  for (const { pattern, type, confidence } of perUnitPatterns) {
    if (pattern.test(lower)) {
      return { projectType: type, confidence, unitConfig: PROJECT_UNIT_CONFIG[type] };
    }
  }
  
  // Square footage project detection
  const sqftPatterns = [
    { pattern: /\b(kitchen)\s*(remodel|renovation|reno)?\b/i, type: 'kitchen', confidence: 'high' as const },
    { pattern: /\b(bathroom|bath)\s*(remodel|renovation|reno)?\b/i, type: 'bathroom', confidence: 'high' as const },
    { pattern: /\b(basement)\s*(finish|remodel|renovation)?\b/i, type: 'basement', confidence: 'high' as const },
    { pattern: /\b(flooring|floor|hardwood|lvp|laminate|carpet|tile\s*floor)\b/i, type: 'flooring', confidence: 'high' as const },
    { pattern: /\b(paint|painting)\s*(interior|house)?\b/i, type: 'painting-interior', confidence: 'medium' as const },
    { pattern: /\b(exterior\s*paint|paint\s*exterior)\b/i, type: 'painting-exterior', confidence: 'high' as const },
    { pattern: /\b(roof|roofing|re-roof|shingle)\b/i, type: 'roofing', confidence: 'high' as const },
    { pattern: /\b(siding|vinyl\s*siding|hardie)\b/i, type: 'siding', confidence: 'high' as const },
    { pattern: /\b(deck|patio|deck\s*build)\b/i, type: 'deck', confidence: 'high' as const },
    { pattern: /\b(drywall|sheetrock)\b/i, type: 'drywall', confidence: 'medium' as const },
  ];
  
  for (const { pattern, type, confidence } of sqftPatterns) {
    if (pattern.test(lower)) {
      return { projectType: type, confidence, unitConfig: PROJECT_UNIT_CONFIG[type] };
    }
  }
  
  // Default fallback
  return { 
    projectType: 'general', 
    confidence: 'low', 
    unitConfig: PROJECT_UNIT_CONFIG['general'] 
  };
}

/**
 * Calculate price estimate using unit-based benchmarks
 */
export function calculateUnitBasedEstimate(
  projectType: string,
  unitCount: number,
  qualityTier: 'budget' | 'standard' | 'premium' = 'standard'
): { low: number; median: number; high: number } | null {
  const normalizedType = normalizeProjectType(projectType);
  const benchmark = UNIT_BENCHMARKS[normalizedType];
  
  if (!benchmark) {
    return null;
  }
  
  let multiplier = 1;
  if (qualityTier === 'budget') multiplier = 0.85;
  if (qualityTier === 'premium') multiplier = 1.25;
  
  return {
    low: Math.round(benchmark.low * unitCount * multiplier),
    median: Math.round(benchmark.median * unitCount * multiplier),
    high: Math.round((benchmark.premium || benchmark.high) * unitCount * multiplier),
  };
}
