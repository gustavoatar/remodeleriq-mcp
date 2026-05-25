/**
 * Review Sentiment Analysis
 * Analyzes Google reviews to extract sentiment percentages for various categories
 */

export interface ReviewData {
  text: string;
  rating?: number;
  timeAgo?: string;
  author?: string;
}

export interface ReviewSentimentResult {
  positiveFeelingsPercent: number;  // Happy, satisfied, impressed, relieved
  positiveOutcomesPercent: number;  // Problem solved, quality work, on time, on budget
  professionalismPercent: number;   // Communication, reliability, expertise, courtesy
  negativePercent: number;          // Frustrated, disappointed, issues, delays
  keyThemes: string[];              // Top 3 themes from reviews
  sampleQuotes: {
    positive: string | null;
    negative: string | null;
  };
  reviewCount: number;
  averageRating: number | null;
  confidence: 'high' | 'medium' | 'low';
}

export interface ReviewSentimentInput {
  reviews: ReviewData[];
  contractorName?: string;
}

/**
 * Build the prompt for Gemini to analyze reviews
 */
export function buildReviewSentimentPrompt(input: ReviewSentimentInput): string {
  const reviewsText = input.reviews.slice(0, 10).map((r, i) => {
    const ratingStr = r.rating ? ` (${r.rating}/5 stars)` : '';
    return `Review ${i + 1}${ratingStr}: "${r.text}"`;
  }).join('\n\n');

  return `Analyze these customer reviews for a contractor${input.contractorName ? ` named "${input.contractorName}"` : ''}.

REVIEWS:
${reviewsText}

Analyze the sentiment and categorize into these percentages (each 0-100):

1. POSITIVE FEELINGS: Expressions of happiness, satisfaction, being impressed, relief, gratitude
2. POSITIVE OUTCOMES: Mentions of quality work, problems solved, on-time completion, staying on budget, good results
3. PROFESSIONALISM: Comments about communication, reliability, expertise, punctuality, courtesy, responsiveness
4. NEGATIVE: Any frustration, disappointment, complaints, delays, issues, concerns

Also extract:
- Top 3 recurring themes (e.g., "great communication", "quality craftsmanship", "competitive pricing")
- One short positive quote (10 words max)
- One short negative quote if any (10 words max, or null)

Return ONLY valid JSON:
{
  "positiveFeelingsPercent": <number 0-100>,
  "positiveOutcomesPercent": <number 0-100>,
  "professionalismPercent": <number 0-100>,
  "negativePercent": <number 0-100>,
  "keyThemes": ["theme1", "theme2", "theme3"],
  "sampleQuotes": {
    "positive": "<quote or null>",
    "negative": "<quote or null>"
  },
  "confidence": "<high|medium|low>"
}`;
}

/**
 * Generate fallback result when AI is unavailable
 */
export function generateFallbackSentiment(reviews: ReviewData[]): ReviewSentimentResult {
  const ratings = reviews.filter(r => r.rating).map(r => r.rating!);
  const avgRating = ratings.length > 0 
    ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
    : null;
  
  // Estimate percentages from average rating
  const basePositive = avgRating ? Math.round((avgRating / 5) * 85) : 50;
  
  return {
    positiveFeelingsPercent: basePositive,
    positiveOutcomesPercent: Math.round(basePositive * 0.9),
    professionalismPercent: Math.round(basePositive * 0.95),
    negativePercent: Math.max(0, 100 - basePositive - 15),
    keyThemes: ['Customer service', 'Quality work', 'Professionalism'],
    sampleQuotes: {
      positive: reviews[0]?.text?.slice(0, 50) || null,
      negative: null
    },
    reviewCount: reviews.length,
    averageRating: avgRating,
    confidence: 'low'
  };
}

/**
 * Convert Google rating to letter grade
 */
export function ratingToLetterGrade(rating: number | null): string {
  if (rating === null) return '?';
  if (rating >= 4.8) return 'A+';
  if (rating >= 4.5) return 'A';
  if (rating >= 4.2) return 'A-';
  if (rating >= 4.0) return 'B+';
  if (rating >= 3.7) return 'B';
  if (rating >= 3.3) return 'B-';
  if (rating >= 3.0) return 'C+';
  if (rating >= 2.5) return 'C';
  if (rating >= 2.0) return 'C-';
  return 'D';
}

/**
 * Get grade color classes
 */
export function getGradeColor(grade: string): { bg: string; text: string; border: string } {
  if (grade.startsWith('A')) {
    return { bg: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-600' };
  }
  if (grade.startsWith('B')) {
    return { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-600' };
  }
  if (grade.startsWith('C')) {
    return { bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-500' };
  }
  return { bg: 'bg-red-500', text: 'text-white', border: 'border-red-500' };
}
