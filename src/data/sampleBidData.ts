/**
 * Sample Bid Data for "See How It Works" Demo Mode
 * BCAL Kitchen Consultants - Kitchen Remodel in Roswell, GA
 * 
 * This provides a realistic, pre-analyzed bid that visitors can explore
 * before uploading their own document.
 */

import { ContractorPulse } from '@/shared/contractorPulse';

export interface SampleBidData {
  content: string;
  fileName: string;
  overrides: {
    projectType: string;
    squareFootage: number;
    bidTotal: number;
    stateCode: string;
    windowCount: null;
    yearBuilt: number;
    linearFeet: null;
    contractorFingerprint: {
      legalBusinessName: string;
      dbaName: string | null;
      licenseNumber: string;
      licenseState: string;
      businessAddress: string;
      city: string;
      state: string;
      zipCode: string;
      primaryContact: string;
      phone: string;
      email: string;
      website: string;
    };
    contractorPulse: ContractorPulse;
  };
  bidTotal: number;
  zipCode: string;
}

// Realistic kitchen remodel bid content
const SAMPLE_BID_CONTENT = `
BCAL KITCHEN CONSULTANTS
Professional Kitchen Remodeling

License #: RBCO012847
892 Holcomb Bridge Rd, Suite 150
Roswell, GA 30076
Phone: (770) 555-0234
Email: info@bcalkitchens.com

KITCHEN REMODEL PROPOSAL
Date: March 10, 2025
Proposal #: CK-2025-0342

CLIENT INFORMATION
Homeowner: Sample Property
Project Address: 456 Maple Drive, Decatur, GA 30030
Property Year Built: 1998

SCOPE OF WORK - FULL KITCHEN RENOVATION

DEMOLITION & PREP WORK
- Remove existing cabinets, countertops, and backsplash.........$2,800
- Disconnect and remove existing appliances.....................$450
- Floor protection and dust barriers............................$350
- Debris removal and dumpster rental............................$850
- Structural assessment of load-bearing walls...................$400

CABINETRY
- 42" upper cabinets, soft-close hinges (14 linear feet).......$8,500
- Base cabinets with soft-close drawers (16 linear feet).......$7,200
- Lazy Susan corner cabinet....................................$650
- Pull-out trash cabinet.......................................$425
- Cabinet crown molding and trim...............................$1,100
- Cabinet installation labor...................................$2,400

COUNTERTOPS
- Quartz countertops (45 sf @ $85/sf)..........................$3,825
- Undermount sink cutout.......................................$200
- Cooktop cutout...............................................$175
- Edge profile - Ogee..........................................$450
- Countertop installation......................................$1,200

BACKSPLASH
- Subway tile backsplash (32 sf)...............................$960
- Accent tile band.............................................$340
- Tile installation labor......................................$800
- Grout and sealant............................................$150

PLUMBING
- New undermount stainless steel sink..........................$485
- Kitchen faucet (Kohler Simplice).............................$325
- Garbage disposal (InSinkErator Evolution)....................$380
- Dishwasher hookup and water line.............................$275
- Rough plumbing modifications.................................$1,200

ELECTRICAL
- Under-cabinet LED lighting...................................$650
- Pendant lights over island (3)...............................$480
- Recessed lighting (6 cans)...................................$720
- Dedicated 20-amp circuits (2)................................$550
- GFCI outlets.................................................$180
- Electrical permit and inspection.............................$275

APPLIANCES (CUSTOMER SUPPLIED - INSTALLATION ONLY)
- Refrigerator installation....................................$150
- Range/oven installation......................................$200
- Dishwasher installation......................................$175
- Range hood installation......................................$225
- Microwave installation.......................................$100

FLOORING
- LVP flooring (150 sf @ $8/sf)................................$1,200
- Floor prep and leveling......................................$450
- Transition strips and trim...................................$180
- Installation labor...........................................$900

PAINTING
- Ceiling and wall paint (Sherwin-Williams).....................$850
- Primer and prep work.........................................$350
- Painter's tape and supplies..................................$120

FINISHING
- New baseboard trim...........................................$380
- Door and window trim touch-up................................$240
- Final cleaning and punch list................................$350

PROJECT SUBTOTAL............................................$44,295
General Contractor Fee (15%).................................$6,644
Contingency (5%).............................................$2,215

TOTAL PROJECT COST..........................................$53,154

PAYMENT SCHEDULE:
- Deposit (25%): $13,289 due at contract signing
- Progress Payment #1 (25%): $13,289 due at cabinet delivery
- Progress Payment #2 (25%): $13,288 due at countertop installation
- Final Payment (25%): $13,288 due at project completion

TIMELINE: Estimated 4-6 weeks from start to completion

WARRANTY:
- 2 year workmanship warranty on all labor
- Manufacturer warranties on appliances and materials
- 1 year warranty on plumbing and electrical work

TERMS & CONDITIONS:
This proposal is valid for 30 days. Any changes to the scope of work may affect pricing and timeline. Customer is responsible for clearing work area and providing access during scheduled work hours (8am-5pm, Monday-Friday).

Accepted by: _________________________ Date: _________

Brandon Calloway
Owner, BCAL Kitchen Consultants
Licensed Residential Builder - Georgia
`;

// Pre-computed contractor pulse data
const SAMPLE_CONTRACTOR_PULSE: ContractorPulse = {
  fingerprint: {
    legalBusinessName: "BCAL Kitchen Consultants",
    dbaName: null,
    licenseNumber: 'RBCO012847',
    licenseType: 'RBCO',
    licenseState: 'GA',
    businessAddress: '892 Holcomb Bridge Rd, Suite 150',
    city: 'Roswell',
    state: 'GA',
    zipCode: '30076',
    primaryContact: 'Brandon Calloway',
    phone: '(770) 555-0234',
    email: 'info@bcalkitchens.com',
    website: null,
    confidence: {
      businessName: 'high',
      license: 'high',
      address: 'high',
      contact: 'high',
    },
  },
  distanceAnalysis: {
    contractorZip: '30076',
    projectZip: '30030',
    estimatedMiles: 18,
    travelPremiumRisk: false,
    riskLevel: 'none',
  },
  searchReady: true,
  searchableFields: ['businessName', 'license', 'address', 'phone', 'email'],
};

// ---------------------------------------------------------------------------
// Prebaked contractor research for the demo. The live Google Places / research
// / review-sentiment lookups can't resolve a fictional company, so sample mode
// injects these instead (ReportView skips the fetches when this is provided).
// Shapes mirror ReportView's GooglePlacesData / ContractorResearchData and
// shared/reviewSentiment's ReviewSentimentResult.
// ---------------------------------------------------------------------------

export interface SampleContractorDemoData {
  googlePlaces: {
    placeId: string;
    name: string;
    address: string;
    rating: number | null;
    reviewCount: number | null;
    reviews: Array<{ text: string; rating?: number; timeAgo?: string; author?: string }>;
    website?: string;
    phone?: string;
    businessStatus?: string;
  };
  reviewSentiment: {
    positiveFeelingsPercent: number;
    positiveOutcomesPercent: number;
    professionalismPercent: number;
    negativePercent: number;
    keyThemes: string[];
    sampleQuotes: { positive: string | null; negative: string | null };
    reviewCount: number;
    averageRating: number | null;
    confidence: 'high' | 'medium' | 'low';
  };
  research: {
    bbbStatus: string | null;
    businessRegistration: {
      status?: 'active' | 'inactive' | 'dissolved' | 'unknown';
      entity?: string | null;
      registeredState?: string | null;
      licenseNumber: string | null;
      notes?: string | null;
    } | null;
    permitHistory?: { recentPermits: number | null; totalValue: string | null; notes: string | null } | null;
    reputation?: {
      score: 'excellent' | 'good' | 'mixed' | 'concerning' | 'unknown';
      highlights: string[];
      concerns: string[];
    };
    summary?: string | null;
    sources?: Array<{ title: string; url: string; snippet: string }>;
    bbbComplaints?: { total: number | null; lastThreeYears: number | null; resolved: number | null; details: string | null } | null;
    newsItems?: string[];
    redFlags?: string[];
  };
}

export const SAMPLE_CONTRACTOR_DEMO_DATA: SampleContractorDemoData = {
  googlePlaces: {
    placeId: 'demo-bcal-kitchen-consultants',
    name: 'BCAL Kitchen Consultants',
    address: '892 Holcomb Bridge Rd, Suite 150, Roswell, GA 30076',
    rating: 4.9,
    reviewCount: 108,
    reviews: [
      {
        text: 'Brandon and his crew gutted and rebuilt our 1990s kitchen in five weeks. Communication was excellent — we got a schedule up front and photo updates every Friday. The cabinet install is flawless.',
        rating: 5,
        timeAgo: '2 months ago',
        author: 'Rachel M.',
      },
      {
        text: 'Fair price, showed up when they said they would, and the quartz counters came out beautiful. Only hiccup was a one-week delay waiting on our backordered range hood, which they flagged early.',
        rating: 5,
        timeAgo: '4 months ago',
        author: 'Derrick T.',
      },
      {
        text: 'They handled permits and inspections without us having to chase anything. Final walkthrough punch list was done in two days. Would hire again for the basement.',
        rating: 5,
        timeAgo: '6 months ago',
        author: 'Priya K.',
      },
      {
        text: 'Good work overall. A couple of change orders pushed the price up mid-project — make sure your allowances are realistic going in. Finished product is great.',
        rating: 4,
        timeAgo: '8 months ago',
        author: 'Sam W.',
      },
      {
        text: 'Professional from estimate to cleanup. The crew protected our floors, sealed off the dust, and left the site broom-clean every night.',
        rating: 5,
        timeAgo: '11 months ago',
        author: 'Angela B.',
      },
    ],
    phone: '(770) 555-0234',
    businessStatus: 'OPERATIONAL',
  },
  reviewSentiment: {
    positiveFeelingsPercent: 78,
    positiveOutcomesPercent: 84,
    professionalismPercent: 91,
    negativePercent: 6,
    keyThemes: ['Quality craftsmanship', 'On-schedule delivery', 'Clear communication'],
    sampleQuotes: {
      positive: 'Communication was excellent — we got a schedule up front and photo updates every Friday.',
      negative: 'A couple of change orders pushed the price up mid-project.',
    },
    reviewCount: 108,
    averageRating: 4.9,
    confidence: 'high',
  },
  research: {
    bbbStatus: 'A+',
    businessRegistration: {
      status: 'active',
      entity: 'BCAL Kitchen Consultants LLC',
      registeredState: 'GA',
      licenseNumber: 'RBCO012847',
      notes: 'Georgia residential builder license active and in good standing.',
    },
    permitHistory: {
      recentPermits: 14,
      totalValue: '$720,000',
      notes: '14 residential remodel permits pulled in Fulton and DeKalb counties over the last 24 months.',
    },
    reputation: {
      score: 'excellent',
      highlights: [
        '4.9 average across 108 reviews with consistent praise for schedule discipline',
        'Pulls its own permits and passes inspections without homeowner follow-up',
        'Both BBB complaints on file were resolved within 30 days',
      ],
      concerns: [
        'A few reviewers note mid-project change orders — lock allowances and scope in writing before signing',
      ],
    },
    summary:
      'Established kitchen remodeling contractor with an active Georgia license, A+ BBB rating, and a strong recent permit history. Review sentiment is overwhelmingly positive; the main pattern to manage is change-order creep, which matches the allowance flags in this bid.',
    sources: [],
    bbbComplaints: {
      total: 2,
      lastThreeYears: 1,
      resolved: 2,
      details: 'Both complaints concerned scheduling delays and were resolved with the customer within 30 days.',
    },
    newsItems: [],
    redFlags: [],
  },
};

export const SAMPLE_BID_DATA: SampleBidData = {
  content: SAMPLE_BID_CONTENT,
  fileName: 'bcal-kitchen-proposal.pdf',
  overrides: {
    projectType: 'Kitchen Remodel',
    squareFootage: 150,
    bidTotal: 53154,
    stateCode: 'GA',
    windowCount: null,
    yearBuilt: 1998,
    linearFeet: null,
    contractorFingerprint: {
      legalBusinessName: "BCAL Kitchen Consultants",
      dbaName: null,
      licenseNumber: 'RBCO012847',
      licenseState: 'GA',
      businessAddress: '892 Holcomb Bridge Rd, Suite 150',
      city: 'Roswell',
      state: 'GA',
      zipCode: '30076',
      primaryContact: 'Brandon Calloway',
      phone: '(770) 555-0234',
      email: 'info@bcalkitchens.com',
      website: 'bcalkitchens.com',
    },
    contractorPulse: SAMPLE_CONTRACTOR_PULSE,
  },
  bidTotal: 53154,
  zipCode: '30030',
};

export default SAMPLE_BID_DATA;
