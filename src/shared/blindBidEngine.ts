// =============================================================================
// BLIND BID ANALYSIS ENGINE
// Analyzes bids without square footage using lump-sum benchmarks
// Enhanced with Zonda Cost vs Value 2025 regional data
// =============================================================================

import type { AnalysisResult } from './analysisEngine';
import {
  HOMEWYSE_BENCHMARKS,
  SCOPE_KEYWORDS,
  STRUCTURAL_ADDONS,
  LABOR_MATERIALS_BASELINE,
  LINEAR_FOOT_BENCHMARKS,
  detectLinearFootMaterial,
} from './benchmarkData';
import {
  ZONDA_COST_DATA,
  STATE_TO_ZONDA_REGION,
  ZONDA_REGION_NAMES,
} from './zondaCostData';
import {
  categorizeLineItems,
  mapCategoryToProjectType,
  type LineItemCategorizationResult,
} from './lineItemCategorization';
import {
  // getSmartBenchmark, // TODO: Use for enhanced benchmarks
  detectComplexityMultiplier,
  // detectMaterialType, // TODO: Use for material-specific pricing
  getExpectedLaborRatio,
} from './smartPricingEngine';

// =============================================================================
// TYPES
// =============================================================================

export type BlindBidProjectType = 
  | 'kitchen' | 'bathroom' | 'basement' | 'basement-refinishing' 
  | 'windows' | 'window-repair'
  | 'countertops' | 'painting' | 'fireplace' 
  | 'deck' | 'deck-repair' 
  | 'garage-door'
  | 'cabinet-refinishing' | 'cabinet-refacing' | 'cabinet-replacement' | 'cabinet-new-line'
  | 'roofing' | 'roofing-repair' | 'roofing-storm' | 'roofing-hail' | 'roofing-fire' | 'roofing-insurance'
  | 'door-interior' | 'door-patio' | 'door-french'
  // Linear feet projects
  | 'fence' | 'fence-repair' | 'gutter' | 'gutter-repair' | 'railing' | 'retaining-wall'
  | 'general';
export type QualityTier = 'builder' | 'midrange' | 'upscale' | 'premium';
export type VarianceFlag = 'green' | 'yellow' | 'red';
export type Recommendation = 'accept' | 'negotiate' | 'reject';

export interface ScopeDensityResult {
  score: number;
  tier: QualityTier;
  multiplier: number;
  keywordsFound: string[];
}

export interface StructuralAddOnsResult {
  total: number;
  items: Array<{ label: string; cost: number }>;
}

export interface BlindBidFlag {
  type: 'red' | 'yellow' | 'green';
  message: string;
}

export interface ZondaMultiplierResult {
  multiplier: number;
  source: 'city' | 'region' | 'national';
  sourceName: string;
  citation: string;
  projectKey: string | null;
}

export interface BlindBidAnalysis {
  isBlindBid: boolean;
  projectType: BlindBidProjectType;
  detectedTier: QualityTier;
  scopeDensityScore: number;
  scopeKeywordsFound: string[];
  
  city: string;
  cityTier: 1 | 2 | 3 | 4 | 5;
  cityMultiplier: { low: number; high: number };
  
  structuralAddOns: number;
  structuralItems: Array<{ label: string; cost: number }>;
  
  fairBidRange: { low: number; mid: number; high: number };
  confidence: 'high' | 'medium' | 'low';
  
  submittedBid: number;
  variancePercent: number;
  varianceFlag: VarianceFlag;
  
  laborRatio?: number;
  laborFlag?: 'normal' | 'high' | 'low';
  
  benchmarkBreakdown: {
    baseBenchmark: { low: number; high: number };
    tierMultiplier: number;
    cityMultiplierUsed: number;
    laborHours: number;
    materialsPercent: number;
    laborPercent: number;
  };
  
  // Zonda-specific data
  zondaData?: {
    projectKey: string;
    nationalCost: number;
    regionalCost: number;
    multiplier: number;
    source: 'city' | 'region' | 'national';
    sourceName: string;
    citation: string;
  };
  
  flags: BlindBidFlag[];
  recommendation: Recommendation;
  negotiateAmount?: number;
  
  dataSource: string;
}

// =============================================================================
// CITY TO ZONDA MAPPING
// Converts city names to Zonda city keys
// =============================================================================

const CITY_TO_ZONDA_KEY: Record<string, { key: string; state: string }> = {
  // Birmingham, AL
  'birmingham': { key: 'birmingham-al', state: 'AL' },
  'birmingham al': { key: 'birmingham-al', state: 'AL' },
  'birmingham alabama': { key: 'birmingham-al', state: 'AL' },
  'hoover': { key: 'birmingham-al', state: 'AL' },
  'homewood': { key: 'birmingham-al', state: 'AL' },
  'vestavia hills': { key: 'birmingham-al', state: 'AL' },
  'mountain brook': { key: 'birmingham-al', state: 'AL' },
  
  // Boston, MA
  'boston': { key: 'boston-ma', state: 'MA' },
  'boston ma': { key: 'boston-ma', state: 'MA' },
  'cambridge': { key: 'boston-ma', state: 'MA' },
  'somerville': { key: 'boston-ma', state: 'MA' },
  'brookline': { key: 'boston-ma', state: 'MA' },
  'newton': { key: 'boston-ma', state: 'MA' },
  'quincy': { key: 'boston-ma', state: 'MA' },
  'worcester': { key: 'boston-ma', state: 'MA' },
  'springfield ma': { key: 'boston-ma', state: 'MA' },
  
  // Appleton, WI (represents East North Central)
  'appleton': { key: 'appleton-wi', state: 'WI' },
  'appleton wi': { key: 'appleton-wi', state: 'WI' },
  'green bay': { key: 'appleton-wi', state: 'WI' },
  'oshkosh': { key: 'appleton-wi', state: 'WI' },
  'madison': { key: 'appleton-wi', state: 'WI' },
  'milwaukee': { key: 'appleton-wi', state: 'WI' },
  
  // Albuquerque, NM (represents Mountain region)
  'albuquerque': { key: 'albuquerque-nm', state: 'NM' },
  'albuquerque nm': { key: 'albuquerque-nm', state: 'NM' },
  'santa fe': { key: 'albuquerque-nm', state: 'NM' },
  'rio rancho': { key: 'albuquerque-nm', state: 'NM' },
  'las cruces': { key: 'albuquerque-nm', state: 'NM' },
  
  // Atlanta, GA (represents South Atlantic)
  'atlanta': { key: 'atlanta-ga', state: 'GA' },
  'atlanta ga': { key: 'atlanta-ga', state: 'GA' },
  'roswell': { key: 'atlanta-ga', state: 'GA' },
  'alpharetta': { key: 'atlanta-ga', state: 'GA' },
  'marietta': { key: 'atlanta-ga', state: 'GA' },
  'kennesaw': { key: 'atlanta-ga', state: 'GA' },
  'smyrna': { key: 'atlanta-ga', state: 'GA' },
  'sandy springs': { key: 'atlanta-ga', state: 'GA' },
  'johns creek': { key: 'atlanta-ga', state: 'GA' },
  'lawrenceville': { key: 'atlanta-ga', state: 'GA' },
  'decatur': { key: 'atlanta-ga', state: 'GA' },
  'peachtree city': { key: 'atlanta-ga', state: 'GA' },
  'woodstock': { key: 'atlanta-ga', state: 'GA' },
  'canton ga': { key: 'atlanta-ga', state: 'GA' },
  'duluth ga': { key: 'atlanta-ga', state: 'GA' },
  'suwanee': { key: 'atlanta-ga', state: 'GA' },
  'cumming': { key: 'atlanta-ga', state: 'GA' },
  'buford': { key: 'atlanta-ga', state: 'GA' },
};

// ZIP code ranges to Zonda cities/regions
const ZIP_TO_ZONDA: Record<string, { cityKey?: string; state: string }> = {
  // Birmingham, AL metro (350xx-352xx)
  '350': { cityKey: 'birmingham-al', state: 'AL' },
  '351': { cityKey: 'birmingham-al', state: 'AL' },
  '352': { cityKey: 'birmingham-al', state: 'AL' },
  
  // Boston, MA metro (010xx-027xx)
  '010': { cityKey: 'boston-ma', state: 'MA' },
  '011': { cityKey: 'boston-ma', state: 'MA' },
  '012': { cityKey: 'boston-ma', state: 'MA' },
  '013': { cityKey: 'boston-ma', state: 'MA' },
  '014': { cityKey: 'boston-ma', state: 'MA' },
  '015': { cityKey: 'boston-ma', state: 'MA' },
  '016': { cityKey: 'boston-ma', state: 'MA' },
  '017': { cityKey: 'boston-ma', state: 'MA' },
  '018': { cityKey: 'boston-ma', state: 'MA' },
  '019': { cityKey: 'boston-ma', state: 'MA' },
  '020': { cityKey: 'boston-ma', state: 'MA' },
  '021': { cityKey: 'boston-ma', state: 'MA' },
  '022': { cityKey: 'boston-ma', state: 'MA' },
  '023': { cityKey: 'boston-ma', state: 'MA' },
  '024': { cityKey: 'boston-ma', state: 'MA' },
  '025': { cityKey: 'boston-ma', state: 'MA' },
  '026': { cityKey: 'boston-ma', state: 'MA' },
  '027': { cityKey: 'boston-ma', state: 'MA' },
  
  // Wisconsin (Appleton area) 
  '549': { cityKey: 'appleton-wi', state: 'WI' },
  '531': { cityKey: 'appleton-wi', state: 'WI' },
  '532': { cityKey: 'appleton-wi', state: 'WI' },
  '533': { cityKey: 'appleton-wi', state: 'WI' },
  '534': { cityKey: 'appleton-wi', state: 'WI' },
  '535': { cityKey: 'appleton-wi', state: 'WI' },
  '537': { cityKey: 'appleton-wi', state: 'WI' },
  '538': { cityKey: 'appleton-wi', state: 'WI' },
  '539': { cityKey: 'appleton-wi', state: 'WI' },
  '540': { cityKey: 'appleton-wi', state: 'WI' },
  '541': { cityKey: 'appleton-wi', state: 'WI' },
  '542': { cityKey: 'appleton-wi', state: 'WI' },
  '543': { cityKey: 'appleton-wi', state: 'WI' },
  '544': { cityKey: 'appleton-wi', state: 'WI' },
  '545': { cityKey: 'appleton-wi', state: 'WI' },
  '546': { cityKey: 'appleton-wi', state: 'WI' },
  '547': { cityKey: 'appleton-wi', state: 'WI' },
  
  // Albuquerque, NM (870xx-871xx)
  '870': { cityKey: 'albuquerque-nm', state: 'NM' },
  '871': { cityKey: 'albuquerque-nm', state: 'NM' },
  '875': { cityKey: 'albuquerque-nm', state: 'NM' },
  '877': { cityKey: 'albuquerque-nm', state: 'NM' },
  
  // Atlanta, GA metro (300xx-313xx)
  '300': { cityKey: 'atlanta-ga', state: 'GA' },
  '301': { cityKey: 'atlanta-ga', state: 'GA' },
  '302': { cityKey: 'atlanta-ga', state: 'GA' },
  '303': { cityKey: 'atlanta-ga', state: 'GA' },
  '304': { cityKey: 'atlanta-ga', state: 'GA' },
  '305': { cityKey: 'atlanta-ga', state: 'GA' },
  '306': { cityKey: 'atlanta-ga', state: 'GA' },
  '307': { cityKey: 'atlanta-ga', state: 'GA' },
  '308': { cityKey: 'atlanta-ga', state: 'GA' },
  '309': { cityKey: 'atlanta-ga', state: 'GA' },
  '310': { cityKey: 'atlanta-ga', state: 'GA' },
  '311': { cityKey: 'atlanta-ga', state: 'GA' },
  '312': { cityKey: 'atlanta-ga', state: 'GA' },
  '313': { cityKey: 'atlanta-ga', state: 'GA' },
};

// =============================================================================
// ZONDA INTEGRATION FUNCTIONS
// =============================================================================

/**
 * Maps our internal project type to Zonda project keys with quality tier awareness
 */
function getZondaProjectKeyForType(projectType: BlindBidProjectType, tier: QualityTier): string {
  if (projectType === 'kitchen') {
    if (tier === 'premium' || tier === 'upscale') {
      return 'kitchen-major-upscale';
    }
    if (tier === 'builder') {
      return 'kitchen-minor';
    }
    return 'kitchen-major-midrange';
  }
  
  if (projectType === 'bathroom') {
    if (tier === 'premium' || tier === 'upscale') {
      return 'bathroom-upscale';
    }
    return 'bathroom-midrange';
  }
  
  if (projectType === 'basement') {
    return 'basement';
  }
  
  if (projectType === 'windows') {
    // Wood windows for upscale/premium, vinyl for others
    if (tier === 'premium' || tier === 'upscale') {
      return 'window-wood';
    }
    return 'window-vinyl';
  }
  
  if (projectType === 'countertops') {
    // Zonda doesn't have countertop data - return null to trigger Houzz fallback
    return 'countertops';
  }
  
  if (projectType === 'painting') {
    // Zonda doesn't have painting data - return key to trigger Houzz fallback
    return 'painting';
  }
  
  if (projectType === 'fireplace') {
    // Zonda doesn't have fireplace data - return key to trigger Houzz fallback
    return 'fireplace';
  }
  
  if (projectType === 'deck-repair') {
    // Zonda doesn't have deck repair/staining data - return key to trigger Houzz fallback
    return 'deck-repair';
  }
  
  if (projectType === 'basement-refinishing') {
    // Zonda doesn't have basement refinishing data - return key to trigger Houzz fallback
    return 'basement-refinishing';
  }
  
  if (projectType === 'deck') {
    // Zonda has NEW deck construction data - use appropriate tier
    if (tier === 'premium' || tier === 'upscale') {
      return 'deck-composite';
    }
    return 'deck-wood';
  }
  
  // Garage door - Zonda has door-garage data
  if (projectType === 'garage-door') {
    return 'door-garage';
  }
  
  // Cabinet projects - no Zonda data, trigger Houzz fallback
  if (projectType === 'cabinet-refinishing') return 'cabinet-refinishing';
  if (projectType === 'cabinet-refacing') return 'cabinet-refacing';
  if (projectType === 'cabinet-replacement') return 'cabinet-replacement';
  if (projectType === 'cabinet-new-line') return 'cabinet-new-line';
  
  // Roofing - Zonda has roofing-asphalt, roofing-metal, roofing-standing-seam
  // but repair/damage types use Houzz fallback
  if (projectType === 'roofing') return 'roofing-asphalt';  // Standard roofing = asphalt shingles
  if (projectType === 'roofing-repair') return 'roofing-repair';
  if (projectType === 'roofing-storm') return 'roofing-storm';
  if (projectType === 'roofing-hail') return 'roofing-hail';
  if (projectType === 'roofing-fire') return 'roofing-fire';
  if (projectType === 'roofing-insurance') return 'roofing-insurance';
  
  // Door types - Zonda has entry doors (door-entry-steel, door-entry-fiberglass)
  // Interior/patio/french doors use Houzz fallback
  if (projectType === 'door-interior') return 'door-interior';
  if (projectType === 'door-patio') return 'door-patio';
  if (projectType === 'door-french') return 'door-french';
  
  // Window repair - distinct from replacement, uses Houzz fallback
  if (projectType === 'window-repair') return 'window-repair';
  
  // General/unknown - use kitchen midrange as proxy
  return 'kitchen-major-midrange';
}

/**
 * Gets Zonda multiplier with full fallback chain:
 * City (exact match) → City (from ZIP) → Region → National
 */
export function getZondaMultiplier(
  city: string | undefined,
  state: string | undefined,
  zip: string | undefined,
  projectType: BlindBidProjectType,
  tier: QualityTier
): ZondaMultiplierResult {
  const normalizedCity = city?.toLowerCase().trim() || '';
  const zondaProjectKey = getZondaProjectKeyForType(projectType, tier);
  const projectData = ZONDA_COST_DATA[zondaProjectKey];
  
  if (!projectData) {
    return {
      multiplier: 1.0,
      source: 'national',
      sourceName: 'National Average',
      citation: 'https://www.jlconline.com/cost-vs-value/2025/national/',
      projectKey: null
    };
  }
  
  // 1. Try exact city match
  const cityMapping = CITY_TO_ZONDA_KEY[normalizedCity];
  if (cityMapping && projectData.cities[cityMapping.key]) {
    const cityData = projectData.cities[cityMapping.key];
    return {
      multiplier: cityData.multiplier,
      source: 'city',
      sourceName: cityMapping.key.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(', ').replace(/-/g, ' '),
      citation: cityData.citation,
      projectKey: zondaProjectKey
    };
  }
  
  // 2. Try ZIP-based city match
  if (zip) {
    const zipPrefix = zip.substring(0, 3);
    const zipMapping = ZIP_TO_ZONDA[zipPrefix];
    if (zipMapping?.cityKey && projectData.cities[zipMapping.cityKey]) {
      const cityData = projectData.cities[zipMapping.cityKey];
      return {
        multiplier: cityData.multiplier,
        source: 'city',
        sourceName: zipMapping.cityKey.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(', ').replace(/-/g, ' '),
        citation: cityData.citation,
        projectKey: zondaProjectKey
      };
    }
  }
  
  // 3. Try region based on state
  const stateCode = state?.toUpperCase().trim();
  if (stateCode) {
    const region = STATE_TO_ZONDA_REGION[stateCode];
    if (region && projectData.regions[region]) {
      const regionData = projectData.regions[region];
      return {
        multiplier: regionData.multiplier,
        source: 'region',
        sourceName: ZONDA_REGION_NAMES[region],
        citation: regionData.citation,
        projectKey: zondaProjectKey
      };
    }
  }
  
  // 4. National fallback
  return {
    multiplier: 1.0,
    source: 'national',
    sourceName: 'National Average',
    citation: projectData.nationalCitation,
    projectKey: zondaProjectKey
  };
}

/**
 * Gets the Zonda benchmark cost for a project type
 */
function getZondaBenchmarkCost(
  projectType: BlindBidProjectType,
  tier: QualityTier
): { low: number; high: number; nationalCost: number; zondaKey: string } | null {
  const zondaKey = getZondaProjectKeyForType(projectType, tier);
  const projectData = ZONDA_COST_DATA[zondaKey];
  
  if (!projectData) return null;
  
  // Use national cost as baseline, apply +/- 15% for range
  const nationalCost = projectData.nationalCost;
  return {
    low: Math.round(nationalCost * 0.85),
    high: Math.round(nationalCost * 1.15),
    nationalCost,
    zondaKey
  };
}

// =============================================================================
// DETECTION FUNCTIONS
// =============================================================================

/**
 * Detects if a bid is a "blind bid" (missing square footage)
 */
export function detectBlindBid(analysis: AnalysisResult): boolean {
  return !analysis.squareFootage || analysis.squareFootage === 0;
}

/**
 * Detects the project type from analysis and raw text
 * 
 * PRIORITY ORDER:
 * 1. Cost-weighted line item analysis (most accurate for multi-area projects)
 * 2. Existing analysis projectType (from Gemini)
 * 3. Title/first-line heuristics
 * 4. Keyword frequency scoring (fallback)
 */
export function detectProjectType(analysis: AnalysisResult, rawText: string): BlindBidProjectType {
  const text = rawText.toLowerCase();
  
  // ==========================================================================
  // PRIORITY 1: Cost-weighted line item analysis
  // Parse line items, categorize by room, use highest-cost category
  // ==========================================================================
  const lineItemResult = categorizeLineItems(rawText);
  
  // If we successfully parsed line items with reasonable confidence, use cost-weighted detection
  if (lineItemResult.lineItems.length >= 3 && lineItemResult.totalParsedAmount >= 1000) {
    const primaryCategory = lineItemResult.primaryCategory;
    const primaryBreakdown = lineItemResult.categoryBreakdowns[0];
    
    // Use cost-weighted result if the primary category is significant (>30% of total)
    // and we have high/medium confidence in parsing
    if (primaryBreakdown && 
        primaryBreakdown.percentOfBid >= 30 && 
        lineItemResult.parseConfidence !== 'low') {
      
      const mappedType = mapCategoryToProjectType(primaryCategory);
      
      // Log for debugging (can be removed in production)
      console.log('[LineItemDetection] Cost-weighted result:', {
        primaryCategory,
        mappedType,
        percentOfBid: primaryBreakdown.percentOfBid.toFixed(1) + '%',
        totalParsed: lineItemResult.totalParsedAmount,
        isMultiArea: lineItemResult.isMultiArea,
        breakdown: lineItemResult.categoryBreakdowns.slice(0, 3).map(b => ({
          category: b.category,
          amount: b.totalCost,
          percent: b.percentOfBid.toFixed(1) + '%'
        }))
      });
      
      // ONLY use cost-weighted result for specific project types (kitchen, bathroom, basement, windows)
      // For 'general', allow PRIORITY 2 specialty detection (deck, painting, fireplace, countertops) to run
      if (mappedType !== 'general') {
        return mappedType;
      }
      // else: fall through to specialty detection below
    }
  }
  
  // ==========================================================================
  // PRIORITY 2: Title/first-line heuristics (extract early for use below)
  // ==========================================================================
  const firstLine = text.split('\n')[0];
  
  // ==========================================================================
  // PRIORITY 2a0: Basement refinishing detection (BEFORE painting detection)
  // Basement projects with painting/flooring components should NOT be detected as painting
  // ==========================================================================
  const basementInTitleEarly = firstLine.toLowerCase().includes('basement') || 
                               firstLine.toLowerCase().includes('lower level');
  
  if (basementInTitleEarly) {
    // Check for refinishing vs full finish indicators
    const basementRefinishKeywords = ['refinish', 'refinishing', 'refresh', 'update', 'renovation', 'remodel', 'repaint', 'drywall', 'flooring', 'floor', 'carpet', 'lvp', 'laminate', 'ceiling'];
    const basementFullFinishKeywords = ['finish basement', 'finishing basement', 'unfinished', 'convert', 'egress', 'framing', 'frame walls', 'rough-in', 'stub out', 'bare concrete'];
    
    const refinishScore = basementRefinishKeywords.filter(kw => text.toLowerCase().includes(kw)).length;
    const fullFinishScore = basementFullFinishKeywords.filter(kw => text.toLowerCase().includes(kw)).length;
    
    // If basement in title and has refinishing work but NOT converting unfinished space
    if (refinishScore >= 2 && fullFinishScore < 2) {
      return 'basement-refinishing';
    }
    // If it's clearly a full basement finish
    if (fullFinishScore >= 2) {
      return 'basement';
    }
    // Default basement in title with some work = refinishing
    if (refinishScore >= 1) {
      return 'basement-refinishing';
    }
  }
  
  // ==========================================================================
  // PRIORITY 2a: Painting detection (BEFORE kitchen/countertop detection)
  // Painting jobs often mention "Kitchen Cabinets" for cabinet refinishing, not remodeling
  // ==========================================================================
  const paintingCompanyIndicators = ['painting', 'painters', 'paint co', 'paint company', 'paint llc', 'paint inc'];
  const paintingKeywords = ['painted', 'paint', 'primer', 'primed', 'coat', 'coats', '3 coat', 'sherwin williams', 'sherwin-williams', 'sw ', 'sw7', 'behr', 'benjamin moore', 'interior paint', 'exterior paint', 'wall paint', 'trim paint', 'refinish', 're-finish', 'repaint', 're-paint'];
  const majorRemodelWork = ['demolition', 'demo kitchen', 'gut kitchen', 'new cabinets', 'cabinet install', 'appliance package', 'new appliances', 'plumbing rough', 'electrical rough', 'new countertop', 'countertop install', 'tile install', 'backsplash install', 'flooring install'];
  
  const isPaintingCompany = paintingCompanyIndicators.some(kw => text.toLowerCase().includes(kw));
  const paintingMentions = paintingKeywords.filter(kw => text.toLowerCase().includes(kw)).length;
  const majorRemodelMentions = majorRemodelWork.filter(kw => text.toLowerCase().includes(kw)).length;
  
  // Painting project: painting company OR heavy paint focus, AND no major remodel work
  if ((isPaintingCompany || paintingMentions >= 4) && majorRemodelMentions === 0) {
    return 'painting';
  }
  
  // Also detect if title explicitly mentions painting
  const paintingInTitle = firstLine.toLowerCase().includes('painting') || 
                          firstLine.toLowerCase().includes('paint job') ||
                          firstLine.toLowerCase().includes('interior and exterior');
  if (paintingInTitle && paintingMentions >= 2 && majorRemodelMentions === 0) {
    return 'painting';
  }
  
  // ==========================================================================
  // PRIORITY 2a2: Fireplace detection (BEFORE kitchen detection)
  // Fireplace surrounds are specialty projects, not kitchen remodels
  // ==========================================================================
  const fireplaceKeywords = ['fireplace', 'fire place', 'mantel', 'mantle', 'hearth', 'firebox', 'stone surround', 'stone panel', 'firebrick', 'fiberock'];
  const fireplaceInTitle = firstLine && fireplaceKeywords.some(kw => firstLine.toLowerCase().includes(kw));
  const fireplaceMentions = fireplaceKeywords.filter(kw => text.toLowerCase().includes(kw)).length;
  
  // Fireplace project: explicit fireplace keywords in title OR multiple mentions
  if (fireplaceInTitle || fireplaceMentions >= 2) {
    return 'fireplace';
  }
  
  // ==========================================================================
  // PRIORITY 2a3: Garage door detection
  // ==========================================================================
  const garageDoorKeywords = ['garage door', 'overhead door', 'carriage door', 'garage opener', 
    'liftmaster', 'chamberlain', 'amarr', 'clopay', 'wayne dalton', 'sectional door', 
    'roll-up door', 'torsion spring', 'extension spring', 'jackshaft'];
  const garageDoorInTitle = firstLine && garageDoorKeywords.some(kw => firstLine.toLowerCase().includes(kw));
  const garageDoorMentions = garageDoorKeywords.filter(kw => text.toLowerCase().includes(kw)).length;
  
  if (garageDoorInTitle || garageDoorMentions >= 2) {
    return 'garage-door';
  }
  
  // ==========================================================================
  // PRIORITY 2a4: Cabinet work detection (BEFORE kitchen detection)
  // Distinguish: refinishing < refacing < replacement < new-line
  // ==========================================================================
  const cabinetRefinishKeywords = ['refinish cabinet', 'cabinet refinish', 'cabinet painting', 
    'paint cabinets', 'stain cabinets', 'cabinet restoration', 'cabinet refresh', 
    'repaint cabinet', 'sand and paint'];
  const cabinetRefaceKeywords = ['reface cabinet', 'cabinet reface', 'cabinet refacing', 
    'new cabinet fronts', 'cabinet door replacement', 'replace cabinet doors', 
    'thermofoil', 'veneer cabinet', 'cabinet door overlay'];
  const cabinetReplaceKeywords = ['new cabinets', 'cabinet installation', 'replace cabinets', 
    'cabinet upgrade', 'rta cabinets', 'ready to assemble', 'kraftmaid', 'merillat', 
    'diamond cabinets', 'semi-custom cabinet', 'custom cabinet'];
  const cabinetNewLineKeywords = ['new cabinet line', 'additional cabinets', 'pantry cabinets', 
    'butler\'s pantry', 'laundry cabinets', 'mudroom cabinets', 'garage cabinets'];
  
  const cabinetRefineScore = cabinetRefinishKeywords.filter(kw => text.toLowerCase().includes(kw)).length;
  const cabinetRefaceScore = cabinetRefaceKeywords.filter(kw => text.toLowerCase().includes(kw)).length;
  const cabinetReplaceScore = cabinetReplaceKeywords.filter(kw => text.toLowerCase().includes(kw)).length;
  const cabinetNewLineScore = cabinetNewLineKeywords.filter(kw => text.toLowerCase().includes(kw)).length;
  
  // Only detect cabinet projects if NO major kitchen work (demolition, appliances, counters)
  const majorKitchenWorkForCabinets = ['demo kitchen', 'gut kitchen', 'appliance package', 
    'new appliances', 'kitchen remodel', 'kitchen renovation', 'full kitchen', 
    'countertop install', 'backsplash install'];
  const hasMajorKitchenWork = majorKitchenWorkForCabinets.some(kw => text.toLowerCase().includes(kw));
  
  if (!hasMajorKitchenWork) {
    // Priority: new-line > replacement > refacing > refinishing
    if (cabinetNewLineScore >= 1) return 'cabinet-new-line';
    if (cabinetReplaceScore >= 2) return 'cabinet-replacement';
    if (cabinetRefaceScore >= 2) return 'cabinet-refacing';
    if (cabinetRefineScore >= 2) return 'cabinet-refinishing';
  }
  
  // ==========================================================================
  // PRIORITY 2a5: Roofing detection (repair vs replacement, damage types)
  // ==========================================================================
  const roofingKeywords = ['roof', 'shingle', 'roofing'];
  const roofRepairKeywords = ['roof repair', 'shingle repair', 'leak repair', 'patch roof', 
    'fix roof', 'roof maintenance', 'flashing repair', 'small leak', 'few shingles'];
  const roofStormKeywords = ['storm damage', 'wind damage', 'tree damage', 'branch damage', 
    'emergency roof', 'tarp', 'temporary repair'];
  const roofHailKeywords = ['hail damage', 'hail claim', 'hail storm', 'pockmarks', 
    'dented', 'granule loss'];
  const roofFireKeywords = ['fire damage', 'smoke damage', 'fire restoration', 'burn', 
    'char', 'fire claim'];
  const roofInsuranceKeywords = ['insurance claim', 'adjuster', 'claim number', 'deductible', 
    'supplement', 'xactimate', 'o&p', 'acv', 'rcv'];
  const roofFullReplaceKeywords = ['roof replacement', 'new roof', 'reroof', 're-roof', 
    'tear off', 'full roof'];
  
  const hasRoofKeywords = roofingKeywords.some(kw => text.toLowerCase().includes(kw));
  const roofRepairScore = roofRepairKeywords.filter(kw => text.toLowerCase().includes(kw)).length;
  const roofStormScore = roofStormKeywords.filter(kw => text.toLowerCase().includes(kw)).length;
  const roofHailScore = roofHailKeywords.filter(kw => text.toLowerCase().includes(kw)).length;
  const roofFireScore = roofFireKeywords.filter(kw => text.toLowerCase().includes(kw)).length;
  const roofInsuranceScore = roofInsuranceKeywords.filter(kw => text.toLowerCase().includes(kw)).length;
  const roofFullReplaceScore = roofFullReplaceKeywords.filter(kw => text.toLowerCase().includes(kw)).length;
  
  if (hasRoofKeywords) {
    // Priority: insurance > fire > hail > storm > repair (most specific wins)
    // Insurance keywords take precedence
    if (roofInsuranceScore >= 2) return 'roofing-insurance';
    if (roofFireScore >= 2) return 'roofing-fire';
    if (roofHailScore >= 2) return 'roofing-hail';
    if (roofStormScore >= 2) return 'roofing-storm';
    
    // If clearly repair work (not full replacement)
    if (roofRepairScore >= 2 && roofFullReplaceScore === 0) return 'roofing-repair';
    
    // Check bid amount - small roof jobs are likely repairs
    if (roofRepairScore >= 1 && analysis.totalPrice && analysis.totalPrice < 10000 && roofFullReplaceScore === 0) {
      return 'roofing-repair';
    }
    
    // Standard roofing job (full replacement, no special damage type)
    // This catches asphalt shingle replacement, reroof, etc.
    return 'roofing';
  }
  
  // ==========================================================================
  // PRIORITY 2a6: Door detection (interior, patio, french)
  // ==========================================================================
  const doorInteriorKeywords = ['interior door', 'bedroom door', 'closet door', 'bathroom door', 
    'hollow core', 'solid core', 'pocket door', 'barn door', 'interior doors'];
  const doorPatioKeywords = ['patio door', 'sliding door', 'slider', 'glass door', 
    'arcadia door', 'sliding glass'];
  const doorFrenchKeywords = ['french door', 'double door', 'garden door', 'terrace door'];
  const doorEntryKeywords = ['entry door', 'front door', 'exterior door', 'steel door', 
    'fiberglass door', 'security door'];
  
  const doorInteriorScore = doorInteriorKeywords.filter(kw => text.toLowerCase().includes(kw)).length;
  const doorPatioScore = doorPatioKeywords.filter(kw => text.toLowerCase().includes(kw)).length;
  const doorFrenchScore = doorFrenchKeywords.filter(kw => text.toLowerCase().includes(kw)).length;
  // Entry doors are handled by Zonda data, but we track them to avoid misclassification
  void doorEntryKeywords; // Entry doors use Zonda benchmarks (door-entry-steel, door-entry-fiberglass)
  
  // Priority: french > patio > interior (entry doors use Zonda data, handled separately)
  if (doorFrenchScore >= 1) return 'door-french';
  if (doorPatioScore >= 2) return 'door-patio';
  if (doorInteriorScore >= 2) return 'door-interior';
  
  // Single interior door mentions in title
  const doorInTitle = firstLine && doorInteriorKeywords.some(kw => firstLine.toLowerCase().includes(kw));
  if (doorInTitle) return 'door-interior';
  
  // ==========================================================================
  // PRIORITY 2a7: Window repair (distinct from window replacement)
  // ==========================================================================
  const windowRepairKeywords = ['window repair', 'reglazing', 'seal repair', 'window restoration', 
    'sash repair', 'balance repair', 'broken seal', 'fogged window', 
    'condensation between panes', 'window seal', 'fix window'];
  const windowRepairScore = windowRepairKeywords.filter(kw => text.toLowerCase().includes(kw)).length;
  
  if (windowRepairScore >= 2) return 'window-repair';
  // Also check for repair-specific language in title
  const windowRepairInTitle = firstLine && windowRepairKeywords.some(kw => firstLine.toLowerCase().includes(kw));
  if (windowRepairInTitle) return 'window-repair';
  
  // ==========================================================================
  // PRIORITY 2a7.5: Railing detection (BEFORE deck - deck has 'deck rail' keyword)
  // ==========================================================================
  const railingKeywords = ['railing', 'handrail', 'stair rail', 'baluster', 'bannister', 'banister', 'iron railing', 'aluminum railing', 'cable railing', 'glass railing', 'porch railing', 'deck railing'];
  const railingInTitle = firstLine && railingKeywords.some(kw => firstLine.toLowerCase().includes(kw));
  const railingMentions = railingKeywords.filter(kw => text.toLowerCase().includes(kw)).length;
  const isRailingProject = railingInTitle || railingMentions >= 2;
  
  if (isRailingProject) {
    return 'railing';
  }
  
  // ==========================================================================
  // PRIORITY 2a8: Deck detection (BEFORE general remodel)
  // Differentiate between NEW deck construction vs REPAIR/STAINING work
  // Skip if this is primarily a railing project (already handled above)
  // ==========================================================================
  const deckKeywords = ['deck', 'decking', 'deck repair', 'deck stain', 'deck staining', 'deck post', 'deck step', 'deck floor', 'deck board', 'deck joist', 'pergola', 'power wash deck', 'powerwash deck', 'trex', 'composite deck', 'wood deck', 'deck footing', 'deck landing'];
  const deckRepairKeywords = ['deck repair', 'repair deck', 'stain deck', 'deck stain', 'deck staining', 'restain', 're-stain', 'refinish deck', 'reseal deck', 'seal deck', 'power wash deck', 'powerwash deck', 'pressure wash deck', 'deck restoration', 'deck maintenance', 'fix deck', 'replace deck board', 'deck board replacement'];
  const newDeckKeywords = ['new deck', 'build deck', 'deck addition', 'deck construction', 'install deck', 'deck installation', 'trex deck', 'composite deck install'];
  
  const deckInTitle = firstLine && deckKeywords.some(kw => firstLine.toLowerCase().includes(kw));
  const deckMentions = deckKeywords.filter(kw => text.toLowerCase().includes(kw)).length;
  const repairMentions = deckRepairKeywords.filter(kw => text.toLowerCase().includes(kw)).length;
  const newDeckMentions = newDeckKeywords.filter(kw => text.toLowerCase().includes(kw)).length;
  
  // Deck project: explicit deck keywords in title OR multiple mentions
  if (deckInTitle || deckMentions >= 3) {
    // Determine if this is repair/staining vs new construction
    // Repair/staining: explicit repair keywords OR small bid amount (< $15k) without new deck keywords
    const isRepairProject = repairMentions >= 1 || 
                            (analysis.totalPrice && analysis.totalPrice < 15000 && newDeckMentions === 0);
    
    if (isRepairProject) {
      return 'deck-repair';
    }
    return 'deck';
  }
  
  // ==========================================================================
  // PRIORITY 2a9: Fence detection (linear feet projects)
  // ==========================================================================
  const fenceKeywords = ['fence', 'fencing', 'privacy fence', 'wood fence', 'vinyl fence', 'chain link', 'chainlink', 'picket fence', 'split rail', 'fence post', 'fence panel', 'fence gate', 'fence install', 'fence line'];
  const fenceRepairKeywords = ['fence repair', 'repair fence', 'fix fence', 'replace fence post', 'fence post replacement', 'leaning fence', 'damaged fence', 'fence section', 'patch fence'];
  
  const fenceInTitle = firstLine && fenceKeywords.some(kw => firstLine.toLowerCase().includes(kw));
  const fenceMentions = fenceKeywords.filter(kw => text.toLowerCase().includes(kw)).length;
  const fenceRepairMentions = fenceRepairKeywords.filter(kw => text.toLowerCase().includes(kw)).length;
  
  if (fenceInTitle || fenceMentions >= 2) {
    if (fenceRepairMentions >= 1 || (analysis.totalPrice && analysis.totalPrice < 1500)) {
      return 'fence-repair';
    }
    return 'fence';
  }
  
  // ==========================================================================
  // PRIORITY 2a10: Gutter detection (linear feet projects)
  // ==========================================================================
  const gutterKeywords = ['gutter', 'gutters', 'downspout', 'seamless gutter', 'gutter guard', 'gutter install', 'gutter replacement', 'leaf guard', 'gutter screen', 'gutter helmet', 'rain gutter'];
  const gutterRepairKeywords = ['gutter repair', 'fix gutter', 'repair gutter', 'gutter cleaning', 'clean gutter', 'unclog gutter', 'reseal gutter', 'gutter patch'];
  
  const gutterInTitle = firstLine && gutterKeywords.some(kw => firstLine.toLowerCase().includes(kw));
  const gutterMentions = gutterKeywords.filter(kw => text.toLowerCase().includes(kw)).length;
  const gutterRepairMentions = gutterRepairKeywords.filter(kw => text.toLowerCase().includes(kw)).length;
  
  if (gutterInTitle || gutterMentions >= 2) {
    if (gutterRepairMentions >= 1 || (analysis.totalPrice && analysis.totalPrice < 500)) {
      return 'gutter-repair';
    }
    return 'gutter';
  }
  
  // ==========================================================================
  // PRIORITY 2a11: (Railing detection moved to 2a7.5 - before deck)
  // ==========================================================================
  
  // ==========================================================================
  // PRIORITY 2a12: Retaining wall detection (linear feet projects)
  // ==========================================================================
  const retainingWallKeywords = ['retaining wall', 'retain wall', 'block wall', 'segmental wall', 'landscape wall', 'garden wall', 'timber wall', 'boulder wall', 'stone wall', 'keystone wall'];
  const retainingWallInTitle = firstLine && retainingWallKeywords.some(kw => firstLine.toLowerCase().includes(kw));
  const retainingWallMentions = retainingWallKeywords.filter(kw => text.toLowerCase().includes(kw)).length;
  
  if (retainingWallInTitle || retainingWallMentions >= 1) {
    return 'retaining-wall';
  }
  
  // ==========================================================================
  // PRIORITY 2b: Countertop-only detection (BEFORE kitchen detection)
  // Countertop bids often say "LOCATION: KITCHEN" but are NOT full kitchen remodels
  // ==========================================================================
  const countertopKeywords = ['countertop', 'counter top', 'granite', 'quartz', 'marble counters', 'corian', 'silestone', 'cambria', 'viatera', 'caesarstone'];
  const majorKitchenWork = ['cabinet', 'demolition', 'demo kitchen', 'gut kitchen', 'appliance package', 'appliances included', 'new appliances', 'refrigerator', 'dishwasher install', 'range install', 'oven install', 'kitchen remodel', 'kitchen renovation', 'full kitchen'];
  
  const countertopInTitle = firstLine && countertopKeywords.some(kw => firstLine.includes(kw));
  const countertopMentions = countertopKeywords.filter(kw => text.includes(kw)).length;
  const majorKitchenMentions = majorKitchenWork.filter(kw => text.includes(kw)).length;
  
  // Countertop-only: explicit countertop keywords + NO major kitchen work
  if ((countertopInTitle || countertopMentions >= 2) && majorKitchenMentions === 0) {
    return 'countertops';
  }
  
  // Also detect if bid amount is clearly in countertop range (< $15k) with countertop focus
  if (countertopMentions >= 1 && analysis.totalPrice && analysis.totalPrice < 15000 && majorKitchenMentions === 0) {
    return 'countertops';
  }
  
  // ==========================================================================
  // PRIORITY 3: Check existing analysis projectType (from Gemini)
  // ==========================================================================
  if (analysis.projectType) {
    const pt = analysis.projectType.toLowerCase();
    // Check for painting and countertops first (before kitchen which would catch them)
    if (pt.includes('painting') || pt.includes('paint job') || pt.includes('interior paint') || pt.includes('exterior paint')) return 'painting';
    if (pt.includes('countertop') || pt.includes('granite') || pt.includes('quartz')) return 'countertops';
    if (pt.includes('deck') || pt.includes('decking') || pt.includes('pergola')) return 'deck';
    if (pt.includes('kitchen')) return 'kitchen';
    if (pt.includes('bath')) return 'bathroom';
    if (pt.includes('basement')) return 'basement';
    if (pt.includes('window')) return 'windows';
  }
  
  // ==========================================================================
  // PRIORITY 4: Window/basement title detection
  // ==========================================================================
  
  // Window-specific projects - check title/first line
  const windowInTitle = firstLine.includes('window') || 
                        firstLine.includes('replacement window') ||
                        firstLine.includes('new window');
  
  // Window keywords - strong indicators
  const windowKeywords = [
    'window job', 'window replacement', 'window installation', 'new windows',
    'installing window', 'replace window', 'vinyl window', 'wood window',
    'double-hung', 'doublehung', 'casement window', 'awning window',
    'low-e', 'low e', 'argon', 'double pane', 'triple pane',
    'window frame', 'window trim', 'window opening', 'window screen'
  ];
  const windowScore = windowKeywords.filter(kw => text.includes(kw)).length;
  
  // If "window" is prominent in title AND we have window-specific keywords, it's a window project
  if (windowInTitle && windowScore >= 1) {
    return 'windows';
  }
  
  // Strong window indicators: multiple window-specific terms without kitchen/bath context
  if (windowScore >= 3) {
    return 'windows';
  }
  
  // If "basement" appears in the first line/title, check if it's refinishing vs full remodel
  const basementInTitle = firstLine.includes('basement') || 
                          firstLine.includes('lower level') || 
                          firstLine.includes('below grade');
  
  // Basement REFINISHING keywords (updating existing finished basement)
  const basementRefinishingKeywords = [
    'refinishing', 'refinish', 'refresh', 'update basement', 'basement update',
    'repaint basement', 'basement repaint', 'drywall repair', 'ceiling repair',
    'floor replacement', 'new flooring', 'carpet replacement', 'lvp install',
    'basement refresh', 'renovation', 'remodel' // NOT "finish" or "finishing"
  ];
  
  // Basement FULL FINISH keywords (converting unfinished to finished)
  const basementFullFinishKeywords = [
    'finish basement', 'finishing basement', 'unfinished basement', 'convert basement',
    'new egress', 'egress window install', 'add bathroom', 'new bathroom',
    'framing', 'frame walls', 'rough-in', 'from scratch', 'bare concrete',
    'stub out', 'plumbing rough', 'electrical rough'
  ];
  
  const hasRefinishingIndicators = basementRefinishingKeywords.filter(kw => text.includes(kw)).length;
  const hasFullFinishIndicators = basementFullFinishKeywords.filter(kw => text.includes(kw)).length;
  
  // If basement is mentioned but it's refinishing work (not full finish from scratch)
  if (basementInTitle) {
    // Full finish indicators win - this is converting unfinished space
    if (hasFullFinishIndicators >= 2 && hasFullFinishIndicators > hasRefinishingIndicators) {
      return 'basement';
    }
    // Refinishing indicators win - this is updating existing finished basement
    if (hasRefinishingIndicators >= 1 || hasFullFinishIndicators === 0) {
      return 'basement-refinishing';
    }
    return 'basement';
  }
  
  // ==========================================================================
  // PRIORITY 4: Keyword frequency scoring (fallback)
  // ==========================================================================
  const kitchenKeywords = [
    'kitchen', 'cabinet', 'countertop', 'counter top', 'appliance', 
    'backsplash', 'sink', 'faucet', 'dishwasher', 'range', 'oven',
    'refrigerator', 'microwave', 'island', 'pantry'
  ];
  const bathroomKeywords = [
    'bathroom', 'bath', 'shower', 'tub', 'bathtub', 'toilet', 
    'vanity', 'tile', 'lavatory', 'commode', 'water closet',
    'master bath', 'half bath', 'powder room'
  ];
  const basementKeywords = [
    'basement', 'finished basement', 'egress', 'sump pump',
    'below grade', 'lower level', 'rec room', 'recreation room',
    'finish basement', 'finishing basement'
  ];
  
  const kitchenScore = kitchenKeywords.filter(kw => text.includes(kw)).length;
  const bathroomScore = bathroomKeywords.filter(kw => text.includes(kw)).length;
  const basementScore = basementKeywords.filter(kw => text.includes(kw)).length;
  
  const weightedKitchen = kitchenScore * 1.5;
  const weightedBathroom = bathroomScore * 1.5;
  const weightedBasement = basementScore * 2.0;
  const weightedWindows = windowScore * 2.5; // High weight for window-focused projects
  
  // Window projects: if window score is highest and no strong kitchen/bath indicators
  if (windowScore >= 2 && weightedWindows > weightedKitchen && weightedWindows > weightedBathroom) {
    return 'windows';
  }
  
  if (basementScore >= 1 && weightedBasement >= weightedKitchen && weightedBasement >= weightedBathroom) {
    return 'basement';
  }
  
  if (weightedKitchen >= weightedBathroom && kitchenScore >= 2) {
    return 'kitchen';
  }
  if (weightedBathroom >= weightedKitchen && bathroomScore >= 2) {
    return 'bathroom';
  }
  if (basementScore >= 1) {
    return 'basement';
  }
  
  if (kitchenScore > 0) return 'kitchen';
  if (bathroomScore > 0) return 'bathroom';
  
  return 'general';
}

/**
 * Enhanced project type detection that returns full categorization result
 * for use in weighted benchmark calculations
 */
export function detectProjectTypeWithBreakdown(
  analysis: AnalysisResult, 
  rawText: string
): { 
  projectType: BlindBidProjectType; 
  categorization: LineItemCategorizationResult | null;
  isMultiArea: boolean;
} {
  const lineItemResult = categorizeLineItems(rawText);
  const projectType = detectProjectType(analysis, rawText);
  
  // Return categorization if it was useful
  const hasUsefulCategorization = 
    lineItemResult.lineItems.length >= 3 && 
    lineItemResult.totalParsedAmount >= 1000 &&
    lineItemResult.parseConfidence !== 'low';
  
  return {
    projectType,
    categorization: hasUsefulCategorization ? lineItemResult : null,
    isMultiArea: lineItemResult.isMultiArea
  };
}

// =============================================================================
// SCOPE DENSITY SCORING
// =============================================================================

/**
 * Calculates scope density score to determine quality tier
 */
export function calculateScopeDensity(rawText: string): ScopeDensityResult {
  const text = rawText.toLowerCase();
  let score = 0;
  const keywordsFound: string[] = [];
  
  for (const keyword of SCOPE_KEYWORDS.premium) {
    if (text.includes(keyword.toLowerCase())) {
      score += 3;
      keywordsFound.push(keyword);
    }
  }
  
  for (const keyword of SCOPE_KEYWORDS.upscale) {
    if (text.includes(keyword.toLowerCase())) {
      score += 2;
      keywordsFound.push(keyword);
    }
  }
  
  for (const keyword of SCOPE_KEYWORDS.midrange) {
    if (text.includes(keyword.toLowerCase())) {
      score += 1;
      keywordsFound.push(keyword);
    }
  }
  
  let tier: QualityTier;
  let multiplier: number;
  
  if (score >= 13) {
    tier = 'premium';
    multiplier = 1.5;
  } else if (score >= 8) {
    tier = 'upscale';
    multiplier = 1.25;
  } else if (score >= 4) {
    tier = 'midrange';
    multiplier = 1.0;
  } else {
    tier = 'builder';
    multiplier = 0.85;
  }
  
  return { score, tier, multiplier, keywordsFound };
}

// =============================================================================
// STRUCTURAL ADD-ONS
// =============================================================================

/**
 * Detects structural add-ons from bid text
 * @param projectType - Used to exclude add-ons that are part of the primary project
 */
export function calculateStructuralAddOns(rawText: string, projectType?: BlindBidProjectType): StructuralAddOnsResult {
  const items: Array<{ label: string; cost: number }> = [];
  let total = 0;
  const addedLabels = new Set<string>();
  
  // Add-ons to skip when they ARE the primary project type
  // For window projects, skip most add-ons since window quotes are self-contained
  const skipForWindowProjects = [
    'Window work', 
    'Door installation',
    'Addition/expansion',  // "addition" often appears in window bids as "additional"
    'Debris removal',       // Always included in window installation quotes
    'Non-bearing wall removal',  // Not applicable to window replacement
    'Permits'               // Typically included in window quote
  ];
  
  // For fireplace projects, skip most add-ons since it's a contained specialty project
  const skipForFireplaceProjects = [
    'Addition/expansion',
    'Debris removal',       // Included in fireplace work
    'Door installation',    // Not related to fireplace
    'Window work',          // Not related to fireplace
    'Non-bearing wall removal',
    'Permits'
  ];
  
  // For deck repair/staining, skip all structural add-ons - it's maintenance work
  const skipForDeckRepairProjects = [
    'Addition/expansion',
    'Debris removal',
    'Door installation',
    'Window work',
    'Non-bearing wall removal',
    'Permits',
    'Load-bearing modification'
  ];
  
  // For roofing projects, skip add-ons that are typically included or false positives
  // "Ventilation" in roofing = ridge vents, not HVAC
  // "Debris removal" = removing old shingles, always included
  const skipForRoofingProjects = [
    'Addition/expansion',    // "additional" in bids triggers false positive
    'HVAC modification',     // roofing ventilation != HVAC work
    'Debris removal',        // always included in roofing quotes
    'Permits',               // typically included in roofing quotes
    'Door installation',     // not related to roofing
    'Window work',           // skylight work should be separate detection
    'Non-bearing wall removal'
  ];
  
  // Helper to check if project type is a roofing variant
  const isRoofingProject = projectType && (
    projectType === 'roofing' ||
    projectType === 'roofing-repair' ||
    projectType === 'roofing-storm' ||
    projectType === 'roofing-hail' ||
    projectType === 'roofing-fire' ||
    projectType === 'roofing-insurance'
  );
  
  for (const addon of STRUCTURAL_ADDONS) {
    // Skip add-ons that are part of the primary project
    if (projectType === 'windows' && skipForWindowProjects.includes(addon.label)) {
      continue;
    }
    
    if (projectType === 'fireplace' && skipForFireplaceProjects.includes(addon.label)) {
      continue;
    }
    
    if (projectType === 'deck-repair' && skipForDeckRepairProjects.includes(addon.label)) {
      continue;
    }
    
    if (isRoofingProject && skipForRoofingProjects.includes(addon.label)) {
      continue;
    }
    
    if (addon.pattern.test(rawText) && !addedLabels.has(addon.label)) {
      items.push({ label: addon.label, cost: addon.cost });
      total += addon.cost;
      addedLabels.add(addon.label);
    }
  }
  
  return { total, items };
}

// =============================================================================
// MAIN CALCULATION (ZONDA-ENHANCED)
// =============================================================================

/**
 * Helper to extract window count from unit detection results
 */
function getWindowCountFromAnalysis(analysis: AnalysisResult): number {
  if (!analysis.unitDetection?.items) return 0;
  return analysis.unitDetection.items
    .filter(item => item.type === 'window')
    .reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Adjusts quality tier based on actual bid amount
 * 
 * Problem: Scope keywords can falsely inflate tier detection.
 * For example, "wall removal" adds to scope density score → "upscale" tier,
 * but a $37k kitchen is NOT an upscale project ($164k+).
 * 
 * Solution: Use bid amount as a sanity check to constrain tier selection.
 * 
 * Zonda 2025 national benchmarks:
 * - Kitchen minor: $28,458 → builder/budget
 * - Kitchen major midrange: $82,793 → midrange
 * - Kitchen major upscale: $164,104 → upscale/premium
 * - Bathroom midrange: $27,904 → midrange  
 * - Bathroom upscale: $85,561 → upscale/premium
 * - Basement: ~$52k-$90k depending on region
 */
function adjustTierByBidAmount(
  projectType: BlindBidProjectType,
  bidAmount: number,
  keywordTier: QualityTier
): QualityTier {
  // Define bid amount thresholds for each project type
  // These are calibrated to Zonda 2025 national benchmarks
  const thresholds: Record<string, { minor: number; midrange: number; upscale: number }> = {
    kitchen: {
      minor: 45000,      // Below $45k → kitchen-minor (builder)
      midrange: 110000,  // $45k-$110k → kitchen-major-midrange
      upscale: 200000    // Above $110k → kitchen-major-upscale
    },
    bathroom: {
      minor: 20000,      // Below $20k → basic/builder
      midrange: 50000,   // $20k-$50k → midrange
      upscale: 100000    // Above $50k → upscale
    },
    basement: {
      minor: 35000,      // Below $35k → builder
      midrange: 70000,   // $35k-$70k → midrange
      upscale: 120000    // Above $70k → upscale/premium
    },
    windows: {
      minor: 8000,       // Below $8k → vinyl budget
      midrange: 20000,   // $8k-$20k → vinyl midrange
      upscale: 40000     // Above $20k → wood/premium
    },
    // Cabinet projects - Houzz 2024 benchmarks
    'cabinet-refinishing': {
      minor: 2500,       // Below $2.5k → basic (10-15 cabinets)
      midrange: 5000,    // $2.5k-$5k → standard (15-25 cabinets)
      upscale: 8000      // Above $5k → large kitchen (25+ cabinets)
    },
    'cabinet-refacing': {
      minor: 6000,       // Below $6k → basic builder-grade
      midrange: 10000,   // $6k-$10k → standard quality
      upscale: 15000     // Above $10k → premium/wood
    },
    'cabinet-replacement': {
      minor: 15000,      // Below $15k → builder/RTA cabinets
      midrange: 40000,   // $15k-$40k → semi-custom
      upscale: 75000     // Above $40k → custom/luxury
    },
    'cabinet-new-line': {
      minor: 2000,       // Below $2k → small addition (pantry)
      midrange: 4500,    // $2k-$4.5k → medium (mudroom/laundry)
      upscale: 7200      // Above $4.5k → large (butler's pantry)
    },
    general: {
      minor: 30000,
      midrange: 80000,
      upscale: 150000
    }
  };
  
  const typeThresholds = thresholds[projectType] || thresholds.general;
  
  // Determine appropriate tier based on bid amount
  let bidBasedTier: QualityTier;
  if (bidAmount < typeThresholds.minor) {
    bidBasedTier = 'builder';
  } else if (bidAmount < typeThresholds.midrange) {
    bidBasedTier = 'midrange';
  } else if (bidAmount < typeThresholds.upscale) {
    bidBasedTier = 'upscale';
  } else {
    bidBasedTier = 'premium';
  }
  
  // RULE: Use the LOWER of the two tiers
  // This prevents scope keywords from inflating tier beyond what the bid amount supports
  // A $37k bid with "premium granite" keywords should still use midrange benchmark
  const tierOrder: QualityTier[] = ['builder', 'midrange', 'upscale', 'premium'];
  const keywordIndex = tierOrder.indexOf(keywordTier);
  const bidIndex = tierOrder.indexOf(bidBasedTier);
  
  return tierOrder[Math.min(keywordIndex, bidIndex)];
}

/**
 * Main function to calculate blind bid estimate using Zonda 2025 data
 */
export function calculateBlindBidEstimate(
  analysis: AnalysisResult,
  rawText: string,
  city: string,
  state?: string,
  submittedBid?: number,
  zip?: string
): BlindBidAnalysis {
  
  // 1. Detect project type
  const projectType = detectProjectType(analysis, rawText);
  
  // 1b. Extract window count from unit detection
  const windowCount = getWindowCountFromAnalysis(analysis);
  
  // 2. Calculate scope density to determine quality tier
  const scopeDensity = calculateScopeDensity(rawText);
  
  // 2b. CRITICAL FIX: Adjust tier based on bid amount
  // Scope keywords can falsely inflate tier detection (e.g., "wall removal" → upscale)
  // But a $37k kitchen bid is NOT upscale ($164k+), so use bid amount to constrain tier
  let adjustedTier = scopeDensity.tier;
  if (submittedBid && submittedBid > 0) {
    adjustedTier = adjustTierByBidAmount(projectType, submittedBid, scopeDensity.tier);
    if (adjustedTier !== scopeDensity.tier) {
      console.log('[BlindBid] Tier adjusted by bid amount:', {
        original: scopeDensity.tier,
        adjusted: adjustedTier,
        bidAmount: submittedBid,
        projectType
      });
    }
  }
  
  // 3. Calculate structural add-ons (pass projectType to exclude primary project add-ons)
  const structural = calculateStructuralAddOns(rawText, projectType);
  
  // 4. Get Zonda multiplier (project-type specific!) - use ADJUSTED tier
  const zondaMultiplier = getZondaMultiplier(city, state, zip, projectType, adjustedTier);
  
  // 5. Get Zonda benchmark cost OR fall back to Homewyse - use ADJUSTED tier
  const zondaBenchmark = getZondaBenchmarkCost(projectType, adjustedTier);
  
  let baseBenchmark: { low: number; high: number; laborHours: number };
  let materialsPercent = 50;
  let laborPercent = 50;
  let useZondaBenchmark = false;
  
  // Try smart pricing first for labor/materials split
  const smartLaborRatio = getExpectedLaborRatio(projectType);
  if (smartLaborRatio) {
    laborPercent = Math.round(((smartLaborRatio.min + smartLaborRatio.max) / 2) * 100);
    materialsPercent = 100 - laborPercent;
  }
  
  // Linear foot projects use their own benchmarks, not Zonda
  const linearFootProjects = ['fence', 'fence-repair', 'gutter', 'gutter-repair', 'railing', 'retaining-wall'];
  const isLinearFootProject = linearFootProjects.includes(projectType);
  
  if (zondaBenchmark && !isLinearFootProject) {
    // Use Zonda benchmark as primary source
    useZondaBenchmark = true;
    
    // Special handling for window projects: Zonda data is for 10 windows
    // Scale to actual window count from analysis
    if (projectType === 'windows' && windowCount > 0) {
      const zondaWindowCount = 10; // Zonda standard job size
      const perWindowLow = zondaBenchmark.low / zondaWindowCount;
      const perWindowHigh = zondaBenchmark.high / zondaWindowCount;
      
      baseBenchmark = {
        low: perWindowLow * windowCount,
        high: perWindowHigh * windowCount,
        laborHours: windowCount * 4 // ~4 hours per window typical
      };
    } else {
      baseBenchmark = {
        low: zondaBenchmark.low,
        high: zondaBenchmark.high,
        laborHours: projectType === 'bathroom' ? 75 : projectType === 'kitchen' ? 100 : 80
      };
    }
    
    // Get labor/materials split from Homewyse baseline
    const baselineKey = projectType === 'general' ? 'kitchen' : projectType;
    const baseline = LABOR_MATERIALS_BASELINE[baselineKey as keyof typeof LABOR_MATERIALS_BASELINE] || LABOR_MATERIALS_BASELINE.general;
    materialsPercent = Math.round((baseline.materialsMin + baseline.materialsMax) / 2 * 100);
    laborPercent = 100 - materialsPercent;
  } else {
    // Fall back to Homewyse benchmarks
    if (projectType === 'kitchen') {
      const kitchenTier = scopeDensity.tier === 'premium' || scopeDensity.tier === 'upscale' 
        ? 'modern' 
        : scopeDensity.tier === 'builder' 
          ? 'basic' 
          : 'mid';
      const bench = HOMEWYSE_BENCHMARKS.kitchen[kitchenTier];
      baseBenchmark = { low: bench.low, high: bench.high, laborHours: bench.laborHours };
      const baseline = LABOR_MATERIALS_BASELINE.kitchen;
      materialsPercent = Math.round((baseline.materialsMin + baseline.materialsMax) / 2 * 100);
      laborPercent = 100 - materialsPercent;
    } else if (projectType === 'bathroom') {
      const bathTier = scopeDensity.tier === 'premium' ? 'master' : 'typical';
      const bench = HOMEWYSE_BENCHMARKS.bathroom[bathTier];
      baseBenchmark = { low: bench.low, high: bench.high, laborHours: bench.laborHours };
      const baseline = LABOR_MATERIALS_BASELINE.bathroom;
      materialsPercent = Math.round((baseline.materialsMin + baseline.materialsMax) / 2 * 100);
      laborPercent = 100 - materialsPercent;
    } else if (projectType === 'basement') {
      const estimatedSqft = 600;
      const bench = HOMEWYSE_BENCHMARKS.basement.dryPerSqft;
      baseBenchmark = { 
        low: bench.low * estimatedSqft, 
        high: bench.high * estimatedSqft, 
        laborHours: estimatedSqft * 0.15
      };
      const baseline = LABOR_MATERIALS_BASELINE.basement;
      materialsPercent = Math.round((baseline.materialsMin + baseline.materialsMax) / 2 * 100);
      laborPercent = 100 - materialsPercent;
    } else if (projectType === 'windows') {
      // Fallback window pricing: $750-$1,500 per window typical (vinyl midrange)
      const fallbackWindowCount = windowCount > 0 ? windowCount : 5;
      baseBenchmark = { 
        low: 750 * fallbackWindowCount, 
        high: 1500 * fallbackWindowCount, 
        laborHours: fallbackWindowCount * 4
      };
      materialsPercent = 60; // Windows are materials-heavy
      laborPercent = 40;
    } else if (projectType === 'countertops') {
      // Countertop pricing using Houzz data: $1,700 - $5,500 typical range
      // Granite: $1,700 - $2,500
      // Quartz: $4,500 - $5,500
      // Detect material type from text for better accuracy
      const isQuartz = rawText.toLowerCase().includes('quartz') || 
                       rawText.toLowerCase().includes('viatera') ||
                       rawText.toLowerCase().includes('silestone') ||
                       rawText.toLowerCase().includes('cambria') ||
                       rawText.toLowerCase().includes('caesarstone');
      const isGranite = rawText.toLowerCase().includes('granite');
      
      if (isQuartz) {
        baseBenchmark = { low: 4500, high: 5500, laborHours: 16 };
      } else if (isGranite) {
        baseBenchmark = { low: 1700, high: 2500, laborHours: 16 };
      } else {
        // Generic countertop range
        baseBenchmark = { low: 1700, high: 5500, laborHours: 16 };
      }
      materialsPercent = 70; // Countertops are materials-heavy
      laborPercent = 30;
    } else if (projectType === 'painting') {
      // Interior painting: Houzz average $3,500 - $6,000 for whole house
      // Exterior painting: $3,000 - $6,000
      // Cabinet refinishing: $3,000 - $6,000
      // Combined interior + exterior: $6,000 - $12,000
      const hasExterior = rawText.toLowerCase().includes('exterior');
      const hasInterior = rawText.toLowerCase().includes('interior');
      const hasCabinetRefinish = rawText.toLowerCase().includes('cabinet') && 
                                  (rawText.toLowerCase().includes('refinish') || 
                                   rawText.toLowerCase().includes('paint') ||
                                   rawText.toLowerCase().includes('coat'));
      
      let paintLow = 3500;
      let paintHigh = 6000;
      
      // Combined interior + exterior
      if (hasExterior && hasInterior) {
        paintLow = 6000;
        paintHigh = 12000;
      } else if (hasExterior) {
        // Exterior only
        paintLow = 3000;
        paintHigh = 6000;
      }
      
      // Add cabinet refinishing cost if present
      if (hasCabinetRefinish) {
        paintLow += 3000;
        paintHigh += 5000;
      }
      
      baseBenchmark = { low: paintLow, high: paintHigh, laborHours: 40 };
      materialsPercent = 25; // Painting is labor-heavy
      laborPercent = 75;
    } else if (projectType === 'fireplace') {
      // Fireplace surround/remodel pricing based on Houzz data:
      // Basic tile surround: $1,500 - $3,000
      // Stone veneer surround: $2,500 - $5,000
      // Full stone/masonry surround: $4,000 - $8,000
      // Mantel installation: $500 - $1,500
      const hasStone = rawText.toLowerCase().includes('stone') || 
                       rawText.toLowerCase().includes('rock') ||
                       rawText.toLowerCase().includes('masonry');
      const hasMantel = rawText.toLowerCase().includes('mantel') || 
                        rawText.toLowerCase().includes('mantle');
      
      let fpLow = 1500;
      let fpHigh = 3000;
      
      // Stone/masonry work costs more
      if (hasStone) {
        fpLow = 2500;
        fpHigh = 6000;
      }
      
      // Add mantel cost if mentioned
      if (hasMantel) {
        fpLow += 500;
        fpHigh += 1500;
      }
      
      baseBenchmark = { low: fpLow, high: fpHigh, laborHours: 24 };
      materialsPercent = 55; // Stone/tile materials + labor
      laborPercent = 45;
    } else if (projectType === 'deck-repair') {
      // Deck repair/staining/restoration pricing based on Houzz data:
      // Power washing only: $150 - $400
      // Deck staining (labor + materials): $500 - $1,500 for typical deck
      // Board replacement (partial): $500 - $2,000
      // Houzz 2024 / HomeGuide deck repair & staining benchmarks:
      // Basic staining/sealing (300-500 sf): $1,500 - $3,500
      // Power washing: $200 - $600
      // Board repairs (depends on extent): $1,000 - $4,000
      // Rail/post repair: $500 - $2,000
      // Full deck restoration (stain + repairs): $3,000 - $8,000
      // Large deck or pergola included: $5,000 - $12,000
      const hasStaining = rawText.toLowerCase().includes('stain') || 
                          rawText.toLowerCase().includes('seal');
      void hasStaining; // Used for future scope calculation
      const hasPowerWash = rawText.toLowerCase().includes('power wash') || 
                           rawText.toLowerCase().includes('powerwash') ||
                           rawText.toLowerCase().includes('pressure wash');
      const hasRepairs = rawText.toLowerCase().includes('repair') || 
                         rawText.toLowerCase().includes('replace') ||
                         rawText.toLowerCase().includes('fix') ||
                         rawText.toLowerCase().includes('board');
      const hasPergola = rawText.toLowerCase().includes('pergola');
      const hasRails = rawText.toLowerCase().includes('rail') || 
                       rawText.toLowerCase().includes('post');
      
      // Base staining/sealing cost (typical 300-500 sf deck)
      let deckLow = 1500;
      let deckHigh = 3500;
      
      // Power wash adds cost
      if (hasPowerWash) {
        deckLow += 200;
        deckHigh += 600;
      }
      
      // Board/structural repairs add significant cost (scope varies widely)
      if (hasRepairs) {
        deckLow += 1000;
        deckHigh += 4000;
      }
      
      // Rail/post work
      if (hasRails) {
        deckLow += 500;
        deckHigh += 2000;
      }
      
      // Pergola work adds significant cost
      if (hasPergola) {
        deckLow += 2000;
        deckHigh += 5000;
      }
      
      baseBenchmark = { low: deckLow, high: deckHigh, laborHours: 16 };
      materialsPercent = 35; // Staining is labor-heavy
      laborPercent = 65;
    } else if (projectType === 'basement-refinishing') {
      // Basement REFINISHING pricing - updating existing finished basement
      // NOT converting unfinished to finished (that's basement-remodel)
      // Houzz 2024 data for basement refresh/update:
      // Drywall repair/repaint: $3,000 - $8,000
      // New flooring (carpet/LVP): $5,000 - $15,000
      // Ceiling update: $2,000 - $6,000
      // Trim/baseboards: $1,000 - $3,000
      // Lighting updates: $500 - $2,000
      // Typical 1,000-1,500 SF basement refinish: $15,000 - $40,000
      const hasDrywall = rawText.toLowerCase().includes('drywall');
      const hasFlooring = rawText.toLowerCase().includes('floor') || 
                          rawText.toLowerCase().includes('carpet') ||
                          rawText.toLowerCase().includes('lvp') ||
                          rawText.toLowerCase().includes('laminate');
      const hasPainting = rawText.toLowerCase().includes('paint');
      const hasCeiling = rawText.toLowerCase().includes('ceiling');
      const hasLighting = rawText.toLowerCase().includes('light') || 
                          rawText.toLowerCase().includes('recessed');
      
      // Start with baseline for basic refresh
      let basementLow = 12000;
      let basementHigh = 28000;
      
      // Adjust based on scope
      const scopeItems = [hasDrywall, hasFlooring, hasPainting, hasCeiling, hasLighting].filter(Boolean).length;
      
      if (scopeItems >= 4) {
        // Comprehensive refinish
        basementLow = 25000;
        basementHigh = 50000;
      } else if (scopeItems >= 2) {
        // Medium scope refinish
        basementLow = 15000;
        basementHigh = 35000;
      }
      
      baseBenchmark = { low: basementLow, high: basementHigh, laborHours: 100 };
      materialsPercent = 45; // Materials (flooring, drywall, paint) + labor
      laborPercent = 55;
    } else if (projectType === 'garage-door') {
      // ==========================================================================
      // GARAGE DOOR - Houzz 2024 benchmarks
      // Single door: $800 - $2,500 (standard steel)
      // Double door: $1,200 - $4,000
      // Premium/carriage style: $2,000 - $5,500
      // Opener only: $350 - $800
      // Combined door + opener: typical $1,200 - $5,500
      // ==========================================================================
      const hasOpener = rawText.toLowerCase().includes('opener') || 
                        rawText.toLowerCase().includes('liftmaster') ||
                        rawText.toLowerCase().includes('chamberlain');
      const isPremium = rawText.toLowerCase().includes('carriage') || 
                        rawText.toLowerCase().includes('wood') ||
                        rawText.toLowerCase().includes('custom');
      const isDoubleWide = rawText.toLowerCase().includes('double') || 
                           rawText.toLowerCase().includes('2-car') ||
                           rawText.toLowerCase().includes('two car');
      const isOpenerOnly = rawText.toLowerCase().includes('opener only') ||
                           (hasOpener && !rawText.toLowerCase().includes('door'));
      
      let gdLow = 800;
      let gdHigh = 2500;
      
      if (isOpenerOnly) {
        gdLow = 350;
        gdHigh = 800;
      } else if (isPremium) {
        gdLow = 2000;
        gdHigh = 5500;
      } else if (isDoubleWide) {
        gdLow = 1200;
        gdHigh = 4000;
      }
      
      // Add opener cost if mentioned with door
      if (hasOpener && !isOpenerOnly) {
        gdLow += 350;
        gdHigh += 600;
      }
      
      baseBenchmark = { low: gdLow, high: gdHigh, laborHours: 6 };
      materialsPercent = 70; // Garage doors are materials-heavy
      laborPercent = 30;
    } else if (projectType === 'cabinet-refinishing') {
      // ==========================================================================
      // CABINET REFINISHING - Houzz 2024 benchmarks
      // Small kitchen (10-15 cabinets): $1,200 - $3,000
      // Medium kitchen (15-25 cabinets): $3,000 - $6,000
      // Large kitchen (25+ cabinets): $5,000 - $8,000
      // Includes: sand, prime, paint, cure
      // ==========================================================================
      const isLarge = rawText.toLowerCase().includes('large kitchen') || 
                      rawText.toLowerCase().includes('many cabinets') ||
                      rawText.toLowerCase().includes('extensive');
      
      let crLow = 1200;
      let crHigh = 6000;
      
      if (isLarge) {
        crLow = 5000;
        crHigh = 8000;
      }
      
      baseBenchmark = { low: crLow, high: crHigh, laborHours: 40 };
      materialsPercent = 25; // Labor-heavy (painting skill)
      laborPercent = 75;
    } else if (projectType === 'cabinet-refacing') {
      // ==========================================================================
      // CABINET REFACING - Houzz 2024 benchmarks
      // Standard laminate: $3,500 - $8,000
      // Wood veneer: $6,000 - $12,000
      // Premium thermofoil: $8,000 - $15,000
      // Includes: new doors/drawer fronts, veneer on boxes
      // ==========================================================================
      const isPremium = rawText.toLowerCase().includes('wood') || 
                        rawText.toLowerCase().includes('premium');
      
      let cfLow = 3500;
      let cfHigh = 10000;
      
      if (isPremium) {
        cfLow = 6000;
        cfHigh = 15000;
      }
      
      baseBenchmark = { low: cfLow, high: cfHigh, laborHours: 60 };
      materialsPercent = 60; // New doors + veneer
      laborPercent = 40;
    } else if (projectType === 'cabinet-replacement') {
      // ==========================================================================
      // CABINET REPLACEMENT - Houzz 2024 benchmarks
      // Stock/RTA (10-15 LF): $4,500 - $15,000
      // Semi-custom: $15,000 - $35,000
      // Custom/luxury: $30,000 - $75,000
      // ==========================================================================
      const isCustom = rawText.toLowerCase().includes('custom') || 
                       rawText.toLowerCase().includes('luxury');
      const isSemiCustom = rawText.toLowerCase().includes('semi-custom') || 
                           rawText.toLowerCase().includes('kraftmaid') ||
                           rawText.toLowerCase().includes('merillat');
      
      let caLow = 4500;
      let caHigh = 15000;
      
      if (isCustom) {
        caLow = 30000;
        caHigh = 75000;
      } else if (isSemiCustom) {
        caLow = 15000;
        caHigh = 35000;
      }
      
      baseBenchmark = { low: caLow, high: caHigh, laborHours: 50 };
      materialsPercent = 75; // Cabinets are materials-heavy
      laborPercent = 25;
    } else if (projectType === 'cabinet-new-line') {
      // ==========================================================================
      // CABINET NEW LINE (adding cabinets to new area) - Houzz 2024 benchmarks
      // Mudroom/laundry: $600 - $2,500
      // Pantry extension: $1,500 - $4,500
      // Butler's pantry: $3,000 - $7,200
      // ==========================================================================
      const isButler = rawText.toLowerCase().includes('butler');
      const isPantry = rawText.toLowerCase().includes('pantry');
      
      let cnLow = 600;
      let cnHigh = 2500;
      
      if (isButler) {
        cnLow = 3000;
        cnHigh = 7200;
      } else if (isPantry) {
        cnLow = 1500;
        cnHigh = 4500;
      }
      
      baseBenchmark = { low: cnLow, high: cnHigh, laborHours: 20 };
      materialsPercent = 70;
      laborPercent = 30;
    } else if (projectType === 'roofing-repair') {
      // ==========================================================================
      // ROOFING REPAIR - Houzz 2024 benchmarks
      // Minor (few shingles): $300 - $1,000
      // Moderate (section repair): $1,000 - $3,500
      // Major (large area): $3,000 - $10,000
      // Flashing repair: $500 - $1,500
      // ==========================================================================
      const isMinor = rawText.toLowerCase().includes('few shingles') || 
                      rawText.toLowerCase().includes('small leak') ||
                      rawText.toLowerCase().includes('minor');
      const isMajor = rawText.toLowerCase().includes('large') || 
                      rawText.toLowerCase().includes('major') ||
                      rawText.toLowerCase().includes('section');
      const hasFlashing = rawText.toLowerCase().includes('flashing');
      
      let rrLow = 1000;
      let rrHigh = 3500;
      
      if (isMinor) {
        rrLow = 300;
        rrHigh = 1000;
      } else if (isMajor) {
        rrLow = 3000;
        rrHigh = 10000;
      }
      
      if (hasFlashing) {
        rrLow += 500;
        rrHigh += 1500;
      }
      
      baseBenchmark = { low: rrLow, high: rrHigh, laborHours: 8 };
      materialsPercent = 40;
      laborPercent = 60;
    } else if (projectType === 'roofing-storm') {
      // ==========================================================================
      // ROOFING STORM DAMAGE - Houzz 2024 benchmarks
      // Emergency tarp/temp: $300 - $1,000
      // Partial repair: $1,500 - $5,000
      // Extensive damage: $5,000 - $15,000
      // ==========================================================================
      const hasEmergency = rawText.toLowerCase().includes('emergency') || 
                           rawText.toLowerCase().includes('tarp');
      const isExtensive = rawText.toLowerCase().includes('extensive') || 
                          rawText.toLowerCase().includes('major');
      
      let rsLow = 1500;
      let rsHigh = 5000;
      
      if (hasEmergency && !isExtensive) {
        rsLow = 300;
        rsHigh = 1500;
      } else if (isExtensive) {
        rsLow = 5000;
        rsHigh = 15000;
      }
      
      baseBenchmark = { low: rsLow, high: rsHigh, laborHours: 16 };
      materialsPercent = 45;
      laborPercent = 55;
    } else if (projectType === 'roofing-hail') {
      // ==========================================================================
      // ROOFING HAIL DAMAGE - Houzz 2024 benchmarks
      // Typically full replacement after hail claim
      // Partial (less damage): $2,000 - $8,000
      // Full replacement: $8,000 - $25,000
      // Often covered by insurance
      // ==========================================================================
      const isPartial = rawText.toLowerCase().includes('partial') || 
                        rawText.toLowerCase().includes('spot') ||
                        rawText.toLowerCase().includes('section');
      
      let rhLow = 8000;
      let rhHigh = 25000;
      
      if (isPartial) {
        rhLow = 2000;
        rhHigh = 8000;
      }
      
      baseBenchmark = { low: rhLow, high: rhHigh, laborHours: 40 };
      materialsPercent = 50;
      laborPercent = 50;
    } else if (projectType === 'roofing-fire') {
      // ==========================================================================
      // ROOFING FIRE DAMAGE - Houzz 2024 benchmarks
      // Includes structural assessment, potential deck replacement
      // Minor smoke: $3,000 - $10,000
      // Significant burn: $10,000 - $40,000
      // Often with structural work
      // ==========================================================================
      const isMinor = rawText.toLowerCase().includes('smoke') && 
                      !rawText.toLowerCase().includes('burn');
      
      let rfLow = 10000;
      let rfHigh = 40000;
      
      if (isMinor) {
        rfLow = 3000;
        rfHigh = 10000;
      }
      
      baseBenchmark = { low: rfLow, high: rfHigh, laborHours: 60 };
      materialsPercent = 55;
      laborPercent = 45;
    } else if (projectType === 'roofing-insurance') {
      // ==========================================================================
      // ROOFING INSURANCE CLAIM - Special handling
      // Uses Xactimate pricing standards aligned with Zonda replacement costs
      // Typical components: Base repair/replacement + O&P (20%) + Deductible handling
      // ==========================================================================
      const textLower = rawText.toLowerCase();
      
      // Detect scope: partial repair vs full replacement
      const isFullReplacement = textLower.includes('full roof') || 
                                textLower.includes('total replacement') ||
                                textLower.includes('complete replacement') ||
                                textLower.includes('tear off') ||
                                textLower.includes('strip and replace');
      
      // Detect material type for more accurate estimates
      const isMetal = textLower.includes('metal') || textLower.includes('standing seam');
      
      // Detect if O&P (Overhead & Profit) is included
      const hasOP = textLower.includes('o&p') || 
                    textLower.includes('overhead') ||
                    textLower.includes('profit');
      
      // Detect if deductible is mentioned
      const deductibleMatch = textLower.match(/deductible[:\s]*\$?([\d,]+)/);
      const hasDeductible = !!deductibleMatch;
      
      let insuranceLow: number;
      let insuranceHigh: number;
      
      if (isFullReplacement) {
        // Full replacement - use Zonda 2025 benchmarks
        // Zonda asphalt: $26.5k - $33k national
        // Zonda metal: $38k - $58k national
        if (isMetal) {
          insuranceLow = 38000;
          insuranceHigh = 55000;
        } else {
          insuranceLow = 26500;
          insuranceHigh = 35000;
        }
      } else {
        // Partial repair/damage claim - typical Xactimate ranges
        // Storm damage: $5k - $15k typical
        // Section repair: $2k - $8k typical
        insuranceLow = 3000;
        insuranceHigh = 15000;
      }
      
      // Add O&P if not already included (insurance typically pays 20% O&P)
      if (hasOP) {
        // O&P likely already in bid - don't inflate
      } else {
        // O&P not mentioned - contractor may bill separately
        insuranceHigh *= 1.1; // Conservative 10% buffer
      }
      
      baseBenchmark = { 
        low: insuranceLow, 
        high: insuranceHigh, 
        laborHours: isFullReplacement ? 60 : 24 
      };
      materialsPercent = isFullReplacement ? 55 : 45;
      laborPercent = isFullReplacement ? 45 : 55;
      
      // Log insurance-specific notes
      console.log('[BlindBid] Insurance claim detected:', {
        isFullReplacement,
        isMetal,
        hasOP,
        hasDeductible,
        range: `$${insuranceLow.toLocaleString()} - $${insuranceHigh.toLocaleString()}`
      });
    } else if (projectType === 'door-interior') {
      // ==========================================================================
      // INTERIOR DOORS - Houzz 2024 benchmarks
      // Hollow core: $150 - $300/door installed
      // Solid core: $250 - $500/door installed
      // Pocket door: $400 - $800 installed
      // Barn door: $500 - $1,200 installed
      // ==========================================================================
      // Estimate door count from text (default 3)
      const doorCountMatch = rawText.match(/(\d+)\s*door/i);
      const estimatedDoors = doorCountMatch ? parseInt(doorCountMatch[1]) : 3;
      
      const isPocket = rawText.toLowerCase().includes('pocket');
      const isBarn = rawText.toLowerCase().includes('barn');
      const isSolid = rawText.toLowerCase().includes('solid');
      
      let perDoorLow = 150;
      let perDoorHigh = 300;
      
      if (isBarn) {
        perDoorLow = 500;
        perDoorHigh = 1200;
      } else if (isPocket) {
        perDoorLow = 400;
        perDoorHigh = 800;
      } else if (isSolid) {
        perDoorLow = 250;
        perDoorHigh = 500;
      }
      
      baseBenchmark = { 
        low: perDoorLow * estimatedDoors, 
        high: perDoorHigh * estimatedDoors, 
        laborHours: estimatedDoors * 2 
      };
      materialsPercent = 60;
      laborPercent = 40;
    } else if (projectType === 'door-patio') {
      // ==========================================================================
      // PATIO/SLIDING DOORS - Houzz 2024 benchmarks
      // Standard sliding: $1,200 - $3,500
      // Premium multi-slide: $3,500 - $8,000
      // ==========================================================================
      const isPremium = rawText.toLowerCase().includes('premium') || 
                        rawText.toLowerCase().includes('multi-slide') ||
                        rawText.toLowerCase().includes('andersen') ||
                        rawText.toLowerCase().includes('pella');
      
      let pdLow = 1200;
      let pdHigh = 3500;
      
      if (isPremium) {
        pdLow = 3500;
        pdHigh = 8000;
      }
      
      baseBenchmark = { low: pdLow, high: pdHigh, laborHours: 8 };
      materialsPercent = 70;
      laborPercent = 30;
    } else if (projectType === 'door-french') {
      // ==========================================================================
      // FRENCH DOORS - Houzz 2024 benchmarks
      // Standard: $1,800 - $4,000
      // Premium/custom: $4,000 - $10,000
      // ==========================================================================
      const isPremium = rawText.toLowerCase().includes('custom') || 
                        rawText.toLowerCase().includes('premium') ||
                        rawText.toLowerCase().includes('wood');
      
      let fdLow = 1800;
      let fdHigh = 4000;
      
      if (isPremium) {
        fdLow = 4000;
        fdHigh = 10000;
      }
      
      baseBenchmark = { low: fdLow, high: fdHigh, laborHours: 10 };
      materialsPercent = 70;
      laborPercent = 30;
    } else if (projectType === 'fence' || projectType === 'fence-repair') {
      // ==========================================================================
      // FENCE - Linear foot pricing from benchmarkData.ts
      // Wood: $25-65/LF, Vinyl: $30-80/LF, Chain link: $15-40/LF
      // Aluminum: $40-100/LF, Wrought iron: $80-180/LF
      // ==========================================================================
      const materialType = detectLinearFootMaterial(projectType, rawText);
      const fenceBenchmarks = LINEAR_FOOT_BENCHMARKS.fence;
      const benchmark = fenceBenchmarks[materialType] || fenceBenchmarks.general;
      
      // Extract linear feet from analysis or estimate from bid
      // Common fence projects: 100-200 LF typical residential
      const linearFeetMatch = rawText.match(/(\d+)\s*(?:linear\s*f(?:ee)?t|l\.?f\.?|feet|ft)/i);
      const estimatedLF = linearFeetMatch ? parseInt(linearFeetMatch[1]) : 
                          (submittedBid && submittedBid > 0 ? Math.round(submittedBid / benchmark.median) : 150);
      
      // Repair projects are typically 30-50% of full fence cost per LF
      const isRepair = projectType === 'fence-repair';
      const repairMultiplier = isRepair ? 0.4 : 1.0;
      
      baseBenchmark = {
        low: Math.round(benchmark.low * estimatedLF * repairMultiplier),
        high: Math.round(benchmark.high * estimatedLF * repairMultiplier),
        laborHours: Math.round(benchmark.laborHoursPerLF * estimatedLF * repairMultiplier)
      };
      materialsPercent = Math.round(benchmark.materialPercent * 100);
      laborPercent = 100 - materialsPercent;
      
      console.log('[BlindBid] Fence project:', {
        materialType,
        estimatedLF,
        isRepair,
        pricePerLF: `$${benchmark.low}-$${benchmark.high}/LF`,
        totalRange: `$${baseBenchmark.low.toLocaleString()}-$${baseBenchmark.high.toLocaleString()}`
      });
    } else if (projectType === 'gutter' || projectType === 'gutter-repair') {
      // ==========================================================================
      // GUTTER - Linear foot pricing from benchmarkData.ts
      // Aluminum: $8-18/LF, Vinyl: $5-12/LF, Seamless: $10-22/LF
      // Copper: $25-60/LF, Steel: $12-28/LF
      // ==========================================================================
      const materialType = detectLinearFootMaterial(projectType, rawText);
      const gutterBenchmarks = LINEAR_FOOT_BENCHMARKS.gutter;
      const benchmark = gutterBenchmarks[materialType] || gutterBenchmarks.general;
      
      // Extract linear feet - typical home has 150-250 LF of gutters
      const linearFeetMatch = rawText.match(/(\d+)\s*(?:linear\s*f(?:ee)?t|l\.?f\.?|feet|ft)/i);
      const estimatedLF = linearFeetMatch ? parseInt(linearFeetMatch[1]) : 
                          (submittedBid && submittedBid > 0 ? Math.round(submittedBid / benchmark.median) : 180);
      
      // Repair/cleaning projects are much smaller scope
      const isRepair = projectType === 'gutter-repair';
      const repairMultiplier = isRepair ? 0.35 : 1.0;
      
      baseBenchmark = {
        low: Math.round(benchmark.low * estimatedLF * repairMultiplier),
        high: Math.round(benchmark.high * estimatedLF * repairMultiplier),
        laborHours: Math.round(benchmark.laborHoursPerLF * estimatedLF * repairMultiplier)
      };
      materialsPercent = Math.round(benchmark.materialPercent * 100);
      laborPercent = 100 - materialsPercent;
      
      console.log('[BlindBid] Gutter project:', {
        materialType,
        estimatedLF,
        isRepair,
        pricePerLF: `$${benchmark.low}-$${benchmark.high}/LF`,
        totalRange: `$${baseBenchmark.low.toLocaleString()}-$${baseBenchmark.high.toLocaleString()}`
      });
    } else if (projectType === 'railing') {
      // ==========================================================================
      // RAILING - Linear foot pricing from benchmarkData.ts
      // Wood: $40-100/LF, Aluminum: $60-140/LF, Wrought iron: $100-250/LF
      // Cable: $80-200/LF, Glass: $150-350/LF, Composite: $70-160/LF
      // ==========================================================================
      const materialType = detectLinearFootMaterial(projectType, rawText);
      const railingBenchmarks = LINEAR_FOOT_BENCHMARKS.railing;
      const benchmark = railingBenchmarks[materialType] || railingBenchmarks.general;
      
      // Extract linear feet - deck/porch railings typically 30-80 LF
      const linearFeetMatch = rawText.match(/(\d+)\s*(?:linear\s*f(?:ee)?t|l\.?f\.?|feet|ft)/i);
      const estimatedLF = linearFeetMatch ? parseInt(linearFeetMatch[1]) : 
                          (submittedBid && submittedBid > 0 ? Math.round(submittedBid / benchmark.median) : 50);
      
      baseBenchmark = {
        low: Math.round(benchmark.low * estimatedLF),
        high: Math.round(benchmark.high * estimatedLF),
        laborHours: Math.round(benchmark.laborHoursPerLF * estimatedLF)
      };
      materialsPercent = Math.round(benchmark.materialPercent * 100);
      laborPercent = 100 - materialsPercent;
      
      console.log('[BlindBid] Railing project:', {
        materialType,
        estimatedLF,
        pricePerLF: `$${benchmark.low}-$${benchmark.high}/LF`,
        totalRange: `$${baseBenchmark.low.toLocaleString()}-$${baseBenchmark.high.toLocaleString()}`
      });
    } else if (projectType === 'retaining-wall') {
      // ==========================================================================
      // RETAINING WALL - Linear foot pricing from benchmarkData.ts
      // Timber: $25-60/LF, Block: $35-85/LF, Poured concrete: $50-130/LF
      // Boulder: $40-120/LF, Gabion: $30-80/LF
      // ==========================================================================
      const materialType = detectLinearFootMaterial(projectType, rawText);
      const retainingBenchmarks = LINEAR_FOOT_BENCHMARKS.retainingWall;
      const benchmark = retainingBenchmarks[materialType] || retainingBenchmarks.general;
      
      // Extract linear feet - retaining walls typically 20-100 LF
      const linearFeetMatch = rawText.match(/(\d+)\s*(?:linear\s*f(?:ee)?t|l\.?f\.?|feet|ft)/i);
      const estimatedLF = linearFeetMatch ? parseInt(linearFeetMatch[1]) : 
                          (submittedBid && submittedBid > 0 ? Math.round(submittedBid / benchmark.median) : 40);
      
      baseBenchmark = {
        low: Math.round(benchmark.low * estimatedLF),
        high: Math.round(benchmark.high * estimatedLF),
        laborHours: Math.round(benchmark.laborHoursPerLF * estimatedLF)
      };
      materialsPercent = Math.round(benchmark.materialPercent * 100);
      laborPercent = 100 - materialsPercent;
      
      console.log('[BlindBid] Retaining wall project:', {
        materialType,
        estimatedLF,
        pricePerLF: `$${benchmark.low}-$${benchmark.high}/LF`,
        totalRange: `$${baseBenchmark.low.toLocaleString()}-$${baseBenchmark.high.toLocaleString()}`
      });
    } else if (projectType === 'window-repair') {
      // ==========================================================================
      // WINDOW REPAIR - Houzz 2024 benchmarks
      // Seal repair/reglazing: $75 - $200/window
      // Sash/balance repair: $150 - $400/window
      // Frame repair: $200 - $500/window
      // Foggy glass replacement: $100 - $300/window
      // ==========================================================================
      const windowCountMatch = rawText.match(/(\d+)\s*window/i);
      const estimatedWindows = windowCountMatch ? parseInt(windowCountMatch[1]) : 3;
      
      const isFrameRepair = rawText.toLowerCase().includes('frame');
      const isSashRepair = rawText.toLowerCase().includes('sash') || 
                           rawText.toLowerCase().includes('balance');
      const isReglaze = rawText.toLowerCase().includes('reglaz') || 
                        rawText.toLowerCase().includes('fog');
      
      let perWindowLow = 75;
      let perWindowHigh = 200;
      
      if (isFrameRepair) {
        perWindowLow = 200;
        perWindowHigh = 500;
      } else if (isSashRepair) {
        perWindowLow = 150;
        perWindowHigh = 400;
      } else if (isReglaze) {
        perWindowLow = 100;
        perWindowHigh = 300;
      }
      
      baseBenchmark = { 
        low: perWindowLow * estimatedWindows, 
        high: perWindowHigh * estimatedWindows, 
        laborHours: estimatedWindows * 1.5 
      };
      materialsPercent = 40;
      laborPercent = 60;
    } else {
      const bench = HOMEWYSE_BENCHMARKS.kitchen.mid;
      baseBenchmark = { low: bench.low, high: bench.high, laborHours: bench.laborHours };
      const baseline = LABOR_MATERIALS_BASELINE.general;
      materialsPercent = Math.round((baseline.materialsMin + baseline.materialsMax) / 2 * 100);
      laborPercent = 100 - materialsPercent;
    }
  }
  
  // 6. Calculate fair range using Zonda regional multiplier
  // CRITICAL FIX: Zonda "major" benchmarks ALREADY include typical structural work
  // (wall removal, plumbing relocation, etc.). Only add structural add-ons for:
  // - Non-Zonda fallback benchmarks
  // - Extraordinary structural work beyond typical remodel scope
  let structuralToAdd = structural.total;
  
  if (useZondaBenchmark) {
    // For Zonda major remodel benchmarks, structural work is already included
    // Only add extraordinary items that go beyond typical scope
    const ALREADY_IN_ZONDA_MAJOR = [
      'Load-bearing wall removal',
      'Beam installation', 
      'Plumbing relocation',
      'Electrical panel upgrade',
      'Permits',
      'Debris removal'
    ];
    
    // Only count structural items NOT typically included in Zonda benchmarks
    const extraordinaryItems = structural.items.filter(
      item => !ALREADY_IN_ZONDA_MAJOR.includes(item.label)
    );
    structuralToAdd = extraordinaryItems.reduce((sum, item) => sum + item.cost, 0);
    
    if (structuralToAdd < structural.total) {
      console.log('[BlindBid] Reduced structural add-ons for Zonda benchmark:', {
        original: structural.total,
        reduced: structuralToAdd,
        reason: 'Items already included in Zonda major remodel benchmark'
      });
    }
  }
  
  // Apply regional multiplier (but NOT scope multiplier for Zonda - tier is already in benchmark selection)
  // Zonda already has tier-specific benchmarks (kitchen-minor vs kitchen-major-midrange vs kitchen-major-upscale)
  // Adding scopeDensity.multiplier would double-count the quality tier
  // Also skip tier multiplier for service/maintenance projects where quality tiers don't apply
  const isServiceProject = [
    'deck-repair', 'countertops', 'painting', 'fireplace', 'garage-door',
    'cabinet-refinishing', 'cabinet-refacing', 'cabinet-replacement', 'cabinet-new-line',
    'roofing-repair', 'roofing-storm', 'roofing-hail', 'roofing-fire', 'roofing-insurance',
    'door-interior', 'door-patio', 'door-french', 'window-repair',
    // Linear feet projects - use per-LF pricing, no tier multiplier
    'fence', 'fence-repair', 'gutter', 'gutter-repair', 'railing', 'retaining-wall'
  ].includes(projectType);
  const tierMultiplier = (useZondaBenchmark || isServiceProject) ? 1.0 : scopeDensity.multiplier;
  
  // Detect complexity factors from bid text (vaulted ceilings, high walls, multi-story, etc.)
  const complexityResult = detectComplexityMultiplier(projectType, rawText);
  const complexityMultiplier = complexityResult?.multiplier || 1.0;
  
  const fairLow = Math.round(
    (baseBenchmark.low * tierMultiplier * zondaMultiplier.multiplier * complexityMultiplier) + structuralToAdd
  );
  const fairHigh = Math.round(
    (baseBenchmark.high * tierMultiplier * zondaMultiplier.multiplier * complexityMultiplier) + structuralToAdd
  );
  const fairMid = Math.round((fairLow + fairHigh) / 2);
  
  // 7. Compare to submitted bid
  const bid = submittedBid ?? analysis.totalPrice ?? 0;
  const variancePercent = bid > 0 ? ((bid - fairMid) / fairMid) * 100 : 0;
  
  // 8. Determine variance flag
  let varianceFlag: VarianceFlag = 'green';
  if (Math.abs(variancePercent) <= 10) {
    varianceFlag = 'green';
  } else if (Math.abs(variancePercent) <= 30) {
    varianceFlag = 'yellow';
  } else {
    varianceFlag = 'red';
  }
  
  // 9. Generate flags
  const flags: BlindBidFlag[] = [];
  
  if (variancePercent > 30) {
    flags.push({ 
      type: 'red', 
      message: `Bid is ${variancePercent.toFixed(0)}% above market — investigate scope creep or premium labor` 
    });
  } else if (variancePercent > 15) {
    flags.push({ 
      type: 'yellow', 
      message: `Bid is ${variancePercent.toFixed(0)}% above market — room to negotiate` 
    });
  } else if (variancePercent < -20) {
    flags.push({ 
      type: 'yellow', 
      message: `Bid is ${Math.abs(variancePercent).toFixed(0)}% below market — verify scope completeness and contractor credentials` 
    });
  } else if (variancePercent < -10) {
    flags.push({ 
      type: 'yellow', 
      message: `Bid is ${Math.abs(variancePercent).toFixed(0)}% below market — confirm all scope items included` 
    });
  } else {
    flags.push({ 
      type: 'green', 
      message: 'Within 10% of market — competitive bid' 
    });
  }
  
  if (structural.total >= 10000) {
    flags.push({
      type: 'yellow',
      message: `Structural work detected (+$${structural.total.toLocaleString()}) — verify engineering requirements`
    });
  }
  
  // 10. Generate recommendation
  let recommendation: Recommendation = 'accept';
  let negotiateAmount: number | undefined;
  
  if (variancePercent > 30) {
    recommendation = 'reject';
  } else if (variancePercent > 15) {
    recommendation = 'negotiate';
    negotiateAmount = Math.round(bid - fairMid);
  } else if (variancePercent < -50) {
    recommendation = 'reject';
    flags.push({
      type: 'red',
      message: `Bid is ${Math.abs(variancePercent).toFixed(0)}% below market — suspiciously low, verify scope and contractor credentials carefully`
    });
  } else if (variancePercent < -25) {
    recommendation = 'accept';
    flags.push({
      type: 'yellow',
      message: 'Bid is significantly below market — confirm all scope items are included before proceeding'
    });
  }
  
  // 11. Determine confidence level
  let confidence: 'high' | 'medium' | 'low' = 'medium';
  if (zondaMultiplier.source === 'city' && scopeDensity.keywordsFound.length >= 5) {
    confidence = 'high';
  } else if (zondaMultiplier.source === 'region' && scopeDensity.keywordsFound.length >= 3) {
    confidence = 'high';
  } else if (zondaMultiplier.source === 'national' || scopeDensity.keywordsFound.length < 2) {
    confidence = 'low';
  }
  
  // 12. Convert Zonda source to tier for backward compatibility
  const tierFromSource: Record<string, 1 | 2 | 3 | 4 | 5> = {
    'boston-ma': 2,          // New England - slightly elevated
    'birmingham-al': 5,      // East South Central - value
    'appleton-wi': 4,        // East North Central - average
    'albuquerque-nm': 4,     // Mountain - average
    'atlanta-ga': 3,         // South Atlantic - moderate
  };
  
  const cityKey = zondaMultiplier.source === 'city' 
    ? Object.entries(CITY_TO_ZONDA_KEY).find(([_, v]) => zondaMultiplier.sourceName.toLowerCase().includes(v.key.split('-')[0]))?.[1]?.key
    : undefined;
  
  const cityTier = cityKey && tierFromSource[cityKey] 
    ? tierFromSource[cityKey] 
    : zondaMultiplier.multiplier >= 1.05 ? 2 
    : zondaMultiplier.multiplier <= 0.90 ? 5 
    : 3;
  
  // 13. Build result
  return {
    isBlindBid: true,
    projectType,
    detectedTier: adjustedTier,
    scopeDensityScore: scopeDensity.score,
    scopeKeywordsFound: scopeDensity.keywordsFound,
    
    city,
    cityTier,
    cityMultiplier: { 
      low: zondaMultiplier.multiplier * 0.95, 
      high: zondaMultiplier.multiplier * 1.05 
    },
    
    structuralAddOns: structural.total,
    structuralItems: structural.items,
    
    fairBidRange: { low: fairLow, mid: fairMid, high: fairHigh },
    confidence,
    
    submittedBid: bid,
    variancePercent,
    varianceFlag,
    
    benchmarkBreakdown: {
      baseBenchmark: { low: baseBenchmark.low, high: baseBenchmark.high },
      tierMultiplier: scopeDensity.multiplier,
      cityMultiplierUsed: zondaMultiplier.multiplier,
      laborHours: baseBenchmark.laborHours,
      materialsPercent,
      laborPercent
    },
    
    // New Zonda-specific data
    zondaData: zondaBenchmark ? {
      projectKey: zondaBenchmark.zondaKey,
      nationalCost: zondaBenchmark.nationalCost,
      regionalCost: Math.round(zondaBenchmark.nationalCost * zondaMultiplier.multiplier),
      multiplier: zondaMultiplier.multiplier,
      source: zondaMultiplier.source,
      sourceName: zondaMultiplier.sourceName,
      citation: zondaMultiplier.citation
    } : undefined,
    
    flags,
    recommendation,
    negotiateAmount,
    
    dataSource: useZondaBenchmark 
      ? `Zonda Cost vs Value 2025 (${zondaMultiplier.sourceName})`
      : '2026 Homewyse/RSMeans benchmarks'
  };
}

/**
 * Quick check if blind bid analysis should be used
 */
export function shouldUseBlindBidAnalysis(analysis: AnalysisResult): boolean {
  return detectBlindBid(analysis);
}
