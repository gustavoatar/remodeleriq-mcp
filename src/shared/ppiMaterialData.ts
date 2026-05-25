/**
 * BLS Producer Price Index (PPI) Material Data
 * 
 * Reference data for construction materials based on BLS PPI Commodities.
 * Used to audit material costs and detect savings opportunities.
 * 
 * Data Sources:
 * - WPU081: Lumber and Wood Products
 * - WPU132: Concrete Ingredients
 * - WPU133: Gypsum Products
 */

export type PPICommodityCode = 'WPU081' | 'WPU132' | 'WPU133' | 'WPU101' | 'WPU102' | 'WPU054';

export type TrendDirection = 'rising' | 'falling' | 'stable';

export interface PPIMaterial {
  code: PPICommodityCode;
  name: string;
  description: string;
  currentIndex: number;
  sixMonthChange: number; // Percentage change over 6 months
  trend: TrendDirection;
  baselinePerUnit: number; // Baseline cost per unit for auditing
  unit: string;
  lastUpdated: string;
  applicableProjects: string[]; // Project types this material applies to
}

export interface MaterialTrendResult {
  material: PPIMaterial;
  trend: TrendDirection;
  trendLabel: string;
  savingsTip?: string;
  negotiationScript?: string;
}

export interface MaterialAuditResult {
  projectType: string;
  primaryMaterial: PPIMaterial | null;
  trends: MaterialTrendResult[];
  savingsTips: string[];
  talkTrackSuggestions: string[];
}

/**
 * BLS PPI Commodity Reference Data
 * 
 * Updated with 2024 data representing national averages.
 * Six-month trends based on recent market conditions.
 */
export const PPI_MATERIALS: PPIMaterial[] = [
  {
    code: 'WPU081',
    name: 'Lumber & Wood Products',
    description: 'Softwood lumber, plywood, treated wood, framing, and cabinetry',
    currentIndex: 176.2,
    sixMonthChange: -8.3, // Down from pandemic highs
    trend: 'falling',
    baselinePerUnit: 8.50, // Per board foot (treated lumber)
    unit: 'per board foot',
    lastUpdated: '2024-12',
    applicableProjects: ['deck-construction', 'addition', 'roofing', 'siding', 'kitchen-remodel', 'bathroom-remodel', 'flooring-hardwood', 'cabinet-install']
  },
  {
    code: 'WPU132',
    name: 'Concrete & Cement',
    description: 'Ready-mix concrete, cement, and aggregate materials',
    currentIndex: 198.4,
    sixMonthChange: 2.1,
    trend: 'stable',
    baselinePerUnit: 145, // Per cubic yard
    unit: 'per cubic yard',
    lastUpdated: '2024-12',
    applicableProjects: ['addition', 'basement-finishing', 'deck-construction']
  },
  {
    code: 'WPU133',
    name: 'Gypsum Products',
    description: 'Drywall, plasterboard, and gypsum-based materials',
    currentIndex: 185.7,
    sixMonthChange: -4.2,
    trend: 'falling',
    baselinePerUnit: 0.45, // Per sq ft of drywall
    unit: 'per sq ft',
    lastUpdated: '2024-12',
    applicableProjects: ['basement-finishing', 'addition', 'bathroom-remodel', 'kitchen-remodel']
  },
  {
    code: 'WPU101',
    name: 'Copper & Brass',
    description: 'Copper pipe, wiring, and fixtures',
    currentIndex: 287.3,
    sixMonthChange: 5.7,
    trend: 'rising',
    baselinePerUnit: 4.25, // Per linear foot of copper pipe
    unit: 'per linear foot',
    lastUpdated: '2024-12',
    applicableProjects: ['plumbing', 'electrical-panel', 'hvac']
  },
  {
    code: 'WPU102',
    name: 'Steel & Iron',
    description: 'Steel beams, fasteners, and structural components',
    currentIndex: 214.8,
    sixMonthChange: -3.1,
    trend: 'falling',
    baselinePerUnit: 1.85, // Per pound of structural steel
    unit: 'per pound',
    lastUpdated: '2024-12',
    applicableProjects: ['addition', 'deck-construction', 'roofing']
  },
  {
    code: 'WPU054',
    name: 'Asphalt & Roofing',
    description: 'Asphalt shingles, roofing felt, and waterproofing materials',
    currentIndex: 226.9,
    sixMonthChange: 1.8,
    trend: 'stable',
    baselinePerUnit: 3.75, // Per sq ft of roofing
    unit: 'per sq ft',
    lastUpdated: '2024-12',
    applicableProjects: ['roofing', 'siding']
  }
];

/**
 * Project type to primary material mapping
 * Maps project categories to relevant BLS PPI commodity codes
 */
const PROJECT_MATERIAL_MAP: Record<string, PPICommodityCode[]> = {
  'deck-construction': ['WPU081', 'WPU102'],
  'basement-finishing': ['WPU133', 'WPU081', 'WPU101'],
  'bathroom-remodel': ['WPU133', 'WPU101', 'WPU081'],
  'kitchen-remodel': ['WPU081', 'WPU133', 'WPU101'],
  'roofing': ['WPU054', 'WPU081'],
  'addition': ['WPU081', 'WPU133', 'WPU132', 'WPU102'],
  'siding': ['WPU081', 'WPU054'],
  'plumbing': ['WPU101'],
  'electrical-panel': ['WPU101'],
  'hvac': ['WPU101', 'WPU102'],
  'flooring-hardwood': ['WPU081'],
  'flooring-tile': ['WPU132'],
  'windows': ['WPU081', 'WPU133'],
  'painting-interior': ['WPU133'],
  'painting-exterior': ['WPU081'],
  'flooring-carpet': [],
  'cabinet-install': ['WPU081'],
  // Default materials to show for any construction project
  'default': ['WPU081', 'WPU133', 'WPU102']
};

/**
 * Detect materials mentioned in bid text
 * This supplements the project type detection with explicit material detection
 * Enhanced patterns to catch more variations
 */
export function detectMaterialsFromBidText(bidText: string): PPICommodityCode[] {
  const normalizedText = bidText.toLowerCase();
  const detected: Set<PPICommodityCode> = new Set();
  
  // Wood/Lumber/Cabinets detection - expanded patterns
  const woodPatterns = [
    /\bwood\b/i,
    /\blumber\b/i,
    /\bplywood\b/i,
    /\boak\b/i,
    /\bmaple\b/i,
    /\bcherry\b/i,
    /\bwalnut\b/i,
    /\bhardwood\b/i,
    /\bsoftwood\b/i,
    /\bcabinet/i,  // catches cabinet, cabinets, cabinetry
    /\bvanit/i,    // catches vanity, vanities
    /\bframing\b/i,
    /\bstud\b/i,
    /\bjoist\b/i,
    /\bbeam\b/i,
    /\btrim\b/i,
    /\bmolding\b/i,
    /\bmoulding\b/i,
    /\bbaseboard/i,
    /\bcrown\b/i,
    /\bdoor/i,      // doors often involve wood
    /\bwindow\s*frame/i,
    /\bshelf/i,     // shelving
    /\bshelv/i,
    /\bdeck\b/i,    // decking
    /\bfence\b/i,   // fencing
    /\bpine\b/i,
    /\bcedar\b/i,
    /\bredwood\b/i,
    /\bteak\b/i,
    /\bbamboo\b/i,
    /\bparquet\b/i,
    /\bLVT\b/i,     // Luxury vinyl tile (wood-look)
    /\bLVP\b/i,     // Luxury vinyl plank
    /\blaminate\s*floor/i,
    /\bwood\s*floor/i,
    /\bfloor.*wood/i,
    /\bkraft\s*maid/i,
    /\bKraftMaid\b/i,
  ];
  
  if (woodPatterns.some(p => p.test(normalizedText))) {
    detected.add('WPU081');
  }
  
  // Copper/Brass detection (plumbing/electrical)
  const copperPatterns = [
    /\bcopper\b/i,
    /\bpipe\b/i,
    /\bpipes\b/i,
    /\bplumb/i,     // plumbing, plumber
    /\bwiring\b/i,
    /\bwire\b/i,
    /\belectrical\b/i,
    /\boutlet/i,
    /\bfixture/i,
    /\bfaucet/i,
    /\bvalve\b/i,
    /\bwater\s*line/i,
    /\bgas\s*line/i,
    /\bdrain/i,
    /\bsupply\s*line/i,
    /\bshut[\s-]*off/i,
  ];
  
  if (copperPatterns.some(p => p.test(normalizedText))) {
    detected.add('WPU101');
  }
  
  // Gypsum/Drywall detection
  const gypsumPatterns = [
    /\bdrywall\b/i,
    /\bsheetrock\b/i,
    /\bgypsum\b/i,
    /\bplaster\b/i,
    /\bwall\s*board\b/i,
    /\bmud\s*(and\s*)?tape/i,
    /\bjoint\s*compound/i,
    /\btexture\b/i,
    /\bskim\s*coat/i,
  ];
  
  if (gypsumPatterns.some(p => p.test(normalizedText))) {
    detected.add('WPU133');
  }
  
  // Concrete detection
  const concretePatterns = [
    /\bconcrete\b/i,
    /\bcement\b/i,
    /\bfoundation\b/i,
    /\bslab\b/i,
    /\bfooting/i,
    /\bpaver/i,
    /\bmasonry\b/i,
    /\bbrick\b/i,
    /\bblock\b/i,
    /\bmortar\b/i,
    /\bgrout\b/i,
  ];
  
  if (concretePatterns.some(p => p.test(normalizedText))) {
    detected.add('WPU132');
  }
  
  // Steel detection
  const steelPatterns = [
    /\bsteel\b/i,
    /\bmetal\b/i,
    /\biron\b/i,
    /\bbeam\b/i,
    /\bstructural\b/i,
    /\bjoist\s*hanger/i,
    /\bsimpson/i,      // Simpson Strong-Tie
    /\bflashing\b/i,
    /\bgutter/i,
    /\bdownspout/i,
    /\baluminum\b/i,
    /\brebar\b/i,
    /\breinforc/i,
  ];
  
  if (steelPatterns.some(p => p.test(normalizedText))) {
    detected.add('WPU102');
  }
  
  // Roofing detection
  const roofingPatterns = [
    /\bshingle/i,
    /\broof/i,
    /\basphalt\b/i,
    /\btar\b/i,
    /\bunderlayment\b/i,
    /\bflashing\b/i,
    /\bice[\s-]*dam/i,
    /\bdrip\s*edge/i,
    /\bfelt\b/i,
    /\bsoffit/i,
    /\bfascia/i,
    /\bvent\b/i,
    /\bventing\b/i,
  ];
  
  if (roofingPatterns.some(p => p.test(normalizedText))) {
    detected.add('WPU054');
  }
  
  return Array.from(detected);
}

/**
 * Get the trend direction label for display
 */
function getTrendLabel(trend: TrendDirection, changePercent: number): string {
  const absChange = Math.abs(changePercent).toFixed(1);
  switch (trend) {
    case 'rising':
      return `Up ${absChange}% (6 mo)`;
    case 'falling':
      return `Down ${absChange}% (6 mo)`;
    case 'stable':
      return `Stable (±${absChange}%)`;
  }
}

/**
 * Generate savings tip if material prices are falling
 */
function generateSavingsTip(material: PPIMaterial): string | undefined {
  if (material.trend === 'falling' && material.sixMonthChange < -3) {
    return `${material.name} prices have dropped ${Math.abs(material.sixMonthChange).toFixed(1)}% in the past 6 months. Ask if your contractor's material quote reflects current market pricing.`;
  }
  return undefined;
}

/**
 * Generate negotiation script for material trends
 */
function generateNegotiationScript(material: PPIMaterial): string | undefined {
  if (material.trend === 'falling') {
    return `"I noticed material indices for ${material.name.toLowerCase()} have stabilized recently; does this quote reflect current market pricing or a previous estimate?"`;
  }
  if (material.trend === 'rising') {
    return `"I understand ${material.name.toLowerCase()} costs have been increasing. Is there a way to lock in current pricing if I commit soon?"`;
  }
  return undefined;
}

/**
 * Get material trend data for a specific project type
 */
export function getMaterialTrendsForProject(projectType: string | null): MaterialAuditResult {
  // Use project-specific materials, or fallback to common construction materials
  const materialCodes = (projectType && PROJECT_MATERIAL_MAP[projectType]?.length > 0)
    ? PROJECT_MATERIAL_MAP[projectType]
    : PROJECT_MATERIAL_MAP['default'];
    
  const materials = materialCodes
    .map(code => PPI_MATERIALS.find(m => m.code === code))
    .filter((m): m is PPIMaterial => m !== undefined);

  const trends: MaterialTrendResult[] = materials.map(material => ({
    material,
    trend: material.trend,
    trendLabel: getTrendLabel(material.trend, material.sixMonthChange),
    savingsTip: generateSavingsTip(material),
    negotiationScript: generateNegotiationScript(material)
  }));

  const savingsTips = trends
    .map(t => t.savingsTip)
    .filter((tip): tip is string => tip !== undefined);

  const talkTrackSuggestions = trends
    .map(t => t.negotiationScript)
    .filter((script): script is string => script !== undefined);

  return {
    projectType: projectType || 'General Construction',
    primaryMaterial: materials[0] || null,
    trends,
    savingsTips,
    talkTrackSuggestions
  };
}

/**
 * Get a specific material by its PPI code
 */
export function getMaterialByCode(code: PPICommodityCode): PPIMaterial | undefined {
  return PPI_MATERIALS.find(m => m.code === code);
}

/**
 * Get all materials with falling prices (potential savings)
 */
export function getMaterialsWithFallingPrices(): PPIMaterial[] {
  return PPI_MATERIALS.filter(m => m.trend === 'falling');
}

/**
 * Check if a bid's material cost seems high compared to baseline
 * Returns true if the quoted price per unit exceeds baseline by threshold
 */
export function isMaterialCostAboveBaseline(
  quotedPricePerUnit: number,
  materialCode: PPICommodityCode,
  thresholdPercent: number = 20
): boolean {
  const material = getMaterialByCode(materialCode);
  if (!material) return false;
  
  const percentAbove = ((quotedPricePerUnit - material.baselinePerUnit) / material.baselinePerUnit) * 100;
  return percentAbove > thresholdPercent;
}

/**
 * Get all available PPI materials
 */
export function getAllMaterials(): PPIMaterial[] {
  return PPI_MATERIALS;
}
