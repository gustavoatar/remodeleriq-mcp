// Productivity Rates for Construction Trades
// Used to convert hourly wages to $/sf estimates
// Based on industry standards and RS Means data approximations

/**
 * Productivity rates in square feet per hour per worker
 * These represent typical output rates for experienced workers
 * under normal conditions. Actual rates vary by:
 * - Worker experience level
 * - Job site conditions
 * - Material quality/type
 * - Complexity of work
 */

export interface ProductivityRate {
  sfPerHour: number;           // Square feet completed per hour
  description: string;         // What the rate covers
  varianceRange: [number, number]; // Low/high multipliers for conditions
}

// Productivity rates by trade/task (SF per worker-hour)
export const PRODUCTIVITY_RATES: Record<string, ProductivityRate> = {
  // Painting
  'painting-walls': {
    sfPerHour: 100,
    description: 'Interior wall painting, 2 coats, rolling',
    varianceRange: [0.7, 1.3],
  },
  'painting-trim': {
    sfPerHour: 40,
    description: 'Trim and detail painting, brushwork',
    varianceRange: [0.6, 1.2],
  },
  'painting-exterior': {
    sfPerHour: 80,
    description: 'Exterior painting, spray or roll',
    varianceRange: [0.6, 1.4],
  },
  'painting-cabinet': {
    sfPerHour: 20,
    description: 'Cabinet painting/refinishing',
    varianceRange: [0.5, 1.2],
  },

  // Flooring
  'flooring-hardwood': {
    sfPerHour: 25,
    description: 'Hardwood flooring installation',
    varianceRange: [0.7, 1.3],
  },
  'flooring-lvp': {
    sfPerHour: 40,
    description: 'LVP/laminate click-lock installation',
    varianceRange: [0.8, 1.4],
  },
  'flooring-carpet': {
    sfPerHour: 50,
    description: 'Carpet installation with pad',
    varianceRange: [0.7, 1.3],
  },
  'flooring-vinyl-sheet': {
    sfPerHour: 45,
    description: 'Sheet vinyl installation',
    varianceRange: [0.7, 1.2],
  },

  // Tile
  'tile-floor': {
    sfPerHour: 15,
    description: 'Floor tile installation with grout',
    varianceRange: [0.5, 1.3],
  },
  'tile-wall': {
    sfPerHour: 12,
    description: 'Wall tile (backsplash, shower)',
    varianceRange: [0.5, 1.2],
  },
  'tile-mosaic': {
    sfPerHour: 8,
    description: 'Mosaic or intricate tile patterns',
    varianceRange: [0.4, 1.2],
  },

  // Drywall
  'drywall-hang': {
    sfPerHour: 50,
    description: 'Drywall hanging (walls/ceilings)',
    varianceRange: [0.7, 1.4],
  },
  'drywall-finish': {
    sfPerHour: 40,
    description: 'Drywall taping, mudding, sanding',
    varianceRange: [0.6, 1.3],
  },

  // Roofing
  'roofing-shingle': {
    sfPerHour: 30,
    description: 'Asphalt shingle installation',
    varianceRange: [0.6, 1.4],
  },
  'roofing-metal': {
    sfPerHour: 20,
    description: 'Metal roofing panel installation',
    varianceRange: [0.5, 1.3],
  },
  'roofing-flat': {
    sfPerHour: 35,
    description: 'Flat/low-slope membrane roofing',
    varianceRange: [0.6, 1.3],
  },

  // Framing/Carpentry
  'framing-wall': {
    sfPerHour: 15,
    description: 'Wall framing (new construction)',
    varianceRange: [0.6, 1.4],
  },
  'framing-floor': {
    sfPerHour: 20,
    description: 'Floor framing/joists',
    varianceRange: [0.6, 1.3],
  },
  'trim-baseboard': {
    sfPerHour: 30, // Linear feet per hour
    description: 'Baseboard/crown molding installation',
    varianceRange: [0.7, 1.3],
  },
  'cabinet-install': {
    sfPerHour: 8,
    description: 'Cabinet installation (per cabinet linear foot)',
    varianceRange: [0.6, 1.2],
  },

  // Electrical (work per hour, not SF-based)
  'electrical-rough': {
    sfPerHour: 25, // SF of space roughed-in per hour
    description: 'Rough electrical per SF of space',
    varianceRange: [0.6, 1.4],
  },
  'electrical-finish': {
    sfPerHour: 30, // SF of space finished per hour
    description: 'Finish electrical (devices, fixtures)',
    varianceRange: [0.7, 1.3],
  },

  // Plumbing (work per hour)
  'plumbing-rough': {
    sfPerHour: 15, // SF of space roughed-in per hour
    description: 'Rough plumbing per SF of space',
    varianceRange: [0.5, 1.4],
  },
  'plumbing-finish': {
    sfPerHour: 20,
    description: 'Finish plumbing (fixtures, trim)',
    varianceRange: [0.6, 1.3],
  },

  // HVAC
  'hvac-ductwork': {
    sfPerHour: 20, // SF of space ducted per hour
    description: 'Ductwork installation per SF served',
    varianceRange: [0.5, 1.4],
  },
  'hvac-equipment': {
    sfPerHour: 50, // Large equipment = low productivity "per SF"
    description: 'Equipment installation',
    varianceRange: [0.6, 1.3],
  },

  // Concrete
  'concrete-slab': {
    sfPerHour: 40,
    description: 'Concrete slab pour and finish',
    varianceRange: [0.6, 1.4],
  },
  'concrete-flatwork': {
    sfPerHour: 35,
    description: 'Sidewalks, patios, driveways',
    varianceRange: [0.6, 1.3],
  },

  // Insulation
  'insulation-batt': {
    sfPerHour: 80,
    description: 'Batt insulation installation',
    varianceRange: [0.7, 1.4],
  },
  'insulation-spray': {
    sfPerHour: 60,
    description: 'Spray foam insulation',
    varianceRange: [0.6, 1.3],
  },
};

/**
 * Project type to primary productivity rate mapping
 * Used when calculating market rates for whole-project comparisons
 */
export const PROJECT_PRODUCTIVITY: Record<string, { 
  primaryRate: keyof typeof PRODUCTIVITY_RATES;
  crewSize: number; // Typical crew size
  hoursPerSfMultiplier: number; // Adjustment for project complexity
}> = {
  'painting': {
    primaryRate: 'painting-walls',
    crewSize: 2,
    hoursPerSfMultiplier: 1.2, // Includes prep, trim, cleanup
  },
  'flooring': {
    primaryRate: 'flooring-hardwood',
    crewSize: 2,
    hoursPerSfMultiplier: 1.3, // Includes prep, transitions, trim
  },
  'tile': {
    primaryRate: 'tile-floor',
    crewSize: 2,
    hoursPerSfMultiplier: 1.4, // Includes layout, cutting, grouting
  },
  'roofing': {
    primaryRate: 'roofing-shingle',
    crewSize: 3,
    hoursPerSfMultiplier: 1.3, // Includes tearoff, underlayment, flashing
  },
  'drywall': {
    primaryRate: 'drywall-hang',
    crewSize: 2,
    hoursPerSfMultiplier: 2.0, // Hang + finish is roughly double
  },
  'electrical': {
    primaryRate: 'electrical-rough',
    crewSize: 2,
    hoursPerSfMultiplier: 2.0, // Rough + finish
  },
  'plumbing': {
    primaryRate: 'plumbing-rough',
    crewSize: 2,
    hoursPerSfMultiplier: 2.0, // Rough + finish
  },
  'hvac': {
    primaryRate: 'hvac-ductwork',
    crewSize: 2,
    hoursPerSfMultiplier: 1.5,
  },
  'kitchen-remodel': {
    primaryRate: 'cabinet-install',
    crewSize: 2,
    hoursPerSfMultiplier: 4.0, // Kitchens are labor-intensive per SF
  },
  'bathroom-remodel': {
    primaryRate: 'tile-wall',
    crewSize: 2,
    hoursPerSfMultiplier: 5.0, // Bathrooms are very labor-intensive per SF
  },
  'full-remodel': {
    primaryRate: 'framing-wall',
    crewSize: 3,
    hoursPerSfMultiplier: 3.0, // Mix of all trades
  },
};

/**
 * Calculate hours needed for a given square footage
 */
export function calculateHoursForProject(
  projectType: string,
  squareFootage: number,
  complexityFactor: 'low' | 'medium' | 'high' = 'medium'
): { hours: number; crewSize: number; laborHours: number } {
  const projectConfig = PROJECT_PRODUCTIVITY[projectType];
  if (!projectConfig) {
    // Default fallback
    return {
      hours: squareFootage / 20, // Very rough estimate
      crewSize: 2,
      laborHours: (squareFootage / 20) * 2,
    };
  }

  const rateInfo = PRODUCTIVITY_RATES[projectConfig.primaryRate];
  if (!rateInfo) {
    return {
      hours: squareFootage / 20,
      crewSize: projectConfig.crewSize,
      laborHours: (squareFootage / 20) * projectConfig.crewSize,
    };
  }

  // Apply complexity factor
  let complexityMultiplier = 1.0;
  if (complexityFactor === 'low') {
    complexityMultiplier = rateInfo.varianceRange[1]; // Faster
  } else if (complexityFactor === 'high') {
    complexityMultiplier = rateInfo.varianceRange[0]; // Slower
  }

  const baseSfPerHour = rateInfo.sfPerHour * complexityMultiplier;
  const adjustedSfPerHour = baseSfPerHour / projectConfig.hoursPerSfMultiplier;
  
  const hours = squareFootage / adjustedSfPerHour;
  const laborHours = hours * projectConfig.crewSize;

  return {
    hours: Math.round(hours * 10) / 10,
    crewSize: projectConfig.crewSize,
    laborHours: Math.round(laborHours * 10) / 10,
  };
}

/**
 * Get the primary productivity rate for a project type
 */
export function getProductivityRate(
  taskOrProject: string
): ProductivityRate | null {
  // Direct task lookup
  if (PRODUCTIVITY_RATES[taskOrProject]) {
    return PRODUCTIVITY_RATES[taskOrProject];
  }

  // Project type lookup
  const projectConfig = PROJECT_PRODUCTIVITY[taskOrProject];
  if (projectConfig && PRODUCTIVITY_RATES[projectConfig.primaryRate]) {
    return PRODUCTIVITY_RATES[projectConfig.primaryRate];
  }

  return null;
}
