/**
 * Labor Ratio Validation
 * Detects suspicious labor/material splits using Houzz industry benchmarks
 */

import { getExpectedLaborRatio, type ProjectType } from './houzzBenchmarks';
import type { TradeCategory } from './tradeDetection';
import type { AnalysisFlag } from './analysisEngine';

interface LaborMaterialSplit {
  laborAmount: number;
  materialAmount: number;
  laborPercent: number;
  materialPercent: number;
  total: number;
}

/**
 * Extract labor and material breakdown from bid text
 */
export function extractLaborMaterialSplit(bidText: string): LaborMaterialSplit | null {
  // Pattern 1: Explicit breakdown with labeled amounts
  // "Labor: $5,000" and "Materials: $10,000"
  const laborPattern = /labor\s*(?:cost|charge)?[:\s]*\$?\s*([\d,]+(?:\.\d{2})?)/i;
  const materialPattern = /material(?:s)?\s*(?:cost|charge)?[:\s]*\$?\s*([\d,]+(?:\.\d{2})?)/i;
  
  const laborMatch = bidText.match(laborPattern);
  const materialMatch = bidText.match(materialPattern);
  
  if (laborMatch && materialMatch) {
    const laborAmount = parseFloat(laborMatch[1].replace(/,/g, ''));
    const materialAmount = parseFloat(materialMatch[1].replace(/,/g, ''));
    
    if (!isNaN(laborAmount) && !isNaN(materialAmount) && laborAmount > 0 && materialAmount > 0) {
      const total = laborAmount + materialAmount;
      return {
        laborAmount,
        materialAmount,
        laborPercent: (laborAmount / total) * 100,
        materialPercent: (materialAmount / total) * 100,
        total
      };
    }
  }
  
  // Pattern 2: Percentage-based breakdown
  // "40% labor, 60% materials" or "Labor: 35% Materials: 65%"
  const percentPattern = /labor[:\s]*([\d.]+)%.*?material(?:s)?[:\s]*([\d.]+)%|material(?:s)?[:\s]*([\d.]+)%.*?labor[:\s]*([\d.]+)%/i;
  const percentMatch = bidText.match(percentPattern);
  
  if (percentMatch) {
    let laborPercent: number;
    let materialPercent: number;
    
    if (percentMatch[1] && percentMatch[2]) {
      // "labor: X% ... materials: Y%"
      laborPercent = parseFloat(percentMatch[1]);
      materialPercent = parseFloat(percentMatch[2]);
    } else {
      // "materials: X% ... labor: Y%"
      materialPercent = parseFloat(percentMatch[3]);
      laborPercent = parseFloat(percentMatch[4]);
    }
    
    if (!isNaN(laborPercent) && !isNaN(materialPercent)) {
      return {
        laborAmount: 0,
        materialAmount: 0,
        laborPercent,
        materialPercent,
        total: 0
      };
    }
  }
  
  return null;
}

/**
 * Map trade category to Houzz project type
 */
function mapTradeToProjectType(trade: TradeCategory): ProjectType | null {
  const mapping: Record<string, ProjectType> = {
    'kitchen-remodel': 'kitchen',
    'bathroom-remodel': 'bathroom',
    'roofing': 'roof',
    'addition': 'home-addition',
    'windows-doors': 'window',
    'basement-finishing': 'basement',
    'hvac': 'ac-installation',
    'flooring': 'hardwood-floor', // Default to hardwood
    'painting': 'exterior-painting',
    'siding': 'vinyl-siding'
  };
  
  return mapping[trade] || null;
}

/**
 * Validate labor ratio against Houzz benchmarks
 */
export function validateLaborRatio(
  bidText: string,
  primaryTrade: TradeCategory,
  _bidTotal: number | null,
  flags: AnalysisFlag[]
): void {
  const split = extractLaborMaterialSplit(bidText);
  if (!split) {
    return; // No labor/material breakdown found
  }
  
  const projectType = mapTradeToProjectType(primaryTrade);
  if (!projectType) {
    return; // No Houzz benchmark for this trade
  }
  
  const expectedRatio = getExpectedLaborRatio(projectType);
  if (!expectedRatio) {
    return; // No labor ratio data for this project type
  }
  
  const { laborPercent, materialPercent } = split;
  const minPercent = expectedRatio.low;
  const maxPercent = expectedRatio.high;
  const typicalPercent = (minPercent + maxPercent) / 2;
  
  // Check if labor ratio is suspiciously high
  if (laborPercent > maxPercent * 1.15) {
    const deviation = Math.round(laborPercent - typicalPercent);
    flags.push({
      id: 'labor-ratio-high',
      category: 'financial',
      level: 'medium',
      title: 'Labor Costs Higher Than Industry Norm',
      description: `This bid shows ${laborPercent.toFixed(0)}% labor vs ${materialPercent.toFixed(0)}% materials. Industry data for ${projectType.replace(/-/g, ' ')} projects shows typical labor is ${typicalPercent}% (range: ${minPercent}-${maxPercent}%).`,
      whyItMatters: `Labor costs are ${deviation}% above typical. This could indicate inflated pricing, inefficient work methods, or inclusion of items that should be materials.`,
      recommendation: `Ask the contractor to explain the labor breakdown and compare with 2-3 other quotes to verify pricing.`
    });
  }
  
  // Check if labor ratio is suspiciously low (might indicate unlicensed subbing or material markup)
  if (laborPercent < minPercent * 0.85) {
    const deviation = Math.round(typicalPercent - laborPercent);
    flags.push({
      id: 'labor-ratio-low',
      category: 'financial',
      level: 'medium',
      title: 'Labor Costs Lower Than Industry Norm',
      description: `This bid shows ${laborPercent.toFixed(0)}% labor vs ${materialPercent.toFixed(0)}% materials. Industry data for ${projectType.replace(/-/g, ' ')} projects shows typical labor is ${typicalPercent}% (range: ${minPercent}-${maxPercent}%).`,
      whyItMatters: `Labor is ${deviation}% below typical. This could indicate: (1) markup hidden in materials, (2) use of unlicensed subcontractors, or (3) rushed/low-quality workmanship.`,
      recommendation: `Ask: "Your labor percentage seems low for this type of work. Can you explain how you're achieving this pricing while maintaining quality?"`
    });
  }
  
  // Special case: exterior painting should be 80-85% labor
  if (projectType === 'exterior-painting' && laborPercent < 75) {
    flags.push({
      id: 'painting-labor-suspiciously-low',
      category: 'financial',
      level: 'high',
      title: 'Painting Labor Percentage Is Unusually Low',
      description: `Exterior painting should be 80-85% labor since materials (paint) are a small part of the cost. This bid shows only ${laborPercent.toFixed(0)}% labor.`,
      whyItMatters: `Low labor percentage in painting suggests either inflated material costs or the contractor is rushing the job with minimal prep work.`,
      recommendation: `Ask for detailed breakdown of surface prep, primer coats, and finish coats. Quality painting requires significant labor for prep and multiple coats.`
    });
  }
}

/**
 * Format labor/material split for display
 */
export function formatLaborMaterialSplit(split: LaborMaterialSplit): string {
  if (split.total > 0) {
    return `Labor: $${split.laborAmount.toLocaleString()} (${split.laborPercent.toFixed(0)}%), Materials: $${split.materialAmount.toLocaleString()} (${split.materialPercent.toFixed(0)}%)`;
  } else {
    return `Labor: ${split.laborPercent.toFixed(0)}%, Materials: ${split.materialPercent.toFixed(0)}%`;
  }
}
