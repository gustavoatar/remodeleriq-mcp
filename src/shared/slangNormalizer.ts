/**
 * Gemini-powered Contractor Slang Normalizer
 * Phase 1B: Normalizes contractor jargon to standard terms before scope analysis
 * 
 * Examples:
 * - "mud and tape" → "drywall finishing"
 * - "rough it in" → "plumbing/electrical rough-in"
 * - "skin it" → "siding/veneer"
 * - "trim out" → "finish carpentry/trim installation"
 */

export interface SlangNormalization {
  original: string;
  normalized: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface VagueTermFlag {
  term: string;
  type: 'allowance' | 'tbd' | 'vague-standard' | 'undefined-scope';
  warningText: string;
  estimatedRisk: 'high' | 'medium' | 'low';
}

export interface NormalizationResult {
  normalizedText: string;
  slangFound: SlangNormalization[];
  vagueTerms: VagueTermFlag[];
  wasProcessed: boolean;
}

// ============================================================================
// Static Slang Dictionary (Fast, no API calls)
// ============================================================================

// Comprehensive contractor slang → standard term mapping
export const SLANG_DICTIONARY: Record<string, string> = {
  // Drywall / Wall Finishing
  'mud and tape': 'drywall finishing (tape, mud, and texture)',
  'mud & tape': 'drywall finishing (tape, mud, and texture)',
  'tape and mud': 'drywall finishing (tape, mud, and texture)',
  'tape & mud': 'drywall finishing (tape, mud, and texture)',
  'hang and finish': 'drywall installation and finishing',
  'hang & finish': 'drywall installation and finishing',
  'level 5 finish': 'premium drywall finish (skim coat)',
  'skim coat': 'thin drywall compound finish coat',
  'float': 'drywall mud application',
  'rock': 'drywall panels/sheetrock',
  'rock the walls': 'install drywall',
  'board and tape': 'drywall installation and taping',
  
  // Plumbing
  'rough it in': 'plumbing rough-in (supply and drain lines)',
  'rough in': 'rough-in (plumbing/electrical pre-finish work)',
  'rough-in': 'rough-in (pre-finish infrastructure)',
  'stub out': 'plumbing stub-out (capped pipes for future fixtures)',
  'stub-out': 'plumbing stub-out (capped pipes)',
  'top out': 'plumbing vent stack completion',
  'trim out': 'finish plumbing (fixture installation)',
  'p-trap': 'drain trap installation',
  'run lines': 'install water supply/drain lines',
  'drop a toilet': 'toilet installation',
  'set fixtures': 'install plumbing fixtures (sink, toilet, etc.)',
  
  // Electrical
  'rough electrical': 'electrical rough-in (wiring before drywall)',
  'trim electrical': 'finish electrical (devices, covers, fixtures)',
  'pull wire': 'run electrical wiring',
  'home run': 'dedicated circuit to panel',
  'pig tail': 'short wire connector',
  'add a leg': 'add circuit capacity',
  'fish wire': 'pull wire through existing walls',
  'knock out': 'panel opening for breaker',
  
  // Framing / Carpentry
  'stick built': 'traditional wood framing',
  'stick frame': 'wood stud framing',
  'sister': 'reinforce by attaching parallel member',
  'sister the joist': 'reinforce joist with parallel joist',
  'scab': 'short reinforcement piece',
  'block in': 'add blocking between studs/joists',
  'furr out': 'build out wall/ceiling with strips',
  'fur out': 'build out surface with furring strips',
  'drop ceiling': 'suspended ceiling grid system',
  'soffit': 'boxed-out ceiling/cabinet area',
  'crown the studs': 'align stud curves consistently',
  'toe nail': 'angled nail connection',
  'face nail': 'nail through face of board',
  
  // Exterior
  'skin it': 'apply exterior cladding (siding/veneer)',
  'wrap it': 'install house wrap/weather barrier',
  'flash': 'install flashing (water diversion)',
  'flash it': 'install protective metal flashing',
  'kick out flashing': 'diverter flashing at roof/wall junction',
  'ice and water': 'ice and water shield membrane',
  'drip edge': 'roof edge metal flashing',
  'weep holes': 'drainage openings in masonry',
  
  // Roofing
  'tear off': 'remove existing roofing',
  'strip roof': 'remove shingles/underlayment',
  'deck it': 'install roof decking/sheathing',
  'dry in': 'make weathertight (underlayment installed)',
  'roll roofing': 'mineral-surface rolled roofing',
  'hot mop': 'apply hot asphalt roofing',
  'torch down': 'heat-applied modified bitumen roofing',
  
  // Flooring
  'float the floor': 'install floating floor system',
  'glue down': 'adhesive-attached flooring',
  'nail down': 'nail-attached hardwood flooring',
  'level the floor': 'apply self-leveling compound',
  'prep the slab': 'concrete floor preparation',
  'feather edge': 'taper patch to existing surface',
  
  // Painting
  'cut in': 'brush-paint edges before rolling',
  'roll out': 'apply paint with roller',
  'back roll': 'roll over sprayed paint for texture',
  'prime it': 'apply primer coat',
  'spot prime': 'prime repairs/patches only',
  'two coat': 'prime plus one finish coat',
  'three coat': 'prime plus two finish coats',
  
  // HVAC
  'drop a unit': 'install HVAC equipment',
  'set the unit': 'position HVAC equipment',
  'run duct': 'install ductwork',
  'trunk line': 'main duct run',
  'branch line': 'duct to individual register',
  'flex duct': 'flexible insulated ductwork',
  'hard pipe': 'rigid metal ductwork',
  'line set': 'refrigerant copper tubing',
  
  // Tile
  'float the wall': 'apply mortar bed for tile',
  'set tile': 'install tile with thinset',
  'butter and burn': 'back-butter tile and set quickly',
  'grout up': 'apply grout to tile joints',
  'caulk joints': 'apply silicone at corners/transitions',
  
  // General Construction
  'button up': 'complete/close up work area',
  'punch list': 'final corrections list',
  'punch out': 'complete punch list items',
  'close in': 'enclose structure (sheathed)',
  'lock up': 'building is secure (doors/windows in)',
  'blue tape': 'mark defects for correction',
  'red tag': 'inspection failure/violation',
  'green tag': 'inspection passed',
  'pull a permit': 'obtain building permit',
};

// Vague terms that indicate scope gaps or change order risk
export const VAGUE_TERM_PATTERNS: Array<{
  pattern: RegExp;
  type: VagueTermFlag['type'];
  warningText: string;
  risk: VagueTermFlag['estimatedRisk'];
}> = [
  {
    pattern: /\ballowance\s*(?:of\s*)?\$?[\d,]+/gi,
    type: 'allowance',
    warningText: 'Allowance items are not fixed prices - you may pay more if selections exceed the allowance.',
    risk: 'high'
  },
  {
    pattern: /\ballowance\b(?!\s*(?:of\s*)?\$)/gi,
    type: 'allowance',
    warningText: 'Unspecified allowance - the dollar amount is undefined, creating change order risk.',
    risk: 'high'
  },
  {
    pattern: /\b(?:tbd|to be determined|to be decided)\b/gi,
    type: 'tbd',
    warningText: 'Scope gap: This item needs to be determined and priced before signing.',
    risk: 'high'
  },
  {
    pattern: /\b(?:tba|to be announced|to be advised)\b/gi,
    type: 'tbd',
    warningText: 'Scope gap: This detail is undefined - confirm it in writing before signing.',
    risk: 'high'
  },
  {
    pattern: /\bper\s+(?:local\s+)?code\b/gi,
    type: 'vague-standard',
    warningText: 'Vague standard: "To code" is the legal minimum - clarify if you expect better quality.',
    risk: 'medium'
  },
  {
    pattern: /\bto\s+code\b/gi,
    type: 'vague-standard',
    warningText: 'Vague standard: Code is minimum requirement, not a quality specification.',
    risk: 'medium'
  },
  {
    pattern: /\bas\s+needed\b/gi,
    type: 'undefined-scope',
    warningText: 'Undefined scope: "As needed" is not a fixed quantity - could lead to extra charges.',
    risk: 'medium'
  },
  {
    pattern: /\bif\s+(?:required|needed|necessary)\b/gi,
    type: 'undefined-scope',
    warningText: 'Conditional scope: This work may or may not be included - clarify the conditions.',
    risk: 'medium'
  },
  {
    pattern: /\bor\s+equal\b/gi,
    type: 'vague-standard',
    warningText: 'Material substitution allowed: "Or equal" may result in different quality than expected.',
    risk: 'low'
  },
  {
    pattern: /\bsimilar\s+(?:to|quality)\b/gi,
    type: 'vague-standard',
    warningText: 'Vague specification: "Similar" is subjective - specify exact products.',
    risk: 'low'
  },
  {
    pattern: /\bstandard\s+(?:grade|quality)\b/gi,
    type: 'vague-standard',
    warningText: 'Vague quality: "Standard grade" varies by contractor - specify exact products.',
    risk: 'low'
  },
  {
    pattern: /\bbuilder(?:'s)?\s+grade\b/gi,
    type: 'vague-standard',
    warningText: 'Builder grade is typically the lowest quality tier - confirm this meets your expectations.',
    risk: 'medium'
  },
  {
    pattern: /\bnot\s+(?:to\s+exceed|nte)\s*\$?[\d,]+/gi,
    type: 'allowance',
    warningText: 'NTE cap: Work may cost less than stated, but you\'re agreeing to pay up to this amount.',
    risk: 'medium'
  },
  {
    pattern: /\btime\s+(?:and|&)\s+materials?\b/gi,
    type: 'undefined-scope',
    warningText: 'T&M work has no fixed price - you pay hourly rate plus materials. Request an NTE cap.',
    risk: 'high'
  },
  {
    pattern: /\bby\s+(?:the\s+)?(?:hour|day)\b/gi,
    type: 'undefined-scope',
    warningText: 'Hourly/daily rate with undefined duration - get a total estimate in writing.',
    risk: 'high'
  },
  {
    pattern: /\bexcludes?\b/gi,
    type: 'undefined-scope',
    warningText: 'Exclusion noted - these items are NOT included and will cost extra.',
    risk: 'medium'
  },
];

/**
 * Apply static slang normalization (fast, no API)
 */
export function normalizeSlangStatic(text: string): NormalizationResult {
  let normalizedText = text;
  const slangFound: SlangNormalization[] = [];
  const vagueTerms: VagueTermFlag[] = [];
  
  // Apply slang dictionary
  for (const [slang, standard] of Object.entries(SLANG_DICTIONARY)) {
    const pattern = new RegExp(`\\b${escapeRegex(slang)}\\b`, 'gi');
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        slangFound.push({
          original: match,
          normalized: standard,
          confidence: 'high'
        });
      }
      normalizedText = normalizedText.replace(pattern, standard);
    }
  }
  
  // Detect vague terms
  for (const { pattern, type, warningText, risk } of VAGUE_TERM_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        // Avoid duplicates
        if (!vagueTerms.some(v => v.term.toLowerCase() === match.toLowerCase())) {
          vagueTerms.push({
            term: match,
            type,
            warningText,
            estimatedRisk: risk
          });
        }
      }
    }
  }
  
  return {
    normalizedText,
    slangFound,
    vagueTerms,
    wasProcessed: slangFound.length > 0 || vagueTerms.length > 0
  };
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================================================
// Gemini-powered Slang Normalization (For complex/unknown slang)
// ============================================================================

export interface GeminiSlangResult extends NormalizationResult {
  geminiUsed: boolean;
  geminiSlang: SlangNormalization[];
}

/**
 * Build the Gemini prompt for slang normalization
 */
export function buildSlangNormalizationPrompt(bidText: string): string {
  return `You are a construction industry expert. Analyze this contractor bid and:

1. Identify any contractor slang, jargon, or informal terms
2. Translate each to standard construction terminology
3. Flag any vague terms that could lead to change orders

BID TEXT:
"""
${bidText}
"""

Respond with JSON only:
{
  "slangTerms": [
    {
      "original": "the exact slang phrase found",
      "normalized": "standard construction terminology",
      "context": "brief explanation of what this means"
    }
  ],
  "vagueTerms": [
    {
      "term": "the vague phrase found",
      "concern": "why this is problematic",
      "recommendation": "what to ask the contractor"
    }
  ]
}

IMPORTANT:
- Only include terms that would confuse a homeowner
- Don't flag standard construction terms (drywall, framing, etc.)
- Focus on regional slang, informal abbreviations, and unclear scope language
- If no slang or vague terms found, return empty arrays`;
}

/**
 * Parse Gemini's slang normalization response
 */
export function parseGeminiSlangResponse(responseText: string): {
  slang: SlangNormalization[];
  vague: VagueTermFlag[];
} {
  try {
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { slang: [], vague: [] };
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    const slang: SlangNormalization[] = (parsed.slangTerms || []).map((s: { original: string; normalized: string }) => ({
      original: s.original,
      normalized: s.normalized,
      confidence: 'medium' as const
    }));
    
    const vague: VagueTermFlag[] = (parsed.vagueTerms || []).map((v: { term: string; concern: string }) => ({
      term: v.term,
      type: 'undefined-scope' as const,
      warningText: v.concern,
      estimatedRisk: 'medium' as const
    }));
    
    return { slang, vague };
  } catch {
    return { slang: [], vague: [] };
  }
}

// ============================================================================
// Combined Normalization (Static + Gemini fallback)
// ============================================================================

/**
 * Get total vague term risk score
 */
export function calculateVagueTermRisk(vagueTerms: VagueTermFlag[]): {
  score: number; // 0-100
  level: 'high' | 'medium' | 'low';
  summary: string;
} {
  if (vagueTerms.length === 0) {
    return {
      score: 100,
      level: 'low',
      summary: 'No vague terms detected'
    };
  }
  
  let deduction = 0;
  let highRiskCount = 0;
  
  for (const term of vagueTerms) {
    switch (term.estimatedRisk) {
      case 'high':
        deduction += 10;
        highRiskCount++;
        break;
      case 'medium':
        deduction += 5;
        break;
      case 'low':
        deduction += 2;
        break;
    }
  }
  
  const score = Math.max(0, 100 - deduction);
  const level = highRiskCount >= 2 ? 'high' : (score < 70 ? 'medium' : 'low');
  
  const summary = highRiskCount >= 2
    ? `${highRiskCount} high-risk vague terms found - significant change order risk`
    : vagueTerms.length > 3
      ? `${vagueTerms.length} vague terms detected - review scope carefully`
      : `${vagueTerms.length} minor scope clarifications needed`;
  
  return { score, level, summary };
}
