/**
 * Centralized Project Unit Configuration
 * 
 * Single source of truth for how different project types are measured and priced.
 * When adding a new project type, update THIS file only - all pricing logic
 * imports from here.
 * 
 * Unit Types:
 * - 'psf' = Price per square foot (most projects)
 * - 'per-window' = Price per window unit
 * - 'per-linear-foot' = Price per linear foot (fences, gutters, railings)
 * - 'per-unit' = Price per item (future: doors, fixtures)
 * - 'flat' = Flat project pricing (service calls, inspections)
 */

export type ProjectUnitType = 'psf' | 'per-window' | 'per-linear-foot' | 'per-unit' | 'flat';

export interface ProjectUnitConfig {
  unitType: ProjectUnitType;
  unitLabel: string;           // Human-readable label ("SF", "LF", "windows")
  unitLabelPlural: string;     // Plural form ("square feet", "linear feet", "windows")
  requiresMeasurement: boolean; // Whether measurement is required for accurate pricing
  measurementField: 'squareFootage' | 'linearFeet' | 'windowCount' | 'unitCount' | null;
}

// ============================================================================
// PROJECT TYPE → UNIT CONFIGURATION
// ============================================================================

// ============================================================================
// DISPLAY NAME → CONFIG KEY NORMALIZATION
// Maps user-friendly dropdown values to internal config keys
// ============================================================================

const DISPLAY_NAME_TO_CONFIG_KEY: Record<string, string> = {
  // Linear foot projects (display name → config key)
  'fence': 'fence',
  'fence build': 'fence',
  'fencing': 'fence',
  'fence repair': 'fence-repair',
  'gutters': 'gutter',
  'gutter': 'gutter',
  'gutter installation': 'gutter',
  'gutter repair': 'gutter-repair',
  'railings': 'railing',
  'railing': 'railing',
  'deck railing': 'railing',
  'retaining wall': 'retaining-wall',
  'retaining-wall': 'retaining-wall',
  'crown molding': 'crown-molding',
  'baseboards': 'baseboards',
  'baseboard': 'baseboards',
  // Window projects
  'window replacement': 'windows-doors',
  'windows': 'windows-doors',
  'window': 'windows-doors',
  'windows-doors': 'windows-doors',
};

/**
 * Normalize a project type string to its config key
 * Handles display names, mixed case, and various formats
 */
function normalizeProjectType(projectType: string | null | undefined): string {
  if (!projectType) return 'default';
  
  const normalized = projectType.toLowerCase().trim();
  
  // Direct match in config
  if (PROJECT_UNIT_CONFIG[normalized]) {
    return normalized;
  }
  
  // Check display name mapping
  if (DISPLAY_NAME_TO_CONFIG_KEY[normalized]) {
    return DISPLAY_NAME_TO_CONFIG_KEY[normalized];
  }
  
  // Fallback to default
  return 'default';
}

const PROJECT_UNIT_CONFIG: Record<string, ProjectUnitConfig> = {
  // Linear foot projects
  'fence': {
    unitType: 'per-linear-foot',
    unitLabel: 'LF',
    unitLabelPlural: 'linear feet',
    requiresMeasurement: true,
    measurementField: 'linearFeet'
  },
  'fence-repair': {
    unitType: 'per-linear-foot',
    unitLabel: 'LF',
    unitLabelPlural: 'linear feet',
    requiresMeasurement: true,
    measurementField: 'linearFeet'
  },
  'gutter': {
    unitType: 'per-linear-foot',
    unitLabel: 'LF',
    unitLabelPlural: 'linear feet',
    requiresMeasurement: true,
    measurementField: 'linearFeet'
  },
  'gutter-repair': {
    unitType: 'per-linear-foot',
    unitLabel: 'LF',
    unitLabelPlural: 'linear feet',
    requiresMeasurement: true,
    measurementField: 'linearFeet'
  },
  'railing': {
    unitType: 'per-linear-foot',
    unitLabel: 'LF',
    unitLabelPlural: 'linear feet',
    requiresMeasurement: true,
    measurementField: 'linearFeet'
  },
  'retaining-wall': {
    unitType: 'per-linear-foot',
    unitLabel: 'LF',
    unitLabelPlural: 'linear feet',
    requiresMeasurement: true,
    measurementField: 'linearFeet'
  },
  'crown-molding': {
    unitType: 'per-linear-foot',
    unitLabel: 'LF',
    unitLabelPlural: 'linear feet',
    requiresMeasurement: true,
    measurementField: 'linearFeet'
  },
  'baseboards': {
    unitType: 'per-linear-foot',
    unitLabel: 'LF',
    unitLabelPlural: 'linear feet',
    requiresMeasurement: true,
    measurementField: 'linearFeet'
  },
  
  // Per-window projects
  'windows-doors': {
    unitType: 'per-window',
    unitLabel: 'windows',
    unitLabelPlural: 'windows',
    requiresMeasurement: true,
    measurementField: 'windowCount'
  },
  
  // Default PSF config (used for all other projects)
  'default': {
    unitType: 'psf',
    unitLabel: 'SF',
    unitLabelPlural: 'square feet',
    requiresMeasurement: true,
    measurementField: 'squareFootage'
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the unit configuration for a project type
 * Handles display names like "Fence Build" and normalizes to config keys
 */
export function getProjectUnitConfig(projectType: string | null | undefined): ProjectUnitConfig {
  const key = normalizeProjectType(projectType);
  return PROJECT_UNIT_CONFIG[key] || PROJECT_UNIT_CONFIG['default'];
}

/**
 * Check if a project uses per-linear-foot pricing
 */
export function isLinearFootProject(projectType: string | null | undefined): boolean {
  const config = getProjectUnitConfig(projectType);
  return config.unitType === 'per-linear-foot';
}

/**
 * Check if a project uses per-window pricing
 */
export function isWindowProject(projectType: string | null | undefined): boolean {
  const config = getProjectUnitConfig(projectType);
  return config.unitType === 'per-window';
}

/**
 * Check if a project uses per-square-foot pricing
 */
export function isPsfProject(projectType: string | null | undefined): boolean {
  const config = getProjectUnitConfig(projectType);
  return config.unitType === 'psf';
}

/**
 * Check if a project uses any per-unit pricing (not PSF)
 * This includes windows, linear feet, and future per-unit types
 */
export function isPerUnitProject(projectType: string | null | undefined): boolean {
  const config = getProjectUnitConfig(projectType);
  return config.unitType !== 'psf';
}

/**
 * Get the list of all linear foot project types
 * Used for backward compatibility with existing code
 */
export function getLinearFootTypes(): string[] {
  return Object.entries(PROJECT_UNIT_CONFIG)
    .filter(([key, config]) => config.unitType === 'per-linear-foot' && key !== 'default')
    .map(([key]) => key);
}

/**
 * Get the list of all per-window project types
 */
export function getWindowTypes(): string[] {
  return Object.entries(PROJECT_UNIT_CONFIG)
    .filter(([key, config]) => config.unitType === 'per-window' && key !== 'default')
    .map(([key]) => key);
}

/**
 * Check if we have the required measurement for accurate pricing
 */
export function hasMeasurementForProject(
  projectType: string | null | undefined,
  measurements: {
    squareFootage?: number;
    linearFeet?: number;
    windowCount?: number;
    unitCount?: number;
  }
): boolean {
  const config = getProjectUnitConfig(projectType);
  
  if (!config.requiresMeasurement) return true;
  
  switch (config.measurementField) {
    case 'squareFootage':
      return (measurements.squareFootage ?? 0) > 0;
    case 'linearFeet':
      return (measurements.linearFeet ?? 0) > 0;
    case 'windowCount':
      return (measurements.windowCount ?? 0) > 0;
    case 'unitCount':
      return (measurements.unitCount ?? 0) > 0;
    default:
      return true;
  }
}

/**
 * Get the measurement value for a project type from available measurements
 */
export function getMeasurementValue(
  projectType: string | null | undefined,
  measurements: {
    squareFootage?: number;
    linearFeet?: number;
    windowCount?: number;
    unitCount?: number;
  }
): number {
  const config = getProjectUnitConfig(projectType);
  
  switch (config.measurementField) {
    case 'squareFootage':
      return measurements.squareFootage ?? 0;
    case 'linearFeet':
      return measurements.linearFeet ?? 0;
    case 'windowCount':
      return measurements.windowCount ?? 0;
    case 'unitCount':
      return measurements.unitCount ?? 0;
    default:
      return 0;
  }
}

// ============================================================================
// LEGACY EXPORTS (for backward compatibility during migration)
// ============================================================================

/**
 * @deprecated Use getLinearFootTypes() instead
 */
export const LINEAR_FOOT_TYPES = getLinearFootTypes();

/**
 * @deprecated Use isLinearFootProject() instead
 */
export const WINDOW_PROJECT_TYPES = getWindowTypes();
