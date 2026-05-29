// TEST ONLY — not for production import
/**
 * Infrastructure Scenario Test Data (Scenarios 71-85)
 * Used to validate the Scope Fingerprinting Engine
 * 
 * Classifications covered:
 * - electrical-service: Panel upgrades, rewiring, service calls
 * - plumbing-service: Repipes, repairs, water heaters
 * - hvac-service: Repairs, maintenance, minor work
 * - hvac-replacement: Full system replacement
 */

import type { ProjectClassification } from '../scopeFingerprints';

export interface InfrastructureTestScenario {
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

export const INFRASTRUCTURE_TEST_SCENARIOS: InfrastructureTestScenario[] = [
  // ============================================================================
  // ELECTRICAL-SERVICE (Scenarios 71-75)
  // Panel upgrades, rewiring, service work
  // ============================================================================
  {
    id: 71,
    name: 'Electrical - Panel Upgrade 200A',
    description: 'Upgrade main panel to 200 amp',
    bidText: `
      ELECTRICAL PANEL UPGRADE
      
      SCOPE:
      - Remove existing 100A panel
      - Install new 200A main panel
      - Install new meter base (coordinate with utility)
      - Replace main breaker
      - Transfer all existing circuits
      - Add surge protection
      - Label all circuits
      - Ground and bond per code
      
      PERMITS:
      - Electrical permit included
      - Utility coordination
      - Final inspection
      
      Total: $4,200
      Timeline: 1 day
    `,
    expectedClassification: 'electrical-service',
    expectedConfidenceMin: 70,
    expectedFlags: [],
    bidTotal: 4200,
    squareFootage: 0,
    state: 'GA',
    zipCode: '30318',
  },
  {
    id: 72,
    name: 'Electrical - Whole House Rewire',
    description: 'Complete rewire of older home',
    bidText: `
      WHOLE HOUSE REWIRE
      1,800 SF Home (1960s construction)
      
      PHASE 1: Planning
      - Circuit layout design
      - Permit application
      
      PHASE 2: Rough-In
      - New 200A panel
      - All new romex wiring
      - All new circuits per code
      - AFCI/GFCI protection
      
      PHASE 3: Devices
      - All new outlets (42)
      - All new switches (28)
      - All new fixtures (hookup only)
      
      PHASE 4: Finish
      - Inspections
      - Final terminations
      - Panel labeling
      
      Note: Drywall repair by others
      
      Total: $18,500
      Timeline: 5-7 days
    `,
    expectedClassification: 'electrical-service',
    expectedConfidenceMin: 70,
    expectedFlags: [],
    bidTotal: 18500,
    squareFootage: 1800,
    state: 'TX',
    zipCode: '75001',
  },
  {
    id: 73,
    name: 'Electrical - EV Charger Install',
    description: 'Install Level 2 EV charger in garage',
    bidText: `
      EV CHARGER INSTALLATION
      
      - Install 50A dedicated circuit
      - Run conduit from panel to garage
      - Install NEMA 14-50 outlet
      - Or: Install hardwired ChargePoint charger
      
      Includes permit
      
      Total: $1,800
    `,
    expectedClassification: 'electrical-service',
    expectedConfidenceMin: 60,
    expectedFlags: [],
    bidTotal: 1800,
    squareFootage: 0,
    state: 'CA',
    zipCode: '94102',
  },
  {
    id: 74,
    name: 'Electrical - Generator Install',
    description: 'Whole house generator with transfer switch',
    bidText: `
      STANDBY GENERATOR INSTALLATION
      
      GENERATOR:
      - Generac 22kW whole house generator
      - Concrete pad
      
      ELECTRICAL:
      - 200A automatic transfer switch
      - Load management module
      - Connect to main panel
      
      GAS:
      - Gas line to generator (by gas company)
      
      PERMITS:
      - Electrical permit
      - Gas permit (if needed)
      - Inspections
      
      Equipment + Installation: $12,500
    `,
    expectedClassification: 'electrical-service',
    expectedConfidenceMin: 65,
    expectedFlags: [],
    bidTotal: 12500,
    squareFootage: 0,
    state: 'FL',
    zipCode: '33139',
  },
  {
    id: 75,
    name: 'Electrical - Kitchen Circuit Add',
    description: 'Add dedicated circuits for kitchen',
    bidText: `
      KITCHEN ELECTRICAL UPGRADE
      
      Add circuits:
      - 2 x 20A small appliance circuits
      - 1 x 50A range circuit
      - 1 x 20A dishwasher circuit
      - 1 x 20A disposal circuit
      
      Install:
      - 4 new outlets (GFCI)
      - Range outlet (50A)
      - Under cabinet lights (4 fixtures)
      
      Total: $2,800
    `,
    expectedClassification: 'electrical-service',
    expectedConfidenceMin: 65,
    expectedFlags: [],
    bidTotal: 2800,
    squareFootage: 0,
    state: 'NC',
    zipCode: '27601',
  },

  // ============================================================================
  // PLUMBING-SERVICE (Scenarios 76-80)
  // Repipes, repairs, water heaters
  // ============================================================================
  {
    id: 76,
    name: 'Plumbing - Whole House Repipe',
    description: 'Replace all water supply lines',
    bidText: `
      WHOLE HOUSE REPIPE
      
      Remove:
      - All existing galvanized/polybutylene pipe
      
      Install:
      - New PEX water lines throughout
      - New manifold system
      - New shut-off valves at each fixture
      - Pressure regulator
      
      Includes:
      - All bathrooms (3)
      - Kitchen
      - Laundry
      - Exterior hose bibs (2)
      
      Drywall access patches included
      
      Permit included
      
      Total: $8,500
      Timeline: 2-3 days
    `,
    expectedClassification: 'plumbing-service',
    expectedConfidenceMin: 70,
    expectedFlags: [],
    bidTotal: 8500,
    squareFootage: 0,
    state: 'AZ',
    zipCode: '85001',
  },
  {
    id: 77,
    name: 'Plumbing - Water Heater Replace',
    description: 'Replace tank water heater',
    bidText: `
      WATER HEATER REPLACEMENT
      
      Remove:
      - Existing 50 gallon gas water heater
      - Dispose of old unit
      
      Install:
      - New 50 gallon Rheem gas water heater
      - New expansion tank
      - New drain pan
      - New flex connectors
      - New gas flex line
      - New T&P discharge line
      
      Code compliance items:
      - Seismic straps (if required)
      - Proper venting
      
      Permit included
      
      Total: $2,400
    `,
    expectedClassification: 'plumbing-service',
    expectedConfidenceMin: 65,
    expectedFlags: [],
    bidTotal: 2400,
    squareFootage: 0,
    state: 'GA',
    zipCode: '30301',
  },
  {
    id: 78,
    name: 'Plumbing - Tankless Conversion',
    description: 'Convert to tankless water heater',
    bidText: `
      TANKLESS WATER HEATER INSTALLATION
      
      Remove:
      - Old tank water heater
      
      Install:
      - Rinnai tankless water heater
      - New gas line (3/4")
      - New venting (stainless)
      - Condensate drain
      - Electrical outlet (dedicated circuit)
      - Recirculation pump (optional)
      
      Permits:
      - Plumbing permit
      - Gas permit
      - Electrical permit
      
      Total: $4,800
    `,
    expectedClassification: 'plumbing-service',
    expectedConfidenceMin: 65,
    expectedFlags: [],
    bidTotal: 4800,
    squareFootage: 0,
    state: 'TX',
    zipCode: '75201',
  },
  {
    id: 79,
    name: 'Plumbing - Sewer Line Replace',
    description: 'Replace main sewer line to street',
    bidText: `
      SEWER LINE REPLACEMENT
      
      SCOPE:
      - Camera inspection (complete)
      - Locate and mark utilities
      - Excavate trench (approx 60 LF)
      - Remove old clay/cast iron pipe
      - Install new 4" PVC
      - Connect to city main
      - Backfill and compact
      - Restore landscaping (basic)
      
      Permits:
      - Sewer permit
      - City inspection
      
      Total: $6,200
      Timeline: 2 days
    `,
    expectedClassification: 'plumbing-service',
    expectedConfidenceMin: 65,
    expectedFlags: [],
    bidTotal: 6200,
    squareFootage: 0,
    state: 'OH',
    zipCode: '44101',
  },
  {
    id: 80,
    name: 'Plumbing - Fixture Replacements',
    description: 'Replace multiple plumbing fixtures',
    bidText: `
      PLUMBING FIXTURE REPLACEMENT
      
      Master Bath:
      - Install new toilet (customer supplied)
      - Install new faucet (customer supplied)
      
      Hall Bath:
      - Install new toilet (customer supplied)
      - Install new faucet (customer supplied)
      
      Kitchen:
      - Install new faucet (customer supplied)
      - Install new garbage disposal
      
      Labor only (fixtures by homeowner)
      
      Total: $1,200
    `,
    expectedClassification: 'plumbing-service',
    expectedConfidenceMin: 60,
    expectedFlags: [],
    bidTotal: 1200,
    squareFootage: 0,
    state: 'IL',
    zipCode: '60601',
  },

  // ============================================================================
  // HVAC-SERVICE (Scenarios 81-82)
  // Repairs, maintenance, minor work
  // ============================================================================
  {
    id: 81,
    name: 'HVAC - Duct Cleaning & Repair',
    description: 'Clean ducts and seal leaks',
    bidText: `
      HVAC DUCT SERVICE
      
      CLEANING:
      - Clean all supply ducts
      - Clean all return ducts
      - Clean registers and grilles
      - Sanitize system
      
      REPAIRS:
      - Seal duct leaks (mastic)
      - Repair disconnected ducts (2)
      - Insulate exposed ducts in attic
      
      Total: $1,800
    `,
    expectedClassification: 'hvac-service',
    expectedConfidenceMin: 60,
    expectedFlags: [],
    bidTotal: 1800,
    squareFootage: 0,
    state: 'GA',
    zipCode: '30318',
  },
  {
    id: 82,
    name: 'HVAC - AC Repair',
    description: 'Diagnose and repair AC system',
    bidText: `
      AC REPAIR
      
      Diagnosis: System not cooling
      
      Found:
      - Capacitor failed
      - Refrigerant low (leak)
      
      Repair:
      - Replace capacitor
      - Locate and repair refrigerant leak
      - Recharge system (R-410A)
      - Test operation
      
      Total: $850
      
      Warranty: 90 days parts and labor
    `,
    expectedClassification: 'hvac-service',
    expectedConfidenceMin: 60,
    expectedFlags: [],
    bidTotal: 850,
    squareFootage: 0,
    state: 'FL',
    zipCode: '33139',
  },

  // ============================================================================
  // HVAC-REPLACEMENT (Scenarios 83-85)
  // Full system replacement
  // ============================================================================
  {
    id: 83,
    name: 'HVAC - Full System Replace',
    description: 'Replace AC and furnace',
    bidText: `
      HVAC SYSTEM REPLACEMENT
      
      REMOVE:
      - Existing 3-ton AC unit
      - Existing gas furnace
      - Old thermostat
      
      INSTALL:
      - Carrier 3-ton 16 SEER AC unit
      - Carrier 80% gas furnace
      - New line set
      - New thermostat (Ecobee)
      - New condensate line
      - New disconnect
      
      DUCTWORK:
      - Inspect and seal existing ducts
      - Replace supply plenum
      
      PERMITS:
      - Mechanical permit
      - Inspections
      
      Equipment + Install: $12,500
      10-year warranty on equipment
    `,
    expectedClassification: 'hvac-replacement',
    expectedConfidenceMin: 75,
    expectedFlags: [],
    bidTotal: 12500,
    squareFootage: 0,
    state: 'TX',
    zipCode: '75001',
  },
  {
    id: 84,
    name: 'HVAC - Heat Pump System',
    description: 'Install heat pump system',
    bidText: `
      HEAT PUMP INSTALLATION
      
      Remove old system
      
      Install:
      - Carrier 4-ton heat pump (18 SEER)
      - Air handler with electric backup
      - New ductwork modifications
      - Smart thermostat
      
      Electrical:
      - New 60A circuit for heat pump
      
      Permits included
      
      Total: $16,000
    `,
    expectedClassification: 'hvac-replacement',
    expectedConfidenceMin: 70,
    expectedFlags: [],
    bidTotal: 16000,
    squareFootage: 0,
    state: 'NC',
    zipCode: '27601',
  },
  {
    id: 85,
    name: 'HVAC - Mini-Split System',
    description: 'Install ductless mini-split',
    bidText: `
      MINI-SPLIT INSTALLATION
      
      SYSTEM:
      - Mitsubishi 3-zone mini-split
      - 1 outdoor unit
      - 3 indoor wall units
      
      LOCATIONS:
      - Living room (12K BTU)
      - Master bedroom (9K BTU)
      - Office (9K BTU)
      
      ELECTRICAL:
      - Dedicated circuit for outdoor unit
      - Wiring to each indoor unit
      
      INSTALLATION:
      - Mount all units
      - Run line sets
      - Commission system
      
      Permit included
      
      Total: $9,500
    `,
    expectedClassification: 'hvac-replacement',
    expectedConfidenceMin: 70,
    expectedFlags: [],
    bidTotal: 9500,
    squareFootage: 0,
    state: 'CO',
    zipCode: '80202',
  },
];
