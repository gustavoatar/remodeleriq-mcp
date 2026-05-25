/**
 * SMART PRICING ENGINE - Shared Helper Functions
 * 
 * This module provides shared pricing logic used by both:
 * - priceScoreEngine.ts ($/SF, $/LF, $/EA calculations)
 * - blindBidEngine.ts (lump sum bid analysis)
 * 
 * Centralizes complexity detection, waste factors, material detection,
 * and ROI data to avoid code duplication.
 */

import {
  AREA_RULES,
  LINEAR_RULES,
  UNIT_RULES,
  SYSTEM_RULES,
  ROI_DATA,
  SCOPE_FLAGS,
  getSmartRule,
  getWasteFactor,
  getExpectedLaborRatio,
  evaluateScopeFlags,
  type AreaRule,
  type RoiEntry,
  type PricingRange,
  type ScopeFlag,
} from './smartPricingRules';

// ============================================================================
// TYPES
// ============================================================================

export interface SmartBenchmarkResult {
  pricing: PricingRange;
  adjustedPricing: PricingRange;  // After complexity/waste applied
  wasteFactor: number;
  complexityMultiplier: number;
  laborPercent: { min: number; max: number };
  roiData: RoiEntry | null;
  materialType: string | null;
  unit: '$/SF' | '$/SQ' | '$/LF' | '$/EA' | '$/System';
  source: string;
  scopeFlags: string[];
}

export interface MaterialDetectionResult {
  material: string;
  confidence: 'high' | 'medium' | 'low';
  pricing?: PricingRange;
}

export interface ComplexityResult {
  multiplier: number;
  factors: string[];
}

// ============================================================================
// COMPLEXITY DETECTION
// ============================================================================

/**
 * Detect complexity multiplier from bid text based on project type rules
 */
export function detectComplexityMultiplier(projectType: string, bidText: string): ComplexityResult {
  const rule = getSmartRule(projectType) as AreaRule | null;
  
  if (!rule?.complexityMultipliers) {
    return { multiplier: 1.0, factors: [] };
  }
  
  const textLower = bidText.toLowerCase();
  let maxMultiplier = 1.0;
  const factors: string[] = [];
  
  for (const [keyword, mult] of Object.entries(rule.complexityMultipliers)) {
    // Convert keyword to searchable form (e.g., 'steep-pitch' -> 'steep pitch')
    const searchKey = keyword.replace(/-/g, ' ').replace(/_/g, ' ');
    const altKey = keyword.replace(/-/g, '').replace(/_/g, '');
    
    if (textLower.includes(searchKey) || textLower.includes(altKey) || textLower.includes(keyword)) {
      if (mult > maxMultiplier) {
        maxMultiplier = mult;
      }
      factors.push(keyword);
    }
  }
  
  return { multiplier: maxMultiplier, factors };
}

// ============================================================================
// MATERIAL DETECTION
// ============================================================================

/**
 * Detect material type from bid text for linear/unit projects
 */
export function detectMaterialType(projectType: string, bidText: string): MaterialDetectionResult {
  const linearRule = LINEAR_RULES[projectType];
  const unitRule = UNIT_RULES[projectType];
  const textLower = bidText.toLowerCase();
  
  // Check linear rules first
  if (linearRule?.materials) {
    for (const [material, pricing] of Object.entries(linearRule.materials)) {
      const searchTerms = getMaterialSearchTerms(material);
      for (const term of searchTerms) {
        if (textLower.includes(term)) {
          return {
            material,
            confidence: 'high',
            pricing: {
              low: pricing.low,
              median: pricing.median ?? (pricing.low + pricing.high) / 2,
              high: pricing.high
            }
          };
        }
      }
    }
  }
  
  // Check unit rules
  if (unitRule?.materials) {
    for (const [material, pricing] of Object.entries(unitRule.materials)) {
      const searchTerms = getMaterialSearchTerms(material);
      for (const term of searchTerms) {
        if (textLower.includes(term)) {
          return {
            material,
            confidence: 'high',
            pricing: {
              low: pricing.low,
              median: pricing.median ?? (pricing.low + pricing.high) / 2,
              high: pricing.high
            }
          };
        }
      }
    }
  }
  
  return { material: 'general', confidence: 'low' };
}

/**
 * Get search terms for a material type
 */
function getMaterialSearchTerms(material: string): string[] {
  const terms = [material.replace(/-/g, ' '), material.replace(/-/g, '')];
  
  // Add aliases
  const aliases: Record<string, string[]> = {
    'vinyl': ['vinyl', 'pvc'],
    'chain-link': ['chain link', 'chainlink', 'chain-link'],
    'wrought-iron': ['wrought iron', 'iron fence', 'ornamental iron'],
    'aluminum': ['aluminum', 'aluminium'],
    'composite': ['composite', 'trex', 'timbertech', 'fiberon'],
    'cedar': ['cedar', 'western red cedar'],
    'fiberglass': ['fiberglass', 'fibreglass', 'pultruded'],
    'seamless': ['seamless', 'continuous'],
    'copper': ['copper'],
    'laminate': ['laminate', 'formica'],
    'granite': ['granite'],
    'quartz': ['quartz', 'silestone', 'caesarstone', 'cambria'],
    'marble': ['marble', 'calacatta', 'carrara'],
    'butcher-block': ['butcher block', 'butcher-block', 'wood counter'],
    'hollow-core': ['hollow core', 'hollow-core'],
    'solid-core': ['solid core', 'solid-core'],
    'pocket': ['pocket door'],
    'barn': ['barn door', 'sliding barn'],
    'bay-bow': ['bay window', 'bow window', 'bay-bow'],
    'wood': ['wood', 'wooden', 'timber'],
    'steel': ['steel', 'galvanized'],
    'carriage': ['carriage', 'carriage house', 'carriage style'],
    'insulated': ['insulated', 'r-value', 'energy efficient'],
  };
  
  if (aliases[material]) {
    terms.push(...aliases[material]);
  }
  
  return terms;
}

// ============================================================================
// SMART BENCHMARK LOOKUP
// ============================================================================

/**
 * Get smart benchmark for a project type with all adjustments applied
 */
export function getSmartBenchmark(
  projectType: string, 
  bidText: string,
  options?: {
    applyComplexity?: boolean;
    applyWaste?: boolean;
  }
): SmartBenchmarkResult | null {
  const rule = getSmartRule(projectType);
  if (!rule) return null;
  
  const { applyComplexity = true, applyWaste = false } = options || {};
  
  // Get base pricing
  const basePricing = rule.basePricing;
  
  // Detect material for linear/unit projects
  const materialResult = detectMaterialType(projectType, bidText);
  let effectivePricing = materialResult.pricing || basePricing;
  
  // Get complexity multiplier
  const complexity = applyComplexity 
    ? detectComplexityMultiplier(projectType, bidText) 
    : { multiplier: 1.0, factors: [] };
  
  // Get waste factor
  const wasteFactor = getWasteFactor(projectType);
  
  // Calculate adjusted pricing
  let adjustedPricing: PricingRange = { ...effectivePricing };
  
  if (applyComplexity && complexity.multiplier > 1.0) {
    adjustedPricing = {
      low: Math.round(effectivePricing.low * complexity.multiplier),
      median: Math.round(effectivePricing.median * complexity.multiplier),
      high: Math.round(effectivePricing.high * complexity.multiplier)
    };
  }
  
  if (applyWaste) {
    adjustedPricing = {
      low: Math.round(adjustedPricing.low * (1 + wasteFactor)),
      median: Math.round(adjustedPricing.median * (1 + wasteFactor)),
      high: Math.round(adjustedPricing.high * (1 + wasteFactor))
    };
  }
  
  // Get labor percent
  const laborPercent = getExpectedLaborRatio(projectType);
  
  // Get ROI data
  const roiData = ROI_DATA[projectType] || null;
  
  // Determine unit type
  let unit: SmartBenchmarkResult['unit'] = '$/SF';
  if ('unit' in rule) {
    unit = rule.unit as SmartBenchmarkResult['unit'];
  }
  
  // Get scope flags
  const scopeFlags = ('scopeFlags' in rule && rule.scopeFlags) ? rule.scopeFlags : [];
  
  return {
    pricing: effectivePricing,
    adjustedPricing,
    wasteFactor,
    complexityMultiplier: complexity.multiplier,
    laborPercent,
    roiData,
    materialType: materialResult.material !== 'general' ? materialResult.material : null,
    unit,
    source: ('source' in rule && rule.source) ? rule.source : 'smartPricingRules',
    scopeFlags
  };
}

// ============================================================================
// ROI HELPERS
// ============================================================================

/**
 * Get ROI data for display
 */
export function getRoiDisplay(projectType: string): {
  hasRoi: boolean;
  recoveryPercent: string;
  joyScore: number | null;
  highlight: string | null;
  source: string | null;
} {
  const roi = ROI_DATA[projectType];
  
  if (!roi) {
    return { hasRoi: false, recoveryPercent: '', joyScore: null, highlight: null, source: null };
  }
  
  let recoveryPercent: string;
  if (Array.isArray(roi.recovery)) {
    recoveryPercent = `${Math.round(roi.recovery[0] * 100)}-${Math.round(roi.recovery[1] * 100)}%`;
  } else {
    recoveryPercent = `${Math.round(roi.recovery * 100)}%`;
  }
  
  return {
    hasRoi: true,
    recoveryPercent,
    joyScore: roi.joyScore ?? null,
    highlight: roi.highlight ?? null,
    source: roi.source
  };
}

/**
 * Check if project has high ROI (>90%)
 */
export function isHighRoiProject(projectType: string): boolean {
  const roi = ROI_DATA[projectType];
  if (!roi) return false;
  
  const recovery = Array.isArray(roi.recovery) ? roi.recovery[1] : roi.recovery;
  return recovery >= 0.90;
}

// ============================================================================
// LABOR RATIO VALIDATION
// ============================================================================

/**
 * Validate labor ratio against expected range for project type
 */
export function validateLaborRatio(
  projectType: string, 
  laborPercent: number
): {
  isValid: boolean;
  expectedRange: { min: number; max: number };
  flag: 'low' | 'high' | 'normal';
  message: string | null;
  deduction: number;
} {
  const expected = getExpectedLaborRatio(projectType);
  
  if (laborPercent < SYSTEM_RULES.laborShareAudit.minimumHealthy) {
    return {
      isValid: false,
      expectedRange: expected,
      flag: 'low',
      message: SYSTEM_RULES.laborShareAudit.flag.message,
      deduction: SYSTEM_RULES.laborShareAudit.flag.deduction
    };
  }
  
  if (laborPercent < expected.min) {
    return {
      isValid: false,
      expectedRange: expected,
      flag: 'low',
      message: `Labor at ${Math.round(laborPercent * 100)}% is below typical ${Math.round(expected.min * 100)}-${Math.round(expected.max * 100)}% for this trade`,
      deduction: -5
    };
  }
  
  if (laborPercent > expected.max + 0.15) {
    return {
      isValid: false,
      expectedRange: expected,
      flag: 'high',
      message: `Labor at ${Math.round(laborPercent * 100)}% is above typical ${Math.round(expected.min * 100)}-${Math.round(expected.max * 100)}% for this trade`,
      deduction: -3
    };
  }
  
  return {
    isValid: true,
    expectedRange: expected,
    flag: 'normal',
    message: null,
    deduction: 0
  };
}

// ============================================================================
// SCOPE FLAG EVALUATION
// ============================================================================

/**
 * Evaluate all applicable scope flags for a bid
 */
export function evaluateAllScopeFlags(
  projectType: string,
  bidText: string,
  bidTotal: number
): Array<{
  flagId: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  message: string;
  deduction: number;
}> {
  const results = evaluateScopeFlags(projectType, bidText, bidTotal);
  
  return results.map(({ flagId, flag }) => ({
    flagId,
    severity: flag.severity,
    message: flag.message,
    deduction: flag.deduction
  }));
}

// ============================================================================
// PERMIT CHECK
// ============================================================================

/**
 * Check if project likely requires permits
 */
export function checkPermitRequirement(
  projectType: string,
  bidTotal: number,
  bidText: string
): {
  requiresPermit: boolean;
  isExempt: boolean;
  mentionsPermit: boolean;
  flag: ScopeFlag | null;
} {
  const isExempt = SYSTEM_RULES.permitCheck.exemptCategories.some(cat =>
    projectType.toLowerCase().includes(cat)
  );
  
  const mentionsPermit = bidText.toLowerCase().includes('permit');
  const requiresPermit = bidTotal > SYSTEM_RULES.permitCheck.threshold && !isExempt;
  
  if (requiresPermit && !mentionsPermit) {
    return {
      requiresPermit: true,
      isExempt: false,
      mentionsPermit: false,
      flag: SYSTEM_RULES.permitCheck.flag
    };
  }
  
  return {
    requiresPermit,
    isExempt,
    mentionsPermit,
    flag: null
  };
}

// ============================================================================
// DEPOSIT RISK CHECK
// ============================================================================

/**
 * Check deposit amount for risk
 */
export function checkDepositRisk(
  depositPercent: number
): {
  isRisky: boolean;
  riskLevel: 'safe' | 'elevated' | 'high';
  recommendedMax: number;
  flag: ScopeFlag | null;
} {
  const { safeMaximum, recommendedStart } = SYSTEM_RULES.depositRisk;
  
  if (depositPercent > safeMaximum) {
    return {
      isRisky: true,
      riskLevel: 'high',
      recommendedMax: safeMaximum,
      flag: SYSTEM_RULES.depositRisk.flag
    };
  }
  
  if (depositPercent > recommendedStart * 2) {
    return {
      isRisky: true,
      riskLevel: 'elevated',
      recommendedMax: safeMaximum,
      flag: null
    };
  }
  
  return {
    isRisky: false,
    riskLevel: 'safe',
    recommendedMax: safeMaximum,
    flag: null
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  AREA_RULES,
  LINEAR_RULES,
  UNIT_RULES,
  SYSTEM_RULES,
  ROI_DATA,
  SCOPE_FLAGS,
  getSmartRule,
  getWasteFactor,
  getExpectedLaborRatio,
};
