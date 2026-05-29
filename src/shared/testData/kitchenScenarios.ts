// TEST ONLY — not for production import
/**
 * Kitchen Scenario Test Data (Scenarios 1-15)
 * Used to validate the Scope Fingerprinting Engine
 * 
 * Each scenario has:
 * - bidText: Simulated bid document text
 * - expectedClassification: Expected fingerprint classification
 * - expectedConfidence: Minimum expected confidence level
 * - expectedFlags: Expected flags to be raised
 * - bidTotal: Total bid amount for price validation
 * - squareFootage: Project square footage
 */

import type { ProjectClassification } from '../scopeFingerprints';

export interface KitchenTestScenario {
  id: number;
  name: string;
  description: string;
  bidText: string;
  expectedClassification: ProjectClassification;
  expectedConfidenceMin: number; // 0-100
  expectedFlags: string[]; // flag IDs that should be raised
  bidTotal: number;
  squareFootage: number;
  state: string;
  zipCode: string;
}

export const KITCHEN_TEST_SCENARIOS: KitchenTestScenario[] = [
  // ============================================================================
  // KITCHEN-COSMETIC (Scenarios 1-3)
  // Paint, hardware only - $3,000-$12,000
  // ============================================================================
  {
    id: 1,
    name: 'Kitchen Cosmetic - Cabinet Paint Only',
    description: 'Basic cabinet painting with no structural changes',
    bidText: `
      KITCHEN REFRESH PROPOSAL
      
      Scope of Work:
      - Paint existing kitchen cabinets (2 coats primer, 2 coats semi-gloss)
      - Paint walls with fresh coat (Benjamin Moore Chantilly Lace)
      - Touch up trim and baseboards
      - Clean and prep all surfaces
      
      Materials:
      - Premium cabinet paint
      - Wall paint - 2 gallons
      - Primer
      - Caulk and wood filler
      
      Total: $4,500
      Timeline: 5-7 days
    `,
    expectedClassification: 'kitchen-cosmetic',
    expectedConfidenceMin: 70,
    expectedFlags: [],
    bidTotal: 4500,
    squareFootage: 120,
    state: 'GA',
    zipCode: '30301',
  },
  {
    id: 2,
    name: 'Kitchen Cosmetic - Paint + Hardware',
    description: 'Cabinet paint with new hardware and minor updates',
    bidText: `
      KITCHEN COSMETIC UPDATE
      
      WORK INCLUDED:
      1. Cabinet Painting
         - Sand, prime, and paint all cabinet doors and frames
         - Install new brushed nickel hardware (40 pulls, 20 knobs)
      
      2. Wall Painting
         - Paint kitchen walls, ceiling trim
         - 2 coats latex paint
      
      3. Minor Repairs
         - Fix soft-close hinges (6)
         - Touch up trim paint
      
      Does NOT include: New countertops, appliances, flooring, or plumbing
      
      TOTAL: $6,800
    `,
    expectedClassification: 'kitchen-cosmetic',
    expectedConfidenceMin: 75,
    expectedFlags: [],
    bidTotal: 6800,
    squareFootage: 150,
    state: 'TX',
    zipCode: '75001',
  },
  {
    id: 3,
    name: 'Kitchen Cosmetic - Budget Refresh',
    description: 'Minimal cosmetic refresh at low price point',
    bidText: `
      Budget Kitchen Refresh
      
      - Paint cabinet fronts (existing boxes)
      - Fresh wall paint throughout kitchen
      - New cabinet handles
      
      Labor and materials: $3,200
      
      Note: Existing countertops, appliances, and flooring remain.
    `,
    expectedClassification: 'kitchen-cosmetic',
    expectedConfidenceMin: 65,
    expectedFlags: [],
    bidTotal: 3200,
    squareFootage: 100,
    state: 'OH',
    zipCode: '44101',
  },

  // ============================================================================
  // KITCHEN-REFRESH (Scenarios 4-6)
  // Refacing, new counters, no layout change - $18,000-$40,000
  // ============================================================================
  {
    id: 4,
    name: 'Kitchen Refresh - Cabinet Refacing + Counters',
    description: 'Standard cabinet refacing with new countertops',
    bidText: `
      KITCHEN REFRESH ESTIMATE
      
      CABINET REFACING:
      - Reface all cabinet doors and drawer fronts with maple veneer
      - Install new door hinges (soft-close)
      - New drawer slides
      - Existing cabinet boxes remain
      
      COUNTERTOPS:
      - Remove existing laminate countertops
      - Install new quartz countertops (Level 2)
      - New undermount sink
      
      BACKSPLASH:
      - Install subway tile backsplash (4x12)
      
      PLUMBING:
      - Install new kitchen faucet (customer supplied)
      - Reconnect disposal
      
      TOTAL ESTIMATE: $28,500
      
      Timeline: 10-14 days
    `,
    expectedClassification: 'kitchen-refresh',
    expectedConfidenceMin: 75,
    expectedFlags: [],
    bidTotal: 28500,
    squareFootage: 140,
    state: 'FL',
    zipCode: '33101',
  },
  {
    id: 5,
    name: 'Kitchen Refresh - Premium Refacing',
    description: 'Higher-end cabinet refacing with stone counters',
    bidText: `
      PREMIUM KITCHEN REFRESH
      
      Phase 1 - Cabinet Refacing
      Cabinet refacing with solid wood doors
      New soft-close hinges throughout
      Interior cabinet painting
      Crown molding addition
      
      Phase 2 - Countertops & Sink
      Granite countertops - Absolute Black
      Undermount stainless sink
      New garbage disposal
      New faucet installation
      
      Phase 3 - Lighting & Paint
      New pendant lights over island (3)
      Under-cabinet LED lighting
      Wall painting - kitchen and breakfast nook
      
      Phase 4 - Appliances
      Install customer-supplied appliances:
      - Refrigerator
      - Dishwasher
      - Microwave
      
      TOTAL: $38,000
    `,
    expectedClassification: 'kitchen-refresh',
    expectedConfidenceMin: 70,
    expectedFlags: [],
    bidTotal: 38000,
    squareFootage: 200,
    state: 'CA',
    zipCode: '90210',
  },
  {
    id: 6,
    name: 'Kitchen Refresh - Entry Level',
    description: 'Basic refacing with laminate counters',
    bidText: `
      Kitchen Facelift Package
      
      Cabinet Refacing:
      - Thermofoil door refacing on all cabinets
      - New brushed nickel hardware
      
      New Countertops:
      - Remove old counters
      - Install new laminate countertops
      - New drop-in sink
      
      Backsplash:
      - Peel and stick tile backsplash
      
      Paint:
      - Paint kitchen walls
      
      Price: $19,500 installed
    `,
    expectedClassification: 'kitchen-refresh',
    expectedConfidenceMin: 65,
    expectedFlags: [],
    bidTotal: 19500,
    squareFootage: 120,
    state: 'MI',
    zipCode: '48201',
  },

  // ============================================================================
  // KITCHEN-MINOR (Scenarios 7-9)
  // Cabinet/counter replacement, same layout - $25,000-$65,000
  // ============================================================================
  {
    id: 7,
    name: 'Kitchen Minor - New Cabinets Same Layout',
    description: 'Full cabinet replacement maintaining existing layout',
    bidText: `
      KITCHEN REMODEL PROPOSAL
      
      DEMOLITION:
      - Remove existing cabinets
      - Remove existing countertops
      - Dispose of debris
      
      CABINETRY:
      - Install new KraftMaid cabinets (42 linear feet)
      - Full overlay doors, soft-close
      - Lazy susan corner cabinet
      - Pull-out trash cabinet
      
      COUNTERTOPS:
      - Quartz countertops throughout
      - 4" backsplash
      
      PLUMBING:
      - New sink and faucet
      - Reconnect existing plumbing lines
      - Install new disposal
      
      ELECTRICAL:
      - New outlets (4) where needed
      - Under-cabinet lighting
      
      TILE:
      - Tile backsplash - 4x8 subway
      
      APPLIANCES:
      - Install new range (customer supplied)
      - Install new dishwasher
      - Install new microwave
      
      TOTAL: $48,000
      
      Note: No structural changes, layout remains same
    `,
    expectedClassification: 'kitchen-minor',
    expectedConfidenceMin: 75,
    expectedFlags: [],
    bidTotal: 48000,
    squareFootage: 150,
    state: 'GA',
    zipCode: '30318',
  },
  {
    id: 8,
    name: 'Kitchen Minor - Budget New Cabinets',
    description: 'Entry-level new cabinets at lower price point',
    bidText: `
      KITCHEN CABINET REPLACEMENT
      
      Demo:
      - Remove and dispose existing cabinets and counters
      
      New Cabinets:
      - Install stock cabinets from Home Depot (Hampton Bay)
      - 30 linear feet base and wall cabinets
      
      Countertops:
      - Butcher block countertops
      - New sink cutout
      
      Sink/Plumbing:
      - New stainless sink
      - New faucet
      - Connect existing lines
      
      Hardware:
      - Cabinet pulls included
      
      Paint:
      - Paint walls after cabinet install
      
      Bid Total: $28,000
      
      * Existing appliances to be reinstalled
      * No electrical changes
    `,
    expectedClassification: 'kitchen-minor',
    expectedConfidenceMin: 70,
    expectedFlags: [],
    bidTotal: 28000,
    squareFootage: 110,
    state: 'TN',
    zipCode: '37201',
  },
  {
    id: 9,
    name: 'Kitchen Minor - Mid-Range Complete',
    description: 'Mid-range cabinet replacement with all finishes',
    bidText: `
      Kitchen Renovation - Complete Package
      
      SCOPE OF WORK:
      
      1. Demolition & Prep
      - Demo existing cabinets, counters, backsplash
      - Patch and prep walls
      - Dumpster included
      
      2. Cabinetry
      - Semi-custom Shaker cabinets (white)
      - Dovetail drawers
      - Soft-close everything
      - Tall pantry cabinet
      
      3. Countertops
      - Level 3 quartz
      - Waterfall edge on island
      - Undermount sink
      
      4. Backsplash
      - Ceramic tile to ceiling
      
      5. Electrical
      - 6 new outlets to code
      - Pendant lights (3)
      - Under-cabinet LED
      
      6. Plumbing
      - New faucet
      - New disposal
      - Connect dishwasher
      
      7. Appliances (install only)
      - Range, refrigerator, dishwasher, microwave
      
      8. Flooring
      - LVP flooring in kitchen
      
      TOTAL INVESTMENT: $58,000
      
      Permits included
      2-year workmanship warranty
    `,
    expectedClassification: 'kitchen-minor',
    expectedConfidenceMin: 75,
    expectedFlags: [],
    bidTotal: 58000,
    squareFootage: 180,
    state: 'NC',
    zipCode: '28202',
  },

  // ============================================================================
  // KITCHEN-MAJOR (Scenarios 10-12)
  // Full gut, possible layout change - $60,000-$120,000
  // ============================================================================
  {
    id: 10,
    name: 'Kitchen Major - Full Gut with Layout Change',
    description: 'Complete kitchen gut-renovation with reconfigured layout',
    bidText: `
      FULL KITCHEN RENOVATION
      
      PHASE 1: DEMOLITION
      - Complete gut demolition to studs
      - Remove all cabinets, counters, flooring
      - Remove non-load-bearing wall between kitchen and dining
      - Haul away all debris (40-yard dumpster)
      
      PHASE 2: STRUCTURAL
      - Install LVL beam for wall removal (12' span)
      - Frame new island location
      - Install temporary supports during beam work
      
      PHASE 3: ROUGH-INS
      - Electrical rough-in:
        * 4 new 20-amp circuits
        * Relocate panel for island
        * New outlet locations per plan
      - Plumbing rough-in:
        * Relocate sink to island
        * Move gas line for range
        * New water lines
      
      PHASE 4: INSULATION & DRYWALL
      - Wall insulation where exposed
      - New drywall throughout
      - Tape, mud, sand, prime
      
      PHASE 5: CABINETS & COUNTERS
      - Custom white Shaker cabinets
      - Large center island with seating
      - Calacatta quartz countertops
      - Full-height tile backsplash
      
      PHASE 6: ELECTRICAL FINISH
      - Recessed lighting (12 cans)
      - Pendant lights over island
      - Under-cabinet LED
      - All outlet/switch covers
      
      PHASE 7: PLUMBING FINISH
      - Undermount sink
      - Bridge faucet
      - Disposal, dishwasher connection
      - Pot filler at range
      
      PHASE 8: FLOORING
      - Engineered hardwood throughout
      
      PHASE 9: PAINTING
      - Prime and paint all walls (2 coats)
      - Paint trim
      
      PHASE 10: APPLIANCES
      - Install new appliance package (customer supplied)
      
      PERMITS & INSPECTIONS INCLUDED
      
      TOTAL: $95,000
      Timeline: 8-10 weeks
    `,
    expectedClassification: 'kitchen-major',
    expectedConfidenceMin: 80,
    expectedFlags: [],
    bidTotal: 95000,
    squareFootage: 200,
    state: 'GA',
    zipCode: '30305',
  },
  {
    id: 11,
    name: 'Kitchen Major - Island Addition',
    description: 'Major remodel adding island with plumbing',
    bidText: `
      Kitchen Remodel with New Island
      
      DEMO:
      Gut existing kitchen completely
      Remove flooring, drywall, cabinets
      
      STRUCTURAL:
      Frame for new island (no wall removal)
      
      ELECTRICAL:
      New 200 amp service panel
      Dedicated circuits for appliances
      Island electrical (outlets + pendant)
      Recessed lighting package
      
      PLUMBING:
      Run new lines to island for prep sink
      Relocate main sink
      Gas line for range
      
      HVAC:
      Modify ductwork for layout change
      
      CABINETRY:
      Custom maple cabinets
      10' island with storage
      
      COUNTERTOPS:
      Dekton countertops
      
      BACKSPLASH:
      Full porcelain tile backsplash
      
      FLOORING:
      Hardwood flooring
      
      PAINTING:
      All walls and trim
      
      APPLIANCES:
      Install package (owner supplies)
      
      PERMITS: Included
      
      TOTAL: $82,000
    `,
    expectedClassification: 'kitchen-major',
    expectedConfidenceMin: 75,
    expectedFlags: [],
    bidTotal: 82000,
    squareFootage: 250,
    state: 'IL',
    zipCode: '60601',
  },
  {
    id: 12,
    name: 'Kitchen Major - Entry Level Gut',
    description: 'Full gut renovation at lower price point',
    bidText: `
      KITCHEN GUT RENOVATION
      
      Complete demolition:
      - Gut kitchen to studs
      - Remove all finishes
      - Dumpster + disposal
      
      Framing:
      - Repair any damaged framing
      - No structural changes
      
      Electrical Rough:
      - Update wiring to code
      - New circuits for appliances
      
      Plumbing Rough:
      - New supply lines
      - New drain lines
      - Same sink location
      
      Drywall:
      - New drywall
      - Texture to match
      
      Cabinets:
      - Stock cabinets from supplier
      - Standard configuration
      
      Counters:
      - Level 1 granite
      - Undermount sink
      
      Tile:
      - Simple subway backsplash
      
      Flooring:
      - Tile floor
      
      Painting:
      - Paint walls
      
      Permits included
      
      Price: $62,000
    `,
    expectedClassification: 'kitchen-major',
    expectedConfidenceMin: 70,
    expectedFlags: [],
    bidTotal: 62000,
    squareFootage: 150,
    state: 'AZ',
    zipCode: '85001',
  },

  // ============================================================================
  // KITCHEN-UPSCALE (Scenarios 13-15)
  // Luxury finishes, commercial appliances - $120,000-$250,000+
  // ============================================================================
  {
    id: 13,
    name: 'Kitchen Upscale - Luxury Chef\'s Kitchen',
    description: 'High-end gourmet kitchen with professional appliances',
    bidText: `
      LUXURY CHEF'S KITCHEN RENOVATION
      
      DESIGN & PLANNING
      - Full architectural drawings
      - 3D renderings
      - Engineering for structural
      
      DEMOLITION
      - Complete gut demolition
      - Remove bearing wall (kitchen to great room)
      - Steel beam installation (18' span)
      
      STRUCTURAL WORK
      - Steel beam with columns
      - Floor reinforcement for island
      - Ceiling modifications
      
      ELECTRICAL
      - New 400 amp service
      - Dedicated circuits for commercial appliances
      - Smart home integration
      - Lutron lighting system
      - Undercabinet task lighting
      - Recessed cans on dimmers
      - Pendant lighting (custom)
      
      PLUMBING
      - Relocate all plumbing for new layout
      - Pot filler
      - Prep sink in island
      - Main sink with instant hot
      - Commercial dishwasher hookup
      
      GAS
      - Commercial gas line for 48" range
      - Gas shutoff at range
      
      HVAC
      - Additional HVAC for cooking heat
      - Commercial hood venting to exterior
      
      CUSTOM CABINETRY
      - Bespoke inset cabinets
      - Furniture-grade maple
      - Soft-close everything
      - Integrated lighting
      - Custom pantry system
      - Appliance garage
      - Built-in coffee station
      
      COUNTERTOPS
      - Calacatta marble perimeter
      - Quartzite island
      - Full-height backsplash
      - Integrated drain grooves
      
      APPLIANCES (INSTALL ONLY)
      - 48" Wolf range
      - Sub-Zero refrigerator
      - Miele dishwashers (2)
      - Commercial hood
      - Built-in microwave drawer
      - Wine refrigerator
      - Speed oven
      
      FLOORING
      - Wide-plank white oak
      - Radiant heat under tile
      
      PAINTING
      - Premium finishes
      - Faux finish accent wall
      
      PERMITS & ENGINEERING
      
      TOTAL INVESTMENT: $185,000
      
      Timeline: 14-16 weeks
      5-year warranty
    `,
    expectedClassification: 'kitchen-upscale',
    expectedConfidenceMin: 85,
    expectedFlags: [],
    bidTotal: 185000,
    squareFootage: 300,
    state: 'NY',
    zipCode: '10021',
  },
  {
    id: 14,
    name: 'Kitchen Upscale - Modern Luxury',
    description: 'Contemporary luxury kitchen with high-end finishes',
    bidText: `
      MODERN LUXURY KITCHEN
      
      Full Gut Demo
      - Demo to studs
      - Remove ceiling
      - 30-yard dumpster
      
      Structural
      - Remove wall to living room
      - LVL beam with steel flitch plate
      - Raise ceiling to 10'
      
      Rough Mechanicals
      - Complete electrical rewire
      - Smart panel installation
      - New plumbing throughout
      - Gas line for 36" range
      - Dedicated HVAC zone
      
      Custom Cabinetry
      - European frameless cabinets
      - Lacquered high-gloss white
      - Integrated handles
      - Floor to ceiling pantry wall
      - Custom island 12' x 4'
      
      Countertops
      - Neolith sintered stone
      - Waterfall edge island
      - Integrated sink
      
      Backsplash
      - Book-matched marble slab
      
      Appliances (Install)
      - Gaggenau appliance package
      - Built-in coffee system
      - Wine column
      - Drawer refrigerator in island
      
      Lighting
      - Cove LED throughout
      - Custom pendant fixture
      - Automated shades at windows
      
      Flooring
      - Large format porcelain
      
      Painting
      - Designer finish
      
      Permits
      Engineering
      Design fees
      
      Total: $168,000
    `,
    expectedClassification: 'kitchen-upscale',
    expectedConfidenceMin: 80,
    expectedFlags: [],
    bidTotal: 168000,
    squareFootage: 280,
    state: 'CA',
    zipCode: '94102',
  },
  {
    id: 15,
    name: 'Kitchen Upscale - Estate Kitchen',
    description: 'Estate-level kitchen with premium everything',
    bidText: `
      ESTATE KITCHEN RENOVATION
      
      DEMOLITION & STRUCTURAL
      Complete gut demolition of existing kitchen
      Remove structural wall per engineer plans
      Install steel moment frame
      Concrete reinforcement for commercial equipment
      
      ROUGH MECHANICALS
      Electrical: 600A service, commercial panel
      Plumbing: Commercial grade piping
      Gas: Dual commercial gas lines
      HVAC: Dedicated makeup air system
      
      CUSTOM MILLWORK
      Hand-crafted solid walnut cabinetry
      Furniture-style island with decorative legs
      Custom range hood surround
      Integrated pantry with motorized shelves
      Butler's pantry cabinets
      
      SURFACES
      Perimeter: Calacatta Borghini marble
      Island: Leathered quartzite
      Full-height slab backsplash
      Custom mosaic behind range
      
      PROFESSIONAL EQUIPMENT
      Wolf 60" dual fuel range
      Sub-Zero refrigerator/freezer columns
      Miele dishwasher (2)
      Commercial-grade vent hood
      Built-in espresso machine
      Wine wall (150 bottles)
      Warming drawer
      Speed oven
      
      LIGHTING & ELECTRICAL
      Automated lighting control
      Decorative fixtures (budget: $25,000)
      Under-cabinet illumination
      Display lighting
      
      FLOORING
      Reclaimed French oak
      Radiant heat system
      
      FINISHES
      Hand-applied Venetian plaster
      Custom glazing
      Decorative hardware ($8,000 allowance)
      
      PERMITS & PROFESSIONAL FEES
      Architectural drawings
      Structural engineering
      All permits and inspections
      
      TOTAL: $245,000
      
      Timeline: 20-24 weeks
    `,
    expectedClassification: 'kitchen-upscale',
    expectedConfidenceMin: 85,
    expectedFlags: [],
    bidTotal: 245000,
    squareFootage: 400,
    state: 'TX',
    zipCode: '77024',
  },
];

/**
 * Run a single scenario against the analysis engine
 * Returns pass/fail with details
 */
export interface ScenarioTestResult {
  scenarioId: number;
  scenarioName: string;
  passed: boolean;
  actualClassification: ProjectClassification;
  expectedClassification: ProjectClassification;
  actualConfidence: number;
  expectedConfidenceMin: number;
  matchedFlags: string[];
  missingFlags: string[];
  unexpectedFlags: string[];
  notes: string;
}

/**
 * Summary of test run
 */
export interface TestRunSummary {
  totalScenarios: number;
  passed: number;
  failed: number;
  passRate: number;
  results: ScenarioTestResult[];
  timestamp: string;
}
