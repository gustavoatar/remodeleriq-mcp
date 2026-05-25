import { useState, useEffect, useMemo } from 'react';
import { 
  MapPin, Phone, Mail, MessageSquare,
  ExternalLink, Briefcase, Loader2, AlertTriangle,
  CheckCircle, XCircle, Search, Globe, Shield, ChevronDown, ChevronUp, Database
} from 'lucide-react';
import { ContractorPulse, getStateLicenseInfo } from '@/shared/contractorPulse';
import ContractorSummaryCard from './ContractorSummaryCard';

interface ContractorPulseCardProps {
  pulse: ContractorPulse;
  hideSummaryCard?: boolean;
  // Optional: pass pre-fetched research data from parent to ensure consistency
  externalResearchData?: ContractorResearchData | null;
  externalResearchLoading?: boolean;
}

interface GooglePlacesData {
  placeId: string;
  name: string;
  address: string;
  rating: number | null;
  reviewCount: number | null;
  reviews: Array<{
    text: string;
    rating?: number;
    timeAgo?: string;
    author?: string;
  }>;
  website?: string;
  phone?: string;
  businessStatus?: string;
}

interface ContractorResearchData {
  summary: string;
  reputation: {
    score: 'excellent' | 'good' | 'mixed' | 'concerning' | 'unknown';
    highlights: string[];
    concerns: string[];
  };
  sources: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
  bbbStatus: string | null;
  bbbComplaints: {
    total: number | null;
    lastThreeYears: number | null;
    resolved: number | null;
    details: string | null;
  } | null;
  businessRegistration: {
    status: 'active' | 'inactive' | 'dissolved' | 'unknown';
    entity: string | null;
    registeredState: string | null;
    licenseNumber: string | null;
    notes: string | null;
  } | null;
  permitHistory: {
    recentPermits: number | null;
    totalValue: string | null;
    notes: string | null;
  } | null;
  newsItems: string[];
  redFlags: string[];
}

// Hook to fetch Google Places data (supports phone-based lookup as fallback)
function useGooglePlacesData(
  businessName: string | null, 
  phone: string | null,
  city: string | null, 
  state: string | null,
  website: string | null = null
): {
  data: (GooglePlacesData & { foundViaPhone?: boolean }) | null;
  loading: boolean;
  error: string | null;
  discoveredName: string | null; // Business name found via phone lookup
} {
  const [data, setData] = useState<(GooglePlacesData & { foundViaPhone?: boolean }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discoveredName, setDiscoveredName] = useState<string | null>(null);
  
  useEffect(() => {
    // Need either business name or phone number
    if (!businessName && !phone) {
      setData(null);
      setDiscoveredName(null);
      return;
    }
    
    const fetchPlacesData = async () => {
      setLoading(true);
      setError(null);
      setDiscoveredName(null);
      
      try {
        const params = new URLSearchParams();
        if (businessName) {
          params.set('businessName', businessName);
        } else if (phone) {
          // Phone-based lookup fallback
          params.set('phone', phone);
          console.log('Attempting phone-based Google Places lookup:', phone);
        }
        if (city) params.set('city', city);
        if (state) params.set('state', state);
        if (website) params.set('website', website);
        
        const response = await fetch(`/api/contractor/google-places?${params.toString()}`);
        const result = await response.json();
        
        if (!response.ok) {
          setError(result.error || `Server error (${response.status})`);
          setData(null);
          return;
        }
        
        if (result.success && result.data) {
          setData(result.data);
          // If found via phone lookup, capture the discovered business name
          if (result.data.foundViaPhone && result.data.name) {
            console.log('Discovered business name from phone lookup:', result.data.name);
            setDiscoveredName(result.data.name);
          }
        } else {
          setData(null);
          if (result.error) {
            setError(result.error);
          }
        }
      } catch (err) {
        console.error('Failed to fetch Google Places data:', err);
        setError('Failed to lookup contractor');
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlacesData();
  }, [businessName, phone, city, state, website]);
  
  return { data, loading, error, discoveredName };
}

// Cache utilities for research results
const RESEARCH_CACHE_KEY_PREFIX = 'contractor_research_';
const RESEARCH_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function getCacheKey(businessName: string): string {
  return RESEARCH_CACHE_KEY_PREFIX + businessName.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

function getCachedResearch(businessName: string): ContractorResearchData | null {
  try {
    const key = getCacheKey(businessName);
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    
    // Check if cache is still valid
    if (age > RESEARCH_CACHE_TTL) {
      localStorage.removeItem(key);
      return null;
    }
    
    // Only return cached data if it has meaningful content
    // (BBB status, license, or good reputation data)
    const hasUsefulData = data.bbbStatus && data.bbbStatus !== 'Not Found' && data.bbbStatus !== 'unknown' ||
                          data.businessRegistration?.licenseNumber ||
                          (data.reputation?.score && data.reputation.score !== 'unknown');
    
    return hasUsefulData ? data : null;
  } catch {
    return null;
  }
}

function setCachedResearch(businessName: string, data: ContractorResearchData): void {
  try {
    const key = getCacheKey(businessName);
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch {
    // Ignore storage errors
  }
}

// Hook for Gemini-powered deep research (auto-runs on mount)
function useContractorResearch(
  businessName: string | null, 
  city: string | null, 
  state: string | null,
  licenseNumber: string | null
): {
  data: ContractorResearchData | null;
  loading: boolean;
  error: string | null;
  runResearch: () => void;
  fromCache: boolean;
} {
  const [data, setData] = useState<ContractorResearchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldRun, setShouldRun] = useState(true); // Auto-run on mount
  const [fromCache, setFromCache] = useState(false);
  
  const runResearch = () => {
    setFromCache(false);
    setShouldRun(true);
  };
  
  useEffect(() => {
    if (!businessName) return;
    if (!shouldRun) return;
    
    // Check cache first
    const cached = getCachedResearch(businessName);
    if (cached) {
      console.log('Using cached research for:', businessName);
      setData(cached);
      setFromCache(true);
      setShouldRun(false);
      return;
    }
    
    const fetchResearch = async () => {
      setLoading(true);
      setError(null);
      setFromCache(false);
      
      try {
        const response = await fetch('/api/contractor/research', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessName,
            city,
            state,
            licenseNumber
          })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          setError(result.error || `Server error (${response.status})`);
          return;
        }
        
        if (result.success && result.data) {
          setData(result.data);
          // Cache successful results that have meaningful data
          setCachedResearch(businessName, result.data);
        } else {
          setError(result.error || 'Research failed');
        }
      } catch (err) {
        console.error('Research error:', err);
        setError('Failed to complete research');
      } finally {
        setLoading(false);
        setShouldRun(false);
      }
    };
    
    fetchResearch();
  }, [shouldRun, businessName, city, state, licenseNumber]);
  
  return { data, loading, error, runResearch, fromCache };
}

// Verification Status Card
function VerificationCard({ 
  label, 
  value, 
  source,
  highlighted = false,
  loading = false,
  verifyUrl
}: { 
  label: string; 
  value: string | null; 
  source: string;
  highlighted?: boolean;
  loading?: boolean;
  verifyUrl?: string;
}) {
  const content = (
    <>
      <span className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">{label}</span>
      {loading ? (
        <Loader2 className="w-4 h-4 text-slate-400 animate-spin my-1" />
      ) : (
        <span className={`text-sm font-semibold ${highlighted ? 'text-emerald-700' : 'text-slate-700'}`}>
          {value || '—'}
        </span>
      )}
      <span className="text-[9px] text-slate-400 mt-1 flex items-center gap-1">
        {source}
        {verifyUrl && <ExternalLink className="w-2.5 h-2.5" />}
      </span>
    </>
  );
  
  const className = `flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-colors ${
    highlighted 
      ? 'bg-emerald-50 border-emerald-200' 
      : 'bg-white border-slate-200'
  } ${verifyUrl ? 'hover:bg-slate-50 cursor-pointer' : ''}`;
  
  if (verifyUrl) {
    return (
      <a href={verifyUrl} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }
  
  return <div className={className}>{content}</div>;
}

// Reputation Score Badge
function ReputationBadge({ score }: { score: ContractorResearchData['reputation']['score'] }) {
  const config = {
    excellent: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle, label: 'Excellent' },
    good: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: 'Good' },
    mixed: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: AlertTriangle, label: 'Mixed' },
    concerning: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: 'Concerning' },
    unknown: { bg: 'bg-slate-100', text: 'text-slate-600', icon: Search, label: 'Limited Data' }
  };
  
  const { bg, text, icon: Icon, label } = config[score];
  
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${bg}`}>
      <Icon className={`w-3.5 h-3.5 ${text}`} />
      <span className={`text-xs font-semibold ${text}`}>{label}</span>
    </div>
  );
}

// Frontend fallback: extract business name from website domain
function extractNameFromWebsiteDomain(website: string | null | undefined): string | null {
  if (!website) return null;
  // Remove protocol and www
  let domain = website.replace(/^(https?:\/\/)?(www\.)?/i, '');
  // Get first part before TLD
  const match = domain.match(/^([^./]+)/);
  if (!match) return null;
  domain = match[1];
  // Skip if too short or generic
  if (domain.length < 3) return null;
  const genericDomains = ['google', 'facebook', 'yelp', 'bbb', 'angi', 'thumbtack', 'homeadvisor'];
  if (genericDomains.includes(domain.toLowerCase())) return null;
  
  // Split compound words (e.g., "builderland" -> "Builder Land")
  const commonParts = ['builder', 'land', 'home', 'house', 'pro', 'elite', 'premier', 'quality', 
    'custom', 'superior', 'master', 'expert', 'first', 'best', 'top', 'prime', 'all', 'new',
    'construction', 'remodeling', 'renovations', 'contracting', 'services', 'solutions'];
  let formatted = domain.toLowerCase();
  for (const part of commonParts) {
    const regex = new RegExp(`(${part})(?=[a-z])`, 'gi');
    formatted = formatted.replace(regex, '$1 ');
  }
  // Also handle camelCase
  formatted = formatted.replace(/([a-z])([A-Z])/g, '$1 $2');
  // Capitalize each word
  formatted = formatted.split(/[\s-]+/).filter(Boolean).map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ').trim();
  
  return formatted.length >= 3 ? formatted : null;
}

export default function ContractorPulseCard({ pulse, hideSummaryCard = false, externalResearchData, externalResearchLoading }: ContractorPulseCardProps) {
  const { fingerprint } = pulse;
  
  // Original extracted business name
  const extractedName = fingerprint.legalBusinessName || fingerprint.dbaName;
  
  // Frontend fallback: try to extract name from website domain
  const websiteDerivedName = useMemo(() => {
    if (extractedName) return null; // Don't need fallback if we have a name
    return extractNameFromWebsiteDomain(fingerprint.website);
  }, [extractedName, fingerprint.website]);
  
  // Use website-derived name for Google Places lookup if no extracted name
  const nameForLookup = extractedName || websiteDerivedName;
  
  // Fetch real Google Places data (uses phone-based lookup as fallback if no name)
  const { data: googleData, loading: googleLoading, discoveredName } = useGooglePlacesData(
    nameForLookup,
    fingerprint.phone,
    fingerprint.city,
    fingerprint.state,
    fingerprint.website
  );
  
  // Use discovered name from phone lookup as final fallback
  const businessName = extractedName || websiteDerivedName || discoveredName;
  
  // Gemini search grounding research (with caching for consistency)
  // Skip internal fetch if external data is provided (ensures consistency with parent)
  const { 
    data: internalResearchData, 
    loading: internalResearchLoading,
    fromCache: _researchFromCache
  } = useContractorResearch(
    externalResearchData ? null : businessName, // Pass null to skip fetch if external data provided
    fingerprint.city,
    fingerprint.state,
    fingerprint.licenseNumber
  );
  
  // Use external data when provided, otherwise use internal hook data
  const researchData = externalResearchData !== undefined ? externalResearchData : internalResearchData;
  const researchLoading = externalResearchLoading !== undefined ? externalResearchLoading : internalResearchLoading;
  
  // State for expandable AI Research section
  const [showMoreResearch, setShowMoreResearch] = useState(false);
  
  // Truncate summary to 2 sentences
  const truncatedSummary = useMemo(() => {
    if (!researchData?.summary) return '';
    const sentences = researchData.summary.match(/[^.!?]+[.!?]+/g) || [researchData.summary];
    if (sentences.length <= 2) return researchData.summary;
    return sentences.slice(0, 2).join(' ').trim();
  }, [researchData?.summary]);
  
  const hasMoreSummary = useMemo(() => {
    if (!researchData?.summary) return false;
    const sentences = researchData.summary.match(/[^.!?]+[.!?]+/g) || [];
    return sentences.length > 2;
  }, [researchData?.summary]);
  
  // Combine highlights and concerns into findings
  const allFindings = useMemo(() => {
    if (!researchData) return { positive: [], concerns: [], total: 0 };
    const positive = researchData.reputation.highlights || [];
    const concerns = researchData.reputation.concerns || [];
    return { positive, concerns, total: positive.length + concerns.length };
  }, [researchData]);
  
  const MAX_VISIBLE_FINDINGS = 6;
  
  // Build sentiment summary from rating
  const sentimentSummary = googleData?.rating 
    ? googleData.rating >= 4.5 
      ? 'Excellent reviews with consistently positive feedback'
      : googleData.rating >= 4.0 
        ? 'Strong reviews with mostly positive experiences'
        : googleData.rating >= 3.5 
          ? 'Mixed reviews with some concerns raised'
          : 'Reviews indicate concerns worth investigating'
    : null;
  
  // Google Places URL
  const googlePlacesUrl = businessName 
    ? `https://www.google.com/maps/search/${encodeURIComponent(businessName + ' contractor')}`
    : 'https://www.google.com/maps';
  
  // License verification status - prefer research data over bid extraction
  const contractorState = fingerprint.licenseState || fingerprint.state;
  const stateInfo = contractorState ? getStateLicenseInfo(contractorState) : null;
  const licenseSource = stateInfo?.agencyName || (contractorState ? `${contractorState} Secretary of State` : 'State License Board');
  
  // Determine license status from research or bid
  const researchLicense = researchData?.businessRegistration;
  
  // Helper to extract license number from notes if not in licenseNumber field
  const extractLicenseFromNotes = (notes: string | null | undefined): string | null => {
    if (!notes) return null;
    // Common GA license patterns: RBCO, GCCO, RLQA, CR followed by numbers
    const patterns = [
      /\b(RBCO\d{6})\b/i,  // Residential Basic Company
      /\b(GCCO\d{6})\b/i,  // General Contractor Company
      /\b(RLQA\d{6})\b/i,  // Residential Light Qualifying Agent
      /\b(CR\d{6})\b/i,    // Contractor Registration
      /\b([A-Z]{2,4}\d{5,8})\b/  // Generic license pattern
    ];
    for (const pattern of patterns) {
      const match = notes.match(pattern);
      if (match) return match[1].toUpperCase();
    }
    return null;
  };
  
  const getLicenseDisplayValue = (): string | null => {
    // Try to get license number from structured field or parse from notes
    const licenseNum = researchLicense?.licenseNumber || extractLicenseFromNotes(researchLicense?.notes);
    
    // If research found active registration
    if (researchLicense?.status === 'active') {
      if (licenseNum) {
        return `Active (${licenseNum})`;
      }
      return 'Active';
    }
    // If research found inactive/dissolved
    if (researchLicense?.status === 'inactive' || researchLicense?.status === 'dissolved') {
      return researchLicense.status.charAt(0).toUpperCase() + researchLicense.status.slice(1);
    }
    // If bid had a license number
    if (fingerprint.licenseNumber) {
      return `In Bid: ${fingerprint.licenseNumber}`;
    }
    // If research ran but found nothing
    if (researchData && !researchLoading) {
      return 'Not Found';
    }
    return null;
  };
  const licenseDisplayValue = getLicenseDisplayValue();
  const licenseIsGood = researchLicense?.status === 'active' || !!fingerprint.licenseNumber;
  
  // Location string
  const location = [fingerprint.city, fingerprint.state].filter(Boolean).join(', ');
  
  return (
    <div className="space-y-4">
      {/* Contractor Summary Card - Dark Navy Style with Grade & Sentiment */}
      {!hideSummaryCard && (
        <ContractorSummaryCard
          contractorName={fingerprint.legalBusinessName || fingerprint.dbaName || businessName || 'Unknown Contractor'}
          googleData={googleData}
          googleLoading={googleLoading}
          researchLoading={researchLoading}
          bbbStatus={researchData?.bbbStatus || null}
          hasLicense={!!fingerprint.licenseNumber || researchData?.businessRegistration?.status === 'active'}
          licenseNumber={fingerprint.licenseNumber || researchData?.businessRegistration?.licenseNumber}
        />
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Header - Black with emerald icon */}
        <div className="bg-black px-6 py-5 flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Briefcase className="w-8 h-8 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-2xl font-bold text-white text-center sm:text-left">Contractor Pulse</h3>
            <p className="text-sm text-white/60 text-center sm:text-left truncate">
              {fingerprint.legalBusinessName || fingerprint.dbaName || businessName || 'Unknown Contractor'}
              {fingerprint.dbaName && fingerprint.legalBusinessName && (
                <span className="ml-2 opacity-75">(DBA: {fingerprint.dbaName})</span>
              )}
            </p>
          </div>
        </div>
        
        {/* Verification Status */}
        <div className="p-4 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Verification Status</p>
          <div className="grid grid-cols-3 gap-2">
            <VerificationCard
              label="State License"
              value={licenseDisplayValue}
              source={licenseSource}
              loading={researchLoading}
              highlighted={licenseIsGood}
              verifyUrl={stateInfo?.verifyUrl}
            />
            <VerificationCard
              label="BBB Status"
              value={researchData?.bbbStatus || null}
              source="BBB.org"
              loading={researchLoading}
              highlighted={researchData?.bbbStatus?.includes('A') || false}
              verifyUrl={`https://www.bbb.org/search?find_country=USA&find_text=${encodeURIComponent(fingerprint.legalBusinessName || fingerprint.dbaName || '')}`}
            />
            <VerificationCard
              label="Google Rating"
              value={googleData?.rating ? `${googleData.rating.toFixed(1)} ★` : null}
              source={googleData?.reviewCount ? `(${googleData.reviewCount})` : 'Google'}
              highlighted={!!googleData?.rating && googleData.rating >= 4.0}
              loading={googleLoading}
            />
          </div>
          
          {/* BBB Complaints Row - show if complaints data exists */}
          {researchData?.bbbComplaints && (researchData.bbbComplaints.total !== null || researchData.bbbComplaints.lastThreeYears !== null) && (
            <div className={`mt-3 p-3 rounded-lg border ${
              (researchData.bbbComplaints.lastThreeYears || 0) > 3 
                ? 'bg-red-50 border-red-200' 
                : (researchData.bbbComplaints.lastThreeYears || 0) > 0
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-emerald-50 border-emerald-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-4 h-4 ${
                    (researchData.bbbComplaints.lastThreeYears || 0) > 3 
                      ? 'text-red-600' 
                      : (researchData.bbbComplaints.lastThreeYears || 0) > 0
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                  }`} />
                  <span className={`text-sm font-medium ${
                    (researchData.bbbComplaints.lastThreeYears || 0) > 3 
                      ? 'text-red-700' 
                      : (researchData.bbbComplaints.lastThreeYears || 0) > 0
                        ? 'text-amber-700'
                        : 'text-emerald-700'
                  }`}>
                    BBB Complaints
                  </span>
                </div>
                <div className="text-right">
                  {researchData.bbbComplaints.lastThreeYears !== null && (
                    <span className={`text-sm font-semibold ${
                      researchData.bbbComplaints.lastThreeYears > 3 
                        ? 'text-red-700' 
                        : researchData.bbbComplaints.lastThreeYears > 0
                          ? 'text-amber-700'
                          : 'text-emerald-700'
                    }`}>
                      {researchData.bbbComplaints.lastThreeYears === 0 
                        ? 'None in last 3 years'
                        : `${researchData.bbbComplaints.lastThreeYears} in last 3 years`}
                    </span>
                  )}
                  {researchData.bbbComplaints.total !== null && researchData.bbbComplaints.lastThreeYears === null && (
                    <span className={`text-sm font-semibold ${
                      researchData.bbbComplaints.total > 5 ? 'text-red-700' : 'text-amber-700'
                    }`}>
                      {researchData.bbbComplaints.total} total
                    </span>
                  )}
                </div>
              </div>
              {researchData.bbbComplaints.details && (
                <p className="mt-1.5 text-xs text-slate-600">{researchData.bbbComplaints.details}</p>
              )}
              {researchData.bbbComplaints.resolved !== null && researchData.bbbComplaints.resolved > 0 && (
                <p className="mt-1 text-xs text-slate-500">
                  {researchData.bbbComplaints.resolved} complaint{researchData.bbbComplaints.resolved !== 1 ? 's' : ''} resolved
                </p>
              )}
            </div>
          )}
        </div>
        
        {/* Contact Info */}
        <div className="p-4 space-y-2.5 border-b border-slate-100">
          {location && (
            <div className="flex items-center gap-3 text-sm text-slate-700">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>{location}</span>
            </div>
          )}
          {fingerprint.phone && (
            <a href={`tel:${fingerprint.phone}`} className="flex items-center gap-3 text-sm text-slate-700 hover:text-brand-600">
              <Phone className="w-4 h-4 text-slate-400" />
              <span>{fingerprint.phone}</span>
            </a>
          )}
          {fingerprint.email && (
            <a href={`mailto:${fingerprint.email}`} className="flex items-center gap-3 text-sm text-slate-700 hover:text-brand-600">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{fingerprint.email}</span>
            </a>
          )}
        </div>
        
        {/* AI Research Section - Auto-loads, no manual trigger */}
        <div className="p-4 border-b border-slate-100">
          {researchLoading && (
            <div className="flex flex-col items-center justify-center py-6 gap-3">
              <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
              <p className="text-sm text-slate-500">Researching contractor reputation...</p>
              <p className="text-xs text-slate-400">Searching BBB, reviews, news, and forums</p>
            </div>
          )}
          
          {/* Show when research completed but found nothing */}
          {!researchLoading && !researchData && (
            <div className="py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">AI Research</span>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                  Limited Data
                </span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                This contractor has limited online presence. They may be a newer business or operate primarily through referrals. 
                Consider asking for references and verifying their license directly with the state licensing board.
              </p>
            </div>
          )}
          
          {researchData && (
            <div className="space-y-3">
              {/* Header with Reputation Score */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">AI Research</span>
                <ReputationBadge score={researchData.reputation.score} />
              </div>
              
              {/* Summary - max 2 sentences */}
              <p className="text-sm text-slate-700 leading-relaxed">
                {showMoreResearch ? researchData.summary : truncatedSummary}
                {!showMoreResearch && hasMoreSummary && '...'}
              </p>
              
              {/* Combined Findings - max 6 visible */}
              {allFindings.total > 0 && (
                <div className="space-y-2">
                  {/* Show positive findings */}
                  {allFindings.positive.slice(0, showMoreResearch ? undefined : Math.min(3, MAX_VISIBLE_FINDINGS)).map((item, idx) => (
                    <div key={`pos-${idx}`} className="flex items-start gap-2 text-xs">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-600">{item}</span>
                    </div>
                  ))}
                  
                  {/* Show concerns */}
                  {allFindings.concerns.slice(0, showMoreResearch ? undefined : Math.max(0, MAX_VISIBLE_FINDINGS - Math.min(3, allFindings.positive.length))).map((item, idx) => (
                    <div key={`con-${idx}`} className="flex items-start gap-2 text-xs">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-600">{item}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Red Flags - Always show all (critical info) */}
              {researchData.redFlags.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-red-700 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Red Flags Detected
                  </p>
                  <ul className="space-y-1">
                    {researchData.redFlags.map((flag, idx) => (
                      <li key={idx} className="text-xs text-red-600">• {flag}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Expandable section */}
              {showMoreResearch && (
                <>
                  {/* Business Registration */}
                  {researchData.businessRegistration && researchData.businessRegistration.status !== 'unknown' && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-slate-600 flex items-center gap-1">
                        <Briefcase className="w-3 h-3" /> Business Registration
                      </p>
                      <div className="bg-slate-50 rounded-lg p-2.5 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">Status:</span>
                          <span className={`text-xs font-medium ${
                            researchData.businessRegistration.status === 'active' ? 'text-emerald-600' :
                            researchData.businessRegistration.status === 'dissolved' ? 'text-red-600' :
                            'text-amber-600'
                          }`}>
                            {researchData.businessRegistration.status.charAt(0).toUpperCase() + researchData.businessRegistration.status.slice(1)}
                          </span>
                        </div>
                        {researchData.businessRegistration.entity && (
                          <p className="text-xs text-slate-600"><span className="text-slate-500">Entity:</span> {researchData.businessRegistration.entity}</p>
                        )}
                        {researchData.businessRegistration.registeredState && (
                          <p className="text-xs text-slate-600"><span className="text-slate-500">State:</span> {researchData.businessRegistration.registeredState}</p>
                        )}
                        {researchData.businessRegistration.notes && (
                          <p className="text-xs text-slate-600 italic mt-1">{researchData.businessRegistration.notes}</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Permit History */}
                  {researchData.permitHistory && (researchData.permitHistory.recentPermits || researchData.permitHistory.notes) && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-slate-600 flex items-center gap-1">
                        <Search className="w-3 h-3" /> Permit History
                      </p>
                      <div className="bg-slate-50 rounded-lg p-2.5 space-y-1">
                        {researchData.permitHistory.recentPermits !== null && (
                          <p className="text-xs text-slate-600">
                            <span className="text-slate-500">Recent Permits:</span> {researchData.permitHistory.recentPermits}
                          </p>
                        )}
                        {researchData.permitHistory.totalValue && (
                          <p className="text-xs text-slate-600">
                            <span className="text-slate-500">Total Value:</span> {researchData.permitHistory.totalValue}
                          </p>
                        )}
                        {researchData.permitHistory.notes && (
                          <p className="text-xs text-slate-600 italic mt-1">{researchData.permitHistory.notes}</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Sources */}
                  {researchData.sources.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-2">Sources</p>
                      <div className="flex flex-wrap gap-1.5">
                        {researchData.sources.slice(0, 5).map((source, idx) => (
                          <a
                            key={idx}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 hover:bg-slate-100 rounded text-[10px] text-slate-600 transition-colors"
                          >
                            <Globe className="w-2.5 h-2.5" />
                            {source.title.length > 25 ? source.title.slice(0, 22) + '...' : source.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              
              {/* Show More / Show Less button */}
              {(hasMoreSummary || allFindings.total > MAX_VISIBLE_FINDINGS || researchData.businessRegistration || researchData.permitHistory || researchData.sources.length > 0) && (
                <button
                  onClick={() => setShowMoreResearch(!showMoreResearch)}
                  className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
                >
                  {showMoreResearch ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      Show more
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Community Sentiment (Google Reviews) */}
        {(sentimentSummary || googleLoading) && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-semibold text-slate-700">Google Reviews</span>
              </div>
              <a 
                href={googlePlacesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1"
              >
                View on Google <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            {googleLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                <span className="text-sm text-slate-500">Loading reviews...</span>
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-600 mb-3">{sentimentSummary}</p>
                {googleData?.reviews && googleData.reviews.length > 0 && (
                  <div className="space-y-2">
                    {googleData.reviews.slice(0, 3).map((review, idx) => (
                      <div key={idx} className="bg-slate-50 rounded-lg p-3">
                        <p className="text-sm text-slate-700 italic">"{review.text.length > 120 ? review.text.slice(0, 117) + '...' : review.text}"</p>
                        {review.author && (
                          <p className="text-xs text-slate-400 mt-1.5">— {review.author}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
        
        {/* Data Sources Attribution */}
        <div className="px-4 py-3 border-t border-slate-100">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <Database className="w-3 h-3" />
            <span>
              Sources:{' '}
              <a 
                href="https://www.google.com/maps"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-500 hover:text-emerald-600 transition-colors"
              >
                Google
              </a>
              {' • '}
              <a 
                href="https://www.bbb.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-500 hover:text-emerald-600 transition-colors"
              >
                BBB
              </a>
              {' • '}
              <a 
                href="https://www.angi.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-500 hover:text-emerald-600 transition-colors"
              >
                Angi
              </a>
              {' • '}
              <a 
                href="https://www.yelp.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-500 hover:text-emerald-600 transition-colors"
              >
                Yelp
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
