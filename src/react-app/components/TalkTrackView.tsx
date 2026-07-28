import { useState, useEffect } from 'react';
import { 
  MessageCircle, ChevronDown, Sparkles,
  Lightbulb, Loader2, RefreshCw, AlertCircle, Zap, MessageSquare,
  Info, BookOpen
} from 'lucide-react';
import { extractBidTotal, analyzeBid, detectProjectTrade } from '@/shared/analysisEngine';
import { ALL_MODULES_FREE } from '@/shared/featureFlags';
import { getTradeBenchmark } from '@/shared/tradeBenchmarks';
import { useUserLocation } from '@/react-app/hooks/useGeolocation';
import { detectStateFromBid, CRITICAL_CONTRACT_CLAUSES } from '@/shared/stateLaws';
import { detectProjectZip } from '@/shared/zipDetection';
import { FALLBACK_WAGES, getStateName } from '@/shared/blsLaborRates';
import { 
  fetchMarketRates, 
  detectProjectCategory, 
  compareToMarket,
  type MarketComparisonResult,
  type MarketRateCategory
} from '@/shared/marketRates';
import {
  calculateLocalIndex,
  analyzeBidPSF,
  type LocalMarketIndex,
  type BidPSFAnalysis,
} from '@/shared/fiveTradeIndex';
import { NegotiationPremiumGate } from './PremiumGate';
import UnifiedNegotiationCard from './UnifiedNegotiationCard';

interface TalkTrackViewProps {
  bidContent: string;
  fileName: string;
  onBack: () => void;
  userTier?: 'anonymous' | 'free' | 'premium';
  bidTotalOverride?: number | null;
  squareFootageOverride?: number | null;
  windowCountOverride?: number | null;
  stateCode?: string | null;
  yearBuilt?: number;
  projectZipCode?: string | null;
  projectType?: string | null;
  priceDataFromAnalysis?: {
    verdict: string;
    percentDiff: number;
    bidTotal: number;
  } | null;
  changeOrderQuestions?: string[];
}

export default function TalkTrackView({ 
  bidContent, 
  fileName: _fileName, 
  onBack: _onBack, 
  userTier = 'anonymous', 
  bidTotalOverride,
  squareFootageOverride,
  windowCountOverride: _windowCountOverride,
  stateCode: propStateCode,
  yearBuilt: _propYearBuilt,
  projectZipCode: propProjectZipCode,
  projectType: _propProjectType,
  priceDataFromAnalysis,
  changeOrderQuestions = []
}: TalkTrackViewProps) {
  // ALL_MODULES_FREE: negotiation toolkit is free on every analysis — the
  // paywall is the analysis count, not features.
  const isPremium = userTier === 'premium' || ALL_MODULES_FREE;
  const { stateCode: geoStateCode } = useUserLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marketData, setMarketData] = useState<{
    localIndex: LocalMarketIndex | null;
    bidAnalysis: BidPSFAnalysis | null;
    marketComparison: MarketComparisonResult | null;
    projectCategory: string | null;
    cityName: string;
  } | null>(null);
  
  // Use passed stateCode from Home.tsx, fall back to geolocation, then bid detection
  const bidStateResult = detectStateFromBid(bidContent);
  const effectiveStateCode = propStateCode || geoStateCode || bidStateResult?.stateCode || 'GA';

  
  // Analysis - use override values from Home.tsx
  const bidTotal = bidTotalOverride ?? extractBidTotal(bidContent);
  const analysis = analyzeBid(bidContent, bidTotal, effectiveStateCode);
  const tradeDetection = detectProjectTrade(bidContent);
  const tradeBenchmark = getTradeBenchmark(tradeDetection);
  const isSingleTrade = tradeDetection.category !== 'general-remodel' && tradeDetection.category !== 'whole-house';

  // Fetch market data using correct function signatures
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        // Use passed ZIP from Home.tsx, or extract from bid
        const zipCode = propProjectZipCode || detectProjectZip(bidContent, '30301');
        
        // Detect project category from bid text
        const category = detectProjectCategory(bidContent) as MarketRateCategory | null;
        
        if (!category || !bidTotal) {
          setMarketData(null);
          setLoading(false);
          return;
        }
        
        // Fetch market rates for this ZIP and category
        const rates = await fetchMarketRates(zipCode, category);
        
        if (!rates) {
          setMarketData(null);
          setLoading(false);
          return;
        }
        
        // Calculate local index using fallback wages (we don't have live BLS data here)
        const localWages: Record<string, number> = {};
        for (const [trade, wage] of Object.entries(FALLBACK_WAGES)) {
          localWages[trade] = wage;
        }
        
        // Use state-based location name for consistency with license detection
        const stateName = getStateName(effectiveStateCode);
        const cityName = stateName || rates.region || 'your area';
        
        const localIndex = calculateLocalIndex(
          localWages,
          zipCode,
          cityName,
          effectiveStateCode,
          'national-fallback'
        );
        
        // Compare bid to market
        const marketComparison = compareToMarket(bidTotal, rates);
        
        // Analyze bid PSF - use trade-specific benchmarks when available
        let bidAnalysis = analyzeBidPSF(bidTotal, bidContent, localIndex);
        
        // Override with trade-specific analysis if we have benchmarks
        if (tradeBenchmark?.hasBenchmark && tradeBenchmark.psfRange && bidTotal) {
          // Use passed square footage from Home.tsx, or extract from bid
          const sfMatch = bidContent.match(/(\d+)\s*(?:sq\.?\s*ft|sf|square\s*feet)/i);
          const extractedSf = sfMatch ? parseInt(sfMatch[1]) : null;
          const projectSqFt = squareFootageOverride ?? extractedSf;
          
          if (projectSqFt && projectSqFt > 0) {
            const bidPSF = bidTotal / projectSqFt;
            const { low, mid, high } = tradeBenchmark.psfRange;
            
            let status: typeof bidAnalysis.status = 'unknown';
            let percentFromTier: number | null = null;
            
            // Always calculate percentFromTier relative to MEDIAN (mid) for consistency with Analysis tab
            percentFromTier = Math.round(((bidPSF - mid) / mid) * 100);
            
            // Determine status based on tier thresholds
            if (bidPSF < low * 0.75) {
              status = 'below-market';
            } else if (bidPSF <= high * 1.15) {
              status = 'fair';
            } else {
              status = 'above-market';
            }
            
            // Override the generic analysis with trade-specific one
            bidAnalysis = {
              ...bidAnalysis,
              bidPSF: Math.round(bidPSF),
              projectSqFt,
              status,
              percentFromTier,
            };
          }
        }
        
        setMarketData({
          localIndex,
          bidAnalysis,
          marketComparison,
          projectCategory: category,
          cityName,
        });
      } catch (err) {
        console.error('Error fetching market data:', err);
        setError('Unable to load market comparison data');
        setMarketData(null);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [bidContent, effectiveStateCode, bidTotal, squareFootageOverride]);

  // Preview content for non-premium users
  const previewContent = (
    <div className="space-y-5">
      {/* Header Card Preview */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-200">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-emerald-100 rounded-lg">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <h1 className="text-xl font-bold text-navy-900">Negotiation Toolkit</h1>
            </div>
            <p className="text-navy-600 text-sm max-w-xl">
              Personalized scripts and strategies based on your bid's specific line items, local market rates, and industry best practices.
            </p>
          </div>
          <span className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full flex items-center gap-1 whitespace-nowrap">
            <Sparkles className="w-3 h-3" />
            AI + Market Data
          </span>
        </div>
      </div>
      
      {/* Fake Power Moves Preview */}
      <div className="bg-emerald-50 rounded-xl border border-emerald-200 overflow-hidden">
        <div className="bg-emerald-600 px-5 py-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Top Negotiation Moves
          </h3>
        </div>
        <div className="p-5">
          <ol className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">1</span>
              <span className="text-navy-700">Request itemized breakdown of labor vs materials costs...</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">2</span>
              <span className="text-navy-700">Ask for warranty terms in writing before signing...</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">3</span>
              <span className="text-navy-700">Verify subcontractor licensing and insurance...</span>
            </li>
          </ol>
        </div>
      </div>
      
      {/* Fake Conversation Scripts Preview */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-navy-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-500" />
            Conversation Scripts
          </h2>
        </div>
        <div className="px-5 py-4 bg-slate-50">
          <p className="text-xs font-semibold text-navy-500 uppercase tracking-wider mb-2">Open With</p>
          <p className="text-navy-800 leading-relaxed">"Thank you for providing this estimate. I've been reviewing it carefully..."</p>
        </div>
      </div>
    </div>
  );

  // Gate the entire view for non-premium users
  if (!isPremium) {
    return (
      <div className="min-h-screen pb-16 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto pt-6">
          <NegotiationPremiumGate
            type="negotiation"
            isLocked={true}
            previewContent={previewContent}
          >
            {previewContent}
          </NegotiationPremiumGate>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16 px-4 bg-slate-50">
      <div className="max-w-4xl mx-auto pt-6 space-y-5">
        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-200">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-4" />
            <p className="text-navy-700 font-medium">Building your negotiation toolkit...</p>
            <p className="text-navy-500 text-sm mt-1">Analyzing market data and generating personalized scripts</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-200">
            <AlertCircle className="w-10 h-10 text-emerald-500 mx-auto mb-4" />
            <p className="text-navy-700 font-medium mb-2">Unable to Generate Scripts</p>
            <p className="text-navy-500 text-sm mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-all shadow-md"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        )}

        {/* Fallback State - No market data but still show negotiation content */}
        {!loading && !error && !marketData && (
          <div className="space-y-5">
            {/* Header Card */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-200">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-emerald-100 rounded-lg">
                      <MessageCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h1 className="text-xl font-bold text-navy-900">Negotiation Toolkit</h1>
                  </div>
                  <p className="text-navy-600 text-sm max-w-xl">
                    General negotiation strategies and contract guidance for your project.
                  </p>
                </div>
                <span className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full flex items-center gap-1 whitespace-nowrap">
                  <Sparkles className="w-3 h-3" />
                  Expert Tips
                </span>
              </div>
            </div>

            {/* Unified Negotiation Card without market data */}
            <UnifiedNegotiationCard
              bidTotal={bidTotal || 0}
              contractorName={undefined}
              cityName={getStateName(effectiveStateCode) || 'your area'}
              priceVerdict="fair"
              percentFromMarket={0}
              projectType={tradeDetection.displayName || 'home improvement'}
              flags={analysis.flags.map(f => ({
                title: f.title,
                description: f.description,
                level: f.level
              }))}
              missingItems={analysis.missingItems}
              changeOrderQuestions={changeOrderQuestions}
            />

            {/* Negotiation Tips */}
            <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5">
              <h3 className="font-semibold text-navy-900 flex items-center gap-2 mb-3">
                <Lightbulb className="w-5 h-5 text-emerald-500" />
                Negotiation Tips
              </h3>
              <div className="grid md:grid-cols-2 gap-3 text-sm text-navy-700">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-500">✓</span>
                  <span>Have this conversation in person or on a call — not over text</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-500">✓</span>
                  <span>Take notes and follow up with a written summary</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-500">✓</span>
                  <span>A good contractor will respect your preparation</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-500">✓</span>
                  <span>Pushback on reasonable requests is valuable information</span>
                </div>
              </div>
            </div>

            {/* Critical Contract Clauses */}
            <ContractClausesSection />
          </div>
        )}

        {/* Success State - Unified View */}
        {!loading && !error && marketData && (
          <div className="space-y-5">
            {/* Header Card - White with Green Accents */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-200">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-emerald-100 rounded-lg">
                      <MessageCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h1 className="text-xl font-bold text-navy-900">Negotiation Toolkit</h1>
                  </div>
                  <p className="text-navy-600 text-sm max-w-xl">
                    Personalized scripts and strategies based on your bid's specific line items, local market rates, and industry best practices.
                  </p>
                </div>
                <span className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full flex items-center gap-1 whitespace-nowrap">
                  <Sparkles className="w-3 h-3" />
                  AI + Market Data
                </span>
              </div>
              
              {/* Market Context Strip - Show trade-specific OR full-remodel rates */}
              {isSingleTrade && tradeBenchmark?.hasBenchmark && tradeBenchmark.psfRange ? (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-navy-500 text-xs font-medium">
                      {tradeDetection.displayName} Market Rates
                    </p>
                    <div className="group relative">
                      <Info className="w-3.5 h-3.5 text-navy-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-navy-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-64 z-10">
                        Typical installed costs for {tradeDetection.displayName.toLowerCase()} work including materials and labor. Prices vary by material quality and job complexity.
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-navy-400 text-xs uppercase tracking-wider mb-1">Trade Type</p>
                      <p className="font-medium text-navy-900">{tradeDetection.displayName}</p>
                    </div>
                    <div>
                      <p className="text-navy-400 text-xs uppercase tracking-wider mb-1">Budget</p>
                      <p className="font-medium text-navy-900">${tradeBenchmark.psfRange.low}/sf</p>
                    </div>
                    <div>
                      <p className="text-navy-400 text-xs uppercase tracking-wider mb-1">Mid-Range</p>
                      <p className="font-medium text-navy-900">${tradeBenchmark.psfRange.mid}/sf</p>
                    </div>
                    <div>
                      <p className="text-navy-400 text-xs uppercase tracking-wider mb-1">Premium</p>
                      <p className="font-medium text-navy-900">${tradeBenchmark.psfRange.high}/sf</p>
                    </div>
                  </div>
                  {tradeBenchmark.perProjectRange && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <p className="text-navy-500 text-xs">
                        Typical project total: ${tradeBenchmark.perProjectRange.low.toLocaleString()} – ${tradeBenchmark.perProjectRange.high.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              ) : marketData?.localIndex && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-navy-500 text-xs font-medium">Regional Full-Remodel Averages</p>
                    <div className="group relative">
                      <Info className="w-3.5 h-3.5 text-navy-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-navy-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-64 z-10">
                        These rates represent typical costs for complete home remodeling projects in your area.
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-navy-400 text-xs uppercase tracking-wider mb-1">Location</p>
                      <p className="font-medium text-navy-900">{marketData.cityName}</p>
                    </div>
                    <div>
                      <p className="text-navy-400 text-xs uppercase tracking-wider mb-1">Basic</p>
                      <p className="font-medium text-navy-900">${marketData.localIndex.localBasicPSF}/sf</p>
                    </div>
                    <div>
                      <p className="text-navy-400 text-xs uppercase tracking-wider mb-1">Good</p>
                      <p className="font-medium text-navy-900">${marketData.localIndex.localGoodPSF}/sf</p>
                    </div>
                    <div>
                      <p className="text-navy-400 text-xs uppercase tracking-wider mb-1">Luxury</p>
                      <p className="font-medium text-navy-900">${marketData.localIndex.localLuxuryPSF}/sf</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Unified Negotiation Card - Main Script */}
            {marketData?.bidAnalysis && (
              <UnifiedNegotiationCard
                bidTotal={bidTotal || 0}
                contractorName={undefined}
                cityName={marketData.cityName}
                priceVerdict={
                  // Use verdict from Analysis tab if available for consistency
                  priceDataFromAnalysis?.verdict 
                    ? (priceDataFromAnalysis.verdict.toLowerCase().includes('below') || priceDataFromAnalysis.verdict.toLowerCase().includes('great')
                        ? 'good-deal'
                        : priceDataFromAnalysis.verdict.toLowerCase().includes('fair') || priceDataFromAnalysis.verdict.toLowerCase().includes('competitive')
                        ? 'fair'
                        : priceDataFromAnalysis.verdict.toLowerCase().includes('premium') || priceDataFromAnalysis.verdict.toLowerCase().includes('significantly')
                        ? 'overpriced'
                        : priceDataFromAnalysis.verdict.toLowerCase().includes('slightly') || priceDataFromAnalysis.verdict.toLowerCase().includes('above market')
                        ? 'overpriced'
                        : priceDataFromAnalysis.verdict.toLowerCase().includes('suspicious') || priceDataFromAnalysis.verdict.toLowerCase().includes('undercut')
                        ? 'suspiciously-low'
                        : 'fair')
                    : marketData.bidAnalysis.status === 'below-market' 
                    ? ((marketData.bidAnalysis.percentFromTier ?? 0) > 25 ? 'suspiciously-low' : 'good-deal')
                    : marketData.bidAnalysis.status === 'above-market'
                    ? 'overpriced'
                    : 'fair'
                }
                percentFromMarket={priceDataFromAnalysis?.percentDiff ?? marketData.bidAnalysis.percentFromTier ?? 0}
                projectType={tradeDetection.displayName || 'home improvement'}
                negotiationTarget={
                  priceDataFromAnalysis?.percentDiff && priceDataFromAnalysis.percentDiff > 0 && priceDataFromAnalysis.bidTotal
                    ? Math.round(priceDataFromAnalysis.bidTotal / (1 + priceDataFromAnalysis.percentDiff / 100))
                    : undefined
                }
                flags={analysis.flags.map(f => ({
                  title: f.title,
                  description: f.description,
                  level: f.level
                }))}
                missingItems={analysis.missingItems}
                changeOrderQuestions={changeOrderQuestions}
              />
            )}

            {/* Negotiation Tips */}
            <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5">
              <h3 className="font-semibold text-navy-900 flex items-center gap-2 mb-3">
                <Lightbulb className="w-5 h-5 text-emerald-500" />
                Negotiation Tips
              </h3>
              <div className="grid md:grid-cols-2 gap-3 text-sm text-navy-700">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-500">✓</span>
                  <span>Have this conversation in person or on a call — not over text</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-500">✓</span>
                  <span>Take notes and follow up with a written summary</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-500">✓</span>
                  <span>A good contractor will respect your preparation</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-500">✓</span>
                  <span>Pushback on reasonable requests is valuable information</span>
                </div>
              </div>
            </div>

            {/* Critical Contract Clauses */}
            <ContractClausesSection />
          </div>
        )}
      </div>
    </div>
  );
}

// Contract Clauses Section
function ContractClausesSection() {
  const [expanded, setExpanded] = useState(true);
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 flex items-center justify-between text-left hover:bg-navy-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-100">
            <BookOpen className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-navy-900">
              What Homeowners Must Know
            </h3>
            <p className="text-navy-500 text-sm">Critical contract clauses every home improvement agreement must include</p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-navy-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      
      {expanded && (
        <div className="px-5 pb-5 space-y-4">
          {CRITICAL_CONTRACT_CLAUSES.map((clause, idx) => (
            <div key={clause.id} className="bg-white border border-navy-200 rounded-lg p-4">
              <h4 className="font-semibold text-navy-900 mb-2">
                {idx + 1}. {clause.title}
              </h4>
              <p className="text-sm text-navy-600 mb-3">{clause.description}</p>
              
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-emerald-600 font-medium mb-1">What to look for:</p>
                  <ul className="space-y-1">
                    {clause.whatToLookFor.slice(0, 3).map((item, i) => (
                      <li key={i} className="text-navy-600 flex items-start gap-1">
                        <span className="text-emerald-500">✓</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-red-600 font-medium mb-1">Red flags:</p>
                  <ul className="space-y-1">
                    {clause.redFlags.slice(0, 3).map((item, i) => (
                      <li key={i} className="text-navy-600 flex items-start gap-1">
                        <span className="text-red-500">✗</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
          
          <p className="text-xs text-navy-400">
            Source:{' '}
            <a 
              href="https://bflawoffice.com/blog/four-critical-clauses-to-include-in-your-home-improvement-contract/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-500 hover:text-purple-600 transition-colors"
            >
              BF Law Office - Four Critical Clauses in Home Improvement Contracts
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
