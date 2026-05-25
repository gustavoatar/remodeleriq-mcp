/**
 * Smart ZIP code detection for contractor bids
 * Prioritizes ZIP codes in address contexts over random 5-digit numbers
 */

// Common US state abbreviations
const STATE_ABBREVS = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];

// State abbreviation pattern: AL|AK|AZ|...
const statePattern = STATE_ABBREVS.join('|');

interface ZipMatch {
  zip: string;
  confidence: 'high' | 'medium' | 'low';
  context: string;
}

/**
 * Extract ZIP code from bid text with smart prioritization
 * Returns the most likely project/property ZIP code
 */
export function detectProjectZip(text: string, defaultZip: string = '30301'): string {
  const matches = findAllZipCandidates(text);
  
  // Return highest confidence match, or default if none found
  if (matches.length === 0) {
    return defaultZip;
  }
  
  // Sort by confidence: high > medium > low
  const confidenceOrder = { high: 3, medium: 2, low: 1 };
  matches.sort((a, b) => confidenceOrder[b.confidence] - confidenceOrder[a.confidence]);
  
  return matches[0].zip;
}

/**
 * Find all ZIP code candidates with confidence scoring
 */
export function findAllZipCandidates(text: string): ZipMatch[] {
  const matches: ZipMatch[] = [];
  const seenZips = new Set<string>();
  
  // HIGH CONFIDENCE: ZIP after state abbreviation
  // Pattern: "GA 30301" or "GA, 30301" or "Georgia, 30301"
  const stateZipPattern = new RegExp(
    `(?:${statePattern}|Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New\\s*Hampshire|New\\s*Jersey|New\\s*Mexico|New\\s*York|North\\s*Carolina|North\\s*Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode\\s*Island|South\\s*Carolina|South\\s*Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West\\s*Virginia|Wisconsin|Wyoming)[,\\s]+([0-9]{5})(?:-[0-9]{4})?\\b`,
    'gi'
  );
  
  let match;
  while ((match = stateZipPattern.exec(text)) !== null) {
    const zip = match[1];
    if (!seenZips.has(zip) && isValidZip(zip)) {
      matches.push({ zip, confidence: 'high', context: match[0].substring(0, 50) });
      seenZips.add(zip);
    }
  }
  
  // HIGH CONFIDENCE: ZIP in project/property/job address context
  const projectAddressPattern = /(?:project|property|job|site|service|work|installation)\s*(?:address|location|site)?[:\s]*[^\n]*?(\d{5})(?:-\d{4})?\b/gi;
  while ((match = projectAddressPattern.exec(text)) !== null) {
    const zip = match[1];
    if (!seenZips.has(zip) && isValidZip(zip)) {
      matches.push({ zip, confidence: 'high', context: match[0].substring(0, 50) });
      seenZips.add(zip);
    }
  }
  
  // MEDIUM CONFIDENCE: ZIP after street address patterns
  // Pattern: "123 Main St, Atlanta, GA 30301" or "123 Main Street Atlanta GA 30301"
  const streetAddressPattern = /\d+\s+[\w\s]+(?:st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive|ln|lane|way|ct|court|pl|place|circle|cir)\b[,.\s]+[\w\s]+[,.\s]+(?:${statePattern})[,.\s]+(\d{5})(?:-\d{4})?\b/gi;
  while ((match = streetAddressPattern.exec(text)) !== null) {
    const zip = match[1];
    if (!seenZips.has(zip) && isValidZip(zip)) {
      matches.push({ zip, confidence: 'medium', context: match[0].substring(0, 50) });
      seenZips.add(zip);
    }
  }
  
  // MEDIUM CONFIDENCE: City + State + ZIP patterns
  // Pattern: "Atlanta, GA 30301" - city name followed by state and zip
  const cityStateZipPattern = new RegExp(
    `([A-Z][a-zA-Z\\s]+)[,\\s]+(${statePattern})[,\\s]+([0-9]{5})(?:-[0-9]{4})?\\b`,
    'gi'
  );
  while ((match = cityStateZipPattern.exec(text)) !== null) {
    const zip = match[3];
    if (!seenZips.has(zip) && isValidZip(zip)) {
      matches.push({ zip, confidence: 'medium', context: match[0].substring(0, 50) });
      seenZips.add(zip);
    }
  }
  
  // LOW CONFIDENCE: Any 5-digit number that looks like a ZIP
  // But exclude obvious non-ZIPs: phone numbers, dollar amounts, percentages, invoice numbers
  const genericZipPattern = /\b(\d{5})(?:-\d{4})?\b/g;
  while ((match = genericZipPattern.exec(text)) !== null) {
    const zip = match[1];
    const context = text.substring(Math.max(0, match.index - 20), match.index + 15);
    
    // Skip if already found
    if (seenZips.has(zip)) continue;
    
    // Skip invalid ZIP ranges
    if (!isValidZip(zip)) continue;
    
    // Skip if preceded by phone number patterns (area code)
    if (/\(\d{3}\)\s*$/.test(text.substring(Math.max(0, match.index - 10), match.index))) continue;
    if (/\d{3}[-.\s]$/.test(text.substring(Math.max(0, match.index - 10), match.index))) continue;
    
    // Skip if followed by phone extension pattern
    if (/^\d{5}[-.\s]*\d{4}$/.test(match[0]) === false && /^\d{4}/.test(text.substring(match.index + 5, match.index + 10))) continue;
    
    // Skip if preceded by $ (dollar amount)
    if (/\$\s*$/.test(text.substring(Math.max(0, match.index - 5), match.index))) continue;
    
    // Skip if preceded by # or Invoice/Order/PO (invoice numbers)
    if (/#\s*$/.test(text.substring(Math.max(0, match.index - 5), match.index))) continue;
    if (/(?:invoice|order|po|ref|id|number|no|job)\s*[:#]?\s*$/i.test(text.substring(Math.max(0, match.index - 15), match.index))) continue;
    
    // Skip if followed by % (percentage)
    if (/^%/.test(text.substring(match.index + 5, match.index + 8))) continue;
    
    matches.push({ zip, confidence: 'low', context });
    seenZips.add(zip);
  }
  
  return matches;
}

/**
 * Check if ZIP code is in a valid US range
 * Valid ZIPs: 00501-99950 (excludes 00000-00500 which aren't real)
 */
function isValidZip(zip: string): boolean {
  const num = parseInt(zip, 10);
  
  // 00000-00500 don't exist
  if (num < 501) return false;
  
  // Check if in a valid range (some ranges are unassigned but we allow them for flexibility)
  // Valid regions: 00501-99950
  if (num > 99950) return false;
  
  return true;
}

/**
 * For backwards compatibility - extract first ZIP from text
 */
export function extractZipCode(text: string): string | null {
  const match = text.match(/\b(\d{5})(?:-\d{4})?\b/);
  return match ? match[1] : null;
}
