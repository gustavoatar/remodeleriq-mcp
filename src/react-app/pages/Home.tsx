import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router';
import { useAuth } from '@/react-app/lib/auth';
import Header from '@/react-app/components/Header';
import Hero from '@/react-app/components/Hero';
import PageSEO from '@/react-app/components/PageSEO';
import FAQSchema, { HOME_FAQS } from '@/react-app/components/FAQSchema';
import { OrganizationSchema, WebSiteSchema, SoftwareApplicationSchema, HowToSchema, HOWTO_BID_ANALYSIS, ServiceAreaSchema } from '@/react-app/components/StructuredData';
import Footer from '@/react-app/components/Footer';
import UploadArea from '@/react-app/components/UploadArea';
import ReportView from '@/react-app/components/ReportView';
import MarketAnalysisView from '@/react-app/components/MarketAnalysisView';
import TalkTrackView from '@/react-app/components/TalkTrackView';
import BetaWelcomeModal from '@/react-app/components/BetaWelcomeModal';
import { MessageCircle, ArrowLeft, BarChart3, FileText, ArrowRight, Star, Download, Loader2, Lock } from 'lucide-react';
import { usePdfExport } from '@/react-app/hooks/usePdfExport';

import { analyzeBid, extractBidTotal } from '@/shared/analysisEngine';
import { useUserLocation } from '@/react-app/hooks/useGeolocation';
import { extractDetectedData } from '@/react-app/components/ProjectDataEditor';
import { PREMIUM_MODE_ENABLED, EVERYONE_HAS_PREMIUM, INVESTOR_DEMO_CODE } from '@/shared/featureFlags';
import { ContractorPulse } from '@/shared/contractorPulse';
import { detectProjectZip } from '@/shared/zipDetection';
import { getUnitConfig, normalizeProjectType } from '@/shared/unitTypeEngine';
import { SAMPLE_BID_DATA } from '@/data/sampleBidData';
import SampleDemoBanner from '@/react-app/components/SampleDemoBanner';

type AppView = 'landing' | 'upload' | 'analysis';
type AnalysisTab = 'analysis' | 'market' | 'negotiate';

interface ContractorFingerprintExtract {
  legalBusinessName: string | null;
  dbaName: string | null;
  licenseNumber: string | null;
  licenseState: string | null;
  businessAddress: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  primaryContact: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
}

interface AnalyzedBid {
  content: string;
  fileName: string;
  overrides?: {
    projectType?: string | null;
    squareFootage?: number | null;
    bidTotal?: number | null;
    stateCode?: string;
    windowCount?: number | null;
    yearBuilt?: number | null;
    linearFeet?: number | null;
    contractorFingerprint?: ContractorFingerprintExtract | null;
    contractorPulse?: ContractorPulse | null;
    contributeData?: boolean;
  };
  bidTotal?: number | null;
  zipCode?: string;
}

// Editable Window Count Component
function EditableWindowCount({ 
  value, 
  onChange 
}: { 
  value: number | undefined; 
  onChange: (newValue: number | null) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value?.toString() || '');
  
  const handleSave = () => {
    const parsed = parseInt(inputValue.replace(/[^0-9]/g, ''));
    if (!isNaN(parsed) && parsed > 0) {
      onChange(parsed);
    } else {
      onChange(null);
    }
    setIsEditing(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setInputValue(value?.toString() || '');
      setIsEditing(false);
    }
  };
  
  if (isEditing) {
    return (
      <div className="text-right">
        <p className="text-xs text-navy-500">Windows</p>
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="w-16 text-lg font-bold text-navy-900 bg-white border border-navy-300 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-brand-500 text-right"
            autoFocus
          />
          <span className="text-sm text-navy-500">ct</span>
        </div>
      </div>
    );
  }
  
  return (
    <button
      onClick={() => {
        setInputValue(value?.toString() || '');
        setIsEditing(true);
      }}
      className="text-right group hover:bg-navy-50 rounded-lg px-2 py-1 -mx-2 -my-1 transition-colors"
      title="Click to edit window count"
    >
      <p className="text-xs text-navy-500 flex items-center gap-1">
        Windows
        <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </p>
      <p className="text-lg font-bold text-navy-900">
        {value ? `${value} windows` : 'Add'}
      </p>
    </button>
  );
}

// Editable Square Footage Component
function EditableSquareFootage({ 
  value, 
  onChange 
}: { 
  value: number | undefined; 
  onChange: (newValue: number | null) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value?.toString() || '');
  
  const handleSave = () => {
    const parsed = parseInt(inputValue.replace(/[^0-9]/g, ''));
    if (!isNaN(parsed) && parsed > 0) {
      onChange(parsed);
    } else {
      onChange(null);
    }
    setIsEditing(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setInputValue(value?.toString() || '');
      setIsEditing(false);
    }
  };
  
  if (isEditing) {
    return (
      <div className="text-right">
        <p className="text-xs text-navy-500">Area</p>
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="w-20 text-lg font-bold text-navy-900 bg-white border border-navy-300 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-brand-500 text-right"
            autoFocus
          />
          <span className="text-sm text-navy-500">sf</span>
        </div>
      </div>
    );
  }
  
  return (
    <button
      onClick={() => {
        setInputValue(value?.toString() || '');
        setIsEditing(true);
      }}
      className="text-right group hover:bg-navy-50 rounded-lg px-2 py-1 -mx-2 -my-1 transition-colors"
      title="Click to edit square footage"
    >
      <p className="text-xs text-navy-500 flex items-center gap-1">
        Area
        <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </p>
      <p className="text-lg font-bold text-navy-900">
        {value ? `${value.toLocaleString()} sf` : 'Add'}
      </p>
    </button>
  );
}

// Editable Bid Total Component
function EditableBidTotal({ 
  value, 
  onChange,
  isLocked = false,
  onLock
}: { 
  value: number | undefined; 
  onChange: (newValue: number | null) => void;
  isLocked?: boolean;
  onLock?: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value?.toString() || '');
  
  const handleSave = () => {
    const parsed = parseFloat(inputValue.replace(/[^0-9.]/g, ''));
    if (!isNaN(parsed) && parsed > 0) {
      onChange(Math.round(parsed));
      onLock?.(); // Lock after saving
    } else {
      onChange(null);
    }
    setIsEditing(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setInputValue(value?.toString() || '');
      setIsEditing(false);
    }
  };
  
  if (isEditing && !isLocked) {
    return (
      <div className="text-right">
        <p className="text-xs text-navy-500">Bid Total</p>
        <div className="flex items-center gap-1">
          <span className="text-lg font-bold text-navy-900">$</span>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="w-24 text-lg font-bold text-navy-900 bg-white border border-navy-300 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
            autoFocus
          />
        </div>
      </div>
    );
  }
  
  // If locked, show as non-editable display
  if (isLocked) {
    return (
      <div className="text-right px-2 py-1 -mx-2 -my-1">
        <p className="text-xs text-navy-500 flex items-center gap-1">
          Bid Total
          <svg className="w-3 h-3 text-navy-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </p>
        <p className="text-lg font-bold text-navy-900">
          {value ? `$${value.toLocaleString()}` : 'Not set'}
        </p>
      </div>
    );
  }
  
  return (
    <button
      onClick={() => {
        setInputValue(value?.toString() || '');
        setIsEditing(true);
      }}
      className="text-right group hover:bg-navy-50 rounded-lg px-2 py-1 -mx-2 -my-1 transition-colors"
      title="Click to edit bid total"
    >
      <p className="text-xs text-navy-500 flex items-center gap-1">
        Bid Total
        <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </p>
      <p className="text-lg font-bold text-navy-900">
        {value ? `$${value.toLocaleString()}` : 'Not set'}
      </p>
    </button>
  );
}

// Editable Linear Feet Component (for fence, gutter, railing projects)
function EditableLinearFeet({ 
  value, 
  onChange 
}: { 
  value: number | undefined; 
  onChange: (newValue: number | null) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value?.toString() || '');
  
  const handleSave = () => {
    const parsed = parseInt(inputValue.replace(/[^0-9]/g, ''));
    if (!isNaN(parsed) && parsed > 0) {
      onChange(parsed);
    } else {
      onChange(null);
    }
    setIsEditing(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setInputValue(value?.toString() || '');
      setIsEditing(false);
    }
  };
  
  if (isEditing) {
    return (
      <div className="text-right">
        <p className="text-xs text-navy-500">Linear Feet</p>
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="w-20 text-lg font-bold text-navy-900 bg-white border border-navy-300 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-orange-500 text-right"
            autoFocus
          />
          <span className="text-sm text-navy-500">LF</span>
        </div>
      </div>
    );
  }
  
  return (
    <button
      onClick={() => {
        setInputValue(value?.toString() || '');
        setIsEditing(true);
      }}
      className="text-right group hover:bg-navy-50 rounded-lg px-2 py-1 -mx-2 -my-1 transition-colors"
      title="Click to edit linear feet"
    >
      <p className="text-xs text-navy-500 flex items-center gap-1">
        Linear Feet
        <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </p>
      <p className="text-lg font-bold text-navy-900">
        {value ? `${value.toLocaleString()} LF` : 'Add'}
      </p>
    </button>
  );
}

// Upload tracking utilities - storage keys for non-upload tracking
const STORAGE_KEYS = {
  betaWelcomeShown: 'remodeleriq_beta_welcome_shown',
  betaSource: 'remodeleriq_beta_source',
};

// Upload limits are now tracked server-side - see /api/usage/can-upload and /api/usage/record-upload
interface UploadLimitState {
  canUpload: boolean;
  remaining: number; // -1 for unlimited (premium)
  isLoading: boolean;
}



export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, isPending } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [activeTab, setActiveTab] = useState<AnalysisTab>('analysis');
  const [showLimitBanner, setShowLimitBanner] = useState(false);
  
  // Handle ?view=upload from URL to go directly to upload page
  useEffect(() => {
    if (searchParams.get('view') === 'upload') {
      setCurrentView('upload');
      // Clear the URL param so it doesn't persist
      navigate('/', { replace: true });
    }
  }, [searchParams, navigate]);
  
  // Handle investor demo mode - ?demo=CODE grants premium access
  const [isDemoMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    // Demo mode is disabled while no code is set. Guarding here (not just on
    // the URL check) matters twice over: `?demo` with no value yields '' from
    // URLSearchParams — equal to the disabled code — and stale localStorage
    // flags from when the bypass was active would otherwise grant premium
    // forever. Clear any such flag.
    if (!INVESTOR_DEMO_CODE) {
      localStorage.removeItem('riq_demo_mode');
      return false;
    }
    // Check localStorage first (persists demo mode during session)
    if (localStorage.getItem('riq_demo_mode') === 'active') {
      return true;
    }
    // Also check URL param on initial load (before useEffect runs)
    const urlParams = new URLSearchParams(window.location.search);
    const demoCode = urlParams.get('demo');
    if (demoCode === INVESTOR_DEMO_CODE) {
      localStorage.setItem('riq_demo_mode', 'active');
      // Clear the URL param immediately using history API (doesn't cause re-render)
      window.history.replaceState({}, '', window.location.pathname);
      return true;
    }
    return false;
  });
  
  // Scroll to top when view or tab changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView, activeTab]);
  const [analyzedBid, setAnalyzedBid] = useState<AnalyzedBid | null>(null);
  const [showBetaWelcome, setShowBetaWelcome] = useState(false);
  const [userBidTotal, setUserBidTotal] = useState<number | null>(null);
  const [bidTotalLocked, setBidTotalLocked] = useState(false);
  const [userSquareFootage, setUserSquareFootage] = useState<number | null>(null);
  const [userWindowCount, setUserWindowCount] = useState<number | null>(null);
  const [userYearBuilt, _setUserYearBuilt] = useState<number | null>(null);
  const [userLinearFeet, setUserLinearFeet] = useState<number | null>(null);
  
  // Price data from ReportView to share with TalkTrackView for consistent verdicts
  const [priceDataFromAnalysis, setPriceDataFromAnalysis] = useState<{
    verdict: string;
    percentDiff: number;
    bidTotal: number;
  } | null>(null);
  
  // Change order questions from ReportView to share with TalkTrackView
  const [changeOrderQuestions, setChangeOrderQuestions] = useState<string[]>([]);
  
  // Demo mode flag for sample bid walkthrough
  const [isSampleDemo, setIsSampleDemo] = useState(false);
  
  // PDF export
  const { exportToPdf, isExporting } = usePdfExport();

  // Server-side upload limits (replaces localStorage tracking)
  const [uploadLimits, setUploadLimits] = useState<UploadLimitState>({
    canUpload: false,
    remaining: 0,
    isLoading: true
  });

  // Fetch upload limits from server on mount and when user changes
  useEffect(() => {
    const fetchUploadLimits = async () => {
      try {
        const response = await fetch('/api/usage/can-upload', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setUploadLimits({
            canUpload: data.canUpload,
            remaining: data.remaining ?? 0,
            isLoading: false
          });
        } else {
          // On error, default to allowing (fail open for UX)
          setUploadLimits({ canUpload: true, remaining: 3, isLoading: false });
        }
      } catch (error) {
        console.error('Failed to fetch upload limits:', error);
        setUploadLimits({ canUpload: true, remaining: 3, isLoading: false });
      }
    };

    fetchUploadLimits();
  }, [user]); // Re-fetch when user logs in/out


  const profile = (user as any)?.profile;
  const isPremium = profile?.isPremium ?? false;
  const isBetaUser = profile?.isBetaUser ?? false;
  const isLoggedIn = !!user;
  
  // Effective premium includes global flag and demo mode
  const effectiveIsPremium = EVERYONE_HAS_PREMIUM || isPremium || isDemoMode;
  
  // Get user's saved location as fallback
  const { stateCode: savedStateCode, setLocation } = useUserLocation();
  
  // Use state from bid overrides if present, otherwise use saved location
  const userStateCode = analyzedBid?.overrides?.stateCode || savedStateCode;
  
  const userTier: 'anonymous' | 'free' | 'premium' = isPending 
    ? 'free'
    : (EVERYONE_HAS_PREMIUM || isPremium || isDemoMode)
      ? 'premium' 
      : isLoggedIn 
        ? 'free' 
        : 'anonymous';

  // Calculate confidence score for sticky header
  // Use user-overridden bid total if set, otherwise extract from content
  const effectiveBidTotal = useMemo(() => {
    if (userBidTotal !== null) return userBidTotal;
    if (!analyzedBid) return undefined;
    return extractBidTotal(analyzedBid.content);
  }, [analyzedBid, userBidTotal]);
  
  // Extract project type and square footage from bid
  const detectedData = useMemo(() => {
    if (!analyzedBid) return null;
    return extractDetectedData(analyzedBid.content, null);
  }, [analyzedBid]);
  
  const projectType = useMemo(() => {
    if (!analyzedBid) return null;
    if (analyzedBid.overrides?.projectType) return analyzedBid.overrides.projectType;
    return detectedData?.projectType || null;
  }, [analyzedBid, detectedData]);
  
  // Effective square footage (user override > detected)
  const effectiveSquareFootage = useMemo(() => {
    if (userSquareFootage !== null) return userSquareFootage;
    if (analyzedBid?.overrides?.squareFootage) return analyzedBid.overrides.squareFootage;
    return detectedData?.squareFootage || null;
  }, [userSquareFootage, analyzedBid, detectedData]);
  
  // Effective window count (user override > detected from upload)
  const effectiveWindowCount = useMemo(() => {
    if (userWindowCount !== null) return userWindowCount;
    if (analyzedBid?.overrides?.windowCount) return analyzedBid.overrides.windowCount;
    return null;
  }, [userWindowCount, analyzedBid]);
  
  const effectiveYearBuilt = useMemo(() => {
    if (userYearBuilt !== null) return userYearBuilt;
    if (analyzedBid?.overrides?.yearBuilt) return analyzedBid.overrides.yearBuilt;
    return undefined;
  }, [userYearBuilt, analyzedBid]);
  
  // Determine if this is a window-only project (should show window count instead of square footage)
  const isWindowProject = useMemo(() => {
    const type = projectType?.toLowerCase() || '';
    return type.includes('window') && !type.includes('remodel');
  }, [projectType]);
  
  // Determine if this is a linear-feet project (fence, gutter, railing, etc.)
  const isLinearFootProject = useMemo(() => {
    if (!projectType) return false;
    const normalizedType = normalizeProjectType(projectType);
    const config = getUnitConfig(normalizedType);
    return config.unitType === 'linear-feet';
  }, [projectType]);
  
  // Effective linear feet (user override > detected from upload)
  const effectiveLinearFeet = useMemo(() => {
    if (userLinearFeet !== null) return userLinearFeet;
    if (analyzedBid?.overrides?.linearFeet) return analyzedBid.overrides.linearFeet;
    return null;
  }, [userLinearFeet, analyzedBid]);
  


  const analysisData = useMemo(() => {
    if (!analyzedBid) return null;
    // Always use user's saved location, never detect from bid
    const analysis = analyzeBid(analyzedBid.content, effectiveBidTotal, userStateCode ?? undefined, effectiveYearBuilt);
    return {
      confidenceScore: analysis.confidenceScore,
      bidTotal: effectiveBidTotal,
      issues: analysis.flags.map(f => f.id),
      flagCounts: {
        critical: analysis.flags.filter(f => f.level === 'critical').length,
        high: analysis.flags.filter(f => f.level === 'high').length,
        medium: analysis.flags.filter(f => f.level === 'medium').length,
        low: analysis.flags.filter(f => f.level === 'low').length,
      }
    };
  }, [analyzedBid, effectiveBidTotal, userStateCode, effectiveYearBuilt]);

  // Contribute anonymized bid data to benchmarks (opt-out consent captured at upload).
  // Fires once per real analyzed bid; skips the sample demo. No PII leaves the client —
  // only project type, region, pricing, square footage, score, and issue codes.
  const contributedBidsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!analyzedBid || !analysisData || isSampleDemo) return;
    if (analyzedBid.overrides?.contributeData === false) return;

    const sig = `${analyzedBid.fileName}|${effectiveBidTotal ?? ''}|${effectiveSquareFootage ?? ''}`;
    if (contributedBidsRef.current.has(sig)) return;
    contributedBidsRef.current.add(sig);

    fetch('/api/bid-analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectType: projectType || 'Unknown',
        stateCode: userStateCode || undefined,
        totalAmount: effectiveBidTotal ?? undefined,
        squareFootage: effectiveSquareFootage ?? undefined,
        issuesDetected: analysisData.issues,
        confidenceScore: analysisData.confidenceScore,
      }),
    }).catch(() => { /* non-blocking; ignore */ });
  }, [analyzedBid, analysisData, isSampleDemo, projectType, userStateCode, effectiveBidTotal, effectiveSquareFootage]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const betaParam = params.get('beta') || params.get('utm_source');

    if (betaParam === 'launch' || betaParam === 'beta') {
      localStorage.setItem(STORAGE_KEYS.betaSource, betaParam);
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'beta_link_click', {
          event_category: 'Beta Launch',
          event_label: betaParam,
        });
      }
    }
  }, [location.search]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const betaParam = params.get('beta') || params.get('utm_source');
    const isBetaLink = betaParam === 'launch' || betaParam === 'beta';
    
    // Always show modal for beta links, regardless of whether it was shown before
    if (isBetaLink) {
      setShowBetaWelcome(true);
      localStorage.setItem(STORAGE_KEYS.betaWelcomeShown, 'true');
    } else if (isBetaUser && !isPending) {
      // For beta users visiting organically, only show once
      const welcomeShown = localStorage.getItem(STORAGE_KEYS.betaWelcomeShown);
      if (!welcomeShown) {
        setShowBetaWelcome(true);
        localStorage.setItem(STORAGE_KEYS.betaWelcomeShown, 'true');
      }
    }
  }, [location.search, isBetaUser, isPending]);

  useEffect(() => {
    if (location.hash && currentView === 'landing') {
      const id = location.hash.replace('#', '');
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [location.hash, currentView]);

  const handleGetStarted = useCallback(() => {
    // Use server-side upload limits
    if (uploadLimits.isLoading) {
      // Still loading, let them proceed (will be checked again on upload)
      setCurrentView('upload');
      return;
    }
    
    if (!uploadLimits.canUpload) {
      if (isLoggedIn) {
        // Show inline upgrade banner — no redirect loop
        setShowLimitBanner(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        navigate('/join');
      }
      return;
    }
    setShowLimitBanner(false);
    
    setCurrentView('upload');
  }, [navigate, isLoggedIn, uploadLimits]);

  const handleFileProcessed = useCallback(async (content: string, fileName: string, overrides?: { projectType?: string | null; squareFootage?: number | null; bidTotal?: number | null; stateCode?: string; windowCount?: number | null; linearFeet?: number | null; contractorFingerprint?: ContractorFingerprintExtract | null; contractorPulse?: ContractorPulse | null; contributeData?: boolean }) => {
    // Record upload on server (tracks usage and returns updated limits)
    try {
      const response = await fetch('/api/usage/record-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          fileName,
          projectType: overrides?.projectType || null
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Update local upload limits state with server response
        setUploadLimits({
          canUpload: data.canUpload,
          remaining: data.remaining ?? 0,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Failed to record upload:', error);
    }
    
    // Use override bid total if provided, otherwise try to extract
    const bidTotal = overrides?.bidTotal ?? null;
    
    // Use smart ZIP detection with context-aware prioritization
    const zipCode = detectProjectZip(content, '30301');
    
    // Save project ZIP to localStorage for Trust Radar auto-fill
    if (zipCode && zipCode.length === 5) {
      localStorage.setItem('remodeleriq_last_project_zip', zipCode);
    }
    
    setAnalyzedBid({ content, fileName, overrides, bidTotal, zipCode });

    // Activation event — a real bid analysis was completed and rendered.
    // Closes the funnel: SEO page → estimator → analyze click → analysis_completed → purchase.
    (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag?.('event', 'analysis_completed', {
      has_bid_total: !!bidTotal,
      zip: zipCode || undefined,
    });

    // Save the state location if provided (this updates the user's saved location for future uploads)
    if (overrides?.stateCode) {
      setLocation(overrides.stateCode);
    }
    
    // Set user values from overrides if provided, otherwise reset
    // If bid total came from upload verification, lock it immediately
    if (overrides?.bidTotal) {
      setUserBidTotal(overrides.bidTotal);
      setBidTotalLocked(true); // Lock since user already verified during upload
    } else {
      setUserBidTotal(null);
      setBidTotalLocked(false);
    }
    
    // Square footage from overrides if provided
    if (overrides?.squareFootage) {
      setUserSquareFootage(overrides.squareFootage);
    } else {
      setUserSquareFootage(null);
    }
    
    setActiveTab('analysis');
    setCurrentView('analysis');
  }, [isPremium, isLoggedIn]);

  const handleBackToUpload = useCallback(() => {
    // Always go back to upload page - let the upload page handle limit messages
    setAnalyzedBid(null);
    setActiveTab('analysis');
    setCurrentView('upload');
    setIsSampleDemo(false);
  }, []);

  const handleHomeClick = useCallback(() => {
    setAnalyzedBid(null);
    setActiveTab('analysis');
    setCurrentView('landing');
    setIsSampleDemo(false);
  }, []);
  
  const handleNavigateAway = useCallback(() => {
    setIsSampleDemo(false);
  }, []);
  
  // Load sample bid for "See How It Works" demo
  const handleSeeDemo = useCallback(() => {
    setAnalyzedBid({
      content: SAMPLE_BID_DATA.content,
      fileName: SAMPLE_BID_DATA.fileName,
      overrides: SAMPLE_BID_DATA.overrides,
      bidTotal: SAMPLE_BID_DATA.bidTotal,
      zipCode: SAMPLE_BID_DATA.zipCode,
    });
    setUserBidTotal(SAMPLE_BID_DATA.bidTotal);
    setBidTotalLocked(true);
    setUserSquareFootage(SAMPLE_BID_DATA.overrides.squareFootage);
    setIsSampleDemo(true);
    setActiveTab('analysis');
    setCurrentView('analysis');
  }, []);



  return (
    <div className="min-h-screen bg-slate-50">
      <PageSEO
        title="RemodelerIQ - Stop Overpaying for Home Renovations | Free AI Bid Analysis"
        description="Upload your contractor bid and get instant AI analysis. See if you're being overcharged, spot hidden risks, and get expert negotiation scripts. Trusted by 10,000+ homeowners."
        path="/"
        keywords="contractor bid analysis, home remodeling costs, renovation estimate checker, contractor price comparison, home improvement savings, construction bid review"
      />
      <FAQSchema faqs={HOME_FAQS} />
      <OrganizationSchema />
      <ServiceAreaSchema />
      <WebSiteSchema />
      <SoftwareApplicationSchema />
      <HowToSchema {...HOWTO_BID_ANALYSIS} />
      <Header onHomeClick={handleHomeClick} onAnalyzeClick={handleGetStarted} onNavigateAway={handleNavigateAway} />
      
      {currentView === 'landing' && (
        <>
          {/* Inline upgrade banner — shown when user hits the 3 free analyses cap */}
          {showLimitBanner && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setShowLimitBanner(false)}>
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center" onClick={e => e.stopPropagation()}>
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-7 h-7 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-navy-900 mb-2">You've used your 3 free analyses</h2>
                <p className="text-navy-600 mb-6 text-sm leading-relaxed">
                  Upgrade to <strong>Premium</strong> for unlimited bid analyses, negotiation scripts, and full market data.
                </p>
                <button
                  onClick={() => { setShowLimitBanner(false); navigate('/premium'); }}
                  className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors mb-3"
                >
                  Upgrade to Premium — $19.99/mo
                </button>
                <button
                  onClick={() => setShowLimitBanner(false)}
                  className="text-sm text-navy-500 hover:text-navy-700"
                >
                  Maybe later
                </button>
              </div>
            </div>
          )}
          <Hero onGetStarted={handleGetStarted} onSeeDemo={handleSeeDemo} />

          {/* Showcase gallery — curated remodel inspiration; funnels to the photo Visualizer */}
          <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
            <div className="max-w-6xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                See what your remodel could cost
              </h2>
              <p className="mt-3 text-lg text-slate-600 max-w-2xl mx-auto">
                Snap a photo of your kitchen, bath, or basement and get an instant 2026 cost estimate — free, no signup.
              </p>
              <div className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { src: '/visualizer/inspiration/spa-bath.jpg', label: 'Spa Bathroom' },
                  { src: '/visualizer/inspiration/modern-vanity.jpg', label: 'Modern Vanity' },
                  { src: '/visualizer/inspiration/farmhouse-living.jpg', label: 'Open-Concept Living' },
                  { src: '/visualizer/inspiration/entry-level-basement.jpg', label: 'Finished Basement' },
                  { src: '/visualizer/inspiration/master-bedroom.jpg', label: 'Master Suite' },
                  { src: '/visualizer/inspiration/modern-office.jpg', label: 'Home Office' },
                ].map((item) => (
                  <a
                    key={item.src}
                    href="/visualizer/"
                    className="group relative block overflow-hidden rounded-xl aspect-[4/3] shadow-sm"
                    aria-label={`Estimate a ${item.label} remodel`}
                  >
                    <img
                      src={item.src}
                      alt={item.label}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    <span className="absolute bottom-3 left-3 text-sm font-bold text-white drop-shadow">
                      {item.label}
                    </span>
                  </a>
                ))}
              </div>
              <a
                href="/visualizer/"
                className="mt-10 inline-flex items-center gap-2 rounded-xl bg-[#1F9C4C] px-8 py-3.5 text-base font-bold text-white shadow-md transition-colors hover:bg-[#18813e] no-underline"
              >
                Estimate your project from a photo →
              </a>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-16 px-4 sm:px-6 lg:px-8 bg-emerald-600">
            <div className="max-w-3xl mx-auto text-center">
              {/* Profile Circles + Star/Tagline */}
              <div className="flex items-center justify-center gap-8 mb-8">
                {/* Overlapping Circle Images */}
                <div className="flex items-center -space-x-4">
                  <img 
                    src="/mocha-assets/image.png_3744.png" 
                    alt="Homeowner" 
                    className="w-20 h-20 rounded-full border-4 border-white object-cover"
                  />
                  <img 
                    src="/mocha-assets/image.png_7332.png" 
                    alt="Kitchen remodel" 
                    className="w-20 h-20 rounded-full border-4 border-white object-cover"
                  />
                  <img 
                    src="/mocha-assets/image.png_8264.png" 
                    alt="Relaxing home" 
                    className="w-20 h-20 rounded-full border-4 border-white object-cover"
                  />
                </div>

                {/* Star + Tagline */}
                <div className="flex items-center gap-4">
                  <Star className="w-12 h-12 text-yellow-400 fill-yellow-400" />
                  <div className="text-left">
                    <div className="text-white text-sm font-medium">Our Goal</div>
                    <div className="text-white text-lg font-bold">Build Your Confidence</div>
                  </div>
                </div>
              </div>

              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to Score Your Bid?
              </h2>
              <p className="text-lg text-emerald-100 mb-8">
                Upload your contractor's estimate and get instant, data-backed analysis.
              </p>
              <button
                onClick={handleGetStarted}
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-700 font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
              >
                Analyze Your Bid
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </section>
          
          <Footer />
        </>
      )}

      {currentView === 'upload' && (
        <UploadArea
          onFileProcessed={handleFileProcessed}
          onBack={() => setCurrentView('landing')}
        />
      )}

      {currentView === 'analysis' && analyzedBid && (
        <div className="min-h-screen pt-[72px]">
          {/* Unified Sticky Header - Clean Design */}
          <div className="sticky top-[72px] z-40 bg-white border-b border-navy-200 shadow-sm">
            <div className="max-w-5xl mx-auto px-4 py-4">
              {/* Top row: Logo + Project info + Metrics */}
              <div className="flex items-center justify-between mb-4">
                {/* Left: Logo + Project info */}
                <div className="flex items-center gap-4 min-w-0">
                  {/* Hide logo on mobile to make room for metrics */}
                  <div className="hidden sm:flex p-3 bg-white rounded-xl flex-shrink-0 border-2" style={{ borderColor: '#1F9C4C' }}>
                    <img 
                      src="/mocha-assets/remodeler-iq-2x-logo-icon2.png" 
                      alt="RemodelerIQ" 
                      className="w-10 h-10"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-navy-500 font-medium uppercase tracking-wide">Your Project</p>
                    <h1 className="text-navy-900 font-bold text-xl leading-tight truncate max-w-[140px] sm:max-w-lg">
                      {projectType || 'Home Improvement Project'}
                    </h1>
                  </div>
                </div>

                {/* Right: Metrics */}
                <div className="flex items-center gap-3 sm:gap-8">
                  {/* Area, Window Count, or Linear Feet - depending on project type */}
                  <div>
                    {isLinearFootProject ? (
                      <EditableLinearFeet 
                        value={effectiveLinearFeet ?? undefined} 
                        onChange={(newValue) => setUserLinearFeet(newValue)}
                      />
                    ) : isWindowProject ? (
                      <EditableWindowCount 
                        value={effectiveWindowCount ?? undefined} 
                        onChange={(newValue) => setUserWindowCount(newValue)}
                      />
                    ) : (
                      <EditableSquareFootage 
                        value={effectiveSquareFootage ?? undefined} 
                        onChange={(newValue) => setUserSquareFootage(newValue)}
                      />
                    )}
                  </div>
                  
                  {/* Bid Total */}
                  <div>
                    <EditableBidTotal 
                      value={effectiveBidTotal} 
                      onChange={(newValue) => setUserBidTotal(newValue)}
                      isLocked={bidTotalLocked}
                      onLock={() => setBidTotalLocked(true)}
                    />
                  </div>
                </div>
              </div>

              {/* Tab Navigation Row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mb-1">
                  <button
                    onClick={() => setActiveTab('analysis')}
                    className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full font-medium text-sm transition-all whitespace-nowrap flex-shrink-0 ${
                      activeTab === 'analysis'
                        ? 'text-white shadow-md'
                        : 'text-navy-600 hover:bg-navy-100'
                    }`}
                    style={activeTab === 'analysis' ? { backgroundColor: '#1F9C4C' } : undefined}
                  >
                    <FileText className="w-4 h-4" />
                    Bid Analysis
                  </button>

                  <button
                    onClick={() => (effectiveIsPremium || (!PREMIUM_MODE_ENABLED && isLoggedIn)) && setActiveTab('market')}
                    disabled={!effectiveIsPremium && (PREMIUM_MODE_ENABLED || !isLoggedIn)}
                    className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full font-medium text-sm transition-all whitespace-nowrap flex-shrink-0 ${
                      (!effectiveIsPremium && (PREMIUM_MODE_ENABLED || !isLoggedIn))
                        ? 'text-gray-400 cursor-not-allowed opacity-60'
                        : activeTab === 'market'
                          ? 'text-white shadow-md'
                          : 'text-navy-600 hover:bg-navy-100'
                    }`}
                    style={(effectiveIsPremium || (!PREMIUM_MODE_ENABLED && isLoggedIn)) && activeTab === 'market' ? { backgroundColor: '#1F9C4C' } : undefined}
                  >
                    <BarChart3 className="w-4 h-4" />
                    Market Analysis
                    {(!effectiveIsPremium && (PREMIUM_MODE_ENABLED || !isLoggedIn)) && <Lock className="w-3 h-3" />}
                  </button>

                  <button
                    onClick={() => (effectiveIsPremium || (!PREMIUM_MODE_ENABLED && isLoggedIn)) && setActiveTab('negotiate')}
                    disabled={!effectiveIsPremium && (PREMIUM_MODE_ENABLED || !isLoggedIn)}
                    className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full font-medium text-sm transition-all whitespace-nowrap flex-shrink-0 ${
                      (!effectiveIsPremium && (PREMIUM_MODE_ENABLED || !isLoggedIn))
                        ? 'text-gray-400 cursor-not-allowed opacity-60'
                        : activeTab === 'negotiate'
                          ? 'text-white shadow-md'
                          : 'text-navy-600 hover:bg-navy-100'
                    }`}
                    style={(effectiveIsPremium || (!PREMIUM_MODE_ENABLED && isLoggedIn)) && activeTab === 'negotiate' ? { backgroundColor: '#1F9C4C' } : undefined}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Negotiation
                    {(!effectiveIsPremium && (PREMIUM_MODE_ENABLED || !isLoggedIn)) && <Lock className="w-3 h-3" />}
                  </button>

                  {/* Export button - available to all users */}
                  <button
                    onClick={() => {
                      exportToPdf({ filename: `RemodelerIQ-${analyzedBid?.fileName?.replace(/\.[^/.]+$/, '') || 'Report'}` });
                    }}
                    disabled={isExporting}
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-full font-semibold text-sm transition-all whitespace-nowrap flex-shrink-0 border-2 border-gray-300 bg-white hover:bg-gray-50 text-navy-600 disabled:opacity-70"
                  >
                    {isExporting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    {isExporting ? 'Exporting...' : 'Export'}
                  </button>
                </div>

                {/* New Bid button */}
                <button
                  onClick={handleBackToUpload}
                  className="flex items-center gap-1.5 text-navy-500 hover:text-emerald-600 font-medium transition-colors text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>New Bid</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'analysis' && (
              <ReportView
                bidContent={analyzedBid.content}
                fileName={analyzedBid.fileName}
                onBack={handleBackToUpload}
                userTier={userTier}
                uploadOverrides={analyzedBid.overrides}
                squareFootageOverride={userSquareFootage}
                onSquareFootageChange={setUserSquareFootage}
                bidTotalOverride={userBidTotal}
                onBidTotalChange={(newValue) => {
                  setUserBidTotal(newValue);
                  if (newValue !== null) setBidTotalLocked(true);
                }}
                bidTotalLocked={bidTotalLocked}
                confidenceScore={analysisData?.confidenceScore}
                flagCounts={analysisData?.flagCounts}
                contractorPulse={analyzedBid.overrides?.contractorPulse ?? null}
                projectZipCode={analyzedBid.zipCode}
                yearBuilt={effectiveYearBuilt}
                onPriceDataChange={setPriceDataFromAnalysis}
                onChangeOrderQuestionsChange={setChangeOrderQuestions}
              />
            )}

            {activeTab === 'market' && (
              <MarketAnalysisView
                bidContent={analyzedBid.content}
                userTier={userTier}
                uploadOverrides={analyzedBid.overrides}
                isPremium={EVERYONE_HAS_PREMIUM || isPremium || isDemoMode || (!PREMIUM_MODE_ENABLED && isLoggedIn)}
                onGenerateScript={() => setActiveTab('negotiate')}
                bidTotal={effectiveBidTotal}
                squareFootage={effectiveSquareFootage}
                windowCount={effectiveWindowCount}
                stateCode={userStateCode}
                yearBuilt={effectiveYearBuilt}
                projectZipCode={analyzedBid.zipCode}
              />
            )}

            {activeTab === 'negotiate' && (
              <TalkTrackView
                bidContent={analyzedBid.content}
                fileName={analyzedBid.fileName}
                onBack={() => setActiveTab('analysis')}
                userTier={userTier}
                bidTotalOverride={userBidTotal}
                squareFootageOverride={effectiveSquareFootage}
                windowCountOverride={effectiveWindowCount}
                stateCode={userStateCode}
                yearBuilt={effectiveYearBuilt}
                projectZipCode={analyzedBid.zipCode}
                projectType={projectType}
                priceDataFromAnalysis={priceDataFromAnalysis}
                changeOrderQuestions={changeOrderQuestions}
              />
            )}
          </div>
          
          {/* Sample Demo Banner - shows when viewing sample analysis */}
          {isSampleDemo && (
            <SampleDemoBanner onAnalyzeYourBid={handleBackToUpload} />
          )}
        </div>
      )}

      <BetaWelcomeModal
        isOpen={showBetaWelcome}
        onClose={() => setShowBetaWelcome(false)}
      />
    </div>
  );
}
