// =============================================================================
// BLIND BID NOTICE COMPONENT
// Displays benchmark analysis for bids without square footage
// =============================================================================

import { AlertTriangle, CheckCircle, XCircle, Info, TrendingUp, TrendingDown, MapPin, Hammer, DollarSign, Building2, Database } from 'lucide-react';
import type { BlindBidAnalysis } from '@/shared/blindBidEngine';
import { PREMIUM_MODE_ENABLED } from '@/shared/featureFlags';

interface BlindBidNoticeProps {
  analysis: BlindBidAnalysis;
  isPremium?: boolean;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatPercent = (value: number): string => {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(0)}%`;
};

export function BlindBidNotice({ analysis, isPremium = false }: BlindBidNoticeProps) {
  if (!analysis.isBlindBid) {
    return null;
  }

  const getVarianceColor = () => {
    switch (analysis.varianceFlag) {
      case 'green': return 'text-emerald-600';
      case 'yellow': return 'text-amber-600';
      case 'red': return 'text-red-600';
      default: return 'text-slate-600';
    }
  };

  const getVarianceBgColor = () => {
    switch (analysis.varianceFlag) {
      case 'green': return 'bg-emerald-50 border-emerald-200';
      case 'yellow': return 'bg-amber-50 border-amber-200';
      case 'red': return 'bg-red-50 border-red-200';
      default: return 'bg-slate-50 border-slate-200';
    }
  };

  const getRecommendationStyle = () => {
    // Check if bid is below market (negative variance)
    const isBelowMarket = analysis.variancePercent < -15;
    
    switch (analysis.recommendation) {
      case 'accept':
        // If significantly below market, show caution instead of pure acceptance
        if (analysis.variancePercent < -25) {
          return {
            bg: 'bg-amber-100',
            text: 'text-amber-800',
            icon: AlertTriangle,
            label: 'Proceed with Caution — Verify Scope'
          };
        }
        return {
          bg: 'bg-emerald-100',
          text: 'text-emerald-800',
          icon: CheckCircle,
          label: 'Good Deal — Consider Accepting'
        };
      case 'negotiate':
        // Only show "Target X" if there's an actual amount AND bid is above market
        if (analysis.negotiateAmount && analysis.negotiateAmount > 0) {
          return {
            bg: 'bg-amber-100',
            text: 'text-amber-800',
            icon: TrendingDown,
            label: `Negotiate — Target ${formatCurrency(analysis.negotiateAmount)} Savings`
          };
        }
        return {
          bg: 'bg-amber-100',
          text: 'text-amber-800',
          icon: Info,
          label: 'Review Carefully — Consider Other Quotes'
        };
      case 'reject':
        // Different messaging for below-market vs above-market rejects
        if (isBelowMarket) {
          return {
            bg: 'bg-red-100',
            text: 'text-red-800',
            icon: AlertTriangle,
            label: 'Too Low — May Be Missing Scope'
          };
        }
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          icon: XCircle,
          label: 'High Risk — Get Other Quotes'
        };
      default:
        return {
          bg: 'bg-slate-100',
          text: 'text-slate-800',
          icon: Info,
          label: 'Review Carefully'
        };
    }
  };

  const recommendation = getRecommendationStyle();
  const RecommendationIcon = recommendation.icon;

  const tierLabels: Record<string, string> = {
    builder: 'Builder Grade',
    midrange: 'Midrange',
    upscale: 'Upscale',
    premium: 'Premium/Luxury'
  };

  const projectTypeLabels: Record<string, string> = {
    kitchen: 'Kitchen Remodel',
    bathroom: 'Bathroom Remodel',
    basement: 'Basement Finishing',
    general: 'General Remodel'
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-black px-5 py-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-white font-semibold">Blind Bid Analysis</h3>
          <p className="text-gray-400 text-sm">No square footage provided — using benchmark pricing</p>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Project Info Row */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-sm">
            <Building2 className="w-4 h-4 text-slate-500" />
            <span className="text-slate-700">{projectTypeLabels[analysis.projectType] || 'Remodel'}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-sm">
            <MapPin className="w-4 h-4 text-slate-500" />
            <span className="text-slate-700">{analysis.city} (Tier {analysis.cityTier})</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 rounded-full text-sm">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span className="text-emerald-700">{tierLabels[analysis.detectedTier] || 'Standard'}</span>
          </div>
        </div>

        {/* Price Comparison */}
        <div className={`rounded-lg border p-4 ${getVarianceBgColor()}`}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-600">Your Bid</span>
            <div className="text-right">
              <span className="text-2xl font-bold text-slate-900">{formatCurrency(analysis.submittedBid)}</span>
              <span className={`ml-2 text-sm font-medium ${getVarianceColor()}`}>
                {formatPercent(analysis.variancePercent)} vs market
              </span>
            </div>
          </div>

          {/* Fair Range Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Budget</span>
              <span>Standard</span>
              <span>Premium</span>
            </div>
            <div className="relative h-8 bg-gradient-to-r from-emerald-200 via-amber-200 to-red-200 rounded-lg overflow-hidden">
              {/* Position marker for submitted bid */}
              {(() => {
                const range = analysis.fairBidRange.high - analysis.fairBidRange.low;
                const position = Math.max(0, Math.min(100, 
                  ((analysis.submittedBid - analysis.fairBidRange.low) / range) * 100
                ));
                return (
                  <div 
                    className="absolute top-0 bottom-0 w-1 bg-slate-900 rounded"
                    style={{ left: `${position}%` }}
                  >
                    <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rounded-full border-2 border-white" />
                  </div>
                );
              })()}
            </div>
            <div className="flex justify-between text-xs font-medium text-slate-600">
              <span>{formatCurrency(analysis.fairBidRange.low)}</span>
              <span>{formatCurrency(analysis.fairBidRange.mid)}</span>
              <span>{formatCurrency(analysis.fairBidRange.high)}</span>
            </div>
          </div>
        </div>

        {/* Recommendation Banner */}
        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg ${recommendation.bg}`}>
          <RecommendationIcon className={`w-5 h-5 ${recommendation.text}`} />
          <span className={`font-medium ${recommendation.text}`}>{recommendation.label}</span>
        </div>

        {/* Premium Details */}
        {isPremium && (
          <>
            {/* Structural Add-ons */}
            {analysis.structuralItems.length > 0 && (
              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Hammer className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">Structural Add-ons Detected</span>
                </div>
                <div className="space-y-2">
                  {analysis.structuralItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-slate-600">{item.label}</span>
                      <span className="font-medium text-slate-800">+{formatCurrency(item.cost)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm pt-2 border-t border-slate-100">
                    <span className="font-medium text-slate-700">Total Add-ons</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(analysis.structuralAddOns)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Benchmark Breakdown */}
            <div className="border-t border-slate-200 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Benchmark Breakdown</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 rounded-lg p-3">
                  <span className="text-slate-500 text-xs">Base Benchmark</span>
                  <p className="font-medium text-slate-800">
                    {formatCurrency(analysis.benchmarkBreakdown.baseBenchmark.low)} - {formatCurrency(analysis.benchmarkBreakdown.baseBenchmark.high)}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <span className="text-slate-500 text-xs">Quality Tier Multiplier</span>
                  <p className="font-medium text-slate-800">{analysis.benchmarkBreakdown.tierMultiplier.toFixed(2)}x</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <span className="text-slate-500 text-xs">City Adjustment</span>
                  <p className="font-medium text-slate-800">{analysis.benchmarkBreakdown.cityMultiplierUsed.toFixed(2)}x</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <span className="text-slate-500 text-xs">Labor / Materials</span>
                  <p className="font-medium text-slate-800">
                    {analysis.benchmarkBreakdown.laborPercent}% / {analysis.benchmarkBreakdown.materialsPercent}%
                  </p>
                </div>
              </div>
            </div>

            {/* Flags */}
            {analysis.flags.length > 0 && (
              <div className="border-t border-slate-200 pt-4">
                <div className="space-y-2">
                  {analysis.flags.map((flag, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-start gap-2 text-sm px-3 py-2 rounded-lg ${
                        flag.type === 'red' ? 'bg-red-50 text-red-700' :
                        flag.type === 'yellow' ? 'bg-amber-50 text-amber-700' :
                        'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {flag.type === 'red' ? <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> :
                       flag.type === 'yellow' ? <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" /> :
                       <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                      <span>{flag.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Non-premium teaser - only show when premium mode is enabled */}
        {PREMIUM_MODE_ENABLED && !isPremium && (
          <div className="border-t border-slate-200 pt-4">
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <p className="text-sm text-slate-600">
                Upgrade to Premium for detailed benchmark breakdown, structural add-on detection, and scope analysis.
              </p>
            </div>
          </div>
        )}

        {/* Data source */}
        <div className="pt-3 border-t border-slate-100">
          <div className="text-xs text-slate-400 text-center mb-2">
            Confidence: {analysis.confidence}
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <Database className="w-3 h-3" />
            <span>
              Source:{' '}
              <a 
                href="https://www.jlconline.com/how-to/zonda-cost-vs-value"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-500 hover:text-emerald-600 transition-colors"
              >
                Zonda Cost vs Value 2025
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BlindBidNotice;
