/**
 * State-specific construction and home improvement laws
 * Sources: 
 * - FindLaw: https://www.findlaw.com/realestate/construction-defects/construction-defect-laws-by-state.html
 * - BF Law Office: https://bflawoffice.com/blog/four-critical-clauses-to-include-in-your-home-improvement-contract/
 */

export interface StateLaw {
  state: string;
  stateCode: string;
  licenseThreshold: number; // Dollar amount above which contractor must be licensed
  maxDeposit: number; // Maximum allowed deposit percentage
  
  // Statutes of Limitation
  contractsLimitation: string;
  propertyDamageLimitation: string;
  personalInjuryLimitation: string;
  
  // Statute of Repose (outer deadline regardless of discovery)
  statuteOfRepose: string;
  
  // Right to Cure - must notify contractor before suing?
  rightToCure: boolean;
  rightToCureDetails: string;
  
  // Applicable statutes
  statutes: string[];
  
  // Consumer protection agency
  consumerProtectionUrl: string;
  licenseVerifyUrl: string;
  
  // Key things homeowners should know
  keyPoints: string[];
  
  // Deposit rules
  depositRules: string;
  
  // Cancellation rights
  cancellationRights: string;
}

export const STATE_LAWS: Record<string, StateLaw> = {
  GA: {
    state: 'Georgia',
    stateCode: 'GA',
    licenseThreshold: 2500,
    maxDeposit: 33, // Georgia allows up to 1/3 (33%)
    
    contractsLimitation: '6 years from discovery',
    propertyDamageLimitation: '4 years from discovery',
    personalInjuryLimitation: '2 years from discovery',
    
    statuteOfRepose: '8 years after substantial completion (may extend 2 years for injuries in 7th-8th year)',
    
    rightToCure: false,
    rightToCureDetails: 'Georgia does NOT require you to notify the contractor before filing a lawsuit—you can proceed directly to litigation.',
    
    statutes: ['§9-3-24', '§9-3-33', '§9-3-32', '§9-3-51'],
    
    consumerProtectionUrl: 'https://consumer.georgia.gov/',
    licenseVerifyUrl: 'https://goals.sos.ga.gov/GASOSOneStop/s/licensee-search',
    
    keyPoints: [
      'Contractors MUST be licensed for jobs over $2,500',
      'Get the GA Residential Basic Contractor (GRBC) license number and verify it',
      'Deposits over 33% are a red flag (not explicitly illegal, but risky)',
      'You have 3 business days to cancel a contract signed in your home',
      'Written contracts required for jobs over $2,500',
      'Contractor must carry liability insurance'
    ],
    
    depositRules: 'Georgia does not cap deposits by law, but consumer protection experts recommend no more than 25-33%. Deposits over 50% are a major red flag.',
    
    cancellationRights: 'Under Federal FTC rules, you have 3 business days to cancel any home improvement contract signed in your home or at a location other than the contractor\'s normal place of business.'
  },
  
  CA: {
    state: 'California',
    stateCode: 'CA',
    licenseThreshold: 500,
    maxDeposit: 10, // California limits to $1,000 or 10%, whichever is less
    
    contractsLimitation: '4 years from breach',
    propertyDamageLimitation: '3 years from discovery',
    personalInjuryLimitation: '2 years from discovery',
    
    statuteOfRepose: '10 years for latent defects; 4 years for patent defects',
    
    rightToCure: true,
    rightToCureDetails: 'California requires pre-litigation notice under the "Right to Repair Act" (SB 800) for residential construction defects.',
    
    statutes: ['Civil Code §896', 'Civil Code §337', 'CCP §337.1'],
    
    consumerProtectionUrl: 'https://www.dca.ca.gov/',
    licenseVerifyUrl: 'https://www.cslb.ca.gov/OnlineServices/CheckLicenseII/CheckLicense.aspx',
    
    keyPoints: [
      'Contractors MUST be licensed for jobs over $500 (including labor and materials)',
      'Deposits CANNOT exceed $1,000 or 10% of contract price, whichever is LESS',
      'Must receive written contract for jobs over $500',
      'Contractor must give you a "Notice to Owner" about mechanics liens',
      '3 business days to cancel contracts signed at home',
      'Progress payments can\'t exceed value of work completed'
    ],
    
    depositRules: 'California law strictly limits deposits to $1,000 or 10% of the contract price, whichever is LESS. Asking for more is illegal.',
    
    cancellationRights: 'You have 3 business days to cancel. Contract must include cancellation notice in same language as contract.'
  },
  
  FL: {
    state: 'Florida',
    stateCode: 'FL',
    licenseThreshold: 1000,
    maxDeposit: 10, // Florida recommends 10% max
    
    contractsLimitation: '5 years',
    propertyDamageLimitation: '4 years',
    personalInjuryLimitation: '4 years',
    
    statuteOfRepose: '10 years from completion, possession, or abandonment',
    
    rightToCure: true,
    rightToCureDetails: 'Florida requires 60-day pre-suit notice under Chapter 558 before filing construction defect litigation.',
    
    statutes: ['F.S. §558', 'F.S. §95.11'],
    
    consumerProtectionUrl: 'https://www.myfloridalegal.com/consumer-protection',
    licenseVerifyUrl: 'https://www.myfloridalicense.com/wl11.asp',
    
    keyPoints: [
      'All contractors must be licensed in Florida',
      'Contractor must pull permits (not homeowner) for most jobs',
      '60-day notice required before suing for defects',
      'Ask for certificate of insurance before work begins',
      '3 business days to cancel contracts signed at home',
      'Get everything in writing—oral contracts hard to enforce'
    ],
    
    depositRules: 'Florida does not cap deposits by law, but 10% is standard. Be wary of contractors asking for more than 20% upfront.',
    
    cancellationRights: 'Standard 3 business day FTC cancellation right for contracts signed at home.'
  },
  
  TX: {
    state: 'Texas',
    stateCode: 'TX',
    licenseThreshold: 0, // No state license requirement (local may vary)
    maxDeposit: 33,
    
    contractsLimitation: '4 years',
    propertyDamageLimitation: '2 years',
    personalInjuryLimitation: '2 years',
    
    statuteOfRepose: '10 years from substantial completion',
    
    rightToCure: true,
    rightToCureDetails: 'Texas RCLA (Residential Construction Liability Act) requires 60-day notice before filing a lawsuit.',
    
    statutes: ['Property Code Chapter 27', 'CPRC §16.008'],
    
    consumerProtectionUrl: 'https://www.texasattorneygeneral.gov/consumer-protection',
    licenseVerifyUrl: 'N/A - Check local city/county requirements',
    
    keyPoints: [
      'No state contractor license required (check local city/county)',
      'Homeowner must notify contractor 60 days before suing (RCLA)',
      'Get proof of insurance and bonding',
      'Written contract strongly recommended',
      'Verify any claimed licenses through city/county',
      '3 business days to cancel contracts signed at home'
    ],
    
    depositRules: 'No state limits. Industry standard is 10-33%. Avoid contractors demanding more than 33%.',
    
    cancellationRights: 'Standard 3 business day FTC cancellation right.'
  },
  
  MI: {
    state: 'Michigan',
    stateCode: 'MI',
    licenseThreshold: 600,
    maxDeposit: 33,
    
    contractsLimitation: '6 years from breach',
    propertyDamageLimitation: '3 years from discovery',
    personalInjuryLimitation: '3 years from discovery',
    
    statuteOfRepose: '6 years after completion for defects',
    
    rightToCure: false,
    rightToCureDetails: 'Michigan does not have a mandatory right to cure statute for residential construction.',
    
    statutes: ['MCL §339.2401', 'MCL §600.5805'],
    
    consumerProtectionUrl: 'https://www.michigan.gov/ag/consumer-protection',
    licenseVerifyUrl: 'https://www.michigan.gov/lara/bureau-list/bcc/licensee-search',
    
    keyPoints: [
      'Contractors MUST be licensed for residential work over $600',
      'Verify license through LARA (Licensing and Regulatory Affairs)',
      'Written contracts required for home improvement work',
      '3 business days to cancel contracts signed at home',
      'Contractor must carry liability insurance and workers\' compensation',
      'Mechanic\'s lien rights exist - get lien waivers with payments'
    ],
    
    depositRules: 'Michigan does not cap deposits by law, but consumer protection recommends no more than 25-33%. Large upfront deposits are a red flag.',
    
    cancellationRights: 'Standard 3 business day FTC cancellation right for contracts signed at home or away from contractor\'s normal place of business.'
  },
  
  NY: {
    state: 'New York',
    stateCode: 'NY',
    licenseThreshold: 0, // No state license (local licensing applies)
    maxDeposit: 33,
    
    contractsLimitation: '6 years',
    propertyDamageLimitation: '3 years',
    personalInjuryLimitation: '3 years',
    
    statuteOfRepose: 'None specified at state level',
    
    rightToCure: false,
    rightToCureDetails: 'New York does not have a mandatory right to cure statute.',
    
    statutes: ['General Business Law §771', 'CPLR §214'],
    
    consumerProtectionUrl: 'https://dos.ny.gov/consumer-protection',
    licenseVerifyUrl: 'Check local city/county (NYC: https://www.nyc.gov/dob)',
    
    keyPoints: [
      'Home improvement contractors must be registered in most areas',
      'NYC requires specific licensing through Dept of Buildings',
      'Written contract REQUIRED for jobs over $500',
      'Contract must include contractor\'s name, address, phone, license #',
      'Must provide notice of your 3-day cancellation rights',
      'Contractor cannot demand payment until work is satisfactorily completed'
    ],
    
    depositRules: 'NYC caps deposits at 1/3 of contract price. Other areas: avoid more than 1/3 upfront.',
    
    cancellationRights: 'Three business days to cancel. Contractor must provide two copies of cancellation form.'
  }
};

/**
 * Four Critical Contract Clauses (Based on BF Law Office guidance)
 * Every home improvement contract should address these areas
 */
export interface ContractClause {
  id: string;
  title: string;
  description: string;
  whyItMatters: string;
  whatToLookFor: string[];
  redFlags: string[];
  sampleLanguage: string;
}

export const CRITICAL_CONTRACT_CLAUSES: ContractClause[] = [
  {
    id: 'payment-terms',
    title: 'Payment Terms',
    description: 'Specifies total cost, deposit amount, and payment schedule tied to project milestones.',
    whyItMatters: 'Prevents payment disputes and protects you from paying for incomplete work. Home improvement projects are expensive—clear payment terms ensure you maintain leverage throughout the project.',
    whatToLookFor: [
      'Total contract price clearly stated',
      'Deposit amount (should be 10-25% max in most states)',
      'Milestone-based payments tied to completed work phases',
      'Final payment held until punch list completion',
      'Clear process for approving any overages'
    ],
    redFlags: [
      '50% or more upfront deposit',
      'Full payment due before completion',
      'No clear payment schedule',
      'Payment due on arbitrary dates (not milestones)',
      'No process for change order approval'
    ],
    sampleLanguage: 'Payment Schedule: 10% deposit upon signing; 30% upon demolition completion; 30% upon rough-in inspection approval; 20% upon finishes installed; 10% upon final walkthrough and punch list completion.'
  },
  {
    id: 'dispute-resolution',
    title: 'Dispute Resolution',
    description: 'Outlines how disagreements will be handled, including mediation, arbitration, or litigation options.',
    whyItMatters: 'Gives you flexibility in how disputes are resolved. Binding arbitration clauses can limit your options. Including attorney\'s fees provisions makes it worthwhile to pursue contract violations.',
    whatToLookFor: [
      'Mediation as first step (cheaper than litigation)',
      'Choice between arbitration and court',
      'Attorney\'s fees provision (prevailing party)',
      'Clear venue (where disputes are heard)',
      'Reasonable timeframes for resolution'
    ],
    redFlags: [
      'Mandatory binding arbitration (limits your rights)',
      'Contractor chooses arbitrator',
      'No mention of dispute resolution',
      'Waiver of right to sue',
      'Disputes must be handled in contractor\'s home state'
    ],
    sampleLanguage: 'In the event of dispute, parties agree to attempt mediation. If mediation fails, either party may pursue litigation in [County] Superior Court. The prevailing party shall be entitled to reasonable attorney\'s fees.'
  },
  {
    id: 'unexpected-costs',
    title: 'Damage, Theft & Unexpected Costs',
    description: 'Clarifies who is responsible for unforeseen circumstances, damage during construction, and material theft.',
    whyItMatters: 'Prevents finger-pointing when something goes wrong. Without clear language, you could be stuck paying for problems that weren\'t your fault.',
    whatToLookFor: [
      'Contractor responsible for damage to existing property',
      'Contractor carries liability insurance',
      'Clear process for discovering hidden issues (rot, mold, wiring)',
      'Written approval required before proceeding with extras',
      'Material storage and security responsibility'
    ],
    redFlags: [
      'Homeowner responsible for all unforeseen conditions',
      'No mention of insurance or bonding',
      'Automatic approval of extras under $X',
      'No liability for damage during construction',
      '"Time and materials" for unforeseen work (no cap)'
    ],
    sampleLanguage: 'Contractor shall maintain general liability insurance of at least $1,000,000. Any unforeseen conditions discovered during work shall be documented with photos and a written estimate before proceeding. Homeowner approval required for any additional costs.'
  },
  {
    id: 'work-specs-timeline',
    title: 'Work Specifications & Timeline',
    description: 'Detailed description of exactly what work will be performed and specific deadlines with penalties for delays.',
    whyItMatters: 'Ensures the contractor understands exactly what you\'re paying for and when it needs to be done. Prevents "I didn\'t know you wanted that" excuses and endless delays.',
    whatToLookFor: [
      'Specific materials listed (brand, model, color)',
      'Measurements and quantities included',
      'Start date and completion date',
      'Penalty clause for unreasonable delays',
      'Permit responsibility assigned to contractor',
      'Cleanup and debris removal included'
    ],
    redFlags: [
      'Vague descriptions ("install new cabinets")',
      'No brand names or model numbers',
      'No project timeline',
      'No consequences for delays',
      '"Approximately" or "about" measurements',
      'Homeowner pulls permits (shifts liability to you)'
    ],
    sampleLanguage: 'Contractor shall install 14 linear feet of KraftMaid maple shaker cabinets (model #XXX) per attached layout. Project start: [date]. Substantial completion: [date]. Delay penalty: $100/day for delays not caused by homeowner or weather.'
  }
];

// Major cities mapped to their state codes for bid text detection
export const CITY_TO_STATE: Record<string, string> = {
  // Michigan
  'detroit': 'MI', 'grand rapids': 'MI', 'ann arbor': 'MI', 'lansing': 'MI', 'flint': 'MI',
  'dearborn': 'MI', 'warren': 'MI', 'sterling heights': 'MI', 'kalamazoo': 'MI', 'troy': 'MI',
  'pontiac': 'MI', 'saginaw': 'MI', 'livonia': 'MI', 'canton': 'MI', 'novi': 'MI',
  'farmington hills': 'MI', 'royal oak': 'MI', 'southfield': 'MI', 'bloomfield hills': 'MI',
  // Georgia
  'atlanta': 'GA', 'savannah': 'GA', 'augusta': 'GA', 'columbus': 'GA', 'athens': 'GA',
  'macon': 'GA', 'roswell': 'GA', 'marietta': 'GA', 'alpharetta': 'GA', 'dunwoody': 'GA',
  // California
  'los angeles': 'CA', 'san francisco': 'CA', 'san diego': 'CA', 'san jose': 'CA', 'oakland': 'CA',
  'sacramento': 'CA', 'fresno': 'CA', 'long beach': 'CA', 'anaheim': 'CA', 'irvine': 'CA',
  // Florida
  'miami': 'FL', 'orlando': 'FL', 'tampa': 'FL', 'jacksonville': 'FL', 'fort lauderdale': 'FL',
  'st petersburg': 'FL', 'tallahassee': 'FL', 'hialeah': 'FL', 'clearwater': 'FL', 'naples': 'FL',
  // Texas
  'houston': 'TX', 'dallas': 'TX', 'austin': 'TX', 'san antonio': 'TX', 'fort worth': 'TX',
  'el paso': 'TX', 'arlington': 'TX', 'plano': 'TX', 'frisco': 'TX', 'irving': 'TX',
  // New York
  'new york': 'NY', 'brooklyn': 'NY', 'manhattan': 'NY', 'bronx': 'NY', 'queens': 'NY',
  'buffalo': 'NY', 'rochester': 'NY', 'yonkers': 'NY', 'syracuse': 'NY', 'albany': 'NY',
  // Other major cities
  'chicago': 'IL', 'denver': 'CO', 'phoenix': 'AZ', 'seattle': 'WA', 'boston': 'MA',
  'las vegas': 'NV', 'philadelphia': 'PA', 'portland': 'OR', 'charlotte': 'NC', 'nashville': 'TN',
  'minneapolis': 'MN', 'cleveland': 'OH', 'cincinnati': 'OH', 'kansas city': 'MO', 'st louis': 'MO',
  'pittsburgh': 'PA', 'baltimore': 'MD', 'milwaukee': 'WI', 'indianapolis': 'IN', 'new orleans': 'LA',
};

// State name to code mapping
export const STATE_NAME_TO_CODE: Record<string, string> = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
  'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
  'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
  'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
  'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
  'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
  'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
  'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
  'wisconsin': 'WI', 'wyoming': 'WY', 'district of columbia': 'DC'
};

export const STATE_CODE_TO_NAME: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
  'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
  'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
  'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
  'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
  'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
  'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
  'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
  'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
  'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
  'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia'
};

/**
 * Detect state from bid text content
 * Priority: ZIP codes (most reliable) > state abbreviations in addresses > full state names > city names
 */
export function detectStateFromBid(bidText: string): { stateCode: string; stateName: string; zipCode?: string; city?: string } | null {
  const text = bidText.toLowerCase();
  
  // 1. FIRST: Look for ZIP code patterns - most reliable method
  const zipPattern = /\b(\d{5})(?:-\d{4})?\b/g;
  const zipMatches = bidText.matchAll(zipPattern);
  for (const match of zipMatches) {
    const zip = match[1];
    const stateFromZip = getStateFromZip(zip);
    if (stateFromZip) {
      const city = getCityFromZip(zip);
      return { stateCode: stateFromZip, stateName: STATE_CODE_TO_NAME[stateFromZip], zipCode: zip, city };
    }
  }
  
  // 2. Look for state abbreviations in address patterns (City, ST or City, ST ZIP)
  const addressPattern = /(?:[a-z]+(?:\s+[a-z]+)*),?\s+([A-Z]{2})(?:\s+\d{5})?/gi;
  const matches = bidText.matchAll(addressPattern);
  for (const match of matches) {
    const abbrev = match[1].toUpperCase();
    if (STATE_CODE_TO_NAME[abbrev]) {
      return { stateCode: abbrev, stateName: STATE_CODE_TO_NAME[abbrev] };
    }
  }
  
  // 3. Look for full state names (but skip ambiguous ones like "Washington" which could be a city)
  const ambiguousStateNames = ['washington', 'new york', 'new jersey', 'new mexico', 'new hampshire'];
  for (const [stateName, stateCode] of Object.entries(STATE_NAME_TO_CODE)) {
    if (ambiguousStateNames.includes(stateName)) continue; // Skip ambiguous state names
    const regex = new RegExp(`\\b${stateName}\\b`, 'i');
    if (regex.test(text)) {
      return { stateCode, stateName: STATE_CODE_TO_NAME[stateCode] };
    }
  }
  
  // 4. Look for major city names
  for (const [city, stateCode] of Object.entries(CITY_TO_STATE)) {
    const regex = new RegExp(`\\b${city}\\b`, 'i');
    if (regex.test(text)) {
      return { stateCode, stateName: STATE_CODE_TO_NAME[stateCode] };
    }
  }
  
  // 5. Finally, check ambiguous state names as a last resort (if nothing else matched)
  for (const stateName of ambiguousStateNames) {
    const stateCode = STATE_NAME_TO_CODE[stateName];
    const regex = new RegExp(`\\b${stateName}\\b`, 'i');
    if (regex.test(text)) {
      return { stateCode, stateName: STATE_CODE_TO_NAME[stateCode] };
    }
  }
  
  return null;
}

/**
 * Get city name from ZIP code
 * Returns the major city for common ZIP codes in supported states
 */
function getCityFromZip(zip: string): string | undefined {
  const zipNum = parseInt(zip);
  
  // Georgia major cities
  if (zipNum >= 30000 && zipNum <= 31999) {
    if (zipNum >= 30301 && zipNum <= 30381) return 'Atlanta';
    if (zipNum >= 31401 && zipNum <= 31499) return 'Savannah';
    if (zipNum >= 30901 && zipNum <= 30999) return 'Augusta';
    if (zipNum >= 31901 && zipNum <= 31999) return 'Columbus';
    if (zipNum >= 30601 && zipNum <= 30699) return 'Athens';
    if (zipNum >= 31201 && zipNum <= 31299) return 'Macon';
    if (zipNum >= 30075 && zipNum <= 30076) return 'Roswell';
    if (zipNum >= 30060 && zipNum <= 30068) return 'Marietta';
    if (zipNum >= 30004 && zipNum <= 30009) return 'Alpharetta';
  }
  
  // Michigan major cities
  if (zipNum >= 48000 && zipNum <= 49999) {
    if (zipNum >= 48201 && zipNum <= 48288) return 'Detroit';
    if (zipNum >= 49501 && zipNum <= 49599) return 'Grand Rapids';
    if (zipNum >= 48103 && zipNum <= 48109) return 'Ann Arbor';
    if (zipNum >= 48912 && zipNum <= 48933) return 'Lansing';
    if (zipNum >= 48502 && zipNum <= 48507) return 'Flint';
    if (zipNum >= 48126 && zipNum <= 48128) return 'Dearborn';
    if (zipNum >= 48088 && zipNum <= 48093) return 'Warren';
  }
  
  // California major cities
  if (zipNum >= 90000 && zipNum <= 96199) {
    if (zipNum >= 90001 && zipNum <= 90899) return 'Los Angeles';
    if (zipNum >= 94101 && zipNum <= 94188) return 'San Francisco';
    if (zipNum >= 92101 && zipNum <= 92199) return 'San Diego';
    if (zipNum >= 95101 && zipNum <= 95199) return 'San Jose';
    if (zipNum >= 94601 && zipNum <= 94699) return 'Oakland';
    if (zipNum >= 95814 && zipNum <= 95899) return 'Sacramento';
  }
  
  // Florida major cities
  if (zipNum >= 32000 && zipNum <= 34999) {
    if (zipNum >= 33101 && zipNum <= 33299) return 'Miami';
    if (zipNum >= 32801 && zipNum <= 32899) return 'Orlando';
    if (zipNum >= 33601 && zipNum <= 33699) return 'Tampa';
    if (zipNum >= 32201 && zipNum <= 32299) return 'Jacksonville';
    if (zipNum >= 33301 && zipNum <= 33399) return 'Fort Lauderdale';
  }
  
  // Texas major cities
  if (zipNum >= 75000 && zipNum <= 79999) {
    if (zipNum >= 77001 && zipNum <= 77599) return 'Houston';
    if (zipNum >= 75201 && zipNum <= 75398) return 'Dallas';
    if (zipNum >= 78701 && zipNum <= 78799) return 'Austin';
    if (zipNum >= 78201 && zipNum <= 78299) return 'San Antonio';
    if (zipNum >= 76101 && zipNum <= 76199) return 'Fort Worth';
  }
  
  // New York major cities
  if (zipNum >= 10000 && zipNum <= 14999) {
    if (zipNum >= 10001 && zipNum <= 10499) return 'New York';
    if (zipNum >= 11201 && zipNum <= 11299) return 'Brooklyn';
    if (zipNum >= 14201 && zipNum <= 14299) return 'Buffalo';
    if (zipNum >= 14604 && zipNum <= 14699) return 'Rochester';
  }
  
  return undefined;
}

/**
 * Get state from ZIP code prefix - covers all 50 US states
 */
function getStateFromZip(zip: string): string | null {
  const prefix = parseInt(zip.substring(0, 3));
  
  // Alabama: 350-369
  if (prefix >= 350 && prefix <= 369) return 'AL';
  // Alaska: 995-999
  if (prefix >= 995 && prefix <= 999) return 'AK';
  // Arizona: 850-865
  if (prefix >= 850 && prefix <= 865) return 'AZ';
  // Arkansas: 716-729
  if (prefix >= 716 && prefix <= 729) return 'AR';
  // California: 900-961
  if (prefix >= 900 && prefix <= 961) return 'CA';
  // Colorado: 800-816
  if (prefix >= 800 && prefix <= 816) return 'CO';
  // Connecticut: 060-069
  if (prefix >= 60 && prefix <= 69) return 'CT';
  // Delaware: 197-199
  if (prefix >= 197 && prefix <= 199) return 'DE';
  // District of Columbia: 200-205
  if (prefix >= 200 && prefix <= 205) return 'DC';
  // Florida: 320-349
  if (prefix >= 320 && prefix <= 349) return 'FL';
  // Georgia: 300-319, 398-399
  if ((prefix >= 300 && prefix <= 319) || (prefix >= 398 && prefix <= 399)) return 'GA';
  // Hawaii: 967-968
  if (prefix >= 967 && prefix <= 968) return 'HI';
  // Idaho: 832-838
  if (prefix >= 832 && prefix <= 838) return 'ID';
  // Illinois: 600-629
  if (prefix >= 600 && prefix <= 629) return 'IL';
  // Indiana: 460-479
  if (prefix >= 460 && prefix <= 479) return 'IN';
  // Iowa: 500-528
  if (prefix >= 500 && prefix <= 528) return 'IA';
  // Kansas: 660-679
  if (prefix >= 660 && prefix <= 679) return 'KS';
  // Kentucky: 400-427
  if (prefix >= 400 && prefix <= 427) return 'KY';
  // Louisiana: 700-714
  if (prefix >= 700 && prefix <= 714) return 'LA';
  // Maine: 039-049
  if (prefix >= 39 && prefix <= 49) return 'ME';
  // Maryland: 206-219
  if (prefix >= 206 && prefix <= 219) return 'MD';
  // Massachusetts: 010-027
  if (prefix >= 10 && prefix <= 27) return 'MA';
  // Michigan: 480-499
  if (prefix >= 480 && prefix <= 499) return 'MI';
  // Minnesota: 550-567
  if (prefix >= 550 && prefix <= 567) return 'MN';
  // Mississippi: 386-397
  if (prefix >= 386 && prefix <= 397) return 'MS';
  // Missouri: 630-658
  if (prefix >= 630 && prefix <= 658) return 'MO';
  // Montana: 590-599
  if (prefix >= 590 && prefix <= 599) return 'MT';
  // Nebraska: 680-693
  if (prefix >= 680 && prefix <= 693) return 'NE';
  // Nevada: 889-898
  if (prefix >= 889 && prefix <= 898) return 'NV';
  // New Hampshire: 030-038
  if (prefix >= 30 && prefix <= 38) return 'NH';
  // New Jersey: 070-089
  if (prefix >= 70 && prefix <= 89) return 'NJ';
  // New Mexico: 870-884
  if (prefix >= 870 && prefix <= 884) return 'NM';
  // New York: 100-149
  if (prefix >= 100 && prefix <= 149) return 'NY';
  // North Carolina: 270-289
  if (prefix >= 270 && prefix <= 289) return 'NC';
  // North Dakota: 580-588
  if (prefix >= 580 && prefix <= 588) return 'ND';
  // Ohio: 430-459
  if (prefix >= 430 && prefix <= 459) return 'OH';
  // Oklahoma: 730-749
  if (prefix >= 730 && prefix <= 749) return 'OK';
  // Oregon: 970-979
  if (prefix >= 970 && prefix <= 979) return 'OR';
  // Pennsylvania: 150-196
  if (prefix >= 150 && prefix <= 196) return 'PA';
  // Rhode Island: 028-029
  if (prefix >= 28 && prefix <= 29) return 'RI';
  // South Carolina: 290-299
  if (prefix >= 290 && prefix <= 299) return 'SC';
  // South Dakota: 570-577
  if (prefix >= 570 && prefix <= 577) return 'SD';
  // Tennessee: 370-385
  if (prefix >= 370 && prefix <= 385) return 'TN';
  // Texas: 750-799, 885
  if ((prefix >= 750 && prefix <= 799) || prefix === 885) return 'TX';
  // Utah: 840-847
  if (prefix >= 840 && prefix <= 847) return 'UT';
  // Vermont: 050-059
  if (prefix >= 50 && prefix <= 59) return 'VT';
  // Virginia: 220-246
  if (prefix >= 220 && prefix <= 246) return 'VA';
  // Washington: 980-994
  if (prefix >= 980 && prefix <= 994) return 'WA';
  // West Virginia: 247-268
  if (prefix >= 247 && prefix <= 268) return 'WV';
  // Wisconsin: 530-549
  if (prefix >= 530 && prefix <= 549) return 'WI';
  // Wyoming: 820-831
  if (prefix >= 820 && prefix <= 831) return 'WY';
  
  return null;
}

/**
 * Get state laws by state code, with generic fallback for unsupported states
 */
export function getStateLaws(stateCode: string): StateLaw {
  const normalized = stateCode.toUpperCase();
  
  if (STATE_LAWS[normalized]) {
    return STATE_LAWS[normalized];
  }
  
  // Return generic state law info for states we don't have specific data for
  const stateName = STATE_CODE_TO_NAME[normalized] || 'Unknown State';
  return {
    state: stateName,
    stateCode: normalized,
    licenseThreshold: 0, // Unknown - varies by state
    maxDeposit: 33, // General recommendation
    
    contractsLimitation: 'Varies by state (typically 4-6 years)',
    propertyDamageLimitation: 'Varies by state (typically 2-4 years)',
    personalInjuryLimitation: 'Varies by state (typically 2-3 years)',
    
    statuteOfRepose: 'Varies by state - consult local attorney',
    
    rightToCure: false,
    rightToCureDetails: 'Check your state\'s specific requirements. Many states require notice to contractor before filing a lawsuit.',
    
    statutes: [],
    
    consumerProtectionUrl: 'https://www.usa.gov/state-consumer',
    licenseVerifyUrl: 'Search for your state\'s contractor licensing board',
    
    keyPoints: [
      'Verify contractor is properly licensed in your state',
      'Get everything in writing before work begins',
      'Check for liability insurance and workers\' compensation coverage',
      '3 business days to cancel contracts signed at home (FTC rule)',
      'Never pay more than 25-33% upfront',
      'Get lien waivers with each payment',
      'Consult your state\'s consumer protection office for specific laws'
    ],
    
    depositRules: 'Most states recommend no more than 25-33% upfront. Some states have stricter limits. Check your state\'s specific regulations.',
    
    cancellationRights: 'Under Federal FTC rules, you have 3 business days to cancel any home improvement contract signed in your home.'
  };
}

/**
 * Get all available states
 */
export function getAvailableStates(): string[] {
  return Object.keys(STATE_LAWS);
}
