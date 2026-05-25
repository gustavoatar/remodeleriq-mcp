import { useState, useMemo, useEffect } from 'react';
import { HelpCircle, Copy, CheckCircle2, ChevronDown, ChevronUp, ClipboardList, Sparkles, MapPin, AlertTriangle } from 'lucide-react';

export interface QuestionSource {
  question: string;
  source: 'scope' | 'ai' | 'regional' | 'deal-risk' | 'change-order';
  category?: string; // e.g., "Missing Scope Item", "Regional Concern", "AI Insight"
  priority?: 'high' | 'medium' | 'low';
}

interface QuestionsToAskCardProps {
  // Scope-based questions (from ScopeComparisonCard)
  scopeQuestions?: string[];
  
  // AI-generated questions (from GeminiDeepAnalysis)
  aiQuestions?: Array<{
    title: string;
    detail: string;
    action?: string;
  }>;
  
  // Regional questions (from CommunityPulse)
  regionalQuestions?: Array<{
    question: string;
    context?: string; // e.g., "Florida humidity concern"
  }>;
  
  // Deal risk questions (from analysisEngine)
  dealRiskQuestions?: string[];
  
  // Change order risk questions (from ChangeOrderPredictorCard)
  changeOrderQuestions?: string[];
  
  className?: string;
  defaultExpanded?: boolean;
}

export function QuestionsToAskCard({
  scopeQuestions = [],
  aiQuestions = [],
  regionalQuestions = [],
  dealRiskQuestions = [],
  changeOrderQuestions = [],
  className = '',
  defaultExpanded = false
}: QuestionsToAskCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Listen for PDF export events to expand card
  useEffect(() => {
    const handlePdfStart = () => setIsExpanded(true);
    window.addEventListener('pdf-export-start', handlePdfStart);
    return () => window.removeEventListener('pdf-export-start', handlePdfStart);
  }, []);

  // Consolidate and deduplicate all questions
  const consolidatedQuestions = useMemo(() => {
    const questions: QuestionSource[] = [];
    const seen = new Set<string>();

    const normalizeQuestion = (q: string) => q.toLowerCase().trim().replace(/[?.!]+$/, '');
    
    const addUnique = (question: string, source: QuestionSource['source'], category?: string, priority?: QuestionSource['priority']) => {
      const normalized = normalizeQuestion(question);
      if (!seen.has(normalized) && question.trim()) {
        seen.add(normalized);
        questions.push({ question: question.trim(), source, category, priority });
      }
    };

    // Add AI questions first (highest value)
    aiQuestions.forEach(q => {
      // Combine title and detail into a comprehensive question if detail exists
      const fullQuestion = q.detail 
        ? `${q.title} ${q.detail}`.trim()
        : q.title;
      addUnique(fullQuestion, 'ai', 'AI Analysis', 'high');
    });

    // Add deal risk questions (high priority)
    dealRiskQuestions.forEach(q => {
      addUnique(q, 'deal-risk', 'Financial Risk', 'high');
    });

    // Add change order risk questions (high priority - cost overrun prevention)
    changeOrderQuestions.forEach(q => {
      addUnique(q, 'change-order', 'Change Order Risk', 'high');
    });

    // Add regional questions (location-specific)
    regionalQuestions.forEach(q => {
      addUnique(q.question, 'regional', q.context || 'Regional Concern', 'medium');
    });

    // Add scope questions (standard)
    scopeQuestions.forEach(q => {
      addUnique(q, 'scope', 'Scope Clarification', 'medium');
    });

    return questions;
  }, [scopeQuestions, aiQuestions, regionalQuestions, dealRiskQuestions, changeOrderQuestions]);

  // Don't render if no questions
  if (consolidatedQuestions.length === 0) {
    return null;
  }

  const copyQuestion = (question: string, index: number) => {
    navigator.clipboard.writeText(question);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyAllQuestions = () => {
    const allText = consolidatedQuestions.map((q, i) => `${i + 1}. ${q.question}`).join('\n\n');
    navigator.clipboard.writeText(allText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // Get icon for source type
  const getSourceIcon = (source: QuestionSource['source']) => {
    switch (source) {
      case 'ai':
        return <Sparkles className="w-3.5 h-3.5 text-purple-500" />;
      case 'regional':
        return <MapPin className="w-3.5 h-3.5 text-blue-500" />;
      case 'deal-risk':
        return <HelpCircle className="w-3.5 h-3.5 text-amber-500" />;
      case 'change-order':
        return <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />;
      case 'scope':
      default:
        return <ClipboardList className="w-3.5 h-3.5 text-emerald-500" />;
    }
  };

  // Get badge color for source
  const getSourceBadgeClass = (source: QuestionSource['source']) => {
    switch (source) {
      case 'ai':
        return 'bg-purple-100 text-purple-700';
      case 'regional':
        return 'bg-blue-100 text-blue-700';
      case 'deal-risk':
        return 'bg-amber-100 text-amber-700';
      case 'change-order':
        return 'bg-orange-100 text-orange-700';
      case 'scope':
      default:
        return 'bg-emerald-100 text-emerald-700';
    }
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
      {/* Header - Black with emerald icon */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-black px-6 py-5 flex items-center justify-between hover:bg-slate-900 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center">
            <HelpCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <div className="text-left">
            <h3 className="text-2xl font-bold text-white">Questions to Ask</h3>
            <p className="text-sm text-white/60">
              {consolidatedQuestions.length} question{consolidatedQuestions.length !== 1 ? 's' : ''} to clarify with your contractor
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/70 bg-white/20 px-2.5 py-1 rounded-full">
            {consolidatedQuestions.length}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-white/60" />
          ) : (
            <ChevronDown className="w-5 h-5 text-white/60" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-6 py-5">
          {/* Copy All Button */}
          <div className="flex justify-end mb-4">
            <button
              onClick={copyAllQuestions}
              className="text-sm text-slate-600 hover:text-emerald-600 flex items-center gap-1.5 transition-colors"
            >
              {copiedAll ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-600">Copied all!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy all questions</span>
                </>
              )}
            </button>
          </div>

          {/* Questions List */}
          <div className="space-y-3">
            {consolidatedQuestions.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl group hover:bg-slate-100 transition-colors"
              >
                {/* Question Number */}
                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-sm font-semibold text-slate-600 shadow-sm">
                  {index + 1}
                </span>

                {/* Question Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 leading-relaxed">{item.question}</p>
                  
                  {/* Source Badge */}
                  {item.category && (
                    <div className="flex items-center gap-1.5 mt-2">
                      {getSourceIcon(item.source)}
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getSourceBadgeClass(item.source)}`}>
                        {item.category}
                      </span>
                    </div>
                  )}
                </div>

                {/* Copy Button */}
                <button
                  onClick={() => copyQuestion(item.question, index)}
                  className="flex-shrink-0 p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white transition-all"
                  title="Copy question"
                >
                  {copiedIndex === index ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Pro Tip */}
          <div className="mt-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-emerald-800">Pro Tip</p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Email these questions to your contractor before signing. Their responses can reveal 
                  professionalism and help you compare bids fairly.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuestionsToAskCard;
