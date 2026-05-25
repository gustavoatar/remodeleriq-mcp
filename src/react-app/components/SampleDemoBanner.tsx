import { useState, useEffect } from 'react';
import { ArrowRight, X, Sparkles } from 'lucide-react';

interface LocationData {
  location: string;
  savings: number;
}

// Reuse the location savings hook pattern from Hero
function useLocationSavings() {
  const [data, setData] = useState<LocationData | null>(null);
  
  useEffect(() => {
    // Check cache first
    const cached = sessionStorage.getItem('remodeleriq_geo');
    if (cached) {
      try {
        setData(JSON.parse(cached));
        return;
      } catch {}
    }
    
    // Fetch from API
    fetch('/api/geo')
      .then(res => res.json())
      .then(result => {
        const geoData = { location: result.location, savings: result.savings };
        setData(geoData);
        sessionStorage.setItem('remodeleriq_geo', JSON.stringify(geoData));
      })
      .catch(() => {
        // Fallback on error
        setData({ location: 'your area', savings: 1258 });
      });
  }, []);
  
  return data;
}

interface SampleDemoBannerProps {
  onAnalyzeYourBid: () => void;
}

export default function SampleDemoBanner({ onAnalyzeYourBid }: SampleDemoBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const locationSavings = useLocationSavings();
  
  if (isDismissed) return null;
  
  const location = locationSavings?.location || 'your area';
  const savings = locationSavings?.savings || 1258;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none">
      <div className="max-w-3xl mx-auto pointer-events-auto">
        <div 
          onClick={onAnalyzeYourBid}
          className="relative bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-2xl shadow-2xl shadow-emerald-900/20 border border-emerald-400/30 overflow-hidden cursor-pointer hover:from-emerald-500 hover:to-emerald-400 transition-colors"
        >
          {/* Decorative sparkle pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-2 left-8 w-2 h-2 bg-white rounded-full" />
            <div className="absolute top-6 left-24 w-1.5 h-1.5 bg-white rounded-full" />
            <div className="absolute bottom-4 right-16 w-2 h-2 bg-white rounded-full" />
            <div className="absolute top-3 right-32 w-1 h-1 bg-white rounded-full" />
          </div>
          
          {/* Dismiss button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsDismissed(true);
            }}
            className="absolute top-3 right-3 p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-500/50 rounded-full transition-colors z-10"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="px-5 py-4 sm:px-6 sm:py-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Message */}
              <div className="flex items-start gap-3 pr-6 sm:pr-0">
                <div className="p-2 bg-white/20 rounded-xl flex-shrink-0 hidden sm:block">
                  <Sparkles className="w-5 h-5 text-emerald-800" />
                </div>
                <div>
                  <p className="text-white font-semibold text-base sm:text-lg leading-tight">
                    You're viewing a sample analysis
                  </p>
                  <p className="text-emerald-100 text-sm mt-1">
                    Homeowners in {location} save ${savings.toLocaleString()} on average. Upload your bid to see your personalized insights.
                  </p>
                </div>
              </div>
              
              {/* CTA */}
              <div className="flex items-center justify-center gap-2 px-5 py-3 bg-white text-emerald-700 font-semibold rounded-xl shadow-lg flex-shrink-0 text-sm sm:text-base">
                Analyze Your Bid
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
