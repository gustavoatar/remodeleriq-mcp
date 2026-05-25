/**
 * AI Services - Shared logic for all AI-powered analysis
 * Consolidates Gemini calls, retry logic, and response parsing
 */

import { GoogleGenAI } from "@google/genai";

// ============================================
// TYPES
// ============================================

export interface AIServiceConfig {
  apiKey: string;
  maxRetries?: number;
  baseDelayMs?: number;
}

export interface BottomLineSynthesis {
  verdict: string;
  keyInsight: string;
  yourMove: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface PriceIntelligenceResult {
  priceSummary: string;
  primaryDrivers: string[];
  regionalContext: string;
  materialFlags: string[];
  negotiationHooks: string[];
  confidence: 'high' | 'medium' | 'low';
  generatedAt: string;
}

export interface TalkTrackResult {
  openingLine: string;
  sections: Array<{
    id: string;
    title: string;
    priority: 'high' | 'medium' | 'low';
    icon: string;
    scripts: Array<{
      id: string;
      opener: string;
      body: string;
      followUp: string;
      tip: string;
    }>;
  }>;
  closingAdvice: string;
}

export interface ContractorResearchResult {
  summary: string;
  reputation: {
    score: 'excellent' | 'good' | 'mixed' | 'concerning' | 'unknown';
    highlights: string[];
    concerns: string[];
  };
  bbbStatus: string;
  bbbComplaints: {
    total: number | null;
    lastThreeYears: number | null;
    resolved: number | null;
    details: string | null;
  };
  businessRegistration: {
    status: 'active' | 'inactive' | 'dissolved' | 'unknown';
    entity: string | null;
    registeredState: string | null;
    licenseNumber: string | null;
    notes: string | null;
  };
  permitHistory: {
    recentPermits: number | null;
    totalValue: number | null;
    notes: string | null;
  };
  newsItems: string[];
  redFlags: string[];
}

export interface ComprehensiveAnalysisInput {
  bidText: string;
  bidTotal: number;
  projectType: string;
  projectTypeName?: string;
  squareFootage?: number;
  stateCode?: string;
  zipCode?: string;
  yearBuilt?: number;
  contractorName?: string;
  contractorLicenseNumber?: string;
  flags?: Array<{ title: string; level: string; description: string }>;
  missingItems?: string[];
  score?: number;
  grade?: string;
  priceVerdict?: string;
  pricePercentDiff?: number;
  scopeCompleteness?: number;
}

export interface ComprehensiveAnalysisResult {
  bottomLine: BottomLineSynthesis | null;
  priceIntelligence: PriceIntelligenceResult | null;
  talkTrack: TalkTrackResult | null;
  contractorResearch: ContractorResearchResult | null;
  errors: string[];
}

// ============================================
// CORE AI CLIENT
// ============================================

/**
 * Create a configured Gemini client
 */
export function createAIClient(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({ apiKey });
}

/**
 * Generate structured JSON from Gemini with retry logic
 */
export async function generateJSON<T>(
  client: GoogleGenAI,
  prompt: string,
  options: {
    maxRetries?: number;
    baseDelayMs?: number;
    useSearch?: boolean;
  } = {}
): Promise<T | null> {
  const { maxRetries = 2, baseDelayMs = 1000, useSearch = false } = options;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const config: Record<string, unknown> = {
        thinkingConfig: { thinkingBudget: 0 }
      };
      
      // Can't use JSON mode with search tool
      if (useSearch) {
        config.tools = [{ googleSearch: {} }];
      } else {
        config.responseMimeType = "application/json";
      }
      
      const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config
      });
      
      const text = response.text || '';
      
      // For search results, extract JSON from response
      let jsonText = text;
      if (useSearch) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in search response');
        }
        jsonText = jsonMatch[0];
      }
      
      return JSON.parse(jsonText) as T;
    } catch (err) {
      console.error(`AI generation attempt ${attempt}/${maxRetries} failed:`, err);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, baseDelayMs * attempt));
      }
    }
  }
  
  return null;
}

// ============================================
// BOTTOM LINE SYNTHESIS
// ============================================

export interface BottomLineInput {
  score: number;
  grade: string;
  gradeLabel: string;
  criticalFlags: Array<{ title: string }>;
  highFlags: Array<{ title: string }>;
  priceVerdict?: string;
  pricePercentDiff?: number;
  contractorTrustLevel?: string;
  contractorName?: string;
  contractorLicenseNumber?: string;
  scopeCompleteness?: number;
  missingCriticalItems?: string[];
  dealRiskLevel?: string;
  projectType?: string;
  bidTotal?: number;
}

export function buildBottomLinePrompt(input: BottomLineInput): string {
  const contextParts: string[] = [];
  
  contextParts.push(`Score: ${input.score}/100 (Grade: ${input.grade} - ${input.gradeLabel})`);
  
  if (input.projectType) {
    contextParts.push(`Project: ${input.projectType}`);
  }
  if (input.bidTotal) {
    contextParts.push(`Bid Total: $${input.bidTotal.toLocaleString()}`);
  }
  if (input.priceVerdict) {
    contextParts.push(`Price: ${input.priceVerdict}${input.pricePercentDiff ? ` (${input.pricePercentDiff > 0 ? '+' : ''}${input.pricePercentDiff}% vs market)` : ''}`);
  }
  if (input.contractorTrustLevel && input.contractorTrustLevel !== 'unknown') {
    let contractorInfo = `Contractor Trust: ${input.contractorTrustLevel}`;
    if (input.contractorName) contractorInfo += ` (${input.contractorName})`;
    if (input.contractorLicenseNumber) contractorInfo += ` - License verified: ${input.contractorLicenseNumber}`;
    contextParts.push(contractorInfo);
  } else if (input.contractorLicenseNumber) {
    contextParts.push(`Contractor License: ${input.contractorLicenseNumber} (verified)`);
  }
  if (input.scopeCompleteness !== undefined) {
    contextParts.push(`Scope Completeness: ${input.scopeCompleteness}%`);
  }
  if (input.dealRiskLevel) {
    contextParts.push(`Deal Risk: ${input.dealRiskLevel}`);
  }
  if (input.criticalFlags.length > 0) {
    contextParts.push(`Critical Issues: ${input.criticalFlags.map(f => f.title).join(', ')}`);
  }
  if (input.highFlags.length > 0) {
    contextParts.push(`High Concerns: ${input.highFlags.map(f => f.title).join(', ')}`);
  }
  if (input.missingCriticalItems && input.missingCriticalItems.length > 0) {
    contextParts.push(`Missing Items: ${input.missingCriticalItems.slice(0, 3).join(', ')}`);
  }

  return `You are helping a homeowner understand a contractor bid analysis. Given this summary:

${contextParts.join('\n')}

Provide a CONCISE bottom-line synthesis in JSON format:

{
  "verdict": "One sentence summary of whether to proceed (max 15 words)",
  "keyInsight": "The single most important thing they should know (max 25 words)", 
  "yourMove": "The one action they should take next (max 20 words)",
  "confidence": "high|medium|low"
}

Rules:
- Be conversational and helpful, like a knowledgeable friend giving advice
- NEVER use harsh language like "Do not proceed", "too risky", "red flag", or "critical issue"
- If license is missing: frame it gently - most bids don't include it upfront, it's worth asking for but not a dealbreaker if their track record is good
- If score >= 70 and no critical issues: be encouraging but mention any concerns
- If score 55-69: acknowledge potential but highlight what needs attention in a friendly way
- If score < 55: be honest about concerns but frame as "things to ask about" not warnings
- Never start with "Based on the analysis" or similar
- Use warm, plain language a homeowner would understand
- Focus on next steps rather than problems`;
}

export async function generateBottomLine(
  client: GoogleGenAI,
  input: BottomLineInput
): Promise<BottomLineSynthesis | null> {
  const prompt = buildBottomLinePrompt(input);
  return generateJSON<BottomLineSynthesis>(client, prompt);
}

// ============================================
// CONTRACTOR RESEARCH
// ============================================

export interface ContractorResearchInput {
  businessName: string;
  city?: string;
  state?: string;
  licenseNumber?: string;
}

export function buildContractorResearchPrompt(input: ContractorResearchInput): string {
  const { businessName, city, state, licenseNumber } = input;
  const locationContext = [city, state].filter(Boolean).join(", ");
  const licenseContext = licenseNumber ? `License #: ${licenseNumber}` : "";
  const searchName = businessName.replace(/\s+(Inc|LLC|Corp|Co|Ltd|LP)\.?$/i, '').trim();
  const bbbSearchQuery = `site:bbb.org "${searchName}"${state ? ` ${state}` : ''}`;
  
  const licenseSearchQuery = state === 'GA'
    ? `"${searchName}" Georgia contractor license RBCO OR GCCO OR RLCO`
    : state 
      ? `"${searchName}" ${state} contractor license`
      : `"${searchName}" contractor license`;

  return `Research this home improvement contractor thoroughly using web search:

CONTRACTOR TO RESEARCH:
- Business Name: ${businessName}
- Search variations: "${searchName}"
${locationContext ? `- Location: ${locationContext}` : ""}
${licenseContext}

REQUIRED SEARCHES - You MUST search for each of these:

1. BETTER BUSINESS BUREAU: Search "${bbbSearchQuery}" to find their BBB profile.
   Look for: accreditation status, letter grade (A+, A, B, etc.), years in business.
   CRITICALLY IMPORTANT: Look for complaint count - BBB pages show "X complaints closed in last 3 years" and total complaints filed.

2. CONTRACTOR LICENSE: Search "${licenseSearchQuery}" to find their state contractor license.
   Also search "site:buildzoom.com ${searchName}" - BuildZoom indexes state license records.
   ${state === 'GA' ? 'Georgia license prefixes: RBCO (Residential Basic Company), GCCO (General Commercial), RLCO (Residential Light Commercial), RLQA (Qualifying Agent).' : ''}

3. BUSINESS ENTITY: Search "${searchName}" secretary of state ${state || ''} business registration.

4. GOOGLE REVIEWS/MAPS: Search "${searchName} contractor reviews" for customer feedback.

5. REVIEW SITES: Search Yelp, Angi, Thumbtack, BuildZoom for ratings and reviews.

6. NEWS & COMPLAINTS: Search "${searchName} contractor complaints" or "${searchName} lawsuit" for any issues.

Return ONLY this JSON object:
{
  "summary": "2-3 sentence assessment",
  "reputation": {
    "score": "excellent|good|mixed|concerning|unknown",
    "highlights": ["specific positive findings"],
    "concerns": ["specific concerns"]
  },
  "bbbStatus": "BBB rating/grade or 'Not Found'",
  "bbbComplaints": {
    "total": null,
    "lastThreeYears": null,
    "resolved": null,
    "details": null
  },
  "businessRegistration": {
    "status": "active|inactive|dissolved|unknown",
    "entity": null,
    "registeredState": "${state || 'null'}",
    "licenseNumber": null,
    "notes": null
  },
  "permitHistory": {
    "recentPermits": null,
    "totalValue": null,
    "notes": null
  },
  "newsItems": [],
  "redFlags": []
}

IMPORTANT: Return actual data from search. Use null if not found.`;
}

export async function generateContractorResearch(
  client: GoogleGenAI,
  input: ContractorResearchInput
): Promise<ContractorResearchResult | null> {
  const prompt = buildContractorResearchPrompt(input);
  return generateJSON<ContractorResearchResult>(client, prompt, { 
    useSearch: true,
    maxRetries: 3 
  });
}

// ============================================
// FALLBACK GENERATORS
// ============================================

export function generateFallbackBottomLine(score: number): BottomLineSynthesis {
  if (score >= 70) {
    return {
      verdict: "This bid looks solid overall with minor areas to clarify.",
      keyInsight: "The fundamentals are in place, but review any flagged items before signing.",
      yourMove: "Request clarification on any flagged concerns before proceeding.",
      confidence: "medium"
    };
  } else if (score >= 55) {
    return {
      verdict: "This bid has potential but needs attention on several points.",
      keyInsight: "Some important details may be missing or unclear in the proposal.",
      yourMove: "Ask the contractor to address the flagged issues in writing.",
      confidence: "medium"
    };
  } else {
    return {
      verdict: "This bid has significant concerns that need to be resolved.",
      keyInsight: "Multiple red flags suggest you should proceed carefully or seek alternatives.",
      yourMove: "Consider getting additional bids before making a decision.",
      confidence: "medium"
    };
  }
}

export function generateFallbackContractorResearch(): ContractorResearchResult {
  return {
    summary: "Unable to complete automated research. Manual verification recommended.",
    reputation: {
      score: "unknown",
      highlights: [],
      concerns: ["Research could not be completed - verify credentials manually"]
    },
    bbbStatus: "Not Found",
    bbbComplaints: {
      total: null,
      lastThreeYears: null,
      resolved: null,
      details: null
    },
    businessRegistration: {
      status: "unknown",
      entity: null,
      registeredState: null,
      licenseNumber: null,
      notes: null
    },
    permitHistory: {
      recentPermits: null,
      totalValue: null,
      notes: null
    },
    newsItems: [],
    redFlags: []
  };
}
