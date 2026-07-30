import { useState, useEffect } from 'react';
import { X, MapPin, Mail, Building2, ExternalLink, CheckCircle, AlertTriangle, ChevronDown, ChevronUp, Search, Shield, Award, Ban, Star } from 'lucide-react';
import type { TrustedContractor } from '@/shared/trustedRadarTypes';

interface ContractorDetailCardProps {
  contractor: TrustedContractor;
  onClose: () => void;
}

// State license verification URLs
const STATE_LICENSE_URLS: Record<string, { name: string; url: string }> = {
  'GA': { name: 'GA Secretary of State', url: 'https://goals.sos.ga.gov/GASOSOneStop/s/licensee-search' },
  'FL': { name: 'FL DBPR', url: 'https://www.myfloridalicense.com/wl11.asp' },
  'TX': { name: 'TX TDLR', url: 'https://www.tdlr.texas.gov/LicenseSearch/' },
  'CA': { name: 'CA CSLB', url: 'https://www.cslb.ca.gov/onlineservices/checklicenseII/checklicense.aspx' },
  'NY': { name: 'NY DOS', url: 'https://appext20.dos.ny.gov/lcns_public/lp_lookup' },
  'NC': { name: 'NC Licensing Board', url: 'https://www.nclbgc.org/license-lookup' },
  'SC': { name: 'SC LLR', url: 'https://verify.llronline.com/LicLookup/' },
  'AL': { name: 'AL Licensing Board', url: 'https://genconbd.alabama.gov/licensee_search' },
  'TN': { name: 'TN Commerce', url: 'https://verify.tn.gov/' },
  'VA': { name: 'VA DPOR', url: 'https://www.dpor.virginia.gov/LicenseLookup' },
};

interface BBBComplaintsData {
  total: string | number | null;
  lastThreeYears: string | number | null;
  resolved: string | number | null;
  details: string | null;
}

interface AIResearchData {
  summary: string;
  findings: string[];
  verdict: 'excellent' | 'good' | 'fair' | 'concerning' | null;
  businessRegistration?: { status: string; entity?: string; registeredState?: string; licenseNumber?: string; licenseVerificationUrl?: string | null; notes?: string };
  permitHistory?: { recentPermits?: string | null; totalValue?: string | null; notes?: string | null };
  bbbComplaints?: BBBComplaintsData | null;
  bbbStatus?: string | null;
  bbbProfileUrl?: string | null;
  reputation?: { score: string; highlights: string[]; concerns: string[] };
}

function VerdictBadge({ verdict }: { verdict: AIResearchData['verdict'] }) {
  if (!verdict) return null;
  
  const config = {
    excellent: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Excellent' },
    good: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Good' },
    fair: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Fair' },
    concerning: { bg: 'bg-red-100', text: 'text-red-700', label: 'Concerning' },
  }[verdict];
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <CheckCircle className="w-3 h-3" />
      {config.label}
    </span>
  );
}

export default function ContractorDetailCard({ contractor, onClose }: ContractorDetailCardProps) {
  const [aiResearch, setAiResearch] = useState<AIResearchData | null>(null);
  const [isLoadingResearch, setIsLoadingResearch] = useState(true);
  const [showBusinessReg, setShowBusinessReg] = useState(false);
  const [showPermitHistory, setShowPermitHistory] = useState(false);
  
  const stateInfo = contractor.stateCode ? STATE_LICENSE_URLS[contractor.stateCode] : null;
  const googleMapsUrl = `https://www.google.com/maps/place/?q=place_id:${contractor.placeId}`;
  
  // Fetch AI research on mount
  useEffect(() => {
    async function fetchResearch() {
      setIsLoadingResearch(true);
      try {
        const res = await fetch('/api/contractor/research', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessName: contractor.businessName,
            state: contractor.stateCode,
            city: contractor.city,
            phone: contractor.phone,
            website: contractor.website
          })
        });
        
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const result = json.data;
            // Build findings from reputation highlights, excluding any BBB/license
            // claim: those already have dedicated, structured badges above (parsed
            // from bbbStatus / businessRegistration), and a bulleted "finding"
            // repeating the claim risks contradicting those badges if this response's
            // own fields disagree with each other.
            const findings: string[] = [];
            if (result.reputation?.highlights) {
              findings.push(...result.reputation.highlights.filter(
                (h: string) => !/\bbbb\b|better business bureau|\blicens/i.test(h)
              ));
            }

            setAiResearch({
              summary: result.summary || '',
              findings: findings,
              verdict: determineVerdict(result),
              businessRegistration: result.businessRegistration,
              permitHistory: result.permitHistory,
              bbbComplaints: result.bbbComplaints,
              bbbStatus: result.bbbStatus,
              bbbProfileUrl: result.bbbProfileUrl,
              reputation: result.reputation
            });
          }
        }
      } catch (err) {
        console.error('Research fetch error:', err);
      } finally {
        setIsLoadingResearch(false);
      }
    }
    
    fetchResearch();
  }, [contractor.businessName, contractor.stateCode, contractor.city, contractor.phone, contractor.website]);
  
  function determineVerdict(result: any): AIResearchData['verdict'] {
    if (!result) return null;
    // Use reputation score if available
    if (result.reputation?.score) {
      const score = result.reputation.score.toLowerCase();
      if (score === 'excellent') return 'excellent';
      if (score === 'good') return 'good';
      if (score === 'mixed' || score === 'fair') return 'fair';
      if (score === 'concerning') return 'concerning';
    }
    // Fallback to text analysis
    const text = JSON.stringify(result).toLowerCase();
    if (text.includes('no complaints') && (text.includes('5.0') || text.includes('high rating'))) {
      return 'excellent';
    }
    if (text.includes('positive') || text.includes('good reputation')) {
      return 'good';
    }
    if (text.includes('complaint') || text.includes('concern') || text.includes('warning')) {
      return 'concerning';
    }
    return 'fair';
  }
  
  // Determine license status display - check AI research data first
  const hasLicenseFromResearch = !!aiResearch?.businessRegistration?.licenseNumber;
  const registrationStatus = aiResearch?.businessRegistration?.status?.toLowerCase();
  const isActiveFromResearch = hasLicenseFromResearch && (registrationStatus === 'active' || registrationStatus === 'registered');
  
  const licenseIsPositive = isActiveFromResearch || contractor.licenseStatus === 'verified';
  
  // Determine BBB status display - prioritize AI research data
  // Parse BBB grade from aiResearch.bbbStatus (e.g., "A+", "A+ accredited", "BBB A+ Rating")
  const parseBbbGrade = (status: string | null | undefined): string | null => {
    if (!status) return null;
    // Look for grade patterns like A+, A-, A, B+, B-, B, C+, C-, C, D, F
    const gradeMatch = status.match(/\b([A-F][+-]?)\b/i);
    if (gradeMatch) return gradeMatch[1].toUpperCase();
    // Many real BBB profiles show accreditation without posting a public letter
    // grade. Recognize that as positive too, guarding against "Not Accredited"
    // matching on the bare word.
    if (/\baccredited\b/i.test(status) && !/\bnot\s+accredited\b/i.test(status)) {
      return 'Accredited';
    }
    return null;
  };

  const bbbGradeFromResearch = parseBbbGrade(aiResearch?.bbbStatus);
  const effectiveBbbGrade = bbbGradeFromResearch || contractor.bbbGrade;

  const bbbStatus = effectiveBbbGrade
    ? (effectiveBbbGrade === 'Accredited' ? 'Accredited' : `Accredited (${effectiveBbbGrade})`)
    : (isLoadingResearch ? 'Checking...' : 'Not Listed');
  const bbbIsPositive = !!effectiveBbbGrade;

  // Prefer a deep link straight to this business's actual BBB profile when Gemini's
  // search found one; fall back to a generic bbb.org search. Domain-check before
  // trusting it as a link target — this is model-sourced content, not something we
  // fully control.
  const bbbSearchUrl = `https://www.bbb.org/search?find_text=${encodeURIComponent(contractor.businessName)}&find_loc=${contractor.stateCode || ''}`;
  const bbbHref = (aiResearch?.bbbProfileUrl && /^https:\/\/www\.bbb\.org\//.test(aiResearch.bbbProfileUrl))
    ? aiResearch.bbbProfileUrl
    : bbbSearchUrl;

  // Same idea for the license badge: prefer a deep link to the actual verification
  // page (state licensing board or BuildZoom) when found, restricted to domains we
  // recognize as legitimate for this purpose.
  const licenseDeepLink = aiResearch?.businessRegistration?.licenseVerificationUrl;
  const isTrustedLicenseDomain = (url: string): boolean => {
    try {
      const host = new URL(url).hostname;
      return host.endsWith('buildzoom.com') || (!!stateInfo && host === new URL(stateInfo.url).hostname);
    } catch {
      return false;
    }
  };
  const trustedLicenseDeepLink = licenseDeepLink && isTrustedLicenseDomain(licenseDeepLink) ? licenseDeepLink : null;

  return (
    <>
      {/* Backdrop overlay - always visible */}
      <div 
        className="fixed inset-0 bg-black/60 z-[9998]" 
        onClick={onClose}
      />
      
      {/* Modal container - centered overlay, full screen on mobile */}
      <div className="
        fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8
      ">
        <div className="
          bg-white rounded-2xl shadow-2xl
          overflow-hidden animate-fade-slide-up
          flex flex-col
          w-full max-w-lg
          max-h-[90vh]
        ">
      {/* Header - Contractor Pulse style */}
      <div className="bg-black text-white p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{contractor.businessName}</h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
      
      {/* Content - scrollable */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1">
        {/* VERIFICATION STATUS - 3 columns */}
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Verification Status
          </div>
          <div className="flex gap-4 justify-center">
            {/* Google Rating - Green background with white letter grade */}
            <div className="text-center w-24">
              <div className={`w-16 h-16 mx-auto rounded-xl ${contractor.googleRating ? 'bg-emerald-600' : 'bg-white border-2 border-emerald-600'} flex items-center justify-center`}>
                {contractor.googleRating ? (
                  <span className="text-2xl font-black text-white">
                    {contractor.googleRating >= 4.8 ? 'A+' : 
                     contractor.googleRating >= 4.5 ? 'A' :
                     contractor.googleRating >= 4.2 ? 'A-' :
                     contractor.googleRating >= 3.9 ? 'B+' :
                     contractor.googleRating >= 3.6 ? 'B' :
                     contractor.googleRating >= 3.3 ? 'B-' :
                     contractor.googleRating >= 3.0 ? 'C+' :
                     contractor.googleRating >= 2.7 ? 'C' : 'D'}
                  </span>
                ) : (
                  <Ban className="w-8 h-8 text-emerald-600" strokeWidth={2.5} />
                )}
              </div>
              <div className="mt-1.5">
                {contractor.googleRating && (
                  <div className="flex items-center justify-center gap-0.5">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-medium text-gray-700">
                      {contractor.googleRating.toFixed(1)}
                    </span>
                  </div>
                )}
                {contractor.googleReviewCount && (
                  <a 
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-gray-400 hover:text-emerald-600 block"
                  >
                    {contractor.googleReviewCount} reviews
                  </a>
                )}
              </div>
            </div>

            {/* BBB Badge - White background with green outline */}
            <div className="text-center w-24">
              <div className="w-16 h-16 mx-auto rounded-xl bg-white border-2 border-emerald-600 flex items-center justify-center">
                {isLoadingResearch ? (
                  <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                ) : bbbIsPositive ? (
                  <Award className="w-8 h-8 text-emerald-600" strokeWidth={2.5} />
                ) : (
                  <Ban className="w-8 h-8 text-emerald-600" strokeWidth={2.5} />
                )}
              </div>
              <div className="mt-1.5">
                <div className="text-xs font-medium text-gray-700">BBB</div>
                <a
                  href={bbbHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-gray-400 hover:text-emerald-600 block"
                >
                  {bbbStatus}
                </a>
              </div>
            </div>

            {/* License Badge - White background with green outline */}
            <div className="text-center w-24">
              <div className="w-16 h-16 mx-auto rounded-xl bg-white border-2 border-emerald-600 flex items-center justify-center">
                {isLoadingResearch ? (
                  <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                ) : licenseIsPositive ? (
                  <Shield className="w-8 h-8 text-emerald-600" strokeWidth={2.5} />
                ) : (
                  <Ban className="w-8 h-8 text-emerald-600" strokeWidth={2.5} />
                )}
              </div>
              <div className="mt-1.5">
                <div className="text-xs font-medium text-gray-700">Licensed</div>
                {isLoadingResearch ? (
                  <span className="text-[10px] text-gray-400 block">Checking...</span>
                ) : licenseIsPositive && aiResearch?.businessRegistration?.licenseNumber ? (
                  trustedLicenseDeepLink ? (
                    <a
                      href={trustedLicenseDeepLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-emerald-600 hover:underline block"
                    >
                      #{aiResearch.businessRegistration.licenseNumber}
                    </a>
                  ) : (
                    <span className="text-[10px] text-emerald-600 block">#{aiResearch.businessRegistration.licenseNumber}</span>
                  )
                ) : stateInfo ? (
                  <a
                    href={stateInfo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-gray-400 hover:text-emerald-600 block"
                  >
                    {stateInfo.name}
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        
        {/* BBB Complaints Row */}
        <div className="border-b border-gray-100 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              BBB Complaints
            </div>
            {isLoadingResearch ? (
              <span className="text-sm text-gray-400">Checking...</span>
            ) : aiResearch?.bbbComplaints ? (
              <span className={`text-sm font-medium ${
                (aiResearch.bbbComplaints.total === 0 || aiResearch.bbbComplaints.total === '0' || aiResearch.bbbComplaints.total === null)
                  ? 'text-emerald-600' 
                  : 'text-amber-600'
              }`}>
                {aiResearch.bbbComplaints.lastThreeYears !== null 
                  ? `${aiResearch.bbbComplaints.lastThreeYears} (last 3 yrs)`
                  : aiResearch.bbbComplaints.total !== null 
                    ? `${aiResearch.bbbComplaints.total} total`
                    : 'No data found'
                }
              </span>
            ) : (
              <span className="text-sm text-emerald-600">None found</span>
            )}
          </div>
          {/* Show complaint details if available */}
          {aiResearch?.bbbComplaints?.details && (
            <p className="text-xs text-gray-500 mt-1 pl-6">
              {aiResearch.bbbComplaints.details}
            </p>
          )}
        </div>
        
        {/* Contact Info */}
        <div className="space-y-2">
          {contractor.city && contractor.stateCode && (
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <MapPin className="w-4 h-4 text-gray-400" />
              {contractor.city}, {contractor.stateCode}
            </div>
          )}
          {contractor.email && (
            <a href={`mailto:${contractor.email}`} className="flex items-center gap-3 text-sm text-gray-700 hover:text-emerald-600">
              <Mail className="w-4 h-4 text-gray-400" />
              {contractor.email}
            </a>
          )}
        </div>
        
        {/* AI RESEARCH Section */}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              AI Research
            </div>
            {!isLoadingResearch && aiResearch && (
              <VerdictBadge verdict={aiResearch.verdict} />
            )}
          </div>
          
          {isLoadingResearch ? (
            <div className="text-sm text-gray-500 animate-pulse">Researching contractor...</div>
          ) : aiResearch ? (
            <div className="space-y-3">
              {aiResearch.summary && (
                <p className="text-sm text-gray-700 leading-relaxed">{aiResearch.summary}</p>
              )}
              {aiResearch.findings && aiResearch.findings.length > 0 && (
                <ul className="space-y-2">
                  {aiResearch.findings.slice(0, 3).map((finding, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      {finding}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No research data available</p>
          )}
        </div>
        
        {/* Business Registration Collapsible */}
        {aiResearch?.businessRegistration && (
          <div className="border-t border-gray-100 pt-3">
            <button 
              onClick={() => setShowBusinessReg(!showBusinessReg)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Building2 className="w-4 h-4 text-gray-400" />
                Business Registration
              </div>
              {showBusinessReg ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {showBusinessReg && (
              <div className="mt-2 ml-6 text-sm text-gray-600 space-y-1 bg-gray-50 rounded-lg p-3">
                <div><span className="text-gray-500">Status:</span> <span className="text-emerald-600 font-medium">{aiResearch.businessRegistration.status}</span></div>
                {aiResearch.businessRegistration.entity && (
                  <div><span className="text-gray-500">Entity:</span> {aiResearch.businessRegistration.entity}</div>
                )}
                {aiResearch.businessRegistration.registeredState && (
                  <div><span className="text-gray-500">State:</span> {aiResearch.businessRegistration.registeredState}</div>
                )}
                {aiResearch.businessRegistration.licenseNumber && (
                  <div><span className="text-gray-500">License #:</span> {aiResearch.businessRegistration.licenseNumber}</div>
                )}
                {aiResearch.businessRegistration.notes && (
                  <div><span className="text-gray-500">Notes:</span> {aiResearch.businessRegistration.notes}</div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Permit History Collapsible */}
        {aiResearch?.permitHistory && (
          <div className="border-t border-gray-100 pt-3">
            <button 
              onClick={() => setShowPermitHistory(!showPermitHistory)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <CheckCircle className="w-4 h-4 text-gray-400" />
                Permit History
              </div>
              {showPermitHistory ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {showPermitHistory && (
              <div className="mt-2 ml-6 text-sm text-gray-600 bg-gray-50 rounded-lg p-3 space-y-1">
                {aiResearch.permitHistory.recentPermits && (
                  <div><span className="text-gray-500">Recent Permits:</span> {aiResearch.permitHistory.recentPermits}</div>
                )}
                {aiResearch.permitHistory.totalValue && (
                  <div><span className="text-gray-500">Total Value:</span> {aiResearch.permitHistory.totalValue}</div>
                )}
                {aiResearch.permitHistory.notes && (
                  <div><span className="text-gray-500">Notes:</span> {aiResearch.permitHistory.notes}</div>
                )}
                {!aiResearch.permitHistory.recentPermits && !aiResearch.permitHistory.totalValue && !aiResearch.permitHistory.notes && (
                  <div className="text-gray-500">No permit data found</div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex gap-3 pt-3 border-t border-gray-100">
          <a 
            href="/"
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl font-semibold text-center transition-colors flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            Analyze Bids
          </a>
          <a 
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 py-3 px-4 rounded-xl font-semibold text-center transition-colors flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Contact
          </a>
        </div>
      </div>
      </div>
      </div>
    </>
  );
}
