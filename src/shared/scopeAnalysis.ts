// Scope Analysis Engine
// Detects what's included in a bid and identifies missing items based on project type

import type { TradeCategory } from './tradeDetection';

// ============================================================================
// Contingency Fund Detection
// ============================================================================

// Project types that should have a contingency fund
const CONTINGENCY_REQUIRED_PROJECTS = [
  'full-remodel', 'gut-renovation', 'kitchen-remodel', 
  'bathroom-remodel', 'basement-finishing', 'addition',
  'general-remodel', 'basement'
];

// Keywords that indicate a contingency is included
const CONTINGENCY_KEYWORDS = [
  /contingency/i, /unforeseen/i, /allowance/i, /reserve/i,
  /unexpected\s*conditions?/i, /change\s*order\s*allowance/i,
  /misc(ellaneous)?\s*allowance/i, /hidden\s*conditions?/i,
  /unknown\s*conditions?/i, /buffer/i, /cushion/i
];

export interface ContingencyCheckResult {
  required: boolean;
  found: boolean;
  flag: {
    id: string;
    severity: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    advice: string;
  } | null;
}

/**
 * Check if a bid includes a contingency fund for major renovations
 */
export function checkContingencyFund(bidText: string, projectType: string, bidTotal?: number): ContingencyCheckResult {
  const normalizedType = normalizeProjectType(projectType, bidText);
  
  // Check if this project type requires contingency
  const requiresContingency = CONTINGENCY_REQUIRED_PROJECTS.some(pt => 
    normalizedType.includes(pt) || pt.includes(normalizedType)
  );
  
  // Also require contingency for projects > $15,000
  const isLargeProject = bidTotal && bidTotal > 15000;
  const required = requiresContingency || isLargeProject;
  
  if (!required) {
    return { required: false, found: false, flag: null };
  }
  
  // Check if contingency is mentioned
  const found = CONTINGENCY_KEYWORDS.some(pattern => pattern.test(bidText));
  
  if (found) {
    return { required: true, found: true, flag: null };
  }
  
  // No contingency found on a project that needs one
  return {
    required: true,
    found: false,
    flag: {
      id: 'no-contingency',
      severity: 'high',
      title: 'No Contingency Fund',
      description: 'Major renovation without 10-20% contingency for unexpected issues.',
      advice: "If your contractor isn't planning for what's behind your walls, you'll pay for it mid-demo. Request a contingency line item or discuss how unforeseen conditions will be handled."
    }
  };
}

// ============================================================================
// Types
// ============================================================================

export type ScopeItemCategory = 'labor' | 'materials' | 'permits' | 'cleanup' | 'protection' | 'warranty' | 'fixtures';
export type ScopeImportance = 'critical' | 'important' | 'nice-to-have';
export type DetectionStatus = 'found' | 'implied' | 'missing';

export interface ScopeItem {
  id: string;
  name: string;
  category: ScopeItemCategory;
  importance: ScopeImportance;
  detectionPatterns: RegExp[];
  impliedPatterns?: RegExp[]; // Patterns that suggest this is implied but not explicit
  questionToAsk: string;
  costImpact?: string; // e.g., "$500-2,000" - what you might pay if not included
}

export interface DetectedScopeItem extends ScopeItem {
  status: DetectionStatus;
  matchedText?: string;
}

export interface ScopeAnalysisResult {
  projectType: string;
  includedItems: DetectedScopeItem[];
  missingItems: DetectedScopeItem[];
  impliedItems: DetectedScopeItem[];
  scopeScore: number; // 0-100
  criticalGaps: string[];
  importantGaps: string[];
  questionsToAsk: string[];
  summary: {
    totalExpected: number;
    totalFound: number;
    totalMissing: number;
    criticalMissing: number;
    importantMissing: number;
  };
}

// ============================================================================
// Expected Scope Database by Project Type
// ============================================================================

const KITCHEN_REMODEL_SCOPE: ScopeItem[] = [
  {
    id: 'kitchen-demo',
    name: 'Demo & Disposal',
    category: 'labor',
    importance: 'critical',
    detectionPatterns: [/demo(lition)?/i, /tear[\s-]?out/i, /remov(e|al|ing)/i, /gut(ting)?/i, /strip(ping)?/i, /disposal/i, /haul[\s-]?away/i, /dump/i, /dumpster/i],
    impliedPatterns: [/full\s+(kitchen\s+)?remodel/i, /complete\s+renovation/i],
    questionToAsk: 'Does your bid include demolition AND disposal of existing cabinets/counters? Disposal fees are often a hidden cost.',
    costImpact: '$800-3,000'
  },
  {
    id: 'kitchen-cabinets',
    name: 'Cabinet Installation',
    category: 'labor',
    importance: 'critical',
    detectionPatterns: [/cabinet/i, /cupboard/i, /base\s+unit/i, /wall\s+unit/i, /pantry/i],
    questionToAsk: 'Are cabinets included in this bid? If so, what brand/quality level?',
    costImpact: '$5,000-25,000'
  },
  {
    id: 'kitchen-counters',
    name: 'Countertop Installation',
    category: 'materials',
    importance: 'critical',
    detectionPatterns: [/counter(top)?/i, /granite/i, /quartz/i, /marble/i, /butcher\s*block/i, /laminate.*top/i, /solid\s*surface/i],
    questionToAsk: 'What countertop material is included? Is templating and fabrication extra?',
    costImpact: '$2,000-8,000'
  },
  {
    id: 'kitchen-plumbing',
    name: 'Plumbing Work',
    category: 'labor',
    importance: 'critical',
    detectionPatterns: [/plumb(ing|er)?/i, /sink\s*(install|hook)/i, /faucet/i, /garbage\s*disposal/i, /water\s*line/i, /drain/i, /p-trap/i],
    impliedPatterns: [/sink/i],
    questionToAsk: 'Is plumbing rough-in and fixture installation included?',
    costImpact: '$500-2,500'
  },
  {
    id: 'kitchen-electrical',
    name: 'Electrical Work',
    category: 'labor',
    importance: 'critical',
    detectionPatterns: [/electric(al|ian)?/i, /outlet/i, /receptacle/i, /gfci/i, /wiring/i, /circuit/i, /switch(es)?/i, /under[\s-]?cabinet\s*light/i],
    impliedPatterns: [/appliance\s*(install|hook)/i],
    questionToAsk: 'Does the bid include electrical work for outlets and appliance circuits?',
    costImpact: '$800-3,000'
  },
  {
    id: 'kitchen-lighting',
    name: 'Lighting Installation',
    category: 'labor',
    importance: 'important',
    detectionPatterns: [/light(ing|s)?/i, /pendant/i, /recessed/i, /can\s*light/i, /under[\s-]?cabinet\s*light/i, /led\s*strip/i],
    questionToAsk: 'What lighting is included? Under-cabinet? Recessed? Pendants?',
    costImpact: '$500-2,000'
  },
  {
    id: 'kitchen-backsplash',
    name: 'Backsplash Installation',
    category: 'materials',
    importance: 'important',
    detectionPatterns: [/backsplash/i, /back\s*splash/i, /tile.*wall/i, /wall\s*tile/i, /subway\s*tile/i],
    questionToAsk: 'Is backsplash tile and installation included?',
    costImpact: '$800-3,000'
  },
  {
    id: 'kitchen-flooring',
    name: 'Flooring',
    category: 'materials',
    importance: 'important',
    detectionPatterns: [/floor(ing)?/i, /tile.*floor/i, /hardwood/i, /lvp/i, /vinyl\s*plank/i, /laminate/i],
    questionToAsk: 'Is new flooring included? What material?',
    costImpact: '$1,500-5,000'
  },
  {
    id: 'kitchen-subfloor',
    name: 'Subfloor Leveling/Prep',
    category: 'labor',
    importance: 'important',
    detectionPatterns: [/subfloor/i, /floor\s*prep/i, /level(ing)?/i, /level\s*floor/i, /self[\s-]?level/i, /floor.*level/i],
    impliedPatterns: [/large[\s-]?format\s*tile/i, /24.*tile/i, /porcelain.*floor/i],
    questionToAsk: 'Is subfloor leveling included if needed? Required for large-format tile installations.',
    costImpact: '$2-6/sqft if needed'
  },
  {
    id: 'kitchen-painting',
    name: 'Painting',
    category: 'labor',
    importance: 'important',
    detectionPatterns: [/paint(ing)?/i, /prime(r|ing)/i, /wall\s*finish/i],
    questionToAsk: 'Is wall painting included? How many coats?',
    costImpact: '$400-1,200'
  },
  {
    id: 'kitchen-appliances',
    name: 'Appliance Installation',
    category: 'labor',
    importance: 'important',
    detectionPatterns: [/appliance/i, /refrigerator/i, /dishwasher/i, /range/i, /stove/i, /oven/i, /microwave/i, /hood/i, /vent/i],
    questionToAsk: 'Is appliance installation included? Are appliances themselves included?',
    costImpact: '$200-800 for installation'
  },
  {
    id: 'kitchen-permits',
    name: 'Permit Fees',
    category: 'permits',
    importance: 'critical', // Kitchen remodels with plumbing/electrical REQUIRE permits
    detectionPatterns: [/permit/i, /inspection/i, /code\s*compliance/i, /building\s*dept/i, /code/i, /compliance/i],
    questionToAsk: 'Are permit fees included? Who pulls them? Kitchen remodels with plumbing/electrical typically require permits.',
    costImpact: '$200-1,000'
  },
  {
    id: 'kitchen-debris',
    name: 'Debris Removal',
    category: 'cleanup',
    importance: 'important', // Downgraded from critical - usually implied, rarely causes major disputes
    detectionPatterns: [/debris/i, /haul[\s-]?away/i, /disposal/i, /dumpster/i, /dump\s*fee/i, /clean[\s-]?up/i, /clean[\s-]?out/i],
    questionToAsk: 'Is debris removal and disposal included? Is there a dumpster fee?',
    costImpact: '$300-800'
  },
  {
    id: 'kitchen-protection',
    name: 'Floor/Surface Protection',
    category: 'protection',
    importance: 'nice-to-have',
    detectionPatterns: [/protect(ion)?/i, /cover(ing)?.*floor/i, /drop\s*cloth/i, /plastic.*cover/i],
    questionToAsk: 'Will you protect existing floors and surfaces during work?',
    costImpact: 'Included in quality work'
  },
  {
    id: 'kitchen-warranty',
    name: 'Warranty',
    category: 'warranty',
    importance: 'important',
    detectionPatterns: [/warrant(y|ied)/i, /guarantee/i, /workmanship/i, /\d+[\s-]?year/i],
    questionToAsk: 'What warranty do you provide on labor and materials?',
    costImpact: 'Peace of mind'
  }
];

const BATHROOM_REMODEL_SCOPE: ScopeItem[] = [
  {
    id: 'bath-demo',
    name: 'Demolition & Removal',
    category: 'labor',
    importance: 'critical',
    detectionPatterns: [/demo(lition)?/i, /tear[\s-]?out/i, /remov(e|al|ing)/i, /gut(ting)?/i],
    impliedPatterns: [/full\s+(bath(room)?\s+)?remodel/i],
    questionToAsk: 'Is demolition of existing fixtures and finishes included?',
    costImpact: '$500-1,500'
  },
  {
    id: 'bath-plumbing-rough',
    name: 'Plumbing Rough-In',
    category: 'labor',
    importance: 'critical',
    detectionPatterns: [/plumb(ing)?.*rough/i, /rough[\s-]?in/i, /relocat(e|ing).*plumb/i, /move.*drain/i, /new.*supply/i],
    impliedPatterns: [/relocat(e|ing)/i, /move.*vanity/i, /move.*toilet/i],
    questionToAsk: 'Is plumbing rough-in included if fixtures are being relocated?',
    costImpact: '$1,000-4,000'
  },
  {
    id: 'bath-plumbing-fixtures',
    name: 'Plumbing Fixture Installation',
    category: 'labor',
    importance: 'critical',
    detectionPatterns: [/toilet/i, /vanity/i, /faucet/i, /shower\s*(head|valve)/i, /tub/i, /bath.*install/i],
    questionToAsk: 'Is installation of all plumbing fixtures included?',
    costImpact: '$400-1,200'
  },
  {
    id: 'bath-tile',
    name: 'Tile Work',
    category: 'materials',
    importance: 'critical',
    detectionPatterns: [/tile/i, /ceramic/i, /porcelain/i, /mosaic/i, /grout/i, /waterproof.*membrane/i, /schluter/i, /kerdi/i],
    questionToAsk: 'Is tile material and installation included? Floor and walls?',
    costImpact: '$2,000-6,000'
  },
  {
    id: 'bath-waterproofing',
    name: 'Waterproofing',
    category: 'materials',
    importance: 'critical',
    detectionPatterns: [/waterproof/i, /moisture\s*barrier/i, /kerdi/i, /schluter/i, /redgard/i, /membrane/i],
    impliedPatterns: [/shower.*tile/i, /tile.*shower/i],
    questionToAsk: 'Is the shower/tub area properly waterproofed? What system?',
    costImpact: '$300-800'
  },
  {
    id: 'bath-vanity',
    name: 'Vanity & Countertop',
    category: 'materials',
    importance: 'critical',
    detectionPatterns: [/vanity/i, /sink\s*cabinet/i, /counter(top)?/i, /marble.*top/i, /quartz.*top/i],
    questionToAsk: 'Is the vanity cabinet and countertop included?',
    costImpact: '$500-3,000'
  },
  {
    id: 'bath-shower-tub',
    name: 'Shower/Tub Installation',
    category: 'fixtures',
    importance: 'critical',
    detectionPatterns: [/shower/i, /tub/i, /bathtub/i, /walk[\s-]?in\s*shower/i, /shower\s*pan/i, /shower\s*door/i, /glass\s*enclosure/i],
    questionToAsk: 'What type of shower/tub is included? Glass door?',
    costImpact: '$1,500-5,000'
  },
  {
    id: 'bath-electrical',
    name: 'Electrical Work',
    category: 'labor',
    importance: 'important',
    detectionPatterns: [/electric(al|ian)?/i, /gfci/i, /outlet/i, /exhaust\s*fan/i, /vent\s*fan/i, /light(ing)?/i],
    questionToAsk: 'Is electrical work included? GFCI outlets? New lighting?',
    costImpact: '$500-1,500'
  },
  {
    id: 'bath-ventilation',
    name: 'Ventilation Fan',
    category: 'fixtures',
    importance: 'important',
    detectionPatterns: [/vent(ilation)?\s*fan/i, /exhaust\s*fan/i, /bath\s*fan/i, /cfm/i],
    questionToAsk: 'Is a ventilation/exhaust fan included? What CFM rating?',
    costImpact: '$200-600'
  },
  {
    id: 'bath-painting',
    name: 'Painting',
    category: 'labor',
    importance: 'important',
    detectionPatterns: [/paint(ing)?/i, /prime(r|ing)/i],
    questionToAsk: 'Is wall and ceiling painting included?',
    costImpact: '$200-600'
  },
  {
    id: 'bath-accessories',
    name: 'Accessories Installation',
    category: 'fixtures',
    importance: 'nice-to-have',
    detectionPatterns: [/accessor(y|ies)/i, /towel\s*(bar|ring|hook)/i, /toilet\s*paper\s*holder/i, /mirror/i, /medicine\s*cabinet/i],
    questionToAsk: 'Are towel bars, hooks, and accessories included?',
    costImpact: '$100-400'
  },
  {
    id: 'bath-permits',
    name: 'Permits',
    category: 'permits',
    importance: 'important', // Downgraded from critical
    detectionPatterns: [/permit/i, /inspection/i, /code/i],
    questionToAsk: 'Are permits and inspections included?',
    costImpact: '$150-500'
  },
  {
    id: 'bath-debris',
    name: 'Debris Removal',
    category: 'cleanup',
    importance: 'important', // Downgraded from critical
    detectionPatterns: [/debris/i, /haul[\s-]?away/i, /disposal/i, /dumpster/i, /clean[\s-]?up/i],
    questionToAsk: 'Is debris removal and disposal included?',
    costImpact: '$200-500'
  },
  {
    id: 'bath-warranty',
    name: 'Warranty',
    category: 'warranty',
    importance: 'important',
    detectionPatterns: [/warrant(y|ied)/i, /guarantee/i],
    questionToAsk: 'What warranty is provided on labor?',
    costImpact: 'Peace of mind'
  }
];

const FLOORING_SCOPE: ScopeItem[] = [
  {
    id: 'floor-removal',
    name: 'Existing Floor Removal',
    category: 'labor',
    importance: 'critical',
    detectionPatterns: [/remov(e|al|ing)/i, /tear[\s-]?out/i, /demo/i, /rip[\s-]?up/i],
    questionToAsk: 'Is removal of existing flooring included?',
    costImpact: '$1-3/sqft'
  },
  {
    id: 'floor-material',
    name: 'Flooring Material',
    category: 'materials',
    importance: 'critical',
    detectionPatterns: [/hardwood/i, /lvp/i, /vinyl\s*plank/i, /laminate/i, /tile/i, /carpet/i, /engineered/i, /bamboo/i],
    questionToAsk: 'What flooring material is included? Brand/quality?',
    costImpact: '$2-15/sqft'
  },
  {
    id: 'floor-underlayment',
    name: 'Underlayment',
    category: 'materials',
    importance: 'important',
    detectionPatterns: [/underlayment/i, /pad(ding)?/i, /moisture\s*barrier/i, /subfloor\s*prep/i, /vapor\s*barrier/i],
    questionToAsk: 'Is underlayment/padding included? What type?',
    costImpact: '$0.50-1.50/sqft'
  },
  {
    id: 'floor-subfloor',
    name: 'Subfloor Repair/Prep',
    category: 'labor',
    importance: 'important',
    detectionPatterns: [/subfloor/i, /level(ing)?/i, /self[\s-]?level/i, /plywood/i, /patch/i, /repair.*floor/i],
    questionToAsk: 'Is subfloor repair or leveling included if needed?',
    costImpact: '$2-6/sqft if needed'
  },
  {
    id: 'floor-transitions',
    name: 'Transitions & Trim',
    category: 'materials',
    importance: 'important',
    detectionPatterns: [/transition/i, /t-mold/i, /reducer/i, /threshold/i, /trim/i, /baseboard/i, /quarter[\s-]?round/i, /shoe\s*mold/i],
    questionToAsk: 'Are transitions between rooms and baseboards/trim included?',
    costImpact: '$200-800'
  },
  {
    id: 'floor-stairs',
    name: 'Stair Installation',
    category: 'labor',
    importance: 'important',
    detectionPatterns: [/stair/i, /step/i, /tread/i, /riser/i, /nosing/i],
    impliedPatterns: [/staircase/i, /stairwell/i],
    questionToAsk: 'Are stairs included? They typically cost extra.',
    costImpact: '$50-150/step'
  },
  {
    id: 'floor-furniture',
    name: 'Furniture Moving',
    category: 'labor',
    importance: 'important',
    detectionPatterns: [/furniture/i, /move.*furniture/i, /appliance.*move/i],
    questionToAsk: 'Is furniture moving included or do you need to clear rooms?',
    costImpact: '$100-300/room'
  },
  {
    id: 'floor-debris',
    name: 'Debris Removal',
    category: 'cleanup',
    importance: 'important', // Downgraded from critical
    detectionPatterns: [/debris/i, /haul[\s-]?away/i, /disposal/i, /dump/i, /clean[\s-]?up/i],
    questionToAsk: 'Is old flooring disposal included?',
    costImpact: '$100-400'
  },
  {
    id: 'floor-acclimate',
    name: 'Material Acclimation',
    category: 'materials',
    importance: 'nice-to-have',
    detectionPatterns: [/acclimate/i, /acclimation/i, /condition/i],
    questionToAsk: 'Will the flooring be acclimated before installation?',
    costImpact: 'Prevents issues'
  },
  {
    id: 'floor-warranty',
    name: 'Installation Warranty',
    category: 'warranty',
    importance: 'important',
    detectionPatterns: [/warrant(y|ied)/i, /guarantee/i],
    questionToAsk: 'What warranty is provided on the installation?',
    costImpact: 'Peace of mind'
  }
];

const WINDOW_SCOPE: ScopeItem[] = [
  {
    id: 'window-removal',
    name: 'Old Window Removal',
    category: 'labor',
    importance: 'critical',
    detectionPatterns: [/remov(e|al|ing)/i, /tear[\s-]?out/i, /existing.*window/i],
    impliedPatterns: [/replac(e|ement)/i, /new\s*window/i],
    questionToAsk: 'Is removal of existing windows included?',
    costImpact: '$50-100/window'
  },
  {
    id: 'window-windows',
    name: 'Windows',
    category: 'materials',
    importance: 'critical',
    detectionPatterns: [/window/i, /double[\s-]?hung/i, /casement/i, /slider/i, /picture\s*window/i, /bay\s*window/i, /bow\s*window/i],
    questionToAsk: 'What brand and type of windows? Energy rating?',
    costImpact: '$300-1,500/window'
  },
  {
    id: 'window-installation',
    name: 'Window Installation',
    category: 'labor',
    importance: 'critical',
    detectionPatterns: [/install/i, /set/i, /mount/i, /pocket/i, /full[\s-]?frame/i, /retrofit/i],
    questionToAsk: 'Is this pocket/insert or full-frame replacement?',
    costImpact: '$100-400/window'
  },
  {
    id: 'window-trim-interior',
    name: 'Interior Trim/Casing',
    category: 'materials',
    importance: 'important',
    detectionPatterns: [/trim/i, /casing/i, /interior.*finish/i, /jamb/i, /sill/i, /apron/i],
    questionToAsk: 'Is interior trim and casing included?',
    costImpact: '$50-150/window'
  },
  {
    id: 'window-trim-exterior',
    name: 'Exterior Trim/Capping',
    category: 'materials',
    importance: 'important',
    detectionPatterns: [/exterior.*trim/i, /cap(ping)?/i, /aluminum.*wrap/i, /brick[\s-]?mold/i, /j[\s-]?channel/i],
    questionToAsk: 'Is exterior trim or aluminum capping included?',
    costImpact: '$50-200/window'
  },
  {
    id: 'window-insulation',
    name: 'Insulation & Sealing',
    category: 'materials',
    importance: 'critical',
    detectionPatterns: [/insul(ate|ation)/i, /foam/i, /seal(ant|ing)?/i, /caulk/i, /weather[\s-]?strip/i, /air[\s-]?seal/i],
    questionToAsk: 'Is proper insulation and air sealing included around windows?',
    costImpact: '$20-50/window'
  },
  {
    id: 'window-flashing',
    name: 'Flashing & Weatherproofing',
    category: 'materials',
    importance: 'important',
    detectionPatterns: [/flash(ing)?/i, /weather[\s-]?proof/i, /drip\s*cap/i, /house\s*wrap/i],
    questionToAsk: 'Is proper flashing installed to prevent water intrusion?',
    costImpact: '$30-75/window'
  },
  {
    id: 'window-screens',
    name: 'Screens',
    category: 'materials',
    importance: 'important',
    detectionPatterns: [/screen/i],
    questionToAsk: 'Are screens included with the windows?',
    costImpact: '$25-75/window'
  },
  {
    id: 'window-permits',
    name: 'Permits',
    category: 'permits',
    importance: 'nice-to-have', // Windows rarely need permits in most jurisdictions
    detectionPatterns: [/permit/i, /inspection/i],
    questionToAsk: 'Are permits required in your area? If so, are they included?',
    costImpact: '$100-300'
  },
  {
    id: 'window-debris',
    name: 'Debris Removal',
    category: 'cleanup',
    importance: 'important', // Downgraded from critical
    detectionPatterns: [/debris/i, /haul[\s-]?away/i, /disposal/i, /clean[\s-]?up/i],
    questionToAsk: 'Is old window disposal included?',
    costImpact: '$50-150'
  },
  {
    id: 'window-warranty',
    name: 'Installation Warranty',
    category: 'warranty',
    importance: 'important',
    detectionPatterns: [/warrant(y|ied)/i, /guarantee/i, /lifetime/i],
    questionToAsk: 'What warranty on installation? What about the windows themselves?',
    costImpact: 'Peace of mind'
  }
];

const ROOFING_SCOPE: ScopeItem[] = [
  {
    id: 'roof-tearoff',
    name: 'Tear-Off / Removal',
    category: 'labor',
    importance: 'critical',
    detectionPatterns: [/tear[\s-]?off/i, /remov(e|al|ing)/i, /strip(ping)?/i, /existing.*roof/i],
    questionToAsk: 'Is tear-off of existing roofing included? Or is this a roof-over?',
    costImpact: '$1-2/sqft'
  },
  {
    id: 'roof-decking',
    name: 'Decking Inspection/Repair',
    category: 'labor',
    importance: 'critical',
    detectionPatterns: [/deck(ing)?/i, /plywood/i, /osb/i, /sheathing/i, /rotted.*wood/i],
    questionToAsk: 'Is decking repair included if rot is found? What per-sheet cost?',
    costImpact: '$75-150/sheet'
  },
  {
    id: 'roof-underlayment',
    name: 'Underlayment',
    category: 'materials',
    importance: 'critical',
    detectionPatterns: [/underlayment/i, /felt/i, /synthetic/i, /ice.*water/i, /ice.*shield/i],
    questionToAsk: 'What type of underlayment? Synthetic or felt? Ice & water shield at eaves?',
    costImpact: '$0.25-0.75/sqft'
  },
  {
    id: 'roof-shingles',
    name: 'Shingles/Roofing Material',
    category: 'materials',
    importance: 'critical',
    detectionPatterns: [/shingle/i, /architectural/i, /dimensional/i, /3[\s-]?tab/i, /metal.*roof/i, /standing\s*seam/i, /tile/i],
    questionToAsk: 'What brand and type of shingles? Architectural or 3-tab?',
    costImpact: '$100-400/square'
  },
  {
    id: 'roof-flashing',
    name: 'Flashing',
    category: 'materials',
    importance: 'critical',
    detectionPatterns: [/flash(ing)?/i, /drip\s*edge/i, /valley/i, /step\s*flash/i, /counter\s*flash/i],
    questionToAsk: 'Is all new flashing included? Valleys, drip edge, step flashing?',
    costImpact: '$200-600'
  },
  {
    id: 'roof-vents',
    name: 'Ventilation',
    category: 'fixtures',
    importance: 'important',
    detectionPatterns: [/vent/i, /ridge\s*vent/i, /soffit/i, /attic\s*vent/i, /turbine/i, /intake/i, /exhaust/i],
    questionToAsk: 'Is roof ventilation adequate? New ridge vent?',
    costImpact: '$300-800'
  },
  {
    id: 'roof-boots',
    name: 'Pipe Boots & Penetrations',
    category: 'materials',
    importance: 'important',
    detectionPatterns: [/boot/i, /pipe\s*(jack|flashing)/i, /penetration/i, /vent\s*pipe/i],
    questionToAsk: 'Are new pipe boots included for all penetrations?',
    costImpact: '$20-50/each'
  },
  {
    id: 'roof-gutters',
    name: 'Gutter Check/Reattach',
    category: 'labor',
    importance: 'nice-to-have',
    detectionPatterns: [/gutter/i, /downspout/i, /re[\s-]?attach/i],
    questionToAsk: 'Will gutters be checked and reattached properly?',
    costImpact: 'Usually included'
  },
  {
    id: 'roof-permits',
    name: 'Permits',
    category: 'permits',
    importance: 'important', // Downgraded - important but not dispute-causing
    detectionPatterns: [/permit/i, /inspection/i, /code/i],
    questionToAsk: 'Are permits and inspections included?',
    costImpact: '$150-500'
  },
  {
    id: 'roof-debris',
    name: 'Debris Removal',
    category: 'cleanup',
    importance: 'important', // Downgraded from critical
    detectionPatterns: [/debris/i, /haul[\s-]?away/i, /dumpster/i, /clean[\s-]?up/i, /magnetic.*sweep/i],
    questionToAsk: 'Is debris removal and nail sweep included?',
    costImpact: '$200-500'
  },
  {
    id: 'roof-warranty',
    name: 'Warranty',
    category: 'warranty',
    importance: 'critical',
    detectionPatterns: [/warrant(y|ied)/i, /guarantee/i, /manufacturer/i, /workmanship/i],
    questionToAsk: 'What warranty? Workmanship AND manufacturer?',
    costImpact: 'Essential protection'
  }
];

const PAINTING_SCOPE: ScopeItem[] = [
  {
    id: 'paint-prep',
    name: 'Surface Preparation',
    category: 'labor',
    importance: 'critical',
    detectionPatterns: [/prep(aration)?/i, /sand(ing)?/i, /scrape/i, /wash/i, /clean.*surface/i, /tsp/i],
    questionToAsk: 'What surface prep is included? Sanding, cleaning, scraping?',
    costImpact: '$0.25-0.75/sqft'
  },
  {
    id: 'paint-repairs',
    name: 'Wall Repairs',
    category: 'labor',
    importance: 'important',
    detectionPatterns: [/repair/i, /patch/i, /spackle/i, /drywall.*repair/i, /hole/i, /crack/i, /caulk/i],
    questionToAsk: 'Are minor wall repairs included? Nail holes, cracks?',
    costImpact: '$50-200'
  },
  {
    id: 'paint-primer',
    name: 'Primer',
    category: 'materials',
    importance: 'important',
    detectionPatterns: [/prime(r|ing)?/i, /seal(er|ing)?/i, /stain[\s-]?block/i],
    questionToAsk: 'Is primer included? Full prime or spot prime?',
    costImpact: '$0.25-0.50/sqft'
  },
  {
    id: 'paint-paint',
    name: 'Paint',
    category: 'materials',
    importance: 'critical',
    detectionPatterns: [/paint/i, /sherwin/i, /benjamin\s*moore/i, /behr/i, /ppg/i, /gallon/i, /semi[\s-]?gloss/i, /satin/i, /eggshell/i, /flat/i, /matte/i],
    questionToAsk: 'What brand and quality of paint? How many coats?',
    costImpact: '$25-75/gallon'
  },
  {
    id: 'paint-coats',
    name: 'Number of Coats',
    category: 'labor',
    importance: 'important',
    detectionPatterns: [/\d+\s*coat/i, /two\s*coat/i, /double\s*coat/i, /single\s*coat/i],
    questionToAsk: 'How many coats of paint are included?',
    costImpact: '2 coats standard'
  },
  {
    id: 'paint-trim',
    name: 'Trim & Baseboards',
    category: 'labor',
    importance: 'important',
    detectionPatterns: [/trim/i, /baseboard/i, /molding/i, /crown/i, /door\s*frame/i, /window\s*frame/i, /casing/i],
    questionToAsk: 'Is trim and baseboard painting included?',
    costImpact: '$1-3/linear ft'
  },
  {
    id: 'paint-doors',
    name: 'Door Painting',
    category: 'labor',
    importance: 'important',
    detectionPatterns: [/door/i, /closet.*door/i, /interior.*door/i],
    questionToAsk: 'Is door painting included? How many doors?',
    costImpact: '$50-150/door'
  },
  {
    id: 'paint-ceiling',
    name: 'Ceiling Painting',
    category: 'labor',
    importance: 'important',
    detectionPatterns: [/ceiling/i],
    questionToAsk: 'Are ceilings included? Same color or white?',
    costImpact: '$1-2/sqft'
  },
  {
    id: 'paint-protection',
    name: 'Floor/Furniture Protection',
    category: 'protection',
    importance: 'important',
    detectionPatterns: [/protect(ion)?/i, /cover(ing)?/i, /drop\s*cloth/i, /plastic/i, /tape/i, /mask/i],
    questionToAsk: 'Is floor and furniture protection included?',
    costImpact: 'Standard practice'
  },
  {
    id: 'paint-cleanup',
    name: 'Cleanup',
    category: 'cleanup',
    importance: 'important',
    detectionPatterns: [/clean[\s-]?up/i, /debris/i, /remove.*tape/i],
    questionToAsk: 'Is cleanup and tape removal included?',
    costImpact: 'Should be included'
  },
  {
    id: 'paint-warranty',
    name: 'Warranty',
    category: 'warranty',
    importance: 'nice-to-have',
    detectionPatterns: [/warrant(y|ied)/i, /guarantee/i, /touch[\s-]?up/i],
    questionToAsk: 'What warranty on the work? Touch-ups included?',
    costImpact: 'Peace of mind'
  }
];

const ELECTRICAL_SCOPE: ScopeItem[] = [
  {
    id: 'elec-outlets',
    name: 'Outlet Installation',
    category: 'labor',
    importance: 'critical',
    detectionPatterns: [/outlet/i, /receptacle/i, /plug/i, /duplex/i],
    questionToAsk: 'How many outlets are included?',
    costImpact: '$75-200/outlet'
  },
  {
    id: 'elec-switches',
    name: 'Switch Installation',
    category: 'labor',
    importance: 'important',
    detectionPatterns: [/switch(es)?/i, /dimmer/i, /3[\s-]?way/i],
    questionToAsk: 'Are new switches included? Dimmers?',
    costImpact: '$50-150/switch'
  },
  {
    id: 'elec-lighting',
    name: 'Light Fixture Installation',
    category: 'labor',
    importance: 'important',
    detectionPatterns: [/light/i, /fixture/i, /recessed/i, /can\s*light/i, /chandelier/i, /pendant/i, /sconce/i],
    questionToAsk: 'Is light fixture installation included? How many?',
    costImpact: '$75-250/fixture'
  },
  {
    id: 'elec-gfci',
    name: 'GFCI Outlets',
    category: 'labor',
    importance: 'critical',
    detectionPatterns: [/gfci/i, /ground\s*fault/i, /gfi/i],
    questionToAsk: 'Are GFCI outlets included where required (kitchen, bath, outdoor)?',
    costImpact: '$100-175/outlet'
  },
  {
    id: 'elec-panel',
    name: 'Panel Work',
    category: 'labor',
    importance: 'important',
    detectionPatterns: [/panel/i, /breaker/i, /circuit/i, /sub[\s-]?panel/i, /load\s*center/i],
    questionToAsk: 'Is any panel work needed? New circuits?',
    costImpact: '$200-500/circuit'
  },
  {
    id: 'elec-wiring',
    name: 'Wiring/Rough-In',
    category: 'labor',
    importance: 'critical',
    detectionPatterns: [/wir(e|ing)/i, /rough[\s-]?in/i, /run.*wire/i, /romex/i, /conduit/i],
    questionToAsk: 'Is new wiring included? In walls or surface?',
    costImpact: '$3-8/linear ft'
  },
  {
    id: 'elec-permits',
    name: 'Permits & Inspection',
    category: 'permits',
    importance: 'important', // Downgraded from critical
    detectionPatterns: [/permit/i, /inspection/i, /code/i],
    questionToAsk: 'Are permits and inspection included?',
    costImpact: '$100-400'
  },
  {
    id: 'elec-cleanup',
    name: 'Cleanup',
    category: 'cleanup',
    importance: 'nice-to-have',
    detectionPatterns: [/clean[\s-]?up/i, /debris/i],
    questionToAsk: 'Is cleanup included?',
    costImpact: 'Usually minimal'
  },
  {
    id: 'elec-warranty',
    name: 'Warranty',
    category: 'warranty',
    importance: 'important',
    detectionPatterns: [/warrant(y|ied)/i, /guarantee/i],
    questionToAsk: 'What warranty on the electrical work?',
    costImpact: 'Code compliance'
  }
];

const PLUMBING_SCOPE: ScopeItem[] = [
  {
    id: 'plumb-fixtures',
    name: 'Fixture Installation',
    category: 'labor',
    importance: 'critical',
    detectionPatterns: [/fixture/i, /faucet/i, /toilet/i, /sink/i, /tub/i, /shower/i, /disposal/i],
    questionToAsk: 'What fixtures are included? Are fixtures themselves provided?',
    costImpact: '$150-400/fixture'
  },
  {
    id: 'plumb-supply',
    name: 'Supply Lines',
    category: 'materials',
    importance: 'important',
    detectionPatterns: [/supply/i, /water\s*line/i, /shut[\s-]?off/i, /valve/i, /copper/i, /pex/i],
    questionToAsk: 'Are new supply lines and shut-offs included?',
    costImpact: '$50-150/line'
  },
  {
    id: 'plumb-drain',
    name: 'Drain Work',
    category: 'labor',
    importance: 'critical',
    detectionPatterns: [/drain/i, /p[\s-]?trap/i, /waste/i, /vent/i, /dwv/i, /abs/i, /pvc/i],
    questionToAsk: 'Is drain connection and venting included?',
    costImpact: '$100-400'
  },
  {
    id: 'plumb-rough',
    name: 'Rough-In Work',
    category: 'labor',
    importance: 'critical',
    detectionPatterns: [/rough[\s-]?in/i, /relocat(e|ing)/i, /move.*plumb/i, /new.*location/i],
    impliedPatterns: [/relocat(e|ing)/i],
    questionToAsk: 'Is rough-in included if fixtures are being relocated?',
    costImpact: '$500-2,000'
  },
  {
    id: 'plumb-heater',
    name: 'Water Heater',
    category: 'fixtures',
    importance: 'important',
    detectionPatterns: [/water\s*heater/i, /hot\s*water/i, /tankless/i, /tank/i],
    questionToAsk: 'Is water heater work included?',
    costImpact: '$1,000-3,000'
  },
  {
    id: 'plumb-permits',
    name: 'Permits',
    category: 'permits',
    importance: 'important', // Downgraded from critical
    detectionPatterns: [/permit/i, /inspection/i, /code/i],
    questionToAsk: 'Are plumbing permits and inspection included?',
    costImpact: '$100-400'
  },
  {
    id: 'plumb-warranty',
    name: 'Warranty',
    category: 'warranty',
    importance: 'important',
    detectionPatterns: [/warrant(y|ied)/i, /guarantee/i],
    questionToAsk: 'What warranty on the plumbing work?',
    costImpact: 'Leak protection'
  }
];

const BASEMENT_FINISHING_SCOPE: ScopeItem[] = [
  {
    id: 'base-framing',
    name: 'Wall Framing',
    category: 'labor',
    importance: 'critical',
    detectionPatterns: [/fram(e|ing)/i, /stud/i, /wall.*build/i, /partition/i],
    questionToAsk: 'Is wall framing included? Steel or wood studs?',
    costImpact: '$2-5/sqft'
  },
  {
    id: 'base-insulation',
    name: 'Insulation',
    category: 'materials',
    importance: 'critical',
    detectionPatterns: [/insul(ate|ation)/i, /foam\s*board/i, /rigid.*foam/i, /fiberglass/i, /r[\s-]?\d+/i],
    questionToAsk: 'What insulation is included? R-value?',
    costImpact: '$1-3/sqft'
  },
  {
    id: 'base-drywall',
    name: 'Drywall',
    category: 'materials',
    importance: 'critical',
    detectionPatterns: [/drywall/i, /sheetrock/i, /gypsum/i, /tape.*mud/i, /finish.*wall/i],
    questionToAsk: 'Is drywall installation and finishing included? What finish level?',
    costImpact: '$2-4/sqft'
  },
  {
    id: 'base-electrical',
    name: 'Electrical',
    category: 'labor',
    importance: 'critical',
    detectionPatterns: [/electric(al)?/i, /outlet/i, /light/i, /wire/i, /circuit/i, /panel/i],
    questionToAsk: 'Is electrical rough-in and finish included?',
    costImpact: '$2,000-5,000'
  },
  {
    id: 'base-hvac',
    name: 'HVAC Extension',
    category: 'labor',
    importance: 'critical',
    detectionPatterns: [/hvac/i, /heat(ing)?/i, /cool(ing)?/i, /duct/i, /vent/i, /mini[\s-]?split/i, /register/i],
    questionToAsk: 'How will the basement be heated and cooled?',
    costImpact: '$1,500-4,000'
  },
  {
    id: 'base-flooring',
    name: 'Flooring',
    category: 'materials',
    importance: 'critical',
    detectionPatterns: [/floor(ing)?/i, /carpet/i, /lvp/i, /vinyl/i, /tile/i, /laminate/i],
    questionToAsk: 'What flooring is included?',
    costImpact: '$2-8/sqft'
  },
  {
    id: 'base-ceiling',
    name: 'Ceiling',
    category: 'materials',
    importance: 'important',
    detectionPatterns: [/ceiling/i, /drop\s*ceiling/i, /suspended/i, /drywall.*ceiling/i],
    questionToAsk: 'What ceiling type? Drop ceiling or drywall?',
    costImpact: '$2-6/sqft'
  },
  {
    id: 'base-egress',
    name: 'Egress Window',
    category: 'fixtures',
    importance: 'critical',
    detectionPatterns: [/egress/i, /window.*well/i, /escape.*window/i],
    impliedPatterns: [/bedroom/i],
    questionToAsk: 'Is an egress window required? Is it included?',
    costImpact: '$2,000-5,000'
  },
  {
    id: 'base-bathroom',
    name: 'Bathroom Rough-In',
    category: 'labor',
    importance: 'important',
    detectionPatterns: [/bath(room)?/i, /toilet/i, /shower/i, /plumb.*rough/i],
    questionToAsk: 'Is a bathroom included? Full rough-in?',
    costImpact: '$3,000-8,000'
  },
  {
    id: 'base-painting',
    name: 'Painting',
    category: 'labor',
    importance: 'important',
    detectionPatterns: [/paint(ing)?/i, /prime/i],
    questionToAsk: 'Is painting included?',
    costImpact: '$1-2/sqft'
  },
  {
    id: 'base-trim',
    name: 'Trim & Doors',
    category: 'materials',
    importance: 'important',
    detectionPatterns: [/trim/i, /baseboard/i, /door/i, /casing/i, /molding/i],
    questionToAsk: 'Is trim and interior doors included?',
    costImpact: '$500-2,000'
  },
  {
    id: 'base-permits',
    name: 'Permits',
    category: 'permits',
    importance: 'critical', // Keep critical for basement - structural work requires permits
    detectionPatterns: [/permit/i, /inspection/i, /code/i],
    questionToAsk: 'Are all required permits included?',
    costImpact: '$300-1,000'
  },
  {
    id: 'base-debris',
    name: 'Debris Removal',
    category: 'cleanup',
    importance: 'important', // Already important, keep as-is
    detectionPatterns: [/debris/i, /clean[\s-]?up/i, /haul[\s-]?away/i, /dumpster/i],
    questionToAsk: 'Is debris removal included?',
    costImpact: '$300-600'
  },
  {
    id: 'base-warranty',
    name: 'Warranty',
    category: 'warranty',
    importance: 'important',
    detectionPatterns: [/warrant(y|ied)/i, /guarantee/i],
    questionToAsk: 'What warranty is provided?',
    costImpact: 'Peace of mind'
  }
];

const GENERAL_REMODEL_SCOPE: ScopeItem[] = [
  {
    id: 'gen-demo',
    name: 'Demolition',
    category: 'labor',
    importance: 'important',
    detectionPatterns: [/demo(lition)?/i, /tear[\s-]?out/i, /remov(e|al)/i],
    questionToAsk: 'Is demolition and removal of existing work included?',
    costImpact: 'Varies'
  },
  {
    id: 'gen-permits',
    name: 'Permits',
    category: 'permits',
    importance: 'important', // Downgraded from critical
    detectionPatterns: [/permit/i, /inspection/i, /code/i],
    questionToAsk: 'Are permits and inspections included?',
    costImpact: '$200-1,000'
  },
  {
    id: 'gen-debris',
    name: 'Debris Removal',
    category: 'cleanup',
    importance: 'important', // Downgraded from critical
    detectionPatterns: [/debris/i, /haul[\s-]?away/i, /disposal/i, /dumpster/i, /clean[\s-]?up/i],
    questionToAsk: 'Is debris removal and disposal included?',
    costImpact: '$200-800'
  },
  {
    id: 'gen-protection',
    name: 'Surface Protection',
    category: 'protection',
    importance: 'nice-to-have',
    detectionPatterns: [/protect(ion)?/i, /cover(ing)?/i, /drop\s*cloth/i],
    questionToAsk: 'Will existing surfaces be protected during work?',
    costImpact: 'Professional standard'
  },
  {
    id: 'gen-warranty',
    name: 'Warranty',
    category: 'warranty',
    importance: 'important',
    detectionPatterns: [/warrant(y|ied)/i, /guarantee/i, /workmanship/i],
    questionToAsk: 'What warranty is provided on the work?',
    costImpact: 'Peace of mind'
  },
  {
    id: 'gen-timeline',
    name: 'Timeline/Schedule',
    category: 'labor',
    importance: 'important',
    detectionPatterns: [/timeline/i, /schedule/i, /complet(e|ion).*date/i, /\d+\s*(day|week)/i, /start.*date/i],
    questionToAsk: 'What is the expected timeline for completion?',
    costImpact: 'Sets expectations'
  },
  {
    id: 'gen-payment',
    name: 'Payment Schedule',
    category: 'labor',
    importance: 'important',
    detectionPatterns: [/payment/i, /deposit/i, /draw/i, /milestone/i, /progress.*pay/i],
    questionToAsk: 'What is the payment schedule?',
    costImpact: 'Cash flow protection'
  }
];

// ============================================================================
// Project Type to Scope Mapping
// ============================================================================

const PROJECT_SCOPE_MAP: Record<string, ScopeItem[]> = {
  'kitchen-remodel': KITCHEN_REMODEL_SCOPE,
  'kitchen': KITCHEN_REMODEL_SCOPE,
  'bathroom-remodel': BATHROOM_REMODEL_SCOPE,
  'bathroom': BATHROOM_REMODEL_SCOPE,
  'flooring': FLOORING_SCOPE,
  'windows-doors': WINDOW_SCOPE,
  'windows': WINDOW_SCOPE,
  'roofing': ROOFING_SCOPE,
  'painting': PAINTING_SCOPE,
  'electrical': ELECTRICAL_SCOPE,
  'plumbing': PLUMBING_SCOPE,
  'basement-finishing': BASEMENT_FINISHING_SCOPE,
  'basement': BASEMENT_FINISHING_SCOPE,
  'general-remodel': GENERAL_REMODEL_SCOPE,
  'general': GENERAL_REMODEL_SCOPE,
  'unknown': GENERAL_REMODEL_SCOPE,
};

// ============================================================================
// Main Analysis Function
// ============================================================================

export function analyzeScope(bidText: string, projectType?: string | TradeCategory): ScopeAnalysisResult {
  const normalizedType = normalizeProjectType(projectType, bidText);
  const expectedScope = getExpectedScope(normalizedType);
  
  const includedItems: DetectedScopeItem[] = [];
  const missingItems: DetectedScopeItem[] = [];
  const impliedItems: DetectedScopeItem[] = [];
  

  
  for (const item of expectedScope) {
    // Check for explicit matches
    let foundExplicit = false;
    let matchedText: string | undefined;
    
    for (const pattern of item.detectionPatterns) {
      const match = bidText.match(pattern);
      if (match) {
        foundExplicit = true;
        matchedText = match[0];
        break;
      }
    }
    
    if (foundExplicit) {
      includedItems.push({ ...item, status: 'found', matchedText });
      continue;
    }
    
    // Check for implied matches
    let foundImplied = false;
    if (item.impliedPatterns) {
      for (const pattern of item.impliedPatterns) {
        const match = bidText.match(pattern);
        if (match) {
          foundImplied = true;
          matchedText = match[0];
          break;
        }
      }
    }
    
    if (foundImplied) {
      impliedItems.push({ ...item, status: 'implied', matchedText });
      continue;
    }
    
    // Item is missing
    missingItems.push({ ...item, status: 'missing' });
  }
  
  // Calculate score
  const scopeScore = calculateScopeScore(includedItems, missingItems, impliedItems);
  
  // Identify gaps
  const criticalGaps = missingItems
    .filter(i => i.importance === 'critical')
    .map(i => i.name);
  
  const importantGaps = missingItems
    .filter(i => i.importance === 'important')
    .map(i => i.name);
  
  // Generate questions
  const questionsToAsk = missingItems
    .filter(i => i.importance === 'critical' || i.importance === 'important')
    .map(i => i.questionToAsk);
  
  return {
    projectType: normalizedType,
    includedItems,
    missingItems,
    impliedItems,
    scopeScore,
    criticalGaps,
    importantGaps,
    questionsToAsk,
    summary: {
      totalExpected: expectedScope.length,
      totalFound: includedItems.length + impliedItems.length,
      totalMissing: missingItems.length,
      criticalMissing: criticalGaps.length,
      importantMissing: importantGaps.length
    }
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function normalizeProjectType(projectType: string | undefined, bidText: string): string {
  if (projectType) {
    const lower = projectType.toLowerCase();
    // Map common variations
    if (lower.includes('kitchen')) return 'kitchen-remodel';
    if (lower.includes('bath')) return 'bathroom-remodel';
    if (lower.includes('floor')) return 'flooring';
    if (lower.includes('window')) return 'windows-doors';
    if (lower.includes('roof')) return 'roofing';
    if (lower.includes('paint')) return 'painting';
    if (lower.includes('electric')) return 'electrical';
    if (lower.includes('plumb')) return 'plumbing';
    if (lower.includes('basement')) return 'basement-finishing';
    if (PROJECT_SCOPE_MAP[lower]) return lower;
  }
  
  // Try to detect from bid text
  if (/kitchen\s*(remodel|renovation|update)/i.test(bidText)) return 'kitchen-remodel';
  if (/bath(room)?\s*(remodel|renovation|update)/i.test(bidText)) return 'bathroom-remodel';
  if (/(floor(ing)?|hardwood|lvp|carpet|tile.*floor)/i.test(bidText)) return 'flooring';
  if (/(window|replacement.*window)/i.test(bidText)) return 'windows-doors';
  if (/(roof|shingle|roofing)/i.test(bidText)) return 'roofing';
  if (/(paint|painting|interior.*paint|exterior.*paint)/i.test(bidText)) return 'painting';
  if (/(electrical|outlet|wiring|circuit)/i.test(bidText)) return 'electrical';
  if (/(plumb(ing)?|toilet|faucet|water\s*heater)/i.test(bidText)) return 'plumbing';
  if (/(basement|finish.*basement)/i.test(bidText)) return 'basement-finishing';
  
  return 'general-remodel';
}

function getExpectedScope(projectType: string): ScopeItem[] {
  return PROJECT_SCOPE_MAP[projectType] || GENERAL_REMODEL_SCOPE;
}

function calculateScopeScore(
  _included: DetectedScopeItem[],
  missing: DetectedScopeItem[],
  implied: DetectedScopeItem[]
): number {
  let score = 100;
  
  // Deductions for missing items
  for (const item of missing) {
    switch (item.importance) {
      case 'critical':
        score -= 12;
        break;
      case 'important':
        score -= 6;
        break;
      case 'nice-to-have':
        score -= 2;
        break;
    }
  }
  
  // Partial credit for implied items (half deduction)
  for (const item of implied) {
    switch (item.importance) {
      case 'critical':
        score += 6; // restore half
        break;
      case 'important':
        score += 3;
        break;
      case 'nice-to-have':
        score += 1;
        break;
    }
  }
  
  return Math.max(0, Math.min(100, score));
}

// Export scope databases for testing
export {
  KITCHEN_REMODEL_SCOPE,
  BATHROOM_REMODEL_SCOPE,
  FLOORING_SCOPE,
  WINDOW_SCOPE,
  ROOFING_SCOPE,
  PAINTING_SCOPE,
  ELECTRICAL_SCOPE,
  PLUMBING_SCOPE,
  BASEMENT_FINISHING_SCOPE,
  GENERAL_REMODEL_SCOPE,
  PROJECT_SCOPE_MAP
};
