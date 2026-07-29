import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router';
import { Search, MapPin, Radar, Star, ExternalLink, Globe, Shield, CheckCircle, AlertCircle, RefreshCw, Users } from 'lucide-react';
import Header from '@/react-app/components/Header';
import PageSEO from '@/react-app/components/PageSEO';
import { BreadcrumbSchema, BREADCRUMBS } from '@/react-app/components/StructuredData';
import RadarMap, { type ContractorMarker, type MapBounds } from '@/react-app/components/RadarMap';
import ContractorDetailCard from '@/react-app/components/ContractorDetailCard';
import { RADAR_TRADE_CATEGORIES, type TradeCategory, type TrustedContractor, type KeywordSearchResult } from '@/shared/trustedRadarTypes';
import { useUserLocation } from '@/react-app/hooks/useGeolocation';

// Schema.org structured data for contractor search service
function TrustRadarSchema() {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Trust Radar - Contractor Search",
    "description": "Find verified contractors in your area with license verification, BBB ratings, and customer reviews. Search by location and trade specialty.",
    "url": "https://remodeleriq.com/trusted-radar",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "featureList": [
      "Contractor search by business name",
      "License verification",
      "BBB rating lookup",
      "Google reviews integration",
      "Map-based contractor search",
      "Trade specialty filtering"
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
}

// Default ZIP codes for each state (major metro areas)
const STATE_DEFAULT_ZIPS: Record<string, string> = {
  'AL': '35203', // Birmingham
  'AK': '99501', // Anchorage
  'AZ': '85001', // Phoenix
  'AR': '72201', // Little Rock
  'CA': '90001', // Los Angeles
  'CO': '80202', // Denver
  'CT': '06103', // Hartford
  'DE': '19801', // Wilmington
  'FL': '33101', // Miami
  'GA': '30301', // Atlanta
  'HI': '96813', // Honolulu
  'ID': '83702', // Boise
  'IL': '60601', // Chicago
  'IN': '46204', // Indianapolis
  'IA': '50309', // Des Moines
  'KS': '66101', // Kansas City
  'KY': '40202', // Louisville
  'LA': '70112', // New Orleans
  'ME': '04101', // Portland
  'MD': '21201', // Baltimore
  'MA': '02108', // Boston
  'MI': '48201', // Detroit
  'MN': '55401', // Minneapolis
  'MS': '39201', // Jackson
  'MO': '63101', // St. Louis
  'MT': '59601', // Helena
  'NE': '68102', // Omaha
  'NV': '89101', // Las Vegas
  'NH': '03101', // Manchester
  'NJ': '07102', // Newark
  'NM': '87101', // Albuquerque
  'NY': '10001', // New York City
  'NC': '28202', // Charlotte
  'ND': '58102', // Fargo
  'OH': '43215', // Columbus
  'OK': '73102', // Oklahoma City
  'OR': '97201', // Portland
  'PA': '19102', // Philadelphia
  'RI': '02903', // Providence
  'SC': '29201', // Columbia
  'SD': '57104', // Sioux Falls
  'TN': '37201', // Nashville
  'TX': '77001', // Houston
  'UT': '84101', // Salt Lake City
  'VT': '05401', // Burlington
  'VA': '23219', // Richmond
  'WA': '98101', // Seattle
  'WV': '25301', // Charleston
  'WI': '53202', // Milwaukee
  'WY': '82001', // Cheyenne
  'DC': '20001', // Washington DC
};

// Key for storing last analyzed project ZIP
const LAST_PROJECT_ZIP_KEY = 'remodeleriq_last_project_zip';

type RadarTab = 'contractor' | 'zip';

const RADAR_TABS: { id: RadarTab; label: string; icon: typeof Search }[] = [
  { id: 'contractor', label: 'Contractor Search', icon: Search },
  { id: 'zip', label: 'Zip Code Search', icon: MapPin },
];

function trackRadarEvent(event: string, params: Record<string, unknown>) {
  (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag?.('event', event, params);
}

export default function TrustedRadarPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<RadarTab>(() => {
    const tab = searchParams.get('tab');
    if (tab === 'zip' || tab === 'contractor') return tab;
    // The home-page CTA deep-links with ?zip= — keep it landing on the ZIP flow.
    if (searchParams.get('zip')) return 'zip';
    return 'contractor';
  });
  const [keyword, setKeyword] = useState(() => searchParams.get('q') || '');
  const [activeKeyword, setActiveKeyword] = useState('');
  const [searchZip, setSearchZip] = useState('');
  const [activeZip, setActiveZip] = useState('');
  const [selectedTrade, setSelectedTrade] = useState<TradeCategory>('all');
  const [currentRadius, setCurrentRadius] = useState(25); // Calculated from map bounds
  const [isSearching, setIsSearching] = useState(false);
  const [contractors, setContractors] = useState<TrustedContractor[]>([]);
  const [selectedContractor, setSelectedContractor] = useState<TrustedContractor | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>();
  const [searchError, setSearchError] = useState<string | null>(null);
  const [enrichmentStatus, setEnrichmentStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  // Removed hasSearched, currentMapBounds - see todo.md #121
  
  const lastSearchCenterRef = useRef<{ lat: number; lng: number } | null>(null);
  // Track if we should auto-search on load (from home page navigation)
  const autoSearchTriggeredRef = useRef(false);
  const keywordAutoSearchRef = useRef(false);
  
  // Get user's saved location
  const { stateCode } = useUserLocation();
  
  // Auto-fill ZIP from URL params, saved project location, or user's state
  useEffect(() => {
    // Don't override if user has already entered something
    if (searchZip) return;
    
    // First priority: Check URL params (from home page navigation)
    const urlZip = searchParams.get('zip');
    if (urlZip && urlZip.length === 5) {
      setSearchZip(urlZip);
      return;
    }
    
    // Second: check for a saved project ZIP from previous bid analysis
    const savedProjectZip = localStorage.getItem(LAST_PROJECT_ZIP_KEY);
    if (savedProjectZip && savedProjectZip.length === 5) {
      setSearchZip(savedProjectZip);
      return;
    }
    
    // Fall back to default ZIP for user's state
    const defaultZip = stateCode ? STATE_DEFAULT_ZIPS[stateCode] : undefined;
    if (defaultZip) {
      setSearchZip(defaultZip);
    }
  }, [stateCode, searchParams]); // Only run when stateCode or searchParams changes

  // Enrich contractors with BBB/License data in background
  const enrichContractors = useCallback(async (contractorList: TrustedContractor[]) => {
    if (contractorList.length === 0) return;
    
    setEnrichmentStatus('loading');
    
    try {
      const toEnrich = contractorList
        .filter(c => !c.bbbGrade && !c.licenseNumber) // Only enrich those without data
        .slice(0, 5) // Limit to 5 per request
        .map(c => ({
          placeId: c.placeId,
          businessName: c.businessName,
          stateCode: c.stateCode,
          city: c.city
        }));
      
      if (toEnrich.length === 0) {
        setEnrichmentStatus('done');
        return;
      }
      
      const res = await fetch('/api/trusted-radar/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractors: toEnrich })
      });
      
      const data = await res.json();
      
      if (data.success && data.enriched) {
        // Update contractors with enriched data
        setContractors(prev => prev.map(c => {
          const enrichment = data.enriched[c.placeId];
          if (enrichment) {
            return {
              ...c,
              bbbGrade: enrichment.bbbGrade || c.bbbGrade,
              licenseStatus: enrichment.licenseStatus || c.licenseStatus,
              licenseNumber: enrichment.licenseNumber || c.licenseNumber
            };
          }
          return c;
        }));
      }
    } catch (err) {
      console.error('Enrichment error:', err);
    } finally {
      setEnrichmentStatus('done');
    }
  }, []);

  // Trigger enrichment when contractors change
  useEffect(() => {
    if (contractors.length > 0 && enrichmentStatus === 'idle') {
      enrichContractors(contractors);
    }
  }, [contractors, enrichmentStatus, enrichContractors]);

  // Convert contractors to map markers
  const contractorMarkers: ContractorMarker[] = useMemo(() => {
    return contractors
      .filter(c => c.lat && c.lng)
      .map(c => ({
        id: c.placeId,
        name: c.businessName,
        lat: c.lat!,
        lng: c.lng!,
        rating: c.googleRating || undefined,
        tradeCategory: c.tradeCategories?.[0]
      }));
  }, [contractors]);

  // Core search function - useZipOnly forces a fresh ZIP-based search (ignores mapCenter)
  const handleSearch = useCallback(async (trade?: TradeCategory, overrideCenter?: { lat: number; lng: number }, overrideRadius?: number, useZipOnly?: boolean) => {
    const searchRadius = overrideRadius || currentRadius || 25;
    
    // Determine if we should use ZIP or coordinates
    // useZipOnly=true means ignore mapCenter and use the ZIP input
    const shouldUseZip = useZipOnly || !overrideCenter;
    
    // Validate we have what we need
    if (shouldUseZip && (!searchZip || searchZip.length < 5)) {
      setSearchError('Please enter a valid 5-digit ZIP code');
      return;
    }
    
    setIsSearching(true);
    setSearchError(null);
    
    // Update activeZip when doing a ZIP-based search
    if (shouldUseZip && searchZip) {
      setActiveZip(searchZip);
    }
    
    try {
      const tradeToSearch = trade ?? selectedTrade;
      const params = new URLSearchParams({
        trade: tradeToSearch,
        radius: searchRadius.toString()
      });
      
      // Use coordinates only if explicitly provided (map pan), otherwise always use ZIP
      if (overrideCenter && !useZipOnly) {
        params.set('lat', overrideCenter.lat.toString());
        params.set('lng', overrideCenter.lng.toString());
      } else {
        // Always use the current ZIP input for button clicks
        params.set('zip', searchZip);
      }
      
      console.log('[TrustRadar] Searching with params:', Object.fromEntries(params));
      
      const res = await fetch(`/api/trusted-radar/search?${params}`);
      const data = await res.json();
      
      if (data.success) {
        setContractors(data.contractors || []);
        setEnrichmentStatus('idle');
        // Update map center from the search result
        if (data.center) {
          setMapCenter(data.center);
          lastSearchCenterRef.current = data.center;
        }
      } else {
        setSearchError(data.error || 'Search failed');
        setContractors([]);
      }
    } catch (err) {
      console.error('Search error:', err);
      setSearchError('Failed to search. Please try again.');
      setContractors([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchZip, selectedTrade, currentRadius]);
  
  // Handle map bounds change (pan/zoom) - just update radius, don't auto-search
  // The "Load PROs in this area" button handles manual search triggers
  const handleBoundsChange = useCallback((bounds: MapBounds) => {
    // Update the current radius from map bounds
    setCurrentRadius(bounds.radiusMiles);
  }, []);
  
  // Auto-search when navigating from home page with ZIP param
  useEffect(() => {
    if (activeTab !== 'zip') return;
    const urlZip = searchParams.get('zip');
    if (urlZip && urlZip.length === 5 && !autoSearchTriggeredRef.current && searchZip === urlZip) {
      autoSearchTriggeredRef.current = true;
      // Small delay to ensure state is set
      setTimeout(() => {
        handleSearch(undefined, undefined, undefined, true); // useZipOnly=true
      }, 100);
    }
  }, [activeTab, searchZip, searchParams, handleSearch]);

  // Keyword/business-name search. Results feed the same list, map and detail modal
  // as the ZIP flow, so nothing downstream needs to know which tab produced them.
  const handleKeywordSearch = useCallback(async () => {
    const q = keyword.trim();
    if (q.length < 3) {
      setSearchError('Enter at least 3 characters to search');
      return;
    }

    // Consume the one-shot deep-link trigger. A successful search writes ?q= back
    // to the URL, which would otherwise re-satisfy the auto-search effect below
    // and fire the whole search a second time.
    keywordAutoSearchRef.current = true;

    setIsSearching(true);
    setSearchError(null);
    setSelectedContractor(null);
    setActiveKeyword(q);

    try {
      const params = new URLSearchParams({ q });
      if (searchZip && searchZip.length === 5) {
        params.set('zip', searchZip);
      }

      const res = await fetch(`/api/trusted-radar/keyword-search?${params}`);
      const data = await res.json() as KeywordSearchResult;

      if (data.success) {
        setContractors(data.contractors || []);
        setEnrichmentStatus('idle');
        setMapCenter(data.center || undefined);
        if (data.center) {
          lastSearchCenterRef.current = data.center;
        }
        setSearchParams({ tab: 'contractor', q }, { replace: true });
        trackRadarEvent('radar_keyword_search', {
          has_zip: searchZip.length === 5,
          result_count: data.contractors?.length ?? 0,
        });
      } else {
        setSearchError(data.error || 'Search failed');
        setContractors([]);
      }
    } catch (err) {
      console.error('Keyword search error:', err);
      setSearchError('Failed to search. Please try again.');
      setContractors([]);
    } finally {
      setIsSearching(false);
    }
  }, [keyword, searchZip, setSearchParams]);

  // Auto-search when arriving with ?q= (shared link)
  useEffect(() => {
    const urlQuery = searchParams.get('q');
    if (
      activeTab === 'contractor' &&
      urlQuery &&
      urlQuery.trim().length >= 3 &&
      !keywordAutoSearchRef.current &&
      keyword === urlQuery
    ) {
      keywordAutoSearchRef.current = true;
      handleKeywordSearch();
    }
  }, [activeTab, keyword, searchParams, handleKeywordSearch]);

  // Switching tabs clears results: the ZIP tab's radius/trade framing doesn't
  // describe keyword hits, and stale mixed results read as a bug.
  const handleTabChange = (tab: RadarTab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setContractors([]);
    setSelectedContractor(null);
    setSearchError(null);
    setMapCenter(undefined);
    setActiveZip('');
    setActiveKeyword('');
    setEnrichmentStatus('idle');
    setSearchParams(tab === 'zip' ? { tab } : {}, { replace: true });
    trackRadarEvent('radar_tab_switch', { tab });
  };

  const handleTradeChange = (trade: TradeCategory) => {
    setSelectedTrade(trade);
    // Always search using the current ZIP input (not old map coordinates)
    if (searchZip && searchZip.length === 5) {
      handleSearch(trade, undefined, undefined, true); // useZipOnly=true
    }
  };

  // handleSearchArea removed - see todo.md #121

  const handleMarkerClick = (marker: ContractorMarker) => {
    const contractor = contractors.find(c => c.placeId === marker.id);
    if (contractor) {
      setSelectedContractor(contractor);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TrustRadarSchema />
      <PageSEO
        title="Find Trusted Contractors Near You | Free License & Review Check"
        description="Look up any contractor by name or search your ZIP code. See verified licenses, Google reviews, and BBB ratings for roofers, plumbers, electricians & more — free."
        path="/trusted-radar"
        keywords="contractor lookup by name, find local contractors, verified contractors near me, contractor license lookup, contractor reviews, BBB rated contractors, licensed roofers plumbers electricians"
      />
      <BreadcrumbSchema items={BREADCRUMBS.trustRadar} />
      <Header />
      
      <main className="pt-20">
        {/* Hero Section - Compact Header */}
        <div className="bg-black text-white py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Radar className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Trust Radar</h1>
                <p className="text-gray-300 text-sm">Search trusted PROs in your area</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Search Mode Tabs */}
        <div className="bg-white border-b border-gray-200 pt-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 max-w-md" role="tablist">
              {RADAR_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-white text-emerald-700 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Search Bar Section - White Background */}
        <div className="bg-white border-b border-gray-200 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {activeTab === 'zip' ? (
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Enter ZIP code"
                    value={searchZip}
                    onChange={(e) => setSearchZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(undefined, undefined, undefined, true)}
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg"
                  />
                </div>
                <button
                  onClick={() => handleSearch(undefined, undefined, undefined, true)}
                  disabled={!searchZip || searchZip.length < 5 || isSearching}
                  className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Search className="w-5 h-5" />
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder='Business name or keyword — e.g. "ABC Roofing"'
                    value={keyword}
                    maxLength={80}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleKeywordSearch()}
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg"
                  />
                </div>
                <div className="relative w-full sm:w-40">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Near ZIP"
                    value={searchZip}
                    onChange={(e) => setSearchZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    onKeyDown={(e) => e.key === 'Enter' && handleKeywordSearch()}
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg"
                  />
                </div>
                <button
                  onClick={() => handleKeywordSearch()}
                  disabled={keyword.trim().length < 3 || isSearching}
                  className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Search className="w-5 h-5" />
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>
            )}
            {activeTab === 'contractor' ? (
              <p className="text-sm text-gray-500 mt-3">
                Search any contractor by name. Add a ZIP to prefer nearby matches — leave it blank to search nationwide.
              </p>
            ) : mapCenter && (
              <p className="text-sm text-gray-500 mt-3">Drag the map to search different areas</p>
            )}
          </div>
        </div>

        {/* Trade Tabs — ZIP search only; on the contractor tab the keyword is the filter */}
        {activeTab === 'zip' && (
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex gap-2 py-4 overflow-x-auto scrollbar-hide">
                {RADAR_TRADE_CATEGORIES.map((trade) => (
                  <button
                    key={trade.id}
                    onClick={() => handleTradeChange(trade.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                      selectedTrade === trade.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {trade.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content - Map + List */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-6 min-h-[600px]">
            {/* Interactive Map */}
            <div className="flex-1 lg:w-3/5 relative">
              <RadarMap
                center={mapCenter}
                contractors={contractorMarkers}
                onMarkerClick={handleMarkerClick}
                onBoundsChange={handleBoundsChange}
                isSearching={isSearching}
                fitToContractors={activeTab === 'contractor'}
                emptyMessage={activeTab === 'contractor' ? 'Search for a contractor by name' : undefined}
              />
              {/* Load PROs button removed - see todo.md #121 */}
            </div>
            
            {/* Results List */}
            <div className="lg:w-2/5 space-y-4">
              {/* Selected Contractor Detail Card */}
              {selectedContractor && (
                <ContractorDetailCard 
                  contractor={selectedContractor}
                  onClose={() => setSelectedContractor(null)}
                />
              )}
              
              {/* Contractor List */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">
                  {isSearching 
                    ? 'Searching...'
                    : contractors.length > 0 
                      ? `${contractors.length} Trusted PRO${contractors.length !== 1 ? 's' : ''} Found`
                      : 'Trusted PROs'
                  }
                </h2>
                {activeTab === 'zip' && mapCenter && !isSearching && <p className="text-sm text-gray-500">Showing results within ~{Math.round(currentRadius)} miles</p>}
                {activeTab === 'contractor' && activeKeyword && !isSearching && contractors.length > 0 && (
                  <p className="text-sm text-gray-500">Matching "{activeKeyword}"</p>
                )}
                {isSearching && <p className="text-sm text-gray-400">Looking for contractors in your area...</p>}
              </div>
              
              <div className="max-h-[500px] overflow-y-auto">
                {/* Skeleton loading while searching */}
                {isSearching && (
                  <div className="p-4 space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1">
                            <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                            <div className="h-4 bg-gray-100 rounded w-1/2 mb-2" />
                            <div className="flex gap-2 mt-2">
                              <div className="h-5 bg-gray-100 rounded w-16" />
                              <div className="h-5 bg-gray-100 rounded w-20" />
                            </div>
                          </div>
                          <div className="h-8 w-14 bg-emerald-100 rounded-lg" />
                        </div>
                        <div className="flex gap-2 mt-3">
                          <div className="h-9 bg-gray-100 rounded-lg flex-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Error state with retry */}
                {searchError && !isSearching && (
                  <div className="p-8 text-center">
                    <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="w-7 h-7 text-red-500" />
                    </div>
                    <p className="text-gray-900 font-medium mb-2">Something went wrong</p>
                    <p className="text-gray-500 text-sm mb-4">{searchError}</p>
                    <button
                      onClick={() => activeTab === 'contractor'
                        ? handleKeywordSearch()
                        : handleSearch(undefined, undefined, undefined, true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Try Again
                    </button>
                  </div>
                )}
                
                {/* Empty state - no search yet (ZIP tab) */}
                {activeTab === 'zip' && !searchError && contractors.length === 0 && !isSearching && !activeZip && (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-emerald-600" />
                    </div>
                    <p className="text-gray-900 font-medium mb-2">Find Trusted Contractors</p>
                    <p className="text-gray-500 text-sm mb-4">Enter your ZIP code above to discover vetted PROs in your area</p>
                    <div className="bg-gray-50 rounded-xl p-4 text-left max-w-xs mx-auto">
                      <p className="text-xs font-medium text-gray-700 mb-3">What we check:</p>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                            <Star className="w-3 h-3 text-emerald-600" />
                          </span>
                          4.0+ Google ratings
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                          </span>
                          Active state licenses
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                            <Shield className="w-3 h-3 text-emerald-600" />
                          </span>
                          BBB accreditation
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Empty state - no search yet (Contractor tab) */}
                {activeTab === 'contractor' && !searchError && contractors.length === 0 && !isSearching && !activeKeyword && (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-emerald-600" />
                    </div>
                    <p className="text-gray-900 font-medium mb-2">Look Up a Contractor</p>
                    <p className="text-gray-500 text-sm mb-4">
                      Type a business name from a bid, flyer, or referral to check them out
                    </p>
                    <div className="bg-gray-50 rounded-xl p-4 text-left max-w-xs mx-auto">
                      <p className="text-xs font-medium text-gray-700 mb-3">What you'll see:</p>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                            <Star className="w-3 h-3 text-emerald-600" />
                          </span>
                          Google rating &amp; review count
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                          </span>
                          License &amp; registration lookup
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                            <Shield className="w-3 h-3 text-emerald-600" />
                          </span>
                          BBB record &amp; complaints
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Empty state - no results found (ZIP tab) */}
                {activeTab === 'zip' && !searchError && contractors.length === 0 && !isSearching && activeZip && (
                  <div className="p-8 text-center">
                    <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                      <MapPin className="w-7 h-7 text-amber-600" />
                    </div>
                    <p className="text-gray-900 font-medium mb-2">No contractors found</p>
                    <p className="text-gray-500 text-sm mb-4">
                      We couldn't find contractors matching "{RADAR_TRADE_CATEGORIES.find(t => t.id === selectedTrade)?.label || 'All Trades'}" near {activeZip}
                    </p>
                    <div className="space-y-2">
                      <button
                        onClick={() => handleTradeChange('all')}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                      >
                        Show all trades
                      </button>
                      <p className="text-xs text-gray-400">or try a different ZIP code</p>
                    </div>
                  </div>
                )}

                {/* Empty state - no results found (Contractor tab) */}
                {activeTab === 'contractor' && !searchError && contractors.length === 0 && !isSearching && activeKeyword && (
                  <div className="p-8 text-center">
                    <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                      <Search className="w-7 h-7 text-amber-600" />
                    </div>
                    <p className="text-gray-900 font-medium mb-2">No contractors found</p>
                    <p className="text-gray-500 text-sm mb-4">
                      Nothing matched "{activeKeyword}"
                    </p>
                    <ul className="text-sm text-gray-500 text-left max-w-xs mx-auto space-y-1.5">
                      <li>• Check the spelling of the business name</li>
                      <li>• Try fewer words, or just the distinctive part</li>
                      <li>• {searchZip ? 'Clear the ZIP to search nationwide' : 'Add a ZIP code to narrow the area'}</li>
                    </ul>
                  </div>
                )}
                
                {/* Contractor list - only show when not searching */}
                {!isSearching && !searchError && contractors.map((contractor) => (
                  <div 
                    key={contractor.placeId}
                    onClick={() => setSelectedContractor(contractor)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedContractor?.placeId === contractor.placeId ? 'bg-emerald-50 border-l-4 border-l-emerald-500' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{contractor.businessName}</h3>
                        {contractor.address && (
                          <p className="text-sm text-gray-500 truncate">{contractor.address}</p>
                        )}
                        {contractor.city && contractor.stateCode && (
                          <p className="text-sm text-gray-500">{contractor.city}, {contractor.stateCode}</p>
                        )}
                        
                        {/* BBB/License Badges */}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {contractor.bbbGrade && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-medium">
                              <Shield className="w-3 h-3" />
                              BBB {contractor.bbbGrade}
                            </span>
                          )}
                          {contractor.licenseStatus === 'verified' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-xs font-medium">
                              <CheckCircle className="w-3 h-3" />
                              Licensed
                            </span>
                          )}
                          {enrichmentStatus === 'loading' && !contractor.bbbGrade && !contractor.licenseNumber && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-gray-500 text-xs">
                              Checking BBB/License...
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Keyword results are not rating-filtered, so flag sub-4.0 instead of hiding it */}
                      {contractor.googleRating && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg shrink-0 ${
                          contractor.googleRating < 4.0 ? 'bg-amber-100' : 'bg-emerald-100'
                        }`}>
                          <Star className={`w-4 h-4 ${
                            contractor.googleRating < 4.0 ? 'text-amber-600 fill-amber-600' : 'text-emerald-600 fill-emerald-600'
                          }`} />
                          <span className={`text-sm font-semibold ${
                            contractor.googleRating < 4.0 ? 'text-amber-700' : 'text-emerald-700'
                          }`}>{contractor.googleRating.toFixed(1)}</span>
                          {contractor.googleReviewCount && (
                            <span className={`text-xs ${
                              contractor.googleRating < 4.0 ? 'text-amber-600' : 'text-emerald-600'
                            }`}>({contractor.googleReviewCount})</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* CTA Buttons */}
                    <div className="flex gap-2 mt-3">
                      <a
                        href="/"
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <Search className="w-4 h-4" />
                        Analyze Bids
                      </a>
                    </div>
                    
                    {/* Secondary Links */}
                    <div className="flex gap-3 mt-2">
                      {contractor.website && (
                        <a 
                          href={contractor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-emerald-600"
                        >
                          <Globe className="w-3 h-3" />
                          Website
                        </a>
                      )}
                      <a 
                        href={`https://www.google.com/maps/place/?q=place_id:${contractor.placeId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-emerald-600"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Contact PRO
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            </div>
          </div>
        </div>
        
        {/* Educational Content Section */}
        <div className="bg-white border-t border-gray-200">
          {/* Article Hero */}
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full mb-4">
                Homeowner Guide
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Bridging the "Trust Gap": How to Find a Contractor You Can Rely On
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                When planning a home renovation, picking out tile and paint colors is the fun part. The stressful part? Finding a contractor you can actually trust to bring that vision to life.
              </p>
            </div>
            
            {/* Key Stats */}
            <div className="grid sm:grid-cols-3 gap-6 mb-16">
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 text-center border border-red-200">
                <div className="text-4xl font-bold text-red-600 mb-2">30%</div>
                <p className="text-sm text-red-700">of homeowners delay projects because they can't find a trustworthy professional</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 text-center border border-emerald-200">
                <div className="text-4xl font-bold text-emerald-600 mb-2">93%</div>
                <p className="text-sm text-emerald-700">of homeowners plan to hire professional help for upcoming projects</p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-6 text-center border border-amber-200">
                <div className="text-4xl font-bold text-amber-600 mb-2">$50K+</div>
                <p className="text-sm text-amber-700">budgeted by nearly 30% of homeowners for their remodel</p>
              </div>
            </div>
            
            {/* Why Trust Matters */}
            <div className="mb-16">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Why Trust is the Most Critical Element of Your Remodel
              </h3>
              <div className="bg-gray-50 border-l-4 border-emerald-500 rounded-r-xl p-6">
                <p className="text-gray-700 leading-relaxed mb-4">
                  A home remodel is a major financial investment. In fact, <strong>75% of homeowners plan to spend more than $10,000</strong> on their upcoming projects, with nearly 30% budgeting $50,000 or more.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  When you hire a contractor, you're trusting them with your most valuable asset. A lack of trust usually stems from <strong>"Deal Risks"</strong>—vulnerabilities in a contract that can leave you financially exposed. If a contractor is unreliable or their bid lacks clear protections, you could face surprise costs, abandoned projects, or shoddy workmanship.
                </p>
              </div>
            </div>
            
            {/* What to Look For */}
            <div className="mb-16">
              <h3 className="text-2xl font-bold text-gray-900 mb-8">
                What to Look for in a Trustworthy Contractor
              </h3>
              <p className="text-gray-600 mb-8">
                To separate the reliable professionals from the risky bets, you need to look beyond their portfolio pictures. Here are the key indicators of a trustworthy contractor:
              </p>
              
              <div className="space-y-6">
                {/* Item 1 */}
                <div className="flex gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Verifiable Licensing and Compliance</h4>
                    <p className="text-gray-600 leading-relaxed">
                      A trustworthy contractor operates by the book. They should have an <strong>active state license</strong> relevant to their trade. Keep in mind that licensing requirements vary wildly by location. For example, while California has strict seismic and Title 24 energy requirements, states like Texas don't require a general contractor license at the state level. Always verify their specific license status with your state's licensing board.
                    </p>
                  </div>
                </div>
                
                {/* Item 2 */}
                <div className="flex gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">A Transparent, Itemized Bid</h4>
                    <p className="text-gray-600 leading-relaxed">
                      A vague estimate is a major red flag. If a contractor hands you a bid with a single lump-sum price and a brief description, you're at risk. Trustworthy contractors provide <strong>highly detailed, itemized scopes of work</strong>. If a bid contains more than 40% vague items, it leaves the door wide open for unexpected "change orders" and budget blowouts later.
                    </p>
                  </div>
                </div>
                
                {/* Item 3 */}
                <div className="flex gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Fair Payment Terms</h4>
                    <p className="text-gray-600 leading-relaxed">
                      Never trust a contractor who demands a massive payment upfront. Asking for a <strong>deposit larger than 50%</strong> of the total project cost is a critical red flag. A reputable contractor will have enough capital to start the job and will establish a clear, milestone-based payment schedule tied to project progress.
                    </p>
                  </div>
                </div>
                
                {/* Item 4 */}
                <div className="flex gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl font-bold">
                    4
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Strong Digital Reputation and History</h4>
                    <p className="text-gray-600 leading-relaxed">
                      Word of mouth is great, but data is better. Look for a contractor with a strong track record on platforms like <strong>Google Reviews (ideally a 4.0+ rating)</strong> and check their accreditation and complaint history with the Better Business Bureau (BBB). A solid history of resolving customer complaints is a strong indicator of reliability.
                    </p>
                  </div>
                </div>
                
                {/* Item 5 */}
                <div className="flex gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl font-bold">
                    5
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Proximity to Your Project</h4>
                    <p className="text-gray-600 leading-relaxed">
                      It might seem minor, but travel distance matters. Contractors located <strong>more than 60 miles away</strong> from your home pose a higher travel risk. Local contractors are generally more accountable to the community, have established relationships with local suppliers and inspectors, and are easier to reach if warranty issues arise after the project is finished.
                    </p>
                  </div>
                </div>
                
                {/* Item 6 */}
                <div className="flex gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl font-bold">
                    6
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Proof of Insurance, Bonding, and Warranties</h4>
                    <p className="text-gray-600 leading-relaxed">
                      A trustworthy contractor will readily provide a <strong>Certificate of Insurance (COI)</strong> proving they have liability and worker's compensation coverage. Furthermore, they will stand behind their work by offering clear warranties.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* CTA Section - Full Width */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h3 className="text-2xl sm:text-3xl font-bold mb-4 text-white">
                How RemodelerIQ Takes the Guesswork Out of Trust
              </h3>
              <p className="text-emerald-100 text-lg mb-8 max-w-2xl mx-auto">
                You shouldn't have to hire a private investigator to feel confident about who you hire to work on your home. We built our platform specifically to bridge that gap for you.
              </p>
              <a
                href="/"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-700 font-semibold rounded-xl hover:bg-emerald-50 transition-colors text-lg shadow-lg"
              >
                <Search className="w-5 h-5" />
                Analyze Your Bids Free
              </a>
              <p className="text-emerald-200 text-sm mt-4">
                Free instant analysis • No signup required
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
