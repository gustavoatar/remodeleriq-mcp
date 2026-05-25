/**
 * Trade-Specific Pricing Benchmarks
 * 
 * @deprecated This file is being replaced by smartPricingRules.ts
 * New code should import from smartPricingRules.ts instead.
 * This file is retained for backward compatibility during migration.
 * 
 * Different trades have vastly different pricing models.
 * This module provides appropriate benchmarks for each trade type.
 */

import type { TradeDetectionResult } from './tradeDetection';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface TradeBenchmark {
  // Price per square foot range (null if not applicable)
  psfRange: {
    low: number;
    mid: number;
    high: number;
  } | null;
  
  // Per-unit range for trades that price by unit (null if not applicable)
  perUnitRange: {
    low: number;
    mid: number;
    high: number;
    unitLabel: string;  // "per window", "per outlet", etc.
  } | null;
  
  // Per-project range for fixed-price projects (null if not applicable)
  perProjectRange: {
    low: number;
    mid: number;
    high: number;
  } | null;
  
  // What this benchmark represents
  description: string;
  
  // Source note
  source: string;
  
  // Can we reliably benchmark this trade?
  hasBenchmark: boolean;
  
  // Display configuration
  display: {
    showPSF: boolean;
    showPerUnit: boolean;
    showPerProject: boolean;
    primaryMetric: 'psf' | 'per-unit' | 'per-project' | 'none';
  };
}

export interface TradeBenchmarkAnalysis {
  trade: TradeDetectionResult;
  benchmark: TradeBenchmark;
  
  // Analysis results (if we have enough data)
  analysis: {
    bidPSF: number | null;
    status: 'below-market' | 'fair' | 'above-market' | 'significantly-above' | 'unknown';
    percentDifference: number | null;
    statusMessage: string;
  } | null;
}

// ============================================================================
// BENCHMARK DATA
// ============================================================================

/**
 * Flooring benchmarks by sub-type ($ per square foot installed)
 */
const FLOORING_BENCHMARKS: Record<string, TradeBenchmark> = {
  'hardwood': {
    psfRange: { low: 8, mid: 14, high: 22 },
    perUnitRange: null,
    perProjectRange: null,
    description: 'Solid hardwood flooring installation (materials + labor)',
    source: 'Homewyse 2024, Regional contractor data',
    hasBenchmark: true,
    display: { showPSF: true, showPerUnit: false, showPerProject: false, primaryMetric: 'psf' },
  },
  'engineered-hardwood': {
    psfRange: { low: 6, mid: 11, high: 18 },
    perUnitRange: null,
    perProjectRange: null,
    description: 'Engineered hardwood flooring installation (materials + labor)',
    source: 'Homewyse 2024, Regional contractor data',
    hasBenchmark: true,
    display: { showPSF: true, showPerUnit: false, showPerProject: false, primaryMetric: 'psf' },
  },
  'laminate': {
    psfRange: { low: 4, mid: 7, high: 12 },
    perUnitRange: null,
    perProjectRange: null,
    description: 'Laminate flooring installation (materials + labor)',
    source: 'Homewyse 2024, Regional contractor data',
    hasBenchmark: true,
    display: { showPSF: true, showPerUnit: false, showPerProject: false, primaryMetric: 'psf' },
  },
  'vinyl-lvp': {
    psfRange: { low: 5, mid: 8, high: 12 },
    perUnitRange: null,
    perProjectRange: null,
    description: 'Luxury vinyl plank (LVP/LVT) installation (materials + labor)',
    source: 'Homewyse 2024, Regional contractor data',
    hasBenchmark: true,
    display: { showPSF: true, showPerUnit: false, showPerProject: false, primaryMetric: 'psf' },
  },
  'vinyl-sheet': {
    psfRange: { low: 3, mid: 5, high: 8 },
    perUnitRange: null,
    perProjectRange: null,
    description: 'Sheet vinyl flooring installation (materials + labor)',
    source: 'Homewyse 2024, Regional contractor data',
    hasBenchmark: true,
    display: { showPSF: true, showPerUnit: false, showPerProject: false, primaryMetric: 'psf' },
  },
  'carpet': {
    psfRange: { low: 2, mid: 4.5, high: 7 },
    perUnitRange: null,
    perProjectRange: null,
    description: 'Carpet installation with pad (materials + labor)',
    source: 'Houzz 2024, Homewyse 2024',
    hasBenchmark: true,
    display: { showPSF: true, showPerUnit: false, showPerProject: false, primaryMetric: 'psf' },
  },
  'unknown': {
    psfRange: { low: 5, mid: 10, high: 18 },
    perUnitRange: null,
    perProjectRange: null,
    description: 'General flooring installation (materials + labor)',
    source: 'Homewyse 2024 averages',
    hasBenchmark: true,
    display: { showPSF: true, showPerUnit: false, showPerProject: false, primaryMetric: 'psf' },
  },
};

/**
 * Tile benchmarks by sub-type ($ per square foot installed)
 * 
 * IMPORTANT: Backsplash pricing is significantly higher per sqft than floor tile
 * because of the labor-intensive nature of small-area work (cutting, fitting,
 * working around outlets/switches, vertical installation, etc.)
 */
const TILE_BENCHMARKS: Record<string, TradeBenchmark> = {
  // Location-based benchmarks (highest specificity)
  'backsplash': {
    psfRange: { low: 23, mid: 35, high: 55 },
    perUnitRange: null,
    perProjectRange: { low: 800, mid: 1500, high: 3000 },
    description: 'Tile backsplash installation - labor-intensive small-area work (typically 15-50 sqft)',
    source: 'Homewyse 2024, Regional contractor data - Kitchen backsplash specific',
    hasBenchmark: true,
    display: { showPSF: true, showPerUnit: false, showPerProject: true, primaryMetric: 'psf' },
  },
  'shower-tile': {
    psfRange: { low: 15, mid: 25, high: 40 },
    perUnitRange: null,
    perProjectRange: { low: 1500, mid: 3500, high: 7000 },
    description: 'Shower tile installation - includes waterproofing membrane and wall prep',
    source: 'Homewyse 2024, Regional contractor data',
    hasBenchmark: true,
    display: { showPSF: true, showPerUnit: false, showPerProject: true, primaryMetric: 'psf' },
  },
  'floor-tile': {
    psfRange: { low: 10, mid: 16, high: 25 },
    perUnitRange: null,
    perProjectRange: null,
    description: 'Floor tile installation (materials + labor)',
    source: 'Homewyse 2024, Regional contractor data',
    hasBenchmark: true,
    display: { showPSF: true, showPerUnit: false, showPerProject: false, primaryMetric: 'psf' },
  },
  // Material-based benchmarks
  'ceramic': {
    psfRange: { low: 8, mid: 14, high: 22 },
    perUnitRange: null,
    perProjectRange: null,
    description: 'Ceramic tile installation (materials + labor)',
    source: 'Homewyse 2024, Regional contractor data',
    hasBenchmark: true,
    display: { showPSF: true, showPerUnit: false, showPerProject: false, primaryMetric: 'psf' },
  },
  'porcelain': {
    psfRange: { low: 10, mid: 17, high: 28 },
    perUnitRange: null,
    perProjectRange: null,
    description: 'Porcelain tile installation (materials + labor)',
    source: 'Homewyse 2024, Regional contractor data',
    hasBenchmark: true,
    display: { showPSF: true, showPerUnit: false, showPerProject: false, primaryMetric: 'psf' },
  },
  'natural-stone': {
    psfRange: { low: 15, mid: 28, high: 45 },
    perUnitRange: null,
    perProjectRange: null,
    description: 'Natural stone tile installation (marble, travertine, etc.)',
    source: 'Homewyse 2024, Regional contractor data',
    hasBenchmark: true,
    display: { showPSF: true, showPerUnit: false, showPerProject: false, primaryMetric: 'psf' },
  },
  'mosaic': {
    psfRange: { low: 18, mid: 30, high: 50 },
    perUnitRange: null,
    perProjectRange: null,
    description: 'Mosaic tile installation (labor-intensive)',
    source: 'Homewyse 2024, Regional contractor data',
    hasBenchmark: true,
    display: { showPSF: true, showPerUnit: false, showPerProject: false, primaryMetric: 'psf' },
  },
  'unknown': {
    psfRange: { low: 10, mid: 18, high: 30 },
    perUnitRange: null,
    perProjectRange: null,
    description: 'General tile installation (materials + labor)',
    source: 'Homewyse 2024 averages',
    hasBenchmark: true,
    display: { showPSF: true, showPerUnit: false, showPerProject: false, primaryMetric: 'psf' },
  },
};

/**
 * Painting benchmarks ($ per square foot of wall/surface area)
 */
const PAINTING_BENCHMARKS: Record<string, TradeBenchmark> = {
  'interior': {
    psfRange: { low: 2, mid: 3.50, high: 5.50 },
    perUnitRange: null,
    perProjectRange: null,
    description: 'Interior wall painting (labor + paint, per sq ft of wall area)',
    source: 'Homewyse 2024, Regional contractor data',
    hasBenchmark: true,
    display: { showPSF: true, showPerUnit: false, showPerProject: false, primaryMetric: 'psf' },
  },
  'exterior': {
    psfRange: { low: 1.50, mid: 3, high: 5 },
    perUnitRange: null,
    perProjectRange: null,
    description: 'Exterior house painting (labor + paint)',
    source: 'Homewyse 2024, Regional contractor data',
    hasBenchmark: true,
    display: { showPSF: true, showPerUnit: false, showPerProject: false, primaryMetric: 'psf' },
  },
  'cabinet': {
    psfRange: null,
    perUnitRange: { low: 35, mid: 55, high: 80, unitLabel: 'per linear foot' },
    perProjectRange: null,
    description: 'Cabinet painting/refinishing (per linear foot of cabinets)',
    source: 'Homewyse 2024, Regional contractor data',
    hasBenchmark: true,
    display: { showPSF: false, showPerUnit: true, showPerProject: false, primaryMetric: 'per-unit' },
  },
  'unknown': {
    psfRange: { low: 2, mid: 3.50, high: 5.50 },
    perUnitRange: null,
    perProjectRange: null,
    description: 'General painting (labor + paint)',
    source: 'Homewyse 2024 averages',
    hasBenchmark: true,
    display: { showPSF: true, showPerUnit: false, showPerProject: false, primaryMetric: 'psf' },
  },
};

/**
 * Electrical benchmarks (mostly per-unit or per-project)
 */
const ELECTRICAL_BENCHMARKS: Record<string, TradeBenchmark> = {
  'panel-upgrade': {
    psfRange: null,
    perUnitRange: null,
    perProjectRange: { low: 1500, mid: 2500, high: 4000 },
    description: '200-amp electrical panel upgrade',
    source: 'Homewyse 2024, Regional contractor data',
    hasBenchmark: true,
    display: { showPSF: false, showPerUnit: false, showPerProject: true, primaryMetric: 'per-project' },
  },
  'outlets': {
    psfRange: null,
    perUnitRange: { low: 150, mid: 225, high: 350, unitLabel: 'per outlet' },
    perProjectRange: null,
    description: 'New outlet installation (includes wiring)',
    source: 'Homewyse 2024, Regional contractor data',
    hasBenchmark: true,
    display: { showPSF: false, showPerUnit: true, showPerProject: false, primaryMetric: 'per-unit' },
  },
  'fixtures': {
    psfRange: null,
    perUnitRange: { low: 150, mid: 300, high: 500, unitLabel: 'per fixture' },
    perProjectRange: null,
    description: 'Light fixture installation (labor only, fixture not included)',
    source: 'Homewyse 2024, Regional contractor data',
    hasBenchmark: true,
    display: { showPSF: false, showPerUnit: true, showPerProject: false, primaryMetric: 'per-unit' },
  },
  'ev-charger': {
    psfRange: null,
    perUnitRange: null,
    perProjectRange: { low: 800, mid: 1400, high: 2500 },
    description: 'Level 2 EV charger installation (labor + materials, charger not included)',
    source: 'Homewyse 2024, Regional contractor data',
    hasBenchmark: true,
    display: { showPSF: false, showPerUnit: false, showPerProject: true, primaryMetric: 'per-project' },
  },
  'rewire': {
    psfRange: { low: 6, mid: 10, high: 16 },
    perUnitRange: null,
    perProjectRange: null,
    description: 'Whole house rewiring (per square foot of living space)',
    source: 'Homewyse 2024, Regional contractor data',
    hasBenchmark: true,
    display: { showPSF: true, showPerUnit: false, showPerProject: false, primaryMetric: 'psf' },
  },
  'unknown': {
    psfRange: null,
    perUnitRange: null,
    perProjectRange: null,
    description: 'Electrical work varies significantly by scope',
    source: 'N/A',
    hasBenchmark: false,
    display: { showPSF: false, showPerUnit: false, showPerProject: false, primaryMetric: 'none' },
  },
};

/**
 * Plumbing benchmarks
 */
const PLUMBING_BENCHMARKS: Record<string, TradeBenchmark> = {
  'fixtures': {
    psfRange: null,
    perUnitRange: { low: 200, mid: 400, high: 700, unitLabel: 'per fixture' },
    perProjectRange: null,
    description: 'Plumbing fixture installation (labor, fixture not included)',
    source: 'Homewyse 2024, Regional contractor data',
    hasBenchmark: true,
    display: { showPSF: false, showPerUnit: true, showPerProject: false, primaryMetric: 'per-unit' },
  },
  'water-heater': {
    psfRange: null,
    perUnitRange: null,
    perProjectRange: { low: 1200, mid: 2000, high: 3500 },
    description: 'Water heater replacement (tank style, includes unit)',
    source: 'Homewyse 2024, Regional contractor data',
    hasBenchmark: true,
    display: { showPSF: false, showPerUnit: false, showPerProject: true, primaryMetric: 'per-project' },
  },
  'repipe': {
    psfRange: { low: 4, mid: 7, high: 12 },
    perUnitRange: null,
    perProjectRange: null,
    description: 'Whole house repipe (PEX, per square foot)',
    source: 'Homewyse 2024, Regional contractor data',
    hasBenchmark: true,
    display: { showPSF: true, showPerUnit: false, showPerProject: false, primaryMetric: 'psf' },
  },
  'unknown': {
    psfRange: null,
    perUnitRange: null,
    perProjectRange: null,
    description: 'Plumbing work varies significantly by scope',
    source: 'N/A',
    hasBenchmark: false,
    display: { showPSF: false, showPerUnit: false, showPerProject: false, primaryMetric: 'none' },
  },
};

/**
 * Remodel benchmarks (bathroom, kitchen, etc.)
 */
const REMODEL_BENCHMARKS: Record<string, TradeBenchmark> = {
  'bathroom-remodel': {
    psfRange: { low: 150, mid: 350, high: 600 },
    perUnitRange: null,
    perProjectRange: { low: 8000, mid: 18000, high: 40000 },
    description: 'Full bathroom remodel (multi-trade)',
    source: 'Homewyse 2024, NKBA data',
    hasBenchmark: true,
    display: { showPSF: true, showPerUnit: false, showPerProject: true, primaryMetric: 'psf' },
  },
  'kitchen-remodel': {
    psfRange: { low: 150, mid: 400, high: 800 },
    perUnitRange: null,
    perProjectRange: { low: 15000, mid: 40000, high: 100000 },
    description: 'Full kitchen remodel (multi-trade)',
    source: 'Homewyse 2024, NKBA data',
    hasBenchmark: true,
    display: { showPSF: true, showPerUnit: false, showPerProject: true, primaryMetric: 'psf' },
  },
  'basement-finishing': {
    psfRange: { low: 30, mid: 55, high: 90 },
    perUnitRange: null,
    perProjectRange: null,
    description: 'Basement finishing (per square foot)',
    source: 'Homewyse 2024, Regional contractor data',
    hasBenchmark: true,
    display: { showPSF: true, showPerUnit: false, showPerProject: false, primaryMetric: 'psf' },
  },
  'addition': {
    psfRange: { low: 150, mid: 275, high: 450 },
    perUnitRange: null,
    perProjectRange: null,
    description: 'Room addition (per square foot of new space)',
    source: 'Homewyse 2024, Regional contractor data',
    hasBenchmark: true,
    display: { showPSF: true, showPerUnit: false, showPerProject: false, primaryMetric: 'psf' },
  },
  'whole-house': {
    psfRange: { low: 100, mid: 200, high: 400 },
    perUnitRange: null,
    perProjectRange: null,
    description: 'Whole house renovation (per square foot)',
    source: 'Homewyse 2024, Regional contractor data',
    hasBenchmark: true,
    display: { showPSF: true, showPerUnit: false, showPerProject: false, primaryMetric: 'psf' },
  },
};

/**
 * Window benchmarks by type ($ per window installed)
 * 
 * Window pricing varies significantly by:
 * - Material (vinyl, wood, fiberglass)
 * - Style (double-hung, casement, bay/bow)
 * - Installation type (insert/pocket vs full-frame)
 * - Size and complexity
 */
const WINDOW_BENCHMARKS: Record<string, TradeBenchmark> = {
  'vinyl': {
    psfRange: null,
    perUnitRange: { low: 400, mid: 650, high: 950, unitLabel: 'per window' },
    perProjectRange: null,
    description: 'Standard vinyl window replacement (insert installation)',
    source: 'Homewyse 2024, Regional contractor data',
    hasBenchmark: true,
    display: { showPSF: false, showPerUnit: true, showPerProject: false, primaryMetric: 'per-unit' },
  },
  'fiberglass': {
    psfRange: null,
    perUnitRange: { low: 600, mid: 900, high: 1400, unitLabel: 'per window' },
    perProjectRange: null,
    description: 'Fiberglass/composite window replacement',
    source: 'Homewyse 2024, Regional contractor data',
    hasBenchmark: true,
    display: { showPSF: false, showPerUnit: true, showPerProject: false, primaryMetric: 'per-unit' },
  },
  'wood': {
    psfRange: null,
    perUnitRange: { low: 800, mid: 1200, high: 1800, unitLabel: 'per window' },
    perProjectRange: null,
    description: 'Wood window replacement (premium)',
    source: 'Homewyse 2024, Regional contractor data',
    hasBenchmark: true,
    display: { showPSF: false, showPerUnit: true, showPerProject: false, primaryMetric: 'per-unit' },
  },
  'bay-bow': {
    psfRange: null,
    perUnitRange: { low: 1500, mid: 2500, high: 4000, unitLabel: 'per window' },
    perProjectRange: null,
    description: 'Bay or bow window installation',
    source: 'Homewyse 2024, Regional contractor data',
    hasBenchmark: true,
    display: { showPSF: false, showPerUnit: true, showPerProject: false, primaryMetric: 'per-unit' },
  },
  'full-frame': {
    psfRange: null,
    perUnitRange: { low: 800, mid: 1200, high: 1800, unitLabel: 'per window' },
    perProjectRange: null,
    description: 'Full-frame window replacement (includes framing work)',
    source: 'Homewyse 2024, Regional contractor data',
    hasBenchmark: true,
    display: { showPSF: false, showPerUnit: true, showPerProject: false, primaryMetric: 'per-unit' },
  },
  'unknown': {
    psfRange: null,
    perUnitRange: { low: 450, mid: 750, high: 1200, unitLabel: 'per window' },
    perProjectRange: null,
    description: 'Window replacement (includes window + installation)',
    source: 'Homewyse 2024, Regional contractor data',
    hasBenchmark: true,
    display: { showPSF: false, showPerUnit: true, showPerProject: false, primaryMetric: 'per-unit' },
  },
};

/**
 * Other trades with benchmarks
 */
const OTHER_BENCHMARKS: Record<string, TradeBenchmark> = {
  'roofing': {
    psfRange: { low: 4, mid: 7, high: 12 },
    perUnitRange: null,
    perProjectRange: null,
    description: 'Roof replacement (asphalt shingles)',
    source: 'Homewyse 2024, Regional contractor data',
    hasBenchmark: true,
    display: { showPSF: true, showPerUnit: false, showPerProject: false, primaryMetric: 'psf' },
  },
  'siding': {
    psfRange: { low: 3, mid: 5.5, high: 8 },
    perUnitRange: null,
    perProjectRange: null,
    description: 'Vinyl siding installation (materials + labor)',
    source: 'Houzz 2024, Homewyse 2024',
    hasBenchmark: true,
    display: { showPSF: true, showPerUnit: false, showPerProject: false, primaryMetric: 'psf' },
  },
  'paver-patio': {
    psfRange: { low: 8.50, mid: 14.75, high: 21 },
    perUnitRange: null,
    perProjectRange: { low: 3400, mid: 5900, high: 8400 },
    description: 'Paver patio installation (materials + labor, typical 400 sqft)',
    source: 'Houzz 2024',
    hasBenchmark: true,
    display: { showPSF: true, showPerUnit: false, showPerProject: true, primaryMetric: 'psf' },
  },
  'countertops-granite': {
    psfRange: { low: 59, mid: 68.5, high: 78 },
    perUnitRange: null,
    perProjectRange: { low: 1770, mid: 2055, high: 2340 },
    description: 'Granite countertop installation (materials + labor, typical 30 sqft)',
    source: 'Houzz 2024',
    hasBenchmark: true,
    display: { showPSF: true, showPerUnit: false, showPerProject: true, primaryMetric: 'psf' },
  },
  'countertops-quartz': {
    psfRange: { low: 143, mid: 151, high: 159 },
    perUnitRange: null,
    perProjectRange: { low: 4290, mid: 4530, high: 4770 },
    description: 'Quartz countertop installation (materials + labor, typical 30 sqft)',
    source: 'Houzz 2024',
    hasBenchmark: true,
    display: { showPSF: true, showPerUnit: false, showPerProject: true, primaryMetric: 'psf' },
  },
  'countertops': {
    psfRange: { low: 59, mid: 109, high: 159 },
    perUnitRange: null,
    perProjectRange: null,
    description: 'Countertop installation (materials + labor)',
    source: 'Houzz 2024 (combined granite-quartz range)',
    hasBenchmark: true,
    display: { showPSF: true, showPerUnit: false, showPerProject: false, primaryMetric: 'psf' },
  },
  'windows-doors': {
    psfRange: null,
    perUnitRange: { low: 450, mid: 750, high: 1200, unitLabel: 'per window' },
    perProjectRange: null,
    description: 'Window replacement (includes window + installation)',
    source: 'Homewyse 2024, Regional contractor data',
    hasBenchmark: true,
    display: { showPSF: false, showPerUnit: true, showPerProject: false, primaryMetric: 'per-unit' },
  },
  'hvac': {
    psfRange: null,
    perUnitRange: null,
    perProjectRange: { low: 5000, mid: 9000, high: 15000 },
    description: 'HVAC system replacement',
    source: 'Homewyse 2024, Regional contractor data',
    hasBenchmark: true,
    display: { showPSF: false, showPerUnit: false, showPerProject: true, primaryMetric: 'per-project' },
  },
  'concrete': {
    psfRange: { low: 8, mid: 14, high: 22 },
    perUnitRange: null,
    perProjectRange: null,
    description: 'Concrete flatwork (driveway, patio)',
    source: 'Homewyse 2024, Regional contractor data',
    hasBenchmark: true,
    display: { showPSF: true, showPerUnit: false, showPerProject: false, primaryMetric: 'psf' },
  },
  'carpentry': {
    psfRange: null,
    perUnitRange: null,
    perProjectRange: null,
    description: 'Carpentry work varies significantly by scope',
    source: 'N/A',
    hasBenchmark: false,
    display: { showPSF: false, showPerUnit: false, showPerProject: false, primaryMetric: 'none' },
  },
  'landscaping': {
    psfRange: null,
    perUnitRange: null,
    perProjectRange: null,
    description: 'Landscaping work varies significantly by scope',
    source: 'N/A',
    hasBenchmark: false,
    display: { showPSF: false, showPerUnit: false, showPerProject: false, primaryMetric: 'none' },
  },
  'unknown': {
    psfRange: null,
    perUnitRange: null,
    perProjectRange: null,
    description: 'Unable to determine project type',
    source: 'N/A',
    hasBenchmark: false,
    display: { showPSF: false, showPerUnit: false, showPerProject: false, primaryMetric: 'none' },
  },
};

// ============================================================================
// BENCHMARK LOOKUP
// ============================================================================

/**
 * Get the benchmark for a specific trade detection result
 */
export function getTradeBenchmark(trade: TradeDetectionResult): TradeBenchmark {
  const { primaryTrade, subType } = trade;
  const sub = subType || 'unknown';
  
  switch (primaryTrade) {
    case 'flooring':
      return FLOORING_BENCHMARKS[sub] || FLOORING_BENCHMARKS['unknown'];
    case 'tile':
      return TILE_BENCHMARKS[sub] || TILE_BENCHMARKS['unknown'];
    case 'painting':
      return PAINTING_BENCHMARKS[sub] || PAINTING_BENCHMARKS['unknown'];
    case 'electrical':
      return ELECTRICAL_BENCHMARKS[sub] || ELECTRICAL_BENCHMARKS['unknown'];
    case 'plumbing':
      return PLUMBING_BENCHMARKS[sub] || PLUMBING_BENCHMARKS['unknown'];
    case 'bathroom-remodel':
      return REMODEL_BENCHMARKS['bathroom-remodel'];
    case 'kitchen-remodel':
      return REMODEL_BENCHMARKS['kitchen-remodel'];
    case 'basement-finishing':
      return REMODEL_BENCHMARKS['basement-finishing'];
    case 'addition':
      return REMODEL_BENCHMARKS['addition'];
    case 'whole-house':
    case 'general-remodel':
      return REMODEL_BENCHMARKS['whole-house'];
    case 'roofing':
      return OTHER_BENCHMARKS['roofing'];
    case 'siding':
      return OTHER_BENCHMARKS['siding'];
    case 'windows-doors':
      // Check for window-specific subtypes
      if (sub && WINDOW_BENCHMARKS[sub]) {
        return WINDOW_BENCHMARKS[sub];
      }
      return WINDOW_BENCHMARKS['unknown'];
    case 'hvac':
      return OTHER_BENCHMARKS['hvac'];
    case 'concrete':
      return OTHER_BENCHMARKS['concrete'];
    case 'carpentry':
      return OTHER_BENCHMARKS['carpentry'];
    case 'landscaping':
      return OTHER_BENCHMARKS['landscaping'];
    default:
      return OTHER_BENCHMARKS['unknown'];
  }
}

/**
 * Analyze a bid against trade-specific benchmarks
 */
export function analyzeBidWithTradeBenchmark(
  trade: TradeDetectionResult,
  bidTotal: number,
  squareFootage: number | null,
  unitCount?: number
): TradeBenchmarkAnalysis {
  const benchmark = getTradeBenchmark(trade);
  
  // If no benchmark available, return early
  if (!benchmark.hasBenchmark) {
    return {
      trade,
      benchmark,
      analysis: null,
    };
  }
  
  // Calculate PSF if we have square footage and the benchmark supports it
  const bidPSF = squareFootage && squareFootage > 0 ? bidTotal / squareFootage : null;
  
  // Determine status based on primary metric
  let status: 'below-market' | 'fair' | 'above-market' | 'significantly-above' | 'unknown' = 'unknown';
  let percentDifference: number | null = null;
  let statusMessage = '';
  
  if (benchmark.display.primaryMetric === 'psf' && bidPSF && benchmark.psfRange) {
    const { low, mid, high } = benchmark.psfRange;
    
    if (bidPSF < low * 0.8) {
      status = 'below-market';
      percentDifference = Math.round(((low - bidPSF) / low) * 100);
      statusMessage = `At $${bidPSF.toFixed(2)}/sf, this bid is ${percentDifference}% below the typical range ($${low}-$${high}/sf). Verify all work is included.`;
    } else if (bidPSF <= high * 1.1) {
      status = 'fair';
      percentDifference = Math.round(((bidPSF - mid) / mid) * 100);
      statusMessage = `At $${bidPSF.toFixed(2)}/sf, this bid is within the typical range ($${low}-$${high}/sf) for ${trade.displayName.toLowerCase()}.`;
    } else if (bidPSF <= high * 1.3) {
      status = 'above-market';
      percentDifference = Math.round(((bidPSF - high) / high) * 100);
      statusMessage = `At $${bidPSF.toFixed(2)}/sf, this bid is ${percentDifference}% above the typical high end ($${high}/sf). Consider getting additional quotes.`;
    } else {
      status = 'significantly-above';
      percentDifference = Math.round(((bidPSF - high) / high) * 100);
      statusMessage = `At $${bidPSF.toFixed(2)}/sf, this bid is ${percentDifference}% above typical rates. This may indicate premium materials or complexity, or could be overpriced.`;
    }
  } else if (benchmark.display.primaryMetric === 'per-project' && benchmark.perProjectRange) {
    const { low, mid, high } = benchmark.perProjectRange;
    
    if (bidTotal < low * 0.7) {
      status = 'below-market';
      percentDifference = Math.round(((low - bidTotal) / low) * 100);
      statusMessage = `At $${bidTotal.toLocaleString()}, this bid is ${percentDifference}% below the typical range ($${low.toLocaleString()}-$${high.toLocaleString()}). Verify all work and materials are included.`;
    } else if (bidTotal <= high * 1.15) {
      status = 'fair';
      percentDifference = Math.round(((bidTotal - mid) / mid) * 100);
      statusMessage = `At $${bidTotal.toLocaleString()}, this bid is within the typical range ($${low.toLocaleString()}-$${high.toLocaleString()}) for this type of project.`;
    } else if (bidTotal <= high * 1.4) {
      status = 'above-market';
      percentDifference = Math.round(((bidTotal - high) / high) * 100);
      statusMessage = `At $${bidTotal.toLocaleString()}, this bid is ${percentDifference}% above the typical high end. Consider getting additional quotes.`;
    } else {
      status = 'significantly-above';
      percentDifference = Math.round(((bidTotal - high) / high) * 100);
      statusMessage = `At $${bidTotal.toLocaleString()}, this bid is significantly above typical rates. Request a detailed breakdown.`;
    }
  } else if (benchmark.display.primaryMetric === 'per-unit' && benchmark.perUnitRange && unitCount) {
    const perUnit = bidTotal / unitCount;
    const { low, mid, high } = benchmark.perUnitRange;
    
    if (perUnit < low * 0.7) {
      status = 'below-market';
      percentDifference = Math.round(((low - perUnit) / low) * 100);
      statusMessage = `At $${perUnit.toFixed(0)} ${benchmark.perUnitRange.unitLabel}, this is ${percentDifference}% below typical rates.`;
    } else if (perUnit <= high * 1.15) {
      status = 'fair';
      percentDifference = Math.round(((perUnit - mid) / mid) * 100);
      statusMessage = `At $${perUnit.toFixed(0)} ${benchmark.perUnitRange.unitLabel}, this is within the typical range ($${low}-$${high}).`;
    } else {
      status = 'above-market';
      percentDifference = Math.round(((perUnit - high) / high) * 100);
      statusMessage = `At $${perUnit.toFixed(0)} ${benchmark.perUnitRange.unitLabel}, this is ${percentDifference}% above typical rates.`;
    }
  } else if (bidPSF === null && benchmark.display.primaryMetric === 'psf') {
    statusMessage = 'Add square footage to see how this bid compares to typical rates.';
  }
  
  return {
    trade,
    benchmark,
    analysis: {
      bidPSF,
      status,
      percentDifference,
      statusMessage,
    },
  };
}

/**
 * Get display-friendly benchmark label
 */
export function getBenchmarkLabel(benchmark: TradeBenchmark): string {
  if (benchmark.display.primaryMetric === 'psf' && benchmark.psfRange) {
    return `$${benchmark.psfRange.low} - $${benchmark.psfRange.high}/sf`;
  }
  if (benchmark.display.primaryMetric === 'per-project' && benchmark.perProjectRange) {
    return `$${benchmark.perProjectRange.low.toLocaleString()} - $${benchmark.perProjectRange.high.toLocaleString()}`;
  }
  if (benchmark.display.primaryMetric === 'per-unit' && benchmark.perUnitRange) {
    return `$${benchmark.perUnitRange.low} - $${benchmark.perUnitRange.high} ${benchmark.perUnitRange.unitLabel}`;
  }
  return 'Varies by scope';
}
