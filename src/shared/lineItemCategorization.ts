/**
 * Line Item Cost-Weighted Categorization Engine
 * 
 * Parses line items from bid text, categorizes by room/project type,
 * and determines primary project type based on cost allocation.
 * 
 * This solves the multi-area project problem where keyword counting
 * alone misidentifies project types (e.g., basement + kitchen combo).
 */

// =============================================================================
// TYPES
// =============================================================================

export type RoomCategory = 'kitchen' | 'bathroom' | 'basement' | 'windows' | 'electrical' | 'plumbing' | 'hvac' | 'roofing' | 'flooring' | 'painting' | 'general';

export interface ParsedLineItem {
  description: string;
  amount: number;
  category: RoomCategory;
  confidence: 'high' | 'medium' | 'low';
  matchedKeywords: string[];
}

export interface CategoryBreakdown {
  category: RoomCategory;
  totalCost: number;
  percentOfBid: number;
  lineItemCount: number;
  items: ParsedLineItem[];
}

export interface LineItemCategorizationResult {
  lineItems: ParsedLineItem[];
  categoryBreakdowns: CategoryBreakdown[];
  primaryCategory: RoomCategory;
  secondaryCategory: RoomCategory | null;
  isMultiArea: boolean;
  totalParsedAmount: number;
  parseConfidence: 'high' | 'medium' | 'low';
}

// =============================================================================
// CATEGORY KEYWORDS (Room/Area specific)
// =============================================================================

// Keywords that strongly indicate a specific room/area
// Ordered by specificity - more specific keywords first
const CATEGORY_KEYWORDS: Record<RoomCategory, { strong: string[]; weak: string[] }> = {
  kitchen: {
    strong: [
      'kitchen cabinet', 'kitchen sink', 'kitchen faucet', 'kitchen floor',
      'kitchen island', 'kitchen counter', 'kitchen tile', 'kitchen lighting',
      'kitchen demo', 'kitchen remodel', 'kitchen renovation',
      'countertop', 'backsplash', 'range hood', 'dishwasher',
      'pantry', 'garbage disposal', 'under-cabinet'
    ],
    weak: [
      'cabinet', 'appliance', 'range', 'oven', 'microwave', 'refrigerator'
    ]
  },
  bathroom: {
    strong: [
      'bathroom vanity', 'bathroom tile', 'bathroom floor', 'bathroom sink',
      'bathroom demo', 'bathroom remodel', 'bathroom renovation',
      'master bath', 'half bath', 'powder room', 'en-suite', 'ensuite',
      'shower door', 'shower tile', 'shower pan', 'shower surround',
      'bath tile', 'bath vanity', 'bath floor',
      'toilet install', 'new toilet', 'replace toilet',
      'tub surround', 'bathtub', 'whirlpool tub', 'soaking tub'
    ],
    weak: [
      'vanity', 'shower', 'tub', 'toilet', 'commode', 'lavatory',
      'bath', 'bathroom', 'medicine cabinet'
    ]
  },
  basement: {
    strong: [
      'basement framing', 'basement drywall', 'basement floor',
      'basement ceiling', 'basement demo', 'basement remodel',
      'basement finish', 'basement renovation', 'basement bath',
      'egress window', 'sump pump', 'basement waterproof',
      'rec room', 'recreation room', 'lower level',
      'basement electric', 'basement plumbing', 'basement hvac',
      'basement stair', 'basement door', 'basement lighting'
    ],
    weak: [
      'basement', 'below grade', 'subfloor', 'crawl space'
    ]
  },
  windows: {
    strong: [
      'window replacement', 'window install', 'new window', 'replace window',
      'vinyl window', 'wood window', 'fiberglass window',
      'double-hung', 'doublehung', 'casement window', 'bay window', 'bow window',
      'egress window', 'picture window', 'awning window', 'sliding window',
      'window frame', 'window trim', 'window casing'
    ],
    weak: [
      'window', 'glass', 'pane', 'low-e', 'argon'
    ]
  },
  electrical: {
    strong: [
      'electrical panel', 'breaker panel', 'circuit breaker', 'subpanel',
      'rewire', 'electrical service', 'electrical permit',
      'recessed light', 'can light', 'electrical outlet', 'gfci outlet',
      'dedicated circuit'
    ],
    weak: [
      'electrical', 'electric', 'outlet', 'switch', 'wiring', 'fixture', 'lighting'
    ]
  },
  plumbing: {
    strong: [
      'plumbing rough', 'plumbing permit', 'plumbing repair',
      'repipe', 'water heater', 'tankless', 'sewer line', 'drain line',
      'water supply', 'gas line', 'shut-off valve'
    ],
    weak: [
      'plumbing', 'plumb', 'pipe', 'drain', 'faucet', 'sink'
    ]
  },
  hvac: {
    strong: [
      'hvac install', 'hvac system', 'hvac replacement',
      'furnace install', 'ac install', 'air conditioning',
      'ductwork', 'mini split', 'heat pump', 'air handler'
    ],
    weak: [
      'hvac', 'heating', 'cooling', 'furnace', 'ac', 'thermostat', 'vent'
    ]
  },
  roofing: {
    strong: [
      'roof replacement', 'new roof', 'reroof', 'roofing install',
      'shingle install', 'roof repair', 'roof permit'
    ],
    weak: [
      'roof', 'roofing', 'shingle', 'flashing', 'gutter', 'soffit', 'fascia'
    ]
  },
  flooring: {
    strong: [
      'flooring install', 'floor install', 'hardwood floor', 'hardwood install',
      'lvp install', 'vinyl plank', 'laminate floor', 'tile floor',
      'carpet install', 'flooring material'
    ],
    weak: [
      'flooring', 'floor', 'hardwood', 'laminate', 'tile', 'carpet', 'lvp', 'vinyl'
    ]
  },
  painting: {
    strong: [
      'interior paint', 'exterior paint', 'paint labor', 'paint material',
      'prime and paint', 'paint walls', 'paint ceiling', 'paint trim'
    ],
    weak: [
      'paint', 'painting', 'primer', 'stain', 'finish coat'
    ]
  },
  general: {
    strong: [
      'general labor', 'demo labor', 'cleanup', 'disposal', 'haul away',
      'permit fee', 'project management', 'supervision'
    ],
    weak: [
      'labor', 'material', 'install', 'remove', 'demo', 'demolition'
    ]
  }
};

// Room prefixes that appear before scope items (e.g., "Basement: framing")
const ROOM_PREFIXES = [
  { prefix: /^basement\s*[:\-–—]/i, category: 'basement' as RoomCategory },
  { prefix: /^kitchen\s*[:\-–—]/i, category: 'kitchen' as RoomCategory },
  { prefix: /^bath(?:room)?\s*[:\-–—]/i, category: 'bathroom' as RoomCategory },
  { prefix: /^master bath\s*[:\-–—]/i, category: 'bathroom' as RoomCategory },
  { prefix: /^window[s]?\s*[:\-–—]/i, category: 'windows' as RoomCategory },
  { prefix: /^electrical\s*[:\-–—]/i, category: 'electrical' as RoomCategory },
  { prefix: /^plumbing\s*[:\-–—]/i, category: 'plumbing' as RoomCategory },
  { prefix: /^hvac\s*[:\-–—]/i, category: 'hvac' as RoomCategory },
  { prefix: /^flooring\s*[:\-–—]/i, category: 'flooring' as RoomCategory },
];

// =============================================================================
// LINE ITEM PARSING
// =============================================================================

/**
 * Parse line items from bid text
 * Looks for patterns like:
 * - "Description... $1,234.56"
 * - "Description... $1234"
 * - "Description    1,234.56"
 * - "Item: $500 - description"
 */
export function parseLineItems(bidText: string): ParsedLineItem[] {
  const items: ParsedLineItem[] = [];
  
  // Split into lines
  const lines = bidText.split(/\n/);
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 5) continue;
    
    // Skip header/footer lines
    if (/^(total|subtotal|grand total|tax|discount|deposit|balance)/i.test(trimmed)) continue;
    if (/^(date|invoice|estimate|proposal|quote|page|phone|fax|email|address)/i.test(trimmed)) continue;
    
    // Try to extract amount from line
    const parsed = extractAmountFromLine(trimmed);
    if (parsed) {
      const { description, amount } = parsed;
      
      // Categorize the line item
      const { category, confidence, matchedKeywords } = categorizeLineItem(description);
      
      items.push({
        description,
        amount,
        category,
        confidence,
        matchedKeywords
      });
    }
  }
  
  return items;
}

/**
 * Extract description and amount from a line
 */
function extractAmountFromLine(line: string): { description: string; amount: number } | null {
  // Pattern 1: "$1,234.56" or "$1234" at end of line
  const pattern1 = /^(.+?)\s*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*$/;
  
  // Pattern 2: "$1,234.56" anywhere in line
  const pattern2 = /^(.+?)\s*\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/;
  
  // Pattern 3: Amount at start "1,234.56 - Description"
  const pattern3 = /^\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*[-–—:]\s*(.+)$/;
  
  let match = line.match(pattern1);
  if (match) {
    const description = match[1].trim();
    const amount = parseFloat(match[2].replace(/,/g, ''));
    if (amount >= 50 && amount <= 500000 && description.length >= 3) {
      return { description, amount };
    }
  }
  
  match = line.match(pattern2);
  if (match) {
    const description = match[1].trim();
    const amount = parseFloat(match[2].replace(/,/g, ''));
    if (amount >= 50 && amount <= 500000 && description.length >= 3) {
      return { description, amount };
    }
  }
  
  match = line.match(pattern3);
  if (match) {
    const amount = parseFloat(match[1].replace(/,/g, ''));
    const description = match[2].trim();
    if (amount >= 50 && amount <= 500000 && description.length >= 3) {
      return { description, amount };
    }
  }
  
  return null;
}

/**
 * Categorize a line item description
 */
function categorizeLineItem(description: string): { 
  category: RoomCategory; 
  confidence: 'high' | 'medium' | 'low';
  matchedKeywords: string[];
} {
  const lowerDesc = description.toLowerCase();
  const matchedKeywords: string[] = [];
  
  // First check for room prefixes (highest confidence)
  for (const { prefix, category } of ROOM_PREFIXES) {
    if (prefix.test(lowerDesc)) {
      return { category, confidence: 'high', matchedKeywords: ['room prefix'] };
    }
  }
  
  // Score each category
  const scores: Record<RoomCategory, number> = {
    kitchen: 0, bathroom: 0, basement: 0, windows: 0,
    electrical: 0, plumbing: 0, hvac: 0, roofing: 0,
    flooring: 0, painting: 0, general: 0
  };
  
  // Check strong keywords (3 points each)
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords.strong) {
      if (lowerDesc.includes(kw.toLowerCase())) {
        scores[category as RoomCategory] += 3;
        matchedKeywords.push(kw);
      }
    }
    // Check weak keywords (1 point each)
    for (const kw of keywords.weak) {
      if (lowerDesc.includes(kw.toLowerCase())) {
        scores[category as RoomCategory] += 1;
        matchedKeywords.push(kw);
      }
    }
  }
  
  // Find highest scoring category
  let maxScore = 0;
  let bestCategory: RoomCategory = 'general';
  
  for (const [category, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestCategory = category as RoomCategory;
    }
  }
  
  // Determine confidence based on score
  const confidence: 'high' | 'medium' | 'low' = 
    maxScore >= 3 ? 'high' : 
    maxScore >= 1 ? 'medium' : 'low';
  
  return { category: bestCategory, confidence, matchedKeywords };
}

// =============================================================================
// MAIN CATEGORIZATION FUNCTION
// =============================================================================

/**
 * Analyze bid text and return cost-weighted category breakdown
 */
export function categorizeLineItems(bidText: string): LineItemCategorizationResult {
  const lineItems = parseLineItems(bidText);
  
  // Group by category and sum costs
  const categoryMap = new Map<RoomCategory, ParsedLineItem[]>();
  
  for (const item of lineItems) {
    const existing = categoryMap.get(item.category) || [];
    existing.push(item);
    categoryMap.set(item.category, existing);
  }
  
  // Calculate totals
  const totalParsedAmount = lineItems.reduce((sum, item) => sum + item.amount, 0);
  
  // Build breakdowns sorted by cost (descending)
  const categoryBreakdowns: CategoryBreakdown[] = [];
  
  for (const [category, items] of categoryMap.entries()) {
    const totalCost = items.reduce((sum, item) => sum + item.amount, 0);
    categoryBreakdowns.push({
      category,
      totalCost,
      percentOfBid: totalParsedAmount > 0 ? (totalCost / totalParsedAmount) * 100 : 0,
      lineItemCount: items.length,
      items
    });
  }
  
  // Sort by total cost descending
  categoryBreakdowns.sort((a, b) => b.totalCost - a.totalCost);
  
  // Determine primary and secondary categories
  const primaryCategory = categoryBreakdowns[0]?.category || 'general';
  const secondaryCategory = categoryBreakdowns[1]?.category || null;
  
  // Is this a multi-area project? (2+ categories with >20% each)
  const significantCategories = categoryBreakdowns.filter(b => b.percentOfBid >= 20);
  const isMultiArea = significantCategories.length >= 2;
  
  // Parse confidence based on how much we could extract
  const highConfidenceItems = lineItems.filter(i => i.confidence === 'high').length;
  const parseConfidence: 'high' | 'medium' | 'low' = 
    highConfidenceItems >= lineItems.length * 0.5 ? 'high' :
    highConfidenceItems >= lineItems.length * 0.25 ? 'medium' : 'low';
  
  return {
    lineItems,
    categoryBreakdowns,
    primaryCategory,
    secondaryCategory,
    isMultiArea,
    totalParsedAmount,
    parseConfidence
  };
}

// =============================================================================
// PROJECT TYPE MAPPING (for blind bid engine)
// =============================================================================

/**
 * Map room categories to blind bid project types
 * Used to select appropriate Zonda benchmarks
 */
export function mapCategoryToProjectType(category: RoomCategory): 'kitchen' | 'bathroom' | 'basement' | 'windows' | 'general' {
  switch (category) {
    case 'kitchen':
      return 'kitchen';
    case 'bathroom':
      return 'bathroom';
    case 'basement':
      return 'basement';
    case 'windows':
      return 'windows';
    default:
      return 'general';
  }
}

/**
 * Get weighted project type breakdown for multi-area projects
 * Returns an array of { projectType, weight } for benchmark calculation
 */
export function getWeightedProjectTypes(result: LineItemCategorizationResult): Array<{
  projectType: 'kitchen' | 'bathroom' | 'basement' | 'windows' | 'general';
  weight: number;
  amount: number;
}> {
  const weights: Array<{
    projectType: 'kitchen' | 'bathroom' | 'basement' | 'windows' | 'general';
    weight: number;
    amount: number;
  }> = [];
  
  for (const breakdown of result.categoryBreakdowns) {
    // Only include categories with >10% of total
    if (breakdown.percentOfBid >= 10) {
      weights.push({
        projectType: mapCategoryToProjectType(breakdown.category),
        weight: breakdown.percentOfBid / 100,
        amount: breakdown.totalCost
      });
    }
  }
  
  return weights;
}
