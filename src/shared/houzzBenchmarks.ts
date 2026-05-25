/**
 * Houzz cost benchmarks for residential construction projects
 * Data sourced from Houzz.com cost guides (2024)
 * 
 * @deprecated This file is being replaced by smartPricingRules.ts
 * New code should import from smartPricingRules.ts instead.
 * This file is retained for backward compatibility during migration.
 */

export type ProjectType = 
  | 'kitchen' | 'bathroom' | 'roof' | 'home-addition' | 'window'
  | 'countertops-kitchen' | 'countertops-granite' | 'basement'
  | 'paver-patio' | 'ac-installation' | 'hardwood-floor'
  | 'laminate-floor' | 'exterior-painting' | 'vinyl-siding'
  | 'carpet' | 'water-heater' | 'furnace';

export interface HouzzProjectBenchmark {
  projectType: string;
  citationUrl: string;
  
  // Total project costs
  totalCostLow: number | null;
  totalCostHigh: number | null;
  
  // Labor costs (dollars)
  laborCostLow: number | null;
  laborCostHigh: number | null;
  
  // Labor percentage (0.0-1.0)
  laborPercentLow: number | null;
  laborPercentHigh: number | null;
  
  // PSF rates
  psfLow: number | null;
  psfHigh: number | null;
  
  // Material costs
  materialCostLow: number | null;
  materialCostHigh: number | null;
  materialPsfLow: number | null;
  materialPsfHigh: number | null;
  
  // Scope info
  scopeDescription: string;
  typicalSqFt: number | null;
}

export const HOUZZ_BENCHMARKS: Record<string, HouzzProjectBenchmark> = {
  'kitchen-remodel': {
    projectType: 'Kitchen Remodel',
    citationUrl: 'https://www.houzz.com/cost/9-cost-to-remodel-a-kitchen',
    totalCostLow: 26500,
    totalCostHigh: null,
    laborCostLow: 5300,
    laborCostHigh: 6625,
    laborPercentLow: 0.20,
    laborPercentHigh: 0.25,
    psfLow: null,
    psfHigh: null,
    materialCostLow: null,
    materialCostHigh: null,
    materialPsfLow: null,
    materialPsfHigh: null,
    scopeDescription: 'Full kitchen remodel including cabinets, countertops, flooring, appliances, plumbing, and electrical work.',
    typicalSqFt: null
  },
  
  'bathroom-remodel': {
    projectType: 'Bathroom Remodel',
    citationUrl: 'https://www.houzz.com/cost/5-cost-to-remodel-a-bathroom',
    totalCostLow: 12350,
    totalCostHigh: 13650,
    laborCostLow: 6175,
    laborCostHigh: 6825,
    laborPercentLow: 0.50,
    laborPercentHigh: 0.50,
    psfLow: null,
    psfHigh: null,
    materialCostLow: null,
    materialCostHigh: null,
    materialPsfLow: null,
    materialPsfHigh: null,
    scopeDescription: 'Includes demolition, installation of flooring, wall coverings, fixtures, and associated plumbing/electrical work.',
    typicalSqFt: null
  },
  
  'roof-replacement': {
    projectType: 'Roof Replacement',
    citationUrl: 'https://www.houzz.com/cost/7-cost-to-replace-a-roof',
    totalCostLow: null,
    totalCostHigh: null,
    laborCostLow: null,
    laborCostHigh: null,
    laborPercentLow: 0.40,
    laborPercentHigh: 0.50,
    psfLow: null,
    psfHigh: null,
    materialCostLow: null,
    materialCostHigh: null,
    materialPsfLow: null,
    materialPsfHigh: null,
    scopeDescription: 'Removing old roof, repairing underlayment, and installing new material.',
    typicalSqFt: null
  },
  
  'home-addition': {
    projectType: 'Home Addition',
    citationUrl: 'https://www.houzz.com/cost/8-cost-to-build-a-home-addition',
    totalCostLow: 20000,
    totalCostHigh: 60000,
    laborCostLow: 6000,
    laborCostHigh: 30000,
    laborPercentLow: 0.30,
    laborPercentHigh: 0.50,
    psfLow: null,
    psfHigh: null,
    materialCostLow: null,
    materialCostHigh: null,
    materialPsfLow: null,
    materialPsfHigh: null,
    scopeDescription: 'Constructing extra square footage.',
    typicalSqFt: null
  },
  
  'window-installation': {
    projectType: 'Window Installation',
    citationUrl: 'https://www.houzz.com/cost/11-cost-to-install-or-replace-a-window',
    totalCostLow: 2216,
    totalCostHigh: 2449,
    laborCostLow: null,
    laborCostHigh: null,
    laborPercentLow: null,
    laborPercentHigh: null,
    psfLow: null,
    psfHigh: null,
    materialCostLow: null,
    materialCostHigh: null,
    materialPsfLow: null,
    materialPsfHigh: null,
    scopeDescription: 'Installation or replacement of windows including style, size, and glass pane type selection and labor.',
    typicalSqFt: null
  },
  
  'kitchen-countertops': {
    projectType: 'Kitchen Countertops',
    citationUrl: 'https://www.houzz.com/cost/25-cost-to-install-kitchen-countertops',
    totalCostLow: 4309,
    totalCostHigh: 4762,
    laborCostLow: null,
    laborCostHigh: null,
    laborPercentLow: null,
    laborPercentHigh: null,
    psfLow: 143.63,
    psfHigh: 158.73,
    materialCostLow: null,
    materialCostHigh: null,
    materialPsfLow: null,
    materialPsfHigh: null,
    scopeDescription: 'Installation of countertops, including material and labor for a typical 30 sq ft project.',
    typicalSqFt: 30
  },
  
  'hardwood-floor': {
    projectType: 'Hardwood Floor Installation',
    citationUrl: 'https://www.houzz.com/cost/2-cost-to-install-hardwood-flooring',
    totalCostLow: 15200,
    totalCostHigh: 16800,
    laborCostLow: null,
    laborCostHigh: null,
    laborPercentLow: null,
    laborPercentHigh: null,
    psfLow: null,
    psfHigh: null,
    materialCostLow: null,
    materialCostHigh: null,
    materialPsfLow: null,
    materialPsfHigh: null,
    scopeDescription: 'Installation of hardwood flooring for typical residential space.',
    typicalSqFt: null
  },
  
  'laminate-floor': {
    projectType: 'Laminate Flooring Installation',
    citationUrl: 'https://www.houzz.com/cost/30-cost-to-install-laminate-flooring',
    totalCostLow: 8295,
    totalCostHigh: 9168,
    laborCostLow: null,
    laborCostHigh: null,
    laborPercentLow: null,
    laborPercentHigh: null,
    psfLow: null,
    psfHigh: null,
    materialCostLow: null,
    materialCostHigh: null,
    materialPsfLow: null,
    materialPsfHigh: null,
    scopeDescription: 'Installation of laminate flooring, including underlayment and material selection.',
    typicalSqFt: null
  },
  
  'flooring-general': {
    projectType: 'Flooring Installation',
    citationUrl: 'https://www.houzz.com/cost/15-cost-to-install-flooring',
    totalCostLow: 7967,
    totalCostHigh: 8806,
    laborCostLow: null,
    laborCostHigh: null,
    laborPercentLow: 0.30,
    laborPercentHigh: 0.45,
    psfLow: null,
    psfHigh: null,
    materialCostLow: null,
    materialCostHigh: null,
    materialPsfLow: null,
    materialPsfHigh: null,
    scopeDescription: 'Installation of new flooring throughout a home, including material selection, preparation of subfloor, removal of existing flooring, and installation.',
    typicalSqFt: null
  },
  
  'paver-patio': {
    projectType: 'Paver Patio Installation',
    citationUrl: 'https://www.houzz.com/cost/21-cost-to-install-a-paver-patio',
    totalCostLow: 3150,
    totalCostHigh: 9550,
    laborCostLow: 3600,
    laborCostHigh: null,
    laborPercentLow: null,
    laborPercentHigh: null,
    psfLow: 8.50,
    psfHigh: 21.00,
    materialCostLow: 940,
    materialCostHigh: 4140,
    materialPsfLow: 2.35,
    materialPsfHigh: 10.35,
    scopeDescription: 'Installation of a paver patio (approx 400 sq ft) including base layers, grading, and labor.',
    typicalSqFt: 400
  },
  
  'ac-installation': {
    projectType: 'Air Conditioning Installation',
    citationUrl: 'https://www.houzz.com/cost/4-cost-to-install-or-replace-air-conditioning',
    totalCostLow: 2500,
    totalCostHigh: 5200,
    laborCostLow: null,
    laborCostHigh: null,
    laborPercentLow: 0.30,
    laborPercentHigh: 0.40,
    psfLow: null,
    psfHigh: null,
    materialCostLow: null,
    materialCostHigh: null,
    materialPsfLow: null,
    materialPsfHigh: null,
    scopeDescription: 'Installing or replacing a central or split AC unit in a U.S. home.',
    typicalSqFt: null
  },
  
  'granite-countertops': {
    projectType: 'Granite Countertop Installation',
    citationUrl: 'https://www.houzz.com/cost/20-cost-to-install-granite-countertops',
    totalCostLow: 1700,
    totalCostHigh: 2400,
    laborCostLow: 570,
    laborCostHigh: null,
    laborPercentLow: null,
    laborPercentHigh: null,
    psfLow: 59,
    psfHigh: 78,
    materialCostLow: 1200,
    materialCostHigh: 1800,
    materialPsfLow: 40,
    materialPsfHigh: 60,
    scopeDescription: 'Installation of granite countertops covering roughly 30 sq ft.',
    typicalSqFt: 30
  },
  
  'basement-finishing': {
    projectType: 'Basement Finishing',
    citationUrl: 'https://www.houzz.com/cost/54-cost-to-finish-a-basement',
    totalCostLow: 20216,
    totalCostHigh: 22344,
    laborCostLow: 5054,
    laborCostHigh: 6703,
    laborPercentLow: 0.25,
    laborPercentHigh: 0.30,
    psfLow: null,
    psfHigh: null,
    materialCostLow: null,
    materialCostHigh: null,
    materialPsfLow: null,
    materialPsfHigh: null,
    scopeDescription: 'Involves waterproofing, drywall, electrical, plumbing, and flooring.',
    typicalSqFt: null
  },
  
  'vinyl-siding': {
    projectType: 'Vinyl Siding Installation',
    citationUrl: 'https://www.houzz.com/cost/65-cost-to-install-vinyl-siding',
    totalCostLow: 5900,
    totalCostHigh: 7050,
    laborCostLow: null,
    laborCostHigh: null,
    laborPercentLow: null,
    laborPercentHigh: null,
    psfLow: 3.00,
    psfHigh: 3.50,
    materialCostLow: null,
    materialCostHigh: null,
    materialPsfLow: 1.30,
    materialPsfHigh: 1.50,
    scopeDescription: 'Installing vinyl siding including material and labor.',
    typicalSqFt: null
  },
  
  'carpet': {
    projectType: 'Carpet Installation',
    citationUrl: 'https://www.houzz.com/cost/12-cost-to-install-carpet',
    totalCostLow: 1200,
    totalCostHigh: 5500,
    laborCostLow: null,
    laborCostHigh: null,
    laborPercentLow: null,
    laborPercentHigh: null,
    psfLow: 2,
    psfHigh: 7,
    materialCostLow: null,
    materialCostHigh: null,
    materialPsfLow: 2,
    materialPsfHigh: 7,
    scopeDescription: 'Installation of new carpet including selecting material, padding, and disposal of old carpet.',
    typicalSqFt: null
  },
  
  'water-heater': {
    projectType: 'Water Heater Installation',
    citationUrl: 'https://www.houzz.com/cost/6-cost-to-install-a-water-heater',
    totalCostLow: 600,
    totalCostHigh: 1200,
    laborCostLow: null,
    laborCostHigh: null,
    laborPercentLow: null,
    laborPercentHigh: null,
    psfLow: null,
    psfHigh: null,
    materialCostLow: null,
    materialCostHigh: null,
    materialPsfLow: null,
    materialPsfHigh: null,
    scopeDescription: 'Installation of a new water heater including removal and connection.',
    typicalSqFt: null
  },
  
  'furnace': {
    projectType: 'Furnace Installation',
    citationUrl: 'https://www.houzz.com/cost/23-cost-to-install-a-furnace',
    totalCostLow: 950,
    totalCostHigh: 2050,
    laborCostLow: null,
    laborCostHigh: null,
    laborPercentLow: null,
    laborPercentHigh: null,
    psfLow: null,
    psfHigh: null,
    materialCostLow: null,
    materialCostHigh: null,
    materialPsfLow: null,
    materialPsfHigh: null,
    scopeDescription: 'Installation of a new furnace with existing ductwork.',
    typicalSqFt: null
  },
  
  'quartz-countertops': {
    projectType: 'Quartz Countertop Installation',
    citationUrl: 'https://www.houzz.com/cost/16-cost-to-install-quartz-countertops',
    totalCostLow: 4740,
    totalCostHigh: 5239,
    laborCostLow: null,
    laborCostHigh: null,
    laborPercentLow: null,
    laborPercentHigh: null,
    psfLow: null,
    psfHigh: null,
    materialCostLow: null,
    materialCostHigh: null,
    materialPsfLow: null,
    materialPsfHigh: null,
    scopeDescription: 'Installation of quartz countertops with cost varying by square footage and grade.',
    typicalSqFt: 30
  },
  
  'exterior-painting': {
    projectType: 'Exterior Painting',
    citationUrl: 'https://www.houzz.com/cost/13-cost-to-paint-house-exterior',
    totalCostLow: null,
    totalCostHigh: null,
    laborCostLow: null,
    laborCostHigh: null,
    laborPercentLow: 0.80,
    laborPercentHigh: 0.85,
    psfLow: null,
    psfHigh: null,
    materialCostLow: null,
    materialCostHigh: null,
    materialPsfLow: null,
    materialPsfHigh: null,
    scopeDescription: 'Painting home exterior.',
    typicalSqFt: null
  },
  
  'fence': {
    projectType: 'Fence Installation',
    citationUrl: 'https://www.houzz.com/cost/10-cost-to-install-a-fence',
    totalCostLow: null,
    totalCostHigh: null,
    laborCostLow: null,
    laborCostHigh: null,
    laborPercentLow: 0.50,
    laborPercentHigh: null,
    psfLow: null,
    psfHigh: null,
    materialCostLow: null,
    materialCostHigh: null,
    materialPsfLow: null,
    materialPsfHigh: null,
    scopeDescription: 'Installation of a new fence.',
    typicalSqFt: null
  },
  
  // === NEW PROJECT TYPES (2024-2025 expansion) ===
  
  'garage-door': {
    projectType: 'Garage Door Installation',
    citationUrl: 'https://www.houzz.com/cost/51-cost-to-install-a-garage-door',
    totalCostLow: 800,
    totalCostHigh: 5500,
    laborCostLow: 200,
    laborCostHigh: 500,
    laborPercentLow: 0.15,
    laborPercentHigh: 0.25,
    psfLow: null,
    psfHigh: null,
    materialCostLow: 500,
    materialCostHigh: 4500,
    materialPsfLow: null,
    materialPsfHigh: null,
    scopeDescription: 'Installation of garage door with or without opener. Includes single/double doors, insulated options, and smart openers.',
    typicalSqFt: null
  },
  
  'cabinet-refinishing': {
    projectType: 'Cabinet Refinishing',
    citationUrl: 'https://www.houzz.com/cost/40-cost-to-refinish-cabinets',
    totalCostLow: 1200,
    totalCostHigh: 8000,
    laborCostLow: 900,
    laborCostHigh: 6000,
    laborPercentLow: 0.70,
    laborPercentHigh: 0.80,
    psfLow: null,
    psfHigh: null,
    materialCostLow: 200,
    materialCostHigh: 1500,
    materialPsfLow: null,
    materialPsfHigh: null,
    scopeDescription: 'Sanding, priming, and repainting or restaining existing cabinet boxes and doors. Does not include new doors or hardware.',
    typicalSqFt: null
  },
  
  'cabinet-refacing': {
    projectType: 'Cabinet Refacing',
    citationUrl: 'https://www.houzz.com/cost/41-cost-to-reface-cabinets',
    totalCostLow: 3500,
    totalCostHigh: 15000,
    laborCostLow: 1500,
    laborCostHigh: 6000,
    laborPercentLow: 0.35,
    laborPercentHigh: 0.45,
    psfLow: null,
    psfHigh: null,
    materialCostLow: 2000,
    materialCostHigh: 9000,
    materialPsfLow: null,
    materialPsfHigh: null,
    scopeDescription: 'Replacing cabinet doors and drawer fronts while keeping existing cabinet boxes. Includes new veneer, doors, hinges, and hardware.',
    typicalSqFt: null
  },
  
  'cabinet-replacement': {
    projectType: 'Cabinet Replacement',
    citationUrl: 'https://www.houzz.com/cost/42-cost-to-install-kitchen-cabinets',
    totalCostLow: 4500,
    totalCostHigh: 75000,
    laborCostLow: 1500,
    laborCostHigh: 15000,
    laborPercentLow: 0.20,
    laborPercentHigh: 0.30,
    psfLow: null,
    psfHigh: null,
    materialCostLow: 3000,
    materialCostHigh: 60000,
    materialPsfLow: null,
    materialPsfHigh: null,
    scopeDescription: 'Full cabinet replacement including demolition, new cabinet boxes, doors, drawers, and installation. Range covers builder to luxury grade.',
    typicalSqFt: null
  },
  
  'cabinet-new-line': {
    projectType: 'New Cabinet Line',
    citationUrl: 'https://www.houzz.com/cost/42-cost-to-install-kitchen-cabinets',
    totalCostLow: 600,
    totalCostHigh: 7200,
    laborCostLow: 200,
    laborCostHigh: 1800,
    laborPercentLow: 0.25,
    laborPercentHigh: 0.30,
    psfLow: null,
    psfHigh: null,
    materialCostLow: 400,
    materialCostHigh: 5400,
    materialPsfLow: null,
    materialPsfHigh: null,
    scopeDescription: 'Adding a new run of cabinets to existing kitchen or other room. Per linear foot pricing.',
    typicalSqFt: null
  },
  
  'roofing-repair': {
    projectType: 'Roof Repair',
    citationUrl: 'https://www.houzz.com/cost/7-cost-to-replace-a-roof',
    totalCostLow: 300,
    totalCostHigh: 10000,
    laborCostLow: 150,
    laborCostHigh: 5000,
    laborPercentLow: 0.45,
    laborPercentHigh: 0.55,
    psfLow: null,
    psfHigh: null,
    materialCostLow: 100,
    materialCostHigh: 4000,
    materialPsfLow: null,
    materialPsfHigh: null,
    scopeDescription: 'Minor to moderate roof repairs including patching, shingle replacement, flashing repair, and leak fixes.',
    typicalSqFt: null
  },
  
  'roofing-storm': {
    projectType: 'Storm Damage Roof Repair',
    citationUrl: 'https://www.houzz.com/cost/7-cost-to-replace-a-roof',
    totalCostLow: 300,
    totalCostHigh: 15000,
    laborCostLow: 150,
    laborCostHigh: 7500,
    laborPercentLow: 0.45,
    laborPercentHigh: 0.55,
    psfLow: null,
    psfHigh: null,
    materialCostLow: 150,
    materialCostHigh: 7500,
    materialPsfLow: null,
    materialPsfHigh: null,
    scopeDescription: 'Repair of storm/wind damage including tarping, shingle replacement, and structural repair.',
    typicalSqFt: null
  },
  
  'roofing-hail': {
    projectType: 'Hail Damage Roof Repair',
    citationUrl: 'https://www.houzz.com/cost/7-cost-to-replace-a-roof',
    totalCostLow: 2000,
    totalCostHigh: 25000,
    laborCostLow: 1000,
    laborCostHigh: 12500,
    laborPercentLow: 0.45,
    laborPercentHigh: 0.55,
    psfLow: null,
    psfHigh: null,
    materialCostLow: 1000,
    materialCostHigh: 12500,
    materialPsfLow: null,
    materialPsfHigh: null,
    scopeDescription: 'Repair or partial replacement due to hail damage. Often insurance claim work.',
    typicalSqFt: null
  },
  
  'roofing-fire': {
    projectType: 'Fire Damage Roof Repair',
    citationUrl: 'https://www.houzz.com/cost/7-cost-to-replace-a-roof',
    totalCostLow: 3000,
    totalCostHigh: 40000,
    laborCostLow: 1500,
    laborCostHigh: 20000,
    laborPercentLow: 0.45,
    laborPercentHigh: 0.55,
    psfLow: null,
    psfHigh: null,
    materialCostLow: 1500,
    materialCostHigh: 20000,
    materialPsfLow: null,
    materialPsfHigh: null,
    scopeDescription: 'Repair or replacement due to fire damage including structural repair, new decking, and roofing materials.',
    typicalSqFt: null
  },
  
  'door-interior': {
    projectType: 'Interior Door Installation',
    citationUrl: 'https://www.houzz.com/cost/37-cost-to-install-an-interior-door',
    totalCostLow: 150,
    totalCostHigh: 1200,
    laborCostLow: 75,
    laborCostHigh: 400,
    laborPercentLow: 0.35,
    laborPercentHigh: 0.50,
    psfLow: null,
    psfHigh: null,
    materialCostLow: 75,
    materialCostHigh: 800,
    materialPsfLow: null,
    materialPsfHigh: null,
    scopeDescription: 'Installation of interior doors including bedroom, bathroom, and closet doors. Per door pricing.',
    typicalSqFt: null
  },
  
  'door-patio': {
    projectType: 'Patio Door Installation',
    citationUrl: 'https://www.houzz.com/cost/38-cost-to-install-a-patio-door',
    totalCostLow: 1200,
    totalCostHigh: 8000,
    laborCostLow: 300,
    laborCostHigh: 2000,
    laborPercentLow: 0.20,
    laborPercentHigh: 0.30,
    psfLow: null,
    psfHigh: null,
    materialCostLow: 900,
    materialCostHigh: 6000,
    materialPsfLow: null,
    materialPsfHigh: null,
    scopeDescription: 'Installation of sliding glass or hinged patio doors including frame, hardware, and weatherstripping.',
    typicalSqFt: null
  },
  
  'door-french': {
    projectType: 'French Door Installation',
    citationUrl: 'https://www.houzz.com/cost/39-cost-to-install-french-doors',
    totalCostLow: 1800,
    totalCostHigh: 10000,
    laborCostLow: 500,
    laborCostHigh: 2500,
    laborPercentLow: 0.20,
    laborPercentHigh: 0.30,
    psfLow: null,
    psfHigh: null,
    materialCostLow: 1300,
    materialCostHigh: 7500,
    materialPsfLow: null,
    materialPsfHigh: null,
    scopeDescription: 'Installation of French doors including framing, hardware, and finishing. Interior or exterior applications.',
    typicalSqFt: null
  },
  
  'window-repair': {
    projectType: 'Window Repair',
    citationUrl: 'https://www.houzz.com/cost/11-cost-to-install-or-replace-a-window',
    totalCostLow: 75,
    totalCostHigh: 800,
    laborCostLow: 50,
    laborCostHigh: 400,
    laborPercentLow: 0.50,
    laborPercentHigh: 0.65,
    psfLow: null,
    psfHigh: null,
    materialCostLow: 25,
    materialCostHigh: 400,
    materialPsfLow: null,
    materialPsfHigh: null,
    scopeDescription: 'Repair of existing windows including glass replacement, seal repair, hardware fixes, and weatherstripping. Per window pricing.',
    typicalSqFt: null
  },
  
  // === TRADE-SPECIFIC LABOR RATIOS (GC LOGIC 2025) ===
  
  'electrical-service': {
    projectType: 'Electrical Service/Upgrade',
    citationUrl: 'https://www.houzz.com/cost/electrical',
    totalCostLow: 500,
    totalCostHigh: 15000,
    laborCostLow: null,
    laborCostHigh: null,
    laborPercentLow: 0.65,
    laborPercentHigh: 0.75,
    psfLow: null,
    psfHigh: null,
    materialCostLow: null,
    materialCostHigh: null,
    materialPsfLow: null,
    materialPsfHigh: null,
    scopeDescription: 'Electrical work including panel upgrades, circuit additions, and rewiring. Labor-intensive trade.',
    typicalSqFt: null
  },
  
  'plumbing-service': {
    projectType: 'Plumbing Service/Repair',
    citationUrl: 'https://www.houzz.com/cost/plumbing',
    totalCostLow: 200,
    totalCostHigh: 8000,
    laborCostLow: null,
    laborCostHigh: null,
    laborPercentLow: 0.65,
    laborPercentHigh: 0.75,
    psfLow: null,
    psfHigh: null,
    materialCostLow: null,
    materialCostHigh: null,
    materialPsfLow: null,
    materialPsfHigh: null,
    scopeDescription: 'Plumbing work including pipe repair, fixture installation, and drain/sewer work. Labor-intensive trade.',
    typicalSqFt: null
  },
  
  'tile-installation': {
    projectType: 'Tile Installation',
    citationUrl: 'https://www.houzz.com/cost/tile',
    totalCostLow: 800,
    totalCostHigh: 15000,
    laborCostLow: null,
    laborCostHigh: null,
    laborPercentLow: 0.70,
    laborPercentHigh: 0.80,
    psfLow: 10,
    psfHigh: 35,
    materialCostLow: null,
    materialCostHigh: null,
    materialPsfLow: 3,
    materialPsfHigh: 15,
    scopeDescription: 'Tile floor or wall installation including substrate prep, mortar, and grout. Highly labor-intensive.',
    typicalSqFt: null
  },
  
  'drywall': {
    projectType: 'Drywall Installation/Repair',
    citationUrl: 'https://www.houzz.com/cost/drywall',
    totalCostLow: 500,
    totalCostHigh: 8000,
    laborCostLow: null,
    laborCostHigh: null,
    laborPercentLow: 0.60,
    laborPercentHigh: 0.75,
    psfLow: 1.50,
    psfHigh: 3.50,
    materialCostLow: null,
    materialCostHigh: null,
    materialPsfLow: 0.30,
    materialPsfHigh: 0.80,
    scopeDescription: 'Drywall hanging, taping, mudding, and finishing. Labor-intensive trade.',
    typicalSqFt: null
  },
  
  'interior-painting': {
    projectType: 'Interior Painting',
    citationUrl: 'https://www.houzz.com/cost/painting',
    totalCostLow: 500,
    totalCostHigh: 6000,
    laborCostLow: null,
    laborCostHigh: null,
    laborPercentLow: 0.75,
    laborPercentHigh: 0.85,
    psfLow: 2,
    psfHigh: 6,
    materialCostLow: null,
    materialCostHigh: null,
    materialPsfLow: 0.30,
    materialPsfHigh: 0.80,
    scopeDescription: 'Interior wall and trim painting including prep, primer, and finish coats. Highly labor-intensive.',
    typicalSqFt: null
  }
};

/**
 * Map internal project types to Houzz benchmark keys
 */
export const PROJECT_TYPE_TO_HOUZZ: Record<string, string> = {
  'kitchen': 'kitchen-remodel',
  'bathroom': 'bathroom-remodel',
  'roof': 'roof-replacement',
  'roofing': 'roof-replacement',
  'roofing-repair': 'roofing-repair',
  'roofing-storm': 'roofing-storm',
  'roofing-hail': 'roofing-hail',
  'roofing-fire': 'roofing-fire',
  'roofing-insurance': 'roofing-hail', // Map insurance to hail as common case
  'addition': 'home-addition',
  'home-addition': 'home-addition',
  'windows': 'window-installation',
  'windows-doors': 'window-installation',
  'window-repair': 'window-repair',
  'door-interior': 'door-interior',
  'door-patio': 'door-patio',
  'door-french': 'door-french',
  'countertops': 'kitchen-countertops',
  'countertops-granite': 'granite-countertops',
  'countertops-quartz': 'quartz-countertops',
  'flooring': 'flooring-general',
  'hardwood': 'hardwood-floor',
  'laminate': 'laminate-floor',
  'carpet': 'carpet',
  'patio': 'paver-patio',
  'hvac': 'ac-installation',
  'ac': 'ac-installation',
  'basement': 'basement-finishing',
  'siding': 'vinyl-siding',
  'water-heater': 'water-heater',
  'furnace': 'furnace',
  'painting': 'exterior-painting',
  'exterior-painting': 'exterior-painting',
  'fence': 'fence',
  'garage-door': 'garage-door',
  'cabinet-refinishing': 'cabinet-refinishing',
  'cabinet-refacing': 'cabinet-refacing',
  'cabinet-replacement': 'cabinet-replacement',
  'cabinet-new-line': 'cabinet-new-line',
  // Trade-specific mappings
  'electrical': 'electrical-service',
  'electrical-service': 'electrical-service',
  'plumbing': 'plumbing-service',
  'plumbing-service': 'plumbing-service',
  'tile': 'tile-installation',
  'tile-installation': 'tile-installation',
  'drywall': 'drywall',
  'painting-interior': 'interior-painting',
  'interior-painting': 'interior-painting'
};

/**
 * Get Houzz benchmark for a project type
 */
export function getHouzzBenchmark(projectType: string): HouzzProjectBenchmark | null {
  const normalizedType = projectType.toLowerCase().trim();
  const houzzKey = PROJECT_TYPE_TO_HOUZZ[normalizedType] || normalizedType;
  return HOUZZ_BENCHMARKS[houzzKey] || null;
}

/**
 * Get expected labor percentage range for a project type
 */
export function getExpectedLaborRatio(projectType: string): { low: number; high: number } | null {
  const benchmark = getHouzzBenchmark(projectType);
  if (!benchmark || benchmark.laborPercentLow === null) {
    return null;
  }
  return {
    low: benchmark.laborPercentLow,
    high: benchmark.laborPercentHigh ?? benchmark.laborPercentLow
  };
}

/**
 * Get total cost range for a project type
 */
export function getHouzzTotalCostRange(projectType: string): { low: number; high: number } | null {
  const benchmark = getHouzzBenchmark(projectType);
  if (!benchmark || benchmark.totalCostLow === null) {
    return null;
  }
  return {
    low: benchmark.totalCostLow,
    high: benchmark.totalCostHigh ?? benchmark.totalCostLow
  };
}

/**
 * Get PSF range for a project type
 */
export function getHouzzPsfRange(projectType: string): { low: number; high: number } | null {
  const benchmark = getHouzzBenchmark(projectType);
  if (!benchmark || benchmark.psfLow === null) {
    return null;
  }
  return {
    low: benchmark.psfLow,
    high: benchmark.psfHigh ?? benchmark.psfLow
  };
}
