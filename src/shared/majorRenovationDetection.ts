/**
 * Major Renovation Detection
 * Determines if a project qualifies as a "major renovation" for Zonda weighting
 * 
 * Major renovations use Zonda at higher weight (60%) vs Houzz (40%)
 * Standard projects use Houzz at higher weight (80%) vs Zonda (20%)
 */

// Keywords that indicate major/full renovation scope
const MAJOR_RENOVATION_KEYWORDS = [
  'full renovation',
  'complete remodel',
  'gut renovation',
  'gut remodel',
  'down to studs',
  'to the studs',
  'total renovation',
  'whole house',
  'full remodel',
  'major remodel',
  'major renovation',
  'complete renovation',
  'new construction',
  'addition',
  'home addition',
  'room addition',
  'second story',
  '2nd story',
  'master suite',
  'primary suite',
  'gut job',
  'structural renovation'
];

// Project types that are inherently major scope
const MAJOR_PROJECT_TYPES = [
  'kitchen-major-midrange',
  'kitchen-major-upscale',
  'bathroom-upscale',
  'basement-remodel',
  'home-addition',
  'two-story-addition',
  'master-suite-addition',
  'garage-addition',
  'whole-house',
  'addition'
];

// Specialty/minor project types that should NEVER be treated as major
const SPECIALTY_PROJECT_TYPES = [
  'countertops',
  'painting',
  'fireplace',
  'deck-repair',
  'deck',
  'basement-refinishing', // Updating existing finished basement (vs basement = full finish)
  'windows',
  'window-repair',
  'doors',
  'door-interior',
  'door-patio',
  'door-french',
  'roofing',
  'roofing-repair',
  'roofing-storm',
  'roofing-hail',
  'roofing-fire',
  'roofing-insurance',
  'siding',
  'flooring',
  'carpet',
  'hvac',
  'electrical',
  'plumbing',
  'water-heater',
  'furnace',
  'ac-installation',
  'garage-door',
  'cabinet-refinishing',
  'cabinet-refacing',
  'cabinet-replacement',
  'cabinet-new-line'
];

export interface MajorRenovationResult {
  isMajor: boolean;
  reason: string;
  houzzWeight: number;
  zondaWeight: number;
}

/**
 * Determine if a project is a major renovation
 * 
 * Criteria for major renovation:
 * 1. Bid amount > $50,000 AND
 * 2. Project type is explicitly major (kitchen-major, bathroom-major, addition, basement-full, whole-house) OR
 * 3. Keywords present: "full renovation", "complete remodel", "gut", "down to studs", "new construction"
 * 
 * @param bidTotal - Total bid amount in dollars
 * @param projectType - Detected project type (e.g., 'kitchen', 'bathroom')
 * @param projectText - Full text from bid for keyword matching
 * @returns MajorRenovationResult with weights
 */
export function isMajorRenovation(
  bidTotal: number,
  projectType: string,
  projectText?: string
): MajorRenovationResult {
  const normalizedType = projectType.toLowerCase().trim();
  const normalizedText = (projectText || '').toLowerCase();
  
  // First check: specialty projects are NEVER major
  const isSpecialty = SPECIALTY_PROJECT_TYPES.some(specialty => 
    normalizedType.includes(specialty)
  );
  
  if (isSpecialty) {
    return {
      isMajor: false,
      reason: 'Specialty project type',
      houzzWeight: 0.90,  // 90% Houzz for specialty
      zondaWeight: 0.10   // 10% Zonda for specialty
    };
  }
  
  // Second check: bid must be over $50k threshold
  const MAJOR_BID_THRESHOLD = 50000;
  const meetsThreshold = bidTotal >= MAJOR_BID_THRESHOLD;
  
  if (!meetsThreshold) {
    return {
      isMajor: false,
      reason: `Bid under $${MAJOR_BID_THRESHOLD.toLocaleString()} threshold`,
      houzzWeight: 0.80,  // 80% Houzz for standard
      zondaWeight: 0.20   // 20% Zonda for standard
    };
  }
  
  // Third check: is project type inherently major?
  const isMajorType = MAJOR_PROJECT_TYPES.some(majorType => 
    normalizedType.includes(majorType) || 
    normalizedType === majorType.replace(/-/g, ' ')
  );
  
  if (isMajorType) {
    return {
      isMajor: true,
      reason: 'Major project type',
      houzzWeight: 0.40,  // 40% Houzz for major
      zondaWeight: 0.60   // 60% Zonda for major
    };
  }
  
  // Fourth check: look for major renovation keywords in text
  const hasKeywords = MAJOR_RENOVATION_KEYWORDS.some(keyword => 
    normalizedText.includes(keyword)
  );
  
  if (hasKeywords) {
    return {
      isMajor: true,
      reason: 'Major renovation keywords detected',
      houzzWeight: 0.40,  // 40% Houzz for major
      zondaWeight: 0.60   // 60% Zonda for major
    };
  }
  
  // Fifth check: high-value kitchen/bathroom could be major
  // Kitchen > $75k or Bathroom > $40k suggests upscale/major scope
  if (normalizedType.includes('kitchen') && bidTotal >= 75000) {
    return {
      isMajor: true,
      reason: 'High-value kitchen remodel',
      houzzWeight: 0.40,
      zondaWeight: 0.60
    };
  }
  
  if (normalizedType.includes('bath') && bidTotal >= 40000) {
    return {
      isMajor: true,
      reason: 'High-value bathroom remodel',
      houzzWeight: 0.40,
      zondaWeight: 0.60
    };
  }
  
  if (normalizedType.includes('basement') && bidTotal >= 60000) {
    return {
      isMajor: true,
      reason: 'High-value basement remodel',
      houzzWeight: 0.40,
      zondaWeight: 0.60
    };
  }
  
  // Default: standard project with Houzz primary
  return {
    isMajor: false,
    reason: 'Standard project scope',
    houzzWeight: 0.80,  // 80% Houzz for standard
    zondaWeight: 0.20   // 20% Zonda for standard
  };
}

/**
 * Get weighted combined estimate from Houzz and Zonda
 */
export function getWeightedEstimate(
  houzzMedian: number | null,
  zondaCost: number | null,
  weights: { houzzWeight: number; zondaWeight: number }
): number | null {
  if (houzzMedian !== null && zondaCost !== null) {
    // Both sources available - use weighted average
    return Math.round(
      (houzzMedian * weights.houzzWeight) + 
      (zondaCost * weights.zondaWeight)
    );
  }
  
  // Single source - use whatever is available
  if (houzzMedian !== null) return houzzMedian;
  if (zondaCost !== null) return zondaCost;
  
  return null;
}
