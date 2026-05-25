import { useMemo } from 'react';
import { MapPin, TrendingUp, TrendingDown, Minus, Info, Building2, Globe } from 'lucide-react';
import { ConfidenceIndicator, type ConfidenceLevel } from '@/react-app/components/ui/ConfidenceIndicator';

interface RegionalInsightCardProps {
  regionalMultiplier?: number;
  regionalName?: string;
  regionalSource?: 'msa' | 'state' | 'national' | 'zonda' | 'bls' | 'estimated';
  stateCode?: string;
  zipCode?: string;
  projectType?: string;
  isPremium?: boolean;
}

// Regional context descriptions
const REGION_CONTEXT: Record<string, { description: string; factors: string[] }> = {
  'New York': {
    description: 'NYC metro has the highest construction labor costs in the US',
    factors: ['Strong union presence', 'High cost of living', 'Strict building codes', 'Dense urban construction']
  },
  'San Francisco': {
    description: 'Bay Area has extreme construction costs driven by tech wealth',
    factors: ['Tech industry competition for labor', 'Seismic requirements', 'Limited contractor availability']
  },
  'Los Angeles': {
    description: 'SoCal has high costs due to demand and regulations',
    factors: ['Large market demand', 'Earthquake standards', 'Environmental regulations']
  },
  'Boston': {
    description: 'New England has moderate premium due to older housing stock',
    factors: ['Historic home requirements', 'Cold weather building specs', 'Skilled trade scarcity']
  },
  'Seattle': {
    description: 'Pacific Northwest has rising costs from tech growth',
    factors: ['Tech industry growth', 'Green building requirements', 'Labor shortages']
  },
  'Denver': {
    description: 'Mountain region sees moderate costs with growth pressure',
    factors: ['Rapid population growth', 'Altitude considerations', 'Energy efficiency focus']
  },
  'Miami': {
    description: 'South Florida has costs driven by hurricane requirements',
    factors: ['Hurricane-resistant construction', 'Coastal regulations', 'High seasonal demand']
  },
  'Atlanta': {
    description: 'Georgia offers competitive pricing with good availability',
    factors: ['Growing contractor base', 'Moderate regulations', 'Lower cost of living']
  },
  'Chicago': {
    description: 'Midwest hub with moderate union-influenced pricing',
    factors: ['Union market presence', 'Cold climate requirements', 'Established contractor base']
  },
  'Houston': {
    description: 'Texas offers competitive rates in a business-friendly market',
    factors: ['Non-union market', 'Lower regulations', 'Large contractor pool']
  },
  'Phoenix': {
    description: 'Arizona has competitive costs despite rapid growth',
    factors: ['Desert climate adaptations', 'Growing population', 'Moderate regulations']
  },
  'Birmingham': {
    description: 'Alabama offers some of the lowest construction costs nationally',
    factors: ['Lower cost of living', 'Non-union market', 'Moderate demand']
  }
};

// Get insight based on multiplier range
function getMultiplierInsight(multiplier: number): { 
  label: string; 
  color: string; 
  bgColor: string;
  icon: 'up' | 'down' | 'neutral';
  explanation: string;
} {
  if (multiplier >= 1.30) {
    return {
      label: 'Very High Cost Area',
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      icon: 'up',
      explanation: 'Expect to pay 30%+ more than national average. Budgets should account for premium labor rates.'
    };
  } else if (multiplier >= 1.15) {
    return {
      label: 'High Cost Area',
      color: 'text-orange-700',
      bgColor: 'bg-orange-50',
      icon: 'up',
      explanation: 'Expect to pay 15-30% more than national average. Compare multiple bids carefully.'
    };
  } else if (multiplier >= 1.05) {
    return {
      label: 'Above Average Cost',
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      icon: 'up',
      explanation: 'Slightly above national average. Pricing should be competitive within your metro area.'
    };
  } else if (multiplier >= 0.95) {
    return {
      label: 'Average Cost Area',
      color: 'text-slate-700',
      bgColor: 'bg-slate-50',
      icon: 'neutral',
      explanation: 'Close to national average pricing. Use national benchmarks as your reference point.'
    };
  } else if (multiplier >= 0.90) {
    return {
      label: 'Below Average Cost',
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      icon: 'down',
      explanation: 'Your area typically has 5-10% lower costs. A good deal nationally may be average here.'
    };
  } else {
    return {
      label: 'Low Cost Area',
      color: 'text-green-700',
      bgColor: 'bg-green-50',
      icon: 'down',
      explanation: 'Your area has notably lower construction costs. Bids should reflect this advantage.'
    };
  }
}

// Get data source display name
function getSourceDisplay(source?: string): { label: string; confidence: ConfidenceLevel } {
  switch (source) {
    case 'msa':
    case 'zonda':
      return { label: 'Metro-area data', confidence: 'high' };
    case 'state':
      return { label: 'State-level data', confidence: 'medium' };
    case 'bls':
      return { label: 'BLS wage data', confidence: 'medium' };
    case 'estimated':
      return { label: 'Estimated', confidence: 'low' };
    default:
      return { label: 'National baseline', confidence: 'low' };
  }
}

export default function RegionalInsightCard({
  regionalMultiplier,
  regionalName,
  regionalSource,
  stateCode: _stateCode,
  zipCode,
  isPremium = false
}: RegionalInsightCardProps) {
  // Don't render if no regional data
  if (!regionalMultiplier || regionalMultiplier === 1.0 || !regionalName) {
    return null;
  }

  const multiplierInsight = useMemo(() => getMultiplierInsight(regionalMultiplier), [regionalMultiplier]);
  const sourceDisplay = useMemo(() => getSourceDisplay(regionalSource), [regionalSource]);
  
  // Find matching regional context
  const regionContext = useMemo(() => {
    const regionKey = Object.keys(REGION_CONTEXT).find(key => 
      regionalName?.toLowerCase().includes(key.toLowerCase())
    );
    return regionKey ? REGION_CONTEXT[regionKey] : null;
  }, [regionalName]);

  const percentDiff = ((regionalMultiplier - 1) * 100);
  const percentDisplay = percentDiff > 0 ? `+${percentDiff.toFixed(0)}%` : `${percentDiff.toFixed(0)}%`;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 px-4 py-3 flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <MapPin className="w-5 h-5 text-blue-700" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Regional Cost Intelligence</h3>
          <p className="text-xs text-slate-400">How your location affects pricing</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Location & Multiplier Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-500" />
            <span className="font-medium text-slate-800">{regionalName}</span>
            {zipCode && (
              <span className="text-sm text-slate-500">({zipCode})</span>
            )}
          </div>
          <div className={`px-3 py-1.5 rounded-full ${multiplierInsight.bgColor} flex items-center gap-1.5`}>
            {multiplierInsight.icon === 'up' && <TrendingUp className={`w-4 h-4 ${multiplierInsight.color}`} />}
            {multiplierInsight.icon === 'down' && <TrendingDown className={`w-4 h-4 ${multiplierInsight.color}`} />}
            {multiplierInsight.icon === 'neutral' && <Minus className={`w-4 h-4 ${multiplierInsight.color}`} />}
            <span className={`text-sm font-semibold ${multiplierInsight.color}`}>
              {percentDisplay} vs National
            </span>
          </div>
        </div>

        {/* Cost Tier Label */}
        <div className={`p-3 rounded-lg ${multiplierInsight.bgColor} border ${multiplierInsight.color.replace('text-', 'border-')}/20`}>
          <div className="flex items-start gap-2">
            <Info className={`w-4 h-4 mt-0.5 ${multiplierInsight.color}`} />
            <div>
              <p className={`font-medium ${multiplierInsight.color}`}>{multiplierInsight.label}</p>
              <p className="text-sm text-slate-600 mt-1">{multiplierInsight.explanation}</p>
            </div>
          </div>
        </div>

        {/* Regional Context (if available) */}
        {regionContext && isPremium && (
          <div className="bg-slate-50 rounded-lg p-3 space-y-2">
            <p className="text-sm text-slate-700">{regionContext.description}</p>
            <div className="flex flex-wrap gap-1.5">
              {regionContext.factors.map((factor, idx) => (
                <span 
                  key={idx}
                  className="text-xs px-2 py-1 bg-white rounded-full border border-slate-200 text-slate-600"
                >
                  {factor}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Regional Comparison Scale */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Lowest Cost</span>
            <span>National Avg</span>
            <span>Highest Cost</span>
          </div>
          <div className="relative h-3 bg-gradient-to-r from-green-200 via-slate-200 to-red-200 rounded-full">
            {/* Position marker based on multiplier (0.80 to 1.50 scale) */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-800 rounded-full border-2 border-white shadow-md"
              style={{ 
                left: `${Math.min(Math.max(((regionalMultiplier - 0.80) / 0.70) * 100, 0), 100)}%`,
                transform: 'translate(-50%, -50%)'
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>-20%</span>
            <span>0%</span>
            <span>+50%</span>
          </div>
        </div>

        {/* What This Means */}
        <div className="pt-2 border-t border-slate-100">
          <h4 className="text-sm font-medium text-slate-700 mb-2">What This Means for Your Bid</h4>
          <ul className="space-y-1.5 text-sm text-slate-600">
            {regionalMultiplier > 1.0 ? (
              <>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Our market ranges are adjusted upward to reflect local costs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>A "fair" price here may look high compared to national guides</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Focus on comparing against local contractors, not national averages</span>
                </li>
              </>
            ) : (
              <>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-1">•</span>
                  <span>Our market ranges are adjusted to reflect your area's lower costs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-1">•</span>
                  <span>Be cautious of bids at "national average" prices—they may be inflated</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-1">•</span>
                  <span>Your dollar goes further here—expect competitive pricing</span>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Confidence Indicator & Source */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <ConfidenceIndicator 
            level={sourceDisplay.confidence}
            reason={`Based on ${sourceDisplay.label.toLowerCase()} for your area`}
            showDescription={true}
          />
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <Globe className="w-3 h-3" />
            <span>
              Source: Zonda Cost vs Value 2025, BLS OEWS
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
