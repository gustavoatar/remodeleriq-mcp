// TEST ONLY — not for production import
/**
 * Edge Case Scenario Test Data
 * Validates the Lock-in Threshold feature of the Scope Fingerprinting Engine
 * 
 * These scenarios test cases where room mentions should NOT override
 * strong trade-specific classifications when confidence >= 85%.
 * 
 * Key test cases:
 * - "LVP in the bathroom" → flooring-install (not bathroom remodel)
 * - Standalone painting with room mentions → painting-interior/exterior
 * - Window-only bids → windows-replacement
 * - Electrical with kitchen mention → electrical-service
 * - Plumbing with bathroom mention → plumbing-service
 */

import type { ProjectClassification } from '../scopeFingerprints';

export interface EdgeCaseTestScenario {
  id: number;
  name: string;
  description: string;
  bidText: string;
  expectedClassification: ProjectClassification;
  expectedConfidenceMin: number;
  expectedFlags: string[];
  bidTotal: number;
  squareFootage: number;
  state: string;
  zipCode: string;
  testPurpose: string; // Explains what edge case this validates
}

export const EDGE_CASE_TEST_SCENARIOS: EdgeCaseTestScenario[] = [
  // ============================================================================
  // FLOORING WITH ROOM MENTIONS (Should stay flooring, not become room remodel)
  // Lock-in threshold should prevent room context from overriding
  // ============================================================================
  {
    id: 101,
    name: 'Flooring - LVP in Bathroom Only',
    description: 'LVP flooring install specifically in bathroom',
    testPurpose: 'Validate lock-in: "bathroom" mention should not override flooring classification',
    bidText: `
      LVP FLOORING INSTALLATION - BATHROOM
      
      Remove existing tile floor
      Level subfloor as needed
      Install waterproof LVP flooring
      Install new baseboards
      
      Bathroom only - 65 sf
      
      Price: $1,200
    `,
    expectedClassification: 'flooring-install',
    expectedConfidenceMin: 65,
    expectedFlags: [],
    bidTotal: 1200,
    squareFootage: 65,
    state: 'GA',
    zipCode: '30318',
  },
  {
    id: 102,
    name: 'Flooring - Tile in Kitchen',
    description: 'Tile flooring install in kitchen area',
    testPurpose: 'Validate lock-in: "kitchen" mention should not override flooring classification',
    bidText: `
      KITCHEN FLOOR TILE
      
      Demo existing vinyl
      Prep subfloor
      Install 12x24 porcelain tile
      Grout
      New transitions
      
      Kitchen area: 180 sf
      
      Total: $2,700
    `,
    expectedClassification: 'flooring-install',
    expectedConfidenceMin: 65,
    expectedFlags: [],
    bidTotal: 2700,
    squareFootage: 180,
    state: 'TX',
    zipCode: '75201',
  },
  {
    id: 103,
    name: 'Flooring - Hardwood Refinish in Master',
    description: 'Refinish hardwood in master bedroom',
    testPurpose: 'Validate room mention does not affect refinishing classification',
    bidText: `
      HARDWOOD REFINISHING - MASTER BEDROOM
      
      Sand existing hardwood
      Stain (Jacobean)
      3 coats polyurethane
      
      Master bedroom: 280 sf
      
      Price: $1,680 ($6/sf)
    `,
    expectedClassification: 'flooring-refinish',
    expectedConfidenceMin: 65,
    expectedFlags: [],
    bidTotal: 1680,
    squareFootage: 280,
    state: 'IL',
    zipCode: '60601',
  },

  // ============================================================================
  // PAINTING WITH ROOM MENTIONS (Should stay painting, not room remodel)
  // ============================================================================
  {
    id: 104,
    name: 'Painting - Kitchen Walls Only',
    description: 'Paint kitchen walls only',
    testPurpose: 'Validate lock-in: painting kitchen should not become kitchen remodel',
    bidText: `
      KITCHEN PAINTING
      
      Prep walls
      Prime stained areas
      Paint walls (2 coats)
      Paint ceiling
      
      Kitchen only
      
      Benjamin Moore paint
      
      Price: $1,200
    `,
    expectedClassification: 'painting-interior',
    expectedConfidenceMin: 60,
    expectedFlags: [],
    bidTotal: 1200,
    squareFootage: 200,
    state: 'NC',
    zipCode: '27601',
  },
  {
    id: 105,
    name: 'Painting - Bathroom Refresh',
    description: 'Paint bathroom walls and ceiling',
    testPurpose: 'Validate lock-in: painting bathroom should not become bathroom remodel',
    bidText: `
      BATHROOM PAINT
      
      Paint bathroom walls
      Paint ceiling
      Paint trim
      Use mold-resistant paint
      
      2 bathrooms
      
      Total: $850
    `,
    expectedClassification: 'painting-interior',
    expectedConfidenceMin: 60,
    expectedFlags: [],
    bidTotal: 850,
    squareFootage: 150,
    state: 'FL',
    zipCode: '33101',
  },
  {
    id: 106,
    name: 'Painting - Basement Walls',
    description: 'Paint finished basement walls',
    testPurpose: 'Validate lock-in: painting basement should not become basement remodel',
    bidText: `
      BASEMENT PAINTING
      
      Paint all basement walls
      Paint ceiling
      Paint stair railings
      
      800 sf basement
      
      Price: $2,400
    `,
    expectedClassification: 'painting-interior',
    expectedConfidenceMin: 60,
    expectedFlags: [],
    bidTotal: 2400,
    squareFootage: 800,
    state: 'OH',
    zipCode: '44101',
  },

  // ============================================================================
  // ELECTRICAL WITH ROOM MENTIONS (Should stay electrical, not room remodel)
  // ============================================================================
  {
    id: 107,
    name: 'Electrical - Kitchen Circuits',
    description: 'Add circuits for kitchen appliances',
    testPurpose: 'Validate lock-in: electrical in kitchen should not become kitchen remodel',
    bidText: `
      KITCHEN ELECTRICAL
      
      Add dedicated circuits:
      - Dishwasher circuit (20A)
      - Disposal circuit (20A)
      - Refrigerator circuit
      - 2 small appliance circuits
      
      Install GFCI outlets (4)
      Install under-cabinet lights
      
      Permit included
      
      Total: $2,800
    `,
    expectedClassification: 'electrical-service',
    expectedConfidenceMin: 65,
    expectedFlags: [],
    bidTotal: 2800,
    squareFootage: 0,
    state: 'GA',
    zipCode: '30318',
  },
  {
    id: 108,
    name: 'Electrical - Bathroom Fan & Lights',
    description: 'Electrical work in bathroom only',
    testPurpose: 'Validate lock-in: electrical in bathroom should not become bathroom remodel',
    bidText: `
      BATHROOM ELECTRICAL
      
      Install:
      - New exhaust fan with light
      - Vanity light fixture
      - GFCI outlet
      
      Includes permit
      
      Price: $950
    `,
    expectedClassification: 'electrical-service',
    expectedConfidenceMin: 60,
    expectedFlags: [],
    bidTotal: 950,
    squareFootage: 0,
    state: 'CA',
    zipCode: '94102',
  },
  {
    id: 109,
    name: 'Electrical - Basement Wiring',
    description: 'Electrical rough-in for basement',
    testPurpose: 'Validate lock-in: electrical in basement should not become basement finishing',
    bidText: `
      BASEMENT ELECTRICAL ROUGH-IN
      
      Install subpanel (60A)
      Run circuits for:
      - Outlets per code
      - Recessed lighting (12)
      - Bathroom circuit
      - Smoke detectors
      
      Rough wiring only - no fixtures
      
      Permit included
      
      Total: $4,200
    `,
    expectedClassification: 'electrical-service',
    expectedConfidenceMin: 60,
    expectedFlags: [],
    bidTotal: 4200,
    squareFootage: 0,
    state: 'CO',
    zipCode: '80202',
  },

  // ============================================================================
  // PLUMBING WITH ROOM MENTIONS (Should stay plumbing, not room remodel)
  // ============================================================================
  {
    id: 110,
    name: 'Plumbing - Kitchen Faucet & Disposal',
    description: 'Replace kitchen plumbing fixtures',
    testPurpose: 'Validate lock-in: plumbing in kitchen should not become kitchen remodel',
    bidText: `
      KITCHEN PLUMBING
      
      Remove and install:
      - New kitchen faucet
      - New garbage disposal
      - New sink drain
      - New supply lines
      
      Customer supplies faucet
      
      Labor: $450
    `,
    expectedClassification: 'plumbing-service',
    expectedConfidenceMin: 60,
    expectedFlags: [],
    bidTotal: 450,
    squareFootage: 0,
    state: 'TX',
    zipCode: '75001',
  },
  {
    id: 111,
    name: 'Plumbing - Bathroom Fixture Install',
    description: 'Install bathroom fixtures',
    testPurpose: 'Validate lock-in: plumbing fixtures in bathroom should not become bathroom remodel',
    bidText: `
      BATHROOM PLUMBING - FIXTURE INSTALL
      
      Install customer-supplied fixtures:
      - Toilet
      - Pedestal sink
      - Faucet
      - Supply lines
      - Wax ring and flange
      
      Labor only
      
      Price: $650
    `,
    expectedClassification: 'plumbing-service',
    expectedConfidenceMin: 60,
    expectedFlags: [],
    bidTotal: 650,
    squareFootage: 0,
    state: 'NC',
    zipCode: '27601',
  },

  // ============================================================================
  // WINDOWS WITH ROOM MENTIONS (Should stay windows, not room remodel)
  // ============================================================================
  {
    id: 112,
    name: 'Windows - Kitchen Window Only',
    description: 'Replace single kitchen window',
    testPurpose: 'Validate lock-in: window in kitchen should not become kitchen remodel',
    bidText: `
      KITCHEN WINDOW REPLACEMENT
      
      Remove old window
      Install new vinyl double-hung window
      Insulate
      Trim interior and exterior
      
      1 window (36x48)
      
      Price: $850
    `,
    expectedClassification: 'windows-replacement',
    expectedConfidenceMin: 60,
    expectedFlags: [],
    bidTotal: 850,
    squareFootage: 0,
    state: 'MI',
    zipCode: '48201',
  },
  {
    id: 113,
    name: 'Windows - Bathroom Window',
    description: 'Replace bathroom window with privacy glass',
    testPurpose: 'Validate lock-in: window in bathroom should not become bathroom remodel',
    bidText: `
      BATHROOM WINDOW - PRIVACY GLASS
      
      Remove existing window
      Install new vinyl window with obscure glass
      Seal and trim
      
      1 window
      
      Total: $750
    `,
    expectedClassification: 'windows-replacement',
    expectedConfidenceMin: 60,
    expectedFlags: [],
    bidTotal: 750,
    squareFootage: 0,
    state: 'AZ',
    zipCode: '85001',
  },

  // ============================================================================
  // HVAC WITH ROOM MENTIONS (Should stay HVAC, not room remodel)
  // ============================================================================
  {
    id: 114,
    name: 'HVAC - Kitchen Hood Vent',
    description: 'Install kitchen range hood venting',
    testPurpose: 'Validate lock-in: HVAC work in kitchen should not become kitchen remodel',
    bidText: `
      RANGE HOOD INSTALLATION
      
      Install ductwork for range hood
      Vent through roof
      Install roof cap
      Connect to range hood
      
      Note: Hood supplied by customer
      
      Total: $1,200
    `,
    expectedClassification: 'hvac-service',
    expectedConfidenceMin: 55,
    expectedFlags: [],
    bidTotal: 1200,
    squareFootage: 0,
    state: 'WA',
    zipCode: '98101',
  },
  {
    id: 115,
    name: 'HVAC - Bathroom Exhaust Fan',
    description: 'Install bathroom exhaust with duct',
    testPurpose: 'Validate lock-in: HVAC work in bathroom should not become bathroom remodel',
    bidText: `
      BATHROOM EXHAUST FAN INSTALLATION
      
      Install Panasonic WhisperCeiling fan
      Run duct to soffit
      Install soffit vent
      Connect electrical
      
      Includes fan
      
      Total: $650
    `,
    expectedClassification: 'hvac-service',
    expectedConfidenceMin: 55,
    expectedFlags: [],
    bidTotal: 650,
    squareFootage: 0,
    state: 'OR',
    zipCode: '97201',
  },

  // ============================================================================
  // EDGE CASES - ROOM CONTEXT SHOULD WIN (Low trade confidence)
  // When trade-specific keywords are weak, room context should apply
  // ============================================================================
  {
    id: 116,
    name: 'Kitchen Refresh - Light Renovation',
    description: 'Light kitchen update with paint and new hardware',
    testPurpose: 'Room context SHOULD win: weak trade signals, strong kitchen context',
    bidText: `
      KITCHEN REFRESH
      
      Kitchen updates:
      - Paint cabinets (white)
      - New cabinet hardware
      - New faucet
      - Paint walls
      - New light fixture
      
      Total: $4,500
    `,
    expectedClassification: 'kitchen-cosmetic',
    expectedConfidenceMin: 60,
    expectedFlags: [],
    bidTotal: 4500,
    squareFootage: 150,
    state: 'GA',
    zipCode: '30318',
  },
  {
    id: 117,
    name: 'Bathroom Refresh - Cosmetic Update',
    description: 'Light bathroom cosmetic work',
    testPurpose: 'Room context SHOULD win: weak trade signals, strong bathroom context',
    bidText: `
      BATHROOM UPDATE
      
      - New vanity
      - New faucet
      - New toilet
      - New mirror
      - Paint walls
      - New light fixture
      
      Hall bathroom
      
      Total: $3,200
    `,
    expectedClassification: 'bathroom-cosmetic',
    expectedConfidenceMin: 60,
    expectedFlags: [],
    bidTotal: 3200,
    squareFootage: 50,
    state: 'TX',
    zipCode: '75201',
  },

  // ============================================================================
  // PURE TRADE BIDS (No room mentions at all)
  // These should classify correctly without any room context interference
  // ============================================================================
  {
    id: 118,
    name: 'Pure Flooring - Whole House LVP',
    description: 'Flooring with no room-specific mentions',
    testPurpose: 'Baseline test: pure flooring bid without room context',
    bidText: `
      LVP FLOORING INSTALLATION
      
      Remove old flooring
      Prep subfloor
      Install Lifeproof LVP
      Install transitions
      Install baseboards
      
      1,500 sf total
      
      Price: $10,500 ($7/sf)
    `,
    expectedClassification: 'flooring-install',
    expectedConfidenceMin: 70,
    expectedFlags: [],
    bidTotal: 10500,
    squareFootage: 1500,
    state: 'FL',
    zipCode: '33139',
  },
  {
    id: 119,
    name: 'Pure Painting - Interior',
    description: 'Interior painting with no room-specific mentions',
    testPurpose: 'Baseline test: pure painting bid without room context',
    bidText: `
      INTERIOR PAINTING
      
      Prep all walls
      Patch and sand
      Prime as needed
      Paint walls (2 coats)
      Paint ceilings
      Paint all trim
      
      2,000 sf wall area
      
      Price: $6,000 ($3/sf)
    `,
    expectedClassification: 'painting-interior',
    expectedConfidenceMin: 70,
    expectedFlags: [],
    bidTotal: 6000,
    squareFootage: 2000,
    state: 'NC',
    zipCode: '27601',
  },
  {
    id: 120,
    name: 'Pure Electrical - Panel Upgrade',
    description: 'Electrical panel upgrade with no room mentions',
    testPurpose: 'Baseline test: pure electrical bid without room context',
    bidText: `
      ELECTRICAL PANEL UPGRADE
      
      Remove 100A panel
      Install 200A panel
      New meter base
      Transfer all circuits
      Label circuits
      Permit and inspection
      
      Total: $4,500
    `,
    expectedClassification: 'electrical-service',
    expectedConfidenceMin: 70,
    expectedFlags: [],
    bidTotal: 4500,
    squareFootage: 0,
    state: 'CA',
    zipCode: '94102',
  },
];
