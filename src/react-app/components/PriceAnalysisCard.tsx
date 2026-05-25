import { useMemo, useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Minus, DollarSign, 
  AlertTriangle, Info, BarChart3, Database, CheckCircle2, Shield,
  Sparkles, ChevronDown, ChevronUp, Lightbulb, Home, Star
} from 'lucide-react';
import { isLinearFootProject as checkLinearFootProject } from '@/shared/projectUnitConfig';
import { getRoiDisplay, isHighRoiProject } from '@/shared/smartPricingEngine';

// Price Intelligence types (from Gemini narrator)
interface PriceDriver {
  item: string;
  impact: string;
  explanation: string;
  direction: 'up' | 'down' | 'neutral';
}

interface MaterialFlag {
  material: string;
  trend: 'rising' | 'stable' | 'falling' | 'unknown';
  note: string;
}

interface PriceIntelligenceResult {
  priceSummary: string;
  primaryDrivers: PriceDriver[];
  regionalContext: string;
  materialFlags: MaterialFlag[];
  confidence: 'high' | 'medium' | 'low';
  generatedAt: string;
}

interface TradeBreakdownItem {
  trade: string;
  socCode: string;
  weight: number;
  hourlyRate: number;
  source: 'live' | 'cached' | 'static';
}

type PriceDataSource = 'zonda' | 'psf' | 'window' | 'minimum';

interface PriceScoreData {
  score: number;
  verdict: string;
  percentDiff: number;
  bidPsf: number;
  marketLowPsf?: number;      // 25th percentile - budget/economy tier
  marketMedianPsf: number;    // 50th percentile - standard tier
  marketHighPsf?: number;     // 75th percentile - premium tier
  tradeBreakdown?: TradeBreakdownItem[];
  confidence?: 'high' | 'medium' | 'low';
  usedLiveRates?: boolean;
  dataSource?: PriceDataSource;
  dataSourceName?: string;    // e.g., "Boston, MA metro area" or "New England Region"
  zondaCitation?: string;     // URL to Zonda source
  regionalMultiplier?: number;
  regionalName?: string;
  regionalSource?: string;
  // Breakdown contains Zonda totals when dataSource is 'zonda'
  breakdown?: {
    bidTotal?: number;
    marketPsfLow?: number;
    marketPsfMedian?: number;
    marketPsfHigh?: number;
    // Zonda total project costs (when available)
    zondaTotalLow?: number;
    zondaTotalMedian?: number;
    zondaTotalHigh?: number;
  };
  // Cross-source validation
  crossSourceValidation?: {
    houzzRange: { low: number; high: number } | null;
    zondaRange: { low: number; high: number } | null;
    blsEstimate: { low: number; median: number; high: number } | null;  // BLS labor-based estimate
    combinedRange: { low: number; high: number };
    sourcesAgree: boolean;
    sourcesUsed: string[];
    confidence: 'high' | 'medium' | 'low';
    confidenceDescription: string;
    methodology: string;
  };
  detectedTier?: 'minor' | 'midrange' | 'upscale';
}

interface TradeMixEntry {
  soc: string;
  name: string;
  weight: number;
}

interface TradeMixData {
  trades: TradeMixEntry[];
  materialRatio: number;
  confidence: 'high' | 'medium' | 'low';
  reasoning?: string;
}

interface FlaggedIssue {
  title: string;
  level: 'critical' | 'high' | 'medium' | 'low';
  description: string;
}

interface PriceAnalysisCardProps {
  priceScoreData: PriceScoreData | null;
  tradeMixData?: TradeMixData | null;
  bidTotal: number;
  squareFootage?: number | null;
  windowCount?: number | null;   // For window projects - uses per-unit pricing
  linearFeet?: number | null;    // For linear foot projects (fence, gutter, railing)
  isPremium?: boolean;
  isLoading?: boolean;
  // For Price Intelligence AI
  bidText?: string;
  projectType?: string;
  projectTypeName?: string;
  flaggedIssues?: FlaggedIssue[];
  lowballDetected?: boolean;
  lowballReason?: string;
  stateCode?: string;
  zipCode?: string;
}

export default function PriceAnalysisCard({
  priceScoreData,
  tradeMixData,
  bidTotal,
  squareFootage,
  windowCount,
  linearFeet,
  isPremium = false,
  isLoading = false,
  bidText,
  projectType,
  projectTypeName,
  flaggedIssues,
  lowballDetected,
  lowballReason,
  stateCode,
  zipCode
}: PriceAnalysisCardProps) {
  // Determine if this is a window project (per-unit vs PSF pricing)
  const isWindowProject = windowCount && windowCount > 0 && !squareFootage;
  
  // Determine if this is a linear foot project (fence, gutter, railing, retaining wall)
  // Uses centralized helper from projectUnitConfig
  const isLinearFootProjectType = checkLinearFootProject(projectType);
  const isLinearFootProject = linearFeet && linearFeet > 0 && 
    (isLinearFootProjectType || (!squareFootage && !windowCount));
  
  // Check if this is a linear foot project type but missing linear feet measurement
  const missingLinearFeet = isLinearFootProjectType && (!linearFeet || linearFeet <= 0);
  
  // Price Intelligence state
  const [priceIntelligence, setPriceIntelligence] = useState<PriceIntelligenceResult | null>(null);
  const [intelligenceLoading, setIntelligenceLoading] = useState(false);
  const [showDrivers, setShowDrivers] = useState(false);
  
  // Fetch Price Intelligence when we have the required data
  useEffect(() => {
    const fetchIntelligence = async () => {
      // Skip if missing required data
      if (!priceScoreData || !bidTotal || bidTotal <= 0 || !projectType) {
        return;
      }
      
      // Skip if already loaded
      if (priceIntelligence) {
        return;
      }
      
      setIntelligenceLoading(true);
      
      try {
        const response = await fetch('/api/price-intelligence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bidText: bidText || '',
            bidTotal,
            squareFootage: squareFootage || undefined,
            windowCount: windowCount || undefined,
            projectType: projectType || 'unknown',
            projectTypeName: projectTypeName || 'Home Improvement Project',
            priceScore: priceScoreData.score || 50,
            priceVerdict: priceScoreData.verdict || 'Under Review',
            percentFromMarket: priceScoreData.percentDiff || 0,
            marketLow: priceScoreData.breakdown?.zondaTotalLow || (squareFootage && priceScoreData.marketLowPsf ? priceScoreData.marketLowPsf * squareFootage : 0),
            marketMedian: priceScoreData.breakdown?.zondaTotalMedian || (squareFootage && priceScoreData.marketMedianPsf ? priceScoreData.marketMedianPsf * squareFootage : 0),
            marketHigh: priceScoreData.breakdown?.zondaTotalHigh || (squareFootage && priceScoreData.marketHighPsf ? priceScoreData.marketHighPsf * squareFootage : 0),
            dataSource: priceScoreData.dataSource || 'psf',
            regionalMultiplier: priceScoreData.regionalMultiplier || 1.0,
            regionName: priceScoreData.regionalName || 'National Average',
            flaggedIssues: flaggedIssues || [],
            lowballDetected: lowballDetected || false,
            lowballReason: lowballReason || undefined,
            stateCode: stateCode || undefined,
            zipCode: zipCode || undefined
          })
        });
        
        const data = await response.json();
        if (data.success && data.result) {
          setPriceIntelligence(data.result);
        }
      } catch (err) {
        console.error('Price intelligence fetch failed:', err);
      } finally {
        setIntelligenceLoading(false);
      }
    };
    
    fetchIntelligence();
  }, [priceScoreData, bidTotal, projectType]);  // Re-run if core data changes

  // Extract values with defaults (needed before useMemo hooks)
  const verdict = priceScoreData?.verdict ?? '';
  const percentDiff = priceScoreData?.percentDiff ?? 0;
  const bidPsf = priceScoreData?.bidPsf ?? 0;
  const marketLowPsf = priceScoreData?.marketLowPsf ?? 0;
  const marketMedianPsf = priceScoreData?.marketMedianPsf ?? 0;
  const marketHighPsf = priceScoreData?.marketHighPsf ?? 0;
  const tradeBreakdown = priceScoreData?.tradeBreakdown;
  const regionalMultiplier = priceScoreData?.regionalMultiplier;
  const regionalName = priceScoreData?.regionalName;
  const dataSource = priceScoreData?.dataSource;
  const dataSourceName = priceScoreData?.dataSourceName;
  const zondaCitation = priceScoreData?.zondaCitation;
  const breakdown = priceScoreData?.breakdown;
  const confidence = priceScoreData?.confidence;
  const crossSourceValidation = priceScoreData?.crossSourceValidation;
  const detectedTier = priceScoreData?.detectedTier;

  // Confidence indicator config - must be before early returns
  const confidenceConfig = useMemo(() => {
    switch (confidence) {
      case 'high':
        return {
          label: 'High Confidence',
          description: 'Based on verified market data for your exact area',
          color: 'text-emerald-700',
          bg: 'bg-emerald-100',
          barColor: 'bg-emerald-500',
          barWidth: 'w-full',
          dots: 3
        };
      case 'medium':
        return {
          label: 'Medium Confidence',
          description: 'Based on regional averages and industry benchmarks',
          color: 'text-amber-700',
          bg: 'bg-amber-100',
          barColor: 'bg-amber-500',
          barWidth: 'w-2/3',
          dots: 2
        };
      case 'low':
        return {
          label: 'Low Confidence',
          description: 'Limited data available - using national averages',
          color: 'text-slate-600',
          bg: 'bg-slate-100',
          barColor: 'bg-slate-400',
          barWidth: 'w-1/3',
          dots: 1
        };
      default:
        return {
          label: 'Estimated',
          description: 'Based on available market data',
          color: 'text-slate-600',
          bg: 'bg-slate-100',
          barColor: 'bg-slate-400',
          barWidth: 'w-1/2',
          dots: 2
        };
    }
  }, [confidence]);

  // Determine if we're using Zonda total-based pricing
  const isZondaPricing = dataSource === 'zonda';
  
  // Calculate market totals - use Zonda totals directly if available, otherwise derive from PSF
  const marketTotalLow = breakdown?.zondaTotalLow || (squareFootage && marketLowPsf ? marketLowPsf * squareFootage : 0);
  const marketTotalMedian = breakdown?.zondaTotalMedian || (squareFootage && marketMedianPsf ? marketMedianPsf * squareFootage : 0);
  const marketTotalHigh = breakdown?.zondaTotalHigh || (squareFootage && marketHighPsf ? marketHighPsf * squareFootage : 0);

  // Determine verdict styling
  const verdictConfig = useMemo(() => {
    const v = verdict.toLowerCase();
    if (v.includes('great deal') || v.includes('below market')) {
      return {
        color: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        icon: <TrendingDown className="w-5 h-5 text-emerald-600" />,
        label: 'Below Market',
        description: 'This bid is priced competitively below typical market rates'
      };
    }
    if (v.includes('fair') || v.includes('market rate') || v.includes('competitive')) {
      return {
        color: 'text-blue-700',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: <Minus className="w-5 h-5 text-blue-600" />,
        label: 'Market Rate',
        description: 'This bid is priced in line with typical market rates'
      };
    }
    if (v.includes('slightly above')) {
      return {
        color: 'text-amber-700',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        icon: <TrendingUp className="w-5 h-5 text-amber-600" />,
        label: 'Above Market',
        description: 'This bid is priced somewhat higher than typical rates'
      };
    }
    if (v.includes('significantly above') || v.includes('premium')) {
      return {
        color: 'text-red-700',
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: <TrendingUp className="w-5 h-5 text-red-600" />,
        label: 'Premium Pricing',
        description: 'This bid is priced significantly above typical market rates'
      };
    }
    if (v.includes('suspiciously') || v.includes('undercutting')) {
      return {
        color: 'text-[#1F9C4C]',
        bg: 'bg-[#1F9C4C]',
        border: 'border-[#1F9C4C]',
        icon: <AlertTriangle className="w-5 h-5 text-white" />,
        label: 'Unusually Low',
        description: 'Price seems too low - could indicate cut corners or hidden costs'
      };
    }
    return {
      color: 'text-navy-700',
      bg: 'bg-navy-50',
      border: 'border-navy-200',
      icon: <Info className="w-5 h-5 text-navy-600" />,
      label: 'Under Review',
      description: verdict
    };
  }, [verdict]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  const formatPsf = (val: number | undefined | null) => {
    if (val == null || isNaN(val)) return '$0.00/sf';
    return `$${val.toFixed(2)}/sf`;
  };

  // Format per-unit price for window projects
  const formatPerUnit = (val: number | undefined | null) => {
    if (val == null || isNaN(val)) return '$0/window';
    return `$${Math.round(val).toLocaleString()}/window`;
  };

  // Format per-linear-foot price for fence/gutter/railing projects
  const formatPerLF = (val: number | undefined | null) => {
    if (val == null || isNaN(val)) return '$0/LF';
    return `$${val.toFixed(2)}/LF`;
  };

  // Early returns AFTER all hooks are defined
  if (isLoading) {
    return (
      <div className="bg-white border border-navy-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 flex items-center gap-4 border-b border-slate-200">
          <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <BarChart3 className="w-8 h-8 text-emerald-800" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800">Price Analysis</h3>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-navy-100 rounded-xl"></div>
            <div className="h-24 bg-navy-100 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!priceScoreData) {
    return null;
  }

  return (
    <div className="bg-white border border-navy-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 flex items-center gap-4 border-b border-slate-200">
        <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <BarChart3 className="w-8 h-8 text-emerald-800" />
        </div>
        <h3 className="text-2xl font-bold text-slate-800">Price Analysis</h3>
      </div>

      {/* Verdict Section */}
      <div className="bg-white border-b border-white px-6 py-5">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl ${verdictConfig.bg} border ${verdictConfig.border} flex items-center justify-center`}>
            {verdictConfig.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-lg font-bold ${verdictConfig.color}`}>{verdictConfig.label}</span>
              {percentDiff != null && percentDiff !== 0 && !isNaN(percentDiff) && (
                <span className={`text-sm font-medium ${percentDiff < 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  ({percentDiff > 0 ? '+' : ''}{percentDiff.toFixed(0)}%)
                </span>
              )}
            </div>
            <p className="text-sm text-navy-600">{verdictConfig.description}</p>
          </div>
        </div>
        
        {/* Confidence Indicator */}
        {confidence && (
          <div className="mt-4 pt-4 border-t border-navy-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${confidenceConfig.color}`}>
                  {confidenceConfig.label}
                </span>
                <div className="flex items-center gap-1">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i < confidenceConfig.dots 
                          ? confidenceConfig.barColor 
                          : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <span className="text-[10px] text-slate-500">{confidenceConfig.description}</span>
            </div>
          </div>
        )}
        
        {/* Linear Feet Missing Warning */}
        {missingLinearFeet && (
          <div className="mt-4 pt-4 border-t border-navy-100">
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Linear feet measurement needed</p>
                <p className="text-xs text-amber-700 mt-1">
                  For accurate pricing on {projectType?.replace('-', ' ')} projects, enter the total linear feet above. Without this, we're using project total comparisons which may be less precise.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* AI Price Intelligence Summary */}
        {(priceIntelligence || intelligenceLoading) && (
          <div className="mt-4 pt-4 border-t border-navy-100">
            {intelligenceLoading ? (
              <div className="flex items-center gap-2 text-sm text-navy-500">
                <Sparkles className="w-4 h-4 animate-pulse text-emerald-500" />
                <span>Analyzing pricing...</span>
              </div>
            ) : priceIntelligence && (
              <div className="space-y-3">
                {/* AI Summary */}
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-navy-700 leading-relaxed">
                    {priceIntelligence.priceSummary}
                  </p>
                </div>
                
                {/* Price Drivers - Expandable */}
                {priceIntelligence.primaryDrivers.length > 0 && (
                  <div>
                    <button 
                      onClick={() => setShowDrivers(!showDrivers)}
                      className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800 transition-colors"
                    >
                      <Lightbulb className="w-3.5 h-3.5" />
                      What's driving this price?
                      {showDrivers ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    
                    {showDrivers && (
                      <div className="mt-2 space-y-2">
                        {priceIntelligence.primaryDrivers.map((driver, idx) => (
                          <div 
                            key={idx}
                            className={`flex items-start gap-2 p-2 rounded-lg text-xs ${
                              driver.direction === 'up' 
                                ? 'bg-amber-50 border border-amber-200' 
                                : driver.direction === 'down'
                                  ? 'bg-emerald-50 border border-emerald-200'
                                  : 'bg-navy-50 border border-navy-200'
                            }`}
                          >
                            <div className={`flex-shrink-0 mt-0.5 ${
                              driver.direction === 'up' ? 'text-amber-600' 
                              : driver.direction === 'down' ? 'text-emerald-600' 
                              : 'text-navy-500'
                            }`}>
                              {driver.direction === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> 
                              : driver.direction === 'down' ? <TrendingDown className="w-3.5 h-3.5" /> 
                              : <Minus className="w-3.5 h-3.5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-navy-800">{driver.item}</span>
                                <span className={`font-medium ${
                                  driver.direction === 'up' ? 'text-amber-700' 
                                  : driver.direction === 'down' ? 'text-emerald-700' 
                                  : 'text-navy-600'
                                }`}>{driver.impact}</span>
                              </div>
                              <p className="text-navy-600 mt-0.5">{driver.explanation}</p>
                            </div>
                          </div>
                        ))}
                        
                        {/* Regional Context */}
                        {priceIntelligence.regionalContext && (
                          <div className="flex items-start gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs">
                            <Info className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <p className="text-blue-800">{priceIntelligence.regionalContext}</p>
                          </div>
                        )}
                        
                        {/* Material Flags */}
                        {priceIntelligence.materialFlags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {priceIntelligence.materialFlags.map((flag, idx) => (
                              <span 
                                key={idx}
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium ${
                                  flag.trend === 'rising' 
                                    ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                                    : flag.trend === 'falling'
                                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}
                                title={flag.note}
                              >
                                {flag.trend === 'rising' ? <TrendingUp className="w-2.5 h-2.5" /> 
                                : flag.trend === 'falling' ? <TrendingDown className="w-2.5 h-2.5" /> 
                                : <Minus className="w-2.5 h-2.5" />}
                                {flag.material}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Price Comparison - Three Tier Display */}
      <div className="px-6 py-5">
        {/* Your Bid - Prominent Display */}
        <div className="text-center p-4 bg-navy-50 rounded-xl mb-4">
          <div className="flex items-center justify-center gap-2 mb-1">
            <p className="text-xs text-navy-500">Your Bid</p>
            {detectedTier && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                detectedTier === 'upscale' 
                  ? 'bg-amber-100 text-amber-700' 
                  : detectedTier === 'minor'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-blue-100 text-blue-700'
              }`}>
                <Shield className="w-2.5 h-2.5" />
                {detectedTier === 'minor' ? 'Budget' : detectedTier === 'upscale' ? 'Upscale' : 'Midrange'}
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-navy-900">{formatCurrency(bidTotal)}</p>
          {isLinearFootProject && linearFeet && bidPsf > 0 ? (
            <p className="text-sm text-navy-500 mt-1">{formatPerLF(bidPsf)} • {linearFeet} linear feet</p>
          ) : isWindowProject && windowCount && bidPsf > 0 ? (
            <p className="text-sm text-navy-500 mt-1">{formatPerUnit(bidPsf)} • {windowCount} windows</p>
          ) : squareFootage && bidPsf > 0 ? (
            <p className="text-sm text-navy-500 mt-1">{formatPsf(bidPsf)}</p>
          ) : null}
        </div>
        
        {/* Market Range - Three Tiers */}
        <div className="mb-4">
          <div className="flex items-center justify-center gap-2 mb-3">
            <p className="text-xs font-medium text-navy-600">Market Price Range</p>
            {isZondaPricing && dataSourceName && (
              <span className="px-2 py-0.5 text-[10px] bg-emerald-100 text-emerald-700 rounded-full">
                {dataSourceName}
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {/* Budget Tier */}
            <div className={`text-center p-3 rounded-xl border-2 transition-all ${
              bidTotal <= marketTotalLow 
                ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-200' 
                : 'bg-emerald-50/50 border-emerald-200'
            }`}>
              <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide mb-1">Budget</p>
              <p className="text-sm font-bold text-emerald-700">
                {isLinearFootProject && linearFeet && marketLowPsf > 0
                  ? formatCurrency(marketLowPsf * linearFeet)
                  : isWindowProject && windowCount && marketLowPsf > 0 
                    ? formatCurrency(marketLowPsf * windowCount) 
                    : marketTotalLow > 0 
                      ? formatCurrency(marketTotalLow) 
                      : isLinearFootProject ? formatPerLF(marketLowPsf) 
                        : isWindowProject ? formatPerUnit(marketLowPsf) : formatPsf(marketLowPsf)}
              </p>
              {!isZondaPricing && (
                isLinearFootProject && linearFeet && marketLowPsf > 0 ? (
                  <p className="text-[10px] text-emerald-600">{formatPerLF(marketLowPsf)}</p>
                ) : isWindowProject && windowCount && marketLowPsf > 0 ? (
                  <p className="text-[10px] text-emerald-600">{formatPerUnit(marketLowPsf)}</p>
                ) : squareFootage && marketLowPsf > 0 ? (
                  <p className="text-[10px] text-emerald-600">{formatPsf(marketLowPsf)}</p>
                ) : null
              )}
              {bidTotal <= marketTotalLow && marketTotalLow > 0 && (
                <span className="inline-block mt-1 px-1.5 py-0.5 text-[9px] font-bold bg-emerald-600 text-white rounded">YOUR BID</span>
              )}
            </div>
            
            {/* Standard Tier */}
            <div className={`text-center p-3 rounded-xl border-2 transition-all ${
              bidTotal > marketTotalLow && bidTotal <= marketTotalHigh 
                ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-200' 
                : 'bg-blue-50/50 border-blue-200'
            }`}>
              <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide mb-1">Standard</p>
              <p className="text-sm font-bold text-blue-700">
                {isLinearFootProject && linearFeet && marketMedianPsf > 0
                  ? formatCurrency(marketMedianPsf * linearFeet)
                  : isWindowProject && windowCount && marketMedianPsf > 0 
                    ? formatCurrency(marketMedianPsf * windowCount) 
                    : marketTotalMedian > 0 
                      ? formatCurrency(marketTotalMedian) 
                      : isLinearFootProject ? formatPerLF(marketMedianPsf) 
                        : isWindowProject ? formatPerUnit(marketMedianPsf) : formatPsf(marketMedianPsf)}
              </p>
              {!isZondaPricing && (
                isLinearFootProject && linearFeet && marketMedianPsf > 0 ? (
                  <p className="text-[10px] text-blue-600">{formatPerLF(marketMedianPsf)}</p>
                ) : isWindowProject && windowCount && marketMedianPsf > 0 ? (
                  <p className="text-[10px] text-blue-600">{formatPerUnit(marketMedianPsf)}</p>
                ) : squareFootage && marketMedianPsf > 0 ? (
                  <p className="text-[10px] text-blue-600">{formatPsf(marketMedianPsf)}</p>
                ) : null
              )}
              {bidTotal > marketTotalLow && bidTotal <= marketTotalHigh && marketTotalMedian > 0 && (
                <span className="inline-block mt-1 px-1.5 py-0.5 text-[9px] font-bold bg-blue-600 text-white rounded">YOUR BID</span>
              )}
            </div>
            
            {/* Premium Tier */}
            <div className={`text-center p-3 rounded-xl border-2 transition-all ${
              bidTotal > marketTotalHigh 
                ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-200' 
                : 'bg-amber-50/50 border-amber-200'
            }`}>
              <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide mb-1">Premium</p>
              <p className="text-sm font-bold text-amber-700">
                {isLinearFootProject && linearFeet && marketHighPsf > 0
                  ? formatCurrency(marketHighPsf * linearFeet)
                  : isWindowProject && windowCount && marketHighPsf > 0 
                    ? formatCurrency(marketHighPsf * windowCount) 
                    : marketTotalHigh > 0 
                      ? formatCurrency(marketTotalHigh) 
                      : isLinearFootProject ? formatPerLF(marketHighPsf) 
                        : isWindowProject ? formatPerUnit(marketHighPsf) : formatPsf(marketHighPsf)}
              </p>
              {!isZondaPricing && (
                isLinearFootProject && linearFeet && marketHighPsf > 0 ? (
                  <p className="text-[10px] text-amber-600">{formatPerLF(marketHighPsf)}</p>
                ) : isWindowProject && windowCount && marketHighPsf > 0 ? (
                  <p className="text-[10px] text-amber-600">{formatPerUnit(marketHighPsf)}</p>
                ) : squareFootage && marketHighPsf > 0 ? (
                  <p className="text-[10px] text-amber-600">{formatPsf(marketHighPsf)}</p>
                ) : null
              )}
              {bidTotal > marketTotalHigh && marketTotalHigh > 0 && (
                <span className="inline-block mt-1 px-1.5 py-0.5 text-[9px] font-bold bg-amber-600 text-white rounded">YOUR BID</span>
              )}
            </div>
          </div>
        </div>
        
        {/* Difference from Median */}
        <div className="text-center p-3 bg-white border border-navy-200 rounded-xl mb-4">
          <p className="text-xs text-navy-500 mb-1">Difference from Market Median</p>
          <p className={`text-lg font-bold ${percentDiff < 0 ? 'text-emerald-600' : percentDiff > 15 ? 'text-red-600' : 'text-amber-600'}`}>
            {percentDiff > 0 ? '+' : ''}{(percentDiff ?? 0).toFixed(0)}%
            <span className="text-sm font-normal text-navy-500 ml-2">
              ({percentDiff < 0 ? 'below' : 'above'} median)
            </span>
          </p>
        </div>
        
        {/* Regional Adjustment Indicator */}
        {regionalMultiplier && regionalMultiplier !== 1.0 && regionalName && (
          <div className="flex items-center justify-center gap-2 text-xs text-navy-600 bg-navy-50 rounded-lg py-2 px-3 mb-4">
            <Info className="w-3.5 h-3.5 text-navy-500" />
            <span>
              Adjusted for <strong>{regionalName}</strong> ({regionalMultiplier > 1 ? '+' : ''}{((regionalMultiplier - 1) * 100).toFixed(0)}% vs national avg)
            </span>
          </div>
        )}

        {/* ROI / Investment Recovery Section */}
        {(() => {
          const roiData = projectType ? getRoiDisplay(projectType) : null;
          if (!roiData?.hasRoi) return null;
          
          const isHighRoi = projectType ? isHighRoiProject(projectType) : false;
          
          return (
            <div className={`rounded-xl p-3 mb-4 border ${
              isHighRoi 
                ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200' 
                : 'bg-blue-50/50 border-blue-200'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${isHighRoi ? 'bg-emerald-100' : 'bg-blue-100'}`}>
                  <Home className={`w-4 h-4 ${isHighRoi ? 'text-emerald-600' : 'text-blue-600'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-semibold ${isHighRoi ? 'text-emerald-700' : 'text-blue-700'}`}>
                      {roiData.recoveryPercent} Cost Recovery
                    </span>
                    {roiData.highlight && (
                      <span className="px-2 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 rounded-full">
                        {roiData.highlight}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-navy-600 mt-1">
                    This project type typically recovers <strong>{roiData.recoveryPercent}</strong> of its cost at resale.
                    {roiData.joyScore && roiData.joyScore >= 9.0 && (
                      <span className="inline-flex items-center gap-1 ml-1">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span className="text-amber-600 font-medium">High satisfaction ({roiData.joyScore}/10)</span>
                      </span>
                    )}
                  </p>
                  {roiData.source && (
                    <p className="text-[10px] text-navy-400 mt-1">Source: {roiData.source}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Cross-Source Validation Display */}
        {crossSourceValidation && (crossSourceValidation.houzzRange || crossSourceValidation.zondaRange || crossSourceValidation.blsEstimate) && (
          <div className={`rounded-xl p-3 mb-4 border ${
            crossSourceValidation.sourcesAgree 
              ? 'bg-emerald-50/50 border-emerald-200' 
              : crossSourceValidation.confidence === 'medium'
                ? 'bg-blue-50/50 border-blue-200'
                : 'bg-amber-50/50 border-amber-200'
          }`}>
            <div className="flex items-start gap-2">
              {crossSourceValidation.sourcesAgree ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-semibold ${
                    crossSourceValidation.sourcesAgree ? 'text-emerald-700' : 'text-blue-700'
                  }`}>
                    {crossSourceValidation.confidence === 'high' ? 'High Confidence' : 
                     crossSourceValidation.confidence === 'medium' ? 'Multiple Sources' : 'Limited Data'}
                  </span>
                  <span className="text-[10px] text-navy-500">
                    {crossSourceValidation.sourcesUsed?.length > 0 
                      ? `${crossSourceValidation.sourcesUsed.length} data sources`
                      : crossSourceValidation.confidenceDescription}
                  </span>
                </div>
                
                {/* Source comparison - 3-column grid for all sources */}
                <div className={`mt-2 grid gap-2 ${
                  crossSourceValidation.blsEstimate 
                    ? 'grid-cols-3' 
                    : 'grid-cols-2'
                }`}>
                  {crossSourceValidation.houzzRange && (
                    <div className="bg-white/60 rounded-lg px-2.5 py-1.5 border border-orange-200">
                      <p className="text-[10px] text-orange-600 font-medium">Houzz 2024</p>
                      <p className="text-xs font-semibold text-navy-700">
                        ${crossSourceValidation.houzzRange.low.toLocaleString()} - ${crossSourceValidation.houzzRange.high.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {crossSourceValidation.zondaRange && (
                    <div className="bg-white/60 rounded-lg px-2.5 py-1.5 border border-emerald-200">
                      <p className="text-[10px] text-emerald-600 font-medium">Zonda 2025</p>
                      <p className="text-xs font-semibold text-navy-700">
                        ${crossSourceValidation.zondaRange.low.toLocaleString()} - ${crossSourceValidation.zondaRange.high.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {crossSourceValidation.blsEstimate && (
                    <div className="bg-white/60 rounded-lg px-2.5 py-1.5 border border-blue-200">
                      <p className="text-[10px] text-blue-600 font-medium">BLS Labor Est.</p>
                      <p className="text-xs font-semibold text-navy-700">
                        ${crossSourceValidation.blsEstimate.low.toLocaleString()} - ${crossSourceValidation.blsEstimate.high.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trade Breakdown - Premium Feature */}
        {isPremium && tradeMixData && tradeMixData.trades.length > 0 && (
          <div className="mt-5 pt-5 border-t border-navy-100">
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-sm font-semibold text-navy-900">Trade Mix Analysis</h4>
              <span className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded-full">
                {tradeMixData.confidence} confidence
              </span>
            </div>
            
            <div className="space-y-2">
              {tradeMixData.trades.slice(0, 5).map((trade, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-navy-700">{trade.name}</span>
                      <span className="text-sm font-medium text-navy-900">{((trade.weight ?? 0) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-navy-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all"
                        style={{ width: `${trade.weight * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {tradeMixData.materialRatio != null && tradeMixData.materialRatio > 0 && (
              <div className="mt-3 flex items-center gap-2 text-sm text-navy-600">
                <DollarSign className="w-4 h-4" />
                <span>Estimated material ratio: <strong>{((tradeMixData.materialRatio ?? 0) * 100).toFixed(0)}%</strong></span>
              </div>
            )}
          </div>
        )}

        {/* Live BLS Rates Detail - Premium Feature */}
        {isPremium && tradeBreakdown && tradeBreakdown.length > 0 && tradeBreakdown.some(t => t.source === 'live') && (
          <div className="mt-5 pt-5 border-t border-navy-100">
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-sm font-semibold text-navy-900">Live Wage Data</h4>
              <span className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded-full">
                Bureau of Labor Statistics
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {tradeBreakdown.filter(t => t.source === 'live').slice(0, 4).map((trade, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-navy-50 rounded-lg">
                  <span className="text-xs text-navy-600 truncate">{trade.trade}</span>
                  <span className="text-xs font-semibold text-emerald-700">
                    ${(trade.hourlyRate ?? 0).toFixed(2)}/hr
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Non-Premium Teaser */}
        {!isPremium && (
          <div className="mt-5 pt-5 border-t border-navy-100">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <BarChart3 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-navy-900">Unlock Advanced Price Intelligence</p>
                  <p className="text-xs text-navy-600 mt-1">
                    Premium members see trade mix analysis, live BLS wage data, and detailed cost breakdowns.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Data Attribution with Recency Badges */}
        <div className="pt-3 mt-4 border-t border-navy-100">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <a 
              href="https://www.houzz.com/magazine/how-much-does-it-cost-stsetivw-vs~165463968"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-full text-xs text-orange-700 transition-colors"
            >
              <Database className="w-3 h-3" />
              Houzz 2024
            </a>
            <a 
              href={zondaCitation || "https://www.jlconline.com/how-to/zonda-cost-vs-value"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-full text-xs text-emerald-700 transition-colors"
            >
              <Database className="w-3 h-3" />
              Zonda 2025
            </a>
            {!isZondaPricing && (
              <a 
                href="https://www.bls.gov/oes/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-full text-xs text-blue-700 transition-colors"
              >
                <Database className="w-3 h-3" />
                BLS May 2024
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
