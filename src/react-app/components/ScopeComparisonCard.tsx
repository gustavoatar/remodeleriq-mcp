import { useMemo, useState, useEffect } from 'react';
import { Check, AlertTriangle, ChevronDown, ChevronUp, CheckCircle2, Info, Loader2, XCircle, Package, ClipboardList } from 'lucide-react';
import type { ScopeAnalysisResult, ScopeItemCategory, ScopeImportance, DetectedScopeItem } from '../../shared/scopeAnalysis';
import { deduplicateUnitItems, type UnitDetectionResult } from '@/shared/unitDetection';

interface ScopeComparisonCardProps {
  scopeAnalysis: ScopeAnalysisResult;
  unitDetection?: UnitDetectionResult;
  bidText?: string;
  enableAI?: boolean;
  aiQuestionsToAsk?: string[];
  className?: string;
  onQuestionsReady?: (questions: string[]) => void; // Callback to pass questions to parent
}

interface AIScopeItem {
  name: string;
  category: string;
  confidence: 'explicit' | 'implied' | 'missing';
  importance: 'critical' | 'important' | 'nice-to-have';
  evidence?: string;
  questionToAsk?: string;
}

interface AIScopeResponse {
  success: boolean;
  data?: {
    includedItems: AIScopeItem[];
    missingItems: AIScopeItem[];
    summary: string;
    scopeScore: number;
    source: string;
  };
  error?: string;
}

const CATEGORY_INFO: Record<ScopeItemCategory, { label: string; order: number }> = {
  labor: { label: 'Labor & Installation', order: 1 },
  materials: { label: 'Materials', order: 2 },
  fixtures: { label: 'Fixtures', order: 3 },
  permits: { label: 'Permits & Inspections', order: 4 },
  cleanup: { label: 'Cleanup & Disposal', order: 5 },
  protection: { label: 'Protection', order: 6 },
  warranty: { label: 'Warranty & Guarantees', order: 7 },
};

export function ScopeComparisonCard({ scopeAnalysis, unitDetection, bidText, enableAI = true, aiQuestionsToAsk = [], className = '', onQuestionsReady }: ScopeComparisonCardProps) {
  // Questions UI moved to unified QuestionsToAskCard
  const [expandedIncluded, setExpandedIncluded] = useState(true);
  const [expandedMissing, setExpandedMissing] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiData, setAiData] = useState<AIScopeResponse['data'] | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    if (!enableAI || !bidText || bidText.length < 50) return;
    
    const fetchAIAnalysis = async () => {
      setAiLoading(true);
      setAiError(null);
      
      try {
        const response = await fetch('/api/scope-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bidText,
            projectType: scopeAnalysis.projectType
          })
        });
        
        const result: AIScopeResponse = await response.json();
        
        if (result.success && result.data) {
          setAiData(result.data);
        } else {
          setAiError(result.error || 'AI analysis failed');
        }
      } catch (err) {
        console.error('AI scope analysis error:', err);
        setAiError('Failed to fetch AI analysis');
      } finally {
        setAiLoading(false);
      }
    };
    
    fetchAIAnalysis();
  }, [bidText, enableAI, scopeAnalysis.projectType]);

  const convertAIToDetectedItem = (item: AIScopeItem, index: number, status: 'included' | 'implied' | 'missing'): DetectedScopeItem => {
    const validCategory = Object.keys(CATEGORY_INFO).includes(item.category) 
      ? item.category as ScopeItemCategory 
      : 'materials';
    
    const mappedStatus = status === 'included' ? 'implied' : status;
    
    return {
      id: `ai-${status}-${index}`,
      name: item.name,
      category: validCategory,
      importance: item.importance,
      detectionPatterns: [],
      status: mappedStatus as 'implied' | 'missing',
      matchedText: item.evidence || '',
      questionToAsk: item.questionToAsk || ''
    };
  };

  const effectiveFoundItems = useMemo(() => {
    if (aiData) {
      return aiData.includedItems.map((item, i) => 
        convertAIToDetectedItem(item, i, item.confidence === 'implied' ? 'implied' : 'included')
      );
    }
    return [...scopeAnalysis.includedItems, ...scopeAnalysis.impliedItems];
  }, [aiData, scopeAnalysis]);

  const effectiveMissingItems = useMemo(() => {
    if (aiData) {
      return aiData.missingItems.map((item, i) => convertAIToDetectedItem(item, i, 'missing'));
    }
    return scopeAnalysis.missingItems;
  }, [aiData, scopeAnalysis]);

  const foundItems = useMemo(() => {
    return effectiveFoundItems
      .sort((a, b) => CATEGORY_INFO[a.category].order - CATEGORY_INFO[b.category].order);
  }, [effectiveFoundItems]);

  const sortedMissingItems = useMemo(() => {
    const importanceOrder: Record<ScopeImportance, number> = { critical: 1, important: 2, 'nice-to-have': 3 };
    return [...effectiveMissingItems].sort((a, b) => {
      const impDiff = importanceOrder[a.importance] - importanceOrder[b.importance];
      if (impDiff !== 0) return impDiff;
      return CATEGORY_INFO[a.category].order - CATEGORY_INFO[b.category].order;
    });
  }, [effectiveMissingItems]);

  const effectiveQuestions = useMemo(() => {
    const questions: string[] = [];
    const seen = new Set<string>();
    
    const addUnique = (q: string) => {
      const normalized = q.toLowerCase().trim();
      if (!seen.has(normalized) && q.trim()) {
        seen.add(normalized);
        questions.push(q);
      }
    };
    
    if (aiQuestionsToAsk && aiQuestionsToAsk.length > 0) {
      aiQuestionsToAsk.forEach(addUnique);
    }
    
    if (aiData) {
      aiData.missingItems
        .filter(item => item.questionToAsk)
        .forEach(item => addUnique(item.questionToAsk!));
    }
    
    scopeAnalysis.questionsToAsk.forEach(addUnique);
    
    return questions;
  }, [aiData, aiQuestionsToAsk, scopeAnalysis.questionsToAsk]);

  // Pass questions up to parent for consolidated display
  useEffect(() => {
    if (onQuestionsReady) {
      onQuestionsReady(effectiveQuestions);
    }
  }, [effectiveQuestions, onQuestionsReady]);

  // V2 Summary stats - Included/Important/Critical counts
  const summaryStats = useMemo(() => {
    const criticalMissing = effectiveMissingItems.filter(i => i.importance === 'critical').length;
    const importantMissing = effectiveMissingItems.filter(i => i.importance === 'important').length;
    
    const includedCount = effectiveFoundItems.length;
    const missingCount = effectiveMissingItems.length;
    const totalItems = includedCount + missingCount;
    const coveragePercent = totalItems > 0 ? Math.round((includedCount / totalItems) * 100) : 100;
    
    return {
      totalFound: effectiveFoundItems.length,
      criticalMissing,
      importantMissing,
      includedCount,
      missingCount,
      coveragePercent
    };
  }, [effectiveFoundItems, effectiveMissingItems]);

  const filteredUnitItems = useMemo(() => {
    if (!unitDetection?.items) return [];
    return deduplicateUnitItems(unitDetection.items);
  }, [unitDetection]);

  // copyQuestion moved to unified QuestionsToAskCard

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
      {/* Header - Black with green icon */}
      <div className="bg-black px-6 py-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center">
          {aiLoading ? (
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          ) : (
            <ClipboardList className="w-8 h-8 text-emerald-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-2xl font-bold text-white">Scope Analysis</h3>
          {aiLoading && (
            <span className="text-sm text-white/60">Analyzing...</span>
          )}
          {aiError && (
            <div className="text-xs text-white/70 flex items-center gap-1 mt-1">
              <Info className="w-3 h-3" />
              Using pattern-based analysis (AI unavailable)
            </div>
          )}
        </div>
      </div>

      {/* Scope Coverage Bar */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-600">Scope Coverage</span>
          <span className="text-2xl font-bold text-slate-800">{summaryStats.coveragePercent}%</span>
        </div>
        
        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${summaryStats.coveragePercent}%` }}
          />
        </div>
      </div>

      {/* V2 Three Status Cards: Included / Important / Critical */}
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="grid grid-cols-3 gap-4">
          {/* Included - Green */}
          <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-200">
            <div className="text-4xl font-bold text-emerald-600 mb-1">
              {summaryStats.includedCount}
            </div>
            <div className="text-sm font-medium text-emerald-700">Included</div>
          </div>
          
          {/* Important - Amber/Yellow */}
          <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-200">
            <div className="text-4xl font-bold text-amber-600 mb-1">
              {summaryStats.importantMissing}
            </div>
            <div className="text-sm font-medium text-amber-700">Important</div>
          </div>
          
          {/* Critical - Red */}
          <div className="bg-red-50 rounded-xl p-4 text-center border border-red-200">
            <div className="text-4xl font-bold text-red-600 mb-1">
              {summaryStats.criticalMissing}
            </div>
            <div className="text-sm font-medium text-red-700">Critical</div>
          </div>
        </div>
      </div>

      {/* Project Scope Definition - Unit Count */}
      {filteredUnitItems.length > 0 && (
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="space-y-2">
            {filteredUnitItems.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Package className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <span className="font-semibold text-slate-800">
                    {item.quantity} {item.description}
                  </span>
                  {item.confidence === 'high' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                      Verified
                    </span>
                  )}
                </div>
                {item.pricePerUnit && (
                  <span className="text-sm text-slate-600">
                    ${item.pricePerUnit.toLocaleString()}/each
                  </span>
                )}
              </div>
            ))}
          </div>
          
          {filteredUnitItems.length > 0 && !unitDetection?.hasUnitPricing && (
            <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800">
                <strong>Tip:</strong> Ask for per-unit pricing breakdowns to better understand costs and compare with other quotes.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Two-Panel Layout: Included in Estimate | Needs Attention */}
      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
        {/* INCLUDED Panel - Green checkmarks */}
        <div className="bg-white">
          <button
            onClick={() => setExpandedIncluded(!expandedIncluded)}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-100"
          >
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-emerald-600" />
              <span className="font-semibold text-slate-800">Included in Estimate</span>
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {foundItems.length}
              </span>
            </div>
            {expandedIncluded ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>
          
          {expandedIncluded && (
            <div className="px-5 pb-5 pt-3">
              {foundItems.length === 0 ? (
                <p className="text-sm text-slate-500 italic py-2">No specific items detected</p>
              ) : (
                <div className="space-y-2">
                  {foundItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-2 py-1"
                    >
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-700">{item.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* NEEDS ATTENTION Panel - Warning triangles with severity badges */}
        <div className="bg-white">
          <button
            onClick={() => setExpandedMissing(!expandedMissing)}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-100"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span className="font-semibold text-slate-800">Needs Attention</span>
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {sortedMissingItems.length}
              </span>
            </div>
            {expandedMissing ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>
          
          {expandedMissing && (
            <div className="px-5 pb-5 pt-3">
              {sortedMissingItems.length === 0 ? (
                <p className="text-sm text-emerald-600 py-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  All expected items found!
                </p>
              ) : (
                <div className="space-y-2">
                  {sortedMissingItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-2 py-1"
                    >
                      {/* Icon based on severity */}
                      <div className="mt-0.5 flex-shrink-0">
                        {item.importance === 'critical' ? (
                          <XCircle className="w-4 h-4 text-red-500" />
                        ) : item.importance === 'important' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      
                      {/* Item text with color coding */}
                      <span className={`text-sm flex-1 ${
                        item.importance === 'critical' ? 'text-red-600' :
                        item.importance === 'important' ? 'text-amber-600' : 'text-slate-600'
                      }`}>
                        {item.name}
                      </span>
                      
                      {/* V2 Severity Badge - pill-shaped, right-aligned */}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase flex-shrink-0 ${
                        item.importance === 'critical' 
                          ? 'bg-red-100 text-red-700' 
                          : item.importance === 'important'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.importance === 'nice-to-have' ? 'optional' : item.importance}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Questions section MOVED to unified QuestionsToAskCard (Feb 2025) */}
    </div>
  );
}

export default ScopeComparisonCard;
