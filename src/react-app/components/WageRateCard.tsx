/**
 * WageRateCard - Shows contractor's implied hourly rate vs BLS market average
 * Part of Tier 1 Data Enrichment (Task #101)
 */

import { useMemo } from 'react';
import { DollarSign, Users, TrendingUp, TrendingDown, CheckCircle, Info, Database } from 'lucide-react';
import { ConfidenceIndicator, type ConfidenceLevel } from '@/react-app/components/ui/ConfidenceIndicator';
import { extractLaborMaterialSplit } from '@/shared/laborRatioValidation';

interface LaborMaterialSplit {
  laborAmount: number;
  materialAmount: number;
  laborPercent: number;
  materialPercent: number;
  total: number;
}
import { NATIONAL_WAGE_DATA, STATE_WAGE_DATA, getBurdenMultiplier, type OewsWageData } from '@/shared/blsOewsData';
import type { TradeCategory } from '@/shared/tradeDetection';

interface WageRateCardProps {
  bidContent: string;
  primaryTrade?: TradeCategory;
  stateCode?: string;
  squareFootage?: number | null;
  projectType?: string | null;
}

// Map trade categories to BLS SOC codes
const TRADE_TO_SOC: Record<string, string> = {
  'electrical': '47-2111',      // Electricians
  'plumbing': '47-2152',        // Plumbers
  'hvac': '49-9021',            // HVAC Mechanics
  'roofing': '47-2181',         // Roofers
  'flooring': '47-2042',        // Floor Layers
  'painting': '47-2141',        // Painters
  'drywall': '47-2081',         // Drywall Installers
  'tile': '47-2044',            // Tile Setters
  'carpentry': '47-2031',       // Carpenters
  'concrete': '47-2051',        // Cement Masons
  'masonry': '47-2021',         // Brickmasons
  'insulation': '47-2131',      // Insulation Workers
  'windows-doors': '47-2121',   // Glaziers
  'siding': '47-2031',          // Carpenters (siding typically done by carpenters)
  'kitchen': '47-2031',         // General remodel - carpenters
  'bathroom': '47-2152',        // Bathroom - plumbers
  'basement': '47-2031',        // Basement - carpenters
  'general': '47-2061',         // Construction Laborers
};

// Estimated labor hours per project type/square footage
// Based on industry standards and RS Means data
const HOURS_PER_SF: Record<string, { low: number; typical: number; high: number }> = {
  'kitchen': { low: 0.8, typical: 1.2, high: 1.8 },       // Per SF of kitchen
  'bathroom': { low: 1.5, typical: 2.5, high: 4.0 },      // Per SF of bathroom
  'flooring': { low: 0.15, typical: 0.25, high: 0.4 },    // Per SF
  'painting': { low: 0.08, typical: 0.12, high: 0.18 },   // Per SF (interior)
  'roofing': { low: 0.06, typical: 0.10, high: 0.15 },    // Per SF
  'siding': { low: 0.08, typical: 0.12, high: 0.18 },     // Per SF
  'drywall': { low: 0.10, typical: 0.15, high: 0.22 },    // Per SF
  'tile': { low: 0.20, typical: 0.35, high: 0.50 },       // Per SF
  'basement': { low: 0.5, typical: 0.8, high: 1.2 },      // Per SF of basement
};



// Get BLS wage data for a trade in a location
function getWageData(socCode: string, stateCode?: string): OewsWageData | null {
  // Try state-specific data first
  if (stateCode) {
    const stateData = STATE_WAGE_DATA.find(d => d.soc_code === socCode && d.area_code === stateCode);
    if (stateData) return stateData;
  }
  
  // Fall back to national data
  return NATIONAL_WAGE_DATA.find(d => d.soc_code === socCode) || null;
}

// Estimate labor hours from project details
function estimateLaborHours(
  projectType: string | null,
  squareFootage: number | null,
  bidContent: string
): { hours: number; confidence: 'high' | 'medium' | 'low'; basis: string } | null {
  // Try to extract hours directly from bid
  const hoursMatch = bidContent.match(/(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:labor\s*)?hours?/i);
  if (hoursMatch) {
    const hours = parseFloat(hoursMatch[1].replace(/,/g, ''));
    if (hours > 0 && hours < 5000) {
      return { hours, confidence: 'high', basis: 'stated in bid' };
    }
  }
  
  // Try days x hours/day pattern
  const daysMatch = bidContent.match(/(\d+)\s*(?:work\s*)?days?/i);
  if (daysMatch) {
    const days = parseInt(daysMatch[1]);
    if (days > 0 && days < 200) {
      // Assume 8 hours per day
      return { hours: days * 8, confidence: 'medium', basis: `${days} days × 8 hrs/day` };
    }
  }
  
  // Estimate from square footage if available
  if (squareFootage && squareFootage > 0 && projectType) {
    const normalizedType = projectType.toLowerCase().replace(/\s+/g, '-');
    const hourRate = HOURS_PER_SF[normalizedType];
    if (hourRate) {
      const hours = squareFootage * hourRate.typical;
      return { 
        hours, 
        confidence: 'low', 
        basis: `estimated from ${squareFootage} sq ft` 
      };
    }
  }
  
  // Generic estimate based on labor cost
  // Assume $35-50/hr for skilled trades
  return null;
}

interface WageAnalysis {
  impliedRate: number;
  blsMedian: number;
  blsBillable: number; // With burden multiplier
  blsLow: number;
  blsHigh: number;
  occupationTitle: string;
  areaName: string;
  laborHours: number;
  hoursConfidence: 'high' | 'medium' | 'low';
  hoursBasis: string;
  status: 'normal' | 'high' | 'low';
  percentDiff: number;
  insight: string;
  recommendation: string;
}

function analyzeWageRate(
  split: LaborMaterialSplit,
  socCode: string,
  stateCode: string | undefined,
  laborHours: number,
  hoursConfidence: 'high' | 'medium' | 'low',
  hoursBasis: string
): WageAnalysis | null {
  const wageData = getWageData(socCode, stateCode);
  if (!wageData) return null;
  
  const burdenMultiplier = getBurdenMultiplier(socCode);
  const blsBillable = wageData.hourly_median * burdenMultiplier;
  const impliedRate = split.laborAmount / laborHours;
  
  // Calculate percentage difference from BLS billable rate
  const percentDiff = ((impliedRate - blsBillable) / blsBillable) * 100;
  
  // Determine status
  // Allow ±30% variance for "normal" range (contractor overhead, profit, etc.)
  let status: 'normal' | 'high' | 'low' = 'normal';
  let insight = '';
  let recommendation = '';
  
  if (percentDiff > 40) {
    status = 'high';
    insight = `The implied hourly rate ($${impliedRate.toFixed(0)}/hr) is ${Math.abs(percentDiff).toFixed(0)}% above typical market rates. This could indicate: premium-quality work, specialized expertise, or inflated labor charges.`;
    recommendation = 'Ask the contractor to justify the premium rate. Request references for similar premium projects they\'ve completed.';
  } else if (percentDiff > 20) {
    status = 'normal';
    insight = `The implied rate is ${percentDiff.toFixed(0)}% above market average, which is within the normal range for experienced contractors with good reputations.`;
    recommendation = 'The rate is reasonable for quality work. Verify the contractor\'s credentials and past work.';
  } else if (percentDiff < -30) {
    status = 'low';
    insight = `The implied hourly rate ($${impliedRate.toFixed(0)}/hr) is ${Math.abs(percentDiff).toFixed(0)}% below market rates. This could indicate: less experienced workers, cutting corners, or an unrealistic bid.`;
    recommendation = 'Ask: "How do you maintain quality at this rate?" Verify the contractor\'s qualifications carefully.';
  } else if (percentDiff < -15) {
    status = 'normal';
    insight = `The implied rate is ${Math.abs(percentDiff).toFixed(0)}% below market average. This could be a competitive bid or indicate a newer contractor building their portfolio.`;
    recommendation = 'Verify the contractor has proper licensing and insurance at this rate.';
  } else {
    insight = 'The implied hourly rate aligns well with BLS market data for this trade in your area.';
    recommendation = 'The labor pricing appears market-competitive. Focus on verifying workmanship quality.';
  }
  
  return {
    impliedRate,
    blsMedian: wageData.hourly_median,
    blsBillable,
    blsLow: wageData.hourly_25 * burdenMultiplier,
    blsHigh: wageData.hourly_75 * burdenMultiplier,
    occupationTitle: wageData.occupation_title,
    areaName: wageData.area_name,
    laborHours,
    hoursConfidence,
    hoursBasis,
    status,
    percentDiff,
    insight,
    recommendation,
  };
}

export default function WageRateCard({ 
  bidContent, 
  primaryTrade, 
  stateCode = 'GA',
  squareFootage,
  projectType 
}: WageRateCardProps) {
  const analysis = useMemo(() => {
    // Extract labor cost from bid
    const split = extractLaborMaterialSplit(bidContent);
    if (!split || split.laborAmount <= 0) return null;
    
    // Map trade to SOC code
    const tradeKey = primaryTrade?.toLowerCase() || projectType?.toLowerCase().replace(/\s+/g, '-') || 'general';
    const socCode = TRADE_TO_SOC[tradeKey] || TRADE_TO_SOC['general'];
    
    // Estimate labor hours
    const hoursEstimate = estimateLaborHours(projectType ?? null, squareFootage ?? null, bidContent);
    if (!hoursEstimate) {
      // Last resort: estimate from labor cost assuming $45/hr (industry average)
      const estimatedHours = split.laborAmount / 45;
      if (estimatedHours < 4 || estimatedHours > 2000) return null;
      
      return analyzeWageRate(split, socCode, stateCode, estimatedHours, 'low', 'rough estimate');
    }
    
    return analyzeWageRate(
      split, 
      socCode, 
      stateCode, 
      hoursEstimate.hours, 
      hoursEstimate.confidence, 
      hoursEstimate.basis
    );
  }, [bidContent, primaryTrade, stateCode, squareFootage, projectType]);
  
  // Don't render if no analysis possible
  if (!analysis) return null;
  
  const {
    impliedRate,
    blsBillable,
    blsLow,
    blsHigh,
    occupationTitle,
    areaName,
    laborHours,
    hoursConfidence,
    hoursBasis,
    status,
    percentDiff,
    insight,
    recommendation,
  } = analysis;
  
  // Status colors and icons
  const statusConfig = {
    normal: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      icon: CheckCircle,
      iconColor: 'text-emerald-600',
      label: 'Market-Competitive Rate',
      labelColor: 'text-emerald-700',
    },
    high: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: TrendingUp,
      iconColor: 'text-amber-600',
      label: 'Above Market Rate',
      labelColor: 'text-amber-700',
    },
    low: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: TrendingDown,
      iconColor: 'text-amber-600',
      label: 'Below Market Rate',
      labelColor: 'text-amber-700',
    },
  };
  
  const config = statusConfig[status];
  const StatusIcon = config.icon;
  
  // Confidence badge
  const confidenceConfig = {
    high: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'High confidence' },
    medium: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Medium confidence' },
    low: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Estimated' },
  };
  const confConfig = confidenceConfig[hoursConfidence];
  
  return (
    <div className="bg-white rounded-2xl border-2 border-teal-100 shadow-sm overflow-hidden">
      {/* Top accent */}
      <div className="h-1 bg-gradient-to-r from-teal-400 to-cyan-500" />
      
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-teal-100">
              <DollarSign className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-navy-900">Wage Rate Check</h3>
              <p className="text-sm text-slate-500">Contractor rate vs BLS market data</p>
            </div>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${confConfig.bg} ${confConfig.text}`}>
            {confConfig.label}
          </div>
        </div>
        
        {/* Rate Comparison Visual */}
        <div className="mb-5">
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* This Bid */}
            <div className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl border border-teal-100">
              <div className="text-sm text-slate-600 mb-1">This Bid's Rate</div>
              <div className="text-2xl font-bold text-teal-700">${impliedRate.toFixed(0)}<span className="text-base font-normal">/hr</span></div>
              <div className="text-xs text-slate-500 mt-1">
                ${analysis.impliedRate > 999 ? (analysis.impliedRate / 1000).toFixed(1) + 'k' : analysis.impliedRate.toFixed(0)} labor ÷ {laborHours.toFixed(0)} hrs
              </div>
            </div>
            
            {/* BLS Market Rate */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-sm text-slate-600 mb-1">Market Rate ({areaName.split(',')[0]})</div>
              <div className="text-2xl font-bold text-slate-700">${blsBillable.toFixed(0)}<span className="text-base font-normal">/hr</span></div>
              <div className="text-xs text-slate-500 mt-1">
                ${blsLow.toFixed(0)} – ${blsHigh.toFixed(0)} typical range
              </div>
            </div>
          </div>
          
          {/* Visual Comparison Bar */}
          <div className="relative">
            <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
              {/* Market range background */}
              <div 
                className="absolute h-full bg-slate-300"
                style={{ 
                  left: `${Math.max(0, (blsLow / (blsHigh * 1.5)) * 100)}%`,
                  width: `${((blsHigh - blsLow) / (blsHigh * 1.5)) * 100}%`
                }}
              />
              {/* BLS median marker */}
              <div 
                className="absolute h-full w-0.5 bg-slate-500"
                style={{ left: `${(blsBillable / (blsHigh * 1.5)) * 100}%` }}
              />
            </div>
            {/* Bid rate marker */}
            <div 
              className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md ${
                status === 'normal' ? 'bg-emerald-500' : status === 'high' ? 'bg-amber-500' : 'bg-amber-500'
              }`}
              style={{ 
                left: `calc(${Math.min(100, Math.max(0, (impliedRate / (blsHigh * 1.5)) * 100))}% - 8px)`,
                top: '50%'
              }}
            />
            <div className="flex justify-between mt-1.5 text-xs text-slate-400">
              <span>$0</span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                Market: ${blsBillable.toFixed(0)}
              </span>
              <span>${(blsHigh * 1.5).toFixed(0)}+</span>
            </div>
          </div>
          
          {/* Occupation & Hours Info */}
          <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{occupationTitle}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>Hours: {laborHours.toFixed(0)} ({hoursBasis})</span>
            </div>
          </div>
        </div>
        
        {/* Status Banner */}
        <div className={`${config.bg} ${config.border} border rounded-xl p-4 mb-4`}>
          <div className="flex items-start gap-3">
            <StatusIcon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className={`text-sm font-semibold ${config.labelColor}`}>{config.label}</p>
                {status !== 'normal' && (
                  <span className={`text-xs ${config.labelColor}`}>
                    ({percentDiff > 0 ? '+' : ''}{percentDiff.toFixed(0)}% vs market)
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-700">{insight}</p>
            </div>
          </div>
        </div>
        
        {/* Recommendation */}
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-teal-800 mb-1">What to Do</p>
              <p className="text-sm text-teal-700">{recommendation}</p>
            </div>
          </div>
        </div>
        
        {/* Confidence Indicator */}
        <div className="mb-3">
          <ConfidenceIndicator 
            level={hoursConfidence as ConfidenceLevel} 
            reason={hoursConfidence === 'high' 
              ? `Hours from bid (${hoursBasis}), ${areaName.includes('National') ? 'national' : 'state'} wage data`
              : hoursConfidence === 'medium'
              ? `Hours estimated (${hoursBasis}), ${areaName.includes('National') ? 'national' : 'state'} wage data`
              : `Rough hours estimate, ${areaName.includes('National') ? 'national' : 'state'} wage data`
            }
            showDescription={true}
          />
        </div>
        
        {/* Data Attribution */}
        <div className="pt-3 mt-3 border-t border-slate-100">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <Database className="w-3 h-3" />
            <span>
              Source:{' '}
              <a 
                href="https://www.bls.gov/oes/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-500 hover:text-teal-600 transition-colors"
              >
                BLS Occupational Employment Statistics (May 2023)
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
