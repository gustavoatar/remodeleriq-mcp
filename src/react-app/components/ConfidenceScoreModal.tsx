import { X, Shield, AlertCircle, AlertTriangle, Info, CheckCircle, Scale, FileSearch, Clock, FileText, Wallet, Wrench, HardHat, TrendingDown } from 'lucide-react';

interface FlagCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface ConfidenceScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScore?: number;
  flagCounts?: FlagCounts;
}

export default function ConfidenceScoreModal({ isOpen, onClose, currentScore, flagCounts }: ConfidenceScoreModalProps) {
  if (!isOpen) return null;
  
  // Calculate deductions for the summary
  const calculateDeductions = () => {
    if (!flagCounts) return null;
    
    const criticalDeduction = flagCounts.critical * 20;
    const highDeduction = flagCounts.high * 15;
    const mediumDeduction = flagCounts.medium * 7;
    const lowDeduction = flagCounts.low * 3;
    const totalDeduction = criticalDeduction + highDeduction + mediumDeduction + lowDeduction;
    
    return { criticalDeduction, highDeduction, mediumDeduction, lowDeduction, totalDeduction };
  };
  
  const deductionSummary = calculateDeductions();
  
  // Generate personalized summary text
  const getSummaryText = () => {
    if (!flagCounts || !currentScore) return null;
    
    const totalIssues = flagCounts.critical + flagCounts.high + flagCounts.medium + flagCounts.low;
    
    if (totalIssues === 0) {
      return "Your bid looks great! We didn't find any significant issues to flag.";
    }
    
    const parts: string[] = [];
    
    if (flagCounts.critical > 0) {
      parts.push(`${flagCounts.critical} critical issue${flagCounts.critical > 1 ? 's' : ''} (-${flagCounts.critical * 20} pts)`);
    }
    if (flagCounts.high > 0) {
      parts.push(`${flagCounts.high} high-priority issue${flagCounts.high > 1 ? 's' : ''} (-${flagCounts.high * 15} pts)`);
    }
    if (flagCounts.medium > 0) {
      parts.push(`${flagCounts.medium} medium issue${flagCounts.medium > 1 ? 's' : ''} (-${flagCounts.medium * 7} pts)`);
    }
    if (flagCounts.low > 0) {
      parts.push(`${flagCounts.low} minor issue${flagCounts.low > 1 ? 's' : ''} (-${flagCounts.low * 3} pts)`);
    }
    
    return parts.join(', ');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-teal-600';
    if (score >= 40) return 'text-green-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-100 border-emerald-300';
    if (score >= 60) return 'bg-teal-100 border-teal-300';
    if (score >= 40) return 'bg-green-100 border-green-300';
    return 'bg-red-100 border-red-300';
  };

  const checklistItems = [
    { icon: HardHat, label: 'Contractor licensing', description: 'License number present for projects over state threshold' },
    { icon: Wallet, label: 'Payment terms & deposit safety', description: 'Deposit percentage, payment milestones, no risky 50/50 splits' },
    { icon: Scale, label: 'Dispute resolution clauses', description: 'No binding arbitration or unfair liability waivers' },
    { icon: FileText, label: 'Change order protection', description: 'Written approval required for any extra work' },
    { icon: Clock, label: 'Timeline & completion dates', description: 'Start/end dates specified with delay penalties' },
    { icon: FileSearch, label: 'Permit responsibilities', description: 'Clear assignment of who pulls permits' },
    { icon: Wrench, label: 'Scope & material specificity', description: 'Brand names, measurements, material specs included' },
    { icon: Shield, label: 'Insurance & warranty coverage', description: 'Liability insurance and workmanship guarantees' },
  ];

  const scoreRanges = [
    { range: '80-100', label: 'Looking good', color: 'bg-emerald-500', description: 'Solid bid with minor concerns' },
    { range: '60-79', label: 'Needs attention', color: 'bg-teal-500', description: 'Significant concerns, negotiate before signing' },
    { range: '40-59', label: 'Significant concerns', color: 'bg-green-500', description: 'Major red flags, proceed with caution' },
    { range: 'Below 40', label: 'Major red flags', color: 'bg-red-500', description: 'Critical issues, get another bid' },
  ];

  const deductions = [
    { level: 'Critical', points: -20, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', example: 'Missing license, excessive deposit' },
    { level: 'High', points: -15, icon: AlertTriangle, color: 'text-teal-500', bg: 'bg-teal-50', example: 'Binding arbitration, permit issues' },
    { level: 'Medium', points: -7, icon: AlertTriangle, color: 'text-green-500', bg: 'bg-green-50', example: 'Vague scope, no timeline' },
    { level: 'Low', points: -3, icon: Info, color: 'text-blue-500', bg: 'bg-blue-50', example: 'No delay penalty' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-navy-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">How We Calculate Your Score</h2>
                <p className="text-purple-100 text-sm">Our methodology explained</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Current Score Display */}
          {currentScore !== undefined && (
            <div className="mt-4 flex items-center gap-3">
              <span className="text-purple-100">Your current score:</span>
              <span className={`text-2xl font-bold px-3 py-1 rounded-lg border ${getScoreBg(currentScore)} ${getScoreColor(currentScore)}`}>
                {currentScore}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Personalized Score Summary */}
          {currentScore !== undefined && flagCounts && deductionSummary && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-navy-900 mb-3 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-purple-600" />
                Your Score Breakdown
              </h3>
              <div className={`rounded-xl p-5 border ${
                currentScore >= 80 ? 'bg-emerald-50 border-emerald-200' :
                currentScore >= 60 ? 'bg-teal-50 border-teal-200' :
                currentScore >= 40 ? 'bg-green-50 border-green-200' :
                'bg-red-50 border-red-200'
              }`}>
                {/* Visual calculation */}
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <div className="bg-white rounded-lg px-4 py-2 border border-navy-200">
                    <span className="text-2xl font-bold text-purple-600">100</span>
                    <span className="text-sm text-navy-500 ml-1">starting</span>
                  </div>
                  {deductionSummary.totalDeduction > 0 && (
                    <>
                      <span className="text-2xl font-bold text-navy-400">−</span>
                      <div className="bg-white rounded-lg px-4 py-2 border border-red-200">
                        <span className="text-2xl font-bold text-red-600">{deductionSummary.totalDeduction}</span>
                        <span className="text-sm text-navy-500 ml-1">deducted</span>
                      </div>
                    </>
                  )}
                  <span className="text-2xl font-bold text-navy-400">=</span>
                  <div className={`rounded-lg px-4 py-2 border ${getScoreBg(currentScore)}`}>
                    <span className={`text-2xl font-bold ${getScoreColor(currentScore)}`}>{currentScore}</span>
                    <span className="text-sm text-navy-500 ml-1">final</span>
                  </div>
                </div>
                
                {/* Issue breakdown */}
                <p className="text-navy-700 mb-3">{getSummaryText()}</p>
                
                {/* Individual deduction bars */}
                {deductionSummary.totalDeduction > 0 && (
                  <div className="space-y-2">
                    {flagCounts.critical > 0 && (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <div className="flex-1 h-2 bg-white rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-red-500 rounded-full" 
                            style={{ width: `${(deductionSummary.criticalDeduction / deductionSummary.totalDeduction) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-red-600 w-16 text-right">-{deductionSummary.criticalDeduction}</span>
                      </div>
                    )}
                    {flagCounts.high > 0 && (
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-teal-500 flex-shrink-0" />
                        <div className="flex-1 h-2 bg-white rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-teal-500 rounded-full" 
                            style={{ width: `${(deductionSummary.highDeduction / deductionSummary.totalDeduction) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-teal-600 w-16 text-right">-{deductionSummary.highDeduction}</span>
                      </div>
                    )}
                    {flagCounts.medium > 0 && (
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <div className="flex-1 h-2 bg-white rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full" 
                            style={{ width: `${(deductionSummary.mediumDeduction / deductionSummary.totalDeduction) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-green-600 w-16 text-right">-{deductionSummary.mediumDeduction}</span>
                      </div>
                    )}
                    {flagCounts.low > 0 && (
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <div className="flex-1 h-2 bg-white rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ width: `${(deductionSummary.lowDeduction / deductionSummary.totalDeduction) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-blue-600 w-16 text-right">-{deductionSummary.lowDeduction}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* The Basics */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-navy-900 mb-3">The Basics</h3>
            <div className="bg-navy-50 rounded-xl p-4 border border-navy-100">
              <p className="text-navy-700">
                Every bid starts at <span className="font-bold text-purple-600">100 points</span>. 
                We analyze your bid against industry best practices and deduct points for each issue found.
              </p>
            </div>
          </div>

          {/* Point Deductions */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-navy-900 mb-3">Point Deductions</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {deductions.map((item) => (
                <div key={item.level} className={`${item.bg} rounded-xl p-4 border border-navy-100`}>
                  <div className="flex items-center gap-2 mb-2">
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                    <span className="font-semibold text-navy-900">{item.level}</span>
                    <span className={`ml-auto font-bold ${item.color}`}>{item.points} pts</span>
                  </div>
                  <p className="text-sm text-navy-600">{item.example}</p>
                </div>
              ))}
            </div>
          </div>

          {/* What We Check */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-navy-900 mb-3">What We Check</h3>
            <div className="bg-white border border-navy-200 rounded-xl divide-y divide-navy-100">
              {checklistItems.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3">
                  <div className="p-1.5 bg-purple-100 rounded-lg flex-shrink-0">
                    <item.icon className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-navy-900">{item.label}</p>
                    <p className="text-sm text-navy-500">{item.description}</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 ml-auto" />
                </div>
              ))}
            </div>
          </div>

          {/* Score Ranges */}
          <div>
            <h3 className="text-lg font-semibold text-navy-900 mb-3">Score Interpretation</h3>
            <div className="space-y-2">
              {scoreRanges.map((item) => (
                <div key={item.range} className="flex items-center gap-3 p-3 bg-navy-50 rounded-xl">
                  <div className={`w-4 h-4 rounded-full ${item.color}`} />
                  <span className="font-semibold text-navy-900 w-24">{item.range}</span>
                  <span className="text-navy-700 flex-1">{item.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-navy-50 border-t border-navy-100">
          <p className="text-sm text-navy-500 text-center">
            Our analysis is based on industry best practices and state-specific contractor laws.
          </p>
        </div>
      </div>
    </div>
  );
}
