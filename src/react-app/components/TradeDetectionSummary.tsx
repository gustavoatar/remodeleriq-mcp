/**
 * Trade Detection Summary Component
 * 
 * Shows why a specific trade was detected, including:
 * - Detected category and subtype
 * - Confidence level with explanation
 * - Matched keywords from the bid text
 * - Score breakdown for transparency
 */

import { useState } from 'react';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Tag, 
  CheckCircle, 
  AlertCircle,
  Info,
  Lightbulb
} from 'lucide-react';
import type { TradeDetectionResult, TradeCategory } from '@/shared/tradeDetection';

interface TradeDetectionSummaryProps {
  detection: TradeDetectionResult;
  compact?: boolean;
}

// Map trade categories to user-friendly labels
const TRADE_LABELS: Record<TradeCategory, string> = {
  'flooring': 'Flooring Installation',
  'tile': 'Tile Work',
  'painting': 'Painting',
  'electrical': 'Electrical Work',
  'plumbing': 'Plumbing',
  'hvac': 'HVAC',
  'roofing': 'Roofing',
  'carpentry': 'Carpentry',
  'windows-doors': 'Windows & Doors',
  'siding': 'Siding',
  'concrete': 'Concrete Work',
  'landscaping': 'Landscaping',
  'bathroom-remodel': 'Bathroom Remodel',
  'kitchen-remodel': 'Kitchen Remodel',
  'basement-finishing': 'Basement Finishing',
  'addition': 'Room Addition',
  'whole-house': 'Whole House Renovation',
  'general-remodel': 'General Remodel',
  'unknown': 'General Project',
  // Legacy categories
  'kitchen': 'Kitchen',
  'bathroom': 'Bathroom',
  'drywall': 'Drywall',
  'general': 'General Work',
  'exterior': 'Exterior Work',
};

const CONFIDENCE_CONFIG = {
  high: {
    color: 'text-emerald-700',
    bg: 'bg-emerald-100',
    icon: <CheckCircle className="w-4 h-4 text-emerald-600" />,
    label: 'High Confidence',
    description: 'Multiple strong indicators detected',
  },
  medium: {
    color: 'text-blue-700',
    bg: 'bg-blue-100',
    icon: <Info className="w-4 h-4 text-blue-600" />,
    label: 'Medium Confidence',
    description: 'Some indicators detected',
  },
  low: {
    color: 'text-teal-700',
    bg: 'bg-teal-100',
    icon: <AlertCircle className="w-4 h-4 text-teal-600" />,
    label: 'Low Confidence',
    description: 'Limited indicators found',
  },
};

export default function TradeDetectionSummary({ 
  detection, 
  compact = false 
}: TradeDetectionSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const confidenceConfig = CONFIDENCE_CONFIG[detection.confidence];
  
  // Get top scoring categories for the breakdown
  const topCategories = Object.entries(detection.scores)
    .filter(([, score]) => score > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  
  // Clean up matched keywords for display (remove duplicates, limit length)
  const uniqueKeywords = [...new Set(
    detection.matchedKeywords.map(k => k.toLowerCase().trim())
  )].slice(0, 8);
  
  if (compact) {
    return (
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left bg-slate-50 hover:bg-slate-100 rounded-lg p-3 transition-colors border border-slate-200"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Search className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <span className="text-sm font-medium text-navy-900 truncate">
              Detected: {detection.displayName}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${confidenceConfig.bg} ${confidenceConfig.color} flex-shrink-0`}>
              {confidenceConfig.label}
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
          )}
        </div>
        
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-200">
            <KeywordsList keywords={uniqueKeywords} />
            {topCategories.length > 1 && (
              <ScoreBreakdown categories={topCategories} primaryTrade={detection.primaryTrade} />
            )}
          </div>
        )}
      </button>
    );
  }
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-100">
              <Search className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h4 className="font-semibold text-navy-900">Trade Detection</h4>
              <p className="text-sm text-slate-500">
                How we classified this bid
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-slate-100 rounded transition-colors"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="p-4">
        {/* Detection Result */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1">
            <p className="text-xl font-bold text-navy-900">
              {detection.displayName}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${confidenceConfig.bg} ${confidenceConfig.color}`}>
                {confidenceConfig.icon}
                {confidenceConfig.label}
              </span>
              {detection.isSingleTrade ? (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                  Single Trade
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                  Multi-Trade Project
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Confidence Explanation */}
        <div className="bg-slate-50 rounded-lg p-3 mb-4">
          <p className="text-sm text-slate-600">
            <Lightbulb className="w-4 h-4 inline-block mr-1.5 text-emerald-500" />
            {confidenceConfig.description}. 
            {detection.confidence === 'high' && ' Trade-specific benchmarks are highly applicable.'}
            {detection.confidence === 'medium' && ' Trade-specific benchmarks should be useful.'}
            {detection.confidence === 'low' && ' Consider reviewing if the detected category matches your project.'}
          </p>
        </div>
        
        {/* Matched Keywords */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Matched Keywords
          </p>
          <KeywordsList keywords={uniqueKeywords} showIcon />
        </div>
        
        {/* Expandable Score Breakdown */}
        {isExpanded && topCategories.length > 1 && (
          <div className="pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Detection Scores
            </p>
            <ScoreBreakdown 
              categories={topCategories} 
              primaryTrade={detection.primaryTrade}
              showLabels
            />
          </div>
        )}
        
        {/* Secondary Trades */}
        {isExpanded && detection.secondaryTrades.length > 0 && (
          <div className="pt-4 mt-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Other Trades Detected
            </p>
            <div className="flex flex-wrap gap-2">
              {detection.secondaryTrades.map(trade => (
                <span 
                  key={trade}
                  className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium"
                >
                  {TRADE_LABELS[trade] || trade}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Keywords list component
 */
function KeywordsList({ 
  keywords, 
  showIcon = false 
}: { 
  keywords: string[];
  showIcon?: boolean;
}) {
  if (keywords.length === 0) {
    return (
      <p className="text-sm text-slate-400 italic">
        No specific keywords matched
      </p>
    );
  }
  
  return (
    <div className="flex flex-wrap gap-1.5">
      {keywords.map((keyword, idx) => (
        <span 
          key={idx}
          className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-medium border border-indigo-100"
        >
          {showIcon && <Tag className="w-3 h-3" />}
          "{keyword}"
        </span>
      ))}
    </div>
  );
}

/**
 * Score breakdown component showing how different categories scored
 */
function ScoreBreakdown({ 
  categories, 
  primaryTrade,
  showLabels = false
}: { 
  categories: [string, number][];
  primaryTrade: TradeCategory | null;
  showLabels?: boolean;
}) {
  const maxScore = Math.max(...categories.map(([, score]) => score), 1);
  
  return (
    <div className="space-y-2">
      {categories.map(([category, score]) => {
        const isPrimary = category === primaryTrade;
        const percentage = (score / maxScore) * 100;
        
        return (
          <div key={category} className="flex items-center gap-2">
            {showLabels && (
              <span className={`text-xs w-28 truncate ${isPrimary ? 'font-semibold text-navy-900' : 'text-slate-500'}`}>
                {TRADE_LABELS[category as TradeCategory] || category}
              </span>
            )}
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  isPrimary ? 'bg-indigo-500' : 'bg-slate-300'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className={`text-xs w-8 text-right ${isPrimary ? 'font-semibold text-navy-900' : 'text-slate-400'}`}>
              {score}
            </span>
          </div>
        );
      })}
    </div>
  );
}
