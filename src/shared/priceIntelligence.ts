/**
 * Price Intelligence Engine
 * 
 * Provides AI-powered narrative explanations of pricing analysis.
 * This module acts as a "narrator" - it NEVER recalculates prices or scores.
 * It receives outputs from existing engines and translates them into plain English.
 * 
 * Data Sources (source of truth):
 * - priceScoreEngine.ts → price score, verdict, benchmarks
 * - marketRatesEngine.ts → regional multipliers, BLS wages
 * - dealRiskScoring.ts → risk flags, lowball detection
 * - scopeFingerprints.ts → project classification
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Input data from existing engines - this is what gets passed to Gemini
 */
export interface PriceIntelligenceInput {
  // From bid extraction
  bidText: string;
  bidTotal: number;
  squareFootage?: number;
  windowCount?: number;
  
  // From scopeFingerprints classification
  projectType: string;
  projectTypeName: string;
  
  // From priceScoreEngine
  priceScore: number;              // 0-100
  priceVerdict: string;            // "Great Deal", "Fair Price", etc.
  percentFromMarket: number;       // Positive = above, negative = below
  marketLow: number;
  marketMedian: number;
  marketHigh: number;
  dataSource: string;              // "zonda", "psf", "window"
  
  // From marketRatesEngine regional data
  regionalMultiplier: number;      // e.g., 1.08 for Atlanta
  regionName: string;              // e.g., "Atlanta Metro"
  
  // From dealRiskScoring
  flaggedIssues: PriceFlagSummary[];
  lowballDetected: boolean;
  lowballReason?: string;
  
  // Optional: detected line items for deeper analysis
  lineItems?: LineItemSummary[];
  
  // Location
  zipCode?: string;
  stateCode?: string;
}

export interface PriceFlagSummary {
  title: string;
  level: 'critical' | 'high' | 'medium' | 'low';
  description: string;
}

export interface LineItemSummary {
  description: string;
  amount: number;
  category?: string;
}

/**
 * Output from Price Intelligence - human-readable narratives
 */
export interface PriceIntelligenceResult {
  // Core narrative outputs
  priceSummary: string;            // 1-2 sentence plain-English verdict
  
  primaryDrivers: PriceDriver[];   // What's pushing the price up/down
  
  regionalContext: string;         // Local market conditions narrative
  
  materialFlags: MaterialFlag[];   // Materials at unusual price points
  
  negotiationHooks: NegotiationHook[];  // For Negotiate section
  
  // Metadata
  confidence: 'high' | 'medium' | 'low';
  generatedAt: string;
}

export interface PriceDriver {
  item: string;                    // "Custom cabinetry", "Labor costs", etc.
  impact: string;                  // "+$2,400", "-15%", "Major factor"
  explanation: string;             // Plain English why this matters
  direction: 'up' | 'down' | 'neutral';
}

export interface MaterialFlag {
  material: string;                // "Granite", "Vinyl windows", etc.
  trend: 'rising' | 'stable' | 'falling' | 'unknown';
  note: string;                    // Context about current market
}

export interface NegotiationHook {
  target: string;                  // "Cabinet line item", "Labor rate"
  approach: string;                // Suggested negotiation tactic
  potentialSavings: string;        // "$800-1,200", "5-10%"
  confidence: 'high' | 'medium' | 'low';
}

// ============================================================================
// PROMPT BUILDER
// ============================================================================

/**
 * Build the Gemini prompt from input data
 * This is where we translate structured data into a prompt that gets good results
 */
export function buildPriceIntelligencePrompt(input: PriceIntelligenceInput): string {
  const {
    bidTotal,
    squareFootage,
    windowCount,
    projectType,
    projectTypeName,
    priceScore,
    priceVerdict,
    percentFromMarket,
    marketLow,
    marketMedian,
    marketHigh,
    dataSource,
    regionalMultiplier,
    regionName,
    flaggedIssues,
    lowballDetected,
    lowballReason,
    lineItems,
    stateCode,
  } = input;

  // Build the context sections
  const sections: string[] = [];

  // Project Overview
  sections.push(`PROJECT OVERVIEW:
- Type: ${projectTypeName} (${projectType})
- Bid Total: $${bidTotal.toLocaleString()}
${squareFootage ? `- Square Footage: ${squareFootage} SF ($${(bidTotal / squareFootage).toFixed(2)}/SF)` : ''}
${windowCount ? `- Window Count: ${windowCount} units ($${(bidTotal / windowCount).toFixed(0)}/window)` : ''}
- Location: ${regionName}${stateCode ? `, ${stateCode}` : ''}`);

  // Price Analysis (from priceScoreEngine - DO NOT RECALCULATE)
  const marketPosition = percentFromMarket >= 0 
    ? `${percentFromMarket.toFixed(0)}% above market median`
    : `${Math.abs(percentFromMarket).toFixed(0)}% below market median`;
  
  sections.push(`PRICE ANALYSIS (pre-calculated - DO NOT recalculate):
- Score: ${priceScore}/100
- Verdict: ${priceVerdict}
- Market Position: ${marketPosition}
- Market Range: $${marketLow.toLocaleString()} (low) / $${marketMedian.toLocaleString()} (median) / $${marketHigh.toLocaleString()} (high)
- Data Source: ${dataSource === 'zonda' ? 'Zonda Cost vs Value 2025' : dataSource === 'window' ? 'Per-Unit Window Pricing' : 'BLS Wage Data + Industry Benchmarks'}`);

  // Regional Context
  const regionalNote = regionalMultiplier > 1 
    ? `${((regionalMultiplier - 1) * 100).toFixed(0)}% above national average`
    : regionalMultiplier < 1 
    ? `${((1 - regionalMultiplier) * 100).toFixed(0)}% below national average`
    : 'at national average';
  
  sections.push(`REGIONAL MARKET:
- Region: ${regionName}
- Regional Factor: ${regionalMultiplier.toFixed(2)}x (${regionalNote})
- Note: This regional adjustment is ALREADY INCLUDED in the market range above`);

  // Risk Flags
  if (flaggedIssues.length > 0) {
    const flagList = flaggedIssues
      .map(f => `- [${f.level.toUpperCase()}] ${f.title}: ${f.description}`)
      .join('\n');
    sections.push(`IDENTIFIED CONCERNS:
${flagList}`);
  }

  // Lowball Alert
  if (lowballDetected && lowballReason) {
    sections.push(`LOWBALL ALERT:
${lowballReason}`);
  }

  // Line Items (if available)
  if (lineItems && lineItems.length > 0) {
    const itemList = lineItems
      .slice(0, 10) // Limit to top 10 items
      .map(item => `- ${item.description}: $${item.amount.toLocaleString()}${item.category ? ` (${item.category})` : ''}`)
      .join('\n');
    sections.push(`KEY LINE ITEMS:
${itemList}`);
  }

  // Build the full prompt
  const systemContext = `You are a construction cost analyst helping homeowners understand contractor bids. 
Your role is to EXPLAIN the pre-calculated analysis in plain English, NOT to recalculate anything.
The price score, market comparisons, and regional adjustments have already been calculated by specialized engines.
Your job is to translate these numbers into insights a homeowner can understand and act on.`;

  const outputFormat = `Respond with a JSON object in this exact format:
{
  "priceSummary": "Maximum 15 words. State the facts: bid amount, verdict, price per unit. Example: '$41,813 bid is at market median. $27.88/sf.'",
  "primaryDrivers": [
    {
      "item": "Name of cost driver",
      "impact": "Dollar amount or percentage",
      "explanation": "One sentence max. No filler words.",
      "direction": "up" | "down" | "neutral"
    }
  ],
  "regionalContext": "One sentence max. Just the key fact about local pricing.",
  "materialFlags": [
    {
      "material": "Material name",
      "trend": "rising" | "stable" | "falling" | "unknown",
      "note": "3-5 words max"
    }
  ],
  "negotiationHooks": [
    {
      "target": "What to negotiate",
      "approach": "One direct sentence. What to ask for.",
      "potentialSavings": "Dollar range or percentage",
      "confidence": "high" | "medium" | "low"
    }
  ],
  "confidence": "high" | "medium" | "low"
}`;

  const rules = `RULES:
1. BE EXTREMELY DIRECT. No filler words. No "This bid is currently under review" fluff.
2. priceSummary must be 15 words or fewer. Just state: amount, verdict, $/sf or $/unit.
3. Cut words like "approximately", "currently", "which means", "indicating that"
4. Bad example: "This bid of $41,813 for your 1500 square foot basement finishing project is currently under review, sitting right at the national market median."
5. Good example: "$41,813 bid is at market median. $27.88/sf."
6. NEVER contradict the pre-calculated price score or market position
7. Include 2-3 primary drivers max
8. Negotiation hooks: one direct action per hook. "Ask for X" not "Consider inquiring about the possibility of X"
9. Regional context: just state the multiplier fact, nothing else`;

  return `${systemContext}

${sections.join('\n\n')}

${rules}

${outputFormat}`;
}

// ============================================================================
// FALLBACK GENERATOR (when Gemini unavailable)
// ============================================================================

/**
 * Generate a basic price intelligence result without AI
 * Used when Gemini API is unavailable or fails
 */
export function generateFallbackResult(input: PriceIntelligenceInput): PriceIntelligenceResult {
  const {
    bidTotal,
    priceVerdict,
    percentFromMarket,
    regionalMultiplier,
    regionName,
    lowballDetected,
  } = input;

  // Generate basic summary based on verdict - DIRECT style
  const psf = input.squareFootage ? (bidTotal / input.squareFootage).toFixed(2) : null;
  const psfText = psf ? ` $${psf}/sf.` : '';
  
  let priceSummary = '';
  if (priceVerdict === 'Great Deal') {
    priceSummary = `$${bidTotal.toLocaleString()} bid is ${Math.abs(percentFromMarket).toFixed(0)}% below market.${psfText}`;
  } else if (priceVerdict === 'Fair Price') {
    priceSummary = `$${bidTotal.toLocaleString()} bid is at market median.${psfText}`;
  } else if (priceVerdict === 'Undercutting - Seems Odd') {
    priceSummary = `$${bidTotal.toLocaleString()} bid is unusually low. Verify scope.${psfText}`;
  } else if (percentFromMarket > 0) {
    priceSummary = `$${bidTotal.toLocaleString()} bid is ${percentFromMarket.toFixed(0)}% above market.${psfText}`;
  } else {
    priceSummary = `$${bidTotal.toLocaleString()} bid is ${Math.abs(percentFromMarket).toFixed(0)}% below median.${psfText}`;
  }

  // Regional context - ONE sentence max
  const regionalContext = regionalMultiplier > 1.05
    ? `${regionName} costs ${((regionalMultiplier - 1) * 100).toFixed(0)}% above national average.`
    : regionalMultiplier < 0.95
    ? `${regionName} costs ${((1 - regionalMultiplier) * 100).toFixed(0)}% below national average.`
    : `${regionName} is at national average.`;

  // Basic drivers - direct style
  const primaryDrivers: PriceDriver[] = [
    {
      item: 'Local labor',
      impact: `${regionalMultiplier > 1 ? '+' : ''}${((regionalMultiplier - 1) * 100).toFixed(0)}%`,
      explanation: `${regionName} labor rates`,
      direction: regionalMultiplier > 1 ? 'up' : 'down'
    }
  ];

  if (lowballDetected) {
    primaryDrivers.push({
      item: 'Below-market price',
      impact: `${Math.abs(percentFromMarket).toFixed(0)}% under`,
      explanation: 'May indicate missing scope or quality issues',
      direction: 'down'
    });
  }

  return {
    priceSummary,
    primaryDrivers,
    regionalContext,
    materialFlags: [],
    negotiationHooks: [],
    confidence: 'low',
    generatedAt: new Date().toISOString(),
  };
}
