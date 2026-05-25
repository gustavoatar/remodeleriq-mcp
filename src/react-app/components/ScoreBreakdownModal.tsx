import { useEffect, useState } from 'react';
import { 
  X, Shield, FileText, DollarSign, AlertCircle, AlertTriangle, 
  Info, CheckCircle, HelpCircle, TrendingUp, TrendingDown, Minus
} from 'lucide-react';
import type { UnifiedScoreResult, Grade } from '@/shared/unifiedScoreEngine';
import { getGradeColor, getGradeBgColor, getDimensionColor } from '@/shared/unifiedScoreEngine';

interface ScoreBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  unifiedScore: UnifiedScoreResult | null;
}

export default function ScoreBreakdownModal({ isOpen, onClose, unifiedScore }: ScoreBreakdownModalProps) {
  // Animation state for entrance/exit transitions
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Handle modal open/close with animation
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Small delay to ensure DOM is ready for animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
      // Wait for exit animation to complete before unmounting
      const timer = setTimeout(() => setShouldRender(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!shouldRender || !unifiedScore) return null;

  const { overall, grade, gradeLabel, dimensions, summary, recommendations } = unifiedScore;
  const { contractRisk, scopeCompleteness, priceReasonableness } = dimensions;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop with fade animation */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Modal with scale/fade animation */}
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div 
            className={`relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-200 ease-out ${
              isAnimating 
                ? 'opacity-100 scale-100 translate-y-0' 
                : 'opacity-0 scale-95 translate-y-4'
            }`}
          >
            {/* Header */}
            <div className="bg-black px-6 py-5 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Score Breakdown</h2>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {/* Overall Score Section */}
              <div className={`rounded-xl border-2 p-6 mb-6 ${getGradeBgColor(grade)}`}>
                <div className="flex items-center gap-6">
                  {/* Circular Score Gauge */}
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        fill="none"
                        stroke="rgba(0,0,0,0.1)"
                        strokeWidth="10"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        fill="none"
                        stroke={getStrokeColor(grade)}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={`${(overall / 100) * 251.3} 251.3`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-3xl font-bold ${getGradeColor(grade)}`}>{overall}</span>
                      <span className={`text-lg font-bold ${getGradeColor(grade)}`}>{grade}</span>
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className={`text-xl font-bold ${getGradeColor(grade)}`}>{gradeLabel}</h3>
                    <p className="text-gray-600 text-sm mt-1">{summary}</p>
                  </div>
                </div>

                {/* Weighted Formula */}
                <div className="mt-4 pt-4 border-t border-current/10">
                  <p className="text-xs text-gray-500 mb-2 font-medium">Score Calculation</p>
                  <div className="flex items-center gap-2 text-sm flex-wrap">
                    <span className="px-2 py-1 rounded bg-white/80 font-mono">
                      ({contractRisk.score} × 40%)
                    </span>
                    <span className="text-gray-400">+</span>
                    <span className="px-2 py-1 rounded bg-white/80 font-mono">
                      ({scopeCompleteness.score} × 30%)
                    </span>
                    <span className="text-gray-400">+</span>
                    <span className="px-2 py-1 rounded bg-white/80 font-mono">
                      ({priceReasonableness.score} × 30%)
                    </span>
                    <span className="text-gray-400">=</span>
                    <span className={`px-2 py-1 rounded font-bold ${getGradeColor(grade)} bg-white`}>
                      {overall}
                    </span>
                  </div>
                </div>
              </div>

              {/* Three Dimension Cards */}
              <div className="space-y-4">
                {/* Contract Risk Card (40%) */}
                <DimensionCard
                  title="Contract Risk"
                  weight="40%"
                  score={contractRisk.score}
                  icon={<Shield className="w-5 h-5" />}
                  iconBg="bg-blue-100 text-blue-600"
                >
                  <p className="text-sm text-gray-600 mb-3">{contractRisk.summary}</p>
                  
                  {/* Flag Summary */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {contractRisk.criticalCount > 0 && (
                      <div className="flex items-center gap-2 bg-red-50 rounded-lg px-3 py-2">
                        <AlertCircle className="w-4 h-4 text-red-800" />
                        <span className="text-sm font-medium text-red-800">
                          {contractRisk.criticalCount} Critical
                        </span>
                      </div>
                    )}
                    {contractRisk.highCount > 0 && (
                      <div className="flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-medium text-amber-600">
                          {contractRisk.highCount} High
                        </span>
                      </div>
                    )}
                    {contractRisk.mediumCount > 0 && (
                      <div className="flex items-center gap-2 bg-yellow-50 rounded-lg px-3 py-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-600">
                          {contractRisk.mediumCount} Medium
                        </span>
                      </div>
                    )}
                    {contractRisk.lowCount > 0 && (
                      <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2">
                        <Info className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-600">
                          {contractRisk.lowCount} Low
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Flag List (top 3) */}
                  {contractRisk.flags.length > 0 ? (
                    <div className="space-y-2">
                      {contractRisk.flags.slice(0, 3).map((flag, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm bg-gray-50 rounded-lg p-2">
                          {getFlagIcon(flag.level)}
                          <span className="text-gray-700">{flag.title}</span>
                        </div>
                      ))}
                      {contractRisk.flags.length > 3 && (
                        <p className="text-xs text-gray-500 italic">
                          +{contractRisk.flags.length - 3} more issues
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 rounded-lg p-3">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">No contract issues detected</span>
                    </div>
                  )}
                </DimensionCard>

                {/* Scope Completeness Card (30%) */}
                <DimensionCard
                  title="Scope Completeness"
                  weight="30%"
                  score={scopeCompleteness.score}
                  icon={<FileText className="w-5 h-5" />}
                  iconBg="bg-teal-100 text-teal-600"
                >
                  <p className="text-sm text-gray-600 mb-3">{scopeCompleteness.summary}</p>
                  
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Scope Coverage</span>
                      <span>{scopeCompleteness.score}%</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${getProgressBarColor(scopeCompleteness.score)}`}
                        style={{ width: `${scopeCompleteness.score}%` }}
                      />
                    </div>
                  </div>

                  {/* Counts */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center bg-emerald-50 rounded-lg p-3">
                      <p className="text-2xl font-bold text-emerald-600">{scopeCompleteness.includedCount}</p>
                      <p className="text-xs text-gray-500">Included</p>
                    </div>
                    <div className="text-center bg-amber-50 rounded-lg p-3">
                      <p className="text-2xl font-bold text-amber-600">{scopeCompleteness.missingCount}</p>
                      <p className="text-xs text-gray-500">Missing</p>
                    </div>
                    <div className="text-center bg-blue-50 rounded-lg p-3">
                      <p className="text-2xl font-bold text-blue-600">{scopeCompleteness.impliedCount}</p>
                      <p className="text-xs text-gray-500">Implied</p>
                    </div>
                  </div>

                  {/* Critical/Important Missing */}
                  {(scopeCompleteness.criticalMissing > 0 || scopeCompleteness.importantMissing > 0) && (
                    <div className="mt-3 flex gap-2 flex-wrap">
                      {scopeCompleteness.criticalMissing > 0 && (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                          {scopeCompleteness.criticalMissing} critical missing
                        </span>
                      )}
                      {scopeCompleteness.importantMissing > 0 && (
                        <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                          {scopeCompleteness.importantMissing} important missing
                        </span>
                      )}
                    </div>
                  )}
                </DimensionCard>

                {/* Price Reasonableness Card (30%) */}
                <DimensionCard
                  title="Price Check"
                  weight="30%"
                  score={priceReasonableness.score}
                  icon={<DollarSign className="w-5 h-5" />}
                  iconBg="bg-emerald-100 text-emerald-600"
                >
                  <p className="text-sm text-gray-600 mb-3">{priceReasonableness.summary}</p>

                  {/* Verdict Badge */}
                  <div className="flex items-center gap-3 mb-4">
                    <VerdictBadge 
                      verdict={priceReasonableness.verdict} 
                      sentiment={priceReasonableness.verdictSentiment}
                    />
                    {priceReasonableness.percentDiff !== 0 && (
                      <div className="flex items-center gap-1 text-sm">
                        {priceReasonableness.percentDiff > 0 ? (
                          <>
                            <TrendingUp className="w-4 h-4 text-amber-500" />
                            <span className="text-amber-600 font-medium">
                              {Math.abs(priceReasonableness.percentDiff).toFixed(0)}% above market
                            </span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="w-4 h-4 text-emerald-500" />
                            <span className="text-emerald-600 font-medium">
                              {Math.abs(priceReasonableness.percentDiff).toFixed(0)}% below market
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Price Comparison */}
                  {priceReasonableness.bidPsf > 0 && priceReasonableness.marketPsf > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Your Bid</p>
                        <p className="text-lg font-bold text-gray-900">
                          ${priceReasonableness.bidPsf.toFixed(2)}/sf
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Market Average</p>
                        <p className="text-lg font-bold text-gray-900">
                          ${priceReasonableness.marketPsf.toFixed(2)}/sf
                        </p>
                      </div>
                    </div>
                  )}

                  {/* No data message */}
                  {priceReasonableness.bidPsf === 0 && (
                    <div className="flex items-center gap-2 text-gray-500 bg-gray-50 rounded-lg p-3">
                      <HelpCircle className="w-4 h-4" />
                      <span className="text-sm">Add bid total and square footage for price analysis</span>
                    </div>
                  )}
                </DimensionCard>
              </div>

              {/* Recommendations */}
              {recommendations.length > 0 && (
                <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-emerald-700 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Top Recommendations
                  </h4>
                  <ul className="space-y-2">
                    {recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-emerald-500 font-bold">{idx + 1}.</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={onClose}
                className="w-full py-2.5 px-4 bg-black text-white font-medium rounded-xl hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dimension Card Component
function DimensionCard({ 
  title, 
  weight, 
  score, 
  icon, 
  iconBg, 
  children 
}: { 
  title: string;
  weight: string;
  score: number;
  icon: React.ReactNode;
  iconBg: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
            {icon}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{title}</h4>
            <p className="text-xs text-gray-500">Weight: {weight}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${getDimensionColor(score)}`}>{score}</p>
          <p className="text-xs text-gray-500">/100</p>
        </div>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}

// Verdict Badge Component
function VerdictBadge({ verdict, sentiment }: { verdict: string; sentiment: string }) {
  const getBadgeStyle = () => {
    switch (sentiment) {
      case 'positive':
        return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      case 'neutral':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'caution':
        return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'warning':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'negative':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getIcon = () => {
    switch (sentiment) {
      case 'positive':
        return <TrendingDown className="w-4 h-4" />;
      case 'neutral':
        return <Minus className="w-4 h-4" />;
      case 'caution':
      case 'warning':
      case 'negative':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${getBadgeStyle()}`}>
      {getIcon()}
      {verdict}
    </span>
  );
}

// Helper functions
function getStrokeColor(grade: Grade): string {
  switch (grade) {
    case 'A': return '#059669'; // emerald-600
    case 'B': return '#0d9488'; // teal-600
    case 'C': return '#d97706'; // amber-600
    case 'D': return '#ea580c'; // orange-600
    case 'F': return '#dc2626'; // red-600
    default: return '#6b7280'; // gray-500
  }
}

function getFlagIcon(level: string): React.ReactNode {
  switch (level) {
    case 'critical':
      return <AlertCircle className="w-4 h-4 text-red-800 flex-shrink-0" />;
    case 'high':
      return <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />;
    case 'medium':
      return <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />;
    case 'low':
      return <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />;
    default:
      return <Info className="w-4 h-4 text-gray-500 flex-shrink-0" />;
  }
}

function getProgressBarColor(score: number): string {
  if (score >= 85) return 'bg-emerald-500';
  if (score >= 70) return 'bg-teal-500';
  if (score >= 55) return 'bg-amber-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}
