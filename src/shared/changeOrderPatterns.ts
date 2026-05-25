/**
 * Change Order Predictor - Data Layer
 * 
 * AI-powered detection of scope areas likely to cause add-on costs later.
 * Identifies risky language patterns and predicts typical cost overruns based
 * on industry data.
 */

// ============================================================================
// TYPES
// ============================================================================

export type RiskLevel = 'high' | 'medium' | 'low';
export type ChangeOrderCategory = 
  | 'allowance'        // Open-ended allowances
  | 'exclusion'        // Explicitly excluded work
  | 'assumption'       // Work based on assumptions
  | 'discovery'        // Hidden condition risks
  | 'undefined'        // Vague/TBD items
  | 'scope-gap'        // Missing typical scope items
  | 'material'         // Material selection pending
  | 'permit'           // Permit/code related
  | 'structural';      // Structural unknowns

export interface ChangeOrderPattern {
  id: string;
  pattern: RegExp;
  category: ChangeOrderCategory;
  riskLevel: RiskLevel;
  title: string;
  description: string;
  typicalOverrun: { min: number; max: number };  // Percentage over original item cost
  questionToAsk: string;
}

export interface ProjectTypeRisk {
  projectType: string;
  commonChangeOrders: CommonChangeOrder[];
}

export interface CommonChangeOrder {
  item: string;
  frequency: string;       // "Very Common", "Common", "Occasional"
  typicalCost: string;     // e.g., "$500-$2,000"
  triggerPhrases: string[];
  preventionQuestion: string;
}

// ============================================================================
// RISKY PHRASE PATTERNS
// ============================================================================

export const CHANGE_ORDER_PATTERNS: ChangeOrderPattern[] = [
  // === ALLOWANCES (HIGH RISK) ===
  {
    id: 'allowance-fixture',
    pattern: /\ballowance\s*(?:for|:)?\s*(?:\$[\d,]+\s*)?(?:for\s*)?(fixtures?|lighting|plumbing\s*fixtures?|hardware)/i,
    category: 'allowance',
    riskLevel: 'high',
    title: 'Fixture Allowance',
    description: 'Vague fixture allowances average 40% overruns when homeowners select actual products.',
    typicalOverrun: { min: 20, max: 60 },
    questionToAsk: 'Can you provide a specific list of fixtures with model numbers and prices, or show me what this allowance covers?',
  },
  {
    id: 'allowance-flooring',
    pattern: /\ballowance\s*(?:for|:)?\s*(?:\$[\d,]+\s*)?(?:for\s*)?(flooring|carpet|tile|hardwood|lvp)/i,
    category: 'allowance',
    riskLevel: 'high',
    title: 'Flooring Allowance',
    description: 'Flooring allowances often underestimate material costs by 25-50% once selections are made.',
    typicalOverrun: { min: 25, max: 50 },
    questionToAsk: 'What flooring grade/brand does this allowance cover? Can I see samples at this price point?',
  },
  {
    id: 'allowance-cabinets',
    pattern: /\ballowance\s*(?:for|:)?\s*(?:\$[\d,]+\s*)?(?:for\s*)?(cabinet|cabinetry)/i,
    category: 'allowance',
    riskLevel: 'high',
    title: 'Cabinet Allowance',
    description: 'Cabinet allowances are notoriously underestimated. Upgrades to soft-close, better wood, or custom sizing add up fast.',
    typicalOverrun: { min: 30, max: 80 },
    questionToAsk: 'What cabinet line/manufacturer does this allowance cover? Are soft-close hinges included?',
  },
  {
    id: 'allowance-countertop',
    pattern: /\ballowance\s*(?:for|:)?\s*(?:\$[\d,]+\s*)?(?:for\s*)?(countertop|counter\s*top|granite|quartz|marble)/i,
    category: 'allowance',
    riskLevel: 'high',
    title: 'Countertop Allowance',
    description: 'Countertop allowances often cover builder-grade materials. Quartz/granite upgrades typically add 30-60%.',
    typicalOverrun: { min: 30, max: 60 },
    questionToAsk: 'What stone/material does this allowance cover? What edge profile is included?',
  },
  {
    id: 'allowance-appliances',
    pattern: /\ballowance\s*(?:for|:)?\s*(?:\$[\d,]+\s*)?(?:for\s*)?(appliances?)/i,
    category: 'allowance',
    riskLevel: 'medium',
    title: 'Appliance Allowance',
    description: 'Appliance allowances may not cover installation, hookups, or code-required electrical upgrades.',
    typicalOverrun: { min: 15, max: 40 },
    questionToAsk: 'Does this include installation, electrical hookups, and gas line work if needed?',
  },
  {
    id: 'allowance-generic',
    pattern: /\ballowance\s*(?:for|:)?\s*(?:\$[\d,]+\s*)?(?:for\s*)?(materials?|selections?|finishes)/i,
    category: 'allowance',
    riskLevel: 'medium',
    title: 'Material Allowance',
    description: 'Generic material allowances leave significant room for cost increases once you make actual selections.',
    typicalOverrun: { min: 20, max: 50 },
    questionToAsk: 'What specific products/grades does this allowance cover? Can I see examples?',
  },

  // === EXCLUSIONS (HIGH RISK) ===
  {
    id: 'excludes-permits',
    pattern: /(?:exclud(?:es?|ing)|not\s+included?|does\s+not\s+include)\s*[:;]?\s*(?:building\s+)?permits?/i,
    category: 'exclusion',
    riskLevel: 'high',
    title: 'Permits Excluded',
    description: 'Permit costs can add $500-$5,000+ depending on project scope and location.',
    typicalOverrun: { min: 5, max: 15 },
    questionToAsk: 'What permits are required and what is the estimated cost? Will you handle the permit process?',
  },
  {
    id: 'excludes-electrical',
    pattern: /(?:exclud(?:es?|ing)|not\s+included?|does\s+not\s+include)\s*[:;]?\s*(?:any\s+)?electrical/i,
    category: 'exclusion',
    riskLevel: 'high',
    title: 'Electrical Excluded',
    description: 'Electrical work is often required in renovations but excluded from base bids.',
    typicalOverrun: { min: 10, max: 30 },
    questionToAsk: 'What electrical work will be needed? Can you include an estimate for that scope?',
  },
  {
    id: 'excludes-plumbing',
    pattern: /(?:exclud(?:es?|ing)|not\s+included?|does\s+not\s+include)\s*[:;]?\s*(?:any\s+)?plumbing/i,
    category: 'exclusion',
    riskLevel: 'high',
    title: 'Plumbing Excluded',
    description: 'Plumbing modifications during renovations can add $1,000-$10,000 depending on scope.',
    typicalOverrun: { min: 10, max: 25 },
    questionToAsk: 'Will any plumbing work be required? What happens if we encounter plumbing issues?',
  },
  {
    id: 'excludes-disposal',
    pattern: /(?:exclud(?:es?|ing)|not\s+included?|does\s+not\s+include)\s*[:;]?\s*(?:debris|disposal|haul[\s-]?away|dump)/i,
    category: 'exclusion',
    riskLevel: 'medium',
    title: 'Disposal/Hauling Excluded',
    description: 'Debris removal and dump fees typically cost $300-$1,500 for renovation projects.',
    typicalOverrun: { min: 3, max: 10 },
    questionToAsk: 'What is the estimated cost for debris removal? Is a dumpster included?',
  },
  {
    id: 'excludes-drywall-repair',
    pattern: /(?:exclud(?:es?|ing)|not\s+included?|does\s+not\s+include)\s*[:;]?\s*(?:drywall|wall\s+repair|patching)/i,
    category: 'exclusion',
    riskLevel: 'medium',
    title: 'Drywall Repair Excluded',
    description: 'Drywall patching and finishing after electrical/plumbing work is commonly overlooked.',
    typicalOverrun: { min: 5, max: 15 },
    questionToAsk: 'Who will handle drywall repair after any wall work? Can this be included?',
  },

  // === ASSUMPTIONS (HIGH RISK) ===
  {
    id: 'assumes-condition',
    pattern: /\bassumes?\b[^.]*(?:existing|current|good|normal|standard)\s*(?:condition|framing|wiring|plumbing|structure)/i,
    category: 'assumption',
    riskLevel: 'high',
    title: 'Assumes Good Condition',
    description: 'If existing conditions are worse than assumed, change orders will follow.',
    typicalOverrun: { min: 15, max: 40 },
    questionToAsk: 'What happens if the existing condition is worse than assumed? Is there a contingency?',
  },
  {
    id: 'assumes-access',
    pattern: /\bassumes?\b[^.]*(?:clear|easy|adequate|normal)\s*(?:access|workspace|working\s*area)/i,
    category: 'assumption',
    riskLevel: 'medium',
    title: 'Assumes Clear Access',
    description: 'Limited access or tight workspaces often require additional labor time.',
    typicalOverrun: { min: 5, max: 20 },
    questionToAsk: 'What access do you need? What if access is limited?',
  },
  {
    id: 'assumes-single-layer',
    pattern: /\bassumes?\b[^.]*(?:single|one)\s*layer\s*(?:of\s*)?(?:roofing|shingles|flooring|drywall)/i,
    category: 'assumption',
    riskLevel: 'high',
    title: 'Assumes Single Layer',
    description: 'Multiple layers of roofing/flooring require additional demo time and disposal costs.',
    typicalOverrun: { min: 15, max: 35 },
    questionToAsk: 'What if there are multiple layers? What is the per-layer additional cost?',
  },

  // === DISCOVERY RISKS (HIGH RISK) ===
  {
    id: 'hidden-damage',
    pattern: /(?:hidden|unforeseen|unknown|concealed)\s*(?:damage|conditions?|issues?|problems?)/i,
    category: 'discovery',
    riskLevel: 'high',
    title: 'Hidden Condition Disclaimer',
    description: 'This language protects the contractor if problems are discovered behind walls.',
    typicalOverrun: { min: 10, max: 50 },
    questionToAsk: 'Can you do a preliminary investigation before finalizing the bid? What typical hidden issues do you see?',
  },
  {
    id: 'water-damage-risk',
    pattern: /(?:mold|water\s*damage|rot|moisture)\s*(?:if\s+found|discovered|additional)/i,
    category: 'discovery',
    riskLevel: 'high',
    title: 'Water/Mold Damage Risk',
    description: 'Water damage remediation can add significant unexpected costs.',
    typicalOverrun: { min: 20, max: 60 },
    questionToAsk: 'What are the signs of water damage I should expect? What is the typical remediation cost?',
  },
  {
    id: 'asbestos-lead-risk',
    pattern: /(?:asbestos|lead|hazmat|hazardous\s*material)\s*(?:testing|abatement|removal|if\s+found)/i,
    category: 'discovery',
    riskLevel: 'high',
    title: 'Hazardous Material Risk',
    description: 'Asbestos/lead abatement requires certified contractors and can cost $2,000-$15,000+.',
    typicalOverrun: { min: 20, max: 100 },
    questionToAsk: 'Will testing be done before work begins? Who handles abatement if hazards are found?',
  },
  {
    id: 'structural-unknown',
    pattern: /(?:structural\s*(?:issues?|repairs?|problems?)|load[\s-]?bearing)\s*(?:if\s+(?:needed|required|found)|additional|extra)/i,
    category: 'structural',
    riskLevel: 'high',
    title: 'Structural Work Unknown',
    description: 'Structural modifications can add $3,000-$20,000+ if walls are load-bearing.',
    typicalOverrun: { min: 20, max: 80 },
    questionToAsk: 'Has a structural engineer reviewed the plans? What if the wall is load-bearing?',
  },

  // === UNDEFINED ITEMS (MEDIUM-HIGH RISK) ===
  {
    id: 'tbd-items',
    pattern: /\b(?:tbd|to\s+be\s+determined|to\s+be\s+selected|tbs|selection\s+pending)\b/i,
    category: 'undefined',
    riskLevel: 'high',
    title: 'Items To Be Determined',
    description: 'TBD items are open-ended costs that will be added once you make selections.',
    typicalOverrun: { min: 20, max: 60 },
    questionToAsk: 'Can you provide a budget range for each TBD item so I can plan accordingly?',
  },
  {
    id: 'price-upon-selection',
    pattern: /(?:price|cost|pricing)\s*(?:based\s+on|upon|per|will\s+vary\s+(?:based\s+)?on)\s*(?:selection|choice|final)/i,
    category: 'undefined',
    riskLevel: 'medium',
    title: 'Price Based on Selection',
    description: 'Final pricing depends on your selections, which can vary widely.',
    typicalOverrun: { min: 15, max: 40 },
    questionToAsk: 'What is the range between budget and premium options for these selections?',
  },
  {
    id: 'per-unit-pricing',
    pattern: /\$[\d,.]+\s*(?:per|\/)\s*(?:window|door|fixture|outlet|switch)\b(?!.*(?:total|included))/i,
    category: 'material',
    riskLevel: 'low',
    title: 'Per-Unit Pricing',
    description: 'Per-unit pricing is transparent but verify the total count is accurate.',
    typicalOverrun: { min: 5, max: 15 },
    questionToAsk: 'Is the total unit count verified? What if we need additional units?',
  },

  // === CODE/PERMIT RISKS (MEDIUM-HIGH RISK) ===
  {
    id: 'code-upgrade-risk',
    pattern: /(?:bring|upgrade|update|bring\s+up)\s+to\s+(?:current\s+)?code/i,
    category: 'permit',
    riskLevel: 'high',
    title: 'Code Upgrade May Be Required',
    description: 'Bringing older systems to code can trigger cascading upgrades.',
    typicalOverrun: { min: 15, max: 50 },
    questionToAsk: 'What code upgrades are likely required? Have you inspected the existing systems?',
  },
  {
    id: 'inspection-contingent',
    pattern: /(?:pending|subject\s+to|contingent\s+(?:on|upon))\s*(?:inspection|inspector\s*approval)/i,
    category: 'permit',
    riskLevel: 'medium',
    title: 'Subject to Inspection',
    description: 'Inspector requirements can mandate additional work not in the original bid.',
    typicalOverrun: { min: 5, max: 25 },
    questionToAsk: 'What are the most common inspector-required additions in your experience?',
  },
  {
    id: 'electrical-panel-capacity',
    pattern: /(?:panel|electrical\s+panel|service)\s*(?:capacity|upgrade|if\s+(?:needed|required))/i,
    category: 'permit',
    riskLevel: 'high',
    title: 'Panel Upgrade May Be Needed',
    description: 'Electrical panel upgrades range from $1,500-$4,000 and are common in older homes.',
    typicalOverrun: { min: 10, max: 30 },
    questionToAsk: 'Has the panel been inspected? What are the signs an upgrade will be needed?',
  },

  // === SCOPE GAPS (MEDIUM RISK) ===
  {
    id: 'demo-as-needed',
    pattern: /\bdemo(?:lition)?\s+(?:as\s+)?(?:needed|required|necessary)/i,
    category: 'scope-gap',
    riskLevel: 'medium',
    title: 'Open-Ended Demo',
    description: 'Open-ended demolition language can lead to disputes about what\'s included.',
    typicalOverrun: { min: 10, max: 30 },
    questionToAsk: 'Can you define the specific demolition scope? What triggers additional demo charges?',
  },
  {
    id: 'cleanup-minimal',
    pattern: /(?:broom|basic|minimal)\s*(?:clean|cleanup|cleaning)/i,
    category: 'scope-gap',
    riskLevel: 'low',
    title: 'Basic Cleanup Only',
    description: 'Basic cleanup may not include dust removal, surface cleaning, or debris hauling.',
    typicalOverrun: { min: 2, max: 8 },
    questionToAsk: 'What exactly does cleanup include? Is final cleaning of surfaces included?',
  },
  {
    id: 'painting-excluded-hint',
    pattern: /(?:painting|paint)\s*(?:not\s+included|excluded|by\s+others|separate)/i,
    category: 'scope-gap',
    riskLevel: 'medium',
    title: 'Painting Not Included',
    description: 'Touch-up and finish painting after construction is often needed but excluded.',
    typicalOverrun: { min: 5, max: 15 },
    questionToAsk: 'Will any painting/touch-up be needed after your work? Can you include that?',
  },
];

// ============================================================================
// PROJECT-SPECIFIC CHANGE ORDER BENCHMARKS
// ============================================================================

export const PROJECT_CHANGE_ORDER_RISKS: ProjectTypeRisk[] = [
  {
    projectType: 'kitchen',
    commonChangeOrders: [
      {
        item: 'Cabinet upgrades',
        frequency: 'Very Common',
        typicalCost: '$2,000-$8,000',
        triggerPhrases: ['allowance', 'builder grade', 'standard cabinets'],
        preventionQuestion: 'What specific cabinet line is included? Can I see samples?',
      },
      {
        item: 'Countertop upgrades',
        frequency: 'Very Common',
        typicalCost: '$1,500-$5,000',
        triggerPhrases: ['allowance', 'level 1', 'builder grade'],
        preventionQuestion: 'What stone options are within the allowance? Edge profiles?',
      },
      {
        item: 'Appliance hookups',
        frequency: 'Common',
        typicalCost: '$500-$2,000',
        triggerPhrases: ['appliances by owner', 'hookup not included'],
        preventionQuestion: 'Is installation of owner-supplied appliances included?',
      },
      {
        item: 'Electrical upgrades',
        frequency: 'Common',
        typicalCost: '$1,000-$4,000',
        triggerPhrases: ['additional circuits', 'panel upgrade if needed'],
        preventionQuestion: 'Has the electrical been evaluated for required upgrades?',
      },
      {
        item: 'Plumbing reroutes',
        frequency: 'Occasional',
        typicalCost: '$1,500-$5,000',
        triggerPhrases: ['assumes existing locations', 'if relocation needed'],
        preventionQuestion: 'Are all fixtures staying in their current locations?',
      },
    ],
  },
  {
    projectType: 'bathroom',
    commonChangeOrders: [
      {
        item: 'Tile upgrades',
        frequency: 'Very Common',
        typicalCost: '$1,000-$4,000',
        triggerPhrases: ['tile allowance', 'standard tile', 'per sf'],
        preventionQuestion: 'What tile price point does the allowance cover?',
      },
      {
        item: 'Fixture upgrades',
        frequency: 'Very Common',
        typicalCost: '$500-$3,000',
        triggerPhrases: ['fixture allowance', 'standard fixtures'],
        preventionQuestion: 'What brands/models are included at this price?',
      },
      {
        item: 'Water damage/mold',
        frequency: 'Common',
        typicalCost: '$1,000-$5,000',
        triggerPhrases: ['if water damage found', 'hidden conditions'],
        preventionQuestion: 'Are there signs of moisture? What if we find damage?',
      },
      {
        item: 'Subfloor repair',
        frequency: 'Common',
        typicalCost: '$500-$2,000',
        triggerPhrases: ['assumes good subfloor', 'if rot found'],
        preventionQuestion: 'Has the subfloor been inspected for soft spots?',
      },
      {
        item: 'Electrical additions',
        frequency: 'Common',
        typicalCost: '$400-$1,500',
        triggerPhrases: ['existing electrical', 'GFCI if needed'],
        preventionQuestion: 'Will new circuits or GFCI upgrades be required?',
      },
    ],
  },
  {
    projectType: 'roofing',
    commonChangeOrders: [
      {
        item: 'Decking replacement',
        frequency: 'Very Common',
        typicalCost: '$1,000-$4,000',
        triggerPhrases: ['decking as needed', 'if rot found', 'per sheet'],
        preventionQuestion: 'What is the per-sheet price for decking? How many typically need replacing?',
      },
      {
        item: 'Multiple layer tearoff',
        frequency: 'Common',
        typicalCost: '$500-$2,000',
        triggerPhrases: ['assumes single layer', 'additional layer'],
        preventionQuestion: 'How many layers currently exist? What is the per-layer cost?',
      },
      {
        item: 'Fascia/soffit repairs',
        frequency: 'Common',
        typicalCost: '$500-$2,500',
        triggerPhrases: ['if needed', 'as required', 'visible rot'],
        preventionQuestion: 'Have you inspected the fascia? What is the per-foot repair cost?',
      },
      {
        item: 'Flashing upgrades',
        frequency: 'Occasional',
        typicalCost: '$300-$1,500',
        triggerPhrases: ['existing flashing', 'if replacement needed'],
        preventionQuestion: 'Is all flashing being replaced or just inspected?',
      },
    ],
  },
  {
    projectType: 'basement',
    commonChangeOrders: [
      {
        item: 'Waterproofing',
        frequency: 'Very Common',
        typicalCost: '$3,000-$15,000',
        triggerPhrases: ['assumes dry', 'if moisture present'],
        preventionQuestion: 'Has moisture testing been done? Is waterproofing included?',
      },
      {
        item: 'Egress window',
        frequency: 'Common',
        typicalCost: '$2,000-$5,000',
        triggerPhrases: ['egress if required', 'code compliance'],
        preventionQuestion: 'Is an egress window required for bedrooms? Is that included?',
      },
      {
        item: 'HVAC extension',
        frequency: 'Common',
        typicalCost: '$1,500-$4,000',
        triggerPhrases: ['HVAC separate', 'if zoning needed'],
        preventionQuestion: 'Is HVAC to the basement included? What about returns?',
      },
      {
        item: 'Electrical expansion',
        frequency: 'Very Common',
        typicalCost: '$1,000-$3,000',
        triggerPhrases: ['electrical TBD', 'per outlet'],
        preventionQuestion: 'How many outlets/circuits are included?',
      },
    ],
  },
  {
    projectType: 'addition',
    commonChangeOrders: [
      {
        item: 'Foundation issues',
        frequency: 'Common',
        typicalCost: '$5,000-$20,000',
        triggerPhrases: ['assumes adequate soil', 'if additional footings'],
        preventionQuestion: 'Has a soils test been performed? Is there a contingency?',
      },
      {
        item: 'Utility connections',
        frequency: 'Very Common',
        typicalCost: '$2,000-$8,000',
        triggerPhrases: ['connection point TBD', 'assumes adequate capacity'],
        preventionQuestion: 'Where are electrical/plumbing tie-ins planned?',
      },
      {
        item: 'Exterior matching',
        frequency: 'Common',
        typicalCost: '$2,000-$6,000',
        triggerPhrases: ['best effort to match', 'close match'],
        preventionQuestion: 'How will siding/roofing be matched? Is blending work included?',
      },
      {
        item: 'Permit complications',
        frequency: 'Occasional',
        typicalCost: '$1,000-$5,000',
        triggerPhrases: ['permit allowance', 'variance if needed'],
        preventionQuestion: 'Have permits been discussed with the city? Any red flags?',
      },
    ],
  },
  {
    projectType: 'hvac',
    commonChangeOrders: [
      {
        item: 'Ductwork modifications',
        frequency: 'Very Common',
        typicalCost: '$500-$3,000',
        triggerPhrases: ['ductwork as needed', 'if modifications required'],
        preventionQuestion: 'Has existing ductwork been inspected? What modifications are expected?',
      },
      {
        item: 'Electrical panel upgrade',
        frequency: 'Common',
        typicalCost: '$1,500-$4,000',
        triggerPhrases: ['panel upgrade if needed', 'adequate amperage'],
        preventionQuestion: 'Does the current panel support the new system?',
      },
      {
        item: 'Return air additions',
        frequency: 'Common',
        typicalCost: '$300-$1,500',
        triggerPhrases: ['existing returns', 'additional returns TBD'],
        preventionQuestion: 'Are new return air vents included?',
      },
    ],
  },
  {
    projectType: 'electrical',
    commonChangeOrders: [
      {
        item: 'Panel upgrade',
        frequency: 'Very Common',
        typicalCost: '$1,500-$4,000',
        triggerPhrases: ['if panel upgrade required', 'capacity permitting'],
        preventionQuestion: 'What is the current panel capacity? Will an upgrade be needed?',
      },
      {
        item: 'Wire replacement',
        frequency: 'Common',
        typicalCost: '$1,000-$5,000',
        triggerPhrases: ['existing wiring', 'knob and tube', 'aluminum wiring'],
        preventionQuestion: 'What type of wiring exists? Will any need replacement?',
      },
      {
        item: 'Code compliance',
        frequency: 'Common',
        typicalCost: '$500-$2,000',
        triggerPhrases: ['bring to code', 'current code requirements'],
        preventionQuestion: 'What code upgrades are required for this work?',
      },
    ],
  },
  {
    projectType: 'plumbing',
    commonChangeOrders: [
      {
        item: 'Pipe replacement',
        frequency: 'Very Common',
        typicalCost: '$1,000-$5,000',
        triggerPhrases: ['galvanized', 'existing pipes', 'if replacement needed'],
        preventionQuestion: 'What type of pipes exist? Any need replacement?',
      },
      {
        item: 'Main line issues',
        frequency: 'Occasional',
        typicalCost: '$2,000-$8,000',
        triggerPhrases: ['main line scope', 'to property line'],
        preventionQuestion: 'Has the main line been scoped? What is the condition?',
      },
      {
        item: 'Water heater',
        frequency: 'Common',
        typicalCost: '$1,000-$3,000',
        triggerPhrases: ['water heater separate', 'if replacement recommended'],
        preventionQuestion: 'Is water heater assessment/replacement included?',
      },
    ],
  },
  {
    projectType: 'painting',
    commonChangeOrders: [
      {
        item: 'Surface repairs',
        frequency: 'Very Common',
        typicalCost: '$200-$1,000',
        triggerPhrases: ['minor repairs only', 'assumes good condition'],
        preventionQuestion: 'What surface prep is included? What about cracks and holes?',
      },
      {
        item: 'Additional coats',
        frequency: 'Common',
        typicalCost: '$500-$2,000',
        triggerPhrases: ['two coats', 'if third coat needed'],
        preventionQuestion: 'How many coats are included? What triggers additional coats?',
      },
      {
        item: 'Trim/detail work',
        frequency: 'Occasional',
        typicalCost: '$300-$1,500',
        triggerPhrases: ['trim extra', 'detail work additional'],
        preventionQuestion: 'Is all trim and detail work included in this price?',
      },
    ],
  },
  {
    projectType: 'flooring',
    commonChangeOrders: [
      {
        item: 'Subfloor repair',
        frequency: 'Very Common',
        typicalCost: '$300-$2,000',
        triggerPhrases: ['assumes level', 'subfloor repair extra'],
        preventionQuestion: 'Is subfloor leveling included? What if repairs are needed?',
      },
      {
        item: 'Furniture moving',
        frequency: 'Common',
        typicalCost: '$200-$800',
        triggerPhrases: ['clear room', 'furniture by owner'],
        preventionQuestion: 'Is furniture moving included or is that my responsibility?',
      },
      {
        item: 'Transitions/trim',
        frequency: 'Common',
        typicalCost: '$200-$600',
        triggerPhrases: ['transitions extra', 'trim additional'],
        preventionQuestion: 'Are all transition strips and base trim included?',
      },
    ],
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get project-specific change order risks
 */
export function getProjectChangeOrderRisks(projectType: string): ProjectTypeRisk | null {
  const normalized = projectType.toLowerCase()
    .replace(/[-_\s]+remodel/, '')
    .replace(/[-_\s]+renovation/, '')
    .replace(/[-_\s]+refinishing/, '')
    .replace(/[-_\s]+finishing/, '')
    .trim();
  
  return PROJECT_CHANGE_ORDER_RISKS.find(p => 
    p.projectType === normalized ||
    p.projectType.startsWith(normalized) ||
    normalized.includes(p.projectType)
  ) || null;
}

/**
 * Scan bid text for change order risk patterns
 */
export function detectChangeOrderRisks(bidText: string): {
  patterns: Array<{
    pattern: ChangeOrderPattern;
    matchedText: string;
    lineContext: string;
  }>;
  summary: {
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
    estimatedOverrunMin: number;
    estimatedOverrunMax: number;
  };
} {
  const results: Array<{
    pattern: ChangeOrderPattern;
    matchedText: string;
    lineContext: string;
  }> = [];
  
  const seenIds = new Set<string>();
  
  for (const pattern of CHANGE_ORDER_PATTERNS) {
    const match = bidText.match(pattern.pattern);
    if (match && !seenIds.has(pattern.id)) {
      seenIds.add(pattern.id);
      
      // Get surrounding context (line containing match)
      const matchIndex = bidText.indexOf(match[0]);
      const lineStart = bidText.lastIndexOf('\n', matchIndex) + 1;
      const lineEnd = bidText.indexOf('\n', matchIndex);
      const lineContext = bidText.slice(
        lineStart, 
        lineEnd === -1 ? matchIndex + 100 : lineEnd
      ).trim();
      
      results.push({
        pattern,
        matchedText: match[0],
        lineContext: lineContext.slice(0, 150) + (lineContext.length > 150 ? '...' : ''),
      });
    }
  }
  
  // Sort by risk level (high first)
  results.sort((a, b) => {
    const riskOrder = { high: 0, medium: 1, low: 2 };
    return riskOrder[a.pattern.riskLevel] - riskOrder[b.pattern.riskLevel];
  });
  
  // Calculate summary
  const summary = {
    highRiskCount: results.filter(r => r.pattern.riskLevel === 'high').length,
    mediumRiskCount: results.filter(r => r.pattern.riskLevel === 'medium').length,
    lowRiskCount: results.filter(r => r.pattern.riskLevel === 'low').length,
    estimatedOverrunMin: 0,
    estimatedOverrunMax: 0,
  };
  
  // Only include high and medium risk in overrun estimate
  for (const result of results) {
    if (result.pattern.riskLevel !== 'low') {
      summary.estimatedOverrunMin += result.pattern.typicalOverrun.min;
      summary.estimatedOverrunMax += result.pattern.typicalOverrun.max;
    }
  }
  
  // Cap at reasonable ranges
  summary.estimatedOverrunMin = Math.min(summary.estimatedOverrunMin, 100);
  summary.estimatedOverrunMax = Math.min(summary.estimatedOverrunMax, 150);
  
  return { patterns: results, summary };
}

/**
 * Calculate change order risk score (0-100, lower is riskier)
 */
export function calculateChangeOrderScore(bidText: string): {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  riskLevel: RiskLevel;
} {
  const { summary } = detectChangeOrderRisks(bidText);
  
  // Start at 100, deduct points
  let score = 100;
  
  // Deductions per risk item
  score -= summary.highRiskCount * 12;
  score -= summary.mediumRiskCount * 6;
  score -= summary.lowRiskCount * 2;
  
  // Additional penalty for high estimated overrun
  if (summary.estimatedOverrunMax > 50) {
    score -= 10;
  } else if (summary.estimatedOverrunMax > 25) {
    score -= 5;
  }
  
  score = Math.max(0, Math.min(100, score));
  
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  let riskLevel: RiskLevel;
  
  if (score >= 85) {
    grade = 'A';
    riskLevel = 'low';
  } else if (score >= 70) {
    grade = 'B';
    riskLevel = 'low';
  } else if (score >= 55) {
    grade = 'C';
    riskLevel = 'medium';
  } else if (score >= 40) {
    grade = 'D';
    riskLevel = 'medium';
  } else {
    grade = 'F';
    riskLevel = 'high';
  }
  
  return { score, grade, riskLevel };
}
