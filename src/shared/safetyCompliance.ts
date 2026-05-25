/**
 * Safety & Compliance Module
 * 
 * Handles Pre-1978 Lead Safety (EPA RRP) requirements and 
 * Contingency Fund Detection for homeowner protection
 */

import type { AnalysisFlag } from './analysisEngine';

// ============================================================================
// TYPES
// ============================================================================

export interface LeadSafetyResult {
  isPreLead: boolean;              // true if home built before 1978
  requiresRRP: boolean;            // true if project type triggers RRP
  hasLeadLanguage: boolean;        // true if bid mentions lead safety
  adjustment: number;              // Points adjustment
  flag: AnalysisFlag | null;
  details: string[];
}

export interface ContingencyResult {
  hasContingency: boolean;         // true if contingency found in bid
  contingencyAmount: number | null; // Dollar amount if detected
  contingencyPercent: number | null; // Percentage if detected
  recommendedMin: number;          // 10% of bid total
  recommendedMax: number;          // 20% of bid total
  adjustment: number;              // Points adjustment
  flag: AnalysisFlag | null;
  details: string[];
}

export interface SafetyComplianceResult {
  leadSafety: LeadSafetyResult;
  contingency: ContingencyResult;
  totalAdjustment: number;
  allFlags: AnalysisFlag[];
}

// ============================================================================
// PRE-1978 LEAD SAFETY (EPA RRP)
// ============================================================================

// Work types that disturb lead paint and trigger RRP requirements
const RRP_TRIGGER_PATTERNS = [
  // Painting
  /\b(paint(ing)?|repaint|primer|sanding)\b/i,
  // Window/door work
  /\b(window|door)\s*(replacement|install|removal|repair)/i,
  /\breplace\s*(window|door)/i,
  // Demolition
  /\b(demo(lition)?|tear\s*out|remove|gut(ting)?)\b/i,
  // Renovation that disturbs surfaces
  /\b(remodel|renovation|renovate|refinish|restore|rehab)\b/i,
  // Drywall work
  /\b(drywall|sheetrock|plaster)\b/i,
  // Trim/millwork
  /\b(trim|baseboard|crown\s*molding|door\s*casing|window\s*casing)\b/i,
  // Siding
  /\b(siding|exterior\s*wall)\b/i,
  // Kitchen/bath (often involve surface disturbance)
  /\b(kitchen|bathroom|bath)\s*(remodel|renovation|update)/i,
];

// Patterns that indicate lead safety awareness
const LEAD_SAFETY_PATTERNS = [
  /\b(lead|lead-safe|lead\s*safe)\b/i,
  /\brrp\b/i,
  /\bepa\s*(certified|compliant|compliance|rrp)/i,
  /\blead\s*(abatement|testing|test|inspection)/i,
  /\blead-based\s*paint/i,
  /\bcertified\s*renovator/i,
  /\blead\s*cert(ified|ification)/i,
  /\bpre-renovation\s*disclosure/i,
  /\blbp/i, // Lead-based paint abbreviation
];

/**
 * Analyzes bid for Pre-1978 Lead Safety (EPA RRP) compliance
 * 
 * Logic:
 * - If yearBuilt < 1978 AND project triggers RRP (paint, windows, demo, etc.)
 * - AND no lead safety language found
 * - Flag as high severity, -15 pts
 */
export function calculateLeadSafety(
  bidContent: string,
  yearBuilt: number | null
): LeadSafetyResult {
  const details: string[] = [];
  
  // Default response if no year provided
  if (!yearBuilt) {
    return {
      isPreLead: false,
      requiresRRP: false,
      hasLeadLanguage: false,
      adjustment: 0,
      flag: null,
      details: ['Year built not provided - unable to assess lead safety requirements'],
    };
  }
  
  const isPreLead = yearBuilt < 1978;
  
  if (!isPreLead) {
    return {
      isPreLead: false,
      requiresRRP: false,
      hasLeadLanguage: false,
      adjustment: 0,
      flag: null,
      details: [`Home built in ${yearBuilt} (after 1978) - lead paint requirements do not apply`],
    };
  }
  
  details.push(`⚠️ Home built in ${yearBuilt} - pre-1978 (potential lead paint)`);
  
  // Check if project type triggers RRP requirements
  const requiresRRP = RRP_TRIGGER_PATTERNS.some(pattern => pattern.test(bidContent));
  
  if (!requiresRRP) {
    return {
      isPreLead: true,
      requiresRRP: false,
      hasLeadLanguage: false,
      adjustment: 0,
      flag: null,
      details: [
        ...details,
        'Project type does not appear to disturb painted surfaces - RRP may not apply',
      ],
    };
  }
  
  details.push('Project involves work that may disturb lead paint (RRP applies)');
  
  // Check if bid contains lead safety language
  const hasLeadLanguage = LEAD_SAFETY_PATTERNS.some(pattern => pattern.test(bidContent));
  
  if (hasLeadLanguage) {
    details.push('✓ Lead safety/EPA RRP language found in bid');
    return {
      isPreLead: true,
      requiresRRP: true,
      hasLeadLanguage: true,
      adjustment: 0,
      flag: null,
      details,
    };
  }
  
  // Missing lead safety language - flag it
  details.push('⚠️ No lead safety or EPA RRP language found');
  
  return {
    isPreLead: true,
    requiresRRP: true,
    hasLeadLanguage: false,
    adjustment: -15,
    flag: {
      id: 'lead-safety-missing',
      category: 'permit',
      level: 'high',
      title: 'Lead Safety Requirements Missing',
      description: `Your home was built in ${yearBuilt}, which means lead paint may be present. Federal EPA regulations require contractors to be EPA RRP certified and follow lead-safe work practices for renovation, repair, and painting projects in pre-1978 homes.`,
      recommendation: 'Ask the contractor: (1) Are you EPA RRP certified? (2) Will you follow lead-safe work practices? (3) Will you provide the required "Renovate Right" pamphlet before work begins?',
      whyItMatters: 'Lead paint dust from renovation is extremely hazardous, especially for children under 6 and pregnant women. Non-compliant work can result in fines up to $37,500 per day and serious health risks.',
    },
    details,
  };
}

// ============================================================================
// CONTINGENCY FUND DETECTION
// ============================================================================

// Patterns that indicate a contingency line item
const CONTINGENCY_PATTERNS = [
  /\bcontingency\b/i,
  /\bunforeseen\s*(costs?|conditions?|work|items?)?/i,
  /\ballowance\s+for\s+unforeseen/i,
  /\bunexpected\s*(costs?|conditions?|issues?)/i,
  /\breserve\s+fund/i,
  /\bbuffer\s+(?:for|fund)/i,
];

// Projects that typically require contingency
const MAJOR_RENOVATION_PATTERNS = [
  /\b(kitchen|bathroom|bath|basement|attic)\s*(remodel|renovation|finish)/i,
  /\bfull\s*(home|house)\s*(remodel|renovation)/i,
  /\broom\s*addition/i,
  /\b(structural|foundation|roof)\s*(repair|replacement|work)/i,
  /\bgut\s*(renovation|remodel)/i,
  /\baddition/i,
];

/**
 * Analyzes bid for contingency fund inclusion
 * 
 * Logic:
 * - For projects over $10,000 that are major renovations
 * - Should have 10-20% contingency built in
 * - If missing, flag as medium severity, -8 pts
 */
export function calculateContingency(
  bidContent: string,
  bidTotal: number | null
): ContingencyResult {
  const details: string[] = [];
  
  // Can't evaluate without bid total
  if (!bidTotal || bidTotal <= 0) {
    return {
      hasContingency: false,
      contingencyAmount: null,
      contingencyPercent: null,
      recommendedMin: 0,
      recommendedMax: 0,
      adjustment: 0,
      flag: null,
      details: ['Unable to assess contingency (no bid total)'],
    };
  }
  
  const recommendedMin = Math.round(bidTotal * 0.10);
  const recommendedMax = Math.round(bidTotal * 0.20);
  
  // Skip for smaller projects under $10,000
  if (bidTotal < 10000) {
    return {
      hasContingency: false,
      contingencyAmount: null,
      contingencyPercent: null,
      recommendedMin,
      recommendedMax,
      adjustment: 0,
      flag: null,
      details: ['Project under $10,000 - contingency optional'],
    };
  }
  
  // Check if this is a major renovation type
  const isMajorRenovation = MAJOR_RENOVATION_PATTERNS.some(pattern => pattern.test(bidContent));
  
  if (!isMajorRenovation) {
    details.push('Project does not appear to be a major renovation - contingency optional');
    return {
      hasContingency: false,
      contingencyAmount: null,
      contingencyPercent: null,
      recommendedMin,
      recommendedMax,
      adjustment: 0,
      flag: null,
      details,
    };
  }
  
  details.push('Major renovation detected - contingency fund recommended');
  
  // Check for contingency in bid
  const hasContingency = CONTINGENCY_PATTERNS.some(pattern => pattern.test(bidContent));
  
  // Try to extract contingency amount
  let contingencyAmount: number | null = null;
  let contingencyPercent: number | null = null;
  
  // Look for contingency with dollar amount
  const amountMatch = bidContent.match(/contingency[^\$]*\$\s*([\d,]+(?:\.\d{2})?)/i);
  if (amountMatch) {
    contingencyAmount = parseFloat(amountMatch[1].replace(/,/g, ''));
    contingencyPercent = (contingencyAmount / bidTotal) * 100;
    details.push(`✓ Contingency found: $${contingencyAmount.toLocaleString()} (${contingencyPercent.toFixed(1)}%)`);
  }
  
  // Look for contingency with percentage
  if (!contingencyAmount) {
    const percentMatch = bidContent.match(/contingency[^\d]*(\d{1,2})%/i) ||
                         bidContent.match(/(\d{1,2})%\s*contingency/i);
    if (percentMatch) {
      contingencyPercent = parseInt(percentMatch[1], 10);
      contingencyAmount = Math.round((contingencyPercent / 100) * bidTotal);
      details.push(`✓ Contingency found: ${contingencyPercent}% ($${contingencyAmount.toLocaleString()})`);
    }
  }
  
  if (hasContingency && contingencyAmount) {
    // Check if contingency is adequate
    if (contingencyPercent && contingencyPercent < 10) {
      details.push(`⚠️ Contingency is below recommended 10-20% (only ${contingencyPercent.toFixed(1)}%)`);
      return {
        hasContingency: true,
        contingencyAmount,
        contingencyPercent,
        recommendedMin,
        recommendedMax,
        adjustment: -5,
        flag: {
          id: 'contingency-low',
          category: 'financial',
          level: 'low',
          title: 'Contingency Fund Below Recommended',
          description: `This major renovation includes only ${contingencyPercent.toFixed(0)}% contingency ($${contingencyAmount.toLocaleString()}). Industry best practice recommends 10-20% for projects of this scope.`,
          recommendation: `Budget an additional $${(recommendedMin - contingencyAmount).toLocaleString()} to $${(recommendedMax - contingencyAmount).toLocaleString()} separately for unforeseen issues.`,
          whyItMatters: 'Renovations, especially in older homes, frequently uncover hidden problems. Having reserves prevents project delays or incomplete work.',
        },
        details,
      };
    }
    
    return {
      hasContingency: true,
      contingencyAmount,
      contingencyPercent,
      recommendedMin,
      recommendedMax,
      adjustment: 0,
      flag: null,
      details,
    };
  }
  
  if (hasContingency && !contingencyAmount) {
    // Contingency mentioned but amount not specified
    details.push('Contingency mentioned but amount not specified');
    return {
      hasContingency: true,
      contingencyAmount: null,
      contingencyPercent: null,
      recommendedMin,
      recommendedMax,
      adjustment: 0,
      flag: null,
      details,
    };
  }
  
  // No contingency found for major renovation - flag it
  details.push('⚠️ No contingency fund included in bid');
  
  return {
    hasContingency: false,
    contingencyAmount: null,
    contingencyPercent: null,
    recommendedMin,
    recommendedMax,
    adjustment: -8,
    flag: {
      id: 'contingency-missing',
      category: 'financial',
      level: 'medium',
      title: 'No Contingency Fund for Major Renovation',
      description: `This $${bidTotal.toLocaleString()} renovation bid does not include a contingency fund. Major renovations typically uncover hidden issues requiring additional work.`,
      recommendation: `Set aside $${recommendedMin.toLocaleString()} to $${recommendedMax.toLocaleString()} (10-20%) as a separate contingency fund for unforeseen conditions, even if it's not in the contractor's bid.`,
      whyItMatters: 'Without contingency, homeowners often face the choice of going over budget or leaving work incomplete when surprises arise. Plan for the unexpected.',
    },
    details,
  };
}

// ============================================================================
// PERMIT CHECK ENHANCEMENT
// ============================================================================

export interface PermitCheckResult {
  requiresPermit: boolean;          // true if project type typically requires permits
  detectedTrades: string[];         // Which permit-required trades were found
  hasPermitMention: boolean;        // true if bid mentions permits
  adjustment: number;               // Points adjustment
  flag: AnalysisFlag | null;
  details: string[];
}

// === WORK THAT TYPICALLY DOES NOT REQUIRE PERMITS ===
// GC Logic: refacing, painting, appliance swaps, flooring typically exempt
const PERMIT_EXEMPT_PATTERNS = [
  // Cabinet work (no structural changes)
  /\b(cabinet\s*)?refac(e|ing)\b/i,
  /\bcabinet\s*(paint|refinish)/i,
  // Painting only
  /^[^a-z]*paint(ing)?\s*(interior|exterior|room|wall|ceiling|trim|door)/i,
  // Appliance swaps (same location, no new circuits)
  /\b(replace|swap|new)\s*(dishwasher|refrigerator|fridge|range|stove|microwave)\b/i,
  /\bappliance\s*(swap|replacement|install)\b/i,
  // Flooring (no subfloor structural work)
  /\b(flooring|floor\s*install|hardwood|laminate|vinyl\s*plank|lvp|tile\s*floor|carpet)\b/i,
  // Cosmetic/surface work
  /\b(cosmetic|refresh|update|resurface)\b/i,
  // Fixture swaps (same location)
  /\b(replace|swap|new)\s*(faucet|showerhead|light\s*fixture|fan)\b/i,
];

// Trades that typically require permits with descriptions
const PERMIT_REQUIRED_TRADES: Record<string, { patterns: RegExp[]; reason: string; exemptions?: RegExp[] }> = {
  'electrical': {
    patterns: [
      /\b(electrical|electric)\s*(work|upgrade|service|panel)/i,
      /\b(rewir(e|ing)|new\s*wiring|add\s*circuit)/i,
      /\b(panel|breaker|sub[\s-]?panel)\s*(upgrade|replace|install)/i,
      /\b(electrical\s*rough|rough-in\s*electric)/i,
      /\b(outlet|switch|receptacle)\s*(add|move|relocate|new)/i,
      /\b(220|240)\s*volt/i,
      /\bev\s*charger/i,
    ],
    exemptions: [
      /\b(replace|swap)\s*(outlet|switch|cover|plate)\b/i, // Simple replacements
      /\b(light\s*fixture)\s*(replace|swap)\b/i, // Fixture swaps same location
    ],
    reason: 'Electrical work (new circuits, panel upgrades, relocations) requires permits and licensed electrician inspection'
  },
  'plumbing': {
    patterns: [
      /\b(plumbing)\s*(work|rough|move|relocate|new\s*line)/i,
      /\b(rough-in\s*plumb|plumbing\s*rough)\b/i,
      /\b(water\s*heater|tankless)\s*(install|replace)/i,
      /\b(drain|sewer|waste)\s*(line|pipe)\s*(new|move|replace)/i,
      /\bgas\s*line/i,
      /\b(toilet|sink|tub|shower)\s*(move|relocate|new\s*location)/i,
      /\b(add|new)\s*(bathroom|half\s*bath|full\s*bath)/i,
    ],
    exemptions: [
      /\b(replace|swap|new)\s*(faucet|showerhead|toilet\s*seat)\b/i, // Fixture swaps
      /\b(faucet|showerhead)\s*(replace|install)\b/i,
      /\btoilet\s*replace\b/i, // Same location toilet replacement
    ],
    reason: 'Plumbing alterations (new lines, relocations, water heaters) require permits for drainage, venting, and code compliance'
  },
  'hvac': {
    patterns: [
      /\b(hvac)\s*(system|install|replace|conversion)/i,
      /\b(furnace|air\s*condition|ac)\s*(install|replace|new)/i,
      /\b(heat\s*pump|geothermal)\b/i,
      /\b(central\s*air|mini[\s-]?split)\s*(install|add)/i,
      /\b(duct|ductwork)\s*(install|new|modify|add)/i,
      /\bconvert\s*(to\s*)?(gas|electric|heat\s*pump)/i,
    ],
    exemptions: [
      /\b(filter|thermostat)\s*(replace|install)\b/i, // Maintenance items
      /\bservice\s*(call|hvac)\b/i,
    ],
    reason: 'HVAC installation/conversion requires permits for load calculations, gas lines, and safety inspections'
  },
  'structural': {
    patterns: [
      /\b(structural|load[\s-]?bearing)\s*(wall|beam|column|change)/i,
      /\b(remove|tear\s*out|demo)\s*(wall|load[\s-]?bearing)/i,
      /\b(beam|header|lvl)\s*(install|add|new)/i,
      /\b(foundation|footing)\s*(repair|new|pour)/i,
      /\b(addition|room\s*addition|home\s*addition|build\s*out)\b/i,
      /\b(extend|extension)\s*(house|home|room)\b/i,
      /\bopen\s*(up\s*)?(floor\s*plan|concept|wall)/i,
      /\b(second\s*story|add\s*level|raise\s*roof)\b/i,
      /\bgarage\s*conversion\b/i,
      /\badu\b/i,
    ],
    reason: 'Structural modifications require engineer approval and building permits to ensure safety'
  },
  'roofing': {
    patterns: [
      /\b(re-roof|full\s*roof|roof\s*replacement|new\s*roof)\b/i,
      /\b(tear[\s-]?off|strip\s*roof)\b/i,
      /\broof\s*deck\s*(replace|repair|new)\b/i,
      /\broof\s*(sheathing|decking)\b/i,
    ],
    exemptions: [
      /\b(roof\s*)?repair\s*(shingle|flashing|leak)\b/i, // Minor repairs
      /\bpatch\s*roof\b/i,
    ],
    reason: 'Full roof replacement requires permits for inspection of decking, flashing, and ventilation'
  },
  'windows-structural': {
    patterns: [
      /\b(window)\s*(add|new\s*opening|cut|enlarge|resize)/i,
      /\bcut\s*(new\s*)?(window|opening)\b/i,
      /\b(egress|emergency\s*exit)\s*(window|requirement)/i,
      /\bstructural\s*(opening|header|change)/i,
    ],
    reason: 'New window openings or size changes require permits for structural headers and egress compliance'
  },
};

// Patterns that indicate permit awareness
const PERMIT_MENTION_PATTERNS = [
  /\bpermit/i,
  /\bbuilding\s*dept/i,
  /\binspection/i,
  /\bcode\s*(compliance|compliant|officer)/i,
  /\bpull(ing)?\s*permit/i,
  /\bpermit\s*fee/i,
  /\bhomeowner\s*(pulls?|responsible)/i,
];

/**
 * Analyzes bid for permit-required work without permit mention
 * 
 * GC Logic (2025):
 * - Permits REQUIRED: structural changes, plumbing/electrical moves, HVAC conversions, additions
 * - Permits NOT REQUIRED: refacing, painting, appliance swaps, flooring, fixture swaps
 */
export function calculatePermitCheck(
  bidContent: string
): PermitCheckResult {
  const details: string[] = [];
  
  // First check if this is permit-exempt work
  const isExemptWork = PERMIT_EXEMPT_PATTERNS.some(pattern => pattern.test(bidContent));
  
  // Find all permit-required trades in the bid
  const detectedTrades: string[] = [];
  const detectedReasons: string[] = [];
  
  for (const [trade, config] of Object.entries(PERMIT_REQUIRED_TRADES)) {
    let tradeFound = false;
    let isExempted = false;
    
    // Check if any permit-required patterns match
    for (const pattern of config.patterns) {
      if (pattern.test(bidContent)) {
        tradeFound = true;
        break;
      }
    }
    
    // If found, check if exemptions apply (e.g., fixture swaps, simple replacements)
    if (tradeFound && config.exemptions) {
      for (const exemption of config.exemptions) {
        if (exemption.test(bidContent)) {
          isExempted = true;
          break;
        }
      }
    }
    
    // Only flag if found AND not exempted
    if (tradeFound && !isExempted) {
      if (!detectedTrades.includes(trade)) {
        detectedTrades.push(trade);
        detectedReasons.push(config.reason);
      }
    }
  }
  
  // If ALL work appears permit-exempt (painting, flooring, cosmetic), don't flag
  if (detectedTrades.length === 0 || (isExemptWork && detectedTrades.length === 0)) {
    details.push('No permit-required trades detected (work appears exempt - cosmetic/surface level)');
    return {
      requiresPermit: false,
      detectedTrades: [],
      hasPermitMention: false,
      adjustment: 0,
      flag: null,
      details,
    };
  }
  
  details.push(`Permit-required trades found: ${detectedTrades.join(', ')}`);
  
  // Check if permits are mentioned
  const hasPermitMention = PERMIT_MENTION_PATTERNS.some(pattern => pattern.test(bidContent));
  
  if (hasPermitMention) {
    details.push('Bid mentions permits or inspections');
    return {
      requiresPermit: true,
      detectedTrades,
      hasPermitMention: true,
      adjustment: 0,
      flag: null,
      details,
    };
  }
  
  // No permit mention for permit-required work
  details.push('WARNING: No permit mention found for permit-required work');
  
  // Severity based on trade type and count
  // Structural/electrical/plumbing are most serious
  const hasHighRiskTrade = detectedTrades.some(t => 
    ['structural', 'electrical', 'plumbing', 'hvac'].includes(t)
  );
  
  // Higher penalty for multiple permit-required trades or high-risk trades
  let adjustment: number;
  let level: 'critical' | 'high' | 'medium';
  
  if (detectedTrades.length >= 3 || (hasHighRiskTrade && detectedTrades.length >= 2)) {
    adjustment = -15;
    level = 'critical';
  } else if (detectedTrades.length >= 2 || hasHighRiskTrade) {
    adjustment = -12;
    level = 'high';
  } else {
    adjustment = -8;
    level = 'medium';
  }
  
  const tradeList = detectedTrades.map(t => {
    // Clean up trade names for display
    const displayName = t.replace(/-/g, ' ').replace('windows structural', 'window openings');
    return displayName.charAt(0).toUpperCase() + displayName.slice(1);
  }).join(', ');
  
  return {
    requiresPermit: true,
    detectedTrades,
    hasPermitMention: false,
    adjustment,
    flag: {
      id: 'permit-not-mentioned',
      category: 'permit',
      level,
      title: 'Permits Not Addressed',
      description: `This bid includes ${tradeList.toLowerCase()} work which typically requires permits, but doesn't mention permits or inspections.`,
      recommendation: 'Ask the contractor: "Who pulls the permits and are permit fees included?" Unpermitted work can create problems when selling your home or filing insurance claims.',
      whyItMatters: detectedReasons[0] || 'Building permits ensure work is inspected for safety and code compliance. Unpermitted work may need to be torn out and redone.',
    },
    details,
  };
}

// ============================================================================
// COMBINED SAFETY COMPLIANCE CHECK
// ============================================================================

/**
 * Calculate all safety and compliance checks
 */
export function calculateSafetyCompliance(
  bidContent: string,
  bidTotal: number | null,
  yearBuilt: number | null
): SafetyComplianceResult {
  const leadSafety = calculateLeadSafety(bidContent, yearBuilt);
  const contingency = calculateContingency(bidContent, bidTotal);
  const permitCheck = calculatePermitCheck(bidContent);
  
  const allFlags: AnalysisFlag[] = [];
  if (leadSafety.flag) {
    allFlags.push(leadSafety.flag);
  }
  if (contingency.flag) {
    allFlags.push(contingency.flag);
  }
  if (permitCheck.flag) {
    allFlags.push(permitCheck.flag);
  }
  
  return {
    leadSafety,
    contingency,
    totalAdjustment: leadSafety.adjustment + contingency.adjustment + permitCheck.adjustment,
    allFlags,
  };
}
