/**
 * Component Graveyard
 * 
 * A secret archive of components and features that were built but 
 * decided not to use in the production app. This serves as a reference
 * for reusing code patterns and designs in the future.
 * 
 * Access at: /graveyard
 */

import { useState } from 'react';
import { Link } from 'react-router';
import { 
  Skull, 
  ArrowLeft, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp,
  TrendingUp,
  Loader2,
  Database,
  Sparkles,
  Target,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  TrendingDown,
  BarChart3,
  Gauge,
  MessageSquare,
  Zap,
  MapPin,
  Users,
  Ruler,
  Info,
  Layers,
  Clock,
  Lightbulb,
  FileText
} from 'lucide-react';

// Types for archived components
interface ArchivedComponent {
  id: string;
  name: string;
  description: string;
  dateBuried: string;
  reason: string;
  category: 'badge' | 'card' | 'section' | 'feature';
  component: React.ReactNode;
  codeSnippet: string;
}

export default function GraveyardPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const archivedComponents: ArchivedComponent[] = [
    // Related Reading Section
    {
      id: 'related-reading-section',
      name: 'Related Reading Section',
      description: 'Grid of 3 linked article cards for blog posts or internal pages with hover effects',
      dateBuried: 'February 2025',
      reason: 'External blog links not yet available - pattern archived for future content marketing integration',
      category: 'section',
      component: <RelatedReadingPreview />,
      codeSnippet: `{/* Related Reading Section */}
<section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-100">
  <div className="max-w-4xl mx-auto">
    <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
      Related Reading
    </h2>
    <div className="grid md:grid-cols-3 gap-6">
      <a 
        href="https://yourblog.com/article-1/"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow group"
      >
        <h3 className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors mb-2">
          Article Title Here
        </h3>
        <p className="text-sm text-gray-600">
          Brief description of what the reader will learn.
        </p>
      </a>
      {/* Repeat for more cards */}
    </div>
  </div>
</section>

// Features:
// - 3-column grid on desktop, stacked on mobile
// - White cards with subtle border
// - Hover shadow and title color transition
// - Supports external links (a) or internal routes (Link)
// - Gray-100 background for visual separation`
    },
    // Issues Found Section (Bottom of Bid Analysis)
    {
      id: 'issues-found-section',
      name: 'Issues Found Section',
      description: 'Full-width card displaying all detected bid issues with severity badges and point deductions',
      dateBuried: 'February 2025',
      reason: 'Redundant with ScoreSummaryHeader "What is bad about this bid" section - consolidated for streamlined UX',
      category: 'section',
      component: <IssuesFoundPreview />,
      codeSnippet: `{/* Issues List - Full Width with V2 Header */}
<div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
  <div className="bg-black px-6 py-5 flex items-center gap-4">
    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
      <AlertTriangle className="w-7 h-7 text-amber-600" />
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="text-2xl font-bold text-white">Issues Found</h3>
      <p className="text-sm text-white/60">{count} issues affecting your score</p>
    </div>
  </div>
  <div className="p-6">
    {flags.map(flag => <RiskFlagCard key={flag.id} flag={flag} />)}
  </div>
</div>

// Features:
// - Black header with amber warning icon
// - Individual RiskFlagCard for each issue
// - Severity badges (CRITICAL, HIGH, MEDIUM, LOW)
// - Point deductions displayed per issue
// - Premium gate for free users (2 issue limit)`
    },
    // Project-Specific Insights Card
    {
      id: 'project-insights-card',
      name: 'Project-Specific Tips Card',
      description: 'Tabbed card showing timeline tips, cost saving tips, watch-out items, and negotiation leverage per project type',
      dateBuried: 'February 2025',
      reason: 'Feature consolidated into other sections, archived for future reference',
      category: 'card',
      component: <ProjectInsightsCardPreview />,
      codeSnippet: `<ProjectInsightsCard projectType="kitchen" />

// Features:
// - 4 tabs: Timeline, Save Money, Watch For, Negotiate
// - Project-specific content for kitchen, bathroom, addition, and general
// - Lead time warnings for applicable project types
// - Color-coded content sections (blue, emerald, amber, purple)`
    },
    // Trade-Aware Analysis Header
    {
      id: 'trade-aware-header',
      name: 'Trade-Aware Analysis Header',
      description: 'Compact header with 5-trade BLS wage comparison and market factor badge',
      dateBuried: 'January 2025',
      reason: 'Simplified to integrated view, header pattern archived',
      category: 'section',
      component: <TradeAwareHeaderPreview />,
      codeSnippet: `<div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-4 border border-slate-200 flex items-center justify-between">
  <div className="flex items-center gap-3">
    <div className="p-2 rounded-lg bg-white shadow-sm border border-slate-200">
      <Gauge className="w-5 h-5 text-blue-600" />
    </div>
    <div>
      <h4 className="font-semibold text-slate-900">Trade-Aware Analysis</h4>
      <p className="text-sm text-slate-500">5-trade BLS wage comparison for your area</p>
    </div>
  </div>
  <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
    0.95× Market Factor
  </span>
</div>`
    },
    // Confidence Score Ring
    {
      id: 'confidence-score-ring',
      name: 'Confidence Score Ring',
      description: 'Circular progress ring showing bid confidence score with severity badges',
      dateBuried: 'January 2025',
      reason: 'Feature redesigned, visual pattern archived for reuse',
      category: 'card',
      component: <ConfidenceScorePreview />,
      codeSnippet: `{/* Confidence Score Card */}
<div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
  <div className="flex items-center gap-6">
    {/* Circular Progress Ring */}
    <div className="relative w-28 h-28 flex-shrink-0">
      <svg className="w-28 h-28 transform -rotate-90">
        <circle cx="56" cy="56" r="48" stroke="#e5e7eb" strokeWidth="8" fill="none" />
        <circle cx="56" cy="56" r="48" stroke="url(#scoreGradient)" strokeWidth="8" fill="none"
          strokeLinecap="round" strokeDasharray={\`\${score * 3.02} 302\`} />
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-orange-500">{score}</span>
        <span className="text-xs text-slate-500">out of 100</span>
      </div>
    </div>
    
    {/* Content */}
    <div className="flex-1">
      <h3 className="text-xl font-bold text-slate-900 mb-1">Confidence Score</h3>
      <p className="text-slate-600 mb-3">Critical issues found. This bid has 1 critical and 1 high-risk flags.</p>
      <div className="flex gap-2">
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">1 Critical</span>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">1 High</span>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-100">2 Medium</span>
      </div>
    </div>
    
    {/* Bid Total */}
    <div className="text-right">
      <p className="text-sm text-slate-500">Bid Total</p>
      <p className="text-2xl font-bold text-navy-900">$15,000</p>
    </div>
  </div>
</div>`
    },
    // Market Context Banner
    {
      id: 'market-context-banner',
      name: 'Market Context Banner',
      description: 'Dark navy banner showing market index and price tiers (Basic/Good/Luxury)',
      dateBuried: 'January 2025',
      reason: 'Consolidated into other components, banner style archived',
      category: 'section',
      component: <MarketContextBannerPreview />,
      codeSnippet: `<div className="bg-navy-900 rounded-xl p-4 text-white">
  <div className="flex items-center gap-2 mb-2">
    <BarChart3 className="w-4 h-4 text-slate-400" />
    <span className="text-sm text-slate-400">Market Context</span>
  </div>
  <p className="text-lg font-medium">
    Atlanta Market Index: <span className="text-blue-400">0.9×</span> (Below Avg) 
    <span className="text-slate-400 mx-2">•</span> 
    Basic: <span className="text-white">$87/sf</span>
    <span className="text-slate-400 mx-2">•</span>
    Good: <span className="text-white">$142/sf</span>
    <span className="text-slate-400 mx-2">•</span>
    Luxury: <span className="text-white">$207/sf</span>
  </p>
</div>`
    },
    // Risk Flag Card with Talk Track
    {
      id: 'risk-flag-card',
      name: 'Risk Flag Card with Talk Track',
      description: 'Card showing risk flags with "Say This" script and "Your Leverage" sections',
      dateBuried: 'January 2025',
      reason: 'Talk track feature redesigned, card pattern archived',
      category: 'card',
      component: <RiskFlagCardPreview />,
      codeSnippet: `<div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
  {/* Header */}
  <div className="p-4 flex items-center justify-between">
    <div>
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 mb-2 inline-block">High Risk</span>
      <h4 className="text-lg font-bold text-slate-900">Suspiciously Below Market</h4>
      <p className="text-slate-500">Price significantly below market average</p>
    </div>
    <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">
      <Copy className="w-4 h-4" />
      Copy Script
    </button>
  </div>
  
  {/* Say This Section */}
  <div className="p-4 bg-amber-50 border-y border-amber-100">
    <div className="flex items-start gap-3">
      <MessageSquare className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-orange-600 mb-1">Say This:</p>
        <p className="text-slate-700 italic leading-relaxed">
          "This bid is 99% below the local market average of $87/sq ft for basic work in Atlanta. 
          To protect yourself, please verify that this quote includes licensed trade labor 
          (Plumbing/Electrical) and full insurance coverage."
        </p>
      </div>
    </div>
  </div>
  
  {/* Your Leverage Section */}
  <div className="p-4">
    <div className="flex items-start gap-3">
      <Zap className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-purple-600 mb-1">Your Leverage</p>
        <p className="text-slate-600">
          Bids significantly below $87/sq ft often indicate unlicensed workers, 
          missing insurance, or hidden costs that appear later as "unforeseen conditions."
        </p>
      </div>
    </div>
  </div>
</div>`
    },
    // 5-Trade Finish Level Analysis
    {
      id: 'five-trade-finish-analysis',
      name: '5-Trade Finish Level Analysis',
      description: 'Visual chart showing bid position across Basic/Good/Luxury tiers with bar graph',
      dateBuried: 'January 2025',
      reason: 'Integrated into main analysis, visual pattern archived',
      category: 'card',
      component: <FiveTradeFinishAnalysisPreview />,
      codeSnippet: `<div className="bg-white rounded-xl border border-slate-200 p-5">
  {/* Header */}
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-red-100">
        <BarChart3 className="w-4 h-4 text-red-600" />
      </div>
      <div>
        <h4 className="font-semibold text-slate-900">5-Trade Finish Level Analysis</h4>
        <p className="text-sm text-slate-500">Atlanta • ZIP 48309</p>
      </div>
    </div>
    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
      Detected: Good / Semi-Custom
    </span>
  </div>
  
  {/* Bar Chart */}
  <div className="flex items-end justify-center gap-8 h-48 mb-4">
    {/* Basic Bar */}
    <div className="text-center">
      <p className="text-sm font-medium mb-2">$98<br/><span className="text-slate-500">/sq ft</span></p>
      <div className="w-20 bg-emerald-400 rounded-t-lg" style={{ height: '70px' }} />
      <p className="text-sm mt-2 text-slate-600">Basic</p>
    </div>
    
    {/* Good Bar - YOUR BID */}
    <div className="text-center relative">
      <span className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded">YOUR BID</span>
      <p className="text-sm font-medium mb-2">$157<br/><span className="text-slate-500">/sq ft</span></p>
      <div className="w-20 bg-gradient-to-t from-blue-400 to-blue-500 rounded-t-lg" style={{ height: '110px' }} />
      <p className="text-sm mt-2 text-slate-600">Good</p>
    </div>
    
    {/* Luxury Bar */}
    <div className="text-center">
      <p className="text-sm font-medium mb-2">$221<br/><span className="text-slate-500">/sq ft</span></p>
      <div className="w-20 bg-gradient-to-t from-purple-400 to-purple-500 rounded-t-lg" style={{ height: '150px' }} />
      <p className="text-sm mt-2 text-slate-600">Luxury</p>
    </div>
  </div>
</div>`
    },
    // National BLS Trade Wages Cards
    {
      id: 'bls-trade-wages',
      name: 'National BLS Trade Wages Cards',
      description: 'Row of cards showing hourly rates for Plumber, Electrician, Carpenter, Tile Setter, Painter',
      dateBuried: 'January 2025',
      reason: 'Data integrated elsewhere, card layout archived',
      category: 'card',
      component: <BLSTradeWagesPreview />,
      codeSnippet: `<div className="bg-slate-50 rounded-xl p-4">
  <div className="flex items-center gap-2 mb-4">
    <Users className="w-4 h-4 text-slate-500" />
    <span className="text-sm font-medium text-slate-600">National BLS Trade Wages (2026 Baseline)</span>
  </div>
  
  <div className="grid grid-cols-5 gap-3">
    {[
      { trade: 'Plumber', rate: '$32.62', highlight: true },
      { trade: 'Electrician', rate: '$32.6' },
      { trade: 'Carpenter', rate: '$28.51' },
      { trade: 'Tile Setter', rate: '$25.92' },
      { trade: 'Painter', rate: '$24.55' },
    ].map((item) => (
      <div key={item.trade} className={\`rounded-lg p-3 border \${
        item.highlight ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'
      }\`}>
        <p className="text-xs text-slate-500 mb-1">{item.trade}</p>
        <p className="text-lg font-bold text-slate-900">{item.rate}</p>
        <p className="text-xs text-slate-400">/hr</p>
      </div>
    ))}
  </div>
  
  <p className="text-xs text-slate-400 mt-3 text-center">
    These wages weight each finish tier differently: Luxury emphasizes tile/plumbing, Basic emphasizes paint/carpentry
  </p>
</div>`
    },
    // Labor Rate Audit Card
    {
      id: 'labor-rate-audit',
      name: 'Labor Rate Audit Card',
      description: 'Side-by-side comparison of Local Fair Rate vs Bid Effective Rate with percentage',
      dateBuried: 'January 2025',
      reason: 'Calculation method updated, visual pattern archived',
      category: 'card',
      component: <LaborRateAuditPreview />,
      codeSnippet: `<div className="bg-white rounded-xl border border-slate-200 p-5">
  <div className="flex items-center gap-3 mb-4">
    <div className="p-2 rounded-lg bg-emerald-100">
      <DollarSign className="w-4 h-4 text-emerald-600" />
    </div>
    <div>
      <h4 className="font-semibold text-slate-900">Labor Rate Audit</h4>
      <p className="text-sm text-slate-500">BLS-derived fair rate comparison</p>
    </div>
  </div>
  
  {/* Rate Comparison */}
  <div className="grid grid-cols-2 gap-4 mb-4">
    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
      <p className="text-sm text-blue-600 mb-1">Local Fair Rate</p>
      <p className="text-3xl font-bold text-slate-900">$80.75<span className="text-lg font-normal text-slate-500">/hr</span></p>
      <p className="text-xs text-blue-500 mt-1">Based on BLS 5-trade average</p>
    </div>
    
    <div className="relative bg-slate-50 rounded-xl p-4 border border-slate-200">
      {/* VS Badge */}
      <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
        vs
      </div>
      <p className="text-sm text-slate-600 mb-1">Bid Effective Rate</p>
      <p className="text-3xl font-bold text-red-600">$0.53<span className="text-lg font-normal text-slate-500">/hr</span></p>
      <p className="text-xs text-slate-400 mt-1">Estimated from bid total</p>
    </div>
  </div>
  
  {/* Result */}
  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
    <div className="flex items-center gap-2">
      <CheckCircle className="w-5 h-5 text-emerald-600" />
      <span className="font-medium text-emerald-700">At or Below Market</span>
    </div>
    <span className="text-xl font-bold text-red-600">-99%</span>
  </div>
</div>`
    },
    // Material Price Trends Chart
    {
      id: 'material-price-trends',
      name: 'Material Price Trends Chart',
      description: 'Line chart showing PPI trends over 6 months with material breakdown',
      dateBuried: 'January 2025',
      reason: 'Redesigned into Material Advisory card, chart pattern archived',
      category: 'card',
      component: <MaterialPriceTrendsPreview />,
      codeSnippet: `<div className="bg-white rounded-xl border border-slate-200 p-5">
  <div className="flex items-center gap-3 mb-4">
    <div className="p-2 rounded-lg bg-orange-100">
      <TrendingUp className="w-4 h-4 text-orange-600" />
    </div>
    <div>
      <h4 className="font-semibold text-slate-900">Material Price Trends</h4>
      <p className="text-sm text-slate-500">Producer Price Index (PPI) - Last 6 Months</p>
    </div>
  </div>
  
  {/* SVG Line Chart */}
  <div className="h-40 relative mb-4">
    <svg viewBox="0 0 400 120" className="w-full h-full">
      <path d="M 0 80 Q 50 75, 100 70 T 200 50 T 300 40 T 400 35" 
        stroke="#f97316" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Data points */}
      {[0, 100, 200, 300, 400].map((x, i) => (
        <circle key={i} cx={x} cy={[80, 70, 50, 40, 35][i]} r="6" fill="#f97316" />
      ))}
    </svg>
    {/* X-axis labels */}
    <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-slate-400">
      <span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span><span>Jan</span>
    </div>
  </div>
  
  {/* Material Breakdown */}
  <div className="grid grid-cols-2 gap-3">
    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
      <span className="text-sm text-slate-600">Lumber</span>
      <span className="text-sm font-semibold text-red-600 flex items-center gap-1">
        <TrendingUp className="w-3 h-3" /> +12%
      </span>
    </div>
    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
      <span className="text-sm text-slate-600">Copper</span>
      <span className="text-sm font-semibold text-red-600 flex items-center gap-1">
        <TrendingUp className="w-3 h-3" /> +8%
      </span>
    </div>
    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
      <span className="text-sm text-slate-600">Tile/Ceramic</span>
      <span className="text-sm font-semibold text-slate-500 flex items-center gap-1">
        — +2%
      </span>
    </div>
    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
      <span className="text-sm text-slate-600">Paint</span>
      <span className="text-sm font-semibold text-emerald-600 flex items-center gap-1">
        <TrendingDown className="w-3 h-3" /> -3%
      </span>
    </div>
  </div>
  
  {/* Construction Materials Index */}
  <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-orange-700">Construction Materials Index</span>
      <span className="text-sm font-bold text-orange-600 flex items-center gap-1">
        <TrendingUp className="w-3 h-3" /> +8% YoY
      </span>
    </div>
  </div>
</div>`
    },
    // Market & Finish Level Analysis Panel
    {
      id: 'market-finish-panel',
      name: 'Market & Finish Level Analysis Panel',
      description: 'Research-grade panel with bid comparison, finish tier analysis, and "Why Target Good" section',
      dateBuried: 'January 2025',
      reason: 'Combined into simplified view, full panel archived',
      category: 'feature',
      component: <MarketFinishPanelPreview />,
      codeSnippet: `<div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
  {/* Header */}
  <div className="p-5 bg-gradient-to-r from-slate-50 to-purple-50 border-b border-slate-100">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-purple-100">
          <Ruler className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            Market & Finish Level Analysis
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">Research-Grade</span>
          </h3>
          <p className="text-sm text-slate-500 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Georgia • Michigan
          </p>
        </div>
      </div>
      <div className="text-right">
        <div className="flex items-center gap-1 text-emerald-600">
          <DollarSign className="w-4 h-4" />
          <span className="font-semibold">0.89× National Avg</span>
        </div>
        <p className="text-xs text-slate-400">Georgia Labor Costs • State Avg</p>
      </div>
    </div>
  </div>
  
  {/* Bid Comparison */}
  <div className="p-5">
    <div className="grid grid-cols-2 gap-4 mb-4">
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
        <div className="flex items-center gap-1 text-slate-600 mb-1">
          <DollarSign className="w-4 h-4" />
          <span className="text-sm">Your Bid</span>
        </div>
        <p className="text-3xl font-bold text-slate-900">$13,500</p>
        <p className="text-sm text-slate-500">$38/sq ft</p>
      </div>
      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
        <div className="flex items-center gap-1 text-emerald-600 mb-1">
          <Target className="w-4 h-4" />
          <span className="text-sm">Market Average</span>
        </div>
        <p className="text-3xl font-bold text-slate-900">$18,500</p>
        <p className="text-sm text-emerald-600">Range: $12,000 - $35,000</p>
      </div>
    </div>
    
    {/* Fair Market Price Badge */}
    <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200 mb-6">
      <CheckCircle className="w-5 h-5 text-emerald-600" />
      <div>
        <p className="font-semibold text-emerald-700">Fair Market Price</p>
        <p className="text-sm text-emerald-600">This bid is within 27% of the market average—a reasonable, competitive quote.</p>
      </div>
    </div>
    
    {/* Finish Level Scale */}
    <div className="mb-6">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1">
        <Sparkles className="w-3 h-3" /> 5-TRADE FINISH LEVEL ANALYSIS
      </p>
      
      <div className="relative">
        {/* Current Level Indicator */}
        <div className="absolute -top-3 left-[10%] transform -translate-x-1/2">
          <div className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-sm font-semibold shadow-lg">
            <span className="text-xs block">Basic</span>
            $38/sf
          </div>
        </div>
        
        <div className="h-20" />
        
        {/* Gradient Scale */}
        <div className="h-3 rounded-full bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-500" />
        
        {/* Labels */}
        <div className="flex justify-between mt-2">
          <div className="text-center">
            <p className="text-sm font-medium text-emerald-600">Basic</p>
            <p className="text-xs text-slate-400">$87/sf</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-blue-600">Good</p>
            <p className="text-xs text-slate-400">$142/sf</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-purple-600">Luxury</p>
            <p className="text-xs text-slate-400">$207/sf</p>
          </div>
        </div>
      </div>
    </div>
    
    {/* Why Target Good */}
    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
      <div className="flex items-start gap-3">
        <BarChart3 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-blue-800 mb-1">Why Target the 'Good' Finish Level?</p>
          <p className="text-sm text-blue-700 leading-relaxed">
            Our AI-powered 5-Trade Index analyzes your bid against local BLS data for five key trades 
            (Plumbing, Electrical, Carpentry, Tile, Painting). This '<strong>Good</strong>' tier represents 
            the optimal balance of high-quality finishes and fair labor costs, ensuring you get the 
            best value for your project without overpaying for unnecessary luxury markups.
          </p>
        </div>
      </div>
    </div>
  </div>
</div>`
    },
    // Status Badges from Market Analysis
    {
      id: 'bls-status-badge',
      name: 'BLS Data Status Badge',
      description: 'Dynamic status badge showing live/cached/updating state of BLS data',
      dateBuried: 'January 2025',
      reason: 'Replaced with subtle source attribution in card footer for cleaner design',
      category: 'badge',
      component: <BLSStatusBadgePreview />,
      codeSnippet: `// Status badge variants for BLS data
const dataSourceLabel = useMemo(() => {
  if (!apiData) return 'Loading...';
  if (apiData.source === 'cache') return 'Live BLS Data';
  if (apiData.source === 'cache-stale') return 'Cached (Updating...)';
  return 'Representative Data';
}, [apiData]);

// Rendering
<span className={\`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border \${
  dataSourceLabel === 'Live BLS Data'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : dataSourceLabel.includes('Updating')
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-blue-50 text-blue-700 border-blue-200'
}\`}>
  {dataSourceLabel.includes('Updating') ? (
    <Loader2 className="w-3 h-3 animate-spin" />
  ) : (
    <Database className="w-3 h-3" />
  )}
  {dataSourceLabel}
</span>`
    },
    {
      id: 'social-data-badge',
      name: 'Social Data Badge',
      description: 'Badge indicating data source is from social media/Reddit',
      dateBuried: 'January 2025',
      reason: 'Replaced with source attribution in Community Pulse card footer',
      category: 'badge',
      component: <SocialDataBadgePreview />,
      codeSnippet: `<span className="px-2.5 py-1 text-xs font-semibold bg-purple-50 text-purple-700 rounded-full border border-purple-200">
  Social Data
</span>`
    },
    // Premium Badge Style
    {
      id: 'premium-sparkle-badge',
      name: 'Premium Sparkle Badge',
      description: 'Inline badge with sparkle icon to indicate premium features',
      dateBuried: 'January 2025',
      reason: 'Kept in some places, archived alternate styles',
      category: 'badge',
      component: <PremiumBadgePreview />,
      codeSnippet: `<span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 flex items-center gap-1">
  <Sparkles className="w-3 h-3" />
  Premium
</span>`
    },
    // Market Comparison Card Header
    {
      id: 'market-comparison-header',
      name: 'Market Comparison Card Header',
      description: 'Full gradient header design for the market comparison card',
      dateBuried: 'January 2025',
      reason: 'Card was refactored, header design archived for potential reuse',
      category: 'section',
      component: <MarketComparisonHeaderPreview />,
      codeSnippet: `{/* Header */}
<div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-5 border-b border-emerald-100">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="p-2.5 rounded-xl bg-white shadow-sm">
        <Target className="w-6 h-6 text-emerald-600" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-navy-900 flex items-center gap-2">
          Market Comparison
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Premium
          </span>
        </h3>
        <p className="text-sm text-navy-500">
          {marketRate.displayName} • {marketRate.region}
        </p>
      </div>
    </div>
    <StatusBadge status={comparison.status} />
  </div>
</div>`
    },
    // Gauge Chart Component
    {
      id: 'gauge-chart',
      name: 'Visual Gauge Chart',
      description: 'Gradient gauge chart showing bid position relative to market range',
      dateBuried: 'January 2025',
      reason: 'Part of market comparison feature, kept for reference',
      category: 'card',
      component: <GaugeChartPreview />,
      codeSnippet: `function GaugeChart({ low, average, high, bidAmount, status }) {
  const padding = (high - low) * 0.2;
  const minValue = Math.max(0, low - padding);
  const maxValue = high + padding;
  const range = maxValue - minValue;
  
  const bidPos = Math.min(98, Math.max(2, ((bidAmount - minValue) / range) * 100));
  
  return (
    <div className="relative pt-8 pb-4">
      {/* Bid Amount Label */}
      <div className="absolute -top-1 transform -translate-x-1/2" style={{ left: \`\${bidPos}%\` }}>
        <div className="px-3 py-1.5 rounded-lg text-white text-sm font-bold shadow-lg bg-blue-500">
          \${bidAmount.toLocaleString()}
        </div>
      </div>
      
      {/* Gauge Track */}
      <div className="relative h-4 rounded-full overflow-hidden bg-navy-200">
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to right, #10b981, #3b82f6, #f59e0b, #ef4444)',
          }}
        />
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-3 border-white shadow-lg bg-blue-500"
          style={{ left: \`\${bidPos}%\`, transform: 'translate(-50%, -50%)' }}
        />
      </div>
    </div>
  );
}`
    },
    // Price Comparison Cards
    {
      id: 'price-comparison-cards',
      name: 'Price Comparison Cards',
      description: 'Side-by-side cards showing your bid vs market average',
      dateBuried: 'January 2025',
      reason: 'From SavingsCard component, useful pattern for comparisons',
      category: 'card',
      component: <PriceCardsPreview />,
      codeSnippet: `<div className="grid md:grid-cols-2 gap-4">
  {/* Your Bid Card */}
  <div className="rounded-xl p-4 bg-navy-50 border border-navy-100">
    <div className="flex items-center gap-2 mb-1">
      <DollarSign className="w-4 h-4 text-navy-600" />
      <span className="text-sm font-medium text-navy-700">Your Bid</span>
    </div>
    <p className="text-3xl font-bold text-navy-900">$45,000</p>
    <p className="text-xs text-navy-500 mt-1">Total quoted price</p>
  </div>
  
  {/* Market Average Card */}
  <div className="rounded-xl p-4 bg-blue-50 border border-blue-100">
    <div className="flex items-center gap-2 mb-1">
      <DollarSign className="w-4 h-4 text-blue-600" />
      <span className="text-sm font-medium text-blue-700">Market Average</span>
    </div>
    <p className="text-3xl font-bold text-navy-900">$42,500</p>
    <p className="text-xs text-navy-500 mt-1">Per project</p>
  </div>
</div>`
    },
    // Status Badge Component from SavingsCard
    {
      id: 'market-status-badge',
      name: 'Market Status Badges',
      description: 'Color-coded badges showing bid status relative to market',
      dateBuried: 'January 2025',
      reason: 'From SavingsCard, useful for any comparison feature',
      category: 'badge',
      component: <MarketStatusBadgesPreview />,
      codeSnippet: `const STATUS_CONFIG = {
  'below-market': {
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    icon: <TrendingDown className="w-4 h-4" />,
    label: 'Below Market',
  },
  'fair': {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    icon: <CheckCircle className="w-4 h-4" />,
    label: 'Fair Price',
  },
  'above-market': {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    icon: <TrendingUp className="w-4 h-4" />,
    label: 'Above Market',
  },
  'significantly-above': {
    bg: 'bg-red-100',
    text: 'text-red-700',
    icon: <AlertTriangle className="w-4 h-4" />,
    label: 'Significantly Above',
  },
};

// Usage
<div className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-full \${config.bg} \${config.text}\`}>
  {config.icon}
  <span className="text-sm font-semibold">{config.label}</span>
</div>`
    },
    // AI Synthesis Box
    {
      id: 'ai-synthesis-box',
      name: 'AI Synthesis Box',
      description: 'Styled box for AI-generated summaries with icon and type-based coloring',
      dateBuried: 'January 2025',
      reason: 'Still in use, archived here for easy reference',
      category: 'card',
      component: <AISynthesisBoxPreview />,
      codeSnippet: `const config = {
  alert: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
    titleColor: 'text-red-700',
    textColor: 'text-red-700'
  },
  opportunity: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: <TrendingDown className="w-5 h-5 text-emerald-500" />,
    titleColor: 'text-emerald-700',
    textColor: 'text-emerald-700'
  },
  observation: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: <Bot className="w-5 h-5 text-blue-500" />,
    titleColor: 'text-blue-700',
    textColor: 'text-blue-700'
  }
};

<div className={\`rounded-xl p-4 mb-4 border \${style.bg} \${style.border}\`}>
  <div className="flex items-start gap-3">
    {style.icon}
    <div>
      <p className={\`text-xs font-bold uppercase tracking-wider mb-1 \${style.titleColor}\`}>
        AI Market Synthesis
      </p>
      <p className={\`text-sm leading-relaxed \${style.textColor}\`}>
        {summary.message}
      </p>
    </div>
  </div>
</div>`
    },
    // Market Comparison Card (Full Feature)
    {
      id: 'market-comparison-card-full',
      name: 'Market Comparison Card (Full Feature)',
      description: 'Complete bid vs market comparison card with multi-trade analysis, weighted verdict, regional adjustments, and per-unit pricing support for windows/electrical',
      dateBuried: 'February 2025',
      reason: 'Feature not fully production-ready - needs more testing on trade detection accuracy and regional pricing calibration',
      category: 'feature',
      component: <MarketComparisonCardPreview />,
      codeSnippet: `// Full Market Comparison Card - see src/react-app/components/MarketComparisonCard.tsx
// Key features:
// - Multi-trade detection and breakdown
// - Per-square-foot and per-unit (window) pricing
// - Regional cost adjustments by state
// - Weighted composite verdict across trades
// - Trade-specific benchmarks from tradeBenchmarks.ts

// Usage:
<MarketComparisonCard
  data={marketData}
  bidTotal={45000}
  squareFootage={1200}
  windowCountOverride={4}
  unitDetection={{ items: [], totalUnits: 4 }}
/>

// API endpoint: POST /api/market-rates
// Request body: { bidTotal, squareFootage, zipCode, bidContent, tradeDetection, windowCount }
// Response: MarketRateResult with multiTradeAnalysis`
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link 
            to="/" 
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800">
              <Skull className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Component Graveyard</h1>
              <p className="text-sm text-slate-400">Archived designs & components for reuse</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Intro */}
        <div className="mb-8 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
          <p className="text-slate-300 text-sm leading-relaxed">
            This secret page archives components and features we've built but decided not to use.
            Click any component to see the code snippet you can copy and reuse elsewhere.
          </p>
        </div>

        {/* Category Stats */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {(['badge', 'card', 'section', 'feature'] as const).map(cat => {
            const count = archivedComponents.filter(c => c.category === cat).length;
            return (
              <div key={cat} className="bg-slate-800 rounded-xl p-3 text-center border border-slate-700">
                <p className="text-2xl font-bold text-white">{count}</p>
                <p className="text-xs text-slate-400 capitalize">{cat}s</p>
              </div>
            );
          })}
        </div>

        {/* Archived Components */}
        <div className="space-y-4">
          {archivedComponents.map((item) => (
            <ArchivedComponentCard
              key={item.id}
              item={item}
              isExpanded={expandedId === item.id}
              onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

/**
 * Card for each archived component
 */
function ArchivedComponentCard({
  item,
  isExpanded,
  onToggle
}: {
  item: ArchivedComponent;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(item.codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const categoryColors = {
    badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    card: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    section: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    feature: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  };

  return (
    <div className="bg-slate-800/80 rounded-xl border border-slate-700 overflow-hidden">
      {/* Header - Clickable */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-start justify-between gap-4 text-left hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-semibold text-white">{item.name}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${categoryColors[item.category]}`}>
              {item.category}
            </span>
          </div>
          <p className="text-sm text-slate-400">{item.description}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
            <span>Buried: {item.dateBuried}</span>
            <span>•</span>
            <span className="text-slate-400">{item.reason}</span>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-slate-700">
          {/* Live Preview */}
          <div className="p-6 bg-white">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Live Preview</p>
            <div className="flex items-center justify-center">
              {item.component}
            </div>
          </div>

          {/* Code Snippet */}
          <div className="p-4 bg-slate-900 border-t border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Code</p>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
              {item.codeSnippet}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// NEW Preview Components (from screenshots)
// ============================================

function TradeAwareHeaderPreview() {
  return (
    <div className="w-full max-w-lg bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-4 border border-slate-200 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-white shadow-sm border border-slate-200">
          <Gauge className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h4 className="font-semibold text-slate-900">Trade-Aware Analysis</h4>
          <p className="text-sm text-slate-500">5-trade BLS wage comparison for your area</p>
        </div>
      </div>
      <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
        0.95× Market Factor
      </span>
    </div>
  );
}

function ConfidenceScorePreview() {
  const score = 51;
  const circumference = 2 * Math.PI * 48;
  const strokeDasharray = `${(score / 100) * circumference} ${circumference}`;
  
  return (
    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center gap-6">
        {/* Circular Progress Ring */}
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg className="w-28 h-28 transform -rotate-90">
            <circle cx="56" cy="56" r="48" stroke="#e5e7eb" strokeWidth="8" fill="none" />
            <circle 
              cx="56" cy="56" r="48" 
              stroke="url(#scoreGradient)" 
              strokeWidth="8" 
              fill="none"
              strokeLinecap="round" 
              strokeDasharray={strokeDasharray}
            />
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#94a3b8" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-orange-500">{score}</span>
            <span className="text-xs text-slate-500">out of 100</span>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1">
          <h3 className="text-xl font-bold text-slate-900 mb-1">Confidence Score</h3>
          <p className="text-slate-600 mb-3">Critical issues found. This bid has 1 critical and 1 high-risk flags that need attention before signing.</p>
          <div className="flex gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">1 Critical</span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">1 High</span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-100">2 Medium</span>
          </div>
        </div>
        
        {/* Bid Total */}
        <div className="text-right">
          <p className="text-sm text-slate-500">Bid Total</p>
          <p className="text-2xl font-bold text-slate-900">$15,000</p>
        </div>
      </div>
    </div>
  );
}

function MarketContextBannerPreview() {
  return (
    <div className="w-full max-w-2xl bg-slate-900 rounded-xl p-4 text-white">
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="w-4 h-4 text-slate-400" />
        <span className="text-sm text-slate-400">Market Context</span>
      </div>
      <p className="text-base font-medium">
        Atlanta Market Index: <span className="text-blue-400">0.9×</span> (Below Avg) 
        <span className="text-slate-400 mx-2">•</span> 
        Basic: <span className="text-white">$87/sf</span>
        <span className="text-slate-400 mx-2">•</span>
        Good: <span className="text-white">$142/sf</span>
        <span className="text-slate-400 mx-2">•</span>
        Luxury: <span className="text-white">$207/sf</span>
      </p>
    </div>
  );
}

function RiskFlagCardPreview() {
  return (
    <div className="w-full max-w-2xl bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-start justify-between">
        <div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 mb-2 inline-block">High Risk</span>
          <h4 className="text-lg font-bold text-slate-900">Suspiciously Below Market</h4>
          <p className="text-slate-500">Price significantly below market average</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-sm">
          <Copy className="w-4 h-4" />
          Copy Script
        </button>
      </div>
      
      {/* Say This Section */}
      <div className="p-4 bg-amber-50 border-y border-amber-100">
        <div className="flex items-start gap-3">
          <MessageSquare className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-orange-600 mb-1">Say This:</p>
            <p className="text-slate-700 italic leading-relaxed">
              "This bid is 99% below the local market average of $87/sq ft for basic work in Atlanta. 
              To protect yourself, please verify that this quote includes licensed trade labor 
              (Plumbing/Electrical) and full insurance coverage."
            </p>
          </div>
        </div>
      </div>
      
      {/* Your Leverage Section */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-purple-600 mb-1">Your Leverage</p>
            <p className="text-slate-600">
              Bids significantly below $87/sq ft often indicate unlicensed workers, 
              missing insurance, or hidden costs that appear later as "unforeseen conditions."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FiveTradeFinishAnalysisPreview() {
  return (
    <div className="w-full max-w-lg bg-white rounded-xl border border-slate-200 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-100">
            <BarChart3 className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900">5-Trade Finish Level Analysis</h4>
            <p className="text-sm text-slate-500">Atlanta • ZIP 48309</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
          Detected: Good / Semi-Custom
        </span>
      </div>
      
      {/* Bar Chart */}
      <div className="flex items-end justify-center gap-8 h-44 mb-4">
        {/* Basic Bar */}
        <div className="text-center">
          <p className="text-sm font-medium mb-2">$98<br/><span className="text-slate-500 text-xs">/sq ft</span></p>
          <div className="w-16 bg-emerald-400 rounded-t-lg" style={{ height: '70px' }} />
          <p className="text-sm mt-2 text-slate-600">Basic</p>
        </div>
        
        {/* Good Bar - YOUR BID */}
        <div className="text-center relative">
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded">YOUR BID</span>
          <p className="text-sm font-medium mb-2">$157<br/><span className="text-slate-500 text-xs">/sq ft</span></p>
          <div className="w-16 bg-gradient-to-t from-blue-400 to-blue-500 rounded-t-lg" style={{ height: '110px' }} />
          <p className="text-sm mt-2 text-slate-600">Good</p>
        </div>
        
        {/* Luxury Bar */}
        <div className="text-center">
          <p className="text-sm font-medium mb-2">$221<br/><span className="text-slate-500 text-xs">/sq ft</span></p>
          <div className="w-16 bg-gradient-to-t from-purple-400 to-purple-500 rounded-t-lg" style={{ height: '150px' }} />
          <p className="text-sm mt-2 text-slate-600">Luxury</p>
        </div>
      </div>
    </div>
  );
}

function BLSTradeWagesPreview() {
  const trades = [
    { trade: 'Plumber', rate: '$32.62', highlight: true },
    { trade: 'Electrician', rate: '$32.6', highlight: false },
    { trade: 'Carpenter', rate: '$28.51', highlight: false },
    { trade: 'Tile Setter', rate: '$25.92', highlight: false },
    { trade: 'Painter', rate: '$24.55', highlight: false },
  ];
  
  return (
    <div className="w-full max-w-2xl bg-slate-50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-slate-500" />
        <span className="text-sm font-medium text-slate-600">National BLS Trade Wages (2026 Baseline)</span>
      </div>
      
      <div className="grid grid-cols-5 gap-3">
        {trades.map((item) => (
          <div key={item.trade} className={`rounded-lg p-3 border ${
            item.highlight ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'
          }`}>
            <p className="text-xs text-slate-500 mb-1">{item.trade}</p>
            <p className="text-lg font-bold text-slate-900">{item.rate}</p>
            <p className="text-xs text-slate-400">/hr</p>
          </div>
        ))}
      </div>
      
      <p className="text-xs text-slate-400 mt-3 text-center italic">
        These wages weight each finish tier differently: Luxury emphasizes tile/plumbing, Basic emphasizes paint/carpentry
      </p>
    </div>
  );
}

function LaborRateAuditPreview() {
  return (
    <div className="w-full max-w-lg bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-emerald-100">
          <DollarSign className="w-4 h-4 text-emerald-600" />
        </div>
        <div>
          <h4 className="font-semibold text-slate-900">Labor Rate Audit</h4>
          <p className="text-sm text-slate-500">BLS-derived fair rate comparison</p>
        </div>
      </div>
      
      {/* Rate Comparison */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <p className="text-sm text-blue-600 mb-1">Local Fair Rate</p>
          <p className="text-2xl font-bold text-slate-900">$80.75<span className="text-base font-normal text-slate-500">/hr</span></p>
          <p className="text-xs text-blue-500 mt-1">Based on BLS 5-trade average</p>
        </div>
        
        <div className="relative bg-slate-50 rounded-xl p-4 border border-slate-200">
          {/* VS Badge */}
          <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
            vs
          </div>
          <p className="text-sm text-slate-600 mb-1">Bid Effective Rate</p>
          <p className="text-2xl font-bold text-red-600">$0.53<span className="text-base font-normal text-slate-500">/hr</span></p>
          <p className="text-xs text-slate-400 mt-1">Estimated from bid total</p>
        </div>
      </div>
      
      {/* Result */}
      <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <span className="font-medium text-emerald-700">At or Below Market</span>
        </div>
        <span className="text-xl font-bold text-red-600">-99%</span>
      </div>
    </div>
  );
}

function MaterialPriceTrendsPreview() {
  return (
    <div className="w-full max-w-lg bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-orange-100">
          <TrendingUp className="w-4 h-4 text-orange-600" />
        </div>
        <div>
          <h4 className="font-semibold text-slate-900">Material Price Trends</h4>
          <p className="text-sm text-slate-500">Producer Price Index (PPI) - Last 6 Months</p>
        </div>
      </div>
      
      {/* SVG Line Chart */}
      <div className="h-32 relative mb-4">
        <svg viewBox="0 0 400 100" className="w-full h-full">
          <path 
            d="M 0 70 Q 50 65, 100 55 T 200 40 T 300 30 T 400 25" 
            stroke="#f97316" 
            strokeWidth="3" 
            fill="none" 
            strokeLinecap="round"
          />
          {/* Data points */}
          <circle cx="0" cy="70" r="5" fill="#f97316" />
          <circle cx="80" cy="60" r="5" fill="#f97316" />
          <circle cx="160" cy="50" r="5" fill="#f97316" />
          <circle cx="240" cy="40" r="5" fill="#f97316" />
          <circle cx="320" cy="32" r="5" fill="#f97316" />
          <circle cx="400" cy="25" r="5" fill="#f97316" />
        </svg>
      </div>
      
      {/* X-axis labels */}
      <div className="flex justify-between text-xs text-slate-400 mb-4">
        <span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span><span>Jan</span>
      </div>
      
      {/* Material Breakdown */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
          <span className="text-sm text-slate-600">Lumber</span>
          <span className="text-sm font-semibold text-red-600 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +12%
          </span>
        </div>
        <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
          <span className="text-sm text-slate-600">Copper</span>
          <span className="text-sm font-semibold text-red-600 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +8%
          </span>
        </div>
        <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
          <span className="text-sm text-slate-600">Tile/Ceramic</span>
          <span className="text-sm font-semibold text-slate-500">— +2%</span>
        </div>
        <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
          <span className="text-sm text-slate-600">Paint</span>
          <span className="text-sm font-semibold text-emerald-600 flex items-center gap-1">
            <TrendingDown className="w-3 h-3" /> -3%
          </span>
        </div>
      </div>
      
      {/* Construction Materials Index */}
      <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-orange-700">Construction Materials Index</span>
          <span className="text-sm font-bold text-orange-600 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +8% YoY
          </span>
        </div>
      </div>
    </div>
  );
}

function MarketFinishPanelPreview() {
  return (
    <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-5 bg-gradient-to-r from-slate-50 to-purple-50 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-100">
              <Ruler className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                Market & Finish Level Analysis
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">Research-Grade</span>
              </h3>
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Georgia • Michigan
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-emerald-600">
              <DollarSign className="w-4 h-4" />
              <span className="font-semibold">0.89× National Avg</span>
            </div>
            <p className="text-xs text-slate-400">Georgia Labor Costs • State Avg</p>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-5">
        {/* Bid Comparison */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-1 text-slate-600 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">Your Bid</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">$13,500</p>
            <p className="text-sm text-slate-500">$38/sq ft</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
            <div className="flex items-center gap-1 text-emerald-600 mb-1">
              <Target className="w-4 h-4" />
              <span className="text-sm">Market Average</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">$18,500</p>
            <p className="text-sm text-emerald-600">Range: $12,000 - $35,000</p>
          </div>
        </div>
        
        {/* Fair Market Price Badge */}
        <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200 mb-5">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <div>
            <p className="font-semibold text-emerald-700">Fair Market Price</p>
            <p className="text-sm text-emerald-600">This bid is within 27% of the market average—a reasonable, competitive quote.</p>
          </div>
        </div>
        
        {/* Finish Level Scale */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> 5-TRADE FINISH LEVEL ANALYSIS
          </p>
          
          <div className="relative">
            {/* Current Level Indicator */}
            <div className="absolute -top-2 left-[10%] transform -translate-x-1/2 z-10">
              <div className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-sm font-semibold shadow-lg">
                <span className="text-xs block">Basic</span>
                $38/sf
              </div>
            </div>
            
            <div className="h-16" />
            
            {/* Gradient Scale */}
            <div className="h-3 rounded-full bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-500" />
            
            {/* Labels */}
            <div className="flex justify-between mt-2">
              <div className="text-center">
                <p className="text-sm font-medium text-emerald-600">Basic</p>
                <p className="text-xs text-slate-400">$87/sf</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-blue-600">Good</p>
                <p className="text-xs text-slate-400">$142/sf</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-purple-600">Luxury</p>
                <p className="text-xs text-slate-400">$207/sf</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Why Target Good */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-start gap-3">
            <BarChart3 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-800 mb-1">Why Target the 'Good' Finish Level?</p>
              <p className="text-sm text-blue-700 leading-relaxed">
                Our AI-powered 5-Trade Index analyzes your bid against local BLS data for five key trades 
                (Plumbing, Electrical, Carpentry, Tile, Painting). This '<strong>Good</strong>' tier represents 
                the optimal balance of high-quality finishes and fair labor costs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Original Preview Components
// ============================================

function BLSStatusBadgePreview() {
  return (
    <div className="flex gap-3">
      <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
        <Database className="w-3 h-3" />
        Live BLS Data
      </span>
      <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border bg-amber-50 text-amber-700 border-amber-200">
        <Loader2 className="w-3 h-3 animate-spin" />
        Cached (Updating...)
      </span>
      <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border bg-blue-50 text-blue-700 border-blue-200">
        <Database className="w-3 h-3" />
        Representative Data
      </span>
    </div>
  );
}

function SocialDataBadgePreview() {
  return (
    <span className="px-2.5 py-1 text-xs font-semibold bg-purple-50 text-purple-700 rounded-full border border-purple-200">
      Social Data
    </span>
  );
}

function PremiumBadgePreview() {
  return (
    <div className="flex gap-3">
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 flex items-center gap-1">
        <Sparkles className="w-3 h-3" />
        Premium
      </span>
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 flex items-center gap-1">
        <Sparkles className="w-3 h-3" />
        Pro
      </span>
    </div>
  );
}

function MarketComparisonHeaderPreview() {
  return (
    <div className="w-full max-w-md bg-gradient-to-r from-emerald-50 to-teal-50 p-5 border border-emerald-100 rounded-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white shadow-sm">
            <Target className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              Market Comparison
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Premium
              </span>
            </h3>
            <p className="text-sm text-slate-500">
              Kitchen Remodel • Atlanta Metro, GA
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function GaugeChartPreview() {
  const bidPos = 55;
  
  return (
    <div className="w-full max-w-sm bg-slate-50 rounded-xl p-4">
      <div className="relative pt-8 pb-4">
        <div 
          className="absolute -top-1 transform -translate-x-1/2"
          style={{ left: `${bidPos}%` }}
        >
          <div className="px-3 py-1.5 rounded-lg text-white text-sm font-bold shadow-lg bg-blue-500">
            $45,000
          </div>
          <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] mx-auto border-t-blue-500 border-l-transparent border-r-transparent" />
        </div>
        
        <div className="relative h-4 rounded-full overflow-hidden bg-slate-200">
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to right, #10b981 0%, #10b981 25%, #3b82f6 25%, #3b82f6 50%, #f59e0b 50%, #f59e0b 75%, #ef4444 75%, #ef4444 100%)',
            }}
          />
          <div 
            className="absolute top-1/2 w-5 h-5 rounded-full border-2 border-white shadow-lg bg-blue-500"
            style={{ left: `${bidPos}%`, transform: 'translate(-50%, -50%)' }}
          />
        </div>
        
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          <span>$30,000</span>
          <span>$60,000</span>
        </div>
      </div>
    </div>
  );
}

function PriceCardsPreview() {
  return (
    <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
      <div className="rounded-xl p-3 bg-slate-50 border border-slate-100">
        <div className="flex items-center gap-2 mb-1">
          <DollarSign className="w-4 h-4 text-slate-600" />
          <span className="text-xs font-medium text-slate-700">Your Bid</span>
        </div>
        <p className="text-xl font-bold text-slate-900">$45,000</p>
      </div>
      <div className="rounded-xl p-3 bg-blue-50 border border-blue-100">
        <div className="flex items-center gap-2 mb-1">
          <DollarSign className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-medium text-blue-700">Market Avg</span>
        </div>
        <p className="text-xl font-bold text-slate-900">$42,500</p>
      </div>
    </div>
  );
}

function MarketStatusBadgesPreview() {
  return (
    <div className="flex flex-wrap gap-2">
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700">
        <TrendingDown className="w-4 h-4" />
        <span className="text-sm font-semibold">Below Market</span>
      </div>
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700">
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm font-semibold">Fair Price</span>
      </div>
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-100 text-orange-700">
        <TrendingUp className="w-4 h-4" />
        <span className="text-sm font-semibold">Above Market</span>
      </div>
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-100 text-red-700">
        <AlertTriangle className="w-4 h-4" />
        <span className="text-sm font-semibold">Significantly Above</span>
      </div>
    </div>
  );
}

function AISynthesisBoxPreview() {
  return (
    <div className="w-full max-w-md space-y-2">
      <div className="rounded-xl p-3 border bg-red-50 border-red-200">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-1 text-red-700">AI Market Synthesis</p>
            <p className="text-sm text-red-700">Material costs are surging. Consider locking in prices soon.</p>
          </div>
        </div>
      </div>
      <div className="rounded-xl p-3 border bg-emerald-50 border-emerald-200">
        <div className="flex items-start gap-3">
          <TrendingDown className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-1 text-emerald-700">AI Market Synthesis</p>
            <p className="text-sm text-emerald-700">Prices are dropping. Good time to negotiate.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarketComparisonCardPreview() {
  return (
    <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-5 border-b border-emerald-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white shadow-sm">
              <Target className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Bid vs. Market
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Premium
                </span>
              </h3>
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Window Replacement • Georgia
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700">
            <TrendingDown className="w-4 h-4" />
            <span className="text-sm font-semibold">Below Market</span>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-5">
        {/* Project Type Badge */}
        <div className="mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-slate-700">Project Type:</span>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
            Window Replacement
          </span>
        </div>
        
        {/* Window Metrics */}
        <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <Ruler className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">4 windows @ $3,975/window</span>
          </div>
          <p className="text-xs text-slate-500">
            Market range for standard vinyl windows: $400-$950/window installed
          </p>
        </div>
        
        {/* Price Comparison */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-1 text-slate-600 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">Your Bid</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">$15,899</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center gap-1 text-blue-600 mb-1">
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm">Market Average</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">$2,700</p>
            <p className="text-xs text-blue-600">Range: $1,600 - $3,800</p>
          </div>
        </div>
        
        {/* Verdict */}
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800">Above Market Average</p>
              <p className="text-sm text-amber-700 mt-1">
                This bid is 489% above market rates. Consider getting additional quotes or asking for a detailed breakdown.
              </p>
            </div>
          </div>
        </div>
        
        {/* State Cost Note */}
        <div className="mt-4 flex items-start gap-2 text-xs text-slate-500">
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <p>Georgia pricing tends to run 5-10% below national averages</p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// PROJECT INSIGHTS CARD (Archived Feb 2025)
// ============================================

type ProjectType = 'kitchen' | 'bathroom' | 'addition' | 'general';

interface ProjectInsights {
  timelineTips: string[];
  costSavingTips: string[];
  watchOutFor: string[];
  negotiationLeverage: string[];
  leadTimeWarning?: string;
}

const PROJECT_INSIGHTS: Record<ProjectType, ProjectInsights> = {
  kitchen: {
    timelineTips: [
      'Custom cabinets typically have 3-4 month lead times—order early',
      'Appliance delivery for premium brands may add 4-8 weeks',
      'Countertop templating happens after cabinet install—factor 2-3 weeks'
    ],
    costSavingTips: [
      'DIY painting and hardware installation can save 10-15% on labor',
      'RTA (ready-to-assemble) cabinets cost 40-60% less than custom',
      'Consider refacing existing cabinets if layout works well'
    ],
    watchOutFor: [
      'Appliance delivery fees and installation not always in base bid',
      'Electrical/plumbing changes for island placement add significant cost',
      'Disposal fees for old cabinets and appliances'
    ],
    negotiationLeverage: [
      'Cabinet suppliers often have end-of-quarter sales',
      'Ask about floor model or discontinued appliance discounts',
      'Bundle countertops with backsplash for better pricing'
    ],
    leadTimeWarning: 'Custom cabinetry lead times are currently 3-4 months. Consider ordering cabinets before finalizing contractor schedule.'
  },
  bathroom: {
    timelineTips: [
      'Tile setters are in high demand—book 4-6 weeks in advance',
      'Custom vanities may require 6-8 week lead time',
      'Plumbing rough-in should happen before tile work'
    ],
    costSavingTips: [
      'Buy finish materials (faucets, lighting) yourself to avoid markups',
      'Standard-size vanities cost significantly less than custom',
      'Subway tile is affordable and timeless—skip trendy expensive options'
    ],
    watchOutFor: [
      'Water damage behind existing tile—budget for potential repairs',
      'Ventilation requirements may require new fan/ductwork',
      'Permit requirements vary—some jurisdictions require for any plumbing changes'
    ],
    negotiationLeverage: [
      'Tile overstock/clearance can save 40-60%',
      'Ask for package pricing on fixtures (toilet, vanity, faucet)',
      'Off-season scheduling (winter) may get better rates'
    ],
    leadTimeWarning: 'Finding available tile setters is challenging right now. Higher-than-expected labor quotes are common—get at least 3 estimates.'
  },
  addition: {
    timelineTips: [
      'Permit approval can take 2-8 weeks depending on municipality',
      'Foundation work is weather-dependent—plan for delays',
      'Custom windows have extended lead times (6-10 weeks)'
    ],
    costSavingTips: [
      'Thorough architectural plans prevent costly change orders',
      'Consider design-build firms for complex projects',
      'Phase the project: shell first, finish later'
    ],
    watchOutFor: [
      'Setback requirements may limit addition size',
      'HVAC system may need upsizing for added square footage',
      'Matching existing roofline can be more expensive than simple designs'
    ],
    negotiationLeverage: [
      'Winter starts may offer 5-10% discounts from contractors',
      'Lumber prices have stabilized—push back on inflated material quotes',
      'Bundle with other exterior work for economies of scale'
    ],
    leadTimeWarning: 'Permit timelines vary significantly by municipality. Some homeowners report 2-8 week waits—start the permit process early.'
  },
  general: {
    timelineTips: [
      'Get contractor availability confirmed before signing',
      'Order materials early to avoid project delays',
      'Build in 10-20% timeline buffer for unexpected issues'
    ],
    costSavingTips: [
      'Get at least 3 detailed written quotes for comparison',
      'Consider doing demo work yourself if allowed',
      'Buy materials directly when possible to avoid markups'
    ],
    watchOutFor: [
      'Vague line items that could lead to change orders',
      'Payment schedules that front-load contractor payments',
      'Unclear scope that leaves room for interpretation'
    ],
    negotiationLeverage: [
      'Flexibility on start date can get better pricing',
      'Cash discounts may be available—ask',
      'Bundle multiple projects for volume pricing'
    ]
  }
};

function normalizeProjectTypeForInsights(projectType: string): ProjectType {
  const normalized = projectType.toLowerCase();
  if (normalized.includes('kitchen')) return 'kitchen';
  if (normalized.includes('bath')) return 'bathroom';
  if (normalized.includes('addition') || normalized.includes('room add')) return 'addition';
  return 'general';
}

function ProjectInsightsCardPreview() {
  const projectType = 'kitchen';
  const normalizedType = normalizeProjectTypeForInsights(projectType);
  const insights = PROJECT_INSIGHTS[normalizedType] || PROJECT_INSIGHTS.general;
  const [activeTab, setActiveTab] = useState<'timeline' | 'savings' | 'watchout' | 'negotiate'>('timeline');

  const tabs = [
    { id: 'timeline' as const, label: 'Timeline', icon: Clock, color: 'blue' },
    { id: 'savings' as const, label: 'Save Money', icon: DollarSign, color: 'emerald' },
    { id: 'watchout' as const, label: 'Watch For', icon: AlertTriangle, color: 'amber' },
    { id: 'negotiate' as const, label: 'Negotiate', icon: Target, color: 'purple' },
  ];

  const getActiveContent = () => {
    switch (activeTab) {
      case 'timeline': return insights.timelineTips;
      case 'savings': return insights.costSavingTips;
      case 'watchout': return insights.watchOutFor;
      case 'negotiate': return insights.negotiationLeverage;
    }
  };

  const getActiveColor = () => {
    const tab = tabs.find(t => t.id === activeTab);
    return tab?.color || 'blue';
  };

  const colorClasses: Record<string, { bg: string; border: string; text: string; icon: string; badge: string }> = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'text-blue-500', badge: 'bg-blue-100' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'text-emerald-500', badge: 'bg-emerald-100' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: 'text-amber-500', badge: 'bg-amber-100' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', icon: 'text-purple-500', badge: 'bg-purple-100' },
  };

  const activeColor = colorClasses[getActiveColor()];
  const content = getActiveContent();

  return (
    <div className="bg-white rounded-2xl border-2 border-teal-100 shadow-sm overflow-hidden">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <Lightbulb className="w-5 h-5 text-teal-600" />
          <h3 className="text-lg font-bold text-slate-900">Project-Specific Tips</h3>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Actionable insights for Kitchen projects based on current market conditions
        </p>

        {/* Lead Time Warning */}
        {insights.leadTimeWarning && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800 mb-0.5">Lead Time Alert</p>
              <p className="text-sm text-amber-700">{insights.leadTimeWarning}</p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-4 p-1 bg-slate-100 rounded-xl overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  isActive 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? colorClasses[tab.color].icon : ''}`} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className={`${activeColor.bg} ${activeColor.border} border rounded-xl p-4`}>
          <ul className="space-y-3">
            {content.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full ${activeColor.badge} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <span className={`text-xs font-bold ${activeColor.text}`}>{idx + 1}</span>
                </div>
                <p className={`text-sm ${activeColor.text} leading-relaxed`}>{tip}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Source Attribution */}
        <div className="pt-3 mt-4 border-t border-teal-100">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <FileText className="w-3 h-3" />
            <span>Based on industry data and homeowner experiences</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Related Reading Section Preview (archived Feb 2025)
function RelatedReadingPreview() {
  const articles = [
    { title: 'What Should a Contractor Bid Include?', description: 'Learn the essential elements every professional estimate should contain.' },
    { title: 'How to Compare Contractor Bids', description: 'A step-by-step guide to evaluating multiple estimates apples-to-apples.' },
    { title: 'Red Flags in Contractor Estimates', description: 'Warning signs that could indicate problems with a contractor or bid.' },
  ];

  return (
    <section className="py-12 px-4 bg-gray-100 rounded-xl">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Related Reading
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {articles.map((article, idx) => (
            <div 
              key={idx}
              className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow group cursor-pointer"
            >
              <h3 className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors mb-2">
                {article.title}
              </h3>
              <p className="text-sm text-gray-600">
                {article.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Issues Found Section Preview (archived Feb 2025)
function IssuesFoundPreview() {
  const sampleFlags = [
    { id: 'license-missing', title: 'Georgia License Number Missing', description: 'In Georgia, contractors must be licensed for projects over $2,500.', level: 'critical' as const },
    { id: 'no-timeline', title: 'No Project Timeline', description: "This bid doesn't specify start date, completion date, or duration.", level: 'medium' as const },
    { id: 'scope-vague', title: 'Scope Lacks Critical Details', description: 'Found 2 areas without proper specifications.', level: 'medium' as const },
  ];

  const levelStyles = {
    critical: { badge: 'bg-red-600', text: 'text-red-600', label: 'CRITICAL', points: 8 },
    high: { badge: 'bg-amber-500', text: 'text-amber-500', label: 'HIGH', points: 8 },
    medium: { badge: 'bg-yellow-500', text: 'text-yellow-600', label: 'MEDIUM', points: 4 },
    low: { badge: 'bg-blue-500', text: 'text-blue-600', label: 'LOW', points: 2 },
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Black Header */}
      <div className="bg-black px-6 py-5 flex items-center gap-4">
        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-2xl font-bold text-white">Issues Found</h3>
          <p className="text-sm text-white/60">3 issues affecting your score</p>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6 space-y-3">
        {sampleFlags.map((flag) => {
          const style = levelStyles[flag.level];
          return (
            <div key={flag.id} className="bg-white rounded-2xl border border-slate-200 px-5 py-4 shadow-sm">
              <div className="flex items-start gap-3">
                <AlertTriangle className={`w-5 h-5 mt-0.5 ${style.text}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="text-base font-semibold text-slate-800">{flag.title}</h4>
                    <span className={`${style.badge} text-white text-xs font-bold px-2 py-0.5 rounded-full`}>
                      {style.label}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{flag.description}</p>
                </div>
                <span className={`${style.badge} text-white text-sm font-bold px-3 py-1.5 rounded-full whitespace-nowrap`}>
                  −{style.points} pts
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
