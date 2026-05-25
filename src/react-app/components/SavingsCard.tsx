import { useMemo } from 'react';
import { 
  TrendingDown, 
  TrendingUp, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  Target,
  Sparkles
} from 'lucide-react';
import { 
  fetchMarketRates, 
  detectProjectCategory, 
  compareToMarket,
  getRegionForState,
  type MarketComparisonResult,
  type MarketRateCategory
} from '@/shared/marketRates';
import { extractBidTotal } from '@/shared/analysisEngine';

interface SavingsCardProps {
  bidContent: string;
  zipCode?: string;
  stateCode?: string;
}

interface LineItemAnalysis {
  name: string;
  bidAmount: number;
  marketAverage: number;
  percentAbove: number;
  isAboveThreshold: boolean;
}

export default function SavingsCard({ bidContent, zipCode, stateCode = 'GA' }: SavingsCardProps) {
  // Use provided ZIP code or generate a representative one from state code
  const effectiveZipCode = zipCode || getDefaultZipForState(stateCode);
  const analysis = useMemo(() => {
    const bidTotal = extractBidTotal(bidContent);
    const category = detectProjectCategory(bidContent);
    
    if (!bidTotal || !category) {
      return null;
    }
    
    const marketRate = fetchMarketRates(effectiveZipCode, category);
    if (!marketRate) {
      return null;
    }
    
    // Use state-based region when the ZIP isn't in our specific region mapping
    // Check if marketRate.region is the default "Atlanta Metro, GA" and we have a non-GA state
    const isDefaultAtlantaRegion = marketRate.region === 'Atlanta Metro, GA';
    const isNonGeorgiaState = stateCode && stateCode.toUpperCase() !== 'GA';
    const displayRegion = (isDefaultAtlantaRegion && isNonGeorgiaState) 
      ? getRegionForState(stateCode) 
      : marketRate.region;
    const adjustedMarketRate = { ...marketRate, region: displayRegion };
    
    const comparison = compareToMarket(bidTotal, marketRate);
    const lineItems = extractLineItems(bidContent, category, effectiveZipCode);
    
    return {
      bidTotal,
      category,
      marketRate: adjustedMarketRate,
      comparison,
      lineItems,
    };
  }, [bidContent, effectiveZipCode, zipCode, stateCode]);

  if (!analysis) {
    return null;
  }

  const { comparison, marketRate, lineItems } = analysis;
  const flaggedItems = lineItems.filter(item => item.isAboveThreshold);

  return (
    <div className="card-glass overflow-hidden shadow-lg border border-emerald-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-5 border-b border-emerald-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white shadow-sm">
              <Target className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-navy-900 flex items-center gap-2">
                Market Comparison
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Premium
                </span>
              </h3>
              <p className="text-sm text-navy-500">
                {marketRate.displayName} • {marketRate.region}
              </p>
            </div>
          </div>
          <StatusBadge status={comparison.status} />
        </div>
      </div>

      {/* Main Content */}
      <div className="p-5 space-y-6">
        {/* Price Comparison Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          <PriceCard 
            label="Your Bid"
            amount={comparison.bidAmount}
            sublabel="Total quoted price"
            variant="bid"
          />
          <PriceCard 
            label="Market Average"
            amount={comparison.marketAverage}
            sublabel={`${marketRate.unit}`}
            variant="market"
          />
        </div>

        {/* Gauge Chart */}
        <div className="bg-navy-50 rounded-2xl p-5">
          <p className="text-xs font-semibold text-navy-500 uppercase tracking-wider mb-4 text-center">
            Where Your Bid Falls
          </p>
          <GaugeChart 
            low={comparison.marketLow}
            average={comparison.marketAverage}
            high={comparison.marketHigh}
            bidAmount={comparison.bidAmount}
            status={comparison.status}
          />
        </div>

        {/* Savings/Overpayment Summary */}
        <SavingsSummary comparison={comparison} />

        {/* Flagged Line Items */}
        {flaggedItems.length > 0 && (
          <FlaggedLineItems items={flaggedItems} />
        )}

        {/* Market Range Info */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-emerald-50 rounded-xl p-3">
            <p className="text-xs text-navy-500 mb-1">Low</p>
            <p className="text-lg font-bold text-emerald-600">
              ${comparison.marketLow.toLocaleString()}
            </p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3">
            <p className="text-xs text-navy-500 mb-1">Average</p>
            <p className="text-lg font-bold text-blue-600">
              ${comparison.marketAverage.toLocaleString()}
            </p>
          </div>
          <div className="bg-teal-50 rounded-xl p-3">
            <p className="text-xs text-navy-500 mb-1">High</p>
            <p className="text-lg font-bold text-teal-600">
              ${comparison.marketHigh.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Data Source */}
        <p className="text-xs text-navy-400 text-center">
          Based on {marketRate.region} market data • Last updated {marketRate.lastUpdated}
        </p>
      </div>
    </div>
  );
}

/**
 * Visual gauge chart showing bid position relative to market range
 */
function GaugeChart({ 
  low, 
  average, 
  high, 
  bidAmount,
  status 
}: { 
  low: number; 
  average: number; 
  high: number; 
  bidAmount: number;
  status: MarketComparisonResult['status'];
}) {
  // Calculate the range with some padding
  const padding = (high - low) * 0.2;
  const minValue = Math.max(0, low - padding);
  const maxValue = high + padding;
  const range = maxValue - minValue;
  
  // Calculate positions as percentages
  const lowPos = ((low - minValue) / range) * 100;
  const avgPos = ((average - minValue) / range) * 100;
  const highPos = ((high - minValue) / range) * 100;
  const bidPos = Math.min(98, Math.max(2, ((bidAmount - minValue) / range) * 100));
  
  // Determine bid indicator color
  const bidColor = status === 'below-market' 
    ? 'bg-emerald-500 shadow-emerald-500/50'
    : status === 'fair'
      ? 'bg-blue-500 shadow-blue-500/50'
      : status === 'above-market'
        ? 'bg-teal-500 shadow-teal-500/50'
        : 'bg-red-500 shadow-red-500/50';

  return (
    <div className="relative pt-8 pb-4">
      {/* Bid Amount Label - Above the gauge */}
      <div 
        className="absolute -top-1 transform -translate-x-1/2 text-center z-10"
        style={{ left: `${bidPos}%` }}
      >
        <div className={`px-3 py-1.5 rounded-lg text-white text-sm font-bold shadow-lg ${
          status === 'below-market' ? 'bg-emerald-500'
          : status === 'fair' ? 'bg-blue-500'
          : status === 'above-market' ? 'bg-teal-500'
          : 'bg-red-500'
        }`}>
          ${bidAmount.toLocaleString()}
        </div>
        <div className={`w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] mx-auto ${
          status === 'below-market' ? 'border-t-emerald-500'
          : status === 'fair' ? 'border-t-blue-500'
          : status === 'above-market' ? 'border-t-teal-500'
          : 'border-t-red-500'
        } border-l-transparent border-r-transparent`} />
      </div>

      {/* Gauge Track */}
      <div className="relative h-4 rounded-full overflow-hidden bg-navy-200">
        {/* Gradient Background */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to right, 
              #10b981 0%, 
              #10b981 ${lowPos}%, 
              #3b82f6 ${lowPos}%, 
              #3b82f6 ${avgPos}%, 
              #14b8a6 ${avgPos}%, 
              #14b8a6 ${highPos}%, 
              #ef4444 ${highPos}%, 
              #ef4444 100%
            )`,
          }}
        />
        
        {/* Bid Position Indicator */}
        <div 
          className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-3 border-white shadow-lg ${bidColor}`}
          style={{ left: `${bidPos}%`, transform: 'translate(-50%, -50%)' }}
        />
      </div>

      {/* Range Labels */}
      <div className="flex justify-between mt-2 text-xs text-navy-500">
        <span>${minValue.toLocaleString()}</span>
        <span>${maxValue.toLocaleString()}</span>
      </div>

      {/* Zone Labels */}
      <div className="flex justify-between mt-4 px-2">
        <div className="text-center">
          <div className="w-3 h-3 rounded-full bg-emerald-500 mx-auto mb-1" />
          <p className="text-xs text-navy-600 font-medium">Below Market</p>
        </div>
        <div className="text-center">
          <div className="w-3 h-3 rounded-full bg-blue-500 mx-auto mb-1" />
          <p className="text-xs text-navy-600 font-medium">Fair</p>
        </div>
        <div className="text-center">
          <div className="w-3 h-3 rounded-full bg-teal-500 mx-auto mb-1" />
          <p className="text-xs text-navy-600 font-medium">Above Market</p>
        </div>
        <div className="text-center">
          <div className="w-3 h-3 rounded-full bg-red-500 mx-auto mb-1" />
          <p className="text-xs text-navy-600 font-medium">High</p>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: MarketComparisonResult['status'] }) {
  const config = {
    'below-market': {
      bg: 'bg-emerald-100',
      text: 'text-emerald-700',
      icon: <TrendingDown className="w-4 h-4" />,
      label: 'Below Market',
    },
    'fair': {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      icon: <CheckCircle className="w-4 h-4" />,
      label: 'Fair Price',
    },
    'above-market': {
      bg: 'bg-teal-100',
      text: 'text-teal-700',
      icon: <TrendingUp className="w-4 h-4" />,
      label: 'Above Market',
    },
    'significantly-above': {
      bg: 'bg-red-100',
      text: 'text-red-700',
      icon: <AlertTriangle className="w-4 h-4" />,
      label: 'Significantly Above',
    },
  };

  const c = config[status];

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${c.bg} ${c.text}`}>
      {c.icon}
      <span className="text-sm font-semibold">{c.label}</span>
    </div>
  );
}

function PriceCard({ 
  label, 
  amount, 
  sublabel,
  variant 
}: { 
  label: string; 
  amount: number; 
  sublabel: string;
  variant: 'bid' | 'market';
}) {
  const isMarket = variant === 'market';
  
  return (
    <div className={`rounded-xl p-4 ${
      isMarket 
        ? 'bg-blue-50 border border-blue-100' 
        : 'bg-navy-50 border border-navy-100'
    }`}>
      <div className="flex items-center gap-2 mb-1">
        <DollarSign className={`w-4 h-4 ${isMarket ? 'text-blue-600' : 'text-navy-600'}`} />
        <span className={`text-sm font-medium ${isMarket ? 'text-blue-700' : 'text-navy-700'}`}>
          {label}
        </span>
      </div>
      <p className="text-3xl font-bold text-navy-900">
        ${amount.toLocaleString()}
      </p>
      <p className="text-xs text-navy-500 mt-1">{sublabel}</p>
    </div>
  );
}

function SavingsSummary({ comparison }: { comparison: MarketComparisonResult }) {
  const { status, percentDifference, savingsPotential, bidAmount, marketAverage } = comparison;
  
  if (status === 'below-market') {
    const savings = marketAverage - bidAmount;
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-100">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="font-semibold text-emerald-800">Great Deal!</p>
            <p className="text-sm text-emerald-700">
              This bid is <strong>${savings.toLocaleString()}</strong> below the market average 
              ({Math.abs(percentDifference)}% under). You're getting a competitive price.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  if (status === 'fair') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-100">
            <CheckCircle className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-blue-800">Fair Market Price</p>
            <p className="text-sm text-blue-700">
              This bid is within {Math.abs(percentDifference)}% of the market average. 
              This appears to be a reasonable, competitive quote.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Above market or significantly above
  return (
    <div className={`rounded-xl p-4 ${
      status === 'significantly-above' 
        ? 'bg-red-50 border border-red-200'
        : 'bg-teal-50 border border-teal-200'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${
          status === 'significantly-above' ? 'bg-red-100' : 'bg-teal-100'
        }`}>
          <TrendingUp className={`w-5 h-5 ${
            status === 'significantly-above' ? 'text-red-600' : 'text-teal-600'
          }`} />
        </div>
        <div>
          <p className={`font-semibold ${
            status === 'significantly-above' ? 'text-red-800' : 'text-teal-800'
          }`}>
            Potential Savings: ${savingsPotential.toLocaleString()}
          </p>
          <p className={`text-sm ${
            status === 'significantly-above' ? 'text-red-700' : 'text-teal-700'
          }`}>
            This bid is <strong>{percentDifference}% above</strong> the market average. 
            Consider negotiating or getting additional quotes.
          </p>
        </div>
      </div>
    </div>
  );
}

function FlaggedLineItems({ items }: { items: LineItemAnalysis[] }) {
  return (
    <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-teal-600" />
        <h4 className="font-semibold text-teal-800">
          Items Above Market ({items.length})
        </h4>
      </div>
      <p className="text-sm text-teal-700 mb-3">
        These line items are more than 15% above the typical market rate:
      </p>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div 
            key={idx}
            className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border-l-4 border-teal-400"
          >
            <span className="text-sm text-navy-700 font-medium">{item.name}</span>
            <div className="text-right">
              <span className="text-sm font-bold text-teal-600">
                +{item.percentAbove}%
              </span>
              <span className="text-xs text-navy-500 ml-2">
                (${item.bidAmount.toLocaleString()} vs ${item.marketAverage.toLocaleString()})
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Extract and analyze line items from bid text
 * This is a simplified extraction - in production, use more sophisticated parsing
 */
function extractLineItems(
  bidContent: string, 
  category: MarketRateCategory,
  zipCode: string
): LineItemAnalysis[] {
  const items: LineItemAnalysis[] = [];
  
  // Common line item patterns with typical market percentages
  const lineItemPatterns: Record<MarketRateCategory, Array<{ pattern: RegExp; name: string; marketPct: number }>> = {
    'bathroom-remodel': [
      { pattern: /demolition[:\s]*\$?([\d,]+)/i, name: 'Demolition', marketPct: 8 },
      { pattern: /plumbing[:\s]*\$?([\d,]+)/i, name: 'Plumbing', marketPct: 20 },
      { pattern: /electrical[:\s]*\$?([\d,]+)/i, name: 'Electrical', marketPct: 10 },
      { pattern: /tile[:\s]*\$?([\d,]+)/i, name: 'Tile Work', marketPct: 18 },
      { pattern: /vanity[:\s]*\$?([\d,]+)/i, name: 'Vanity Install', marketPct: 12 },
      { pattern: /fixtures?[:\s]*\$?([\d,]+)/i, name: 'Fixtures', marketPct: 15 },
      { pattern: /labor[:\s]*\$?([\d,]+)/i, name: 'Labor', marketPct: 35 },
    ],
    'kitchen-remodel': [
      { pattern: /cabinet[s]?[:\s]*\$?([\d,]+)/i, name: 'Cabinets', marketPct: 30 },
      { pattern: /countertop[s]?[:\s]*\$?([\d,]+)/i, name: 'Countertops', marketPct: 15 },
      { pattern: /appliance[s]?[:\s]*\$?([\d,]+)/i, name: 'Appliances', marketPct: 20 },
      { pattern: /plumbing[:\s]*\$?([\d,]+)/i, name: 'Plumbing', marketPct: 8 },
      { pattern: /electrical[:\s]*\$?([\d,]+)/i, name: 'Electrical', marketPct: 7 },
      { pattern: /flooring[:\s]*\$?([\d,]+)/i, name: 'Flooring', marketPct: 10 },
      { pattern: /labor[:\s]*\$?([\d,]+)/i, name: 'Labor', marketPct: 30 },
    ],
    'deck-construction': [
      { pattern: /material[s]?[:\s]*\$?([\d,]+)/i, name: 'Materials', marketPct: 40 },
      { pattern: /lumber[:\s]*\$?([\d,]+)/i, name: 'Lumber', marketPct: 35 },
      { pattern: /hardware[:\s]*\$?([\d,]+)/i, name: 'Hardware', marketPct: 8 },
      { pattern: /labor[:\s]*\$?([\d,]+)/i, name: 'Labor', marketPct: 45 },
      { pattern: /permit[s]?[:\s]*\$?([\d,]+)/i, name: 'Permits', marketPct: 3 },
    ],
    'roofing': [
      { pattern: /shingle[s]?[:\s]*\$?([\d,]+)/i, name: 'Shingles', marketPct: 35 },
      { pattern: /underlayment[:\s]*\$?([\d,]+)/i, name: 'Underlayment', marketPct: 8 },
      { pattern: /labor[:\s]*\$?([\d,]+)/i, name: 'Labor', marketPct: 45 },
      { pattern: /disposal[:\s]*\$?([\d,]+)/i, name: 'Disposal', marketPct: 5 },
    ],
    'flooring-hardwood': [],
    'flooring-tile': [],
    'flooring-carpet': [],
    'painting-interior': [
      { pattern: /paint[:\s]*\$?([\d,]+)/i, name: 'Paint Materials', marketPct: 20 },
      { pattern: /prep[:\s]*\$?([\d,]+)/i, name: 'Surface Prep', marketPct: 15 },
      { pattern: /labor[:\s]*\$?([\d,]+)/i, name: 'Labor', marketPct: 60 },
    ],
    'painting-exterior': [
      { pattern: /paint[:\s]*\$?([\d,]+)/i, name: 'Paint Materials', marketPct: 25 },
      { pattern: /prep[:\s]*\$?([\d,]+)/i, name: 'Surface Prep', marketPct: 20 },
      { pattern: /labor[:\s]*\$?([\d,]+)/i, name: 'Labor', marketPct: 50 },
    ],
    'hvac': [
      { pattern: /equipment[:\s]*\$?([\d,]+)/i, name: 'Equipment', marketPct: 50 },
      { pattern: /labor[:\s]*\$?([\d,]+)/i, name: 'Labor', marketPct: 35 },
      { pattern: /ductwork[:\s]*\$?([\d,]+)/i, name: 'Ductwork', marketPct: 10 },
    ],
    'windows': [],
    'siding': [],
    'basement-finishing': [],
    'addition': [],
    'electrical-panel': [],
    'plumbing': [],
  };
  
  const patterns = lineItemPatterns[category] || [];
  const marketRate = fetchMarketRates(zipCode, category);
  
  if (!marketRate) return items;
  
  for (const { pattern, name, marketPct } of patterns) {
    const match = bidContent.match(pattern);
    if (match && match[1]) {
      const bidAmount = parseInt(match[1].replace(/,/g, ''), 10);
      const marketAverage = Math.round(marketRate.priceRange.average * (marketPct / 100));
      const percentAbove = Math.round(((bidAmount - marketAverage) / marketAverage) * 100);
      
      if (!isNaN(bidAmount) && bidAmount > 0) {
        items.push({
          name,
          bidAmount,
          marketAverage,
          percentAbove,
          isAboveThreshold: percentAbove > 15,
        });
      }
    }
  }
  
  return items;
}

/**
 * Get a representative ZIP code for a state (used for market rate lookup)
 * These are major metro area ZIPs that provide reasonable baseline data
 */
function getDefaultZipForState(stateCode: string): string {
  const stateZips: Record<string, string> = {
    'AL': '35203', // Birmingham
    'AK': '99501', // Anchorage
    'AZ': '85004', // Phoenix
    'AR': '72201', // Little Rock
    'CA': '90001', // Los Angeles
    'CO': '80202', // Denver
    'CT': '06103', // Hartford
    'DE': '19801', // Wilmington
    'DC': '20001', // Washington DC
    'FL': '33101', // Miami
    'GA': '30303', // Atlanta
    'HI': '96801', // Honolulu
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
    'MI': '48226', // Detroit
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
    'NC': '27601', // Raleigh
    'ND': '58102', // Fargo
    'OH': '43215', // Columbus
    'OK': '73102', // Oklahoma City
    'OR': '97201', // Portland
    'PA': '19103', // Philadelphia
    'RI': '02903', // Providence
    'SC': '29201', // Columbia
    'SD': '57101', // Sioux Falls
    'TN': '37203', // Nashville
    'TX': '77001', // Houston
    'UT': '84101', // Salt Lake City
    'VT': '05401', // Burlington
    'VA': '23219', // Richmond
    'WA': '98101', // Seattle
    'WV': '25301', // Charleston
    'WI': '53202', // Milwaukee
    'WY': '82001', // Cheyenne
  };
  return stateZips[stateCode.toUpperCase()] || '30303'; // Default to Atlanta if unknown
}
