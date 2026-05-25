/**
 * UnifiedNegotiationCard - Single negotiation script based on bid analysis findings
 * Simple, clear, one-time generation - no regenerate button
 */

import { useState, useMemo } from 'react';
import { 
  Copy, Check, ChevronDown, MessageCircle, 
  TrendingUp, TrendingDown, Minus, AlertTriangle, HelpCircle
} from 'lucide-react';

interface Flag {
  title: string;
  description: string;
  level: 'critical' | 'high' | 'medium' | 'low';
}

interface UnifiedNegotiationCardProps {
  bidTotal: number;
  contractorName?: string;
  projectType: string;
  // Price verdict
  priceVerdict: 'good-deal' | 'fair' | 'overpriced' | 'suspiciously-low';
  percentFromMarket: number;
  cityName: string;
  // Negotiation target - fair market price
  negotiationTarget?: number;
  // From bid analysis
  flags: Flag[];
  missingItems: string[];
  // Change order risk questions
  changeOrderQuestions?: string[];
}

interface Question {
  text: string;
  source: 'flag' | 'scope' | 'general' | 'change-order';
}

const VERDICT_CONFIG = {
  'good-deal': {
    icon: TrendingDown,
    label: 'Below Market',
    // Emerald - matches PriceAnalysisCard "Below Market"
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
    iconBorder: 'border-emerald-200',
    headerBg: 'bg-white',
    titleColor: 'text-emerald-700',
    subtitleColor: 'text-navy-600',
    priceColor: 'text-navy-900',
  },
  'fair': {
    icon: Minus,
    label: 'Market Rate',
    // Blue - matches PriceAnalysisCard "Market Rate"
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
    iconBorder: 'border-blue-200',
    headerBg: 'bg-white',
    titleColor: 'text-blue-700',
    subtitleColor: 'text-navy-600',
    priceColor: 'text-navy-900',
  },
  'overpriced': {
    icon: TrendingUp,
    label: 'Above Market',
    // Red - matches PriceAnalysisCard "Premium Pricing"
    iconColor: 'text-red-600',
    iconBg: 'bg-red-50',
    iconBorder: 'border-red-200',
    headerBg: 'bg-white',
    titleColor: 'text-red-700',
    subtitleColor: 'text-navy-600',
    priceColor: 'text-navy-900',
  },
  'suspiciously-low': {
    icon: AlertTriangle,
    label: 'Unusually Low',
    // Green solid bg with white icon - matches PriceAnalysisCard
    iconColor: 'text-white',
    iconBg: 'bg-[#1F9C4C]',
    iconBorder: 'border-[#1F9C4C]',
    headerBg: 'bg-white',
    titleColor: 'text-[#1F9C4C]',
    subtitleColor: 'text-navy-600',
    priceColor: 'text-navy-900',
  },
};

function generateScript(
  verdict: 'good-deal' | 'fair' | 'overpriced' | 'suspiciously-low',
  bidTotal: number,
  contractorName: string,
  projectType: string,
  _percentFromMarket: number,
  cityName: string,
  flags: Flag[],
  missingItems: string[],
  negotiationTarget?: number,
  changeOrderQuestions?: string[]
): { script: string; questions: Question[] } {
  const questions: Question[] = [];
  
  // Format project type nicely (capitalize each word)
  const formattedProject = (projectType || 'Project')
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  let script = `Hi ${contractorName},\n\nThank you for the estimate on my ${formattedProject} project.\n\n`;
  
  // Price section based on verdict - conversational tone
  switch (verdict) {
    case 'good-deal':
      script += `Your bid of $${bidTotal.toLocaleString()} looks like a very competitive price from what I've researched, so I'd like to make sure this is a complete quote and nothing is missing. Is there anything we should consider that could be a surprise?\n\n`;
      questions.push({ text: 'Are there any hidden costs or potential surprises I should know about?', source: 'general' });
      break;
    case 'fair':
      script += `Your bid of $${bidTotal.toLocaleString()} seems in line with what I've seen for similar work in ${cityName}. Before we move forward, I want to make sure I understand everything that's included.\n\n`;
      break;
    case 'overpriced':
      script += `Your bid of $${bidTotal.toLocaleString()} is higher than other quotes I've received for similar work in ${cityName}. I'd love to understand what sets your approach apart.`;
      if (negotiationTarget && negotiationTarget > 0) {
        script += ` I'd like to try and stay below $${negotiationTarget.toLocaleString()}, if we can do that I'm ready to sign and get things started.\n\n`;
      } else {
        script += ` Is there any flexibility in the scope or price?\n\n`;
      }
      questions.push({ text: 'What makes your approach different from other contractors?', source: 'general' });
      questions.push({ text: 'Is there any flexibility in the scope or price?', source: 'general' });
      break;
    case 'suspiciously-low':
      script += `Your bid of $${bidTotal.toLocaleString()} is quite a bit lower than other quotes I've seen. I want to make sure this covers everything and there won't be any surprises down the road.\n\n`;
      questions.push({ text: 'Is this a complete quote with permits, cleanup, and all materials included?', source: 'general' });
      questions.push({ text: 'Are all your subcontractors licensed and insured?', source: 'general' });
      break;
  }
  
  // Collect missing items and flag-based concerns together
  const concernItems: string[] = [];
  
  // Add concerns from flags (high and critical only) - simplified descriptions
  const significantFlags = flags.filter(f => f.level === 'critical' || f.level === 'high');
  significantFlags.slice(0, 3).forEach(flag => {
    const title = flag.title.toLowerCase();
    if (title.includes('insurance') || title.includes('liability')) {
      concernItems.push("Liability insurance information - I'd like to know all your crew are on your docket");
      questions.push({ text: 'Can you provide proof of liability insurance?', source: 'flag' });
    } else if (title.includes('payment') || title.includes('deposit')) {
      concernItems.push('Payment schedule details');
      questions.push({ text: 'Can we discuss the payment schedule? I prefer milestone-based payments.', source: 'flag' });
    } else if (title.includes('warranty')) {
      concernItems.push('Warranty information');
      questions.push({ text: 'What warranty do you provide on workmanship?', source: 'flag' });
    } else if (title.includes('permit')) {
      concernItems.push('Permit requirements');
      questions.push({ text: 'Will you be pulling all required permits?', source: 'flag' });
    } else if (title.includes('timeline') || title.includes('schedule')) {
      concernItems.push('Project timeline and completion date');
      questions.push({ text: 'What is the expected timeline for completion?', source: 'flag' });
    } else if (title.includes('cleanup') || title.includes('debris')) {
      concernItems.push('Debris removal and daily cleanup');
    } else {
      concernItems.push(flag.title);
      questions.push({ text: `Can you clarify the ${flag.title.toLowerCase()}?`, source: 'flag' });
    }
  });
  
  // Add missing scope items
  missingItems.slice(0, 4).forEach(item => {
    concernItems.push(item);
  });
  
  // Write concerns as bullet list if we have any
  if (concernItems.length > 0) {
    script += `I also noticed these items aren't addressed in the estimate:\n\n`;
    concernItems.forEach(item => {
      script += `• ${item}\n`;
    });
    script += '\n';
  }
  
  // Add change order risk questions (up to 3)
  if (changeOrderQuestions && changeOrderQuestions.length > 0) {
    changeOrderQuestions.slice(0, 3).forEach(q => {
      questions.push({ text: q, source: 'change-order' });
    });
  }
  
  // Add standard questions if we don't have many
  if (questions.length < 2) {
    if (!questions.some(q => q.text.toLowerCase().includes('warranty'))) {
      questions.push({ text: 'What warranty do you provide on workmanship?', source: 'general' });
    }
    if (!questions.some(q => q.text.toLowerCase().includes('timeline'))) {
      questions.push({ text: 'What is the expected start date and timeline?', source: 'general' });
    }
  }
  
  // Closing - conversational
  script += `I'd like to discuss these points before moving forward. When would be a good time to talk?\n\nThanks,\n[Your Name]`;
  
  // Deduplicate questions
  const seen = new Set<string>();
  const uniqueQuestions = questions.filter(q => {
    const key = q.text.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  return { script, questions: uniqueQuestions.slice(0, 6) };
}

export default function UnifiedNegotiationCard({
  bidTotal = 0,
  contractorName = '[Contractor Name]',
  projectType = 'Project',
  priceVerdict = 'fair',
  percentFromMarket = 0,
  cityName = 'your area',
  negotiationTarget,
  flags = [],
  missingItems = [],
  changeOrderQuestions = [],
}: UnifiedNegotiationCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [messageCopied, setMessageCopied] = useState(false);
  const [questionsExpanded, setQuestionsExpanded] = useState(false);
  const [copiedQuestion, setCopiedQuestion] = useState<number | null>(null);
  
  const config = VERDICT_CONFIG[priceVerdict] || VERDICT_CONFIG['fair'];
  const Icon = config.icon;
  
  const { script, questions } = useMemo(() => 
    generateScript(priceVerdict, bidTotal, contractorName, projectType, percentFromMarket, cityName, flags, missingItems, negotiationTarget, changeOrderQuestions),
    [priceVerdict, bidTotal, contractorName, projectType, percentFromMarket, cityName, flags, missingItems, negotiationTarget, changeOrderQuestions]
  );
  
  const handleCopyMessage = async () => {
    await navigator.clipboard.writeText(script);
    setMessageCopied(true);
    setTimeout(() => setMessageCopied(false), 2000);
  };
  
  const handleCopyQuestion = async (index: number, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedQuestion(index);
    setTimeout(() => setCopiedQuestion(null), 2000);
  };
  
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
      {/* Verdict Header - Color-coded by verdict */}
      <div className={`${config.headerBg} px-6 py-5 border-b border-slate-200`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 rounded-2xl ${config.iconBg} border ${config.iconBorder} flex items-center justify-center`}>
              <Icon className={`w-6 h-6 ${config.iconColor}`} />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${config.titleColor}`}>{config.label}</h2>
              <p className={`${config.subtitleColor} text-sm`}>
                {priceVerdict === 'good-deal' && 'This bid is priced competitively below typical market rates'}
                {priceVerdict === 'fair' && 'This bid is priced in line with typical market rates'}
                {priceVerdict === 'overpriced' && 'This bid is priced above typical market rates'}
                {priceVerdict === 'suspiciously-low' && 'Price seems too low - verify nothing is missing'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${config.priceColor}`}>${bidTotal.toLocaleString()}</div>
          </div>
        </div>
      </div>
      
      {/* Questions Section - Collapsible at top */}
      {questions.length > 0 && (
        <div className="border-b border-slate-200">
          <button
            onClick={() => setQuestionsExpanded(!questionsExpanded)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-purple-500" />
              <span className="font-semibold text-navy-900">Questions to Ask</span>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{questions.length}</span>
            </div>
            <ChevronDown className={`w-5 h-5 text-navy-400 transition-transform ${questionsExpanded ? 'rotate-180' : ''}`} />
          </button>
          
          {questionsExpanded && (
            <div className="px-6 pb-4 space-y-2">
              {questions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleCopyQuestion(i, q.text)}
                  className={`w-full text-left p-3 rounded-lg border transition-all flex items-start justify-between gap-3 ${
                    copiedQuestion === i 
                      ? 'bg-emerald-50 border-emerald-200' 
                      : 'bg-slate-50 border-slate-200 hover:border-purple-300 hover:bg-purple-50/50'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-100 text-purple-600 text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-sm text-navy-700">{q.text}</span>
                  </div>
                  <div className={`p-1 rounded flex-shrink-0 ${copiedQuestion === i ? 'text-emerald-600' : 'text-navy-300'}`}>
                    {copiedQuestion === i ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Script Section - Collapsible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors border-b border-slate-100"
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-emerald-500" />
          <span className="font-semibold text-navy-900">Ready-to-Send Message</span>
        </div>
        <ChevronDown className={`w-5 h-5 text-navy-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      
      {expanded && (
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-navy-500">Copy and personalize before sending</span>
            <button
              onClick={handleCopyMessage}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                messageCopied 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-emerald-500 text-white hover:bg-emerald-600'
              }`}
            >
              {messageCopied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Message
                </>
              )}
            </button>
          </div>
          
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 font-mono text-sm text-navy-700 whitespace-pre-wrap max-h-96 overflow-y-auto">
            {script}
          </div>
        </div>
      )}
    </div>
  );
}
