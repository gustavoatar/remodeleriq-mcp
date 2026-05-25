import { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, 
  TrendingDown, 
  AlertTriangle
} from 'lucide-react';

interface XRayAuditProps {
  onGetStarted: () => void;
}

export default function XRayAudit({ onGetStarted }: XRayAuditProps) {
  const [isAnimating, setIsAnimating] = useState(true);
  const [cycleCount, setCycleCount] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Stop animation after 2 cycles
  const maxCycles = 2;

  useEffect(() => {
    if (cycleCount >= maxCycles && !isHovered) {
      setIsAnimating(false);
    }
  }, [cycleCount, isHovered]);

  const handleAnimationIteration = () => {
    setCycleCount(prev => prev + 1);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    setIsAnimating(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // Stop animation when mouse leaves (if we've completed initial cycles)
    if (cycleCount >= maxCycles) {
      setIsAnimating(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="flex flex-col items-center w-full max-w-4xl mx-auto cursor-pointer"
      onClick={onGetStarted}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative w-full min-h-[424px] aspect-square sm:aspect-video sm:min-h-0 md:aspect-[2.4/1] bg-white rounded-[2rem] overflow-hidden shadow-xl border border-gray-200">
        
        {/* BACKGROUND: THE "MESSY" MANUAL BID */}
        <div className="absolute inset-0 p-6 md:p-10">
          <div className="flex justify-between items-start mb-6 opacity-50">
            <div className="space-y-1">
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="h-3 w-24 bg-gray-100 rounded" />
            </div>
            <div className="h-8 w-20 bg-gray-100 rounded" />
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between border-b border-gray-100 pb-3 opacity-40">
              <div className="space-y-2">
                <div className="h-4 w-64 bg-gray-200 rounded" />
                <div className="h-3 w-40 bg-gray-100 rounded" />
              </div>
              <div className="h-4 w-20 bg-gray-200 rounded" />
            </div>
            
            <div className="flex justify-between border-b border-gray-100 pb-3 opacity-40">
              <div className="h-4 w-48 bg-gray-200 rounded" />
              <div className="h-4 w-20 bg-gray-200 rounded" />
            </div>
          </div>

          {/* FLOATERS: Simulated manual entries */}
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 opacity-30 rotate-[-5deg]">
            <p className="font-serif text-lg md:text-xl text-gray-500 italic font-medium">"General Labor... $12k"</p>
          </div>
          <div className="absolute bottom-1/4 right-1/4 opacity-30 rotate-[3deg]">
            <p className="font-serif text-base md:text-lg text-gray-500 italic font-medium">"Deposit: 50% due now"</p>
          </div>
        </div>

        {/* FOREGROUND: THE REVEALED DATA (REMODELER IQ UI) */}
        <div 
          className={`absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6 md:p-10 overflow-hidden ${
            isAnimating ? 'xray-reveal' : ''
          }`}
          style={{ 
            clipPath: isAnimating ? undefined : 'inset(0 0 0 0)',
            willChange: isAnimating ? 'clip-path' : 'auto'
          }}
          onAnimationIteration={handleAnimationIteration}
        >
          {/* Header Stats */}
          <div className="flex justify-between items-center mb-6 md:mb-8">
            <div className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              Audit Active
            </div>
            <div className="flex gap-6">
              <div className="text-right">
                <p className="text-emerald-600/60 text-[9px] font-black uppercase tracking-wider">Confidence</p>
                <p className="text-gray-900 text-2xl md:text-3xl font-black">72<span className="text-emerald-500">/100</span></p>
              </div>
            </div>
          </div>

          {/* Analysis Cards - Responsive Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="bg-white/90 border border-red-200 p-3 rounded-xl flex gap-3 items-center shadow-sm">
                <ShieldAlert className="text-red-500 shrink-0" size={18} />
                <div>
                  <p className="text-red-700 text-[10px] font-bold uppercase tracking-tighter leading-none mb-1">Critical Risk</p>
                  <p className="text-gray-600 text-[10px] leading-tight">Deposit exceeds legal limit.</p>
                </div>
              </div>
              <div className="bg-white/90 border border-amber-200 p-3 rounded-xl flex gap-3 items-center shadow-sm">
                <AlertTriangle className="text-amber-500 shrink-0" size={18} />
                <div>
                  <p className="text-amber-700 text-[10px] font-bold uppercase tracking-tighter leading-none mb-1">Scope Gap</p>
                  <p className="text-gray-600 text-[10px] leading-tight">Missing permit details.</p>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-4 md:p-6 rounded-2xl flex flex-col justify-center items-center text-center shadow-sm">
              <TrendingDown className="text-emerald-500 mb-1" size={24} />
              <p className="text-emerald-700 text-[10px] font-bold uppercase leading-none mb-1">Savings Detected</p>
              <p className="text-gray-900 text-3xl md:text-4xl font-black">$4,250</p>
              <p className="text-emerald-600/80 text-[9px] mt-0.5 uppercase font-bold">v. Market Median</p>
            </div>
          </div>
        </div>

        {/* THE SCANNER BEAM - GPU accelerated */}
        <div 
          className={`absolute top-0 bottom-0 w-1 bg-emerald-500 z-20 ${
            isAnimating ? 'xray-beam' : 'opacity-0'
          }`}
          style={{ 
            boxShadow: '0 0 25px rgba(16,185,129,0.8)',
            willChange: isAnimating ? 'left, opacity' : 'auto'
          }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-emerald-500 rounded-full blur-[1px]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-emerald-500 rounded-full blur-[1px]" />
        </div>
      </div>
    </div>
  );
}
