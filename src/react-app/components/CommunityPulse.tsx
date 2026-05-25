import { useMemo, useState, useEffect } from 'react';
import { MessageCircle, Bot, Loader2, AlertCircle, MapPin, AlertTriangle, Info, HelpCircle, ShieldAlert, Droplets, Home, FileText, ChevronDown, ChevronUp } from 'lucide-react';

type CommunitySentiment = 'positive' | 'neutral' | 'cautious' | 'frustrated';

interface RegionalInsight {
  topic: string;
  concern: string;
  redditTakeaway: string;
  questionToAsk: string;
  severity: 'info' | 'warning' | 'critical';
}

interface RegionalInsightsData {
  stateName: string;
  stateCode: string;
  climate: string;
  overview: string;
  insights: RegionalInsight[];
  commonScams: string[];
  licensingNotes: string;
}

interface CommunityInsight {
  sentiment: CommunitySentiment;
  threadCount: number;
  synthesis: string;
  topics: string[];
  regionalData?: RegionalInsightsData | null;
  relevantRegionalInsights?: RegionalInsight[];
  relevantScams?: string[];
}

interface CommunityPulseProps {
  bidContent: string;
  projectType?: string | null;
  stateCode?: string | null;
  className?: string;
}

const SENTIMENT_CONFIG: Record<CommunitySentiment, {
  emoji: string;
  color: string;
  bgColor: string;
  label: string;
}> = {
  positive: {
    emoji: '😊',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100',
    label: 'Positive'
  },
  neutral: {
    emoji: '😐',
    color: 'text-slate-700',
    bgColor: 'bg-slate-200',
    label: 'Neutral'
  },
  cautious: {
    emoji: '🤔',
    color: 'text-teal-700',
    bgColor: 'bg-teal-100',
    label: 'Cautious'
  },
  frustrated: {
    emoji: '😤',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    label: 'Frustrated'
  }
};

export default function CommunityPulse({ 
  bidContent, 
  projectType,
  stateCode,
  className = '' 
}: CommunityPulseProps) {
  const [insight, setInsight] = useState<CommunityInsight | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchInsight = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/analyze/community', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            bidText: bidContent,
            projectType: projectType || 'general',
            stateCode: stateCode || undefined
          })
        });

        const data = await response.json();
        
        if (!mounted) return;
        
        if (data.success && data.insight) {
          setInsight(data.insight);
        } else {
          setError(data.error || 'Failed to fetch community insights');
        }
      } catch (err) {
        if (!mounted) return;
        setError('Unable to connect to community insights service');
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchInsight();

    return () => {
      mounted = false;
    };
  }, [bidContent, projectType, stateCode]);

  const sentimentConfig = useMemo(() => {
    if (!insight) return null;
    return SENTIMENT_CONFIG[insight.sentiment];
  }, [insight]);

  if (isLoading) {
    return (
      <div className={`bg-slate-50 rounded-2xl shadow-sm overflow-hidden border border-slate-200 ${className}`}>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="w-5 h-5 text-[#ff4500]" />
            <h3 className="text-lg font-semibold text-gray-900">Community Pulse</h3>
            <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-orange-50 text-[#ff4500] rounded-full">
              Social Data
            </span>
          </div>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-[#ff4500] animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !insight) {
    return (
      <div className={`bg-slate-50 rounded-2xl shadow-sm overflow-hidden border border-slate-200 ${className}`}>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="w-5 h-5 text-[#ff4500]" />
            <h3 className="text-lg font-semibold text-gray-900">Community Pulse</h3>
            <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-orange-50 text-[#ff4500] rounded-full">
              Social Data
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-teal-50 border border-teal-200 rounded-xl">
              <AlertCircle className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-teal-700">
                {error || 'Community insights temporarily unavailable'}
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#ff4500] hover:bg-[#e03d00] text-white text-sm font-medium rounded-lg transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Retry Community Analysis
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-50 rounded-2xl shadow-sm overflow-hidden border border-slate-200 ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="w-5 h-5 text-[#ff4500]" />
          <h3 className="text-lg font-semibold text-gray-900">Community Pulse</h3>
          <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-orange-50 text-[#ff4500] rounded-full">
            Social Data
          </span>
        </div>

        {/* Sentiment Badge */}
        {sentimentConfig && (
          <div className="flex items-center gap-3 mb-4">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${sentimentConfig.bgColor} ${sentimentConfig.color}`}>
              <span>{sentimentConfig.emoji}</span>
              Sentiment: {sentimentConfig.label}
            </span>
          </div>
        )}

        {/* Synthesis Card */}
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-[#ff4500]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#ff4500] mb-1">Synthesis</p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {insight.synthesis}
              </p>
            </div>
          </div>
        </div>

        {/* Topics (if available) */}
        {insight.topics && insight.topics.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-gray-500 mb-2">Common Discussion Topics:</p>
            <div className="flex flex-wrap gap-2">
              {insight.topics.map((topic, idx) => (
                <span 
                  key={idx}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs text-gray-600"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Regional Insights Section */}
        {insight.regionalData && insight.relevantRegionalInsights && insight.relevantRegionalInsights.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            {/* Regional Header */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">
                  {insight.regionalData.stateName} Regional Insights
                </h4>
                <p className="text-xs text-gray-500">{insight.regionalData.climate}</p>
              </div>
              <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-orange-50 text-[#ff4500] rounded-full flex items-center gap-1">
                <span className="text-[10px]">📍</span> Reddit
              </span>
            </div>

            {/* Overview */}
            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              {insight.regionalData.overview}
            </p>

            {/* Regional Insight Cards */}
            <div className="space-y-2">
              {insight.relevantRegionalInsights.map((regionalInsight, idx) => {
                const isExpanded = expandedInsight === idx;
                const severityStyles = {
                  critical: {
                    leftBorder: 'border-l-red-500',
                    iconColor: 'text-red-500',
                    titleColor: 'text-red-600',
                    Icon: Droplets
                  },
                  warning: {
                    leftBorder: 'border-l-amber-400',
                    iconColor: 'text-amber-500',
                    titleColor: 'text-amber-600',
                    Icon: Droplets
                  },
                  info: {
                    leftBorder: 'border-l-blue-500',
                    iconColor: 'text-blue-500',
                    titleColor: 'text-blue-600',
                    Icon: FileText
                  }
                };
                const style = severityStyles[regionalInsight.severity];

                // Pick icon based on topic keywords
                let TopicIcon = style.Icon;
                const topicLower = regionalInsight.topic.toLowerCase();
                if (topicLower.includes('moisture') || topicLower.includes('mold') || topicLower.includes('humidity') || topicLower.includes('water') || topicLower.includes('rain') || topicLower.includes('flood') || topicLower.includes('crawl')) {
                  TopicIcon = Droplets;
                } else if (topicLower.includes('foundation') || topicLower.includes('clay') || topicLower.includes('home') || topicLower.includes('termite')) {
                  TopicIcon = Home;
                } else if (topicLower.includes('permit') || topicLower.includes('license') || topicLower.includes('code')) {
                  TopicIcon = FileText;
                } else if (topicLower.includes('warning') || topicLower.includes('scam') || topicLower.includes('danger')) {
                  TopicIcon = AlertTriangle;
                }

                return (
                  <div 
                    key={idx}
                    className={`bg-white rounded-lg border border-slate-200 border-l-4 ${style.leftBorder} overflow-hidden`}
                  >
                    {/* Clickable Header */}
                    <button
                      onClick={() => setExpandedInsight(isExpanded ? null : idx)}
                      className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-slate-50 transition-colors"
                    >
                      <TopicIcon className={`w-5 h-5 ${style.iconColor} flex-shrink-0`} />
                      <span className={`text-sm font-semibold ${style.titleColor} flex-1`}>
                        {regionalInsight.topic}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </button>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-3">
                        {/* Concern */}
                        <p className="text-sm text-gray-700">
                          {regionalInsight.concern}
                        </p>

                        {/* Reddit Takeaway */}
                        <div className="bg-red-50 rounded-lg p-3">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-sm">💬</span>
                            <span className="text-xs font-semibold text-red-700">Reddit Takeaway:</span>
                          </div>
                          <p className="text-sm text-gray-700 italic pl-5">
                            "{regionalInsight.redditTakeaway}"
                          </p>
                        </div>

                        {/* Question to Ask */}
                        <div className="bg-emerald-50 rounded-lg p-3">
                          <div className="flex items-center gap-1.5 mb-1">
                            <HelpCircle className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs font-semibold text-emerald-700">Ask Your Contractor:</span>
                          </div>
                          <p className="text-sm text-gray-700 pl-5">
                            "{regionalInsight.questionToAsk}"
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Common Scams Warning - only show if relevant to project type */}
            {insight.relevantScams && insight.relevantScams.length > 0 && (
              <div className="mt-4 p-3 bg-white rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert className="w-4 h-4 text-[#ff4500]" />
                  <span className="text-xs font-semibold text-[#ff4500]">
                    Watch Out For
                  </span>
                </div>
                <ul className="space-y-1.5 pl-6">
                  {insight.relevantScams.slice(0, 3).map((scam, idx) => (
                    <li key={idx} className="text-xs text-slate-700 list-disc">
                      {scam}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Licensing Notes */}
            {insight.regionalData.licensingNotes && (
              <div className="mt-3 p-3 bg-slate-100 rounded-xl">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold">Licensing: </span>
                    {insight.regionalData.licensingNotes}
                  </p>
                </div>
              </div>
            )}

            {/* Source Footer */}
            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-center gap-2 text-slate-400">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">Source: <span className="text-[#ff4500] font-medium">Reddit</span></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
