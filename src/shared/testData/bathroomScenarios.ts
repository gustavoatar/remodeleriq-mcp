/**
 * Bathroom Scenario Test Data (Scenarios 16-30)
 * Used to validate the Scope Fingerprinting Engine
 * 
 * Bathroom Classifications:
 * - bathroom-cosmetic: $2,000-$8,000 (paint, fixtures only)
 * - bathroom-refresh: $6,000-$18,000 (vanity, fixtures, no tile)
 * - bathroom-standard: $18,000-$42,000 (tile, demo, same footprint)
 * - bathroom-upscale: $50,000-$130,000 (spa features, full gut)
 * - bathroom-addition: $45,000-$100,000 (new bathroom construction)
 */

import type { ProjectClassification } from '../scopeFingerprints';

export interface BathroomTestScenario {
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

export const BATHROOM_TEST_SCENARIOS: BathroomTestScenario[] = [
  // ============================================================================
  // BATHROOM-COSMETIC (Scenarios 16-18)
  // Paint, fixtures only - $2,000-$8,000
  // ============================================================================
  {
    id: 16,
    name: 'Bathroom Cosmetic - Paint & Fixtures',
    description: 'Basic paint refresh with new faucet',
    bidText: `
      BATHROOM REFRESH
      
      Scope of Work:
      - Paint walls and ceiling (2 coats)
      - Paint trim and baseboards
      - Install new faucet (customer supplied)
      - Install new showerhead
      - Replace toilet seat
      - Caulk tub/shower
      
      Materials:
      - Premium bathroom paint (mold resistant)
      - Caulk and supplies
      
      Total: $3,200
      Timeline: 2-3 days
    `,
    expectedClassification: 'bathroom-cosmetic',
    expectedConfidenceMin: 70,
    expectedFlags: [],
    bidTotal: 3200,
    squareFootage: 50,
    state: 'GA',
    zipCode: '30301',
  },
  {
    id: 17,
    name: 'Bathroom Cosmetic - Minimal Update',
    description: 'Paint only with minor fixture swap',
    bidText: `
      Bathroom Paint Package
      
      - Paint bathroom walls
      - New towel bars and toilet paper holder
      - New light fixture (basic)
      - Re-caulk around tub
      
      Price: $2,400 labor and materials
      
      Note: Existing vanity, tile, and toilet remain unchanged.
    `,
    expectedClassification: 'bathroom-cosmetic',
    expectedConfidenceMin: 65,
    expectedFlags: [],
    bidTotal: 2400,
    squareFootage: 40,
    state: 'OH',
    zipCode: '44101',
  },
  {
    id: 18,
    name: 'Bathroom Cosmetic - Budget Refresh',
    description: 'Economy cosmetic update',
    bidText: `
      BUDGET BATHROOM UPDATE
      
      Work included:
      - Paint walls and ceiling
      - New faucet installation
      - New mirror
      - Touch up grout (no re-tile)
      
      Does NOT include: tile, vanity, toilet
      
      Total: $2,100
    `,
    expectedClassification: 'bathroom-cosmetic',
    expectedConfidenceMin: 60,
    expectedFlags: [],
    bidTotal: 2100,
    squareFootage: 35,
    state: 'MI',
    zipCode: '48201',
  },

  // ============================================================================
  // BATHROOM-REFRESH (Scenarios 19-21)
  // Vanity, fixtures, no tile work - $6,000-$18,000
  // ============================================================================
  {
    id: 19,
    name: 'Bathroom Refresh - Vanity + Fixtures',
    description: 'New vanity with fixture updates, no tile',
    bidText: `
      BATHROOM VANITY UPGRADE
      
      VANITY:
      - Remove existing vanity
      - Install new 48" vanity with top
      - New undermount sink
      - New faucet
      
      TOILET:
      - Remove and replace with new toilet
      - New wax ring and supply line
      
      LIGHTING:
      - New vanity light fixture
      - New exhaust fan
      
      PAINT:
      - Paint walls (2 coats)
      - Paint trim
      
      FLOORING:
      - Install new LVP flooring (existing tile removed)
      
      Total: $9,500
      
      Note: Existing shower/tub tile remains
    `,
    expectedClassification: 'bathroom-refresh',
    expectedConfidenceMin: 70,
    expectedFlags: [],
    bidTotal: 9500,
    squareFootage: 55,
    state: 'TX',
    zipCode: '75001',
  },
  {
    id: 20,
    name: 'Bathroom Refresh - Premium Fixtures',
    description: 'Higher-end vanity and fixtures',
    bidText: `
      BATHROOM FIXTURE UPGRADE
      
      Phase 1 - Vanity
      - Remove old vanity
      - Install 60" double vanity
      - Quartz top with two sinks
      - Delta faucets (2)
      
      Phase 2 - Toilet
      - New Kohler elongated toilet
      
      Phase 3 - Lighting
      - New LED vanity lights
      - Dimmer switch
      - New exhaust fan
      
      Phase 4 - Paint
      - Full bathroom paint
      
      Phase 5 - Accessories
      - New medicine cabinet
      - Towel bars, hooks, TP holder
      
      TOTAL: $14,800
      
      * No tile work included
      * Existing shower/tub unchanged
    `,
    expectedClassification: 'bathroom-refresh',
    expectedConfidenceMin: 70,
    expectedFlags: [],
    bidTotal: 14800,
    squareFootage: 70,
    state: 'FL',
    zipCode: '33101',
  },
  {
    id: 21,
    name: 'Bathroom Refresh - Entry Level',
    description: 'Basic vanity swap with economical fixtures',
    bidText: `
      Bathroom Update Package
      
      Remove and replace:
      - Vanity (36" stock from HD)
      - Sink and faucet
      - Toilet
      - Light fixture
      
      Paint walls
      
      New LVP flooring over existing
      
      Price: $6,800
      
      Tile not touched
    `,
    expectedClassification: 'bathroom-refresh',
    expectedConfidenceMin: 65,
    expectedFlags: [],
    bidTotal: 6800,
    squareFootage: 45,
    state: 'TN',
    zipCode: '37201',
  },

  // ============================================================================
  // BATHROOM-STANDARD (Scenarios 22-24)
  // Tile, partial demo, same footprint - $18,000-$42,000
  // ============================================================================
  {
    id: 22,
    name: 'Bathroom Standard - Full Tile Remodel',
    description: 'Complete remodel with new tile throughout',
    bidText: `
      BATHROOM REMODEL PROPOSAL
      
      DEMOLITION:
      - Remove existing tile (floor and walls)
      - Remove vanity and toilet
      - Dispose of debris
      
      TILE WORK:
      - Install cement board on walls
      - Waterproof shower/tub area (Kerdi system)
      - Install floor tile (12x24 porcelain)
      - Install wall tile in shower (3x12 subway)
      - Tile shower niche
      
      VANITY:
      - Install new 48" vanity
      - Quartz countertop
      - New faucet and drain
      
      SHOWER:
      - New shower valve (Moen)
      - New showerhead and arm
      - New shower door (frameless)
      
      TOILET:
      - New toilet installation
      
      PLUMBING:
      - Connect all fixtures
      - No rough-in changes
      
      ELECTRICAL:
      - New vanity light
      - New exhaust fan
      - GFCI outlet
      
      PAINT:
      - Paint walls above tile
      - Paint ceiling
      
      TOTAL: $28,500
      Timeline: 2-3 weeks
    `,
    expectedClassification: 'bathroom-standard',
    expectedConfidenceMin: 75,
    expectedFlags: [],
    bidTotal: 28500,
    squareFootage: 60,
    state: 'GA',
    zipCode: '30318',
  },
  {
    id: 23,
    name: 'Bathroom Standard - Tub to Shower Conversion',
    description: 'Replace tub with walk-in shower, full tile',
    bidText: `
      TUB TO SHOWER CONVERSION
      
      Demo:
      - Remove existing tub/surround
      - Remove floor tile
      - Remove vanity
      
      New Shower:
      - Custom tile shower pan
      - Linear drain
      - Tile walls floor to ceiling
      - Recessed niche (2)
      - Glass shower door
      
      Waterproofing:
      - Schluter Kerdi full system
      
      Tile:
      - Large format floor tile
      - Accent tile in shower
      
      Vanity:
      - New floating vanity
      - Vessel sink
      - Wall-mount faucet
      
      Toilet:
      - New wall-hung toilet
      
      Electrical:
      - New lighting
      - Heated floor thermostat
      
      Debris removal included
      
      Permits: Yes
      
      Total: $38,000
    `,
    expectedClassification: 'bathroom-standard',
    expectedConfidenceMin: 75,
    expectedFlags: [],
    bidTotal: 38000,
    squareFootage: 65,
    state: 'CA',
    zipCode: '90210',
  },
  {
    id: 24,
    name: 'Bathroom Standard - Budget Tile Remodel',
    description: 'Standard remodel at entry price point',
    bidText: `
      BATHROOM RENOVATION
      
      Demo existing tile and fixtures
      
      New tile:
      - Floor tile (basic porcelain)
      - Tub surround tile
      
      Waterproofing:
      - RedGard waterproofing
      
      Fixtures:
      - New vanity 36"
      - New toilet
      - New tub/shower valve
      - New light fixture
      
      Paint ceiling
      
      Cleanup and disposal
      
      Price: $19,500
      
      * Same layout, no plumbing moves
    `,
    expectedClassification: 'bathroom-standard',
    expectedConfidenceMin: 70,
    expectedFlags: [],
    bidTotal: 19500,
    squareFootage: 50,
    state: 'NC',
    zipCode: '28202',
  },

  // ============================================================================
  // BATHROOM-UPSCALE (Scenarios 25-27)
  // Spa features, full gut, luxury finishes - $50,000-$130,000
  // ============================================================================
  {
    id: 25,
    name: 'Bathroom Upscale - Spa Master Bath',
    description: 'Luxury spa bathroom with premium features',
    bidText: `
      LUXURY SPA BATHROOM RENOVATION
      
      PHASE 1: DEMOLITION
      - Complete gut to studs
      - Remove all fixtures, tile, drywall
      - Haul away debris
      
      PHASE 2: ROUGH PLUMBING
      - Relocate drain for freestanding tub
      - New supply lines for all fixtures
      - Prep for body sprays
      - Floor drain for curbless shower
      
      PHASE 3: ELECTRICAL
      - New circuits for heated floor
      - Towel warmer circuit
      - Steam unit circuit
      - Ambient lighting circuits
      - Exhaust fan
      
      PHASE 4: FRAMING & DRYWALL
      - New moisture-resistant drywall
      - Frame shower bench
      - Niche framing
      
      PHASE 5: WATERPROOFING & TILE
      - Full Schluter system
      - Curbless shower (linear drain)
      - Large format porcelain (24x48)
      - Accent mosaic feature wall
      - Heated floor system
      
      PHASE 6: FIXTURES
      - Freestanding soaking tub
      - Rain shower head (12")
      - 4 body sprays
      - Handheld shower
      - Steam shower unit
      
      PHASE 7: VANITY
      - Custom floating double vanity
      - Quartzite countertop
      - Wall-mount faucets
      - LED mirrors
      
      PHASE 8: FINISHING
      - Paint
      - Accessories
      - Towel warmer
      - Toilet (wall-hung Toto)
      
      PERMITS INCLUDED
      
      TOTAL: $85,000
      Timeline: 6-8 weeks
    `,
    expectedClassification: 'bathroom-upscale',
    expectedConfidenceMin: 80,
    expectedFlags: [],
    bidTotal: 85000,
    squareFootage: 120,
    state: 'NY',
    zipCode: '10021',
  },
  {
    id: 26,
    name: 'Bathroom Upscale - Modern Luxury',
    description: 'Contemporary high-end bathroom',
    bidText: `
      MODERN LUXURY BATHROOM
      
      Full Gut Demo
      - Demo to studs
      - Dumpster included
      
      Plumbing Rough
      - Move all plumbing for new layout
      - Prep for dual shower heads
      - Freestanding tub connection
      
      Electrical Rough
      - Reconfigure for new layout
      - Heated floor
      - Ambient lighting
      - Smart mirror wiring
      
      New drywall
      
      Tile
      - Book-matched marble walls
      - Large format floor
      - Shower: floor to ceiling slab
      
      Fixtures
      - Kohler soaking tub
      - Rainfall shower + handshower
      - Body jets (6)
      - Digital shower valve
      
      Vanity
      - Custom 72" double vanity
      - Quartz waterfall edge
      - Undermount sinks
      - Automated LED lighting
      
      Toilet
      - Toto bidet toilet
      
      Smart Features
      - Smart mirror with defogging
      - App-controlled shower
      - Voice-controlled lighting
      
      Permits
      
      Total: $108,000
    `,
    expectedClassification: 'bathroom-upscale',
    expectedConfidenceMin: 80,
    expectedFlags: [],
    bidTotal: 108000,
    squareFootage: 140,
    state: 'CA',
    zipCode: '94102',
  },
  {
    id: 27,
    name: 'Bathroom Upscale - Entry Luxury',
    description: 'Entry-level luxury spa bathroom',
    bidText: `
      UPSCALE BATHROOM REMODEL
      
      Complete gut demolition
      
      Rough plumbing for new layout
      - Relocate shower
      - Add freestanding tub drain
      
      Electrical rough
      - Heated floor prep
      - New lighting layout
      
      Waterproofing
      - Kerdi full system
      
      Tile
      - Porcelain throughout
      - Heated floor system
      - Shower accent wall
      
      Steam shower
      - Mr. Steam unit
      - Glass enclosure
      
      Soaking tub
      - Freestanding acrylic
      
      Custom vanity 60"
      - Stone top
      - Double sinks
      
      Premium fixtures
      - Thermostatic shower valve
      - Rain head
      
      Wall-hung toilet
      
      Permits included
      
      Price: $58,000
    `,
    expectedClassification: 'bathroom-upscale',
    expectedConfidenceMin: 75,
    expectedFlags: [],
    bidTotal: 58000,
    squareFootage: 90,
    state: 'TX',
    zipCode: '77024',
  },

  // ============================================================================
  // BATHROOM-ADDITION (Scenarios 28-30)
  // New bathroom construction - $45,000-$100,000
  // ============================================================================
  {
    id: 28,
    name: 'Bathroom Addition - New Full Bath',
    description: 'Adding new bathroom to existing space',
    bidText: `
      NEW BATHROOM ADDITION
      (Converting closet to full bathroom)
      
      FRAMING:
      - Frame new walls
      - Frame for shower
      - Door rough opening
      
      PLUMBING ROUGH:
      - Run new drain lines (connect to main stack)
      - Run hot and cold supply lines
      - Vent stack
      
      ELECTRICAL ROUGH:
      - New circuit from panel
      - GFCI outlets
      - Exhaust fan
      - Lighting
      
      HVAC:
      - Extend HVAC ductwork
      - New register
      
      DRYWALL:
      - Moisture-resistant drywall
      - Tape, mud, paint
      
      TILE:
      - Floor tile
      - Shower tile (walls)
      - Waterproofing
      
      FIXTURES:
      - 36" vanity with top
      - Toilet
      - Shower valve and trim
      - Light fixtures
      
      DOOR:
      - New prehung door
      
      PERMITS AND INSPECTIONS
      
      TOTAL: $52,000
      Timeline: 4-5 weeks
    `,
    expectedClassification: 'bathroom-addition',
    expectedConfidenceMin: 75,
    expectedFlags: [],
    bidTotal: 52000,
    squareFootage: 45,
    state: 'GA',
    zipCode: '30305',
  },
  {
    id: 29,
    name: 'Bathroom Addition - Basement Bath',
    description: 'New bathroom in basement',
    bidText: `
      BASEMENT BATHROOM ADDITION
      
      CONCRETE WORK:
      - Cut concrete for drain
      - Install sewage ejector pit
      - Patch concrete
      
      PLUMBING:
      - Sewage ejector pump
      - Rough plumbing for toilet, sink, shower
      - Connect to existing stack
      - Water supply lines
      
      FRAMING:
      - Frame bathroom walls
      - Frame shower enclosure
      
      ELECTRICAL:
      - Dedicated circuit for ejector
      - Bathroom circuit
      - Exhaust fan
      
      DRYWALL:
      - Green board on walls
      - Regular on ceiling
      
      TILE:
      - Floor tile
      - Shower tile
      
      FIXTURES:
      - Vanity 30"
      - Toilet
      - Shower (prefab base + tile walls)
      
      FINISHES:
      - Paint
      - Door
      - Accessories
      
      Permits included
      
      Total: $48,000
    `,
    expectedClassification: 'bathroom-addition',
    expectedConfidenceMin: 70,
    expectedFlags: [],
    bidTotal: 48000,
    squareFootage: 40,
    state: 'IL',
    zipCode: '60601',
  },
  {
    id: 30,
    name: 'Bathroom Addition - Ensuite Master',
    description: 'Adding ensuite bathroom to master bedroom',
    bidText: `
      MASTER ENSUITE ADDITION
      
      DESIGN:
      - Full bath with walk-in shower
      - Double vanity
      - Toilet room
      
      STRUCTURAL:
      - Remove portion of closet wall
      - Frame new bathroom
      - Support header
      
      PLUMBING ROUGH:
      - Run new lines from existing bath
      - New vent stack
      - Shower drain
      
      ELECTRICAL:
      - New subpanel
      - Bathroom circuits
      - Heated floor
      
      HVAC:
      - Extend existing system
      - New returns
      
      INSULATION & DRYWALL:
      - Insulate exterior wall
      - Moisture-resistant throughout
      
      WATERPROOFING:
      - Full shower waterproofing
      
      TILE:
      - Shower walls and floor
      - Bathroom floor
      
      FIXTURES:
      - 60" double vanity
      - Freestanding tub
      - Walk-in shower (glass door)
      - Toilet
      
      FINISHES:
      - Paint
      - Mirrors
      - Accessories
      
      PERMITS
      
      Total: $78,000
      
      Timeline: 6-7 weeks
    `,
    expectedClassification: 'bathroom-addition',
    expectedConfidenceMin: 75,
    expectedFlags: [],
    bidTotal: 78000,
    squareFootage: 80,
    state: 'FL',
    zipCode: '33131',
  },
];
