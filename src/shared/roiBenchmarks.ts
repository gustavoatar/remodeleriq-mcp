// ROI Truth Benchmarks
// 2025-2026 Cost vs. Value data for home improvement projects
// Sources: Remodeling Magazine Cost vs. Value Report, NAR Remodeling Impact Report

// ============================================================================
// TYPES
// ============================================================================

export type ROIQuadrant = 
  | 'smart-flip'      // High ROI, moderate joy (great for resale)
  | 'no-brainer'      // Good ROI, high joy (best of both worlds)
  | 'luxury-investment' // Lower ROI, highest joy (worth it if staying)
  | 'essential'       // Necessary regardless of ROI
  | 'consider';       // Moderate on both axes

export interface ROIBenchmark {
  avgCost: number;      // National average project cost
  resaleValue: number;  // Value recouped at resale
  roi: number;          // Percentage return (resaleValue / avgCost * 100)
  joyScore: number;     // 1-10 homeowner satisfaction score
  quadrant: ROIQuadrant;
  label: string;        // Human-readable quadrant label
  notes?: string;       // Additional context
}

export interface ROIContext {
  nationalAvg: number;
  resaleValue: number;
  roi: number;
  joyScore: number;
  quadrant: ROIQuadrant;
  label: string;
  bidVsNational: number;
  bidVsNationalLabel: 'Above National Avg' | 'Below National Avg' | 'Near National Avg';
  insight: string;
  notes?: string;
}

// ============================================================================
// ROI BENCHMARK DATA (2025-2026)
// ============================================================================

export const ROI_BENCHMARKS: Record<string, ROIBenchmark> = {
  // SMART FLIP QUADRANT - High ROI, great for resale
  'garage-door': { 
    avgCost: 4672, 
    resaleValue: 12507, 
    roi: 268, 
    joyScore: 6.5,
    quadrant: 'smart-flip', 
    label: 'Smart Flip',
    notes: 'Best ROI of any project - curb appeal with minimal investment'
  },
  'steel-entry-door': { 
    avgCost: 2435, 
    resaleValue: 5270, 
    roi: 216, 
    joyScore: 7.0,
    quadrant: 'smart-flip', 
    label: 'Smart Flip',
    notes: 'High impact for low cost - improves security and curb appeal'
  },
  'stone-veneer': { 
    avgCost: 11702, 
    resaleValue: 24328, 
    roi: 208, 
    joyScore: 7.5,
    quadrant: 'smart-flip', 
    label: 'Smart Flip',
    notes: 'Dramatic exterior upgrade with excellent return'
  },
  'vinyl-siding': {
    avgCost: 18662,
    resaleValue: 18089,
    roi: 97,
    joyScore: 7.0,
    quadrant: 'smart-flip',
    label: 'Smart Flip',
    notes: 'Near break-even with low maintenance benefits'
  },

  // NO-BRAINER QUADRANT - Good ROI and high satisfaction
  'minor-kitchen': { 
    avgCost: 28458, 
    resaleValue: 32141, 
    roi: 113, 
    joyScore: 10,
    quadrant: 'no-brainer', 
    label: 'No-Brainer',
    notes: 'The sweet spot - high joy AND profit. Refinish, dont replace.'
  },
  'fiber-cement-siding': { 
    avgCost: 21485, 
    resaleValue: 24420, 
    roi: 114, 
    joyScore: 8.0,
    quadrant: 'no-brainer', 
    label: 'No-Brainer',
    notes: 'Premium durability with above-average return'
  },
  'wood-flooring': { 
    avgCost: 5500, 
    resaleValue: 4590, 
    roi: 83, 
    joyScore: 9.1,
    quadrant: 'no-brainer', 
    label: 'No-Brainer',
    notes: 'Universal appeal - buyers love hardwood'
  },
  'deck-wood': {
    avgCost: 17615,
    resaleValue: 14519,
    roi: 82,
    joyScore: 9.4,
    quadrant: 'no-brainer',
    label: 'No-Brainer',
    notes: 'Outdoor living space with strong joy score'
  },
  'deck-composite': {
    avgCost: 24677,
    resaleValue: 19856,
    roi: 80,
    joyScore: 9.2,
    quadrant: 'no-brainer',
    label: 'No-Brainer',
    notes: 'Low maintenance alternative to wood'
  },

  // LUXURY INVESTMENT QUADRANT - Lower ROI but highest satisfaction
  'major-kitchen': { 
    avgCost: 79982, 
    resaleValue: 64110, 
    roi: 80, 
    joyScore: 10,
    quadrant: 'luxury-investment', 
    label: 'Luxury Investment',
    notes: 'Worth it if you cook and entertain - the heart of the home'
  },
  'bathroom-midrange': { 
    avgCost: 25251, 
    resaleValue: 18167, 
    roi: 72, 
    joyScore: 9.8,
    quadrant: 'luxury-investment', 
    label: 'Luxury Investment',
    notes: 'Daily use makes this worth the investment'
  },
  'bathroom-upscale': {
    avgCost: 80000,
    resaleValue: 52000,
    roi: 65,
    joyScore: 9.9,
    quadrant: 'luxury-investment',
    label: 'Luxury Investment',
    notes: 'Spa-like retreat - worth it if staying 5+ years'
  },
  'primary-suite': { 
    avgCost: 156741, 
    resaleValue: 96027, 
    roi: 61, 
    joyScore: 10,
    quadrant: 'luxury-investment', 
    label: 'Luxury Investment',
    notes: 'The ultimate home upgrade - only for long-term owners'
  },
  'basement-finishing': {
    avgCost: 57500,
    resaleValue: 40250,
    roi: 70,
    joyScore: 9.5,
    quadrant: 'luxury-investment',
    label: 'Luxury Investment',
    notes: 'Extra living space at fraction of addition cost'
  },

  // ESSENTIAL QUADRANT - Necessary regardless of ROI
  'new-roofing': { 
    avgCost: 30844, 
    resaleValue: 20310, 
    roi: 66, 
    joyScore: 10,
    quadrant: 'essential', 
    label: 'Essential',
    notes: 'Not optional - protects entire home. Joy = peace of mind.'
  },
  'hvac': {
    avgCost: 12500,
    resaleValue: 8750,
    roi: 70,
    joyScore: 9.0,
    quadrant: 'essential',
    label: 'Essential',
    notes: 'Comfort and efficiency - required for livability'
  },
  'electrical-upgrade': {
    avgCost: 8500,
    resaleValue: 5100,
    roi: 60,
    joyScore: 7.5,
    quadrant: 'essential',
    label: 'Essential',
    notes: 'Safety critical - dont skip on older homes'
  },
  'plumbing-repipe': {
    avgCost: 15000,
    resaleValue: 9000,
    roi: 60,
    joyScore: 7.0,
    quadrant: 'essential',
    label: 'Essential',
    notes: 'Prevents catastrophic water damage'
  },
  'windows': {
    avgCost: 22000,
    resaleValue: 15400,
    roi: 70,
    joyScore: 9.3,
    quadrant: 'essential',
    label: 'Essential',
    notes: 'Energy savings add up over time'
  },

  // CONSIDER QUADRANT - Moderate on both axes
  'backup-generator': { 
    avgCost: 13534, 
    resaleValue: 12902, 
    roi: 95, 
    joyScore: 8.5,
    quadrant: 'consider', 
    label: 'Peace of Mind',
    notes: 'Value depends heavily on your power reliability'
  },
  'home-office': {
    avgCost: 12000,
    resaleValue: 9600,
    roi: 80,
    joyScore: 8.0,
    quadrant: 'consider',
    label: 'Consider',
    notes: 'Post-pandemic essential for remote workers'
  }
};

// ============================================================================
// PROJECT TYPE MAPPING
// ============================================================================

// Maps various project type names to benchmark keys
const PROJECT_TYPE_MAP: Record<string, string> = {
  // Kitchen variants
  'kitchen-remodel': 'minor-kitchen',
  'kitchen': 'minor-kitchen',
  'kitchen-minor': 'minor-kitchen',
  'kitchen-major': 'major-kitchen',
  'full-kitchen': 'major-kitchen',
  
  // Bathroom variants
  'bathroom-remodel': 'bathroom-midrange',
  'bathroom': 'bathroom-midrange',
  'bath': 'bathroom-midrange',
  'bathroom-full': 'bathroom-upscale',
  'master-bath': 'bathroom-upscale',
  
  // Flooring
  'flooring': 'wood-flooring',
  'hardwood': 'wood-flooring',
  'wood-floor': 'wood-flooring',
  
  // Windows & Doors
  'windows-doors': 'windows',
  'windows': 'windows',
  'window-replacement': 'windows',
  'entry-door': 'steel-entry-door',
  'front-door': 'steel-entry-door',
  'garage-door-replacement': 'garage-door',
  
  // Exterior
  'roofing': 'new-roofing',
  'roof': 'new-roofing',
  'roof-replacement': 'new-roofing',
  'siding': 'vinyl-siding',
  'fiber-cement': 'fiber-cement-siding',
  'stone-veneer-siding': 'stone-veneer',
  
  // Systems
  'electrical': 'electrical-upgrade',
  'plumbing': 'plumbing-repipe',
  'hvac-replacement': 'hvac',
  
  // Other
  'basement': 'basement-finishing',
  'basement-finishing': 'basement-finishing',
  'deck': 'deck-wood',
  'composite-deck': 'deck-composite',
  'addition': 'primary-suite',
  'generator': 'backup-generator',
  'office': 'home-office',
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Get ROI context for a project type and bid amount
 * Returns insights about how the bid compares to national averages
 * and what value can be expected at resale
 */
export function getROIContext(projectType: string, bidAmount: number): ROIContext | null {
  // Normalize project type
  const normalizedType = projectType.toLowerCase().replace(/\s+/g, '-');
  const benchmarkKey = PROJECT_TYPE_MAP[normalizedType] || normalizedType;
  const benchmark = ROI_BENCHMARKS[benchmarkKey];
  
  if (!benchmark) return null;
  
  // Calculate bid vs national average
  const costDiff = ((bidAmount - benchmark.avgCost) / benchmark.avgCost) * 100;
  
  // Determine label based on difference
  let bidVsNationalLabel: ROIContext['bidVsNationalLabel'];
  if (costDiff > 15) {
    bidVsNationalLabel = 'Above National Avg';
  } else if (costDiff < -15) {
    bidVsNationalLabel = 'Below National Avg';
  } else {
    bidVsNationalLabel = 'Near National Avg';
  }
  
  // Generate insight based on quadrant and bid comparison
  const insight = generateROIInsight(benchmark, costDiff, bidAmount);
  
  return {
    nationalAvg: benchmark.avgCost,
    resaleValue: benchmark.resaleValue,
    roi: benchmark.roi,
    joyScore: benchmark.joyScore,
    quadrant: benchmark.quadrant,
    label: benchmark.label,
    bidVsNational: Math.round(costDiff),
    bidVsNationalLabel,
    insight,
    notes: benchmark.notes
  };
}

/**
 * Generate a contextual insight based on the project's ROI quadrant and bid comparison
 */
function generateROIInsight(
  benchmark: ROIBenchmark, 
  costDiff: number, 
  bidAmount: number
): string {
  const absDiff = Math.abs(costDiff);
  const isAbove = costDiff > 0;
  
  // Calculate estimated resale value for this bid
  const estimatedResale = Math.round(bidAmount * (benchmark.roi / 100));
  
  switch (benchmark.quadrant) {
    case 'smart-flip':
      if (isAbove && absDiff > 20) {
        return `Even at this price, you should recoup $${estimatedResale.toLocaleString()} at resale. Great for home value.`;
      }
      return `Excellent ROI project. Expect to recoup ~$${estimatedResale.toLocaleString()} at resale.`;
    
    case 'no-brainer':
      if (isAbove && absDiff > 20) {
        return `Worth the premium - ${benchmark.joyScore}/10 satisfaction with ${benchmark.roi}% average ROI.`;
      }
      return `Best of both worlds - high satisfaction (${benchmark.joyScore}/10) with solid ${benchmark.roi}% ROI.`;
    
    case 'luxury-investment':
      if (benchmark.joyScore >= 9.5) {
        return `Low ROI but maximum joy (${benchmark.joyScore}/10). Worth it if staying 5+ years.`;
      }
      return `Invest for enjoyment, not resale. Daily use makes this worthwhile for long-term owners.`;
    
    case 'essential':
      return `Not optional - this protects your home. The "ROI" is avoiding much larger problems.`;
    
    case 'consider':
      if (isAbove && absDiff > 15) {
        return `Above average cost. Make sure the features justify the premium.`;
      }
      return `Moderate ROI (${benchmark.roi}%) - value depends on your specific needs.`;
    
    default:
      return `National average cost is $${benchmark.avgCost.toLocaleString()} with ${benchmark.roi}% typical ROI.`;
  }
}

/**
 * Get all benchmarks for a quadrant (useful for recommendations)
 */
export function getBenchmarksByQuadrant(quadrant: ROIQuadrant): Array<{ key: string; benchmark: ROIBenchmark }> {
  return Object.entries(ROI_BENCHMARKS)
    .filter(([_, b]) => b.quadrant === quadrant)
    .map(([key, benchmark]) => ({ key, benchmark }))
    .sort((a, b) => b.benchmark.roi - a.benchmark.roi);
}

/**
 * Get recommended projects based on owner intent
 */
export function getRecommendedProjects(
  intent: 'selling-soon' | 'staying-long' | 'balanced'
): Array<{ key: string; benchmark: ROIBenchmark }> {
  switch (intent) {
    case 'selling-soon':
      // Prioritize high ROI projects
      return [
        ...getBenchmarksByQuadrant('smart-flip'),
        ...getBenchmarksByQuadrant('no-brainer').slice(0, 3)
      ];
    
    case 'staying-long':
      // Prioritize joy and essentials
      return [
        ...getBenchmarksByQuadrant('no-brainer'),
        ...getBenchmarksByQuadrant('luxury-investment').filter(p => p.benchmark.joyScore >= 9.5)
      ];
    
    case 'balanced':
    default:
      // Mix of both
      return getBenchmarksByQuadrant('no-brainer');
  }
}
