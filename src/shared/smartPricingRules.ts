/**
 * SMART PRICING RULES - Single Source of Truth
 * 
 * This module consolidates ALL pricing benchmarks, rules, and intelligence logic
 * from across the codebase into one editable location.
 * 
 * Data Sources:
 * - Zonda Cost vs Value 2025/2026
 * - Houzz 2024 Cost Guides
 * - Homewyse 2026 Benchmarks
 * - RSMeans Regional Data
 * 
 * @version 1.0.0
 * @created 2025-01-XX
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface PricingRange {
  low: number;
  median: number;
  high: number;
}

export interface WasteConfig {
  default: number;        // Default waste factor (e.g., 0.10 = 10%)
  range: [number, number]; // [min, max] waste range
}

export interface LaborPercent {
  min: number;  // Minimum expected labor % (0.0-1.0)
  max: number;  // Maximum expected labor %
}

export interface RoiData {
  recovery: number | [number, number]; // Cost recovery % (or range)
  joyScore?: number;                   // Homeowner satisfaction (1-10)
  source?: string;                     // Data source
}

export interface ComplexityMultipliers {
  [keyword: string]: number;  // Keyword -> multiplier (e.g., 'vaulted': 1.25)
}

export interface MaterialVariant {
  low: number;
  median: number;
  high: number;
  materialPercent?: number;
  laborHoursPerUnit?: number;
}

// ============================================================================
// AREA-BASED RULES ($/SF)
// ============================================================================

export interface AreaRule {
  unit: '$/SF' | '$/SQ';  // $/SQ = per 100 SF (roofing industry standard)
  basePricing: PricingRange;
  waste?: WasteConfig;
  complexityMultipliers?: ComplexityMultipliers;
  laborPercent?: LaborPercent;
  roiData?: RoiData | null;
  scopeFlags?: string[];
  requiredScope?: string[] | Record<string, string[]>;
  crossTradeRules?: string[];
  materialAlternatives?: Record<string, { multiplier: number; recovery?: number; flag?: string }>;
  includeRemoval?: boolean;
  removalCost?: PricingRange;
  description?: string;
  source?: string;
}

export const AREA_RULES: Record<string, AreaRule> = {
  // ==========================================================================
  // PAINTING
  // ==========================================================================
  'paint-interior': {
    unit: '$/SF',
    basePricing: { low: 2.00, median: 3.50, high: 5.50 },
    waste: { default: 0.05, range: [0.02, 0.10] },
    complexityMultipliers: {
      'vaulted': 1.25,
      'cathedral': 1.25,
      'two-story': 1.15,
      'wallpaper-removal': 1.20,
      'high-ceiling': 1.20,
      'textured': 1.10
    },
    laborPercent: { min: 0.75, max: 0.85 },
    roiData: null,
    scopeFlags: [],
    description: 'Interior wall painting (labor + paint, per sq ft of wall area)',
    source: 'Houzz 2024, Homewyse 2026'
  },
  
  'paint-exterior': {
    unit: '$/SF',
    basePricing: { low: 1.50, median: 3.00, high: 5.00 },
    waste: { default: 0.08, range: [0.05, 0.12] },
    complexityMultipliers: {
      'multi-story': 1.25,
      'cedar-shake': 1.30,
      'stucco': 1.15,
      'brick': 1.20
    },
    laborPercent: { min: 0.80, max: 0.85 },
    roiData: null,
    scopeFlags: [],
    description: 'Exterior house painting (labor + paint)',
    source: 'Houzz 2024'
  },
  
  'paint-cabinet': {
    unit: '$/SF',
    basePricing: { low: 35, median: 55, high: 80 }, // Per linear foot
    waste: { default: 0.05, range: [0.03, 0.08] },
    laborPercent: { min: 0.70, max: 0.80 },
    roiData: null,
    scopeFlags: [],
    description: 'Cabinet painting/refinishing (per linear foot of cabinets)',
    source: 'Houzz 2024'
  },
  
  // ==========================================================================
  // DRYWALL
  // ==========================================================================
  'drywall': {
    unit: '$/SF',
    basePricing: { low: 1.50, median: 2.50, high: 4.00 },
    waste: { default: 0.10, range: [0.05, 0.15] },
    complexityMultipliers: {
      'vaulted': 1.25,
      'level-5': 1.25,
      'level-4': 1.10,
      'knockdown': 1.05,
      'orange-peel': 1.05,
      'skip-trowel': 1.15,
      'smooth': 1.20
    },
    laborPercent: { min: 0.60, max: 0.75 },
    roiData: null,
    scopeFlags: [],
    description: 'Drywall hanging, taping, mudding, and finishing',
    source: 'Houzz 2024'
  },
  
  // ==========================================================================
  // TILE
  // ==========================================================================
  'tile-floor': {
    unit: '$/SF',
    basePricing: { low: 10, median: 16, high: 25 },
    waste: { default: 0.12, range: [0.10, 0.15] },
    complexityMultipliers: {
      'curbless': 1.15,
      'zero-threshold': 1.15,
      'herringbone': 1.20,
      'mosaic': 1.25,
      'radiant-heat': 1.10,
      'diagonal': 1.10,
      'large-format': 1.10
    },
    laborPercent: { min: 0.70, max: 0.80 },
    roiData: null,
    scopeFlags: ['pro-curbless-premium'],
    description: 'Floor tile installation (materials + labor)',
    source: 'Homewyse 2026'
  },
  
  'tile-backsplash': {
    unit: '$/SF',
    basePricing: { low: 23, median: 35, high: 55 },
    waste: { default: 0.15, range: [0.10, 0.20] },
    complexityMultipliers: {
      'mosaic': 1.25,
      'herringbone': 1.20,
      'around-outlets': 1.10
    },
    laborPercent: { min: 0.70, max: 0.80 },
    roiData: null,
    scopeFlags: [],
    description: 'Tile backsplash - labor-intensive small-area work (typically 15-50 sqft)',
    source: 'Homewyse 2026'
  },
  
  'tile-shower': {
    unit: '$/SF',
    basePricing: { low: 15, median: 25, high: 40 },
    waste: { default: 0.15, range: [0.12, 0.18] },
    complexityMultipliers: {
      'curbless': 1.20,
      'niche': 1.05,
      'bench': 1.10,
      'linear-drain': 1.15
    },
    laborPercent: { min: 0.70, max: 0.80 },
    roiData: null,
    scopeFlags: ['waterproofing-check'],
    requiredScope: ['waterproofing', 'cement-board'],
    description: 'Shower tile installation - includes waterproofing membrane',
    source: 'Homewyse 2026'
  },
  
  // ==========================================================================
  // FLOORING
  // ==========================================================================
  'flooring-hardwood': {
    unit: '$/SF',
    basePricing: { low: 8, median: 14, high: 22 },
    waste: { default: 0.07, range: [0.05, 0.10] },
    complexityMultipliers: {
      'diagonal': 1.10,
      'herringbone': 1.25,
      'hand-scraped': 1.15,
      'wide-plank': 1.10
    },
    includeRemoval: true,
    removalCost: { low: 1.50, median: 2.50, high: 4.00 },
    laborPercent: { min: 0.55, max: 0.70 },
    roiData: { recovery: 0.70, joyScore: 9.1, source: 'Houzz 2024' },
    scopeFlags: [],
    description: 'Solid hardwood flooring installation (materials + labor)',
    source: 'Homewyse 2026'
  },
  
  'flooring-engineered': {
    unit: '$/SF',
    basePricing: { low: 6, median: 11, high: 18 },
    waste: { default: 0.07, range: [0.05, 0.10] },
    laborPercent: { min: 0.50, max: 0.65 },
    roiData: null,
    scopeFlags: [],
    description: 'Engineered hardwood flooring installation',
    source: 'Homewyse 2026'
  },
  
  'flooring-lvp': {
    unit: '$/SF',
    basePricing: { low: 5, median: 8, high: 12 },
    waste: { default: 0.05, range: [0.03, 0.08] },
    laborPercent: { min: 0.45, max: 0.55 },
    roiData: null,
    scopeFlags: [],
    description: 'Luxury vinyl plank (LVP/LVT) installation',
    source: 'Homewyse 2026'
  },
  
  'flooring-laminate': {
    unit: '$/SF',
    basePricing: { low: 4, median: 7, high: 12 },
    waste: { default: 0.05, range: [0.03, 0.08] },
    laborPercent: { min: 0.40, max: 0.50 },
    roiData: null,
    scopeFlags: [],
    description: 'Laminate flooring installation',
    source: 'Homewyse 2026'
  },
  
  'flooring-carpet': {
    unit: '$/SF',
    basePricing: { low: 2, median: 4.50, high: 7 },
    waste: { default: 0.05, range: [0.03, 0.08] },
    laborPercent: { min: 0.35, max: 0.45 },
    roiData: null,
    scopeFlags: [],
    description: 'Carpet installation with pad',
    source: 'Houzz 2024'
  },
  
  // ==========================================================================
  // ROOFING ($/SQ = per 100 SF)
  // ==========================================================================
  'roofing-asphalt': {
    unit: '$/SQ',
    basePricing: { low: 350, median: 450, high: 600 },
    waste: { default: 0.05, range: [0.03, 0.08] },
    complexityMultipliers: {
      'steep-pitch': 1.25,
      'multiple-layers': 1.20,
      'cut-up-roof': 1.15,
      'dormers': 1.10,
      'valleys': 1.05
    },
    laborPercent: { min: 0.40, max: 0.55 },
    roiData: { recovery: 0.68, source: 'Zonda 2025' },
    materialAlternatives: {
      'metal': { multiplier: 1.60, recovery: 0.50, flag: 'Lower ROI than asphalt (50% vs 68%)' },
      'standing-seam': { multiplier: 1.80, recovery: 0.50 }
    },
    scopeFlags: [],
    description: 'Asphalt shingle roof replacement (per square = 100 SF)',
    source: 'Zonda 2025'
  },
  
  // ==========================================================================
  // SIDING
  // ==========================================================================
  'siding-vinyl': {
    unit: '$/SF',
    basePricing: { low: 3, median: 5.50, high: 8 },
    waste: { default: 0.08, range: [0.05, 0.12] },
    laborPercent: { min: 0.40, max: 0.50 },
    roiData: { recovery: 0.68, source: 'Zonda 2025' },
    scopeFlags: [],
    description: 'Vinyl siding installation',
    source: 'Houzz 2024, Zonda 2025'
  },
  
  'siding-fiber-cement': {
    unit: '$/SF',
    basePricing: { low: 6, median: 8, high: 12 },
    waste: { default: 0.10, range: [0.08, 0.12] },
    laborPercent: { min: 0.45, max: 0.55 },
    roiData: { recovery: 1.14, source: 'Zonda 2025' }, // 114% ROI!
    scopeFlags: ['check-trim-detail'],
    requiredScope: ['corner-trim', 'window-trim', 'j-channel'],
    description: 'Fiber-cement siding (HardiePlank) - 114% ROI project',
    source: 'Zonda 2025'
  },
  
  // ==========================================================================
  // INSULATION
  // ==========================================================================
  'insulation': {
    unit: '$/SF',
    basePricing: { low: 1.50, median: 3.00, high: 5.50 },
    waste: { default: 0.05, range: [0.03, 0.08] },
    complexityMultipliers: {
      'spray-foam': 1.80,
      'blown-in': 1.20,
      'rigid-board': 1.40,
      'batt': 1.00
    },
    laborPercent: { min: 0.35, max: 0.50 },
    roiData: null,
    scopeFlags: ['electrification-check'],
    crossTradeRules: ['hvac-heat-pump'],
    description: 'Insulation installation',
    source: 'Homewyse 2026'
  },
  
  // ==========================================================================
  // REMODEL PROJECTS
  // ==========================================================================
  'bathroom-remodel': {
    unit: '$/SF',
    basePricing: { low: 150, median: 350, high: 600 },
    waste: { default: 0.05, range: [0.03, 0.08] },
    laborPercent: { min: 0.50, max: 0.60 },
    roiData: { recovery: 0.62, joyScore: 9.4, source: 'Zonda 2025' },
    scopeFlags: ['wet-space-gfci-check'],
    requiredScope: {
      'all': ['gfci', 'exhaust-fan'],
      'shower': ['waterproofing']
    },
    description: 'Full bathroom remodel',
    source: 'Zonda 2025, Houzz 2024'
  },
  
  'kitchen-remodel': {
    unit: '$/SF',
    basePricing: { low: 150, median: 400, high: 800 },
    waste: { default: 0.05, range: [0.03, 0.08] },
    laborPercent: { min: 0.45, max: 0.55 },
    roiData: { recovery: 0.50, joyScore: 9.2, source: 'Zonda 2025' },
    scopeFlags: [],
    description: 'Full kitchen remodel',
    source: 'Zonda 2025, Houzz 2024'
  },
  
  'basement-remodel': {
    unit: '$/SF',
    basePricing: { low: 30, median: 55, high: 90 },
    waste: { default: 0.05, range: [0.03, 0.08] },
    laborPercent: { min: 0.50, max: 0.65 },
    roiData: { recovery: 0.70, source: 'Zonda 2025' },
    scopeFlags: ['egress-bedroom-check'],
    requiredScope: {
      'bedroom': ['egress-window'],
      'bathroom': ['gfci', 'exhaust-fan']
    },
    description: 'Basement finishing (per square foot)',
    source: 'Zonda 2025, Homewyse 2026'
  },
  
  'addition': {
    unit: '$/SF',
    basePricing: { low: 150, median: 275, high: 450 },
    waste: { default: 0.08, range: [0.05, 0.12] },
    laborPercent: { min: 0.45, max: 0.55 },
    roiData: null,
    scopeFlags: ['permit-required'],
    description: 'Room addition (per square foot of new space)',
    source: 'Homewyse 2026'
  }
};

// ============================================================================
// LINEAR RULES ($/LF)
// ============================================================================

export interface LinearRule {
  unit: '$/LF';
  basePricing: PricingRange;
  materials?: Record<string, MaterialVariant>;
  laborPercent?: LaborPercent;
  roiData?: RoiData | null;
  scopeFlags?: string[];
  requiredScope?: string[];
  safetyRequirements?: Record<string, number | string[]>;
  description?: string;
  source?: string;
}

export const LINEAR_RULES: Record<string, LinearRule> = {
  // ==========================================================================
  // FENCE
  // ==========================================================================
  'fence': {
    unit: '$/LF',
    basePricing: { low: 25, median: 45, high: 80 },
    materials: {
      'wood': { low: 25, median: 40, high: 65, materialPercent: 0.55, laborHoursPerUnit: 0.25 },
      'cedar': { low: 30, median: 50, high: 75, materialPercent: 0.55, laborHoursPerUnit: 0.25 },
      'vinyl': { low: 30, median: 50, high: 80, materialPercent: 0.65, laborHoursPerUnit: 0.20 },
      'chain-link': { low: 15, median: 25, high: 40, materialPercent: 0.60, laborHoursPerUnit: 0.15 },
      'aluminum': { low: 40, median: 65, high: 100, materialPercent: 0.70, laborHoursPerUnit: 0.20 },
      'wrought-iron': { low: 80, median: 120, high: 180, materialPercent: 0.60, laborHoursPerUnit: 0.35 },
      'composite': { low: 50, median: 80, high: 120, materialPercent: 0.65, laborHoursPerUnit: 0.25 }
    },
    laborPercent: { min: 0.35, max: 0.45 },
    roiData: null,
    scopeFlags: ['post-depth-check'],
    description: 'Fence installation',
    source: 'Homewyse 2026'
  },
  
  // ==========================================================================
  // GUTTER
  // ==========================================================================
  'gutter': {
    unit: '$/LF',
    basePricing: { low: 8, median: 15, high: 25 },
    materials: {
      'aluminum': { low: 8, median: 12, high: 18, materialPercent: 0.45, laborHoursPerUnit: 0.08 },
      'vinyl': { low: 5, median: 8, high: 12, materialPercent: 0.50, laborHoursPerUnit: 0.06 },
      'seamless': { low: 10, median: 15, high: 22, materialPercent: 0.50, laborHoursPerUnit: 0.10 },
      'copper': { low: 25, median: 40, high: 60, materialPercent: 0.70, laborHoursPerUnit: 0.12 },
      'steel': { low: 12, median: 18, high: 28, materialPercent: 0.55, laborHoursPerUnit: 0.10 }
    },
    laborPercent: { min: 0.45, max: 0.55 },
    roiData: null,
    scopeFlags: ['downspout-itemization-check'],
    requiredScope: ['downspouts'],
    description: 'Gutter installation',
    source: 'Homewyse 2026'
  },
  
  // ==========================================================================
  // TRIM
  // ==========================================================================
  'trim-base': {
    unit: '$/LF',
    basePricing: { low: 3, median: 5, high: 8 },
    laborPercent: { min: 0.65, max: 0.75 },
    roiData: null,
    scopeFlags: ['caulk-paint-check'],
    requiredScope: ['caulk', 'paint'],
    description: 'Baseboard trim installation',
    source: 'Homewyse 2026'
  },
  
  'trim-crown': {
    unit: '$/LF',
    basePricing: { low: 6, median: 10, high: 16 },
    laborPercent: { min: 0.70, max: 0.80 },
    roiData: null,
    scopeFlags: ['caulk-paint-check'],
    requiredScope: ['caulk', 'paint'],
    description: 'Crown molding installation',
    source: 'Homewyse 2026'
  },
  
  // ==========================================================================
  // DECK RAILING
  // ==========================================================================
  'deck-railing': {
    unit: '$/LF',
    basePricing: { low: 40, median: 90, high: 160 },
    materials: {
      'wood': { low: 40, median: 65, high: 100, materialPercent: 0.50, laborHoursPerUnit: 0.30 },
      'aluminum': { low: 60, median: 90, high: 140, materialPercent: 0.65, laborHoursPerUnit: 0.25 },
      'cable': { low: 80, median: 130, high: 200, materialPercent: 0.70, laborHoursPerUnit: 0.35 },
      'glass': { low: 150, median: 225, high: 350, materialPercent: 0.75, laborHoursPerUnit: 0.45 },
      'composite': { low: 70, median: 110, high: 160, materialPercent: 0.60, laborHoursPerUnit: 0.28 }
    },
    laborPercent: { min: 0.35, max: 0.50 },
    roiData: null,
    scopeFlags: ['code-compliance-check'],
    safetyRequirements: {
      minHeight: 36,
      maxBalusterSpacing: 4
    },
    description: 'Deck railing installation',
    source: 'Homewyse 2026'
  },
  
  // ==========================================================================
  // RETAINING WALL
  // ==========================================================================
  'retaining-wall': {
    unit: '$/LF',
    basePricing: { low: 35, median: 60, high: 100 },
    materials: {
      'timber': { low: 25, median: 40, high: 60, materialPercent: 0.45, laborHoursPerUnit: 0.35 },
      'block': { low: 35, median: 55, high: 85, materialPercent: 0.55, laborHoursPerUnit: 0.40 },
      'poured': { low: 50, median: 80, high: 130, materialPercent: 0.50, laborHoursPerUnit: 0.50 },
      'boulder': { low: 40, median: 70, high: 120, materialPercent: 0.60, laborHoursPerUnit: 0.45 }
    },
    laborPercent: { min: 0.40, max: 0.55 },
    roiData: null,
    scopeFlags: ['drainage-check', 'permit-check-height'],
    description: 'Retaining wall installation',
    source: 'Homewyse 2026'
  },
  
  // ==========================================================================
  // COUNTERTOPS (can be $/LF or $/SF)
  // ==========================================================================
  'countertops': {
    unit: '$/LF',
    basePricing: { low: 40, median: 75, high: 150 },
    materials: {
      'laminate': { low: 20, median: 35, high: 50, materialPercent: 0.55 },
      'granite': { low: 40, median: 60, high: 80, materialPercent: 0.65 },
      'quartz': { low: 60, median: 85, high: 120, materialPercent: 0.70 },
      'marble': { low: 80, median: 125, high: 200, materialPercent: 0.70 },
      'butcher-block': { low: 35, median: 55, high: 80, materialPercent: 0.60 }
    },
    laborPercent: { min: 0.25, max: 0.35 },
    roiData: null,
    scopeFlags: ['plumbing-reconnect-check'],
    requiredScope: ['plumbing-disconnect', 'plumbing-reconnect', 'sink-cutout'],
    description: 'Countertop installation',
    source: 'Houzz 2024'
  }
};

// ============================================================================
// PER-UNIT RULES ($/EA)
// ============================================================================

export interface UnitRule {
  unit: '$/EA' | '$/System';
  basePricing: PricingRange;
  materials?: Record<string, MaterialVariant>;
  roiData?: RoiData | null;
  highlight?: string;
  scopeFlags?: string[];
  requiredScope?: string[];
  qualityChecks?: string[];
  crossTradeRules?: string[];
  safetyRequirements?: Record<string, string[]>;
  description?: string;
  source?: string;
}

export const UNIT_RULES: Record<string, UnitRule> = {
  // ==========================================================================
  // WINDOWS
  // ==========================================================================
  'windows': {
    unit: '$/EA',
    basePricing: { low: 450, median: 750, high: 1200 },
    materials: {
      'vinyl': { low: 400, median: 650, high: 950 },
      'fiberglass': { low: 600, median: 900, high: 1400 },
      'wood': { low: 800, median: 1200, high: 1800 },
      'bay-bow': { low: 1500, median: 2500, high: 4000 }
    },
    roiData: { recovery: 0.74, joyScore: 8.5, source: 'Zonda 2025' },
    scopeFlags: ['energy-star-check'],
    qualityChecks: ['energy-star'],
    description: 'Window replacement (includes window + installation)',
    source: 'Zonda 2025, Homewyse 2026'
  },
  
  // ==========================================================================
  // DOORS
  // ==========================================================================
  'door-entry-steel': {
    unit: '$/EA',
    basePricing: { low: 1200, median: 2000, high: 3500 },
    roiData: { recovery: [1.00, 2.16], joyScore: 9.0, source: 'Zonda 2025' },
    highlight: 'Top ROI project - steel entry doors return 100-216%',
    scopeFlags: [],
    description: 'Steel entry door installation',
    source: 'Zonda 2025'
  },
  
  'door-entry-fiberglass': {
    unit: '$/EA',
    basePricing: { low: 2000, median: 3500, high: 6000 },
    roiData: { recovery: 0.69, joyScore: 8.8, source: 'Zonda 2025' },
    scopeFlags: [],
    description: 'Fiberglass entry door installation',
    source: 'Zonda 2025'
  },
  
  'door-interior': {
    unit: '$/EA',
    basePricing: { low: 150, median: 350, high: 700 },
    materials: {
      'hollow-core': { low: 150, median: 250, high: 350 },
      'solid-core': { low: 250, median: 400, high: 600 },
      'pocket': { low: 400, median: 600, high: 900 },
      'barn': { low: 500, median: 800, high: 1200 }
    },
    roiData: null,
    scopeFlags: [],
    description: 'Interior door installation',
    source: 'Houzz 2024'
  },
  
  'door-patio': {
    unit: '$/EA',
    basePricing: { low: 1200, median: 2500, high: 5000 },
    roiData: null,
    scopeFlags: [],
    description: 'Patio/sliding door installation',
    source: 'Houzz 2024'
  },
  
  'door-french': {
    unit: '$/EA',
    basePricing: { low: 1800, median: 3500, high: 7000 },
    roiData: null,
    scopeFlags: [],
    description: 'French door installation',
    source: 'Houzz 2024'
  },
  
  // ==========================================================================
  // GARAGE DOOR
  // ==========================================================================
  'garage-door': {
    unit: '$/EA',
    basePricing: { low: 800, median: 1800, high: 4000 },
    materials: {
      'single-steel': { low: 800, median: 1200, high: 1800 },
      'double-steel': { low: 1200, median: 1800, high: 2800 },
      'carriage': { low: 2000, median: 3200, high: 5000 },
      'insulated': { low: 1500, median: 2200, high: 3500 }
    },
    roiData: { recovery: 2.68, joyScore: 9.2, source: 'Zonda 2025' },
    highlight: 'Highest ROI remodeling project (268%)',
    scopeFlags: ['opener-check'],
    requiredScope: ['opener'],
    description: 'Garage door installation',
    source: 'Zonda 2025'
  },
  
  // ==========================================================================
  // HVAC
  // ==========================================================================
  'hvac-heat-pump': {
    unit: '$/System',
    basePricing: { low: 8000, median: 15000, high: 25000 },
    roiData: { recovery: 0.72, joyScore: 9.0, source: 'Zonda 2025' },
    scopeFlags: ['panel-upgrade-check', 'insulation-check'],
    requiredScope: ['panel-assessment'],
    crossTradeRules: ['insulation', 'electrical-panel'],
    description: 'Heat pump HVAC system',
    source: 'Zonda 2025'
  },
  
  'hvac-ac': {
    unit: '$/System',
    basePricing: { low: 2500, median: 5000, high: 9000 },
    roiData: null,
    scopeFlags: [],
    description: 'Central AC installation/replacement',
    source: 'Houzz 2024'
  },
  
  'hvac-furnace': {
    unit: '$/System',
    basePricing: { low: 2500, median: 4500, high: 8000 },
    roiData: null,
    scopeFlags: [],
    description: 'Furnace installation',
    source: 'Houzz 2024'
  },
  
  // ==========================================================================
  // ELECTRICAL
  // ==========================================================================
  'electrical-outlet': {
    unit: '$/EA',
    basePricing: { low: 150, median: 225, high: 350 },
    roiData: null,
    scopeFlags: ['wet-space-gfci-check'],
    safetyRequirements: {
      wetSpaces: ['gfci'],
      kitchen: ['dedicated-circuit', 'gfci'],
      bathroom: ['gfci', 'exhaust-fan']
    },
    description: 'Outlet installation',
    source: 'Homewyse 2026'
  },
  
  'electrical-panel': {
    unit: '$/EA',
    basePricing: { low: 1500, median: 2500, high: 4000 },
    roiData: null,
    scopeFlags: ['permit-required'],
    description: '200-amp panel upgrade',
    source: 'Homewyse 2026'
  },
  
  // ==========================================================================
  // PLUMBING
  // ==========================================================================
  'water-heater': {
    unit: '$/EA',
    basePricing: { low: 600, median: 1200, high: 2500 },
    materials: {
      'tank-gas': { low: 800, median: 1200, high: 1800 },
      'tank-electric': { low: 600, median: 1000, high: 1500 },
      'tankless-gas': { low: 1500, median: 2500, high: 4000 },
      'tankless-electric': { low: 1200, median: 2000, high: 3000 }
    },
    roiData: null,
    scopeFlags: [],
    description: 'Water heater installation',
    source: 'Houzz 2024'
  },
  
  // ==========================================================================
  // GENERATOR
  // ==========================================================================
  'generator': {
    unit: '$/EA',
    basePricing: { low: 8000, median: 13500, high: 22000 },
    roiData: { recovery: 0.95, joyScore: 9.5, source: 'Zonda 2026' },
    highlight: 'Resilience project - 95% ROI (new 2026 top-10 project)',
    scopeFlags: ['concrete-pad-check', 'fuel-line-check'],
    requiredScope: ['concrete-pad', 'fuel-line', 'transfer-switch'],
    description: 'Backup generator installation',
    source: 'Zonda 2026'
  }
};

// ============================================================================
// SYSTEM RULES (Intelligence Logic)
// ============================================================================

export interface SystemFlag {
  trigger: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  message: string;
  deduction: number;
}

export const SYSTEM_RULES = {
  materialWaste: {
    default: 0.10,
    formula: '(Qty × Unit Price) × (1 + Waste%) + Tax + Delivery',
    byTrade: {
      'tile': 0.12,
      'flooring': 0.07,
      'paint': 0.05,
      'drywall': 0.10,
      'roofing': 0.05,
      'siding': 0.10
    }
  },
  
  laborShareAudit: {
    typicalRange: { min: 0.40, max: 0.75 },
    minimumHealthy: 0.40,
    byTrade: {
      'paint': { min: 0.75, max: 0.85 },
      'tile': { min: 0.70, max: 0.80 },
      'electrical': { min: 0.65, max: 0.75 },
      'plumbing': { min: 0.65, max: 0.75 },
      'flooring': { min: 0.40, max: 0.55 },
      'roofing': { min: 0.40, max: 0.55 },
      'cabinets': { min: 0.25, max: 0.35 }
    },
    flag: {
      trigger: 'labor < 40%',
      severity: 'high' as const,
      message: 'Labor below 40% may indicate substandard work or missing scope',
      deduction: -15
    }
  },
  
  permitCheck: {
    threshold: 5000,
    exemptCategories: ['painting', 'flooring', 'cabinet-refinishing', 'cosmetic'],
    flag: {
      trigger: 'bid > $5,000 AND permit_cost = 0 AND !cosmetic',
      severity: 'critical' as const,
      message: 'Projects over $5k typically require permits - verify with contractor',
      deduction: -12
    }
  },
  
  depositRisk: {
    safeMaximum: 0.30,
    recommendedStart: 0.10,
    milestoneSchedule: [0.10, 0.30, 0.30, 0.25, 0.05], // Start, Demo, Rough, Finish, Final
    flag: {
      trigger: 'deposit > 30%',
      severity: 'critical' as const,
      message: 'Deposit over 30% is high risk - recommend 10% start with milestones',
      deduction: -20
    }
  },
  
  overheadAndProfit: {
    multiTradeThreshold: 3,
    pmFeeRange: { min: 0.15, max: 0.20 },
    rationale: 'Multi-trade projects benefit from PM coordination (prevents 31% of projects running over)',
    flag: {
      trigger: 'trades >= 3 AND no PM/GC fee',
      severity: 'info' as const,
      message: 'Multi-trade projects benefit from 15-20% PM/GC coordination fee',
      deduction: 0
    }
  }
} as const;

// ============================================================================
// SCOPE FLAGS (Conditional Triggers)
// ============================================================================

export interface ScopeFlag {
  trigger: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  message: string;
  deduction: number;
}

export const SCOPE_FLAGS: Record<string, ScopeFlag> = {
  'egress-bedroom-check': {
    trigger: 'projectType === "basement" AND hasKeyword("bedroom") AND !hasKeyword("egress")',
    severity: 'critical',
    message: 'Basement bedrooms require egress windows - verify code compliance',
    deduction: -15
  },
  
  'wet-space-gfci-check': {
    trigger: 'hasKeyword("bathroom|kitchen") AND hasKeyword("electrical|outlet") AND !hasKeyword("gfci")',
    severity: 'high',
    message: 'Wet space electrical MUST have GFCI protection - verify with contractor',
    deduction: -10
  },
  
  'energy-star-check': {
    trigger: 'projectType === "windows" AND !hasKeyword("energy star|energystar")',
    severity: 'medium',
    message: 'Verify Energy Star rating for rebate eligibility (ROI impact)',
    deduction: -5
  },
  
  'plumbing-reconnect-check': {
    trigger: 'hasKeyword("countertop") AND !hasKeyword("plumbing|disconnect|reconnect")',
    severity: 'medium',
    message: 'Countertop replacement typically requires plumbing disconnect/reconnect - verify scope',
    deduction: -5
  },
  
  'caulk-paint-check': {
    trigger: 'hasKeyword("trim|baseboard|crown") AND !hasKeyword("caulk|paint|finish")',
    severity: 'low',
    message: 'Trim labor should include caulk & paint - verify scope completeness',
    deduction: -3
  },
  
  'downspout-itemization-check': {
    trigger: 'hasKeyword("gutter") AND !hasKeyword("downspout")',
    severity: 'medium',
    message: 'Downspouts should be itemized separately - verify they are included',
    deduction: -5
  },
  
  'code-compliance-check': {
    trigger: 'hasKeyword("railing|rail|deck rail") AND !hasKeyword("code|36 inch|4 inch")',
    severity: 'medium',
    message: 'Verify railing meets code (36" min height, 4" max baluster spacing)',
    deduction: -5
  },
  
  'opener-check': {
    trigger: 'hasKeyword("garage door") AND !hasKeyword("opener|liftmaster|chamberlain")',
    severity: 'low',
    message: 'Verify if existing opener will be reused or replaced',
    deduction: -3
  },
  
  'panel-upgrade-check': {
    trigger: 'hasKeyword("heat pump|hvac conversion") AND !hasKeyword("panel|electrical|200 amp")',
    severity: 'medium',
    message: 'Heat pump conversions often require electrical panel upgrade - verify scope',
    deduction: -5
  },
  
  'electrification-check': {
    trigger: 'hasKeyword("heat pump|hvac conversion") AND !hasKeyword("insulation")',
    severity: 'medium',
    message: 'Heat pumps perform 30% better with proper insulation - verify assessment',
    deduction: -5
  },
  
  'pro-curbless-premium': {
    trigger: 'hasKeyword("curbless|zero-threshold|barrier-free")',
    severity: 'info',
    message: 'Curbless showers require 15% labor premium for waterproofing - price should reflect this',
    deduction: 0
  },
  
  'check-trim-detail': {
    trigger: 'hasKeyword("siding|hardie|fiber cement") AND !hasKeyword("corner|trim|j-channel")',
    severity: 'medium',
    message: 'Fiber cement siding (114% ROI) - verify corner and window trim is itemized',
    deduction: -5
  },
  
  'waterproofing-check': {
    trigger: 'hasKeyword("shower|tile shower") AND !hasKeyword("waterproof|kerdi|redguard|membrane")',
    severity: 'high',
    message: 'Shower tile MUST have waterproofing membrane - verify with contractor',
    deduction: -10
  },
  
  'post-depth-check': {
    trigger: 'hasKeyword("fence") AND !hasKeyword("depth|concrete|footing")',
    severity: 'medium',
    message: 'Verify post depth (typically 1/3 of total post length, minimum 24")',
    deduction: -5
  },
  
  'drainage-check': {
    trigger: 'hasKeyword("retaining wall") AND !hasKeyword("drainage|drain|gravel|weep")',
    severity: 'high',
    message: 'Retaining walls MUST have drainage - water pressure causes failures',
    deduction: -10
  },
  
  'permit-check-height': {
    trigger: 'hasKeyword("retaining wall") AND (height > 4)',
    severity: 'high',
    message: 'Retaining walls over 4 feet typically require engineering and permits',
    deduction: -8
  }
};

// ============================================================================
// ROI DATA (Cost vs Value 2025/2026)
// ============================================================================

export interface RoiEntry {
  recovery: number | [number, number];
  joyScore?: number;
  source: string;
  highlight?: string;
}

export const ROI_DATA: Record<string, RoiEntry> = {
  // Top performers (>100% ROI)
  'garage-door': { recovery: 2.68, joyScore: 9.2, source: 'Zonda 2025', highlight: 'Highest ROI project' },
  'door-entry-steel': { recovery: [1.00, 2.16], joyScore: 9.0, source: 'Zonda 2025', highlight: 'Best door investment' },
  'siding-fiber-cement': { recovery: 1.14, joyScore: 8.8, source: 'Zonda 2025', highlight: 'Only siding >100% ROI' },
  
  // Strong performers (90-100%)
  'generator': { recovery: 0.95, joyScore: 9.5, source: 'Zonda 2026', highlight: 'New 2026 top-10 project' },
  
  // Good performers (70-90%)
  'windows-vinyl': { recovery: 0.74, joyScore: 8.5, source: 'Zonda 2025' },
  'hvac-heat-pump': { recovery: 0.72, joyScore: 9.0, source: 'Zonda 2025' },
  'flooring-hardwood': { recovery: 0.70, joyScore: 9.1, source: 'Houzz 2024' },
  'basement-remodel': { recovery: 0.70, joyScore: 8.5, source: 'Zonda 2025' },
  'roofing-asphalt': { recovery: 0.68, joyScore: 8.0, source: 'Zonda 2025' },
  'siding-vinyl': { recovery: 0.68, joyScore: 8.0, source: 'Zonda 2025' },
  'door-entry-fiberglass': { recovery: 0.69, joyScore: 8.8, source: 'Zonda 2025' },
  
  // Moderate performers (50-70%)
  'bathroom-remodel': { recovery: 0.62, joyScore: 9.4, source: 'Zonda 2025' },
  'kitchen-remodel': { recovery: 0.50, joyScore: 9.2, source: 'Zonda 2025' },
  'roofing-metal': { recovery: 0.50, joyScore: 8.2, source: 'Zonda 2025', highlight: 'Lower ROI than asphalt' }
};

// ============================================================================
// CITY TIER MULTIPLIERS
// ============================================================================

export interface CityTierData {
  tier: 1 | 2 | 3 | 4 | 5;
  multiplier: { low: number; high: number };
}

export const CITY_TIER_MULTIPLIERS: Record<number, { low: number; high: number }> = {
  1: { low: 1.4, high: 1.6 },   // High Cost (NYC, SF, Boston, Seattle)
  2: { low: 1.2, high: 1.4 },   // Elevated (LA, Chicago, Denver, DC, Miami)
  3: { low: 1.0, high: 1.15 },  // Moderate (Atlanta, Dallas, Phoenix, Nashville)
  4: { low: 0.9, high: 1.0 },   // Average (Houston, Columbus, Las Vegas, Orlando)
  5: { low: 0.75, high: 0.9 }   // Value (OKC, Memphis, Birmingham, Detroit)
};

export const STATE_TIER_DEFAULTS: Record<string, 1 | 2 | 3 | 4 | 5> = {
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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get pricing rule for a project type (checks all rule categories)
 */
export function getSmartRule(projectType: string): AreaRule | LinearRule | UnitRule | null {
  const normalized = projectType.toLowerCase().replace(/[_\s]+/g, '-');
  return AREA_RULES[normalized] || LINEAR_RULES[normalized] || UNIT_RULES[normalized] || null;
}

/**
 * Get ROI data for a project type
 */
export function getProjectRoi(projectType: string): RoiEntry | null {
  const normalized = projectType.toLowerCase().replace(/[_\s]+/g, '-');
  return ROI_DATA[normalized] || null;
}

/**
 * Get waste factor for a project type
 */
export function getWasteFactor(projectType: string): number {
  const rule = getSmartRule(projectType) as AreaRule;
  if (rule?.waste) {
    return rule.waste.default;
  }
  const normalized = projectType.toLowerCase();
  return (SYSTEM_RULES.materialWaste.byTrade as Record<string, number>)[normalized] 
    ?? SYSTEM_RULES.materialWaste.default;
}

/**
 * Get city tier multiplier
 */
export function getCityTierMultiplier(tier: 1 | 2 | 3 | 4 | 5): { low: number; high: number } {
  return CITY_TIER_MULTIPLIERS[tier];
}

/**
 * Get expected labor ratio for a trade
 */
export function getExpectedLaborRatio(projectType: string): { min: number; max: number } {
  const normalized = projectType.toLowerCase();
  const tradeRatios = SYSTEM_RULES.laborShareAudit.byTrade as Record<string, { min: number; max: number }>;
  return tradeRatios[normalized] ?? SYSTEM_RULES.laborShareAudit.typicalRange;
}

/**
 * Evaluate scope flags for a project
 */
export function evaluateScopeFlags(
  projectType: string,
  bidText: string,
  bidTotal: number
): Array<{ flagId: string; flag: ScopeFlag }> {
  const results: Array<{ flagId: string; flag: ScopeFlag }> = [];
  const textLower = bidText.toLowerCase();
  
  const hasKeyword = (keywords: string): boolean => {
    const parts = keywords.split('|');
    return parts.some(kw => textLower.includes(kw.toLowerCase()));
  };
  
  for (const [flagId, flag] of Object.entries(SCOPE_FLAGS)) {
    // Simple keyword-based evaluation
    // In Session B, we'll implement full trigger parsing
    const trigger = flag.trigger.toLowerCase();
    
    // Check projectType conditions
    if (trigger.includes('projecttype')) {
      const typeMatch = trigger.match(/projecttype\s*===?\s*"([^"]+)"/);
      if (typeMatch && !projectType.toLowerCase().includes(typeMatch[1])) {
        continue;
      }
    }
    
    // Check hasKeyword conditions
    const keywordMatches = trigger.matchAll(/haskeyword\("([^"]+)"\)/g);
    let allConditionsMet = true;
    
    for (const match of keywordMatches) {
      const isNegated = trigger.includes(`!haskeyword("${match[1]}")`);
      const keywordPresent = hasKeyword(match[1]);
      
      if (isNegated && keywordPresent) {
        allConditionsMet = false;
        break;
      }
      if (!isNegated && !keywordPresent) {
        allConditionsMet = false;
        break;
      }
    }
    
    if (allConditionsMet && flag.trigger.includes('hasKeyword')) {
      results.push({ flagId, flag });
    }
  }
  
  // Check system rules
  if (bidTotal > SYSTEM_RULES.permitCheck.threshold) {
    const isCosmetic = SYSTEM_RULES.permitCheck.exemptCategories.some(cat => 
      projectType.toLowerCase().includes(cat)
    );
    if (!isCosmetic && !textLower.includes('permit')) {
      results.push({
        flagId: 'permit-check',
        flag: SYSTEM_RULES.permitCheck.flag
      });
    }
  }
  
  return results;
}
