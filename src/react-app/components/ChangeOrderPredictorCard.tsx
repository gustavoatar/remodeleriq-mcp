import { useState, useEffect } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Loader2, TrendingUp, HelpCircle, CircleAlert, Info, Copy, Check, DollarSign, FileQuestion } from 'lucide-react';
import type { VagueTermFlag } from '../../shared/analysisEngine';

interface ChangeOrderPrediction {
  item: string;
  bidExcerpt: string;
  riskLevel: 'high' | 'medium' | 'low';
  category: string;
  typicalOverrunPercent: { min: number; max: number };
  explanation: string;
  questionToAsk: string;
  estimatedCostImpact?: string;
}

interface ProjectSpecificRisk {
  item: string;
  frequency: string;
  typicalCost: string;
  detected: boolean;
  preventionQuestion: string;
}

interface ChangeOrderSummary {
  riskScore: number;
  riskGrade: string;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  estimatedOverrunMin: number;
  estimatedOverrunMax: number;
  totalPotentialOverrun: string;
}

interface ChangeOrderPredictionResult {
  success: boolean;
  predictions: ChangeOrderPrediction[];
  projectSpecificRisks: ProjectSpecificRisk[];
  summary: ChangeOrderSummary;
  aiEnhanced: boolean;
  aiAssessment?: string;
  topRecommendation?: string;
  error?: string;
}

interface ChangeOrderPredictorCardProps {
  bidText: string;
  bidTotal?: number;
  projectType?: string;
  vagueTerms?: VagueTermFlag[];
  className?: string;
  onQuestionsReady?: (questions: string[]) => void;
}

const RISK_COLORS = {
  high: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-800' },
  medium: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800' },
  low: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' }
};

const VAGUE_TYPE_INFO: Record<string, { icon: typeof HelpCircle; label: string }> = {
  'allowance': { icon: DollarSign, label: 'Allowance' },
  'tbd': { icon: HelpCircle, label: 'TBD/Undefined' },
  'vague-standard': { icon: FileQuestion, label: 'Vague Standard' },
  'undefined-scope': { icon: AlertTriangle, label: 'Undefined Scope' }
};

export function ChangeOrderPredictorCard({ 
  bidText, 
  bidTotal, 
  projectType,
  vagueTerms = [],
  className = '',
  onQuestionsReady
}: ChangeOrderPredictorCardProps) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ChangeOrderPredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedRisks, setExpandedRisks] = useState(false);
  const [expandedProjectRisks, setExpandedProjectRisks] = useState(false);
  const [copiedQuestion, setCopiedQuestion] = useState<string | null>(null);

  // Listen for PDF export events to expand all sections
  useEffect(() => {
    const handlePdfStart = () => {
      setIsExpanded(true);
      setExpandedRisks(true);
      setExpandedProjectRisks(true);
    };
    const handlePdfEnd = () => {
      setExpandedRisks(false);
      setExpandedProjectRisks(false);
    };
    window.addEventListener('pdf-export-start', handlePdfStart);
    window.addEventListener('pdf-export-end', handlePdfEnd);
    return () => {
      window.removeEventListener('pdf-export-start', handlePdfStart);
      window.removeEventListener('pdf-export-end', handlePdfEnd);
    };
  }, []);

  useEffect(() => {
    if (!bidText || bidText.length < 50) {
      setLoading(false);
      return;
    }

    const fetchPredictions = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/change-order-prediction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bidText, bidTotal, projectType })
        });

        const data: ChangeOrderPredictionResult = await response.json();

        if (data.success) {
          setResult(data);
          
          // Pass questions to parent
          if (onQuestionsReady) {
            const questions = [
              ...data.predictions.map(p => p.questionToAsk),
              ...data.projectSpecificRisks.filter(r => r.detected).map(r => r.preventionQuestion)
            ].filter(Boolean);
            onQuestionsReady(questions);
          }
        } else {
          setError(data.error || 'Failed to analyze change order risks');
        }
      } catch (err) {
        console.error('Change order prediction error:', err);
        setError('Failed to analyze change order risks');
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, [bidText, bidTotal, projectType, onQuestionsReady]);

  const handleCopyQuestion = (question: string) => {
    navigator.clipboard.writeText(question);
    setCopiedQuestion(question);
    setTimeout(() => setCopiedQuestion(null), 2000);
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${className}`}>
        <div className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-emerald-600 animate-spin mr-3" />
          <span className="text-gray-600">Analyzing change order risks...</span>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${className}`}>
        <div className="p-6 text-center text-gray-500">
          <Info className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p>Unable to analyze change order risks</p>
        </div>
      </div>
    );
  }

  const { predictions, projectSpecificRisks, summary, topRecommendation, aiEnhanced } = result;
  const detectedProjectRisks = projectSpecificRisks.filter(r => r.detected);
  
  // Count high/medium/low from vague terms
  const vagueHighCount = vagueTerms.filter(t => t.estimatedRisk === 'high').length;
  const vagueMediumCount = vagueTerms.filter(t => t.estimatedRisk === 'medium').length;
  const vagueLowCount = vagueTerms.filter(t => t.estimatedRisk === 'low').length;
  
  // Combined counts
  const combinedHighCount = summary.highRiskCount + vagueHighCount;
  const combinedMediumCount = summary.mediumRiskCount + vagueMediumCount;
  const combinedLowCount = summary.lowRiskCount + vagueLowCount;
  
  // Total risks = sum of all risk levels
  const totalRisksDetected = combinedHighCount + combinedMediumCount + combinedLowCount;

  // No risks detected
  if (predictions.length === 0 && detectedProjectRisks.length === 0) {
    return (
      <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${className}`}>
        <div className="bg-black rounded-t-2xl px-6 py-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">Change Order Risk</h3>
            <p className="text-sm text-white/60">Cost overrun prediction</p>
          </div>
        </div>
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
            <Check className="w-6 h-6 text-emerald-600" />
          </div>
          <p className="text-emerald-700 font-medium">Low Change Order Risk</p>
          <p className="text-sm text-gray-500 mt-1">No common change order triggers detected in this bid.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
      {/* Header - Clickable like Questions to Ask */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-black px-6 py-5 flex items-center justify-between hover:bg-slate-900 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-8 h-8 text-emerald-600" />
          </div>
          <div className="text-left">
            <h3 className="text-2xl font-bold text-white">Change Order Risk</h3>
            <p className="text-sm text-white/60">
              {totalRisksDetected} risk{totalRisksDetected !== 1 ? 's' : ''} detected
              {aiEnhanced && <span className="ml-2 text-emerald-400 text-xs">(AI Enhanced)</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs text-white/50">Potential Overrun</div>
            <div className="text-white font-semibold">{summary.totalPotentialOverrun}</div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-white/60" />
          ) : (
            <ChevronDown className="w-5 h-5 text-white/60" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <>
          {/* Top Recommendation */}
          {topRecommendation && (
            <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100">
              <div className="flex items-start gap-2">
                <CircleAlert className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-medium text-emerald-700 uppercase tracking-wide">Top Action: </span>
                  <span className="text-sm text-emerald-800">{topRecommendation}</span>
                </div>
              </div>
            </div>
          )}

          {/* Vague Terms Section */}
          {vagueTerms.length > 0 && (
            <div className="p-4 space-y-3 border-b border-gray-100">
              {[...vagueTerms]
                .sort((a, b) => {
                  const order = { high: 0, medium: 1, low: 2 };
                  return order[a.estimatedRisk] - order[b.estimatedRisk];
                })
                .map((term, idx) => {
                  const typeInfo = VAGUE_TYPE_INFO[term.type] || { icon: HelpCircle, label: term.type };
                  const Icon = typeInfo.icon;
                  const riskColors = RISK_COLORS[term.estimatedRisk];
                  
                  return (
                    <div 
                      key={idx}
                      className={`p-4 rounded-lg border ${riskColors.bg} ${riskColors.border}`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`w-5 h-5 mt-0.5 ${riskColors.text}`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-semibold ${riskColors.text}`}>"{term.term}"</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${riskColors.badge}`}>
                              {term.estimatedRisk.toUpperCase()}
                            </span>
                            <span className="text-xs text-slate-500">{typeInfo.label}</span>
                          </div>
                          <p className="text-sm text-slate-600 mt-1">{term.warningText}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              
              {/* Pro Tip */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-sm text-emerald-800">
                  <strong>Pro Tip:</strong> Ask your contractor to replace vague terms with specific dollar amounts, 
                  material brands/models, or detailed specifications. Get changes in writing before signing.
                </p>
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-2 p-4 border-b border-gray-100 bg-gray-50">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{combinedHighCount}</div>
          <div className="text-xs text-gray-500">High Risk</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-amber-600">{combinedMediumCount}</div>
          <div className="text-xs text-gray-500">Medium Risk</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{combinedLowCount}</div>
          <div className="text-xs text-gray-500">Low Risk</div>
        </div>
      </div>

          {/* Detected Risks */}
          <div className="border-b border-gray-100">
        <button 
          onClick={() => setExpandedRisks(!expandedRisks)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="font-medium text-gray-800">Detected Risk Patterns</span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{predictions.length}</span>
          </div>
          {expandedRisks ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
        
        {expandedRisks && (
          <div className="px-4 pb-4 space-y-3">
            {predictions.map((prediction, idx) => {
              const colors = RISK_COLORS[prediction.riskLevel];
              return (
                <div 
                  key={idx} 
                  className={`rounded-lg border ${colors.border} ${colors.bg} p-3`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.badge}`}>
                        {prediction.riskLevel.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500 capitalize">{prediction.category.replace(/-/g, ' ')}</span>
                    </div>
                    {prediction.estimatedCostImpact && (
                      <span className="text-xs font-medium text-gray-600">
                        {prediction.estimatedCostImpact}
                      </span>
                    )}
                  </div>
                  
                  <h4 className={`font-medium ${colors.text} mb-1`}>{prediction.item}</h4>
                  
                  {prediction.bidExcerpt && (
                    <p className="text-xs text-gray-600 italic mb-2 bg-white/50 px-2 py-1 rounded">
                      "{prediction.bidExcerpt}"
                    </p>
                  )}
                  
                  <p className="text-sm text-gray-700 mb-2">{prediction.explanation}</p>
                  
                  <div className="flex items-start gap-2 bg-white/70 rounded px-2 py-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-600 flex-1">{prediction.questionToAsk}</p>
                    <button
                      onClick={() => handleCopyQuestion(prediction.questionToAsk)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                      title="Copy question"
                    >
                      {copiedQuestion === prediction.questionToAsk ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

          {/* Project-Specific Risks */}
          {projectSpecificRisks.length > 0 && (
        <div>
          <button 
            onClick={() => setExpandedProjectRisks(!expandedProjectRisks)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-gray-800">Common {projectType || 'Project'} Change Orders</span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {detectedProjectRisks.length} detected
              </span>
            </div>
            {expandedProjectRisks ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          
          {expandedProjectRisks && (
            <div className="px-4 pb-4 space-y-2">
              {projectSpecificRisks.map((risk, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    risk.detected ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${risk.detected ? 'bg-amber-500' : 'bg-gray-300'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-800 text-sm">{risk.item}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        risk.detected ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-500'
                      }`}>
                        {risk.frequency}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">Typical cost: {risk.typicalCost}</p>
                    {risk.detected && (
                      <p className="text-xs text-amber-700 italic">Ask: {risk.preventionQuestion}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              Based on industry patterns and common change order triggers. Get specifics in writing before signing.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default ChangeOrderPredictorCard;
