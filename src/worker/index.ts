import { Hono } from "hono";
import { cors } from "hono/cors";
import { GoogleGenAI } from "@google/genai";
import { getCookie } from "hono/cookie";
import { 
  getAllSeriesIds, 
  buildBLSRequestPayload, 
  getStateAdjustedWages,
  getStateName
} from "@/shared/blsLaborRates";
import analyzeCommunity from './routes/analyze-community';
import authRoutes from './routes/auth';
import nextdoorAuthRoutes from './routes/nextdoorAuth';
import redditAuthRoutes from './routes/redditAuth';
import stripeRoutes from './routes/stripe';
import magicLinkRoutes from './routes/magicLink';
import contentDraftsRoutes from './routes/contentDrafts';
import contentSwarmRoutes, { trackEngagement, sendMorningDigest, autoPublishApproved } from './routes/contentSwarm';
import inboxRoutes from './routes/inbox';
import redditDraftsRoutes from './routes/redditDrafts';
import nextdoorDraftsRoutes from './routes/nextdoorDrafts';
import blogPublishRoutes, {
  claimBlogDraftRow,
  processBlogDraftMessage,
  BLOG_DRAFTING_STATUS,
  type BlogDraftJobMessage,
} from './routes/blogPublish';
import inboundEmailRoutes from './routes/inboundEmail';
import facebookWebhookRoutes from './routes/facebookWebhook';
import facebookPublishRoutes from './routes/facebookPublish';
import { generateAndScheduleFbBatch } from './lib/fbContentGenerator';
import { scoutRedditRss } from './lib/redditScout';
import { authMiddleware } from './middleware/auth';
import { type UserProfile as UserProfileType } from './types';
import { getAllOewsData } from "@/shared/lazyData/oewsData";
import { lookupZipInfo } from "@/shared/lazyData/zipMsaLookup";
import { 
  calculateMarketComparison, 
  detectTradeFromText,
  detectAllTradesFromText,
  type DetectedTrade
} from "@/shared/marketRatesEngine";
import {
  detectMultipleTrades,
  estimateCostAllocation,
  compareTradeToMarket
} from "@/shared/tradeDetection";
import { calculatePriceScore, type PriceScoreInput } from "@/shared/priceScoreEngine";
import { calculateBlindBidEstimate } from "@/shared/blindBidEngine";
import { analyzeBid } from "@/shared/analysisEngine";
import { isLinearFootProject as checkLinearFootProject } from "@/shared/projectUnitConfig";
import { 
  buildPriceIntelligencePrompt, 
  generateFallbackResult,
  type PriceIntelligenceInput,
  type PriceIntelligenceResult
} from "@/shared/priceIntelligence";
import {
  createAIClient,
  generateJSON,
  buildBottomLinePrompt,
  generateFallbackBottomLine,
  buildContractorResearchPrompt,
  generateFallbackContractorResearch,
  type BottomLineSynthesis,
  type BottomLineInput,
  type ContractorResearchInput,
  type ContractorResearchResult as AIContractorResearchResult,
  type ComprehensiveAnalysisInput,
  type ComprehensiveAnalysisResult
} from "@/shared/aiServices";
import {
  fetchFredSeries,
  calculateInflationFactor,
  observationsToCacheRows,
  cacheRowsToObservations,
  FRED_SERIES,
  BENCHMARK_BASE_YEAR,

  type InflationAdjustment
} from "@/shared/fredService";

interface LeadRequest {
  name: string;
  email: string;
  timeline: string;
}

interface FeedbackRequest {
  rating: number;
  feedback: string;
}

interface AIAnalysisRequest {
  bidText: string;
  bidTotal?: number;
  stateCode?: string;
  projectCategory?: string;
  squareFootage?: number;
}

interface TalkTrackRequest {
  bidText: string;
  bidTotal?: number;
  contractorName?: string;
  flags: Array<{ title: string; description: string; level: string; recommendation: string }>;
  missingItems: string[];
  marketContext?: string;
  finishLevelData?: {
    bidPSF: number | null;
    status: string;
    appropriateTier: string;
    percentFromTier: number | null;
    localBasicPSF?: number;
    localGoodPSF?: number;
    localLuxuryPSF?: number;
  } | null;
  marketComparison?: {
    bidAmount: number;
    marketAverage: number;
    marketLow: number;
    marketHigh: number;
    percentDifference: number;
    status: string;
    savingsPotential: number;
  } | null;
}

const TIMELINE_LABELS: Record<string, string> = {
  'asap': 'ASAP',
  'next-30-days': 'Next 30 Days',
  'next-few-months': 'Next Few Months',
  'next-year': 'Next Year'
};

const SESSION_COOKIE_NAME = "remodeleriq_session";

// Use the canonical UserProfile from types.ts
type UserProfile = UserProfileType;

interface UserSession {
  id: number;
  user_id: number;
  session_token: string;
  expires_at: string;
  created_at: string;
}

type AppEnv = {
  Bindings: Env;
  Variables: {
    user: UserProfile;
    session: UserSession;
  };
};

const app = new Hono<AppEnv>();

// CORS: restrict to known origins
app.use('*', cors({
  origin: ['https://remodeleriq.com', 'https://www.remodeleriq.com', 'https://remodeleriq.remodeleriq.workers.dev'],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// SEO: 301 redirects for stale Mocha-era URLs (kills GSC "Not found (404)" reports)
const STALE_URL_REDIRECTS: Record<string, string> = {
  '/signup': '/join',
  '/sign-up': '/join',
  '/signin': '/login',
  '/sign-in': '/login',
  '/pricing': '/premium',
  '/plans': '/premium',
  '/upgrade': '/premium',
  '/subscribe': '/premium',
  '/dashboard': '/',
  '/home': '/',
  '/app': '/',
  '/about': '/how-we-score',
  '/how-it-works': '/how-we-score',
  '/scoring': '/how-we-score',
  '/cost-guides': '/remodeling-cost-guides/',
  '/remodel-costs': '/remodeling-cost-guides/',
  '/remodel-cost': '/remodeling-cost-guides/',
  '/remodeling-costs': '/remodeling-cost-guides/',
  '/contractor-search': '/trusted-radar',
  '/verify': '/trusted-radar',
  '/check-contractor': '/trusted-radar',
  '/labor': '/labor-rates',
  '/glossary-of-terms': '/glossary',
  '/oauth/callback': '/auth/google-callback',
  '/auth/callback': '/auth/google-callback',
};

app.use('*', async (c, next) => {
  const url = new URL(c.req.url);
  const target = STALE_URL_REDIRECTS[url.pathname];
  if (target) {
    return c.redirect(target, 301);
  }
  await next();
});

// ============================================
// SHARED UTILITY HELPERS
// ============================================

// NOTE: These helpers are foundational utilities for Phase 2 AI consolidation
// Exported to suppress unused warnings until integration

/**
 * Standardized API response helper
 * @param c - Hono context
 * @param data - Response data (for success) or null (for error)
 * @param error - Error message (optional)
 * @param status - HTTP status code (default: 200 for success, 400 for error)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function apiResponse<T>(
  c: any,
  data: T | null,
  error?: string,
  status?: 200 | 400 | 401 | 403 | 404 | 500
) {
  if (error) {
    return c.json({ success: false, error }, status || 400);
  }
  return c.json({ success: true, data }, status || 200);
}

/**
 * Create a configured Gemini AI client
 * @param env - Worker environment with GEMINI_API_KEY
 * @returns GoogleGenAI client or null if not configured
 */
export function createGeminiClient(env: Record<string, unknown>): GoogleGenAI | null {
  const apiKey = env.GEMINI_API_KEY as string | undefined;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Generate a structured JSON response from Gemini
 * @param client - GoogleGenAI client
 * @param prompt - User prompt
 * @param systemPrompt - System instruction (optional)
 * @param maxRetries - Number of retry attempts (default: 2)
 * @returns Parsed JSON response or null on failure
 */
export async function generateStructuredResponse<T>(
  client: GoogleGenAI,
  prompt: string,
  systemPrompt?: string,
  maxRetries: number = 2
): Promise<{ data: T | null; error: string | null }> {
  let lastError: string | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const config: Record<string, unknown> = {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 }
      };
      
      if (systemPrompt) {
        config.systemInstruction = systemPrompt;
      }
      
      const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config
      });
      
      const responseText = response.text || '{}';
      
      try {
        const parsed = JSON.parse(responseText) as T;
        return { data: parsed, error: null };
      } catch {
        lastError = 'Failed to parse AI response';
        console.error(`Gemini parse error (attempt ${attempt}):`, responseText.substring(0, 200));
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'AI generation failed';
      console.error(`Gemini API error (attempt ${attempt}):`, lastError);
    }
    
    // Wait before retry (exponential backoff)
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 500 * attempt));
    }
  }
  
  return { data: null, error: lastError };
}

/**
 * Simple in-memory rate limiter
 * Tracks requests per session token with sliding window
 *
 * NOTE: This rate limiter is per-Worker-isolate. Cloudflare runs many isolates in parallel,
 * so the effective limit per user is declared_limit × number_of_isolates.
 * For production-grade rate limiting, replace with Cloudflare KV or Durable Objects.
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute

export function checkRateLimit(sessionToken: string | undefined): { allowed: boolean; remaining: number; resetIn: number } {
  const key = sessionToken || 'anonymous';
  const now = Date.now();
  
  let record = rateLimitStore.get(key);
  
  // Clean up expired entries periodically
  if (rateLimitStore.size > 1000) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetAt < now) {
        rateLimitStore.delete(k);
      }
    }
  }
  
  if (!record || record.resetAt < now) {
    // New window
    record = { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateLimitStore.set(key, record);
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetIn: RATE_LIMIT_WINDOW_MS };
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetIn: record.resetAt - now };
  }
  
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - record.count, resetIn: record.resetAt - now };
}

/**
 * Input validation for AI endpoints
 * @param text - Input text to validate
 * @param maxLength - Maximum allowed length (default: 25000)
 * @returns Error message or null if valid
 */
export function validateAIInput(text: string | undefined, maxLength: number = 25000): string | null {
  if (!text || typeof text !== 'string') {
    return 'Input text is required';
  }
  if (text.trim().length === 0) {
    return 'Input text cannot be empty';
  }
  if (text.length > maxLength) {
    return `Input text exceeds maximum length of ${maxLength} characters (received ${text.length})`;
  }
  return null;
}

import { getSavingsForLocation } from "@/shared/locationSavings";

// Mount route modules
app.route('/api/analyze/community', analyzeCommunity);
app.route('/api', authRoutes);
app.route('/api', nextdoorAuthRoutes);
app.route('/api', redditAuthRoutes);
app.route('/api', stripeRoutes);
app.route('/api', magicLinkRoutes);
app.route('/api/admin/content', contentDraftsRoutes);
app.route('/api/admin/content', contentSwarmRoutes);
app.route('/api/admin/inbox', inboxRoutes);
app.route('/api/admin/reddit', redditDraftsRoutes);
app.route('/api/admin/nextdoor', nextdoorDraftsRoutes);
app.route('/api/admin/blog', blogPublishRoutes);
app.route('/api/webhooks', inboundEmailRoutes);
app.route('/api/webhooks', facebookWebhookRoutes);
app.route('/api/admin/facebook', facebookPublishRoutes);

// ============================================
// GEOLOCATION ENDPOINT
// ============================================

// Get user's location-based savings message
app.get('/api/geo', async (c) => {
  try {
    // Cloudflare provides geolocation data in request headers
    const cfData = c.req.raw.cf as {
      city?: string;
      region?: string;
      regionCode?: string;
      country?: string;
    } | undefined;
    
    const city = cfData?.city || '';
    const regionCode = cfData?.regionCode || cfData?.region || '';
    
    const savings = getSavingsForLocation(city, regionCode);
    
    return c.json({
      location: savings.location,
      savings: savings.savings,
      detectedCity: city,
      detectedState: regionCode
    });
  } catch (error) {
    console.error('Geo lookup error:', error);
    // Return default on error
    return c.json({
      location: 'your area',
      savings: 1258,
      detectedCity: '',
      detectedState: ''
    });
  }
});

// ============================================
// BLS LABOR RATES API
// ============================================

app.get("/api/bls/wages", async (c) => {
  const apiKey = (c.env as unknown as Record<string, unknown>).BLS_API_KEY as string | undefined;
  const stateCode = c.req.query('state') || 'GA';
  const stateName = getStateName(stateCode);
  
  // Always apply state-specific adjustments
  const stateWages = getStateAdjustedWages(stateCode);
  
  if (!apiKey) {
    return c.json({
      success: true,
      source: 'state-average',
      wages: stateWages,
      stateCode,
      stateName,
      message: `Using estimated ${stateName} area wages based on BLS regional data`,
    });
  }
  
  try {
    const seriesIds = getAllSeriesIds();
    const { url, body } = buildBLSRequestPayload(apiKey, seriesIds);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    });
    
    if (!response.ok) {
      console.error('BLS API error:', response.status, response.statusText);
      return c.json({
        success: true,
        source: 'state-average-fallback',
        wages: stateWages,
        stateCode,
        stateName,
        message: `BLS API error - using ${stateName} estimated wages`,
      });
    }
    
    const data = await response.json();
    
    return c.json({
      success: true,
      source: 'bls-api',
      data,
      stateWages,
      stateCode,
      stateName,
    });
  } catch (error) {
    console.error('BLS fetch error:', error);
    return c.json({
      success: true,
      source: 'state-average-error',
      wages: stateWages,
      stateCode,
      stateName,
      message: `Error fetching BLS data - using ${stateName} estimated wages`,
    });
  }
});

// ============================================
// LEADS API
// ============================================

app.post("/api/leads", async (c) => {
  try {
    const body = await c.req.json() as LeadRequest;
    const { name, email, timeline } = body;

    if (!name?.trim() || !email?.trim() || !timeline) {
      return c.json({ success: false, error: 'Missing required fields' }, 400);
    }

    const db = c.env.DB;
    await db.prepare(
      'INSERT INTO leads (name, email, timeline, created_at, updated_at) VALUES (?, ?, ?, datetime("now"), datetime("now"))'
    ).bind(name.trim(), email.trim(), timeline).run();

    const resendApiKey = (c.env as unknown as Record<string, unknown>).RESEND_API_KEY as string | undefined;
    
    if (resendApiKey) {
      const timelineLabel = TIMELINE_LABELS[timeline] || timeline;
      
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'RemodelerIQ <onboarding@resend.dev>',
            to: ['gustavo.atar@gmail.com'],
            subject: `New Remodeler IQ Lead: ${name.trim()}`,
            text: `You have a new lead!\n\nName: ${name.trim()}\nEmail: ${email.trim()}\nTimeline: ${timelineLabel}`
          })
        });
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
      }
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error creating lead:', error);
    return c.json({ success: false, error: 'Failed to save lead' }, 500);
  }
});

// ============================================
// FEEDBACK API
// ============================================

app.post("/api/feedback", async (c) => {
  try {
    const body = await c.req.json() as FeedbackRequest;
    const { rating, feedback } = body;

    if (!rating || rating < 1 || rating > 10) {
      return c.json({ success: false, error: 'Invalid rating' }, 400);
    }

    const resendApiKey = (c.env as unknown as Record<string, unknown>).RESEND_API_KEY as string | undefined;
    
    if (resendApiKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'RemodelerIQ <onboarding@resend.dev>',
            to: ['gustavo.atar@gmail.com'],
            subject: `RemodelerIQ Feedback - Rating: ${rating}/10`,
            text: `New feedback received!\n\nRating: ${rating}/10\n\nFeedback:\n${feedback || '(No additional feedback provided)'}`
          })
        });
      } catch (emailError) {
        console.error('Failed to send feedback email:', emailError);
        return c.json({ success: false, error: 'Failed to send feedback' }, 500);
      }
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error processing feedback:', error);
    return c.json({ success: false, error: 'Failed to process feedback' }, 500);
  }
});

// ============================================
// REPORT ISSUE API
// ============================================

interface ReportIssueRequest {
  section: string;
  issue: string;
}

app.post("/api/report-issue", async (c) => {
  try {
    const body = await c.req.json() as ReportIssueRequest;
    const { section, issue } = body;

    if (!section || !issue?.trim()) {
      return c.json({ success: false, error: 'Section and issue description required' }, 400);
    }

    const resendApiKey = (c.env as unknown as Record<string, unknown>).RESEND_API_KEY as string | undefined;
    
    if (resendApiKey) {
      const sectionLabels: Record<string, string> = {
        'bid-analysis': 'Bid Analysis',
        'market-analysis': 'Market Analysis',
        'negotiation-recommendation': 'Negotiation Recommendation'
      };
      const sectionLabel = sectionLabels[section] || section;

      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'RemodelerIQ <onboarding@resend.dev>',
            to: ['gustavo.atar@gmail.com'],
            subject: `RemodelerIQ Issue Report - ${sectionLabel}`,
            text: `Issue Report\n\nSection: ${sectionLabel}\n\nIssue Description:\n${issue}`
          })
        });
      } catch (emailError) {
        console.error('Failed to send issue report email:', emailError);
        return c.json({ success: false, error: 'Failed to send report' }, 500);
      }
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error processing issue report:', error);
    return c.json({ success: false, error: 'Failed to process report' }, 500);
  }
});

// ============================================
// AI-POWERED BID ANALYSIS (GEMINI)
// ============================================

app.post("/api/analyze/ai", async (c) => {
  try {
    const geminiKey = (c.env as unknown as Record<string, unknown>).GEMINI_API_KEY as string | undefined;
    
    if (!geminiKey) {
      return c.json({ 
        success: false, 
        error: 'AI analysis not configured. Please add your Gemini API key.' 
      }, 500);
    }

    const body = await c.req.json() as AIAnalysisRequest;
    const { bidText, bidTotal, stateCode = 'GA', projectCategory, squareFootage } = body;

    if (!bidText?.trim()) {
      return c.json({ success: false, error: 'No bid text provided' }, 400);
    }

    // Fetch benchmark data if we have a project category
    let benchmarkContext = '';
    if (projectCategory) {
      const db = c.env.DB;
      
      // Try state-specific first, then national
      let benchmark = await db.prepare(
        `SELECT * FROM bid_benchmarks WHERE project_type = ? AND state_code = ? AND sample_count >= 3`
      ).bind(projectCategory, stateCode).first<{
        sample_count: number;
        avg_total_amount: number | null;
        median_total_amount: number | null;
        min_total_amount: number | null;
        max_total_amount: number | null;
        avg_price_per_sqft: number | null;
        common_issues: string | null;
      }>();

      if (!benchmark) {
        benchmark = await db.prepare(
          `SELECT * FROM bid_benchmarks WHERE project_type = ? AND state_code IS NULL AND sample_count >= 3`
        ).bind(projectCategory).first();
      }

      if (benchmark && benchmark.sample_count >= 3) {
        benchmarkContext = `
MARKET INTELLIGENCE (from ${benchmark.sample_count} similar ${projectCategory} projects${stateCode ? ` in ${stateCode}` : ''}):
- Average project cost: $${benchmark.avg_total_amount?.toLocaleString() || 'N/A'}
- Typical range: $${benchmark.min_total_amount?.toLocaleString() || 'N/A'} - $${benchmark.max_total_amount?.toLocaleString() || 'N/A'}
${benchmark.avg_price_per_sqft ? `- Average price per sq ft: $${benchmark.avg_price_per_sqft}/sf` : ''}
${benchmark.common_issues ? `- Common issues found in similar bids: ${Object.keys(JSON.parse(benchmark.common_issues)).slice(0, 5).join(', ')}` : ''}

Use this data to provide context on whether this bid's pricing is competitive.
`;
      }
    }

    const ai = new GoogleGenAI({ apiKey: geminiKey });

    const systemPrompt = `You are an expert construction contract analyst helping homeowners understand contractor bids. You have deep knowledge of:
- Home renovation/construction contracts and common pitfalls
- State-specific contractor licensing and regulations
- Fair pricing for labor and materials
- Red flags that indicate potential problems
- Negotiation strategies for homeowners
${benchmarkContext ? '\nYou have access to real market data from similar projects to provide accurate pricing comparisons.' : ''}

Analyze the following contractor bid/estimate and provide insights in JSON format.`;

    const userPrompt = `Analyze this contractor bid for a homeowner in ${stateCode}${bidTotal ? ` (Total: $${bidTotal.toLocaleString()})` : ''}${squareFootage ? ` (${squareFootage} sq ft)` : ''}:
${benchmarkContext}

---
${bidText.substring(0, 15000)}
---

Provide your analysis as JSON with this exact structure:
{
  "summary": "2-3 sentence overall assessment",
  "projectType": "Brief description of what this project is (e.g., 'Kitchen remodel', 'Flooring installation')",
  "tradePeople": ["List of trades/specialists involved"],
  "aiInsights": [
    {
      "type": "warning|tip|positive|question",
      "title": "Short title",
      "detail": "Explanation (1-2 sentences)",
      "action": "What the homeowner should do"
    }
  ],
  "missedByRules": [
    "Issues or concerns that require human judgment to catch"
  ],
  "negotiationOpportunities": [
    {
      "area": "What to negotiate",
      "script": "Exact words the homeowner can say to the contractor"
    }
  ],
  "questionsToAsk": [
    "Specific questions the homeowner should ask before signing"
  ],
  "overallRisk": "low|medium|high",
  "confidenceBoost": "Explanation of what's good about this bid (if anything)",
  "priceComparison": {
    "verdict": "below_market|competitive|above_market|unknown",
    "explanation": "How this bid compares to similar projects (if market data available)"
  }
}

IMPORTANT CONSTRAINTS - Keep responses CONCISE:
- aiInsights: Maximum 3 items total. Focus on the MOST important issues.
- missedByRules: Maximum 2 items. Only include if truly different from aiInsights.
- questionsToAsk: Maximum 3 questions. Most critical questions only.
- negotiationOpportunities: Maximum 2 items.

Focus on actionable insights. Be specific to THIS bid, not generic advice. Avoid repeating information - each insight should be unique. If market intelligence data is provided, use it to give accurate price comparisons.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        thinkingConfig: {
          thinkingBudget: 0
        }
      }
    });

    const responseText = response.text;
    
    // Parse the JSON response
    let aiAnalysis;
    try {
      aiAnalysis = JSON.parse(responseText || '{}');
    } catch {
      console.error('Failed to parse Gemini response:', responseText);
      return c.json({ 
        success: false, 
        error: 'Failed to parse AI response' 
      }, 500);
    }

    return c.json({
      success: true,
      analysis: aiAnalysis,
      model: 'gemini-2.5-flash'
    });

  } catch (error) {
    console.error('Gemini API error:', error);
    return c.json({ 
      success: false, 
      error: 'AI analysis failed. Please try again.' 
    }, 500);
  }
});

// ============================================
// BOTTOM LINE SYNTHESIS - Concise bid summary
// ============================================

interface BottomLineSynthesisRequest {
  score: number;
  grade: string;
  gradeLabel: string;
  criticalFlags: Array<{ title: string; description: string }>;
  highFlags: Array<{ title: string; description: string }>;
  priceVerdict?: string;
  pricePercentDiff?: number;
  contractorTrustLevel?: 'high' | 'medium' | 'low' | 'unknown';
  contractorName?: string;
  contractorLicenseNumber?: string | null;
  scopeCompleteness?: number;
  missingCriticalItems?: string[];
  dealRiskLevel?: 'low' | 'medium' | 'high';
  projectType?: string;
  bidTotal?: number;
}

app.post("/api/synthesize-bottom-line", async (c) => {
  try {
    // Rate limiting
    const sessionToken = getCookie(c, SESSION_COOKIE_NAME);
    const rateCheck = checkRateLimit(sessionToken);
    if (!rateCheck.allowed) {
      return c.json({ 
        success: false, 
        error: `Rate limit exceeded. Try again in ${Math.ceil(rateCheck.resetIn / 1000)} seconds.`
      }, 429);
    }
    
    const geminiKey = (c.env as unknown as Record<string, unknown>).GEMINI_API_KEY as string | undefined;
    
    if (!geminiKey) {
      // Return fallback - client will generate locally
      return c.json({ success: false, error: 'AI not configured' }, 200);
    }

    const body = await c.req.json() as BottomLineSynthesisRequest;
    const {
      score,
      grade,
      gradeLabel,
      criticalFlags,
      highFlags,
      priceVerdict,
      pricePercentDiff,
      contractorTrustLevel,
      contractorName,
      contractorLicenseNumber,
      scopeCompleteness,
      missingCriticalItems,
      dealRiskLevel,
      projectType,
      bidTotal
    } = body;

    const ai = new GoogleGenAI({ apiKey: geminiKey });

    // Build context summary for Gemini
    const contextParts: string[] = [];
    
    contextParts.push(`Score: ${score}/100 (Grade: ${grade} - ${gradeLabel})`);
    
    if (projectType) {
      contextParts.push(`Project: ${projectType}`);
    }
    if (bidTotal) {
      contextParts.push(`Bid Total: $${bidTotal.toLocaleString()}`);
    }
    if (priceVerdict) {
      contextParts.push(`Price: ${priceVerdict}${pricePercentDiff ? ` (${pricePercentDiff > 0 ? '+' : ''}${pricePercentDiff}% vs market)` : ''}`);
    }
    if (contractorTrustLevel && contractorTrustLevel !== 'unknown') {
      let contractorInfo = `Contractor Trust: ${contractorTrustLevel}`;
      if (contractorName) contractorInfo += ` (${contractorName})`;
      if (contractorLicenseNumber) contractorInfo += ` - License verified: ${contractorLicenseNumber}`;
      contextParts.push(contractorInfo);
    } else if (contractorLicenseNumber) {
      contextParts.push(`Contractor License: ${contractorLicenseNumber} (verified)`);
    }
    if (scopeCompleteness !== undefined) {
      contextParts.push(`Scope Completeness: ${scopeCompleteness}%`);
    }
    if (dealRiskLevel) {
      contextParts.push(`Deal Risk: ${dealRiskLevel}`);
    }
    if (criticalFlags.length > 0) {
      contextParts.push(`Critical Issues: ${criticalFlags.map(f => f.title).join(', ')}`);
    }
    if (highFlags.length > 0) {
      contextParts.push(`High Concerns: ${highFlags.map(f => f.title).join(', ')}`);
    }
    if (missingCriticalItems && missingCriticalItems.length > 0) {
      contextParts.push(`Missing Items: ${missingCriticalItems.slice(0, 3).join(', ')}`);
    }

    const prompt = `You are helping a homeowner understand a contractor bid analysis. Given this summary:

${contextParts.join('\n')}

Provide a CONCISE bottom-line synthesis in JSON format:

{
  "verdict": "One sentence summary of whether to proceed (max 15 words)",
  "keyInsight": "The single most important thing they should know (max 25 words)", 
  "yourMove": "The one action they should take next (max 20 words)",
  "confidence": "high|medium|low"
}

Rules:
- Be direct and actionable, not generic
- If score >= 70 and no critical issues: be encouraging but mention any concerns
- If score 55-69: acknowledge potential but highlight what needs attention
- If score < 55: be honest about concerns without being alarming
- Never start with "Based on the analysis" or similar
- Use plain language a homeowner would understand`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    const responseText = response.text;
    
    let synthesis;
    try {
      synthesis = JSON.parse(responseText || '{}');
    } catch {
      return c.json({ success: false, error: 'Failed to parse synthesis' }, 200);
    }

    return c.json({
      success: true,
      synthesis
    });

  } catch (error) {
    console.error('Bottom line synthesis error:', error);
    return c.json({ success: false, error: 'Synthesis failed' }, 200);
  }
});

// ============================================
// PRICE INTELLIGENCE - AI-powered price analysis narratives
// ============================================

app.post("/api/price-intelligence", async (c) => {
  try {
    // Rate limiting
    const sessionToken = getCookie(c, SESSION_COOKIE_NAME);
    const rateCheck = checkRateLimit(sessionToken);
    if (!rateCheck.allowed) {
      return c.json({ 
        success: false, 
        error: `Rate limit exceeded. Try again in ${Math.ceil(rateCheck.resetIn / 1000)} seconds.`
      }, 429);
    }
    
    const geminiKey = (c.env as unknown as Record<string, unknown>).GEMINI_API_KEY as string | undefined;
    const body = await c.req.json() as PriceIntelligenceInput;

    // Input validation
    const inputError = validateAIInput(body.bidText, 15000);
    if (inputError) {
      return c.json({ success: false, error: inputError }, 400);
    }
    
    // Validate required fields
    if (!body.bidTotal || body.bidTotal <= 0) {
      return c.json({ 
        success: false, 
        error: 'Invalid bid total' 
      }, 400);
    }

    if (!body.projectType) {
      return c.json({ 
        success: false, 
        error: 'Project type required' 
      }, 400);
    }

    // If no Gemini key, return fallback result
    if (!geminiKey) {
      const fallback = generateFallbackResult(body);
      return c.json({
        success: true,
        result: fallback,
        source: 'fallback'
      });
    }

    // Build the prompt from input data
    const prompt = buildPriceIntelligencePrompt(body);

    const ai = new GoogleGenAI({ apiKey: geminiKey });

    // Call Gemini with retry logic
    let responseText = '';
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            thinkingConfig: { thinkingBudget: 0 }
          }
        });
        responseText = response.text || '';
        break;
      } catch (err) {
        console.error(`Price intelligence attempt ${attempts} failed:`, err);
        if (attempts >= maxAttempts) {
          // Return fallback on all retries exhausted
          const fallback = generateFallbackResult(body);
          return c.json({
            success: true,
            result: fallback,
            source: 'fallback'
          });
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Parse the response
    let result: PriceIntelligenceResult;
    try {
      const parsed = JSON.parse(responseText);
      result = {
        priceSummary: parsed.priceSummary || '',
        primaryDrivers: parsed.primaryDrivers || [],
        regionalContext: parsed.regionalContext || '',
        materialFlags: parsed.materialFlags || [],
        negotiationHooks: parsed.negotiationHooks || [],
        confidence: parsed.confidence || 'medium',
        generatedAt: new Date().toISOString(),
      };
    } catch {
      console.error('Failed to parse price intelligence response:', responseText);
      const fallback = generateFallbackResult(body);
      return c.json({
        success: true,
        result: fallback,
        source: 'fallback'
      });
    }

    return c.json({
      success: true,
      result,
      source: 'gemini'
    });

  } catch (error) {
    console.error('Price intelligence error:', error);
    return c.json({ 
      success: false, 
      error: 'Price intelligence analysis failed' 
    }, 500);
  }
});

// ============================================
// CHANGE ORDER PREDICTOR - AI-powered change order risk detection
// ============================================

import {
  detectChangeOrderRisks,
  getProjectChangeOrderRisks,
  calculateChangeOrderScore,
  type RiskLevel
} from "@/shared/changeOrderPatterns";

interface ChangeOrderPrediction {
  item: string;
  bidExcerpt: string;
  riskLevel: RiskLevel;
  category: string;
  typicalOverrunPercent: { min: number; max: number };
  explanation: string;
  questionToAsk: string;
  estimatedCostImpact?: string;
}

interface ChangeOrderPredictionResult {
  predictions: ChangeOrderPrediction[];
  projectSpecificRisks: Array<{
    item: string;
    frequency: string;
    typicalCost: string;
    detected: boolean;
    preventionQuestion: string;
  }>;
  summary: {
    riskScore: number;
    riskGrade: string;
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
    estimatedOverrunMin: number;
    estimatedOverrunMax: number;
    totalPotentialOverrun: string;
  };
  aiEnhanced: boolean;
}

app.post("/api/change-order-prediction", async (c) => {
  try {
    // Rate limiting
    const sessionToken = getCookie(c, SESSION_COOKIE_NAME);
    const rateCheck = checkRateLimit(sessionToken);
    if (!rateCheck.allowed) {
      return c.json({ 
        success: false, 
        error: `Rate limit exceeded. Try again in ${Math.ceil(rateCheck.resetIn / 1000)} seconds.`
      }, 429);
    }

    const body = await c.req.json() as {
      bidText: string;
      bidTotal?: number;
      projectType?: string;
    };

    // Input validation
    const inputError = validateAIInput(body.bidText, 20000);
    if (inputError) {
      return c.json({ success: false, error: inputError }, 400);
    }

    const { bidText, bidTotal, projectType } = body;

    // Step 1: Pattern-based detection (fast, no AI needed)
    const patternResults = detectChangeOrderRisks(bidText);
    const scoreResult = calculateChangeOrderScore(bidText);
    
    // Step 2: Get project-specific common change orders
    const projectRisks = projectType ? getProjectChangeOrderRisks(projectType) : null;
    
    // Build predictions from pattern matches
    const predictions: ChangeOrderPrediction[] = patternResults.patterns.map(match => ({
      item: match.pattern.title,
      bidExcerpt: match.lineContext,
      riskLevel: match.pattern.riskLevel,
      category: match.pattern.category,
      typicalOverrunPercent: match.pattern.typicalOverrun,
      explanation: match.pattern.description,
      questionToAsk: match.pattern.questionToAsk,
      estimatedCostImpact: bidTotal 
        ? `$${Math.round(bidTotal * match.pattern.typicalOverrun.min / 100).toLocaleString()} - $${Math.round(bidTotal * match.pattern.typicalOverrun.max / 100).toLocaleString()}`
        : undefined
    }));

    // Check which project-specific risks are present in the bid
    const projectSpecificRisks = projectRisks?.commonChangeOrders.map(co => {
      const detected = co.triggerPhrases.some(phrase => 
        bidText.toLowerCase().includes(phrase.toLowerCase())
      );
      return {
        item: co.item,
        frequency: co.frequency,
        typicalCost: co.typicalCost,
        detected,
        preventionQuestion: co.preventionQuestion
      };
    }) || [];

    // Calculate total potential overrun
    let totalOverrunMin = patternResults.summary.estimatedOverrunMin;
    let totalOverrunMax = patternResults.summary.estimatedOverrunMax;
    
    // Add detected project-specific risks to overrun estimate
    for (const risk of projectSpecificRisks) {
      if (risk.detected) {
        // Parse typical cost range and add to estimate
        const costMatch = risk.typicalCost.match(/\$?([\d,]+)[^\d]*([\d,]+)?/);
        if (costMatch && bidTotal) {
          const minCost = parseInt(costMatch[1].replace(/,/g, ''), 10);
          const maxCost = costMatch[2] ? parseInt(costMatch[2].replace(/,/g, ''), 10) : minCost * 1.5;
          totalOverrunMin += Math.round((minCost / bidTotal) * 100);
          totalOverrunMax += Math.round((maxCost / bidTotal) * 100);
        }
      }
    }

    // Cap at reasonable ranges
    totalOverrunMin = Math.min(totalOverrunMin, 100);
    totalOverrunMax = Math.min(totalOverrunMax, 150);

    const result: ChangeOrderPredictionResult = {
      predictions,
      projectSpecificRisks,
      summary: {
        riskScore: scoreResult.score,
        riskGrade: scoreResult.grade,
        highRiskCount: patternResults.summary.highRiskCount,
        mediumRiskCount: patternResults.summary.mediumRiskCount,
        lowRiskCount: patternResults.summary.lowRiskCount,
        estimatedOverrunMin: totalOverrunMin,
        estimatedOverrunMax: totalOverrunMax,
        totalPotentialOverrun: bidTotal 
          ? `$${Math.round(bidTotal * totalOverrunMin / 100).toLocaleString()} - $${Math.round(bidTotal * totalOverrunMax / 100).toLocaleString()}`
          : `${totalOverrunMin}% - ${totalOverrunMax}%`
      },
      aiEnhanced: false
    };

    // Step 3: AI enhancement (optional, for deeper analysis)
    const geminiKey = (c.env as unknown as Record<string, unknown>).GEMINI_API_KEY as string | undefined;
    
    if (geminiKey && predictions.length > 0) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        
        const aiPrompt = `Analyze this contractor bid for change order risks. Focus on identifying vague language, exclusions, and assumptions that commonly lead to cost overruns.

BID TEXT:
${bidText.slice(0, 8000)}

DETECTED PATTERNS:
${predictions.slice(0, 5).map(p => `- ${p.item}: "${p.bidExcerpt}"`).join('\n')}

PROJECT TYPE: ${projectType || 'Unknown'}
BID TOTAL: ${bidTotal ? '$' + bidTotal.toLocaleString() : 'Not specified'}

Provide additional insights in JSON format:
{
  "additionalRisks": [
    {
      "item": "Risk title",
      "excerpt": "Relevant quote from bid",
      "riskLevel": "high|medium|low",
      "explanation": "Why this is a change order risk",
      "questionToAsk": "Question to ask contractor"
    }
  ],
  "overallAssessment": "One sentence summary of change order risk level",
  "topRecommendation": "Most important action to take"
}

Rules:
- Only identify risks NOT already in the DETECTED PATTERNS list
- Focus on industry-specific knowledge about what leads to change orders
- Be specific about the bid language that raises concerns
- Maximum 3 additional risks`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: aiPrompt,
          config: {
            responseMimeType: "application/json",
            thinkingConfig: { thinkingBudget: 0 }
          }
        });

        const aiResult = JSON.parse(response.text || '{}');
        
        if (aiResult.additionalRisks && Array.isArray(aiResult.additionalRisks)) {
          // Add AI-detected risks to predictions
          for (const risk of aiResult.additionalRisks) {
            if (risk.item && risk.explanation) {
              predictions.push({
                item: risk.item,
                bidExcerpt: risk.excerpt || '',
                riskLevel: risk.riskLevel || 'medium',
                category: 'ai-detected',
                typicalOverrunPercent: { min: 10, max: 30 },
                explanation: risk.explanation,
                questionToAsk: risk.questionToAsk || 'Ask the contractor for clarification on this item.'
              });
            }
          }
          result.aiEnhanced = true;
        }

        // Add AI assessment to result
        if (aiResult.overallAssessment) {
          (result as ChangeOrderPredictionResult & { aiAssessment?: string }).aiAssessment = aiResult.overallAssessment;
        }
        if (aiResult.topRecommendation) {
          (result as ChangeOrderPredictionResult & { topRecommendation?: string }).topRecommendation = aiResult.topRecommendation;
        }

      } catch (aiError) {
        console.error('AI enhancement failed:', aiError);
        // Continue without AI enhancement
      }
    }

    return c.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Change order prediction error:', error);
    return c.json({ 
      success: false, 
      error: 'Change order prediction failed' 
    }, 500);
  }
});

// ============================================
// COMPREHENSIVE ANALYSIS - Consolidated AI endpoint
// ============================================

app.post("/api/comprehensive-analysis", async (c) => {
  try {
    // Rate limiting - stricter for this expensive endpoint
    const sessionToken = getCookie(c, SESSION_COOKIE_NAME);
    const rateCheck = checkRateLimit(sessionToken);
    if (!rateCheck.allowed) {
      return c.json({ 
        success: false, 
        error: `Rate limit exceeded. Try again in ${Math.ceil(rateCheck.resetIn / 1000)} seconds.`
      }, 429);
    }
    
    const geminiKey = (c.env as unknown as Record<string, unknown>).GEMINI_API_KEY as string | undefined;
    
    if (!geminiKey) {
      return c.json({ success: false, error: 'AI not configured' }, 200);
    }

    const body = await c.req.json() as ComprehensiveAnalysisInput;
    
    // Input validation
    const inputError = validateAIInput(body.bidText, 25000);
    if (inputError) {
      return c.json({ success: false, error: inputError }, 400);
    }

    const client = createAIClient(geminiKey);
    const result: ComprehensiveAnalysisResult = {
      bottomLine: null,
      priceIntelligence: null,
      talkTrack: null,
      contractorResearch: null,
      errors: []
    };

    // Run AI calls in parallel for efficiency
    const promises: Promise<void>[] = [];

    // Bottom Line Synthesis
    promises.push((async () => {
      try {
        const bottomLineInput: BottomLineInput = {
          score: body.score || 50,
          grade: body.grade || 'C',
          gradeLabel: body.grade === 'A' ? 'Excellent' : body.grade === 'B' ? 'Good' : body.grade === 'C' ? 'Fair' : body.grade === 'D' ? 'Poor' : 'Needs Work',
          criticalFlags: (body.flags || []).filter(f => f.level === 'critical').map(f => ({ title: f.title })),
          highFlags: (body.flags || []).filter(f => f.level === 'high').map(f => ({ title: f.title })),
          priceVerdict: body.priceVerdict,
          pricePercentDiff: body.pricePercentDiff,
          scopeCompleteness: body.scopeCompleteness,
          missingCriticalItems: body.missingItems,
          projectType: body.projectTypeName || body.projectType,
          bidTotal: body.bidTotal
        };
        
        const prompt = buildBottomLinePrompt(bottomLineInput);
        const synthesis = await generateJSON<BottomLineSynthesis>(client, prompt);
        result.bottomLine = synthesis || generateFallbackBottomLine(body.score || 50);
      } catch (err) {
        console.error('Bottom line synthesis failed:', err);
        result.bottomLine = generateFallbackBottomLine(body.score || 50);
        result.errors.push('bottomLine');
      }
    })());

    // Contractor Research (only if contractor name provided)
    if (body.contractorName) {
      promises.push((async () => {
        try {
          const researchInput: ContractorResearchInput = {
            businessName: body.contractorName!,
            city: undefined, // Could be extracted from bid
            state: body.stateCode,
            licenseNumber: body.contractorLicenseNumber
          };
          
          const prompt = buildContractorResearchPrompt(researchInput);
          const research = await generateJSON<AIContractorResearchResult>(client, prompt, { 
            useSearch: true, 
            maxRetries: 3 
          });
          result.contractorResearch = research || generateFallbackContractorResearch();
        } catch (err) {
          console.error('Contractor research failed:', err);
          result.contractorResearch = generateFallbackContractorResearch();
          result.errors.push('contractorResearch');
        }
      })());
    }

    // Wait for all parallel operations
    await Promise.all(promises);

    return c.json({
      success: true,
      result
    });

  } catch (error) {
    console.error('Comprehensive analysis error:', error);
    return c.json({ 
      success: false, 
      error: 'Comprehensive analysis failed' 
    }, 500);
  }
});

// ============================================
// AI-POWERED TALK TRACK GENERATOR
// ============================================

app.post("/api/talktrack/ai", async (c) => {
  try {
    const geminiKey = (c.env as unknown as Record<string, unknown>).GEMINI_API_KEY as string | undefined;
    
    if (!geminiKey) {
      return c.json({ 
        success: false, 
        error: 'AI talk track not configured. Please add your Gemini API key.' 
      }, 500);
    }

    const body = await c.req.json() as TalkTrackRequest;
    const { bidText, bidTotal, contractorName = '[Contractor Name]', flags, missingItems, marketContext, finishLevelData, marketComparison } = body;

    if (!bidText?.trim()) {
      return c.json({ success: false, error: 'No bid text provided' }, 400);
    }

    const ai = new GoogleGenAI({ apiKey: geminiKey });

    const flagsSummary = flags.map(f => `- ${f.title} (${f.level}): ${f.description}`).join('\n');
    const missingSummary = missingItems.length > 0 ? `Missing items: ${missingItems.join(', ')}` : '';
    
    // Build market analysis section
    let marketAnalysisSection = '';
    if (marketContext) {
      marketAnalysisSection += `\nMARKET ANALYSIS:\n${marketContext}\n`;
    }
    
    if (finishLevelData) {
      marketAnalysisSection += '\nFINISH LEVEL PRICING:\n';
      if (finishLevelData.bidPSF) {
        marketAnalysisSection += `- Bid price per sq ft: $${finishLevelData.bidPSF}/sf\n`;
        marketAnalysisSection += `- Pricing tier: ${finishLevelData.appropriateTier} (${finishLevelData.status})\n`;
        if (finishLevelData.percentFromTier) {
          marketAnalysisSection += `- ${finishLevelData.percentFromTier}% ${finishLevelData.status === 'above-market' ? 'above luxury rates' : finishLevelData.status === 'below-market' ? 'below basic rates' : 'from tier'}\n`;
        }
        if (finishLevelData.localBasicPSF && finishLevelData.localGoodPSF && finishLevelData.localLuxuryPSF) {
          marketAnalysisSection += `- Local market rates: Basic $${finishLevelData.localBasicPSF}/sf | Good $${finishLevelData.localGoodPSF}/sf | Luxury $${finishLevelData.localLuxuryPSF}/sf\n`;
        }
      } else {
        marketAnalysisSection += '- Square footage not found in bid (cannot calculate $/sf)\n';
      }
    }
    
    if (marketComparison) {
      marketAnalysisSection += '\nMARKET COMPARISON:\n';
      marketAnalysisSection += `- Bid total: $${marketComparison.bidAmount.toLocaleString()}\n`;
      marketAnalysisSection += `- Market average: $${marketComparison.marketAverage.toLocaleString()}\n`;
      marketAnalysisSection += `- Market range: $${marketComparison.marketLow.toLocaleString()} - $${marketComparison.marketHigh.toLocaleString()}\n`;
      marketAnalysisSection += `- Status: ${marketComparison.percentDifference >= 0 ? '+' : ''}${marketComparison.percentDifference}% vs market average (${marketComparison.status})\n`;
      if (marketComparison.savingsPotential > 0) {
        marketAnalysisSection += `- Potential savings: $${marketComparison.savingsPotential.toLocaleString()}\n`;
      }
    }

    const systemPrompt = `You are a negotiation coach helping homeowners have confident, friendly conversations with contractors. You write conversation scripts that are:
- Natural and conversational (not robotic or aggressive)
- Firm but respectful — the homeowner is prepared, not confrontational
- Specific to the actual bid content (quote exact items, prices, terms when relevant)
- Actionable with clear asks
- Include follow-up responses for common pushback

The homeowner wants a fair deal and a good working relationship. Help them negotiate from a position of knowledge, not hostility.`;

    const userPrompt = `Generate personalized negotiation scripts for this contractor bid.

CONTRACTOR: ${contractorName}
${bidTotal ? `BID TOTAL: $${bidTotal.toLocaleString()}` : ''}
${marketAnalysisSection}
KEY ISSUES FOUND:
${flagsSummary || 'No major issues flagged'}

${missingSummary}

BID CONTENT (reference specific items, prices, language when writing scripts):
---
${bidText.substring(0, 12000)}
---

Create a JSON response with this structure:
{
  "openingLine": "A warm, confident opening line to start the conversation",
  "sections": [
    {
      "id": "unique-id",
      "title": "Section Title (e.g., 'Payment Terms', 'Materials & Brands')",
      "priority": "high|medium|low",
      "icon": "dollar|shield|file|clock|alert|sparkles",
      "scripts": [
        {
          "id": "script-id",
          "opener": "The initial question or statement (conversational, friendly)",
          "body": "The core ask or concern, with specifics from the bid",
          "followUp": "What to say if they push back or seem hesitant",
          "tip": "Brief coaching note for the homeowner"
        }
      ]
    }
  ],
  "closingLine": "A strong, friendly way to wrap up the conversation",
  "powerMoves": [
    "Brief negotiation tactics specific to this bid"
  ]
}

IMPORTANT:
- Reference SPECIFIC items, prices, or language from the bid when relevant
- Generate 3-6 sections based on what actually needs to be discussed
- Each section should have 1-3 scripts
- Make the tone friendly but prepared — like a savvy homeowner, not a lawyer
- Include specific dollar amounts or percentages when relevant to the negotiation
- If MARKET ANALYSIS data is provided, create a dedicated section for "Market Pricing Discussion" that helps the homeowner leverage this data in their negotiation
- Use the finish level pricing data ($/sf comparisons) and market comparison data (total vs market average) to create specific, data-backed negotiation scripts
- If the bid is above market, include scripts about getting to market average; if below, include scripts about verifying quality and completeness`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        thinkingConfig: {
          thinkingBudget: 0
        }
      }
    });

    const responseText = response.text;
    
    let talkTrack;
    try {
      talkTrack = JSON.parse(responseText || '{}');
    } catch {
      console.error('Failed to parse Gemini response:', responseText);
      return c.json({ 
        success: false, 
        error: 'Failed to parse AI response' 
      }, 500);
    }

    return c.json({
      success: true,
      talkTrack,
      model: 'gemini-2.5-flash'
    });

  } catch (error) {
    console.error('Gemini API error:', error);
    return c.json({ 
      success: false, 
      error: 'AI talk track generation failed. Please try again.' 
    }, 500);
  }
});

// TODO: Comprehensive analysis endpoint temporarily disabled - needs type fixes
// See docs/todo.md #101 for details


// ============================================
// USAGE TRACKING
// ============================================

// Track user actions (uploads, analyses, etc.)
app.post("/api/usage/track", async (c) => {
  try {
    const sessionToken = getCookie(c, SESSION_COOKIE_NAME);
    let userId: number | null = null;

    // Get user ID if authenticated
    if (sessionToken) {
      const db = c.env.DB;
      const session = await db.prepare(
        'SELECT user_id FROM user_sessions WHERE session_token = ? AND expires_at > datetime("now")'
      ).bind(sessionToken).first<{ user_id: number }>();
      
      if (session) {
        userId = session.user_id;
      }
    }

    const body = await c.req.json() as { action: string; metadata?: Record<string, unknown> };
    const { action, metadata } = body;

    if (!action) {
      return c.json({ error: 'Action type required' }, 400);
    }

    const db = c.env.DB;
    await db.prepare(
      'INSERT INTO usage_tracking (user_id, action_type, metadata, created_at) VALUES (?, ?, ?, datetime("now"))'
    ).bind(
      userId,
      action,
      metadata ? JSON.stringify(metadata) : null
    ).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Usage tracking error:', error);
    return c.json({ success: false }, 500);
  }
});

// Get usage stats for current user (authenticated only)
app.get("/api/usage/stats", authMiddleware, async (c) => {
  const user = c.get("user");
  const db = c.env.DB;

  try {
    // Get upload count this week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const uploadsThisWeek = await db.prepare(
      `SELECT COUNT(*) as count FROM usage_tracking 
       WHERE user_id = ? AND action_type = 'upload' AND created_at >= ?`
    ).bind(user.id, weekStart.toISOString()).first<{ count: number }>();

    // Get total uploads
    const totalUploads = await db.prepare(
      `SELECT COUNT(*) as count FROM usage_tracking 
       WHERE user_id = ? AND action_type = 'upload'`
    ).bind(user.id).first<{ count: number }>();

    return c.json({
      uploadsThisWeek: uploadsThisWeek?.count || 0,
      totalUploads: totalUploads?.count || 0,
    });
  } catch (error) {
    console.error('Usage stats error:', error);
    return c.json({ error: 'Failed to fetch usage stats' }, 500);
  }
});

// Check if user can upload (server-side limit check)
// Phase 7H: simplified to "3 free total" regardless of account state.
// Guests counted by IP; logged-in users counted by user_id.
const FREE_TOTAL_ANALYSES = 3;

// Best-effort caller IP for guest counting. Falls back to a stable hash of UA + ASN if header missing.
function getCallerIp(c: { req: { header: (name: string) => string | undefined } }): string {
  return c.req.header('cf-connecting-ip') ||
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
    c.req.header('x-real-ip') ||
    'unknown';
}

app.get("/api/usage/can-upload", async (c) => {
  try {
    const sessionToken = getCookie(c, SESSION_COOKIE_NAME);
    const db = c.env.DB;

    // ----- Logged-in branch -----
    if (sessionToken) {
      const session = await db.prepare(
        'SELECT user_id FROM user_sessions WHERE session_token = ? AND expires_at > datetime("now")'
      ).bind(sessionToken).first<{ user_id: number }>();

      if (session) {
        const user = await db.prepare(
          'SELECT id, email, is_premium, subscription_tier, subscription_status FROM user_profiles WHERE id = ?'
        ).bind(session.user_id).first<{ id: number; email: string; is_premium: number; subscription_tier: string | null; subscription_status: string | null }>();

        if (user) {
          const isPremium = user.is_premium === 1 && user.subscription_status === 'active';

          if (isPremium) {
            return c.json({
              canUpload: true,
              remaining: -1,
              isLoggedIn: true,
              isPremium: true,
              totalUploads: null
            });
          }

          const uploadCount = await db.prepare(
            `SELECT COUNT(*) as count FROM usage_tracking
             WHERE user_id = ? AND action_type = 'upload'`
          ).bind(user.id).first<{ count: number }>();

          const count = uploadCount?.count || 0;
          const remaining = Math.max(0, FREE_TOTAL_ANALYSES - count);

          return c.json({
            canUpload: remaining > 0,
            remaining,
            isLoggedIn: true,
            isPremium: false,
            totalUploads: count
          });
        }
      }
      // session token present but invalid — fall through to guest branch
    }

    // ----- Guest branch (Phase 7H: 3 free analyses by IP) -----
    const ip = getCallerIp(c);
    const guestCount = await db.prepare(
      `SELECT COUNT(*) as count FROM usage_tracking
       WHERE user_id IS NULL AND action_type = 'upload' AND ip_address = ?`
    ).bind(ip).first<{ count: number }>();
    const gCount = guestCount?.count || 0;
    const gRemaining = Math.max(0, FREE_TOTAL_ANALYSES - gCount);

    return c.json({
      canUpload: gRemaining > 0,
      remaining: gRemaining,
      isLoggedIn: false,
      isPremium: false,
      totalUploads: gCount
    });
  } catch (error) {
    console.error('Can upload check error:', error);
    return c.json({ error: 'Failed to check upload limit' }, 500);
  }
});

// Record an upload and return updated limit status
// Phase 7H: guests gated by IP for "3 free total", logged-in by user_id.
app.post("/api/usage/record-upload", async (c) => {
  try {
    const sessionToken = getCookie(c, SESSION_COOKIE_NAME);
    const db = c.env.DB;
    const body = await c.req.json() as { fileName?: string; metadata?: Record<string, unknown> };
    const ip = getCallerIp(c);

    let userId: number | null = null;
    let isPremium = false;

    if (sessionToken) {
      const session = await db.prepare(
        'SELECT user_id FROM user_sessions WHERE session_token = ? AND expires_at > datetime("now")'
      ).bind(sessionToken).first<{ user_id: number }>();

      if (session) {
        userId = session.user_id;

        const user = await db.prepare(
          'SELECT is_premium, subscription_tier, subscription_status FROM user_profiles WHERE id = ?'
        ).bind(userId).first<{ is_premium: number; subscription_tier: string | null; subscription_status: string | null }>();

        isPremium = user?.is_premium === 1 && user?.subscription_status === 'active';

        // Atomic gatekeeper for logged-in free users
        if (!isPremium) {
          const uploadCount = await db.prepare(
            `SELECT COUNT(*) as count FROM usage_tracking WHERE user_id = ? AND action_type = 'upload'`
          ).bind(userId).first<{ count: number }>();
          const count = uploadCount?.count || 0;
          if (count >= FREE_TOTAL_ANALYSES) {
            return c.json({ error: "Free analysis limit reached", limitReached: true }, 429);
          }
        }
      }
    }

    // Guest gatekeeper: 3 free per IP
    if (!userId) {
      const guestCount = await db.prepare(
        `SELECT COUNT(*) as count FROM usage_tracking
         WHERE user_id IS NULL AND action_type = 'upload' AND ip_address = ?`
      ).bind(ip).first<{ count: number }>();
      const count = guestCount?.count || 0;
      if (count >= FREE_TOTAL_ANALYSES) {
        return c.json({ error: "Free analysis limit reached", limitReached: true }, 429);
      }
    }

    // Record the upload (ip_address stored for guests so we can rate-limit them)
    await db.prepare(
      'INSERT INTO usage_tracking (user_id, action_type, metadata, ip_address, created_at) VALUES (?, ?, ?, ?, datetime("now"))'
    ).bind(
      userId,
      'upload',
      JSON.stringify({
        fileName: body.fileName,
        isPremium,
        isLoggedIn: userId !== null,
        ...body.metadata
      }),
      userId === null ? ip : null  // only store IP for guests
    ).run();

    // Compute remaining for response
    if (isPremium) {
      return c.json({
        success: true,
        isLoggedIn: true,
        isPremium: true,
        canUploadMore: true,
        remaining: -1
      });
    }

    if (userId) {
      const uploadCount = await db.prepare(
        `SELECT COUNT(*) as count FROM usage_tracking
         WHERE user_id = ? AND action_type = 'upload'`
      ).bind(userId).first<{ count: number }>();
      const count = uploadCount?.count || 0;
      const remaining = Math.max(0, FREE_TOTAL_ANALYSES - count);
      return c.json({
        success: true,
        isLoggedIn: true,
        isPremium: false,
        canUploadMore: remaining > 0,
        remaining,
        totalUploads: count
      });
    }

    // Guest: compute remaining by IP
    const guestPost = await db.prepare(
      `SELECT COUNT(*) as count FROM usage_tracking
       WHERE user_id IS NULL AND action_type = 'upload' AND ip_address = ?`
    ).bind(ip).first<{ count: number }>();
    const gCount = guestPost?.count || 0;
    const gRemaining = Math.max(0, FREE_TOTAL_ANALYSES - gCount);
    return c.json({
      success: true,
      isLoggedIn: false,
      isPremium: false,
      canUploadMore: gRemaining > 0,
      remaining: gRemaining,
      totalUploads: gCount
    });
  } catch (error) {
    console.error('Record upload error:', error);
    return c.json({ error: 'Failed to record upload' }, 500);
  }
});

// Track login events
app.post("/api/usage/track-login", async (c) => {
  try {
    const body = await c.req.json() as { 
      email?: string; 
      userId?: number;
      method: 'google' | 'magic_link';
      metadata?: Record<string, unknown>;
    };
    
    const db = c.env.DB;

    await db.prepare(
      'INSERT INTO usage_tracking (user_id, action_type, metadata, created_at) VALUES (?, ?, ?, datetime("now"))'
    ).bind(
      body.userId || null,
      'login',
      JSON.stringify({ 
        email: body.email,
        method: body.method,
        ...body.metadata
      })
    ).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Track login error:', error);
    return c.json({ success: false }, 500);
  }
});

// ============================================
// ADMIN STATS ENDPOINT
// ============================================

function isAdminEmail(email: string, env: unknown): boolean {
  const adminList = ((env as Record<string, unknown>).ADMIN_EMAILS as string | undefined || 'gustavo.atar@gmail.com,gustavo@remodeleriq.com')
    .split(',')
    .map((e: string) => e.trim().toLowerCase());
  return adminList.includes(email.toLowerCase());
}

app.get("/api/admin/stats", async (c) => {
  try {
    const sessionToken = getCookie(c, SESSION_COOKIE_NAME);
    const db = c.env.DB;

    if (!sessionToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get user from session
    const session = await db.prepare(
      'SELECT user_id FROM user_sessions WHERE session_token = ? AND expires_at > datetime("now")'
    ).bind(sessionToken).first<{ user_id: number }>();

    if (!session) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const user = await db.prepare(
      'SELECT email FROM user_profiles WHERE id = ?'
    ).bind(session.user_id).first<{ email: string }>();

    if (!user || !isAdminEmail(user.email, c.env)) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    // Get overall stats
    const totalUsers = await db.prepare(
      'SELECT COUNT(*) as count FROM user_profiles'
    ).first<{ count: number }>();

    const premiumUsers = await db.prepare(
      "SELECT COUNT(*) as count FROM user_profiles WHERE is_premium = 1 AND subscription_status = 'active'"
    ).first<{ count: number }>();

    const totalUploads = await db.prepare(
      `SELECT COUNT(*) as count FROM usage_tracking WHERE action_type = 'upload'`
    ).first<{ count: number }>();

    const totalLogins = await db.prepare(
      `SELECT COUNT(*) as count FROM usage_tracking WHERE action_type = 'login'`
    ).first<{ count: number }>();

    // Get uploads by day (last 30 days)
    const uploadsByDay = await db.prepare(
      `SELECT date(created_at) as date, COUNT(*) as count 
       FROM usage_tracking 
       WHERE action_type = 'upload' AND created_at >= datetime('now', '-30 days')
       GROUP BY date(created_at) 
       ORDER BY date DESC`
    ).all<{ date: string; count: number }>();

    // Get logins by day (last 30 days)
    const loginsByDay = await db.prepare(
      `SELECT date(created_at) as date, COUNT(*) as count 
       FROM usage_tracking 
       WHERE action_type = 'login' AND created_at >= datetime('now', '-30 days')
       GROUP BY date(created_at) 
       ORDER BY date DESC`
    ).all<{ date: string; count: number }>();

    // Get recent activity (last 50 events)
    const recentActivity = await db.prepare(
      `SELECT ut.id, ut.user_id, ut.action_type, ut.metadata, ut.created_at, up.email, up.name
       FROM usage_tracking ut
       LEFT JOIN user_profiles up ON ut.user_id = up.id
       ORDER BY ut.created_at DESC
       LIMIT 50`
    ).all<{ id: number; user_id: number | null; action_type: string; metadata: string | null; created_at: string; email: string | null; name: string | null }>();

    // Get top users by uploads
    const topUsers = await db.prepare(
      `SELECT up.email, up.name, up.is_premium, up.subscription_tier, COUNT(ut.id) as upload_count
       FROM user_profiles up
       LEFT JOIN usage_tracking ut ON up.id = ut.user_id AND ut.action_type = 'upload'
       GROUP BY up.id
       ORDER BY upload_count DESC
       LIMIT 20`
    ).all<{ email: string; name: string | null; is_premium: number; subscription_tier: string | null; upload_count: number }>();

    // Get new users (last 30 days)
    const newUsers = await db.prepare(
      `SELECT id, email, name, is_premium, subscription_tier, created_at
       FROM user_profiles 
       WHERE created_at >= datetime('now', '-30 days')
       ORDER BY created_at DESC`
    ).all<{ id: number; email: string; name: string | null; is_premium: number; subscription_tier: string | null; created_at: string }>();

    return c.json({
      summary: {
        totalUsers: totalUsers?.count || 0,
        premiumUsers: premiumUsers?.count || 0,
        totalUploads: totalUploads?.count || 0,
        totalLogins: totalLogins?.count || 0,
      },
      uploadsByDay: uploadsByDay?.results || [],
      loginsByDay: loginsByDay?.results || [],
      recentActivity: recentActivity?.results || [],
      topUsers: topUsers?.results || [],
      newUsers: newUsers?.results || [],
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return c.json({ error: 'Failed to fetch admin stats' }, 500);
  }
});

// Export users with last login for marketing
app.get("/api/admin/export/users", async (c) => {
  try {
    const sessionToken = getCookie(c, SESSION_COOKIE_NAME);
    const db = c.env.DB;

    if (!sessionToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const session = await db.prepare(
      'SELECT user_id FROM user_sessions WHERE session_token = ? AND expires_at > datetime("now")'
    ).bind(sessionToken).first<{ user_id: number }>();

    if (!session) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const user = await db.prepare(
      'SELECT email FROM user_profiles WHERE id = ?'
    ).bind(session.user_id).first<{ email: string }>();

    if (!user || !isAdminEmail(user.email, c.env)) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    // Get all users with their last login
    const users = await db.prepare(
      `SELECT 
        up.id,
        up.email,
        up.name,
        up.is_premium,
        up.subscription_tier,
        up.created_at as signup_date,
        (
          SELECT MAX(ut.created_at) 
          FROM usage_tracking ut 
          WHERE ut.user_id = up.id AND ut.action_type = 'login'
        ) as last_login
       FROM user_profiles up
       ORDER BY up.created_at DESC`
    ).all<{ 
      id: number; 
      email: string; 
      name: string | null; 
      is_premium: number;
      subscription_tier: string | null;
      signup_date: string;
      last_login: string | null;
    }>();

    // Build CSV
    const rows = users?.results || [];
    const csvHeader = 'Email,Name,Subscription,Signup Date,Last Login';
    const csvRows = rows.map(row => {
      const subscription = row.subscription_tier || (row.is_premium ? 'Legacy Premium' : 'Free');
      const name = (row.name || '').replace(/,/g, ' ');
      const signupDate = row.signup_date ? new Date(row.signup_date).toLocaleDateString() : '';
      const lastLogin = row.last_login ? new Date(row.last_login).toLocaleDateString() : 'Never';
      return `${row.email},${name},${subscription},${signupDate},${lastLogin}`;
    });
    
    const csv = [csvHeader, ...csvRows].join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="remodeleriq-users-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export users error:', error);
    return c.json({ error: 'Failed to export users' }, 500);
  }
});

// ============================================
// ERROR LOGGING ENDPOINTS
// ============================================

interface ErrorLogRequest {
  errorType: string;
  errorMessage: string;
  errorStack?: string;
  url?: string;
  metadata?: Record<string, unknown>;
}

// Public endpoint to log errors from frontend
app.post("/api/errors/log", async (c) => {
  try {
    const db = c.env.DB;
    const body = await c.req.json() as ErrorLogRequest;
    const { errorType, errorMessage, errorStack, url, metadata } = body;

    if (!errorType || !errorMessage) {
      return c.json({ error: 'errorType and errorMessage required' }, 400);
    }

    // Get user info if available
    const sessionToken = getCookie(c, SESSION_COOKIE_NAME);
    let userId: string | null = null;
    
    if (sessionToken) {
      const session = await db.prepare(
        'SELECT user_id FROM user_sessions WHERE session_token = ? AND expires_at > datetime("now")'
      ).bind(sessionToken).first<{ user_id: number }>();
      if (session) {
        userId = String(session.user_id);
      }
    }

    const userAgent = c.req.header('user-agent') || null;

    await db.prepare(
      `INSERT INTO error_logs (error_type, error_message, error_stack, url, user_agent, user_id, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      errorType.slice(0, 100),
      errorMessage.slice(0, 2000),
      errorStack?.slice(0, 5000) || null,
      url?.slice(0, 500) || null,
      userAgent?.slice(0, 500) || null,
      userId,
      metadata ? JSON.stringify(metadata) : null
    ).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error logging error:', error);
    // Don't fail loudly - this is a logging endpoint
    return c.json({ success: false }, 500);
  }
});

// Admin endpoint to view recent errors
app.get("/api/admin/errors", async (c) => {
  try {
    const sessionToken = getCookie(c, SESSION_COOKIE_NAME);
    const db = c.env.DB;

    if (!sessionToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const session = await db.prepare(
      'SELECT user_id FROM user_sessions WHERE session_token = ? AND expires_at > datetime("now")'
    ).bind(sessionToken).first<{ user_id: number }>();

    if (!session) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const user = await db.prepare(
      'SELECT email FROM user_profiles WHERE id = ?'
    ).bind(session.user_id).first<{ email: string }>();

    if (!user || !isAdminEmail(user.email, c.env)) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    // Get recent errors (last 7 days)
    const recentErrors = await db.prepare(
      `SELECT id, error_type, error_message, error_stack, url, user_agent, user_id, metadata, created_at
       FROM error_logs 
       WHERE created_at >= datetime('now', '-7 days')
       ORDER BY created_at DESC
       LIMIT 100`
    ).all();

    // Get error counts by type
    const errorCounts = await db.prepare(
      `SELECT error_type, COUNT(*) as count 
       FROM error_logs 
       WHERE created_at >= datetime('now', '-7 days')
       GROUP BY error_type 
       ORDER BY count DESC`
    ).all();

    // Get error counts by day
    const errorsByDay = await db.prepare(
      `SELECT date(created_at) as date, COUNT(*) as count 
       FROM error_logs 
       WHERE created_at >= datetime('now', '-7 days')
       GROUP BY date(created_at) 
       ORDER BY date DESC`
    ).all();

    return c.json({
      recentErrors: recentErrors?.results || [],
      errorCounts: errorCounts?.results || [],
      errorsByDay: errorsByDay?.results || [],
    });
  } catch (error) {
    console.error('Admin errors fetch error:', error);
    return c.json({ error: 'Failed to fetch errors' }, 500);
  }
});

// VISION-BASED PDF/IMAGE EXTRACTION (GEMINI)
// ============================================

interface VisionExtractRequest {
  images: Array<{
    data: string; // base64
    mimeType: string;
  }>;
}

app.post("/api/extract/vision", async (c) => {
  try {
    const geminiKey = (c.env as unknown as Record<string, unknown>).GEMINI_API_KEY as string | undefined;
    
    if (!geminiKey) {
      return c.json({ 
        success: false, 
        error: 'Vision extraction not configured. Please add your Gemini API key.' 
      }, 500);
    }

    const body = await c.req.json() as VisionExtractRequest;
    const { images } = body;

    if (!images || images.length === 0) {
      return c.json({ success: false, error: 'No images provided' }, 400);
    }

    // Limit to 10 pages to avoid token limits
    const pagesToProcess = images.slice(0, 10);
    
    const ai = new GoogleGenAI({ apiKey: geminiKey });

    const systemPrompt = `You are a document text extraction specialist. Your job is to extract ALL text from contractor bid documents, invoices, and estimates.

Rules:
- Extract EVERY piece of text you can see, preserving the structure
- Include headers, line items, totals, terms, dates, addresses, phone numbers
- Preserve table structures using clear formatting
- Include any handwritten notes if legible
- Separate pages with "--- Page X ---" markers
- Do NOT summarize or interpret - just extract the raw text exactly as it appears

For estimates and invoices, make sure to extract ALL dollar amounts clearly.`;

    // Build content array with all page images
    const contents: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
      { text: `Extract all text from these ${pagesToProcess.length} page(s) of a contractor bid document. Preserve structure and include every detail.` }
    ];

    // Note: media_resolution parameter requires REST API, not available in @google/genai SDK yet
    // Cost optimization achieved via reduced image scale (1.5x instead of 2.0x) on frontend
    for (const image of pagesToProcess) {
      contents.push({
        inlineData: {
          mimeType: image.mimeType,
          data: image.data
        }
      });
    }

    let response;
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: contents,
          config: {
            systemInstruction: systemPrompt,
            maxOutputTokens: 8000,
            thinkingConfig: {
              thinkingBudget: 0
            }
          }
        });
        break; // Success, exit retry loop
      } catch (aiError) {
        console.error(`Gemini API error (attempt ${attempt}/${maxRetries}):`, aiError);
        lastError = aiError instanceof Error ? aiError : new Error('AI service error');
        
        // Retry on transient errors
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 1000 * attempt)); // Exponential backoff
          continue;
        }
        
        const errorMsg = lastError.message;
        return c.json({ 
          success: false, 
          error: `AI service error: ${errorMsg}. Please try again.` 
        }, 500);
      }
    }
    
    if (!response) {
      return c.json({ 
        success: false, 
        error: 'AI service temporarily unavailable. Please try again.' 
      }, 503);
    }

    const extractedText = response.text || '';

    if (!extractedText.trim()) {
      return c.json({ 
        success: false, 
        error: 'Could not extract text from the document. Please ensure the image is clear and readable.' 
      }, 400);
    }

    return c.json({
      success: true,
      text: extractedText,
      pagesProcessed: pagesToProcess.length,
      truncated: images.length > 10
    });

  } catch (error) {
    console.error('Vision extraction error:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to extract text from document. Please try again.' 
    }, 500);
  }
});

// ============================================
// AI TEXT ENHANCEMENT (POST-EXTRACTION CLEANUP)
// ============================================

interface TextEnhanceRequest {
  text: string;
  source: 'text' | 'vision';
}

app.post("/api/extract/enhance", async (c) => {
  try {
    const geminiKey = (c.env as unknown as Record<string, unknown>).GEMINI_API_KEY as string | undefined;
    
    if (!geminiKey) {
      // If no API key, return original text
      const body = await c.req.json() as TextEnhanceRequest;
      return c.json({ 
        success: true, 
        text: body.text,
        enhanced: false
      });
    }

    const body = await c.req.json() as TextEnhanceRequest;
    const { text, source } = body;

    if (!text?.trim()) {
      return c.json({ success: false, error: 'No text provided' }, 400);
    }

    const ai = new GoogleGenAI({ apiKey: geminiKey });

    const systemPrompt = `You are a contractor bid document specialist. Your job is to clean up and structure extracted text from contractor bids, estimates, and invoices.

Your tasks:
1. Fix any OCR errors, garbled text, or misread characters
2. Correct obvious spelling mistakes in common construction terms
3. Properly format dollar amounts (e.g., "$1,500.00" not "S1.500")
4. Structure tables and line items clearly with consistent formatting
5. Separate sections logically (header, line items, terms, totals)
6. Preserve ALL original information - never remove or summarize content
7. Keep page markers if present

Output the cleaned, structured version of the document. Maintain the document's original intent and all details.`;

    const userPrompt = `Clean up and structure this ${source === 'vision' ? 'AI-extracted' : 'PDF-extracted'} contractor bid document text. Fix any errors while preserving all content:

---
${text.substring(0, 25000)}
---

Output the cleaned, well-structured version:`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: 10000,
        thinkingConfig: {
          thinkingBudget: 0
        }
      }
    });

    const enhancedText = response.text || text;

    return c.json({
      success: true,
      text: enhancedText.trim() || text,
      enhanced: true,
      originalLength: text.length,
      enhancedLength: enhancedText.length
    });

  } catch (error) {
    console.error('Text enhancement error:', error);
    // On error, return original text
    try {
      const body = await c.req.json() as TextEnhanceRequest;
      return c.json({ 
        success: true, 
        text: body.text,
        enhanced: false
      });
    } catch {
      return c.json({ 
        success: false, 
        error: 'Enhancement failed' 
      }, 500);
    }
  }
});

// ============================================
// BLS PPI MATERIAL DATA API
// ============================================

// Material series IDs mapping
const PPI_SERIES_MAP: Record<string, string> = {
  'WPU081': 'lumber',
  'WPU137': 'drywall',
  'WPU0621': 'paint',
  'WPU135201': 'tile',
  'WPU1333': 'concrete',
  'WPU102501': 'copper',
  'WPU117': 'electrical'
};

interface BLSPPIResponse {
  status: string;
  responseTime: number;
  message: string[];
  Results?: {
    series: Array<{
      seriesID: string;
      data: Array<{
        year: string;
        period: string;
        periodName: string;
        value: string;
        footnotes: Array<{ code: string; text: string }>;
      }>;
    }>;
  };
}

// Helper function to refresh PPI data (used by both manual and auto-refresh)
async function refreshPPIData(db: D1Database, apiKey: string): Promise<{ success: boolean; insertedCount?: number; error?: string }> {
  const seriesIds = Object.keys(PPI_SERIES_MAP);

  try {
    // Calculate date range: last 12 months
    const endYear = new Date().getFullYear();
    const startYear = endYear - 1;

    const response = await fetch('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seriesid: seriesIds,
        startyear: startYear.toString(),
        endyear: endYear.toString(),
        registrationkey: apiKey
      })
    });

    if (!response.ok) {
      throw new Error(`BLS API returned ${response.status}`);
    }

    const data = await response.json() as BLSPPIResponse;

    if (data.status !== 'REQUEST_SUCCEEDED' || !data.Results?.series) {
      throw new Error(data.message?.join(', ') || 'BLS API request failed');
    }

    // Upsert new data (no DELETE — avoids empty-cache window during refresh)
    let insertedCount = 0;
    for (const series of data.Results.series) {
      const materialKey = PPI_SERIES_MAP[series.seriesID];
      if (!materialKey) continue;

      for (const dataPoint of series.data) {
        // Period is like "M01" for January, "M12" for December
        const month = parseInt(dataPoint.period.replace('M', ''), 10);
        const year = parseInt(dataPoint.year, 10);
        const value = parseFloat(dataPoint.value);

        if (!isNaN(month) && !isNaN(year) && !isNaN(value)) {
          await db.prepare(
            `INSERT OR REPLACE INTO ppi_material_cache 
             (series_id, material_key, year, month, value, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, datetime("now"), datetime("now"))`
          ).bind(series.seriesID, materialKey, year, month, value).run();
          insertedCount++;
        }
      }
    }

    // Log the refresh
    await db.prepare(
      `INSERT INTO ppi_refresh_log (status, message, last_refresh_at, created_at, updated_at) 
       VALUES (?, ?, datetime("now"), datetime("now"), datetime("now"))`
    ).bind('success', `Inserted ${insertedCount} data points`).run();

    return { success: true, insertedCount };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('PPI refresh error:', errorMsg);

    // Log the failure
    await db.prepare(
      `INSERT INTO ppi_refresh_log (status, message, last_refresh_at, created_at, updated_at) 
       VALUES (?, ?, datetime("now"), datetime("now"), datetime("now"))`
    ).bind('error', errorMsg).run();

    return { success: false, error: errorMsg };
  }
}

// Fetch fresh PPI data from BLS and cache it (admin only)
app.post("/api/ppi/refresh", authMiddleware, async (c) => {
  const user = c.get('user');
  if (!isAdminEmail(user.email, c.env)) return c.json({ error: "Forbidden" }, 403);

  const apiKey = (c.env as unknown as Record<string, unknown>).BLS_API_KEY as string | undefined;

  if (!apiKey) {
    return c.json({ success: false, error: 'BLS API key not configured' }, 500);
  }

  const db = c.env.DB;
  const result = await refreshPPIData(db, apiKey);

  if (result.success) {
    return c.json({ 
      success: true, 
      message: `Refreshed PPI data: ${result.insertedCount} data points cached`,
      insertedCount: result.insertedCount
    });
  } else {
    return c.json({ success: false, error: result.error }, 500);
  }
});

// Get cached PPI data (auto-refresh if stale - every 7 days)
app.get("/api/ppi/materials", async (c) => {
  const db = c.env.DB;
  const apiKey = (c.env as unknown as Record<string, unknown>).BLS_API_KEY as string | undefined;

  try {
    // Check when we last refreshed
    const lastRefresh = await db.prepare(
      `SELECT last_refresh_at, status FROM ppi_refresh_log 
       ORDER BY created_at DESC LIMIT 1`
    ).first<{ last_refresh_at: string; status: string }>();

    // Determine if we need to refresh (older than 1 day or never refreshed)
    // BLS data is refreshed daily to ensure material prices stay current
    let needsRefresh = !lastRefresh;
    if (lastRefresh) {
      const lastRefreshDate = new Date(lastRefresh.last_refresh_at);
      const daysSinceRefresh = (Date.now() - lastRefreshDate.getTime()) / (1000 * 60 * 60 * 24);
      needsRefresh = daysSinceRefresh > 1; // Refresh daily instead of weekly
    }

    // Auto-refresh in background if stale and we have an API key
    if (needsRefresh && apiKey) {
      // Fire and forget - don't wait for refresh to complete
      refreshPPIData(db, apiKey).catch(err => console.error('Auto-refresh failed:', err));
    }

    // Get cached data
    const cachedData = await db.prepare(
      `SELECT material_key, year, month, value 
       FROM ppi_material_cache 
       ORDER BY year DESC, month DESC`
    ).all<{ material_key: string; year: number; month: number; value: number }>();

    // If we have cached data, return it
    if (cachedData.results && cachedData.results.length > 0) {
      // Transform into the format the frontend expects
      const materialData = transformCachedData(cachedData.results);

      return c.json({
        success: true,
        source: needsRefresh ? 'cache-stale' : 'cache',
        data: materialData,
        lastRefresh: lastRefresh?.last_refresh_at || null,
        needsRefresh,
        hasApiKey: !!apiKey
      });
    }

    // No cached data - return fallback indicator
    return c.json({
      success: true,
      source: 'fallback',
      data: null,
      lastRefresh: null,
      needsRefresh: true,
      hasApiKey: !!apiKey,
      message: 'No cached data. Click refresh to fetch from BLS.'
    });

  } catch (error) {
    console.error('PPI materials fetch error:', error);
    return c.json({ 
      success: false, 
      source: 'error',
      error: 'Failed to fetch PPI data' 
    }, 500);
  }
});

// Helper function to transform cached DB data into the format MaterialMarketEngine expects
function transformCachedData(
  results: Array<{ material_key: string; year: number; month: number; value: number }>
): Record<string, { current: number; baseline: number; history: number[] }> {
  const materialData: Record<string, { current: number; baseline: number; history: number[] }> = {};

  // Group by material
  const byMaterial: Record<string, Array<{ year: number; month: number; value: number }>> = {};
  for (const row of results) {
    if (!byMaterial[row.material_key]) {
      byMaterial[row.material_key] = [];
    }
    byMaterial[row.material_key].push({ year: row.year, month: row.month, value: row.value });
  }

  // For each material, sort by date and extract last 12 months
  for (const [key, dataPoints] of Object.entries(byMaterial)) {
    // Sort oldest to newest
    dataPoints.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    // Take last 12 data points
    const last12 = dataPoints.slice(-12);
    const history = last12.map(d => d.value);

    // Current is the most recent, baseline is 12 months ago (or first available)
    const current = history.length > 0 ? history[history.length - 1] : 0;
    const baseline = history.length > 0 ? history[0] : 0;

    materialData[key] = { current, baseline, history };
  }

  return materialData;
}

// Get refresh status
app.get("/api/ppi/status", async (c) => {
  const db = c.env.DB;
  const apiKey = (c.env as unknown as Record<string, unknown>).BLS_API_KEY as string | undefined;

  const lastRefresh = await db.prepare(
    `SELECT last_refresh_at, status, message FROM ppi_refresh_log 
     ORDER BY created_at DESC LIMIT 1`
  ).first<{ last_refresh_at: string; status: string; message: string }>();

  const dataCount = await db.prepare(
    'SELECT COUNT(*) as count FROM ppi_material_cache'
  ).first<{ count: number }>();

  return c.json({
    hasApiKey: !!apiKey,
    lastRefresh: lastRefresh?.last_refresh_at || null,
    lastStatus: lastRefresh?.status || null,
    lastMessage: lastRefresh?.message || null,
    cachedDataPoints: dataCount?.count || 0
  });
});

// ============================================
// FRED (Federal Reserve Economic Data) API
// ============================================

// Refresh FRED construction PPI data - caches for inflation adjustment
app.post("/api/fred/refresh", async (c) => {
  const apiKey = (c.env as unknown as Record<string, unknown>).FRED_API_KEY as string | undefined;
  
  if (!apiKey) {
    return c.json({ success: false, error: 'FRED API key not configured. Get one free at https://fred.stlouisfed.org/docs/api/api_key.html' }, 400);
  }

  const db = c.env.DB;

  try {
    // Fetch construction PPI series from FRED
    const observations = await fetchFredSeries(apiKey, FRED_SERIES.CONSTRUCTION_PPI);
    
    if (!observations || observations.length === 0) {
      return c.json({ success: false, error: 'No data returned from FRED API' }, 500);
    }

    // Convert to cache rows
    const cacheRows = observationsToCacheRows(observations, FRED_SERIES.CONSTRUCTION_PPI);

    // Clear old cache and insert new data
    await db.prepare('DELETE FROM fred_cache WHERE series_id = ?').bind(FRED_SERIES.CONSTRUCTION_PPI).run();
    
    let insertedCount = 0;
    for (const row of cacheRows) {
      await db.prepare(
        `INSERT INTO fred_cache (series_id, observation_date, value, created_at, updated_at)
         VALUES (?, ?, ?, datetime('now'), datetime('now'))`
      ).bind(row.series_id, row.observation_date, row.value).run();
      insertedCount++;
    }

    // Log the refresh
    await db.prepare(
      `INSERT INTO fred_refresh_log (series_id, last_refresh_at, status, observation_count, created_at, updated_at)
       VALUES (?, datetime('now'), 'success', ?, datetime('now'), datetime('now'))`
    ).bind(FRED_SERIES.CONSTRUCTION_PPI, insertedCount).run();

    return c.json({ 
      success: true, 
      message: `Refreshed FRED data: ${insertedCount} observations cached`,
      seriesId: FRED_SERIES.CONSTRUCTION_PPI,
      insertedCount,
      latestDate: observations[observations.length - 1]?.date,
      latestValue: observations[observations.length - 1]?.value
    });
  } catch (error) {
    console.error('FRED refresh error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Log the failure
    await db.prepare(
      `INSERT INTO fred_refresh_log (series_id, last_refresh_at, status, message, created_at, updated_at)
       VALUES (?, datetime('now'), 'error', ?, datetime('now'), datetime('now'))`
    ).bind(FRED_SERIES.CONSTRUCTION_PPI, errorMessage).run();

    return c.json({ success: false, error: errorMessage }, 500);
  }
});

// Get current inflation adjustment factor based on cached FRED data
app.get("/api/fred/inflation-factor", async (c) => {
  const db = c.env.DB;
  const apiKey = (c.env as unknown as Record<string, unknown>).FRED_API_KEY as string | undefined;

  try {
    // Check for cached data
    const cachedData = await db.prepare(
      `SELECT observation_date, value FROM fred_cache 
       WHERE series_id = ? 
       ORDER BY observation_date DESC`
    ).bind(FRED_SERIES.CONSTRUCTION_PPI).all<{ observation_date: string; value: number }>();

    // Check last refresh
    const lastRefresh = await db.prepare(
      `SELECT last_refresh_at, status FROM fred_refresh_log 
       WHERE series_id = ?
       ORDER BY created_at DESC LIMIT 1`
    ).bind(FRED_SERIES.CONSTRUCTION_PPI).first<{ last_refresh_at: string; status: string }>();

    // Auto-refresh if stale (>7 days) or no data
    let needsRefresh = !lastRefresh || !cachedData.results || cachedData.results.length === 0;
    if (lastRefresh && !needsRefresh) {
      const lastRefreshDate = new Date(lastRefresh.last_refresh_at);
      const daysSinceRefresh = (Date.now() - lastRefreshDate.getTime()) / (1000 * 60 * 60 * 24);
      needsRefresh = daysSinceRefresh > 7;
    }

    // Background refresh if stale and we have API key
    if (needsRefresh && apiKey) {
      // Fire and forget
      (async () => {
        try {
          const observations = await fetchFredSeries(apiKey, FRED_SERIES.CONSTRUCTION_PPI);
          if (observations && observations.length > 0) {
            const rows = observationsToCacheRows(observations, FRED_SERIES.CONSTRUCTION_PPI);
            await db.prepare('DELETE FROM fred_cache WHERE series_id = ?').bind(FRED_SERIES.CONSTRUCTION_PPI).run();
            for (const row of rows) {
              await db.prepare(
                `INSERT INTO fred_cache (series_id, observation_date, value, created_at, updated_at)
                 VALUES (?, ?, ?, datetime('now'), datetime('now'))`
              ).bind(row.series_id, row.observation_date, row.value).run();
            }
            await db.prepare(
              `INSERT INTO fred_refresh_log (series_id, last_refresh_at, status, observation_count, created_at, updated_at)
               VALUES (?, datetime('now'), 'success', ?, datetime('now'), datetime('now'))`
            ).bind(FRED_SERIES.CONSTRUCTION_PPI, rows.length).run();
          }
        } catch (err) {
          console.error('FRED auto-refresh failed:', err);
        }
      })();
    }

    // Calculate inflation factor from cached data
    if (cachedData.results && cachedData.results.length > 0) {
      const observations = cacheRowsToObservations(cachedData.results);
      const adjustment = calculateInflationFactor(observations, BENCHMARK_BASE_YEAR);

      return c.json({
        success: true,
        source: needsRefresh ? 'cache-stale' : 'cache',
        data: adjustment,
        lastRefresh: lastRefresh?.last_refresh_at || null,
        hasApiKey: !!apiKey
      });
    }

    // No cached data - return neutral factor
    return c.json({
      success: true,
      source: 'fallback',
      data: {
        factor: 1.0,
        percentChange: 0,
        baselineYear: BENCHMARK_BASE_YEAR,
        baselineIndex: 100,
        currentIndex: 100,
        currentDate: new Date().toISOString().split('T')[0],
        description: 'No FRED data available - using neutral adjustment'
      } as InflationAdjustment,
      lastRefresh: null,
      hasApiKey: !!apiKey,
      message: 'No cached data. Configure FRED_API_KEY and refresh to enable inflation adjustment.'
    });

  } catch (error) {
    console.error('FRED inflation factor error:', error);
    return c.json({ 
      success: false, 
      data: {
        factor: 1.0,
        percentChange: 0,
        baselineYear: BENCHMARK_BASE_YEAR,
        baselineIndex: 100,
        currentIndex: 100,
        currentDate: new Date().toISOString().split('T')[0],
        description: 'Error fetching data - using neutral adjustment'
      } as InflationAdjustment,
      error: 'Failed to fetch inflation factor' 
    }, 500);
  }
});

// Get FRED cache status
app.get("/api/fred/status", async (c) => {
  const db = c.env.DB;
  const apiKey = (c.env as unknown as Record<string, unknown>).FRED_API_KEY as string | undefined;

  const lastRefresh = await db.prepare(
    `SELECT last_refresh_at, status, message, observation_count FROM fred_refresh_log 
     WHERE series_id = ?
     ORDER BY created_at DESC LIMIT 1`
  ).bind(FRED_SERIES.CONSTRUCTION_PPI).first<{ last_refresh_at: string; status: string; message: string; observation_count: number }>();

  const dataCount = await db.prepare(
    'SELECT COUNT(*) as count FROM fred_cache WHERE series_id = ?'
  ).bind(FRED_SERIES.CONSTRUCTION_PPI).first<{ count: number }>();

  // Get current inflation factor if data exists
  let currentFactor: InflationAdjustment | null = null;
  if (dataCount?.count && dataCount.count > 0) {
    const cachedData = await db.prepare(
      `SELECT observation_date, value FROM fred_cache 
       WHERE series_id = ? 
       ORDER BY observation_date DESC`
    ).bind(FRED_SERIES.CONSTRUCTION_PPI).all<{ observation_date: string; value: number }>();
    
    if (cachedData.results && cachedData.results.length > 0) {
      const observations = cacheRowsToObservations(cachedData.results);
      currentFactor = calculateInflationFactor(observations, BENCHMARK_BASE_YEAR);
    }
  }

  return c.json({
    hasApiKey: !!apiKey,
    seriesId: FRED_SERIES.CONSTRUCTION_PPI,
    lastRefresh: lastRefresh?.last_refresh_at || null,
    lastStatus: lastRefresh?.status || null,
    lastMessage: lastRefresh?.message || null,
    cachedObservations: dataCount?.count || 0,
    currentInflationFactor: currentFactor
  });
});

// ============================================
// STRUCTURED DATA EXTRACTION (AI-POWERED)
// ============================================

interface StructuredExtractRequest {
  text: string;
}

interface ContractorFingerprintExtract {
  legalBusinessName: string | null;
  dbaName: string | null;
  licenseNumber: string | null;
  licenseState: string | null;
  businessAddress: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  primaryContact: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
}

interface StructuredExtractResult {
  bidTotal: number | null;
  projectType: string | null;
  projectCategory: string | null;
  squareFootage: number | null;
  contractorName: string | null;
  contractorFingerprint: ContractorFingerprintExtract | null;
  confidence: {
    bidTotal: 'high' | 'medium' | 'low' | 'none';
    projectType: 'high' | 'medium' | 'low' | 'none';
    squareFootage: 'high' | 'medium' | 'low' | 'none';
    contractorInfo: 'high' | 'medium' | 'low' | 'none';
  };
  reasoning?: {
    bidTotal?: string;
    projectType?: string;
    squareFootage?: string;
    contractorInfo?: string;
  };
}

app.post("/api/extract/structured", async (c) => {
  try {
    const geminiKey = (c.env as unknown as Record<string, unknown>).GEMINI_API_KEY as string | undefined;
    
    if (!geminiKey) {
      return c.json({ 
        success: false, 
        error: 'Structured extraction not configured. Please add your Gemini API key.' 
      }, 500);
    }

    const body = await c.req.json() as StructuredExtractRequest;
    const { text } = body;

    if (!text?.trim()) {
      return c.json({ success: false, error: 'No text provided' }, 400);
    }

    const ai = new GoogleGenAI({ apiKey: geminiKey });

    const systemPrompt = `You are an expert at analyzing contractor bids, estimates, and invoices. Your job is to extract specific structured data from these documents.

You MUST:
1. Find the FINAL TOTAL or GRAND TOTAL amount - NOT subtotals, NOT line item costs, NOT deposits. Look for labels like "Total", "Grand Total", "Amount Due", "Contract Price", "Estimate Total".
2. Identify the PRIMARY project type - what is the main work being done? If it's a multi-trade project (like a kitchen remodel that includes plumbing, electrical, and painting), identify the overall project type, not individual trades.
3. Find square footage IF explicitly mentioned - do NOT guess or calculate.
4. Find the contractor/company name.
5. Extract CONTRACTOR BUSINESS DETAILS - license number, full address, phone, email, website. This is critical for verification.

Be very careful with totals:
- The total is usually at the bottom/end of the document
- It's typically the LARGEST amount unless there's an explicitly labeled grand total
- Ignore deposit amounts, partial payments, or payment schedules - find the full project total
- If you see multiple totals, prefer ones labeled "Grand Total" or "Contract Total" over "Subtotal"

License Number extraction (IMPORTANT for Georgia):
- Georgia contractor licenses have prefixes like: RBCO (Residential-Basic), RLQA (Residential-Light Commercial), CR (Certified Residential), GC (General Contractor), GCCO, GCQA, GCQB
- Look for patterns like "License #", "Lic #", "Lic:", "GA License", or just the prefix followed by numbers
- Examples: "RBCO012345", "License: RLQA-98765", "GA GC #123456"
- Also look in letterhead, footer, or "About Us" sections

Project categories (use exactly one):
- "Kitchen Remodel" - kitchen renovations, cabinet work, countertops
- "Bathroom Remodel" - bathroom renovations, showers, tubs, vanities  
- "Flooring" - hardwood, tile, carpet, LVP installation
- "Painting" - interior or exterior painting only
- "Roofing" - roof repairs or replacement
- "Deck/Outdoor" - decks, patios, outdoor living
- "HVAC" - heating, cooling, ventilation systems
- "Plumbing" - pipe work, water heaters, major plumbing
- "Electrical" - electrical panel, wiring, major electrical
- "Full Home Renovation" - whole house or multi-room projects
- "Basement Finishing" - basement buildouts
- "General Renovation" - misc improvements
- "Other" - if nothing fits`;

    const userPrompt = `Analyze this contractor bid document and extract the structured data:

---
${text.substring(0, 20000)}
---

Return a JSON object with this EXACT structure:
{
  "bidTotal": <number or null if not found>,
  "projectType": "<descriptive type like 'Kitchen Remodel' or 'Master Bathroom Renovation'>",
  "projectCategory": "<one of the exact categories listed above>",
  "squareFootage": <number or null if not explicitly stated>,
  "contractorName": "<company name or null>",
  "contractorFingerprint": {
    "legalBusinessName": "<official business name or null>",
    "dbaName": "<'doing business as' name if different, or null>",
    "licenseNumber": "<full license number with prefix like 'RBCO012345' or null>",
    "licenseState": "<state abbreviation like 'GA' or null>",
    "businessAddress": "<street address or null>",
    "city": "<city name or null>",
    "state": "<state abbreviation or null>",
    "zipCode": "<5-digit ZIP code or null>",
    "primaryContact": "<contact person name or null>",
    "phone": "<phone number or null>",
    "email": "<email address or null>",
    "website": "<website URL or null>"
  },
  "confidence": {
    "bidTotal": "<high|medium|low|none>",
    "projectType": "<high|medium|low|none>",
    "squareFootage": "<high|medium|low|none>",
    "contractorInfo": "<high|medium|low|none - how much contractor info did you find?>"
  },
  "reasoning": {
    "bidTotal": "<brief explanation of where you found the total and why you're confident it's the final total>",
    "projectType": "<brief explanation of how you determined project type>",
    "squareFootage": "<brief explanation or 'not mentioned in document'>",
    "contractorInfo": "<brief summary of what contractor details were found and where>"
  }
}

Confidence levels:
- "high": Multiple contractor details found (name, address, phone, license)
- "medium": Basic info found (name and at least one of: address, phone, or license)
- "low": Only contractor name found
- "none": No contractor information found`;

    // Retry logic for more consistent extraction
    let responseText = '{}';
    let extractedData: StructuredExtractResult | null = null;
    const maxRetries = 2;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",  // Use more capable model for accurate bid total extraction
          contents: userPrompt,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            thinkingConfig: {
              thinkingBudget: 0
            },
            temperature: 0  // Deterministic output for consistent project title extraction
          }
        });

        responseText = response.text || '{}';
        
        try {
          extractedData = JSON.parse(responseText);
          
          // Check if we got a useful contractor name - if not, retry
          const hasContractorName = extractedData?.contractorFingerprint?.legalBusinessName || 
                                    extractedData?.contractorName;
          if (hasContractorName || attempt === maxRetries) {
            break; // Success or final attempt
          }
          console.warn(`Structured extraction attempt ${attempt}/${maxRetries}: Missing contractor name, retrying...`);
        } catch {
          console.error(`Structured extraction attempt ${attempt}/${maxRetries}: Failed to parse response`);
          if (attempt === maxRetries) {
            return c.json({ 
              success: false, 
              error: 'Failed to parse AI response' 
            }, 500);
          }
        }
      } catch (err) {
        console.error(`Structured extraction attempt ${attempt}/${maxRetries} failed:`, err);
        if (attempt === maxRetries) {
          throw err;
        }
      }
      
      // Brief delay between retries
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    if (!extractedData) {
      return c.json({ success: false, error: 'Extraction failed after retries' }, 500);
    }
    
    // Fallback detection for well-known national contractors based on phone/URL patterns
    // This helps when logos aren't captured by OCR
    const knownContractorPatterns: Array<{
      patterns: RegExp[];
      name: string;
      city: string;
      state: string;
      phone: string;
      website: string;
    }> = [
      {
        // More flexible patterns for 50 Floor - handle various phone formats
        patterns: [
          /877[\s\-\.()]*50[\s\-\.()]*FLOOR/i, 
          /877[\s\-\.()]*503[\s\-\.()]*5667/i,
          /\(877\)\s*503[\s\-\.]*5667/i,
          /50\s*floor/i, 
          /50floor\.com/i
        ],
        name: '50 Floor',
        city: 'Tucker',
        state: 'GA',
        phone: '877-503-5667',
        website: '50floor.com'
      },
      {
        patterns: [
          /empire\s*today/i, 
          /800[\s\-\.()]*588[\s\-\.()]*2300/i,
          /\(800\)\s*588[\s\-\.]*2300/i, 
          /empiretoday\.com/i
        ],
        name: 'Empire Today',
        city: 'Northlake',
        state: 'IL',
        phone: '800-588-2300',
        website: 'empiretoday.com'
      },
      {
        patterns: [/home\s*depot/i, /homedepot\.com/i],
        name: 'Home Depot',
        city: 'Atlanta',
        state: 'GA',
        phone: '',
        website: 'homedepot.com'
      },
      {
        patterns: [/lowes/i, /lowes\.com/i, /lowe'?s/i],
        name: "Lowe's",
        city: 'Mooresville',
        state: 'NC',
        phone: '',
        website: 'lowes.com'
      }
    ];
    
    // ALWAYS check for known national contractors first - they should be identified correctly
    // regardless of what Gemini extracted (their logos/branding may not OCR well)
    let matchedContractor: typeof knownContractorPatterns[0] | null = null;
    
    // First check text for known contractor patterns
    for (const contractor of knownContractorPatterns) {
      const matchFound = contractor.patterns.some(pattern => pattern.test(text));
      if (matchFound) {
        matchedContractor = contractor;
        console.log(`Known contractor detection: Found ${contractor.name} via text pattern match`);
        break;
      }
    }
    
    // If no text match, also check the extracted phone number against known contractor phones
    if (!matchedContractor && extractedData.contractorFingerprint?.phone) {
      const extractedPhone = extractedData.contractorFingerprint.phone.replace(/\D/g, ''); // digits only
      for (const contractor of knownContractorPatterns) {
        const contractorPhone = contractor.phone.replace(/\D/g, '');
        if (contractorPhone && extractedPhone.includes(contractorPhone)) {
          matchedContractor = contractor;
          console.log(`Known contractor detection: Found ${contractor.name} via extracted phone match`);
          break;
        }
      }
    }
    
    // Apply matched known contractor info - always override for known national contractors
    if (matchedContractor) {
      if (!extractedData.contractorFingerprint) {
        extractedData.contractorFingerprint = {
          legalBusinessName: matchedContractor.name,
          dbaName: null,
          licenseNumber: null,
          licenseState: null,
          businessAddress: null,
          city: matchedContractor.city,
          state: matchedContractor.state,
          zipCode: null,
          primaryContact: null,
          phone: matchedContractor.phone || null,
          email: null,
          website: matchedContractor.website || null
        };
      } else {
        // Override business name for known contractors
        extractedData.contractorFingerprint.legalBusinessName = matchedContractor.name;
        extractedData.contractorFingerprint.city = extractedData.contractorFingerprint.city || matchedContractor.city;
        extractedData.contractorFingerprint.state = extractedData.contractorFingerprint.state || matchedContractor.state;
        extractedData.contractorFingerprint.phone = extractedData.contractorFingerprint.phone || matchedContractor.phone || null;
        extractedData.contractorFingerprint.website = extractedData.contractorFingerprint.website || matchedContractor.website || null;
      }
      extractedData.contractorName = matchedContractor.name;
    }

    // ============================================
    // CONTRACTOR NAME VALIDATION & FALLBACK EXTRACTION
    // ============================================
    
    // List of invalid/garbage contractor names to reject
    const INVALID_NAME_PATTERNS = [
      /^quote\s*\d*$/i,           // "Quote", "Quote 1", "Quote 2"
      /^estimate\s*\d*$/i,        // "Estimate", "Estimate 1"
      /^proposal\s*\d*$/i,        // "Proposal", "Proposal 1"
      /^page\s*\d+$/i,            // "Page 1", "Page 2"
      /^bid\s*\d*$/i,             // "Bid", "Bid 1"
      /^invoice\s*\d*$/i,         // "Invoice", "Invoice 123"
      /^contract\s*\d*$/i,        // "Contract", "Contract 1"
      /^customer$/i,              // "Customer"
      /^client$/i,                // "Client"
      /^homeowner$/i,             // "Homeowner"
      /^owner$/i,                 // "Owner"
      /^n\/?a$/i,                 // "N/A", "NA"
      /^none$/i,                  // "None"
      /^unknown$/i,               // "Unknown"
      /^tbd$/i,                   // "TBD"
      /^\d+$/,                    // Numbers only
      /^[a-z]$/i,                 // Single letter
      /^total$/i,                 // "Total"
      /^subtotal$/i,              // "Subtotal"
      /^amount$/i,                // "Amount"
      /^price$/i,                 // "Price"
      /^cost$/i,                  // "Cost"
    ];
    
    // Check if a contractor name is valid (not garbage)
    function isValidContractorName(name: string | null | undefined): boolean {
      if (!name) return false;
      const trimmed = name.trim();
      if (trimmed.length < 2) return false;
      if (trimmed.length > 100) return false; // Too long, probably garbage
      if (INVALID_NAME_PATTERNS.some(pattern => pattern.test(trimmed))) return false;
      // Must have at least 2 characters that aren't numbers/punctuation
      const letterCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
      if (letterCount < 2) return false;
      return true;
    }
    
    // Extract company name from email (domain or local part)
    // e.g., "info@smithplumbing.com" -> "Smith Plumbing" (from domain)
    // e.g., "info.builderland@gmail.com" -> "Builderland" (from local part)
    function extractNameFromEmail(email: string | null | undefined): string | null {
      if (!email) return null;
      
      // Generic email providers we'll skip in domain check
      const genericDomains = ['gmail', 'yahoo', 'hotmail', 'outlook', 'aol', 'icloud', 'mail', 'email', 'msn', 'live', 'comcast', 'att', 'verizon', 'bellsouth'];
      
      // First try domain-based extraction
      const domainMatch = email.match(/@([^.]+)\./i);
      if (domainMatch) {
        const domain = domainMatch[1];
        if (!genericDomains.includes(domain.toLowerCase())) {
          // Non-generic domain - extract from it
          let formatted = domain
            .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase
            .replace(/([a-zA-Z])(\d)/g, '$1 $2') // letters before numbers
            .replace(/(\d)([a-zA-Z])/g, '$1 $2') // numbers before letters
            .replace(/(llc|inc|co|corp|ltd|plumbing|electric|roofing|construction|contracting|builders|services|hvac|flooring|painting|remodeling|renovations)$/i, ' $1');
          formatted = formatted.split(/[\s-]+/).map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          ).join(' ');
          if (formatted.length >= 3) return formatted;
        }
      }
      
      // If domain is generic (gmail, etc.), try extracting from local part
      const localMatch = email.match(/^([^@]+)@/);
      if (localMatch) {
        const localPart = localMatch[1];
        // Common prefixes to strip: info, contact, admin, support, hello, sales, office, team
        const prefixes = ['info', 'contact', 'admin', 'support', 'hello', 'sales', 'office', 'team', 'mail', 'email'];
        
        // Split on dots and underscores to find company name
        const parts = localPart.split(/[._-]+/);
        
        // Filter out common prefixes and find the longest remaining part
        const filteredParts = parts.filter(part => 
          part.length >= 3 && !prefixes.includes(part.toLowerCase())
        );
        
        if (filteredParts.length > 0) {
          // Take the longest part as the company name
          const companyPart = filteredParts.reduce((a, b) => a.length > b.length ? a : b);
          
          // Format it nicely
          let formatted = companyPart
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/([a-zA-Z])(\d)/g, '$1 $2')
            .replace(/(\d)([a-zA-Z])/g, '$1 $2')
            .replace(/(llc|inc|co|corp|ltd|plumbing|electric|roofing|construction|contracting|builders|services|hvac|flooring|painting|remodeling|renovations)$/i, ' $1');
          formatted = formatted.split(/[\s-]+/).map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          ).join(' ');
          
          if (formatted.length >= 3) return formatted;
        }
      }
      
      return null;
    }
    
    // Extract company name from website URL (e.g., "www.smithplumbing.com" -> "Smith Plumbing")
    function extractNameFromWebsite(website: string | null | undefined): string | null {
      if (!website) return null;
      // Remove protocol and www
      let domain = website.replace(/^(https?:\/\/)?(www\.)?/i, '');
      // Get first part before TLD
      const match = domain.match(/^([^./]+)/);
      if (!match) return null;
      domain = match[1];
      // Skip if too short
      if (domain.length < 3) return null;
      // Use same formatting as email
      let formatted = domain
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([a-zA-Z])(\d)/g, '$1 $2')
        .replace(/(\d)([a-zA-Z])/g, '$1 $2')
        .replace(/(llc|inc|co|corp|ltd|plumbing|electric|roofing|construction|contracting|builders|services|hvac|flooring|painting|remodeling|renovations)$/i, ' $1');
      formatted = formatted.split(/[\s-]+/).map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
      return formatted.length >= 3 ? formatted : null;
    }
    
    // Check if extracted name is valid, if not try fallbacks
    const currentName = extractedData.contractorFingerprint?.legalBusinessName || extractedData.contractorName;
    if (!isValidContractorName(currentName)) {
      console.log(`Invalid contractor name detected: "${currentName}". Attempting fallback extraction...`);
      
      // Try email domain first (more reliable)
      let fallbackName = extractNameFromEmail(extractedData.contractorFingerprint?.email);
      if (fallbackName) {
        console.log(`Extracted contractor name from email: "${fallbackName}"`);
      }
      
      // Try website if email didn't work
      if (!fallbackName) {
        fallbackName = extractNameFromWebsite(extractedData.contractorFingerprint?.website);
        if (fallbackName) {
          console.log(`Extracted contractor name from website: "${fallbackName}"`);
        }
      }
      
      // Apply fallback name if found
      if (fallbackName) {
        if (extractedData.contractorFingerprint) {
          extractedData.contractorFingerprint.legalBusinessName = fallbackName;
        }
        extractedData.contractorName = fallbackName;
      } else {
        // Clear invalid name so it doesn't get used
        if (extractedData.contractorFingerprint) {
          extractedData.contractorFingerprint.legalBusinessName = null;
        }
        extractedData.contractorName = null;
        console.log('No valid contractor name found from any source');
      }
    }

    // Validate and clean the response
    const fp = extractedData.contractorFingerprint;
    const cleanedFingerprint: ContractorFingerprintExtract | null = fp ? {
      legalBusinessName: fp.legalBusinessName?.trim() || null,
      dbaName: fp.dbaName?.trim() || null,
      licenseNumber: fp.licenseNumber?.trim() || null,
      licenseState: fp.licenseState?.trim()?.toUpperCase() || null,
      businessAddress: fp.businessAddress?.trim() || null,
      city: fp.city?.trim() || null,
      state: fp.state?.trim()?.toUpperCase() || null,
      zipCode: fp.zipCode?.toString().replace(/\D/g, '').substring(0, 5) || null,
      primaryContact: fp.primaryContact?.trim() || null,
      phone: fp.phone?.trim() || null,
      email: fp.email?.trim()?.toLowerCase() || null,
      website: fp.website?.trim()?.toLowerCase() || null,
    } : null;
    
    const cleanedData: StructuredExtractResult = {
      bidTotal: typeof extractedData.bidTotal === 'number' && extractedData.bidTotal > 0 
        ? Math.round(extractedData.bidTotal) 
        : null,
      projectType: typeof extractedData.projectType === 'string' && extractedData.projectType.trim()
        ? extractedData.projectType.trim()
        : null,
      projectCategory: typeof extractedData.projectCategory === 'string' && extractedData.projectCategory.trim()
        ? extractedData.projectCategory.trim()
        : null,
      squareFootage: typeof extractedData.squareFootage === 'number' && extractedData.squareFootage > 0
        ? Math.round(extractedData.squareFootage)
        : null,
      contractorName: typeof extractedData.contractorName === 'string' && extractedData.contractorName.trim()
        ? extractedData.contractorName.trim()
        : null,
      contractorFingerprint: cleanedFingerprint,
      confidence: {
        bidTotal: extractedData.confidence?.bidTotal || 'none',
        projectType: extractedData.confidence?.projectType || 'none',
        squareFootage: extractedData.confidence?.squareFootage || 'none',
        contractorInfo: extractedData.confidence?.contractorInfo || 'none'
      },
      reasoning: extractedData.reasoning
    };

    return c.json({
      success: true,
      data: cleanedData,
      model: 'gemini-2.5-flash'
    });

  } catch (error) {
    console.error('Structured extraction error:', error);
    return c.json({ 
      success: false, 
      error: 'Structured extraction failed. Please try again.' 
    }, 500);
  }
});

// ============================================
// BID ANALYTICS - Learning from Uploaded Bids
// ============================================

interface BidAnalyticsRequest {
  projectType: string;
  stateCode?: string;
  totalAmount?: number;
  squareFootage?: number;
  tradeBreakdown?: Array<{ trade: string; amount: number; percentage: number }>;
  issuesDetected?: string[];
  confidenceScore?: number;
}

// Store anonymized bid data (with user consent)
app.post("/api/bid-analytics", async (c) => {
  try {
    const body = await c.req.json() as BidAnalyticsRequest;
    const { projectType, stateCode, totalAmount, squareFootage, tradeBreakdown, issuesDetected, confidenceScore } = body;

    if (!projectType) {
      return c.json({ success: false, error: 'Project type required' }, 400);
    }

    const db = c.env.DB;

    // Calculate price per square foot if we have both values
    const pricePerSqft = totalAmount && squareFootage && squareFootage > 0
      ? Math.round((totalAmount / squareFootage) * 100) / 100
      : null;

    // Calculate expiration (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Insert anonymized bid data
    await db.prepare(
      `INSERT INTO bid_analytics (
        project_type, state_code, total_amount, square_footage, price_per_sqft,
        trade_breakdown, issues_detected, confidence_score,
        consent_given_at, expires_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime("now"), ?, datetime("now"), datetime("now"))`
    ).bind(
      projectType,
      stateCode || null,
      totalAmount || null,
      squareFootage || null,
      pricePerSqft,
      tradeBreakdown ? JSON.stringify(tradeBreakdown) : null,
      issuesDetected ? JSON.stringify(issuesDetected) : null,
      confidenceScore || null,
      expiresAt.toISOString()
    ).run();

    // Trigger benchmark update in background (fire and forget)
    updateBidBenchmarks(db, projectType, stateCode || null).catch(err => 
      console.error('Benchmark update error:', err)
    );

    // Also clean up expired data in background
    cleanupExpiredBidData(db).catch(err => 
      console.error('Cleanup error:', err)
    );

    return c.json({ 
      success: true, 
      message: 'Thank you for helping improve RemodelerIQ!',
      expiresAt: expiresAt.toISOString()
    });

  } catch (error) {
    console.error('Bid analytics storage error:', error);
    return c.json({ success: false, error: 'Failed to store analytics' }, 500);
  }
});

// Get aggregated benchmarks for a project type and region
app.get("/api/bid-benchmarks", async (c) => {
  try {
    const projectType = c.req.query('projectType');
    const stateCode = c.req.query('stateCode');

    if (!projectType) {
      return c.json({ success: false, error: 'Project type required' }, 400);
    }

    const db = c.env.DB;

    // First try to get specific state benchmarks
    let benchmark = await db.prepare(
      `SELECT * FROM bid_benchmarks WHERE project_type = ? AND state_code = ?`
    ).bind(projectType, stateCode || null).first<{
      project_type: string;
      state_code: string | null;
      sample_count: number;
      avg_total_amount: number | null;
      median_total_amount: number | null;
      min_total_amount: number | null;
      max_total_amount: number | null;
      avg_price_per_sqft: number | null;
      common_issues: string | null;
      trade_averages: string | null;
      last_calculated_at: string | null;
    }>();

    // If no state-specific data, try national average
    if (!benchmark && stateCode) {
      benchmark = await db.prepare(
        `SELECT * FROM bid_benchmarks WHERE project_type = ? AND state_code IS NULL`
      ).bind(projectType).first();
    }

    if (!benchmark || benchmark.sample_count === 0) {
      return c.json({
        success: true,
        hasBenchmark: false,
        message: 'Not enough data yet for this project type'
      });
    }

    return c.json({
      success: true,
      hasBenchmark: true,
      benchmark: {
        projectType: benchmark.project_type,
        stateCode: benchmark.state_code,
        sampleCount: benchmark.sample_count,
        pricing: {
          average: benchmark.avg_total_amount,
          median: benchmark.median_total_amount,
          min: benchmark.min_total_amount,
          max: benchmark.max_total_amount,
          avgPerSqft: benchmark.avg_price_per_sqft
        },
        commonIssues: benchmark.common_issues ? JSON.parse(benchmark.common_issues) : {},
        tradeAverages: benchmark.trade_averages ? JSON.parse(benchmark.trade_averages) : {},
        lastUpdated: benchmark.last_calculated_at
      }
    });

  } catch (error) {
    console.error('Benchmark fetch error:', error);
    return c.json({ success: false, error: 'Failed to fetch benchmarks' }, 500);
  }
});

// Get all available benchmarks (admin only)
app.get("/api/bid-benchmarks/all", authMiddleware, async (c) => {
  const user = c.get('user');
  if (!isAdminEmail(user.email, c.env)) return c.json({ error: "Forbidden" }, 403);
  try {
    const db = c.env.DB;

    const benchmarks = await db.prepare(
      `SELECT project_type, state_code, sample_count, avg_total_amount, avg_price_per_sqft, last_calculated_at
       FROM bid_benchmarks 
       WHERE sample_count > 0
       ORDER BY sample_count DESC`
    ).all<{
      project_type: string;
      state_code: string | null;
      sample_count: number;
      avg_total_amount: number | null;
      avg_price_per_sqft: number | null;
      last_calculated_at: string | null;
    }>();

    return c.json({
      success: true,
      benchmarks: benchmarks.results || []
    });

  } catch (error) {
    console.error('All benchmarks fetch error:', error);
    return c.json({ success: false, error: 'Failed to fetch benchmarks' }, 500);
  }
});

// Helper: Update benchmarks for a project type/state combination
async function updateBidBenchmarks(db: D1Database, projectType: string, stateCode: string | null): Promise<void> {
  // Get all non-expired bids for this project type and state
  const bids = await db.prepare(
    `SELECT total_amount, price_per_sqft, issues_detected, trade_breakdown
     FROM bid_analytics 
     WHERE project_type = ? 
     AND (state_code = ? OR (? IS NULL AND state_code IS NULL)) -- SQLite: '? IS NULL' with a bound parameter evaluates correctly — binding null gives true
     AND expires_at > datetime("now")
     AND is_deleted = 0
     AND total_amount IS NOT NULL`
  ).bind(projectType, stateCode, stateCode).all<{
    total_amount: number;
    price_per_sqft: number | null;
    issues_detected: string | null;
    trade_breakdown: string | null;
  }>();

  if (!bids.results || bids.results.length === 0) {
    return;
  }

  const amounts = bids.results.map(b => b.total_amount).sort((a, b) => a - b);
  const sqftPrices = bids.results.filter(b => b.price_per_sqft).map(b => b.price_per_sqft!);

  // Calculate statistics
  const sampleCount = amounts.length;
  const avgTotal = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const medianTotal = amounts[Math.floor(amounts.length / 2)];
  const minTotal = amounts[0];
  const maxTotal = amounts[amounts.length - 1];
  const avgPsf = sqftPrices.length > 0 
    ? sqftPrices.reduce((a, b) => a + b, 0) / sqftPrices.length 
    : null;

  // Aggregate common issues
  const issueCounts: Record<string, number> = {};
  for (const bid of bids.results) {
    if (bid.issues_detected) {
      try {
        const issues = JSON.parse(bid.issues_detected) as string[];
        for (const issue of issues) {
          issueCounts[issue] = (issueCounts[issue] || 0) + 1;
        }
      } catch { /* ignore parse errors */ }
    }
  }

  // Aggregate trade averages
  const tradeData: Record<string, { totalAmount: number; totalPct: number; count: number }> = {};
  for (const bid of bids.results) {
    if (bid.trade_breakdown) {
      try {
        const trades = JSON.parse(bid.trade_breakdown) as Array<{ trade: string; amount: number; percentage: number }>;
        for (const t of trades) {
          if (!tradeData[t.trade]) {
            tradeData[t.trade] = { totalAmount: 0, totalPct: 0, count: 0 };
          }
          tradeData[t.trade].totalAmount += t.amount;
          tradeData[t.trade].totalPct += t.percentage;
          tradeData[t.trade].count++;
        }
      } catch { /* ignore parse errors */ }
    }
  }

  const tradeAverages: Record<string, { avgAmount: number; avgPercentage: number }> = {};
  for (const [trade, data] of Object.entries(tradeData)) {
    tradeAverages[trade] = {
      avgAmount: Math.round(data.totalAmount / data.count),
      avgPercentage: Math.round((data.totalPct / data.count) * 10) / 10
    };
  }

  // Upsert benchmark
  await db.prepare(
    `INSERT INTO bid_benchmarks (
      project_type, state_code, sample_count,
      avg_total_amount, median_total_amount, min_total_amount, max_total_amount,
      avg_price_per_sqft, common_issues, trade_averages,
      last_calculated_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"), datetime("now"), datetime("now"))
    ON CONFLICT(project_type, state_code) DO UPDATE SET
      sample_count = excluded.sample_count,
      avg_total_amount = excluded.avg_total_amount,
      median_total_amount = excluded.median_total_amount,
      min_total_amount = excluded.min_total_amount,
      max_total_amount = excluded.max_total_amount,
      avg_price_per_sqft = excluded.avg_price_per_sqft,
      common_issues = excluded.common_issues,
      trade_averages = excluded.trade_averages,
      last_calculated_at = datetime("now"),
      updated_at = datetime("now")`
  ).bind(
    projectType,
    stateCode,
    sampleCount,
    Math.round(avgTotal),
    Math.round(medianTotal),
    Math.round(minTotal),
    Math.round(maxTotal),
    avgPsf ? Math.round(avgPsf * 100) / 100 : null,
    JSON.stringify(issueCounts),
    JSON.stringify(tradeAverages)
  ).run();
}

// Helper: Clean up expired bid data
async function cleanupExpiredBidData(db: D1Database): Promise<void> {
  // Soft delete expired entries (mark as deleted)
  await db.prepare(
    `UPDATE bid_analytics SET is_deleted = 1, updated_at = datetime("now")
     WHERE expires_at <= datetime("now") AND is_deleted = 0`
  ).run();

  // Hard delete entries that have been soft-deleted for more than 7 days
  await db.prepare(
    `DELETE FROM bid_analytics 
     WHERE is_deleted = 1 
     AND updated_at < datetime("now", "-7 days")`
  ).run();
}

// ============================================
// GOOGLE PLACES - Contractor Lookup
// ============================================

interface GooglePlacesSearchResult {
  places?: Array<{
    id: string;
    displayName?: { text: string };
    formattedAddress?: string;
    rating?: number;
    userRatingCount?: number;
    reviews?: Array<{
      text?: { text: string };
      rating?: number;
      relativePublishTimeDescription?: string;
      authorAttribution?: { displayName: string };
    }>;
    websiteUri?: string;
    nationalPhoneNumber?: string;
    businessStatus?: string;
  }>;
}

app.get("/api/contractor/google-places", async (c) => {
  const apiKey = (c.env as unknown as Record<string, unknown>).GOOGLE_PLACES_API_KEY as string | undefined;
  
  if (!apiKey) {
    return c.json({ 
      success: false, 
      error: "Google Places API key not configured",
      data: null 
    }, 200);
  }
  
  const businessName = c.req.query("businessName");
  const phone = c.req.query("phone");
  const city = c.req.query("city");
  const state = c.req.query("state");
  const website = c.req.query("website");
  
  // Allow phone-based lookup as fallback when no business name
  if (!businessName && !phone) {
    return c.json({ 
      success: false, 
      error: "Business name or phone number is required",
      data: null 
    }, 400);
  }
  
  // Build search queries - try multiple variations for better matching
  const searchQueries: string[] = [];
  
  // Helper to extract domain from website URL
  const extractDomainForSearch = (url: string | null | undefined): string | null => {
    if (!url) return null;
    try {
      const hostname = url.includes('://') ? new URL(url).hostname : url.split('/')[0];
      return hostname.replace(/^www\./, '').toLowerCase();
    } catch {
      return null;
    }
  };
  
  // Helper to split compound words like "Builderland" -> "Builder Land"
  const splitCompoundWord = (word: string): string | null => {
    const compoundParts = ['builder', 'land', 'home', 'house', 'pro', 'tech', 'craft', 'works', 'design', 'build', 'floor', 'roof', 'deck', 'bath', 'kitchen', 'smart', 'prime', 'elite', 'master', 'custom', 'quality', 'first', 'best', 'top', 'green', 'blue', 'red'];
    const lowerWord = word.toLowerCase();
    for (const part of compoundParts) {
      if (lowerWord.startsWith(part) && lowerWord.length > part.length + 2) {
        const remainder = word.slice(part.length);
        // Capitalize both parts
        return word.slice(0, part.length).charAt(0).toUpperCase() + word.slice(1, part.length) + ' ' + remainder.charAt(0).toUpperCase() + remainder.slice(1);
      }
      if (lowerWord.endsWith(part) && lowerWord.length > part.length + 2) {
        const prefix = word.slice(0, -part.length);
        return prefix.charAt(0).toUpperCase() + prefix.slice(1) + ' ' + word.slice(-part.length).charAt(0).toUpperCase() + word.slice(-part.length + 1);
      }
    }
    return null;
  };
  
  if (businessName) {
    // Clean business name - remove common suffixes
    const cleanedName = businessName
      .replace(/\s*(Inc\.?|LLC|Corp\.?|Co\.?|Company|Ltd\.?)\s*$/i, '')
      .trim();
    
    // Extract the FIRST distinctive word (the brand name) - this is most important
    const commonWords = new Set(['floor', 'floors', 'flooring', 'covering', 'coverings', 'services', 'home', 'homes', 'construction', 'contractors', 'remodeling', 'renovations', 'the', 'and', 'of']);
    const nameWords = cleanedName.toLowerCase().split(/\s+/);
    const distinctiveWord = nameWords.find(w => w.length > 3 && !commonWords.has(w));
    
    // Priority 0: If we have a website, search by domain (HIGHEST priority - most reliable)
    const searchDomain = extractDomainForSearch(website);
    if (searchDomain) {
      searchQueries.push(`"${searchDomain}"`);
      if (city && state) {
        searchQueries.push(`${searchDomain} contractor ${city}, ${state}`);
      }
      if (state) {
        searchQueries.push(`${searchDomain} contractor ${state}`);
      }
      console.log(`Google Places: Adding website domain searches for "${searchDomain}"`);
    }
    
    // Try multiple query variations to maximize chances of finding the business
    // Priority 1: Quoted exact name (most specific)
    searchQueries.push(`"${cleanedName}"`);
    if (city && state) {
      searchQueries.push(`"${cleanedName}" ${city}, ${state}`);
    }
    
    // Priority 1.5: Split compound words (e.g., "Builderland" -> "Builder Land")
    // This handles single-word business names that are actually two words combined
    if (!cleanedName.includes(' ')) {
      const splitName = splitCompoundWord(cleanedName);
      if (splitName) {
        searchQueries.push(`"${splitName}"`);
        if (city && state) {
          searchQueries.push(`"${splitName}" ${city}, ${state}`);
        }
        console.log(`Google Places: Adding compound word split "${cleanedName}" -> "${splitName}"`);
      }
    }
    
    // Priority 2: If we have a distinctive word, search that + industry + location
    if (distinctiveWord && city && state) {
      searchQueries.push(`${distinctiveWord} flooring ${city}, ${state}`);
      searchQueries.push(`${distinctiveWord} floor covering ${city}, ${state}`);
      searchQueries.push(`${distinctiveWord} contractor ${city}, ${state}`);
    }
    
    // Priority 3: Business name with city and state
    if (city && state) {
      searchQueries.push(`${cleanedName} ${city}, ${state}`);
    }
    
    // Priority 4: Business name with state
    if (state) {
      searchQueries.push(`${cleanedName} ${state}`);
    }
    
    // Priority 5: Normalizing compound words (e.g., "Floorcovering" -> "Floor Covering") - camelCase version
    const spacedName = cleanedName.replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Za-z])covering/gi, '$1 Covering')
      .replace(/([A-Za-z])works/gi, '$1 Works')
      .replace(/([A-Za-z])craft/gi, '$1 Craft')
      .replace(/([A-Za-z])services/gi, '$1 Services');
    if (spacedName !== cleanedName) {
      searchQueries.push(`"${spacedName}"`);
      if (city && state) {
        searchQueries.push(`${spacedName} ${city}, ${state}`);
      }
    }
    
    // Priority 6: Just the business name
    searchQueries.push(cleanedName);
    
    console.log(`Google Places search queries (${searchQueries.length} total): ${searchQueries.slice(0, 4).join(' | ')}`);
  } else {
    // Format phone for search - try with area code format
    const cleanPhone = phone!.replace(/\D/g, '');
    const formattedPhone = cleanPhone.length === 10 
      ? `(${cleanPhone.slice(0,3)}) ${cleanPhone.slice(3,6)}-${cleanPhone.slice(6)}`
      : cleanPhone.length === 11 && cleanPhone.startsWith('1')
        ? `(${cleanPhone.slice(1,4)}) ${cleanPhone.slice(4,7)}-${cleanPhone.slice(7)}`
        : phone!;
    const locationParts = [city, state].filter(Boolean);
    const phoneQuery = locationParts.length > 0
      ? `"${formattedPhone}" contractor ${locationParts.join(", ")}`
      : `"${formattedPhone}" contractor`;
    searchQueries.push(phoneQuery);
    console.log(`Phone-based Google Places search: ${phoneQuery}`);
  }
  
  try {
    // Helper function to make a search request
    const makeSearchRequest = async (query: string): Promise<GooglePlacesSearchResult> => {
      const response = await fetch(
        "https://places.googleapis.com/v1/places:searchText",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.reviews,places.websiteUri,places.nationalPhoneNumber,places.businessStatus"
          },
          body: JSON.stringify({
            textQuery: query,
            maxResultCount: 3
          })
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Google Places API error for query "${query}":`, response.status, errorText);
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json() as GooglePlacesSearchResult;
    };
    
    // Try each search query until we find results
    let data: GooglePlacesSearchResult = { places: [] };
    
    for (const query of searchQueries) {
      try {
        const result = await makeSearchRequest(query);
        if (result.places && result.places.length > 0) {
          data = result;
          console.log(`Google Places found results with query: "${query}"`);
          break;
        }
        console.log(`Google Places no results for query: "${query}"`);
      } catch (err) {
        // If first query fails with API error, report it
        if (query === searchQueries[0]) {
          return c.json({ 
            success: false, 
            error: `Google Places API error`,
            details: err instanceof Error ? err.message : 'Unknown error',
            data: null 
          }, 502);
        }
        // Otherwise continue to next query
        console.log(`Google Places query failed: "${query}"`);
      }
    }
    
    // If no results with name searches and we have a phone number, try phone-based search
    if ((!data.places || data.places.length === 0) && phone) {
      console.log(`Google Places: Name searches failed, trying phone-based fallback`);
      const cleanPhone = phone.replace(/\D/g, '');
      const formattedPhone = cleanPhone.length === 10 
        ? `(${cleanPhone.slice(0,3)}) ${cleanPhone.slice(3,6)}-${cleanPhone.slice(6)}`
        : cleanPhone.length === 11 && cleanPhone.startsWith('1')
          ? `(${cleanPhone.slice(1,4)}) ${cleanPhone.slice(4,7)}-${cleanPhone.slice(7)}`
          : phone;
      
      const phoneQueries = [
        `"${formattedPhone}"`,
        formattedPhone,
        `contractor ${formattedPhone}`,
      ];
      
      if (city && state) {
        phoneQueries.push(`"${formattedPhone}" ${city}, ${state}`);
      }
      
      for (const phoneQuery of phoneQueries) {
        try {
          const result = await makeSearchRequest(phoneQuery);
          if (result.places && result.places.length > 0) {
            data = result;
            console.log(`Google Places found via phone: "${phoneQuery}"`);
            break;
          }
        } catch {
          // Continue to next query
        }
      }
    }
    
    if (!data.places || data.places.length === 0) {
      return c.json({ 
        success: true, 
        data: null,
        message: "No results found",
        queriesTried: searchQueries.length + (phone ? 4 : 0)
      });
    }
    
    // Find best match by checking if business name appears in the result
    const normalizedSearch = (businessName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    // Get the first distinctive word (not common words like "the", "and", etc.)
    const commonWords = new Set(['the', 'and', 'inc', 'llc', 'corp', 'company', 'co', 'services', 'contractor', 'flooring', 'floor', 'covering', 'coverings', 'construction', 'home', 'pro', 'pros']);
    const searchWords = (businessName || '').toLowerCase().split(/\s+/).filter(w => w.length > 2 && !commonWords.has(w));
    const firstDistinctiveWord = searchWords[0] || '';
    
    // Normalize phone for comparison
    const searchPhone = phone ? phone.replace(/\D/g, '') : '';
    
    // Extract domain from website for matching (e.g., "builderland.org" -> "builderland")
    const extractDomain = (url: string | null | undefined): string | null => {
      if (!url) return null;
      try {
        const hostname = url.includes('://') ? new URL(url).hostname : url.split('/')[0];
        // Remove www. and get domain without TLD
        const domainParts = hostname.replace(/^www\./, '').split('.');
        return domainParts.length > 0 ? domainParts[0].toLowerCase() : null;
      } catch {
        return null;
      }
    };
    const searchDomain = extractDomain(website);
    const searchState = state?.toUpperCase();
    
    // Score each place and find best match
    let bestMatch = null;
    let bestScore = 0;
    
    for (const place of data.places) {
      const placeName = (place.displayName?.text || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const placeWords = (place.displayName?.text || '').toLowerCase().split(/\s+/);
      const placePhone = place.nationalPhoneNumber ? place.nationalPhoneNumber.replace(/\D/g, '') : '';
      const placeDomain = extractDomain(place.websiteUri);
      const placeAddress = (place.formattedAddress || '').toUpperCase();
      
      console.log(`Google Places: Evaluating "${place.displayName?.text}" - phone: ${placePhone} vs ${searchPhone}, domain: ${placeDomain} vs ${searchDomain}`);
      
      let score = 0;
      
      // Website domain match is VERY strong signal (100 points) - e.g., "builderland.org" matches "Builder Land LLC"
      // This is the MOST reliable identifier since websites are unique
      if (searchDomain && placeDomain && searchDomain === placeDomain) {
        score += 100;
        console.log(`Google Places: Domain match! ${searchDomain}`);
      }
      
      // Exact phone match (80 points base)
      const phoneMatches = searchPhone && placePhone && searchPhone === placePhone;
      const partialPhoneMatches = searchPhone && placePhone && !phoneMatches && 
        searchPhone.slice(-7) === placePhone.slice(-7);
      
      if (phoneMatches) {
        // If we have a website domain to compare and the place has a different domain,
        // reduce phone match value - phone numbers can be reused or associated with wrong business
        if (searchDomain && placeDomain && searchDomain !== placeDomain) {
          score += 30; // Reduced value - domain mismatch suggests wrong business
          console.log(`Google Places: Phone match BUT domain mismatch (${placeDomain} vs ${searchDomain}) - reduced score`);
        } else if (searchDomain && !placeDomain) {
          score += 60; // Place has no website to verify against
          console.log(`Google Places: Phone match, place has no website to verify`);
        } else {
          score += 80; // Full phone match value
          console.log(`Google Places: Phone match! ${searchPhone}`);
        }
      } else if (partialPhoneMatches) {
        score += 40;
        console.log(`Google Places: Last 7 digits match! ${searchPhone.slice(-7)}`);
      }
      
      // Direct full name match (50 points)
      if (placeName.includes(normalizedSearch) || normalizedSearch.includes(placeName)) {
        score += 50;
        console.log(`Google Places: Full name match!`);
      }
      
      // First distinctive word match (30 points) - e.g., "Vinings" must appear
      if (firstDistinctiveWord && placeWords.some(pw => pw.includes(firstDistinctiveWord) || firstDistinctiveWord.includes(pw))) {
        score += 30;
        console.log(`Google Places: Distinctive word "${firstDistinctiveWord}" found!`);
      }
      
      // Multiple word matches (5 points each)
      const matchingWords = searchWords.filter(w => placeWords.some(pw => pw.includes(w) || w.includes(pw)));
      score += matchingWords.length * 5;
      
      // State match bonus (15 points) - prefer results in the same state
      if (searchState && placeAddress.includes(searchState)) {
        score += 15;
        console.log(`Google Places: State match! ${searchState}`);
      } else if (searchState && !placeAddress.includes(searchState) && score > 0) {
        // Penalize results in wrong state (-20 points) only if we have some match
        score -= 20;
        console.log(`Google Places: Wrong state penalty (wanted ${searchState})`);
      }
      
      console.log(`Google Places: Score for "${place.displayName?.text}": ${score}`);
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = place;
      }
    }
    
    // Require minimum confidence: phone match (100+) OR first distinctive word + other match (35+)
    const minimumScore = 30;
    if (bestScore < minimumScore) {
      console.log(`Google Places: No confident match found (best score: ${bestScore}, need ${minimumScore}). First distinctive word: "${firstDistinctiveWord}"`);
      return c.json({ 
        success: true, 
        data: null,
        message: `No confident match found (score: ${bestScore})`,
        searchedFor: businessName,
        firstDistinctiveWord
      });
    }
    
    console.log(`Google Places: Best match score: ${bestScore} for "${bestMatch?.displayName?.text}"`);
    
    // Safety check (should not happen since we checked minimumScore)
    if (!bestMatch) {
      return c.json({ success: true, data: null, message: "No match found" });
    }
    
    // Format reviews
    const reviews = bestMatch.reviews?.slice(0, 5).map((review: any) => ({
      text: review.text?.text || '',
      rating: review.rating,
      timeAgo: review.relativePublishTimeDescription,
      author: review.authorAttribution?.displayName
    })) || [];
    
    return c.json({
      success: true,
      data: {
        placeId: bestMatch.id as string,
        name: bestMatch.displayName?.text as string,
        address: bestMatch.formattedAddress as string,
        rating: bestMatch.rating as number,
        reviewCount: bestMatch.userRatingCount as number,
        reviews: reviews as Array<{ text: string; rating: number; timeAgo: string; author: string }>,
        website: bestMatch.websiteUri as string,
        phone: bestMatch.nationalPhoneNumber as string,
        businessStatus: bestMatch.businessStatus as string,
        foundViaPhone: !businessName && !!phone
      }
    } as any);
    
  } catch (error) {
    console.error("Google Places lookup error:", error);
    return c.json({ 
      success: false, 
      error: "Failed to search Google Places",
      details: error instanceof Error ? error.message : "Unknown error",
      data: null 
    }, 500);
  }
});

// ============================================
// CONTRACTOR RESEARCH - Gemini Search Grounding
// ============================================

interface ContractorResearchResult {
  summary: string;
  reputation: {
    score: 'excellent' | 'good' | 'mixed' | 'concerning' | 'unknown';
    highlights: string[];
    concerns: string[];
  };
  sources: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
  bbbStatus: string | null;
  bbbComplaints: {
    total: number | null;
    lastThreeYears: number | null;
    resolved: number | null;
    details: string | null;
  } | null;
  businessRegistration: {
    status: 'active' | 'inactive' | 'dissolved' | 'unknown';
    entity: string | null;
    registeredState: string | null;
    notes: string | null;
  } | null;
  permitHistory: {
    recentPermits: number | null;
    totalValue: string | null;
    notes: string | null;
  } | null;
  newsItems: string[];
  redFlags: string[];
}

app.post("/api/contractor/research", async (c) => {
  const apiKey = (c.env as unknown as Record<string, unknown>).GEMINI_API_KEY as string | undefined;
  
  if (!apiKey) {
    return c.json({ 
      success: false, 
      error: "Gemini API key not configured" 
    }, 503);
  }
  
  const body = await c.req.json() as { 
    businessName: string; 
    city?: string; 
    state?: string;
    licenseNumber?: string;
  };
  
  const { businessName, city, state, licenseNumber } = body;
  
  if (!businessName) {
    return c.json({ 
      success: false, 
      error: "Business name is required" 
    }, 400);
  }
  
  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Build search context
    const locationContext = [city, state].filter(Boolean).join(", ");
    const licenseContext = licenseNumber ? `License #: ${licenseNumber}` : "";
    
    // Build search queries that are more likely to find specific results
    const searchName = businessName.replace(/\s+(Inc|LLC|Corp|Co|Ltd|LP)\.?$/i, '').trim();
    const bbbSearchQuery = `site:bbb.org "${searchName}"${state ? ` ${state}` : ''}`;
    
    // Use BuildZoom and license aggregators - the GA GOALS database (goals.sos.ga.gov) is a dynamic form Google can't crawl
    const licenseSearchQuery = state === 'GA'
      ? `"${searchName}" Georgia contractor license RBCO OR GCCO OR RLCO`
      : state 
        ? `"${searchName}" ${state} contractor license`
        : `"${searchName}" contractor license`;
    
    const researchPrompt = `Research this home improvement contractor thoroughly using web search:

CONTRACTOR TO RESEARCH:
- Business Name: ${businessName}
- Search variations: "${searchName}"
${locationContext ? `- Location: ${locationContext}` : ""}
${licenseContext}

REQUIRED SEARCHES - You MUST search for each of these:

1. BETTER BUSINESS BUREAU: Search "${bbbSearchQuery}" to find their BBB profile.
   Look for: accreditation status, letter grade (A+, A, B, etc.), years in business.
   CRITICALLY IMPORTANT: Look for complaint count - BBB pages show "X complaints closed in last 3 years" and total complaints filed.
   Note if complaints are resolved vs unresolved.

2. CONTRACTOR LICENSE: Search "${licenseSearchQuery}" to find their state contractor license.
   Also search "site:buildzoom.com ${searchName}" - BuildZoom indexes state license records.
   ${state === 'GA' ? 'Georgia license prefixes: RBCO (Residential Basic Company), GCCO (General Commercial), RLCO (Residential Light Commercial), RLQA (Qualifying Agent).' : ''}
   Look for: the actual license NUMBER (alphanumeric ID like RBCO006955 or RLCO004869), license status (Active/Inactive), license type.

3. BUSINESS ENTITY: Search "${searchName}" secretary of state ${state || ''} business registration.
   Look for: entity status (Active/Inactive/Dissolved), registered name, formation date.

4. GOOGLE REVIEWS/MAPS: Search "${searchName} contractor reviews" for customer feedback.

5. REVIEW SITES - Search these specific platforms:
   - Yelp: "site:yelp.com ${searchName}${state ? ` ${state}` : ''}"
   - Angi/HomeAdvisor: "site:angi.com ${searchName}"
   - Thumbtack: "site:thumbtack.com ${searchName}"
   - BuildZoom: "site:buildzoom.com ${searchName}"
   Look for: star ratings, review counts, specific customer feedback patterns.

6. NEWS & COMPLAINTS: Search "${searchName} contractor complaints" or "${searchName} lawsuit" for any issues.

Based on your search findings, return ONLY this JSON object (no markdown, no text before/after):
{
  "summary": "2-3 sentence assessment based on what you found",
  "reputation": {
    "score": "excellent|good|mixed|concerning|unknown",
    "highlights": ["specific positive finding from search"],
    "concerns": ["specific concern from search"]
  },
  "bbbStatus": "The exact BBB rating/grade you found (A+, A, B, etc.) or 'Not Accredited' or 'Not Found'",
  "bbbComplaints": {
    "total": "Total number of complaints ever filed, or null if not found",
    "lastThreeYears": "Number of complaints closed in last 3 years (BBB usually shows this), or null",
    "resolved": "Number that were resolved, or null if not specified",
    "details": "Brief summary of complaint types or patterns if mentioned, or null"
  },
  "businessRegistration": {
    "status": "active|inactive|dissolved|unknown",
    "entity": "Exact entity name from state records or null",
    "registeredState": "${state || 'null'}",
    "licenseNumber": "IMPORTANT: Extract the actual license/registration number here (e.g. RBCO006955, GCCO123456, CR123456). This is the alphanumeric ID. Put it here, not in notes.",
    "notes": "Other details like issue date, license type name, etc. Do NOT put the license number here."
  },
  "permitHistory": {
    "recentPermits": null,
    "totalValue": null,
    "notes": "Any permit info found or null"
  },
  "newsItems": ["Relevant news headlines found"],
  "redFlags": ["Serious warning signs only"]
}

IMPORTANT: Return actual data you find via search. Do not fabricate or assume - if you can't find something, use null.`;

    // Note: Cannot use responseMimeType: "application/json" with googleSearch tool
    // They are mutually exclusive in the Gemini API
    // Retry logic with exponential backoff for intermittent empty responses
    let responseText = '';
    let lastResponse: { candidates?: Array<{ groundingMetadata?: { groundingChunks?: Array<{ web?: { title?: string; uri?: string } }> } }> } | null = null;
    let lastError: unknown = null;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: researchPrompt,
          config: {
            tools: [{ googleSearch: {} }],
            thinkingConfig: { thinkingBudget: 0 }
          }
        });
        
        responseText = response.text || '';
        lastResponse = response;
        
        // Check if we got a valid response
        if (responseText.length > 50 && responseText.includes('{')) {
          break; // Success - exit retry loop
        }
        
        // Empty or invalid response - retry
        console.warn(`Contractor research attempt ${attempt}/${maxRetries}: Empty/invalid response (length: ${responseText.length})`);
        lastError = new Error(`Empty response on attempt ${attempt}`);
        
        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      } catch (err) {
        console.error(`Contractor research attempt ${attempt}/${maxRetries} failed:`, err);
        lastError = err;
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    
    // If all retries failed with empty response, log it
    if (responseText.length < 50) {
      console.error(`Contractor research failed after ${maxRetries} attempts. Last error:`, lastError);
    }
    
    // Extract grounding metadata (sources) if available
    const sources: Array<{ title: string; url: string; snippet: string }> = [];
    if (lastResponse?.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      for (const chunk of lastResponse.candidates[0].groundingMetadata.groundingChunks) {
        if (chunk.web) {
          sources.push({
            title: chunk.web.title || 'Source',
            url: chunk.web.uri || '',
            snippet: ''
          });
        }
      }
    }
    
    // Parse the JSON response from text (since we can't use responseMimeType with search)
    let researchData: Partial<ContractorResearchResult>;
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanedText = responseText.replace(/```json\n?|\n?```/g, '').trim();
      
      // Try to extract JSON object if there's surrounding text
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedText = jsonMatch[0];
      }
      
      researchData = JSON.parse(cleanedText);
    } catch (parseError) {
      // Enhanced logging for JSON parse failures (#52)
      console.error("=== Contractor Research JSON Parse Error ===");
      console.error("Parse error:", parseError);
      console.error("Raw response length:", responseText.length);
      console.error("First 500 chars:", responseText.slice(0, 500));
      console.error("Last 500 chars:", responseText.slice(-500));
      console.error("========================================");
      
      // Return a structured error response with debug info
      return c.json({
        success: true,
        data: {
          summary: "Unable to complete comprehensive research at this time.",
          reputation: {
            score: 'unknown',
            highlights: [],
            concerns: []
          },
          sources: [],
          bbbStatus: null,
          newsItems: [],
          redFlags: [],
          rawResponse: responseText.slice(0, 500),
          parseError: String(parseError)
        }
      });
    }
    
    return c.json({
      success: true,
      data: {
        summary: researchData.summary || "Research completed.",
        reputation: researchData.reputation || { score: 'unknown', highlights: [], concerns: [] },
        sources: sources.length > 0 ? sources : (researchData.sources || []),
        bbbStatus: researchData.bbbStatus || null,
        bbbComplaints: researchData.bbbComplaints || null,
        businessRegistration: researchData.businessRegistration || null,
        permitHistory: researchData.permitHistory || null,
        newsItems: researchData.newsItems || [],
        redFlags: researchData.redFlags || []
      }
    });
    
  } catch (error) {
    console.error("Contractor research error:", error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Research failed",
      details: error instanceof Error ? error.stack?.slice(0, 200) : undefined
    }, 500);
  }
});

// ============================================
// REVIEW SENTIMENT ANALYSIS
// ============================================

import { 
  buildReviewSentimentPrompt, 
  generateFallbackSentiment,
  type ReviewData,
  type ReviewSentimentResult
} from "@/shared/reviewSentiment";

app.post("/api/contractor/review-sentiment", async (c) => {
  const apiKey = (c.env as unknown as Record<string, unknown>).GEMINI_API_KEY as string | undefined;
  
  if (!apiKey) {
    return c.json({ 
      success: false, 
      error: "Gemini API key not configured" 
    }, 503);
  }
  
  const body = await c.req.json() as { 
    reviews: ReviewData[]; 
    contractorName?: string;
  };
  
  const { reviews, contractorName } = body;
  
  if (!reviews || reviews.length === 0) {
    return c.json({ 
      success: false, 
      error: "No reviews provided" 
    }, 400);
  }
  
  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = buildReviewSentimentPrompt({ reviews, contractorName });
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.3,
        responseMimeType: "application/json"
      }
    });
    
    const responseText = response.text || '';
    
    // Parse JSON response
    let sentimentData: Partial<ReviewSentimentResult>;
    try {
      let cleanedText = responseText.replace(/```json\n?|\n?```/g, '').trim();
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedText = jsonMatch[0];
      }
      sentimentData = JSON.parse(cleanedText);
    } catch {
      // Fallback if parsing fails
      const fallback = generateFallbackSentiment(reviews);
      return c.json({ success: true, data: fallback });
    }
    
    // Calculate average rating from reviews
    const ratings = reviews.filter(r => r.rating).map(r => r.rating!);
    const avgRating = ratings.length > 0 
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
      : null;
    
    return c.json({
      success: true,
      data: {
        positiveFeelingsPercent: sentimentData.positiveFeelingsPercent ?? 50,
        positiveOutcomesPercent: sentimentData.positiveOutcomesPercent ?? 50,
        professionalismPercent: sentimentData.professionalismPercent ?? 50,
        negativePercent: sentimentData.negativePercent ?? 10,
        keyThemes: sentimentData.keyThemes || [],
        sampleQuotes: sentimentData.sampleQuotes || { positive: null, negative: null },
        reviewCount: reviews.length,
        averageRating: avgRating,
        confidence: sentimentData.confidence || 'medium'
      }
    });
    
  } catch (error) {
    console.error("Review sentiment analysis error:", error);
    const fallback = generateFallbackSentiment(reviews);
    return c.json({ success: true, data: fallback });
  }
});

// ============================================
// GEMINI-ENHANCED SCOPE ANALYSIS
// ============================================

interface ScopeAnalysisRequest {
  bidText: string;
  projectType: string;
}

interface GeminiScopeItem {
  name: string;
  category: string;
  confidence: 'explicit' | 'implied' | 'missing';
  importance: 'critical' | 'important' | 'nice-to-have';
  evidence?: string;
  questionToAsk?: string;
}

interface GeminiScopeResult {
  includedItems: GeminiScopeItem[];
  missingItems: GeminiScopeItem[];
  summary: string;
  scopeScore: number;
}

app.post("/api/scope-analysis", async (c) => {
  const apiKey = (c.env as unknown as Record<string, unknown>).GEMINI_API_KEY as string | undefined;
  
  if (!apiKey) {
    return c.json({ 
      success: false, 
      error: "Gemini API key not configured" 
    }, 503);
  }
  
  const body = await c.req.json() as ScopeAnalysisRequest;
  const { bidText, projectType } = body;
  
  if (!bidText) {
    return c.json({ 
      success: false, 
      error: "Bid text is required" 
    }, 400);
  }
  
  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const scopePrompt = `Analyze this contractor bid/estimate and identify what work is included and what typical items for this project type might be missing.

PROJECT TYPE: ${projectType || 'general remodel'}

BID/ESTIMATE TEXT:
${bidText.slice(0, 8000)}

For a ${projectType || 'home improvement'} project, analyze the bid and provide:

1. INCLUDED ITEMS: What work is explicitly mentioned or clearly implied in this bid?
2. MISSING ITEMS: What typical items for this project type are NOT mentioned that the homeowner should ask about?

For each item, categorize by:
- Category: materials, labor, permits, disposal, protection, preparation, finishing, fixtures, structural, electrical, plumbing, hvac
- Importance: critical (must-have for project completion), important (standard practice), nice-to-have (upgrades/extras)
- Confidence: explicit (clearly stated), implied (reasonably assumed), missing (not mentioned)

Consider these common gaps in contractor bids:
- Permit costs and who pulls them
- Debris removal and dump fees
- Floor/surface protection during work
- Patching/repair of adjacent areas
- Final cleanup
- Touch-up paint after installation
- Trim/molding work
- Hardware/fixtures
- Warranty terms

Return your analysis in this exact JSON format:
{
  "includedItems": [
    {
      "name": "Item name",
      "category": "category from list above",
      "confidence": "explicit|implied",
      "importance": "critical|important|nice-to-have",
      "evidence": "Quote or reference from bid that shows this is included"
    }
  ],
  "missingItems": [
    {
      "name": "Item name",
      "category": "category from list above",
      "confidence": "missing",
      "importance": "critical|important|nice-to-have",
      "questionToAsk": "Specific question homeowner should ask contractor about this item"
    }
  ],
  "summary": "2-3 sentence summary of the bid's scope completeness",
  "scopeScore": 75
}

The scopeScore should be 0-100 where:
- 90-100: Very comprehensive, covers nearly everything
- 75-89: Good coverage with minor gaps
- 60-74: Acceptable but notable omissions
- 40-59: Several important items unclear or missing
- Below 40: Major scope concerns

Be specific and practical. Focus on items that matter for project success.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: scopePrompt,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 },
        temperature: 0  // Deterministic output for consistent scope analysis
      }
    });

    const responseText = response.text || "";
    
    let scopeData: GeminiScopeResult;
    try {
      // Clean up any markdown formatting
      const cleanedText = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      scopeData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Scope analysis JSON parse error:", parseError);
      console.error("Response preview:", responseText.slice(0, 500));
      
      return c.json({
        success: false,
        error: "Failed to parse AI response",
        rawResponse: responseText.slice(0, 300)
      }, 500);
    }
    
    return c.json({
      success: true,
      data: {
        includedItems: scopeData.includedItems || [],
        missingItems: scopeData.missingItems || [],
        summary: scopeData.summary || "Analysis complete.",
        scopeScore: scopeData.scopeScore ?? 70,
        source: 'gemini'
      }
    });
    
  } catch (error) {
    console.error("Scope analysis error:", error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Analysis failed"
    }, 500);
  }
});

// ============================================
// LINE ITEM EXTRACTION & COST ALLOCATION
// ============================================
import { 
  analyzeAllocation, 
  analyzeAllTradeSplits,
  type LineItem
} from "@/shared/costAllocationEngine";

interface ExtractLineItemsRequest {
  bidText: string;
  bidTotal?: number;
  projectType?: string;
}

interface ExtractedLineItem {
  description: string;
  amount: number;
  category: 'labor' | 'material' | 'permit' | 'overhead' | 'contingency' | 'profit' | 'unknown';
  trade?: string;
  laborAmount?: number;
  materialAmount?: number;
}

app.post("/api/extract-line-items", async (c) => {
  const apiKey = (c.env as unknown as Record<string, unknown>).GEMINI_API_KEY as string | undefined;
  
  if (!apiKey) {
    return c.json({ 
      success: false, 
      error: "Gemini API key not configured" 
    }, 503);
  }
  
  const body = await c.req.json() as ExtractLineItemsRequest;
  const { bidText, bidTotal, projectType } = body;
  
  if (!bidText) {
    return c.json({ 
      success: false, 
      error: "Bid text is required" 
    }, 400);
  }
  
  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const extractionPrompt = `Extract all line items from this contractor bid/estimate and categorize each one.

BID TEXT:
${bidText.slice(0, 10000)}

${bidTotal ? `TOTAL BID AMOUNT: $${bidTotal.toLocaleString()}` : ''}
${projectType ? `PROJECT TYPE: ${projectType}` : ''}

For each line item, extract:
1. description: The work/item described
2. amount: Dollar amount (number only, no symbols)
3. category: One of: labor, material, permit, overhead, contingency, profit, unknown
4. trade: If identifiable (painting, electrical, plumbing, roofing, hvac, flooring, drywall, cabinets, countertops, tile, carpentry, demolition, etc.)
5. laborAmount: If the line item breaks down labor separately (number only)
6. materialAmount: If the line item breaks down materials separately (number only)

Guidelines for categorization:
- Labor: Installation, workmanship, "labor for X", hourly rates, crew costs
- Material: Products, supplies, fixtures, equipment, "materials for X"
- Permit: Building permits, inspection fees, plan review
- Overhead: Supervision, project management, insurance, bonding
- Contingency: Allowances, "unforeseen", cushion amounts
- Profit: Markup, margin (usually not explicitly stated)
- Unknown: Can't determine category

Return JSON array of line items:
{
  "lineItems": [
    {
      "description": "Install kitchen cabinets",
      "amount": 4500,
      "category": "labor",
      "trade": "cabinets"
    },
    {
      "description": "Shaker-style cabinets",
      "amount": 8000,
      "category": "material",
      "trade": "cabinets"
    }
  ],
  "summary": {
    "laborTotal": 12000,
    "materialTotal": 25000,
    "otherTotal": 3000,
    "itemCount": 15
  }
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: extractionPrompt }] }],
      config: {
        responseMimeType: "application/json",
        temperature: 0.1
      }
    });
    
    const responseText = response.text || '{"lineItems": [], "summary": {}}';
    
    let parsed: { lineItems: ExtractedLineItem[]; summary?: Record<string, number> };
    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = { lineItems: [], summary: {} };
    }
    
    // Analyze allocation using our engine
    const lineItems: LineItem[] = parsed.lineItems.map(item => ({
      description: item.description,
      amount: item.amount || 0,
      category: item.category || 'unknown',
      trade: item.trade,
      laborAmount: item.laborAmount,
      materialAmount: item.materialAmount
    }));
    
    const allocationResult = analyzeAllocation(lineItems, bidTotal || 0, projectType);
    const tradeSplits = analyzeAllTradeSplits(lineItems);
    
    return c.json({
      success: true,
      data: {
        lineItems: parsed.lineItems,
        summary: parsed.summary,
        allocation: allocationResult,
        tradeSplits,
        source: 'gemini'
      }
    });
    
  } catch (error) {
    console.error("Line item extraction error:", error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Extraction failed"
    }, 500);
  }
});

// ============================================
// BLS OEWS DATA SEEDING & MARKET RATES
// ============================================
// ZIP/MSA lookup functions imported from @/shared/lazyData/zipMsaLookup

// NOTE: ZIP_TO_MSA and ZIP_PREFIX_TO_STATE data moved to src/shared/lazyData/zipMsaLookup.ts
// to reduce cold start times via lazy loading
// ZIP/MSA data and lookupZipInfo() function now imported from @/shared/lazyData/zipMsaLookup

// Seed BLS OEWS data into database
/*app.post("/api/admin/seed-bls-data", async (c) => {
  try {
    const db = c.env.DB;
    
    // DELETE_MARKER
  '30331': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
  '30332': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
  '30334': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
  '30336': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
  '30337': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
  '30338': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
  '30339': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
  '30340': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
  '30341': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
  '30342': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
  '30344': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
  '30345': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
  '30346': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
  '30349': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
  '30350': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
  '30354': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
  '30360': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
  '30363': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
  // Alpharetta/Johns Creek/Roswell
  '30004': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
  '30005': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
  '30009': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
  '30022': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
  '30024': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
  '30075': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
  '30076': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
  '30097': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
  // Marietta/Kennesaw
  '30060': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
  '30062': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
  '30064': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
  '30066': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
  '30067': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
  '30068': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
  '30144': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
  '30152': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
  // Decatur/Stone Mountain
  '30030': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
  '30032': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
  '30033': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
  '30034': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
  '30035': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
  '30058': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
  '30083': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
  '30084': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
  '30087': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
  // Dallas Metro (19100)
  '75201': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', stateCode: 'TX' },
  '75202': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', stateCode: 'TX' },
  '75204': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', stateCode: 'TX' },
  '75205': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', stateCode: 'TX' },
  '75206': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', stateCode: 'TX' },
  '75209': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', stateCode: 'TX' },
  '75214': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', stateCode: 'TX' },
  '75219': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', stateCode: 'TX' },
  '75225': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', stateCode: 'TX' },
  '75230': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', stateCode: 'TX' },
  '75240': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', stateCode: 'TX' },
  // Houston Metro (26420)
  '77001': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', stateCode: 'TX' },
  '77002': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', stateCode: 'TX' },
  '77003': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', stateCode: 'TX' },
  '77004': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', stateCode: 'TX' },
  '77005': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', stateCode: 'TX' },
  '77006': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', stateCode: 'TX' },
  '77007': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', stateCode: 'TX' },
  '77008': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', stateCode: 'TX' },
  '77019': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', stateCode: 'TX' },
  '77024': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', stateCode: 'TX' },
  '77025': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', stateCode: 'TX' },
  // Phoenix Metro (38060)
  '85001': { msaCode: '38060', msaName: 'Phoenix-Mesa-Chandler, AZ', stateCode: 'AZ' },
  '85003': { msaCode: '38060', msaName: 'Phoenix-Mesa-Chandler, AZ', stateCode: 'AZ' },
  '85004': { msaCode: '38060', msaName: 'Phoenix-Mesa-Chandler, AZ', stateCode: 'AZ' },
  '85006': { msaCode: '38060', msaName: 'Phoenix-Mesa-Chandler, AZ', stateCode: 'AZ' },
  '85008': { msaCode: '38060', msaName: 'Phoenix-Mesa-Chandler, AZ', stateCode: 'AZ' },
  '85012': { msaCode: '38060', msaName: 'Phoenix-Mesa-Chandler, AZ', stateCode: 'AZ' },
  '85014': { msaCode: '38060', msaName: 'Phoenix-Mesa-Chandler, AZ', stateCode: 'AZ' },
  '85016': { msaCode: '38060', msaName: 'Phoenix-Mesa-Chandler, AZ', stateCode: 'AZ' },
  '85018': { msaCode: '38060', msaName: 'Phoenix-Mesa-Chandler, AZ', stateCode: 'AZ' },
  '85020': { msaCode: '38060', msaName: 'Phoenix-Mesa-Chandler, AZ', stateCode: 'AZ' },
  // Miami Metro (33100)
  '33101': { msaCode: '33100', msaName: 'Miami-Fort Lauderdale-Pompano Beach, FL', stateCode: 'FL' },
  '33109': { msaCode: '33100', msaName: 'Miami-Fort Lauderdale-Pompano Beach, FL', stateCode: 'FL' },
  '33125': { msaCode: '33100', msaName: 'Miami-Fort Lauderdale-Pompano Beach, FL', stateCode: 'FL' },
  '33127': { msaCode: '33100', msaName: 'Miami-Fort Lauderdale-Pompano Beach, FL', stateCode: 'FL' },
  '33129': { msaCode: '33100', msaName: 'Miami-Fort Lauderdale-Pompano Beach, FL', stateCode: 'FL' },
  '33130': { msaCode: '33100', msaName: 'Miami-Fort Lauderdale-Pompano Beach, FL', stateCode: 'FL' },
  '33131': { msaCode: '33100', msaName: 'Miami-Fort Lauderdale-Pompano Beach, FL', stateCode: 'FL' },
  '33132': { msaCode: '33100', msaName: 'Miami-Fort Lauderdale-Pompano Beach, FL', stateCode: 'FL' },
  '33133': { msaCode: '33100', msaName: 'Miami-Fort Lauderdale-Pompano Beach, FL', stateCode: 'FL' },
  '33134': { msaCode: '33100', msaName: 'Miami-Fort Lauderdale-Pompano Beach, FL', stateCode: 'FL' },
  // Los Angeles Metro (31080)
  '90001': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', stateCode: 'CA' },
  '90004': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', stateCode: 'CA' },
  '90005': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', stateCode: 'CA' },
  '90006': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', stateCode: 'CA' },
  '90007': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', stateCode: 'CA' },
  '90010': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', stateCode: 'CA' },
  '90012': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', stateCode: 'CA' },
  '90013': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', stateCode: 'CA' },
  '90014': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', stateCode: 'CA' },
  '90015': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', stateCode: 'CA' },
  // New York Metro (35620)
  '10001': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', stateCode: 'NY' },
  '10002': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', stateCode: 'NY' },
  '10003': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', stateCode: 'NY' },
  '10004': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', stateCode: 'NY' },
  '10005': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', stateCode: 'NY' },
  '10006': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', stateCode: 'NY' },
  '10007': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', stateCode: 'NY' },
  '10009': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', stateCode: 'NY' },
  '10010': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', stateCode: 'NY' },
  '10011': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', stateCode: 'NY' },
  // Chicago Metro (16980)
  '60601': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', stateCode: 'IL' },
  '60602': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', stateCode: 'IL' },
  '60603': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', stateCode: 'IL' },
  '60604': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', stateCode: 'IL' },
  '60605': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', stateCode: 'IL' },
  '60606': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', stateCode: 'IL' },
  '60607': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', stateCode: 'IL' },
  '60608': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', stateCode: 'IL' },
  '60610': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', stateCode: 'IL' },
  '60611': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', stateCode: 'IL' },
  // Denver Metro (19740)
  '80202': { msaCode: '19740', msaName: 'Denver-Aurora-Lakewood, CO', stateCode: 'CO' },
  '80203': { msaCode: '19740', msaName: 'Denver-Aurora-Lakewood, CO', stateCode: 'CO' },
  '80204': { msaCode: '19740', msaName: 'Denver-Aurora-Lakewood, CO', stateCode: 'CO' },
  '80205': { msaCode: '19740', msaName: 'Denver-Aurora-Lakewood, CO', stateCode: 'CO' },
  '80206': { msaCode: '19740', msaName: 'Denver-Aurora-Lakewood, CO', stateCode: 'CO' },
  '80209': { msaCode: '19740', msaName: 'Denver-Aurora-Lakewood, CO', stateCode: 'CO' },
  '80210': { msaCode: '19740', msaName: 'Denver-Aurora-Lakewood, CO', stateCode: 'CO' },
  '80211': { msaCode: '19740', msaName: 'Denver-Aurora-Lakewood, CO', stateCode: 'CO' },
  '80212': { msaCode: '19740', msaName: 'Denver-Aurora-Lakewood, CO', stateCode: 'CO' },
  '80214': { msaCode: '19740', msaName: 'Denver-Aurora-Lakewood, CO', stateCode: 'CO' },
  // Seattle Metro (42660)
  '98101': { msaCode: '42660', msaName: 'Seattle-Tacoma-Bellevue, WA', stateCode: 'WA' },
  '98102': { msaCode: '42660', msaName: 'Seattle-Tacoma-Bellevue, WA', stateCode: 'WA' },
  '98103': { msaCode: '42660', msaName: 'Seattle-Tacoma-Bellevue, WA', stateCode: 'WA' },
  '98104': { msaCode: '42660', msaName: 'Seattle-Tacoma-Bellevue, WA', stateCode: 'WA' },
  '98105': { msaCode: '42660', msaName: 'Seattle-Tacoma-Bellevue, WA', stateCode: 'WA' },
  '98107': { msaCode: '42660', msaName: 'Seattle-Tacoma-Bellevue, WA', stateCode: 'WA' },
  '98109': { msaCode: '42660', msaName: 'Seattle-Tacoma-Bellevue, WA', stateCode: 'WA' },
  '98112': { msaCode: '42660', msaName: 'Seattle-Tacoma-Bellevue, WA', stateCode: 'WA' },
  '98115': { msaCode: '42660', msaName: 'Seattle-Tacoma-Bellevue, WA', stateCode: 'WA' },
  '98116': { msaCode: '42660', msaName: 'Seattle-Tacoma-Bellevue, WA', stateCode: 'WA' },
};

// Infer state from ZIP code first 3 digits
const ZIP_PREFIX_TO_STATE: Record<string, string> = {
  // Georgia (300-319, 398-399)
  '300': 'GA', '301': 'GA', '302': 'GA', '303': 'GA', '304': 'GA', '305': 'GA', '306': 'GA', '307': 'GA', '308': 'GA', '309': 'GA',
  '310': 'GA', '311': 'GA', '312': 'GA', '313': 'GA', '314': 'GA', '315': 'GA', '316': 'GA', '317': 'GA', '318': 'GA', '319': 'GA',
  '398': 'GA', '399': 'GA',
  // Texas (750-799)
  '750': 'TX', '751': 'TX', '752': 'TX', '753': 'TX', '754': 'TX', '755': 'TX', '756': 'TX', '757': 'TX', '758': 'TX', '759': 'TX',
  '760': 'TX', '761': 'TX', '762': 'TX', '763': 'TX', '764': 'TX', '765': 'TX', '766': 'TX', '767': 'TX', '768': 'TX', '769': 'TX',
  '770': 'TX', '771': 'TX', '772': 'TX', '773': 'TX', '774': 'TX', '775': 'TX', '776': 'TX', '777': 'TX', '778': 'TX', '779': 'TX',
  '780': 'TX', '781': 'TX', '782': 'TX', '783': 'TX', '784': 'TX', '785': 'TX', '786': 'TX', '787': 'TX', '788': 'TX', '789': 'TX',
  '790': 'TX', '791': 'TX', '792': 'TX', '793': 'TX', '794': 'TX', '795': 'TX', '796': 'TX', '797': 'TX', '798': 'TX', '799': 'TX',
  // Florida (320-349)
  '320': 'FL', '321': 'FL', '322': 'FL', '323': 'FL', '324': 'FL', '325': 'FL', '326': 'FL', '327': 'FL', '328': 'FL', '329': 'FL',
  '330': 'FL', '331': 'FL', '332': 'FL', '333': 'FL', '334': 'FL', '335': 'FL', '336': 'FL', '337': 'FL', '338': 'FL', '339': 'FL',
  '340': 'FL', '341': 'FL', '342': 'FL', '344': 'FL', '346': 'FL', '347': 'FL', '349': 'FL',
  // California (900-961)
  '900': 'CA', '901': 'CA', '902': 'CA', '903': 'CA', '904': 'CA', '905': 'CA', '906': 'CA', '907': 'CA', '908': 'CA', '909': 'CA',
  '910': 'CA', '911': 'CA', '912': 'CA', '913': 'CA', '914': 'CA', '915': 'CA', '916': 'CA', '917': 'CA', '918': 'CA', '919': 'CA',
  '920': 'CA', '921': 'CA', '922': 'CA', '923': 'CA', '924': 'CA', '925': 'CA', '926': 'CA', '927': 'CA', '928': 'CA',
  '930': 'CA', '931': 'CA', '932': 'CA', '933': 'CA', '934': 'CA', '935': 'CA', '936': 'CA', '937': 'CA', '938': 'CA', '939': 'CA',
  '940': 'CA', '941': 'CA', '942': 'CA', '943': 'CA', '944': 'CA', '945': 'CA', '946': 'CA', '947': 'CA', '948': 'CA', '949': 'CA',
  '950': 'CA', '951': 'CA', '952': 'CA', '953': 'CA', '954': 'CA', '955': 'CA', '956': 'CA', '957': 'CA', '958': 'CA', '959': 'CA',
  '960': 'CA', '961': 'CA',
  // New York (100-149)
  '100': 'NY', '101': 'NY', '102': 'NY', '103': 'NY', '104': 'NY', '105': 'NY', '106': 'NY', '107': 'NY', '108': 'NY', '109': 'NY',
  '110': 'NY', '111': 'NY', '112': 'NY', '113': 'NY', '114': 'NY', '115': 'NY', '116': 'NY', '117': 'NY', '118': 'NY', '119': 'NY',
  '120': 'NY', '121': 'NY', '122': 'NY', '123': 'NY', '124': 'NY', '125': 'NY', '126': 'NY', '127': 'NY', '128': 'NY', '129': 'NY',
  '130': 'NY', '131': 'NY', '132': 'NY', '133': 'NY', '134': 'NY', '135': 'NY', '136': 'NY', '137': 'NY', '138': 'NY', '139': 'NY',
  '140': 'NY', '141': 'NY', '142': 'NY', '143': 'NY', '144': 'NY', '145': 'NY', '146': 'NY', '147': 'NY', '148': 'NY', '149': 'NY',
  // Arizona (850-865)
  '850': 'AZ', '851': 'AZ', '852': 'AZ', '853': 'AZ', '855': 'AZ', '856': 'AZ', '857': 'AZ', '858': 'AZ', '859': 'AZ',
  '860': 'AZ', '863': 'AZ', '864': 'AZ', '865': 'AZ',
  // North Carolina (270-289)
  '270': 'NC', '271': 'NC', '272': 'NC', '273': 'NC', '274': 'NC', '275': 'NC', '276': 'NC', '277': 'NC', '278': 'NC', '279': 'NC',
  '280': 'NC', '281': 'NC', '282': 'NC', '283': 'NC', '284': 'NC', '285': 'NC', '286': 'NC', '287': 'NC', '288': 'NC', '289': 'NC',
  // Colorado (800-816)
  '800': 'CO', '801': 'CO', '802': 'CO', '803': 'CO', '804': 'CO', '805': 'CO', '806': 'CO', '807': 'CO', '808': 'CO', '809': 'CO',
  '810': 'CO', '811': 'CO', '812': 'CO', '813': 'CO', '814': 'CO', '815': 'CO', '816': 'CO',
  // Washington (980-994)
  '980': 'WA', '981': 'WA', '982': 'WA', '983': 'WA', '984': 'WA', '985': 'WA', '986': 'WA', '988': 'WA', '989': 'WA',
  '990': 'WA', '991': 'WA', '992': 'WA', '993': 'WA', '994': 'WA',
  // Illinois (600-629)
  '600': 'IL', '601': 'IL', '602': 'IL', '603': 'IL', '604': 'IL', '605': 'IL', '606': 'IL', '607': 'IL', '608': 'IL', '609': 'IL',
  '610': 'IL', '611': 'IL', '612': 'IL', '613': 'IL', '614': 'IL', '615': 'IL', '616': 'IL', '617': 'IL', '618': 'IL', '619': 'IL',
  '620': 'IL', '622': 'IL', '623': 'IL', '624': 'IL', '625': 'IL', '626': 'IL', '627': 'IL', '628': 'IL', '629': 'IL',
};

// Lookup ZIP info (MSA if available, or state)
function lookupZipInfo(zipCode: string): { stateCode: string; msaCode?: string; msaName?: string } {
  // First try exact ZIP match for MSA
  const msaInfo = ZIP_TO_MSA[zipCode];
  if (msaInfo) {
    return msaInfo;
  }
  
  // Fall back to state inference from prefix
  const prefix = zipCode.substring(0, 3);
  const stateCode = ZIP_PREFIX_TO_STATE[prefix];
  
  return { stateCode: stateCode || 'US' };
}
*/
// Seed BLS OEWS data into database
app.post("/api/admin/seed-bls-data", async (c) => {
  try {
    const db = c.env.DB;
    
    // Clear existing data
    await db.prepare("DELETE FROM bls_occupational_wages").run();
    
    // Insert all wage data
    let insertedCount = 0;
    for (const wage of getAllOewsData()) {
      await db.prepare(`
        INSERT INTO bls_occupational_wages 
        (soc_code, occupation_title, area_type, area_code, area_name, hourly_10, hourly_25, hourly_median, hourly_75, hourly_90, annual_median)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        wage.soc_code,
        wage.occupation_title,
        wage.area_type,
        wage.area_code,
        wage.area_name,
        wage.hourly_10,
        wage.hourly_25,
        wage.hourly_median,
        wage.hourly_75,
        wage.hourly_90,
        wage.annual_median
      ).run();
      insertedCount++;
    }
    
    return c.json({ 
      success: true, 
      message: `Seeded ${insertedCount} wage records`,
      breakdown: {
        national: getAllOewsData().filter(w => w.area_type === 'national').length,
        state: getAllOewsData().filter(w => w.area_type === 'state').length,
        msa: getAllOewsData().filter(w => w.area_type === 'msa').length
      }
    });
  } catch (error) {
    console.error("BLS seeding error:", error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Seeding failed" 
    }, 500);
  }
});

// Market rates endpoint - calculates bid vs market comparison
interface MarketRatesRequest {
  zipCode: string;
  stateCode?: string;
  bidTotal: number;
  squareFootage?: number;
  windowCount?: number; // User-provided or detected window count for per-unit pricing
  detectedTrades?: Array<{ name: string; amount: number }>;
  lineItems?: Array<{ description: string; amount: number }> | string; // Can be array or raw bid text
  tradeDetection?: {
    primaryTrade: string;
    subType?: string | null;
    confidence: string;
    confidenceScore: number;
    matchedKeywords: string[];
    isMultiTrade: boolean;
  };
}

app.post("/api/market-rates", async (c) => {
  try {
    const body = await c.req.json() as MarketRatesRequest;
    const { zipCode, bidTotal, squareFootage, windowCount, detectedTrades, lineItems, tradeDetection } = body;
    
    if (!zipCode || !bidTotal) {
      return c.json({ 
        success: false, 
        error: "zipCode and bidTotal are required" 
      }, 400);
    }
    
    // Lookup ZIP info
    const zipInfo = lookupZipInfo(zipCode);
    const stateCode = body.stateCode || zipInfo.stateCode;
    
    // Convert line items to detected trades if provided
    let trades: DetectedTrade[] = detectedTrades?.map(t => ({
      name: t.name,
      amount: t.amount,
      confidence: 1.0
    })) || [];
    
    // Auto-detect trades from line items or raw text if no explicit trades provided
    if (trades.length === 0 && lineItems) {
      if (typeof lineItems === 'string') {
        // Raw bid text - detect ALL trades from the full text
        const bidText = lineItems;
        const allDetectedTrades = detectAllTradesFromText(bidText);
        if (allDetectedTrades.length > 0) {
          // Distribute labor cost evenly across detected trades
          const laborPerTrade = (bidTotal * 0.4) / allDetectedTrades.length;
          trades = allDetectedTrades.map(t => ({
            name: t.title,
            amount: laborPerTrade,
            socCode: t.socCode,
            confidence: 0.7
          }));
        }
      } else if (Array.isArray(lineItems)) {
        // Structured line items array
        trades = lineItems
          .filter(item => item.amount > 0)
          .map(item => {
            const detected = detectTradeFromText(item.description);
            return {
              name: item.description,
              amount: item.amount,
              socCode: detected?.socCode,
              confidence: detected ? 0.8 : 0.3
            };
          });
      }
    }
    
    // If still no trades, create a generic construction labor entry
    if (trades.length === 0) {
      trades = [{
        name: 'General Construction',
        amount: bidTotal * 0.4, // Assume 40% labor
        socCode: '47-2061', // Construction Laborers
        confidence: 0.5
      }];
    }
    
    // Calculate market comparison with trade detection for PSF benchmarks
    const result = calculateMarketComparison(
      bidTotal,
      squareFootage,
      trades,
      zipCode,
      stateCode,
      zipInfo.msaCode,
      zipInfo.msaName,
      getAllOewsData(),
      tradeDetection as import('../shared/tradeDetection').TradeDetectionResult | undefined
    );
    
    // Phase 4 & 5: Multi-trade analysis with weighted composite score
    let multiTradeAnalysis = undefined;
    
    // Get raw bid text for multi-trade detection
    const rawBidText = typeof lineItems === 'string' ? lineItems : 
      Array.isArray(lineItems) ? lineItems.map(item => 
        typeof item === 'object' && item !== null ? (item as { description?: string }).description || '' : String(item)
      ).join(' ') : '';
    
    if (rawBidText.length > 20) {
      // Detect all trades with confidence scores
      const multiTradeDetection = detectMultipleTrades(rawBidText);
      
      if (multiTradeDetection.trades.length > 0) {
        // Allocate costs across trades
        const tradesWithCosts = estimateCostAllocation(multiTradeDetection.trades, bidTotal);
        
        // Compare each trade to market (filter by confidence >= 40)
        const tradeComparisons: Array<{
          tradeName: string;
          tradeType: string;
          confidence: number;
          estimatedAmount: number;
          estimatedPercent: number;
          marketEstimateLow: number;
          marketEstimateMedian: number;
          marketEstimateHigh: number;
          verdict: 'good_deal' | 'average' | 'expensive' | 'insufficient_data';
          verdictReason: string;
          percentDifference?: number;
        }> = tradesWithCosts
          .filter(trade => trade.confidence >= 40)
          .map(trade => {
            const comparison = compareTradeToMarket(
              trade,
              trade.estimatedAmount || bidTotal / tradesWithCosts.length,
              stateCode,
              zipInfo.msaCode,
              undefined, // wageData - use default
              windowCount ? { windowCount } : undefined // pass user override
            );
            
            return {
              tradeName: comparison.trade.tradeName,
              tradeType: comparison.trade.tradeType,
              confidence: comparison.trade.confidence,
              estimatedAmount: trade.estimatedAmount || 0,
              estimatedPercent: trade.estimatedPercent || 0,
              marketEstimateLow: comparison.marketEstimateLow,
              marketEstimateMedian: comparison.marketEstimateMedian,
              marketEstimateHigh: comparison.marketEstimateHigh,
              verdict: comparison.verdict,
              verdictReason: comparison.verdictReason,
              percentDifference: comparison.percentDifference
            };
          });
        
        // Calculate weighted verdict from trade comparisons
        const validComparisons = tradeComparisons.filter(c => c.verdict !== 'insufficient_data');
        let weightedVerdict: 'good_deal' | 'average' | 'expensive' | 'mixed' | 'insufficient_data' = 'insufficient_data';
        let weightedPercentDiff: number | undefined = undefined;
        
        if (validComparisons.length > 0) {
          // Calculate weighted percent difference
          const totalWeight = validComparisons.reduce((sum, t) => sum + t.estimatedPercent, 0);
          if (totalWeight > 0) {
            weightedPercentDiff = validComparisons.reduce((sum, t) => 
              sum + (t.percentDifference || 0) * (t.estimatedPercent / totalWeight), 0
            );
          }
          
          const goodDeals = validComparisons.filter(c => c.verdict === 'good_deal').length;
          const expensive = validComparisons.filter(c => c.verdict === 'expensive').length;
          
          if (goodDeals > 0 && expensive > 0) {
            weightedVerdict = 'mixed';
          } else if (goodDeals >= validComparisons.length / 2) {
            weightedVerdict = 'good_deal';
          } else if (expensive >= validComparisons.length / 2) {
            weightedVerdict = 'expensive';
          } else {
            weightedVerdict = 'average';
          }
        }
        
        multiTradeAnalysis = {
          projectLabel: multiTradeDetection.projectLabel,
          primaryTrade: multiTradeDetection.primaryTrade?.tradeName,
          isSingleTrade: multiTradeDetection.isSingleTrade,
          isMultiTrade: multiTradeDetection.isMultiTrade,
          tradeComparisons,
          weightedVerdict,
          weightedPercentDiff: weightedPercentDiff !== undefined ? Math.round(weightedPercentDiff * 10) / 10 : undefined
        };
      }
    }
    
    return c.json({ 
      success: true, 
      data: {
        ...result,
        multiTradeAnalysis
      }
    });
    
  } catch (error) {
    console.error("Market rates error:", error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Calculation failed" 
    }, 500);
  }
});

// ============================================
// PRICE SCORE API (Unified Score System Phase 2)
// ============================================

interface PriceScoreRequest {
  bidTotal: number;
  squareFootage?: number;
  projectType: string;
  zipCode?: string;
  customTradeMix?: Record<string, number>;
  liveRates?: Record<string, { hourly: number; annual: number; source: 'live' | 'cached' | 'static'; fetchedAt?: string }>;
  windowCount?: number;
  linearFeet?: number;
  inflationFactor?: { factor: number; percentChange: number; baselineYear: number; baselineIndex: number; currentIndex: number; currentDate: string } | null;
}

app.post("/api/price-score", async (c) => {
  try {
    const body = await c.req.json() as PriceScoreRequest;
    const { bidTotal, squareFootage, projectType, zipCode, customTradeMix, liveRates, windowCount, linearFeet, inflationFactor } = body;
    
    // Validate required fields
    if (!bidTotal || bidTotal <= 0) {
      return c.json({ 
        success: false, 
        error: "bidTotal is required and must be positive" 
      }, 400);
    }
    
    // Check if this is a window project (uses per-unit pricing)
    const isWindowProject = projectType === 'windows-doors' && windowCount && windowCount > 0;
    
    // Check if this is a linear foot project (fence, gutter, railing, etc.)
    // Uses centralized helper from projectUnitConfig
    const isLinearFootProject = checkLinearFootProject(projectType) && linearFeet && linearFeet > 0;
    
    // For non-window, non-linear-foot projects, require square footage
    if (!isWindowProject && !isLinearFootProject && (!squareFootage || squareFootage <= 0)) {
      return c.json({ 
        success: false, 
        error: "squareFootage is required and must be positive" 
      }, 400);
    }
    
    if (!projectType) {
      return c.json({ 
        success: false, 
        error: "projectType is required" 
      }, 400);
    }
    
    // Calculate price score
    const input: PriceScoreInput = {
      bidTotal,
      squareFootage: squareFootage || 0,
      projectType,
      zipCode,
      customTradeMix,
      liveRates,
      windowCount,  // Pass windowCount for per-unit pricing
      linearFeet,   // Pass linearFeet for per-LF pricing
      inflationFactor,  // Pass FRED inflation adjustment
    };
    
    const result = calculatePriceScore(input);
    
    return c.json({ 
      success: true, 
      data: result
    });
    
  } catch (error) {
    console.error("Price score calculation error:", error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Price score calculation failed" 
    }, 500);
  }
});

// ============================================
// GEMINI TRADE MIX ANALYSIS (Premium)
// ============================================

interface TradeMixEntry {
  soc: string;
  name: string;
  weight: number;
}

interface TradeMixAnalysisResult {
  trades: TradeMixEntry[];
  materialRatio: number;
  confidence: 'high' | 'medium' | 'low';
  reasoning?: string;
}

interface TradeMixRequest {
  bidText: string;
  projectType?: string;
}

// SOC code mapping for trades
const TRADE_SOC_MAP: Record<string, { soc: string; name: string }> = {
  'carpenter': { soc: '47-2031', name: 'Carpenter' },
  'electrician': { soc: '47-2111', name: 'Electrician' },
  'plumber': { soc: '47-2152', name: 'Plumber' },
  'hvac': { soc: '49-9021', name: 'HVAC Technician' },
  'painter': { soc: '47-2141', name: 'Painter' },
  'roofer': { soc: '47-2181', name: 'Roofer' },
  'tile-setter': { soc: '47-2044', name: 'Tile Setter' },
  'flooring': { soc: '47-2042', name: 'Flooring Installer' },
  'drywall': { soc: '47-2081', name: 'Drywall Installer' },
  'laborer': { soc: '47-2061', name: 'General Laborer' },
  'glazier': { soc: '47-2121', name: 'Glazier' },
  'insulation': { soc: '47-2131', name: 'Insulation Worker' },
  'sheet-metal': { soc: '47-2211', name: 'Sheet Metal Worker' },
  'cement': { soc: '47-2051', name: 'Cement Mason' },
  'brickmason': { soc: '47-2021', name: 'Brickmason' },
};

app.post("/api/analyze-trade-mix", async (c) => {
  const geminiKey = (c.env as unknown as Record<string, unknown>).GEMINI_API_KEY as string | undefined;
  
  if (!geminiKey) {
    return c.json({ 
      success: false, 
      error: "Gemini API key not configured" 
    }, 500);
  }

  try {
    const body = await c.req.json() as TradeMixRequest;
    const { bidText, projectType } = body;
    
    if (!bidText || bidText.trim().length < 50) {
      return c.json({ 
        success: false, 
        error: "bidText is required and must be at least 50 characters" 
      }, 400);
    }

    const ai = new GoogleGenAI({ apiKey: geminiKey });
    
    const prompt = `You are an expert construction estimator. Analyze this contractor bid/estimate and determine the trade mix (labor allocation by trade type).

BID TEXT:
${bidText.slice(0, 8000)}

${projectType ? `PROJECT TYPE HINT: ${projectType}` : ''}

Analyze the scope of work and determine what percentage of labor cost would go to each trade. Consider:
- Line items and their descriptions
- Material mentions that imply specific trades
- Scope of work sections
- Any explicit labor breakdowns

Return a JSON object with this exact structure:
{
  "trades": [
    { "trade": "carpenter", "weight": 0.35, "reason": "cabinetry, trim, framing" },
    { "trade": "electrician", "weight": 0.15, "reason": "new outlets, lighting" }
  ],
  "materialRatio": 0.50,
  "confidence": "high",
  "reasoning": "Kitchen remodel with significant carpentry work..."
}

Valid trade codes: carpenter, electrician, plumber, hvac, painter, roofer, tile-setter, flooring, drywall, laborer, glazier, insulation, sheet-metal, cement, brickmason

Rules:
- Weights MUST sum to exactly 1.0
- Include "laborer" for demo/cleanup (typically 5-15%)
- materialRatio is the estimated material cost as a ratio of total job (0.3-0.7 typical)
- confidence: "high" if clear line items, "medium" if some inference, "low" if vague scope
- Only include trades that are actually part of this job`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 },
        temperature: 0  // Deterministic output for consistent trade mix analysis
      }
    });

    const responseText = response.text || "";
    
    let analysisData: {
      trades: Array<{ trade: string; weight: number; reason?: string }>;
      materialRatio: number;
      confidence: 'high' | 'medium' | 'low';
      reasoning?: string;
    };
    
    try {
      const cleanedText = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      analysisData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Trade mix JSON parse error:", parseError);
      console.error("Response preview:", responseText.slice(0, 500));
      
      return c.json({
        success: false,
        error: "Failed to parse AI response",
        rawResponse: responseText.slice(0, 300)
      }, 500);
    }

    // Validate and normalize weights
    const totalWeight = analysisData.trades.reduce((sum, t) => sum + t.weight, 0);
    
    // Map to SOC codes
    const mappedTrades: TradeMixEntry[] = analysisData.trades
      .filter(t => TRADE_SOC_MAP[t.trade])
      .map(t => ({
        soc: TRADE_SOC_MAP[t.trade].soc,
        name: TRADE_SOC_MAP[t.trade].name,
        weight: Math.round((t.weight / totalWeight) * 1000) / 1000, // Normalize
      }));

    // Ensure weights sum to 1.0 after rounding
    const mappedTotal = mappedTrades.reduce((sum, t) => sum + t.weight, 0);
    if (mappedTrades.length > 0 && Math.abs(mappedTotal - 1) > 0.001) {
      mappedTrades[0].weight += (1 - mappedTotal);
      mappedTrades[0].weight = Math.round(mappedTrades[0].weight * 1000) / 1000;
    }

    const result: TradeMixAnalysisResult = {
      trades: mappedTrades,
      materialRatio: Math.min(0.7, Math.max(0.3, analysisData.materialRatio || 0.5)),
      confidence: analysisData.confidence || 'medium',
      reasoning: analysisData.reasoning,
    };

    return c.json({ 
      success: true, 
      data: result
    });
    
  } catch (error) {
    console.error("Trade mix analysis error:", error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Trade mix analysis failed" 
    }, 500);
  }
});

// ============================================
// LIVE BLS WAGE DATA (Premium)
// ============================================

interface BlsRatesRequest {
  msaCode: string;
  socCodes: string[];
}

interface BlsWageResult {
  [socCode: string]: {
    hourly: number;
    annual: number;
    source: 'live' | 'cached' | 'static';
    fetchedAt?: string;
  };
}

// BLS API v2 endpoint
const BLS_API_URL = 'https://api.bls.gov/publicAPI/v2/timeseries/data/';

// Series ID format for OEWS: OEUM{MSA_CODE}000000{SOC_CODE}03 (hourly mean)
// BLS area codes are 7 digits with LEADING zeros (e.g., 12060 → 0012060)
function buildBlsSeriesId(msaCode: string, socCode: string): string {
  // MSA codes need to be 7 digits with LEADING zeros
  const paddedMsa = msaCode.padStart(7, '0');
  // SOC code needs hyphens removed
  const cleanSoc = socCode.replace('-', '');
  // OEWS series: OEU = OEWS, M = MSA, area code, 000000 = all industries, SOC, 03 = hourly mean
  return `OEUM${paddedMsa}000000${cleanSoc}03`;
}

app.post("/api/bls/rates", async (c) => {
  const blsKey = (c.env as unknown as Record<string, unknown>).BLS_API_KEY as string | undefined;
  const db = c.env.DB;
  
  if (!blsKey) {
    return c.json({ 
      success: false, 
      error: "BLS API key not configured" 
    }, 500);
  }

  try {
    const body = await c.req.json() as BlsRatesRequest;
    const { msaCode, socCodes } = body;
    
    if (!msaCode || !socCodes || socCodes.length === 0) {
      return c.json({ 
        success: false, 
        error: "msaCode and socCodes array are required" 
      }, 400);
    }

    if (socCodes.length > 10) {
      return c.json({ 
        success: false, 
        error: "Maximum 10 SOC codes per request" 
      }, 400);
    }

    const result: BlsWageResult = {};
    const socCodesToFetch: string[] = [];
    const now = new Date();
    const cacheExpiry = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

    // Check cache for each SOC code
    for (const socCode of socCodes) {
      const cached = await db.prepare(`
        SELECT hourly_rate, annual_rate, fetched_at 
        FROM bls_rate_cache 
        WHERE msa_code = ? AND soc_code = ? AND fetched_at > ?
      `).bind(msaCode, socCode, cacheExpiry.toISOString()).first<{
        hourly_rate: number;
        annual_rate: number;
        fetched_at: string;
      }>();

      if (cached) {
        result[socCode] = {
          hourly: cached.hourly_rate,
          annual: cached.annual_rate,
          source: 'cached',
          fetchedAt: cached.fetched_at
        };
      } else {
        socCodesToFetch.push(socCode);
      }
    }

    // If all from cache, return early
    if (socCodesToFetch.length === 0) {
      return c.json({ success: true, data: result });
    }

    // Build series IDs for BLS API
    const seriesIds = socCodesToFetch.map(soc => buildBlsSeriesId(msaCode, soc));
    
    // BLS OEWS data has a 1-2 year lag, so we request the most recent years with data
    // 2024 data is typically available by May 2025, 2023 is always available
    const dataYear = now.getFullYear() - 1; // Most recent year likely to have data
    const fallbackYear = now.getFullYear() - 2; // Guaranteed to have data
    
    // Fetch from BLS API
    const blsResponse = await fetch(BLS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        seriesid: seriesIds,
        startyear: fallbackYear.toString(),
        endyear: dataYear.toString(),
        registrationkey: blsKey,
        annualaverage: true
      })
    });

    if (!blsResponse.ok) {
      console.error('BLS API error:', blsResponse.status);
      // Return cached results if any, plus mark unfetched as needing static fallback
      for (const socCode of socCodesToFetch) {
        result[socCode] = { hourly: 0, annual: 0, source: 'static' };
      }
      return c.json({ 
        success: true, 
        data: result, 
        warning: 'BLS API unavailable, some rates need static fallback' 
      });
    }

    const blsData = await blsResponse.json() as {
      status: string;
      Results?: {
        series: Array<{
          seriesID: string;
          data: Array<{
            year: string;
            period: string;
            value: string;
          }>;
        }>;
      };
    };

    if (blsData.status !== 'REQUEST_SUCCEEDED' || !blsData.Results) {
      console.error('BLS API response error:', blsData.status);
      for (const socCode of socCodesToFetch) {
        result[socCode] = { hourly: 0, annual: 0, source: 'static' };
      }
      return c.json({ 
        success: true, 
        data: result, 
        warning: 'BLS API returned error status' 
      });
    }

    // Process BLS results
    for (let i = 0; i < socCodesToFetch.length; i++) {
      const socCode = socCodesToFetch[i];
      const seriesId = seriesIds[i];
      const seriesData = blsData.Results.series.find(s => s.seriesID === seriesId);
      
      if (seriesData && seriesData.data.length > 0) {
        // Get most recent annual average (period A01 = annual in OEWS data)
        const annualData = seriesData.data.find(d => d.period === 'A01') || seriesData.data[0];
        const hourlyRate = parseFloat(annualData.value);
        const annualRate = hourlyRate * 2080; // Standard full-time hours
        
        if (!isNaN(hourlyRate) && hourlyRate > 0) {
          result[socCode] = {
            hourly: hourlyRate,
            annual: annualRate,
            source: 'live',
            fetchedAt: now.toISOString()
          };
          
          // Cache the result
          await db.prepare(`
            INSERT INTO bls_rate_cache (msa_code, soc_code, hourly_rate, annual_rate, fetched_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(msa_code, soc_code) DO UPDATE SET
              hourly_rate = excluded.hourly_rate,
              annual_rate = excluded.annual_rate,
              fetched_at = excluded.fetched_at,
              updated_at = excluded.updated_at
          `).bind(msaCode, socCode, hourlyRate, annualRate, now.toISOString(), now.toISOString(), now.toISOString()).run();
        } else {
          result[socCode] = { hourly: 0, annual: 0, source: 'static' };
        }
      } else {
        // No data for this series - mark for static fallback
        result[socCode] = { hourly: 0, annual: 0, source: 'static' };
      }
    }

    return c.json({ success: true, data: result });
    
  } catch (error) {
    console.error("BLS rates fetch error:", error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "BLS rates fetch failed" 
    }, 500);
  }
});

// ============================================
// BLIND BID ANALYSIS - For bids without square footage
// ============================================

interface BlindBidRequest {
  bidText: string;
  bidTotal?: number;
  city: string;
  state?: string;
  projectType?: string;
}

app.post("/api/blind-bid-analysis", async (c) => {
  try {
    const body = await c.req.json() as BlindBidRequest;
    const { bidText, bidTotal, city, state, projectType } = body;

    if (!bidText?.trim()) {
      return c.json({ success: false, error: 'No bid text provided' }, 400);
    }

    // City is optional - we'll fall back to state or national averages

    // Run standard analysis first to get flags, trade detection, etc.
    const analysis = analyzeBid(bidText, bidTotal, state || 'GA');
    
    // Calculate blind bid estimate
    const blindBidResult = calculateBlindBidEstimate(
      {
        ...analysis,
        totalPrice: bidTotal,
        squareFootage: 0, // No square footage - that's why it's a blind bid
        projectType: projectType || analysis.tradeDetection?.primaryTrade || 'general'
      },
      bidText,
      city,
      state,
      bidTotal
    );

    return c.json({
      success: true,
      blindBidAnalysis: blindBidResult,
      tradeDetection: analysis.tradeDetection,
      scopeAnalysis: analysis.scopeAnalysis,
      flags: analysis.flags.slice(0, 5) // Top 5 flags for context
    });

  } catch (error) {
    console.error('Blind bid analysis error:', error);
    return c.json({ 
      success: false, 
      error: 'Blind bid analysis failed. Please try again.' 
    }, 500);
  }
});

// ============================================
// SCOPE FINGERPRINT TEST RUNNER
// ============================================

app.get("/api/tests/scope-fingerprints", async (c) => {
  const { 
    runAllTests, 
    runKitchenTests, 
    runBathroomTests,
    runLivingAduTests,
    runExteriorTests,
    runInfrastructureTests,
    runSpecialtyTests,
    runEdgeCaseTests,
    getClassificationAccuracy
  } = await import("@/shared/testData/scenarioTestRunner");
  
  const batch = c.req.query("batch");
  
  let summary;
  switch (batch) {
    case "kitchen":
      summary = runKitchenTests();
      break;
    case "bathroom":
      summary = runBathroomTests();
      break;
    case "living":
      summary = runLivingAduTests();
      break;
    case "exterior":
      summary = runExteriorTests();
      break;
    case "infrastructure":
      summary = runInfrastructureTests();
      break;
    case "specialty":
      summary = runSpecialtyTests();
      break;
    case "edge":
      summary = runEdgeCaseTests();
      break;
    default:
      summary = runAllTests();
  }
  
  const accuracy = getClassificationAccuracy(summary);
  
  // Group results for easier reading
  const passed = summary.results.filter(r => r.passed);
  const failed = summary.results.filter(r => !r.passed);
  
  return c.json({
    overview: {
      total: summary.totalScenarios,
      passed: summary.passed,
      failed: summary.failed,
      passRate: `${(summary.passRate * 100).toFixed(1)}%`,
      timestamp: summary.timestamp,
    },
    accuracyByType: accuracy,
    failedScenarios: failed.map(r => ({
      id: r.scenarioId,
      name: r.scenarioName,
      expected: r.expectedClassification,
      actual: r.actualClassification,
      expectedConfidence: `>=${r.expectedConfidenceMin}%`,
      actualConfidence: `${r.actualConfidence}%`,
      note: r.notes,
    })),
    passedScenarios: passed.map(r => ({
      id: r.scenarioId,
      name: r.scenarioName,
      classification: r.actualClassification,
      confidence: `${r.actualConfidence}%`,
    })),
  });
});

// ============================================
// HEALTH CHECK
// ============================================

app.get("/api/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ============================================
// SCHEDULED HANDLER - Daily BLS PPI Data Refresh
// ============================================
// Runs daily at 6 AM UTC via Cloudflare cron trigger
// Automatically fetches fresh BLS PPI data to keep material prices current

// ==================== TRUSTED RADAR SEARCH ====================

// ZIP to coordinates lookup (subset for geocoding fallback)
const RADAR_ZIP_COORDS: Record<string, { lat: number; lng: number }> = {
  // Georgia
  '30301': { lat: 33.749, lng: -84.388 }, '30309': { lat: 33.793, lng: -84.384 },
  '30318': { lat: 33.793, lng: -84.428 }, '30327': { lat: 33.862, lng: -84.424 },
  '30342': { lat: 33.877, lng: -84.368 }, '30030': { lat: 33.775, lng: -84.296 },
  '30060': { lat: 33.952, lng: -84.550 }, '30075': { lat: 34.030, lng: -84.364 },
  // California
  '90210': { lat: 34.090, lng: -118.406 }, '94102': { lat: 37.779, lng: -122.419 },
  '92101': { lat: 32.719, lng: -117.162 }, '90001': { lat: 33.941, lng: -118.248 },
  '94110': { lat: 37.749, lng: -122.415 }, '92612': { lat: 33.669, lng: -117.823 },
  // New York
  '10001': { lat: 40.748, lng: -73.993 }, '10019': { lat: 40.765, lng: -73.985 },
  '11201': { lat: 40.693, lng: -73.990 }, '10010': { lat: 40.739, lng: -73.982 },
  // Texas
  '75201': { lat: 32.789, lng: -96.798 }, '77001': { lat: 29.752, lng: -95.358 },
  '78201': { lat: 29.468, lng: -98.525 }, '73301': { lat: 30.326, lng: -97.771 },
  // Florida
  '33101': { lat: 25.779, lng: -80.197 }, '32801': { lat: 28.541, lng: -81.379 },
  '33301': { lat: 26.122, lng: -80.137 }, '34102': { lat: 26.142, lng: -81.795 },
  // Other major metros
  '60601': { lat: 41.886, lng: -87.618 }, // Chicago
  '85001': { lat: 33.449, lng: -112.077 }, // Phoenix
  '19101': { lat: 39.952, lng: -75.164 }, // Philadelphia
  '98101': { lat: 47.602, lng: -122.332 }, // Seattle
  '80201': { lat: 39.739, lng: -104.984 }, // Denver
  '02101': { lat: 42.360, lng: -71.059 }, // Boston
  '48201': { lat: 42.349, lng: -83.056 }, // Detroit
  '55401': { lat: 44.983, lng: -93.269 }, // Minneapolis
  '63101': { lat: 38.627, lng: -90.199 }, // St. Louis
  '89101': { lat: 36.169, lng: -115.140 }, // Las Vegas
  '28201': { lat: 35.227, lng: -80.843 }, // Charlotte
  '37201': { lat: 36.166, lng: -86.784 }, // Nashville
  '97201': { lat: 45.515, lng: -122.676 }, // Portland
  '46201': { lat: 39.768, lng: -86.158 }, // Indianapolis
  '21201': { lat: 39.290, lng: -76.612 }, // Baltimore
  '53201': { lat: 43.039, lng: -87.907 }, // Milwaukee
  '84101': { lat: 40.761, lng: -111.891 }, // Salt Lake City
  '27601': { lat: 35.779, lng: -78.638 }, // Raleigh
};

// Trade to search keywords for text search
const TRADE_TO_KEYWORDS: Record<string, string> = {
  'all': 'contractor',
  'painter': 'painter painting contractor',
  'carpenter': 'carpenter carpentry contractor',
  'plumber': 'plumber plumbing contractor',
  'electrician': 'electrician electrical contractor',
  'handyman': 'handyman home repair',
  'general_contractor': 'general contractor remodeling',
  'hvac': 'hvac air conditioning heating contractor',
  'roofing': 'roofing roof contractor',
  'landscaper': 'landscaper landscaping lawn care yard service',
};

// Validate that cached results actually match the trade (filters out stale/incorrect cache entries)
const TRADE_BUSINESS_KEYWORDS: Record<string, string[]> = {
  'landscaper': ['landscape', 'landscaping', 'lawn', 'yard', 'garden', 'outdoor', 'tree', 'turf', 'grass', 'mowing', 'greenscape'],
  'painter': ['paint', 'painting', 'coatings'],
  'plumber': ['plumb', 'plumbing', 'pipe', 'drain'],
  'electrician': ['electric', 'electrical', 'wiring'],
  'hvac': ['hvac', 'heating', 'cooling', 'air conditioning', 'ac ', 'a/c'],
  'roofing': ['roof', 'roofing', 'shingle'],
};

function isValidTradeMatch(businessName: string, trade: string): boolean {
  const keywords = TRADE_BUSINESS_KEYWORDS[trade];
  if (!keywords) return true; // No validation for trades without keywords defined
  const nameLower = businessName.toLowerCase();
  return keywords.some(kw => nameLower.includes(kw));
}

app.get("/api/trusted-radar/search", async (c) => {
  const apiKey = (c.env as unknown as Record<string, unknown>).GOOGLE_PLACES_API_KEY as string | undefined;
  const db = c.env.DB;
  
  if (!apiKey) {
    return c.json({ 
      success: false, 
      error: "Google Places API not configured",
      contractors: [],
      center: null,
      totalFound: 0
    }, 200);
  }
  
  const zip = c.req.query("zip") || "";
  const latParam = c.req.query("lat");
  const lngParam = c.req.query("lng");
  const rawTrade = c.req.query("trade") || "all";
  // Allowlist check — only accept trades defined in TRADE_TO_KEYWORDS
  if (!(rawTrade in TRADE_TO_KEYWORDS)) {
    return c.json({ success: false, error: "Invalid trade value", contractors: [], center: null, totalFound: 0 }, 400);
  }
  const trade = rawTrade;
  const radiusParam = c.req.query("radius") || "25";
  const radiusMiles = parseInt(radiusParam, 10);
  const radiusMeters = Math.min(radiusMiles * 1609, 50000); // Google max is 50km
  
  // Get coordinates - prefer lat/lng params, fall back to ZIP
  let center: { lat: number; lng: number } | null = null;
  
  // Use lat/lng if provided (from map pan/zoom)
  if (latParam && lngParam) {
    center = {
      lat: parseFloat(latParam),
      lng: parseFloat(lngParam)
    };
  }
  
  // Fall back to ZIP-based lookup
  if (!center && zip && zip.length >= 5) {
    // Try exact match first
    if (RADAR_ZIP_COORDS[zip]) {
      center = RADAR_ZIP_COORDS[zip];
    } else {
      // Try prefix match
      const prefix = zip.slice(0, 3);
      for (const [key, coords] of Object.entries(RADAR_ZIP_COORDS)) {
        if (key.startsWith(prefix)) {
          center = coords;
          break;
        }
      }
    }
    
    // If no match, use Google Geocoding API
    if (!center) {
      try {
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${zip}&key=${apiKey}`;
        const geocodeRes = await fetch(geocodeUrl);
        const geocodeData = await geocodeRes.json() as { 
          status: string; 
          results: Array<{ geometry: { location: { lat: number; lng: number } } }> 
        };
        
        if (geocodeData.status === 'OK' && geocodeData.results?.[0]) {
          center = {
            lat: geocodeData.results[0].geometry.location.lat,
            lng: geocodeData.results[0].geometry.location.lng
          };
        }
      } catch (e) {
        console.error('Geocoding error:', e);
      }
    }
  }
  
  // Require either lat/lng or valid ZIP
  if (!center) {
    return c.json({ 
      success: false, 
      error: "Valid ZIP code or coordinates required",
      contractors: [],
      center: null,
      totalFound: 0
    }, 400);
  }
  
  // === CACHE CHECK ===
  // Check for cached contractors in this ZIP area (within 7 days)
  const CACHE_TTL_DAYS = 7;
  const cacheExpiryDate = new Date();
  cacheExpiryDate.setDate(cacheExpiryDate.getDate() - CACHE_TTL_DAYS);
  const cacheExpiryISO = cacheExpiryDate.toISOString();
  
  try {
    // Query cached contractors for this ZIP and trade (if trade specified)
    const tradeFilter = trade === 'all' ? '' : `AND trade_categories LIKE '%${trade}%'`;
    const cachedResult = await db.prepare(`
      SELECT * FROM trusted_contractors 
      WHERE zip_code = ? 
      AND cached_at > ?
      ${tradeFilter}
      AND google_rating >= 4.0
      ORDER BY google_rating DESC
      LIMIT 20
    `).bind(zip, cacheExpiryISO).all();
    
    if (cachedResult.results && cachedResult.results.length >= 5) {
      // Return cached results
      const contractors = cachedResult.results.map((row: Record<string, unknown>) => ({
        id: row.id as number,
        placeId: row.place_id as string,
        businessName: row.business_name as string,
        phone: row.phone as string | null,
        email: row.email as string | null,
        website: row.website as string | null,
        address: row.address as string | null,
        city: row.city as string | null,
        stateCode: row.state_code as string | null,
        zipCode: row.zip_code as string | null,
        lat: row.lat as number | null,
        lng: row.lng as number | null,
        googleRating: row.google_rating as number | null,
        googleReviewCount: row.google_review_count as number | null,
        bbbGrade: row.bbb_grade as string | null,
        licenseStatus: row.license_status as string | null,
        licenseNumber: row.license_number as string | null,
        tradeCategories: row.trade_categories ? JSON.parse(row.trade_categories as string) : [],
        cachedAt: row.cached_at as string | null
      }));
      
      // Filter out stale cache entries that don't match the trade (e.g., construction companies in landscaper results)
      const validContractors = trade === 'all' 
        ? contractors 
        : contractors.filter(c => isValidTradeMatch(c.businessName, trade));
      
      // Only use cache if we have enough valid matches; otherwise do fresh search
      if (validContractors.length >= 5) {
        return c.json({
          success: true,
          contractors: validContractors,
          center,
          totalFound: validContractors.length,
          fromCache: true
        });
      }
      // Not enough valid matches - fall through to fresh search
    }
  } catch (cacheError) {
    console.error('Cache lookup error:', cacheError);
    // Continue to fresh search if cache fails
  }
  
  // === FRESH SEARCH FROM GOOGLE PLACES ===
  const keywords = TRADE_TO_KEYWORDS[trade] || 'contractor';
  
  try {
    // Use Google Places Text Search API for better results
    const searchUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    searchUrl.searchParams.set('query', `${keywords} near ${zip}`);
    searchUrl.searchParams.set('location', `${center.lat},${center.lng}`);
    searchUrl.searchParams.set('radius', radiusMeters.toString());
    searchUrl.searchParams.set('key', apiKey);
    
    const searchRes = await fetch(searchUrl.toString());
    const searchData = await searchRes.json() as {
      status: string;
      results: Array<{
        place_id: string;
        name: string;
        formatted_address: string;
        geometry: { location: { lat: number; lng: number } };
        rating?: number;
        user_ratings_total?: number;
        opening_hours?: { open_now: boolean };
        business_status?: string;
        types?: string[];
      }>;
    };
    
    if (searchData.status !== 'OK' && searchData.status !== 'ZERO_RESULTS') {
      console.error('Google Places search error:', searchData.status);
      return c.json({
        success: false,
        error: `Search failed: ${searchData.status}`,
        contractors: [],
        center,
        totalFound: 0
      }, 200);
    }
    
    // Filter and format results
    const now = new Date().toISOString();
    const contractors = (searchData.results || [])
      .filter(place => {
        // Filter out closed businesses
        if (place.business_status === 'CLOSED_PERMANENTLY') return false;
        // Filter to 4.0+ rating (or no rating yet)
        if (place.rating && place.rating < 4.0) return false;
        return true;
      })
      .slice(0, 20) // Limit to 20 results
      .map(place => {
        // Extract city and state from address
        const addressParts = (place.formatted_address || '').split(',').map(p => p.trim());
        const cityStateZip = addressParts.length >= 2 ? addressParts[addressParts.length - 2] : '';
        const stateMatch = cityStateZip.match(/([A-Z]{2})\s+\d{5}/);
        const stateCode = stateMatch ? stateMatch[1] : null;
        const city = addressParts.length >= 3 ? addressParts[addressParts.length - 3] : addressParts[0];
        
        return {
          id: 0,
          placeId: place.place_id,
          businessName: place.name,
          phone: null,
          email: null,
          website: null,
          address: addressParts[0] || null,
          city: city || null,
          stateCode,
          zipCode: zip,
          lat: place.geometry?.location?.lat || null,
          lng: place.geometry?.location?.lng || null,
          googleRating: place.rating || null,
          googleReviewCount: place.user_ratings_total || null,
          bbbGrade: null,
          licenseStatus: null,
          licenseNumber: null,
          tradeCategories: [trade === 'all' ? 'general' : trade],
          cachedAt: now
        };
      });
    
    // === SAVE TO CACHE ===
    // Store results in database for future lookups
    for (const contractor of contractors) {
      try {
        await db.prepare(`
          INSERT INTO trusted_contractors (
            place_id, business_name, phone, email, website, address, city, 
            state_code, zip_code, lat, lng, google_rating, google_review_count,
            bbb_grade, license_status, license_number, trade_categories, cached_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(place_id) DO UPDATE SET
            business_name = excluded.business_name,
            google_rating = excluded.google_rating,
            google_review_count = excluded.google_review_count,
            zip_code = excluded.zip_code,
            trade_categories = excluded.trade_categories,
            cached_at = excluded.cached_at,
            updated_at = CURRENT_TIMESTAMP
        `).bind(
          contractor.placeId,
          contractor.businessName,
          contractor.phone,
          contractor.email,
          contractor.website,
          contractor.address,
          contractor.city,
          contractor.stateCode,
          contractor.zipCode,
          contractor.lat,
          contractor.lng,
          contractor.googleRating,
          contractor.googleReviewCount,
          contractor.bbbGrade,
          contractor.licenseStatus,
          contractor.licenseNumber,
          JSON.stringify(contractor.tradeCategories),
          contractor.cachedAt
        ).run();
      } catch (insertError) {
        console.error('Cache insert error for', contractor.placeId, insertError);
        // Continue even if individual insert fails
      }
    }
    
    return c.json({
      success: true,
      contractors,
      center,
      totalFound: contractors.length,
      fromCache: false
    });
    
  } catch (error) {
    console.error('Trust Radar search error:', error);
    return c.json({
      success: false,
      error: 'Search failed',
      contractors: [],
      center,
      totalFound: 0
    }, 500);
  }
});

// ==================== TRUSTED RADAR BBB/LICENSE ENRICHMENT ====================

app.post("/api/trusted-radar/enrich", async (c) => {
  const geminiKey = (c.env as unknown as Record<string, string>).GEMINI_API_KEY;
  const db = c.env.DB;
  
  if (!geminiKey) {
    return c.json({ success: false, error: "API key not configured" }, 500);
  }
  
  let body: { contractors: Array<{ placeId: string; businessName: string; stateCode: string | null; city: string | null }> };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: "Invalid request body" }, 400);
  }
  
  const { contractors } = body;
  if (!contractors || !Array.isArray(contractors) || contractors.length === 0) {
    return c.json({ success: false, error: "No contractors to enrich" }, 400);
  }
  
  // Limit to 5 contractors per request to manage API costs
  const toEnrich = contractors.slice(0, 5);
  const enriched: Record<string, { bbbGrade: string | null; licenseStatus: string | null; licenseNumber: string | null }> = {};
  
  for (const contractor of toEnrich) {
    const { placeId, businessName, stateCode, city } = contractor;
    
    // Build search prompt for Gemini with grounding
    const location = [city, stateCode].filter(Boolean).join(", ");
    const searchPrompt = `Search for contractor business information:

Business: "${businessName}"
Location: ${location || "United States"}

Find and return ONLY factual information from official sources:
1. BBB (Better Business Bureau) rating/grade if accredited
2. State contractor license number if licensed

Return JSON format:
{
  "bbbGrade": "A+" or "A" or "B+" etc or null if not found/not accredited,
  "licenseNumber": "license number string" or null if not found,
  "licenseStatus": "verified" if found in state database, "not_found" if searched but not found, null if unable to search
}

Only return grades/licenses that are definitely for this exact business. If uncertain, return null.`;
    
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
      
      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: searchPrompt }] }],
          tools: [{ googleSearch: {} }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 500
          }
        })
      });
      
      if (!response.ok) {
        console.error(`Gemini enrichment error for ${businessName}:`, response.status);
        enriched[placeId] = { bbbGrade: null, licenseStatus: null, licenseNumber: null };
        continue;
      }
      
      const data = await response.json() as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]) as { bbbGrade?: string; licenseNumber?: string; licenseStatus?: string };
          enriched[placeId] = {
            bbbGrade: parsed.bbbGrade || null,
            licenseNumber: parsed.licenseNumber || null,
            licenseStatus: parsed.licenseStatus as 'verified' | 'not_found' | null || null
          };
          
          // Update cache with enriched data
          try {
            await db.prepare(`
              UPDATE trusted_contractors 
              SET bbb_grade = ?, license_status = ?, license_number = ?, updated_at = CURRENT_TIMESTAMP
              WHERE place_id = ?
            `).bind(
              parsed.bbbGrade || null,
              parsed.licenseStatus || null,
              parsed.licenseNumber || null,
              placeId
            ).run();
          } catch (updateErr) {
            console.error('Cache update error:', updateErr);
          }
          
        } catch {
          enriched[placeId] = { bbbGrade: null, licenseStatus: null, licenseNumber: null };
        }
      } else {
        enriched[placeId] = { bbbGrade: null, licenseStatus: null, licenseNumber: null };
      }
      
    } catch (err) {
      console.error(`Enrichment error for ${businessName}:`, err);
      enriched[placeId] = { bbbGrade: null, licenseStatus: null, licenseNumber: null };
    }
    
    // Small delay between requests to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  return c.json({ success: true, enriched });
});

// SPA fallback: serve index.html for any unmatched route so React Router
// can handle client-side routing on direct hits. Critical for SEO — without
// this, sitemap-listed routes like /trusted-radar /studio /join return 404.
app.notFound(async (c) => {
  const env = c.env as unknown as { ASSETS?: { fetch: (req: Request) => Promise<Response> } };
  if (!env.ASSETS) {
    return c.text('Not Found', 404);
  }
  const url = new URL(c.req.url);
  // Don't SPA-fallback API or asset paths — those should 404 cleanly.
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/assets/')) {
    return c.text('Not Found', 404);
  }
  // Fetch the SPA shell from Workers Assets and return it
  const shellUrl = new URL('/', url);
  const shellRes = await env.ASSETS.fetch(new Request(shellUrl.toString(), { method: 'GET' }));
  return new Response(shellRes.body, {
    status: 200,
    headers: shellRes.headers,
  });
});

async function scheduledHandler(
  event: ScheduledEvent,
  env: Env,
  _ctx: ExecutionContext
): Promise<void> {
  // Multiplex cron schedule by event.cron
  // - "0 */6 * * *"  → Reddit Scout (every 6h)
  // - "0 11 * * *"   → Morning digest at 7am ET (11 UTC)
  // - "0 */12 * * *" → Engagement tracker (every 12h)
  // - "30 13 * * *"  → Auto-publish in_review drafts at 8:30am ET (Phase 7A)
  const cron = event.cron;
  console.log(`Scheduled handler fired for cron: ${cron}`);

  const envForRoutes = env as unknown as { DB: D1Database; RESEND_API_KEY?: string; GEMINI_API_KEY?: string };

  // NOTE: the old "0 */6 * * *" Reddit-scout cron was removed — Reddit closed its
  // public JSON API, so scouting is dead. Reddit is now a manual paste workflow.

  if (cron === "0 11 * * *") {
    // Morning digest 7am ET
    try {
      const result = await sendMorningDigest(envForRoutes as never);
      console.log(`Digest sent: ${result.sent}`);
    } catch (err) {
      console.error("Digest cron failed:", err);
    }
    // Also refresh BLS PPI data once a day
    const blsKey = (env as unknown as Record<string, unknown>).BLS_API_KEY as string | undefined;
    if (blsKey) {
      try {
        const result = await refreshPPIData(env.DB, blsKey);
        console.log(`BLS refresh: ${result.success ? 'ok' : result.error}`);
      } catch (err) {
        console.error("BLS refresh failed:", err);
      }
    }
  }

  if (cron === "0 13 * * *") {
    // Daily 9am ET — scout Reddit (RSS) for fresh bid questions + draft tailored
    // replies into reddit_drafts for the /admin/reddit dashboard.
    try {
      const r = await scoutRedditRss(env as never, new Date().toISOString(), 6);
      console.log(`Reddit scout: scanned=${r.scanned} candidates=${r.candidates} drafted=${r.drafted}`);
    } catch (err) {
      console.error("Reddit scout cron failed:", err);
    }
  }

  if (cron === "0 */12 * * *") {
    // Engagement tracker — poll published Reddit URLs for upvotes/comments
    try {
      const result = await trackEngagement(envForRoutes as never);
      console.log(`Engagement updated for ${result.updated} drafts`);
    } catch (err) {
      console.error("Engagement cron failed:", err);
    }
  }

  if (cron === "30 13 * * *") {
    // Auto-publish: 8:30am ET. Flip in_review drafts to approved unless STOP override was logged.
    try {
      const result = await autoPublishApproved(envForRoutes as never);
      console.log(`Auto-publish result: ${result.held ? 'HELD by override' : `${result.approved} approved`}`);
    } catch (err) {
      console.error("Auto-publish cron failed:", err);
    }
  }

  if (cron === "0 10 * * SUN") {
    // Sunday 6am ET (10 UTC): pick oldest blog_brief, draft a long-form post, push to WP as draft.
    // Lands as an approval row in unified_inbox for Gustavo to flip publish.
    try {
      const apiKey = (env as unknown as Record<string, unknown>).GEMINI_API_KEY as string | undefined;
      if (!apiKey) {
        console.log('Weekly blog cron skipped: no GEMINI_API_KEY');
      } else {
        // Phase 7-Pillars — draft HUBS first (so spokes have a hub to link to),
        // then data reports, then comparisons, then spokes; oldest within a tier.
        // Skip rows already claimed by a manual /from-queue run mid-flight.
        const row = await env.DB.prepare(
          `SELECT id, blog_brief, content_format, wp_pillar, status FROM content_drafts
           WHERE blog_brief IS NOT NULL
             AND length(blog_brief) > 30
             AND wp_post_id IS NULL
             AND (status IS NULL OR status != ?)
           ORDER BY
             CASE content_format
               WHEN 'hub' THEN 0 WHEN 'data_report' THEN 1
               WHEN 'comparison' THEN 2 ELSE 3 END,
             id ASC
           LIMIT 1`
        ).bind(BLOG_DRAFTING_STATUS).first<{ id: number; blog_brief: string; content_format: string | null; wp_pillar: string | null; status: string | null }>();

        if (!row) {
          console.log('Weekly blog cron: no queued briefs');
        } else {
          const fmt = (row.content_format || 'spoke') as 'hub' | 'spoke' | 'comparison' | 'data_report';
          // For spokes, find the published hub for this pillar to link up to.
          let hubUrl: string | undefined;
          if (fmt === 'spoke' && row.wp_pillar) {
            const hub = await env.DB.prepare(
              `SELECT published_url FROM content_drafts
               WHERE wp_pillar = ? AND content_format = 'hub'
                 AND published_url IS NOT NULL
               ORDER BY published_at DESC LIMIT 1`
            ).bind(row.wp_pillar).first<{ published_url: string }>();
            hubUrl = hub?.published_url || undefined;
          }

          // Claim the row, then enqueue it onto the SAME queue the manual endpoints
          // use — so weekly cron posts now get hero + inline images (Phase 7C v2),
          // and the heavy Gemini + Imagen work runs in a queue consumer with a full
          // budget instead of racing the scheduled handler's lifetime.
          const claimed = await claimBlogDraftRow(env as never, row.id);
          if (!claimed) {
            console.log(`Weekly blog cron: row ${row.id} already claimed, skipping`);
          } else {
            await env.BLOG_QUEUE.send({
              brief: row.blog_brief,
              format: fmt,
              hubUrl,
              forcePillar: (row.wp_pillar as 'cost_data' | 'contract_risk' | 'scope_negotiation' | 'regional' | null) || undefined,
              contentDraftId: row.id,
              priorStatus: row.status ?? 'blog_brief',
            } satisfies BlogDraftJobMessage);
            console.log(`Weekly blog drafting enqueued for content_draft ${row.id} (${fmt})`);
          }
        }
      }
    } catch (err) {
      console.error("Weekly blog cron failed:", err);
    }

    // Same weekly slot — generate + schedule a batch of brand-voice Facebook Page
    // posts with branded images (every-other-day across the coming ~week). Folded
    // into the Sunday cron because Cloudflare caps the worker at 5 cron triggers.
    try {
      const fb = await generateAndScheduleFbBatch(env as never, Math.floor(Date.now() / 1000), 4);
      console.log(`Weekly FB batch: scheduled=${fb.scheduled} failed=${fb.failed}`);
    } catch (err) {
      console.error("Weekly FB batch failed:", err);
    }
  }
}

// Queue consumer — runs the heavy blog draft + image pipeline offloaded by the
// HTTP endpoints and the Sunday cron. Each message is its own invocation with a
// full budget (the job is I/O-bound, ~35-45s wall / <1s CPU), so it completes
// where a request handler's ~30s ctx.waitUntil() would be cancelled.
async function queueHandler(
  batch: MessageBatch<BlogDraftJobMessage>,
  env: Env,
  _ctx: ExecutionContext
): Promise<void> {
  const apiKey = (env as unknown as Record<string, unknown>).GEMINI_API_KEY as string | undefined;
  for (const msg of batch.messages) {
    if (!apiKey) {
      console.error("Blog queue: GEMINI_API_KEY missing — acking without drafting");
      msg.ack();
      continue;
    }
    try {
      await processBlogDraftMessage(env as never, apiKey, msg.body);
      msg.ack();
    } catch (err) {
      // processBlogDraftMessage normally handles its own errors; this only fires
      // on an unexpected throw (e.g. the row lookup). Retry once per queue config.
      console.error("Blog queue message failed:", err);
      msg.retry();
    }
  }
}

export default {
  fetch: app.fetch,
  scheduled: scheduledHandler,
  queue: queueHandler
};
