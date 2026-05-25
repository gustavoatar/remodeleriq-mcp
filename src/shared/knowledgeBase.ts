/**
 * NailitDIY Knowledge Base
 * Contains examples of poorly written vs well-written contractor bids
 * Used to guide AI scoring and negotiation tips
 */

export interface BidExample {
  category: 'kitchen' | 'bathroom';
  type: 'poor' | 'good';
  description: string;
  text: string;
  issues?: string[];
  bestPractices?: string[];
}

export const bidExamples: BidExample[] = [
  // KITCHEN REMODEL EXAMPLES
  {
    category: 'kitchen',
    type: 'poor',
    description: 'Vague cabinet installation',
    text: 'Install new kitchen cabinets. Paint walls. Replace countertops.',
    issues: [
      'No cabinet brand, style, or material specified',
      'No paint color, brand, or number of coats',
      'No countertop material or edge profile specified',
      'No square footage or linear feet measurements',
      'No hardware specifications'
    ]
  },
  {
    category: 'kitchen',
    type: 'good',
    description: 'Detailed cabinet installation',
    text: 'Install 14 KraftMaid maple shaker-style base and wall cabinets (soft-close hinges) per attached layout. Apply 2 coats Sherwin-Williams Emerald Interior (SW 7015 Repose Gray) to 320 sq ft walls with primer. Install 42 linear feet Cambria Brittanicca quartz countertops with eased edge, including undermount sink cutout.',
    bestPractices: [
      'Specific brand and model named',
      'Material types clearly stated',
      'Measurements included',
      'Paint coats and color code specified',
      'Edge profiles and cutouts detailed'
    ]
  },
  {
    category: 'kitchen',
    type: 'poor',
    description: 'Vague appliance installation',
    text: 'Remove old appliances. Install new appliances provided by homeowner. Electrical and plumbing as needed.',
    issues: [
      'No specification of which appliances',
      '"As needed" is too vague - scope creep risk',
      'No mention of permits for electrical/gas work',
      'No disposal plan for old appliances'
    ]
  },
  {
    category: 'kitchen',
    type: 'good',
    description: 'Detailed appliance installation',
    text: 'Remove and haul away existing gas range, dishwasher, and refrigerator. Install homeowner-provided 36" GE Profile gas range (requires licensed plumber for gas connection - included), 24" Bosch 500 series dishwasher, and 36" French door refrigerator. Includes new dedicated 20-amp circuit for dishwasher per NEC code. All work permitted through Fulton County.',
    bestPractices: [
      'Specific appliances listed with sizes',
      'Licensed trades mentioned where required',
      'Code compliance referenced',
      'Permit jurisdiction specified',
      'Disposal included'
    ]
  },
  
  // BATHROOM REMODEL EXAMPLES
  {
    category: 'bathroom',
    type: 'poor',
    description: 'Vague tile work',
    text: 'Demo existing bathroom. Install new tile. New vanity and toilet. Update plumbing.',
    issues: [
      'No tile size, material, or pattern specified',
      'No waterproofing mentioned (critical for showers)',
      'No vanity brand, size, or countertop material',
      'No toilet model or rough-in size',
      '"Update plumbing" is dangerously vague'
    ]
  },
  {
    category: 'bathroom',
    type: 'good',
    description: 'Detailed tile work',
    text: 'Demo existing tub surround to studs. Install Schluter DITRA waterproof membrane on shower floor and Kerdi membrane on walls. Tile shower with 12x24 Emser Tile porcelain (Paladino White) in straight stack pattern with Schluter Jolly edge trim. 3x12 subway tile accent strip at 42" height. Floor: 2x2 mosaic drain area, 4x12 plank tile field. Includes new Kohler Archer 5\' alcove tub (white),DERA Farmhouse 36" vanity with Carrara marble top, and TOTO Drake II elongated toilet (12" rough-in).',
    bestPractices: [
      'Waterproofing system specified by brand',
      'Tile sizes, brands, and patterns detailed',
      'Trim and edge treatments included',
      'Fixture brands and models named',
      'Critical measurements included'
    ]
  },
  {
    category: 'bathroom',
    type: 'poor',
    description: 'Vague electrical/ventilation',
    text: 'Add bathroom fan. Update lighting. GFI outlets.',
    issues: [
      'No fan CFM rating or noise level',
      'No lighting fixture types or locations',
      'No mention of permits for electrical work',
      'No specification of outlet quantities or locations'
    ]
  },
  {
    category: 'bathroom',
    type: 'good',
    description: 'Detailed electrical/ventilation',
    text: 'Install Panasonic WhisperCeiling 110 CFM exhaust fan (FV-11VQ5) vented through roof with new 4" duct. Replace existing vanity light with 36" Kichler LED bath bar (3000K). Install 2 new 20-amp GFCI outlets per NEC bathroom requirements. All electrical work by licensed electrician, permitted through local building department.',
    bestPractices: [
      'Fan CFM and model specified',
      'Venting path detailed',
      'Light fixture with color temp',
      'Code requirements referenced',
      'Licensed trade and permit specified'
    ]
  },
  {
    category: 'bathroom',
    type: 'poor',
    description: 'Vague shower door',
    text: 'Install new glass shower door.',
    issues: [
      'No glass thickness specified',
      'No door style (frameless, semi-frameless)',
      'No hardware finish',
      'No measurements'
    ]
  },
  {
    category: 'bathroom',
    type: 'good',
    description: 'Detailed shower door',
    text: 'Install DreamLine Unidoor Plus 58-58.5" W x 72" H frameless hinged shower door, 3/8" clear tempered glass with brushed nickel hardware. Includes professional measurement, templating, and installation with silicone seal and towel bar.',
    bestPractices: [
      'Brand and model specified',
      'Exact dimensions included',
      'Glass thickness and type stated',
      'Hardware finish named',
      'Installation details included'
    ]
  }
];

export const redFlagPatterns = [
  {
    pattern: /as\s+needed|if\s+necessary|where\s+required|tbd|to\s+be\s+determined/gi,
    flag: 'Vague scope language detected',
    risk: 'high',
    tip: 'Ask contractor to specify exact quantities and conditions that trigger additional work'
  },
  {
    pattern: /allowance|budget\s+for|estimate|approximately|about/gi,
    flag: 'Allowance or estimate language detected',
    risk: 'medium',
    tip: 'Request fixed pricing or caps on allowance items with clear overage approval process'
  },
  {
    pattern: /extra|additional|change\s+order|unforeseen/gi,
    flag: 'Change order language detected',
    risk: 'medium',
    tip: 'Ask contractor to define what triggers a change order and approval process'
  },
  {
    pattern: /homeowner\s+responsible|owner\s+to\s+(provide|supply|purchase)/gi,
    flag: 'Homeowner responsibility language detected',
    risk: 'medium',
    tip: 'Clarify exactly what you need to provide and timeline for delivery'
  }
];

export const paymentScheduleExamples = {
  highRisk: [
    { deposit: 50, description: '50% deposit, 50% completion' },
    { deposit: 40, description: '40% start, 60% end' },
    { deposit: 33, description: 'One-third upfront, one-third middle, one-third end' }
  ],
  balanced: [
    { 
      schedule: '10% deposit, 30% after demolition, 30% after rough-in, 20% after finishes, 10% final walkthrough',
      description: 'Milestone-based payment protects both parties'
    },
    {
      schedule: '15% deposit, 25% materials delivery, 25% rough-in complete, 25% finishes, 10% punch list',
      description: 'Materials-aligned payment schedule'
    }
  ]
};

export const negotiationTips = {
  missingLicense: [
    'Can you provide your state contractor license number?',
    'Is your company registered with the Secretary of State?',
    'Do you carry general liability and workers compensation insurance?'
  ],
  permitIssues: [
    'Will you be pulling the required permits for this project?',
    'Can you clarify who is responsible for scheduling inspections?',
    'What happens if the project fails inspection?'
  ],
  depositTooHigh: [
    'Would you consider a milestone-based payment schedule instead of a large upfront deposit?',
    'What materials need to be ordered that require upfront payment?',
    'Can we structure payments around completed phases of work?'
  ],
  vagueScope: [
    'Can you provide specific brands and model numbers for all materials?',
    'What is the exact square footage/linear feet for this work?',
    'Can you itemize labor and materials separately?'
  ],
  missingWarranty: [
    'What warranty do you offer on workmanship?',
    'How are manufacturer warranties handled for installed materials?',
    'What is your process for addressing issues after project completion?'
  ]
};
