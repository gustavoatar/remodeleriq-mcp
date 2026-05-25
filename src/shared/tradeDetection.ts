// Enhanced Multi-Trade Detection Engine
// Detects multiple trades in a bid with confidence scores and metrics extraction

import { getBurdenMultiplier, ALL_OEWS_DATA, CONSTRUCTION_SOC_CODES, type OewsWageData } from './blsOewsData';
import { getWageDataWithFallback } from './marketRatesEngine';

// ============================================================================
// Legacy Exports (Backwards Compatibility)
// ============================================================================

export type TradeCategory = 
  | 'flooring' | 'tile' | 'painting' | 'electrical' | 'plumbing' | 'hvac' 
  | 'roofing' | 'carpentry' | 'windows-doors' | 'siding' | 'concrete' | 'landscaping'
  | 'bathroom-remodel' | 'kitchen-remodel' | 'basement-finishing' | 'addition' 
  | 'whole-house' | 'general-remodel' | 'unknown'
  // Legacy categories for backwards compat
  | 'kitchen' | 'bathroom' | 'general' | 'exterior' | 'drywall';
export type TradeSubType = 'hardwood' | 'laminate' | 'tile' | 'vinyl' | 'carpet' | 'interior' | 'exterior' | 'cabinet' | 'countertop' | 'full' | 'half' | 'master' | 'general';
export type PricingModel = 'per_sqft' | 'per_room' | 'per_unit' | 'hourly' | 'fixed';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface TradeDetectionResult {
  category: TradeCategory;
  subType: TradeSubType | null;
  pricingModel: PricingModel;
  // Confidence as string for UI components
  confidence: ConfidenceLevel;
  // Numeric confidence score (0-100) for calculations
  confidenceScore: number;
  // Primary array of matched keywords
  keywords: string[];
  // Also expose as matchedKeywords array for component compatibility
  matchedKeywords: string[];
  // Legacy fields for component compatibility
  displayName: string;
  isSingleTrade: boolean;
  primaryTrade: TradeCategory;
  secondaryTrades: TradeCategory[];
  scores: Record<string, number>;
}

export function detectProjectTrade(bidText: string): TradeDetectionResult {
  const detection = detectMultipleTrades(bidText);
  const primary = detection.primaryTrade;
  
  // Map new trade types to legacy categories
  const categoryMap: Record<TradeType, TradeCategory> = {
    paint: 'painting',
    flooring: 'flooring',
    electrical: 'electrical',
    plumbing: 'plumbing',
    hvac: 'hvac',
    roofing: 'roofing',
    drywall: 'drywall',
    carpentry: 'carpentry',
    windows: 'windows-doors',
    tile: 'tile',
    concrete: 'concrete',
    general_labor: 'general-remodel',
    general_remodel: 'general-remodel'
  };
  
  // Determine sub-type for flooring and windows
  let subType: TradeSubType | null = null;
  if (primary?.tradeType === 'flooring' && primary.metrics.materialType) {
    const matMap: Record<string, TradeSubType> = {
      hardwood: 'hardwood',
      lvp: 'vinyl',
      laminate: 'laminate',
      carpet: 'carpet',
      tile: 'tile'
    };
    subType = matMap[primary.metrics.materialType] || null;
  } else if (primary?.tradeType === 'windows') {
    // Window subtypes for benchmark lookup
    // Check for full-frame first (from materialSubtype), then material type
    if (primary.metrics.materialSubtype === 'full-frame') {
      subType = 'full-frame' as TradeSubType;
    } else if (primary.metrics.materialType) {
      // vinyl, wood, fiberglass, bay-bow
      subType = primary.metrics.materialType as TradeSubType;
    }
  }
  
  // Determine pricing model
  let pricingModel: PricingModel = 'fixed';
  if (primary?.tradeType === 'flooring' || primary?.tradeType === 'tile') {
    pricingModel = 'per_sqft';
  } else if (primary?.tradeType === 'paint') {
    pricingModel = primary.metrics.roomCount ? 'per_room' : 'per_sqft';
  } else if (primary?.tradeType === 'electrical' || primary?.tradeType === 'plumbing' || primary?.tradeType === 'windows') {
    pricingModel = 'per_unit';
  }
  
  // Build scores map from detected trades
  const scores: Record<string, number> = {};
  for (const trade of detection.trades) {
    const cat = categoryMap[trade.tradeType];
    scores[cat] = trade.confidence;
  }
  
  // Start with basic category from trade type
  let category: TradeCategory = primary ? categoryMap[primary.tradeType] : 'general-remodel';
  
  // Override category for multi-trade remodels based on project label
  // This ensures kitchen/bathroom/basement remodels get correct benchmarks
  if (detection.projectLabel === 'Kitchen Remodel') {
    category = 'kitchen-remodel';
  } else if (detection.projectLabel === 'Bathroom Remodel') {
    category = 'bathroom-remodel';
  } else if (detection.projectLabel.toLowerCase().includes('basement')) {
    category = 'basement-finishing';
  }
  
  // Build secondary trades list (excluding primary)
  const secondaryTrades: TradeCategory[] = detection.trades
    .filter(t => t !== primary && t.confidence >= 40)
    .map(t => categoryMap[t.tradeType]);
  
  // Convert numeric confidence to level
  const confidenceScore = primary?.confidence || 0;
  const confidenceLevel: ConfidenceLevel = confidenceScore >= 70 ? 'high' : confidenceScore >= 40 ? 'medium' : 'low';
  const keywords = primary?.matchedKeywords || [];
  
  return {
    category,
    subType,
    pricingModel,
    confidence: confidenceLevel,
    confidenceScore,
    keywords,
    matchedKeywords: keywords,
    displayName: detection.projectLabel,
    isSingleTrade: detection.isSingleTrade,
    primaryTrade: category,
    secondaryTrades,
    scores
  };
}

export function isFlooringProject(result: TradeDetectionResult): boolean {
  return result.category === 'flooring';
}

export function isMultiTradeRemodel(bidText: string): boolean {
  const detection = detectMultipleTrades(bidText);
  return detection.isMultiTrade && detection.trades.filter(t => t.confidence >= 50).length >= 2;
}

export function getBenchmarkCategory(result: TradeDetectionResult): string {
  if (result.category === 'flooring' && result.subType) {
    return `flooring_${result.subType}`;
  }
  return result.category;
}

// ============================================================================
// Types
// ============================================================================

export type TradeType = 
  | 'paint'
  | 'flooring'
  | 'electrical'
  | 'plumbing'
  | 'hvac'
  | 'roofing'
  | 'drywall'
  | 'carpentry'
  | 'windows'
  | 'tile'
  | 'concrete'
  | 'general_labor'
  | 'general_remodel';

export interface TradeMetrics {
  // Area measurements
  squareFeet?: number;
  wallSquareFeet?: number;
  roomCount?: number;
  
  // Unit counts
  fixtureCount?: number;
  outletCount?: number;
  windowCount?: number;
  doorCount?: number;
  
  // Material info
  materialType?: string;
  materialSubtype?: string;
  
  // Labor
  estimatedHours?: number;
}

export interface DetectedTradeBreakdown {
  tradeType: TradeType;
  tradeName: string;
  socCode: string;
  confidence: number; // 0-100
  
  // Extracted metrics
  metrics: TradeMetrics;
  
  // Cost allocation
  estimatedAmount?: number;  // Estimated portion of bid for this trade
  estimatedPercent?: number; // Percentage of total bid
  
  // Keywords that triggered this detection
  matchedKeywords: string[];
}

export interface MultiTradeDetectionResult {
  trades: DetectedTradeBreakdown[];
  primaryTrade: DetectedTradeBreakdown | null;
  projectLabel: string; // e.g., "Paint + Flooring Job" or "Kitchen Remodel"
  isSingleTrade: boolean;
  isMultiTrade: boolean;
  totalConfidence: number;
}

export interface TradeBenchmark {
  tradeType: TradeType;
  tradeName: string;
  
  // Hourly rate benchmarks (from BLS)
  hourlyLow: number;
  hourlyMedian: number;
  hourlyHigh: number;
  
  // Per-unit benchmarks (trade-specific)
  unitType: string; // 'sq_ft', 'room', 'fixture', 'outlet', etc.
  unitLow: number;
  unitMedian: number;
  unitHigh: number;
  
  // Data source info
  source: 'msa' | 'state' | 'national';
  areaName: string;
}

export interface TradeComparisonResult {
  trade: DetectedTradeBreakdown;
  benchmark: TradeBenchmark;
  
  // Comparison results
  bidAmount: number;
  marketEstimateLow: number;
  marketEstimateMedian: number;
  marketEstimateHigh: number;
  
  verdict: 'good_deal' | 'average' | 'expensive' | 'insufficient_data';
  verdictReason: string;
  percentDifference?: number;
}

// ============================================================================
// Trade Detection Patterns
// ============================================================================

interface TradePattern {
  tradeType: TradeType;
  tradeName: string;
  socCode: string;
  keywords: string[];
  strongKeywords: string[];  // Higher confidence keywords
  metricPatterns: {
    pattern: RegExp;
    extract: (match: RegExpMatchArray, text: string) => Partial<TradeMetrics>;
  }[];
}

const TRADE_PATTERNS: TradePattern[] = [
  {
    tradeType: 'paint',
    tradeName: 'Painting',
    socCode: CONSTRUCTION_SOC_CODES.PAINTERS,
    keywords: ['paint', 'primer', 'coating', 'stain', 'finish', 'latex', 'semi-gloss', 'eggshell', 'flat', 'satin', 'sherwin', 'behr', 'benjamin moore'],
    strongKeywords: ['interior paint', 'exterior paint', 'painting', 'repaint', 'paint job', 'paint work', 'wall paint', 'ceiling paint'],
    metricPatterns: [
      // Room count patterns
      {
        pattern: /(\d+)\s*(?:room|bedroom|bathroom|bath|br|ba)s?/gi,
        extract: (match) => ({ roomCount: parseInt(match[1]) })
      },
      // Square footage patterns for paint
      {
        pattern: /(\d{2,5})\s*(?:sq\.?\s*ft|square\s*feet|sf)\s*(?:of\s*)?(?:wall|paint|surface)/gi,
        extract: (match) => ({ wallSquareFeet: parseInt(match[1]) })
      },
      // "entire house" or "whole house"
      {
        pattern: /(?:entire|whole|full)\s*(?:house|home|interior|exterior)/gi,
        extract: () => ({ roomCount: 8 }) // Assume 8 rooms for whole house
      }
    ]
  },
  {
    tradeType: 'flooring',
    tradeName: 'Flooring',
    socCode: CONSTRUCTION_SOC_CODES.FLOOR_LAYERS,
    keywords: ['floor', 'flooring', 'hardwood', 'laminate', 'vinyl', 'lvp', 'lvt', 'carpet', 'tile floor', 'wood floor', 'engineered'],
    strongKeywords: ['flooring install', 'new floor', 'floor installation', 'replace floor', 'refinish floor', 'hardwood floor', 'laminate floor', 'vinyl plank', 'carpet install'],
    metricPatterns: [
      // Square footage patterns
      {
        pattern: /(\d{2,5})\s*(?:sq\.?\s*ft|square\s*feet|sf)\b/gi,
        extract: (match) => ({ squareFeet: parseInt(match[1]) })
      },
      // Material type detection
      {
        pattern: /\b(hardwood|oak|maple|hickory|walnut|bamboo)\b/gi,
        extract: () => ({ materialType: 'hardwood' })
      },
      {
        pattern: /\b(lvp|lvt|vinyl\s*plank|luxury\s*vinyl)\b/gi,
        extract: () => ({ materialType: 'lvp' })
      },
      {
        pattern: /\b(laminate)\b/gi,
        extract: () => ({ materialType: 'laminate' })
      },
      {
        pattern: /\b(carpet|carpeting)\b/gi,
        extract: () => ({ materialType: 'carpet' })
      },
      {
        pattern: /\b(tile|porcelain|ceramic)\s*(?:floor|flooring)?/gi,
        extract: () => ({ materialType: 'tile' })
      }
    ]
  },
  {
    tradeType: 'electrical',
    tradeName: 'Electrical',
    socCode: CONSTRUCTION_SOC_CODES.ELECTRICIANS,
    keywords: ['electric', 'electrical', 'wiring', 'outlet', 'switch', 'panel', 'circuit', 'breaker', 'lighting', 'fixture', 'recessed', 'can light'],
    strongKeywords: ['electrical work', 'rewire', 'electrical panel', 'circuit breaker', 'electrical service'],
    metricPatterns: [
      {
        pattern: /(\d+)\s*(?:outlet|receptacle)s?/gi,
        extract: (match) => ({ outletCount: parseInt(match[1]) })
      },
      {
        pattern: /(\d+)\s*(?:light|fixture|can|recessed)s?/gi,
        extract: (match) => ({ fixtureCount: parseInt(match[1]) })
      }
    ]
  },
  {
    tradeType: 'plumbing',
    tradeName: 'Plumbing',
    socCode: CONSTRUCTION_SOC_CODES.PLUMBERS,
    keywords: ['plumb', 'plumbing', 'pipe', 'drain', 'faucet', 'toilet', 'sink', 'shower', 'tub', 'water heater', 'disposal', 'sewer'],
    strongKeywords: ['plumbing work', 'plumbing repair', 'pipe repair', 'repipe', 'water heater install'],
    metricPatterns: [
      {
        pattern: /(\d+)\s*(?:fixture|faucet|toilet|sink|shower|tub)s?/gi,
        extract: (match) => ({ fixtureCount: parseInt(match[1]) })
      }
    ]
  },
  {
    tradeType: 'hvac',
    tradeName: 'HVAC',
    socCode: CONSTRUCTION_SOC_CODES.HVAC,
    keywords: ['hvac', 'heating', 'cooling', 'air conditioning', 'a/c', 'ac unit', 'furnace', 'ductwork', 'heat pump', 'mini split', 'thermostat'],
    strongKeywords: ['hvac install', 'hvac replacement', 'new ac', 'new furnace', 'ductwork install'],
    metricPatterns: []
  },
  {
    tradeType: 'roofing',
    tradeName: 'Roofing',
    socCode: CONSTRUCTION_SOC_CODES.ROOFERS,
    keywords: ['roof', 'roofing', 'shingle', 'shingles', 'gutter', 'flashing', 'soffit', 'fascia', 'ridge', 'leak'],
    strongKeywords: ['roof replacement', 'new roof', 'reroof', 'roof repair', 'shingle replacement'],
    metricPatterns: [
      {
        pattern: /(\d{2,5})\s*(?:sq\.?\s*ft|square\s*feet|sf)\b/gi,
        extract: (match) => ({ squareFeet: parseInt(match[1]) })
      },
      // Roofing squares (1 square = 100 sq ft)
      {
        pattern: /(\d+)\s*(?:square|sq)s?\s*(?:of\s*)?(?:roof|shingle)/gi,
        extract: (match) => ({ squareFeet: parseInt(match[1]) * 100 })
      }
    ]
  },
  {
    tradeType: 'drywall',
    tradeName: 'Drywall',
    socCode: CONSTRUCTION_SOC_CODES.DRYWALL,
    keywords: ['drywall', 'sheetrock', 'gypsum', 'wallboard', 'drywall repair', 'patch', 'texture', 'mud', 'tape'],
    strongKeywords: ['drywall install', 'drywall repair', 'hang drywall', 'drywall finish'],
    metricPatterns: [
      {
        pattern: /(\d{2,5})\s*(?:sq\.?\s*ft|square\s*feet|sf)\b/gi,
        extract: (match) => ({ squareFeet: parseInt(match[1]) })
      },
      {
        pattern: /(\d+)\s*(?:sheet|board|panel)s?/gi,
        extract: (match) => ({ squareFeet: parseInt(match[1]) * 32 }) // Assume 4x8 sheets
      }
    ]
  },
  {
    tradeType: 'carpentry',
    tradeName: 'Carpentry',
    socCode: CONSTRUCTION_SOC_CODES.CARPENTERS,
    keywords: ['carpentry', 'trim', 'molding', 'baseboard', 'crown', 'cabinet', 'door', 'window', 'framing', 'deck', 'millwork'],
    strongKeywords: ['trim work', 'cabinet install', 'door install', 'window install', 'framing work', 'deck build'],
    metricPatterns: [
      {
        pattern: /(\d+)\s*(?:door|window)s?/gi,
        extract: (match) => ({ doorCount: parseInt(match[1]) })
      },
      {
        pattern: /(\d+)\s*(?:linear|ln|lf)\s*(?:ft|feet)/gi,
        extract: (match) => ({ squareFeet: parseInt(match[1]) }) // Linear feet of trim
      }
    ]
  },
  {
    tradeType: 'tile',
    tradeName: 'Tile Work',
    socCode: CONSTRUCTION_SOC_CODES.TILE_SETTERS,
    keywords: ['tile', 'tiling', 'backsplash', 'shower tile', 'floor tile', 'wall tile', 'grout', 'ceramic', 'porcelain', 'marble', 'travertine'],
    strongKeywords: ['tile install', 'tile work', 'backsplash install', 'shower tile', 'tile floor'],
    metricPatterns: [
      {
        pattern: /(\d{1,5})\s*(?:sq\.?\s*ft|square\s*feet|sf)\b/gi,
        extract: (match) => ({ squareFeet: parseInt(match[1]) })
      }
    ]
  },
  {
    tradeType: 'concrete',
    tradeName: 'Concrete',
    socCode: CONSTRUCTION_SOC_CODES.CEMENT_MASONS,
    keywords: ['concrete', 'cement', 'foundation', 'slab', 'patio', 'driveway', 'sidewalk', 'stamped', 'pour'],
    strongKeywords: ['concrete pour', 'concrete work', 'foundation work', 'new driveway', 'concrete patio'],
    metricPatterns: [
      {
        pattern: /(\d{2,5})\s*(?:sq\.?\s*ft|square\s*feet|sf)\b/gi,
        extract: (match) => ({ squareFeet: parseInt(match[1]) })
      }
    ]
  },
  {
    tradeType: 'windows',
    tradeName: 'Window Replacement',
    socCode: CONSTRUCTION_SOC_CODES.CARPENTERS, // Windows typically installed by carpenters
    keywords: [
      'window', 'windows', 'double hung', 'double-hung', 'casement', 'sliding window',
      'picture window', 'egress', 'low-e', 'low e', 'argon', 'vinyl window',
      'wood window', 'fiberglass window', 'anderson', 'andersen', 'pella', 'marvin',
      'milgard', 'jeld-wen', 'simonton', 'replacement window'
    ],
    strongKeywords: [
      'window replacement', 'replace window', 'new window', 'window install', 
      'window installation', 'installing window', 'bay window', 'bow window',
      'double hung window', 'casement window', 'vinyl replacement'
    ],
    metricPatterns: [
      {
        pattern: /(\d+)\s*(?:new\s+)?windows?/gi,
        extract: (match) => ({ windowCount: parseInt(match[1]) })
      },
      {
        pattern: /windows?\s*[:\-]\s*(\d+)/gi,
        extract: (match) => ({ windowCount: parseInt(match[1]) })
      },
      {
        pattern: /install(?:ing)?\s*(\d+)\s*windows?/gi,
        extract: (match) => ({ windowCount: parseInt(match[1]) })
      },
      {
        pattern: /replac(?:e|ing)\s*(\d+)\s*windows?/gi,
        extract: (match) => ({ windowCount: parseInt(match[1]) })
      },
      // Detect window type for sub-categorization
      {
        pattern: /\b(bay|bow)\s*windows?/gi,
        extract: () => ({ materialType: 'bay-bow' })
      },
      {
        pattern: /\b(vinyl|pvc)\s*(?:replacement\s+)?windows?/gi,
        extract: () => ({ materialType: 'vinyl' })
      },
      {
        pattern: /\b(wood|wooden)\s*windows?/gi,
        extract: () => ({ materialType: 'wood' })
      },
      {
        pattern: /\b(fiberglass|composite)\s*windows?/gi,
        extract: () => ({ materialType: 'fiberglass' })
      },
      // Full-frame vs insert detection
      {
        pattern: /\b(full[\s-]?frame|frame[\s-]?replacement|new[\s-]?frame)/gi,
        extract: () => ({ materialSubtype: 'full-frame' })
      },
      {
        pattern: /\b(insert|pocket|retrofit)\s*(?:replacement|install)?/gi,
        extract: () => ({ materialSubtype: 'insert' })
      }
    ]
  },
  {
    tradeType: 'general_labor',
    tradeName: 'General Labor',
    socCode: CONSTRUCTION_SOC_CODES.CONSTRUCTION_LABORERS,
    keywords: ['demo', 'demolition', 'cleanup', 'haul', 'remove', 'disposal', 'prep', 'labor'],
    strongKeywords: ['demolition', 'demo work', 'site prep'],
    metricPatterns: []
  }
];

// ============================================================================
// Trade-Specific Benchmarks ($/unit)
// ============================================================================

// Paint benchmarks - labor + materials per room or per sq ft of wall
export const PAINT_BENCHMARKS = {
  // Per room (average 400 sq ft of wall per room, 2 coats)
  perRoom: {
    low: 200,     // Budget/DIY-assist
    median: 400,  // Standard contractor
    high: 700     // Premium/detailed work
  },
  // Per sq ft of wall area
  perSqFtWall: {
    low: 1.50,
    median: 3.00,
    high: 5.00
  }
};

// Flooring benchmarks - labor + materials per sq ft by type
export const FLOORING_BENCHMARKS: Record<string, { low: number; median: number; high: number; unitType: string }> = {
  hardwood: { low: 8, median: 12, high: 18, unitType: 'sq_ft' },
  lvp: { low: 4, median: 7, high: 10, unitType: 'sq_ft' },
  laminate: { low: 3, median: 5, high: 8, unitType: 'sq_ft' },
  carpet: { low: 3, median: 6, high: 10, unitType: 'sq_ft' },
  tile: { low: 10, median: 15, high: 25, unitType: 'sq_ft' },
  default: { low: 5, median: 8, high: 14, unitType: 'sq_ft' }
};

// Electrical benchmarks
export const ELECTRICAL_BENCHMARKS = {
  perOutlet: { low: 150, median: 250, high: 400 },
  perFixture: { low: 200, median: 350, high: 600 }
};

// Plumbing benchmarks
export const PLUMBING_BENCHMARKS = {
  perFixture: { low: 300, median: 500, high: 900 }
};

// ============================================================================
// Detection Functions
// ============================================================================

/**
 * Detect all trades present in bid text with confidence scores and metrics
 */
export function detectMultipleTrades(bidText: string): MultiTradeDetectionResult {
  const normalizedText = bidText.toLowerCase();
  const detectedTrades: DetectedTradeBreakdown[] = [];
  
  for (const pattern of TRADE_PATTERNS) {
    let confidence = 0;
    const matchedKeywords: string[] = [];
    const metrics: TradeMetrics = {};
    
    // Check strong keywords first (higher confidence)
    for (const keyword of pattern.strongKeywords) {
      if (normalizedText.includes(keyword.toLowerCase())) {
        confidence += 40;
        matchedKeywords.push(keyword);
      }
    }
    
    // Check regular keywords
    for (const keyword of pattern.keywords) {
      if (normalizedText.includes(keyword.toLowerCase())) {
        confidence += 15;
        matchedKeywords.push(keyword);
      }
    }
    
    // Cap confidence from keyword matching
    confidence = Math.min(confidence, 90);
    
    // Extract metrics using patterns
    for (const mp of pattern.metricPatterns) {
      const matches = bidText.matchAll(mp.pattern);
      for (const match of matches) {
        const extracted = mp.extract(match, bidText);
        Object.assign(metrics, extracted);
        confidence += 10; // Bonus for having extractable metrics
      }
    }
    
    // Cap total confidence at 100
    confidence = Math.min(confidence, 100);
    
    // Only include if we have reasonable confidence
    if (confidence >= 25) {
      detectedTrades.push({
        tradeType: pattern.tradeType,
        tradeName: pattern.tradeName,
        socCode: pattern.socCode,
        confidence,
        metrics,
        matchedKeywords: [...new Set(matchedKeywords)]
      });
    }
  }
  
  // Sort by confidence descending
  detectedTrades.sort((a, b) => b.confidence - a.confidence);
  
  // Determine primary trade
  const primaryTrade = detectedTrades.length > 0 ? detectedTrades[0] : null;
  
  // Generate project label
  const projectLabel = generateProjectLabel(detectedTrades);
  
  // Calculate total confidence (average of top trades)
  const totalConfidence = detectedTrades.length > 0
    ? Math.round(detectedTrades.slice(0, 3).reduce((sum, t) => sum + t.confidence, 0) / Math.min(3, detectedTrades.length))
    : 0;
  
  return {
    trades: detectedTrades,
    primaryTrade,
    projectLabel,
    isSingleTrade: detectedTrades.length === 1,
    isMultiTrade: detectedTrades.length > 1,
    totalConfidence
  };
}

/**
 * Per-unit trade types that should take priority when they are the primary trade
 */
const PER_UNIT_TRADE_TYPES: TradeType[] = ['windows'];

/**
 * Generate a human-readable project label
 */
function generateProjectLabel(trades: DetectedTradeBreakdown[]): string {
  if (trades.length === 0) return 'General Project';
  if (trades.length === 1) return `${trades[0].tradeName} Project`;
  
  // Filter to high-confidence trades (>50%)
  const highConfidence = trades.filter(t => t.confidence >= 50);
  
  if (highConfidence.length === 0) {
    return 'Multi-Trade Project';
  }
  
  // PRIORITY: If primary trade is a per-unit trade (windows, doors), always use it
  // This prevents window jobs from being labeled "General Remodel" due to minor secondary trades
  const primaryTrade = trades[0];
  if (PER_UNIT_TRADE_TYPES.includes(primaryTrade.tradeType) && primaryTrade.confidence >= 50) {
    // Check if primary trade has significantly higher confidence than secondary trades
    const secondaryMaxConfidence = trades.length > 1 
      ? Math.max(...trades.slice(1).map(t => t.confidence))
      : 0;
    
    // If primary per-unit trade has 20+ points more confidence, prioritize it
    if (primaryTrade.confidence - secondaryMaxConfidence >= 20 || primaryTrade.confidence >= 70) {
      return `${primaryTrade.tradeName} Project`;
    }
  }
  
  if (highConfidence.length === 1) {
    return `${highConfidence[0].tradeName} Project`;
  }
  
  if (highConfidence.length === 2) {
    return `${highConfidence[0].tradeName} + ${highConfidence[1].tradeName}`;
  }
  
  // 3+ high confidence trades = general remodel (but check for per-unit primary first)
  if (highConfidence.length >= 3) {
    // If the top trade is per-unit and has highest confidence by margin, use it
    if (PER_UNIT_TRADE_TYPES.includes(highConfidence[0].tradeType) && 
        highConfidence[0].confidence >= highConfidence[1].confidence + 10) {
      return `${highConfidence[0].tradeName} Project`;
    }
    
    const hasKitchenKeywords = trades.some(t => 
      t.matchedKeywords.some(k => k.includes('kitchen') || k.includes('cabinet'))
    );
    const hasBathKeywords = trades.some(t =>
      t.matchedKeywords.some(k => k.includes('bath') || k.includes('shower') || k.includes('tub'))
    );
    
    if (hasKitchenKeywords) return 'Kitchen Remodel';
    if (hasBathKeywords) return 'Bathroom Remodel';
    return 'General Remodel';
  }
  
  return `${highConfidence[0].tradeName} + ${highConfidence.length - 1} More`;
}

/**
 * Estimate cost allocation per trade when total is known
 */
export function estimateCostAllocation(
  trades: DetectedTradeBreakdown[],
  totalBid: number
): DetectedTradeBreakdown[] {
  if (trades.length === 0) return trades;
  
  // Calculate weights based on confidence and typical trade costs
  const TYPICAL_WEIGHTS: Record<TradeType, number> = {
    paint: 1.0,
    flooring: 1.5,
    electrical: 1.2,
    plumbing: 1.3,
    hvac: 2.0,
    roofing: 1.8,
    drywall: 0.8,
    carpentry: 1.2,
    tile: 1.3,
    concrete: 1.5,
    general_labor: 0.5,
    general_remodel: 1.0,
    windows: 1.6
  };
  
  // Calculate raw weights
  let totalWeight = 0;
  const weights: number[] = trades.map(trade => {
    const weight = (trade.confidence / 100) * TYPICAL_WEIGHTS[trade.tradeType];
    totalWeight += weight;
    return weight;
  });
  
  // Allocate costs proportionally
  return trades.map((trade, i) => ({
    ...trade,
    estimatedPercent: totalWeight > 0 ? Math.round((weights[i] / totalWeight) * 100) : 0,
    estimatedAmount: totalWeight > 0 ? Math.round((weights[i] / totalWeight) * totalBid) : 0
  }));
}

/**
 * Get benchmark for a specific trade in a specific location
 */
export function getTradeBenchmark(
  trade: DetectedTradeBreakdown,
  stateCode: string,
  msaCode?: string,
  wageData: OewsWageData[] = ALL_OEWS_DATA
): TradeBenchmark {
  // Get BLS wage data for this trade
  const { data, source } = getWageDataWithFallback(trade.socCode, msaCode, stateCode, wageData);
  
  // Apply trade-specific burden multiplier
  const tradeBurden = getBurdenMultiplier(trade.socCode);
  const hourlyLow = (data?.hourly_25 || 17) * tradeBurden;
  const hourlyMedian = (data?.hourly_median || 22) * tradeBurden;
  const hourlyHigh = (data?.hourly_75 || 30) * tradeBurden;
  
  // Get trade-specific unit benchmarks
  let unitType = 'hour';
  let unitLow = hourlyLow;
  let unitMedian = hourlyMedian;
  let unitHigh = hourlyHigh;
  
  switch (trade.tradeType) {
    case 'paint':
      if (trade.metrics.roomCount) {
        unitType = 'room';
        unitLow = PAINT_BENCHMARKS.perRoom.low;
        unitMedian = PAINT_BENCHMARKS.perRoom.median;
        unitHigh = PAINT_BENCHMARKS.perRoom.high;
      } else {
        unitType = 'sq_ft_wall';
        unitLow = PAINT_BENCHMARKS.perSqFtWall.low;
        unitMedian = PAINT_BENCHMARKS.perSqFtWall.median;
        unitHigh = PAINT_BENCHMARKS.perSqFtWall.high;
      }
      break;
      
    case 'flooring':
      const materialKey = trade.metrics.materialType || 'default';
      const floorBench = FLOORING_BENCHMARKS[materialKey] || FLOORING_BENCHMARKS.default;
      unitType = 'sq_ft';
      unitLow = floorBench.low;
      unitMedian = floorBench.median;
      unitHigh = floorBench.high;
      break;
      
    case 'electrical':
      if (trade.metrics.outletCount) {
        unitType = 'outlet';
        unitLow = ELECTRICAL_BENCHMARKS.perOutlet.low;
        unitMedian = ELECTRICAL_BENCHMARKS.perOutlet.median;
        unitHigh = ELECTRICAL_BENCHMARKS.perOutlet.high;
      } else if (trade.metrics.fixtureCount) {
        unitType = 'fixture';
        unitLow = ELECTRICAL_BENCHMARKS.perFixture.low;
        unitMedian = ELECTRICAL_BENCHMARKS.perFixture.median;
        unitHigh = ELECTRICAL_BENCHMARKS.perFixture.high;
      }
      break;
      
    case 'plumbing':
      if (trade.metrics.fixtureCount) {
        unitType = 'fixture';
        unitLow = PLUMBING_BENCHMARKS.perFixture.low;
        unitMedian = PLUMBING_BENCHMARKS.perFixture.median;
        unitHigh = PLUMBING_BENCHMARKS.perFixture.high;
      }
      break;
      
    case 'tile':
    case 'concrete':
    case 'drywall':
    case 'roofing':
      // These trades use $/sq ft but we'll base it on hourly rate
      // Typical productivity: ~100 sq ft per hour for tile, 200 for drywall
      const productivity = trade.tradeType === 'tile' ? 8 : 
                           trade.tradeType === 'drywall' ? 15 : 10;
      unitType = 'sq_ft';
      unitLow = hourlyLow / productivity;
      unitMedian = hourlyMedian / productivity;
      unitHigh = hourlyHigh / productivity;
      break;
  }
  
  return {
    tradeType: trade.tradeType,
    tradeName: trade.tradeName,
    hourlyLow: Math.round(hourlyLow * 100) / 100,
    hourlyMedian: Math.round(hourlyMedian * 100) / 100,
    hourlyHigh: Math.round(hourlyHigh * 100) / 100,
    unitType,
    unitLow: Math.round(unitLow * 100) / 100,
    unitMedian: Math.round(unitMedian * 100) / 100,
    unitHigh: Math.round(unitHigh * 100) / 100,
    source,
    areaName: data?.area_name || 'National'
  };
}

/**
 * Compare a trade against market benchmarks
 */
export interface MetricOverrides {
  windowCount?: number;
  squareFeet?: number;
  fixtureCount?: number;
  outletCount?: number;
}

export function compareTradeToMarket(
  trade: DetectedTradeBreakdown,
  bidAmount: number,
  stateCode: string,
  msaCode?: string,
  wageData: OewsWageData[] = ALL_OEWS_DATA,
  metricOverrides?: MetricOverrides
): TradeComparisonResult {
  // Apply metric overrides if provided (user-edited values take precedence)
  const effectiveMetrics = {
    ...trade.metrics,
    ...(metricOverrides?.windowCount !== undefined && { windowCount: metricOverrides.windowCount }),
    ...(metricOverrides?.squareFeet !== undefined && { squareFeet: metricOverrides.squareFeet }),
    ...(metricOverrides?.fixtureCount !== undefined && { fixtureCount: metricOverrides.fixtureCount }),
    ...(metricOverrides?.outletCount !== undefined && { outletCount: metricOverrides.outletCount }),
  };
  
  // Use effective metrics for comparison
  const tradeWithOverrides = { ...trade, metrics: effectiveMetrics };
  
  const benchmark = getTradeBenchmark(tradeWithOverrides, stateCode, msaCode, wageData);
  
  // Calculate market estimates based on extracted metrics
  let marketEstimateLow = 0;
  let marketEstimateMedian = 0;
  let marketEstimateHigh = 0;
  let hasValidComparison = false;
  
  switch (tradeWithOverrides.tradeType) {
    case 'paint':
      if (effectiveMetrics.roomCount) {
        marketEstimateLow = effectiveMetrics.roomCount * benchmark.unitLow;
        marketEstimateMedian = effectiveMetrics.roomCount * benchmark.unitMedian;
        marketEstimateHigh = effectiveMetrics.roomCount * benchmark.unitHigh;
        hasValidComparison = true;
      } else if (effectiveMetrics.wallSquareFeet) {
        marketEstimateLow = effectiveMetrics.wallSquareFeet * benchmark.unitLow;
        marketEstimateMedian = effectiveMetrics.wallSquareFeet * benchmark.unitMedian;
        marketEstimateHigh = effectiveMetrics.wallSquareFeet * benchmark.unitHigh;
        hasValidComparison = true;
      }
      break;
      
    case 'flooring':
      if (effectiveMetrics.squareFeet) {
        marketEstimateLow = effectiveMetrics.squareFeet * benchmark.unitLow;
        marketEstimateMedian = effectiveMetrics.squareFeet * benchmark.unitMedian;
        marketEstimateHigh = effectiveMetrics.squareFeet * benchmark.unitHigh;
        hasValidComparison = true;
      }
      break;
      
    case 'electrical':
      if (effectiveMetrics.outletCount && benchmark.unitType === 'outlet') {
        marketEstimateLow = effectiveMetrics.outletCount * benchmark.unitLow;
        marketEstimateMedian = effectiveMetrics.outletCount * benchmark.unitMedian;
        marketEstimateHigh = effectiveMetrics.outletCount * benchmark.unitHigh;
        hasValidComparison = true;
      } else if (effectiveMetrics.fixtureCount && benchmark.unitType === 'fixture') {
        marketEstimateLow = effectiveMetrics.fixtureCount * benchmark.unitLow;
        marketEstimateMedian = effectiveMetrics.fixtureCount * benchmark.unitMedian;
        marketEstimateHigh = effectiveMetrics.fixtureCount * benchmark.unitHigh;
        hasValidComparison = true;
      }
      break;
      
    case 'plumbing':
      if (effectiveMetrics.fixtureCount) {
        marketEstimateLow = effectiveMetrics.fixtureCount * benchmark.unitLow;
        marketEstimateMedian = effectiveMetrics.fixtureCount * benchmark.unitMedian;
        marketEstimateHigh = effectiveMetrics.fixtureCount * benchmark.unitHigh;
        hasValidComparison = true;
      }
      break;
      
    case 'windows':
      if (effectiveMetrics.windowCount) {
        marketEstimateLow = effectiveMetrics.windowCount * benchmark.unitLow;
        marketEstimateMedian = effectiveMetrics.windowCount * benchmark.unitMedian;
        marketEstimateHigh = effectiveMetrics.windowCount * benchmark.unitHigh;
        hasValidComparison = true;
      }
      break;
      
    case 'tile':
    case 'concrete':
    case 'drywall':
    case 'roofing':
      if (effectiveMetrics.squareFeet) {
        marketEstimateLow = effectiveMetrics.squareFeet * benchmark.unitLow;
        marketEstimateMedian = effectiveMetrics.squareFeet * benchmark.unitMedian;
        marketEstimateHigh = effectiveMetrics.squareFeet * benchmark.unitHigh;
        hasValidComparison = true;
      }
      break;
  }
  
  // Determine verdict
  let verdict: TradeComparisonResult['verdict'];
  let verdictReason: string;
  let percentDifference: number | undefined;
  
  if (!hasValidComparison) {
    verdict = 'insufficient_data';
    verdictReason = 'Unable to extract enough details for accurate comparison';
  } else {
    percentDifference = ((bidAmount - marketEstimateMedian) / marketEstimateMedian) * 100;
    
    if (bidAmount <= marketEstimateLow) {
      verdict = 'good_deal';
      verdictReason = `${Math.abs(percentDifference).toFixed(0)}% below market`;
    } else if (bidAmount >= marketEstimateHigh) {
      verdict = 'expensive';
      verdictReason = `${percentDifference.toFixed(0)}% above market`;
    } else {
      verdict = 'average';
      verdictReason = 'Within typical market range';
    }
  }
  
  return {
    trade: tradeWithOverrides,
    benchmark,
    bidAmount,
    marketEstimateLow: Math.round(marketEstimateLow),
    marketEstimateMedian: Math.round(marketEstimateMedian),
    marketEstimateHigh: Math.round(marketEstimateHigh),
    verdict,
    verdictReason,
    percentDifference
  };
}

/**
 * Full multi-trade comparison - the main function to use
 */
export function analyzeMultiTradeBid(
  bidText: string,
  bidTotal: number,
  stateCode: string,
  msaCode?: string
): {
  detection: MultiTradeDetectionResult;
  comparisons: TradeComparisonResult[];
  overallVerdict: 'good_deal' | 'average' | 'expensive' | 'mixed' | 'insufficient_data';
  overallReason: string;
} {
  // Detect all trades
  const detection = detectMultipleTrades(bidText);
  
  // Allocate costs
  const tradesWithCosts = estimateCostAllocation(detection.trades, bidTotal);
  
  // Compare each trade to market
  const comparisons: TradeComparisonResult[] = tradesWithCosts
    .filter(trade => trade.confidence >= 40) // Only compare reasonably confident detections
    .map(trade => compareTradeToMarket(
      trade,
      trade.estimatedAmount || bidTotal / tradesWithCosts.length,
      stateCode,
      msaCode
    ));
  
  // Calculate overall verdict
  const validComparisons = comparisons.filter(c => c.verdict !== 'insufficient_data');
  
  if (validComparisons.length === 0) {
    return {
      detection,
      comparisons,
      overallVerdict: 'insufficient_data',
      overallReason: 'Could not extract enough details for accurate market comparison'
    };
  }
  
  const goodDeals = validComparisons.filter(c => c.verdict === 'good_deal').length;
  const expensive = validComparisons.filter(c => c.verdict === 'expensive').length;
  
  let overallVerdict: 'good_deal' | 'average' | 'expensive' | 'mixed';
  let overallReason: string;
  
  if (goodDeals > 0 && expensive > 0) {
    overallVerdict = 'mixed';
    overallReason = 'Some trades priced well, others above market';
  } else if (goodDeals >= validComparisons.length / 2) {
    overallVerdict = 'good_deal';
    overallReason = 'Priced below market for detected trades';
  } else if (expensive >= validComparisons.length / 2) {
    overallVerdict = 'expensive';
    overallReason = 'Priced above market for detected trades';
  } else {
    overallVerdict = 'average';
    overallReason = 'Within typical market range';
  }
  
  return {
    detection,
    comparisons,
    overallVerdict,
    overallReason
  };
}
