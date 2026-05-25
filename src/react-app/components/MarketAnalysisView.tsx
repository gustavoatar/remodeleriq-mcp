import { useMemo, useState, useEffect, useCallback } from 'react';
import { 
  ExternalLink, CheckCircle, ChevronDown, ChevronRight, Scale, TrendingUp, TrendingDown, Minus,
  TreePine, Square, Paintbrush, LayoutGrid, Blocks, Pipette, Zap,
  Bot, MessageCircle, Loader2, AlertCircle, Calendar, Lightbulb, AlertTriangle,
  RefreshCw, Database, FileText,
  Boxes, Layers, Droplets, Home, Trees, MapPin, Bug, Thermometer, Shield, FileWarning
} from 'lucide-react';
import { getStateLaws } from '@/shared/stateLaws';
import { useUserLocation } from '@/react-app/hooks/useGeolocation';
import { extractDetectedData } from './ProjectDataEditor';
import { extractBidTotal, detectProjectTrade } from '@/shared/analysisEngine';
import LaborBreakdownCard from './LaborBreakdownCard';
import WageRateCard from './WageRateCard';
import {
  calculateTrend,
  getTrendStatus,
  generateMarketSummary,
  getSeasonalAlert,
  SOURCING_TIP,
  formatPercentage,
  MATERIAL_DATA,
  type MaterialTrend,
  type MarketSummary,
  type SeasonalAlert,
  type MaterialKey,
  type ProjectType
} from '@/shared/materialMarketEngine';

interface MarketAnalysisViewProps {
  bidContent: string;
  userTier?: 'anonymous' | 'free' | 'premium';
  uploadOverrides?: {
    projectType?: string | null;
    squareFootage?: number | null;
  };
  isPremium?: boolean;
  onGenerateScript?: () => void;
  // Synced data from Home.tsx
  bidTotal?: number | null;
  squareFootage?: number | null;
  windowCount?: number | null;
  stateCode?: string | null;
  yearBuilt?: number;
  projectZipCode?: string | null;
  priceScoreData?: {
    score: number;
    verdict: string;
    percentDiff: number;
    marketLowPsf?: number;
    marketMedianPsf?: number;
    marketHighPsf?: number;
    regionalMultiplier?: number;
    regionalName?: string;
    dataSource?: string;
    breakdown?: {
      zondaTotalLow?: number;
      zondaTotalMedian?: number;
      zondaTotalHigh?: number;
    };
  } | null;
}

// Types for Community data
type CommunitySentiment = 'positive' | 'neutral' | 'cautious' | 'frustrated';

interface RegionalInsight {
  topic: string;
  concern: string;
  redditTakeaway: string;
  questionToAsk: string;
  severity: 'info' | 'warning' | 'critical';
}

interface RegionalInsightsData {
  stateCode: string;
  stateName: string;
  climate: string;
  overview: string;
  insights: RegionalInsight[];
  commonScams: string[];
  licensingNotes: string;
}

interface CommunityInsight {
  sentiment: CommunitySentiment;
  threadCount: number;
  synthesis: string;
  topics: string[];
  regionalData?: RegionalInsightsData | null;
  relevantRegionalInsights?: RegionalInsight[];
}

const SENTIMENT_CONFIG: Record<CommunitySentiment, {
  emoji: string;
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
}> = {
  positive: { emoji: '😊', color: 'text-emerald-700', bgColor: 'bg-emerald-100', borderColor: 'border-emerald-300', label: 'Positive' },
  neutral: { emoji: '😐', color: 'text-slate-700', bgColor: 'bg-slate-200', borderColor: 'border-slate-300', label: 'Neutral' },
  cautious: { emoji: '🤔', color: 'text-amber-700', bgColor: 'bg-amber-100', borderColor: 'border-amber-300', label: 'Cautious' },
  frustrated: { emoji: '😤', color: 'text-red-700', bgColor: 'bg-red-100', borderColor: 'border-red-300', label: 'Frustrated' }
};

// Icon mapping
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  TreePine,
  Square,
  Paintbrush,
  LayoutGrid,
  Blocks,
  Pipette,
  Zap,
  Boxes,
  Layers,
  Droplets,
  Home,
  Trees
};

// Consumer-friendly materials for each project type (more relatable than BLS commodities)
interface ConsumerMaterial {
  name: string;
  icon: string;
  change: number;
  direction: 'up' | 'down' | 'stable';
  period: string;
  blsKey?: MaterialKey; // Maps to BLS commodity to avoid duplication
}

interface ProjectMarketIntelligence {
  materials: ConsumerMaterial[];
  insight: string;
}

const CONSUMER_MATERIALS_BY_PROJECT: Record<ProjectType, ProjectMarketIntelligence> = {
  kitchen: {
    materials: [
      { name: 'Hardwood/Plywood', icon: 'Boxes', change: 3.8, direction: 'up', period: 'Last 6mo', blsKey: 'lumber' },
      { name: 'Appliances', icon: 'Zap', change: 2.1, direction: 'up', period: 'Last 6mo' },
      { name: 'Countertops', icon: 'Layers', change: 0.4, direction: 'stable', period: 'Last 6mo' }
    ],
    insight: 'Cabinet-grade plywood prices have risen steadily due to supply chain constraints. Appliance delivery times have improved but premium brands still face delays. Consider locking in cabinet and appliance orders early to avoid price increases.'
  },
  bathroom: {
    materials: [
      { name: 'Ceramic Tile', icon: 'Layers', change: 4.2, direction: 'up', period: 'Last 6mo', blsKey: 'tile' },
      { name: 'Plumbing Fixtures', icon: 'Droplets', change: 2.8, direction: 'up', period: 'Last 6mo', blsKey: 'copper' },
      { name: 'Paint', icon: 'Paintbrush', change: 0.6, direction: 'stable', period: 'Last 6mo', blsKey: 'paint' }
    ],
    insight: 'Tile prices have seen a notable 6-month rise due to manufacturing constraints. Contractors may shorten quote validity periods. Advise locking in material selections early and purchasing tile with 10% overage.'
  },
  addition: {
    materials: [
      { name: 'Framing Lumber', icon: 'Trees', change: -2.4, direction: 'down', period: 'Last 6mo', blsKey: 'lumber' },
      { name: 'Roofing', icon: 'Home', change: 5.2, direction: 'up', period: 'Last 6mo' },
      { name: 'Windows', icon: 'Layers', change: 3.9, direction: 'up', period: 'Last 6mo' }
    ],
    insight: 'While lumber has softened, roofing materials and quality windows continue to see price pressure. Foundation and concrete costs remain elevated. Lock in window orders early as custom sizes have extended lead times.'
  },
  general: {
    materials: [
      { name: 'Lumber', icon: 'Trees', change: -1.2, direction: 'down', period: 'Last 6mo', blsKey: 'lumber' },
      { name: 'Drywall', icon: 'Layers', change: 1.8, direction: 'up', period: 'Last 6mo', blsKey: 'drywall' },
      { name: 'Paint', icon: 'Paintbrush', change: 0.6, direction: 'stable', period: 'Last 6mo', blsKey: 'paint' }
    ],
    insight: 'Overall construction material costs have stabilized compared to recent years. Lumber prices have decreased while drywall and finish materials remain slightly elevated. Get detailed material breakdowns in bids to compare pricing.'
  }
};

// Project type to materials mapping
const PROJECT_MATERIALS_MAP: Record<ProjectType, MaterialKey[]> = {
  kitchen: ['lumber', 'paint', 'tile', 'copper', 'electrical'],
  bathroom: ['tile', 'copper', 'paint', 'drywall'],
  addition: ['concrete', 'lumber', 'drywall', 'paint', 'electrical'],
  general: ['lumber', 'drywall', 'paint', 'tile', 'concrete', 'copper', 'electrical']
};

// Project-specific actionable insights
// ProjectInsights interface and data moved to Graveyard.tsx (Feb 2025)

// Normalize project type string (still used by MaterialMarketAdvisoryCard)
function normalizeProjectType(projectType: string): ProjectType {
  const normalized = projectType.toLowerCase();
  if (normalized.includes('kitchen')) return 'kitchen';
  if (normalized.includes('bath')) return 'bathroom';
  if (normalized.includes('addition') || normalized.includes('room add')) return 'addition';
  return 'general';
}

interface PPIApiResponse {
  success: boolean;
  source: 'cache' | 'cache-stale' | 'fallback' | 'error';
  data: Record<string, { current: number; baseline: number; history: number[] }> | null;
  lastRefresh: string | null;
  needsRefresh: boolean;
  hasApiKey: boolean;
  message?: string;
}

export default function MarketAnalysisView({ 
  bidContent, 
  userTier: _userTier = 'anonymous', 
  uploadOverrides, 
  onGenerateScript,
  bidTotal: propBidTotal,
  squareFootage: propSquareFootage,
  windowCount: _propWindowCount,
  stateCode: propStateCode,
  yearBuilt: _propYearBuilt,
  projectZipCode: _propProjectZipCode,
  priceScoreData: _priceScoreData
}: MarketAnalysisViewProps) {
  // Use passed stateCode from Home.tsx, fall back to useUserLocation only if not provided
  const { stateCode: geoStateCode } = useUserLocation();
  const stateCode = propStateCode || geoStateCode || 'GA';
  const stateLaws = useMemo(() => getStateLaws(stateCode), [stateCode]);
  
  const rawBidTotal = propBidTotal ?? extractBidTotal(bidContent) ?? null;
  const detectedData = useMemo(() => {
    const extracted = extractDetectedData(bidContent, rawBidTotal);
    return {
      ...extracted,
      projectType: uploadOverrides?.projectType ?? extracted.projectType,
      // Use passed squareFootage from Home.tsx if available
      squareFootage: propSquareFootage ?? uploadOverrides?.squareFootage ?? extracted.squareFootage
    };
  }, [bidContent, rawBidTotal, uploadOverrides, propSquareFootage]);
  
  // Detect primary trade for labor breakdown analysis
  const primaryTrade = useMemo(() => {
    const tradeResult = detectProjectTrade(bidContent);
    return tradeResult?.primaryTrade || undefined;
  }, [bidContent]);

  return (
    <div className="min-h-screen pt-6 pb-16 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Market & Community Intelligence Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-lg font-bold text-navy-900">Market & Community Intelligence</h2>
        </div>

        {/* Materials Market Pulse - Project-specific material trends */}
        <MaterialMarketAdvisoryCard projectType={detectedData.projectType || 'general'} />



        {/* Labor Cost Breakdown - Bid's labor % vs Houzz industry standard */}
        <LaborBreakdownCard 
          bidContent={bidContent}
          projectType={detectedData.projectType}
          primaryTrade={primaryTrade}
          bidTotal={rawBidTotal}
        />

        {/* Wage Rate Reasonableness - Contractor rate vs BLS market data */}
        <WageRateCard 
          bidContent={bidContent}
          primaryTrade={primaryTrade}
          stateCode={stateCode}
          squareFootage={detectedData.squareFootage}
          projectType={detectedData.projectType}
        />

        {/* Community Pulse */}
        <CommunityPulseCard 
          bidContent={bidContent}
          projectType={detectedData.projectType}
          stateCode={stateCode}
        />

        {/* Project-Specific Actionable Insights - MOVED TO GRAVEYARD */}

        {/* State-Specific Education Section */}
        <StateEducationSection stateLaws={stateLaws} />

        {/* State Resources */}
        <div className="card-glass p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-navy-500 uppercase tracking-wider mb-3">
            {stateLaws.state} Homeowner Resources
          </h3>
          <div className="flex flex-wrap gap-4">
            <ResourceLink 
              href={stateLaws.licenseVerifyUrl}
              text={`Verify ${stateLaws.stateCode} Contractor License`}
            />
            <ResourceLink 
              href={stateLaws.consumerProtectionUrl}
              text={`${stateLaws.stateCode} Consumer Protection`}
            />
          </div>
        </div>

        {/* Ready to Negotiate CTA */}
        {onGenerateScript && (
          <div className="card-glass p-6 bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-navy-900">Ready to Negotiate?</h3>
                <p className="text-navy-600 text-sm mt-1">
                  Use these market insights to build your personalized negotiation script.
                </p>
              </div>
              <button
                onClick={onGenerateScript}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-6 rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-md whitespace-nowrap"
              >
                Generate Talk Track
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

/**
 * Materials Market Pulse Card - Shows material trends for the project type
 * Now fetches from API for consistent data with MaterialMarketAdvisory component
 */
function MaterialMarketAdvisoryCard({ projectType }: { projectType: string }) {
  const [apiData, setApiData] = useState<PPIApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch PPI data from API (same as MaterialMarketAdvisory component)
  const fetchPPIData = useCallback(async () => {
    try {
      const res = await fetch('/api/ppi/materials');
      const data = await res.json() as PPIApiResponse;
      setApiData(data);
    } catch (error) {
      console.error('Failed to fetch PPI data:', error);
      setApiData({ 
        success: false, 
        source: 'fallback', 
        data: null, 
        lastRefresh: null, 
        needsRefresh: true,
        hasApiKey: false
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPPIData();
  }, [fetchPPIData]);

  // Merge API data with fallback data (same logic as MaterialMarketAdvisory)
  const mergedMaterialData = useMemo(() => {
    if (!apiData?.data) return MATERIAL_DATA;

    const merged = { ...MATERIAL_DATA };
    for (const [key, liveData] of Object.entries(apiData.data)) {
      if (merged[key as MaterialKey]) {
        merged[key as MaterialKey] = {
          ...merged[key as MaterialKey],
          current: liveData.current,
          baseline: liveData.baseline,
          history: liveData.history.length >= 12 ? liveData.history : merged[key as MaterialKey].history
        };
      }
    }
    return merged;
  }, [apiData]);

  // Analyze trends using merged data
  const trends = useMemo(() => {
    const normalizedType = normalizeProjectType(projectType);
    const materialKeys = PROJECT_MATERIALS_MAP[normalizedType] || PROJECT_MATERIALS_MAP.general;
    
    return materialKeys.map(key => {
      const material = mergedMaterialData[key];
      const percentage = calculateTrend(material.current, material.baseline);
      const status = getTrendStatus(percentage);
      
      return {
        material,
        percentage,
        status
      };
    });
  }, [projectType, mergedMaterialData]);

  const summary = useMemo(() => generateMarketSummary(trends), [trends]);
  const seasonalAlert = useMemo(() => getSeasonalAlert(trends, new Date()), [trends]);

  const lastRefreshFormatted = useMemo(() => {
    if (!apiData?.lastRefresh) return null;
    const date = new Date(apiData.lastRefresh);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }, [apiData]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border-2 border-blue-100 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-blue-400 to-blue-600" />
        <div className="p-6 flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      </div>
    );
  }

  // Get consumer materials for this project type
  const normalizedType = normalizeProjectType(projectType);
  const baseConsumerData = CONSUMER_MATERIALS_BY_PROJECT[normalizedType] || CONSUMER_MATERIALS_BY_PROJECT.general;
  
  // Enrich consumer materials with real BLS 6-month data where available
  const consumerData = {
    ...baseConsumerData,
    materials: baseConsumerData.materials.map(material => {
      if (material.blsKey && mergedMaterialData[material.blsKey]) {
        const blsData = mergedMaterialData[material.blsKey];
        const realChange = calculateTrend(blsData.current, blsData.baseline);
        return {
          ...material,
          change: Math.abs(realChange),
          direction: realChange > 0.5 ? 'up' as const : realChange < -0.5 ? 'down' as const : 'stable' as const
        };
      }
      return material;
    })
  };

  // Filter out commodities that are already shown in the consumer materials section
  const highlightedBlsKeys = new Set(
    consumerData.materials
      .filter(m => m.blsKey)
      .map(m => m.blsKey)
  );
  const filteredTrends = trends.filter(trend => {
    // Find the key for this material by checking against MATERIAL_DATA
    const materialKey = Object.keys(mergedMaterialData).find(
      key => mergedMaterialData[key as MaterialKey].seriesId === trend.material.seriesId
    ) as MaterialKey | undefined;
    return !materialKey || !highlightedBlsKeys.has(materialKey);
  });

  return (
    <div className="bg-white rounded-2xl border-2 border-blue-100 shadow-sm overflow-hidden">
      {/* Top accent border */}
      <div className="h-1 bg-gradient-to-r from-blue-400 to-blue-600" />
      
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-navy-900">Materials Market Pulse</h3>
        </div>

        {/* Project-Specific Consumer Materials */}
        <div className="mb-6">
          <div className="grid grid-cols-3 gap-3 mb-4">
            {consumerData.materials.map((material) => (
              <ConsumerMaterialCard key={material.name} material={material} />
            ))}
          </div>
          
          {/* AI Analysis - Project-specific insight */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-100 shrink-0">
                <Bot className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-800 mb-1">AI Analysis</p>
                <p className="text-sm text-blue-700 leading-relaxed">{consumerData.insight}</p>
              </div>
            </div>
          </div>
        </div>

        {/* BLS Commodity Data Section - excludes materials already highlighted above */}
        {filteredTrends.length > 0 && (
          <div className="pt-4 border-t border-slate-200">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Other Construction Commodities</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-5">
              {filteredTrends.map((trend) => (
                <MaterialCard key={trend.material.seriesId} trend={trend} />
              ))}
            </div>
          </div>
        )}

        {/* Seasonal Alert */}
        {seasonalAlert.isActive && (
          <SeasonalAlertBox alert={seasonalAlert} />
        )}

        {/* AI Market Synthesis */}
        <AIMarketSynthesisBox summary={summary} />

        {/* Sourcing Tip */}
        <SourcingTipBox />

        {/* Data Attribution */}
        <div className="pt-3 mt-3 border-t border-slate-100">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <Database className="w-3 h-3" />
            <span>
              Source:{' '}
              <a 
                href="https://www.bls.gov/ppi/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 transition-colors"
              >
                Bureau of Labor Statistics PPI
              </a>
              {lastRefreshFormatted && (
                <span className="text-slate-300"> • Updated {lastRefreshFormatted}</span>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Consumer Material Card - Simplified display for consumer-friendly materials
 */
function ConsumerMaterialCard({ material }: { material: ConsumerMaterial }) {
  const IconComponent = ICON_MAP[material.icon] || Square;
  const isUp = material.direction === 'up';
  const isDown = material.direction === 'down';
  
  const TrendIcon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
  
  return (
    <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-200">
      {/* Icon */}
      <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center mx-auto mb-2">
        <IconComponent className="w-5 h-5 text-slate-600" />
      </div>
      
      {/* Material Name */}
      <h5 className="text-sm font-semibold text-navy-900 mb-1">{material.name}</h5>
      
      {/* Trend */}
      <div className="flex items-center justify-center gap-1">
        <TrendIcon 
          className={`w-3.5 h-3.5 ${
            isUp ? 'text-orange-500' : isDown ? 'text-emerald-500' : 'text-slate-400'
          }`} 
        />
        <span 
          className={`text-base font-bold ${
            isUp ? 'text-orange-600' : isDown ? 'text-emerald-600' : 'text-slate-600'
          }`}
        >
          {isDown ? '−' : isUp ? '+' : ''}{material.change}%
        </span>
      </div>
      
      {/* Period */}
      <p className="text-xs text-slate-500 mt-1">{material.period}</p>
    </div>
  );
}

/**
 * Material Card with status badge
 */
function MaterialCard({ trend }: { trend: MaterialTrend }) {
  const { material, percentage, status } = trend;
  const isSurge = status.status === 'Surge';
  const isDrop = status.status === 'Drop';
  const isRise = status.status === 'Rise';
  
  // Get the icon component
  const IconComponent = ICON_MAP[material.icon] || Square;
  
  // Determine trend icon
  const TrendIcon = percentage > 0.5 ? TrendingUp : percentage < -0.5 ? TrendingDown : Minus;
  
  // Status badge styling
  const getStatusBadgeStyle = () => {
    if (isSurge) return 'bg-red-100 text-red-700 border-red-200';
    if (isRise) return 'bg-orange-100 text-orange-700 border-orange-200';
    if (isDrop) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };
  
  return (
    <div 
      className={`relative p-4 rounded-xl border-2 transition-all hover:shadow-md ${
        isSurge 
          ? 'bg-red-50 border-red-200 hover:border-red-300' 
          : isDrop 
          ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-300'
          : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Status Badge - Top Right */}
      <span 
        className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getStatusBadgeStyle()}`}
      >
        {status.status}
      </span>
      
      {/* Icon */}
      <div 
        className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
          isSurge 
            ? 'bg-red-100' 
            : isDrop 
            ? 'bg-emerald-100'
            : 'bg-slate-100'
        }`}
        style={{ 
          backgroundColor: !isSurge && !isDrop ? `${material.color}15` : undefined 
        }}
      >
        <div style={{ color: isSurge ? '#DC2626' : isDrop ? '#059669' : material.color }}>
          <IconComponent className="w-5 h-5" />
        </div>
      </div>
      
      {/* Material Name */}
      <h5 className={`text-sm font-semibold mb-1 ${
        isSurge ? 'text-red-800' : isDrop ? 'text-emerald-800' : 'text-navy-900'
      }`}>
        {material.name}
      </h5>
      
      {/* Percentage Change */}
      <div className="flex items-center gap-1">
        <TrendIcon 
          className={`w-3.5 h-3.5 ${
            isSurge || isRise ? 'text-orange-500' : isDrop ? 'text-emerald-500' : 'text-slate-400'
          }`} 
        />
        <span 
          className={`text-lg font-bold tabular-nums ${
            isSurge ? 'text-red-600' : isRise ? 'text-orange-600' : isDrop ? 'text-emerald-600' : 'text-slate-600'
          }`}
        >
          {formatPercentage(percentage)}
        </span>
      </div>
    </div>
  );
}

/**
 * Seasonal Alert Box
 */
function SeasonalAlertBox({ alert }: { alert: SeasonalAlert }) {
  return (
    <div className="rounded-xl p-4 mb-4 bg-amber-50 border border-amber-200">
      <div className="flex items-start gap-3">
        <Calendar className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          <span className="font-semibold">⏰ {alert.message}</span>
        </p>
      </div>
    </div>
  );
}

/**
 * AI Market Synthesis Box
 */
function AIMarketSynthesisBox({ summary }: { summary: MarketSummary }) {
  const config = {
    alert: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
      titleColor: 'text-red-700',
      textColor: 'text-red-700'
    },
    opportunity: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      icon: <TrendingDown className="w-5 h-5 text-emerald-500" />,
      titleColor: 'text-emerald-700',
      textColor: 'text-emerald-700'
    },
    observation: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: <Bot className="w-5 h-5 text-blue-500" />,
      titleColor: 'text-blue-700',
      textColor: 'text-blue-700'
    }
  };

  const style = config[summary.type];

  return (
    <div className={`rounded-xl p-4 mb-4 border ${style.bg} ${style.border}`}>
      <div className="flex items-start gap-3">
        {style.icon}
        <div>
          <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${style.titleColor}`}>
            AI Market Synthesis
          </p>
          <p className={`text-sm leading-relaxed ${style.textColor}`}>
            {summary.message}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Sourcing Tip Box
 */
function SourcingTipBox() {
  return (
    <div className="rounded-xl p-4 bg-slate-50 border border-slate-200">
      <div className="flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            Sourcing Tip
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">
            {SOURCING_TIP}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Community Pulse Card
 */
function CommunityPulseCard({ 
  bidContent, 
  projectType,
  stateCode
}: { 
  bidContent: string;
  projectType?: string | null;
  stateCode?: string | null;
}) {
  const [insight, setInsight] = useState<CommunityInsight | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null);

  const fetchInsight = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/analyze/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bidText: bidContent,
          projectType: projectType || 'general',
          stateCode: stateCode || undefined
        })
      });

      const data = await response.json();
      
      if (data.success && data.insight) {
        setInsight(data.insight);
      } else {
        setError(data.error || 'Unable to fetch insights');
      }
    } catch {
      setError('Unable to connect');
    } finally {
      setIsLoading(false);
    }
  }, [bidContent, projectType, stateCode]);

  useEffect(() => {
    fetchInsight();
  }, [fetchInsight]);

  const sentimentConfig = insight ? SENTIMENT_CONFIG[insight.sentiment] : null;

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border-2 border-purple-100 shadow-sm overflow-hidden">
        <div className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !insight) {
    return (
      <div className="bg-white rounded-2xl border-2 border-purple-100 shadow-sm overflow-hidden p-5">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-bold text-navy-900">Community Pulse</h3>
        </div>
        <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">{error || 'Insights temporarily unavailable'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-purple-100 shadow-sm overflow-hidden">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-bold text-navy-900">Community Pulse</h3>
        </div>

        {/* Sentiment Badge Row */}
        {sentimentConfig && (
          <div className="flex items-center gap-3 mb-4">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${sentimentConfig.bgColor} ${sentimentConfig.color} ${sentimentConfig.borderColor}`}>
              <span>{sentimentConfig.emoji}</span>
              Sentiment: {sentimentConfig.label}
            </span>
            <span className="text-sm text-slate-500">
              Based on analysis of {insight.threadCount} relevant threads
            </span>
          </div>
        )}

        {/* Synthesis Card */}
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-purple-700 mb-1">Synthesis</p>
              <p className="text-sm text-navy-700 leading-relaxed">
                {insight.synthesis}
              </p>
            </div>
          </div>
        </div>

        {/* Discussion Topics */}
        {insight.topics && insight.topics.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-slate-500 mb-2">Common Discussion Topics:</p>
            <div className="flex flex-wrap gap-2">
              {insight.topics.map((topic, idx) => (
                <span 
                  key={idx}
                  className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-600"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Regional Insights Section */}
        {insight.regionalData && insight.relevantRegionalInsights && insight.relevantRegionalInsights.length > 0 && (
          <div className="mt-5 pt-5 border-t border-purple-100">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-amber-600" />
              <h4 className="text-sm font-semibold text-navy-900">
                {insight.regionalData.stateName} Regional Insights
              </h4>
            </div>
            
            <p className="text-xs text-slate-600 mb-3">{insight.regionalData.overview}</p>
            
            <div className="space-y-2">
              {insight.relevantRegionalInsights.map((regionInsight, idx) => {
                const isExpanded = expandedInsight === idx;
                const severityColors = {
                  critical: 'border-l-red-500 bg-red-50',
                  warning: 'border-l-amber-500 bg-amber-50',
                  info: 'border-l-blue-500 bg-blue-50'
                };
                const severityTextColors = {
                  critical: 'text-red-700',
                  warning: 'text-amber-700',
                  info: 'text-blue-700'
                };
                
                const getInsightIcon = (topic: string) => {
                  const topicLower = topic.toLowerCase();
                  if (topicLower.includes('moisture') || topicLower.includes('humidity')) return <Droplets className="w-4 h-4" />;
                  if (topicLower.includes('termite')) return <Bug className="w-4 h-4" />;
                  if (topicLower.includes('hvac') || topicLower.includes('insulation')) return <Thermometer className="w-4 h-4" />;
                  if (topicLower.includes('license')) return <Shield className="w-4 h-4" />;
                  if (topicLower.includes('permit')) return <FileWarning className="w-4 h-4" />;
                  if (topicLower.includes('foundation') || topicLower.includes('clay')) return <Home className="w-4 h-4" />;
                  if (topicLower.includes('flooring') || topicLower.includes('floor')) return <Layers className="w-4 h-4" />;
                  if (topicLower.includes('storm')) return <AlertTriangle className="w-4 h-4" />;
                  if (topicLower.includes('hoa')) return <FileText className="w-4 h-4" />;
                  if (topicLower.includes('deck') || topicLower.includes('outdoor')) return <Trees className="w-4 h-4" />;
                  return <AlertCircle className="w-4 h-4" />;
                };
                
                return (
                  <div 
                    key={idx}
                    className={`border-l-4 rounded-r-lg ${severityColors[regionInsight.severity]} overflow-hidden`}
                  >
                    <button
                      onClick={() => setExpandedInsight(isExpanded ? null : idx)}
                      className="w-full p-3 flex items-center justify-between text-left hover:bg-white/30 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className={severityTextColors[regionInsight.severity]}>
                          {getInsightIcon(regionInsight.topic)}
                        </span>
                        <span className={`text-sm font-medium ${severityTextColors[regionInsight.severity]}`}>
                          {regionInsight.topic}
                        </span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isExpanded && (
                      <div className="px-3 pb-3 space-y-2">
                        <p className="text-xs text-slate-700">{regionInsight.concern}</p>
                        
                        <div className="bg-white/60 rounded p-2">
                          <p className="text-xs font-medium text-purple-700 mb-0.5">💬 Reddit Takeaway:</p>
                          <p className="text-xs text-slate-600 italic">"{regionInsight.redditTakeaway}"</p>
                        </div>
                        
                        <div className="bg-emerald-100/60 rounded p-2">
                          <p className="text-xs font-medium text-emerald-700 mb-0.5">🔍 Ask Your Contractor:</p>
                          <p className="text-xs text-slate-700">"{regionInsight.questionToAsk}"</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Source Attribution */}
        <div className="pt-3 mt-4 border-t border-purple-100">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <MessageCircle className="w-3 h-3" />
            <span>
              Source:{' '}
              <span className="text-purple-500">Reddit</span>
              <span className="text-slate-300"> • {insight.threadCount} threads analyzed</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// State-Specific Education Section
function StateEducationSection({ stateLaws }: { stateLaws: ReturnType<typeof getStateLaws> }) {
  const [expanded, setExpanded] = useState(true);
  
  return (
    <div className="card-glass overflow-hidden shadow-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 flex items-center justify-between text-left hover:bg-navy-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100">
            <Scale className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-navy-900">
              What You Need to Know in {stateLaws.state}
            </h3>
            <p className="text-navy-500 text-sm">State-specific laws protecting homeowners</p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-navy-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      
      {expanded && (
        <div className="px-5 pb-5 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-navy-500 uppercase tracking-wider">Key Protections</h4>
              <ul className="space-y-2">
                {stateLaws.keyPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-navy-700">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-navy-500 uppercase tracking-wider mb-2">Deposit Rules</h4>
                <p className="text-sm text-navy-600 bg-navy-50 rounded-lg p-3">
                  {stateLaws.depositRules}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-navy-500 uppercase tracking-wider mb-2">Time Limits to Sue</h4>
                <div className="bg-navy-50 rounded-lg p-3 space-y-1 text-sm">
                  <p className="text-navy-600">
                    <span className="text-navy-500">Contract disputes:</span> {stateLaws.contractsLimitation}
                  </p>
                  <p className="text-navy-600">
                    <span className="text-navy-500">Property damage:</span> {stateLaws.propertyDamageLimitation}
                  </p>
                  <p className="text-navy-600">
                    <span className="text-navy-500">Statute of repose:</span> {stateLaws.statuteOfRepose}
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-navy-500 uppercase tracking-wider mb-2">
                  Right to Cure: {stateLaws.rightToCure ? 'Required' : 'Not Required'}
                </h4>
                <p className="text-sm text-navy-600 bg-navy-50 rounded-lg p-3">
                  {stateLaws.rightToCureDetails}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-amber-700 mb-1">Your Cancellation Rights</h4>
            <p className="text-sm text-navy-700">{stateLaws.cancellationRights}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ProjectInsightsCard component moved to Graveyard.tsx (Feb 2025)

function ResourceLink({ href, text }: { href: string; text: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1 text-navy-600 hover:text-orange-500 text-sm transition-colors"
    >
      {text}
      <ExternalLink className="w-3 h-3" />
    </a>
  );
}
