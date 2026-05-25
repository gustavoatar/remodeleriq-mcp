/**
 * Material Market Intelligence Engine
 * 
 * A robust internal logic system to filter, analyze, and visualize 
 * BLS Producer Price Index (PPI) data for construction materials.
 */

// ============================================================================
// 1. THE DATA CORE (Hardcoded BLS Knowledge Base)
// ============================================================================

export interface MaterialData {
  current: number;      // Current PPI index value (Dec 2025/Jan 2026)
  baseline: number;     // Baseline PPI index value for comparison
  name: string;         // Display name
  seriesId: string;     // BLS Series ID
  icon: string;         // Lucide icon name
  color: string;        // Chart line color (hex)
  history: number[];    // 12-month historical PPI values (oldest to newest)
}

// Month labels for chart x-axis
export const HISTORY_MONTHS = [
  'Mar 25', 'Apr 25', 'May 25', 'Jun 25', 'Jul 25', 'Aug 25',
  'Sep 25', 'Oct 25', 'Nov 25', 'Dec 25', 'Jan 26', 'Feb 26'
];

export type MaterialKey = 'lumber' | 'drywall' | 'paint' | 'tile' | 'concrete' | 'copper' | 'electrical';

/**
 * BLS Producer Price Index Material Data - FALLBACK VALUES
 * 
 * These are conservative fallback values used when live BLS data is unavailable.
 * They show stable/mild trends to avoid misleading users with stale data.
 * 
 * Live BLS data is automatically refreshed daily via scheduled worker.
 * Source: Bureau of Labor Statistics Producer Price Index (PPI)
 * 
 * IMPORTANT: These fallbacks are intentionally conservative (showing ~1-2% stable trends)
 * to avoid displaying misleading extreme percentages when live data isn't available.
 */
export const MATERIAL_DATA: Record<MaterialKey, MaterialData> = {
  lumber: {
    current: 258.0,
    baseline: 255.0, // ~1.2% stable
    name: 'Lumber',
    seriesId: 'WPU081',
    icon: 'TreePine',
    color: '#8B5A2B',
    history: [252.0, 253.0, 254.0, 254.5, 255.0, 255.5, 256.0, 256.5, 257.0, 257.5, 257.8, 258.0]
  },
  drywall: {
    current: 475.0,
    baseline: 470.0, // ~1.1% stable
    name: 'Drywall',
    seriesId: 'WPU137',
    icon: 'Square',
    color: '#6B7280',
    history: [468.0, 469.0, 470.0, 470.5, 471.0, 471.5, 472.0, 473.0, 473.5, 474.0, 474.5, 475.0]
  },
  paint: {
    current: 420.0,
    baseline: 415.0, // ~1.2% stable
    name: 'Paint',
    seriesId: 'WPU0621',
    icon: 'Paintbrush',
    color: '#EC4899',
    history: [413.0, 414.0, 415.0, 415.5, 416.0, 416.5, 417.0, 418.0, 418.5, 419.0, 419.5, 420.0]
  },
  tile: {
    current: 182.0,
    baseline: 180.0, // ~1.1% stable
    name: 'Ceramic Tile',
    seriesId: 'WPU135201',
    icon: 'LayoutGrid',
    color: '#0EA5E9',
    history: [179.0, 179.5, 180.0, 180.2, 180.5, 180.8, 181.0, 181.2, 181.5, 181.7, 181.8, 182.0]
  },
  concrete: {
    current: 375.0,
    baseline: 370.0, // ~1.4% stable
    name: 'Concrete',
    seriesId: 'WPU1333',
    icon: 'Blocks',
    color: '#78716C',
    history: [368.0, 369.0, 370.0, 370.5, 371.0, 372.0, 372.5, 373.0, 373.5, 374.0, 374.5, 375.0]
  },
  copper: {
    current: 295.0,
    baseline: 292.0, // ~1.0% stable
    name: 'Copper Pipe',
    seriesId: 'WPU102501',
    icon: 'Pipette',
    color: '#D97706',
    history: [290.0, 291.0, 292.0, 292.5, 293.0, 293.5, 294.0, 294.2, 294.5, 294.7, 294.8, 295.0]
  },
  electrical: {
    current: 385.0,
    baseline: 380.0, // ~1.3% stable
    name: 'Electrical',
    seriesId: 'WPU117',
    icon: 'Zap',
    color: '#FBBF24',
    history: [378.0, 379.0, 380.0, 380.5, 381.0, 382.0, 382.5, 383.0, 383.5, 384.0, 384.5, 385.0]
  }
};

// ============================================================================
// 2. THE LOGIC ENGINE (Functions)
// ============================================================================

export type TrendStatus = 'Surge' | 'Rise' | 'Stable' | 'Drop';

export interface TrendStatusConfig {
  status: TrendStatus;
  color: string;        // Tailwind color class suffix (e.g., 'red', 'orange', 'gray', 'green')
  icon: string;         // Emoji icon
  bgClass: string;      // Background color class
  textClass: string;    // Text color class
  borderClass: string;  // Border color class
}

/**
 * Calculate the percentage trend between current and baseline values.
 * 
 * Formula: ((current - baseline) / baseline) * 100
 * Returns percentage with 1 decimal place.
 */
export function calculateTrend(current: number, baseline: number): number {
  if (baseline === 0) return 0;
  const percentage = ((current - baseline) / baseline) * 100;
  return Math.round(percentage * 10) / 10; // Round to 1 decimal place
}

/**
 * Get the trend status based on percentage change.
 * 
 * > 5.0%: 'Surge' (Red, 🚨)
 * 2.0% to 5.0%: 'Rise' (Orange, ↗️)
 * -2.0% to 2.0%: 'Stable' (Grey, ➡️)
 * < -2.0%: 'Drop' (Green, 📉)
 */
export function getTrendStatus(percentage: number): TrendStatusConfig {
  if (percentage > 5.0) {
    return {
      status: 'Surge',
      color: 'red',
      icon: '🚨',
      bgClass: 'bg-red-50',
      textClass: 'text-red-700',
      borderClass: 'border-red-200'
    };
  } else if (percentage >= 2.0) {
    return {
      status: 'Rise',
      color: 'orange',
      icon: '↗️',
      bgClass: 'bg-orange-50',
      textClass: 'text-orange-700',
      borderClass: 'border-orange-200'
    };
  } else if (percentage > -2.0) {
    return {
      status: 'Stable',
      color: 'gray',
      icon: '➡️',
      bgClass: 'bg-gray-50',
      textClass: 'text-gray-600',
      borderClass: 'border-gray-200'
    };
  } else {
    return {
      status: 'Drop',
      color: 'green',
      icon: '📉',
      bgClass: 'bg-emerald-50',
      textClass: 'text-emerald-700',
      borderClass: 'border-emerald-200'
    };
  }
}

export type ProjectType = 'kitchen' | 'bathroom' | 'addition' | 'general';

/**
 * Project type to relevant materials mapping.
 * Returns only materials relevant to the specific project type.
 */
const PROJECT_MATERIALS_MAP: Record<ProjectType, MaterialKey[]> = {
  kitchen: ['lumber', 'paint', 'tile', 'copper', 'electrical'],
  bathroom: ['tile', 'copper', 'paint', 'drywall'],
  addition: ['concrete', 'lumber', 'drywall', 'paint', 'electrical'],
  general: ['lumber', 'drywall', 'paint', 'tile', 'concrete', 'copper', 'electrical']
};

/**
 * Get materials relevant to a specific project type.
 */
export function getProjectMaterials(projectType: ProjectType | string): MaterialData[] {
  // Normalize project type
  const normalizedType = normalizeProjectType(projectType);
  const materialKeys = PROJECT_MATERIALS_MAP[normalizedType] || PROJECT_MATERIALS_MAP.general;
  
  return materialKeys.map(key => MATERIAL_DATA[key]);
}

/**
 * Normalize various project type strings to our supported types.
 */
function normalizeProjectType(projectType: string): ProjectType {
  const normalized = projectType.toLowerCase();
  
  if (normalized.includes('kitchen')) return 'kitchen';
  if (normalized.includes('bath')) return 'bathroom';
  if (normalized.includes('addition') || normalized.includes('room add')) return 'addition';
  
  return 'general';
}

// ============================================================================
// 3. MATERIAL TREND ANALYSIS
// ============================================================================

export interface MaterialTrend {
  material: MaterialData;
  percentage: number;
  status: TrendStatusConfig;
}

/**
 * Analyze all materials and return their trends.
 */
export function analyzeMaterialTrends(projectType: ProjectType | string = 'general'): MaterialTrend[] {
  const materials = getProjectMaterials(projectType);
  
  return materials.map(material => {
    const percentage = calculateTrend(material.current, material.baseline);
    const status = getTrendStatus(percentage);
    
    return {
      material,
      percentage,
      status
    };
  });
}

/**
 * Get the highest rising material from a list of trends.
 */
export function getHighestRisingMaterial(trends: MaterialTrend[]): MaterialTrend | null {
  if (trends.length === 0) return null;
  
  return trends.reduce((highest, current) => 
    current.percentage > highest.percentage ? current : highest
  , trends[0]);
}

/**
 * Get materials that are dropping in price (potential savings).
 */
export function getDroppingMaterials(trends: MaterialTrend[]): MaterialTrend[] {
  return trends.filter(t => t.percentage < -2.0);
}

// ============================================================================
// 4. THE 'AI SYNTHESIS' GENERATOR (Mock Logic)
// ============================================================================

export interface MarketSummary {
  type: 'alert' | 'opportunity' | 'observation';
  message: string;
  materialName?: string;
  percentage?: number;
}

/**
 * Generate AI-style market summary based on material trends.
 * 
 * Logic:
 * - If 'Lumber' > 5%, return lumber surge alert
 * - If 'Copper' < -2%, return copper opportunity alert
 * - Default: Return stable observation
 */
export function generateMarketSummary(trends: MaterialTrend[]): MarketSummary {
  // Check for Lumber surge
  const lumberTrend = trends.find(t => t.material.name === 'Lumber');
  if (lumberTrend && lumberTrend.percentage > 5) {
    return {
      type: 'alert',
      message: `AI Alert: Lumber prices have surged ${lumberTrend.percentage.toFixed(1)}%+. Framing costs for your addition may be higher than online averages. Lock in quotes immediately.`,
      materialName: 'Lumber',
      percentage: lumberTrend.percentage
    };
  }
  
  // Check for Copper drop
  const copperTrend = trends.find(t => t.material.name === 'Copper Pipe');
  if (copperTrend && copperTrend.percentage < -2) {
    return {
      type: 'opportunity',
      message: `AI Opportunity: Copper prices have dropped ${Math.abs(copperTrend.percentage).toFixed(1)}%. Ensure your plumber is not charging peak-market rates for rough-in materials.`,
      materialName: 'Copper Pipe',
      percentage: copperTrend.percentage
    };
  }
  
  // Check for any material surging
  const surgingMaterial = trends.find(t => t.status.status === 'Surge');
  if (surgingMaterial) {
    return {
      type: 'alert',
      message: `AI Alert: ${surgingMaterial.material.name} prices have surged ${surgingMaterial.percentage.toFixed(1)}%. Ask your contractor if material costs can be locked in at today's prices.`,
      materialName: surgingMaterial.material.name,
      percentage: surgingMaterial.percentage
    };
  }
  
  // Check for any dropping material
  const droppingMaterial = trends.find(t => t.status.status === 'Drop');
  if (droppingMaterial) {
    return {
      type: 'opportunity',
      message: `AI Opportunity: ${droppingMaterial.material.name} prices have dropped ${Math.abs(droppingMaterial.percentage).toFixed(1)}%. Verify your contractor's quote reflects current market pricing.`,
      materialName: droppingMaterial.material.name,
      percentage: droppingMaterial.percentage
    };
  }
  
  // Default observation
  return {
    type: 'observation',
    message: 'AI Observation: Material prices are currently stable. Standard material markups (20-30%) should apply.',
    materialName: undefined,
    percentage: undefined
  };
}

// ============================================================================
// 5. MARKUP AUDIT FUNCTION
// ============================================================================

export interface MarkupAuditResult {
  type: 'negotiation' | 'quality_check' | 'normal';
  markupPercentage: number;
  message: string;
}

/**
 * Audit material markup between user's bid cost and estimated market cost.
 * 
 * Logic:
 * - If markup > 30%: Negotiation opportunity (markup exceeds standard)
 * - If markup < 10%: Quality check (may indicate lower-grade materials)
 * - Otherwise: Normal markup range
 */
export function auditMaterialMarkup(userBidCost: number, estimatedMarketCost: number): MarkupAuditResult {
  if (estimatedMarketCost <= 0) {
    return {
      type: 'normal',
      markupPercentage: 0,
      message: 'Unable to calculate markup without valid market cost.'
    };
  }
  
  const markupPercentage = ((userBidCost - estimatedMarketCost) / estimatedMarketCost) * 100;
  const roundedMarkup = Math.round(markupPercentage * 10) / 10;
  
  if (markupPercentage > 30) {
    return {
      type: 'negotiation',
      markupPercentage: roundedMarkup,
      message: `Negotiation Opportunity: Markup exceeds standard 10-20% handling fee. Your bid shows a ${roundedMarkup}% markup on materials.`
    };
  } else if (markupPercentage < 10) {
    return {
      type: 'quality_check',
      markupPercentage: roundedMarkup,
      message: `Quality Check: Extremely low markup (${roundedMarkup}%) may indicate lower-grade materials or a missing scope of work.`
    };
  } else {
    return {
      type: 'normal',
      markupPercentage: roundedMarkup,
      message: `Normal Markup: Material markup of ${roundedMarkup}% is within the standard 10-20% handling fee range.`
    };
  }
}

// ============================================================================
// 6. SEASONAL VOLATILITY LOGIC
// ============================================================================

export interface SeasonalAlert {
  isActive: boolean;
  message: string;
  season: 'spring' | 'summer' | 'fall' | 'winter';
}

/**
 * Get seasonal alert based on current date and material trends.
 * 
 * For February 2026 (mock date), if any material is in 'Rise' or 'Surge' status,
 * returns a Spring building surge alert.
 */
export function getSeasonalAlert(trends: MaterialTrend[], mockDate?: Date): SeasonalAlert {
  // Use mock date (February 2026) or current date
  const currentDate = mockDate || new Date(2026, 1, 15); // February 15, 2026
  const month = currentDate.getMonth(); // 0-11
  
  // Determine season
  let season: 'spring' | 'summer' | 'fall' | 'winter';
  if (month >= 2 && month <= 4) {
    season = 'spring';
  } else if (month >= 5 && month <= 7) {
    season = 'summer';
  } else if (month >= 8 && month <= 10) {
    season = 'fall';
  } else {
    season = 'winter';
  }
  
  // Check if any material is in Rise or Surge status
  const hasRisingMaterials = trends.some(
    t => t.status.status === 'Rise' || t.status.status === 'Surge'
  );
  
  // February is month 1 (0-indexed), which is late winter/early spring building season
  const isSpringBuildingSeason = month >= 1 && month <= 4; // Feb through May
  
  if (hasRisingMaterials && isSpringBuildingSeason) {
    return {
      isActive: true,
      message: 'Seasonal Alert: We are entering the Spring building surge. Material quotes should be locked within 7-10 days to guarantee this pricing.',
      season
    };
  }
  
  // Summer peak season alert
  if (hasRisingMaterials && (month >= 5 && month <= 7)) {
    return {
      isActive: true,
      message: 'Seasonal Alert: Peak summer construction season. Material availability may be limited. Lock in pricing and delivery dates early.',
      season
    };
  }
  
  return {
    isActive: false,
    message: '',
    season
  };
}

// ============================================================================
// 7. SOURCING TIP (Constant)
// ============================================================================

export const SOURCING_TIP = `Research Tip: Consider sourcing your own "Finish Materials" (tile, faucets, lights) to save the 20-40% contractor markup, but ensure your contract clearly defines who is responsible for delivery and damage risk.`;

// ============================================================================
// 8. CHART DATA GENERATION
// ============================================================================

export interface ChartDataPoint {
  month: string;
  [key: string]: number | string; // Material keys as dynamic properties
}

/**
 * Generate chart data for Recharts from material history.
 * Returns an array of data points with each month and all material values.
 */
export function generateChartData(projectType: ProjectType | string = 'general'): ChartDataPoint[] {
  const materials = getProjectMaterials(projectType);
  
  return HISTORY_MONTHS.map((month, index) => {
    const dataPoint: ChartDataPoint = { month };
    
    materials.forEach(material => {
      // Use a simplified key (lowercase, no spaces)
      const key = material.name.toLowerCase().replace(/\s+/g, '');
      dataPoint[key] = material.history[index];
    });
    
    return dataPoint;
  });
}

/**
 * Get chart configuration (colors, names) for materials.
 */
export function getChartConfig(projectType: ProjectType | string = 'general'): Array<{
  key: string;
  name: string;
  color: string;
  icon: string;
}> {
  const materials = getProjectMaterials(projectType);
  
  return materials.map(material => ({
    key: material.name.toLowerCase().replace(/\s+/g, ''),
    name: material.name,
    color: material.color,
    icon: material.icon
  }));
}

// ============================================================================
// 9. UTILITY FUNCTIONS
// ============================================================================

/**
 * Get all available materials.
 */
export function getAllMaterials(): MaterialData[] {
  return Object.values(MATERIAL_DATA);
}

/**
 * Get a specific material by key.
 */
export function getMaterialByKey(key: MaterialKey): MaterialData {
  return MATERIAL_DATA[key];
}

/**
 * Format percentage for display with sign.
 */
export function formatPercentage(percentage: number): string {
  const sign = percentage > 0 ? '+' : '';
  return `${sign}${percentage.toFixed(1)}%`;
}
