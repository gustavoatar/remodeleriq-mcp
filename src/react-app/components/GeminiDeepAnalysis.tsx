import { useEffect } from 'react';
import { Sparkles, Lightbulb, Loader2, RefreshCw } from 'lucide-react';
import { CompactPremiumGate } from './PremiumGate';

interface AIInsight {
  type: 'warning' | 'tip' | 'positive' | 'question';
  title: string;
  detail: string;
  action: string;
}

interface GeminiDeepAnalysisProps {
  aiAnalysis: {
    summary?: string;
    confidenceBoost?: string;
    aiInsights: AIInsight[];
    missedByRules?: string[];
    questionsToAsk?: string[];
  } | null;
  aiLoading: boolean;
  aiError: string | null;
  onRetry: () => void;
  isPremium: boolean;
  onUpgrade: () => void;
  onQuestionsReady?: (questions: Array<{ title: string; detail: string; action?: string }>) => void;
}

export function GeminiDeepAnalysis({ 
  aiAnalysis, 
  aiLoading, 
  aiError, 
  onRetry,
  isPremium,
  onUpgrade,
  onQuestionsReady
}: GeminiDeepAnalysisProps) {
  
  // Pass questions to parent for unified QuestionsToAskCard
  useEffect(() => {
    if (aiAnalysis && onQuestionsReady) {
      const questions = aiAnalysis.aiInsights?.filter(i => i.type === 'question') || [];
      if (questions.length > 0) {
        onQuestionsReady(questions.map(q => ({
          title: q.title,
          detail: q.detail,
          action: q.action
        })));
      }
    }
  }, [aiAnalysis, onQuestionsReady]);
  
  if (aiLoading) {
    return (
      <div className="mb-6">
        <div className="bg-black rounded-t-2xl px-6 py-5 flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">Gemini Deep Analysis</h3>
            <p className="text-sm text-white/60">Analyzing your bid...</p>
          </div>
        </div>
        <div className="bg-slate-50 rounded-b-2xl border border-t-0 border-slate-200 p-8 text-center">
          <p className="text-slate-500 text-sm">AI analysis in progress...</p>
        </div>
      </div>
    );
  }

  if (aiError) {
    return (
      <div className="mb-6">
        <div className="bg-black rounded-t-2xl px-6 py-5 flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">Gemini Deep Analysis</h3>
          </div>
        </div>
        <div className="bg-slate-50 rounded-b-2xl border border-t-0 border-slate-200 p-6 text-center">
          <p className="text-slate-600 text-sm mb-3">{aiError}</p>
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!aiAnalysis) return null;

  // Extract different types of insights (questions handled by useEffect above)
  const warnings = aiAnalysis.aiInsights?.filter(i => i.type === 'warning') || [];
  const tips = aiAnalysis.aiInsights?.filter(i => i.type === 'tip') || [];
  const missedByRules = aiAnalysis.missedByRules || [];

  // Combine all deep research findings (warnings + missed rules - non-redundant)
  // Limit to 3 max for conciseness - users get the most important points
  const deepResearchFindings = [
    ...warnings.map(w => ({ title: w.title, detail: w.detail, action: w.action })),
    ...missedByRules.map(m => ({ title: m, detail: '', action: '' }))
  ].slice(0, 3); // Max 3 findings to keep it concise

  // For free users, limit visible content even more
  const visibleTips = isPremium ? tips.slice(0, 2) : tips.slice(0, 1); // Max 2 tips for premium
  const visibleDeepResearch = isPremium ? deepResearchFindings : deepResearchFindings.slice(0, 2);

  // Check if there's any content to show (questions moved to unified QuestionsToAskCard)
  const hasSummary = aiAnalysis.confidenceBoost;
  const hasDeepResearch = deepResearchFindings.length > 0;
  const hasTips = tips.length > 0;

  if (!hasSummary && !hasDeepResearch && !hasTips) {
    return null;
  }

  return (
    <div className="mb-6">
      {/* Dark Header */}
      <div className="bg-black rounded-t-2xl px-6 py-5 flex items-center gap-4">
        <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white">Gemini Deep Analysis</h3>
          <p className="text-sm text-white/60">AI-powered bid intelligence</p>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-slate-50 rounded-b-2xl border border-t-0 border-slate-200 p-5 space-y-5">
        
        {/* Summary Section - Green accent bar */}
        {hasSummary && (
          <div className="bg-white rounded-xl border-l-4 border-l-emerald-500 border border-slate-200 shadow-sm p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">Summary</p>
                {aiAnalysis.confidenceBoost && (
                  <p className="text-sm text-slate-700 leading-relaxed">{aiAnalysis.confidenceBoost}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Deep Research Findings - Green accent bars */}
        {hasDeepResearch && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-emerald-600" />
              <p className="text-sm font-semibold text-slate-700">Gemini Deep Research</p>
            </div>
            <div className="space-y-3">
              {visibleDeepResearch.map((finding, idx) => (
                <div key={idx} className="bg-white rounded-xl border-l-4 border-l-emerald-500 border border-slate-200 shadow-sm p-4">
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0"></span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">{finding.title}</p>
                      {finding.detail && (
                        <p className="text-sm text-slate-600 mt-1">{finding.detail}</p>
                      )}
                      {finding.action && (
                        <p className="text-xs text-slate-500 mt-2 italic">→ {finding.action}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Premium gate only shown if there are more than 2 visible items */}
              {!isPremium && visibleDeepResearch.length < deepResearchFindings.length && (
                <CompactPremiumGate
                  title="deep research findings"
                  itemCount={deepResearchFindings.length - visibleDeepResearch.length}
                  onUpgrade={onUpgrade}
                />
              )}
            </div>
          </div>
        )}

        {/* Pro Tips Section */}
        {hasTips && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-blue-500" />
              <p className="text-sm font-semibold text-slate-700">Pro Tips</p>
            </div>
            <div className="space-y-3">
              {visibleTips.map((tip, idx) => (
                <div key={idx} className="bg-white rounded-xl border-l-4 border-l-emerald-500 border border-slate-200 shadow-sm p-4">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">{tip.title}</p>
                      <p className="text-sm text-slate-600 mt-1">{tip.detail}</p>
                      {tip.action && (
                        <p className="text-xs text-slate-500 mt-2 italic">→ {tip.action}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {!isPremium && visibleTips.length < tips.length && (
                <CompactPremiumGate
                  title="pro tips"
                  itemCount={tips.length - visibleTips.length}
                  onUpgrade={onUpgrade}
                />
              )}
            </div>
          </div>
        )}

        {/* Ask the Contractor Section - MOVED to unified QuestionsToAskCard */}
      </div>
    </div>
  );
}

export default GeminiDeepAnalysis;
