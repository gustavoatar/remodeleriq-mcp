/**
 * Living/ADU Scenario Test Data (Scenarios 31-50)
 * Used to validate the Scope Fingerprinting Engine
 * 
 * Classifications covered:
 * - addition-room: $40,000-$150,000 (foundation, framing, electrical)
 * - garage-conversion: $50,000-$150,000 (no foundation, existing structure)
 * - addition-adu: $120,000-$300,000 (full new construction with kitchen/bath)
 * - flooring-install: $4-$15/sf (new flooring)
 * - flooring-refinish: $3-$8/sf (hardwood refinishing)
 * - painting-interior: $2-$7/sf (walls and trim)
 * - painting-exterior: $3-$10/sf (siding and trim)
 */

import type { ProjectClassification } from '../scopeFingerprints';

export interface LivingAduTestScenario {
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

export const LIVING_ADU_TEST_SCENARIOS: LivingAduTestScenario[] = [
  // ============================================================================
  // ADDITION-ROOM (Scenarios 31-33)
  // Foundation + framing + electrical - $40,000-$150,000
  // ============================================================================
  {
    id: 31,
    name: 'Room Addition - Sunroom',
    description: 'Adding 200sf sunroom to back of house',
    bidText: `
      SUNROOM ADDITION PROJECT
      
      FOUNDATION:
      - Excavate for foundation
      - Pour concrete footings
      - Foundation walls
      - Concrete slab
      
      FRAMING:
      - Frame walls (2x6 exterior)
      - Roof framing
      - Install windows (6 units)
      - Exterior door
      
      ELECTRICAL:
      - Run new circuit from panel
      - Outlets (4)
      - Lighting (ceiling fan + can lights)
      - Switches
      
      HVAC:
      - Extend existing ductwork
      - New register and return
      
      DRYWALL:
      - Insulate walls and ceiling
      - Hang and finish drywall
      
      FLOORING:
      - LVP flooring throughout
      
      EXTERIOR:
      - Match existing siding
      - Roofing to match
      
      PAINT:
      - Prime and paint interior
      
      PERMITS INCLUDED
      
      Total: $68,000
      Timeline: 6-8 weeks
    `,
    expectedClassification: 'addition-room',
    expectedConfidenceMin: 75,
    expectedFlags: [],
    bidTotal: 68000,
    squareFootage: 200,
    state: 'GA',
    zipCode: '30318',
  },
  {
    id: 32,
    name: 'Room Addition - Master Suite',
    description: 'Large master bedroom addition',
    bidText: `
      MASTER BEDROOM ADDITION
      400 SF
      
      Foundation Work:
      - Engineered plans
      - Footings and stem wall
      - Slab on grade
      
      Framing:
      - 2x6 walls
      - Vaulted ceiling framing
      - Windows (4) and slider door
      
      Rough Electrical:
      - New subpanel
      - 8 outlets, 4 switches
      - Recessed lighting (8)
      - Ceiling fan rough-in
      
      HVAC Extension:
      - Mini-split system
      
      Drywall:
      - R-19 insulation
      - 5/8" drywall throughout
      
      Flooring:
      - Engineered hardwood
      
      Paint:
      - Walls and ceiling
      - Trim
      
      Exterior:
      - Hardy plank siding
      - Architectural shingles
      
      Permits and inspections
      
      Total: $125,000
    `,
    expectedClassification: 'addition-room',
    expectedConfidenceMin: 75,
    expectedFlags: [],
    bidTotal: 125000,
    squareFootage: 400,
    state: 'TX',
    zipCode: '75201',
  },
  {
    id: 33,
    name: 'Room Addition - Budget Office',
    description: 'Small home office addition',
    bidText: `
      HOME OFFICE ADDITION (120 SF)
      
      - Foundation (crawl space)
      - Frame walls and roof
      - 2 windows
      - Electrical: outlets, lights
      - Extend HVAC
      - Drywall
      - LVP floor
      - Paint
      - Permits
      
      Total: $45,000
    `,
    expectedClassification: 'addition-room',
    expectedConfidenceMin: 70,
    expectedFlags: [],
    bidTotal: 45000,
    squareFootage: 120,
    state: 'NC',
    zipCode: '27601',
  },

  // ============================================================================
  // GARAGE-CONVERSION (Scenarios 34-36)
  // Existing structure conversion - $50,000-$150,000
  // ============================================================================
  {
    id: 34,
    name: 'Garage Conversion - Living Space',
    description: 'Convert 2-car garage to family room',
    bidText: `
      GARAGE TO LIVING ROOM CONVERSION
      
      FRAMING:
      - Frame in garage door opening
      - Install window in new wall
      - Frame for closet
      
      ELECTRICAL:
      - New circuit from panel
      - Outlets per code
      - Recessed lighting
      - Switches
      
      HVAC:
      - Extend existing HVAC
      - New supply and returns
      
      INSULATION:
      - Insulate exterior walls (R-15)
      - Insulate ceiling (R-30)
      
      DRYWALL:
      - All walls and ceiling
      - Texture to match house
      
      FLOORING:
      - Level concrete as needed
      - Install LVP flooring
      
      PAINT:
      - All walls and ceiling
      - Trim and baseboards
      
      Permits
      
      Price: $62,000
    `,
    expectedClassification: 'garage-conversion',
    expectedConfidenceMin: 75,
    expectedFlags: [],
    bidTotal: 62000,
    squareFootage: 400,
    state: 'AZ',
    zipCode: '85001',
  },
  {
    id: 35,
    name: 'Garage Conversion - In-Law Suite',
    description: 'Full in-law suite with kitchenette and bath',
    bidText: `
      GARAGE CONVERSION - IN-LAW SUITE
      
      PHASE 1: Demo & Framing
      - Frame in garage door
      - Frame bathroom
      - Frame kitchenette area
      - New entry door
      - Windows (2)
      
      PHASE 2: Plumbing
      - Rough plumbing for bath
      - Kitchenette sink rough
      - Water heater (tankless)
      
      PHASE 3: Electrical
      - Subpanel
      - Kitchen circuits
      - Bath circuit
      - General outlets
      - Lighting
      
      PHASE 4: HVAC
      - Mini-split system
      
      PHASE 5: Insulation & Drywall
      - Full insulation
      - Drywall throughout
      
      PHASE 6: Bathroom
      - Shower (tile)
      - Vanity, toilet
      
      PHASE 7: Kitchenette
      - Cabinets (8 LF)
      - Countertop
      - Sink
      - Appliances (fridge, microwave)
      
      PHASE 8: Flooring
      - LVP throughout
      - Tile in bath
      
      PHASE 9: Paint & Finish
      
      Permits
      
      Total: $118,000
    `,
    expectedClassification: 'garage-conversion',
    expectedConfidenceMin: 75,
    expectedFlags: [],
    bidTotal: 118000,
    squareFootage: 450,
    state: 'CA',
    zipCode: '92101',
  },
  {
    id: 36,
    name: 'Garage Conversion - Simple Bedroom',
    description: 'Basic bedroom conversion',
    bidText: `
      CONVERT GARAGE TO BEDROOM
      
      - Frame garage door opening with window
      - Insulate walls
      - Drywall
      - Extend HVAC duct
      - Electrical outlets and lights
      - Carpet flooring
      - Paint
      - Closet
      
      Permits included
      
      Price: $52,000
    `,
    expectedClassification: 'garage-conversion',
    expectedConfidenceMin: 70,
    expectedFlags: [],
    bidTotal: 52000,
    squareFootage: 240,
    state: 'FL',
    zipCode: '33101',
  },

  // ============================================================================
  // ADDITION-ADU (Scenarios 37-39)
  // Full new construction with kitchen/bath - $120,000-$300,000
  // ============================================================================
  {
    id: 37,
    name: 'ADU - Backyard Cottage',
    description: 'Detached 600sf ADU with full amenities',
    bidText: `
      DETACHED ADU - 600 SF
      
      SITE WORK:
      - Grading and excavation
      - Utility trenching
      
      FOUNDATION:
      - Concrete footings
      - Slab on grade
      
      FRAMING:
      - 2x6 walls
      - Engineered trusses
      - Windows and doors
      
      PLUMBING ROUGH:
      - Kitchen rough
      - Bathroom rough
      - Water heater
      - Gas line
      
      ELECTRICAL ROUGH:
      - Panel (100A)
      - Kitchen circuits
      - Bath circuit
      - General circuits
      
      HVAC:
      - Mini-split heat pump (2 zone)
      
      EXTERIOR:
      - Hardie siding
      - Comp shingle roof
      - Gutters
      
      INSULATION & DRYWALL
      
      KITCHEN:
      - Cabinets (16 LF)
      - Quartz counters
      - Full appliances
      
      BATHROOM:
      - Tile shower
      - Vanity, toilet
      
      FLOORING:
      - LVP throughout
      - Tile in bath
      
      PAINT
      
      PERMITS & ENGINEERING
      
      Total: $185,000
      Timeline: 4-5 months
    `,
    expectedClassification: 'addition-adu',
    expectedConfidenceMin: 80,
    expectedFlags: [],
    bidTotal: 185000,
    squareFootage: 600,
    state: 'CA',
    zipCode: '90210',
  },
  {
    id: 38,
    name: 'ADU - Premium Studio',
    description: 'High-end 450sf studio ADU',
    bidText: `
      LUXURY STUDIO ADU
      450 SF
      
      Foundation - concrete slab
      Full framing package
      
      Premium finishes:
      - Quartz countertops
      - Custom cabinetry
      - Hardwood flooring
      - Tile bathroom (floor to ceiling)
      
      Full plumbing:
      - Kitchen
      - Bathroom with walk-in shower
      - Tankless water heater
      
      Full electrical:
      - 100A service
      - All circuits
      
      High-efficiency mini-split HVAC
      
      Exterior:
      - Standing seam metal roof
      - Cedar siding
      
      All permits and engineering
      
      Total: $225,000
    `,
    expectedClassification: 'addition-adu',
    expectedConfidenceMin: 75,
    expectedFlags: [],
    bidTotal: 225000,
    squareFootage: 450,
    state: 'WA',
    zipCode: '98101',
  },
  {
    id: 39,
    name: 'ADU - Economy Build',
    description: 'Budget-friendly 400sf ADU',
    bidText: `
      ADU NEW CONSTRUCTION
      400 SF
      
      Foundation
      Framing
      Plumbing (kitchen + bath)
      Electrical
      HVAC (mini-split)
      Drywall
      Basic kitchen (cabinets, counter, appliances)
      Basic bathroom
      LVP flooring
      Paint
      Exterior siding and roof
      Permits
      
      Price: $145,000
    `,
    expectedClassification: 'addition-adu',
    expectedConfidenceMin: 70,
    expectedFlags: [],
    bidTotal: 145000,
    squareFootage: 400,
    state: 'OR',
    zipCode: '97201',
  },

  // ============================================================================
  // FLOORING-INSTALL (Scenarios 40-42)
  // New flooring installation - $4-$15/sf
  // ============================================================================
  {
    id: 40,
    name: 'Flooring Install - LVP Whole House',
    description: 'LVP flooring throughout main level',
    bidText: `
      FLOORING PROPOSAL
      
      Remove existing flooring (carpet + laminate)
      Dispose of debris
      
      Install luxury vinyl plank flooring
      - Living room
      - Dining room
      - Kitchen
      - Hallway
      - 3 bedrooms
      
      Total SF: 1,800
      
      Includes:
      - Flooring material (Lifeproof)
      - Underlayment
      - Transitions
      - Quarter round
      
      Price: $14,400 ($8/sf)
    `,
    expectedClassification: 'flooring-install',
    expectedConfidenceMin: 70,
    expectedFlags: [],
    bidTotal: 14400,
    squareFootage: 1800,
    state: 'GA',
    zipCode: '30301',
  },
  {
    id: 41,
    name: 'Flooring Install - Tile Kitchen/Bath',
    description: 'Porcelain tile in kitchen and bathrooms',
    bidText: `
      TILE FLOORING
      
      Remove old vinyl in kitchen
      Remove old tile in bathrooms (2)
      
      Install new porcelain tile:
      - Kitchen: 150 sf
      - Master bath: 60 sf
      - Hall bath: 45 sf
      
      Total: 255 sf
      
      Includes:
      - 12x24 porcelain tile
      - Mortar and grout
      - Transitions
      
      Debris removal included
      
      Total: $3,800 ($15/sf)
    `,
    expectedClassification: 'flooring-install',
    expectedConfidenceMin: 65,
    expectedFlags: [],
    bidTotal: 3800,
    squareFootage: 255,
    state: 'FL',
    zipCode: '33139',
  },
  {
    id: 42,
    name: 'Flooring Install - Carpet Bedrooms',
    description: 'New carpet in bedrooms',
    bidText: `
      CARPET INSTALLATION
      
      Remove old carpet and pad
      Dispose
      
      Install new carpet:
      - Master bedroom: 200 sf
      - Bedroom 2: 140 sf
      - Bedroom 3: 120 sf
      
      Total: 460 sf
      
      Includes carpet, pad, installation
      
      Price: $2,300 ($5/sf)
    `,
    expectedClassification: 'flooring-install',
    expectedConfidenceMin: 60,
    expectedFlags: [],
    bidTotal: 2300,
    squareFootage: 460,
    state: 'OH',
    zipCode: '44101',
  },

  // ============================================================================
  // FLOORING-REFINISH (Scenarios 43-44)
  // Hardwood refinishing - $3-$8/sf
  // ============================================================================
  {
    id: 43,
    name: 'Flooring Refinish - Full House',
    description: 'Sand and refinish existing hardwood',
    bidText: `
      HARDWOOD FLOOR REFINISHING
      
      Sand existing hardwood floors:
      - Living room
      - Dining room
      - Foyer
      - Hallway
      
      Total: 850 sf
      
      Process:
      - Sand to bare wood
      - Fill gaps
      - Stain (customer choice)
      - 3 coats polyurethane
      
      Price: $5,100 ($6/sf)
      Timeline: 3-4 days
    `,
    expectedClassification: 'flooring-refinish',
    expectedConfidenceMin: 70,
    expectedFlags: [],
    bidTotal: 5100,
    squareFootage: 850,
    state: 'MA',
    zipCode: '02101',
  },
  {
    id: 44,
    name: 'Flooring Refinish - Screen and Coat',
    description: 'Light refinish of hardwood',
    bidText: `
      HARDWOOD SCREEN & RECOAT
      
      Lightly sand (screen) existing finish
      Clean
      Apply 2 coats polyurethane
      
      Areas: Living, dining, hall (600 sf)
      
      No stain change
      
      Price: $2,100 ($3.50/sf)
    `,
    expectedClassification: 'flooring-refinish',
    expectedConfidenceMin: 65,
    expectedFlags: [],
    bidTotal: 2100,
    squareFootage: 600,
    state: 'IL',
    zipCode: '60601',
  },

  // ============================================================================
  // PAINTING-INTERIOR (Scenarios 45-47)
  // Interior painting - $2-$7/sf
  // ============================================================================
  {
    id: 45,
    name: 'Painting Interior - Whole House',
    description: 'Full interior paint including trim',
    bidText: `
      INTERIOR PAINTING PROPOSAL
      
      WALLS:
      - Prep walls (patch holes, sand)
      - Prime where needed
      - 2 coats paint (all rooms)
      
      TRIM:
      - Paint all baseboards
      - Paint all door frames
      - Paint all window frames
      
      CEILINGS:
      - Paint all ceilings (flat white)
      
      DOORS:
      - Paint all interior doors (both sides)
      
      Total wall SF: 3,200
      
      Materials:
      - Sherwin Williams Duration (walls)
      - ProClassic (trim)
      
      Price: $9,600 ($3/sf)
      Timeline: 5-6 days
    `,
    expectedClassification: 'painting-interior',
    expectedConfidenceMin: 70,
    expectedFlags: [],
    bidTotal: 9600,
    squareFootage: 3200,
    state: 'GA',
    zipCode: '30318',
  },
  {
    id: 46,
    name: 'Painting Interior - Accent Rooms',
    description: 'Painting select rooms',
    bidText: `
      PAINTING - ACCENT ROOMS
      
      Paint walls only:
      - Living room (accent wall)
      - Dining room
      - Master bedroom
      
      Total: 1,100 sf walls
      
      2 coats, paint included
      
      Price: $2,750 ($2.50/sf)
    `,
    expectedClassification: 'painting-interior',
    expectedConfidenceMin: 65,
    expectedFlags: [],
    bidTotal: 2750,
    squareFootage: 1100,
    state: 'TX',
    zipCode: '75001',
  },
  {
    id: 47,
    name: 'Painting Interior - Premium Finish',
    description: 'High-end interior with special finishes',
    bidText: `
      PREMIUM INTERIOR PAINTING
      
      Extensive prep:
      - Repair all drywall imperfections
      - Sand smooth
      - Prime all surfaces
      
      Walls (2,400 sf):
      - Benjamin Moore Regal (2 coats)
      
      Trim (320 LF):
      - High-gloss lacquer finish
      - Hand-sanded between coats
      
      Ceilings:
      - Flat finish
      
      All doors:
      - Spray finish
      
      Price: $14,400 ($6/sf)
    `,
    expectedClassification: 'painting-interior',
    expectedConfidenceMin: 70,
    expectedFlags: [],
    bidTotal: 14400,
    squareFootage: 2400,
    state: 'NY',
    zipCode: '10021',
  },

  // ============================================================================
  // PAINTING-EXTERIOR (Scenarios 48-50)
  // Exterior painting - $3-$10/sf
  // ============================================================================
  {
    id: 48,
    name: 'Painting Exterior - Full House',
    description: 'Complete exterior repaint',
    bidText: `
      EXTERIOR PAINTING
      
      PREP:
      - Power wash entire house
      - Scrape loose paint
      - Caulk gaps and cracks
      - Prime bare wood
      
      SIDING:
      - 2 coats acrylic latex
      
      TRIM:
      - Fascia, soffits
      - Window trim
      - Door trim
      - Shutters
      
      Total exterior SF: 2,800
      
      Materials: Sherwin Williams SuperPaint
      
      Price: $11,200 ($4/sf)
      Timeline: 4-5 days
    `,
    expectedClassification: 'painting-exterior',
    expectedConfidenceMin: 70,
    expectedFlags: [],
    bidTotal: 11200,
    squareFootage: 2800,
    state: 'NC',
    zipCode: '27601',
  },
  {
    id: 49,
    name: 'Painting Exterior - Trim Only',
    description: 'Exterior trim repaint',
    bidText: `
      EXTERIOR TRIM PAINTING
      
      Paint exterior trim only:
      - All fascia boards
      - All window frames
      - All door frames
      - Porch railings
      - Shutters
      
      Power wash, prime, 2 coats
      
      No siding paint
      
      Price: $3,800
    `,
    expectedClassification: 'painting-exterior',
    expectedConfidenceMin: 60,
    expectedFlags: [],
    bidTotal: 3800,
    squareFootage: 0,
    state: 'TN',
    zipCode: '37201',
  },
  {
    id: 50,
    name: 'Painting Exterior - Large Home',
    description: 'Large home exterior with stain',
    bidText: `
      EXTERIOR PAINTING & STAINING
      
      House exterior: 4,500 sf
      
      Siding:
      - Pressure wash
      - Paint body (2 coats)
      
      Trim:
      - Paint all trim (accent color)
      
      Cedar shake accents:
      - Solid stain
      
      Deck (300 sf):
      - Stain and seal
      
      Total: $31,500 ($7/sf)
    `,
    expectedClassification: 'painting-exterior',
    expectedConfidenceMin: 65,
    expectedFlags: [],
    bidTotal: 31500,
    squareFootage: 4500,
    state: 'CO',
    zipCode: '80202',
  },
];
