/**
 * Trade-Aware Market Analysis Component
 * 
 * Shows appropriate benchmarks based on detected trade type.
 * Hides when we can't provide meaningful benchmarks.
 */

import { useMemo } from 'react';
import { 
  Gauge, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp,
  Info,
  HelpCircle,
  Ruler,
  DollarSign
} from 'lucide-react';
import { detectProjectTrade, type TradeDetectionResult } from '@/shared/tradeDetection';
import { 
  analyzeBidWithTradeBenchmark,
  getBenchmarkLabel,
  type TradeBenchmark
} from '@/shared/tradeBenchmarks';

interface TradeAwareAnalysisProps {
  bidContent: string;
  bidTotal: number;
  squareFootage: number | null;
  cityName?: string;
}

export default function TradeAwareAnalysis({ 
  bidContent, 
  bidTotal, 
  squareFootage,
  cityName = 'Your Area'
}: TradeAwareAnalysisProps) {
  // Detect trade type
  const tradeDetection = useMemo(() => detectProjectTrade(bidContent), [bidContent]);
  
  // Get benchmark and analysis
  const benchmarkAnalysis = useMemo(() => {
    return analyzeBidWithTradeBenchmark(tradeDetection, bidTotal, squareFootage);
  }, [tradeDetection, bidTotal, squareFootage]);
  
  const { benchmark, analysis, trade } = benchmarkAnalysis;
  
  // Don't show anything if we can't provide meaningful benchmarks
  if (!benchmark.hasBenchmark) {
    return null;
  }
  
  const bidPSF = squareFootage && squareFootage > 0 ? bidTotal / squareFootage : null;
  
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-5 bg-gradient-to-r from-emerald-50 via-white to-blue-50 border-b border-gray-100">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white shadow-sm border border-gray-200">
              <Gauge className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Market Analysis
              </h3>
              <p className="text-sm text-gray-500">
                {trade.displayName} • {cityName}
              </p>
            </div>
          </div>
          
          {/* Trade Type Badge */}
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              trade.confidence === 'high' 
                ? 'bg-emerald-100 text-emerald-700'
                : trade.confidence === 'medium'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600'
            }`}>
              {trade.confidence === 'high' ? 'High confidence' : 
               trade.confidence === 'medium' ? 'Medium confidence' : 'Low confidence'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-5">
        {/* Bid Summary Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-600">Your Bid</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ${bidTotal.toLocaleString()}
            </p>
            {bidPSF && (
              <p className="text-sm text-gray-500 mt-1">
                ${bidPSF.toFixed(2)}/sq ft
              </p>
            )}
          </div>
          
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
            <div className="flex items-center gap-2 mb-1">
              <Ruler className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">Typical Range</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {getBenchmarkLabel(benchmark)}
            </p>
            <p className="text-xs text-emerald-600 mt-1">
              {benchmark.description}
            </p>
          </div>
        </div>

        {/* Benchmark Gauge */}
        {benchmark.display.primaryMetric === 'psf' && benchmark.psfRange && (
          <TradeBenchmarkGauge 
            benchmark={benchmark}
            bidPSF={bidPSF}
            trade={trade}
          />
        )}
        
        {benchmark.display.primaryMetric === 'per-project' && benchmark.perProjectRange && (
          <ProjectBenchmarkGauge
            benchmark={benchmark}
            bidTotal={bidTotal}
            trade={trade}
          />
        )}

        {/* Status Message */}
        {analysis && (
          <StatusMessage 
            status={analysis.status}
            message={analysis.statusMessage}
          />
        )}
        
        {/* Missing Square Footage Warning */}
        {!bidPSF && benchmark.display.primaryMetric === 'psf' && (
          <div className="mt-4 p-4 bg-teal-50 rounded-xl border border-teal-200">
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-teal-800">Square footage needed</p>
                <p className="text-sm text-teal-700 mt-1">
                  Add square footage in the Project Data section to see how this {trade.displayName.toLowerCase()} bid compares to typical market rates.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer with benchmark source */}
      <div className="px-5 pb-4">
        <p className="text-xs text-gray-400 text-center">
          Benchmarks: {benchmark.source}
        </p>
      </div>
    </div>
  );
}

/**
 * Trade-specific benchmark gauge for PSF pricing
 */
function TradeBenchmarkGauge({ 
  benchmark, 
  bidPSF,
  trade 
}: { 
  benchmark: TradeBenchmark;
  bidPSF: number | null;
  trade: TradeDetectionResult;
}) {
  if (!benchmark.psfRange) return null;
  
  const { low, mid, high } = benchmark.psfRange;
  
  // Extend range for display
  const displayMin = low * 0.6;
  const displayMax = high * 1.4;
  const range = displayMax - displayMin;
  
  // Calculate positions as percentages
  const lowPos = ((low - displayMin) / range) * 100;
  const midPos = ((mid - displayMin) / range) * 100;
  const highPos = ((high - displayMin) / range) * 100;
  
  // Bid position
  let bidPos = midPos; // Default to middle if no PSF
  if (bidPSF !== null) {
    bidPos = Math.min(95, Math.max(5, ((bidPSF - displayMin) / range) * 100));
  }
  
  // Determine bid tier
  const getBidTier = () => {
    if (!bidPSF) return 'unknown';
    if (bidPSF < low * 0.8) return 'below';
    if (bidPSF <= high * 1.1) return 'fair';
    return 'above';
  };
  
  const bidTier = getBidTier();
  const tierColors = {
    below: 'border-teal-400 bg-teal-50',
    fair: 'border-brand-400 bg-brand-50',
    above: 'border-green-400 bg-green-50',
    unknown: 'border-gray-300 bg-gray-50',
  };

  return (
    <div className="mb-6">
      {/* Floating Bid Indicator */}
      {bidPSF && (
        <div className="relative mb-4">
          <div 
            className="absolute transform -translate-x-1/2 z-10"
            style={{ left: `${bidPos}%` }}
          >
            <div className={`px-4 py-2 rounded-xl border-2 shadow-md ${tierColors[bidTier]}`}>
              <p className="text-xs font-medium text-gray-600 text-center">Your Bid</p>
              <p className="text-xl font-bold text-gray-900 text-center">
                ${bidPSF.toFixed(2)}/sf
              </p>
              {/* Arrow */}
              <div className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3 h-3 rotate-45 border-r-2 border-b-2 ${tierColors[bidTier]}`} />
            </div>
          </div>
        </div>
      )}
      
      {/* Spacer */}
      <div className="h-20" />
      
      {/* Gradient Bar */}
      <div className="relative h-3 rounded-full overflow-visible bg-gradient-to-r from-teal-200 via-brand-300 to-green-300">
        {/* Marker lines */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-gray-700"
          style={{ left: `${lowPos}%` }}
        />
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-gray-700"
          style={{ left: `${midPos}%` }}
        />
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-gray-700"
          style={{ left: `${highPos}%` }}
        />
      </div>
      
      {/* Labels */}
      <div className="relative mt-2">
        <div 
          className="absolute transform -translate-x-1/2 text-center"
          style={{ left: `${lowPos}%` }}
        >
          <p className="text-xs font-medium text-teal-700">Low</p>
          <p className="text-xs text-gray-500">${low}/sf</p>
        </div>
        <div 
          className="absolute transform -translate-x-1/2 text-center"
          style={{ left: `${midPos}%` }}
        >
          <p className="text-xs font-medium text-brand-700">Typical</p>
          <p className="text-xs text-gray-500">${mid}/sf</p>
        </div>
        <div 
          className="absolute transform -translate-x-1/2 text-center"
          style={{ left: `${highPos}%` }}
        >
          <p className="text-xs font-medium text-green-700">High</p>
          <p className="text-xs text-gray-500">${high}/sf</p>
        </div>
      </div>
      
      {/* Spacer for labels */}
      <div className="h-10" />
      
      {/* Trade-specific context */}
      <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
        <p className="text-xs text-blue-700">
          <strong>{trade.displayName}</strong> typically costs ${low}-${high} per square foot installed, depending on materials and complexity.
        </p>
      </div>
    </div>
  );
}

/**
 * Project-level benchmark gauge for fixed-price projects
 */
function ProjectBenchmarkGauge({ 
  benchmark, 
  bidTotal,
  trade 
}: { 
  benchmark: TradeBenchmark;
  bidTotal: number;
  trade: TradeDetectionResult;
}) {
  if (!benchmark.perProjectRange) return null;
  
  const { low, mid, high } = benchmark.perProjectRange;
  
  // Extend range for display
  const displayMin = low * 0.5;
  const displayMax = high * 1.5;
  const range = displayMax - displayMin;
  
  // Calculate positions
  const lowPos = ((low - displayMin) / range) * 100;
  const midPos = ((mid - displayMin) / range) * 100;
  const highPos = ((high - displayMin) / range) * 100;
  const bidPos = Math.min(95, Math.max(5, ((bidTotal - displayMin) / range) * 100));
  
  // Determine bid tier
  const getBidTier = () => {
    if (bidTotal < low * 0.7) return 'below';
    if (bidTotal <= high * 1.15) return 'fair';
    return 'above';
  };
  
  const bidTier = getBidTier();
  const tierColors = {
    below: 'border-teal-400 bg-teal-50',
    fair: 'border-brand-400 bg-brand-50',
    above: 'border-green-400 bg-green-50',
  };

  return (
    <div className="mb-6">
      {/* Floating Bid Indicator */}
      <div className="relative mb-4">
        <div 
          className="absolute transform -translate-x-1/2 z-10"
          style={{ left: `${bidPos}%` }}
        >
          <div className={`px-4 py-2 rounded-xl border-2 shadow-md ${tierColors[bidTier]}`}>
            <p className="text-xs font-medium text-gray-600 text-center">Your Bid</p>
            <p className="text-xl font-bold text-gray-900 text-center">
              ${bidTotal.toLocaleString()}
            </p>
            <div className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3 h-3 rotate-45 border-r-2 border-b-2 ${tierColors[bidTier]}`} />
          </div>
        </div>
      </div>
      
      <div className="h-20" />
      
      {/* Gradient Bar */}
      <div className="relative h-3 rounded-full overflow-visible bg-gradient-to-r from-teal-200 via-brand-300 to-green-300">
        <div className="absolute top-0 bottom-0 w-0.5 bg-gray-700" style={{ left: `${lowPos}%` }} />
        <div className="absolute top-0 bottom-0 w-0.5 bg-gray-700" style={{ left: `${midPos}%` }} />
        <div className="absolute top-0 bottom-0 w-0.5 bg-gray-700" style={{ left: `${highPos}%` }} />
      </div>
      
      {/* Labels */}
      <div className="relative mt-2">
        <div className="absolute transform -translate-x-1/2 text-center" style={{ left: `${lowPos}%` }}>
          <p className="text-xs font-medium text-teal-700">Low</p>
          <p className="text-xs text-gray-500">${(low / 1000).toFixed(0)}k</p>
        </div>
        <div className="absolute transform -translate-x-1/2 text-center" style={{ left: `${midPos}%` }}>
          <p className="text-xs font-medium text-brand-700">Typical</p>
          <p className="text-xs text-gray-500">${(mid / 1000).toFixed(0)}k</p>
        </div>
        <div className="absolute transform -translate-x-1/2 text-center" style={{ left: `${highPos}%` }}>
          <p className="text-xs font-medium text-green-700">High</p>
          <p className="text-xs text-gray-500">${(high / 1000).toFixed(0)}k</p>
        </div>
      </div>
      
      <div className="h-10" />
      
      <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
        <p className="text-xs text-blue-700">
          <strong>{trade.displayName}</strong> projects typically cost ${low.toLocaleString()}-${high.toLocaleString()}, depending on scope and finishes.
        </p>
      </div>
    </div>
  );
}

/**
 * Status message component
 */
function StatusMessage({ status, message }: { status: string; message: string }) {
  if (!message) return null;
  
  const configs = {
    'below-market': {
      icon: <AlertTriangle className="w-5 h-5 text-teal-500" />,
      bg: 'bg-teal-50',
      border: 'border-teal-200',
      titleColor: 'text-teal-800',
      title: 'Below typical rates',
    },
    'fair': {
      icon: <CheckCircle className="w-5 h-5 text-brand-500" />,
      bg: 'bg-brand-50',
      border: 'border-brand-200',
      titleColor: 'text-brand-800',
      title: 'Within typical range',
    },
    'above-market': {
      icon: <TrendingUp className="w-5 h-5 text-green-500" />,
      bg: 'bg-green-50',
      border: 'border-green-200',
      titleColor: 'text-green-800',
      title: 'Above typical rates',
    },
    'significantly-above': {
      icon: <TrendingUp className="w-5 h-5 text-red-500" />,
      bg: 'bg-red-50',
      border: 'border-red-200',
      titleColor: 'text-red-800',
      title: 'Significantly above market',
    },
    'unknown': {
      icon: <Info className="w-5 h-5 text-gray-400" />,
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      titleColor: 'text-gray-700',
      title: 'Analysis pending',
    },
  };
  
  const config = configs[status as keyof typeof configs] || configs.unknown;
  
  return (
    <div className={`p-4 rounded-xl ${config.bg} border ${config.border}`}>
      <div className="flex items-start gap-3">
        {config.icon}
        <div>
          <p className={`font-semibold ${config.titleColor}`}>{config.title}</p>
          <p className="text-sm text-gray-600 mt-1">{message}</p>
        </div>
      </div>
    </div>
  );
}
