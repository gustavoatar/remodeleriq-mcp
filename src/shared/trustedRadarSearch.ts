// Trust Radar keyword search — pure helpers.
//
// These live outside the worker route handler so the parsing rules that depend on
// Google's response formatting can be tested directly. If Google ever changes the
// shape of `formattedAddress` or its place `types`, the tests here fail loudly
// instead of the UI quietly rendering blank city/state lines.

export const KEYWORD_MIN_LENGTH = 3;
export const KEYWORD_MAX_LENGTH = 120;

// Google place types -> our trade ids, for tagging keyword results.
export const PLACE_TYPE_TO_TRADE: Record<string, string> = {
  painter: 'painter',
  carpenter: 'carpenter',
  plumber: 'plumber',
  electrician: 'electrician',
  handyman: 'handyman',
  general_contractor: 'general_contractor',
  hvac_contractor: 'hvac',
  roofing_contractor: 'roofing',
  landscaper: 'landscaper',
  lawn_care_service: 'landscaper',
  gardener: 'landscaper',
};

/**
 * Strip control characters and surrounding whitespace from a user-supplied query.
 * The result is sent to Google as a JSON value and is never interpolated into SQL,
 * so this is hygiene plus a length bound for cost control — not an injection defense.
 */
export function sanitizeKeywordQuery(raw: string | undefined | null): string {
  // eslint-disable-next-line no-control-regex -- matching control characters is the point
  return (raw || '').replace(/[\u0000-\u001F\u007F]/g, '').trim();
}

export function isValidKeywordQuery(q: string): boolean {
  return q.length >= KEYWORD_MIN_LENGTH && q.length <= KEYWORD_MAX_LENGTH;
}

export function isValidZip(zip: string): boolean {
  return /^\d{5}$/.test(zip);
}

export interface ParsedPlaceAddress {
  address: string | null;
  city: string | null;
  stateCode: string | null;
  zipCode: string | null;
}

/**
 * Pull street / city / state / ZIP out of a Google `formattedAddress`.
 *
 * Google's US shape is "123 Main St, Marietta, GA 30060, USA", but the trailing
 * ", USA" is not guaranteed, so the state/ZIP segment is located by pattern rather
 * than by a fixed offset from the end. Anything unparseable degrades to null so the
 * card simply omits that line.
 */
export function parsePlaceAddress(
  formattedAddress: string | undefined | null,
  fallbackZip?: string | null
): ParsedPlaceAddress {
  const parts = (formattedAddress || '')
    .split(',')
    .map(p => p.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return { address: null, city: null, stateCode: null, zipCode: fallbackZip || null };
  }

  // Find the "GA 30060" segment wherever it sits, rather than assuming it is
  // second-to-last — that assumption breaks when ", USA" is absent.
  let stateCode: string | null = null;
  let zipCode: string | null = null;
  let stateZipIndex = -1;

  for (let i = parts.length - 1; i >= 0; i--) {
    const match = parts[i].match(/^([A-Z]{2})\s+(\d{5})(?:-\d{4})?$/);
    if (match) {
      stateCode = match[1];
      zipCode = match[2];
      stateZipIndex = i;
      break;
    }
  }

  // Some results carry a state with no ZIP ("Atlanta, GA").
  if (stateZipIndex === -1) {
    for (let i = parts.length - 1; i >= 0; i--) {
      if (/^[A-Z]{2}$/.test(parts[i])) {
        stateCode = parts[i];
        stateZipIndex = i;
        break;
      }
    }
  }

  // City is the segment immediately before the state/ZIP one.
  const city = stateZipIndex > 0 ? parts[stateZipIndex - 1] : (parts.length > 1 ? parts[1] : null);

  // A single-segment address is a bare business locality, not a street address.
  const address = parts.length > 1 && stateZipIndex !== 0 ? parts[0] : null;

  return {
    address,
    city: city || null,
    stateCode,
    zipCode: zipCode || fallbackZip || null,
  };
}

// Business-name keywords per trade. Two consumers:
//  1. isValidTradeMatch — does a cached ZIP-search row still belong to the trade
//     bucket it was cached under (catches stale/misclassified entries).
//  2. resolveTradesForKeywordSearch — does a keyword-search result belong to any
//     of the 9 trades at all, when Google's own place `types` don't say so.
// Every RADAR_TRADE_CATEGORIES id (src/shared/trustedRadarTypes.ts) needs an entry
// here, or isValidTradeMatch silently stops validating it (see the `!keywords`
// bail-out below) and resolveTradesForKeywordSearch can never recognize it by name.
export const TRADE_BUSINESS_KEYWORDS: Record<string, string[]> = {
  landscaper: ['landscape', 'landscaping', 'lawn', 'yard', 'garden', 'outdoor', 'tree', 'turf', 'grass', 'mowing', 'greenscape'],
  painter: ['paint', 'painting', 'coatings'],
  plumber: ['plumb', 'plumbing', 'pipe', 'drain'],
  electrician: ['electric', 'electrical', 'wiring'],
  hvac: ['hvac', 'heating', 'cooling', 'air conditioning', 'ac ', 'a/c'],
  roofing: ['roof', 'roofing', 'shingle'],
  carpenter: ['carpenter', 'carpentry', 'cabinetry', 'woodwork', 'framing'],
  handyman: ['handyman', 'handy man', 'home repair'],
  general_contractor: ['general contractor', 'contracting', 'contractor', 'construction', 'remodeling', 'renovation', 'builders'],
};

/**
 * Does a cached contractor's business name still look like the given trade?
 * Used to filter stale D1 rows (e.g. a construction company that slipped into
 * landscaper results) out of the ZIP-search cache. Trades with no keyword list
 * pass unconditionally — there's nothing to validate against.
 */
export function isValidTradeMatch(businessName: string, trade: string): boolean {
  const keywords = TRADE_BUSINESS_KEYWORDS[trade];
  if (!keywords) return true;
  const nameLower = businessName.toLowerCase();
  return keywords.some(kw => nameLower.includes(kw));
}

/**
 * Resolve which of the 9 recognized trades a keyword-search result belongs to.
 *
 * Google's own place `types` are the authoritative signal when present. Business
 * name keywords are the fallback for results Google tagged generically (or not at
 * all). An empty return means neither signal recognized a trade — the caller
 * should drop the result rather than show it, since a free-text Google search
 * surfaces plenty of non-contractor businesses (pool cleaners, movers, retailers)
 * that would otherwise pollute what's supposed to be a contractor lookup.
 */
export function resolveTradesForKeywordSearch(
  businessName: string,
  placeTypes: string[] | undefined | null
): string[] {
  const structural = [...new Set(
    (placeTypes || [])
      .map(t => PLACE_TYPE_TO_TRADE[t])
      .filter((t): t is string => !!t)
  )];

  if (structural.length > 0) return structural;

  const nameLower = businessName.toLowerCase();
  return Object.entries(TRADE_BUSINESS_KEYWORDS)
    .filter(([, keywords]) => keywords.some(kw => nameLower.includes(kw)))
    .map(([trade]) => trade);
}
