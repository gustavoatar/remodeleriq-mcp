/**
 * Exterior Scenario Test Data (Scenarios 51-70)
 * Used to validate the Scope Fingerprinting Engine
 * 
 * Classifications covered:
 * - roofing-replacement: $8,000-$35,000 (full tear-off and replace)
 * - roofing-repair: $300-$3,000 (repairs only)
 * - windows-replacement: $400-$1,500/unit
 * - deck-new: $15,000-$50,000 (new construction)
 * - deck-repair: $2,000-$15,000 (repair/refinish)
 */

import type { ProjectClassification } from '../scopeFingerprints';

export interface ExteriorTestScenario {
  id: number;
  name: string;
  description: string;
  bidText: string;
  expectedClassification: ProjectClassification;
  expectedConfidenceMin: number;
  expectedFlags: string[];
  bidTotal: number;
  squareFootage: number;
  windowCount?: number;
  state: string;
  zipCode: string;
}

export const EXTERIOR_TEST_SCENARIOS: ExteriorTestScenario[] = [
  // ============================================================================
  // ROOFING-REPLACEMENT (Scenarios 51-54)
  // Full roof replacement - $8,000-$35,000
  // ============================================================================
  {
    id: 51,
    name: 'Roofing Replacement - Standard Shingle',
    description: 'Tear-off and replace asphalt shingles',
    bidText: `
      ROOF REPLACEMENT PROPOSAL
      
      TEAR-OFF:
      - Remove existing shingles (2 layers)
      - Remove damaged decking
      - Dispose of all debris (dumpster included)
      
      DECKING REPAIRS:
      - Replace up to 2 sheets OSB (if needed)
      
      NEW ROOF:
      - Install synthetic underlayment
      - Install ice and water shield (eaves + valleys)
      - Install GAF Timberline HDZ shingles
      - Install ridge vent
      - Install new flashing (all penetrations)
      - Install drip edge
      
      CLEANUP:
      - Magnetic sweep for nails
      - Final cleanup
      
      WARRANTY:
      - 10 year workmanship
      - 50 year GAF shingle warranty
      
      Permits included
      
      Roof squares: 28
      Total: $16,800
    `,
    expectedClassification: 'roofing-replacement',
    expectedConfidenceMin: 65,
    expectedFlags: [],
    bidTotal: 16800,
    squareFootage: 2800,
    state: 'GA',
    zipCode: '30318',
  },
  {
    id: 52,
    name: 'Roofing Replacement - Premium',
    description: 'High-end architectural shingles',
    bidText: `
      PREMIUM ROOF REPLACEMENT
      
      Complete tear-off to deck
      
      Repairs:
      - Replace any damaged decking
      - Repair any damaged fascia
      
      New roofing system:
      - GAF Pro-Start starter strip
      - Owens Corning Duration shingles
      - Ice & water shield (full coverage)
      - Synthetic felt
      - All new flashing
      - Ridge cap shingles
      - Power ridge vent
      
      Additional:
      - New gutters (6" seamless aluminum)
      - Downspouts
      
      Dumpster and cleanup
      
      35 squares
      
      Price: $28,500
      
      Warranty: Lifetime system warranty
    `,
    expectedClassification: 'roofing-replacement',
    expectedConfidenceMin: 65,
    expectedFlags: [],
    bidTotal: 28500,
    squareFootage: 3500,
    state: 'TX',
    zipCode: '75001',
  },
  {
    id: 53,
    name: 'Roofing Replacement - Metal Roof',
    description: 'Standing seam metal roof',
    bidText: `
      METAL ROOF INSTALLATION
      
      Remove existing asphalt shingles
      Debris disposal
      
      Install:
      - 1x4 furring strips
      - Standing seam metal panels (26 gauge)
      - Ridge cap
      - All flashing and trim
      - Snow guards
      
      32 squares
      
      Price: $34,000
      
      50 year warranty on panels
      Permits included
    `,
    expectedClassification: 'roofing-replacement',
    expectedConfidenceMin: 60,
    expectedFlags: [],
    bidTotal: 34000,
    squareFootage: 3200,
    state: 'CO',
    zipCode: '80202',
  },
  {
    id: 54,
    name: 'Roofing Replacement - Budget',
    description: 'Economy roof replacement',
    bidText: `
      ROOF REPLACEMENT
      
      Tear off shingles (1 layer)
      Replace damaged plywood
      New felt paper
      New 3-tab shingles
      New flashing
      Ridge vent
      Cleanup
      
      22 squares
      
      Total: $9,200
    `,
    expectedClassification: 'roofing-replacement',
    expectedConfidenceMin: 60,
    expectedFlags: [],
    bidTotal: 9200,
    squareFootage: 2200,
    state: 'OH',
    zipCode: '44101',
  },

  // ============================================================================
  // ROOFING-REPAIR (Scenarios 55-57)
  // Roof repairs - $300-$3,000
  // ============================================================================
  {
    id: 55,
    name: 'Roofing Repair - Leak Fix',
    description: 'Fix leak around chimney',
    bidText: `
      ROOF REPAIR
      
      Repair leak at chimney:
      - Remove old flashing
      - Install new step flashing
      - Install new counter flashing
      - Seal all edges
      
      Replace damaged shingles (approx 20)
      
      Price: $850
    `,
    expectedClassification: 'roofing-repair',
    expectedConfidenceMin: 60,
    expectedFlags: [],
    bidTotal: 850,
    squareFootage: 0,
    state: 'GA',
    zipCode: '30301',
  },
  {
    id: 56,
    name: 'Roofing Repair - Storm Damage',
    description: 'Repair storm damage section',
    bidText: `
      STORM DAMAGE ROOF REPAIR
      
      Repair 1 section (approx 4 squares):
      - Replace damaged shingles
      - Replace 1 sheet decking
      - New felt and shingles
      - Re-flash vent pipe
      
      Debris cleanup
      
      Price: $2,400
    `,
    expectedClassification: 'roofing-repair',
    expectedConfidenceMin: 55,
    expectedFlags: [],
    bidTotal: 2400,
    squareFootage: 400,
    state: 'FL',
    zipCode: '33139',
  },
  {
    id: 57,
    name: 'Roofing Repair - Minor Patch',
    description: 'Small patch job',
    bidText: `
      ROOF PATCH
      
      - Seal 3 nail pops
      - Replace 6 cracked shingles
      - Re-caulk skylight edge
      
      Total: $425
    `,
    expectedClassification: 'roofing-repair',
    expectedConfidenceMin: 55,
    expectedFlags: [],
    bidTotal: 425,
    squareFootage: 0,
    state: 'TN',
    zipCode: '37201',
  },

  // ============================================================================
  // WINDOWS-REPLACEMENT (Scenarios 58-62)
  // Window replacement - $400-$1,500/unit
  // ============================================================================
  {
    id: 58,
    name: 'Windows Replacement - Whole House',
    description: 'Replace all windows in home',
    bidText: `
      WINDOW REPLACEMENT - 18 WINDOWS
      
      REMOVE:
      - Remove existing windows (18 units)
      - Dispose of old windows
      
      INSTALL:
      - Vinyl double-hung windows (14)
      - Vinyl casement windows (2)
      - Vinyl picture window (1)
      - Vinyl sliding window (1)
      
      All windows:
      - Double pane low-E glass
      - Argon filled
      - Foam insulation
      - Interior trim (white)
      
      Debris cleanup
      
      18 windows total
      Price: $13,500 ($750/window average)
    `,
    expectedClassification: 'windows-replacement',
    expectedConfidenceMin: 75,
    expectedFlags: [],
    bidTotal: 13500,
    squareFootage: 0,
    windowCount: 18,
    state: 'GA',
    zipCode: '30318',
  },
  {
    id: 59,
    name: 'Windows Replacement - Living Room',
    description: 'Replace 4 living room windows',
    bidText: `
      LIVING ROOM WINDOW REPLACEMENT
      
      Replace 4 windows:
      - 2 double hung (36x60)
      - 1 picture window (60x48)
      - 1 casement (24x48)
      
      Andersen 100 Series
      
      Remove old, install new
      Interior trim
      Exterior caulk
      
      4 windows
      Total: $4,800 ($1,200/window)
    `,
    expectedClassification: 'windows-replacement',
    expectedConfidenceMin: 70,
    expectedFlags: [],
    bidTotal: 4800,
    squareFootage: 0,
    windowCount: 4,
    state: 'NY',
    zipCode: '10021',
  },
  {
    id: 60,
    name: 'Windows Replacement - Budget',
    description: 'Economy window package',
    bidText: `
      WINDOW PACKAGE - 10 WINDOWS
      
      Remove and replace 10 windows
      Basic vinyl double-hung
      White interior/exterior
      
      Price: $4,500 ($450/window)
      
      Includes debris removal
    `,
    expectedClassification: 'windows-replacement',
    expectedConfidenceMin: 65,
    expectedFlags: [],
    bidTotal: 4500,
    squareFootage: 0,
    windowCount: 10,
    state: 'OH',
    zipCode: '44101',
  },
  {
    id: 61,
    name: 'Windows Replacement - Impact Windows',
    description: 'Hurricane impact windows',
    bidText: `
      IMPACT WINDOW INSTALLATION
      
      Replace 12 windows with impact-rated windows:
      - PGT WinGuard impact glass
      - Meets Florida building code
      - HVHZ rated
      
      Remove existing
      Install new impact windows
      All new interior/exterior trim
      
      12 windows
      
      Total: $18,000 ($1,500/window)
      
      Permit included
    `,
    expectedClassification: 'windows-replacement',
    expectedConfidenceMin: 70,
    expectedFlags: [],
    bidTotal: 18000,
    squareFootage: 0,
    windowCount: 12,
    state: 'FL',
    zipCode: '33139',
  },
  {
    id: 62,
    name: 'Windows Replacement - Bedroom Set',
    description: 'Replace 6 bedroom windows',
    bidText: `
      BEDROOM WINDOWS
      
      Replace windows in 3 bedrooms:
      - Master (2 windows)
      - Bedroom 2 (2 windows)
      - Bedroom 3 (2 windows)
      
      Vinyl double-hung, white
      Low-E glass
      
      6 windows total
      Price: $4,200 ($700/window)
    `,
    expectedClassification: 'windows-replacement',
    expectedConfidenceMin: 65,
    expectedFlags: [],
    bidTotal: 4200,
    squareFootage: 0,
    windowCount: 6,
    state: 'TX',
    zipCode: '75201',
  },

  // ============================================================================
  // DECK-NEW (Scenarios 63-66)
  // New deck construction - $15,000-$50,000
  // ============================================================================
  {
    id: 63,
    name: 'Deck New - Composite Standard',
    description: 'New composite deck off back of house',
    bidText: `
      NEW DECK CONSTRUCTION
      
      SIZE: 16x20 (320 sf)
      
      STRUCTURE:
      - Concrete footings (6)
      - 6x6 posts
      - 2x10 PT frame
      - Ledger board with flashing
      
      DECKING:
      - Trex composite decking
      - Hidden fasteners
      
      RAILING:
      - Composite post sleeves
      - Aluminum balusters
      - Composite top rail
      
      STAIRS:
      - 4 steps to grade
      - Composite treads
      - Railing on both sides
      
      PERMITS INCLUDED
      
      Total: $24,000
      Timeline: 5-7 days
    `,
    expectedClassification: 'deck-new',
    expectedConfidenceMin: 60,
    expectedFlags: [],
    bidTotal: 24000,
    squareFootage: 320,
    state: 'GA',
    zipCode: '30318',
  },
  {
    id: 64,
    name: 'Deck New - Premium Multi-Level',
    description: 'Large multi-level deck with features',
    bidText: `
      PREMIUM DECK PACKAGE
      
      MAIN DECK: 20x24 (480 sf)
      LOWER DECK: 12x16 (192 sf)
      
      Total: 672 sf
      
      Structure:
      - Engineer-stamped plans
      - Helical piers
      - Steel beam connection
      - Premium PT framing
      
      Decking:
      - TimberTech PRO Reserve
      
      Features:
      - Built-in bench seating
      - Planter boxes
      - Stairs connecting levels
      - Cable railing system
      
      Electrical:
      - Post cap lighting
      - Step lights
      - 2 outlets
      
      Permits
      
      Total: $48,000
    `,
    expectedClassification: 'deck-new',
    expectedConfidenceMin: 60,
    expectedFlags: [],
    bidTotal: 48000,
    squareFootage: 672,
    state: 'CA',
    zipCode: '90210',
  },
  {
    id: 65,
    name: 'Deck New - Pressure Treated',
    description: 'Basic PT lumber deck',
    bidText: `
      NEW DECK - PRESSURE TREATED
      
      12x16 deck (192 sf)
      
      - Concrete piers
      - PT frame
      - PT decking (5/4x6)
      - Wood railing with balusters
      - Steps (3)
      
      Permit included
      
      Price: $15,500
    `,
    expectedClassification: 'deck-new',
    expectedConfidenceMin: 60,
    expectedFlags: [],
    bidTotal: 15500,
    squareFootage: 192,
    state: 'NC',
    zipCode: '27601',
  },
  {
    id: 66,
    name: 'Deck New - Elevated Deck',
    description: 'Second story deck',
    bidText: `
      ELEVATED DECK CONSTRUCTION
      
      Second floor deck: 14x18 (252 sf)
      
      Engineering required (included)
      
      Structure:
      - Deep footings (42")
      - 6x6 posts (10 ft)
      - Engineered beam
      - Hurricane ties
      
      Composite decking
      Code-compliant railing (42")
      Stair system to grade
      
      Electrical:
      - Light fixture
      - Outlet
      
      Permits and inspections
      
      Total: $32,000
    `,
    expectedClassification: 'deck-new',
    expectedConfidenceMin: 60,
    expectedFlags: [],
    bidTotal: 32000,
    squareFootage: 252,
    state: 'MA',
    zipCode: '02101',
  },

  // ============================================================================
  // DECK-REPAIR (Scenarios 67-70)
  // Deck repair/refinish - $2,000-$15,000
  // ============================================================================
  {
    id: 67,
    name: 'Deck Repair - Board Replacement',
    description: 'Replace rotted deck boards',
    bidText: `
      DECK BOARD REPLACEMENT
      
      Remove and replace:
      - 12 rotted deck boards
      - 4 stair treads
      - 2 railing posts
      
      All PT lumber to match
      
      Sand and stain deck after repair
      
      Total: $4,200
    `,
    expectedClassification: 'deck-repair',
    expectedConfidenceMin: 55,
    expectedFlags: [],
    bidTotal: 4200,
    squareFootage: 0,
    state: 'GA',
    zipCode: '30301',
  },
  {
    id: 68,
    name: 'Deck Repair - Full Refinish',
    description: 'Sand and restain entire deck',
    bidText: `
      DECK REFINISHING
      
      Existing deck: 400 sf
      
      - Power wash
      - Sand entire surface
      - Replace any loose screws
      - Apply stain (2 coats)
      - Seal railings
      
      Stain: customer choice
      
      Price: $3,800
      Timeline: 2-3 days
    `,
    expectedClassification: 'deck-repair',
    expectedConfidenceMin: 55,
    expectedFlags: [],
    bidTotal: 3800,
    squareFootage: 400,
    state: 'TN',
    zipCode: '37201',
  },
  {
    id: 69,
    name: 'Deck Repair - Structural + Surface',
    description: 'Major repair with new surface',
    bidText: `
      DECK RESTORATION
      
      Structural repairs:
      - Replace 2 posts
      - Sister 4 joists
      - New ledger board with flashing
      - Re-secure all connections
      
      Surface:
      - Remove old decking
      - Install new composite decking
      
      Railing:
      - New aluminum railing system
      
      Cleanup and debris removal
      
      300 sf deck
      
      Total: $12,500
    `,
    expectedClassification: 'deck-repair',
    expectedConfidenceMin: 55,
    expectedFlags: [],
    bidTotal: 12500,
    squareFootage: 300,
    state: 'IL',
    zipCode: '60601',
  },
  {
    id: 70,
    name: 'Deck Repair - Minor Fixes',
    description: 'Small repairs and cleaning',
    bidText: `
      DECK REPAIR
      
      - Replace 4 loose boards
      - Tighten railing
      - Replace 2 balusters
      - Power wash
      - Apply sealer
      
      Price: $2,200
    `,
    expectedClassification: 'deck-repair',
    expectedConfidenceMin: 50,
    expectedFlags: [],
    bidTotal: 2200,
    squareFootage: 0,
    state: 'OH',
    zipCode: '44101',
  },
];
