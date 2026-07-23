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
