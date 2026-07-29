/**
 * Trust Radar Keyword Search — Helper Tests
 *
 * Covers the pure logic behind /api/trusted-radar/keyword-search:
 * - query sanitization and length bounds
 * - ZIP validation
 * - parsing Google `formattedAddress` into street/city/state/ZIP
 * - resolving a result to one of the 9 recognized trades (or excluding it)
 *
 * The address parser is the highest-risk piece: it depends on Google's formatting,
 * which is not contractual. These cases pin the shapes we actually see so a change
 * fails here instead of silently rendering blank "City, ST" lines on result cards.
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizeKeywordQuery,
  isValidKeywordQuery,
  isValidZip,
  parsePlaceAddress,
  resolveTradesForKeywordSearch,
  isValidTradeMatch,
  TRADE_BUSINESS_KEYWORDS,
  KEYWORD_MIN_LENGTH,
  KEYWORD_MAX_LENGTH,
} from '@/shared/trustedRadarSearch';
import { RADAR_TRADE_CATEGORIES } from '@/shared/trustedRadarTypes';

// ============================================
// QUERY SANITIZATION
// ============================================

describe('sanitizeKeywordQuery', () => {
  it('should trim surrounding whitespace', () => {
    expect(sanitizeKeywordQuery('  ABC Roofing  ')).toBe('ABC Roofing');
  });

  it('should strip control characters', () => {
    const dirty = 'ABC' + String.fromCharCode(0) + ' Roof' + String.fromCharCode(31) + 'ing' + String.fromCharCode(127);
    expect(sanitizeKeywordQuery(dirty)).toBe('ABC Roofing');
  });

  it('should preserve internal spaces and punctuation in business names', () => {
    expect(sanitizeKeywordQuery("O'Brien & Sons Roofing, LLC")).toBe("O'Brien & Sons Roofing, LLC");
  });

  it('should handle undefined and null without throwing', () => {
    expect(sanitizeKeywordQuery(undefined)).toBe('');
    expect(sanitizeKeywordQuery(null)).toBe('');
  });

  it('should reduce a whitespace-only query to empty', () => {
    expect(sanitizeKeywordQuery('   \t  ')).toBe('');
  });
});

describe('isValidKeywordQuery', () => {
  it('should reject queries below the minimum length', () => {
    expect(isValidKeywordQuery('')).toBe(false);
    expect(isValidKeywordQuery('ab')).toBe(false);
  });

  it('should accept a query at exactly the minimum length', () => {
    expect(isValidKeywordQuery('a'.repeat(KEYWORD_MIN_LENGTH))).toBe(true);
  });

  it('should accept a query at exactly the maximum length', () => {
    expect(isValidKeywordQuery('a'.repeat(KEYWORD_MAX_LENGTH))).toBe(true);
  });

  it('should reject a query past the maximum length', () => {
    expect(isValidKeywordQuery('a'.repeat(KEYWORD_MAX_LENGTH + 1))).toBe(false);
  });

  it('should accept a realistic business name', () => {
    expect(isValidKeywordQuery('ABC Roofing & Exteriors')).toBe(true);
  });
});

describe('isValidZip', () => {
  it('should accept a 5-digit ZIP', () => {
    expect(isValidZip('30076')).toBe(true);
    expect(isValidZip('00501')).toBe(true);
  });

  it('should reject non-numeric, short, and long values', () => {
    expect(isValidZip('abcde')).toBe(false);
    expect(isValidZip('123')).toBe(false);
    expect(isValidZip('300761')).toBe(false);
    expect(isValidZip('')).toBe(false);
  });

  it('should reject ZIP+4, which the UI never sends', () => {
    expect(isValidZip('30076-1234')).toBe(false);
  });
});

// ============================================
// ADDRESS PARSING
// ============================================

describe('parsePlaceAddress', () => {
  it('should parse the standard US shape with trailing country', () => {
    expect(parsePlaceAddress('123 Main St, Marietta, GA 30060, USA')).toEqual({
      address: '123 Main St',
      city: 'Marietta',
      stateCode: 'GA',
      zipCode: '30060',
    });
  });

  it('should parse when the trailing country is absent', () => {
    // The old fixed-offset approach broke on this shape, blanking city and state.
    expect(parsePlaceAddress('123 Main St, Marietta, GA 30060')).toEqual({
      address: '123 Main St',
      city: 'Marietta',
      stateCode: 'GA',
      zipCode: '30060',
    });
  });

  it('should parse a suite/unit in the street segment', () => {
    expect(parsePlaceAddress('120 Peachtree St NE Suite 200, Atlanta, GA 30303, USA')).toEqual({
      address: '120 Peachtree St NE Suite 200',
      city: 'Atlanta',
      stateCode: 'GA',
      zipCode: '30303',
    });
  });

  it('should take the 5-digit portion of a ZIP+4', () => {
    expect(parsePlaceAddress('500 Oak Ave, Dallas, TX 75201-4321, USA')).toMatchObject({
      stateCode: 'TX',
      zipCode: '75201',
    });
  });

  it('should handle a state with no ZIP', () => {
    expect(parsePlaceAddress('900 Elm St, Seattle, WA')).toMatchObject({
      city: 'Seattle',
      stateCode: 'WA',
    });
  });

  it('should fall back to the searched ZIP when the address has none', () => {
    expect(parsePlaceAddress('900 Elm St, Seattle, WA', '98101').zipCode).toBe('98101');
  });

  it('should prefer the ZIP in the address over the searched ZIP', () => {
    // A national search biased to Atlanta can return a Dallas business; the card
    // must show the business's own ZIP, not the one the user typed.
    expect(parsePlaceAddress('500 Oak Ave, Dallas, TX 75201, USA', '30301').zipCode).toBe('75201');
  });

  it('should degrade to nulls on an unparseable address rather than throwing', () => {
    expect(parsePlaceAddress('Somewhere Unknown')).toEqual({
      address: null,
      city: null,
      stateCode: null,
      zipCode: null,
    });
  });

  it('should handle empty, undefined, and null input', () => {
    const empty = { address: null, city: null, stateCode: null, zipCode: null };
    expect(parsePlaceAddress('')).toEqual(empty);
    expect(parsePlaceAddress(undefined)).toEqual(empty);
    expect(parsePlaceAddress(null)).toEqual(empty);
  });

  it('should tolerate extra whitespace and empty segments', () => {
    expect(parsePlaceAddress('  123 Main St ,, Marietta ,  GA 30060 , USA ')).toEqual({
      address: '123 Main St',
      city: 'Marietta',
      stateCode: 'GA',
      zipCode: '30060',
    });
  });

  it('should not mistake a street number for a ZIP', () => {
    expect(parsePlaceAddress('30060 Highway 41, Marietta, GA 30060, USA')).toEqual({
      address: '30060 Highway 41',
      city: 'Marietta',
      stateCode: 'GA',
      zipCode: '30060',
    });
  });
});

// ============================================
// TRADE RESOLUTION — keyword-search relevance filtering
// ============================================

describe('resolveTradesForKeywordSearch', () => {
  it('should map known Google contractor types to our trade ids', () => {
    expect(resolveTradesForKeywordSearch('Any Name', ['roofing_contractor'])).toEqual(['roofing']);
    expect(resolveTradesForKeywordSearch('Any Name', ['hvac_contractor'])).toEqual(['hvac']);
    expect(resolveTradesForKeywordSearch('Any Name', ['plumber'])).toEqual(['plumber']);
    expect(resolveTradesForKeywordSearch('Any Name', ['electrician'])).toEqual(['electrician']);
  });

  it('should collapse several landscaping types to one trade', () => {
    expect(resolveTradesForKeywordSearch('Any Name', ['landscaper', 'lawn_care_service', 'gardener'])).toEqual(['landscaper']);
  });

  it('should ignore unrelated Google types alongside a real one', () => {
    expect(resolveTradesForKeywordSearch('Any Name', ['point_of_interest', 'establishment', 'plumber'])).toEqual(['plumber']);
  });

  it('should keep multiple distinct trades from structural types', () => {
    expect(resolveTradesForKeywordSearch('Any Name', ['plumber', 'hvac_contractor'])).toEqual(['plumber', 'hvac']);
  });

  it('should fall back to a business-name keyword when types are generic', () => {
    // Google often tags small local businesses with only generic types.
    expect(resolveTradesForKeywordSearch('ABC Roofing & Repair', ['point_of_interest', 'establishment'])).toEqual(['roofing']);
  });

  it('should prefer the structural type over a conflicting name keyword', () => {
    // Google's own classification wins even if the name suggests something else.
    expect(resolveTradesForKeywordSearch('Ace Electric Plumbing Co', ['plumber'])).toEqual(['plumber']);
  });

  it('should exclude a result that matches no trade by type or name — the core fix', () => {
    // A free-text Google search surfaces non-contractor businesses too; those
    // must be dropped rather than tagged 'general' and shown anyway.
    expect(resolveTradesForKeywordSearch('Joe\'s Ice Cream Shop', ['point_of_interest', 'establishment'])).toEqual([]);
  });

  it('should exclude when types and name are both empty/missing', () => {
    expect(resolveTradesForKeywordSearch('Mystery LLC', [])).toEqual([]);
    expect(resolveTradesForKeywordSearch('Mystery LLC', undefined)).toEqual([]);
    expect(resolveTradesForKeywordSearch('Mystery LLC', null)).toEqual([]);
  });

  it('should match business-name keywords case-insensitively', () => {
    expect(resolveTradesForKeywordSearch('ATLANTA ROOFING SPECIALISTS', [])).toEqual(['roofing']);
  });

  it('should recognize every one of the 9 canonical trades by name alone', () => {
    // Locks resolveTradesForKeywordSearch to RADAR_TRADE_CATEGORIES: if a trade is
    // added there without a TRADE_BUSINESS_KEYWORDS entry, this fails loudly.
    for (const category of RADAR_TRADE_CATEGORIES) {
      if (category.id === 'all') continue;
      const keyword = TRADE_BUSINESS_KEYWORDS[category.id]?.[0];
      expect(keyword, `missing TRADE_BUSINESS_KEYWORDS entry for "${category.id}"`).toBeTruthy();
      const result = resolveTradesForKeywordSearch(`Test ${keyword} Business`, []);
      expect(result, `"${category.id}" not recognized via keyword "${keyword}"`).toContain(category.id);
    }
  });
});

describe('isValidTradeMatch', () => {
  it('should match when a keyword is present in the business name', () => {
    expect(isValidTradeMatch('ABC Roofing Co', 'roofing')).toBe(true);
    expect(isValidTradeMatch('Metro Plumbing Services', 'plumber')).toBe(true);
  });

  it('should reject when no keyword matches a trade that has a keyword list', () => {
    expect(isValidTradeMatch('ABC Roofing Co', 'plumber')).toBe(false);
  });

  it('should match case-insensitively', () => {
    expect(isValidTradeMatch('METRO ROOFING LLC', 'roofing')).toBe(true);
  });

  it('should pass unconditionally for a trade with no keyword list defined', () => {
    expect(isValidTradeMatch('Literally Anything', 'not-a-real-trade')).toBe(true);
  });
});

describe('TRADE_BUSINESS_KEYWORDS completeness', () => {
  it('should define at least one keyword for every non-"all" RADAR_TRADE_CATEGORIES id', () => {
    for (const category of RADAR_TRADE_CATEGORIES) {
      if (category.id === 'all') continue;
      expect(TRADE_BUSINESS_KEYWORDS[category.id]?.length, `"${category.id}" has no keywords`).toBeGreaterThan(0);
    }
  });
});
