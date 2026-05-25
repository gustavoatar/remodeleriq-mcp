/**
 * Cost Allocation Engine
 * 
 * Analyzes bid line items to detect:
 * 1. Project-level allocation outliers (labor/material/permit ratios vs total)
 * 2. Trade-specific labor/material split anomalies
 * 
 * @see https://docs.google.com/... (customer-provided benchmarks)
 */

// =============================================================================
// TYPES
// =============================================================================

export type LineItemCategory = 'labor' | 'material' | 'permit' | 'overhead' | 'contingency' | 'profit' | 'unknown';

export interface LineItem {
  description: string;
  amount: number;
  category: LineItemCategory;
  trade?: string;
  laborAmount?: number;
  materialAmount?: number;
}

export interface AllocationBand {
  min: number;
  max: number;
  flag?: string;
  severity?: 'low' | 'medium' | 'high';
}

export interface TradeLaborBenchmark {
  laborMin: number;
  laborMax: number;
  description?: string;
}

export interface AllocationResult {
  totalAnalyzed: number;
  breakdown: {
    labor: { amount: number; percent: number; inRange: boolean };
    material: { amount: number; percent: number; inRange: boolean };
    permit: { amount: number; percent: number; inRange: boolean };
    overhead: { amount: number; percent: number; inRange: boolean };
    contingency: { amount: number; percent: number; inRange: boolean };
    profit: { amount: number; percent: number; inRange: boolean };
    unknown: { amount: number; percent: number };
  };
  flags: AllocationFlag[];
  confidence: number;
}

export interface AllocationFlag {
  type: string;
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  actual: number;
  expected: { min: number; max: number };
}

export interface LaborSplitResult {
  trade: string;
  laborPercent: number;
  materialPercent: number;
  inRange: boolean;
  flag?: AllocationFlag;
}

// =============================================================================
// PROJECT-LEVEL ALLOCATION BANDS
// =============================================================================

/**
 * Typical cost allocation bands for whole-project analysis.
 * Used to sanity-check that a bid's total breakdown is plausible.
 */
export const PROJECT_ALLOCATION_BANDS: Record<Exclude<LineItemCategory, 'unknown'>, AllocationBand> = {
  labor: { min: 0.30, max: 0.40, flag: 'labor-allocation-high', severity: 'medium' },
  material: { min: 0.40, max: 0.50, flag: 'material-allocation-high', severity: 'medium' },
  permit: { min: 0.05, max: 0.10, flag: 'permit-allocation-high', severity: 'low' },
  overhead: { min: 0.10, max: 0.15, flag: 'overhead-allocation-high', severity: 'low' },
  contingency: { min: 0.05, max: 0.10, flag: 'contingency-allocation-high', severity: 'low' },
  profit: { min: 0.04, max: 0.05, flag: 'profit-allocation-high', severity: 'low' }
};

/**
 * Project-type specific adjustments to allocation bands.
 * Some project types legitimately have different ratios.
 */
export const PROJECT_TYPE_ADJUSTMENTS: Record<string, Partial<Record<LineItemCategory, AllocationBand>>> = {
  'kitchen': {
    material: { min: 0.50, max: 0.65 }, // Cabinets/appliances are expensive
    labor: { min: 0.25, max: 0.35 }
  },
  'bathroom': {
    material: { min: 0.45, max: 0.55 },
    labor: { min: 0.30, max: 0.40 }
  },
  'painting': {
    labor: { min: 0.65, max: 0.80 },
    material: { min: 0.15, max: 0.30 }
  },
  'roofing': {
    material: { min: 0.45, max: 0.60 },
    labor: { min: 0.35, max: 0.50 }
  },
  'hvac': {
    material: { min: 0.50, max: 0.65 }, // Equipment costs
    labor: { min: 0.30, max: 0.45 }
  },
  'adu': {
    permit: { min: 0.08, max: 0.18 } // California ADUs have high permit costs
  }
};

// =============================================================================
// TRADE-SPECIFIC LABOR/MATERIAL BENCHMARKS
// =============================================================================

/**
 * Expected labor share by trade.
 * Used to flag line items where labor/material split looks suspicious.
 */
export const TRADE_LABOR_BENCHMARKS: Record<string, TradeLaborBenchmark> = {
  // High labor trades (70%+ labor typical)
  'painting': { laborMin: 0.70, laborMax: 0.80, description: 'Paint is cheap, labor is the cost' },
  'drywall': { laborMin: 0.65, laborMax: 0.75, description: 'Hanging and finishing is labor-intensive' },
  
  // Medium-high labor trades (55-70% labor)
  'electrical': { laborMin: 0.60, laborMax: 0.70, description: 'Wire is inexpensive relative to skilled labor' },
  'plumbing': { laborMin: 0.55, laborMax: 0.65, description: 'Rough plumbing is very labor heavy' },
  'tile': { laborMin: 0.50, laborMax: 0.60, description: 'Varies widely by tile grade' },
  'carpentry': { laborMin: 0.55, laborMax: 0.65, description: 'Trim and finish carpentry' },
  'framing': { laborMin: 0.50, laborMax: 0.60, description: 'Lumber costs vary seasonally' },
  
  // Medium labor trades (45-55% labor)
  'hvac': { laborMin: 0.45, laborMax: 0.55, description: 'Equipment is major cost' },
  'roofing': { laborMin: 0.45, laborMax: 0.55, description: 'Shingles/metal are material-heavy' },
  'flooring': { laborMin: 0.40, laborMax: 0.55, description: 'Hardwood vs LVP changes ratio' },
  'insulation': { laborMin: 0.45, laborMax: 0.55, description: 'Material type matters' },
  
  // Low labor trades (30-45% labor)
  'cabinets': { laborMin: 0.30, laborMax: 0.45, description: 'Cabinets are major material cost' },
  'windows': { laborMin: 0.35, laborMax: 0.50, description: 'Window units are expensive' },
  'countertops': { laborMin: 0.30, laborMax: 0.45, description: 'Granite/quartz are costly materials' },
  'appliances': { laborMin: 0.15, laborMax: 0.30, description: 'Almost all material cost' }
};

// =============================================================================
// LINE ITEM CLASSIFICATION
// =============================================================================

const LABOR_KEYWORDS = [
  'labor', 'install', 'installation', 'removal', 'demolition', 'demo',
  'tear out', 'tearout', 'prep', 'preparation', 'finishing', 'finish work',
  'manhours', 'man hours', 'hourly', 'service call', 'workmanship',
  'craftsmanship', 'skilled labor', 'journeyman', 'apprentice'
];

const MATERIAL_KEYWORDS = [
  'material', 'materials', 'supplies', 'product', 'products', 'equipment',
  'fixture', 'fixtures', 'hardware', 'lumber', 'drywall', 'paint', 'stain',
  'tile', 'flooring', 'carpet', 'vinyl', 'laminate', 'hardwood', 'cabinets',
  'countertop', 'appliance', 'faucet', 'toilet', 'sink', 'vanity', 'tub',
  'shower', 'window', 'door', 'roofing', 'shingle', 'siding', 'insulation',
  'wire', 'wiring', 'pipe', 'piping', 'ductwork', 'hvac unit', 'furnace',
  'ac unit', 'water heater', 'panel', 'breaker', 'outlet', 'switch'
];

const PERMIT_KEYWORDS = [
  'permit', 'permits', 'inspection', 'inspections', 'fee', 'fees',
  'building permit', 'electrical permit', 'plumbing permit', 'mechanical permit',
  'city fee', 'county fee', 'impact fee', 'plan check', 'plan review'
];

const OVERHEAD_KEYWORDS = [
  'overhead', 'design', 'architectural', 'engineering', 'plans', 'drawings',
  'project management', 'supervision', 'coordination', 'admin', 'administrative',
  'insurance', 'bonding', 'warranty', 'mobilization', 'setup', 'cleanup',
  'dumpster', 'waste removal', 'debris removal', 'protection', 'temporary'
];

const CONTINGENCY_KEYWORDS = [
  'contingency', 'allowance', 'unforeseen', 'unexpected', 'buffer',
  'change order', 'reserve', 'miscellaneous', 'misc'
];

const PROFIT_KEYWORDS = [
  'profit', 'margin', 'markup', 'contractor fee', 'gc fee', 'management fee'
];

/**
 * Classify a line item description into a cost category.
 */
export function classifyLineItem(text: string): LineItemCategory {
  const lower = text.toLowerCase();
  
  // Check in order of specificity
  if (PROFIT_KEYWORDS.some(k => lower.includes(k))) return 'profit';
  if (CONTINGENCY_KEYWORDS.some(k => lower.includes(k))) return 'contingency';
  if (PERMIT_KEYWORDS.some(k => lower.includes(k))) return 'permit';
  if (OVERHEAD_KEYWORDS.some(k => lower.includes(k))) return 'overhead';
  
  // Labor vs material is trickier - check for explicit mentions
  const hasLaborKeyword = LABOR_KEYWORDS.some(k => lower.includes(k));
  const hasMaterialKeyword = MATERIAL_KEYWORDS.some(k => lower.includes(k));
  
  if (hasLaborKeyword && !hasMaterialKeyword) return 'labor';
  if (hasMaterialKeyword && !hasLaborKeyword) return 'material';
  
  // If both or neither, check for common patterns
  if (lower.includes(' - labor') || lower.endsWith(' labor')) return 'labor';
  if (lower.includes(' - material') || lower.endsWith(' materials')) return 'material';
  
  return 'unknown';
}

/**
 * Detect the trade from a line item description.
 * Returns normalized trade key or undefined if not detected.
 */
export function detectTradeFromLineItem(text: string): string | undefined {
  const lower = text.toLowerCase();
  
  const tradePatterns: [string, RegExp[]][] = [
    ['painting', [/paint/i, /stain/i, /primer/i]],
    ['electrical', [/electric/i, /wiring/i, /outlet/i, /switch/i, /panel/i, /breaker/i]],
    ['plumbing', [/plumb/i, /pipe/i, /faucet/i, /toilet/i, /drain/i, /water heater/i]],
    ['drywall', [/drywall/i, /sheetrock/i, /gypsum/i]],
    ['roofing', [/roof/i, /shingle/i, /gutter/i, /flashing/i]],
    ['tile', [/tile/i, /grout/i, /backsplash/i]],
    ['hvac', [/hvac/i, /furnace/i, /air condition/i, /\bac\b/i, /ductwork/i, /duct/i]],
    ['flooring', [/floor/i, /hardwood/i, /laminate/i, /lvp/i, /carpet/i, /vinyl plank/i]],
    ['cabinets', [/cabinet/i, /cupboard/i]],
    ['windows', [/window/i]],
    ['countertops', [/counter/i, /granite/i, /quartz/i, /marble/i]],
    ['framing', [/fram/i, /stud/i, /joist/i, /rafter/i]],
    ['insulation', [/insulation/i, /r-value/i, /spray foam/i]],
    ['carpentry', [/trim/i, /molding/i, /baseboard/i, /crown/i, /casing/i]],
    ['appliances', [/appliance/i, /refrigerator/i, /dishwasher/i, /range/i, /oven/i, /microwave/i]]
  ];
  
  for (const [trade, patterns] of tradePatterns) {
    if (patterns.some(p => p.test(lower))) {
      return trade;
    }
  }
  
  return undefined;
}

// =============================================================================
// ALLOCATION ANALYSIS
// =============================================================================

/**
 * Analyze a set of line items to check project-level cost allocation.
 * Returns breakdown percentages and flags for any outliers.
 */
export function analyzeAllocation(
  lineItems: LineItem[],
  bidTotal: number,
  projectType?: string
): AllocationResult {
  // Initialize breakdown
  const breakdown: AllocationResult['breakdown'] = {
    labor: { amount: 0, percent: 0, inRange: true },
    material: { amount: 0, percent: 0, inRange: true },
    permit: { amount: 0, percent: 0, inRange: true },
    overhead: { amount: 0, percent: 0, inRange: true },
    contingency: { amount: 0, percent: 0, inRange: true },
    profit: { amount: 0, percent: 0, inRange: true },
    unknown: { amount: 0, percent: 0 }
  };
  
  const flags: AllocationFlag[] = [];
  
  // Sum up amounts by category
  for (const item of lineItems) {
    breakdown[item.category].amount += item.amount;
  }
  
  // Calculate percentages
  const effectiveTotal = bidTotal > 0 ? bidTotal : 
    Object.values(breakdown).reduce((sum, cat) => sum + cat.amount, 0);
  
  if (effectiveTotal === 0) {
    return {
      totalAnalyzed: 0,
      breakdown,
      flags: [],
      confidence: 0
    };
  }
  
  for (const category of Object.keys(breakdown) as (keyof typeof breakdown)[]) {
    breakdown[category].percent = breakdown[category].amount / effectiveTotal;
  }
  
  // Get applicable bands (project-type adjusted if available)
  const adjustments = projectType ? PROJECT_TYPE_ADJUSTMENTS[projectType.toLowerCase()] : undefined;
  
  // Check each category against bands
  const categoriesToCheck: (Exclude<LineItemCategory, 'unknown'>)[] = 
    ['labor', 'material', 'permit', 'overhead', 'contingency', 'profit'];
  
  for (const category of categoriesToCheck) {
    const defaultBand = PROJECT_ALLOCATION_BANDS[category];
    const adjustedBand = adjustments?.[category];
    const band = { ...defaultBand, ...adjustedBand };
    
    const percent = breakdown[category].percent;
    
    // Only flag if category has meaningful amount (>1% of total)
    if (percent < 0.01) continue;
    
    // Check if out of range
    if (percent > band.max) {
      breakdown[category].inRange = false;
      flags.push({
        type: band.flag || `${category}-allocation-high`,
        severity: band.severity || 'medium',
        title: `${capitalize(category)} costs are unusually high`,
        description: `${capitalize(category)} is ${formatPercent(percent)} of the bid, but typically ranges from ${formatPercent(band.min)} to ${formatPercent(band.max)}${projectType ? ` for ${projectType} projects` : ''}.`,
        actual: percent,
        expected: { min: band.min, max: band.max }
      });
    } else if (percent < band.min && percent > 0.05) {
      // Only flag low if it's a substantial category (>5%)
      breakdown[category].inRange = false;
      flags.push({
        type: `${category}-allocation-low`,
        severity: 'low',
        title: `${capitalize(category)} costs seem low`,
        description: `${capitalize(category)} is only ${formatPercent(percent)} of the bid. Typical range is ${formatPercent(band.min)} to ${formatPercent(band.max)}. This could indicate costs are bundled elsewhere.`,
        actual: percent,
        expected: { min: band.min, max: band.max }
      });
    } else {
      breakdown[category].inRange = true;
    }
  }
  
  // Calculate confidence based on how much we could classify
  const classifiedPercent = 1 - breakdown.unknown.percent;
  const confidence = Math.min(100, Math.round(classifiedPercent * 100));
  
  return {
    totalAnalyzed: lineItems.length,
    breakdown,
    flags,
    confidence
  };
}

// =============================================================================
// TRADE LABOR SPLIT ANALYSIS
// =============================================================================

/**
 * Analyze the labor/material split for a specific trade line item.
 * Returns whether the split is within expected range.
 */
export function analyzeTradeLaborSplit(
  trade: string,
  laborAmount: number,
  materialAmount: number
): LaborSplitResult {
  const total = laborAmount + materialAmount;
  if (total === 0) {
    return {
      trade,
      laborPercent: 0,
      materialPercent: 0,
      inRange: true
    };
  }
  
  const laborPercent = laborAmount / total;
  const materialPercent = materialAmount / total;
  
  const benchmark = TRADE_LABOR_BENCHMARKS[trade.toLowerCase()];
  
  if (!benchmark) {
    // No benchmark for this trade - can't validate
    return {
      trade,
      laborPercent,
      materialPercent,
      inRange: true
    };
  }
  
  const inRange = laborPercent >= benchmark.laborMin && laborPercent <= benchmark.laborMax;
  
  const result: LaborSplitResult = {
    trade,
    laborPercent,
    materialPercent,
    inRange
  };
  
  if (!inRange) {
    if (laborPercent < benchmark.laborMin) {
      result.flag = {
        type: 'labor-split-low',
        severity: 'medium',
        title: `${capitalize(trade)} labor share looks low`,
        description: `Labor is ${formatPercent(laborPercent)} of ${trade} costs, but typically ${formatPercent(benchmark.laborMin)}-${formatPercent(benchmark.laborMax)}. Materials may be marked up.`,
        actual: laborPercent,
        expected: { min: benchmark.laborMin, max: benchmark.laborMax }
      };
    } else {
      result.flag = {
        type: 'labor-split-high',
        severity: 'low',
        title: `${capitalize(trade)} labor share is high`,
        description: `Labor is ${formatPercent(laborPercent)} of ${trade} costs, above the typical ${formatPercent(benchmark.laborMin)}-${formatPercent(benchmark.laborMax)} range.`,
        actual: laborPercent,
        expected: { min: benchmark.laborMin, max: benchmark.laborMax }
      };
    }
  }
  
  return result;
}

/**
 * Analyze all trade line items that have labor/material breakdowns.
 * Returns array of split results with any flags.
 */
export function analyzeAllTradeSplits(lineItems: LineItem[]): LaborSplitResult[] {
  const results: LaborSplitResult[] = [];
  
  // Group items by trade
  const byTrade: Record<string, { labor: number; material: number }> = {};
  
  for (const item of lineItems) {
    if (!item.trade) continue;
    
    if (!byTrade[item.trade]) {
      byTrade[item.trade] = { labor: 0, material: 0 };
    }
    
    if (item.laborAmount !== undefined) {
      byTrade[item.trade].labor += item.laborAmount;
    }
    if (item.materialAmount !== undefined) {
      byTrade[item.trade].material += item.materialAmount;
    }
    
    // Also check category-based allocation
    if (item.category === 'labor') {
      byTrade[item.trade].labor += item.amount;
    } else if (item.category === 'material') {
      byTrade[item.trade].material += item.amount;
    }
  }
  
  // Analyze each trade
  for (const [trade, amounts] of Object.entries(byTrade)) {
    if (amounts.labor === 0 && amounts.material === 0) continue;
    
    const result = analyzeTradeLaborSplit(trade, amounts.labor, amounts.material);
    results.push(result);
  }
  
  return results;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

/**
 * Get the effective allocation bands for a project type.
 * Merges project-specific adjustments with defaults.
 */
export function getEffectiveBands(projectType?: string): Record<Exclude<LineItemCategory, 'unknown'>, AllocationBand> {
  const adjustments = projectType ? PROJECT_TYPE_ADJUSTMENTS[projectType.toLowerCase()] : undefined;
  
  if (!adjustments) {
    return PROJECT_ALLOCATION_BANDS;
  }
  
  const result = { ...PROJECT_ALLOCATION_BANDS };
  
  for (const [category, adjustment] of Object.entries(adjustments)) {
    if (result[category as keyof typeof result]) {
      result[category as keyof typeof result] = {
        ...result[category as keyof typeof result],
        ...adjustment
      };
    }
  }
  
  return result;
}

/**
 * Check if a bid has enough line item detail to analyze allocation.
 * Returns true if we have at least 3 categorizable line items.
 */
export function hasEnoughDetailForAllocation(lineItems: LineItem[]): boolean {
  const categorized = lineItems.filter(item => item.category !== 'unknown');
  return categorized.length >= 3;
}

/**
 * Get a summary of the allocation analysis for display.
 */
export function getAllocationSummary(result: AllocationResult): string {
  if (result.confidence < 50) {
    return 'Unable to analyze cost allocation - bid lacks itemized breakdown.';
  }
  
  if (result.flags.length === 0) {
    return 'Cost allocation appears reasonable.';
  }
  
  const highSeverity = result.flags.filter(f => f.severity === 'high').length;
  const mediumSeverity = result.flags.filter(f => f.severity === 'medium').length;
  
  if (highSeverity > 0) {
    return `Found ${highSeverity} significant allocation concern${highSeverity > 1 ? 's' : ''} that warrant review.`;
  }
  
  if (mediumSeverity > 0) {
    return `Found ${mediumSeverity} allocation item${mediumSeverity > 1 ? 's' : ''} outside typical ranges.`;
  }
  
  return `Found ${result.flags.length} minor allocation note${result.flags.length > 1 ? 's' : ''}.`;
}
