import { useMemo, useState, useEffect } from 'react';
import { 
  Shield, AlertTriangle, CheckCircle,
  FileWarning,
  Sparkles, Lightbulb, HelpCircle, Loader2, TrendingUp, Flag, ChevronRight,
  Ruler, Check, Edit3, DollarSign
} from 'lucide-react';

import ReportIssueModal from './ReportIssueModal';
import ScoreBreakdownModal from './ScoreBreakdownModal';
import { analyzeBid, extractBidTotal, type AnalysisFlag, type DealRiskResult, type ScopeGapWithCost } from '@/shared/analysisEngine';
// CompactPremiumGate removed - Issues Found section moved to graveyard
import { useUserLocation } from '@/react-app/hooks/useGeolocation';
import { extractDetectedData, type ProjectDataOverrides } from './ProjectDataEditor';
import ContractorPulseCard from './ContractorPulseCard';
import ContractorSummaryCard from './ContractorSummaryCard';
import { ContractorPulse } from '@/shared/contractorPulse';
import type { SampleContractorDemoData } from '@/data/sampleBidData';
import { type MarketRateResult } from './MarketComparisonCard';
import ScopeComparisonCard from './ScopeComparisonCard';
import PriceAnalysisCard from './PriceAnalysisCard';
// GeminiDeepAnalysis moved to graveyard - replaced by BottomLineSummary
// import GeminiDeepAnalysis from './GeminiDeepAnalysis';
import { QuestionsToAskCard } from './QuestionsToAskCard';
import { PremiumGate } from './PremiumGate';
// BottomLineSummary was a separate component that has been fully integrated into ScoreSummaryHeader
// The component file was deleted after integration was complete (Feb 2025)
import { getMSAFromZip } from '@/shared/msaLookup';
import { BlindBidNotice } from './BlindBidNotice';
import type { BlindBidAnalysis } from '@/shared/blindBidEngine';
import { PdfHeader } from './PdfHeader';
import { PdfFooter } from './PdfFooter';
import RegionalInsightCard from './RegionalInsightCard';
import DataMethodologyModal from './DataMethodologyModal';
import { isLinearFootProject } from '@/shared/projectUnitConfig';
import ChangeOrderPredictorCard from './ChangeOrderPredictorCard';
import { fetchWithResilience, getUserFriendlyError } from '@/shared/apiResilience';

interface FlagCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface ReportViewProps {
  bidContent: string;
  fileName?: string;
  onBack?: () => void;
  userTier?: 'anonymous' | 'free' | 'premium';
  uploadOverrides?: {
    projectType?: string | null;
    squareFootage?: number | null;
    windowCount?: number | null;
    linearFeet?: number | null;
  };
  squareFootageOverride?: number | null;
  onSquareFootageChange?: (sqft: number | null) => void;
  windowCountOverrideProp?: number | null;
  onWindowCountChange?: (count: number | null) => void;
  bidTotalOverride?: number | null;
  onBidTotalChange?: (total: number | null) => void;
  bidTotalLocked?: boolean;
  confidenceScore?: number;
  flagCounts?: FlagCounts;
  contractorPulse?: ContractorPulse | null;
  /** Sample/demo mode: prebaked research payloads — skips the live Google
   *  Places, research, and review-sentiment lookups (fictional contractor). */
  sampleContractorData?: SampleContractorDemoData | null;
  projectZipCode?: string;
  yearBuilt?: number;
  onPriceDataChange?: (data: { verdict: string; percentDiff: number; bidTotal: number } | null) => void;
  onChangeOrderQuestionsChange?: (questions: string[]) => void;
}

// AI Analysis types
interface AIInsight {
  type: 'warning' | 'tip' | 'positive' | 'question';
  title: string;
  detail: string;
  action: string;
}

interface AIAnalysisResult {
  summary: string;
  projectType: string;
  tradePeople: string[];
  aiInsights: AIInsight[];
  missedByRules: string[];
  questionsToAsk: string[];
  overallRisk: 'low' | 'medium' | 'high';
  confidenceBoost: string;
}

// Point deductions per level - "Deal Health" model (Phase 1 refactor)
// Less aggressive deductions, focused on financial risk signals
const POINT_DEDUCTIONS: Record<string, number> = {
  critical: 12,
  high: 8,
  medium: 4,
  low: 2
};

// Special case: license-missing flag deducts less


export default function ReportView({ bidContent, fileName, userTier = 'anonymous', uploadOverrides, squareFootageOverride, onSquareFootageChange, windowCountOverrideProp, onWindowCountChange: _onWindowCountChange, bidTotalOverride, onBidTotalChange, bidTotalLocked = false, confidenceScore, flagCounts, contractorPulse, sampleContractorData, projectZipCode, yearBuilt, onPriceDataChange, onChangeOrderQuestionsChange }: ReportViewProps) {
  const isPremium = userTier === 'premium';
  const isLoggedIn = userTier !== 'anonymous'; // Free or Premium users are logged in
  const { stateCode: userStateCode, stateName: _userStateName } = useUserLocation();
  const [isReportIssueOpen, setIsReportIssueOpen] = useState(false);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  
  // AI Analysis state
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [aiLoading, setAiLoading] = useState(true);
  const [_aiError, setAiError] = useState<string | null>(null);
  
  // Consolidated Questions state (from scope, AI, regional sources)
  const [scopeQuestions, setScopeQuestions] = useState<string[]>([]);
  const [aiQuestions] = useState<Array<{ title: string; detail: string; action?: string }>>([]);
  const [changeOrderQuestions, setChangeOrderQuestions] = useState<string[]>([]);
  
  // Propagate change order questions to parent for Talk Track view
  useEffect(() => {
    if (changeOrderQuestions.length > 0) {
      onChangeOrderQuestionsChange?.(changeOrderQuestions);
    }
  }, [changeOrderQuestions, onChangeOrderQuestionsChange]);
  
  // Gemini Trade Mix state (Premium feature)
  interface TradeMixEntry { soc: string; name: string; weight: number; }
  interface TradeMixResult { 
    trades: TradeMixEntry[]; 
    materialRatio: number; 
    confidence: 'high' | 'medium' | 'low';
    reasoning?: string;
  }
  const [tradeMixData, setTradeMixData] = useState<TradeMixResult | null>(null);
  const [tradeMixLoading, setTradeMixLoading] = useState(false);
  
  // Price Score state (used to update unified score)
  interface PriceScoreData {
    score: number;
    verdict: string;
    percentDiff: number;
    bidPsf: number;
    marketLowPsf?: number;      // 25th percentile - budget tier
    marketMedianPsf: number;    // 50th percentile - standard tier
    marketHighPsf?: number;     // 75th percentile - premium tier
    tradeBreakdown?: Array<{
      trade: string;
      socCode: string;
      weight: number;
      hourlyRate: number;
      source: 'live' | 'cached' | 'static';
    }>;
    regionalMultiplier?: number;
    regionalName?: string;
    regionalSource?: string;
    // Cross-source validation fields
    dataSource?: 'zonda' | 'psf' | 'window' | 'minimum';
    dataSourceName?: string;
    confidence?: 'high' | 'medium' | 'low';
    zondaCitation?: string;
    detectedTier?: 'minor' | 'midrange' | 'upscale';
    crossSourceValidation?: {
      houzzRange: { low: number; high: number } | null;
      zondaRange: { low: number; high: number } | null;
      blsEstimate: { low: number; median: number; high: number } | null;
      combinedRange: { low: number; high: number };
      sourcesAgree: boolean;
      sourcesUsed: string[];
      confidence: 'high' | 'medium' | 'low';
      confidenceDescription: string;
      methodology: string;
    };
  }
  const [priceScoreData, setPriceScoreData] = useState<PriceScoreData | null>(null);
  
  // Live BLS Rates state (Premium feature)
  interface BlsRateData {
    hourly: number;
    annual: number;
    source: 'live' | 'cached' | 'static';
    fetchedAt?: string;
  }
  const [liveBlsRates, setLiveBlsRates] = useState<Record<string, BlsRateData> | null>(null);
  const [blsRatesLoading, setBlsRatesLoading] = useState(false);
  
  // Blind Bid Analysis state (for bids without square footage)
  const [blindBidAnalysis, setBlindBidAnalysis] = useState<BlindBidAnalysis | null>(null);
  const [_blindBidLoading, setBlindBidLoading] = useState(false);
  
  // FRED Inflation Factor state (for inflation-adjusted pricing)
  interface InflationFactorData {
    factor: number;
    percentChange: number;
    baselineYear: number;
    baselineIndex: number;
    currentIndex: number;
    currentDate: string;
  }
  const [inflationFactor, setInflationFactor] = useState<InflationFactorData | null>(null);
  
  // Bottom Line Synthesis state (Key Insight + Your Move)
  const [bottomLineSynthesis, setBottomLineSynthesis] = useState<BottomLineSynthesis | null>(null);
  const [bottomLineLoading, setBottomLineLoading] = useState(false);
  
  // Market Comparison state - TEMPORARILY UNUSED
  const [_marketData, setMarketData] = useState<MarketRateResult | null>(null);
  const [_marketLoading, setMarketLoading] = useState(false);
  const [windowCountOverride, setWindowCountOverride] = useState<number | null>(windowCountOverrideProp ?? uploadOverrides?.windowCount ?? null);
  
  // Quick Data Entry editing state
  const [editingField, setEditingField] = useState<'bidTotal' | 'squareFootage' | null>(null);
  const [editedBidTotal, setEditedBidTotal] = useState('');
  const [editedSquareFootage, setEditedSquareFootage] = useState('');
  
  // Sync windowCountOverride with parent prop when it changes
  useEffect(() => {
    if (windowCountOverrideProp !== undefined) {
      setWindowCountOverride(windowCountOverrideProp);
    }
  }, [windowCountOverrideProp]);
  
  // Google Places data for ContractorSummaryCard
  interface GooglePlacesData {
    placeId: string;
    name: string;
    address: string;
    rating: number | null;
    reviewCount: number | null;
    reviews: Array<{ text: string; rating?: number; timeAgo?: string; author?: string }>;
    website?: string;
    phone?: string;
    businessStatus?: string;
  }
  const [googlePlacesData, setGooglePlacesData] = useState<GooglePlacesData | null>(null);
  const [googlePlacesLoading, setGooglePlacesLoading] = useState(false);
  
  interface ContractorResearchData {
    bbbStatus: string | null;
    businessRegistration: {
      status?: 'active' | 'inactive' | 'dissolved' | 'unknown';
      entity?: string | null;
      registeredState?: string | null;
      licenseNumber: string | null;
      notes?: string | null;
    } | null;
    permitHistory?: {
      recentPermits: number | null;
      totalValue: string | null;
      notes: string | null;
    } | null;
    reputation?: {
      score: 'excellent' | 'good' | 'mixed' | 'concerning' | 'unknown';
      highlights: string[];
      concerns: string[];
    };
    summary?: string | null;
    sources?: Array<{ title: string; url: string; snippet: string }>;
    bbbComplaints?: {
      total: number | null;
      lastThreeYears: number | null;
      resolved: number | null;
      details: string | null;
    } | null;
    newsItems?: string[];
    redFlags?: string[];
  }
  const [contractorResearchData, setContractorResearchData] = useState<ContractorResearchData | null>(null);
  const [contractorResearchLoading, setContractorResearchLoading] = useState(false);
  
  // Fetch Google Places data for contractor
  useEffect(() => {
    // Demo/sample mode: fictional contractor — use the prebaked payload.
    if (sampleContractorData) {
      setGooglePlacesData(sampleContractorData.googlePlaces);
      return;
    }
    if (!contractorPulse?.fingerprint) return;

    const fp = contractorPulse.fingerprint;
    const businessName = fp.legalBusinessName || fp.dbaName;

    if (!businessName && !fp.phone) return;
    
    const fetchGooglePlaces = async () => {
      setGooglePlacesLoading(true);
      try {
        const params = new URLSearchParams();
        if (businessName) params.set('businessName', businessName);
        else if (fp.phone) params.set('phone', fp.phone);
        if (fp.city) params.set('city', fp.city);
        if (fp.state) params.set('state', fp.state);
        if (fp.website) params.set('website', fp.website);
        
        const response = await fetch(`/api/contractor/google-places?${params.toString()}`);
        const result = await response.json();
        
        if (response.ok && result.success && result.data) {
          setGooglePlacesData(result.data);
        }
      } catch (err) {
        console.error('Failed to fetch Google Places data:', err);
      } finally {
        setGooglePlacesLoading(false);
      }
    };
    
    fetchGooglePlaces();
  }, [contractorPulse?.fingerprint, sampleContractorData]);

  // Fetch contractor research data (for BBB status)
  useEffect(() => {
    // Demo/sample mode: fictional contractor — use the prebaked payload.
    if (sampleContractorData) {
      setContractorResearchData(sampleContractorData.research);
      return;
    }
    if (!contractorPulse?.fingerprint) return;

    const fp = contractorPulse.fingerprint;
    const businessName = fp.legalBusinessName || fp.dbaName;

    if (!businessName) return;
    
    const fetchResearch = async () => {
      setContractorResearchLoading(true);
      try {
        const response = await fetchWithResilience('/api/contractor/research', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessName,
            city: fp.city || undefined,
            state: fp.state || undefined,
            licenseNumber: fp.licenseNumber || undefined
          })
        }, { timeoutMs: 45000, maxRetries: 2 });
        const result = await response.json();
        
        if (response.ok && result.success && result.data) {
          // Store full research data to share with ContractorPulseCard
          setContractorResearchData({
            bbbStatus: result.data.bbbStatus || null,
            businessRegistration: result.data.businessRegistration || null,
            permitHistory: result.data.permitHistory || null,
            reputation: result.data.reputation || { score: 'unknown', highlights: [], concerns: [] },
            summary: result.data.summary || null,
            sources: result.data.sources || [],
            bbbComplaints: result.data.bbbComplaints || null,
            newsItems: result.data.newsItems || [],
            redFlags: result.data.redFlags || []
          });
        }
      } catch (err) {
        console.error('Failed to fetch contractor research:', err);
      } finally {
        setContractorResearchLoading(false);
      }
    };
    
    fetchResearch();
  }, [contractorPulse?.fingerprint, sampleContractorData]);
  
  const [dataOverrides, setDataOverrides] = useState<ProjectDataOverrides>({
    squareFootage: squareFootageOverride ?? uploadOverrides?.squareFootage ?? null,
    finishLevel: null,
    bidTotal: bidTotalOverride ?? null
  });
  
  const handleOverridesChange = (newOverrides: ProjectDataOverrides) => {
    // Update local state
    setDataOverrides(newOverrides);
    
    // Notify parent of changes to keep state in sync (#55)
    if (onSquareFootageChange && newOverrides.squareFootage !== dataOverrides.squareFootage) {
      onSquareFootageChange(newOverrides.squareFootage);
    }
    if (onBidTotalChange && newOverrides.bidTotal !== dataOverrides.bidTotal) {
      onBidTotalChange(newOverrides.bidTotal);
    }
  };
  
  // Improved synchronization - keep local state in sync with parent props (#55)
  useEffect(() => {
    if (bidTotalOverride !== undefined && bidTotalOverride !== dataOverrides.bidTotal) {
      setDataOverrides(prev => ({ ...prev, bidTotal: bidTotalOverride }));
    }
  }, [bidTotalOverride, dataOverrides.bidTotal]);
  
  useEffect(() => {
    if (squareFootageOverride !== undefined && squareFootageOverride !== dataOverrides.squareFootage) {
      setDataOverrides(prev => ({ ...prev, squareFootage: squareFootageOverride }));
    }
  }, [squareFootageOverride, dataOverrides.squareFootage]);
  
  const stateCode = userStateCode;
  
  const rawBidTotal = extractBidTotal(bidContent) ?? null;
  const detectedData = useMemo(() => {
    const extracted = extractDetectedData(bidContent, rawBidTotal);
    return {
      ...extracted,
      projectType: uploadOverrides?.projectType ?? extracted.projectType,
      squareFootage: uploadOverrides?.squareFootage ?? extracted.squareFootage
    };
  }, [bidContent, rawBidTotal, uploadOverrides]);
  
  const effectiveBidTotal = dataOverrides.bidTotal ?? rawBidTotal ?? undefined;
  
  const analysis = useMemo(() => {
    // Build contractor trust data including verified license status
    const contractorTrust = contractorResearchData ? {
      hasVerifiedLicense: !!(contractorPulse?.fingerprint?.licenseNumber || contractorResearchData?.businessRegistration?.licenseNumber)
    } : undefined;
    
    // Pass yearBuilt as 6th param (after marketEstimate and contractorTrust)
    return analyzeBid(bidContent, effectiveBidTotal, stateCode ?? undefined, undefined, contractorTrust, yearBuilt);
  }, [bidContent, effectiveBidTotal, stateCode, yearBuilt, contractorResearchData, contractorPulse]);

  // Enhanced unified score with price score data
  const enhancedUnifiedScore = useMemo(() => {
    if (!analysis.unifiedScore) return null;
    
    const base = analysis.unifiedScore;
    
    // If we have price score data, update the price dimension
    if (priceScoreData) {
      // Calculate price dimension score from verdict
      let priceScore = 50;
      const verdict = priceScoreData.verdict.toLowerCase();
      if (verdict.includes('great deal') || verdict.includes('below market')) {
        priceScore = 85;
      } else if (verdict.includes('fair') || verdict.includes('market rate')) {
        priceScore = 75;
      } else if (verdict.includes('slightly above')) {
        priceScore = 55;
      } else if (verdict.includes('significantly above')) {
        priceScore = 30;
      } else if (verdict.includes('undercutting') || verdict.includes('suspiciously')) {
        priceScore = 40; // Below market but suspicious
      }
      
      // Create updated price dimension
      const updatedPriceDimension = {
        ...base.dimensions.priceReasonableness,
        score: priceScore,
        percentDiff: priceScoreData.percentDiff,
        bidPsf: priceScoreData.bidPsf,
        marketPsf: priceScoreData.marketMedianPsf,
        summary: priceScoreData.verdict
      };
      
      // Recalculate overall score with real price data
      const contractScore = base.dimensions.contractRisk.score * 0.40;
      const scopeScore = base.dimensions.scopeCompleteness.score * 0.30;
      const priceContribution = priceScore * 0.30;
      const newOverall = Math.round(contractScore + scopeScore + priceContribution);
      
      // Determine new grade
      let newGrade: 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
      let newGradeLabel = 'Risky';
      if (newOverall >= 85) { newGrade = 'A'; newGradeLabel = 'Excellent'; }
      else if (newOverall >= 70) { newGrade = 'B'; newGradeLabel = 'Good'; }
      else if (newOverall >= 55) { newGrade = 'C'; newGradeLabel = 'Fair'; }
      else if (newOverall >= 40) { newGrade = 'D'; newGradeLabel = 'Poor'; }
      
      return {
        ...base,
        overall: newOverall,
        grade: newGrade,
        gradeLabel: newGradeLabel,
        dimensions: {
          ...base.dimensions,
          priceReasonableness: updatedPriceDimension
        }
      };
    }
    
    return base;
  }, [analysis.unifiedScore, priceScoreData]);

  const [_isUpdatingAnalysis, setIsUpdatingAnalysis] = useState(false);

  const fetchAIAnalysis = async (isUpdate = false) => {
    if (isUpdate) {
      setIsUpdatingAnalysis(true);
    } else {
      setAiLoading(true);
    }
    setAiError(null);
    
    try {
      const currentBidTotal = dataOverrides.bidTotal ?? rawBidTotal ?? undefined;
      const response = await fetchWithResilience('/api/analyze/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bidText: bidContent, bidTotal: currentBidTotal, stateCode })
      }, { timeoutMs: 60000, maxRetries: 2 });
      
      const data = await response.json();
      
      if (!data.success) {
        setAiError(data.error || 'Failed to analyze');
        return;
      }
      
      setAiAnalysis(data.analysis);
    } catch (err) {
      setAiError(getUserFriendlyError(err));
    } finally {
      setAiLoading(false);
      setIsUpdatingAnalysis(false);
    }
  };

  useEffect(() => {
    fetchAIAnalysis(false);
  }, [bidContent]);

  useEffect(() => {
    if (dataOverrides.bidTotal === null && dataOverrides.squareFootage === null && dataOverrides.finishLevel === null) {
      return;
    }
    
    const timeoutId = setTimeout(() => {
      fetchAIAnalysis(true);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [dataOverrides.bidTotal, dataOverrides.squareFootage, dataOverrides.finishLevel]);

  // Fetch market comparison data
  useEffect(() => {
    const fetchMarketData = async () => {
      if (!effectiveBidTotal) return;
      
      setMarketLoading(true);
      try {
        const sqft = dataOverrides.squareFootage || detectedData.squareFootage || undefined;
        const zip = projectZipCode || '30301'; // Use project ZIP, fallback to Atlanta area
        
        // Get window count from local override, upload overrides, or unit detection
        const windowCount = windowCountOverride || 
          uploadOverrides?.windowCount || 
          analysis.unitDetection?.items?.find(i => i.type === 'window')?.quantity || 
          undefined;
        
        const response = await fetch('/api/market-rates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            zipCode: zip,
            bidTotal: effectiveBidTotal,
            squareFootage: sqft,
            windowCount: windowCount, // Pass window count for per-unit pricing
            lineItems: bidContent, // Pass the bid content for trade detection
            tradeDetection: analysis.tradeDetection // Pass trade detection for accurate PSF benchmarks
          })
        });
        
        const result = await response.json();
        if (result.success && result.data) {
          setMarketData(result.data);
        }
      } catch (err) {
        console.error('Failed to fetch market data:', err);
      } finally {
        setMarketLoading(false);
      }
    };
    
    fetchMarketData();
  }, [effectiveBidTotal, dataOverrides.squareFootage, detectedData.squareFootage, bidContent, projectZipCode, windowCountOverride]);

  // Fetch Gemini Trade Mix analysis for premium users
  useEffect(() => {
    const fetchTradeMix = async () => {
      // Only for premium users with bid content
      if (!isPremium || !bidContent || bidContent.length < 100) return;
      
      setTradeMixLoading(true);
      try {
        const response = await fetch('/api/analyze-trade-mix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bidText: bidContent })
        });
        
        const result = await response.json();
        if (result.success && result.data) {
          setTradeMixData(result.data);
          console.log('[TradeMix] Gemini analysis:', result.data);
        }
      } catch (err) {
        console.error('[TradeMix] Failed to fetch:', err);
      } finally {
        setTradeMixLoading(false);
      }
    };
    
    fetchTradeMix();
  }, [isPremium, bidContent]);

  // Fetch Live BLS Rates for premium users (after trade mix is available)
  useEffect(() => {
    const fetchLiveBlsRates = async () => {
      // Only for premium users with trade mix data and valid ZIP
      if (!isPremium || !tradeMixData?.trades || tradeMixData.trades.length === 0) return;
      
      const zip = projectZipCode || '30301';
      const msaInfo = getMSAFromZip(zip);
      
      // Only fetch if ZIP maps to a known MSA
      if (!msaInfo) {
        console.log('[BLS] ZIP not in major metro, using static rates');
        return;
      }
      
      // Extract SOC codes from trade mix
      const socCodes = tradeMixData.trades.map(t => t.soc);
      if (socCodes.length === 0) return;
      
      setBlsRatesLoading(true);
      try {
        const response = await fetch('/api/bls/rates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            msaCode: msaInfo.msaCode,
            socCodes: socCodes.slice(0, 10) // API limit
          })
        });
        
        const result = await response.json();
        if (result.success && result.data) {
          setLiveBlsRates(result.data);
          console.log('[BLS] Live rates fetched for', msaInfo.msaName, ':', result.data);
        }
      } catch (err) {
        console.error('[BLS] Failed to fetch live rates:', err);
      } finally {
        setBlsRatesLoading(false);
      }
    };
    
    fetchLiveBlsRates();
  }, [isPremium, tradeMixData, projectZipCode]);

  // Fetch FRED Inflation Factor (for inflation-adjusted pricing)
  useEffect(() => {
    const fetchInflationFactor = async () => {
      try {
        const response = await fetchWithResilience('/api/fred/inflation-factor', undefined, 
          { timeoutMs: 15000, maxRetries: 2, cacheKey: 'fred-inflation', cacheTtlMs: 3600000 });
        const result = await response.json();
        if (result.success && result.data) {
          setInflationFactor(result.data);
          console.log('[FRED] Inflation factor:', result.data.factor.toFixed(3), `(${result.data.percentChange > 0 ? '+' : ''}${result.data.percentChange.toFixed(1)}%)`);
        }
      } catch (err) {
        console.error('[FRED] Failed to fetch inflation factor:', err);
        // Continue without inflation adjustment
      }
    };
    
    fetchInflationFactor();
  }, []); // Fetch once on mount

  // Fetch Price Score (uses trade mix and live BLS rates for premium)
  useEffect(() => {
    const fetchPriceScore = async () => {
      if (!effectiveBidTotal) return;
      
      // Wait for trade mix and BLS rates if premium and still loading
      if (isPremium && (tradeMixLoading || blsRatesLoading)) return;
      
      const sqft = dataOverrides.squareFootage || detectedData.squareFootage;
      
      // Get window count from local override, upload overrides, or unit detection
      const priceWindowCount = windowCountOverride || 
        uploadOverrides?.windowCount || 
        analysis.unitDetection?.items?.find(i => i.type === 'window')?.quantity || 
        0;
      
      // Get linear feet from upload overrides
      const priceLinearFeet = uploadOverrides?.linearFeet || 0;
      
      // Linear foot project types - imported from centralized config
      // Check if this is a window project (uses per-unit pricing instead of PSF)
      const isWindowProj = detectedData.projectType === 'windows-doors' && priceWindowCount > 0;
      
      // Check if this is a linear foot project (uses per-LF pricing instead of PSF)
      const isLinearFootProj = isLinearFootProject(detectedData.projectType) && priceLinearFeet > 0;
      
      // For non-window and non-linear-foot projects, require square footage
      if (!isWindowProj && !isLinearFootProj && !sqft) return;
      
      try {
        // Convert trade mix to customTradeMix format for premium users
        let customTradeMix: Record<string, number> | undefined;
        if (isPremium && tradeMixData?.trades) {
          customTradeMix = {};
          tradeMixData.trades.forEach(t => {
            customTradeMix![t.soc] = t.weight;
          });
          console.log('[PriceScore] Using Gemini trade mix:', customTradeMix);
        }
        
        // Pass live BLS rates for premium users (falls back to static in engine)
        const liveRates = isPremium && liveBlsRates ? liveBlsRates : undefined;
        if (liveRates) {
          console.log('[PriceScore] Using live BLS rates');
        }
        
        const response = await fetch('/api/price-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bidTotal: effectiveBidTotal,
            squareFootage: sqft || 0,
            projectType: detectedData.projectType || 'general-remodel',
            zipCode: projectZipCode || '30301',
            customTradeMix,
            liveRates,
            windowCount: isWindowProj ? priceWindowCount : undefined,
            linearFeet: isLinearFootProj ? priceLinearFeet : undefined,
            inflationFactor: inflationFactor || null
          })
        });
        
        const result = await response.json();
        if (result.success && result.data) {
          // Map API field names to frontend expected names
          // Extract low/median/high from breakdown for three-tier display
          const breakdown = result.data.breakdown || {};
          
          // Transform backend crossSourceValidation to frontend expected shape
          let transformedCrossSource = undefined;
          if (result.data.crossSourceValidation) {
            const csv = result.data.crossSourceValidation;
            transformedCrossSource = {
              houzzRange: csv.houzzRange,
              // Convert single zondaCost to a range (±10% around the value)
              zondaRange: csv.zondaCost ? {
                low: Math.round(csv.zondaCost * 0.9),
                high: Math.round(csv.zondaCost * 1.1)
              } : null,
              // BLS estimate from bottom-up labor cost calculation
              blsEstimate: csv.blsEstimate || null,
              combinedRange: {
                low: csv.combinedLow,
                high: csv.combinedHigh
              },
              sourcesAgree: csv.sourcesAgree,
              sourcesUsed: csv.sourcesUsed || [],
              confidence: csv.confidence,
              confidenceDescription: csv.confidenceDescription,
              methodology: csv.methodology
            };
          }
          
          setPriceScoreData({
            ...result.data,
            marketLowPsf: breakdown.marketPsfLow ?? 0,
            marketMedianPsf: result.data.marketPsf ?? breakdown.marketPsfMedian ?? 0,
            marketHighPsf: breakdown.marketPsfHigh ?? 0,
            crossSourceValidation: transformedCrossSource,
            detectedTier: result.data.detectedTier
          });
          // Notify parent of price data for cross-tab consistency
          onPriceDataChange?.({
            verdict: result.data.verdict,
            percentDiff: result.data.percentDiff,
            bidTotal: effectiveBidTotal
          });
          console.log('[PriceScore] Result:', result.data);
        }
      } catch (err) {
        console.error('[PriceScore] Failed to fetch:', err);
      }
    };
    
    fetchPriceScore();
  }, [effectiveBidTotal, dataOverrides.squareFootage, detectedData.squareFootage, detectedData.projectType, projectZipCode, isPremium, tradeMixData, tradeMixLoading, liveBlsRates, blsRatesLoading, windowCountOverride, uploadOverrides?.windowCount, uploadOverrides?.linearFeet, analysis.unitDetection, inflationFactor]);

  // Fetch Blind Bid Analysis (for bids without square footage)
  useEffect(() => {
    const fetchBlindBidAnalysis = async () => {
      // Only run if we have a bid total but NO square footage
      const sqft = dataOverrides.squareFootage || detectedData.squareFootage;
      console.log('[BlindBid] Check:', { effectiveBidTotal, sqft, dataOverrides: dataOverrides.squareFootage, detected: detectedData.squareFootage });
      if (!effectiveBidTotal || sqft) {
        console.log('[BlindBid] Skipping - has sqft or no bid total');
        setBlindBidAnalysis(null);
        return;
      }
      
      // Skip for window-only projects (they use per-unit pricing)
      const windowCount = windowCountOverride || 
        uploadOverrides?.windowCount || 
        analysis.unitDetection?.items?.find(i => i.type === 'window')?.quantity || 0;
      if (windowCount > 0 && detectedData.projectType === 'windows-doors') {
        setBlindBidAnalysis(null);
        return;
      }
      
      // Skip for linear foot projects (fence, gutter, railing - they use per-LF pricing)
      // Skip regardless of whether linearFeet is entered - blind bid doesn't apply to these project types
      if (isLinearFootProject(detectedData.projectType)) {
        console.log('[BlindBid] Skipping - linear foot project type:', detectedData.projectType);
        setBlindBidAnalysis(null);
        return;
      }
      
      setBlindBidLoading(true);
      try {
        const response = await fetch('/api/blind-bid-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bidText: bidContent,
            bidTotal: effectiveBidTotal,
            city: contractorPulse?.fingerprint?.city || '',
            state: contractorPulse?.fingerprint?.state || 'GA',
            projectType: detectedData.projectType || undefined
          })
        });
        
        const result = await response.json();
        console.log('[BlindBid] API response:', result);
        if (result.success && result.blindBidAnalysis) {
          setBlindBidAnalysis(result.blindBidAnalysis);
          console.log('[BlindBid] Analysis set:', result.blindBidAnalysis);
          
          // Notify parent of price data for cross-tab consistency (same as PSF path)
          const blindBid = result.blindBidAnalysis;
          const verdictMap: Record<string, string> = {
            'green': 'Below Market',
            'yellow': 'Slightly Above Market',
            'red': 'Premium Pricing'
          };
          onPriceDataChange?.({
            verdict: verdictMap[blindBid.varianceFlag] || 'Under Review',
            percentDiff: blindBid.variancePercent || 0,
            bidTotal: effectiveBidTotal
          });
        } else {
          console.log('[BlindBid] API returned error or no data:', result);
        }
      } catch (err) {
        console.error('[BlindBid] Failed to fetch:', err);
      } finally {
        setBlindBidLoading(false);
      }
    };
    
    fetchBlindBidAnalysis();
  }, [effectiveBidTotal, dataOverrides.squareFootage, detectedData.squareFootage, detectedData.projectType, bidContent, projectZipCode, windowCountOverride, uploadOverrides?.windowCount, uploadOverrides?.linearFeet, analysis.unitDetection, contractorPulse?.fingerprint?.state]);

  // Generate Bottom Line Synthesis (Key Insight + Your Move)
  useEffect(() => {
    const generateBottomLine = () => {
      setBottomLineLoading(true);
      
      const criticalFlags = analysis.flags.filter(f => f.level === 'critical');
      const highFlags = analysis.flags.filter(f => f.level === 'high');
      const hasLicenseIssue = analysis.flags.some(f => f.id === 'license-missing');
      const hasInsuranceIssue = analysis.flags.some(f => f.id === 'insurance-missing');
      
      // Determine price situation
      const blindVerdict = blindBidAnalysis?.varianceFlag === 'green' ? 'accept' 
        : blindBidAnalysis?.varianceFlag === 'yellow' ? 'negotiate'
        : blindBidAnalysis?.varianceFlag === 'red' ? 'reject' : '';
      const priceVerdict = priceScoreData?.verdict?.toLowerCase() || blindVerdict;
      const isOverpriced = priceVerdict.includes('above') || priceVerdict.includes('premium') || priceVerdict === 'reject';
      const isUnderpriced = priceVerdict.includes('below') || priceVerdict.includes('great deal') || priceVerdict === 'accept';
      const isSuspiciouslyLow = priceVerdict.includes('suspicious') || priceVerdict.includes('undercutting') || priceVerdict === 'proceed-with-caution';
      
      let keyInsight = '';
      let yourMove = '';
      
      // Generate key insight based on most important finding
      if (isSuspiciouslyLow) {
        keyInsight = 'This bid is unusually low for the scope of work. While it might be legitimate, it could also indicate cut corners, hidden costs, or an inexperienced contractor.';
        yourMove = 'Ask the contractor to walk through exactly what\'s included and excluded. Request references from similar projects they\'ve completed at this price point.';
      } else if (criticalFlags.length > 0 && hasLicenseIssue) {
        keyInsight = 'No contractor license was found in this bid. Working with unlicensed contractors can void your homeowner\'s insurance and leave you with no recourse if something goes wrong.';
        yourMove = 'Ask the contractor for their license number before proceeding. You can verify it on your state\'s licensing board website.';
      } else if (criticalFlags.length > 0 && hasInsuranceIssue) {
        keyInsight = 'This bid doesn\'t mention liability insurance or workers\' comp. If a worker is injured on your property, you could be held financially responsible.';
        yourMove = 'Request a Certificate of Insurance (COI) showing current coverage before any work begins.';
      } else if (isOverpriced && priceScoreData) {
        const savings = priceScoreData.percentDiff;
        keyInsight = `This bid is ${Math.round(savings)}% above typical market rates for this type of work. That doesn't mean it's a bad bid, but there may be room to negotiate.`;
        yourMove = 'Ask the contractor what\'s driving the higher price. Sometimes it\'s premium materials, longer warranties, or specialized expertise that justifies the cost.';
      } else if (highFlags.length >= 2) {
        keyInsight = 'While there are no critical issues, this bid has several items worth clarifying before signing - including payment terms, scope details, or warranty coverage.';
        yourMove = 'Review the flagged items above and ask the contractor to address each one in writing before you commit.';
      } else if (isUnderpriced) {
        keyInsight = 'This bid is competitively priced compared to market rates. Combined with good documentation, it appears to be a solid option.';
        yourMove = 'Verify the contractor\'s references and past work, then move forward with confidence if everything checks out.';
      } else {
        keyInsight = 'This bid looks reasonable overall. The pricing is in line with market rates and the documentation covers the essentials.';
        yourMove = 'Compare this with any other bids you\'ve received, and ask any remaining questions before making your decision.';
      }
      
      setBottomLineSynthesis({
        verdict: '', // Not used anymore
        keyInsight,
        yourMove
      });
      setBottomLineLoading(false);
    };
    
    generateBottomLine();
  }, [analysis.flags, priceScoreData, blindBidAnalysis]);

  return (
    <div className="min-h-screen pt-6 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Report Issue Modal */}
        <ReportIssueModal 
          isOpen={isReportIssueOpen} 
          onClose={() => setIsReportIssueOpen(false)} 
        />
        
        {/* Score Breakdown Modal */}
        <ScoreBreakdownModal
          isOpen={isScoreModalOpen}
          onClose={() => setIsScoreModalOpen(false)}
          unifiedScore={enhancedUnifiedScore ?? analysis.unifiedScore}
        />

        {/* Quick Data Entry */}
        {/* Determine if this is a window-only or linear-foot project - hide SF for these */}
        {(() => {
          const isWindowTrade = analysis.tradeDetection?.primaryTrade === 'windows-doors';
          const hasWindowUnits = analysis.unitDetection?.items?.some(i => i.type === 'window');
          const hasWindowOverride = uploadOverrides?.windowCount && uploadOverrides.windowCount > 0;
          const isWindowOnlyProject = (isWindowTrade || hasWindowUnits || hasWindowOverride) && 
            !analysis.tradeDetection?.primaryTrade?.includes('remodel');
          const isLinearFootProj = isLinearFootProject(detectedData.projectType);
          const needsBidTotal = !effectiveBidTotal && !bidTotalLocked;
          const needsSquareFootage = !isWindowOnlyProject && !isLinearFootProj && !detectedData.squareFootage && !dataOverrides.squareFootage;
          
          if (!needsBidTotal && !needsSquareFootage) return null;
          
          return (
          <div className="mb-6 space-y-3">
            <h4 className="text-sm font-semibold text-emerald-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Add missing data to improve your analysis
            </h4>
            
            {/* Bid Total Card */}
            {!effectiveBidTotal && !bidTotalLocked && (
              <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    dataOverrides.bidTotal ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <DollarSign className={`w-6 h-6 ${dataOverrides.bidTotal ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 mb-1">Bid Total</p>
                    {editingField === 'bidTotal' ? (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 font-semibold">$</span>
                        <input
                          type="number"
                          value={editedBidTotal}
                          onChange={(e) => setEditedBidTotal(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const val = parseFloat(editedBidTotal);
                              if (!isNaN(val) && val > 0) {
                                handleOverridesChange({ ...dataOverrides, bidTotal: val });
                              }
                              setEditingField(null);
                            }
                          }}
                          placeholder="25000"
                          autoFocus
                          className="flex-1 px-3 py-2 border border-emerald-300 rounded-lg bg-white text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <button
                          onClick={() => {
                            const val = parseFloat(editedBidTotal);
                            if (!isNaN(val) && val > 0) {
                              handleOverridesChange({ ...dataOverrides, bidTotal: val });
                            }
                            setEditingField(null);
                          }}
                          className="w-10 h-10 rounded-lg bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors flex-shrink-0"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditedBidTotal(dataOverrides.bidTotal?.toString() || '');
                          setEditingField('bidTotal');
                        }}
                        className="group flex items-center gap-2 text-left w-full"
                      >
                        {dataOverrides.bidTotal ? (
                          <span className="font-semibold text-gray-900">${dataOverrides.bidTotal.toLocaleString()}</span>
                        ) : (
                          <span className="text-gray-400 italic">Click to enter...</span>
                        )}
                        <Edit3 className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                      </button>
                    )}
                  </div>
                  {dataOverrides.bidTotal && editingField !== 'bidTotal' && (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  )}
                </div>
              </div>
            )}
            
            {/* Square Footage Card */}
            {needsSquareFootage && (
              <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    dataOverrides.squareFootage ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <Ruler className={`w-6 h-6 ${dataOverrides.squareFootage ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 mb-1">Square Footage</p>
                    {editingField === 'squareFootage' ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editedSquareFootage}
                          onChange={(e) => setEditedSquareFootage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const val = parseInt(editedSquareFootage);
                              if (!isNaN(val) && val > 0) {
                                handleOverridesChange({ ...dataOverrides, squareFootage: val });
                              }
                              setEditingField(null);
                            }
                          }}
                          placeholder="1500"
                          autoFocus
                          className="flex-1 px-3 py-2 border border-emerald-300 rounded-lg bg-white text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <span className="text-gray-500 text-sm">sf</span>
                        <button
                          onClick={() => {
                            const val = parseInt(editedSquareFootage);
                            if (!isNaN(val) && val > 0) {
                              handleOverridesChange({ ...dataOverrides, squareFootage: val });
                            }
                            setEditingField(null);
                          }}
                          className="w-10 h-10 rounded-lg bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors flex-shrink-0"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditedSquareFootage(dataOverrides.squareFootage?.toString() || '');
                          setEditingField('squareFootage');
                        }}
                        className="group flex items-center gap-2 text-left w-full"
                      >
                        {dataOverrides.squareFootage ? (
                          <span className="font-semibold text-gray-900">{dataOverrides.squareFootage.toLocaleString()} sq ft</span>
                        ) : (
                          <span className="text-gray-400 italic">Click to enter...</span>
                        )}
                        <Edit3 className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                      </button>
                    )}
                  </div>
                  {dataOverrides.squareFootage && editingField !== 'squareFootage' && (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  )}
                </div>
              </div>
            )}
          </div>
          );
        })()}

        {/* Contractor Summary Card - Positioned at top as per design */}
        {contractorPulse?.fingerprint && (
          <div className="mb-4">
            <ContractorSummaryCard
              contractorName={contractorPulse.fingerprint.legalBusinessName || contractorPulse.fingerprint.dbaName || 'Unknown Contractor'}
              googleData={googlePlacesData}
              googleLoading={googlePlacesLoading}
              researchLoading={contractorResearchLoading}
              bbbStatus={contractorResearchData?.bbbStatus || null}
              hasLicense={!!contractorPulse.fingerprint.licenseNumber || contractorResearchData?.businessRegistration?.status === 'active'}
              licenseNumber={contractorPulse.fingerprint.licenseNumber}
              prebakedSentiment={sampleContractorData?.reviewSentiment ?? null}
            />
          </div>
        )}

        {/* Score Summary Header - Following Modal Methodology with integrated Bottom Line */}
        {confidenceScore !== undefined && flagCounts && (
          <ScoreSummaryHeader 
            score={confidenceScore} 
            flagCounts={flagCounts}
            flags={analysis.flags}
            aiLoading={aiLoading}
            confidenceBoost={aiAnalysis?.confidenceBoost}
            positiveInsights={aiAnalysis?.aiInsights?.filter(i => i.type === 'positive')}
            onScoreClick={() => setIsScoreModalOpen(true)}
            dealRisk={analysis.dealRisk}
            fileName={fileName}
            scopeGapCosts={analysis.scopeGapCosts}
            priceData={priceScoreData ? {
              verdict: priceScoreData.verdict,
              percentDiff: priceScoreData.percentDiff,
              bidTotal: effectiveBidTotal || 0,
              marketMedian: (dataOverrides.squareFootage || detectedData.squareFootage || 0) * priceScoreData.marketMedianPsf,
              isLoading: !priceScoreData && (tradeMixLoading || blsRatesLoading)
            } : undefined}
            blindBidData={blindBidAnalysis ? {
              verdict: blindBidAnalysis.varianceFlag === 'green' ? 'accept' 
                : blindBidAnalysis.varianceFlag === 'yellow' ? 'negotiate'
                : 'reject',
              fairEstimate: blindBidAnalysis.fairBidRange.mid,
              bidTotal: effectiveBidTotal || 0,
              percentDiff: blindBidAnalysis.variancePercent
            } : undefined}
            bottomLineData={{
              synthesis: bottomLineSynthesis,
              loading: bottomLineLoading
            }}
          />
        )}

        {/* How We Calculate Link */}
        <div className="flex justify-end items-center mb-2">
          <DataMethodologyModal />
        </div>

        {/* Report Content - PDF capture area */}
        <div id="report-content">
        
        {/* PDF Header - Hidden until export */}
        <PdfHeader 
          projectType={detectedData.projectType || undefined}
          bidTotal={effectiveBidTotal}
          contractorName={contractorPulse?.fingerprint?.legalBusinessName || contractorPulse?.fingerprint?.dbaName || undefined}
        />

        {/* Price Analysis Card - Shows price verdict, market comparison, and trade breakdown */}
        {effectiveBidTotal && (
          <div className="mb-6">
            <PremiumGate isPremium={isPremium} isLoggedIn={isLoggedIn} featureName="Price Analysis">
            <PriceAnalysisCard 
              priceScoreData={priceScoreData}
              tradeMixData={tradeMixData}
              bidTotal={effectiveBidTotal}
              squareFootage={dataOverrides.squareFootage || detectedData.squareFootage}
              windowCount={windowCountOverride || uploadOverrides?.windowCount || analysis.unitDetection?.items?.find(i => i.type === 'window')?.quantity || 0}
              linearFeet={uploadOverrides?.linearFeet || undefined}
              isPremium={isPremium}
              isLoading={!priceScoreData && (tradeMixLoading || blsRatesLoading)}
              bidText={bidContent}
              projectType={detectedData.projectType || 'general-remodel'}
              projectTypeName={detectedData.projectType?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Home Improvement'}
              flaggedIssues={analysis.flags.map(f => ({ title: f.title, level: f.level, description: f.description }))}
              lowballDetected={!!analysis.dealRisk?.priceRealism?.flag}
              lowballReason={analysis.dealRisk?.priceRealism?.reason || undefined}
              stateCode={stateCode || contractorPulse?.fingerprint?.state || undefined}
              zipCode={projectZipCode || undefined}
            />
            </PremiumGate>
          </div>
        )}

        {/* Regional Cost Intelligence - Shows location-based pricing context */}
        {priceScoreData?.regionalMultiplier && priceScoreData.regionalMultiplier !== 1.0 && (
          <div className="mb-6">
            <RegionalInsightCard
              regionalMultiplier={priceScoreData.regionalMultiplier}
              regionalName={priceScoreData.regionalName}
              regionalSource={priceScoreData.regionalSource as 'msa' | 'state' | 'national' | 'zonda' | 'bls' | 'estimated'}
              zipCode={projectZipCode || undefined}
              stateCode={contractorPulse?.fingerprint?.state || undefined}
              isPremium={isPremium}
            />
          </div>
        )}

        {/* Blind Bid Analysis - Shows benchmark comparison when no square footage */}
        {blindBidAnalysis && (
          <div className="mb-6">
            <BlindBidNotice 
              analysis={blindBidAnalysis}
              isPremium={isPremium}
            />
          </div>
        )}

        {/* Scope Analysis - Main content area (full-width) */}
        <div className="mb-6">
          {/* Scope Analysis Card - includes unit count as first element */}
          {analysis.scopeAnalysis && (
            <ScopeComparisonCard 
              scopeAnalysis={analysis.scopeAnalysis}
              unitDetection={analysis.unitDetection}
              bidText={bidContent}
              enableAI={isPremium}
              aiQuestionsToAsk={aiAnalysis?.questionsToAsk}
              onQuestionsReady={(questions) => setScopeQuestions(
                questions.map(q => typeof q === 'string' ? q : q)
              )}
            />
          )}
        </div>

        {/* Change Order Predictor - AI-powered cost overrun risk analysis (before Contractor Pulse) */}
        <div className="mb-6">
          <ChangeOrderPredictorCard 
            bidText={bidContent}
            projectType={detectedData.projectType || 'general-remodel'}
            bidTotal={effectiveBidTotal || 0}
            vagueTerms={analysis.vagueTerms || undefined}
            onQuestionsReady={setChangeOrderQuestions}
          />
        </div>

        {/* Contractor Pulse Card - Full Width (4th in hierarchy) */}
        {contractorPulse && (
          <div className="mb-6" id="contractor-pulse-section">
            <PremiumGate isPremium={isPremium} isLoggedIn={isLoggedIn} featureName="Contractor Pulse">
            <ContractorPulseCard 
              pulse={contractorPulse} 
              hideSummaryCard 
              externalResearchData={contractorResearchData ? {
                bbbStatus: contractorResearchData.bbbStatus || 'Not Found',
                businessRegistration: contractorResearchData.businessRegistration ? {
                  status: contractorResearchData.businessRegistration.status || 'unknown',
                  entity: contractorResearchData.businessRegistration.entity || null,
                  registeredState: contractorResearchData.businessRegistration.registeredState || null,
                  licenseNumber: contractorResearchData.businessRegistration.licenseNumber || null,
                  notes: contractorResearchData.businessRegistration.notes || null
                } : null,
                permitHistory: contractorResearchData.permitHistory || null,
                reputation: contractorResearchData.reputation || { score: 'unknown', highlights: [], concerns: [] },
                summary: contractorResearchData.summary || '',
                sources: contractorResearchData.sources || [],
                bbbComplaints: contractorResearchData.bbbComplaints || null,
                newsItems: contractorResearchData.newsItems || [],
                redFlags: contractorResearchData.redFlags || []
              } : null}
              externalResearchLoading={contractorResearchLoading}
            />
            </PremiumGate>
          </div>
        )}

        {/* Gemini Deep Analysis - MOVED TO GRAVEYARD (Feb 2025) - replaced by BottomLineSummary
        <GeminiDeepAnalysis
          aiAnalysis={aiAnalysis}
          aiLoading={aiLoading}
          aiError={aiError}
          onRetry={fetchAIAnalysis}
          isPremium={isPremium}
          onUpgrade={() => navigate('/premium')}
          onQuestionsReady={() => {}}
        />
        */}

        {/* Unified Questions to Ask Card - consolidates questions from all sources */}
        <PremiumGate isPremium={isPremium} isLoggedIn={isLoggedIn} featureName="Questions to Ask">
        <QuestionsToAskCard 
          scopeQuestions={scopeQuestions}
          aiQuestions={aiQuestions}
          changeOrderQuestions={changeOrderQuestions}
        />
        </PremiumGate>

        {/* Main Content - Full Width */}
        <div className="space-y-6">
          {/* Issues Found section MOVED TO GRAVEYARD (Feb 2025) - redundant with ScoreSummaryHeader "What is bad about this bid" */}
        </div>

        {/* PDF Footer - Hidden until export */}
        <PdfFooter />

        </div>{/* End report-content PDF capture area */}

        {/* Report an Issue Footer */}
        <div className="mt-12 pt-6 border-t border-navy-100">
          <button
            onClick={() => setIsReportIssueOpen(true)}
            className="flex items-center gap-2 text-navy-500 hover:text-emerald-600 transition-colors group"
          >
            <Flag className="w-4 h-4" />
            <span className="text-sm font-medium">Report an Issue</span>
          </button>
          <p className="text-xs text-navy-400 mt-1 ml-6">
            Something not quite right? Let us know and we'll look into it.
          </p>
        </div>

      </div>
    </div>
  );
}

// Score Summary Header - Like the modal but inline
interface BottomLineSynthesis {
  verdict: string;
  keyInsight: string;
  yourMove: string;
}

interface PriceDataProps {
  verdict: string;
  percentDiff: number;
  bidTotal: number;
  marketMedian: number;
  isLoading?: boolean;
}

interface BlindBidDataProps {
  verdict: 'accept' | 'negotiate' | 'proceed-with-caution' | 'reject';
  fairEstimate: number;
  bidTotal: number;
  percentDiff: number;
}

function ScoreSummaryHeader({ 
  score, 
  flagCounts,
  flags,
  aiLoading,
  confidenceBoost,
  positiveInsights,
  onScoreClick,
  dealRisk,
  fileName,
  scopeGapCosts,
  // Price/Negotiation props
  priceData,
  blindBidData,
  bottomLineData
}: { 
  score: number; 
  flagCounts: FlagCounts;
  flags: AnalysisFlag[];
  aiLoading: boolean;
  confidenceBoost?: string;
  positiveInsights?: AIInsight[];
  onScoreClick?: () => void;
  dealRisk?: DealRiskResult | null;
  fileName?: string;
  scopeGapCosts?: ScopeGapWithCost[] | null;
  // Price/Negotiation data
  priceData?: PriceDataProps;
  blindBidData?: BlindBidDataProps;
  bottomLineData?: {
    synthesis: BottomLineSynthesis | null;
    loading: boolean;
  };
}) {
  // Group flags by severity level
  const flagsByLevel = {
    critical: flags.filter(f => f.level === 'critical'),
    high: flags.filter(f => f.level === 'high'),
    medium: flags.filter(f => f.level === 'medium'),
    low: flags.filter(f => f.level === 'low'),
  };
  
  // Combine all flags in severity order for collapsible display
  const allFlags = [
    ...flagsByLevel.critical,
    ...flagsByLevel.high,
    ...flagsByLevel.medium,
    ...flagsByLevel.low,
  ];
  const [issuesExpanded, setIssuesExpanded] = useState(false);
  const visibleFlags = issuesExpanded ? allFlags : allFlags.slice(0, 2);
  const hiddenCount = allFlags.length - 2;
  // Use actual score to derive total deduction (accounts for flags that don't deduct)
  const totalDeduction = 100 - score;
  
  // For display breakdown, we still show per-category estimates
  const criticalDeduction = flagCounts.critical * POINT_DEDUCTIONS.critical;
  const highDeduction = flagCounts.high * POINT_DEDUCTIONS.high;
  const mediumDeduction = flagCounts.medium * POINT_DEDUCTIONS.medium;
  
  // Build insights array from confidenceBoost and positiveInsights
  const insights: { title: string; content: string }[] = [];
  if (confidenceBoost) {
    insights.push({ title: 'Summary', content: confidenceBoost });
  }
  if (positiveInsights) {
    positiveInsights.forEach(insight => {
      insights.push({ title: insight.title, content: insight.detail || insight.action });
    });
  }
  
  const getScoreLabel = (_s: number) => {
    return 'RemodelerIQ';
  };

  // Always black header for consistent branding
  const headerBg = 'bg-black';
  
  // Calculate potential savings for negotiation target
  const potentialSavings = useMemo(() => {
    // Use blind bid data if available (no square footage)
    if (blindBidData) {
      const savings = blindBidData.bidTotal - blindBidData.fairEstimate;
      if (savings > 0) {
        return {
          amount: savings,
          percentage: blindBidData.percentDiff,
          verdict: blindBidData.verdict,
          target: blindBidData.fairEstimate
        };
      }
    }
    // Use price data (PSF-based)
    if (priceData && priceData.percentDiff > 5 && priceData.marketMedian > 0) {
      const savings = priceData.bidTotal - priceData.marketMedian;
      if (savings > 0) {
        return {
          amount: savings,
          percentage: priceData.percentDiff,
          verdict: priceData.verdict,
          target: priceData.marketMedian
        };
      }
    }
    return null;
  }, [priceData, blindBidData]);
  
  // Price verdict styling
  const priceVerdictConfig = useMemo(() => {
    const verdict = priceData?.verdict?.toLowerCase() || blindBidData?.verdict || '';
    if (verdict.includes('great deal') || verdict.includes('below market') || verdict === 'accept') {
      return { color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', label: 'Below Market', icon: '✓' };
    }
    if (verdict.includes('fair') || verdict.includes('market rate') || verdict.includes('competitive')) {
      return { color: 'text-blue-400', bgColor: 'bg-blue-500/20', label: 'Market Rate', icon: '≈' };
    }
    if (verdict.includes('slightly above') || verdict === 'negotiate') {
      return { color: 'text-amber-400', bgColor: 'bg-amber-500/20', label: 'Above Market', icon: '↑' };
    }
    if (verdict.includes('significantly above') || verdict.includes('premium') || verdict === 'reject') {
      return { color: 'text-red-400', bgColor: 'bg-red-500/20', label: 'Premium Pricing', icon: '↑↑' };
    }
    if (verdict.includes('suspiciously') || verdict.includes('undercutting') || verdict === 'proceed-with-caution') {
      return { color: 'text-white', bgColor: 'bg-[#1F9C4C]', label: 'Unusually Low', icon: '⚠' };
    }
    return { color: 'text-white/70', bgColor: 'bg-white/10', label: 'Under Review', icon: '?' };
  }, [priceData?.verdict, blindBidData?.verdict]);
  
  return (
    <div className="mb-8">
      {/* Score Header Banner - Modern Flat Design with Animations */}
      <div className={`${headerBg} rounded-t-2xl p-6 text-white shadow-lg`}>
        {/* Main Header Row - Responsive: stacks on mobile, 3-col on desktop */}
        <div className="space-y-4 md:space-y-0 md:flex md:items-center md:justify-between md:gap-6 animate-fade-slide-up">
          {/* Left: Score Circle + Text */}
          <div className="flex items-center gap-4">
            {/* Circular Progress Score - Clickable */}
            <button 
              onClick={onScoreClick}
              className="relative w-16 h-16 md:w-20 md:h-20 cursor-pointer hover:scale-105 transition-transform group shrink-0"
              title="Click for score breakdown"
            >
              <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="8"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke="#1F9C4C"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(score / 100) * 213.6} 213.6`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl md:text-2xl font-bold">{score}</span>
              </div>
              {/* Hover hint */}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <HelpCircle className="w-3 h-3 text-white" />
              </div>
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-white/90 text-xs font-medium uppercase tracking-wide">Confidence Score</p>
                <button 
                  onClick={onScoreClick}
                  className="text-white/60 hover:text-white transition-colors"
                  title="View score breakdown"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
              <p className="text-lg md:text-xl font-semibold text-white mt-0.5">{getScoreLabel(score)}</p>
              <p className="text-white/90 text-xs md:text-sm mt-1">
                {totalDeduction > 0 ? `${totalDeduction} points deducted` : 'No issues found'}
              </p>
            </div>
          </div>
          
          {/* Center: Negotiation Target (if savings available) */}
          {potentialSavings && potentialSavings.amount >= 500 && (
            <div className="flex items-center gap-3 bg-emerald-500/10 rounded-xl px-4 py-3 md:bg-transparent md:px-0 md:py-0 animate-fade-slide-up animate-delay-100">
              <div className="w-10 h-10 rounded-full bg-emerald-500/30 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1 md:flex-none">
                <p className="text-xs text-emerald-300 font-medium uppercase tracking-wide">Negotiation Target</p>
                <p className="text-base md:text-lg font-bold text-white">
                  Save up to ${potentialSavings.amount.toLocaleString()}
                </p>
              </div>
            </div>
          )}
          
          {/* Right: Price Verdict Badge + Filename - stacks vertically */}
          <div className="flex flex-col items-start md:items-end gap-1">
            {/* Price Verdict Badge */}
            {(priceData || blindBidData) && !priceData?.isLoading && (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${priceVerdictConfig.bgColor} animate-fade-slide-up animate-delay-200`}>
                <span className="text-sm">{priceVerdictConfig.icon}</span>
                <span className={`text-xs md:text-sm font-semibold ${priceVerdictConfig.color}`}>
                  {priceVerdictConfig.label}
                </span>
                {(priceData?.percentDiff !== undefined || blindBidData?.percentDiff !== undefined) && (
                  <span className={`text-xs ${priceVerdictConfig.color}`}>
                    ({(priceData?.percentDiff ?? blindBidData?.percentDiff ?? 0) > 0 ? '+' : ''}
                    {Math.round(priceData?.percentDiff ?? blindBidData?.percentDiff ?? 0)}%)
                  </span>
                )}
              </div>
            )}
            
            {/* Filename */}
            {fileName && (
              <p className="text-white/50 text-xs truncate max-w-[250px] md:max-w-[200px] animate-fade-slide-up animate-delay-200" title={fileName}>
                {fileName}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Key Insight & Your Move Section */}
      {bottomLineData && !bottomLineData.loading && bottomLineData.synthesis && (
        <div className="bg-gradient-to-r from-slate-50 to-emerald-50 border-x border-navy-200 px-5 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Key Insight */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <Lightbulb className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">Key Insight</p>
                <p className="text-sm text-navy-700 leading-relaxed">{bottomLineData.synthesis.keyInsight}</p>
              </div>
            </div>
            
            {/* Your Move */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <ChevronRight className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">Your Move</p>
                <p className="text-sm text-navy-700 leading-relaxed">{bottomLineData.synthesis.yourMove}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Breakdown Detail Section */}
      <div className="bg-white border border-t-0 border-navy-200 rounded-b-2xl p-5 shadow-sm">
        <div className="space-y-6">
          
          {/* Positive insights - First */}
          <div>
            <h4 className="text-base font-semibold text-navy-700 mb-3">
              What is good about this bid
            </h4>
            
            {aiLoading ? (
              <div className="bg-white border border-navy-200 rounded-xl p-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                  <span className="text-navy-600 text-sm">Finding opportunities...</span>
                </div>
              </div>
            ) : insights.length > 0 ? (
              <div className="bg-white border border-navy-200 rounded-xl p-4 shadow-sm">
                <div className="space-y-3">
                  {insights.map((insight, idx) => {
                    // Get icon for insight based on title or type
                    const getInsightIcon = () => {
                      const title = insight.title.toLowerCase();
                      if (title.includes('warranty') || title.includes('protection')) {
                        return <Shield className="w-4 h-4 text-emerald-600" />;
                      }
                      if (title.includes('price') || title.includes('cost') || title.includes('value')) {
                        return <TrendingUp className="w-4 h-4 text-emerald-600" />;
                      }
                      if (title.includes('detail') || title.includes('specification')) {
                        return <FileWarning className="w-4 h-4 text-emerald-600" />;
                      }
                      if (title.includes('payment') || title.includes('deposit')) {
                        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
                      }
                      if (title.includes('timeline') || title.includes('schedule')) {
                        return <Flag className="w-4 h-4 text-emerald-600" />;
                      }
                      if (title === 'Summary') {
                        return <Sparkles className="w-4 h-4 text-emerald-600" />;
                      }
                      return <Lightbulb className="w-4 h-4 text-emerald-600" />;
                    };

                    // Summary gets larger font, others get standard size
                    const isSummary = insight.title === 'Summary';
                    
                    return (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getInsightIcon()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-emerald-700 mb-1 ${isSummary ? 'text-sm' : 'text-sm'}`}>
                            {insight.title}
                          </p>
                          <p className={`text-navy-700 leading-relaxed ${isSummary ? 'text-base' : 'text-sm'}`}>
                            {insight.content}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : totalDeduction > 0 ? (
              <div className="bg-white border border-navy-200 rounded-xl p-3 shadow-sm">
                <p className="text-navy-700 text-sm mb-2">Address the issues to boost your score:</p>
                <div className="space-y-1.5">
                  {flagCounts.critical > 0 && (
                    <p className="text-xs text-navy-600 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Fix critical issues for <span className="font-semibold text-emerald-600">+{criticalDeduction} pts</span>
                    </p>
                  )}
                  {flagCounts.high > 0 && (
                    <p className="text-xs text-navy-600 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Resolve high-priority items for <span className="font-semibold text-emerald-600">+{highDeduction} pts</span>
                    </p>
                  )}
                  {flagCounts.medium > 0 && (
                    <p className="text-xs text-navy-600 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Handle medium issues for <span className="font-semibold text-emerald-600">+{mediumDeduction} pts</span>
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white border border-navy-200 rounded-xl p-3 shadow-sm">
                <p className="text-emerald-700 text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  This bid looks solid! Review details below.
                </p>
              </div>
            )}
          </div>

          {/* Trust Bonuses Section - Show contractor trust bonuses in green */}
          {dealRisk && dealRisk.trustBuffer.bonuses.length > 0 && (
            <div>
              <h4 className="text-base font-semibold text-navy-700 mb-3">
                Trust Bonuses Earned
              </h4>
              <div className="space-y-2">
                {dealRisk.trustBuffer.bonuses.map((bonus, idx) => (
                  <div key={idx} className="bg-white rounded-xl border-l-4 border-l-emerald-500 border border-navy-200 shadow-sm p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-navy-900 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
                          {bonus.type === 'reviews' && 'Good Reviews'}
                          {bonus.type === 'insurance' && 'Insurance Verified'}
                          {bonus.type === 'bbb' && 'BBB Accredited'}
                          {bonus.type === 'warranty' && 'Warranty Included'}
                        </p>
                        <p className="text-sm text-navy-600 ml-3.5 mt-1">{bonus.reason}</p>
                      </div>
                      <span className="text-sm font-bold text-emerald-600 whitespace-nowrap">+{bonus.points} pts</span>
                    </div>
                  </div>
                ))}
                {dealRisk.trustBuffer.totalBonus > dealRisk.trustBuffer.adjustment && (
                  <p className="text-xs text-navy-500 ml-1">
                    Total bonuses capped at +{dealRisk.trustBuffer.adjustment} pts (max +10)
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Deduction breakdown - Second */}
          <div>
            <h4 className="text-base font-semibold text-navy-700 mb-3">
              What is bad about this bid
            </h4>
            
            {totalDeduction === 0 ? (
              <div className="bg-white border border-navy-200 rounded-xl p-3 shadow-sm">
                <p className="text-emerald-700 text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  No issues found! Your score is perfect.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {visibleFlags.map((flag) => {
                  const levelColors = {
                    critical: { border: 'border-l-red-800', dot: 'bg-red-800', text: 'text-red-800' },
                    high: { border: 'border-l-amber-500', dot: 'bg-amber-500', text: 'text-amber-600' },
                    medium: { border: 'border-l-yellow-500', dot: 'bg-yellow-500', text: 'text-yellow-600' },
                    low: { border: 'border-l-blue-500', dot: 'bg-blue-500', text: 'text-blue-600' },
                  };
                  const colors = levelColors[flag.level as keyof typeof levelColors] || levelColors.low;
                  
                  // Check if this flag deducts points
                  const isDeducting = flag.deducting !== false;
                  const deduction = isDeducting 
                    ? POINT_DEDUCTIONS[flag.level as keyof typeof POINT_DEDUCTIONS] || POINT_DEDUCTIONS.low
                    : 0;
                  
                  return (
                    <div key={flag.id} className={`bg-white rounded-xl border-l-4 ${colors.border} border border-navy-200 shadow-sm p-3`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-navy-900 flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} flex-shrink-0`}></span>
                            {flag.title}
                          </p>
                          <p className="text-sm text-navy-600 ml-3.5 mt-1">{flag.description}</p>
                        </div>
                        {isDeducting && (
                          <span className={`text-sm font-bold ${colors.text} whitespace-nowrap`}>−{deduction} pts</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {hiddenCount > 0 && !issuesExpanded && (
                  <button
                    onClick={() => setIssuesExpanded(true)}
                    className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    +{hiddenCount} more...
                  </button>
                )}
                {issuesExpanded && allFlags.length > 2 && (
                  <button
                    onClick={() => setIssuesExpanded(false)}
                    className="text-sm font-medium text-navy-500 hover:text-navy-700 transition-colors"
                  >
                    Show less
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Likely Change Orders - Phase 1A Scope Gap Costs */}
          {scopeGapCosts && scopeGapCosts.length > 0 && (
            <div>
              <h4 className="text-base font-semibold text-navy-700 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Likely Change Orders
              </h4>
              <p className="text-sm text-navy-500 mb-3">
                Standard scope items missing from this bid. Expect potential add-on costs if not addressed upfront.
              </p>
              <div className="space-y-2">
                {scopeGapCosts.map((gap: ScopeGapWithCost, idx: number) => (
                  <div key={idx} className="bg-white rounded-xl border-l-4 border-l-amber-400 border border-navy-200 shadow-sm p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-navy-900">{gap.displayName}</p>
                        <p className="text-sm text-navy-500 mt-0.5">{gap.warningText}</p>
                      </div>
                      <span className="text-sm font-bold text-amber-600 whitespace-nowrap">
                        ${gap.typicalCost.low.toLocaleString()} - ${gap.typicalCost.high.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-3">
                  <p className="text-sm font-medium text-amber-800">
                    Total potential change orders: ${scopeGapCosts.reduce((sum: number, g: ScopeGapWithCost) => sum + g.typicalCost.low, 0).toLocaleString()} - ${scopeGapCosts.reduce((sum: number, g: ScopeGapWithCost) => sum + g.typicalCost.high, 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    Ask your contractor to confirm these items are included or provide line-item pricing.
                  </p>
                </div>
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}


// RiskFlagCard component MOVED TO GRAVEYARD (Feb 2025)
// Was used by Issues Found section - now redundant with ScoreSummaryHeader
