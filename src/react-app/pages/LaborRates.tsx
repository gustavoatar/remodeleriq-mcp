import { useState, useEffect, useRef } from 'react';
import Header from '@/react-app/components/Header';
import Footer from '@/react-app/components/Footer';
import RelatedLinks from '@/react-app/components/RelatedLinks';
import TrustedContractorSearch from '@/react-app/components/TrustedContractorSearch';
import PageSEO from '@/react-app/components/PageSEO';
import { 
  Search, MapPin, Info,
  TrendingUp, Building, Calculator, AlertTriangle,
  ShieldCheck, Zap, HardHat, FileText, ArrowRight,
  CheckCircle2, ChevronRight, ChevronLeft, Globe, ChevronDown, ChevronUp,
  Wrench, Paintbrush, Plug, Droplets, Hammer, TreeDeciduous, Home, Wind
} from 'lucide-react';
import { Link } from 'react-router';
import { 
  FALLBACK_WAGES, 
  CONTRACTOR_MULTIPLIER,
  type TradeType 
} from '@/shared/blsLaborRates';
import { getRegionalMultiplier, STATE_MULTIPLIERS } from '@/shared/marketRatesEngine';
import { getRelevantInsights, type RegionalInsight } from '@/shared/regionalRedditInsights';

interface TradeOption {
  value: TradeType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TRADE_OPTIONS: TradeOption[] = [
  { value: 'electrician', label: 'Electrician', description: 'Wiring, panels, outlets, lighting', icon: Plug },
  { value: 'plumber', label: 'Plumber', description: 'Pipes, fixtures, water heaters', icon: Droplets },
  { value: 'carpenter', label: 'Carpenter', description: 'Framing, trim, cabinets, decks', icon: Hammer },
  { value: 'roofer', label: 'Roofer', description: 'Shingles, flashing, repairs', icon: Home },
  { value: 'painter', label: 'Painter', description: 'Interior & exterior painting', icon: Paintbrush },
  { value: 'hvac_technician', label: 'HVAC Technician', description: 'Heating, cooling, ventilation', icon: Wind },
  { value: 'drywall_installer', label: 'Drywall Installer', description: 'Sheetrock, taping, finishing', icon: Building },
  { value: 'tile_setter', label: 'Tile Setter', description: 'Floor & wall tile installation', icon: Wrench },
  { value: 'landscaper', label: 'Landscaper', description: 'Grading, planting, hardscape', icon: TreeDeciduous },
  { value: 'general_laborer', label: 'General Laborer', description: 'Demolition, cleanup, general help', icon: HardHat },
];

interface LaborRateResult {
  trade: string;
  tradeDescription: string;
  baseWage: number;
  fairRate: number;
  lowRate: number;
  highRate: number;
  zipCode: string;
  region: string;
  msaName: string;
}

// ZIP code prefix to region mapping
const ZIP_REGIONS: Record<string, { region: string; msa: string; adjustment: number }> = {
  // Michigan
  '480': { region: 'Detroit Metro, MI', msa: 'Detroit-Warren-Dearborn', adjustment: 1.05 },
  '481': { region: 'Detroit Metro, MI', msa: 'Detroit-Warren-Dearborn', adjustment: 1.05 },
  '482': { region: 'Detroit Metro, MI', msa: 'Detroit-Warren-Dearborn', adjustment: 1.05 },
  '483': { region: 'Oakland County, MI', msa: 'Detroit-Warren-Dearborn', adjustment: 1.08 },
  '484': { region: 'Flint, MI', msa: 'Flint', adjustment: 0.95 },
  '485': { region: 'Flint, MI', msa: 'Flint', adjustment: 0.95 },
  '486': { region: 'Saginaw, MI', msa: 'Saginaw', adjustment: 0.92 },
  '487': { region: 'Saginaw, MI', msa: 'Saginaw', adjustment: 0.92 },
  '488': { region: 'Lansing, MI', msa: 'Lansing-East Lansing', adjustment: 0.95 },
  '489': { region: 'Lansing, MI', msa: 'Lansing-East Lansing', adjustment: 0.95 },
  '490': { region: 'Kalamazoo, MI', msa: 'Kalamazoo-Portage', adjustment: 0.93 },
  '491': { region: 'Kalamazoo, MI', msa: 'Kalamazoo-Portage', adjustment: 0.93 },
  '492': { region: 'Ann Arbor, MI', msa: 'Ann Arbor', adjustment: 1.05 },
  '493': { region: 'Grand Rapids, MI', msa: 'Grand Rapids-Kentwood', adjustment: 0.98 },
  '494': { region: 'Grand Rapids, MI', msa: 'Grand Rapids-Kentwood', adjustment: 0.98 },
  '495': { region: 'Grand Rapids, MI', msa: 'Grand Rapids-Kentwood', adjustment: 0.98 },
  '496': { region: 'Northern Michigan', msa: 'Northern Michigan', adjustment: 0.90 },
  '497': { region: 'Northern Michigan', msa: 'Northern Michigan', adjustment: 0.90 },
  '498': { region: 'Upper Peninsula, MI', msa: 'Upper Peninsula', adjustment: 0.88 },
  '499': { region: 'Upper Peninsula, MI', msa: 'Upper Peninsula', adjustment: 0.88 },
  
  // Georgia
  '300': { region: 'Atlanta Metro, GA', msa: 'Atlanta-Sandy Springs-Roswell', adjustment: 1.0 },
  '301': { region: 'Atlanta Metro, GA', msa: 'Atlanta-Sandy Springs-Roswell', adjustment: 1.0 },
  '302': { region: 'Atlanta Metro, GA', msa: 'Atlanta-Sandy Springs-Roswell', adjustment: 1.0 },
  '303': { region: 'Atlanta Metro, GA', msa: 'Atlanta-Sandy Springs-Roswell', adjustment: 1.0 },
  '304': { region: 'Macon, GA', msa: 'Macon-Bibb County', adjustment: 0.92 },
  '305': { region: 'Athens, GA', msa: 'Athens-Clarke County', adjustment: 0.95 },
  '306': { region: 'Augusta, GA', msa: 'Augusta-Richmond County', adjustment: 0.93 },
  '307': { region: 'Columbus, GA', msa: 'Columbus', adjustment: 0.90 },
  '308': { region: 'Savannah, GA', msa: 'Savannah', adjustment: 0.95 },
  '309': { region: 'Savannah, GA', msa: 'Savannah', adjustment: 0.95 },
  '310': { region: 'South Georgia', msa: 'South Georgia', adjustment: 0.88 },
  '311': { region: 'Atlanta Metro, GA', msa: 'Atlanta-Sandy Springs-Roswell', adjustment: 1.0 },
  '312': { region: 'Macon, GA', msa: 'Macon-Bibb County', adjustment: 0.92 },
  
  // California
  '900': { region: 'Los Angeles, CA', msa: 'Los Angeles-Long Beach-Anaheim', adjustment: 1.25 },
  '901': { region: 'Los Angeles, CA', msa: 'Los Angeles-Long Beach-Anaheim', adjustment: 1.25 },
  '902': { region: 'Los Angeles, CA', msa: 'Los Angeles-Long Beach-Anaheim', adjustment: 1.25 },
  '906': { region: 'Los Angeles, CA', msa: 'Los Angeles-Long Beach-Anaheim', adjustment: 1.25 },
  '910': { region: 'Los Angeles, CA', msa: 'Los Angeles-Long Beach-Anaheim', adjustment: 1.25 },
  '920': { region: 'San Diego, CA', msa: 'San Diego-Chula Vista-Carlsbad', adjustment: 1.20 },
  '921': { region: 'San Diego, CA', msa: 'San Diego-Chula Vista-Carlsbad', adjustment: 1.20 },
  '940': { region: 'San Francisco, CA', msa: 'San Francisco-Oakland-Berkeley', adjustment: 1.40 },
  '941': { region: 'San Francisco, CA', msa: 'San Francisco-Oakland-Berkeley', adjustment: 1.40 },
  '943': { region: 'San Jose, CA', msa: 'San Jose-Sunnyvale-Santa Clara', adjustment: 1.45 },
  '950': { region: 'San Jose, CA', msa: 'San Jose-Sunnyvale-Santa Clara', adjustment: 1.45 },
  '951': { region: 'Riverside, CA', msa: 'Riverside-San Bernardino-Ontario', adjustment: 1.15 },
  '958': { region: 'Sacramento, CA', msa: 'Sacramento-Roseville-Folsom', adjustment: 1.15 },
  
  // Texas
  '750': { region: 'Dallas, TX', msa: 'Dallas-Fort Worth-Arlington', adjustment: 1.02 },
  '751': { region: 'Dallas, TX', msa: 'Dallas-Fort Worth-Arlington', adjustment: 1.02 },
  '752': { region: 'Dallas, TX', msa: 'Dallas-Fort Worth-Arlington', adjustment: 1.02 },
  '760': { region: 'Fort Worth, TX', msa: 'Dallas-Fort Worth-Arlington', adjustment: 1.0 },
  '770': { region: 'Houston, TX', msa: 'Houston-The Woodlands-Sugar Land', adjustment: 1.05 },
  '771': { region: 'Houston, TX', msa: 'Houston-The Woodlands-Sugar Land', adjustment: 1.05 },
  '772': { region: 'Houston, TX', msa: 'Houston-The Woodlands-Sugar Land', adjustment: 1.05 },
  '773': { region: 'Houston, TX', msa: 'Houston-The Woodlands-Sugar Land', adjustment: 1.05 },
  '780': { region: 'San Antonio, TX', msa: 'San Antonio-New Braunfels', adjustment: 0.95 },
  '781': { region: 'San Antonio, TX', msa: 'San Antonio-New Braunfels', adjustment: 0.95 },
  '782': { region: 'San Antonio, TX', msa: 'San Antonio-New Braunfels', adjustment: 0.95 },
  '787': { region: 'Austin, TX', msa: 'Austin-Round Rock-Georgetown', adjustment: 1.08 },
  
  // New York
  '100': { region: 'New York City, NY', msa: 'New York-Newark-Jersey City', adjustment: 1.35 },
  '101': { region: 'New York City, NY', msa: 'New York-Newark-Jersey City', adjustment: 1.35 },
  '102': { region: 'New York City, NY', msa: 'New York-Newark-Jersey City', adjustment: 1.35 },
  '103': { region: 'Staten Island, NY', msa: 'New York-Newark-Jersey City', adjustment: 1.30 },
  '104': { region: 'Bronx, NY', msa: 'New York-Newark-Jersey City', adjustment: 1.30 },
  '110': { region: 'Long Island, NY', msa: 'New York-Newark-Jersey City', adjustment: 1.35 },
  '111': { region: 'Long Island, NY', msa: 'New York-Newark-Jersey City', adjustment: 1.35 },
  '112': { region: 'Brooklyn, NY', msa: 'New York-Newark-Jersey City', adjustment: 1.32 },
  '113': { region: 'Queens, NY', msa: 'New York-Newark-Jersey City', adjustment: 1.32 },
  '120': { region: 'Albany, NY', msa: 'Albany-Schenectady-Troy', adjustment: 1.0 },
  '140': { region: 'Buffalo, NY', msa: 'Buffalo-Cheektowaga', adjustment: 0.95 },
  '142': { region: 'Buffalo, NY', msa: 'Buffalo-Cheektowaga', adjustment: 0.95 },
  '145': { region: 'Rochester, NY', msa: 'Rochester', adjustment: 0.98 },
  '146': { region: 'Rochester, NY', msa: 'Rochester', adjustment: 0.98 },
  
  // Florida
  '320': { region: 'Jacksonville, FL', msa: 'Jacksonville', adjustment: 0.95 },
  '321': { region: 'Jacksonville, FL', msa: 'Jacksonville', adjustment: 0.95 },
  '322': { region: 'Jacksonville, FL', msa: 'Jacksonville', adjustment: 0.95 },
  '327': { region: 'Orlando, FL', msa: 'Orlando-Kissimmee-Sanford', adjustment: 0.98 },
  '328': { region: 'Orlando, FL', msa: 'Orlando-Kissimmee-Sanford', adjustment: 0.98 },
  '330': { region: 'Miami, FL', msa: 'Miami-Fort Lauderdale-Pompano Beach', adjustment: 1.05 },
  '331': { region: 'Miami, FL', msa: 'Miami-Fort Lauderdale-Pompano Beach', adjustment: 1.05 },
  '332': { region: 'Miami, FL', msa: 'Miami-Fort Lauderdale-Pompano Beach', adjustment: 1.05 },
  '333': { region: 'Fort Lauderdale, FL', msa: 'Miami-Fort Lauderdale-Pompano Beach', adjustment: 1.05 },
  '334': { region: 'West Palm Beach, FL', msa: 'Miami-Fort Lauderdale-Pompano Beach', adjustment: 1.05 },
  '335': { region: 'Tampa, FL', msa: 'Tampa-St. Petersburg-Clearwater', adjustment: 0.98 },
  '336': { region: 'Tampa, FL', msa: 'Tampa-St. Petersburg-Clearwater', adjustment: 0.98 },
  '337': { region: 'St. Petersburg, FL', msa: 'Tampa-St. Petersburg-Clearwater', adjustment: 0.98 },
  
  // Illinois
  '600': { region: 'Chicago, IL', msa: 'Chicago-Naperville-Elgin', adjustment: 1.12 },
  '601': { region: 'Chicago, IL', msa: 'Chicago-Naperville-Elgin', adjustment: 1.12 },
  '602': { region: 'Chicago, IL', msa: 'Chicago-Naperville-Elgin', adjustment: 1.12 },
  '603': { region: 'Chicago, IL', msa: 'Chicago-Naperville-Elgin', adjustment: 1.12 },
  '604': { region: 'Chicago, IL', msa: 'Chicago-Naperville-Elgin', adjustment: 1.12 },
  '605': { region: 'Chicago Suburbs, IL', msa: 'Chicago-Naperville-Elgin', adjustment: 1.10 },
  '606': { region: 'Chicago, IL', msa: 'Chicago-Naperville-Elgin', adjustment: 1.12 },
  
  // Pennsylvania
  '150': { region: 'Pittsburgh, PA', msa: 'Pittsburgh', adjustment: 1.0 },
  '151': { region: 'Pittsburgh, PA', msa: 'Pittsburgh', adjustment: 1.0 },
  '152': { region: 'Pittsburgh, PA', msa: 'Pittsburgh', adjustment: 1.0 },
  '190': { region: 'Philadelphia, PA', msa: 'Philadelphia-Camden-Wilmington', adjustment: 1.10 },
  '191': { region: 'Philadelphia, PA', msa: 'Philadelphia-Camden-Wilmington', adjustment: 1.10 },
  '192': { region: 'Philadelphia, PA', msa: 'Philadelphia-Camden-Wilmington', adjustment: 1.10 },
  
  // Ohio
  '430': { region: 'Columbus, OH', msa: 'Columbus', adjustment: 0.98 },
  '431': { region: 'Columbus, OH', msa: 'Columbus', adjustment: 0.98 },
  '432': { region: 'Columbus, OH', msa: 'Columbus', adjustment: 0.98 },
  '440': { region: 'Cleveland, OH', msa: 'Cleveland-Elyria', adjustment: 0.98 },
  '441': { region: 'Cleveland, OH', msa: 'Cleveland-Elyria', adjustment: 0.98 },
  '442': { region: 'Cleveland, OH', msa: 'Cleveland-Elyria', adjustment: 0.98 },
  '450': { region: 'Cincinnati, OH', msa: 'Cincinnati', adjustment: 0.98 },
  '451': { region: 'Cincinnati, OH', msa: 'Cincinnati', adjustment: 0.98 },
  '452': { region: 'Cincinnati, OH', msa: 'Cincinnati', adjustment: 0.98 },
  
  // Arizona
  '850': { region: 'Phoenix, AZ', msa: 'Phoenix-Mesa-Chandler', adjustment: 1.0 },
  '852': { region: 'Phoenix, AZ', msa: 'Phoenix-Mesa-Chandler', adjustment: 1.0 },
  '853': { region: 'Phoenix, AZ', msa: 'Phoenix-Mesa-Chandler', adjustment: 1.0 },
  '857': { region: 'Tucson, AZ', msa: 'Tucson', adjustment: 0.92 },
  
  // Colorado
  '800': { region: 'Denver, CO', msa: 'Denver-Aurora-Lakewood', adjustment: 1.08 },
  '801': { region: 'Denver, CO', msa: 'Denver-Aurora-Lakewood', adjustment: 1.08 },
  '802': { region: 'Denver, CO', msa: 'Denver-Aurora-Lakewood', adjustment: 1.08 },
  '803': { region: 'Boulder, CO', msa: 'Boulder', adjustment: 1.12 },
  '804': { region: 'Denver, CO', msa: 'Denver-Aurora-Lakewood', adjustment: 1.08 },
  '805': { region: 'Denver, CO', msa: 'Denver-Aurora-Lakewood', adjustment: 1.08 },
  
  // Washington
  '980': { region: 'Seattle, WA', msa: 'Seattle-Tacoma-Bellevue', adjustment: 1.20 },
  '981': { region: 'Seattle, WA', msa: 'Seattle-Tacoma-Bellevue', adjustment: 1.20 },
  '982': { region: 'Tacoma, WA', msa: 'Seattle-Tacoma-Bellevue', adjustment: 1.15 },
  '983': { region: 'Tacoma, WA', msa: 'Seattle-Tacoma-Bellevue', adjustment: 1.15 },
  '984': { region: 'Tacoma, WA', msa: 'Seattle-Tacoma-Bellevue', adjustment: 1.15 },
  '985': { region: 'Olympia, WA', msa: 'Olympia-Lacey-Tumwater', adjustment: 1.08 },
  
  // Massachusetts
  '010': { region: 'Springfield, MA', msa: 'Springfield', adjustment: 1.05 },
  '011': { region: 'Springfield, MA', msa: 'Springfield', adjustment: 1.05 },
  '012': { region: 'Springfield, MA', msa: 'Springfield', adjustment: 1.05 },
  '020': { region: 'Boston, MA', msa: 'Boston-Cambridge-Newton', adjustment: 1.25 },
  '021': { region: 'Boston, MA', msa: 'Boston-Cambridge-Newton', adjustment: 1.25 },
  '022': { region: 'Boston, MA', msa: 'Boston-Cambridge-Newton', adjustment: 1.25 },
  '023': { region: 'Brockton, MA', msa: 'Boston-Cambridge-Newton', adjustment: 1.20 },
  '024': { region: 'Boston, MA', msa: 'Boston-Cambridge-Newton', adjustment: 1.25 },
  
  // New Jersey
  '070': { region: 'Newark, NJ', msa: 'New York-Newark-Jersey City', adjustment: 1.25 },
  '071': { region: 'Newark, NJ', msa: 'New York-Newark-Jersey City', adjustment: 1.25 },
  '072': { region: 'Elizabeth, NJ', msa: 'New York-Newark-Jersey City', adjustment: 1.25 },
  '073': { region: 'Jersey City, NJ', msa: 'New York-Newark-Jersey City', adjustment: 1.28 },
  '074': { region: 'Paterson, NJ', msa: 'New York-Newark-Jersey City', adjustment: 1.22 },
  '080': { region: 'Camden, NJ', msa: 'Philadelphia-Camden-Wilmington', adjustment: 1.08 },
  '081': { region: 'Camden, NJ', msa: 'Philadelphia-Camden-Wilmington', adjustment: 1.08 },
  '085': { region: 'Trenton, NJ', msa: 'Trenton-Princeton', adjustment: 1.10 },
  '086': { region: 'Trenton, NJ', msa: 'Trenton-Princeton', adjustment: 1.10 },
  '088': { region: 'Atlantic City, NJ', msa: 'Atlantic City-Hammonton', adjustment: 1.05 },
  '089': { region: 'Atlantic City, NJ', msa: 'Atlantic City-Hammonton', adjustment: 1.05 },
};

function getRegionFromZip(zipCode: string): { region: string; msa: string; adjustment: number } {
  const prefix3 = zipCode.substring(0, 3);
  if (ZIP_REGIONS[prefix3]) {
    return ZIP_REGIONS[prefix3];
  }
  return { region: 'United States', msa: 'National Average', adjustment: 1.0 };
}

export default function LaborRatesPage() {
  const [zipCode, setZipCode] = useState('');
  const [allResults, setAllResults] = useState<LaborRateResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasAutoSearched, setHasAutoSearched] = useState(false);
  
  // Carousel refs
  const carouselRef = useRef<HTMLDivElement>(null);
  
  // New state for localization features
  const [inflationFactor, setInflationFactor] = useState<number | null>(null);
  const [inflationDate, setInflationDate] = useState<string | null>(null);
  const [detectedState, setDetectedState] = useState<string | null>(null);
  const [regionalInsights, setRegionalInsights] = useState<RegionalInsight[]>([]);
  const [expandedInsights, setExpandedInsights] = useState<Set<number>>(new Set());
  const [regionalMultiplierData, setRegionalMultiplierData] = useState<{
    multiplier: number;
    name?: string;
    percentDiff: string;
  } | null>(null);

  // Carousel scroll functions
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const cardWidth = carouselRef.current.firstElementChild?.getBoundingClientRect().width || 320;
    const gap = 16;
    const scrollAmount = direction === 'left' ? -(cardWidth + gap) : (cardWidth + gap);
    carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  // Fetch inflation factor on mount
  useEffect(() => {
    const fetchInflation = async () => {
      try {
        const res = await fetch('/api/fred/inflation-factor');
        if (res.ok) {
          const data = await res.json();
          if (data.factor) {
            setInflationFactor(data.factor);
            setInflationDate(new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
          }
        }
      } catch (e) {
        // Silently fail - inflation badge just won't show
      }
    };
    fetchInflation();
    
    // Load saved ZIP from localStorage - check unified key first, then legacy key
    const savedZip = localStorage.getItem('remodeleriq_last_project_zip') || localStorage.getItem('userZipCode');
    if (savedZip && savedZip.length === 5) {
      setZipCode(savedZip);
      setZipLoadedFromStorage(true);
    }
  }, []);

  // Auto-search when ZIP is loaded from localStorage
  const [zipLoadedFromStorage, setZipLoadedFromStorage] = useState(false);
  
  useEffect(() => {
    if (zipLoadedFromStorage && zipCode && zipCode.length === 5 && !hasAutoSearched) {
      setHasAutoSearched(true);
      // Small delay to ensure component is fully mounted
      setTimeout(() => handleLookup(zipCode), 100);
    }
  }, [zipCode, zipLoadedFromStorage, hasAutoSearched]);

  const handleLookup = (overrideZip?: string) => {
    const zipToUse = overrideZip || zipCode;
    setError('');
    setAllResults([]);

    const cleanZip = zipToUse.replace(/\D/g, '').slice(0, 5);
    if (cleanZip.length !== 5) {
      setError('Please enter a valid 5-digit ZIP code');
      return;
    }

    setIsLoading(true);

    // Save ZIP to localStorage for future visits (unified key used across all tools)
    localStorage.setItem('remodeleriq_last_project_zip', cleanZip);

    const regionData = getRegionFromZip(cleanZip);
    
    // Detect state from ZIP prefix for regional insights
    const stateFromZip = detectStateFromZip(cleanZip);
    setDetectedState(stateFromZip);
    
    // Get regional insights for detected state
    if (stateFromZip) {
      const insights = getRelevantInsights(stateFromZip, 'general remodel');
      setRegionalInsights(insights.slice(0, 5));
    } else {
      setRegionalInsights([]);
    }
    
    // Get regional multiplier using the marketRatesEngine
    const regionalResult = getRegionalMultiplier(undefined, stateFromZip || undefined, undefined, cleanZip);
    const multiplier = regionalResult.multiplier;
    const percentDiff = ((multiplier - 1) * 100).toFixed(0);
    const percentStr = multiplier >= 1 ? `+${percentDiff}%` : `${percentDiff}%`;
    setRegionalMultiplierData({
      multiplier,
      name: regionalResult.name || regionData.region,
      percentDiff: percentStr
    });
    
    // Calculate rates for ALL trades
    const results: LaborRateResult[] = TRADE_OPTIONS.map(trade => {
      const baseWage = FALLBACK_WAGES[trade.value];
      
      // Apply regional adjustment and inflation if available
      let adjustedBaseWage = baseWage * regionData.adjustment;
      if (inflationFactor && inflationFactor > 1) {
        adjustedBaseWage = adjustedBaseWage * inflationFactor;
      }
      adjustedBaseWage = Math.round(adjustedBaseWage * 100) / 100;
      
      const fairRate = Math.round(adjustedBaseWage * CONTRACTOR_MULTIPLIER * 100) / 100;
      const lowRate = Math.round(fairRate * 0.85 * 100) / 100;
      const highRate = Math.round(fairRate * 1.2 * 100) / 100;

      return {
        trade: trade.label,
        tradeDescription: trade.description,
        baseWage: adjustedBaseWage,
        fairRate,
        lowRate,
        highRate,
        zipCode: cleanZip,
        region: regionData.region,
        msaName: regionData.msa,
      };
    });

    setAllResults(results);
    setIsLoading(false);
  };

  // Helper to detect state from ZIP prefix
  const detectStateFromZip = (zip: string): string | null => {
    const prefix = parseInt(zip.substring(0, 3));
    // ZIP prefix ranges by state
    if (prefix >= 100 && prefix <= 149) return 'NY';
    if (prefix >= 150 && prefix <= 196) return 'PA';
    if (prefix >= 197 && prefix <= 199) return 'DE';
    if (prefix >= 200 && prefix <= 205) return 'DC';
    if (prefix >= 206 && prefix <= 219) return 'MD';
    if (prefix >= 220 && prefix <= 246) return 'VA';
    if (prefix >= 247 && prefix <= 268) return 'WV';
    if (prefix >= 270 && prefix <= 289) return 'NC';
    if (prefix >= 290 && prefix <= 299) return 'SC';
    if (prefix >= 300 && prefix <= 319) return 'GA';
    if (prefix >= 320 && prefix <= 349) return 'FL';
    if (prefix >= 350 && prefix <= 369) return 'AL';
    if (prefix >= 370 && prefix <= 385) return 'TN';
    if (prefix >= 386 && prefix <= 397) return 'MS';
    if (prefix >= 400 && prefix <= 427) return 'KY';
    if (prefix >= 430 && prefix <= 459) return 'OH';
    if (prefix >= 460 && prefix <= 479) return 'IN';
    if (prefix >= 480 && prefix <= 499) return 'MI';
    if (prefix >= 500 && prefix <= 528) return 'IA';
    if (prefix >= 530 && prefix <= 549) return 'WI';
    if (prefix >= 550 && prefix <= 567) return 'MN';
    if (prefix >= 570 && prefix <= 577) return 'SD';
    if (prefix >= 580 && prefix <= 588) return 'ND';
    if (prefix >= 590 && prefix <= 599) return 'MT';
    if (prefix >= 600 && prefix <= 629) return 'IL';
    if (prefix >= 630 && prefix <= 658) return 'MO';
    if (prefix >= 660 && prefix <= 679) return 'KS';
    if (prefix >= 680 && prefix <= 693) return 'NE';
    if (prefix >= 700 && prefix <= 714) return 'LA';
    if (prefix >= 716 && prefix <= 729) return 'AR';
    if (prefix >= 730 && prefix <= 749) return 'OK';
    if (prefix >= 750 && prefix <= 799) return 'TX';
    if (prefix >= 800 && prefix <= 816) return 'CO';
    if (prefix >= 820 && prefix <= 831) return 'WY';
    if (prefix >= 832 && prefix <= 838) return 'ID';
    if (prefix >= 840 && prefix <= 847) return 'UT';
    if (prefix >= 850 && prefix <= 865) return 'AZ';
    if (prefix >= 870 && prefix <= 884) return 'NM';
    if (prefix >= 889 && prefix <= 898) return 'NV';
    if (prefix >= 900 && prefix <= 961) return 'CA';
    if (prefix >= 967 && prefix <= 968) return 'HI';
    if (prefix >= 970 && prefix <= 979) return 'OR';
    if (prefix >= 980 && prefix <= 994) return 'WA';
    if (prefix >= 995 && prefix <= 999) return 'AK';
    if (prefix >= 10 && prefix <= 69) return 'NJ';
    if (prefix >= 70 && prefix <= 89) return 'NJ';
    if (prefix >= 1 && prefix <= 9) return 'MA';
    if (prefix >= 10 && prefix <= 27) return 'MA';
    if (prefix >= 28 && prefix <= 29) return 'RI';
    if (prefix >= 30 && prefix <= 38) return 'NH';
    if (prefix >= 39 && prefix <= 49) return 'ME';
    if (prefix >= 50 && prefix <= 54) return 'VT';
    if (prefix >= 60 && prefix <= 69) return 'CT';
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <PageSEO
        title="Contractor Labor Rates by Trade and Location"
        description="Compare contractor labor rates by trade and ZIP code. See what electricians, plumbers, carpenters, and other tradespeople charge in your area based on BLS data."
        path="/labor-rates"
        keywords="contractor labor rates, electrician rates, plumber rates, carpenter rates, HVAC rates, construction labor costs"
      />
      <Header />

      {/* Hero Section */}
      <section className="pt-28 pb-16 px-4" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #d1fae5 100%)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-6" style={{ backgroundColor: '#1F9C4C', color: 'white' }}>
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Data-driven contractor rates</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4" style={{ color: '#333' }}>
            Labor Rate{' '}
            <span style={{ color: '#1F9C4C' }}>
              Lookup
            </span>
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: '#555' }}>
            Find fair contractor labor rates for your area. Compare what you're being quoted against local market rates.
          </p>
          
          {/* Inflation Badge */}
          {inflationFactor && inflationFactor > 1 && (
            <div className="mt-6 inline-flex items-center gap-2 bg-white/80 backdrop-blur rounded-full px-4 py-2 text-sm border border-emerald-200">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span style={{ color: '#555' }}>
                Rates adjusted <strong className="text-emerald-600">+{((inflationFactor - 1) * 100).toFixed(1)}%</strong> for 2025 inflation
                {inflationDate && <span className="text-gray-400 ml-1">• {inflationDate}</span>}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* ZIP Input Section */}
        <div className="max-w-md mx-auto mb-12">
          <div className="card-glass p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: '#333' }}>
              <MapPin className="w-5 h-5" style={{ color: '#1F9C4C' }} />
              Your Location
            </h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="Enter ZIP code"
                maxLength={5}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-lg"
                style={{ color: '#333' }}
                onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
              />
              <button
                onClick={() => handleLookup()}
                disabled={isLoading}
                className="px-6 py-3 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: '#1F9C4C' }}
                onMouseEnter={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#1a8a42')}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1F9C4C'}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
              </button>
            </div>
            {error && (
              <p className="text-red-500 text-sm mt-2">{error}</p>
            )}
          </div>
        </div>

        {/* Regional Multiplier Banner */}
        {regionalMultiplierData && allResults.length > 0 && (
          <div className="max-w-2xl mx-auto mb-8 p-4 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(31, 156, 76, 0.15)' }}>
                <Globe className="w-5 h-5" style={{ color: '#1F9C4C' }} />
              </div>
              <div className="text-center">
                <p className="font-medium" style={{ color: '#333' }}>
                  Rates for {regionalMultiplierData.name}
                </p>
                <p className="text-sm" style={{ color: '#555' }}>
                  <span className={`font-semibold ${regionalMultiplierData.multiplier >= 1 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {regionalMultiplierData.percentDiff}
                  </span>
                  {' '}vs national average
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Trade Carousel */}
        {allResults.length > 0 ? (
          <div className="relative">
            {/* Navigation Arrows */}
            <button
              onClick={() => scrollCarousel('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200 hidden md:flex"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <button
              onClick={() => scrollCarousel('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200 hidden md:flex"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-6 h-6 text-gray-600" />
            </button>

            {/* Carousel Container */}
            <div
              ref={carouselRef}
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {allResults.map((result, index) => {
                const tradeOption = TRADE_OPTIONS[index];
                const IconComponent = tradeOption?.icon || Wrench;
                
                return (
                  <div
                    key={result.trade}
                    className="flex-shrink-0 w-[calc(100%-16px)] sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)] snap-start"
                  >
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all h-full overflow-hidden">
                      {/* Card Header */}
                      <div className="p-4 border-b border-gray-100" style={{ backgroundColor: 'rgba(31, 156, 76, 0.05)' }}>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(31, 156, 76, 0.15)' }}>
                            <IconComponent className="w-6 h-6 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg" style={{ color: '#333' }}>{result.trade}</h3>
                            <p className="text-xs" style={{ color: '#666' }}>{result.tradeDescription}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Main Rate */}
                      <div className="p-5 text-center border-b border-gray-100">
                        <p className="text-xs uppercase tracking-wide mb-1" style={{ color: '#888' }}>Fair Rate</p>
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-4xl font-bold" style={{ color: '#1F9C4C' }}>${result.fairRate.toFixed(0)}</span>
                          <span className="text-lg" style={{ color: '#666' }}>/hr</span>
                        </div>
                      </div>
                      
                      {/* Rate Range */}
                      <div className="p-4">
                        <div className="flex justify-between items-center text-sm mb-2">
                          <span style={{ color: '#888' }}>Low</span>
                          <span style={{ color: '#888' }}>High</span>
                        </div>
                        <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                          <div 
                            className="absolute inset-y-0 bg-gradient-to-r from-emerald-300 via-emerald-500 to-emerald-300 rounded-full"
                            style={{ left: '15%', right: '15%' }}
                          />
                        </div>
                        <div className="flex justify-between text-sm font-medium">
                          <span style={{ color: '#555' }}>${result.lowRate.toFixed(0)}</span>
                          <span style={{ color: '#555' }}>${result.highRate.toFixed(0)}</span>
                        </div>
                        
                        {/* Base wage info */}
                        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs" style={{ color: '#888' }}>
                          <Info className="w-3.5 h-3.5" />
                          <span>BLS base: ${result.baseWage.toFixed(2)}/hr × 2.8</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Scroll hint for mobile */}
            <p className="text-center text-sm mt-4 md:hidden" style={{ color: '#888' }}>
              ← Swipe to see more trades →
            </p>
          </div>
        ) : (
          /* Empty State */
          <div className="max-w-md mx-auto">
            <div className="card-glass p-8 shadow-lg text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calculator className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#333' }}>Enter Your ZIP Code</h3>
              <p className="text-sm" style={{ color: '#555' }}>
                See fair contractor rates for all trades in your area, adjusted for local market conditions and inflation.
              </p>
            </div>
          </div>
        )}
        
        {/* Regional Insights */}
        {regionalInsights.length > 0 && detectedState && (
          <div className="mt-12 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(31, 156, 76, 0.15)' }}>
                <MapPin className="w-5 h-5" style={{ color: '#1F9C4C' }} />
              </div>
              <div>
                <h3 className="text-lg font-semibold" style={{ color: '#333' }}>
                  Regional Insights for {STATE_MULTIPLIERS[detectedState]?.name || detectedState}
                </h3>
                <p className="text-sm" style={{ color: '#555' }}>
                  Local considerations from community discussions
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              {regionalInsights.map((insight, index) => (
                <div 
                  key={index}
                  className={`rounded-xl border overflow-hidden transition-all ${
                    insight.severity === 'critical' ? 'border-red-200 bg-red-50' :
                    insight.severity === 'warning' ? 'border-amber-200 bg-amber-50' :
                    'border-gray-200 bg-white'
                  }`}
                >
                  <button
                    onClick={() => {
                      const newExpanded = new Set(expandedInsights);
                      if (newExpanded.has(index)) {
                        newExpanded.delete(index);
                      } else {
                        newExpanded.add(index);
                      }
                      setExpandedInsights(newExpanded);
                    }}
                    className="w-full p-4 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        insight.severity === 'critical' ? 'bg-red-500' :
                        insight.severity === 'warning' ? 'bg-amber-500' :
                        'bg-emerald-500'
                      }`} />
                      <span className="font-medium" style={{ color: '#333' }}>{insight.topic}</span>
                    </div>
                    {expandedInsights.has(index) ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  
                  {expandedInsights.has(index) && (
                    <div className="px-4 pb-4 space-y-3">
                      <p className="text-sm" style={{ color: '#555' }}>{insight.concern}</p>
                      <div className="p-3 rounded-lg bg-white/70 border border-gray-100">
                        <p className="text-sm" style={{ color: '#444' }}>
                          <strong>Community insight:</strong> {insight.redditTakeaway}
                        </p>
                      </div>
                      <div className="flex items-start gap-2 p-3 rounded-lg" style={{ backgroundColor: 'rgba(31, 156, 76, 0.1)' }}>
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#1F9C4C' }} />
                        <p className="text-sm" style={{ color: '#333' }}>
                          <strong>Ask your contractor:</strong> {insight.questionToAsk}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Educational Content Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-4" style={{ backgroundColor: 'rgba(31, 156, 76, 0.1)', color: '#1F9C4C' }}>
              Understanding Labor Costs
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold mb-4" style={{ color: '#333' }}>
              Why Your Contractor's Hourly Rate{' '}
              <span style={{ color: '#1F9C4C' }}>Isn't What You Think</span>
            </h2>
          </div>

          {/* Intro Story */}
          <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl p-6 sm:p-8 mb-10 border border-gray-200">
            <p className="text-lg leading-relaxed" style={{ color: '#444' }}>
              You finally decided to pull the trigger on that remodel. You look up the average hourly wage for a carpenter in your area, do some quick math—<em>"Okay, $35 an hour, times 40 hours… my labor costs should be about $1,400!"</em>
            </p>
            <p className="text-lg leading-relaxed mt-4" style={{ color: '#444' }}>
              Then the contractor's estimate arrives, and the labor line item is <strong>double or triple</strong> your calculation.
            </p>
            <div className="mt-6 p-4 rounded-xl bg-white border-l-4" style={{ borderColor: '#1F9C4C' }}>
              <p className="font-semibold" style={{ color: '#333' }}>Are you being ripped off? Probably not.</p>
              <p className="text-sm mt-1" style={{ color: '#555' }}>
                One of the most common mistakes homeowners make is confusing a tradesperson's <strong>base wage</strong> with a contractor's <strong>billable rate</strong>.
              </p>
            </div>
          </div>

          {/* What This Tool Shows */}
          <div className="mb-12">
            <p className="text-base leading-relaxed" style={{ color: '#555' }}>
              At RemodelerIQ, our Labor Rate Lookup Tool empowers you with localized, data-backed wage benchmarks sourced directly from the <strong>Bureau of Labor Statistics (BLS)</strong>. But to negotiate like a pro, you need to know how to interpret those numbers. Here is your guide to understanding your bid and why "Hours × Base Wage" will never equal your final price tag.
            </p>
          </div>

          {/* Numbered Sections */}
          <div className="space-y-8">
            {/* Section 1 */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 p-5 border-b border-gray-100" style={{ backgroundColor: 'rgba(31, 156, 76, 0.05)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: '#1F9C4C' }}>
                  1
                </div>
                <h3 className="text-lg font-semibold" style={{ color: '#333' }}>
                  Base Wage vs. Billable Rate (The "Multiplier" Effect)
                </h3>
              </div>
              <div className="p-5 sm:p-6">
                <p className="text-base leading-relaxed mb-5" style={{ color: '#555' }}>
                  The numbers you see in our lookup tool are the <strong>actual wages paid to the worker</strong>, tracked across 16 specific construction trades in over 45 metro areas. However, when a contracting business bills you for an hour of labor, they must apply a <strong>multiplier</strong> to that base wage to keep their doors open.
                </p>
                
                <div className="grid sm:grid-cols-2 gap-4 mb-5">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Building className="w-5 h-5" style={{ color: '#1F9C4C' }} />
                      <span className="font-medium" style={{ color: '#333' }}>Overhead Costs</span>
                    </div>
                    <p className="text-sm" style={{ color: '#555' }}>
                      State licensing, bonding, specialized tools, and transportation.
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="w-5 h-5" style={{ color: '#1F9C4C' }} />
                      <span className="font-medium" style={{ color: '#333' }}>Insurance Premiums</span>
                    </div>
                    <p className="text-sm" style={{ color: '#555' }}>
                      Up <strong>48% nationally</strong> over five years, with extreme spikes in climate-prone areas.
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5" style={{ color: '#1F9C4C' }} />
                      <span className="font-medium" style={{ color: '#333' }}>Taxes & Benefits</span>
                    </div>
                    <p className="text-sm" style={{ color: '#555' }}>
                      Worker's comp, payroll taxes, and employee benefits add up fast.
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5" style={{ color: '#1F9C4C' }} />
                      <span className="font-medium" style={{ color: '#333' }}>Margin & Profit</span>
                    </div>
                    <p className="text-sm" style={{ color: '#555' }}>
                      The necessary profit a business needs to survive and grow.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm" style={{ color: '#92400e' }}>
                    <strong>Red Flag:</strong> If a contractor bills you exactly at the BLS base wage, it often means they're uninsured, unlicensed, or operating under the table—leaving you financially exposed if someone gets hurt on your property.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2 */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 p-5 border-b border-gray-100" style={{ backgroundColor: 'rgba(31, 156, 76, 0.05)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: '#1F9C4C' }}>
                  2
                </div>
                <h3 className="text-lg font-semibold" style={{ color: '#333' }}>
                  The Skilled Labor Premium
                </h3>
              </div>
              <div className="p-5 sm:p-6">
                <p className="text-base leading-relaxed mb-4" style={{ color: '#555' }}>
                  The construction industry is facing a persistent, structural shortage of skilled labor—particularly for <strong>electricians, plumbers, and HVAC technicians</strong>. Because <strong>93% of renovating homeowners</strong> plan to hire professional help, this high demand forces contractors to increase wages to attract and retain qualified crews.
                </p>
                <div className="flex items-start gap-3 p-4 rounded-xl" style={{ backgroundColor: 'rgba(31, 156, 76, 0.08)' }}>
                  <Zap className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#1F9C4C' }} />
                  <p className="text-sm" style={{ color: '#333' }}>
                    <strong>Market insight:</strong> The push for home electrification (EV chargers, heat pumps) is keeping demand for electrical and HVAC trades at all-time highs.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 3 */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 p-5 border-b border-gray-100" style={{ backgroundColor: 'rgba(31, 156, 76, 0.05)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: '#1F9C4C' }}>
                  3
                </div>
                <h3 className="text-lg font-semibold" style={{ color: '#333' }}>
                  Project Complexity and Regional Hurdles
                </h3>
              </div>
              <div className="p-5 sm:p-6">
                <p className="text-base leading-relaxed mb-5" style={{ color: '#555' }}>
                  A straight hourly calculation completely ignores the logistical reality of your specific home and location. The total labor cost on your bid is heavily influenced by <strong>site conditions</strong>:
                </p>
                
                <div className="space-y-4">
                  <div className="flex gap-4 p-4 rounded-xl bg-slate-50">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(31, 156, 76, 0.15)' }}>
                      <Building className="w-6 h-6" style={{ color: '#1F9C4C' }} />
                    </div>
                    <div>
                      <p className="font-medium mb-1" style={{ color: '#333' }}>Vertical Logistics & Permits</p>
                      <p className="text-sm" style={{ color: '#555' }}>
                        In New York City, plumbing and electrical work is far more complex in high-rise structures, and pulling permits alone can add <strong>$2,000 to $5,000</strong> before a single wrench is turned.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 p-4 rounded-xl bg-slate-50">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(31, 156, 76, 0.15)' }}>
                      <HardHat className="w-6 h-6" style={{ color: '#1F9C4C' }} />
                    </div>
                    <div>
                      <p className="font-medium mb-1" style={{ color: '#333' }}>Structural Engineering</p>
                      <p className="text-sm" style={{ color: '#555' }}>
                        In Los Angeles, renovating on a hillside lot requires intense structural engineering and grading, which dramatically inflates labor time and costs.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4 */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 p-5 border-b border-gray-100" style={{ backgroundColor: 'rgba(31, 156, 76, 0.05)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: '#1F9C4C' }}>
                  4
                </div>
                <h3 className="text-lg font-semibold" style={{ color: '#333' }}>
                  Minimum Project Costs and Material Volatility
                </h3>
              </div>
              <div className="p-5 sm:p-6">
                <p className="text-base leading-relaxed mb-4" style={{ color: '#555' }}>
                  A bid is more than just labor. Contractors have <strong>minimum project costs</strong> just to mobilize their team and equipment. Furthermore, material prices remain volatile.
                </p>
                <p className="text-base leading-relaxed" style={{ color: '#555' }}>
                  While lumber has stabilized, the cost of <strong>copper, switchgear, and HVAC components</strong> remains elevated. Reputable contractors now build "escalation clauses" or slight buffers into their pricing to ensure a sudden spike in material costs doesn't wipe out their profit margin.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-12 rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #1F9C4C 0%, #15803d 100%)' }}>
            <div className="p-6 sm:p-8">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                How to Use RemodelerIQ to Protect Yourself
              </h3>
              <p className="text-emerald-100 mb-6">
                Looking up BLS wage data is the perfect first step to understanding the baseline market in your ZIP code. But when you're ready to evaluate a real estimate, you need to look at the <strong className="text-white">whole picture</strong>.
              </p>
              
              <div className="bg-white/10 backdrop-blur rounded-xl p-5 mb-6">
                <p className="text-white font-medium mb-4 flex items-center gap-2">
                  <ArrowRight className="w-5 h-5" />
                  Instead of guessing, upload your PDF estimate to our Bid Analysis Engine:
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-300 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-white font-medium">Price Realism Check</span>
                      <p className="text-emerald-100 text-sm">We compare your total bid against verified Houzz project cost benchmarks for 20+ remodel types.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-300 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-white font-medium">Lowball Detection</span>
                      <p className="text-emerald-100 text-sm">Our AI detects suspiciously low bids (e.g., a roofer at 70% below market) and flags the risk.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-300 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-white font-medium">Scope & Risk Analysis</span>
                      <p className="text-emerald-100 text-sm">We read the fine print to flag risky deposits (&gt;50% upfront) and vague language.</p>
                    </div>
                  </div>
                </div>
              </div>

              <Link
                to="/"
                className="inline-flex items-center gap-2 bg-white text-emerald-700 px-6 py-3 rounded-xl font-semibold hover:bg-emerald-50 transition-colors shadow-lg"
              >
                Analyze Your Bid
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Bottom Line */}
          <div className="mt-10 p-6 rounded-2xl border-2" style={{ borderColor: '#1F9C4C', backgroundColor: 'rgba(31, 156, 76, 0.05)' }}>
            <h4 className="font-bold text-lg mb-2" style={{ color: '#333' }}>The Bottom Line</h4>
            <p className="text-base leading-relaxed" style={{ color: '#555' }}>
              Use the Labor Rate Lookup Tool to educate yourself on your local market's baseline wages. Then, let the <strong>RemodelerIQ Bid Analysis Engine</strong> audit your specific contract to ensure you're paying a fair price for legitimate, protected, high-quality work.
            </p>
          </div>
        </div>
      </section>

      {/* Trusted Contractor Search */}
      <TrustedContractorSearch />

      {/* Related Pages */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <RelatedLinks currentPath="/labor-rates" />
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
