// Scope Fingerprinting Engine (Approach A + D)
// Classifies projects by scope signature patterns and detects contradictions

// ============================================================================
// Types
// ============================================================================

import type { AnalysisFlag } from './analysisEngine';

// Tier keywords for "Buying the Job" detection
export type KeywordTier = 'cosmetic' | 'builder' | 'standard' | 'premium' | 'luxury';
export type PriceTier = 'budget' | 'builder' | 'standard' | 'premium' | 'luxury';

export interface TierMismatchResult {
  keywordTier: KeywordTier;
  priceTier: PriceTier;
  isMismatch: boolean;
  flag: AnalysisFlag | null;
  keywordsFound: string[];
  expectedPriceRange: { low: number; high: number };
}

// Scope gap with cost estimate for "Likely Change Orders" feature
export interface ScopeGapWithCost {
  scopeId: string;
  displayName: string;
  typicalCost: { low: number; high: number };
  changeOrderLikelihood: 'high' | 'medium' | 'low';
  warningText: string;
}

export type ProjectClassification = 
  // Kitchen tiers
  | 'kitchen-cosmetic'      // Paint, hardware only
  | 'kitchen-refresh'       // Refacing, new counters, no layout change  
  | 'kitchen-minor'         // Cabinet/counter replacement, same layout
  | 'kitchen-major'         // Full gut, possible layout change
  | 'kitchen-upscale'       // Luxury finishes, commercial appliances
  // Countertop installations (standalone, not full kitchen)
  | 'countertops-granite'   // Granite countertop installation
  | 'countertops-quartz'    // Quartz countertop installation
  | 'countertops'           // General countertop installation
  // Bathroom tiers
  | 'bathroom-cosmetic'     // Paint, fixtures only
  | 'bathroom-refresh'      // New vanity/toilet, no tile
  | 'bathroom-standard'     // Full remodel, standard fixtures
  | 'bathroom-upscale'      // Spa features, luxury finishes
  | 'bathroom-addition'     // New bathroom (requires structural)
  // Basement tiers
  | 'basement-refinishing'  // Cosmetic update to finished basement
  | 'basement-finishing'    // Unfinished to finished
  | 'basement-remodel'      // Major reconfiguration
  | 'basement-adu'          // Basement ADU conversion with kitchen
  // Multi-Trade / Multi-Room Projects
  | 'whole-home-remodel'    // Kitchen + bath + flooring + multiple rooms
  | 'partial-home-remodel'  // Kitchen + bath OR basement + bath (2 major areas)
  | 'interior-refresh'      // Paint + carpet/flooring + closets + trim
  | 'interior-update'       // Flooring + paint + trim (cosmetic upgrade)
  | 'interior-finish'       // Drywall + paint + trim (new construction finish)
  | 'addition-with-bath'    // Room addition with bathroom
  // Other project types
  | 'flooring-install'
  | 'flooring-refinish'
  | 'roofing-repair'
  | 'roofing-replacement'
  | 'windows-replacement'
  | 'painting-interior'
  | 'painting-exterior'
  | 'electrical-service'
  | 'plumbing-service'
  | 'hvac-service'
  | 'hvac-replacement'
  | 'addition-room'
  | 'addition-adu'
  | 'garage-conversion'
  | 'deck-new'
  | 'deck-repair'
  | 'fence'
  | 'fence-repair'
  | 'gutter'
  | 'gutter-repair'
  | 'railing'
  | 'retaining-wall'
  | 'general-handyman'
  | 'unknown';

export interface ScopeGroup {
  id: string;
  name: string;
  keywords: RegExp[];
  // For trade correlation
  primaryTrade?: string;
  // Patterns that should NOT be present for this scope group to match
  contextExclusions?: RegExp[];
}

export interface ProjectFingerprint {
  classification: ProjectClassification;
  displayName: string;
  // Scope groups that MUST be present (all required)
  required: string[];
  // Scope groups that SHOULD be present (most expected)
  expected: string[];
  // Scope groups that MAY be present (add-ons)
  optional: string[];
  // Scope groups that should NOT be present (contradictions - Approach D)
  absent: string[];
  // Price range benchmarks
  priceRange: {
    low: number;
    median: number;
    high: number;
    unit: 'total' | 'psf' | 'per-unit' | 'linear-foot';
  };
  // Trade mix expectations
  tradeMix: Record<string, number>; // trade -> percentage
}

export interface FingerprintMatchResult {
  classification: ProjectClassification;
  displayName: string;
  confidence: number; // 0-100
  matchedRequired: string[];
  missingRequired: string[];
  matchedExpected: string[];
  missingExpected: string[];
  contradictions: string[]; // Items that shouldn't be there
  scopeGaps: string[];
  priceRange: ProjectFingerprint['priceRange'];
  tradeMix: ProjectFingerprint['tradeMix'];
}

// ============================================================================
// Scope Group Definitions (Reusable across fingerprints)
// ============================================================================

export const SCOPE_GROUPS: Record<string, ScopeGroup> = {
  // Demo & Structural
  'demo-full': {
    id: 'demo-full',
    name: 'Full Demolition',
    keywords: [/gut(ting)?/i, /full\s*demo/i, /tear[\s-]?out\s*(all|everything)/i, /complete\s*removal/i],
  },
  'demo-partial': {
    id: 'demo-partial',
    name: 'Partial Demolition',
    keywords: [/demo(lition)?/i, /remov(e|al|ing)/i, /tear[\s-]?out/i],
  },
  'structural-wall': {
    id: 'structural-wall',
    name: 'Structural Wall Work',
    keywords: [/load[\s-]?bearing/i, /structural/i, /lvl\s*beam/i, /support\s*beam/i, /header/i],
    primaryTrade: 'carpenter',
  },
  'framing': {
    id: 'framing',
    name: 'Framing',
    keywords: [
      // Structural framing contexts - avoid matching "door frame" or "window frame" (trim)
      /wall\s*fram(e|ing)/i,
      /rough\s*fram(e|ing)/i,
      /new\s*fram(e|ing)/i,
      /stud\s*fram(e|ing)/i,
      /all\s*fram(e|ing)/i,
      /fram(e|ing)\s*(wall|stud|partition|opening|addition|structure|interior|work)/i,
      /frame\s+new\s+\d/i,              // "Frame new 5x8 bathroom"
      /frame\s+new\s+(bathroom|bedroom|closet|room|office|area)/i,  // "frame new bathroom"
      /frame\s+(a\s+)?new\s+/i,         // "frame a new" anything
      /fram(e|ing)\s*&\s*drywall/i,
      /frame\s*(out|in)/i,
      // "Frame exterior walls", "frame interior walls"
      /\bframe\s+\w+\s+wall/i,
      // "Frame one bedroom", "frame a closet", "frame the bathroom"
      /\bframe\s+(a\s+|one\s+|the\s+)?(bedroom|closet|bathroom|room|area)/i,
      /stud(s)?/i, 
      /partition/i, 
      /wall\s*build/i,
      // Implied framing - layout changes require wall work
      /new\s*layout/i,
      /layout\s*change/i,
      /reconfigur/i,
      /open\s*concept/i,
      /new\s*wall/i,
      /add(ing)?\s*wall/i,
      /move\s*wall/i,
      /relocat.*wall/i,
      /remove.*wall.*new/i,
    ],
    primaryTrade: 'carpenter',
  },

  // Cabinet Work
  'cabinet-paint': {
    id: 'cabinet-paint',
    name: 'Cabinet Painting',
    keywords: [/paint.*cabinet/i, /cabinet.*paint/i, /repaint.*cabinet/i],
    primaryTrade: 'painter',
  },
  'cabinet-reface': {
    id: 'cabinet-reface',
    name: 'Cabinet Refacing',
    keywords: [/reface/i, /refacing/i, /new\s*(door|front|face)/i, /replace.*door/i],
    primaryTrade: 'carpenter',
  },
  'cabinet-install': {
    id: 'cabinet-install',
    name: 'Cabinet Installation',
    keywords: [
      // Require cabinet + action word - avoid matching "paint cabinets" or "kitchen cabinets"
      /cabinet\s*(install|replac|remov|demo|refac|hang|mount)/i,
      /(install|replac|custom)\s*(base|wall|upper|kitchen|bathroom)?\s*cabinet/i,
      /new\s*cabinet\s*(install|replac|box|frame|unit|set)/i,
      /install\s*(base|wall|upper)\s*cabinet/i,
      // Cabinet types that imply new installation
      /cupboard\s*(install|replac)/i,
      /pantry\s*(cabinet|unit)\s*(install|replac)/i,
      // Match "new cabinets" with type modifiers or "install new ... cabinets"
      /\bnew\s+(base|wall|upper|pantry|kitchen|bathroom|stock|custom|semi-custom)\s*cabinet/i,
      /install\s+new\s+\w+\s+cabinet/i,  // "Install new stock cabinets"
      /\b(base|wall|upper)\s+cabinet/i,  // "Base cabinets", "Wall cabinets" implies installation
    ],
    primaryTrade: 'carpenter',
  },
  'cabinet-custom': {
    id: 'cabinet-custom',
    name: 'Custom Cabinetry',
    keywords: [
      /custom\s*cabinet/i, /built[\s-]?in/i, /millwork/i, /bespoke/i,
      /hand[\s-]?craft/i, /furniture[\s-]?grade/i, /inset\s*cabinet/i, 
      /lacquer/i, /european\s*frameless/i, /solid\s*walnut/i, /solid\s*maple/i,
      /custom\s*millwork/i, /decorative\s*leg/i, /motorized\s*shelv/i
    ],
    primaryTrade: 'carpenter',
  },

  // Countertops
  'counter-laminate': {
    id: 'counter-laminate',
    name: 'Laminate Countertops',
    keywords: [/laminate/i, /formica/i],
  },
  'counter-stone': {
    id: 'counter-stone',
    name: 'Stone Countertops',
    keywords: [/granite/i, /quartz/i, /marble/i, /quartzite/i, /stone\s*slab/i, /silestone/i, /caesarstone/i],
  },
  'counter-solid': {
    id: 'counter-solid',
    name: 'Solid Surface Countertops',
    keywords: [/solid\s*surface/i, /corian/i, /butcher\s*block/i],
  },
  'counter-install': {
    id: 'counter-install',
    name: 'Countertop Installation',
    keywords: [
      // Require action context - don't match "existing countertops remain" or "counter flashing"
      /(install|replac|new|custom)\s*counter(top)/i,  // Must have "countertop" not just "counter"
      /counter(top)\s*(install|replac)/i,
      /template.*counter/i, 
      /fabricat.*counter/i,
      /new\s*countertop/i,
      /granite\s*counter/i,
      /quartz\s*counter/i,
      /laminate\s*counter/i,
    ],
  },

  // Plumbing
  'plumbing-rough': {
    id: 'plumbing-rough',
    name: 'Plumbing Rough-In',
    keywords: [
      // REMOVED: /rough[\s-]?in/i - too broad, matches electrical rough-in
      /plumb(ing)?\s*rough/i,              // "PLUMBING ROUGH:" headers
      /relocat(e|ing).*plumb/i,            // relocate plumbing
      /plumb.*relocat/i,                   // plumbing relocation
      /move.*drain/i,                      // move drain
      /new\s*(drain|supply)\s*line/i,      // "new drain line", "new supply line"
      /run.*supply\s*line/i,               // "run supply lines"
      /run.*drain\s*line/i,                // "run drain lines"
      /vent\s*stack/i,                     // vent stack (rough-in indicator)
      /connect.*main\s*stack/i,            // connect to main stack
      /extend.*plumb/i,                    // extend plumbing
    ],
    primaryTrade: 'plumber',
  },
  // Phase C: New plumbing infrastructure indicator for bathroom additions
  'plumbing-new-stack': {
    id: 'plumbing-new-stack',
    name: 'New Plumbing Stack/Trenching',
    // Distinguishes bathroom ADDITION (new infrastructure) from bathroom UPSCALE (renovation)
    keywords: [
      /new\s*waste\s*line/i,
      /new\s*plumbing\s*stack/i,
      /plumbing\s*stack/i,
      /trench(ing)?\s*(for\s*)?plumb/i,
      /plumb.*trench/i,
      /new\s*drain\s*line/i,
      /sewer\s*tie[\s-]?in/i,
      /connect\s*(to\s*)?main\s*sewer/i,
      /new\s*vent\s*stack/i,
      /run\s*new\s*waste/i,
      /concrete\s*cutting/i,
      /slab\s*penetration/i,
      /break\s*concrete/i,
      /cut\s*slab/i,
      /excavat.*plumb/i,
      /plumb.*excavat/i,
    ],
    primaryTrade: 'plumber',
  },
  'plumbing-fixture': {
    id: 'plumbing-fixture',
    name: 'Plumbing Fixtures',
    keywords: [
      /sink/i, 
      /faucet/i, 
      // Disposal: require context (garbage, install) or exclude "circuit" context
      /garbage\s*disposal/i,
      /disposal\s*(install|replac|unit)/i,
      /(install|replac)\s*disposal/i,
      /toilet/i, 
      /tub/i, 
      /shower/i,
    ],
    primaryTrade: 'plumber',
  },
  'plumbing-connect': {
    id: 'plumbing-connect',
    name: 'Plumbing Connections',
    keywords: [/plumb(ing|er)?/i, /hook[\s-]?up/i, /connect/i, /water\s*line/i, /drain/i],
    primaryTrade: 'plumber',
  },

  // Electrical
  'electrical-rough': {
    id: 'electrical-rough',
    name: 'Electrical Rough-In',
    keywords: [
      /electrical\s*rough/i, 
      /new\s*circuit/i,
      /new\s+\d+\s*a(mp)?\s*circuit/i,  // "New 20A circuit", "new 20 amp circuit"
      /\b\d+\s*a(mp)?\s*circuit/i,       // "20A circuit", "15 amp circuit"
      /run\s*wire/i, 
      /wire.*run/i, 
      /add\s*circuit/i,
      // Rewiring involves rough-in work
      /rewir(e|ing)/i,
      /new\s*wiring/i,
      /electrical.*layout/i,
      // Implied rough-in for new electrical work
      /new\s*electrical/i,
      /electrical\s*throughout/i,
      /electrical\s*upgrade/i,
      /upgrade.*electrical/i,
    ],
    primaryTrade: 'electrician',
  },
  'electrical-outlet': {
    id: 'electrical-outlet',
    name: 'Outlet Work',
    keywords: [/outlet/i, /receptacle/i, /gfci/i, /plug/i],
    primaryTrade: 'electrician',
  },
  'electrical-lighting': {
    id: 'electrical-lighting',
    name: 'Lighting Installation',
    keywords: [/light(ing|s)?/i, /pendant/i, /recessed/i, /can\s*light/i, /under[\s-]?cabinet\s*light/i, /chandelier/i],
    primaryTrade: 'electrician',
  },
  'electrical-panel': {
    id: 'electrical-panel',
    name: 'Panel/Service Work',
    keywords: [/panel/i, /breaker/i, /200\s*amp/i, /service\s*upgrade/i, /sub[\s-]?panel/i],
    primaryTrade: 'electrician',
  },

  // Tile & Flooring
  'tile-floor': {
    id: 'tile-floor',
    name: 'Floor Tile',
    keywords: [
      /floor\s*tile/i, 
      /tile.*floor/i, 
      /porcelain.*floor/i, 
      /ceramic.*floor/i,
      /large\s*format\s*(?:floor|tile)/i,  // "large format floor" or "large format tile"
    ],
    primaryTrade: 'tile-setter',
  },
  'tile-wall': {
    id: 'tile-wall',
    name: 'Wall Tile',
    keywords: [/wall\s*tile/i, /tile.*wall/i, /backsplash/i, /shower.*tile/i, /subway/i],
    primaryTrade: 'tile-setter',
  },
  'tile-waterproof': {
    id: 'tile-waterproof',
    name: 'Waterproofing',
    keywords: [/waterproof/i, /kerdi/i, /schluter/i, /redgard/i, /membrane/i, /wedi/i],
    primaryTrade: 'tile-setter',
  },
  'flooring-hardwood': {
    id: 'flooring-hardwood',
    name: 'Hardwood Flooring',
    keywords: [/hardwood\s*(floor|flooring)?/i, /oak\s*floor/i, /wood\s*floor/i, /engineered\s*(hardwood|wood|flooring|floor)/i],
  },
  'flooring-lvp': {
    id: 'flooring-lvp',
    name: 'LVP/Vinyl Flooring',
    keywords: [/lvp/i, /vinyl\s*plank/i, /luxury\s*vinyl/i],
  },
  'flooring-carpet': {
    id: 'flooring-carpet',
    name: 'Carpet',
    keywords: [/carpet/i, /pad(ding)?.*carpet/i],
  },
  'flooring-laminate': {
    id: 'flooring-laminate',
    name: 'Laminate Flooring',
    keywords: [
      /laminate\s*(floor|plank|tile|install)/i,
      /\blaminate\b(?!\s*counter)/i,  // "laminate" not followed by "counter"
    ],
  },

  // Appliances
  'appliance-standard': {
    id: 'appliance-standard',
    name: 'Standard Appliances',
    keywords: [/appliance/i, /refrigerator/i, /dishwasher/i, /range/i, /stove/i, /oven/i, /microwave/i],
  },
  'appliance-commercial': {
    id: 'appliance-commercial',
    name: 'Commercial/Luxury Appliances',
    keywords: [
      /sub[\s-]?zero/i, /wolf/i, /viking/i, /thermador/i, /miele/i, 
      /commercial[\s-]?grade/i, /pro[\s-]?style/i, /gaggenau/i, /la\s*cornue/i,
      /bluestar/i, /bertazzoni/i, /dacor/i, /monogram/i, /cove/i, 
      /48["'′]\s*range/i, /60["'′]\s*range/i, /pot\s*filler/i, /wine\s*column/i,
      /drawer\s*refrigerator/i, /speed\s*oven/i, /warming\s*drawer/i
    ],
  },
  'appliance-hood': {
    id: 'appliance-hood',
    name: 'Range Hood/Ventilation',
    keywords: [/hood/i, /vent(ilation)?/i, /exhaust/i, /cfm/i],
  },

  // Painting & Finish
  'paint-walls': {
    id: 'paint-walls',
    name: 'Wall Painting',
    keywords: [/paint/i, /prime(r|ing)?/i],
    primaryTrade: 'painter',
  },
  'paint-trim': {
    id: 'paint-trim',
    name: 'Trim Painting',
    keywords: [/trim.*paint/i, /paint.*trim/i, /baseboard.*paint/i, /molding.*paint/i],
    primaryTrade: 'painter',
  },
  'drywall': {
    id: 'drywall',
    name: 'Drywall',
    keywords: [/drywall/i, /sheetrock/i, /gypsum/i, /tape.*mud/i, /moisture[\s-]*resistant\s*(material|board)/i, /greenboard/i, /purple\s*board/i],
  },

  // HVAC
  'hvac-duct': {
    id: 'hvac-duct',
    name: 'HVAC Ductwork',
    keywords: [/duct/i, /register/i, /hvac.*extend/i, /heat.*run/i],
    primaryTrade: 'hvac',
  },
  'hvac-unit': {
    id: 'hvac-unit',
    name: 'HVAC Equipment',
    keywords: [/furnace/i, /heat\s*pump/i, /ac\s*unit/i, /mini[\s-]?split/i, /condenser/i],
    primaryTrade: 'hvac',
  },
  'hvac-extend': {
    id: 'hvac-extend',
    name: 'HVAC Extension',
    // Exclude "water heater" - that's plumbing not HVAC
    keywords: [
      /hvac/i, 
      /\b(heating|heat)\s*(system|pump|duct|vent|zone)/i,  // HVAC heating contexts
      /cool(ing)?\s*(system|unit|zone)/i,
      /climate\s*(control|zone)/i,
      /duct\s*(work|extend|run)/i,
      /return\s*air/i,
      /supply\s*(vent|register)/i,
    ],
    primaryTrade: 'hvac',
  },

  // Windows & Doors
  'window-replace': {
    id: 'window-replace',
    name: 'Window Replacement',
    keywords: [
      // Window replacement contexts - avoid matching "window frame" (trim painting)
      /window\s*(replac|install|upgrad)/i,
      /(replac|install|new)\s*window/i,
      /double[\s-]?hung/i, 
      /casement/i, 
      /vinyl.*window/i, 
      /energy\s*star.*window/i,
      /window\s*(unit|pane|glass|sash)/i,
    ],
  },
  'window-structural': {
    id: 'window-structural',
    name: 'Window Structural (New Opening)',
    keywords: [/new\s*opening/i, /cut.*window/i, /enlarge.*window/i, /add.*window/i],
    primaryTrade: 'carpenter',
  },
  'door-entry': {
    id: 'door-entry',
    name: 'Entry Door',
    keywords: [/entry\s*door/i, /front\s*door/i, /exterior\s*door/i, /steel\s*door/i, /fiberglass\s*door/i],
  },
  'door-interior': {
    id: 'door-interior',
    name: 'Interior Doors',
    keywords: [/interior\s*door/i, /bedroom\s*door/i, /closet\s*door/i],
  },

  // Roofing
  'roof-tearoff': {
    id: 'roof-tearoff',
    name: 'Roof Tear-Off',
    // Note: "tear-off to deck" means tearing off to the roof deck (substrate), not a patio deck
    keywords: [/tear[\s-]?off/i, /strip.*roof/i, /remove.*shingle/i, /to\s*deck/i, /roof\s*deck/i],
  },
  'roof-shingle': {
    id: 'roof-shingle',
    name: 'Shingle Installation',
    keywords: [/shingle/i, /architectural/i, /dimensional/i, /3[\s-]?tab/i, /asphalt/i],
  },
  'roof-metal': {
    id: 'roof-metal',
    name: 'Metal Roofing',
    keywords: [/metal\s*roof/i, /standing\s*seam/i],
  },
  'roof-flat': {
    id: 'roof-flat',
    name: 'Flat Roofing',
    keywords: [/flat\s*roof/i, /tpo/i, /epdm/i, /modified\s*bitumen/i],
  },
  'roof-repair': {
    id: 'roof-repair',
    name: 'Roof Repair',
    keywords: [
      /roof.*repair/i, 
      /roof.*patch/i,
      /patch.*roof/i,
      /leak.*fix.*roof/i, 
      /roof.*leak/i,
      /flashing.*repair/i,
    ],
  },

  // Bathroom Specific
  'bath-vanity': {
    id: 'bath-vanity',
    name: 'Vanity Installation',
    keywords: [/vanity/i, /sink\s*cabinet/i, /medicine\s*cabinet/i],
  },
  'bath-shower': {
    id: 'bath-shower',
    name: 'Shower Installation',
    // Require action words to avoid matching "existing shower remains" or "shower tile unchanged"
    keywords: [
      /(?:install|new|replace|remove|demo|frame|build|tile)\s*(?:the\s*)?shower/i,
      /shower\s*(?:install|replac|remov|demo|pan|door|valve|head|surround|niche|bench|system)/i,
      /tub[\s-]?to[\s-]?shower/i,
      /walk[\s-]?in\s*shower/i,
      /curbless/i,
      /frameless.*shower/i,
      /shower\s*conversion/i,
    ],
  },
  'bath-tub': {
    id: 'bath-tub',
    name: 'Tub Installation',
    // Require action words to avoid matching "existing tub remains"
    keywords: [
      /(?:install|new|replace|remove|demo)\s*(?:the\s*)?(?:tub|bathtub)/i,
      /(?:tub|bathtub)\s*(?:install|replac|remov|demo|surround|faucet|drain)/i,
      /soaker\s*tub/i,
      /freestanding.*tub/i,
      /jacuzzi/i,
      /jetted\s*tub/i,
      /drop[\s-]?in\s*tub/i,
      /alcove\s*tub/i,
    ],
  },
  'bath-spa': {
    id: 'bath-spa',
    name: 'Spa Features',
    // Require true luxury features - NOT just heated floor (now common in standard remodels)
    // Heated floor alone should not trigger spa classification
    keywords: [
      /steam\s*(?:shower|unit|system)/i, 
      /sauna/i, 
      /body\s*spray/i, 
      /body\s*jet/i,
      /chromotherapy/i,
      /spa\s*(?:tub|bath|feature)/i,
      /soaking\s*tub/i,
      /freestanding.*tub/i,
    ],
  },

  // Basement Specific
  'basement-insulation': {
    id: 'basement-insulation',
    name: 'Basement Insulation',
    keywords: [/insul(ate|ation)/i, /foam\s*board/i, /rigid\s*foam/i, /r[\s-]?\d+/i],
  },
  'basement-egress': {
    id: 'basement-egress',
    name: 'Egress Window',
    keywords: [/egress/i, /window\s*well/i, /escape\s*window/i],
  },
  'basement-adu-indicator': {
    id: 'basement-adu-indicator',
    name: 'Basement ADU Indicator',
    // Must have basement context - avoid matching garage ADUs
    keywords: [/basement\s*adu/i, /basement.*adu\s*conversion/i, /convert.*basement.*adu/i, /basement.*rental\s*unit/i, /basement.*apartment/i, /basement.*in-?law/i, /basement.*accessory\s*dwelling/i],
  },
  'basement-moisture': {
    id: 'basement-moisture',
    name: 'Moisture Control',
    keywords: [/moisture/i, /vapor\s*barrier/i, /dehumidif/i, /waterproof.*basement/i, /sump/i],
  },

  // ADU/Addition
  'foundation': {
    id: 'foundation',
    name: 'Foundation Work',
    keywords: [/foundation/i, /footing/i, /slab/i, /crawl\s*space/i, /pier/i],
  },
  'addition-structure': {
    id: 'addition-structure',
    name: 'Addition Structure',
    keywords: [/addition/i, /extend/i, /bump[\s-]?out/i, /expand/i],
  },

  // Permits & Admin
  'permits': {
    id: 'permits',
    name: 'Permits',
    keywords: [/permit/i, /inspection/i, /code/i, /building\s*dept/i],
  },
  'permit-indicator': {
    id: 'permit-indicator',
    name: 'Permit Work Indicator',
    // Phase B: Strong permit signals that indicate major work requiring permits
    keywords: [
      /permit\s*(fee|cost|includ)/i,
      /building\s*permit/i,
      /permit\s*required/i,
      /pull(ing)?\s*(a\s*)?permit/i,
      /permit\s*application/i,
      /city\s*permit/i,
      /county\s*permit/i,
      /permit\s*inspection/i,
      /permit\s*approval/i,
      /obtain\s*permit/i,
    ],
  },
  'debris': {
    id: 'debris',
    name: 'Debris Removal',
    keywords: [/debris/i, /haul[\s-]?away/i, /disposal/i, /dumpster/i, /clean[\s-]?up/i, /dump/i],
  },
  'warranty': {
    id: 'warranty',
    name: 'Warranty',
    keywords: [/warrant(y|ied)/i, /guarantee/i, /workmanship/i],
  },

  // Smart/Tech
  'smart-tech': {
    id: 'smart-tech',
    name: 'Smart Home Tech',
    keywords: [/smart/i, /wifi/i, /app[\s-]?control/i, /wireless/i, /automation/i, /nest/i, /alexa/i],
  },

  // Electrical Service Specific
  'electrical-service-upgrade': {
    id: 'electrical-service-upgrade',
    name: 'Electrical Service Upgrade',
    keywords: [/service\s*upgrade/i, /200\s*amp/i, /meter\s*(base|socket)/i, /main\s*breaker/i, /electrical\s*service/i],
    primaryTrade: 'electrician',
  },
  'electrical-rewire': {
    id: 'electrical-rewire',
    name: 'Rewiring',
    keywords: [/rewir(e|ing)/i, /knob[\s-]?and[\s-]?tube/i, /aluminum\s*wir/i, /replace.*wir/i],
    primaryTrade: 'electrician',
  },

  // Plumbing Service Specific
  'plumbing-repipe': {
    id: 'plumbing-repipe',
    name: 'Repiping',
    keywords: [/repipe/i, /re[\s-]?pipe/i, /replace.*pipe/i, /new\s*plumbing/i, /pex/i, /copper.*pipe/i],
    primaryTrade: 'plumber',
  },
  'plumbing-water-heater': {
    id: 'plumbing-water-heater',
    name: 'Water Heater',
    keywords: [/water\s*heater/i, /tankless/i, /hot\s*water/i],
    primaryTrade: 'plumber',
  },
  'plumbing-sewer': {
    id: 'plumbing-sewer',
    name: 'Sewer/Drain Work',
    keywords: [/sewer/i, /main\s*line/i, /drain.*clean/i, /rooter/i, /camera\s*inspect/i],
    primaryTrade: 'plumber',
  },

  // Deck Specific
  'deck-boards': {
    id: 'deck-boards',
    name: 'Deck Boards',
    // Exclude roofing contexts: "tear-off to deck" refers to roof deck (substrate), not patio deck
    keywords: [/deck\s*board/i, /decking/i, /trex/i, /composite/i, /pressure[\s-]?treat/i, /cedar\s*deck/i, /redwood\s*deck/i],
    // Don't match if roofing tearoff context
    contextExclusions: [/tear[\s-]?off.*deck/i, /roof.*deck/i, /to\s*deck.*shingle/i],
  },
  'deck-railing': {
    id: 'deck-railing',
    name: 'Deck Railing',
    keywords: [/railing/i, /baluster/i, /handrail/i, /post/i, /spindle/i],
  },
  'deck-stain': {
    id: 'deck-stain',
    name: 'Deck Staining/Sealing',
    // Exclude "stainless" - require deck context or word boundary
    keywords: [/\bstain\b/i, /deck\s*stain/i, /stain\s*(the\s*)?deck/i, /seal(er|ing)?\s*(deck|wood)/i, /water[\s-]?proof/i, /refinish.*deck/i],
  },
  'deck-repair-indicator': {
    id: 'deck-repair-indicator',
    name: 'Deck Repair Indicator',
    keywords: [
      /deck\s*repair/i,
      /repair\s*(the\s*)?deck/i,
      /deck\s*(maintenance|fix)/i,
      /loose\s*(deck\s*)?(board|plank)/i,
      /replace\s*\d+\s*(loose\s*)?(board|plank)/i,
      /tighten\s*(railing|rail|deck)/i,
      /power\s*wash\s*(the\s*)?deck/i,
      /deck\s*refinish/i,
      /refinish\s*(the\s*)?deck/i,
      /baluster\s*(repair|replace)/i,
      /replace\s*\d+\s*baluster/i,
      // Additional repair patterns for rotted/damaged boards
      /rotted?\s*(deck\s*)?(board|plank)/i,
      /(deck\s*)?board\s*replacement/i,
      /replace.*rotted/i,
      /stair\s*tread/i,
      /railing\s*post/i,
      /sand\s*(and\s*)?stain\s*deck/i,
      /deck\s*board/i,
    ],
  },
  'deck-structure': {
    id: 'deck-structure',
    name: 'Deck Structure',
    keywords: [/deck\s*frame/i, /joist/i, /ledger\s*board/i, /beam/i, /footer/i, /footing/i, /post\s*base/i],
  },

  // Handyman/Misc
  'misc-repair': {
    id: 'misc-repair',
    name: 'Miscellaneous Repairs',
    keywords: [/repair/i, /fix/i, /patch/i, /replace/i, /adjust/i, /tighten/i],
  },
  'misc-install': {
    id: 'misc-install',
    name: 'Miscellaneous Installation',
    keywords: [/install/i, /mount/i, /hang/i, /assemble/i, /set[\s-]?up/i],
  },
  // Handyman indicator - detect multi-item repair lists typical of handyman work
  // ===========================================================================
  // FENCE / LINEAR FOOT PROJECT INDICATORS
  // ===========================================================================
  'fence-indicator': {
    id: 'fence-indicator',
    name: 'Fence Project Indicator',
    keywords: [
      /\bfence\b/i,
      /\bfencing\b/i,
      /privacy\s*fence/i,
      /wood\s*fence/i,
      /vinyl\s*fence/i,
      /chain\s*link/i,
      /chainlink/i,
      /picket\s*fence/i,
      /split\s*rail/i,
      /fence\s*post/i,
      /fence\s*panel/i,
      /fence\s*gate/i,
      /fence\s*install/i,
      /fence\s*line/i,
      /cedar\s*fence/i,
      /aluminum\s*fence/i,
      /iron\s*fence/i,
      /metal\s*fence/i,
      /stockade/i,
      /\blinear\s*f(ee)?t\b.*fence/i,
      /fence.*\blinear\s*f(ee)?t\b/i,
      /\blf\b.*fence/i,
      /fence.*\blf\b/i,
    ],
  },
  'gutter-indicator': {
    id: 'gutter-indicator',
    name: 'Gutter Project Indicator',
    keywords: [
      /\bgutter(s)?\b/i,
      /seamless\s*gutter/i,
      /gutter\s*guard/i,
      /gutter\s*install/i,
      /gutter\s*replace/i,
      /downspout/i,
      /rain\s*gutter/i,
      /leaf\s*guard/i,
      /gutter\s*screen/i,
    ],
  },
  'railing-indicator': {
    id: 'railing-indicator',
    name: 'Railing Project Indicator',
    keywords: [
      /\brailing(s)?\b/i,
      /hand\s*rail/i,
      /handrail/i,
      /stair\s*rail/i,
      /baluster/i,
      /spindle.*rail/i,
      /rail.*spindle/i,
      /wrought\s*iron\s*rail/i,
      /aluminum\s*rail/i,
      /cable\s*rail/i,
      /glass\s*rail/i,
    ],
  },
  'retaining-wall-indicator': {
    id: 'retaining-wall-indicator',
    name: 'Retaining Wall Project Indicator',
    keywords: [
      /retaining\s*wall/i,
      /retention\s*wall/i,
      /block\s*wall.*retain/i,
      /stone\s*wall.*retain/i,
      /segmental\s*wall/i,
      /keystone\s*wall/i,
      /garden\s*wall/i,
      /landscape\s*wall/i,
    ],
  },

  'handyman-indicator': {
    id: 'handyman-indicator',
    name: 'Handyman Work Indicator',
    // Patterns that indicate small, general maintenance work
    keywords: [
      /handyman/i,
      /honey[\s-]?do/i,
      /punch[\s-]?list/i,
      /misc(ellaneous)?\s*(repair|work|fix)/i,
      /general\s*(repair|maintenance)/i,
      /various\s*(repair|fix|work)/i,
      /small\s*(repair|job|fix|project)/i,
      /half\s*day/i,
      /\b(1|one)\s*day\b/i,
      /touch[\s-]?up/i,
      /squeaky/i,
      /sticky\s*(door|drawer)/i,
      /tighten.*loose/i,
      /loose.*tighten/i,
      /door\s*knob/i,
      /caulk\s*(around|tub|shower)/i,
      // Exterior maintenance patterns
      /exterior\s*maintenance/i,
      /fence\s*picket/i,
      /gutter\s*section/i,
      /screen\s*door/i,
      /rotted?\s*trim/i,
      // Cabinet/shelving handyman patterns  
      /adjust\s*cabinet/i,
      /cabinet\s*(door|hinge)/i,
      /replace.*hinge/i,
      /wall\s*shelving/i,
      /pegboard/i,
      /closet\s*organizer/i,
      /shelving\s*work/i,
      // Mounting/installation patterns
      /mount(ing)?\s*(&|and)?\s*install/i,
      /mount.*tv/i,
      /tv.*mount/i,
      /conceal\s*wire/i,
      /customer\s*supplie/i,
      /program.*remote/i,
    ],
  },

  // ===========================================================================
  // TRADE INDICATOR GROUPS (for lock-in detection)
  // These patterns strongly indicate a standalone trade job vs room remodel
  // ===========================================================================
  'trade-flooring': {
    id: 'trade-flooring',
    name: 'Flooring Trade Indicator',
    keywords: [
      /flooring\s*(install|work|project|replacement|only)/i,
      /install\s*(new\s*)?(lvp|lvt|hardwood\s*floor|laminate\s*floor|carpet|vinyl\s*(plank|floor|tile)|tile\s*floor)/i,
      /(lvp|lvt)\s*floor/i,
      /vinyl\s*plank\s*(floor|install)/i,
      /hardwood\s*(floor|install|sand|refinish|screen|recoat)/i,
      /screen\s*(&|and)?\s*(re)?coat/i,
      /(sand|buff|screen)\s*(and\s*)?(re)?coat/i,
      /carpet\s*(install|replace)/i,
      /laminate\s*(floor|install)/i,
      /floor\s*tile\s*install/i,
      /new\s*floor/i,
      /floor.*installation/i,
      /refinish.*floor/i,
      // Service-specific patterns
      /replace\s*(old\s*)?floor(ing)?/i,
      /remove\s*(and\s*)?(replace\s*)?(old\s*)?floor(ing)?/i,
      /subfloor\s*(repair|replace|damage)/i,
      /damaged\s*subfloor/i,
      /floor(ing)?\s*replacement/i,
      /tear\s*(out|up)\s*(old\s*)?floor/i,
      /rip\s*(out|up)\s*(old\s*)?floor/i,
      /floor(ing)?\s*throughout/i,
    ],
  },
  'trade-painting': {
    id: 'trade-painting',
    name: 'Painting Trade Indicator', 
    keywords: [
      /paint(ing)?\s*(project|job|work)/i,
      // Interior/exterior paint only when NOT touch-up
      /(?<!touch[\s-]?up\s*)interior\s*paint(ing)?/i,
      /(?<!touch[\s-]?up\s*)exterior\s*paint(ing)?/i,
      /paint\s*(all\s*)?(walls|ceiling|room|house)/i,
      /wall\s*paint/i,
      /ceiling\s*paint/i,
      /prime?\s*(and|&)\s*paint/i,
      /\d\s*coats?\s*(of\s*)?paint/i,
      /paint\s*\d\s*coats?/i,
      /benjamin\s*moore/i,
      /sherwin[\s-]?williams/i,
    ],
  },
  'trade-painting-exterior': {
    id: 'trade-painting-exterior',
    name: 'Exterior Painting Trade Indicator',
    keywords: [
      /exterior\s*paint(ing)?/i,
      /paint(ing)?\s*(the\s*)?(exterior|outside|house|home)/i,
      /house\s*exterior/i,
      /exterior\s*trim\s*paint/i,
      /siding\s*(paint|stain)/i,
      /paint\s*siding/i,
      /pressure\s*wash/i,
      /power\s*wash/i,
      /fascia/i,
      /soffit/i,
      /shutters?\s*(paint|stain)/i,
      /paint\s*shutters?/i,
      /caulk.*exterior/i,
      /exterior.*caulk/i,
      /scrape.*paint/i,
      /peel(ing)?\s*paint/i,
      /paint.*porch/i,
      /porch.*paint/i,
    ],
  },
  'trade-painting-interior': {
    id: 'trade-painting-interior',
    name: 'Interior Painting Trade Indicator',
    keywords: [
      /interior\s*paint(ing)?/i,
      /paint(ing)?\s*(the\s*)?interior/i,
      /paint\s*(all\s*)?(walls|ceiling|room)/i,
      /room\s*paint/i,
      /wall\s*paint/i,
      /ceiling\s*paint/i,
      /paint\s*(living|bed|bath|dining|kitchen)\s*room/i,
      /paint\s*\d+\s*(rooms?|walls?)/i,
      /\d+\s*rooms?\s*paint/i,
      /drywall.*paint/i,
      /paint.*drywall/i,
      /patch.*paint/i,
      // Room-specific painting headers - standalone room + paint anywhere in bid
      /kitchen\s*paint(ing)?/i,
      /bathroom\s*paint(ing)?/i,
      /basement\s*paint(ing)?/i,
      /bedroom\s*paint(ing)?/i,
      /living\s*room\s*paint(ing)?/i,
      /dining\s*room\s*paint(ing)?/i,
      /hallway\s*paint(ing)?/i,
      /foyer\s*paint(ing)?/i,
      /stairwell\s*paint(ing)?/i,
      /paint\s*kitchen/i,
      /paint\s*bathroom/i,
      /paint\s*basement/i,
      /paint\s*bedroom/i,
      /paint\s*living/i,
      /paint\s*dining/i,
      /paint\s*hallway/i,
      /paint\s*foyer/i,
      /paint\s*stair/i,
      /prep\s*(interior\s*)?walls/i,
      // Prime + paint combinations
      /prime\s*(and|&)?\s*paint/i,
      /prime\s*stain/i,
      /paint\s*walls?\s*\(\d+\s*coats?\)/i,
      /\d+\s*coats?\s*(of\s*)?paint/i,
      // Ceiling-specific
      /paint\s*ceiling/i,
      /ceiling\s*paint/i,
    ],
  },
  'trade-electrical': {
    id: 'trade-electrical',
    name: 'Electrical Trade Indicator',
    keywords: [
      /electrical\s*(work|project|service|upgrade|rough)/i,
      /panel\s*(upgrade|replace|install)/i,
      /200\s*amp/i,
      /add(ing)?\s*(dedicated\s*)?circuits?/i,
      /run\s*(new\s*)?(wire|circuit)/i,
      /rewir(e|ing)/i,
      /subpanel/i,
      /breaker\s*(box|panel)/i,
      /electrical\s*permit/i,
      /outlets?\s*(and|&)\s*(switch|light)/i,
      // EV charger installations
      /ev\s*charger/i,
      /electric\s*vehicle\s*charger/i,
      /chargepoint/i,
      /tesla\s*charger/i,
      /nema\s*14[\s-]?50/i,
      /level\s*2\s*charger/i,
      // Generator installations
      /generator\s*(install|project)/i,
      /standby\s*generator/i,
      /whole\s*house\s*generator/i,
      /transfer\s*switch/i,
      /generac/i,
      /kohler\s*generator/i,
      // Conduit runs
      /run\s*conduit/i,
      /conduit\s*(from|to)\s*panel/i,
      // Emergency/service-specific patterns
      /emergency\s*electric(al)?/i,
      /electric(al)?\s*emergency/i,
      /electrical\s*service\s*call/i,
      /service\s*call.*electric/i,
      /replace\s*(old\s*)?(outlet|switch|breaker|fixture)/i,
      /outlet\s*(repair|replace|install)/i,
      /switch\s*(repair|replace|install)/i,
      /light\s*fixture\s*(repair|replace|install)/i,
      /circuit\s*(repair|troubleshoot|fix)/i,
      /fix\s*(a\s*)?circuit/i,
      /no\s*(power|electricity)/i,
      /power\s*out(age)?/i,
      /tripping\s*breaker/i,
      /breaker\s*(keeps?\s*)?tripping/i,
    ],
    primaryTrade: 'electrician',
  },
  'trade-plumbing': {
    id: 'trade-plumbing',
    name: 'Plumbing Trade Indicator',
    keywords: [
      /plumb(ing)?\s*(work|project|service|repair)?/i,
      /repipe/i,
      /re[\s-]?pipe/i,
      /whole\s*house\s*repipe/i,
      /water\s*heater/i,
      /tankless/i,
      /sewer\s*(line)?/i,
      /main\s*(drain|line|sewer)/i,
      /fixture\s*(install|replace|replacement)?/i,
      /supply\s*lines?/i,
      /pex\s*(water|pipe|line)?/i,
      /copper\s*pipe/i,
      /drain\s*(line|clean|repair)/i,
      /gas\s*line/i,
      // Emergency/service-specific patterns
      /emergency\s*(plumb|water|leak|pipe)/i,
      /plumb(ing)?\s*emergency/i,
      /flood\s*(damage|repair|restoration)/i,
      /water\s*(damage|mitigation|restoration)/i,
      /drying\s*fans?/i,
      /fans?\s*(for\s*)?drying/i,
      /dehumidifier/i,
      /leak\s*(repair|detection|fix)/i,
      /fix\s*(a\s*)?leak/i,
      /burst\s*pipe/i,
      /pipe\s*burst/i,
      /service\s*call/i,
      /plumb(ing)?\s*service\s*call/i,
      /replace\s*(old\s*)?(faucet|valve|toilet|disposal)/i,
      /toilet\s*(repair|replace|install)/i,
      /faucet\s*(repair|replace|install)/i,
    ],
    primaryTrade: 'plumber',
  },
  'trade-window': {
    id: 'trade-window',
    name: 'Window Trade Indicator',
    keywords: [
      /window\s*(replace|install|project)/i,
      /replace\s*(all\s*)?windows?/i,
      /new\s*windows?/i,
      /vinyl\s*(double[\s-]?hung|window)/i,
      /double[\s-]?hung\s*window/i,
      /casement\s*window/i,
      /window\s*(trim|installation)/i,
      /\d+\s*windows?/i,
      /energy\s*star\s*window/i,
    ],
  },
  'trade-hvac': {
    id: 'trade-hvac',
    name: 'HVAC Trade Indicator',
    keywords: [
      /hvac/i,
      /duct\s*(work|clean|seal|repair|service)?/i,
      /furnace/i,
      /\b(ac|a\/c)\b\s*(unit|install|replace|repair|service)?/i,
      /air\s*condition(er|ing)?/i,
      /heat\s*pump/i,
      /mini[\s-]?split/i,
      /condenser/i,
      /evaporator\s*coil/i,
      /refrigerant/i,
      /freon/i,
      /compressor/i,
      /exhaust\s*fan\s*install/i,
      /range\s*hood\s*(vent|install|duct)/i,
      /vent\s*(through|to)\s*(roof|attic|soffit)/i,
      // HVAC repair patterns
      /capacitor\s*(fail|replace)/i,
      /recharge\s*(system|refrigerant)/i,
      /system\s*not\s*cooling/i,
      /not\s*cooling/i,
      /ac\s*repair/i,
      /hvac\s*repair/i,
      /leak.*refrigerant/i,
      /refrigerant.*leak/i,
    ],
    primaryTrade: 'hvac',
  },
  'trade-roof': {
    id: 'trade-roof',
    name: 'Roofing Trade Indicator',
    keywords: [
      /roof(ing)?\s*(replace|install|project|work)/i,
      /re[\s-]?roof/i,
      /new\s*roof/i,
      /shingle\s*(install|replace)/i,
      /tear[\s-]?off.*roof/i,
      /roof.*tear[\s-]?off/i,
      /architectural\s*shingle/i,
    ],
    primaryTrade: 'roofer',
  },
  'trade-deck': {
    id: 'trade-deck',
    name: 'Deck Trade Indicator',
    keywords: [
      /deck\s*(build|construct|install|repair|stain|refinish)/i,
      /\bdeck\s*repair\b/i,                  // "DECK REPAIR" header
      /\bdeck\s*refinish(ing)?\b/i,          // "DECK REFINISHING" header
      /new\s*deck/i,
      /build.*deck/i,
      /trex\s*deck/i,
      /composite\s*deck/i,
      /deck\s*(board|railing|post)/i,
      /pressure[\s-]?treat.*deck/i,
      /existing\s*deck\s*:/i,                // "existing deck: 400 sf" - require colon to avoid "roof deck"
      /power\s*wash.*deck/i,
      /sand.*deck/i,
      // Deck repair patterns
      /replace.*board.*deck/i,
      /loose\s*board/i,
      /tighten\s*railing/i,
      /replace.*baluster/i,
      /apply\s*sealer/i,
    ],
  },

  // ===========================================================================
  // SERVICE INDICATOR GROUPS (distinguish standalone service work from room remodels)
  // These patterns identify service-type jobs that shouldn't be classified as rooms
  // ===========================================================================
  'plumbing-service-indicator': {
    id: 'plumbing-service-indicator',
    name: 'Plumbing Service Job Indicator',
    keywords: [
      // Emergency/urgent patterns
      /emergency\s*(plumb|water|leak|pipe)/i,
      /plumb(ing)?\s*emergency/i,
      /urgent\s*(plumb|leak|water)/i,
      // Flood/water damage restoration
      /flood\s*(damage|repair|restoration)/i,
      /water\s*(damage|mitigation|restoration)/i,
      /drying\s*fans?/i,
      /fans?\s*(for\s*)?drying/i,
      /dehumidifier/i,
      // Specific repair patterns
      /leak\s*(repair|detection|fix)/i,
      /fix\s*(a\s*)?leak/i,
      /burst\s*pipe/i,
      /pipe\s*burst/i,
      /broken\s*pipe/i,
      // Service call patterns
      /plumb(ing)?\s*service\s*call/i,
      /service\s*call.*plumb/i,
      /plumber\s*service/i,
      // Whole-house/multi-room scope
      /whole\s*house\s*(repipe|plumb)/i,
      /repipe\s*(whole|entire)\s*house/i,
      /full\s*(house\s*)?(repipe|replumb)/i,
      /\d+\s*bathrooms?.*plumb/i,
      /plumb.*\d+\s*bathrooms?/i,
      // Specific system work (not part of remodel)
      /main\s*(sewer|drain|line)\s*(repair|replace|clear)/i,
      /sewer\s*(line\s*)?(camera|scope|inspect)/i,
      /water\s*heater\s*(only|replace|install|replacement)/i,
      /tankless\s*(water\s*heater\s*)?(install|convert)/i,
      /gas\s*line\s*(run|install|extend)/i,
      // Simple repair patterns (from service calls)
      /clog(ged)?\s*(drain|toilet|pipe|sink)/i,
      /unclog/i,
      /snake\s*(the\s*)?(drain|pipe)/i,
      /rooter/i,
      /plumb(ing)?\s*repair/i,
      /toilet\s*(repair|replacement|issue|problem)/i,
      /faucet\s*(repair|replacement|issue|problem)/i,
      /running\s*toilet/i,
      /leaky\s*(faucet|toilet|pipe|valve)/i,
      /water\s*heater\s*(repair|service|flush|issue)/i,
      /drain\s*(cleaning|clearing|service)/i,
      /repair\s*(the\s*)?(toilet|faucet|valve|drain|pipe|leak)/i,
      /fix\s*(the\s*)?(toilet|faucet|valve|drain|pipe|leak)/i,
      /replace\s*(toilet|faucet|valve|disposal)/i,
      // MULTI-FIXTURE service patterns (key differentiator from bathroom remodels)
      /plumb(ing)?\s*fixture\s*(replacement|install)/i,
      /fixture\s*replacement/i,
      /install\s*(new\s*)?(toilet|faucet)/i,
      /multiple\s*(fixture|toilet|faucet)/i,
      /labor\s*only/i,
      /(customer|homeowner)\s*supplie?d?/i,
      // Water heater patterns (plumbing not HVAC)
      /water\s*heater/i,
      /hot\s*water\s*(tank|heater)/i,
      /expansion\s*tank/i,
      /t&p\s*(discharge|valve)/i,
      /drain\s*pan/i,
      // Repipe patterns
      /repipe/i,
      /re[\s-]?pipe/i,
      /pex\s*(water|line|pipe|throughout)/i,
      /manifold\s*system/i,
      /shut[\s-]?off\s*valve/i,
      // Sewer/drain patterns
      /sewer\s*line/i,
      /main\s*line/i,
      /excavat/i,
      /clay\s*pipe/i,
      /cast\s*iron\s*pipe/i,
    ],
    primaryTrade: 'plumber',
  },
  'electrical-service-indicator': {
    id: 'electrical-service-indicator',
    name: 'Electrical Service Job Indicator',
    keywords: [
      // Emergency/urgent patterns
      /emergency\s*electric(al)?/i,
      /electric(al)?\s*emergency/i,
      /urgent\s*electric(al)?/i,
      /no\s*(power|electricity)/i,
      /power\s*out(age)?/i,
      // Troubleshooting/repair patterns
      /tripping\s*breaker/i,
      /breaker\s*(keeps?\s*)?tripping/i,
      /circuit\s*(troubleshoot|diagnos)/i,
      /troubleshoot\s*(circuit|electric)/i,
      /electrical\s*issue/i,
      /electric(al)?\s*problem/i,
      // Service call patterns
      /electrical\s*service\s*call/i,
      /service\s*call.*electric/i,
      /electrician\s*service/i,
      // Panel/system upgrades (standalone)
      /panel\s*(upgrade|replacement|swap)/i,
      /upgrade\s*(to\s*)?200\s*amp/i,
      /200\s*amp\s*(upgrade|service)/i,
      /main\s*panel\s*(work|replace)/i,
      /meter\s*(upgrade|replace|relocate)/i,
      // Whole-house scope
      /whole\s*house\s*(rewire|electric)/i,
      /rewire\s*(whole|entire)\s*house/i,
      /full\s*(house\s*)?rewire/i,
      // Specific installations (not part of remodel)
      /ev\s*charger\s*(install|project)/i,
      /generator\s*(install|project|work)/i,
      /standby\s*generator/i,
      /dedicated\s*circuit\s*(for|run)/i,
      /run\s*circuit\s*(to|for)/i,
      // Simple repair/install patterns (from service calls)
      /electrical\s*repair/i,
      /repair\s*(the\s*)?(outlet|switch|breaker|circuit|light|fixture)/i,
      /fix\s*(the\s*)?(outlet|switch|breaker|circuit|light|fixture)/i,
      /replace\s*(outlet|switch|light\s*fixture|breaker)/i,
      /outlet\s*(repair|replacement|issue|not\s*working|dead)/i,
      /switch\s*(repair|replacement|issue|not\s*working)/i,
      /flickering\s*light/i,
      /light\s*fixture\s*(replace|install|repair)/i,
      /install\s*(a\s*)?(ceiling\s*fan|light|fixture|outlet|switch)/i,
      /add\s*(a\s*)?(outlet|switch)/i,
      /gfci\s*(install|replace|upgrade)/i,
      /smoke\s*detector\s*(install|replace)/i,
      // CIRCUIT WORK patterns (key differentiator from room remodels)
      /add(ing)?\s*circuit/i,
      /\d+\s*(x\s*)?\d*a?\s*circuit/i,
      /circuit\s*add/i,
      /new\s*circuit/i,
      /appliance\s*circuit/i,
      /range\s*circuit/i,
      /dishwasher\s*circuit/i,
      /disposal\s*circuit/i,
      // Room-specific ELECTRICAL work (not remodel) - KEY FOR ROOM-BASED ELECTRICAL
      /kitchen\s*electric(al)?/i,
      /electric(al)?\s*(upgrade|work)\s*(for|in)\s*(kitchen|bathroom|basement)/i,
      /bathroom\s*(fan|exhaust|vent)\s*(install|replace)/i,
      /exhaust\s*fan\s*(install|replace|with\s*light)/i,
      /basement\s*(wir|electric)/i,
      /bathroom\s*electric(al)?/i,
      // Bathroom electrical specifics
      /vanity\s*light\s*(fixture|install)/i,
      /new\s*exhaust\s*fan/i,
      /fan\s*with\s*light/i,
      /(install|new)\s*gfci/i,
      // Specific outlet/wiring patterns
      /\d+\s*(new\s*)?outlet/i,
      /outlet.*\d+/i,
      /range\s*outlet/i,
      /dryer\s*outlet/i,
      /50\s*a(mp)?\s*(outlet|circuit|range)/i,
      /30\s*a(mp)?\s*(outlet|circuit|dryer)/i,
      /240\s*v(olt)?/i,
      /under\s*cabinet\s*light/i,
      // Transfer switch / backup power
      /transfer\s*switch/i,
      /generac/i,
      /kohler\s*generator/i,
      /nema\s*14[\s-]?50/i,
      /level\s*2\s*charger/i,
      // Rough-in only (not finishing)
      /rough[\s-]?in\s*only/i,
      /rough\s*wiring\s*only/i,
      /electrical\s*rough[\s-]?in/i,
      // Subpanel installation
      /install\s*subpanel/i,
      /subpanel\s*install/i,
      /\d+\s*a(mp)?\s*subpanel/i,
    ],
    primaryTrade: 'electrician',
  },
  'flooring-service-indicator': {
    id: 'flooring-service-indicator',
    name: 'Flooring Service Job Indicator',
    keywords: [
      // BROAD flooring job indicators - these are the primary matchers
      /tile\s*flooring/i,              // "TILE FLOORING" header
      /flooring\s*install/i,           // "flooring installation", "flooring install"
      /install.*flooring/i,            // "install hardwood flooring"
      /install.*(porcelain|ceramic|marble|travertine|slate)\s*tile/i, // "install porcelain tile" in flooring context
      /install.*(lvp|lvt|vinyl\s*(plank|floor|tile)|hardwood\s*floor|carpet|laminate\s*floor)\b/i, // "install LVP", "install vinyl plank" (not "vinyl window")
      /lvp\s*flooring/i,               // "LVP flooring"
      /remove.*(floor|flooring)/i,     // "remove existing flooring"
      /flooring\s*proposal/i,          // "FLOORING PROPOSAL"
      /flooring\s*estimate/i,          // "FLOORING ESTIMATE"
      /flooring\s*quote/i,             // "FLOORING QUOTE"
      /(vinyl|luxury)\s*plank/i,       // "vinyl plank", "luxury vinyl plank"
      // Whole-house/multi-room scope
      /flooring\s*throughout/i,
      /throughout.*floor/i,
      /whole\s*house\s*floor/i,
      /floor(ing)?\s*(whole|entire)\s*house/i,
      /\d+\s*(sf|sq\.?\s*ft|square\s*feet).*flooring/i, // Require "flooring" not just "floor" to avoid deck matches
      /flooring.*\d{3,}\s*(sf|sq\.?\s*ft)/i,         // Require "flooring" not just "floor" to avoid deck matches
      /main\s*floor\s*only/i,
      /first\s*floor\s*only/i,
      // Replacement/removal patterns
      /floor(ing)?\s*replacement/i,
      /replace.*(floor|flooring)/i,
      /tear\s*out.*(floor|flooring)/i,
      /rip\s*out.*(floor|flooring)/i,
      /demo.*(floor|flooring)/i,
      // Subfloor work
      /subfloor\s*(repair|replace|damage|rot)/i,
      /damaged\s*subfloor/i,
      /rotted?\s*subfloor/i,
      /plywood\s*subfloor/i,
      /level\s*subfloor/i,
      // Specific flooring jobs
      /hardwood\s*(refinish|sand|stain)/i,
      /refinish\s*(hardwood|wood)\s*floor/i,
      /sand\s*(and\s*refinish\s*)?(wood|hardwood)\s*floor/i,
      /carpet\s*(install|replacement|remove)/i,
      // Multi-room patterns
      /\d+\s*rooms?.*floor/i,
      /floor.*\d+\s*rooms?/i,
      /bedrooms?\s*(and|&)\s*(hallway|living)/i,
      // Room-specific flooring (indicates flooring-focused work in a room)
      /(bathroom|kitchen|bedroom|living\s*room|master|hallway)\s*(floor|flooring|tile\s*floor)/i,
      /floor\s*tile\s*(in|for)\s*(bathroom|kitchen)/i,
      /tile\s*floor\s*(in|for)\s*(bathroom|kitchen)/i,
      /new\s*(floor|flooring)\s*(in|for)\s*(the\s*)?(bathroom|kitchen|basement)/i,
      // Flooring-only scope indicators
      /flooring\s*only/i,
      /floor\s*only/i,
      /just\s*(the\s*)?(floor|flooring)/i,
      /only\s*(the\s*)?(floor|flooring)/i,
      /floor\s*tile\s*only/i,
      // Screen and coat / refinish patterns
      /screen\s*(and|&)\s*coat/i,
      /screen\s*coat/i,
      /buff\s*(and|&)\s*coat/i,
      /recoat\s*(hardwood|wood|floor)/i,
    ],
    primaryTrade: 'flooring',
  },

  'adu-indicator': {
    id: 'adu-indicator',
    name: 'ADU Project Indicator',
    keywords: [
      /\badu\b/i,
      /accessory\s*dwelling/i,
      /detached\s*(dwelling|unit|studio)/i,
      /backyard\s*(cottage|unit|dwelling)/i,
      /granny\s*(flat|unit)/i,
      /guest\s*house/i,
      /in[\s-]?law\s*(suite|unit|apartment)/i,
      /casita/i,
      /tiny\s*home/i,
      /new\s*construction.*studio/i,
      /studio\s*adu/i,
    ],
  },
  'garage-indicator': {
    id: 'garage-indicator',
    name: 'Garage Conversion Indicator',
    keywords: [
      /garage\s*conversion/i,
      /convert(ing)?\s*(the\s*)?garage/i,
      /garage\s*to\s*(bedroom|living\s*room|living|office|studio|apartment)/i,
      /garage\s*(remodel|renovation|buildout)/i,
      /garage\s*apartment/i,
      /former\s*garage/i,
      // Phase 1 GC Logic: Structural signals for garage-to-living conversion
      /remove\s*(garage\s*)?door/i,
      /garage\s*door\s*removal/i,
      /infill\s*(garage\s*)?(door|opening)/i,
      /frame\s*in\s*garage/i,
      /frame\s*(the\s*)?garage\s*door/i,
      /level\s*(the\s*)?(sloped\s*)?slab/i,
      /raise\s*(the\s*)?floor/i,
      /vapor\s*barrier/i,
      /rigid\s*foam/i,
      /structural\s*slab/i,
    ],
  },
  // Phase 1 GC Logic: Garage finishing/organization patterns (NOT conversion)
  'garage-finishing-indicator': {
    id: 'garage-finishing-indicator',
    name: 'Garage Finishing Indicator (Not Conversion)',
    keywords: [
      /epoxy\s*(floor|coating)/i,
      /garage\s*epoxy/i,
      /slatwall/i,
      /slat\s*wall/i,
      /overhead\s*storage/i,
      /ceiling\s*storage/i,
      /garage\s*cabinet/i,
      /tool\s*storage/i,
      /workbench/i,
      /garage\s*organization/i,
      /floor\s*coating/i,
      /polyurea/i,
      /garage\s*shelving/i,
    ],
  },
  'room-addition-indicator': {
    id: 'room-addition-indicator',
    name: 'Room Addition Indicator',
    keywords: [
      /room\s*addition/i,
      /add(ing)?\s*(a\s*)?(new\s*)?(room|bedroom|office)/i,
      /addition\s*to\s*(the\s*)?(house|home)/i,
      /home\s*addition/i,
      // Office addition patterns
      /home\s*office\s*addition/i,
      /office\s*addition/i,
      /add(ing)?\s*(an?\s*)?office/i,
      /master\s*(suite|bedroom)\s*addition/i,
      /sunroom\s*addition/i,
      /family\s*room\s*addition/i,
      /bump[\s-]?out/i,
      /bumping\s*out/i,
      /extend(ing)?\s*(the\s*)?(house|home)/i,
      // Foundation/structural signals for additions (Phase A additions)
      /expand(ed|ing)?\s*footprint/i,
      /foundation\s*work/i,
      /new\s*foundation/i,
      /pour\s*foundation/i,
      /foundation\s*pour/i,
      /new\s*slab/i,
      /slab\s*pour/i,
      /exterior\s*wall/i,
      /new\s*exterior/i,
      /expand\s*square\s*footage/i,
      /add(ing)?\s*square\s*footage/i,
      /building\s*addition/i,
      /extend\s*(the\s*)?house/i,
      /roof\s*tie[\s-]?in/i,
      /tie[\s-]?in\s*(to\s*)?(the\s*)?(existing\s*)?roof/i,
      // Exterior framing signals (distinguishes from interior remodel)
      /exterior\s*framing/i,
      /frame\s*exterior\s*wall/i,
      /new\s*exterior\s*wall/i,
    ],
  },
  'kitchen-indicator': {
    id: 'kitchen-indicator',
    name: 'Kitchen Project Indicator',
    keywords: [
      /kitchen/i,
      /\bkitchen(ette)?\b/i,
      // Kitchen-specific cabinet references (not just any cabinet)
      /kitchen\s*cabinet/i,
      /base\s*cabinet/i,
      /upper\s*cabinet/i,
      /wall\s*cabinet/i,
      // Kitchen-specific items
      /backsplash/i,
      /range\s*hood/i,
      /cooktop/i,
      /stove/i,
      /oven\b/i,
      /dishwasher/i,
      /refrigerator/i,
      /galley/i,
      /island\s*(counter|cabinet|top)/i,
    ],
  },
  // ===========================================================================
  // KITCHEN TIER INDICATORS (for kitchen-minor/major/upscale differentiation)
  // ===========================================================================
  'kitchen-minor-indicator': {
    id: 'kitchen-minor-indicator',
    name: 'Kitchen Minor/Surface Work Indicator',
    keywords: [
      /reface/i,
      /refacing/i,
      /cabinet\s*fronts?/i,
      /cabinet\s*doors?\s*(only|replac)/i,
      /drawer\s*fronts?/i,
      /door\s*replacement/i,
      /hardware\s*(swap|only|replac|upgrad)/i,
      /paint(ing)?\s*cabinets?/i,
      /cabinet\s*paint/i,
      /surface\s*refresh/i,
      /cosmetic\s*update/i,
      /same\s*layout/i,
      /existing\s*footprint/i,
      /keep(ing)?\s*(the\s*)?(same|existing)\s*layout/i,
      /no\s*layout\s*change/i,
      /replace\s*(cabinet\s*)?(doors|fronts)/i,
      // Cabinet replacement without layout change signals (Batch 3)
      /reconnect\s*existing\s*plumbing/i,
      /existing\s*plumbing\s*lines?/i,
      /connect\s*to\s*existing/i,
      /use\s*existing\s*plumbing/i,
      /existing\s*(gas|electric)\s*hookup/i,
      /no\s*plumbing\s*changes?/i,
      /no\s*electrical\s*changes?/i,
      // Stock cabinet brands (not custom)
      /kraftmaid/i,
      /ikea\s*cabinet/i,
      /home\s*depot\s*cabinet/i,
      /lowes?\s*cabinet/i,
      /in[\s-]?stock\s*cabinet/i,
      /stock\s*cabinet/i,
      /rta\s*cabinet/i,
      // Install appliances customer-supplied (not new hookups)
      /customer\s*supplied/i,
      /homeowner\s*provided/i,
      /install\s*new\s*(range|dishwasher|refrigerator|microwave)/i,
    ],
  },
  'kitchen-major-indicator': {
    id: 'kitchen-major-indicator',
    name: 'Kitchen Major Remodel Indicator',
    keywords: [
      // Island and pantry additions (key differentiators) - must be NEW/ADD
      /new\s*island/i,
      /install\s*island/i,
      /add(ing)?\s*(a\s*)?island/i,
      /island\s*install/i,
      /build(ing)?\s*(a\s*)?island/i,
      /pantry\s*addition/i,
      /walk[\s-]?in\s*pantry/i,
      /install\s*pantry/i,
      /add(ing)?\s*(a\s*)?pantry/i,
      /new\s*pantry/i,
      // Layout changes
      /layout\s*change/i,
      /new\s*layout/i,
      /change\s*(the\s*)?layout/i,
      /relocat(e|ing)\s*sink/i,
      /move\s*(the\s*)?sink/i,
      /moving\s*plumbing/i,
      /rework\s*plumbing/i,
      /new\s*electrical\s*runs?/i,
      // Full demo/gut
      /full\s*demo/i,
      /gut(ting)?\s*(the\s*)?kitchen/i,
      /demo\s*to\s*studs/i,
      // Subfloor work
      /new\s*subfloor/i,
      // Open concept patterns (Phase A additions)
      /open\s*floor\s*plan/i,
      /remove\s*load[\s-]?bearing/i,
      /integrated\s*living/i,
      /open\s*up\s*(the\s*)?kitchen/i,
      /open\s*(the\s*)?kitchen\s*to/i,
      /kitchen\s*open\s*to\s*(living|family|dining)/i,
      /combine\s*(kitchen|living|dining)/i,
    ],
  },
  'kitchen-upscale-indicator': {
    id: 'kitchen-upscale-indicator',
    name: 'Kitchen Upscale/Luxury Indicator',
    keywords: [
      // Custom cabinetry
      /custom\s*cabinet/i,
      /custom\s*cabinetry/i,
      /bespoke\s*cabinet/i,
      // Commercial/luxury appliances
      /commercial[\s-]?grade/i,
      /professional\s*series/i,
      /sub[\s-]?zero/i,
      /wolf\s*(range|oven|cooktop)/i,
      /viking\s*(range|oven|appliance)/i,
      /thermador/i,
      /miele/i,
      /gaggenau/i,
      /la\s*cornue/i,
      // Luxury finishes
      /stone\s*slab\s*backsplash/i,
      /full\s*slab/i,
      /book[\s-]?matched/i,
      /radiant\s*floor/i,
      /radiant\s*heat/i,
      /built[\s-]?in\s*(refrigerator|fridge)/i,
      /panel[\s-]?ready/i,
      /integrated\s*appliance/i,
      /furniture[\s-]?grade/i,
      /inset\s*cabinet/i,
    ],
  },
  'structural-indicator': {
    id: 'structural-indicator',
    name: 'Structural Work Indicator',
    keywords: [
      /wall\s*removal/i,
      /remove\s*(a\s*)?(the\s*)?wall/i,
      /removing\s*wall/i,
      /structural\s*beam/i,
      /load[\s-]?bearing/i,
      /load\s*bearing/i,
      /header\s*install/i,
      /install\s*header/i,
      /open\s*concept/i,
      /knock\s*down\s*(a\s*)?(the\s*)?wall/i,
      /demolish\s*(a\s*)?(the\s*)?wall/i,
      /lvl\s*beam/i,
      /support\s*beam/i,
      /steel\s*beam/i,
    ],
  },
  'addition-exterior-signal': {
    id: 'addition-exterior-signal',
    name: 'Addition Exterior Work Signal',
    keywords: [
      // Exterior work that signals a bump-out/addition (Phase A enhanced)
      /new\s*roofing/i,
      /roof\s*extension/i,
      /extend\s*(the\s*)?roof/i,
      /siding\s*install/i,
      /new\s*siding/i,
      /exterior\s*sheathing/i,
      /roof\s*tie[\s-]?in/i,
      /tie[\s-]?in\s*(to\s*)?(existing\s*)?roof/i,
      /match\s*existing\s*(roof|siding)/i,
      /exterior\s*framing/i,
      /frame\s*exterior/i,
      // Kitchen bump-out signals (roofing/siding with kitchen = addition not remodel)
      /kitchen.*siding/i,
      /siding.*kitchen/i,
      /kitchen.*roof(ing)?.*new/i,
      // Foundation signals for additions
      /foundation\s*pour/i,
      /pour\s*foundation/i,
      /new\s*footing/i,
      /concrete\s*foundation/i,
    ],
  },
  'bathroom-indicator': {
    id: 'bathroom-indicator',
    name: 'Bathroom Project Indicator',
    keywords: [
      /bathroom/i,
      /\bbath\b/i,
      /\bhalf\s*bath/i,
      /powder\s*room/i,
      /master\s*bath/i,
      /guest\s*bath/i,
      /en[\s-]?suite/i,
      /vanity/i,
      /toilet/i,
      /shower/i,
      /bathtub/i,
      /\btub\b/i,
      /lavatory/i,
    ],
  },
  'bathroom-addition-indicator': {
    id: 'bathroom-addition-indicator',
    name: 'Bathroom Addition Indicator',
    // Signals a NEW bathroom being constructed, not renovating an existing one
    // Key differentiator: new plumbing infrastructure (trenching, new stacks)
    keywords: [
      /add(ing)?\s*(a\s*)?(new\s*)?(full\s*)?(half\s*)?bath(room)?/i,  // "add bathroom", "adding a new full bath"
      /bathroom\s*addition/i,                                           // "bathroom addition"
      /new\s*bathroom\s*(construction|build)/i,                         // "new bathroom construction"
      /convert(ing)?\s*(closet|bedroom|storage)\s*(to|into)\s*bath/i,  // "convert closet to bathroom"
      /(closet|bedroom|storage)\s*(to|into)\s*bath(room)?/i,           // "closet to bathroom"
      /build(ing)?\s*(a\s*)?(new\s*)?(half\s*)?(full\s*)?bath(room)?/i, // "build new bathroom"
      /create\s*(a\s*)?(new\s*)?bath(room)?/i,                          // "create new bathroom"
      /install(ing)?\s*(a\s*)?(new\s*)?bathroom\s*(where|in\s*the)/i,   // "install new bathroom where closet was"
      /adding\s*(a\s*)?(half|full|powder|guest)\s*(bath|room)/i,        // "adding a half bath"
      // Plumbing infrastructure signals (Phase 6 additions)
      /new\s*plumbing\s*stack/i,
      /plumbing\s*trenching/i,
      /trench(ing)?\s*(for\s*)?plumbing/i,
      /new\s*waste\s*line/i,
      /trench\s*drain/i,
      /new\s*drain\s*line/i,
      /concrete\s*cutting/i,
      /slab\s*penetration/i,
      /new\s*vent\s*stack/i,
      /adding\s*bathroom/i,
      /bathroom\s*where\s*none\s*existed/i,
      /run\s*new\s*plumbing/i,
    ],
  },
  'bathroom-refresh-indicator': {
    id: 'bathroom-refresh-indicator',
    name: 'Bathroom Refresh/Light Update Indicator',
    // Signals light cosmetic work: fixtures, vanity swap, paint - NOT tile replacement
    keywords: [
      // Explicit "no tile" signals
      /no\s*tile\s*(work|change|replac)/i,
      /existing\s*tile\s*(remain|stay|keep|intact|good)/i,
      /keep(ing)?\s*(the\s*)?(existing\s*)?tile/i,
      /tile\s*(in\s*)?good\s*(shape|condition)/i,
      /leave\s*(the\s*)?tile/i,
      /tile\s*(to\s*)?remain/i,
      // Shower/tub staying signals
      /existing\s*shower\s*(remain|stay|keep|intact)/i,
      /existing\s*(tub|bathtub)\s*(remain|stay|keep|intact)/i,
      /keep(ing)?\s*(the\s*)?(existing\s*)?(shower|tub)/i,
      /shower\s*(to\s*)?remain/i,
      /(tub|bathtub)\s*(to\s*)?remain/i,
      /no\s*shower\s*(work|change|replac)/i,
      /no\s*tub\s*(work|change|replac)/i,
      // Fixture-only work
      /fixture\s*(only|swap|replac|upgrad)/i,
      /faucet\s*(only|swap|replac|upgrad)/i,
      /vanity\s*(swap|replac|upgrad)/i,
      /new\s*vanity/i,
      /toilet\s*(swap|replac|upgrad)/i,
      /new\s*toilet/i,
      /light(ing)?\s*(swap|replac|upgrad)/i,
      /new\s*(light|lighting)/i,
      /mirror\s*(swap|replac|upgrad)/i,
      /new\s*mirror/i,
      // Paint and cosmetic
      /paint\s*(and|&)?\s*fix(tures)?/i,
      /cosmetic\s*(refresh|update|upgrade)/i,
      /quick\s*refresh/i,
      /bathroom\s*refresh/i,
      /light\s*refresh/i,
      /surface\s*(refresh|update)/i,
      /accessories?\s*(only|update|swap)/i,
    ],
  },
  // Interior finish work scope groups
  'trim': {
    id: 'trim',
    name: 'Trim & Molding',
    keywords: [
      /trim\s*(work|install|replace)?/i,
      /molding/i,
      /baseboard/i,
      /crown\s*mold/i,
      /casing/i,
      /door\s*trim/i,
      /window\s*trim/i,
      /chair\s*rail/i,
      /wainscot/i,
    ],
    primaryTrade: 'carpenter',
  },
  'closet': {
    id: 'closet',
    name: 'Closet Work',
    keywords: [
      /closet/i,
      /wardrobe/i,
      /closet\s*(system|organizer|shelv)/i,
      /walk[\s-]?in\s*closet/i,
      /reach[\s-]?in\s*closet/i,
      /storage\s*system/i,
    ],
    primaryTrade: 'carpenter',
  },
  'carpet-install': {
    id: 'carpet-install',
    name: 'Carpet Installation',
    keywords: [
      /carpet(ing)?/i,
      /carpet\s*(install|replac)/i,
      /new\s*carpet/i,
      /wall[\s-]?to[\s-]?wall/i,
      /berber/i,
      /plush\s*carpet/i,
    ],
    primaryTrade: 'flooring',
  },
  'texture': {
    id: 'texture',
    name: 'Wall Texture',
    keywords: [
      /texture/i,
      /knock[\s-]?down/i,
      /orange\s*peel/i,
      /smooth\s*wall/i,
      /skip\s*trowel/i,
      /popcorn\s*(ceiling)?/i,
      /spray\s*texture/i,
    ],
    primaryTrade: 'drywall',
  },
  'doors': {
    id: 'doors',
    name: 'Door Work',
    keywords: [
      /\bdoor(s)?\b/i,
      /interior\s*door/i,
      /exterior\s*door/i,
      /entry\s*door/i,
      /door\s*(install|replac|hang)/i,
      /bi[\s-]?fold/i,
      /pocket\s*door/i,
      /sliding\s*door/i,
      /french\s*door/i,
    ],
    primaryTrade: 'carpenter',
  },
  'basement-indicator': {
    id: 'basement-indicator',
    name: 'Basement Project Indicator',
    keywords: [
      /basement/i,
      /\bcellar\b/i,
      /below\s*grade/i,
      /lower\s*level/i,
      /finished\s*basement/i,
      /unfinished\s*basement/i,
      /basement\s*(finish|remodel|renovation|refinish)/i,
    ],
  },
  // Indicator for basement refinishing/repair (vs new finishing)
  'basement-refinishing-indicator': {
    id: 'basement-refinishing-indicator',
    name: 'Basement Refinishing/Repair Indicator',
    keywords: [
      // Flood/water damage repair
      /flood\s*(damage|repair|restoration)/i,
      /water\s*(damage|mitigation|restoration)/i,
      /basement\s*flood/i,
      /flooded\s*basement/i,
      // Repair/restore language
      /basement\s*(repair|restore|restoration)/i,
      /(repair|restore|restoration)\s*(the\s*)?basement/i,
      /basement\s*cosmetic/i,
      /basement\s*(refresh|update|upgrade)/i,
      /(refresh|update|upgrade)\s*(the\s*)?basement/i,
      // Refinishing specific
      /basement\s*refinish/i,
      /refinish\s*(the\s*)?basement/i,
      // Already finished basement indicators
      /existing\s*(finished\s*)?basement/i,
      /finished\s*basement.*(repair|update|refresh|flood)/i,
      // Drywall repair (not install from scratch)
      /drywall\s*(repair|patch|replace)/i,
      /replace\s*(damaged\s*)?drywall/i,
      /patch\s*drywall/i,
      // Existing basement with fixtures language
      /basement.*with\s*(bath|kitchenette|bar)/i,
      /existing.*basement.*with/i,
    ],
  },
  // Indicator for major basement reconfiguration (not just finishing)
  'basement-remodel-indicator': {
    id: 'basement-remodel-indicator',
    name: 'Basement Major Remodel Indicator',
    keywords: [
      // Require basement context for these patterns to avoid false positives on bathroom/kitchen remodels
      /basement\s*(re)?model/i,
      /basement\s*renovation/i,
      /basement\s*(re)?design/i,
      /basement\s*reconfigur(e|ation|ing)/i,
      /(re)?model(ing)?\s*(the\s*)?basement/i,
      /basement\s*(open\s*)?concept/i,
      /basement\s*(new\s*)?layout/i,
      /basement\s*gut(ted|ting)?/i,
      /gut(ted|ting)?\s*(the\s*)?basement/i,
      // These are specific enough they don't need basement prefix
      /lower\s*level\s*(re)?model/i,
      /lower\s*level\s*renovation/i,
    ],
  },
};

// ============================================================================
// Kitchen Fingerprints
// ============================================================================

export const KITCHEN_FINGERPRINTS: ProjectFingerprint[] = [
  // Countertop-only installations (not full kitchen remodels)
  {
    classification: 'countertops-granite',
    displayName: 'Granite Countertop Installation',
    required: ['counter-stone'],
    expected: ['counter-install'],
    optional: ['plumbing-fixture'],
    absent: ['cabinet-install', 'cabinet-reface', 'cabinet-paint', 'demo-full', 'demo-partial', 'plumbing-rough', 'electrical-rough', 'tile-wall', 'tile-floor', 'appliance-standard', 'appliance-commercial', 'basement-indicator', 'bathroom-indicator'],
    priceRange: { low: 1700, median: 2050, high: 2500, unit: 'total' },
    tradeMix: { 'carpenter': 0.60, 'plumber': 0.20, 'general': 0.20 },
  },
  {
    classification: 'countertops-quartz',
    displayName: 'Quartz Countertop Installation',
    required: ['counter-stone'],
    expected: ['counter-install'],
    optional: ['plumbing-fixture'],
    absent: ['cabinet-install', 'cabinet-reface', 'cabinet-paint', 'demo-full', 'demo-partial', 'plumbing-rough', 'electrical-rough', 'tile-wall', 'tile-floor', 'appliance-standard', 'appliance-commercial', 'basement-indicator', 'bathroom-indicator'],
    priceRange: { low: 4500, median: 4900, high: 5500, unit: 'total' },
    tradeMix: { 'carpenter': 0.60, 'plumber': 0.20, 'general': 0.20 },
  },
  {
    classification: 'countertops',
    displayName: 'Countertop Installation',
    required: ['counter-install'],
    expected: [],
    optional: ['plumbing-fixture', 'counter-stone', 'counter-laminate', 'counter-solid'],
    absent: ['cabinet-install', 'cabinet-reface', 'cabinet-paint', 'demo-full', 'demo-partial', 'plumbing-rough', 'electrical-rough', 'tile-wall', 'tile-floor', 'appliance-standard', 'appliance-commercial', 'basement-indicator', 'bathroom-indicator'],
    priceRange: { low: 1700, median: 3600, high: 5500, unit: 'total' },
    tradeMix: { 'carpenter': 0.60, 'plumber': 0.20, 'general': 0.20 },
  },
  {
    classification: 'kitchen-cosmetic',
    displayName: 'Kitchen Cosmetic Refresh',
    // FIX: MUST have cabinet-paint to distinguish from general painting
    required: ['cabinet-paint'],
    expected: ['paint-walls', 'paint-trim'],
    optional: ['flooring-lvp', 'electrical-lighting', 'plumbing-fixture'],
    absent: ['demo-full', 'cabinet-install', 'plumbing-rough', 'structural-wall', 'counter-stone', 'cabinet-reface', 
             'tile-wall', 'tile-floor', 'bath-vanity', 'bath-shower'],
    priceRange: { low: 3000, median: 6000, high: 12000, unit: 'total' },
    tradeMix: { 'painter': 0.70, 'handyman': 0.30 },
  },
  {
    classification: 'kitchen-refresh',
    displayName: 'Kitchen Refresh (Refacing)',
    required: ['cabinet-reface'],
    expected: ['counter-install', 'plumbing-fixture', 'appliance-standard'],
    optional: ['tile-wall', 'flooring-lvp', 'electrical-lighting', 'paint-walls'],
    absent: ['demo-full', 'plumbing-rough', 'electrical-rough', 'structural-wall', 'framing'],
    priceRange: { low: 18000, median: 28000, high: 40000, unit: 'total' },
    tradeMix: { 'carpenter': 0.40, 'plumber': 0.15, 'electrician': 0.10, 'tile-setter': 0.10, 'painter': 0.15, 'general': 0.10 },
  },
  {
    classification: 'kitchen-minor',
    displayName: 'Kitchen Minor Remodel',
    // Phase 6: kitchen-indicator required, minor-indicator optional (confidence boost)
    // Key differentiator: no major indicators (island, pantry, structural) and no rough-in work
    required: ['kitchen-indicator'],
    expected: ['counter-install', 'cabinet-install', 'plumbing-fixture', 'appliance-standard'],
    // kitchen-minor-indicator boosts confidence when present (refacing, same layout, etc.)
    optional: ['kitchen-minor-indicator', 'tile-wall', 'flooring-lvp', 'flooring-hardwood', 'electrical-lighting', 'paint-walls', 'debris', 'electrical-outlet'],
    // Strong absent list: cabinet-paint goes to kitchen-cosmetic, cabinet-reface goes to kitchen-refresh, major indicators disqualify
    // electrical-service-indicator = electrical work only (not kitchen remodel), basement-indicator = basement project with kitchenette
    absent: ['cabinet-paint', 'cabinet-reface', 'kitchen-major-indicator', 'kitchen-upscale-indicator', 'structural-indicator', 'addition-room-indicator', 'addition-exterior-signal',
             'structural-wall', 'plumbing-rough', 'foundation', 'framing', 'roof-shingle', 'hvac-unit', 'electrical-rough', 'bath-shower', 'bath-tub',
             'electrical-service-indicator', 'basement-indicator', 'basement-refinishing-indicator'],
    priceRange: { low: 10000, median: 25000, high: 40000, unit: 'total' },  // Phase D: 2026 price alignment
    tradeMix: { 'carpenter': 0.35, 'plumber': 0.15, 'electrician': 0.15, 'tile-setter': 0.15, 'painter': 0.10, 'general': 0.10 },
  },
  {
    classification: 'kitchen-major',
    displayName: 'Kitchen Major Remodel',
    // Phase 3: kitchen-indicator required, major-indicator boosts confidence in optional
    // Phase B: permit-indicator added - major kitchen work requires permits in 2026
    required: ['kitchen-indicator'],
    expected: ['demo-full', 'cabinet-install', 'counter-install', 'plumbing-connect', 'electrical-rough', 'tile-wall', 'appliance-standard', 'permits'],
    // kitchen-major-indicator, structural-indicator, permit-indicator boost confidence significantly
    optional: ['kitchen-major-indicator', 'structural-indicator', 'permit-indicator', 'tile-floor', 'electrical-lighting', 'plumbing-rough', 'structural-wall', 'flooring-hardwood', 'appliance-hood', 'smart-tech'],
    // Prevent minor bids from matching (refacing rule) and upscale/addition from matching
    // basement-indicator prevents basement projects with kitchenettes from matching
    absent: ['kitchen-minor-indicator', 'kitchen-upscale-indicator', 'addition-room-indicator', 'addition-exterior-signal',
             'foundation', 'addition-structure', 'appliance-commercial', 'cabinet-custom', 'basement-adu-indicator', 'basement-indicator', 'basement-refinishing-indicator'],
    priceRange: { low: 40000, median: 75000, high: 125000, unit: 'total' },  // Phase D: 2026 price alignment
    tradeMix: { 'carpenter': 0.35, 'plumber': 0.18, 'electrician': 0.18, 'tile-setter': 0.12, 'painter': 0.07, 'demo': 0.05, 'general': 0.05 },
  },
  {
    classification: 'kitchen-upscale',
    displayName: 'Kitchen Upscale/Gourmet',
    // Phase 4: Require kitchen-upscale-indicator (custom cabinets, luxury appliances, etc.)
    required: ['kitchen-indicator', 'kitchen-upscale-indicator'],
    expected: ['demo-full', 'cabinet-custom', 'counter-stone', 'appliance-commercial', 'plumbing-rough', 'electrical-rough', 'tile-wall', 'tile-floor', 'electrical-lighting', 'appliance-hood', 'permits'],
    optional: ['kitchen-major-indicator', 'structural-indicator', 'structural-wall', 'flooring-hardwood', 'smart-tech', 'cabinet-install', 'permit-indicator'],
    // Upscale should not match minor or pure addition projects
    // basement-indicator prevents basement projects with kitchenettes from matching
    absent: ['kitchen-minor-indicator', 'addition-room-indicator', 'basement-adu-indicator', 'basement-indicator', 'basement-refinishing-indicator', 'counter-laminate', 'appliance-standard', 'cabinet-paint'],
    priceRange: { low: 125000, median: 175000, high: 300000, unit: 'total' },  // Phase D: 2026 price alignment
    tradeMix: { 'carpenter': 0.30, 'plumber': 0.15, 'electrician': 0.20, 'tile-setter': 0.15, 'painter': 0.05, 'demo': 0.05, 'general': 0.10 },
  },
];

// ============================================================================
// Bathroom Fingerprints
// ============================================================================

export const BATHROOM_FINGERPRINTS: ProjectFingerprint[] = [
  {
    classification: 'bathroom-cosmetic',
    displayName: 'Bathroom Cosmetic Refresh',
    // Cosmetic = paint + fixture swap only. No tile, no demo, no plumbing rough.
    // bath-shower removed from absent - new showerhead is OK for cosmetic refresh
    required: ['bathroom-indicator'],  // Must have bathroom context - prevents kitchen painting false match
    expected: ['paint-walls', 'plumbing-fixture', 'bath-vanity', 'bath-mirror'],
    optional: ['electrical-lighting'],
    // plumbing-connect = actual supply line work (beyond fixture swap) → plumbing-service
    // drywall, doors, appliance-hood = multi-trade handyman work, not cosmetic bath refresh
    // kitchen-indicator = kitchen painting, not bathroom; electrical-service-indicator = electrical work only
    absent: ['demo-full', 'demo-partial', 'tile-wall', 'tile-floor', 'plumbing-rough', 'framing', 'tile-waterproof', 'basement-indicator',
             'flooring-service-indicator', 'plumbing-connect', 'drywall', 'doors', 'appliance-hood',
             'kitchen-indicator', 'electrical-service-indicator'],
    priceRange: { low: 2000, median: 5000, high: 8000, unit: 'total' },
    tradeMix: { 'painter': 0.50, 'plumber': 0.30, 'handyman': 0.20 },
  },
  {
    classification: 'bathroom-refresh',
    displayName: 'Bathroom Refresh',
    // Refresh = vanity + fixtures + flooring, but NO new tile work (existing tile stays)
    // tile-wall removed from absent - "existing tile remains" falsely triggers it
    // Key differentiator: no tile-waterproof (no shower re-tile)
    required: ['bathroom-indicator'],  // Must have bathroom context
    expected: ['bathroom-refresh-indicator', 'bath-vanity', 'plumbing-fixture', 'paint-walls', 'electrical-lighting', 'flooring-lvp'],
    optional: ['flooring-laminate', 'bath-mirror', 'counter-stone', 'demo-partial'],
    // electrical-service-indicator = electrical work only (not bathroom refresh)
    absent: ['demo-full', 'tile-waterproof', 'tile-floor', 'plumbing-rough', 'framing', 'bath-spa', 'basement-indicator', 'electrical-service-indicator'],
    priceRange: { low: 6000, median: 12000, high: 18000, unit: 'total' },
    tradeMix: { 'plumber': 0.40, 'painter': 0.25, 'electrician': 0.15, 'handyman': 0.20 },
  },
  {
    classification: 'bathroom-standard',
    displayName: 'Bathroom Standard Remodel',
    // Standard = full tile remodel within existing footprint
    // framing removed from absent - bench/niche framing is normal
    // bath-spa removed from absent - handled by upscale requiring it
    required: ['tile-floor'],
    expected: ['bathroom-indicator', 'demo-partial', 'tile-wall', 'bath-vanity', 'plumbing-fixture', 'bath-shower', 'tile-waterproof', 'paint-walls', 'debris'],
    optional: ['bath-tub', 'electrical-outlet', 'electrical-lighting', 'permits', 'framing'],
    absent: ['plumbing-rough', 'foundation', 'basement-indicator'],
    priceRange: { low: 18000, median: 28000, high: 42000, unit: 'total' },
    tradeMix: { 'plumber': 0.25, 'tile-setter': 0.30, 'carpenter': 0.15, 'electrician': 0.15, 'painter': 0.10, 'demo': 0.05 },
  },
  {
    classification: 'bathroom-upscale',
    displayName: 'Bathroom Upscale/Spa',
    // Require bath-spa to differentiate from standard - upscale needs luxury/spa features
    // bathroom-addition-indicator in absent - this is renovating existing, not adding new
    // Phase C: plumbing-new-stack in absent - new infrastructure = addition, not renovation
    required: ['bath-spa', 'tile-wall', 'tile-floor', 'tile-waterproof'],
    expected: ['bathroom-indicator', 'demo-full', 'bath-tub', 'bath-shower', 'plumbing-rough', 'electrical-rough', 'electrical-lighting', 'permits'],
    optional: ['framing', 'counter-stone', 'smart-tech', 'hvac-extend', 'drywall'],
    absent: ['flooring-lvp', 'flooring-laminate', 'counter-laminate', 'basement-indicator', 'bathroom-addition-indicator', 'plumbing-new-stack'],
    priceRange: { low: 50000, median: 80000, high: 130000, unit: 'total' },
    tradeMix: { 'plumber': 0.25, 'tile-setter': 0.25, 'carpenter': 0.15, 'electrician': 0.20, 'painter': 0.05, 'demo': 0.05, 'hvac': 0.05 },
  },
  {
    classification: 'bathroom-addition',
    displayName: 'Bathroom Addition',
    // Addition = new bathroom construction (closet conversion, basement bath, etc)
    // NOW REQUIRES bathroom-addition-indicator to differentiate from upscale renovation
    // Phase C: plumbing-new-stack added to optional - strong confidence boost for true additions
    // basement-indicator removed from absent - basement bathrooms are valid additions!
    required: ['bathroom-addition-indicator', 'framing', 'plumbing-rough', 'electrical-rough', 'drywall'],
    expected: ['bathroom-indicator', 'tile-wall', 'tile-floor', 'tile-waterproof', 'bath-vanity', 'bath-shower', 'permits'],
    optional: ['hvac-extend', 'bath-tub', 'basement-indicator', 'plumbing-new-stack'],
    // kitchen-indicator added - kitchen remodels with plumbing/electrical rough shouldn't match bathroom-addition
    absent: ['foundation', 'roof-shingle', 'roof-metal', 'hvac-unit', 'cabinet-install', 'appliance-standard', 'deck-boards', 'bath-spa', 'garage-indicator', 'kitchen-indicator'],
    priceRange: { low: 45000, median: 65000, high: 100000, unit: 'total' },
    tradeMix: { 'plumber': 0.25, 'carpenter': 0.25, 'electrician': 0.15, 'tile-setter': 0.20, 'drywall': 0.10, 'general': 0.05 },
  },
];

// ============================================================================
// Basement Fingerprints
// ============================================================================

export const BASEMENT_FINGERPRINTS: ProjectFingerprint[] = [
  {
    classification: 'basement-refinishing',
    displayName: 'Basement Refinishing (Cosmetic)',
    // Refinishing indicator is key differentiator from basement-finishing
    // Flood repair, water damage, restore, refresh all trigger refinishing not finishing
    required: ['basement-refinishing-indicator'],
    expected: ['basement-indicator', 'flooring-lvp', 'drywall', 'paint-walls'],
    optional: ['electrical-lighting', 'flooring-carpet', 'handyman-indicator', 'basement-insulation'],
    absent: ['framing', 'plumbing-rough', 'electrical-rough', 'hvac-extend', 'basement-egress', 'bathroom-indicator'],
    priceRange: { low: 12000, median: 21000, high: 35000, unit: 'total' },
    tradeMix: { 'painter': 0.35, 'flooring': 0.30, 'drywall': 0.20, 'electrician': 0.15 },
  },
  {
    classification: 'basement-finishing',
    displayName: 'Basement Finishing (Unfinished to Finished)',
    // Basement indicator required, remodel/refinishing indicators excluded
    // If flood/repair language present, should classify as refinishing instead
    required: ['basement-indicator'],
    expected: ['framing', 'basement-insulation', 'drywall', 'electrical-rough', 'flooring-lvp', 'flooring-carpet', 'paint-walls', 'electrical-lighting', 'hvac-extend', 'permits'],
    // Basement suites can have bathrooms, kitchenettes, and mini-splits
    optional: ['plumbing-rough', 'bath-shower', 'bath-vanity', 'basement-egress', 'basement-moisture', 'hvac-unit', 'counter-install', 'appliance-standard', 'bathroom-indicator'],
    // Exclude remodel/ADU/refinishing indicators - finishing is converting unfinished to finished, not repair/restoration
    absent: ['foundation', 'roof-shingle', 'roof-metal', 'roof-flat', 'appliance-commercial', 'deck-boards', 'cabinet-custom', 'counter-stone', 'kitchen-island', 'basement-remodel-indicator', 'basement-adu-indicator', 'bathroom-addition-indicator', 'basement-refinishing-indicator'],
    priceRange: { low: 40000, median: 55000, high: 85000, unit: 'total' },
    tradeMix: { 'carpenter': 0.25, 'electrician': 0.20, 'drywall': 0.15, 'hvac': 0.15, 'flooring': 0.10, 'painter': 0.10, 'insulation': 0.05 },
  },
  {
    classification: 'basement-remodel',
    displayName: 'Basement Major Remodel',
    // Remodel indicator required for lock-in (major reconfiguration)
    required: ['basement-remodel-indicator'],
    expected: ['basement-indicator', 'demo-partial', 'framing', 'drywall', 'electrical-rough', 'basement-insulation', 'plumbing-rough', 'hvac-extend', 'flooring-lvp', 'permits'],
    optional: ['bath-shower', 'bath-vanity', 'basement-egress', 'basement-moisture', 'smart-tech', 'bathroom-indicator'],
    absent: ['foundation', 'roof-shingle', 'roof-metal', 'roof-flat', 'hvac-unit', 'counter-stone', 'appliance-standard', 'deck-boards'],
    priceRange: { low: 55000, median: 75000, high: 120000, unit: 'total' },
    tradeMix: { 'carpenter': 0.25, 'electrician': 0.20, 'plumber': 0.15, 'drywall': 0.15, 'hvac': 0.10, 'flooring': 0.10, 'demo': 0.05 },
  },
  {
    classification: 'basement-adu',
    displayName: 'Basement ADU Conversion',
    // ADU indicator required for lock-in, kitchen elements allowed
    // In-law suites legitimately include separate entrances and bathrooms
    required: ['basement-adu-indicator'],
    expected: ['basement-indicator', 'basement-egress', 'electrical-rough', 'plumbing-rough', 'cabinet-install', 'appliance-standard', 'hvac-extend', 'framing', 'drywall', 'permits', 'bath-shower', 'bath-vanity'],
    optional: ['counter-stone', 'counter-laminate', 'flooring-lvp', 'flooring-tile', 'basement-moisture', 'smart-tech', 'bathroom-indicator', 'addition-structure'],
    absent: ['foundation', 'roof-shingle', 'roof-metal', 'roof-flat', 'deck-boards', 'siding'],
    priceRange: { low: 65000, median: 90000, high: 140000, unit: 'total' },
    tradeMix: { 'carpenter': 0.20, 'electrician': 0.20, 'plumber': 0.20, 'drywall': 0.10, 'hvac': 0.10, 'flooring': 0.10, 'general': 0.10 },
  },
];

// ============================================================================
// Other Project Fingerprints
// ============================================================================

export const FLOORING_FINGERPRINTS: ProjectFingerprint[] = [
  {
    classification: 'flooring-install',
    displayName: 'Flooring Installation',
    // Service indicator required - distinguishes from room remodels
    // Room indicators (bathroom/basement) REMOVED from absent - flooring jobs can happen in any room
    required: ['flooring-service-indicator'],
    expected: ['trade-flooring', 'demo-partial', 'debris', 'flooring-lvp', 'flooring-hardwood', 'flooring-carpet', 'flooring-laminate'],
    optional: ['paint-trim', 'misc-install', 'bathroom-indicator', 'basement-indicator'],
    // Only absent things that indicate REMODEL work, not room location
    // kitchen-indicator added - flooring mentioned in kitchen remodel shouldn't match flooring-only
    absent: ['framing', 'plumbing-rough', 'electrical-rough', 'cabinet-install', 'bath-vanity', 'bath-shower', 'kitchen-indicator'],
    priceRange: { low: 4, median: 8, high: 15, unit: 'psf' },
    tradeMix: { 'flooring': 0.90, 'general': 0.10 },
  },
  {
    classification: 'flooring-refinish',
    displayName: 'Hardwood Refinishing',
    // Trade indicator required - flooring-service-indicator also acceptable
    required: ['trade-flooring'],
    expected: ['flooring-hardwood', 'debris'],
    optional: ['flooring-service-indicator', 'bathroom-indicator', 'basement-indicator'],
    // Only absent things that indicate NEW flooring, not refinish
    absent: ['flooring-lvp', 'flooring-carpet', 'flooring-laminate', 'framing', 'plumbing-rough', 'cabinet-install', 'bath-vanity'],
    priceRange: { low: 3, median: 5, high: 8, unit: 'psf' },
    tradeMix: { 'flooring': 0.95, 'general': 0.05 },
  },
];

export const ROOFING_FINGERPRINTS: ProjectFingerprint[] = [
  {
    classification: 'roofing-replacement',
    displayName: 'Roof Replacement',
    required: ['roof-tearoff', 'roof-shingle'],
    expected: ['debris', 'permits', 'warranty'],
    optional: ['roof-metal', 'roof-flat'],
    absent: ['framing', 'plumbing-rough', 'electrical-rough'],
    priceRange: { low: 8000, median: 15000, high: 35000, unit: 'total' },
    tradeMix: { 'roofer': 0.90, 'general': 0.10 },
  },
  {
    classification: 'roofing-repair',
    displayName: 'Roof Repair',
    required: ['roof-repair'],
    expected: ['debris'],
    optional: ['warranty'],
    absent: ['roof-tearoff', 'framing', 'plumbing-rough'],
    priceRange: { low: 300, median: 800, high: 3000, unit: 'total' },
    tradeMix: { 'roofer': 0.95, 'general': 0.05 },
  },
];

export const WINDOW_FINGERPRINTS: ProjectFingerprint[] = [
  {
    classification: 'windows-replacement',
    displayName: 'Window Replacement',
    // Trade indicator for lock-in
    required: ['trade-window'],
    expected: ['window-replace', 'debris'],
    optional: ['paint-trim', 'permits'],
    absent: ['window-structural', 'framing', 'foundation', 'trade-flooring', 'trade-painting', 'trade-plumbing', 'trade-electrical'],
    priceRange: { low: 400, median: 750, high: 1500, unit: 'per-unit' },
    tradeMix: { 'window-installer': 0.85, 'carpenter': 0.10, 'general': 0.05 },
  },
];

export const PAINTING_FINGERPRINTS: ProjectFingerprint[] = [
  {
    classification: 'painting-interior',
    displayName: 'Interior Painting',
    // Interior-specific trade indicator for lock-in
    required: ['trade-painting-interior'],
    expected: ['paint-walls', 'paint-trim', 'trade-painting'],
    optional: ['drywall'],
    // Strong absent list to prevent kitchen/bathroom/flooring/exterior misclassification
    // Note: Removed kitchen-indicator - you CAN paint a kitchen (interior painting)
    absent: ['framing', 'plumbing-rough', 'electrical-rough', 'tile-wall', 'tile-floor',
             'cabinet-install', 'cabinet-reface', 'cabinet-paint', 'counter-install', 'counter-stone',
             'bath-vanity', 'bath-shower', 'bath-tub', 'plumbing-fixture',
             'flooring-hardwood', 'flooring-lvp', 'appliance-standard', 'hvac-unit',
             'roof-shingle', 'deck-boards', 'window-replace', 'trade-flooring', 'trade-electrical', 
             'trade-plumbing', 'trade-painting-exterior'],
    priceRange: { low: 2, median: 4, high: 7, unit: 'psf' },
    tradeMix: { 'painter': 0.95, 'general': 0.05 },
  },
  {
    classification: 'painting-exterior',
    displayName: 'Exterior Painting',
    // Exterior-specific trade indicator for lock-in
    required: ['trade-painting-exterior'],
    expected: ['paint-walls', 'paint-trim', 'trade-painting'],
    optional: ['deck-stain'],
    // Strong absent list to prevent kitchen/bathroom/interior misclassification
    // handyman-indicator = multi-task exterior maintenance, not dedicated exterior painting
    absent: ['framing', 'plumbing-rough', 'electrical-rough', 'tile-wall', 'tile-floor',
             'cabinet-install', 'counter-install', 'bath-vanity', 'bath-shower',
             'flooring-hardwood', 'flooring-lvp', 'appliance-standard', 'hvac-unit',
             'trade-flooring', 'trade-electrical', 'trade-plumbing', 'trade-painting-interior',
             'trade-deck', 'handyman-indicator'],
    priceRange: { low: 3, median: 5, high: 10, unit: 'psf' },
    tradeMix: { 'painter': 0.95, 'general': 0.05 },
  },
];

export const HVAC_FINGERPRINTS: ProjectFingerprint[] = [
  {
    classification: 'hvac-replacement',
    displayName: 'HVAC System Replacement',
    // Trade indicator for lock-in
    required: ['trade-hvac'],
    expected: ['hvac-unit', 'hvac-duct', 'electrical-panel', 'permits'],
    optional: ['smart-tech'],
    // Water heater is PLUMBING not HVAC - exclude it
    absent: ['framing', 'plumbing-rough', 'tile-wall', 'trade-flooring', 'trade-painting', 'trade-plumbing', 'trade-electrical', 'handyman-indicator',
             'plumbing-water-heater', 'plumbing-service-indicator'],
    priceRange: { low: 5000, median: 12000, high: 25000, unit: 'total' },
    tradeMix: { 'hvac': 0.80, 'electrician': 0.15, 'general': 0.05 },
  },
  {
    classification: 'hvac-service',
    displayName: 'HVAC Service/Repair',
    // Trade indicator for lock-in
    required: ['trade-hvac'],
    expected: ['hvac-extend', 'hvac-duct'],
    optional: ['electrical-outlet', 'misc-repair'],
    // Water heater is PLUMBING not HVAC - exclude it
    // Basement projects with HVAC work should be basement-finishing, not hvac-service
    // Garage conversions with HVAC work should be garage-conversion, not hvac-service
    // hvac-unit = full system replacement, not service/repair
    absent: ['hvac-unit', 'framing', 'plumbing-rough', 'trade-flooring', 'trade-painting', 'trade-plumbing', 'trade-electrical',
             'plumbing-water-heater', 'plumbing-service-indicator', 'basement-indicator', 'garage-indicator',
             'cabinet-install', 'counter-install', 'bath-vanity', 'tile-floor'],
    priceRange: { low: 150, median: 400, high: 1500, unit: 'total' },
    tradeMix: { 'hvac': 0.95, 'general': 0.05 },
  },
];

// ============================================================================
// Electrical Service Fingerprints
// ============================================================================

export const ELECTRICAL_FINGERPRINTS: ProjectFingerprint[] = [
  {
    classification: 'electrical-service',
    displayName: 'Electrical Service Work',
    // Service indicator required - distinguishes from kitchen/bathroom remodel
    required: ['electrical-service-indicator'],
    expected: ['trade-electrical', 'electrical-panel', 'electrical-outlet', 'electrical-lighting', 'electrical-rough', 'electrical-service-upgrade', 'electrical-rewire'],
    optional: ['permits', 'drywall', 'trade-plumbing', 'trade-hvac'],  // Gas lines common with generators, HVAC with mini-splits
    // Strong absent list to prevent kitchen/bathroom/flooring matches - removed trade-plumbing
    absent: ['cabinet-install', 'counter-install', 'tile-floor', 'tile-wall', 'bath-vanity', 'bath-shower', 
             'flooring-hardwood', 'flooring-lvp', 'plumbing-rough', 'hvac-unit', 'framing', 'foundation',
             'deck-boards', 'roof-shingle', 'trade-flooring', 'trade-painting'],
    priceRange: { low: 500, median: 2500, high: 8000, unit: 'total' },
    tradeMix: { 'electrician': 0.95, 'general': 0.05 },
  },
];

// ============================================================================
// Plumbing Service Fingerprints
// ============================================================================

export const PLUMBING_FINGERPRINTS: ProjectFingerprint[] = [
  {
    classification: 'plumbing-service',
    displayName: 'Plumbing Service Work',
    // Service indicator required - distinguishes from bathroom/kitchen remodel
    required: ['plumbing-service-indicator'],
    expected: ['trade-plumbing', 'plumbing-connect', 'plumbing-fixture', 'plumbing-water-heater', 'plumbing-repipe', 'plumbing-sewer'],
    optional: ['permits', 'drywall', 'misc-repair', 'trade-electrical'],  // drywall patches, tankless heaters need electrical
    // Strong absent list to prevent kitchen/bathroom/flooring matches
    // NOTE: trade-electrical removed - tankless water heaters need outlets/circuits
    // NOTE: trade-hvac removed - gas water heaters need gas line work
    // NOTE: bathroom-indicator removed - plumbing work in a bathroom is still plumbing-service (bath-vanity/shower/tub prevent bathroom remodels)
    absent: ['cabinet-install', 'cabinet-paint', 'counter-install', 'tile-floor', 'tile-wall', 'bath-vanity', 'bath-shower', 'bath-tub',
             'flooring-hardwood', 'flooring-lvp', 'hvac-unit', 'framing', 'foundation',
             'deck-boards', 'roof-shingle', 'paint-walls', 'paint-trim',
             'trade-flooring', 'trade-painting',
             'basement-indicator'],
    priceRange: { low: 200, median: 1500, high: 6000, unit: 'total' },
    tradeMix: { 'plumber': 0.95, 'general': 0.05 },
  },
];

// ============================================================================
// Handyman Fingerprints
// ============================================================================

export const HANDYMAN_FINGERPRINTS: ProjectFingerprint[] = [
  {
    classification: 'general-handyman',
    displayName: 'General Handyman Work',
    // Handyman indicator required for lock-in
    required: ['handyman-indicator'],
    expected: ['misc-repair', 'misc-install'],
    // Handyman often does minor plumbing/electrical/painting tasks
    optional: ['paint-walls', 'electrical-outlet', 'plumbing-fixture', 'drywall', 
               'trade-plumbing', 'trade-electrical', 'trade-hvac', 'trade-painting'],
    // Only block major scope items that indicate specialized work
    // Don't block trade indicators since handyman does light work in multiple trades
    // bathroom-indicator removed - handyman can work in bathrooms, but not do vanity/shower work
    // plumbing-service-indicator, electrical-service-indicator removed - handyman tests may mention these
    absent: ['demo-full', 'cabinet-install', 'counter-install', 'tile-floor', 'tile-wall', 
             'bath-shower', 'bath-vanity', 'flooring-hardwood', 'flooring-lvp', 'electrical-rough', 'plumbing-rough',
             'hvac-unit', 'framing', 'foundation', 'roof-shingle', 'deck-boards',
             'trade-flooring', 'trade-window', 'trade-roof', 'trade-deck',
             'flooring-service-indicator', 'electrical-panel', 'electrical-service-upgrade', 'plumbing-connect'],
    priceRange: { low: 150, median: 500, high: 2000, unit: 'total' },
    tradeMix: { 'handyman': 0.90, 'general': 0.10 },
  },
];

export const ADU_FINGERPRINTS: ProjectFingerprint[] = [
  {
    classification: 'garage-conversion',
    displayName: 'Garage Conversion',
    // Require garage-indicator OR structural elements if no explicit mention
    required: ['garage-indicator'],
    expected: ['framing', 'drywall', 'electrical-rough', 'hvac-extend', 'basement-insulation', 'flooring-lvp', 'paint-walls', 'permits', 'window-replace'],
    optional: ['plumbing-rough', 'bath-shower', 'cabinet-install'],
    // adu-indicator allowed - garage conversions can be in-law suites
    // Phase 1 GC Logic: Exclude garage organization/finishing projects
    absent: ['foundation', 'roof-shingle', 'deck-boards', 'counter-stone', 'appliance-commercial', 'room-addition-indicator', 'garage-finishing-indicator'],
    priceRange: { low: 50000, median: 85000, high: 150000, unit: 'total' },
    tradeMix: { 'carpenter': 0.25, 'electrician': 0.20, 'drywall': 0.15, 'hvac': 0.15, 'flooring': 0.10, 'plumber': 0.10, 'general': 0.05 },
  },
  {
    classification: 'addition-adu',
    displayName: 'ADU New Construction',
    // Require explicit ADU mention to distinguish from other additions
    required: ['adu-indicator'],
    expected: ['foundation', 'framing', 'plumbing-rough', 'electrical-rough', 'hvac-unit', 'drywall', 'cabinet-install', 'bath-shower', 'permits', 'debris', 'roof-shingle'],
    optional: ['counter-stone', 'tile-floor', 'flooring-hardwood', 'roof-metal', 'appliance-standard', 'cabinet-custom'],
    absent: ['deck-boards', 'appliance-commercial', 'basement-egress', 'basement-moisture', 'garage-indicator', 'room-addition-indicator'],
    priceRange: { low: 120000, median: 175000, high: 300000, unit: 'total' },
    tradeMix: { 'carpenter': 0.25, 'plumber': 0.15, 'electrician': 0.15, 'hvac': 0.10, 'foundation': 0.10, 'drywall': 0.10, 'flooring': 0.05, 'painter': 0.05, 'general': 0.05 },
  },
  {
    classification: 'addition-room',
    displayName: 'Room Addition',
    // Phase 5: Enhanced room addition detection with exterior signals
    required: ['room-addition-indicator'],
    expected: ['foundation', 'framing', 'electrical-rough', 'drywall', 'hvac-extend', 'flooring-lvp', 'paint-walls', 'permits'],
    // addition-exterior-signal (roofing/siding with addition) boosts confidence
    optional: ['addition-exterior-signal', 'structural-indicator', 'window-replace', 'tile-floor', 'roof-shingle', 'siding'],
    absent: ['cabinet-install', 'counter-install', 'deck-boards', 'bath-vanity', 'appliance-standard', 'adu-indicator', 'garage-indicator', 'kitchen-indicator', 'bathroom-indicator'],
    priceRange: { low: 40000, median: 70000, high: 150000, unit: 'total' },
    tradeMix: { 'carpenter': 0.30, 'electrician': 0.15, 'drywall': 0.15, 'hvac': 0.10, 'foundation': 0.10, 'flooring': 0.10, 'painter': 0.05, 'general': 0.05 },
  },
];

export const DECK_FINGERPRINTS: ProjectFingerprint[] = [
  {
    classification: 'deck-new',
    displayName: 'New Deck Construction',
    required: [],
    expected: ['deck-boards', 'deck-railing', 'deck-structure', 'framing', 'permits', 'debris'],
    optional: ['electrical-lighting', 'electrical-outlet', 'foundation', 'trade-deck'],
    // Strong absent to prevent kitchen/bathroom/flooring/painting matches
    // deck-repair-indicator prevents repair bids from matching new deck
    // trade-painting-interior prevents painting bids from matching deck
    absent: ['plumbing-rough', 'drywall', 'hvac-extend', 'cabinet-install', 'counter-install',
             'tile-floor', 'tile-wall', 'bath-vanity', 'flooring-hardwood', 'flooring-lvp', 'deck-repair-indicator',
             'trade-painting-interior', 'trade-painting', 'paint-walls', 'paint-trim'],
    priceRange: { low: 15000, median: 25000, high: 50000, unit: 'total' },
    tradeMix: { 'carpenter': 0.85, 'electrician': 0.10, 'general': 0.05 },
  },
  {
    classification: 'deck-repair',
    displayName: 'Deck Repair/Refinish',
    // Require explicit repair indicator to differentiate from deck-new
    required: ['deck-repair-indicator'],
    expected: ['deck-boards', 'deck-stain', 'debris'],
    optional: ['deck-railing', 'framing', 'misc-repair'],
    // Strong absent to prevent kitchen/bathroom/flooring matches
    absent: ['foundation', 'plumbing-rough', 'electrical-rough', 'cabinet-install', 'counter-install',
             'tile-floor', 'tile-wall', 'bath-vanity', 'flooring-hardwood', 'flooring-lvp', 'hvac-unit'],
    priceRange: { low: 2000, median: 6000, high: 15000, unit: 'total' },
    tradeMix: { 'carpenter': 0.90, 'general': 0.10 },
  },
];

// ============================================================================
// Fence & Linear Foot Project Fingerprints  
// ============================================================================

export const FENCE_FINGERPRINTS: ProjectFingerprint[] = [
  {
    classification: 'fence',
    displayName: 'Fence Installation',
    required: ['fence-indicator'],
    expected: ['debris'],
    optional: ['permits', 'foundation'],
    // handyman-indicator = multi-task maintenance, not fence-only job
    absent: ['deck-boards', 'cabinet-install', 'bath-vanity', 'plumbing-rough', 'electrical-rough', 'drywall', 'flooring-hardwood', 'flooring-lvp', 'tile-floor', 'kitchen-indicator', 'bathroom-indicator', 'handyman-indicator'],
    priceRange: { low: 2500, median: 5000, high: 15000, unit: 'linear-foot' },
    tradeMix: { 'carpenter': 0.90, 'general': 0.10 },
  },
  {
    classification: 'fence-repair',
    displayName: 'Fence Repair',
    required: ['fence-indicator'],
    expected: ['misc-repair', 'debris'],
    optional: [],
    // handyman-indicator = multi-task exterior maintenance, not fence-only job
    absent: ['deck-boards', 'cabinet-install', 'bath-vanity', 'plumbing-rough', 'electrical-rough', 'handyman-indicator'],
    priceRange: { low: 200, median: 800, high: 3000, unit: 'linear-foot' },
    tradeMix: { 'carpenter': 0.95, 'general': 0.05 },
  },
  {
    classification: 'gutter',
    displayName: 'Gutter Installation',
    required: ['gutter-indicator'],
    expected: ['debris'],
    optional: ['fascia'],
    // handyman-indicator = multi-task maintenance, not gutter-only job
    absent: ['fence-indicator', 'deck-boards', 'cabinet-install', 'bath-vanity', 'plumbing-rough', 'electrical-rough', 'drywall', 'roof-tearoff', 'roof-shingle', 'handyman-indicator'],
    priceRange: { low: 1000, median: 2500, high: 8000, unit: 'linear-foot' },
    tradeMix: { 'roofer': 0.70, 'general': 0.30 },
  },
  {
    classification: 'gutter-repair',
    displayName: 'Gutter Repair',
    required: ['gutter-indicator'],
    expected: ['misc-repair'],
    optional: ['debris'],
    absent: ['fence-indicator', 'deck-boards', 'cabinet-install', 'roof-tearoff', 'roof-shingle'], // Roofing project often includes gutter work
    priceRange: { low: 150, median: 500, high: 1500, unit: 'linear-foot' },
    tradeMix: { 'roofer': 0.70, 'general': 0.30 },
  },
  {
    classification: 'railing',
    displayName: 'Railing Installation',
    required: ['railing-indicator'],
    expected: [],
    optional: ['permits', 'debris'],
    absent: ['deck-boards', 'fence-indicator', 'cabinet-install', 'bath-vanity', 'plumbing-rough', 'electrical-rough', 'deck-repair-indicator'],
    priceRange: { low: 1000, median: 3000, high: 10000, unit: 'linear-foot' },
    tradeMix: { 'carpenter': 0.85, 'general': 0.15 },
  },
  {
    classification: 'retaining-wall',
    displayName: 'Retaining Wall',
    required: ['retaining-wall-indicator'],
    expected: ['foundation', 'debris'],
    optional: ['permits'],
    absent: ['fence-indicator', 'deck-boards', 'cabinet-install', 'bath-vanity', 'plumbing-rough', 'electrical-rough', 'drywall'],
    priceRange: { low: 3000, median: 8000, high: 25000, unit: 'linear-foot' },
    tradeMix: { 'concrete': 0.60, 'general': 0.40 },
  },
];

// ============================================================================
// Multi-Trade / Multi-Room Fingerprints
// ============================================================================

export const MULTI_TRADE_FINGERPRINTS: ProjectFingerprint[] = [
  // Whole-Home Remodel: Kitchen + Bath + Flooring + More
  // Must have BOTH cabinet work in kitchen AND bathroom fixtures being replaced
  {
    classification: 'whole-home-remodel',
    displayName: 'Whole Home Remodel',
    required: ['cabinet-install', 'bath-shower', 'flooring-service-indicator'], // All 3 required - real multi-room remodel
    expected: [
      'kitchen-indicator', 'bathroom-indicator', 'trade-painting', 'trade-electrical', 'trade-plumbing'
    ],
    optional: ['demo-partial', 'drywall', 'trim', 'lighting', 'hvac-unit', 'windows-replace', 'doors', 'counter-install'],
    absent: ['garage-indicator', 'adu-indicator', 'plumbing-service-indicator'], // Not service calls or conversions
    priceRange: { low: 75000, median: 150000, high: 400000, unit: 'total' },
    tradeMix: { 
      'general': 0.25, 'carpenter': 0.20, 'electrician': 0.15, 
      'plumber': 0.15, 'painter': 0.10, 'tile': 0.10, 'flooring': 0.05 
    },
  },
  
  // Partial-Home Remodel: Kitchen + Bath combo (2 major areas)
  // Must explicitly have BOTH cabinet work AND bath fixtures
  {
    classification: 'partial-home-remodel',
    displayName: 'Kitchen & Bath Remodel',
    required: ['cabinet-install', 'bath-vanity'], // Must have both cabinet AND vanity work
    expected: ['kitchen-indicator', 'bathroom-indicator', 'counter-install', 'tile-floor'],
    optional: [
      'bath-shower', 'trade-plumbing', 'trade-electrical', 'trade-painting', 'flooring-service-indicator'
    ],
    absent: ['foundation', 'roofing', 'framing'], // Not structural addition
    priceRange: { low: 40000, median: 80000, high: 175000, unit: 'total' },
    tradeMix: { 
      'general': 0.20, 'carpenter': 0.20, 'plumber': 0.20, 
      'electrician': 0.15, 'tile': 0.15, 'painter': 0.10 
    },
  },
  
  // Interior Refresh: Paint + Carpet/Flooring + Closets + Trim
  // Must have carpet specifically AND painting - generic flooring alone doesn't count
  {
    classification: 'interior-refresh',
    displayName: 'Interior Refresh',
    required: ['carpet-install', 'trade-painting'], // Specific requirements
    expected: ['trim', 'closet', 'doors'],
    optional: ['drywall', 'debris', 'flooring-service-indicator'],
    absent: [
      'cabinet-install', 'counter-install', 'bath-vanity', 'bath-shower',
      'plumbing-rough', 'electrical-rough', 'hvac-unit', 'roofing', 'foundation',
      'kitchen-indicator', 'bathroom-indicator', 'basement-indicator'
    ],
    priceRange: { low: 8000, median: 20000, high: 50000, unit: 'total' },
    tradeMix: { 'painter': 0.50, 'flooring': 0.35, 'carpenter': 0.15 },
  },
  
  // Interior Update: Flooring + Paint + Trim (cosmetic upgrade - requires ALL 3)
  {
    classification: 'interior-update',
    displayName: 'Interior Update',
    required: ['flooring-service-indicator', 'trade-painting', 'trim'], // All 3 required
    expected: ['doors', 'debris'],
    optional: ['drywall', 'lighting'],
    absent: [
      'cabinet-install', 'counter-install', 'bath-vanity', 'bath-shower', 'bath-tub',
      'plumbing-rough', 'electrical-rough', 'hvac-unit', 'roofing', 'foundation', 'framing',
      'kitchen-indicator', 'bathroom-indicator', 'basement-indicator'
    ],
    priceRange: { low: 5000, median: 15000, high: 35000, unit: 'total' },
    tradeMix: { 'flooring': 0.45, 'painter': 0.40, 'carpenter': 0.15 },
  },
  
  // Interior Finish: Drywall + Paint + Trim (new construction finish work)
  // Requires drywall AND texture (distinguishes from simple paint job)
  {
    classification: 'interior-finish',
    displayName: 'Interior Finish',
    required: ['drywall', 'texture'], // Both required - real finish work
    expected: ['trade-painting', 'trim'],
    optional: ['doors', 'flooring-service-indicator', 'lighting', 'debris'],
    absent: [
      'cabinet-install', 'counter-install', 'bath-vanity', 'bath-shower', 'plumbing-rough', 
      'roofing', 'foundation', 'demo-full', 'kitchen-indicator', 'bathroom-indicator',
      'basement-indicator', 'garage-indicator'  // Use basement-refinishing/garage-conversion instead
    ],
    priceRange: { low: 4000, median: 12000, high: 30000, unit: 'total' },
    tradeMix: { 'drywall': 0.40, 'painter': 0.40, 'carpenter': 0.20 },
  },
  
  // Addition with Bath: Room addition that includes bathroom
  // Must have foundation work AND framing AND rough plumbing (not just fixtures)
  {
    classification: 'addition-with-bath',
    displayName: 'Addition with Bathroom',
    required: ['framing', 'foundation', 'plumbing-rough'], // All 3 required - real addition with new plumbing
    expected: ['bathroom-indicator', 'electrical-rough', 'permits'],
    optional: [
      'bath-vanity', 'bath-shower', 'bath-toilet', 'drywall', 'roofing',
      'hvac-extend', 'insulation', 'windows-replace', 'doors'
    ],
    absent: ['kitchen-indicator', 'bath-tub'], // Has bath not kitchen (that would be ADU), no tub reglaze work
    priceRange: { low: 80000, median: 150000, high: 300000, unit: 'total' },
    tradeMix: { 
      'general': 0.20, 'carpenter': 0.25, 'plumber': 0.15, 
      'electrician': 0.15, 'concrete': 0.10, 'roofer': 0.08, 'painter': 0.07 
    },
  },
];

// ============================================================================
// All Fingerprints Combined
// ============================================================================

export const ALL_FINGERPRINTS: ProjectFingerprint[] = [
  ...KITCHEN_FINGERPRINTS,
  ...BATHROOM_FINGERPRINTS,
  ...BASEMENT_FINGERPRINTS,
  ...FLOORING_FINGERPRINTS,
  ...ROOFING_FINGERPRINTS,
  ...WINDOW_FINGERPRINTS,
  ...PAINTING_FINGERPRINTS,
  ...HVAC_FINGERPRINTS,
  ...ELECTRICAL_FINGERPRINTS,
  ...PLUMBING_FINGERPRINTS,
  ...HANDYMAN_FINGERPRINTS,
  ...ADU_FINGERPRINTS,
  ...DECK_FINGERPRINTS,
  ...FENCE_FINGERPRINTS,
  ...MULTI_TRADE_FINGERPRINTS, // Check multi-trade LAST (only wins when required indicators present)
];

// ============================================================================
// Fingerprint Matching Engine
// ============================================================================

/**
 * Extract scope groups from bid text
 */
export function extractScopeGroups(bidText: string): string[] {
  const found: string[] = [];
  
  for (const [groupId, group] of Object.entries(SCOPE_GROUPS)) {
    // Check contextExclusions first - if any exclusion pattern matches, skip this scope
    const groupWithExclusions = group as { keywords: RegExp[]; contextExclusions?: RegExp[] };
    if (groupWithExclusions.contextExclusions) {
      const excluded = groupWithExclusions.contextExclusions.some(pattern => pattern.test(bidText));
      if (excluded) continue;
    }
    
    for (const pattern of group.keywords) {
      if (pattern.test(bidText)) {
        found.push(groupId);
        break;
      }
    }
  }
  
  return found;
}

/**
 * Detect room context from bid text for disambiguation
 * Returns priority room type or null
 */
function detectRoomContext(bidText: string): 'kitchen' | 'bathroom' | 'basement' | null {
  const text = bidText.toLowerCase();
  
  // Count room mentions
  const kitchenScore = (text.match(/kitchen/g) || []).length * 2 +
    (text.match(/cabinet/g) || []).length +
    (text.match(/countertop/g) || []).length +
    (text.match(/appliance/g) || []).length;
    
  const bathroomScore = (text.match(/bath(room)?/g) || []).length * 2 +
    (text.match(/vanity/g) || []).length +
    (text.match(/toilet/g) || []).length +
    (text.match(/shower/g) || []).length +
    (text.match(/tub/g) || []).length;
    
  const basementScore = (text.match(/basement/g) || []).length * 3 +
    (text.match(/egress/g) || []).length +
    (text.match(/unfinished/g) || []).length;
  
  // Threshold: need at least 2 mentions to establish room context
  const maxScore = Math.max(kitchenScore, bathroomScore, basementScore);
  if (maxScore < 2) return null;
  
  if (kitchenScore === maxScore) return 'kitchen';
  if (bathroomScore === maxScore) return 'bathroom';
  if (basementScore === maxScore) return 'basement';
  return null;
}

// LOCK-IN THRESHOLD: If a trade hits this confidence level based on technical keywords alone,
// room context adjustments are skipped. This prevents "LVP flooring in the bathroom" from
// being classified as a bathroom remodel when it's clearly a flooring job.
// Lowered from 78 to 72 to allow service jobs with strong indicators to lock in earlier
const LOCK_IN_THRESHOLD = 72;

// Phase 2 GC Logic: Single-Trade Detection
// Maps scope group prefixes to service classifications
const TRADE_SCOPE_PREFIXES: Record<string, string[]> = {
  'electrical': ['electrical-rough', 'electrical-panel', 'electrical-outlet', 'electrical-lighting', 'electrical-service-upgrade', 'electrical-service-indicator'],
  'plumbing': ['plumbing-rough', 'plumbing-fixture', 'plumbing-water-heater', 'plumbing-service-indicator', 'plumbing-connect', 'plumbing-new-stack'],
  'hvac': ['hvac-unit', 'hvac-extend', 'hvac-duct'],
  'flooring': ['flooring-hardwood', 'flooring-lvp', 'flooring-carpet', 'flooring-service-indicator', 'tile-floor'],
  'painting': ['paint-walls', 'paint-ext', 'paint-trim', 'cabinet-paint'],
};

const TRADE_TO_SERVICE_CLASSIFICATION: Record<string, string> = {
  'electrical': 'electrical-service',
  'plumbing': 'plumbing-service',
  'hvac': 'hvac-service',
  'flooring': 'flooring-install',
  'painting': 'painting-interior',
};

/**
 * Detect which trades are present in scope groups
 * Returns the single trade if only one is present, null otherwise
 */
function detectSingleTrade(extractedSet: Set<string>): string | null {
  const detectedTrades: string[] = [];
  
  for (const [trade, prefixes] of Object.entries(TRADE_SCOPE_PREFIXES)) {
    const hasTradeScope = prefixes.some(prefix => extractedSet.has(prefix));
    if (hasTradeScope) {
      detectedTrades.push(trade);
    }
  }
  
  // Only return if exactly one trade is detected
  return detectedTrades.length === 1 ? detectedTrades[0] : null;
}

/**
 * Match bid against all fingerprints, return best match
 */
export function matchFingerprint(bidText: string, projectTypeHint?: string): FingerprintMatchResult {
  const extractedGroups = extractScopeGroups(bidText);
  const extractedSet = new Set(extractedGroups);
  
  // Detect room context for disambiguation (used only if no lock-in)
  const roomContext = detectRoomContext(bidText);
  
  // Phase 2 GC Logic: Detect if this is a single-trade bid
  const singleTrade = detectSingleTrade(extractedSet);
  
  // Filter fingerprints by hint if provided
  let candidates = ALL_FINGERPRINTS;
  if (projectTypeHint) {
    const hint = projectTypeHint.toLowerCase();
    if (hint.includes('kitchen')) {
      candidates = KITCHEN_FINGERPRINTS;
    } else if (hint.includes('bath')) {
      candidates = BATHROOM_FINGERPRINTS;
    } else if (hint.includes('basement')) {
      candidates = BASEMENT_FINGERPRINTS;
    } else if (hint.includes('floor')) {
      candidates = FLOORING_FINGERPRINTS;
    } else if (hint.includes('roof')) {
      candidates = ROOFING_FINGERPRINTS;
    } else if (hint.includes('window')) {
      candidates = WINDOW_FINGERPRINTS;
    } else if (hint.includes('paint')) {
      candidates = PAINTING_FINGERPRINTS;
    } else if (hint.includes('hvac') || hint.includes('heat') || hint.includes('cool')) {
      candidates = HVAC_FINGERPRINTS;
    } else if (hint.includes('adu') || hint.includes('garage') || hint.includes('addition')) {
      candidates = ADU_FINGERPRINTS;
    } else if (hint.includes('deck')) {
      candidates = DECK_FINGERPRINTS;
    }
  }
  
  // PHASE 1: Score all fingerprints WITHOUT room context adjustments
  const rawScores: Array<{ fp: ProjectFingerprint; result: FingerprintMatchResult }> = [];
  let bestRawScore = -1;
  let bestRawMatch: FingerprintMatchResult | null = null;
  
  for (const fp of candidates) {
    const result = scoreFingerprint(fp, extractedSet);
    rawScores.push({ fp, result });
    
    if (result.confidence > bestRawScore) {
      bestRawScore = result.confidence;
      bestRawMatch = result;
    }
  }
  
  // LOCK-IN CHECK: If best raw score >= 85%, skip room context adjustments entirely
  // This prevents specialist trades (flooring, painting, plumbing) from being
  // misclassified due to casual room mentions like "bathroom floor"
  if (bestRawScore >= LOCK_IN_THRESHOLD && bestRawMatch) {
    // Fallback check
    if (bestRawScore < 20) {
      return createUnknownResult();
    }
    return bestRawMatch;
  }
  
  // PHASE 2: No lock-in, apply room context adjustments AND single-trade rule
  let bestMatch: FingerprintMatchResult | null = null;
  let bestScore = -1;
  
  for (const { fp, result } of rawScores) {
    let adjustedConfidence = result.confidence;
    const classification = fp.classification;
    
    // SINGLE-TRADE RULE: If only one trade detected, strongly prefer service classification
    // This prevents "electrical work in kitchen" from becoming "kitchen-major"
    if (singleTrade) {
      const expectedServiceClass = TRADE_TO_SERVICE_CLASSIFICATION[singleTrade];
      if (expectedServiceClass && classification === expectedServiceClass) {
        // Boost the matching service classification
        adjustedConfidence += 25;
      } else if (classification.includes('-minor') || classification.includes('-major') || 
                 classification.includes('-upscale') || classification.includes('-remodel') ||
                 classification.includes('-refinishing')) {
        // Penalize remodel classifications when only one trade is present
        adjustedConfidence -= 30;
      }
    }
    
    // If we detected a room context, boost matching room fingerprints and penalize generic trades
    // (Only apply if NOT a single-trade bid, since single-trade takes precedence)
    if (!singleTrade) {
      if (roomContext === 'kitchen' && classification.startsWith('kitchen-')) {
        adjustedConfidence += 15; // Boost kitchen fingerprints
      } else if (roomContext === 'bathroom' && classification.startsWith('bathroom-')) {
        adjustedConfidence += 15; // Boost bathroom fingerprints
      } else if (roomContext === 'basement' && classification.startsWith('basement-')) {
        adjustedConfidence += 15; // Boost basement fingerprints
      } else if (roomContext && (classification === 'flooring-install' || classification === 'flooring-refinish')) {
        // Penalize flooring ONLY if flooring-service-indicator wasn't detected
        // This prevents "tile in kitchen" from being mis-categorized when it's clearly a flooring job
        if (!extractedSet.has('flooring-service-indicator')) {
          adjustedConfidence -= 20;
        }
      } else if (roomContext && classification.startsWith('painting-')) {
        // Penalize painting fingerprints when a room context is established
        adjustedConfidence -= 15;
      }
    }
    
    if (adjustedConfidence > bestScore) {
      bestScore = adjustedConfidence;
      // Store the adjusted confidence in the result
      bestMatch = { ...result, confidence: Math.max(0, Math.min(100, adjustedConfidence)) };
    }
  }
  
  // Fallback to unknown if no good match
  if (!bestMatch || bestScore < 20) {
    return createUnknownResult();
  }
  
  return bestMatch;
}

/** Helper to create unknown result */
function createUnknownResult(): FingerprintMatchResult {
  return {
    classification: 'unknown',
    displayName: 'Unknown Project Type',
    confidence: 0,
    matchedRequired: [],
    missingRequired: [],
    matchedExpected: [],
    missingExpected: [],
    contradictions: [],
    scopeGaps: [],
    priceRange: { low: 0, median: 0, high: 0, unit: 'total' },
    tradeMix: {},
  };
}

/**
 * Score a single fingerprint against extracted scope groups
 * Exported for debugging/testing purposes
 */
export function scoreFingerprint(fp: ProjectFingerprint, extractedSet: Set<string>): FingerprintMatchResult {
  const matchedRequired: string[] = [];
  const missingRequired: string[] = [];
  const matchedExpected: string[] = [];
  const missingExpected: string[] = [];
  const contradictions: string[] = [];
  
  // Check required items
  for (const item of fp.required) {
    if (extractedSet.has(item)) {
      matchedRequired.push(item);
    } else {
      missingRequired.push(item);
    }
  }
  
  // Check expected items
  for (const item of fp.expected) {
    if (extractedSet.has(item)) {
      matchedExpected.push(item);
    } else {
      missingExpected.push(item);
    }
  }
  
  // Check contradictions (Approach D)
  for (const item of fp.absent) {
    if (extractedSet.has(item)) {
      contradictions.push(item);
    }
  }
  
  // CRITICAL: Some contradictions are disqualifying
  // Indicators (-indicator suffix) and major scope items should disqualify fingerprints
  const DISQUALIFYING_SCOPE_ITEMS = [
    'bath-vanity', 'bath-shower', 'bath-tub', 'cabinet-install', 'counter-install',
    'hvac-unit', 'roof-shingle', 'deck-boards', 'flooring-hardwood', 'flooring-lvp',
    'electrical-rough', 'plumbing-rough', 'framing', 'foundation', 'plumbing-connect',
    'electrical-panel'
  ];
  const indicatorContradictions = contradictions.filter(c => c.endsWith('-indicator'));
  const scopeContradictions = contradictions.filter(c => DISQUALIFYING_SCOPE_ITEMS.includes(c));
  if (indicatorContradictions.length > 0 || scopeContradictions.length > 0) {
    // Return early with very low confidence - indicator contradictions are disqualifying
    return {
      classification: fp.classification,
      displayName: fp.displayName,
      confidence: 5, // Nearly disqualified
      matchedRequired,
      missingRequired,
      matchedExpected,
      missingExpected,
      contradictions,
      scopeGaps: [],
      priceRange: fp.priceRange,
      tradeMix: fp.tradeMix,
    };
  }
  
  // Calculate confidence score - FIX 3: Adjusted scoring to be less harsh
  let confidence = 0;
  
  // Base confidence for any match attempt (helps with sparse bids)
  confidence += 15;
  
  // Required items are most important (45 points max)
  if (fp.required.length > 0) {
    confidence += (matchedRequired.length / fp.required.length) * 45;
  } else {
    // No required items = more flexible fingerprint, give baseline
    confidence += 30;
  }
  
  // Expected items contribute (25 points max)
  if (fp.expected.length > 0) {
    confidence += (matchedExpected.length / fp.expected.length) * 25;
  } else {
    confidence += 12;
  }
  
  // Contradictions penalize (up to -35 points) - reduced from -40
  const contradictionPenalty = contradictions.length * 12;
  confidence -= Math.min(contradictionPenalty, 35);
  
  // Missing required items handling - different rules for multi-trade vs single-trade
  const multiTradeClassifications = [
    'whole-home-remodel', 'partial-home-remodel', 'interior-refresh', 
    'interior-update', 'interior-finish', 'addition-with-bath'
  ];
  
  if (fp.required.length > 0 && missingRequired.length > 0) {
    if (multiTradeClassifications.includes(fp.classification)) {
      // Multi-trade fingerprints: ALL required must match or disqualified
      confidence = Math.min(confidence, 10);
    } else if (matchedRequired.length === 0) {
      // Single-trade: Missing ALL required = heavy penalty
      confidence -= 25;
    } else if (missingRequired.length > matchedRequired.length) {
      // Single-trade: Missing MORE than matched = moderate penalty
      const missingRequiredPenalty = missingRequired.length * 8;
      confidence -= Math.min(missingRequiredPenalty, 20);
    }
  }
  
  // Bonus for matching optional items (up to +15) - increased from +10
  const matchedOptional = fp.optional.filter(item => extractedSet.has(item));
  confidence += Math.min(matchedOptional.length * 4, 15);
  
  confidence = Math.max(0, Math.min(100, confidence));
  
  // Build scope gaps list
  const scopeGaps = [
    ...missingRequired.map(id => SCOPE_GROUPS[id]?.name || id),
    ...missingExpected.filter(id => fp.expected.indexOf(id) < 3).map(id => SCOPE_GROUPS[id]?.name || id), // Top 3 expected only
  ];
  
  return {
    classification: fp.classification,
    displayName: fp.displayName,
    confidence,
    matchedRequired,
    missingRequired,
    matchedExpected,
    missingExpected,
    contradictions,
    scopeGaps,
    priceRange: fp.priceRange,
    tradeMix: fp.tradeMix,
  };
}

/**
 * Get human-readable names for scope group IDs
 */
export function getScopeGroupName(groupId: string): string {
  return SCOPE_GROUPS[groupId]?.name || groupId;
}

/**
 * Analyze bid and return classification with details
 */
export function classifyProject(bidText: string, projectTypeHint?: string): {
  classification: ProjectClassification;
  displayName: string;
  confidence: number;
  scopeGroups: string[];
  scopeGaps: string[];
  contradictions: string[];
  priceRange: ProjectFingerprint['priceRange'];
  tradeMix: ProjectFingerprint['tradeMix'];
} {
  const result = matchFingerprint(bidText, projectTypeHint);
  const scopeGroups = extractScopeGroups(bidText);
  
  return {
    classification: result.classification,
    displayName: result.displayName,
    confidence: result.confidence,
    scopeGroups,
    scopeGaps: result.scopeGaps,
    contradictions: result.contradictions.map(id => SCOPE_GROUPS[id]?.name || id),
    priceRange: result.priceRange,
    tradeMix: result.tradeMix,
  };
}

// ============================================================================
// TIER MISMATCH DETECTION ("Buying the Job" / "Lipstick on a Pig")
// ============================================================================

// Premium/Luxury keywords that suggest high-end work
const PREMIUM_KEYWORDS: { pattern: RegExp; weight: number; label: string }[] = [
  // Materials
  { pattern: /\bcustom\s*(cabinet|millwork|built[\s-]?in)/i, weight: 3, label: 'custom cabinetry' },
  { pattern: /\bsub[\s-]?zero\b/i, weight: 3, label: 'Sub-Zero' },
  { pattern: /\bwolf\s*(range|oven|cooktop)/i, weight: 3, label: 'Wolf appliances' },
  { pattern: /\bviking\s*(range|oven|appliance)/i, weight: 3, label: 'Viking appliances' },
  { pattern: /\bthermador\b/i, weight: 3, label: 'Thermador' },
  { pattern: /\bmiele\b/i, weight: 3, label: 'Miele' },
  { pattern: /\bluxury\b/i, weight: 2, label: 'luxury' },
  { pattern: /\bhigh[\s-]?end\b/i, weight: 2, label: 'high-end' },
  { pattern: /\bpremium\s*(grade|quality|finish)/i, weight: 2, label: 'premium grade' },
  { pattern: /\bquartzite\b/i, weight: 2, label: 'quartzite' },
  { pattern: /\bmarble\s*(counter|slab|floor)/i, weight: 2, label: 'marble' },
  { pattern: /\bhand[\s-]?crafted\b/i, weight: 2, label: 'hand-crafted' },
  { pattern: /\bbespoke\b/i, weight: 2, label: 'bespoke' },
  { pattern: /\bcommercial[\s-]?grade\b/i, weight: 2, label: 'commercial-grade' },
  { pattern: /\bpro[\s-]?style\b/i, weight: 2, label: 'pro-style' },
  // Fixtures
  { pattern: /\bkohler\s*(artifacts|purist|veil)/i, weight: 2, label: 'Kohler premium' },
  { pattern: /\bwaterworks\b/i, weight: 3, label: 'Waterworks' },
  { pattern: /\brohl\b/i, weight: 2, label: 'Rohl' },
  { pattern: /\bdornbracht\b/i, weight: 3, label: 'Dornbracht' },
  // Design features
  { pattern: /\bsteam\s*shower\b/i, weight: 2, label: 'steam shower' },
  { pattern: /\bheated\s*(floor|tile)/i, weight: 1, label: 'heated floors' },
  { pattern: /\bsmart\s*home\s*integration/i, weight: 2, label: 'smart home' },
];

// Builder/Standard keywords that suggest basic work
const BUILDER_KEYWORDS: { pattern: RegExp; weight: number; label: string }[] = [
  { pattern: /\bbuilder[\s-]?grade\b/i, weight: 2, label: 'builder-grade' },
  { pattern: /\bstock\s*(cabinet|door)/i, weight: 1, label: 'stock' },
  { pattern: /\bbasic\s*(finish|grade|model)/i, weight: 1, label: 'basic' },
  { pattern: /\beconomy\b/i, weight: 2, label: 'economy' },
  { pattern: /\bbudget[\s-]?friendly\b/i, weight: 2, label: 'budget-friendly' },
  { pattern: /\blaminate\s*counter/i, weight: 1, label: 'laminate counters' },
  { pattern: /\bformica\b/i, weight: 1, label: 'Formica' },
  { pattern: /\bfiberglass\s*(tub|shower)/i, weight: 1, label: 'fiberglass' },
];

// Price tier thresholds by project type (national averages - will be multiplied by regional)
const PRICE_TIER_THRESHOLDS: Record<string, Record<PriceTier, { low: number; high: number }>> = {
  'kitchen': {
    budget: { low: 0, high: 15000 },
    builder: { low: 15000, high: 35000 },
    standard: { low: 35000, high: 75000 },
    premium: { low: 75000, high: 150000 },
    luxury: { low: 150000, high: Infinity },
  },
  'bathroom': {
    budget: { low: 0, high: 8000 },
    builder: { low: 8000, high: 18000 },
    standard: { low: 18000, high: 40000 },
    premium: { low: 40000, high: 80000 },
    luxury: { low: 80000, high: Infinity },
  },
  'basement': {
    budget: { low: 0, high: 20000 },
    builder: { low: 20000, high: 40000 },
    standard: { low: 40000, high: 70000 },
    premium: { low: 70000, high: 120000 },
    luxury: { low: 120000, high: Infinity },
  },
  'general': {
    budget: { low: 0, high: 10000 },
    builder: { low: 10000, high: 30000 },
    standard: { low: 30000, high: 60000 },
    premium: { low: 60000, high: 120000 },
    luxury: { low: 120000, high: Infinity },
  },
};

/**
 * Detect tier mismatch between keywords and price ("Buying the Job")
 * Returns a critical flag if premium keywords are found with builder-grade pricing
 */
export function detectTierMismatch(
  bidText: string,
  bidTotal: number,
  projectType: string = 'general',
  regionalMultiplier: number = 1.0
): TierMismatchResult {
  // Find premium keywords
  const premiumFound: { label: string; weight: number }[] = [];
  let premiumScore = 0;
  
  for (const { pattern, weight, label } of PREMIUM_KEYWORDS) {
    if (pattern.test(bidText)) {
      premiumFound.push({ label, weight });
      premiumScore += weight;
    }
  }
  
  // Find builder keywords
  const builderFound: { label: string; weight: number }[] = [];
  let builderScore = 0;
  
  for (const { pattern, weight, label } of BUILDER_KEYWORDS) {
    if (pattern.test(bidText)) {
      builderFound.push({ label, weight });
      builderScore += weight;
    }
  }
  
  // Determine keyword tier
  let keywordTier: KeywordTier = 'standard';
  if (premiumScore >= 5) {
    keywordTier = 'luxury';
  } else if (premiumScore >= 3) {
    keywordTier = 'premium';
  } else if (builderScore >= 2) {
    keywordTier = 'builder';
  } else if (builderScore >= 1) {
    keywordTier = 'cosmetic';
  }
  
  // Get price tier thresholds for project type
  const normalizedType = projectType.toLowerCase().includes('kitchen') ? 'kitchen' :
                         projectType.toLowerCase().includes('bath') ? 'bathroom' :
                         projectType.toLowerCase().includes('basement') ? 'basement' : 'general';
  
  const thresholds = PRICE_TIER_THRESHOLDS[normalizedType] || PRICE_TIER_THRESHOLDS['general'];
  
  // Apply regional multiplier to thresholds
  const adjustedThresholds: Record<PriceTier, { low: number; high: number }> = {} as Record<PriceTier, { low: number; high: number }>;
  for (const [tier, range] of Object.entries(thresholds)) {
    adjustedThresholds[tier as PriceTier] = {
      low: range.low * regionalMultiplier,
      high: range.high === Infinity ? Infinity : range.high * regionalMultiplier,
    };
  }
  
  // Determine price tier
  let priceTier: PriceTier = 'standard';
  if (bidTotal < adjustedThresholds.builder.low) {
    priceTier = 'budget';
  } else if (bidTotal < adjustedThresholds.standard.low) {
    priceTier = 'builder';
  } else if (bidTotal < adjustedThresholds.premium.low) {
    priceTier = 'standard';
  } else if (bidTotal < adjustedThresholds.luxury.low) {
    priceTier = 'premium';
  } else {
    priceTier = 'luxury';
  }
  
  // Detect mismatch: Premium/Luxury keywords with Budget/Builder pricing
  const keywordTierIndex = ['cosmetic', 'builder', 'standard', 'premium', 'luxury'].indexOf(keywordTier);
  const priceTierIndex = ['budget', 'builder', 'standard', 'premium', 'luxury'].indexOf(priceTier);
  
  // Mismatch if keywords are 2+ tiers above price
  const tierGap = keywordTierIndex - priceTierIndex;
  const isMismatch = tierGap >= 2 && premiumScore >= 3;
  
  let flag: AnalysisFlag | null = null;
  
  if (isMismatch) {
    const keywordsDisplay = premiumFound.slice(0, 3).map(k => k.label).join(', ');
    const expectedRange = adjustedThresholds[keywordTier === 'luxury' ? 'luxury' : 'premium'];
    
    flag = {
      id: 'tier-mismatch-buying-job',
      title: 'Suspicious Promise',
      description: `This bid uses premium language (${keywordsDisplay}) but is priced at ${priceTier}-grade levels ($${bidTotal.toLocaleString()}). Premium work typically costs $${expectedRange.low.toLocaleString()}+ for this project type.`,
      level: 'critical',
      category: 'scope',
      recommendation: 'This is a common "bait and switch" tactic. Demand a Schedule of Values with specific brand names, model numbers, and material grades. Get written confirmation of exactly what materials will be installed.',
      whyItMatters: 'Contractors who promise premium results at budget prices often deliver builder-grade materials, use substandard installation methods, or hit you with change orders once work begins.',
    };
  }
  
  return {
    keywordTier,
    priceTier,
    isMismatch,
    flag,
    keywordsFound: premiumFound.map(k => k.label),
    expectedPriceRange: adjustedThresholds[keywordTier === 'luxury' ? 'luxury' : keywordTier === 'premium' ? 'premium' : 'standard'],
  };
}

// ============================================================================
// SCOPE GAP COST ESTIMATES ("Likely Change Orders")
// ============================================================================

// National average costs for common scope gaps (will be multiplied by regional)
const SCOPE_GAP_COSTS: Record<string, { low: number; high: number; likelihood: 'high' | 'medium' | 'low'; warning: string }> = {
  // Structural & Major
  'demo-full': { low: 2000, high: 6000, likelihood: 'high', warning: 'Full demo typically required for gut renovations' },
  'demo-partial': { low: 800, high: 2500, likelihood: 'medium', warning: 'Some demo work may be needed' },
  'structural-wall': { low: 3000, high: 12000, likelihood: 'high', warning: 'Structural work requires engineering and permits' },
  'framing': { low: 2000, high: 8000, likelihood: 'high', warning: 'New walls or layout changes need framing' },
  
  // Electrical
  'electrical-rough': { low: 3000, high: 8000, likelihood: 'high', warning: 'Electrical rough-in is essential for layout changes' },
  'electrical-panel': { low: 1500, high: 4000, likelihood: 'medium', warning: 'Panel upgrades often needed for major renovations' },
  'electrical-outlet': { low: 150, high: 400, likelihood: 'low', warning: 'Per outlet addition' },
  'electrical-lighting': { low: 500, high: 2000, likelihood: 'medium', warning: 'New lighting requires wiring' },
  
  // Plumbing
  'plumbing-rough': { low: 2500, high: 7000, likelihood: 'high', warning: 'Moving fixtures requires rough-in work' },
  'plumbing-fixture': { low: 500, high: 2000, likelihood: 'medium', warning: 'Fixture installation labor' },
  'plumbing-connect': { low: 300, high: 800, likelihood: 'low', warning: 'Hookup and connection work' },
  
  // Drywall & Finish
  'drywall': { low: 2500, high: 6000, likelihood: 'high', warning: 'Walls need closing after rough-in work' },
  'paint-walls': { low: 1500, high: 4000, likelihood: 'medium', warning: 'Painting typically follows drywall work' },
  'paint-trim': { low: 800, high: 2000, likelihood: 'low', warning: 'Trim painting for finished look' },
  
  // Flooring
  'tile-floor': { low: 2000, high: 6000, likelihood: 'high', warning: 'Floor tile installation is labor intensive' },
  'tile-wall': { low: 1500, high: 5000, likelihood: 'high', warning: 'Wall tile for wet areas' },
  'tile-waterproof': { low: 800, high: 2000, likelihood: 'high', warning: 'Critical for preventing water damage' },
  'flooring-hardwood': { low: 3000, high: 8000, likelihood: 'medium', warning: 'Hardwood installation and finishing' },
  'flooring-lvp': { low: 1500, high: 4000, likelihood: 'low', warning: 'LVP is efficient to install' },
  
  // HVAC
  'hvac-duct': { low: 2000, high: 6000, likelihood: 'high', warning: 'Ductwork needed for climate control' },
  'hvac-extend': { low: 1000, high: 3000, likelihood: 'medium', warning: 'Extending HVAC to new spaces' },
  
  // Permits & Admin
  'permits': { low: 500, high: 2500, likelihood: 'high', warning: 'Permit fees and inspection costs' },
  'debris': { low: 500, high: 1500, likelihood: 'medium', warning: 'Debris removal and dumpster rental' },
  
  // Kitchen Specific
  'cabinet-install': { low: 2000, high: 8000, likelihood: 'high', warning: 'Cabinet installation labor' },
  'counter-install': { low: 1000, high: 3000, likelihood: 'medium', warning: 'Countertop templating and installation' },
  'counter-stone': { low: 3000, high: 10000, likelihood: 'high', warning: 'Stone countertops material and install' },
  'appliance-standard': { low: 3000, high: 10000, likelihood: 'medium', warning: 'Standard appliance package' },
  
  // Bathroom Specific
  'bath-vanity': { low: 800, high: 3000, likelihood: 'medium', warning: 'Vanity and installation' },
  'bath-shower': { low: 2000, high: 6000, likelihood: 'high', warning: 'Shower installation is complex' },
  'bath-tub': { low: 1500, high: 5000, likelihood: 'medium', warning: 'Tub selection and installation' },
  
  // Basement Specific
  'basement-insulation': { low: 2000, high: 5000, likelihood: 'high', warning: 'Required for conditioned space' },
  'basement-egress': { low: 3000, high: 8000, likelihood: 'high', warning: 'Required by code for bedrooms' },
  'basement-moisture': { low: 1500, high: 4000, likelihood: 'high', warning: 'Moisture control is critical' },
};

/**
 * Calculate scope gap costs with regional adjustment
 * Returns estimated change order costs for missing scope items
 */
export function calculateScopeGapCosts(
  missingRequired: string[],
  missingExpected: string[],
  _projectType: string,
  regionalMultiplier: number = 1.0
): { 
  scopeGaps: ScopeGapWithCost[];
  totalLow: number;
  totalHigh: number;
  changeOrderRisk: 'high' | 'medium' | 'low';
} {
  const scopeGaps: ScopeGapWithCost[] = [];
  let totalLow = 0;
  let totalHigh = 0;
  let highLikelihoodCount = 0;
  
  // Process required items (higher confidence of being needed)
  for (const scopeId of missingRequired) {
    const costData = SCOPE_GAP_COSTS[scopeId];
    if (costData) {
      const adjustedLow = Math.round(costData.low * regionalMultiplier);
      const adjustedHigh = Math.round(costData.high * regionalMultiplier);
      
      scopeGaps.push({
        scopeId,
        displayName: SCOPE_GROUPS[scopeId]?.name || scopeId,
        typicalCost: { low: adjustedLow, high: adjustedHigh },
        changeOrderLikelihood: costData.likelihood,
        warningText: costData.warning,
      });
      
      totalLow += adjustedLow;
      totalHigh += adjustedHigh;
      
      if (costData.likelihood === 'high') highLikelihoodCount++;
    }
  }
  
  // Process expected items (may or may not be needed)
  for (const scopeId of missingExpected) {
    // Skip if already in required
    if (missingRequired.includes(scopeId)) continue;
    
    const costData = SCOPE_GAP_COSTS[scopeId];
    if (costData) {
      const adjustedLow = Math.round(costData.low * regionalMultiplier);
      const adjustedHigh = Math.round(costData.high * regionalMultiplier);
      
      // Only add medium/high likelihood expected items
      if (costData.likelihood !== 'low') {
        scopeGaps.push({
          scopeId,
          displayName: SCOPE_GROUPS[scopeId]?.name || scopeId,
          typicalCost: { low: adjustedLow, high: adjustedHigh },
          changeOrderLikelihood: costData.likelihood,
          warningText: costData.warning,
        });
        
        // Add to total but at reduced rate since they're "expected" not "required"
        totalLow += Math.round(adjustedLow * 0.5);
        totalHigh += Math.round(adjustedHigh * 0.7);
        
        if (costData.likelihood === 'high') highLikelihoodCount++;
      }
    }
  }
  
  // Determine overall change order risk
  let changeOrderRisk: 'high' | 'medium' | 'low' = 'low';
  if (highLikelihoodCount >= 3 || totalHigh > 15000) {
    changeOrderRisk = 'high';
  } else if (highLikelihoodCount >= 1 || totalHigh > 5000) {
    changeOrderRisk = 'medium';
  }
  
  return {
    scopeGaps,
    totalLow,
    totalHigh,
    changeOrderRisk,
  };
}

// ============================================================================
// PERMIT LIABILITY DETECTION
// ============================================================================

/**
 * Detect if homeowner is pulling permits (liability transfer)
 * Returns a critical flag if homeowner becomes GC of record
 */
export function detectPermitLiability(bidText: string): AnalysisFlag | null {
  const textLower = bidText.toLowerCase();
  
  // Patterns indicating homeowner pulls permits
  const ownerPermitPatterns = [
    /homeowner\s*(to\s*)?(pull|obtain|acquire|get)\s*(the\s*)?permit/i,
    /owner\s*(to\s*)?(pull|obtain|acquire|get)\s*(the\s*)?permit/i,
    /permit(s)?\s*(by|to\s*be\s*pulled\s*by)\s*(the\s*)?(homeowner|owner|customer|client)/i,
    /customer\s*(is\s*)?(responsible\s*for|to\s*pull)\s*permit/i,
    /you\s*(will\s*)?(need\s*to|must)\s*(pull|obtain|get)\s*(your\s*own\s*)?permit/i,
    /permit\s*not\s*included/i,
    /permit(s)?\s*excluded/i,
    /owner[\s-]?pulled\s*permit/i,
  ];
  
  for (const pattern of ownerPermitPatterns) {
    if (pattern.test(textLower)) {
      return {
        id: 'permits-owner-liability',
        title: 'Homeowner Permit = Homeowner Liability',
        description: 'This bid requires YOU to pull the permit. When you pull the permit, you become the General Contractor of record and assume legal liability for worker injuries, code violations, and structural failures.',
        level: 'critical',
        category: 'contract',
        recommendation: 'Negotiate for the contractor to pull permits. If they refuse, understand that you take on significant legal liability. Consult with your homeowner insurance about coverage gaps.',
        whyItMatters: 'Many homeowner insurance policies exclude coverage when the homeowner acts as their own GC. If a worker is injured or work fails inspection, you could be personally liable.',
      };
    }
  }
  
  return null;
}
