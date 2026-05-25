/**
 * Unit Count Detection for Per-Unit Trades
 * 
 * Extracts quantities from bid text for trades priced by the unit:
 * - Windows
 * - Doors
 * - Electrical fixtures (outlets, switches, lights)
 * - Plumbing fixtures (faucets, toilets, sinks)
 */

export interface UnitItem {
  type: 'window' | 'door' | 'outlet' | 'switch' | 'light-fixture' | 'plumbing-fixture' | 'recessed-light' | 'ceiling-fan' | 'other';
  quantity: number;
  description: string;
  pricePerUnit?: number;
  totalPrice?: number;
  confidence: 'high' | 'medium' | 'low';
  matchedText: string;
}

export interface UnitDetectionResult {
  items: UnitItem[];
  totalUnits: number;
  hasUnitPricing: boolean;
  summary: string;
}

// Helper to check if a match is likely a line item number
// Line numbers typically appear at start of line followed by space/period and text
function isLikelyLineNumber(bidText: string, matchIndex: number, matchedNumber: string): boolean {
  // Get context before the match
  const contextBefore = bidText.slice(Math.max(0, matchIndex - 30), matchIndex);
  
  // Check if number is at start of line (preceded by newline or start of text)
  const atLineStart = /(?:^|[\n\r])\s*$/.test(contextBefore);
  
  // Get context after the number
  const afterNumber = bidText.slice(matchIndex + matchedNumber.length, matchIndex + matchedNumber.length + 50);
  
  // Line numbers are typically followed by: period, space then word, or immediately by a capital letter
  // but NOT followed by window-related words
  const followedByLineItemText = /^[\.\s]+[A-Z][a-z]/.test(afterNumber) && !/^[\.\s]*(?:window|door|outlet)/i.test(afterNumber);
  
  return atLineStart && followedByLineItemText;
}

// Patterns for extracting unit counts
const UNIT_PATTERNS = [
  // Windows - patterns designed to avoid line item numbers
  {
    type: 'window' as const,
    patterns: [
      // "Installing X windows" - very reliable
      /installing\s+(\d+)\s*windows?/i,
      // "X new windows" - requires "new" modifier
      /(\d+)\s+new\s+windows?/i,
      // "install X windows"
      /install\s+(\d+)\s*windows?/i,
      // "replace X windows"
      /replace\s+(\d+)\s*windows?/i,
      // "windows: X" or "windows - X"
      /windows?\s*[:\-]\s*(\d+)/i,
      // "(X windows)" - parenthetical count
      /\(\s*(\d+)\s*windows?\s*\)/i,
      // "X vinyl/wood/aluminum windows" - material specified
      /(\d+)\s*(?:vinyl|wood|aluminum|fiberglass)\s+windows?/i,
      // "X double-hung/casement/sliding windows" - style specified
      /(\d+)\s*(?:double[\s-]?hung|casement|sliding|bay|bow)\s+windows?/i,
      // "qty: X" or "quantity: X" near windows
      /(?:qty|quantity)\s*[:\-]?\s*(\d+)(?=.*windows?)/i,
    ]
  },
  // Doors
  {
    type: 'door' as const,
    patterns: [
      /(\d+)\s*(?:new\s+)?doors?(?:\s+install)?/i,
      /doors?\s*[:\-]\s*(\d+)/i,
      /install\s*(\d+)\s*doors?/i,
      /replace\s*(\d+)\s*doors?/i,
      /(\d+)\s*(?:interior|exterior|entry|patio)\s*doors?/i,
      /(\d+)\s*(?:pre[\s-]?hung|slab)\s*doors?/i,
    ]
  },
  // Electrical outlets
  {
    type: 'outlet' as const,
    patterns: [
      /(\d+)\s*(?:new\s+)?outlets?/i,
      /outlets?\s*[:\-]\s*(\d+)/i,
      /install\s*(\d+)\s*outlets?/i,
      /add\s*(\d+)\s*outlets?/i,
      /(\d+)\s*(?:gfci|afci|usb)\s*outlets?/i,
      /(\d+)\s*receptacles?/i,
    ]
  },
  // Electrical switches
  {
    type: 'switch' as const,
    patterns: [
      /(\d+)\s*(?:new\s+)?switches?/i,
      /switches?\s*[:\-]\s*(\d+)/i,
      /install\s*(\d+)\s*switches?/i,
      /replace\s*(\d+)\s*switches?/i,
      /(\d+)\s*(?:dimmer|3[\s-]?way|smart)\s*switches?/i,
    ]
  },
  // Recessed lights (can lights)
  {
    type: 'recessed-light' as const,
    patterns: [
      /(\d+)\s*(?:recessed|can)\s*lights?/i,
      /(\d+)\s*(?:4|5|6)[\"\s]*(?:recessed|can)/i,
      /install\s*(\d+)\s*(?:recessed|can)\s*lights?/i,
      /(\d+)\s*(?:led\s+)?(?:recessed|can)/i,
    ]
  },
  // Light fixtures
  {
    type: 'light-fixture' as const,
    patterns: [
      /(\d+)\s*(?:light\s+)?fixtures?/i,
      /fixtures?\s*[:\-]\s*(\d+)/i,
      /install\s*(\d+)\s*(?:light\s+)?fixtures?/i,
      /(\d+)\s*(?:pendant|chandelier|sconce)s?/i,
    ]
  },
  // Ceiling fans
  {
    type: 'ceiling-fan' as const,
    patterns: [
      /(\d+)\s*ceiling\s*fans?/i,
      /fans?\s*[:\-]\s*(\d+)/i,
      /install\s*(\d+)\s*(?:ceiling\s+)?fans?/i,
    ]
  },
  // Plumbing fixtures
  {
    type: 'plumbing-fixture' as const,
    patterns: [
      /(\d+)\s*(?:faucets?|toilets?|sinks?)/i,
      /install\s*(\d+)\s*(?:faucets?|toilets?|sinks?)/i,
      /replace\s*(\d+)\s*(?:faucets?|toilets?|sinks?)/i,
      /(\d+)\s*(?:vanity|vanities)/i,
      /(\d+)\s*(?:shower\s+)?valves?/i,
    ]
  },
];

// Patterns for unit pricing
const PRICE_PATTERNS = [
  // $X per unit/each/window/door etc
  /\$\s*([\d,]+(?:\.\d{2})?)\s*(?:per|each|\/)\s*(?:unit|window|door|outlet|switch|fixture|light|fan)/i,
  // unit @ $X
  /(?:window|door|outlet|switch|fixture|light|fan)s?\s*@\s*\$\s*([\d,]+(?:\.\d{2})?)/i,
  // X units @ $Y = $Z
  /(\d+)\s*(?:units?|windows?|doors?|outlets?|switches?|fixtures?|lights?|fans?)\s*@\s*\$\s*([\d,]+(?:\.\d{2})?)/i,
];

/**
 * Extract unit counts from bid text
 */
export function detectUnits(bidText: string): UnitDetectionResult {
  const items: UnitItem[] = [];
  const seenMatches = new Set<string>(); // Deduplicate
  
  for (const { type, patterns } of UNIT_PATTERNS) {
    for (const pattern of patterns) {
      const matches = bidText.matchAll(new RegExp(pattern.source, pattern.flags + 'g'));
      
      for (const match of matches) {
        const quantity = parseInt(match[1], 10);
        if (isNaN(quantity) || quantity === 0 || quantity > 1000) continue;
        
        // Skip matches that look like line item numbers (especially for windows)
        if (match.index !== undefined && isLikelyLineNumber(bidText, match.index, match[1])) {
          continue;
        }
        
        const matchedText = match[0];
        const matchKey = `${type}:${quantity}:${matchedText.toLowerCase()}`;
        
        if (seenMatches.has(matchKey)) continue;
        seenMatches.add(matchKey);
        
        // Try to find price for this item
        let pricePerUnit: number | undefined;
        let totalPrice: number | undefined;
        
        // Look for price near this match
        const contextStart = Math.max(0, match.index! - 100);
        const contextEnd = Math.min(bidText.length, match.index! + matchedText.length + 100);
        const context = bidText.slice(contextStart, contextEnd);
        
        for (const pricePattern of PRICE_PATTERNS) {
          const priceMatch = context.match(pricePattern);
          if (priceMatch) {
            const price = parseFloat(priceMatch[1].replace(/,/g, ''));
            if (!isNaN(price) && price > 0 && price < 100000) {
              pricePerUnit = price;
              totalPrice = price * quantity;
              break;
            }
          }
        }
        
        items.push({
          type,
          quantity,
          description: getDescriptionForType(type, quantity),
          pricePerUnit,
          totalPrice,
          confidence: getConfidence(matchedText),
          matchedText: matchedText.trim()
        });
      }
    }
  }
  
  // Sort by type and quantity
  items.sort((a, b) => {
    if (a.type !== b.type) return a.type.localeCompare(b.type);
    return b.quantity - a.quantity;
  });
  
  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);
  const hasUnitPricing = items.some(item => item.pricePerUnit !== undefined);
  
  const summary = generateSummary(items);
  
  return {
    items,
    totalUnits,
    hasUnitPricing,
    summary
  };
}

function getDescriptionForType(type: UnitItem['type'], quantity: number): string {
  const plural = quantity !== 1;
  const descriptions: Record<UnitItem['type'], { singular: string; plural: string }> = {
    'window': { singular: 'Window', plural: 'Windows' },
    'door': { singular: 'Door', plural: 'Doors' },
    'outlet': { singular: 'Outlet', plural: 'Outlets' },
    'switch': { singular: 'Switch', plural: 'Switches' },
    'light-fixture': { singular: 'Light Fixture', plural: 'Light Fixtures' },
    'recessed-light': { singular: 'Recessed Light', plural: 'Recessed Lights' },
    'ceiling-fan': { singular: 'Ceiling Fan', plural: 'Ceiling Fans' },
    'plumbing-fixture': { singular: 'Plumbing Fixture', plural: 'Plumbing Fixtures' },
    'other': { singular: 'Unit', plural: 'Units' }
  };
  
  return plural ? descriptions[type].plural : descriptions[type].singular;
}

function getConfidence(matchedText: string): 'high' | 'medium' | 'low' {
  // Higher confidence if the match includes descriptive words
  const descriptiveWords = /(?:new|install|replace|add|upgrade|existing)/i;
  const specificWords = /(?:double[\s-]?hung|casement|gfci|afci|led|dimmer|pendant|chandelier)/i;
  
  if (specificWords.test(matchedText)) return 'high';
  if (descriptiveWords.test(matchedText)) return 'high';
  return 'medium';
}

function generateSummary(items: UnitItem[]): string {
  if (items.length === 0) return 'No per-unit items detected';
  
  const groups: Record<string, number> = {};
  for (const item of items) {
    const key = item.type;
    groups[key] = (groups[key] || 0) + item.quantity;
  }
  
  const parts: string[] = [];
  for (const [type, count] of Object.entries(groups)) {
    const desc = getDescriptionForType(type as UnitItem['type'], count);
    parts.push(`${count} ${desc}`);
  }
  
  if (parts.length === 0) return 'No per-unit items detected';
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  
  const last = parts.pop();
  return `${parts.join(', ')}, and ${last}`;
}

/**
 * Calculate per-unit pricing if total and quantity are known
 */
export function calculatePerUnitPrice(total: number, quantity: number): number {
  if (quantity === 0) return 0;
  return Math.round((total / quantity) * 100) / 100;
}

/**
 * Format unit count for display
 */
export function formatUnitCount(item: UnitItem): string {
  const qty = `${item.quantity} ${item.description}`;
  
  if (item.pricePerUnit && item.totalPrice) {
    return `${qty} @ $${item.pricePerUnit.toLocaleString()} = $${item.totalPrice.toLocaleString()}`;
  }
  
  if (item.pricePerUnit) {
    return `${qty} @ $${item.pricePerUnit.toLocaleString()} each`;
  }
  
  return qty;
}

/**
 * Deduplicate and filter unit items to prevent confusing output.
 * 
 * Rules:
 * 1. Same type, same quantity → keep one (highest confidence)
 * 2. Same type, different quantities with complementary context → combine
 * 3. Same type, different quantities without context → hide all (conflicting data)
 */
export function deduplicateUnitItems(items: UnitItem[]): UnitItem[] {
  // Group items by type
  const groups: Record<string, UnitItem[]> = {};
  for (const item of items) {
    if (!groups[item.type]) {
      groups[item.type] = [];
    }
    groups[item.type].push(item);
  }
  
  const result: UnitItem[] = [];
  
  for (const [type, typeItems] of Object.entries(groups)) {
    if (typeItems.length === 1) {
      // Only one item of this type - keep it
      result.push(typeItems[0]);
      continue;
    }
    
    // Multiple items of same type - check for conflicts
    const quantities = new Set(typeItems.map(i => i.quantity));
    
    if (quantities.size === 1) {
      // All same quantity - keep highest confidence one
      const sorted = typeItems.sort((a, b) => {
        const confOrder = { high: 0, medium: 1, low: 2 };
        return confOrder[a.confidence] - confOrder[b.confidence];
      });
      result.push(sorted[0]);
      continue;
    }
    
    // Different quantities - check if they can be combined
    const hasComplementaryContext = checkComplementaryContext(typeItems);
    
    if (hasComplementaryContext) {
      // Items have complementary context (e.g., "1 exterior" + "3 interior")
      // Combine into a single entry
      const combined = combineComplementaryItems(type as UnitItem['type'], typeItems);
      if (combined) {
        result.push(combined);
      }
    }
    // If no complementary context and quantities differ, hide all (don't add to result)
    // This prevents confusing output like "8 Doors" and "3 Doors"
  }
  
  return result.sort((a, b) => {
    if (a.type !== b.type) return a.type.localeCompare(b.type);
    return b.quantity - a.quantity;
  });
}

/**
 * Check if items have complementary context (e.g., "interior doors" + "exterior doors")
 */
function checkComplementaryContext(items: UnitItem[]): boolean {
  const contexts = items.map(i => i.matchedText.toLowerCase());
  
  // Look for complementary pairs
  const complementaryPairs = [
    ['interior', 'exterior'],
    ['entry', 'interior'],
    ['front', 'back'],
    ['patio', 'interior'],
    ['double-hung', 'casement'],
    ['vinyl', 'wood'],
  ];
  
  for (const [a, b] of complementaryPairs) {
    const hasA = contexts.some(c => c.includes(a));
    const hasB = contexts.some(c => c.includes(b));
    if (hasA && hasB) return true;
  }
  
  // Also check if one item has specific context that the other lacks
  // e.g., "3 interior doors" is more specific than "8 doors"
  const specificContexts = ['interior', 'exterior', 'entry', 'patio', 'front', 'back', 'sliding', 'french'];
  const hasSpecific = contexts.some(c => specificContexts.some(s => c.includes(s)));
  const hasGeneric = contexts.some(c => !specificContexts.some(s => c.includes(s)));
  
  // If we have both specific and generic, prefer the specific one (handled in combine)
  return hasSpecific && hasGeneric;
}

/**
 * Combine complementary items into a single entry
 */
function combineComplementaryItems(type: UnitItem['type'], items: UnitItem[]): UnitItem | null {
  // Prefer items with specific context over generic ones
  const specificContexts = ['interior', 'exterior', 'entry', 'patio', 'front', 'back', 'sliding', 'french'];
  
  const specificItems = items.filter(i => 
    specificContexts.some(s => i.matchedText.toLowerCase().includes(s))
  );
  const genericItems = items.filter(i => 
    !specificContexts.some(s => i.matchedText.toLowerCase().includes(s))
  );
  
  // If we have specific items, combine them
  if (specificItems.length > 0) {
    // Check if specific items have complementary contexts (interior + exterior)
    const hasInterior = specificItems.some(i => i.matchedText.toLowerCase().includes('interior'));
    const hasExterior = specificItems.some(i => 
      i.matchedText.toLowerCase().includes('exterior') || i.matchedText.toLowerCase().includes('entry')
    );
    
    if (hasInterior && hasExterior) {
      // Combine interior + exterior
      const totalQuantity = specificItems.reduce((sum, i) => sum + i.quantity, 0);
      const descriptions = specificItems.map(i => {
        const isInterior = i.matchedText.toLowerCase().includes('interior');
        return `${i.quantity} ${isInterior ? 'interior' : 'exterior'}`;
      });
      
      return {
        type,
        quantity: totalQuantity,
        description: `${getDescriptionForType(type, totalQuantity)} (${descriptions.join(', ')})`,
        confidence: 'high',
        matchedText: specificItems.map(i => i.matchedText).join('; ')
      };
    }
    
    // Otherwise, just use the most specific item
    const bestItem = specificItems.sort((a, b) => {
      const confOrder = { high: 0, medium: 1, low: 2 };
      return confOrder[a.confidence] - confOrder[b.confidence];
    })[0];
    return bestItem;
  }
  
  // If only generic items with different quantities, don't combine - return null
  // This signals to hide them
  if (genericItems.length > 1) {
    const quantities = new Set(genericItems.map(i => i.quantity));
    if (quantities.size > 1) {
      return null;
    }
  }
  
  // Return the best generic item if quantities are the same
  return genericItems.sort((a, b) => {
    const confOrder = { high: 0, medium: 1, low: 2 };
    return confOrder[a.confidence] - confOrder[b.confidence];
  })[0] || null;
}
