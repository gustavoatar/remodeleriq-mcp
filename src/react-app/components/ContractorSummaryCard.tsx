import { useState, useEffect, useMemo, useCallback } from 'react';
import { Shield, Star, Award, Loader2, Ban } from 'lucide-react';
import { ratingToLetterGrade, type ReviewSentimentResult } from '@/shared/reviewSentiment';

interface GooglePlacesData {
  placeId: string;
  name: string;
  address: string;
  rating: number | null;
  reviewCount: number | null;
  reviews: Array<{
    text: string;
    rating?: number;
    timeAgo?: string;
    author?: string;
  }>;
  website?: string;
  phone?: string;
  businessStatus?: string;
}

interface ContractorSummaryCardProps {
  contractorName: string;
  googleData: GooglePlacesData | null;
  googleLoading: boolean;
  bbbStatus: string | null;
  hasLicense: boolean;
  licenseNumber?: string | null;
  researchLoading?: boolean;
  /** Demo/sample mode: skip the live sentiment call and render this instead. */
  prebakedSentiment?: ReviewSentimentResult | null;
}

// Hook to fetch sentiment analysis
function useReviewSentiment(
  reviews: GooglePlacesData['reviews'] | undefined,
  contractorName: string
): { data: ReviewSentimentResult | null; loading: boolean } {
  const [data, setData] = useState<ReviewSentimentResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!reviews || reviews.length === 0) {
      setData(null);
      return;
    }

    const fetchSentiment = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/contractor/review-sentiment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reviews, contractorName })
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setData(result.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch sentiment:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSentiment();
  }, [reviews, contractorName]);

  return { data, loading };
}

// Sentiment bar for white background
function SentimentBarWhite({ 
  label, 
  percent, 
  isNegative = false 
}: { 
  label: string; 
  percent: number; 
  isNegative?: boolean;
}) {
  const barColor = isNegative 
    ? 'bg-gradient-to-r from-red-500 to-red-400' 
    : 'bg-gradient-to-r from-emerald-500 to-emerald-400';
  
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-600 w-24 shrink-0">{label}</span>
      <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
      <span className="text-xs font-medium text-slate-700 w-10 text-right">{percent}%</span>
    </div>
  );
}

export default function ContractorSummaryCard({
  contractorName,
  googleData,
  googleLoading,
  bbbStatus,
  hasLicense,
  researchLoading = false,
  prebakedSentiment = null,
}: ContractorSummaryCardProps) {
  // With prebaked sentiment (demo mode) skip the live call entirely —
  // passing undefined reviews short-circuits the fetch inside the hook.
  const { data: fetchedSentiment, loading: sentimentLoading } = useReviewSentiment(
    prebakedSentiment ? undefined : googleData?.reviews,
    contractorName
  );
  const sentiment = prebakedSentiment ?? fetchedSentiment;

  // Calculate letter grade from Google rating
  const letterGrade = useMemo(() => {
    return ratingToLetterGrade(googleData?.rating ?? null);
  }, [googleData?.rating]);

  // Parse BBB grade from status string - handle both letter grades and "Accredited" status
  const bbbGrade = useMemo(() => {
    if (!bbbStatus) return null;
    
    // First try to extract letter grade (A+ through F)
    const gradeMatch = bbbStatus.match(/\b([A-F][+-]?)\s*(rated|rating)?/i);
    if (gradeMatch) {
      return gradeMatch[1].toUpperCase();
    }
    
    // Check for negative statuses first - don't show badge for these
    if (/not\s+(accredited|found)/i.test(bbbStatus)) {
      return null;
    }
    
    // If no letter grade, check for "Accredited" status (but not "Not Accredited")
    if (/accredited/i.test(bbbStatus)) {
      return 'BBB'; // Show "BBB" badge for accredited businesses without a letter grade
    }
    
    return null;
  }, [bbbStatus]);

  const hasReviews = googleData?.reviews && googleData.reviews.length > 0;
  const hasGoogleRating = googleData?.rating != null;
  const hasBBB = bbbGrade != null; // Only show BBB if we have an actual grade
  const hasAnyData = hasGoogleRating || hasBBB || hasLicense;

  // Scroll to contractor details with offset for better positioning
  const handleClick = useCallback(() => {
    const contractorSection = document.getElementById('contractor-pulse-section');
    if (contractorSection) {
      const elementPosition = contractorSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - 80; // 80px offset from top
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  }, []);

  if (!hasAnyData && !googleLoading) {
    return null;
  }

  // Use Google Places discovered name if available, fallback to passed name
  const displayName = googleData?.name || contractorName;

  return (
    <div 
      onClick={handleClick}
      className="rounded-xl overflow-hidden shadow-lg cursor-pointer transition-colors animate-fade-slide-up animation-delay-200 border border-slate-200"
    >
      {/* Header - Black background with contractor name + badges */}
      <div className="bg-black px-4 py-3 flex items-center gap-4">
        {/* Contractor Name */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-white truncate">
            {displayName}
          </h3>
          {hasReviews && (
            <p className="text-xs text-slate-400">
              {googleData?.reviewCount} reviews analyzed
            </p>
          )}
        </div>

        {/* Badges Row - compact */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Letter Grade */}
          {googleLoading ? (
            <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
            </div>
          ) : (
            <div className="text-center">
              <div className={`w-12 h-12 rounded-lg ${hasGoogleRating ? 'bg-emerald-600' : 'bg-white border-2 border-emerald-600'} flex items-center justify-center`}>
                {hasGoogleRating ? (
                  <span className="text-xl font-black text-white">
                    {letterGrade}
                  </span>
                ) : (
                  <Ban className="w-6 h-6 text-emerald-600" strokeWidth={2.5} />
                )}
              </div>
              {hasGoogleRating ? (
                <div className="flex items-center justify-center gap-0.5 mt-1">
                  <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                  <span className="text-[10px] font-medium text-slate-300">
                    {googleData!.rating!.toFixed(1)}
                  </span>
                </div>
              ) : (
                <span className="text-[10px] text-slate-400 mt-1 block font-medium">Google</span>
              )}
            </div>
          )}

          {/* BBB Badge */}
          <div className="text-center">
            <div className={`w-12 h-12 rounded-lg ${hasBBB ? 'bg-white border-2 border-emerald-600' : 'bg-white border-2 border-emerald-600'} flex items-center justify-center`}>
              {researchLoading ? (
                <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
              ) : hasBBB ? (
                <Award className="w-5 h-5 text-emerald-600" strokeWidth={2.5} />
              ) : (
                <Ban className="w-6 h-6 text-emerald-600" strokeWidth={2.5} />
              )}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block font-medium">BBB</span>
          </div>

          {/* License Badge */}
          <div className="text-center">
            <div className={`w-12 h-12 rounded-lg ${hasLicense ? 'bg-white border-2 border-emerald-600' : 'bg-white border-2 border-emerald-600'} flex items-center justify-center`}>
              {researchLoading ? (
                <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
              ) : hasLicense ? (
                <Shield className="w-5 h-5 text-emerald-600" strokeWidth={2.5} />
              ) : (
                <Ban className="w-6 h-6 text-emerald-600" strokeWidth={2.5} />
              )}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block font-medium">Licensed</span>
          </div>
        </div>
      </div>

      {/* Sentiment Analysis - WHITE background for body */}
      {hasReviews && sentiment && (
        <div className="px-4 pb-3 pt-3 bg-white">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs font-medium text-slate-600">Review Sentiment</span>
          </div>
          <div className="space-y-2">
            <SentimentBarWhite label="Positive" percent={sentiment.positiveFeelingsPercent} />
            <SentimentBarWhite label="Outcomes" percent={sentiment.positiveOutcomesPercent} />
            <SentimentBarWhite label="Professional" percent={sentiment.professionalismPercent} />
            {sentiment.negativePercent > 5 && (
              <SentimentBarWhite label="Negative" percent={sentiment.negativePercent} isNegative />
            )}
          </div>
          {sentiment.keyThemes && sentiment.keyThemes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {sentiment.keyThemes.slice(0, 3).map((theme, i) => (
                <span key={i} className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] rounded-full">
                  {theme}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Loading state for sentiment */}
      {hasReviews && sentimentLoading && !sentiment && (
        <div className="px-4 pb-3 pt-2 bg-white">
          <div className="flex items-center gap-2 text-slate-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="text-xs">Analyzing reviews...</span>
          </div>
        </div>
      )}

      {/* Data Sources Attribution */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-200">
        <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400">
          <span>Data from</span>
          <a 
            href="https://www.google.com/maps"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 hover:text-emerald-700 font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            Google
          </a>
          <span>•</span>
          <a 
            href="https://www.bbb.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 hover:text-emerald-700 font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            BBB
          </a>
          <span>•</span>
          <a 
            href="https://www.angi.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 hover:text-emerald-700 font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            Angi
          </a>
          <span>•</span>
          <a 
            href="https://www.yelp.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 hover:text-emerald-700 font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            Yelp
          </a>
        </div>
      </div>
    </div>
  );
}
