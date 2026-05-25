/**
 * Specialty Scenario Test Data (Scenarios 86-100)
 * Used to validate the Scope Fingerprinting Engine
 * 
 * Classifications covered:
 * - basement-refinishing: Cosmetic update to finished basement
 * - basement-finishing: Unfinished to finished
 * - basement-remodel: Major reconfiguration
 * - general-handyman: Small mixed projects
 */

import type { ProjectClassification } from '../scopeFingerprints';

export interface SpecialtyTestScenario {
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
}

export const SPECIALTY_TEST_SCENARIOS: SpecialtyTestScenario[] = [
  // ============================================================================
  // BASEMENT-REFINISHING (Scenarios 86-88)
  // Cosmetic update to already-finished basement - $8,000-$25,000
  // ============================================================================
  {
    id: 86,
    name: 'Basement Refinishing - Paint & Flooring',
    description: 'Refresh existing finished basement',
    bidText: `
      BASEMENT REFRESH
      800 SF finished basement
      
      FLOORING:
      - Remove old carpet
      - Install LVP flooring throughout
      
      PAINT:
      - Patch drywall (minor repairs)
      - Paint all walls (2 coats)
      - Paint ceiling (flat white)
      - Paint trim and doors
      
      Total: $12,500
      Timeline: 5-7 days
    `,
    expectedClassification: 'basement-refinishing',
    expectedConfidenceMin: 65,
    expectedFlags: [],
    bidTotal: 12500,
    squareFootage: 800,
    state: 'GA',
    zipCode: '30318',
  },
  {
    id: 87,
    name: 'Basement Refinishing - Flood Restoration',
    description: 'Restore basement after minor water damage',
    bidText: `
      BASEMENT FLOOD REPAIR
      
      WATER DAMAGE RESTORATION:
      - Remove damaged drywall (lower 2 ft)
      - Remove wet carpet and pad
      - Treat for mold (preventive)
      - Dry out space
      
      REPAIRS:
      - Install new drywall
      - Tape, mud, texture
      - Paint walls
      - Install new LVP flooring
      - New baseboards
      
      678 SF
      
      Total: $15,326
    `,
    expectedClassification: 'basement-refinishing',
    expectedConfidenceMin: 65,
    expectedFlags: [],
    bidTotal: 15326,
    squareFootage: 678,
    state: 'OH',
    zipCode: '44101',
  },
  {
    id: 88,
    name: 'Basement Refinishing - Update Fixtures',
    description: 'Update basement bath and kitchenette',
    bidText: `
      BASEMENT UPDATE
      
      Existing finished basement with bath and kitchenette
      
      BATHROOM:
      - New vanity and faucet
      - New toilet
      - New light fixture
      - Paint
      
      KITCHENETTE:
      - New countertop
      - New sink and faucet
      - New flooring (tile)
      
      GENERAL:
      - Paint main space
      - New carpet in rec area
      
      Total: $18,000
    `,
    expectedClassification: 'basement-refinishing',
    expectedConfidenceMin: 60,
    expectedFlags: [],
    bidTotal: 18000,
    squareFootage: 600,
    state: 'PA',
    zipCode: '19101',
  },

  // ============================================================================
  // BASEMENT-FINISHING (Scenarios 89-92)
  // Unfinished to finished - $25,000-$75,000
  // ============================================================================
  {
    id: 89,
    name: 'Basement Finishing - Basic Build-Out',
    description: 'Finish unfinished basement',
    bidText: `
      BASEMENT FINISHING
      900 SF unfinished basement
      
      FRAMING:
      - Frame exterior walls
      - Frame one bedroom
      - Frame closet
      
      ELECTRICAL:
      - Outlets per code
      - Recessed lighting
      - Smoke detectors
      
      HVAC:
      - Extend existing ductwork
      - Add supply and return
      
      INSULATION & DRYWALL:
      - Insulate exterior walls
      - Hang and finish drywall
      - Texture to match
      
      FLOORING:
      - LVP throughout
      
      PAINT:
      - All walls and ceiling
      
      EGRESS:
      - Install egress window (one)
      
      Permits included
      
      Total: $42,000
      Timeline: 4-6 weeks
    `,
    expectedClassification: 'basement-finishing',
    expectedConfidenceMin: 70,
    expectedFlags: [],
    bidTotal: 42000,
    squareFootage: 900,
    state: 'CO',
    zipCode: '80202',
  },
  {
    id: 90,
    name: 'Basement Finishing - Full Suite',
    description: 'Finish basement with bathroom and kitchenette',
    bidText: `
      BASEMENT BUILDOUT - COMPLETE SUITE
      1,100 SF
      
      LAYOUT:
      - Living area
      - Bedroom with closet
      - Full bathroom
      - Kitchenette
      - Storage room
      
      BATHROOM:
      - Rough plumbing
      - Tile shower
      - Vanity, toilet
      
      KITCHENETTE:
      - Plumbing for sink
      - Cabinets (8 LF)
      - Countertop
      - Appliances (fridge, microwave)
      
      ELECTRICAL:
      - Subpanel
      - All circuits
      - Recessed lighting
      
      HVAC:
      - Mini-split system
      
      EGRESS:
      - 2 egress windows
      
      FLOORING:
      - LVP and tile
      
      All permits
      
      Total: $68,000
    `,
    expectedClassification: 'basement-finishing',
    expectedConfidenceMin: 70,
    expectedFlags: [],
    bidTotal: 68000,
    squareFootage: 1100,
    state: 'MN',
    zipCode: '55401',
  },
  {
    id: 91,
    name: 'Basement Finishing - Entertainment Space',
    description: 'Finish basement as media/game room',
    bidText: `
      BASEMENT ENTERTAINMENT SPACE
      
      850 SF unfinished to finished
      
      Features:
      - Open concept layout
      - Built-in bar area
      - Home theater alcove
      - Powder room (half bath)
      
      Includes:
      - All framing
      - Full electrical
      - Extend HVAC
      - Drywall throughout
      - LVP flooring
      - Paint
      - One egress window
      
      Bar area:
      - Sink rough-in
      - Cabinets
      - Countertop
      - Mini fridge space
      
      Permits
      
      Total: $52,000
    `,
    expectedClassification: 'basement-finishing',
    expectedConfidenceMin: 65,
    expectedFlags: [],
    bidTotal: 52000,
    squareFootage: 850,
    state: 'IL',
    zipCode: '60601',
  },
  {
    id: 92,
    name: 'Basement Finishing - Budget Basic',
    description: 'Simple basement finish',
    bidText: `
      BASIC BASEMENT FINISH
      700 SF
      
      - Frame walls
      - Insulate
      - Drywall
      - Basic lighting and outlets
      - Extend HVAC (one register)
      - Paint
      - Carpet
      - No bathroom
      - No egress window (not for bedroom use)
      
      Permits included
      
      Price: $28,000
    `,
    expectedClassification: 'basement-finishing',
    expectedConfidenceMin: 60,
    expectedFlags: [],
    bidTotal: 28000,
    squareFootage: 700,
    state: 'MI',
    zipCode: '48201',
  },

  // ============================================================================
  // BASEMENT-REMODEL (Scenarios 93-95)
  // Major reconfiguration of existing finished basement - $40,000-$100,000
  // ============================================================================
  {
    id: 93,
    name: 'Basement Remodel - Layout Change',
    description: 'Reconfigure existing finished basement',
    bidText: `
      BASEMENT RECONFIGURATION
      1,000 SF existing finished basement
      
      DEMO:
      - Remove existing walls
      - Remove existing flooring
      - Remove ceiling (water damaged)
      
      NEW LAYOUT:
      - Open concept main area
      - New bedroom location
      - Enlarge bathroom
      - Add wet bar
      
      NEW BATHROOM:
      - Move plumbing
      - Tile shower (larger)
      - Double vanity
      
      WET BAR:
      - New plumbing
      - Cabinets and counter
      - Sink
      
      ELECTRICAL:
      - Rewire for new layout
      - Upgrade lighting
      
      FINISHES:
      - All new drywall
      - LVP flooring
      - New ceiling (coffered in main area)
      - Paint
      
      Permits
      
      Total: $72,000
    `,
    expectedClassification: 'basement-remodel',
    expectedConfidenceMin: 65,
    expectedFlags: [],
    bidTotal: 72000,
    squareFootage: 1000,
    state: 'NJ',
    zipCode: '07001',
  },
  {
    id: 94,
    name: 'Basement Remodel - Full Gut',
    description: 'Complete basement gut and rebuild',
    bidText: `
      COMPLETE BASEMENT RENOVATION
      
      PHASE 1: Demo
      - Gut to studs
      - Remove all finishes
      - Remove old plumbing
      
      PHASE 2: Infrastructure
      - New plumbing layout
      - New electrical throughout
      - Waterproofing system
      - Sump pump
      
      PHASE 3: Build-Out
      - New framing
      - Full bathroom
      - Exercise room
      - Office
      - Storage
      
      PHASE 4: Finishes
      - Drywall
      - Tile (bathroom)
      - LVP (main areas)
      - Rubber flooring (gym)
      - Paint
      - Trim
      
      1,200 SF
      
      Total: $95,000
    `,
    expectedClassification: 'basement-remodel',
    expectedConfidenceMin: 65,
    expectedFlags: [],
    bidTotal: 95000,
    squareFootage: 1200,
    state: 'MA',
    zipCode: '02101',
  },
  {
    id: 95,
    name: 'Basement Remodel - Convert to ADU',
    description: 'Convert basement to rental unit',
    bidText: `
      BASEMENT ADU CONVERSION
      
      Convert existing finished basement to legal ADU
      
      REQUIRED CHANGES:
      - Add separate entrance (exterior stairs)
      - Add full kitchen
      - Upgrade bathroom
      - Egress windows (2)
      - Separate HVAC (mini-split)
      - Separate electrical meter
      - Fire separation (drywall upgrade)
      - Smoke/CO detectors
      
      KITCHEN:
      - Plumbing rough
      - Electrical circuits
      - Cabinets (12 LF)
      - Countertops
      - Full appliances
      
      ENTRANCE:
      - Exterior concrete stairs
      - Entry door
      - Landing
      
      All permits and inspections
      Engineering for stairs
      
      Total: $88,000
    `,
    expectedClassification: 'basement-adu',
    expectedConfidenceMin: 60,
    expectedFlags: [],
    bidTotal: 88000,
    squareFootage: 800,
    state: 'CA',
    zipCode: '94102',
  },

  // ============================================================================
  // GENERAL-HANDYMAN (Scenarios 96-100)
  // Small mixed projects - $500-$5,000
  // ============================================================================
  {
    id: 96,
    name: 'Handyman - Misc Repairs',
    description: 'Various small repairs throughout home',
    bidText: `
      HANDYMAN REPAIRS
      
      - Fix squeaky stairs (3 treads)
      - Repair drywall hole in hallway
      - Replace broken window screen
      - Tighten loose toilet
      - Fix running toilet (flapper)
      - Caulk around tub
      - Replace 2 door knobs
      - Adjust sticky door
      - Install smoke detector batteries
      
      Total: $650
      Half day
    `,
    expectedClassification: 'general-handyman',
    expectedConfidenceMin: 55,
    expectedFlags: [],
    bidTotal: 650,
    squareFootage: 0,
    state: 'GA',
    zipCode: '30301',
  },
  {
    id: 97,
    name: 'Handyman - Bathroom Refresh',
    description: 'Minor bathroom updates',
    bidText: `
      BATHROOM REFRESH
      
      - Install new toilet seat
      - Replace faucet (customer supplied)
      - Install towel bars (2)
      - Install new mirror
      - Caulk tub surround
      - Replace exhaust fan
      - Touch up paint
      
      Total: $850
    `,
    expectedClassification: 'general-handyman',
    expectedConfidenceMin: 55,
    expectedFlags: [],
    bidTotal: 850,
    squareFootage: 0,
    state: 'FL',
    zipCode: '33101',
  },
  {
    id: 98,
    name: 'Handyman - Exterior Repairs',
    description: 'Various exterior maintenance',
    bidText: `
      EXTERIOR MAINTENANCE
      
      - Repair rotted trim board (8 LF)
      - Replace 2 broken fence pickets
      - Re-secure loose gutter section
      - Clean and re-caulk windows (4)
      - Repair screen door closer
      - Power wash front porch
      - Touch up exterior paint
      
      Total: $1,200
      1 day
    `,
    expectedClassification: 'general-handyman',
    expectedConfidenceMin: 55,
    expectedFlags: [],
    bidTotal: 1200,
    squareFootage: 0,
    state: 'TX',
    zipCode: '75001',
  },
  {
    id: 99,
    name: 'Handyman - Cabinet & Shelving',
    description: 'Install shelving and fix cabinets',
    bidText: `
      CABINET & SHELVING WORK
      
      Kitchen:
      - Adjust cabinet doors (3)
      - Replace cabinet hinges (6)
      - Install pull-out trash cabinet
      
      Garage:
      - Install wall shelving (16 LF)
      - Mount pegboard
      
      Closet:
      - Install closet organizer (reach-in closet)
      
      Total: $1,500
    `,
    expectedClassification: 'general-handyman',
    expectedConfidenceMin: 50,
    expectedFlags: [],
    bidTotal: 1500,
    squareFootage: 0,
    state: 'NC',
    zipCode: '27601',
  },
  {
    id: 100,
    name: 'Handyman - TV & Fixture Install',
    description: 'Mount TVs and install fixtures',
    bidText: `
      MOUNTING & INSTALLATION
      
      - Mount 65" TV on wall (living room)
      - Mount 55" TV on wall (bedroom)
      - Conceal wires in wall
      - Install ceiling fan (replace existing)
      - Install chandelier (replace existing)
      - Install 3 new light fixtures
      - Program universal remote
      
      Customer supplies all fixtures/TVs
      
      Total: $950
    `,
    expectedClassification: 'general-handyman',
    expectedConfidenceMin: 50,
    expectedFlags: [],
    bidTotal: 950,
    squareFootage: 0,
    state: 'AZ',
    zipCode: '85001',
  },
];
