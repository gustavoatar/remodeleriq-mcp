/**
 * DataBackedPointsCard - Negotiation talking points backed by Houzz/BLS data
 * Part of Tier 1 Data Enrichment (Task #102)
 */

import { useState, useMemo } from 'react';
import { 
  Database, Copy, Check, ChevronDown, DollarSign, Users, 
  TrendingUp, Percent, MessageSquare, Info, ExternalLink
} from 'lucide-react';
import { extractLaborMaterialSplit } from '@/shared/laborRatioValidation';
import { getExpectedLaborRatio, getHouzzTotalCostRange, type ProjectType } from '@/shared/houzzBenchmarks';
import { NATIONAL_WAGE_DATA, STATE_WAGE_DATA, getBurdenMultiplier } from '@/shared/blsOewsData';
import type { TradeCategory } from '@/shared/tradeDetection';

interface DataBackedPointsCardProps {
  bidContent: string;
  primaryTrade?: TradeCategory;
  projectType?: string | null;
  stateCode?: string;
  bidTotal?: number | null;
}

interface DataPoint {
  id: string;
  icon: React.ReactNode;
  category: 'labor' | 'pricing' | 'rate' | 'scope';
  title: string;
  talkingPoint: string;
  dataSource: string;
  sourceUrl?: string;
  severity: 'neutral' | 'concern' | 'advantage';
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
    'hvac': 'ac-installation',
    'ac': 'ac-installation',
    'flooring': 'hardwood-floor',
    'hardwood': 'hardwood-floor',
    'painting': 'exterior-painting',
    'exterior-painting': 'exterior-painting',
    'siding': 'vinyl-siding',
    'basement': 'basement',
    'basement-remodel': 'basement',
    'window': 'window',
    'windows': 'window',
    'windows-doors': 'window',
  };
  
  return mapping[normalizedType] || null;
}

// Map trade to BLS SOC code
const TRADE_TO_SOC: Record<string, string> = {
  'electrical': '47-2111',
  'plumbing': '47-2152',
  'hvac': '49-9021',
  'roofing': '47-2181',
  'flooring': '47-2042',
  'painting': '47-2141',
  'drywall': '47-2081',
  'carpentry': '47-2031',
  'kitchen': '47-2031',
  'bathroom': '47-2152',
  'basement': '47-2031',
  'windows-doors': '47-2121',
  'general': '47-2061',
};

function generateDataPoints(
  bidContent: string,
  primaryTrade: TradeCategory | undefined,
  projectType: string | null,
  stateCode: string,
  bidTotal: number | null
): DataPoint[] {
  const points: DataPoint[] = [];
  const houzzType = mapToHouzzProjectType(projectType, primaryTrade);
  const tradeKey = primaryTrade?.toLowerCase() || projectType?.toLowerCase().replace(/\s+/g, '-') || 'general';
  const socCode = TRADE_TO_SOC[tradeKey] || TRADE_TO_SOC['general'];
  
  // 1. Labor/Material Split Point (Houzz data)
  const split = extractLaborMaterialSplit(bidContent);
  if (split && houzzType) {
    const expectedRatio = getExpectedLaborRatio(houzzType);
    if (expectedRatio) {
      const isHighLabor = split.laborPercent > expectedRatio.high * 1.15;
      const isLowLabor = split.laborPercent < expectedRatio.low * 0.85;
      
      if (isHighLabor) {
        points.push({
          id: 'labor-high',
          icon: <Percent className="w-4 h-4" />,
          category: 'labor',
          title: 'Labor Cost Above Industry Average',
          talkingPoint: `"I noticed your labor is ${split.laborPercent.toFixed(0)}% of the total. According to Houzz data, ${houzzType.replace(/-/g, ' ')} projects typically run ${expectedRatio.low}-${expectedRatio.high}% labor. Can you help me understand what's driving the higher labor cost?"`,
          dataSource: 'Houzz Cost Guide 2024',
          sourceUrl: 'https://www.houzz.com/magazine/how-much-does-it-cost',
          severity: 'concern',
        });
      } else if (isLowLabor) {
        points.push({
          id: 'labor-low',
          icon: <Percent className="w-4 h-4" />,
          category: 'labor',
          title: 'Labor Cost Below Industry Average',
          talkingPoint: `"Your labor percentage (${split.laborPercent.toFixed(0)}%) is below the typical ${expectedRatio.low}-${expectedRatio.high}% for ${houzzType.replace(/-/g, ' ')} projects. I want to make sure there's enough labor budgeted for quality workmanship. Are all installation costs included?"`,
          dataSource: 'Houzz Cost Guide 2024',
          sourceUrl: 'https://www.houzz.com/magazine/how-much-does-it-cost',
          severity: 'concern',
        });
      }
    }
  }
  
  // 2. Total Project Cost Point (Houzz data)
  if (bidTotal && houzzType) {
    const costRange = getHouzzTotalCostRange(houzzType);
    if (costRange) {
      if (bidTotal > costRange.high * 1.2) {
        points.push({
          id: 'price-high',
          icon: <DollarSign className="w-4 h-4" />,
          category: 'pricing',
          title: 'Total Cost Above National Average',
          talkingPoint: `"Your bid of $${bidTotal.toLocaleString()} is above the national average range of $${costRange.low.toLocaleString()}-$${costRange.high.toLocaleString()} for ${houzzType.replace(/-/g, ' ')} projects. What specific factors - materials, site conditions, or scope - account for the premium?"`,
          dataSource: 'Houzz Cost Guide 2024',
          sourceUrl: 'https://www.houzz.com/magazine/how-much-does-it-cost',
          severity: 'concern',
        });
      } else if (bidTotal < costRange.low * 0.75) {
        points.push({
          id: 'price-low',
          icon: <DollarSign className="w-4 h-4" />,
          category: 'pricing',
          title: 'Total Cost Below National Average',
          talkingPoint: `"Your bid of $${bidTotal.toLocaleString()} is below the typical range of $${costRange.low.toLocaleString()}-$${costRange.high.toLocaleString()} for ${houzzType.replace(/-/g, ' ')} projects. I want to confirm this is a complete quote - are permits, cleanup, and all materials included?"`,
          dataSource: 'Houzz Cost Guide 2024',
          sourceUrl: 'https://www.houzz.com/magazine/how-much-does-it-cost',
          severity: 'concern',
        });
      } else if (bidTotal >= costRange.low && bidTotal <= costRange.high) {
        points.push({
          id: 'price-normal',
          icon: <DollarSign className="w-4 h-4" />,
          category: 'pricing',
          title: 'Total Cost Within Normal Range',
          talkingPoint: `"Your bid of $${bidTotal.toLocaleString()} falls within the typical national range of $${costRange.low.toLocaleString()}-$${costRange.high.toLocaleString()} for this type of project. I'd like to discuss the specific materials and finishes included at this price point."`,
          dataSource: 'Houzz Cost Guide 2024',
          sourceUrl: 'https://www.houzz.com/magazine/how-much-does-it-cost',
          severity: 'neutral',
        });
      }
    }
  }
  
  // 3. Hourly Rate Point (BLS data)
  // Try state-specific data first
  let wageData = STATE_WAGE_DATA.find(d => d.soc_code === socCode && d.area_code === stateCode);
  if (!wageData) {
    wageData = NATIONAL_WAGE_DATA.find(d => d.soc_code === socCode);
  }
  
  if (wageData) {
    const burdenMultiplier = getBurdenMultiplier(socCode);
    const lowRate = wageData.hourly_25 * burdenMultiplier;
    const highRate = wageData.hourly_75 * burdenMultiplier;
    
    points.push({
      id: 'bls-rate',
      icon: <Users className="w-4 h-4" />,
      category: 'rate',
      title: `${wageData.occupation_title} Market Rates`,
      talkingPoint: `"According to Bureau of Labor Statistics data, ${wageData.occupation_title.toLowerCase()} in ${wageData.area_name} typically bill $${lowRate.toFixed(0)}-$${highRate.toFixed(0)}/hour (including overhead). How does your labor pricing compare?"`,
      dataSource: `BLS Occupational Employment Statistics (${wageData.area_name})`,
      sourceUrl: 'https://www.bls.gov/oes/',
      severity: 'neutral',
    });
  }
  
  // 4. Regional context point
  const stateWageData = STATE_WAGE_DATA.filter(d => d.area_code === stateCode);
  const nationalData = NATIONAL_WAGE_DATA.find(d => d.soc_code === socCode);
  
  if (stateWageData.length > 0 && nationalData) {
    const stateMedian = stateWageData.find(d => d.soc_code === socCode);
    if (stateMedian) {
      const pctDiff = ((stateMedian.hourly_median - nationalData.hourly_median) / nationalData.hourly_median) * 100;
      
      if (Math.abs(pctDiff) > 10) {
        const direction = pctDiff > 0 ? 'higher' : 'lower';
        const advantage = pctDiff < 0 ? 'advantage' : 'concern';
        
        points.push({
          id: 'regional-diff',
          icon: <TrendingUp className="w-4 h-4" />,
          category: 'rate',
          title: 'Regional Labor Cost Comparison',
          talkingPoint: `"BLS data shows ${stateMedian.occupation_title.toLowerCase()} wages in ${stateMedian.area_name} are ${Math.abs(pctDiff).toFixed(0)}% ${direction} than the national average. ${pctDiff > 0 ? 'I understand local costs may be higher, but' : 'Given the favorable local rates,'} I'd like to ensure the labor portion reflects current market conditions."`,
          dataSource: 'BLS Occupational Employment Statistics',
          sourceUrl: 'https://www.bls.gov/oes/',
          severity: advantage as 'advantage' | 'concern',
        });
      }
    }
  }
  
  return points;
}

export default function DataBackedPointsCard({
  bidContent,
  primaryTrade,
  projectType,
  stateCode = 'GA',
  bidTotal,
}: DataBackedPointsCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const dataPoints = useMemo(() => 
    generateDataPoints(bidContent, primaryTrade, projectType ?? null, stateCode, bidTotal ?? null),
    [bidContent, primaryTrade, projectType, stateCode, bidTotal]
  );
  
  // Don't render if no data points
  if (dataPoints.length === 0) return null;
  
  const handleCopy = async (id: string, text: string) => {
    // Extract just the quoted talking point
    const match = text.match(/"([^"]+)"/);
    const copyText = match ? match[1] : text;
    
    await navigator.clipboard.writeText(copyText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };
  
  const severityConfig = {
    neutral: { bg: 'bg-slate-50', border: 'border-slate-200', badge: 'bg-slate-100 text-slate-600' },
    concern: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700' },
    advantage: { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' },
  };
  
  return (
    <div className="bg-white rounded-xl border-2 border-indigo-200 shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-indigo-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Database className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-navy-900">Data-Backed Talking Points</h3>
            <p className="text-xs text-navy-500">Negotiation points backed by Houzz & BLS data</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
            {dataPoints.length} points
          </span>
          <ChevronDown className={`w-5 h-5 text-navy-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>
      
      {expanded && (
        <div className="border-t border-indigo-100">
          {/* Intro */}
          <div className="px-5 py-3 bg-indigo-50 border-b border-indigo-100">
            <div className="flex items-start gap-2 text-sm text-indigo-700">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                Use these data-backed points in your negotiation. Click to copy each talking point.
              </span>
            </div>
          </div>
          
          {/* Points */}
          <div className="divide-y divide-slate-100">
            {dataPoints.map((point) => {
              const config = severityConfig[point.severity];
              const isCopied = copiedId === point.id;
              
              return (
                <div key={point.id} className={`p-5 ${config.bg}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${config.badge}`}>
                        {point.icon}
                      </div>
                      <span className="font-medium text-navy-900">{point.title}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(point.id, point.talkingPoint)}
                      className={`p-2 rounded-lg transition-colors ${
                        isCopied 
                          ? 'bg-emerald-100 text-emerald-600' 
                          : 'hover:bg-white text-navy-400 hover:text-navy-600'
                      }`}
                      title="Copy talking point"
                    >
                      {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  <div className={`rounded-lg p-4 border ${config.border} bg-white`}>
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-1" />
                      <p className="text-navy-700 text-sm leading-relaxed">{point.talkingPoint}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center gap-2 text-xs text-navy-400">
                    <Database className="w-3 h-3" />
                    <span>Source: </span>
                    {point.sourceUrl ? (
                      <a 
                        href={point.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-500 hover:text-indigo-600 transition-colors inline-flex items-center gap-1"
                      >
                        {point.dataSource}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span>{point.dataSource}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
