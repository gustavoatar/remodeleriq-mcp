/**
 * NailitDIY Analysis Engine
 * Evaluates contractor bids using state-specific rules and the 4 Critical Clauses framework
 * Now includes Project Success and Functional Design analysis with Success Pillars
 */

import { negotiationTips } from './knowledgeBase';
import { getStateLaws, CRITICAL_CONTRACT_CLAUSES, type StateLaw } from './stateLaws';
import { getMaterialTrendsForProject, detectMaterialsFromBidText, getMaterialByCode, type MaterialAuditResult } from './ppiMaterialData';
import { detectProjectCategory } from './marketRates';
import { 
  detectProjectTrade, 
  type TradeDetectionResult,
  type TradeCategory,
  type TradeSubType,
  type PricingModel,
  isFlooringProject,
  isMultiTradeRemodel,
  getBenchmarkCategory
} from './tradeDetection';
import { detectUnits, type UnitDetectionResult } from './unitDetection';
import { analyzeScope, type ScopeAnalysisResult } from './scopeAnalysis';
import { calculateUnifiedScore, type UnifiedScoreResult } from './unifiedScoreEngine';
import { 
  calculateDealRisk, 
  detectWarrantyInBid,
  type DealRiskResult, 
  type ContractorTrustData
} from './dealRiskScoring';
import { validateLaborRatio } from './laborRatioValidation';
import {
  calculateSafetyCompliance,
  type SafetyComplianceResult
} from './safetyCompliance';
import {
  calculateBlindBidEstimate,
  shouldUseBlindBidAnalysis,
  type BlindBidAnalysis
} from './blindBidEngine';
import {
  detectTierMismatch,
  detectPermitLiability,
  calculateScopeGapCosts,
  type TierMismatchResult,
  type ScopeGapWithCost
} from './scopeFingerprints';
// Smart scope flags for project-specific warnings
import { evaluateAllScopeFlags } from './smartPricingEngine';
// Slang normalizer for detecting vague terms and change order risks
import { 
  normalizeSlangStatic, 
  type VagueTermFlag 
} from './slangNormalizer';
// Cost allocation engine for labor/material split analysis
import {
  analyzeAllocation,
  classifyLineItem,
  detectTradeFromLineItem,
  type AllocationResult,
  type LineItem
} from './costAllocationEngine';

// Re-export trade detection for consumers
export { 
  detectProjectTrade, 
  isFlooringProject, 
  isMultiTradeRemodel, 
  getBenchmarkCategory 
};
export type { TradeDetectionResult, TradeCategory, TradeSubType, PricingModel };

// Re-export deal risk scoring for consumers
export { calculateDealRisk, detectWarrantyInBid, calculateVagueScope, calculateChangeOrderRisk } from './dealRiskScoring';
export type { 
  DealRiskResult, 
  ContractorTrustData, 
  PriceRealismResult, 
  FinancialRiskResult, 
  TrustBufferResult,
  VagueScopeResult,
  VaguePattern,
  VaguePatternType,
  ChangeOrderRiskResult
} from './dealRiskScoring';

// Re-export safety compliance for consumers
export { calculateSafetyCompliance };
export type { SafetyComplianceResult, LeadSafetyResult, ContingencyResult } from './safetyCompliance';

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';
export type FlagCategory = 'license' | 'permit' | 'financial' | 'scope' | 'payment' | 'vagueness' | 'contract' | 'pricing';

export interface AnalysisFlag {
  id: string;
  category: FlagCategory;
  level: RiskLevel;
  title: string;
  description: string;
  recommendation: string;
  highlights?: string[];
  whyItMatters?: string;
  clause?: string;
  /** If false, flag is informational only and doesn't deduct from confidence score.
   *  Used to prevent double-counting (e.g., scope gaps already counted via scopeScore). */
  deducting?: boolean;
}

// Success Pillar Types
export type SuccessPillarCategory = 
  | 'functional-design' 
  | 'quality-of-life' 
  | 'financial-safety' 
  | 'durability';

export interface SuccessItem {
  id: string;
  category: SuccessPillarCategory;
  title: string;
  description: string;
  found: boolean;
  suggestion?: string;
  highlight?: string;
}

export interface ProjectHealth {
  successItems: SuccessItem[];
  functionalSuggestions: string[];
  durabilityAlerts: string[];
  comfortSafetyRisks: string[];
}

export interface CostBenchmark {
  item: string;
  quotedPrice: number;
  marketLow: number;
  marketHigh: number;
  status: 'fair' | 'high' | 'low' | 'unknown';
  unit?: string;
  homewysePath?: string;
}

export interface AnalysisResult {
  confidenceScore: number;
  flags: AnalysisFlag[];
  costBenchmarks: CostBenchmark[];
  missingItems: string[];
  talkTrack: string[];
  summary: string;
  stateCode: string;
  projectHealth: ProjectHealth;
  materialAudit: MaterialAuditResult;
  tradeDetection: TradeDetectionResult;
  unitDetection: UnitDetectionResult;
  scopeAnalysis: ScopeAnalysisResult;
  unifiedScore: UnifiedScoreResult;
  dealRisk: DealRiskResult | null;
  safetyCompliance: SafetyComplianceResult | null;
  blindBidAnalysis: BlindBidAnalysis | null;
  scopeGapCosts: ScopeGapWithCost[] | null;
  tierMismatch: TierMismatchResult | null;
  vagueTerms: VagueTermFlag[] | null;
  costAllocation: AllocationResult | null;
  squareFootage?: number;
  totalPrice?: number;
  projectType?: string;
}

// Re-export vague term types for consumers
export type { VagueTermFlag } from './slangNormalizer';

// Re-export blind bid types for consumers
export { calculateBlindBidEstimate, shouldUseBlindBidAnalysis };
export type { BlindBidAnalysis } from './blindBidEngine';

// Re-export scope fingerprint types for consumers
export { calculateScopeGapCosts };
export type { TierMismatchResult, ScopeGapWithCost } from './scopeFingerprints';

// Point deductions per level - "Deal Health" model (Phase 1 refactor)
// Less aggressive deductions, focused on financial risk signals
const SCORE_DEDUCTIONS = {
  critical: 12,
  high: 8,
  medium: 4,
  low: 2
};

function extractSnippet(text: string, match: RegExpMatchArray, contextChars: number = 40): string {
  const startIndex = Math.max(0, (match.index || 0) - contextChars);
  const endIndex = Math.min(text.length, (match.index || 0) + match[0].length + contextChars);
  
  let snippet = text.slice(startIndex, endIndex);
  if (startIndex > 0) snippet = '...' + snippet;
  if (endIndex < text.length) snippet = snippet + '...';
  
  return snippet.replace(/\s+/g, ' ').trim();
}

/**
 * Main analysis function
 * @param bidText - Full text content of the bid
 * @param bidTotal - Total bid amount in dollars
 * @param stateCode - State code for license laws (default: 'GA')
 * @param marketEstimate - Market estimate for price realism check (optional)
 * @param contractorTrust - Contractor trust data for trust buffer (optional)
 * @param yearBuilt - Year the home was built (optional, for lead safety check)
 */
export function analyzeBid(
  bidText: string, 
  bidTotal?: number, 
  stateCode: string = 'GA',
  marketEstimate?: number,
  contractorTrust?: ContractorTrustData,
  yearBuilt?: number
): AnalysisResult {
  const flags: AnalysisFlag[] = [];
  const talkTrack: string[] = [];
  const missingItems: string[] = [];
  
  const normalizedText = bidText.toLowerCase();
  const stateLaws = getStateLaws(stateCode);
  
  // NEW: Detect the project trade type
  const tradeDetection = detectProjectTrade(bidText);
  
  // NEW: Detect unit counts for per-unit pricing
  const unitDetection = detectUnits(bidText);
  
  // NEW: Analyze scope completeness
  const scopeAnalysis = analyzeScope(bidText, tradeDetection.primaryTrade);
  
  // Add scope flags for critical/important missing items
  const criticalMissing = scopeAnalysis.missingItems.filter(i => i.importance === 'critical');
  const importantMissing = scopeAnalysis.missingItems.filter(i => i.importance === 'important');
  
  if (criticalMissing.length > 0) {
    flags.push({
      id: 'scope-critical-missing',
      category: 'scope',
      level: 'high',
      title: `Missing Critical Scope Items`,
      description: `The bid does not clearly include: ${criticalMissing.slice(0, 3).map(i => i.name).join(', ')}${criticalMissing.length > 3 ? ` and ${criticalMissing.length - 3} more` : ''}.`,
      whyItMatters: `Critical items are essential for project completion. Unclear scope leads to change orders and cost overruns.`,
      recommendation: `Ask the contractor to confirm these items are included or get separate pricing if they're excluded.`,
      deducting: false // Informational only - scopeScore already accounts for this
    });
  }
  
  if (importantMissing.length >= 3) {
    flags.push({
      id: 'scope-important-missing',
      category: 'scope',
      level: 'medium',
      title: `Several Important Items Not Specified`,
      description: `${importantMissing.length} important items are not clearly addressed: ${importantMissing.slice(0, 3).map(i => i.name).join(', ')}${importantMissing.length > 3 ? ', etc' : ''}.`,
      whyItMatters: `These items may be assumed by either party. Clarifying now prevents disputes later.`,
      recommendation: `Request a detailed scope breakdown or written confirmation of what's included.`,
      deducting: false // Informational only - scopeScore already accounts for this
    });
  }
  
  // License Check
  if (bidTotal && bidTotal > stateLaws.licenseThreshold) {
    const hasLicenseNumber = /(?:ga|fl|ca|tx|ny)?\s*(license|lic|contractor)\s*(#|no|number)?\s*:?\s*\d{4,}/i.test(bidText) ||
                            /license\s*(#|no|number)?\s*:?\s*\d{4,}/i.test(bidText) ||
                            /grbc\s*#?\s*\d+/i.test(bidText) ||
                            /cslb\s*#?\s*\d+/i.test(bidText);
    
    if (!hasLicenseNumber) {
      // If contractor has verified license through research, don't deduct points
      // Just make it a recommendation
      const isVerifiedLicensed = contractorTrust?.hasVerifiedLicense || false;
      
      flags.push({
        id: 'license-missing',
        category: 'license',
        level: isVerifiedLicensed ? 'low' : 'critical',
        title: `${stateLaws.state} License Number Missing from Bid`,
        description: isVerifiedLicensed 
          ? `This contractor is verified as licensed, but the license number is not shown in the bid document.`
          : `In ${stateLaws.state}, contractors must be licensed for projects over $${stateLaws.licenseThreshold.toLocaleString()}. This bid totals $${bidTotal.toLocaleString()} but no license number is shown.`,
        whyItMatters: isVerifiedLicensed
          ? `While the contractor is licensed, having the license number in the contract provides clear documentation.`
          : `Unlicensed contractors cannot pull permits, may not carry insurance, and you have limited legal recourse if something goes wrong.`,
        recommendation: `Request the contractor's license number and verify it before signing any contract`,
        deducting: !isVerifiedLicensed
      });
      
      if (!isVerifiedLicensed) {
        talkTrack.push(...negotiationTips.missingLicense);
      }
    }
  }
  
  // Critical Clause Analysis
  analyzePaymentTerms(bidText, bidTotal, stateLaws, flags, talkTrack);
  analyzeDisputeResolution(bidText, flags);
  analyzeUnexpectedCosts(bidText, flags, talkTrack, missingItems);
  analyzeWorkSpecsAndTimeline(bidText, flags, talkTrack, missingItems);
  analyzePermitRequirements(bidText, normalizedText, stateLaws, flags, talkTrack, missingItems);
  analyzeVagueness(bidText, flags, talkTrack);
  analyzeRedFlagPatterns(bidText, flags);
  
  // NEW: Project Health Analysis (Success Pillars)
  const projectHealth = analyzeProjectHealth(bidText, normalizedText, flags);
  
  // NEW: Material Cost Audit using BLS PPI data
  // First detect from project category, then supplement with explicit material mentions in bid text
  const projectCategory = detectProjectCategory(bidText);
  const materialAudit = getMaterialTrendsForProject(projectCategory);
  
  // Supplement with explicitly detected materials from bid text
  const explicitMaterials = detectMaterialsFromBidText(bidText);
  for (const materialCode of explicitMaterials) {
    // Check if this material is already in the trends
    if (!materialAudit.trends.some(t => t.material.code === materialCode)) {
      // Get material directly from PPI_MATERIALS
      const material = getMaterialByCode(materialCode);
      if (material) {
        // Create trend result for this material
        const trendLabel = material.trend === 'rising' 
          ? `Up ${Math.abs(material.sixMonthChange).toFixed(1)}% (6 mo)`
          : material.trend === 'falling'
            ? `Down ${Math.abs(material.sixMonthChange).toFixed(1)}% (6 mo)`
            : `Stable (±${Math.abs(material.sixMonthChange).toFixed(1)}%)`;
        
        const savingsTip = material.trend === 'falling' && material.sixMonthChange < -3
          ? `${material.name} prices have dropped ${Math.abs(material.sixMonthChange).toFixed(1)}% in the past 6 months. Ask if your contractor's material quote reflects current market pricing.`
          : undefined;
          
        const negotiationScript = material.trend === 'falling'
          ? `"I noticed material indices for ${material.name.toLowerCase()} have stabilized recently; does this quote reflect current market pricing or a previous estimate?"`
          : material.trend === 'rising'
            ? `"I understand ${material.name.toLowerCase()} costs have been increasing. Is there a way to lock in current pricing if I commit soon?"`
            : undefined;
        
        materialAudit.trends.push({
          material,
          trend: material.trend,
          trendLabel,
          savingsTip,
          negotiationScript
        });
        
        if (savingsTip) {
          materialAudit.savingsTips.push(savingsTip);
        }
        if (negotiationScript) {
          materialAudit.talkTrackSuggestions.push(negotiationScript);
        }
      }
    }
  }
  
  // Add material savings tips to talk track
  if (materialAudit.talkTrackSuggestions.length > 0) {
    talkTrack.push(...materialAudit.talkTrackSuggestions);
  }
  
  // NEW: Deal Risk Analysis (Phase 2)
  // Build contractor trust data, detecting warranty from bid text if not provided
  const trustData: ContractorTrustData = contractorTrust || {};
  if (trustData.warrantyMentioned === undefined) {
    trustData.warrantyMentioned = detectWarrantyInBid(bidText);
  }
  
  const dealRisk = calculateDealRisk(
    bidText,
    bidTotal || null,
    marketEstimate || null,
    trustData,
    tradeDetection.primaryTrade // Trade-specific lowball thresholds
  );
  
  // Add deal risk flags to main flags array
  for (const flag of dealRisk.allFlags) {
    // Avoid duplicate flags
    if (!flags.some(f => f.id === flag.id)) {
      flags.push(flag);
    }
  }
  
  // NEW: Safety Compliance Analysis (Pre-1978 Lead Safety + Contingency)
  const safetyCompliance = calculateSafetyCompliance(
    bidText,
    bidTotal || null,
    yearBuilt || null
  );
  
  // Add safety compliance flags to main flags array
  for (const flag of safetyCompliance.allFlags) {
    if (!flags.some(f => f.id === flag.id)) {
      flags.push(flag);
    }
  }
  
  // NEW: Labor Ratio Validation (Phase 3 - Houzz Integration)
  // Validates labor/material split against industry benchmarks
  validateLaborRatio(bidText, tradeDetection.primaryTrade, bidTotal || null, flags);
  
  // NEW: Tier Mismatch Detection ("Buying the Job" - Phase 1A)
  // Detects premium keywords paired with builder-grade pricing
  if (bidTotal && bidTotal > 5000) {
    const tierMismatch = detectTierMismatch(
      bidText,
      bidTotal,
      tradeDetection.primaryTrade,
      1.0 // Regional multiplier - will be passed by caller when available
    );
    if (tierMismatch.flag) {
      flags.push(tierMismatch.flag);
    }
  }
  
  // NEW: Permit Liability Detection (Phase 1A)
  // Detects when homeowner is expected to pull permits (liability transfer)
  const permitLiabilityFlag = detectPermitLiability(bidText);
  if (permitLiabilityFlag) {
    flags.push(permitLiabilityFlag);
  }
  
  // Smart Scope Flags - project-specific safety/compliance warnings
  const detectedProjectType = tradeDetection.primaryTrade || 'general';
  const smartScopeFlags = evaluateAllScopeFlags(detectedProjectType, bidText, bidTotal || 0);
  for (const scopeFlag of smartScopeFlags) {
    // Map 'info' severity to 'low' since RiskLevel doesn't include 'info'
    const mappedLevel: RiskLevel = scopeFlag.severity === 'info' ? 'low' : scopeFlag.severity as RiskLevel;
    flags.push({
      id: scopeFlag.flagId,
      category: 'contract', // Most scope flags relate to contract safety
      level: mappedLevel,
      title: scopeFlag.flagId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      description: scopeFlag.message,
      recommendation: `Discuss this with your contractor before signing.`,
      deducting: scopeFlag.deduction > 0, // Only deduct if flag has point deduction
    });
  }
  
  // Calculate confidence score
  let confidenceScore = 100;
  
  // Deduct for contract/legal flags (skip informational-only flags to prevent double-counting)
  flags.forEach(flag => {
    // Skip non-deducting flags (e.g., scope flags - already counted via scopeScore)
    if (flag.deducting === false) {
      return;
    }
    // License missing is critical for display but only deducts 8 points
    if (flag.id === 'license-missing') {
      confidenceScore -= 8;
    } else {
      confidenceScore -= SCORE_DEDUCTIONS[flag.level];
    }
  });
  
  // Factor in scope completeness (25% weight of scope deductions)
  // If scope score is 80 (20 pts lost), add 5 pts to confidence deduction
  const scopeDeduction = Math.round((100 - scopeAnalysis.scopeScore) * 0.25);
  confidenceScore -= scopeDeduction;
  
  // Apply Deal Risk adjustment (Phase 2: Price Realism, Financial Risk, Trust Buffer)
  // Can be positive (trust bonuses) or negative (financial red flags)
  confidenceScore += dealRisk.totalAdjustment;
  
  // Apply Safety Compliance adjustment (Pre-1978 Lead Safety + Contingency)
  confidenceScore += safetyCompliance.totalAdjustment;
  
  // Floor at 12 (not 0): a genuinely risky bid should read "12/100 — high risk",
  // a real verdict, rather than "0/100" which looks like the tool errored. The
  // verdict/flags carry the severity; the number just shouldn't look broken.
  confidenceScore = Math.max(12, Math.min(100, confidenceScore));
  
  // Generate summary
  const criticalCount = flags.filter(f => f.level === 'critical').length;
  const highCount = flags.filter(f => f.level === 'high').length;
  
  let summary = '';
  if (criticalCount > 0) {
    summary = `Critical issues found. This bid has ${criticalCount} critical and ${highCount} high-risk flags that need attention before signing.`;
  } else if (highCount > 0) {
    summary = `This bid has ${highCount} significant concerns. Review the flags below and use the talk track to negotiate better terms.`;
  } else if (flags.length > 0) {
    summary = `This bid looks reasonable with minor concerns. Review the suggestions below to ensure you're fully protected.`;
  } else {
    summary = `This bid appears comprehensive. Verify license and insurance independently before signing.`;
  }
  
  const uniqueTalkTrack = [...new Set(talkTrack)].slice(0, 6);
  
  // Sort flags by severity
  const sortedFlags = flags.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.level] - order[b.level];
  });
  
  // Calculate unified score (price score will be added by caller when available)
  const unifiedScore = calculateUnifiedScore({
    flags: sortedFlags,
    scopeAnalysis,
    priceScore: null, // Will be populated by caller with price data
  });
  
  // Blind Bid Analysis - for bids without square footage
  // Will be populated by caller with city/state data when needed
  const blindBidAnalysis: BlindBidAnalysis | null = null;
  
  // Calculate Scope Gap Costs (Phase 1A - Change Order Landmines)
  // Uses scope analysis missing items to estimate potential change order costs
  const missingItemStrings = scopeAnalysis.missingItems?.map((item) => 
    typeof item === 'string' ? item : (item as { name: string }).name || ''
  ) || [];
  const scopeGapResult = calculateScopeGapCosts(
    missingItemStrings, // Required items
    [],                 // Expected items (none for now)
    tradeDetection.primaryTrade || 'general',
    1.0                 // Regional multiplier
  );
  const scopeGapCosts = scopeGapResult.scopeGaps;
  
  // Get tier mismatch result for export (flag already added above)
  const tierMismatch = bidTotal && bidTotal > 5000 
    ? detectTierMismatch(bidText, bidTotal, tradeDetection.primaryTrade, 1.0)
    : null;
  
  // Detect vague terms and change order risks
  const slangResult = normalizeSlangStatic(bidText);
  const vagueTerms = slangResult.vagueTerms.length > 0 ? slangResult.vagueTerms : null;
  
  // Add high-risk vague term flags
  if (vagueTerms) {
    const highRiskVagueTerms = vagueTerms.filter(t => t.estimatedRisk === 'high');
    const mediumRiskVagueTerms = vagueTerms.filter(t => t.estimatedRisk === 'medium');
    
    if (highRiskVagueTerms.length >= 2) {
      flags.push({
        id: 'vague-terms-critical',
        category: 'contract',
        level: 'critical',
        title: 'Undefined Cost Exposure',
        description: `Bid contains ${highRiskVagueTerms.length} high-risk vague terms (allowances, TBD items) that could lead to significant change orders. Found: "${highRiskVagueTerms[0].term}"`,
        recommendation: 'Request specific dollar amounts or material specifications for all allowance items before signing.'
      });
    } else if (highRiskVagueTerms.length === 1) {
      flags.push({
        id: 'vague-terms-high',
        category: 'contract',
        level: 'high',
        title: 'Vague Cost Item',
        description: `Found "${highRiskVagueTerms[0].term}" - ${highRiskVagueTerms[0].warningText}`,
        recommendation: 'Ask contractor to clarify scope and provide specific materials/quantities.'
      });
    }
    
    if (mediumRiskVagueTerms.length >= 3) {
      flags.push({
        id: 'vague-terms-medium',
        category: 'contract',
        level: 'medium',
        title: 'Multiple Vague Scope Items',
        description: `Found ${mediumRiskVagueTerms.length} vague terms that may result in change orders or disputes: ${mediumRiskVagueTerms.slice(0, 2).map(t => t.term).join(', ')}`,
        recommendation: 'Ask contractor to clarify scope and provide specific materials/quantities.'
      });
    }
  }
  
  // Cost Allocation Analysis - check labor/material ratios
  let costAllocation: AllocationResult | null = null;
  try {
    // Extract simple line items from bid text for allocation analysis
    const lineItemRegex = /^\s*[-•*]?\s*(.+?)\s*[\$:]\s*\$?([\d,]+(?:\.\d{2})?)/gm;
    const extractedLineItems: LineItem[] = [];
    let match;
    while ((match = lineItemRegex.exec(bidText)) !== null) {
      const description = match[1].trim();
      const amount = parseFloat(match[2].replace(/,/g, ''));
      if (amount > 0 && description.length > 2) {
        const category = classifyLineItem(description);
        const trade = detectTradeFromLineItem(description);
        extractedLineItems.push({
          description,
          amount,
          category,
          trade
        });
      }
    }
    
    if (extractedLineItems.length >= 2 && bidTotal && bidTotal > 0) {
      costAllocation = analyzeAllocation(
        extractedLineItems, 
        bidTotal, 
        tradeDetection.primaryTrade
      );
      
      // Add flags for allocation issues
      if (costAllocation.flags) {
        for (const allocFlag of costAllocation.flags) {
          const flagType = allocFlag.type;
          flags.push({
            id: `allocation-${flagType}`,
            category: 'pricing',
            level: allocFlag.severity === 'high' ? 'high' : 'medium',
            title: allocFlag.title,
            description: allocFlag.description,
            recommendation: flagType.includes('labor') && allocFlag.actual > 50
              ? 'Request itemized labor breakdown. High labor costs may indicate inefficiency or padding.'
              : flagType.includes('material') && allocFlag.actual < 30
                ? 'Ask what materials are included. Low material costs may mean lower quality products.'
                : 'Request detailed breakdown to understand cost structure.'
          });
        }
      }
    }
  } catch (e) {
    console.error('Cost allocation analysis failed:', e);
  }
  
  // Re-sort flags after adding vague term flags
  const finalSortedFlags = flags.sort((a, b) => {
    const levelOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return levelOrder[a.level] - levelOrder[b.level];
  });
  
  return {
    confidenceScore,
    flags: finalSortedFlags,
    costBenchmarks: generateBenchmarks(bidText),
    missingItems,
    unitDetection,
    talkTrack: uniqueTalkTrack,
    summary,
    stateCode,
    projectHealth,
    materialAudit,
    tradeDetection,
    scopeAnalysis,
    unifiedScore,
    dealRisk,
    safetyCompliance,
    blindBidAnalysis,
    scopeGapCosts,
    tierMismatch,
    vagueTerms,
    costAllocation
  };
}

/**
 * Project Health Analysis - Success Pillars
 */
function analyzeProjectHealth(_bidText: string, normalizedText: string, flags: AnalysisFlag[]): ProjectHealth {
  const successItems: SuccessItem[] = [];
  const functionalSuggestions: string[] = [];
  const durabilityAlerts: string[] = [];
  const comfortSafetyRisks: string[] = [];

  // Room-Specific Intelligence
  analyzeKitchenRequirements(normalizedText, successItems, functionalSuggestions);
  analyzeBasementRequirements(normalizedText, successItems, comfortSafetyRisks);
  analyzeDeckRequirements(normalizedText, successItems, durabilityAlerts);
  
  // Quality of Life Audit
  analyzeCleanupAndDebris(normalizedText, successItems);
  analyzePunchListProcess(normalizedText, successItems);
  
  // Change Order Shield
  analyzeChangeOrderProcess(normalizedText, successItems, flags);

  return {
    successItems,
    functionalSuggestions,
    durabilityAlerts,
    comfortSafetyRisks
  };
}

/**
 * Kitchen-Specific Analysis
 */
function analyzeKitchenRequirements(normalizedText: string, successItems: SuccessItem[], functionalSuggestions: string[]) {
  if (!normalizedText.includes('kitchen')) return;

  // Task Lighting
  const hasTaskLighting = /task\s*light|under[\s-]?cabinet\s*light|led\s*strip|puck\s*light/i.test(normalizedText);
  const hasCabinets = /cabinet/i.test(normalizedText);
  
  successItems.push({
    id: 'kitchen-task-lighting',
    category: 'functional-design',
    title: 'Task Lighting',
    description: 'Under-cabinet or task lighting for work surfaces',
    found: hasTaskLighting
  });

  if (hasCabinets && !hasTaskLighting) {
    functionalSuggestions.push("Don't forget task lighting! Adding under-cabinet LEDs now is 70% cheaper than doing it after the backsplash is in.");
  }

  // Ventilation
  const hasVentilation = /range\s*hood|vent|exhaust|ventilation/i.test(normalizedText);
  successItems.push({
    id: 'kitchen-ventilation',
    category: 'functional-design',
    title: 'Ventilation',
    description: 'Range hood or exhaust ventilation system',
    found: hasVentilation
  });

  if (!hasVentilation) {
    functionalSuggestions.push('Kitchen ventilation is essential. Ask about range hood CFM rating and ducting to exterior.');
  }

  // Work Triangle
  const hasWorkTriangle = /work\s*triangle|layout|workflow|sink.*stove.*fridge/i.test(normalizedText);
  successItems.push({
    id: 'kitchen-work-triangle',
    category: 'functional-design',
    title: 'Work Triangle Planning',
    description: 'Efficient layout between sink, stove, and refrigerator',
    found: hasWorkTriangle
  });
}

/**
 * Basement-Specific Analysis
 */
function analyzeBasementRequirements(normalizedText: string, successItems: SuccessItem[], comfortSafetyRisks: string[]) {
  if (!normalizedText.includes('basement')) return;

  // Egress
  const hasEgress = /egress|emergency\s*exit|escape\s*window|egress\s*window/i.test(normalizedText);
  successItems.push({
    id: 'basement-egress',
    category: 'functional-design',
    title: 'Egress Window/Exit',
    description: 'Emergency exit window or egress for bedrooms',
    found: hasEgress
  });

  if (!hasEgress) {
    comfortSafetyRisks.push('Basement bedrooms require egress windows by code. Verify this is addressed for safety and resale value.');
  }

  // Soundproofing
  const hasSoundproofing = /sound\s*proof|acoustic|insulation.*sound|quiet\s*rock|resilient\s*channel/i.test(normalizedText);
  successItems.push({
    id: 'basement-soundproofing',
    category: 'functional-design',
    title: 'Soundproofing',
    description: 'Acoustic insulation or soundproofing measures',
    found: hasSoundproofing
  });

  if (!hasSoundproofing) {
    comfortSafetyRisks.push('Consider soundproofing for basement comfort. Adding it during construction is much cheaper than retrofitting.');
  }

  // Moisture/Waterproofing
  const hasWaterproofing = /waterproof|moisture\s*barrier|sump\s*pump|drainage|vapor\s*barrier|drylock|seal/i.test(normalizedText);
  successItems.push({
    id: 'basement-waterproofing',
    category: 'durability',
    title: 'Moisture Protection',
    description: 'Waterproofing, vapor barrier, or drainage system',
    found: hasWaterproofing
  });

  if (!hasWaterproofing) {
    comfortSafetyRisks.push('Basement moisture protection is critical. Ask about waterproofing strategy to prevent future water damage and mold.');
  }
}

/**
 * Deck-Specific Analysis
 */
function analyzeDeckRequirements(normalizedText: string, successItems: SuccessItem[], durabilityAlerts: string[]) {
  if (!normalizedText.includes('deck')) return;

  // Ledger Flashing
  const hasLedgerFlashing = /ledger\s*flash|flash.*ledger|z[\s-]?flash|deck\s*flash/i.test(normalizedText);
  successItems.push({
    id: 'deck-ledger-flashing',
    category: 'durability',
    title: 'Ledger Flashing',
    description: 'Proper flashing where deck meets house',
    found: hasLedgerFlashing
  });

  if (!hasLedgerFlashing) {
    durabilityAlerts.push('Ensure the contractor uses proper flashing where the deck meets the house to prevent rot. This is the #1 cause of deck failures.');
  }

  // Footing Depth
  const hasFootingDepth = /footing\s*depth|frost\s*line|concrete\s*footing|\d+['"]\s*(?:deep|depth)|pier/i.test(normalizedText);
  successItems.push({
    id: 'deck-footing-depth',
    category: 'durability',
    title: 'Footing Depth Specified',
    description: 'Concrete footings below frost line',
    found: hasFootingDepth
  });

  if (!hasFootingDepth) {
    durabilityAlerts.push('Deck footings must extend below the frost line. Ask contractor to specify footing depth for your area.');
  }
}

/**
 * Cleanup and Debris Analysis
 */
function analyzeCleanupAndDebris(normalizedText: string, successItems: SuccessItem[]) {
  const hasDebrisRemoval = /debris\s*removal|haul\s*away|dispose|dumpster|trash\s*removal|remove\s*(?:all\s*)?(?:debris|trash|waste)/i.test(normalizedText);
  const hasDailyCleanup = /daily\s*clean|clean[\s-]?up|broom\s*clean|site\s*clean/i.test(normalizedText);

  successItems.push({
    id: 'qol-debris-removal',
    category: 'quality-of-life',
    title: 'Debris Removal',
    description: 'Contractor handles trash and debris disposal',
    found: hasDebrisRemoval,
    suggestion: !hasDebrisRemoval ? "This bid doesn't mention trash removal. Ask who is responsible for the dumpster fee." : undefined
  });

  successItems.push({
    id: 'qol-daily-cleanup',
    category: 'quality-of-life',
    title: 'Daily Site Cleaning',
    description: 'Work area cleaned at end of each day',
    found: hasDailyCleanup,
    suggestion: !hasDailyCleanup ? 'Request daily cleanup language to keep your home livable during construction.' : undefined
  });
}

/**
 * Punch List Process Analysis
 */
function analyzePunchListProcess(normalizedText: string, successItems: SuccessItem[]) {
  const hasFinalWalkthrough = /final\s*walk[\s-]?through|walk[\s-]?through.*final|completion\s*inspection/i.test(normalizedText);
  const hasPunchList = /punch\s*list|deficiency\s*list|snag\s*list|final\s*inspection/i.test(normalizedText);

  successItems.push({
    id: 'qol-final-walkthrough',
    category: 'quality-of-life',
    title: 'Final Walkthrough',
    description: 'Scheduled walkthrough before final payment',
    found: hasFinalWalkthrough || hasPunchList,
    suggestion: !(hasFinalWalkthrough || hasPunchList) ? 'Add a punch list clause to ensure the last 5% of work actually gets finished before final payment.' : undefined
  });
}

/**
 * Change Order Shield Analysis
 */
function analyzeChangeOrderProcess(normalizedText: string, successItems: SuccessItem[], flags: AnalysisFlag[]) {
  const hasWrittenChangeOrder = /written\s*change\s*order|change\s*order.*(?:in\s*)?writing|signed\s*(?:change\s*order|approval)|written\s*(?:approval|authorization).*(?:change|extra|additional)/i.test(normalizedText);
  const hasChangeOrderProcess = /change\s*order\s*(?:process|procedure|policy)|approval\s*(?:required|needed).*(?:change|extra)/i.test(normalizedText);

  const found = hasWrittenChangeOrder || hasChangeOrderProcess;

  successItems.push({
    id: 'financial-change-order',
    category: 'financial-safety',
    title: 'Written Change Order Process',
    description: 'All changes require written approval before work',
    found,
    suggestion: !found ? 'Ensure you and the contractor agree that NO extra costs are approved unless signed in writing first.' : undefined
  });

  if (!found) {
    flags.push({
      id: 'missing-change-order-process',
      category: 'financial',
      level: 'medium',
      title: 'No Written Change Order Process',
      description: "The contract doesn't explicitly require written approval for changes or extra work.",
      whyItMatters: 'Without a written change order requirement, contractors can claim verbal approval for expensive additions. This is a leading cause of budget overruns.',
      recommendation: 'Add: "Any changes to the scope of work, including additions or modifications, require a written and signed change order specifying the cost impact before work proceeds."'
    });
  }
}

/**
 * Payment Terms Analysis
 */
function analyzePaymentTerms(
  bidText: string, 
  _bidTotal: number | undefined, 
  _stateLaws: StateLaw, 
  flags: AnalysisFlag[], 
  _talkTrack: string[]
) {
  // NOTE: Deposit checks are handled by dealRiskScoring.ts calculateFinancialRisk()
  // to avoid duplicate warnings. Only check for 50/50 split patterns here.
  
  const splitMatch = bidText.match(/50\s*%.*50\s*%|half.*half|50\s*\/\s*50/i);
  if (splitMatch) {
    flags.push({
      id: 'risky-payment-split',
      category: 'payment',
      level: 'high',
      title: 'Risky 50/50 Payment Structure',
      description: 'A 50/50 split means you pay half before seeing significant progress.',
      whyItMatters: "Payment structure is your primary leverage. Once you've paid 50%, the contractor has less incentive to address problems.",
      recommendation: 'Suggest a 30/30/30/10 split: 30% after demolition, 30% after rough-in, 30% after finishes, 10% after walkthrough',
      highlights: [extractSnippet(bidText, splitMatch, 30)],
      clause: 'Payment Terms'
    });
  }
}

/**
 * Dispute Resolution Analysis
 */
function analyzeDisputeResolution(bidText: string, flags: AnalysisFlag[]) {
  const clause = CRITICAL_CONTRACT_CLAUSES.find(c => c.id === 'dispute-resolution')!;
  
  const arbitrationMatch = bidText.match(/binding\s*arbitration|mandatory\s*arbitration|waive.{0,20}(right|ability).{0,20}(sue|court|litigation)/i);
  if (arbitrationMatch) {
    flags.push({
      id: 'binding-arbitration',
      category: 'contract',
      level: 'high',
      title: 'Binding Arbitration Clause Detected',
      description: 'This contract may require binding arbitration, limiting your ability to sue.',
      whyItMatters: clause.whyItMatters,
      recommendation: "Request that arbitration be optional. Include an attorney's fees provision for the prevailing party.",
      highlights: [extractSnippet(bidText, arbitrationMatch, 40)],
      clause: 'Dispute Resolution'
    });
  }
  
  const waiverMatch = bidText.match(/waive.{0,30}liability|not\s*(be\s*)?liable|hold\s*harmless.{0,30}contractor/i);
  if (waiverMatch) {
    flags.push({
      id: 'liability-waiver',
      category: 'contract',
      level: 'high',
      title: 'Liability Waiver Language',
      description: 'This contract contains language limiting contractor liability.',
      whyItMatters: 'Liability waivers can leave you with no recourse if the contractor damages your property.',
      recommendation: 'Strike or modify liability waiver language. Contractor should carry liability insurance.',
      highlights: [extractSnippet(bidText, waiverMatch, 40)],
      clause: 'Dispute Resolution'
    });
  }
}

/**
 * Unexpected Costs Analysis
 */
function analyzeUnexpectedCosts(
  bidText: string, 
  flags: AnalysisFlag[], 
  talkTrack: string[],
  missingItems: string[]
) {
  const autoApprovalMatch = bidText.match(/additional\s*work.{0,30}(proceed|performed|done)\s*(without|automatically)|extras?\s*(under|up\s*to)\s*\$[\d,]+\s*(will|may|can)\s*(be\s*)?(added|charged)/i);
  if (autoApprovalMatch) {
    flags.push({
      id: 'auto-approval-extras',
      category: 'financial',
      level: 'high',
      title: 'Automatic Approval of Extra Charges',
      description: 'This contract allows charges without your explicit approval.',
      whyItMatters: "Without clear language, you could be stuck paying for problems that weren't your fault.",
      recommendation: 'Require written approval with photos and estimates BEFORE any extra work begins.',
      highlights: [extractSnippet(bidText, autoApprovalMatch, 40)],
      clause: 'Unexpected Costs'
    });
  }
  
  const timeMaterialsMatch = bidText.match(/time\s*and\s*materials|t\s*&\s*m|hourly\s*rate.{0,20}unforeseen/i);
  const hasCap = /cap|maximum|not\s*to\s*exceed|ceiling/i.test(bidText);
  
  if (timeMaterialsMatch && !hasCap) {
    flags.push({
      id: 'uncapped-time-materials',
      category: 'financial',
      level: 'medium',
      title: 'Uncapped Time and Materials Clause',
      description: 'Extra work billed hourly with no maximum.',
      whyItMatters: 'Time and materials without a cap means costs can spiral without limit.',
      recommendation: 'Add a "not to exceed" cap, or require fixed-price quotes for extras.',
      highlights: [extractSnippet(bidText, timeMaterialsMatch, 30)],
      clause: 'Unexpected Costs'
    });
  }
  
  const hasInsurance = /insurance|liability|bonded|insured/i.test(bidText);
  if (!hasInsurance) {
    missingItems.push('Liability insurance information');
    talkTrack.push("Can you provide a certificate of insurance? I'd like to verify your general liability and workers' comp coverage.");
  }
}

/**
 * Work Specs and Timeline Analysis
 */
function analyzeWorkSpecsAndTimeline(
  bidText: string, 
  flags: AnalysisFlag[], 
  talkTrack: string[],
  missingItems: string[]
) {
  const hasTimeline = /start\s*date|completion\s*date|schedule|timeline|weeks?|days?\s*(to|for)\s*complet/i.test(bidText);
  const hasPenalty = /penalty|liquidated\s*damages|\$\s*\d+\s*per\s*day|late\s*fee/i.test(bidText);
  
  if (!hasTimeline) {
    flags.push({
      id: 'missing-timeline',
      category: 'scope',
      level: 'medium',
      title: 'No Project Timeline',
      description: "This bid doesn't specify start date, completion date, or duration.",
      whyItMatters: 'Without a timeline, projects can drag on indefinitely.',
      recommendation: 'Request specific start and completion dates with a per-day penalty clause.',
      clause: 'Work Specs and Timeline'
    });
    missingItems.push('Project start and completion dates');
    talkTrack.push('What is your expected start date and completion date for this project?');
  } else if (!hasPenalty && bidText.length > 500) {
    flags.push({
      id: 'no-delay-penalty',
      category: 'scope',
      level: 'low',
      title: 'No Delay Penalty Clause',
      description: 'The contract has dates but no consequences for missing them.',
      whyItMatters: 'Deadlines without penalties are suggestions.',
      recommendation: 'Add: "Contractor shall pay $[100-200] per day for delays beyond [date] not caused by weather or homeowner changes."',
      clause: 'Work Specs and Timeline'
    });
  }
  
  const hasCleanup = /clean\s*up|debris|disposal|haul|remove.{0,10}(trash|waste|materials)/i.test(bidText);
  if (!hasCleanup) {
    missingItems.push('Debris removal and daily cleanup');
  }
  
  const hasWarranty = /warranty|guarantee/i.test(bidText);
  if (!hasWarranty) {
    missingItems.push('Workmanship warranty');
    talkTrack.push(...negotiationTips.missingWarranty);
  }
}

/**
 * Permit Analysis
 */
function analyzePermitRequirements(
  bidText: string,
  normalizedText: string,
  stateLaws: StateLaw,
  flags: AnalysisFlag[],
  talkTrack: string[],
  missingItems: string[]
) {
  // Only flag permits for major work that clearly requires permits
  // Minor repairs, maintenance, and cosmetic work typically don't need permits
  
  // Full replacements and major structural work - definitely need permits
  const definitelyNeedsPermit = 
    /roof\s*(replacement|install|new|tear[\s-]?off|re[\s-]?roof)/i.test(bidText) ||
    /replace\s*(the\s*)?(entire\s*)?roof/i.test(bidText) ||
    /new\s+deck|deck\s*(build|construct|install|addition)/i.test(bidText) ||
    /structural|load[\s-]?bearing|foundation/i.test(normalizedText) ||
    /addition|room\s*addition|add[\s-]?on/i.test(normalizedText) ||
    /hvac\s*(install|replace|new)|new\s*(hvac|furnace|ac\s*unit)/i.test(bidText) ||
    /electrical\s*panel|rewire|new\s*circuit|200\s*amp/i.test(bidText) ||
    /move\s*(plumbing|drain|water\s*line)|re[\s-]?plumb|new\s*plumbing/i.test(bidText) ||
    /bathroom\s*(addition|remodel)|full\s*bathroom/i.test(normalizedText) ||
    /kitchen\s*(remodel|renovation|gut)/i.test(normalizedText);
  
  // Don't flag permits for:
  // - Minor roof repairs (shingle replacement, flashing, small patches)
  // - Cosmetic updates (painting, cabinet refacing, countertops)
  // - Simple fixture replacements (faucet, toilet, light fixture)
  // - Deck repairs/staining (vs new construction)
  
  const mentionsPermit = /permit/i.test(bidText);
  const homeownerPullsPermit = /homeowner\s+(to\s+)?(pull|obtain|get|responsible\s+for)\s+permit/i.test(bidText) ||
                               /owner\s+(to\s+)?(pull|obtain|get)\s+permit/i.test(bidText);
  
  if (definitelyNeedsPermit) {
    if (!mentionsPermit) {
      flags.push({
        id: 'permit-not-mentioned',
        category: 'permit',
        level: 'medium',
        title: 'Permit Responsibility Not Addressed',
        description: 'This type of project typically requires a building permit, but permits are not mentioned in the bid.',
        whyItMatters: 'Unpermitted work can result in fines, forced removal, and problems when selling.',
        recommendation: 'Ask contractor: "Who will be responsible for pulling permits and scheduling inspections?"'
      });
      missingItems.push('Building permit responsibility');
      talkTrack.push(...negotiationTips.permitIssues);
    } else if (homeownerPullsPermit) {
      flags.push({
        id: 'homeowner-permit-risk',
        category: 'permit',
        level: 'medium',
        title: 'Homeowner Pulling Permits = Your Liability',
        description: `The bid states YOU will pull permits. In ${stateLaws.state}, the permit holder is legally responsible for code compliance.`,
        whyItMatters: 'If you pull the permit and work fails inspection, YOU are responsible for fixing it.',
        recommendation: 'Negotiate for contractor to pull permits and be responsible for passing inspections.'
      });
      talkTrack.push("I'd prefer you pull the permit since you're the licensed professional. Would that work?");
    }
  }
}

/**
 * Vagueness Detection
 */
function analyzeVagueness(bidText: string, flags: AnalysisFlag[], talkTrack: string[]) {
  interface VaguePattern {
    pattern: RegExp;
    issue: string;
    whyBad: string;
    whatToAsk: string;
  }
  
  const vaguePatterns: VaguePattern[] = [
    {
      pattern: /install\s+(new\s+)?cabinets?(?!\s+(:|brand|model|from|style|[A-Z][a-z]+Maid|kraftmaid))/gi,
      issue: 'Cabinet brand/style not specified',
      whyBad: 'Cabinet quality varies enormously. Stock cabinets cost $100-200/linear ft; custom can be $500+/linear ft.',
      whatToAsk: 'What cabinet brand and line are you proposing? Can you specify the door style, material, and finish?'
    },
    {
      pattern: /(?:new|install|replace)\s+(?:tile|flooring)(?!\s+(:|with|brand|\d+x\d+|porcelain|ceramic|marble|travertine))/gi,
      issue: 'Flooring material not specified',
      whyBad: 'A "tile floor" could mean $2/sq ft ceramic or $15/sq ft imported porcelain.',
      whatToAsk: 'What tile brand, size, and grade are you including?'
    },
    {
      pattern: /paint\s+(the\s+)?(room|wall|interior|exterior|house)s?(?!\s+(with|using|brand|sherwin|benjamin|behr|\d+\s*coats?))/gi,
      issue: 'Paint brand/quality not specified',
      whyBad: 'Paint quality affects coverage and durability. Premium paint lasts 10-15 years; builder-grade may need repainting in 3-5 years.',
      whatToAsk: 'What paint brand and line are you using? How many coats? Is primer included?'
    },
    {
      pattern: /(?:new|install|replace)\s+countertops?(?!\s+(:|with|brand|granite|quartz|cambria|silestone|caesarstone|marble|\d+\s*sq))/gi,
      issue: 'Countertop material not specified',
      whyBad: 'Countertop materials range from $20/sq ft (laminate) to $200+/sq ft (exotic stone).',
      whatToAsk: 'What countertop material and brand are you including? What edge profile?'
    },
    {
      pattern: /update\s+(the\s+)?(plumbing|electrical|wiring)/gi,
      issue: 'Vague plumbing/electrical scope',
      whyBad: '"Update plumbing" could mean replacing a faucet ($200) or re-piping a house ($15,000).',
      whatToAsk: 'Can you itemize exactly what plumbing/electrical work is included?'
    },
    {
      pattern: /(?:new|install|replace)\s+fixtures?(?!\s+(:|brand|kohler|moen|delta|model))/gi,
      issue: 'Fixture specifications missing',
      whyBad: 'A "new faucet" could be a $50 builder-grade piece or a $500 Kohler.',
      whatToAsk: 'What brands and model numbers for all fixtures?'
    }
  ];
  
  const findings: { issue: string; whyBad: string; whatToAsk: string; snippet: string }[] = [];
  
  vaguePatterns.forEach(({ pattern, issue, whyBad, whatToAsk }) => {
    const match = bidText.match(pattern);
    if (match) {
      findings.push({ issue, whyBad, whatToAsk, snippet: extractSnippet(bidText, match, 20) });
    }
  });
  
  const hasMeasurements = /\d+\s*(sq\.?\s*ft|square\s*feet|linear\s*feet|lin\.?\s*ft|lf|sf)/i.test(bidText);
  if (!hasMeasurements && bidText.length > 300) {
    findings.push({
      issue: 'No measurements included',
      whyBad: "Without square footage or linear feet, you can't verify pricing or compare bids.",
      whatToAsk: 'Can you include all measurements (square footage for flooring/painting, linear feet for cabinets)?',
      snippet: ''
    });
  }
  
  const qualityBrands = /kohler|moen|delta|schluter|kraftmaid|sherwin|benjamin\s*moore|behr|cambria|silestone|caesarstone|emser|daltile|toto|american\s*standard|grohe|hansgrohe/i;
  if (!qualityBrands.test(bidText) && bidText.length > 300) {
    findings.push({
      issue: 'No brand names mentioned',
      whyBad: 'Professional bids specify brands because materials are 40-60% of project cost.',
      whatToAsk: 'Can you provide brand names and model numbers for all major materials?',
      snippet: ''
    });
  }
  
  if (findings.length > 0) {
    const highlights = findings.filter(f => f.snippet).map(f => `"${f.snippet}"`).slice(0, 2);
    
    flags.push({
      id: 'vague-scope',
      category: 'vagueness',
      level: findings.length >= 3 ? 'high' : 'medium',
      title: 'Scope Lacks Critical Details',
      description: `Found ${findings.length} areas without proper specifications: ${findings.map(f => f.issue).slice(0, 3).join('; ')}`,
      whyItMatters: findings[0].whyBad,
      recommendation: findings[0].whatToAsk,
      highlights: highlights.length > 0 ? highlights : undefined,
      clause: 'Work Specs and Timeline'
    });
    
    findings.slice(0, 2).forEach(f => {
      talkTrack.push(f.whatToAsk);
    });
  }
}

/**
 * Red Flag Patterns
 */
function analyzeRedFlagPatterns(bidText: string, flags: AnalysisFlag[]) {
  const enhancedPatterns = [
    {
      pattern: /as\s+needed|if\s+necessary|where\s+required/i,
      title: '"As Needed" Language Detected',
      description: 'This phrase is a blank check. What triggers "as needed"? Who decides?',
      whyItMatters: '"As needed" clauses are the #1 source of change orders.',
      recommendation: 'Replace with specific quantities and conditions.'
    },
    {
      pattern: /unforeseen\s+(condition|circumstance|issue)|hidden\s+(condition|damage|issue)/i,
      title: 'Unforeseen Conditions Language',
      description: 'The bid mentions unforeseen or hidden conditions that may lead to additional charges.',
      whyItMatters: 'Vague language about "unforeseen conditions" is sometimes used to lowball bids then add charges later.',
      recommendation: 'Add: "Any unforeseen condition must be documented with photos and a written estimate before work proceeds."'
    }
  ];
  
  enhancedPatterns.forEach(({ pattern, title, description, whyItMatters, recommendation }) => {
    const regex = new RegExp(pattern.source, pattern.flags);
    const execMatch = regex.exec(bidText);
    
    if (execMatch && !flags.some(f => f.title === title)) {
      const matchedPhrase = execMatch[0];
      const snippet = extractSnippet(bidText, execMatch, 40);
      
      flags.push({
        id: `pattern-${title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`,
        category: 'scope',
        level: 'medium',
        title,
        description: `Found: "${matchedPhrase}" - ${description}`,
        whyItMatters,
        recommendation,
        highlights: [snippet]
      });
    }
  });
}

/**
 * Cost Benchmarks
 */
const HOMEWYSE_BENCHMARKS: Array<{
  keywords: RegExp;
  item: string;
  unit: string;
  marketLow: number;
  marketHigh: number;
  homewysePath: string;
}> = [
  { keywords: /hardwood\s*(floor|install)/i, item: 'Hardwood Flooring', unit: 'per sq ft', marketLow: 12, marketHigh: 22, homewysePath: 'cost_to_install_hardwood_floor' },
  { keywords: /laminate\s*(floor|install)/i, item: 'Laminate Flooring', unit: 'per sq ft', marketLow: 6, marketHigh: 12, homewysePath: 'cost_to_install_laminate_flooring' },
  { keywords: /vinyl\s*(plank|floor|lvp)/i, item: 'Vinyl Plank Flooring', unit: 'per sq ft', marketLow: 5, marketHigh: 11, homewysePath: 'cost_to_install_vinyl_plank_flooring' },
  { keywords: /carpet/i, item: 'Carpet Installation', unit: 'per sq ft', marketLow: 4, marketHigh: 9, homewysePath: 'cost_to_install_carpet' },
  { keywords: /ceramic\s*tile/i, item: 'Ceramic Tile', unit: 'per sq ft', marketLow: 10, marketHigh: 18, homewysePath: 'cost_to_install_ceramic_tile_floor' },
  { keywords: /porcelain\s*tile/i, item: 'Porcelain Tile', unit: 'per sq ft', marketLow: 12, marketHigh: 22, homewysePath: 'cost_to_install_porcelain_tile_floor' },
  { keywords: /tile\s*(floor|install|backsplash)/i, item: 'Tile Installation', unit: 'per sq ft', marketLow: 10, marketHigh: 20, homewysePath: 'cost_to_install_ceramic_tile_floor' },
  { keywords: /cabinet/i, item: 'Cabinet Installation', unit: 'per linear ft', marketLow: 150, marketHigh: 380, homewysePath: 'cost_to_install_kitchen_cabinets' },
  { keywords: /granite\s*(counter|top)/i, item: 'Granite Countertops', unit: 'per sq ft', marketLow: 75, marketHigh: 150, homewysePath: 'cost_to_install_granite_countertop' },
  { keywords: /quartz\s*(counter|top)/i, item: 'Quartz Countertops', unit: 'per sq ft', marketLow: 80, marketHigh: 160, homewysePath: 'cost_to_install_quartz_countertop' },
  { keywords: /counter\s*top/i, item: 'Countertop Installation', unit: 'per sq ft', marketLow: 50, marketHigh: 120, homewysePath: 'cost_to_install_laminate_countertop' },
  { keywords: /interior\s*paint|paint\s*(room|wall|interior)/i, item: 'Interior Painting', unit: 'per sq ft', marketLow: 2, marketHigh: 5, homewysePath: 'cost_to_paint_interior_wall' },
  { keywords: /exterior\s*paint|paint\s*(house|exterior|siding)/i, item: 'Exterior Painting', unit: 'per sq ft', marketLow: 1.50, marketHigh: 4, homewysePath: 'cost_to_paint_house_exterior' },
  { keywords: /cabinet\s*(paint|refinish)/i, item: 'Cabinet Painting', unit: 'per linear ft', marketLow: 35, marketHigh: 70, homewysePath: 'cost_to_refinish_kitchen_cabinets' },
  { keywords: /bathroom\s*(remodel|renovation)/i, item: 'Bathroom Remodel', unit: 'per project', marketLow: 6500, marketHigh: 18000, homewysePath: 'cost_to_remodel_a_bathroom' },
  { keywords: /shower\s*(install|tile|replace)/i, item: 'Shower Installation', unit: 'per project', marketLow: 2800, marketHigh: 6500, homewysePath: 'cost_to_install_shower' },
  { keywords: /toilet/i, item: 'Toilet Installation', unit: 'each', marketLow: 220, marketHigh: 450, homewysePath: 'cost_to_install_toilet' },
  { keywords: /vanity/i, item: 'Vanity Installation', unit: 'each', marketLow: 350, marketHigh: 900, homewysePath: 'cost_to_install_bathroom_vanity' },
  { keywords: /kitchen\s*(remodel|renovation)/i, item: 'Kitchen Remodel', unit: 'per project', marketLow: 15000, marketHigh: 45000, homewysePath: 'cost_to_remodel_a_kitchen' },
  { keywords: /roof(ing)?\s*(replace|install|shingle)/i, item: 'Roof Replacement', unit: 'per sq ft', marketLow: 4, marketHigh: 9, homewysePath: 'cost_to_install_an_asphalt_shingle_roof' },
  { keywords: /metal\s*roof/i, item: 'Metal Roofing', unit: 'per sq ft', marketLow: 8, marketHigh: 16, homewysePath: 'cost_to_install_metal_roofing' },
  { keywords: /deck\s*(build|install|construct)/i, item: 'Deck Construction', unit: 'per sq ft', marketLow: 30, marketHigh: 60, homewysePath: 'cost_to_build_a_deck' },
  { keywords: /composite\s*deck/i, item: 'Composite Decking', unit: 'per sq ft', marketLow: 40, marketHigh: 75, homewysePath: 'cost_to_install_composite_decking' },
  { keywords: /hvac|air\s*condition|ac\s*(unit|install|replace)/i, item: 'HVAC Installation', unit: 'per unit', marketLow: 5500, marketHigh: 12000, homewysePath: 'cost_to_install_central_air_conditioning' },
  { keywords: /furnace/i, item: 'Furnace Installation', unit: 'per unit', marketLow: 3500, marketHigh: 7500, homewysePath: 'cost_to_install_a_furnace' },
  { keywords: /water\s*heater/i, item: 'Water Heater Installation', unit: 'each', marketLow: 1200, marketHigh: 2800, homewysePath: 'cost_to_install_a_water_heater' },
  { keywords: /window\s*(install|replace)/i, item: 'Window Installation', unit: 'per window', marketLow: 450, marketHigh: 1100, homewysePath: 'cost_to_install_windows' },
  { keywords: /door\s*(install|replace|entry|exterior)/i, item: 'Door Installation', unit: 'each', marketLow: 500, marketHigh: 1400, homewysePath: 'cost_to_install_an_entry_door' },
  { keywords: /drywall|sheetrock/i, item: 'Drywall Installation', unit: 'per sq ft', marketLow: 2, marketHigh: 4, homewysePath: 'cost_to_install_drywall' },
  { keywords: /electrical\s*(panel|upgrade)/i, item: 'Electrical Panel Upgrade', unit: 'per project', marketLow: 1500, marketHigh: 3500, homewysePath: 'cost_to_upgrade_an_electrical_panel' },
  { keywords: /concrete\s*(pour|slab|patio|driveway)/i, item: 'Concrete Work', unit: 'per sq ft', marketLow: 8, marketHigh: 18, homewysePath: 'cost_to_install_a_concrete_slab' },
  { keywords: /fence\s*(install|build|wood|privacy)/i, item: 'Fence Installation', unit: 'per linear ft', marketLow: 25, marketHigh: 55, homewysePath: 'cost_to_install_a_wood_fence' },
];

function generateBenchmarks(bidText: string): CostBenchmark[] {
  const benchmarks: CostBenchmark[] = [];
  
  for (const benchmark of HOMEWYSE_BENCHMARKS) {
    if (benchmark.keywords.test(bidText)) {
      if (!benchmarks.some(b => b.item === benchmark.item)) {
        benchmarks.push({
          item: benchmark.item,
          quotedPrice: 0,
          marketLow: benchmark.marketLow,
          marketHigh: benchmark.marketHigh,
          status: 'unknown',
          unit: benchmark.unit,
          homewysePath: benchmark.homewysePath
        });
      }
    }
  }
  
  return benchmarks.slice(0, 5);
}

/**
 * Extract bid total from text - looks for labeled totals first, then falls back to 
 * the largest amounts found. Filters out small amounts that are clearly line items.
 */
export function extractBidTotal(bidText: string): number | undefined {
  if (!bidText || typeof bidText !== 'string') {
    return undefined;
  }
  
  // Minimum threshold for a valid project total
  // Small maintenance/repair jobs might be $500+, but most remodels are $1000+
  const MIN_PROJECT_TOTAL = 500;
  
  // First, try to find explicitly labeled totals (most reliable)
  // These patterns look for "total", "grand total", etc. followed by an amount
  const totalPatterns = [
    // "Grand Total: $X" or "Project Total $X" patterns
    /(?:grand\s*total|project\s*total|bid\s*total|estimate\s*total|contract\s*(?:price|amount|total)|total\s*(?:price|cost|amount|due|estimate|contract))[:\s]*\$?\s*([\d,]+(?:\.\d{2})?)/gi,
    // "Total: $X" or "Amount Due: $X"
    /(?:^|\n)\s*(?:total|amount\s*due|balance\s*due|subtotal)[:\s]*\$?\s*([\d,]+(?:\.\d{2})?)/gim,
    // "$X Total" or "$X Grand Total" (amount before label)
    /\$\s*([\d,]+(?:\.\d{2})?)\s*(?:grand\s*)?total\b/gi,
    // Look for totals in table-like formats: "TOTAL    $X"
    /\b(?:total|TOTAL)\s+\$?\s*([\d,]+(?:\.\d{2})?)\s*$/gm,
  ];
  
  const labeledAmounts: number[] = [];
  
  for (const pattern of totalPatterns) {
    const matches = [...bidText.matchAll(pattern)];
    for (const match of matches) {
      const amount = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(amount) && amount >= MIN_PROJECT_TOTAL) {
        labeledAmounts.push(amount);
      }
    }
  }
  
  // If we found labeled totals, return the largest one
  if (labeledAmounts.length > 0) {
    return Math.round(Math.max(...labeledAmounts));
  }
  
  // Fallback: Find all dollar amounts >= $500 (filter out small line items like $50 permit fees)
  const pricePattern = /\$\s*([\d,]+(?:\.\d{2})?)/g;
  const amounts: number[] = [];
  
  let match;
  while ((match = pricePattern.exec(bidText)) !== null) {
    const amount = parseFloat(match[1].replace(/,/g, ''));
    if (!isNaN(amount) && amount >= MIN_PROJECT_TOTAL) {
      amounts.push(amount);
    }
  }
  
  // Also look for larger numbers without $ sign that might be totals
  // Only accept values >= $1000 to avoid false positives from years, counts, etc.
  const unlabeledPattern = /(?:total|amount|price|cost|due|estimate|quote|proposal)[:\s]*([\d,]+(?:\.\d{2})?)\b/gi;
  let unlabeledMatch;
  while ((unlabeledMatch = unlabeledPattern.exec(bidText)) !== null) {
    const amount = parseFloat(unlabeledMatch[1].replace(/,/g, ''));
    if (!isNaN(amount) && amount >= 1000) {
      amounts.push(amount);
    }
  }
  
  if (amounts.length === 0) {
    return undefined;
  }
  
  // For fallback, prefer the largest single amount
  // The largest amount is most likely to be a total, subtotal, or summary figure
  // Don't sum amounts as that could double-count (subtotal + total in same doc)
  const largestAmount = Math.max(...amounts);
  
  // Additional sanity check: if we only found one amount and it's small,
  // it might not be a project total - but we'll return it anyway as best guess
  return Math.round(largestAmount);
}
