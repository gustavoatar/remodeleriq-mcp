import { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, DollarSign, BarChart3, MapPin, Info, AlertCircle, Ruler, ChevronDown, ChevronUp, Layers, Database } from 'lucide-react';
import { ConfidenceIndicator, type ConfidenceLevel } from '@/react-app/components/ui/ConfidenceIndicator';

// State-specific cost adjustment notes
const STATE_COST_NOTES: Record<string, { multiplier: string; note: string }> = {
  'CA': { multiplier: '+20-35%', note: 'California pricing typically runs 20-35% above national averages' },
  'NY': { multiplier: '+15-30%', note: 'New York pricing typically runs 15-30% above national averages' },
  'NJ': { multiplier: '+10-25%', note: 'New Jersey pricing typically runs 10-25% above national averages' },
  'MA': { multiplier: '+10-20%', note: 'Massachusetts pricing typically runs 10-20% above national averages' },
  'WA': { multiplier: '+10-20%', note: 'Washington state pricing typically runs 10-20% above national averages' },
  'CT': { multiplier: '+10-20%', note: 'Connecticut pricing typically runs 10-20% above national averages' },
  'DC': { multiplier: '+15-25%', note: 'DC metro pricing typically runs 15-25% above national averages' },
  'HI': { multiplier: '+25-40%', note: 'Hawaii pricing typically runs 25-40% above national averages due to shipping costs' },
  'AK': { multiplier: '+20-35%', note: 'Alaska pricing typically runs 20-35% above national averages due to logistics' },
  'TX': { multiplier: '-5-10%', note: 'Texas pricing tends to run 5-10% below national averages' },
  'GA': { multiplier: '-5-10%', note: 'Georgia pricing tends to run 5-10% below national averages' },
  'FL': { multiplier: 'varies', note: 'Florida pricing varies widely - coastal areas higher, inland closer to national' },
  'OH': { multiplier: '-10-15%', note: 'Ohio pricing tends to run 10-15% below national averages' },
  'IN': { multiplier: '-10-15%', note: 'Indiana pricing tends to run 10-15% below national averages' },
  'TN': { multiplier: '-5-10%', note: 'Tennessee pricing tends to run 5-10% below national averages' },
};

// Trade comparison from multi-trade analysis
export interface TradeComparison {
  tradeName: string;
  tradeType: string;
  confidence: number;
  estimatedAmount: number;
  estimatedPercent: number;
  marketEstimateLow: number;
  marketEstimateMedian: number;
  marketEstimateHigh: number;
  verdict: 'good_deal' | 'average' | 'expensive' | 'insufficient_data';
  verdictReason: string;
  percentDifference?: number;
}

export interface MarketRateResult {
  zipCode: string;
  stateCode: string;
  msaCode?: string;
  msaName?: string;
  areaUsed: 'msa' | 'state' | 'national';
  marketLaborRate: number;
  marketLaborLow: number;
  marketLaborHigh: number;
  bidPsf?: number;
  marketPsfLow?: number;
  marketPsfMedian?: number;
  marketPsfHigh?: number;
  detectedTrade?: string;
  tradeBenchmark?: {
    psfRange: { low: number; mid: number; high: number } | null;
    perUnitRange?: { low: number; mid: number; high: number; unitLabel: string } | null;
    description: string;
    source: string;
  };
  verdict: 'good_deal' | 'average' | 'bad_deal';
  verdictReason: string;
  percentDifference?: number;
  tradeBreakdown: Array<{
    trade: string;
    bidAmount: number;
    marketMedian: number;
    marketRange: string;
    status: 'below' | 'within' | 'above';
  }>;
  dataSource: string;
  tradesMatched: number;
  totalTrades: number;
  
  // Multi-trade analysis (Phase 4)
  multiTradeAnalysis?: {
    projectLabel: string;
    primaryTrade?: string;
    isSingleTrade: boolean;
    isMultiTrade: boolean;
    tradeComparisons: TradeComparison[];
    weightedVerdict: 'good_deal' | 'average' | 'expensive' | 'mixed' | 'insufficient_data';
    weightedPercentDiff?: number;
  };
}

// Unit detection data for per-unit trades
interface UnitDetectionItem {
  type: string;
  quantity: number;
  description: string;
  matchedText: string;
}

interface UnitDetectionData {
  items: UnitDetectionItem[];
  totalUnits: number;
}

interface MarketComparisonCardProps {
  data: MarketRateResult;
  bidTotal: number;
  squareFootage?: number | null;
  unitDetection?: UnitDetectionData | null;
  windowCountOverride?: number | null;
}

// Verdict config helper
function getVerdictConfig(verdict: string) {
  switch (verdict) {
    case 'good_deal':
      return {
        label: 'Good Deal',
        bg: 'bg-emerald-500',
        textColor: 'text-emerald-700',
        borderColor: 'border-emerald-300',
        bgLight: 'bg-emerald-50',
        icon: TrendingDown,
        description: 'Below or at the low end of market range'
      };
    case 'bad_deal':
    case 'expensive':
      return {
        label: 'Above Market',
        bg: 'bg-red-500',
        textColor: 'text-red-700',
        borderColor: 'border-red-300',
        bgLight: 'bg-red-50',
        icon: TrendingUp,
        description: 'Priced above the typical market range'
      };
    case 'mixed':
      return {
        label: 'Mixed',
        bg: 'bg-amber-500',
        textColor: 'text-amber-700',
        borderColor: 'border-amber-300',
        bgLight: 'bg-amber-50',
        icon: Minus,
        description: 'Some trades below market, others above'
      };
    case 'insufficient_data':
      return {
        label: 'Limited Data',
        bg: 'bg-slate-400',
        textColor: 'text-slate-600',
        borderColor: 'border-slate-300',
        bgLight: 'bg-slate-50',
        icon: AlertCircle,
        description: 'Not enough details for accurate comparison'
      };
    default:
      return {
        label: 'Fair Price',
        bg: 'bg-blue-500',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-300',
        bgLight: 'bg-blue-50',
        icon: Minus,
        description: 'Within typical market range'
      };
  }
}

// Get unit label based on trade type
function getTradeUnitInfo(tradeType: string): { unitLabel: string; isPerUnit: boolean } {
  switch (tradeType) {
    case 'windows':
      return { unitLabel: '/window', isPerUnit: true };
    case 'electrical':
      return { unitLabel: '/outlet', isPerUnit: true };
    case 'plumbing':
      return { unitLabel: '/fixture', isPerUnit: true };
    case 'paint':
    case 'flooring':
    case 'tile':
    case 'roofing':
    case 'drywall':
    case 'concrete':
      return { unitLabel: '/sf', isPerUnit: false };
    default:
      return { unitLabel: '', isPerUnit: false };
  }
}

// Mini verdict badge for trade breakdown
function TradeVerdictBadge({ verdict }: { verdict: string }) {
  const config = {
    good_deal: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Good' },
    average: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Fair' },
    expensive: { bg: 'bg-red-100', text: 'text-red-700', label: 'High' },
    insufficient_data: { bg: 'bg-slate-100', text: 'text-slate-500', label: '—' },
  }[verdict] || { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Fair' };
  
  return (
    <span className={`${config.bg} ${config.text} px-2 py-0.5 rounded-full text-xs font-medium`}>
      {config.label}
    </span>
  );
}

export default function MarketComparisonCard({ data, bidTotal, squareFootage, unitDetection, windowCountOverride }: MarketComparisonCardProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  
  // Use multi-trade verdict if available, otherwise fall back to simple verdict
  const multiTrade = data.multiTradeAnalysis;
  const hasMultiTrade = multiTrade && multiTrade.tradeComparisons.length > 0;
  const effectiveVerdict = hasMultiTrade ? multiTrade.weightedVerdict : data.verdict;
  
  const verdictConfig = useMemo(() => getVerdictConfig(effectiveVerdict), [effectiveVerdict]);
  const VerdictIcon = verdictConfig.icon;
  
  // Calculate PSF values
  const bidPsf = squareFootage && squareFootage > 0 ? bidTotal / squareFootage : null;
  
  // Calculate window-specific metrics if this is a window project
  const windowMetrics = useMemo(() => {
    if (data.detectedTrade !== 'windows') return null;
    
    // Use override first, then fall back to unitDetection
    const windowItems = unitDetection?.items.filter(item => item.type === 'window') || [];
    const detectedCount = windowItems.reduce((sum, item) => sum + item.quantity, 0);
    const windowCount = windowCountOverride || detectedCount;
    
    if (windowCount === 0) return null;
    
    const pricePerWindow = bidTotal / windowCount;
    const benchmark = data.tradeBenchmark?.perUnitRange;
    
    return {
      count: windowCount,
      pricePerWindow,
      benchmark,
      items: windowItems
    };
  }, [data.detectedTrade, unitDetection, bidTotal, data.tradeBenchmark, windowCountOverride]);
  
  // Get location label
  const locationLabel = useMemo(() => {
    if (data.msaName) return data.msaName;
    if (data.stateCode && data.stateCode !== 'US') return `${data.stateCode} State Average`;
    return 'National Average';
  }, [data]);
  
  // Determine confidence level from data source
  const confidenceLevel: ConfidenceLevel = useMemo(() => {
    switch (data.areaUsed) {
      case 'msa': return 'high';
      case 'state': return 'medium';
      case 'national':
      default: return 'low';
    }
  }, [data.areaUsed]);
  
  const confidenceReason = useMemo(() => {
    switch (data.areaUsed) {
      case 'msa': return `Using ${data.msaName || 'metro area'} market data`;
      case 'state': return `Using ${data.stateCode} state averages`;
      case 'national':
      default: return 'Using national averages';
    }
  }, [data.areaUsed, data.msaName, data.stateCode]);
  
  // Calculate weighted percent difference for multi-trade
  const weightedPercentDiff = useMemo(() => {
    if (!hasMultiTrade) return data.percentDifference;
    if (multiTrade.weightedPercentDiff !== undefined) return multiTrade.weightedPercentDiff;
    
    // Calculate from trade comparisons
    const validComparisons = multiTrade.tradeComparisons.filter(t => 
      t.verdict !== 'insufficient_data' && t.percentDifference !== undefined
    );
    if (validComparisons.length === 0) return undefined;
    
    const totalWeight = validComparisons.reduce((sum, t) => sum + t.estimatedPercent, 0);
    if (totalWeight === 0) return undefined;
    
    return validComparisons.reduce((sum, t) => 
      sum + (t.percentDifference || 0) * (t.estimatedPercent / totalWeight), 0
    );
  }, [data.percentDifference, hasMultiTrade, multiTrade]);

  return (
    <div className={`rounded-2xl border-2 ${verdictConfig.borderColor} ${verdictConfig.bgLight} overflow-hidden shadow-lg`}>
      {/* Header with Verdict Badge */}
      <div className="bg-gradient-to-r from-navy-900 to-navy-800 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-white/80" />
            <div>
              <h3 className="text-white font-semibold">Bid vs. Market</h3>
              <p className="text-white/60 text-xs mt-0.5">Based on BLS OEWS May 2023 wage data</p>
            </div>
          </div>
          <div className={`${verdictConfig.bg} px-4 py-1.5 rounded-full flex items-center gap-2`}>
            <VerdictIcon className="w-4 h-4 text-white" />
            <span className="text-white font-bold text-sm">{verdictConfig.label}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-5">
        {/* Phase 5: Primary Trade Badge - Prominent Project Type Label */}
        {/* Priority: If we have window metrics, always show as Window Replacement */}
        <div className="mb-4">
          {windowMetrics && windowMetrics.count > 0 ? (
            <div className="bg-gradient-to-r from-navy-100 to-emerald-50 rounded-xl p-3 border border-navy-200">
              <div className="flex items-center gap-2 mb-1">
                <Layers className="w-4 h-4 text-navy-600" />
                <span className="text-xs font-medium text-navy-500 uppercase tracking-wide">Project Type</span>
              </div>
              <div className="text-lg font-bold text-navy-900">
                Window Replacement Project
              </div>
              <p className="text-xs text-navy-500 mt-1">
                {windowMetrics.count} window{windowMetrics.count !== 1 ? 's' : ''} • Per-unit comparison
              </p>
            </div>
          ) : hasMultiTrade ? (
            <div className="bg-gradient-to-r from-navy-100 to-emerald-50 rounded-xl p-3 border border-navy-200">
              <div className="flex items-center gap-2 mb-1">
                <Layers className="w-4 h-4 text-navy-600" />
                <span className="text-xs font-medium text-navy-500 uppercase tracking-wide">Project Type</span>
              </div>
              <div className="text-lg font-bold text-navy-900">
                {multiTrade.projectLabel}
              </div>
              {multiTrade.isMultiTrade && (
                <p className="text-xs text-navy-500 mt-1">
                  {multiTrade.tradeComparisons.length} trades detected • Weighted composite score
                </p>
              )}
            </div>
          ) : data.detectedTrade && data.detectedTrade !== 'unknown' ? (
            <div className="bg-gradient-to-r from-navy-100 to-emerald-50 rounded-xl p-3 border border-navy-200">
              <div className="flex items-center gap-2 mb-1">
                <Layers className="w-4 h-4 text-navy-600" />
                <span className="text-xs font-medium text-navy-500 uppercase tracking-wide">Project Type</span>
              </div>
              <div className="text-lg font-bold text-navy-900 capitalize">
                {data.tradeBenchmark?.description 
                  ? data.tradeBenchmark.description.split('(')[0].trim()
                  : data.detectedTrade.replace(/-/g, ' ')} Project
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs">Unable to detect specific trade type — using general contractor rates</span>
            </div>
          )}
        </div>

        {/* Comparison Stats */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          {/* Your Bid */}
          <div className="bg-white rounded-xl p-4 border border-navy-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-navy-400" />
              <span className="text-xs font-medium text-navy-500 uppercase tracking-wide">Your Bid</span>
            </div>
            <div className="text-2xl font-bold text-navy-900">
              ${bidTotal.toLocaleString()}
            </div>
            {/* Window-specific per-unit pricing */}
            {windowMetrics ? (
              <div className="text-sm text-navy-500 mt-1">
                <span className="font-medium text-navy-700">{windowMetrics.count} windows</span>
                {' @ '}
                <span className="font-medium">${windowMetrics.pricePerWindow.toLocaleString(undefined, { maximumFractionDigits: 0 })}/window</span>
              </div>
            ) : bidPsf ? (
              <div className="text-sm text-navy-500 mt-1">
                ${bidPsf.toFixed(0)}/sf
              </div>
            ) : null}
          </div>

          {/* Market Average - Show PSF benchmarks, per-unit, or labor rates */}
          <div className="bg-white rounded-xl p-4 border border-navy-100 shadow-sm">
            {(() => {
              // Determine unit type for display
              const singleTradeUnitInfo = data.detectedTrade ? getTradeUnitInfo(data.detectedTrade) : null;
              const isPerUnitTrade = singleTradeUnitInfo?.isPerUnit && data.tradeBenchmark;
              
              return (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-navy-400" />
                    <span className="text-xs font-medium text-navy-500 uppercase tracking-wide">
                      {isPerUnitTrade 
                        ? `Market ${singleTradeUnitInfo.unitLabel.replace('/', '')} Price`
                        : data.tradeBenchmark?.psfRange 
                          ? 'Market PSF' 
                          : 'Market Rate'}
                    </span>
                  </div>
                  {isPerUnitTrade && data.tradeBenchmark?.perUnitRange ? (
                    <>
                      <div className="text-2xl font-bold text-navy-900">
                        ${((data.tradeBenchmark.perUnitRange.low + data.tradeBenchmark.perUnitRange.high) / 2).toFixed(0)}{singleTradeUnitInfo.unitLabel}
                      </div>
                      <div className="text-sm text-navy-500 mt-1">
                        ${data.tradeBenchmark.perUnitRange.low.toLocaleString()}-${data.tradeBenchmark.perUnitRange.high.toLocaleString()} range
                      </div>
                    </>
                  ) : data.tradeBenchmark?.psfRange ? (
                    <>
                      <div className="text-2xl font-bold text-navy-900">
                        ${data.marketPsfMedian?.toFixed(0)}/sf
                      </div>
                      <div className="text-sm text-navy-500 mt-1">
                        ${data.marketPsfLow?.toFixed(0)}-${data.marketPsfHigh?.toFixed(0)} range
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-navy-900">
                        ${data.marketLaborRate.toFixed(0)}/hr
                      </div>
                      <div className="text-sm text-navy-500 mt-1">
                        ${data.marketLaborLow.toFixed(0)}-${data.marketLaborHigh.toFixed(0)} range
                      </div>
                    </>
                  )}
                </>
              );
            })()}
          </div>
        </div>

        {/* Verdict Explanation */}
        <div className={`rounded-xl p-4 ${verdictConfig.bgLight} border ${verdictConfig.borderColor}`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${verdictConfig.bg}`}>
              <VerdictIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className={`font-semibold ${verdictConfig.textColor}`}>
                {/* Window-specific verdict messaging */}
                {windowMetrics ? (
                  effectiveVerdict === 'good_deal' ? (
                    `$${windowMetrics.pricePerWindow.toFixed(0)}/window is below typical market rates`
                  ) : effectiveVerdict === 'bad_deal' || effectiveVerdict === 'expensive' ? (
                    `$${windowMetrics.pricePerWindow.toFixed(0)}/window is above typical market rates`
                  ) : (
                    `$${windowMetrics.pricePerWindow.toFixed(0)}/window is within typical market range`
                  )
                ) : effectiveVerdict === 'good_deal' ? (
                  <>
                    {weightedPercentDiff !== undefined && weightedPercentDiff < -5 
                      ? `${Math.abs(weightedPercentDiff).toFixed(0)}% below market median` 
                      : 'At the low end of market range'}
                    {hasMultiTrade && multiTrade.isMultiTrade && (
                      <span className="font-normal text-sm ml-1">(weighted avg)</span>
                    )}
                  </>
                ) : effectiveVerdict === 'bad_deal' || effectiveVerdict === 'expensive' ? (
                  <>
                    {weightedPercentDiff !== undefined 
                      ? `${Math.abs(weightedPercentDiff).toFixed(0)}% above market range` 
                      : 'Above market range'}
                    {hasMultiTrade && multiTrade.isMultiTrade && (
                      <span className="font-normal text-sm ml-1">(weighted avg)</span>
                    )}
                  </>
                ) : effectiveVerdict === 'mixed' ? (
                  'Mixed results across trades'
                ) : (
                  <>
                    Within market range
                    {hasMultiTrade && multiTrade.isMultiTrade && (
                      <span className="font-normal text-sm ml-1">(weighted avg)</span>
                    )}
                  </>
                )}
              </p>
              <p className="text-sm text-navy-600 mt-1">
                {windowMetrics 
                  ? `Based on ${windowMetrics.count} window${windowMetrics.count > 1 ? 's' : ''} at $${windowMetrics.pricePerWindow.toFixed(0)} each`
                  : verdictConfig.description}
              </p>
              {windowMetrics && windowMetrics.benchmark && (
                <p className="text-xs text-navy-500 mt-2 italic">
                  Market range: ${windowMetrics.benchmark.low.toLocaleString()}–${windowMetrics.benchmark.high.toLocaleString()} per window (varies by type)
                </p>
              )}
              {data.tradeBenchmark?.psfRange && bidPsf && !hasMultiTrade && !windowMetrics && (
                <p className="text-xs text-navy-500 mt-2 italic">
                  Compared using {data.detectedTrade?.replace(/-/g, ' ')} pricing benchmarks ({data.tradeBenchmark.source})
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Phase 4: Multi-Trade Breakdown (Expandable) */}
        {hasMultiTrade && multiTrade.tradeComparisons.length > 1 && (
          <div className="mt-4">
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="w-full flex items-center justify-between bg-white rounded-xl p-3 border border-navy-200 hover:border-navy-300 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-navy-500" />
                <span className="text-sm font-medium text-navy-700">Trade-by-Trade Breakdown</span>
                <span className="text-xs text-navy-400">({multiTrade.tradeComparisons.length} trades)</span>
              </div>
              {showBreakdown ? (
                <ChevronUp className="w-4 h-4 text-navy-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-navy-400" />
              )}
            </button>
            
            {showBreakdown && (
              <div className="mt-2 space-y-2">
                {multiTrade.tradeComparisons.map((trade, index) => {
                  const unitInfo = getTradeUnitInfo(trade.tradeType);
                  return (
                    <div 
                      key={index} 
                      className="bg-white rounded-lg p-3 border border-navy-100"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-navy-800">{trade.tradeName}</span>
                          {unitInfo.isPerUnit && (
                            <span className="text-xs bg-navy-100 text-navy-600 px-1.5 py-0.5 rounded">
                              priced {unitInfo.unitLabel}
                            </span>
                          )}
                          <span className="text-xs text-navy-400">~{trade.estimatedPercent}% of bid</span>
                        </div>
                        <TradeVerdictBadge verdict={trade.verdict} />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <span className="text-navy-500">Est. </span>
                          <span className="font-medium text-navy-700">${trade.estimatedAmount.toLocaleString()}</span>
                        </div>
                        {trade.verdict !== 'insufficient_data' && (
                          <div className="text-navy-500">
                            Market: ${trade.marketEstimateLow.toLocaleString()}-${trade.marketEstimateHigh.toLocaleString()}
                          </div>
                        )}
                      </div>
                      {trade.percentDifference !== undefined && (
                        <div className={`text-xs mt-1 ${
                          trade.percentDifference < 0 ? 'text-emerald-600' : 
                          trade.percentDifference > 15 ? 'text-red-600' : 'text-navy-500'
                        }`}>
                          {trade.percentDifference > 0 ? '+' : ''}{trade.percentDifference.toFixed(0)}% vs market median
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Window Replacement Type Note */}
        {windowMetrics && (
          <div className="mt-4 flex items-start gap-2 bg-cyan-50 border border-cyan-200 rounded-lg p-3">
            <Info className="w-4 h-4 text-cyan-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-cyan-700">
              <span className="font-medium">Window pricing varies by installation type:</span>
              <ul className="mt-1.5 space-y-1 ml-2">
                <li>• <strong>Insert/pocket replacement</strong> (existing frame): $400–$950/window</li>
                <li>• <strong>Full-frame replacement</strong> (new frame + trim): $800–$1,800/window</li>
                <li>• <strong>Bay/bow windows</strong>: $1,500–$4,000/window</li>
              </ul>
              <p className="mt-1.5 text-cyan-600">
                {windowMetrics.pricePerWindow >= 800 
                  ? 'This bid appears to include full-frame installation or premium window types.'
                  : windowMetrics.pricePerWindow >= 500
                    ? 'This pricing is typical for standard insert replacements with mid-grade windows.'
                    : 'This pricing suggests basic insert replacements or builder-grade windows.'}
              </p>
            </div>
          </div>
        )}

        {/* Missing Square Footage Notice */}
        {data.tradeBenchmark?.psfRange && !bidPsf && !windowMetrics && (
          <div className="mt-4 flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <Ruler className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-700">
              <span className="font-medium">Add square footage for better comparison.</span>{' '}
              This {data.detectedTrade?.replace(/-/g, ' ')} project has specific $/sq ft benchmarks 
              (${data.tradeBenchmark.psfRange.low}-${data.tradeBenchmark.psfRange.high}/sf) but we need the project area to compare.
            </div>
          </div>
        )}

        {/* State-Specific Cost Note */}
        {STATE_COST_NOTES[data.stateCode] && (
          <div className="mt-4 flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-lg p-3">
            <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600">
              <span className="font-medium">{data.stateCode} Regional Note:</span>{' '}
              {STATE_COST_NOTES[data.stateCode].note}. Our benchmarks use national averages.
            </div>
          </div>
        )}

        {/* Data Source Footer */}
        <div className="mt-4 pt-3 border-t border-navy-100">
          {/* Confidence Indicator */}
          <div className="mb-3">
            <ConfidenceIndicator 
              level={confidenceLevel} 
              reason={confidenceReason}
              showDescription={true}
            />
          </div>
          
          <div className="flex items-center justify-between text-xs text-navy-400 mb-2">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>{locationLabel}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              <span>{data.dataSource}</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <Database className="w-3 h-3" />
            <span>
              Sources:{' '}
              <a 
                href="https://www.jlconline.com/how-to/zonda-cost-vs-value"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-500 hover:text-emerald-600 transition-colors"
              >
                Zonda 2025
              </a>
              {' • '}
              <a 
                href="https://www.bls.gov/oes/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-500 hover:text-emerald-600 transition-colors"
              >
                BLS OEWS
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
