import { useState, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, AlertTriangle, TrendingUp,
  CheckCircle, AlertCircle, Shield, Sparkles, DollarSign,
  Star, BadgeCheck, FileText, Search, MapPin
} from 'lucide-react';

interface SlideData {
  id: string;
  title: string;
  subtitle: string;
  content: React.ReactNode;
}

export default function SamplePreviewSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    } else if (isRightSwipe) {
      setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    }
  };

  const slides: SlideData[] = [
    {
      id: 'score',
      title: 'Bid Score Summary',
      subtitle: 'Instant risk assessment',
      content: <ScoreSummarySample />,
    },
    {
      id: 'price',
      title: 'Price Analysis',
      subtitle: 'Compare to market rates',
      content: <PriceAnalysisSample />,
    },
    {
      id: 'contractor',
      title: 'Contractor Verification',
      subtitle: 'License & reputation check',
      content: <ContractorPulseSample />,
    },
    {
      id: 'scope',
      title: 'Scope Analysis',
      subtitle: 'What\'s included vs missing',
      content: <ScopeAnalysisSample />,
    },
  ];

  useEffect(() => {
    if (isPaused) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  const goToPrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-slate-50 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 rounded-full px-4 py-2 mb-4">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Preview Our Analysis</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#333' }}>
            See What You'll Get
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: '#555' }}>
            Powerful insights that help you negotiate with confidence
          </p>
        </div>

        {/* Slider Container */}
        <div 
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Navigation Arrows */}
          <button
            onClick={goToPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-gray-600 hover:text-emerald-600 hover:border-emerald-200 transition-all hidden md:flex"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-gray-600 hover:text-emerald-600 hover:border-emerald-200 transition-all hidden md:flex"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Slides */}
          <div 
            className="overflow-hidden rounded-2xl"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div 
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {slides.map((slide) => (
                <div 
                  key={slide.id}
                  className="w-full flex-shrink-0 px-2"
                >
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
                    {/* Slide Header */}
                    <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-semibold text-lg">{slide.title}</h3>
                        <p className="text-gray-300 text-sm">{slide.subtitle}</p>
                      </div>
                      <div className="px-3 py-1 bg-emerald-500 text-white text-xs font-medium rounded-full">
                        Sample
                      </div>
                    </div>
                    
                    {/* Slide Content */}
                    <div className="p-6">
                      {slide.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dots Navigation */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide 
                    ? 'w-8' 
                    : 'w-2 bg-gray-200 hover:bg-gray-300'
                }`}
                style={index === currentSlide ? { backgroundColor: '#1F9C4C' } : undefined}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Mobile swipe hint */}
          <p className="text-center text-gray-400 text-sm mt-4 md:hidden">
            Swipe to explore →
          </p>
        </div>
      </div>
    </section>
  );
}

// Bid Score Summary Sample
function ScoreSummarySample() {
  const score = 72;
  
  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Left side - Score & Issues */}
      <div className="flex-1">
        <div className="flex items-center gap-4 mb-4">
          {/* Score Circle */}
          <div className="relative flex-shrink-0">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                className="text-gray-100"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="url(#sampleScoreGradient)"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${(score / 100) * 251} 251`}
              />
              <defs>
                <linearGradient id="sampleScoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-emerald-600">{score}</span>
              <span className="text-[10px] text-gray-500">out of 100</span>
            </div>
          </div>

          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1">Moderate Confidence</h4>
            <p className="text-sm text-gray-600 mb-2">Address issues before signing</p>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                1 Critical
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                2 Medium
              </span>
            </div>
          </div>
        </div>

        {/* What's bad section */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">What needs attention</p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">50% Deposit Required</p>
              <p className="text-xs text-gray-600">-12 points • High risk payment terms</p>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">License Not Verified</p>
              <p className="text-xs text-gray-600">-8 points • Request license number</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - What's good */}
      <div className="flex-1 bg-emerald-50 rounded-xl p-4 border border-emerald-200">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <h4 className="font-semibold text-emerald-800">What's Good</h4>
        </div>
        <ul className="space-y-2 text-sm text-emerald-700">
          <li className="flex items-start gap-2">
            <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>Detailed material breakdown with brands</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>Clear project timeline (3-4 weeks)</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>Contact info and business address</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

// Price Analysis Sample
function PriceAnalysisSample() {
  return (
    <div className="space-y-4">
      {/* Header with verdict */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">Kitchen Remodel</h4>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Atlanta, GA • 180 sq ft
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">$24,500</p>
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
            Fair Price
          </span>
        </div>
      </div>

      {/* Price Range Bar */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Market Price Range</p>
        <div className="relative h-8 bg-gradient-to-r from-emerald-200 via-emerald-300 to-amber-200 rounded-full overflow-hidden">
          {/* Bid position marker */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-1 h-6 bg-gray-900 rounded-full"
            style={{ left: '58%' }}
          />
          <div 
            className="absolute -top-6 px-2 py-1 bg-gray-900 text-white text-xs font-medium rounded shadow-lg"
            style={{ left: '58%', transform: 'translateX(-50%)' }}
          >
            Your Bid
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>$18,000</span>
          <span className="text-emerald-600 font-medium">Market Median: $23,500</span>
          <span>$32,000</span>
        </div>
      </div>

      {/* Price per SF comparison */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Your Bid</p>
          <p className="text-lg font-bold text-gray-900">$136/sf</p>
        </div>
        <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
          <p className="text-xs text-emerald-600 mb-1">Market Average</p>
          <p className="text-lg font-bold text-emerald-700">$131/sf</p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 rounded-lg p-3 border border-emerald-200">
        <TrendingUp className="w-4 h-4" />
        <span>Only 4% above market — within normal range for quality contractors</span>
      </div>
    </div>
  );
}

// Contractor Pulse Sample
function ContractorPulseSample() {
  return (
    <div className="space-y-4">
      {/* Contractor header */}
      <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-lg">
          AP
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">Apex Home Renovations</h4>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <MapPin className="w-3 h-3" />
            <span>Atlanta, GA</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="font-medium text-gray-700">4.8</span>
              <span className="text-gray-400">(47 reviews)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Verification badges */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-lg p-3 border border-gray-200 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
            <BadgeCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">License</p>
            <p className="text-sm font-medium text-emerald-700">Verified</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-200 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
            <Shield className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Insurance</p>
            <p className="text-sm font-medium text-emerald-700">Confirmed</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-200 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
            <span className="text-white text-xs font-bold">BBB</span>
          </div>
          <div>
            <p className="text-xs text-gray-500">BBB Rating</p>
            <p className="text-sm font-medium text-emerald-700">A+</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-200 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Years in Business</p>
            <p className="text-sm font-medium text-gray-900">12 years</p>
          </div>
        </div>
      </div>

      {/* AI Research findings */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <Search className="w-4 h-4 text-emerald-600" />
          <p className="text-sm font-medium text-gray-700">AI Research Summary</p>
        </div>
        <p className="text-sm text-gray-600">
          Strong online reputation with consistent 5-star reviews on Google and Houzz. 
          Active Georgia contractor license #RBCO012345. No BBB complaints in past 3 years.
        </p>
      </div>
    </div>
  );
}

// Scope Analysis Sample  
function ScopeAnalysisSample() {
  const includedItems = [
    'Cabinet demolition & disposal',
    'New cabinet installation',
    'Countertop fabrication & install',
    'Plumbing fixtures',
    'Electrical outlets',
  ];

  const missingItems = [
    'Permit fees',
    'Final inspection',
    'Touch-up painting',
  ];

  return (
    <div className="space-y-4">
      {/* Summary header */}
      <div className="flex items-center justify-between bg-emerald-50 rounded-xl p-4 border border-emerald-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h4 className="font-semibold text-emerald-800">Scope Completeness</h4>
            <p className="text-sm text-emerald-600">Kitchen remodel scope analysis</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-emerald-600">85%</p>
          <p className="text-xs text-emerald-500">Complete</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Included items */}
        <div className="bg-white rounded-xl p-4 border border-emerald-200">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <h4 className="font-medium text-gray-900">What's Included</h4>
            <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
              {includedItems.length} items
            </span>
          </div>
          <ul className="space-y-2">
            {includedItems.map((item, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Missing items */}
        <div className="bg-white rounded-xl p-4 border border-amber-200">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <h4 className="font-medium text-gray-900">Ask About</h4>
            <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              {missingItems.length} items
            </span>
          </div>
          <ul className="space-y-2">
            {missingItems.map((item, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-start gap-2">
        <Shield className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-emerald-700">
          <strong>Tip:</strong> Confirm who handles permits and final inspections before signing
        </p>
      </div>
    </div>
  );
}
