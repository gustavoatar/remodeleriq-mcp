/**
 * Regex Fallback Extraction
 * Provides robust extraction when AI/Gemini is unavailable
 */

// ============================================
// BID TOTAL EXTRACTION
// ============================================

/**
 * Extract bid total using multiple regex patterns
 * Returns the most likely total based on context and amount
 */
export function extractBidTotalFallback(text: string): number | null {
  const patterns: Array<{ regex: RegExp; priority: number; name: string }> = [
    // Explicit total labels (highest priority)
    { regex: /(?:total|grand\s*total|project\s*total|contract\s*(?:price|amount|total)|balance\s*due|amount\s*due)[:\s]*\$?\s*([\d,]+(?:\.\d{2})?)/gi, priority: 10, name: 'explicit-total' },
    
    // Subtotal/total pairs - grab the larger one
    { regex: /(?:sub\s*-?\s*total)[:\s]*\$?\s*([\d,]+(?:\.\d{2})?)/gi, priority: 5, name: 'subtotal' },
    
    // Amount formats with dollar signs
    { regex: /\$\s*([\d,]+(?:\.\d{2})?)\s*(?:total|due|balance)/gi, priority: 8, name: 'dollar-total' },
    
    // Final payment/balance
    { regex: /(?:final\s*(?:payment|amount|balance)|balance\s*(?:due|owing))[:\s]*\$?\s*([\d,]+(?:\.\d{2})?)/gi, priority: 7, name: 'final-payment' },
    
    // Estimate/quote amount
    { regex: /(?:estimate|quote|bid|proposal)\s*(?:amount|total)?[:\s]*\$?\s*([\d,]+(?:\.\d{2})?)/gi, priority: 6, name: 'estimate' },
    
    // Standalone large dollar amounts (lower priority)
    { regex: /\$\s*([\d,]+(?:\.\d{2})?)/g, priority: 1, name: 'any-dollar' },
  ];
  
  interface Match {
    amount: number;
    priority: number;
    name: string;
  }
  
  const matches: Match[] = [];
  
  for (const { regex, priority, name } of patterns) {
    let match;
    // Reset regex state
    regex.lastIndex = 0;
    
    while ((match = regex.exec(text)) !== null) {
      const amountStr = match[1].replace(/,/g, '');
      const amount = parseFloat(amountStr);
      
      // Filter out unrealistic amounts
      // Too small (likely a unit price or quantity)
      if (amount < 100) continue;
      // Too large (likely a phone number or account number)
      if (amount > 10000000) continue;
      
      matches.push({ amount, priority, name });
    }
  }
  
  if (matches.length === 0) return null;
  
  // Sort by priority (desc), then by amount (desc for same priority)
  matches.sort((a, b) => {
    if (a.priority !== b.priority) return b.priority - a.priority;
    return b.amount - a.amount;
  });
  
  // Return the highest priority match
  // If we have explicit totals, prefer those
  const explicitTotals = matches.filter(m => m.priority >= 6);
  if (explicitTotals.length > 0) {
    // Return the largest explicit total
    return Math.max(...explicitTotals.map(m => m.amount));
  }
  
  // Otherwise return the largest amount found
  return matches[0].amount;
}

// ============================================
// PROJECT TYPE DETECTION
// ============================================

const PROJECT_KEYWORDS: Record<string, string[]> = {
  'Kitchen Remodel': ['kitchen', 'cabinet', 'countertop', 'backsplash', 'appliance', 'cooktop', 'range hood'],
  'Bathroom Remodel': ['bathroom', 'bath', 'shower', 'tub', 'vanity', 'toilet', 'tile'],
  'Roofing': ['roof', 'shingle', 'gutter', 'flashing', 'ridge vent', 'soffit', 'fascia'],
  'Flooring': ['floor', 'hardwood', 'laminate', 'carpet', 'vinyl', 'tile floor', 'lvp', 'lvt'],
  'Painting': ['paint', 'primer', 'wall paint', 'ceiling paint', 'exterior paint', 'interior paint'],
  'Window Replacement': ['window', 'pane', 'double-hung', 'casement', 'vinyl window', 'energy efficient window'],
  'HVAC': ['hvac', 'furnace', 'air condition', 'a/c', 'ductwork', 'heat pump', 'thermostat'],
  'Plumbing': ['plumb', 'pipe', 'water heater', 'drain', 'faucet', 'sewer'],
  'Electrical': ['electric', 'wire', 'outlet', 'panel', 'circuit', 'breaker', 'lighting'],
  'Basement Finishing': ['basement', 'finish basement', 'basement remodel'],
  'Deck/Patio': ['deck', 'patio', 'pergola', 'outdoor living'],
  'Siding': ['siding', 'vinyl siding', 'hardie', 'exterior cladding'],
  'Fence': ['fence', 'fencing', 'gate', 'privacy fence', 'wood fence', 'vinyl fence'],
  'Room Addition': ['addition', 'room addition', 'home addition', 'extension'],
  'Full Home Renovation': ['full renovation', 'whole house', 'complete renovation', 'gut renovation'],
};

/**
 * Detect project type from bid text using keyword matching
 */
export function extractProjectTypeFallback(text: string): string | null {
  const lowerText = text.toLowerCase();
  
  const scores: Record<string, number> = {};
  
  for (const [projectType, keywords] of Object.entries(PROJECT_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      // Count occurrences
      const regex = new RegExp(keyword, 'gi');
      const matchCount = (lowerText.match(regex) || []).length;
      score += matchCount;
    }
    if (score > 0) {
      scores[projectType] = score;
    }
  }
  
  // Find the highest scoring project type
  let maxScore = 0;
  let bestMatch: string | null = null;
  
  for (const [projectType, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestMatch = projectType;
    }
  }
  
  // Require a minimum score to be confident
  return maxScore >= 2 ? bestMatch : null;
}

// ============================================
// SQUARE FOOTAGE EXTRACTION
// ============================================

/**
 * Extract square footage from bid text
 */
export function extractSquareFootageFallback(text: string): number | null {
  const patterns = [
    // Explicit square footage mentions
    /(\d{2,6})\s*(?:sq\.?\s*(?:ft|feet)|square\s*(?:ft|feet|foot|footage))/gi,
    /(?:sq\.?\s*(?:ft|feet)|square\s*(?:ft|feet|foot|footage))[:\s]*(\d{2,6})/gi,
    
    // Area mentions
    /(?:area|space|room)[:\s]*(\d{2,6})\s*(?:sq|sf)/gi,
    
    // Total SF
    /(?:total|approx|approximately)[:\s]*(\d{2,6})\s*(?:sq|sf)/gi,
  ];
  
  const matches: number[] = [];
  
  for (const regex of patterns) {
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const value = parseInt(match[1], 10);
      // Reasonable range for room/project square footage
      if (value >= 50 && value <= 50000) {
        matches.push(value);
      }
    }
  }
  
  if (matches.length === 0) return null;
  
  // Return the most common value, or the largest if all unique
  const counts: Record<number, number> = {};
  for (const val of matches) {
    counts[val] = (counts[val] || 0) + 1;
  }
  
  let maxCount = 0;
  let result = matches[0];
  
  for (const [val, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      result = parseInt(val, 10);
    }
  }
  
  return result;
}

// ============================================
// CONTRACTOR NAME EXTRACTION
// ============================================

/**
 * Extract contractor/company name from bid text
 */
export function extractContractorNameFallback(text: string): string | null {
  const patterns = [
    // Company suffixes
    /([A-Z][A-Za-z\s&]+(?:LLC|Inc|Corp|Co|Ltd|LP|Construction|Contracting|Builders|Renovations|Remodeling|Services|Solutions))/g,
    
    // "From:" or "Prepared by:" patterns
    /(?:from|prepared\s*by|submitted\s*by|contractor)[:\s]*([A-Z][A-Za-z\s&]+(?:LLC|Inc|Construction|Contracting)?)/gi,
    
    // Header company names (often at top)
    /^([A-Z][A-Z\s&]+(?:LLC|INC|CONSTRUCTION|CONTRACTING)?)/m,
  ];
  
  for (const regex of patterns) {
    regex.lastIndex = 0;
    const match = regex.exec(text);
    if (match) {
      const name = match[1].trim();
      // Validate: should be reasonable length
      if (name.length >= 3 && name.length <= 100) {
        // Filter out common false positives
        const lowerName = name.toLowerCase();
        if (!lowerName.includes('estimate') && 
            !lowerName.includes('invoice') &&
            !lowerName.includes('proposal') &&
            !lowerName.includes('total')) {
          return name;
        }
      }
    }
  }
  
  return null;
}

// ============================================
// COMBINED FALLBACK EXTRACTION
// ============================================

export interface FallbackExtractionResult {
  bidTotal: number | null;
  projectType: string | null;
  squareFootage: number | null;
  contractorName: string | null;
  contractorFingerprint: null; // Regex fallback cannot extract full fingerprint
  confidence: {
    bidTotal: 'high' | 'medium' | 'low' | 'none';
    projectType: 'high' | 'medium' | 'low' | 'none';
    squareFootage: 'high' | 'medium' | 'low' | 'none';
    contractorInfo: 'high' | 'medium' | 'low' | 'none';
  };
  extractionMethod: 'fallback-regex';
}

/**
 * Full fallback extraction when AI is unavailable
 */
export function extractAllFallback(text: string): FallbackExtractionResult {
  const bidTotal = extractBidTotalFallback(text);
  const projectType = extractProjectTypeFallback(text);
  const squareFootage = extractSquareFootageFallback(text);
  const contractorName = extractContractorNameFallback(text);
  
  return {
    bidTotal,
    projectType,
    squareFootage,
    contractorName,
    contractorFingerprint: null,
    confidence: {
      bidTotal: bidTotal ? 'medium' : 'none',
      projectType: projectType ? 'medium' : 'none',
      squareFootage: squareFootage ? 'low' : 'none',
      contractorInfo: contractorName ? 'low' : 'none',
    },
    extractionMethod: 'fallback-regex',
  };
}
