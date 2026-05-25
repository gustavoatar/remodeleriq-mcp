/**
 * LaborBreakdownCard - Shows bid's labor/material split vs Houzz industry benchmarks
 * Part of Tier 1 Data Enrichment
 */

import { useMemo } from 'react';
import { HardHat, Package, AlertTriangle, CheckCircle, Info, Database } from 'lucide-react';
import { ConfidenceIndicator } from '@/react-app/components/ui/ConfidenceIndicator';
import { extractLaborMaterialSplit } from '@/shared/laborRatioValidation';
import { HOUZZ_BENCHMARKS } from '@/shared/houzzBenchmarks';

interface LaborMaterialSplit {
  laborAmount: number;
  materialAmount: number;
  laborPercent: number;
  materialPercent: number;
  total: number;
}
import { getExpectedLaborRatio, type ProjectType } from '@/shared/houzzBenchmarks';
import type { TradeCategory } from '@/shared/tradeDetection';

interface LaborBreakdownCardProps {
  bidContent: string;
  projectType: string | null;
  primaryTrade?: TradeCategory;
  bidTotal?: number | null;
}

// Map project type strings to Houzz ProjectType
function mapToHouzzProjectType(projectType: string | null, primaryTrade?: TradeCategory): ProjectType | null {
  if (!projectType && !primaryTrade) return null;
  
  const normalizedType = (projectType || primaryTrade || '').toLowerCase().replace(/\s+/g, '-');
  
  const mapping: Record<string, ProjectType> = {
    'kitchen': 'kitchen',
    'kitchen-remodel': 'kitchen',
    'bathroom': 'bathroom',
    'bathroom-remodel': 'bathroom',
    'roof': 'roof',
    'roofing': 'roof',
    'roof-replacement': 'roof',
    'addition': 'home-addition',
    'home-addition': 'home-addition',
    'window': 'window',
    'windows': 'window',
    'windows-doors': 'window',
    'basement': 'basement',
    'basement-finishing': 'basement',
    'basement-remodel': 'basement',
    'hvac': 'ac-installation',
    'ac': 'ac-installation',
    'ac-installation': 'ac-installation',
    'flooring': 'hardwood-floor',
    'hardwood': 'hardwood-floor',
    'hardwood-floor': 'hardwood-floor',
    'laminate': 'laminate-floor',
    'laminate-floor': 'laminate-floor',
    'painting': 'exterior-painting',
    'exterior-painting': 'exterior-painting',
    'siding': 'vinyl-siding',
    'vinyl-siding': 'vinyl-siding',
    'carpet': 'carpet',
    'water-heater': 'water-heater',
    'furnace': 'furnace',
    'patio': 'paver-patio',
    'paver-patio': 'paver-patio',
    'countertops': 'countertops-granite',
  };
  
  return mapping[normalizedType] || null;
}

// Get friendly project name
function getProjectDisplayName(projectType: ProjectType): string {
  const names: Record<ProjectType, string> = {
    'kitchen': 'Kitchen Remodel',
    'bathroom': 'Bathroom Remodel',
    'roof': 'Roof Replacement',
    'home-addition': 'Home Addition',
    'window': 'Window Installation',
    'countertops-kitchen': 'Kitchen Countertops',
    'countertops-granite': 'Granite Countertops',
    'basement': 'Basement Finishing',
    'paver-patio': 'Paver Patio',
    'ac-installation': 'AC Installation',
    'hardwood-floor': 'Hardwood Flooring',
    'laminate-floor': 'Laminate Flooring',
    'exterior-painting': 'Exterior Painting',
    'vinyl-siding': 'Vinyl Siding',
    'carpet': 'Carpet Installation',
    'water-heater': 'Water Heater',
    'furnace': 'Furnace Installation',
  };
  return names[projectType] || projectType.replace(/-/g, ' ');
}

interface BreakdownAnalysis {
  split: LaborMaterialSplit;
  projectType: ProjectType;
  expectedLow: number;
  expectedHigh: number;
  expectedTypical: number;
  status: 'normal' | 'high' | 'low';
  deviation: number;
  insight: string;
  recommendation: string;
}

function analyzeBreakdown(
  split: LaborMaterialSplit,
  projectType: ProjectType
): BreakdownAnalysis | null {
  const expectedRatio = getExpectedLaborRatio(projectType);
  if (!expectedRatio) return null;
  
  const { laborPercent } = split;
  const expectedLow = expectedRatio.low;
  const expectedHigh = expectedRatio.high;
  const expectedTypical = (expectedLow + expectedHigh) / 2;
  
  let status: 'normal' | 'high' | 'low' = 'normal';
  let deviation = 0;
  let insight = '';
  let recommendation = '';
  
  // Check if labor ratio is suspiciously high (>15% above max)
  if (laborPercent > expectedHigh * 1.15) {
    status = 'high';
    deviation = Math.round(laborPercent - expectedTypical);
    insight = `Labor is ${deviation}% above the typical range. This could indicate inflated hourly rates or inefficient work planning.`;
    recommendation = 'Ask the contractor for a detailed labor hour breakdown and compare hourly rates with 2-3 other quotes.';
  }
  // Check if labor ratio is suspiciously low (<15% below min)
  else if (laborPercent < expectedLow * 0.85) {
    status = 'low';
    deviation = Math.round(expectedTypical - laborPercent);
    insight = `Labor is ${deviation}% below typical. This could indicate: markup hidden in materials, use of less experienced workers, or rushed workmanship.`;
    recommendation = 'Ask: "Your labor percentage seems low. Can you explain how you achieve quality work at this rate?"';
  }
  // Normal range
  else {
    insight = 'The labor/material split aligns with industry standards for this project type.';
    recommendation = 'The cost structure looks reasonable. Focus on verifying the contractor\'s qualifications and past work.';
  }
  
  return {
    split,
    projectType,
    expectedLow,
    expectedHigh,
    expectedTypical,
    status,
    deviation,
    insight,
    recommendation,
  };
}

export default function LaborBreakdownCard({ bidContent, projectType, primaryTrade }: LaborBreakdownCardProps) {
  const analysis = useMemo(() => {
    // Extract labor/material split from bid
    const split = extractLaborMaterialSplit(bidContent);
    if (!split) return null;
    
    // Map to Houzz project type
    const houzzType = mapToHouzzProjectType(projectType, primaryTrade);
    if (!houzzType) return null;
    
    return analyzeBreakdown(split, houzzType);
  }, [bidContent, projectType, primaryTrade]);
  
  // If no labor breakdown was found in the bid, don't render
  if (!analysis) return null;
  
  const { split, expectedLow, expectedHigh, expectedTypical, status, insight, recommendation } = analysis;
  const projectDisplayName = getProjectDisplayName(analysis.projectType);
  
  // Get Houzz citation URL
  const houzzBenchmarkKey = Object.keys(HOUZZ_BENCHMARKS).find(key => {
    const benchmark = HOUZZ_BENCHMARKS[key];
    return benchmark.projectType.toLowerCase().includes(analysis.projectType.toLowerCase().replace(/-/g, ' '));
  });
  const citationUrl = houzzBenchmarkKey ? HOUZZ_BENCHMARKS[houzzBenchmarkKey].citationUrl : null;
  
  // Status colors
  const statusConfig = {
    normal: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      icon: CheckCircle,
      iconColor: 'text-emerald-600',
      label: 'Within Normal Range',
      labelColor: 'text-emerald-700',
    },
    high: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
      label: 'Labor Higher Than Typical',
      labelColor: 'text-amber-700',
    },
    low: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
      label: 'Labor Lower Than Typical',
      labelColor: 'text-amber-700',
    },
  };
  
  const config = statusConfig[status];
  const StatusIcon = config.icon;
  
  return (
    <div className="bg-white rounded-2xl border-2 border-indigo-100 shadow-sm overflow-hidden">
      {/* Top accent */}
      <div className="h-1 bg-gradient-to-r from-indigo-400 to-purple-500" />
      
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-indigo-100">
            <HardHat className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-navy-900">Labor Cost Breakdown</h3>
            <p className="text-sm text-slate-500">How this bid splits costs vs industry data</p>
          </div>
        </div>
        
        {/* Visual Breakdown */}
        <div className="mb-5">
          {/* Bid's actual split */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium text-navy-700">This Bid</span>
              <span className="text-slate-500">
                {split.laborPercent.toFixed(0)}% Labor / {split.materialPercent.toFixed(0)}% Materials
              </span>
            </div>
            <div className="h-4 rounded-full overflow-hidden flex bg-slate-100">
              <div 
                className="bg-indigo-500 transition-all"
                style={{ width: `${split.laborPercent}%` }}
              />
              <div 
                className="bg-emerald-400 transition-all"
                style={{ width: `${split.materialPercent}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <HardHat className="w-3 h-3 text-indigo-500" />
                <span>Labor</span>
                {split.laborAmount > 0 && (
                  <span className="text-indigo-600 font-medium">(${split.laborAmount.toLocaleString()})</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Package className="w-3 h-3 text-emerald-500" />
                <span>Materials</span>
                {split.materialAmount > 0 && (
                  <span className="text-emerald-600 font-medium">(${split.materialAmount.toLocaleString()})</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Industry benchmark */}
          <div className="p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium text-slate-600">Industry Standard ({projectDisplayName})</span>
              <span className="text-slate-500">
                {expectedLow}–{expectedHigh}% Labor
              </span>
            </div>
            <div className="h-3 rounded-full overflow-hidden bg-slate-200 relative">
              {/* Expected range indicator */}
              <div 
                className="absolute h-full bg-slate-400 opacity-50"
                style={{ 
                  left: `${expectedLow}%`, 
                  width: `${expectedHigh - expectedLow}%` 
                }}
              />
              {/* Typical marker */}
              <div 
                className="absolute h-full w-0.5 bg-slate-600"
                style={{ left: `${expectedTypical}%` }}
              />
              {/* Bid's position indicator */}
              <div 
                className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow ${
                  status === 'normal' ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ left: `calc(${Math.min(Math.max(split.laborPercent, 5), 95)}% - 6px)` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-slate-400">
              <span>0%</span>
              <span>Typical: {expectedTypical}%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
        
        {/* Status Banner */}
        <div className={`${config.bg} ${config.border} border rounded-xl p-4 mb-4`}>
          <div className="flex items-start gap-3">
            <StatusIcon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
            <div>
              <p className={`text-sm font-semibold ${config.labelColor} mb-1`}>{config.label}</p>
              <p className="text-sm text-slate-700">{insight}</p>
            </div>
          </div>
        </div>
        
        {/* Recommendation */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-indigo-800 mb-1">What to Do</p>
              <p className="text-sm text-indigo-700">{recommendation}</p>
            </div>
          </div>
        </div>
        
        {/* Confidence Indicator */}
        <div className="mb-3">
          <ConfidenceIndicator 
            level="medium" 
            reason="Based on national industry benchmarks"
            showDescription={true}
          />
        </div>
        
        {/* Data Attribution */}
        <div className="pt-3 mt-3 border-t border-slate-100">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <Database className="w-3 h-3" />
            <span>
              Source:{' '}
              {citationUrl ? (
                <a 
                  href={citationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-500 hover:text-indigo-600 transition-colors"
                >
                  Houzz Cost Guide 2024
                </a>
              ) : (
                <span>Houzz Cost Guide 2024</span>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
