# RemodelerIQ Technical Specification

**Version:** 1.0  
**Last Updated:** 2025-01-26  
**Published URL:** https://remodeleriq.com (https://hfcoqpyfvx56a.mocha.app)

---

## 1. Project Overview

**RemodelerIQ** is an AI-powered contractor bid analysis platform that helps homeowners evaluate renovation estimates. The platform analyzes contractor bids for pricing accuracy, scope completeness, contract risks, and provides negotiation guidance backed by real market data.

### Core Value Proposition
- Upload a contractor bid (PDF/text)
- Get AI-powered risk analysis with confidence scoring
- Compare against regional market rates (BLS, Zonda, Houzz data)
- Receive negotiation scripts and questions to ask
- Identify missing scope items and change order risks

---

## 2. Technology Stack

### Frontend
- **Framework:** React 18 + TypeScript
- **Routing:** React Router v6
- **Styling:** Tailwind CSS + shadcn/ui components
- **Maps:** Leaflet (Trust Radar feature)
- **Charts:** Recharts
- **PDF Export:** html2pdf.js
- **Build Tool:** Vite

### Backend
- **Runtime:** Cloudflare Workers (serverless)
- **Framework:** Hono (Express-like API framework)
- **Database:** Cloudflare D1 (SQLite)
- **File Storage:** Cloudflare R2 (object storage)
- **AI:** Google Gemini 2.5 Flash/Pro via @google/genai
- **Language:** TypeScript

### External APIs & Data Sources
- **BLS OEWS API:** Bureau of Labor Statistics wage data (May 2023)
- **FRED API:** Federal Reserve Economic Data (inflation indices)
- **Google Places API:** Contractor verification and location data
- **Stripe:** Payment processing ($29.99/year premium)
- **Cloudflare Email Workers:** Transactional emails

### Authentication
- **Google OAuth 2.0:** Via Mocha's @getmocha/users-service
- **Magic Link Auth:** Custom passwordless email authentication
- **Session Management:** Cookie-based (riq_session), 60-day expiry

---

## 3. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (React SPA)                        │
│  - Upload bid documents                                      │
│  - View analysis reports                                     │
│  - Export PDFs                                               │
│  - Manage account/subscription                               │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              CLOUDFLARE WORKER (Hono API)                    │
│  - /api/analyze/* - Bid analysis endpoints                  │
│  - /api/contractor/* - Contractor research                   │
│  - /api/market-rates - Market comparison                     │
│  - /api/bls/wages - Labor rate data                          │
│  - /api/fred/* - Inflation data                              │
│  - /auth/* - Authentication endpoints                        │
│  - /api/webhooks/stripe - Payment webhooks                   │
└──────────────┬────────────────┬─────────────────────────────┘
               │                │
               ▼                ▼
    ┌──────────────┐   ┌──────────────────┐
    │  D1 Database │   │  External APIs    │
    │  (SQLite)    │   │  - BLS OEWS       │
    │              │   │  - FRED           │
    └──────────────┘   │  - Google Places  │
                       │  - Gemini AI      │
                       │  - Stripe         │
                       └──────────────────┘
```

### Directory Structure

```
src/
├── data/
│   └── sampleBidData.ts          # Demo bid for "See How It Works"
├── react-app/                     # Frontend code
│   ├── components/                # React components
│   │   ├── ui/                    # shadcn/ui primitives
│   │   ├── Header.tsx             # Main navigation
│   │   ├── ReportView.tsx         # Main analysis display
│   │   ├── TalkTrackView.tsx      # Negotiation guidance
│   │   ├── PriceAnalysisCard.tsx  # Price comparison UI
│   │   ├── ContractorPulseCard.tsx # Contractor verification
│   │   ├── ChangeOrderPredictorCard.tsx # Risk detection
│   │   └── ...
│   ├── pages/                     # Route pages
│   │   ├── Home.tsx               # Main app (upload + analysis)
│   │   ├── LaborRates.tsx         # Market rate explorer
│   │   ├── TrustedRadar.tsx       # Contractor search map
│   │   ├── Premium.tsx            # Pricing/checkout
│   │   ├── Settings.tsx           # User account
│   │   └── ...
│   ├── hooks/                     # Custom React hooks
│   │   ├── useCombinedAuth.tsx    # Auth state management
│   │   ├── usePdfExport.ts        # PDF generation
│   │   └── useGeolocation.ts      # Location detection
│   └── App.tsx                    # Root component with routing
├── shared/                        # Shared business logic (client + server)
│   ├── analysisEngine.ts          # Core bid analysis orchestrator
│   ├── dealRiskScoring.ts         # Risk scoring algorithms
│   ├── scopeFingerprints.ts       # Project classification engine
│   ├── unifiedScoreEngine.ts      # Confidence score calculation
│   ├── priceScoreEngine.ts        # Price verdict system
│   ├── changeOrderPatterns.ts     # Vague term detection
│   ├── tradeDetection.ts          # Multi-trade bid analysis
│   ├── marketRatesEngine.ts       # BLS wage comparison
│   ├── blindBidEngine.ts          # Analysis without square footage
│   ├── aiServices.ts              # Gemini AI client wrapper
│   ├── houzzBenchmarks.ts         # Houzz cost data
│   ├── blsOewsData.ts             # BLS wage dataset (16 trades)
│   ├── regionalRedditInsights.ts  # State-specific concerns
│   ├── smartPricingRules.ts       # ROI-based pricing rules
│   ├── locationSavings.ts         # City-specific savings data
│   └── ...
└── worker/                        # Backend code
    ├── index.ts                   # Main Hono app with API routes
    ├── routes/
    │   ├── auth.ts                # Google OAuth routes
    │   ├── magicLink.ts           # Email auth routes
    │   ├── stripe.ts              # Payment + webhooks
    │   └── analyze-community.ts   # Community insights
    └── middleware/
        └── auth.ts                # JWT validation
```

---

## 4. Database Schema

### Key Tables

#### `user_profiles`
- Stores user account data
- Links Google OAuth (`google_id`) and magic link auth (`email`)
- `is_premium` (BOOLEAN) - Premium status
- `premium_ends_at` (DATETIME) - Subscription expiration
- `stripe_session_id` - Last checkout session

#### `user_sessions`
- Session tokens for magic link auth
- `session_token` (TEXT UNIQUE) - 60-day JWT
- `expires_at` (DATETIME)

#### `magic_link_tokens`
- Temporary tokens for email authentication
- `token` (TEXT UNIQUE) - 30-minute expiry for login, 60-minute for welcome emails
- `is_used` (BOOLEAN) - Prevents replay attacks

#### `usage_tracking`
- Tracks bid analyses per user
- Enforces tier limits: Guest (3 total), Free (1/day), Premium (unlimited)

#### `bls_occupational_wages`
- BLS May 2023 wage data for 16 construction trades
- SOC codes mapped to hourly/annual wages by MSA

#### `zip_to_msa`
- 150+ ZIP → MSA code mappings
- Used to lookup regional wage data

#### `fred_cache`
- Cached FRED inflation data
- Series: PPI building materials, CPI, construction cost index

#### `trusted_contractors`
- Google Places API cache for contractor search
- Stores license status, ratings, location data

---

## 5. Core Modules

### 5.1 Analysis Engine (`src/shared/analysisEngine.ts`)

**Main entry point:** `analyzeBid(bidText, options)`

**Flow:**
1. **Trade Detection** - Classify project type (kitchen, bathroom, roofing, etc.)
2. **Scope Fingerprinting** - Identify scope classification (cosmetic, standard, luxury)
3. **Unit Detection** - Extract square footage, window count, linear feet
4. **Risk Flagging** - Detect missing clauses, vague terms, financial risks
5. **Scope Analysis** - Identify missing items (permits, insurance, warranties)
6. **Deal Risk Scoring** - Calculate price realism, financial risk, trust buffer
7. **Unified Score** - Combine into single confidence score (0-100)

**Returns:** `AnalysisResult` object with flags, scores, recommendations

### 5.2 Unified Score Engine (`src/shared/unifiedScoreEngine.ts`)

**Formula:**
```
Total Score = (Contract Risk × 0.40) + (Scope Completeness × 0.30) + (Price Reasonableness × 0.30)
```

**Contract Risk (40%):**
- Starts at 100
- Deducts points for missing critical clauses
- Critical flags: -20 points
- High flags: -15 points
- Medium flags: -7 points
- Low flags: -3 points
- Missing license: -12 points

**Scope Completeness (30%):**
- Based on percentage of expected items documented
- Includes permits, insurance, warranties, payment schedules

**Price Reasonableness (30%):**
- Compares bid to market averages (Houzz, BLS, Zonda)
- Flags unusually low (potential lowball) or high pricing

### 5.3 Deal Risk Scoring (`src/shared/dealRiskScoring.ts`)

Three dimensions:

**1. Price Realism** - `calculatePriceRealism()`
- Detects bids >30% below market (potential corner-cutting)
- Detects bids >40% above market (overpriced)

**2. Financial Risk** - `calculateFinancialRisk()`
- Flags large upfront deposits (>50%)
- Missing payment schedules
- No retainage clause

**3. Trust Buffer** - `calculateTrustBuffer()`
- Rewards verified reviews (+3 pts for 50+ reviews)
- Insurance verification (+2 pts)
- BBB A rating (+2 pts)
- Written warranty (+3 pts)
- Penalties for BBB complaints

### 5.4 Scope Fingerprints (`src/shared/scopeFingerprints.ts`)

**Project Classification System:**
- 40+ project types (kitchen-cosmetic, bathroom-major, roof-replacement, etc.)
- Pattern matching on keywords and scope indicators
- Multi-trade detection (GC vs. single-trade contractor)

**Key Functions:**
- `classifyScopeFingerprint()` - Main classifier
- `detectTierMismatch()` - Identifies "luxury words, budget price" scenarios
- `detectPermitLiability()` - Flags unpermitted structural work
- `calculateScopeGapCosts()` - Estimates cost of missing items

### 5.5 Change Order Patterns (`src/shared/changeOrderPatterns.ts`)

**Detects 25+ risky phrases:**
- "As needed", "TBD", "Allowance", "Or equivalent"
- "Unless otherwise specified", "Subject to change"

**Returns:**
- Risk score (0-100)
- Vague terms found with line numbers
- Suggested clarification questions

### 5.6 Market Rates Engine (`src/shared/marketRatesEngine.ts`)

**Data Sources:**
- BLS OEWS May 2023 (16 trades: carpenters, plumbers, electricians, etc.)
- Regional cost multipliers (45+ MSA codes)
- State-specific adjustments

**Flow:**
1. Detect trade from bid text
2. Lookup ZIP → MSA code
3. Fetch BLS hourly wage for MSA
4. Apply regional cost multiplier
5. Compare bid labor rates to market

### 5.7 Smart Pricing Engine (`src/shared/smartPricingEngine.ts`)

**ROI-Based Pricing Rules:**
- 800+ lines of project-specific pricing logic
- Detects cost-effective upgrades (e.g., quartz counters in kitchen)
- Flags low-ROI choices (luxury finishes in low-value homes)

### 5.8 AI Services (`src/shared/aiServices.ts`)

**Gemini Integration:**
- `createAIClient()` - Initializes Gemini client
- `generateJSON()` - Structured output with retry logic
- `buildBottomLinePrompt()` - Generates AI verdict summary
- `buildContractorResearchPrompt()` - Contractor background analysis

**Models Used:**
- Gemini 2.5 Flash - Fast analysis (most endpoints)
- Gemini 2.5 Pro - Deep analysis (optional)

**Rate Limiting:**
- 60 requests/minute per IP
- Exponential backoff on failures

---

## 6. API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/google/login` | Initiate Google OAuth flow |
| GET | `/auth/google/callback` | OAuth callback handler |
| POST | `/auth/magic-link/request` | Send magic link email |
| GET | `/auth/magic-link/verify` | Verify token, create session |
| GET | `/auth/me` | Get current user profile |
| POST | `/auth/logout` | Destroy session |

### Bid Analysis

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analyze/ai` | AI bid analysis (legacy) |
| POST | `/api/synthesize-bottom-line` | Generate AI verdict summary |
| POST | `/api/price-intelligence` | Price comparison analysis |
| POST | `/api/change-order-prediction` | Detect vague terms/risks |
| POST | `/api/comprehensive-analysis` | Full multi-trade analysis |
| POST | `/api/talktrack/ai` | Generate negotiation script |

### Market Data

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/market-rates` | BLS wage comparison |
| POST | `/api/price-score` | Calculate price verdict |
| POST | `/api/bls/rates` | Fetch BLS rates for trade/ZIP |
| GET | `/api/bls/wages` | Get all wages for MSA |
| POST | `/api/blind-bid-analysis` | Analysis without square footage |

### Contractor Research

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/contractor/google-places` | Search Google Places |
| POST | `/api/contractor/research` | AI contractor background check |
| POST | `/api/contractor/review-sentiment` | Analyze review sentiment |
| GET | `/api/trusted-radar/search` | Map-based contractor search |
| POST | `/api/trusted-radar/enrich` | Enrich contractor data |

### External Data

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/fred/refresh` | Refresh FRED inflation cache |
| GET | `/api/fred/inflation-factor` | Get current inflation multiplier |
| GET | `/api/fred/status` | FRED cache status |
| GET | `/api/ppi/materials` | Material price trends |

### Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/checkout/create-session` | Create Stripe checkout |
| POST | `/api/premium/guest-checkout` | Guest checkout (no auth) |
| POST | `/api/webhooks/stripe` | Stripe webhook handler |

### Usage Tracking

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/usage/track` | Log user action |
| GET | `/api/usage/stats` | Get user usage stats (auth required) |

---

## 7. Data Flow

### Bid Upload & Analysis Flow

```
User uploads PDF/text
    ↓
Frontend: UploadArea.tsx validates file
    ↓
Frontend: extractDetectedData() parses text
    ↓
Frontend: Calls analyzeBid() from analysisEngine.ts
    ↓
analysisEngine.ts:
  1. detectProjectTrade() → classify project
  2. detectUnits() → extract SF, windows, etc.
  3. classifyScopeFingerprint() → scope classification
  4. analyzeScope() → missing items
  5. calculateDealRisk() → risk scores
  6. calculateUnifiedScore() → final score
    ↓
Frontend: Display ReportView.tsx with results
    ↓
User clicks "Negotiation" tab
    ↓
Frontend: Calls POST /api/talktrack/ai
    ↓
Backend: buildTalkTrackPrompt() → Gemini AI
    ↓
Backend: Returns structured negotiation script
    ↓
Frontend: Display UnifiedNegotiationCard.tsx
```

### Price Comparison Flow

```
User's bid analyzed → bidTotal, squareFootage, zipCode extracted
    ↓
Frontend: Calls POST /api/price-score
    ↓
Backend: priceScoreEngine.ts
  1. lookupZipInfo(zipCode) → get MSA code
  2. getBenchmarkCost(projectType, squareFootage) → Houzz data
  3. Apply regional multiplier (MSA-specific)
  4. Compare bidTotal vs. market average
  5. Calculate verdict: "Fair Price", "Unusually Low", "Overpriced"
    ↓
Backend: Returns PriceScoreResult
    ↓
Frontend: PriceAnalysisCard.tsx displays badge + breakdown
```

### Contractor Research Flow

```
User clicks "Contractor Pulse"
    ↓
Frontend: Calls GET /api/contractor/google-places?name=X&state=Y
    ↓
Backend: Query Google Places API
    ↓
Backend: Store in trusted_contractors table (cache)
    ↓
Backend: Return business info, rating, reviews
    ↓
Frontend: ContractorPulseCard.tsx displays results
    ↓
User clicks "Deep Analysis"
    ↓
Frontend: Calls POST /api/contractor/research
    ↓
Backend: buildContractorResearchPrompt() → Gemini AI
    ↓
Backend: Analyzes reviews, BBB, licensing
    ↓
Frontend: Display AI-generated contractor summary
```

---

## 8. Key Algorithms

### 8.1 Confidence Score Calculation

**Input:** 
- Analysis flags (critical, high, medium, low)
- Scope analysis (included, missing, implied items)
- Price comparison (bid vs. market)

**Algorithm:**
```typescript
// Contract Risk (40% weight)
contractScore = 100
contractScore -= (criticalFlags * 20)
contractScore -= (highFlags * 15)
contractScore -= (mediumFlags * 7)
contractScore -= (lowFlags * 3)
if (noLicense) contractScore -= 12
contractScore = Math.max(0, contractScore)

// Scope Completeness (30% weight)
scopeScore = (includedCount / (includedCount + missingCount)) * 100
if (criticalMissing > 0) scopeScore -= 30
if (importantMissing > 0) scopeScore -= 15

// Price Reasonableness (30% weight)
priceScore = 100
if (bid < market * 0.70) priceScore = 50  // Unusually low
else if (bid < market * 0.85) priceScore = 75
else if (bid > market * 1.40) priceScore = 50  // Overpriced
else if (bid > market * 1.15) priceScore = 75

// Final Score
totalScore = (contractScore * 0.40) + (scopeScore * 0.30) + (priceScore * 0.30)
grade = getGrade(totalScore)  // A, B, C, D, F
```

### 8.2 Project Classification (Scope Fingerprints)

**Decision Tree:**
```
1. Detect disqualifying patterns
   - If contains "Foundation" + "Footer" → foundation-repair
   - If contains "Septic" → septic-system
   - If contains "HVAC" + "Ductwork" → hvac-system

2. Detect primary trade
   - Count flooring keywords (>5 = flooring project)
   - Count roofing keywords (>8 = roofing project)
   - Count kitchen keywords (>10 = kitchen project)

3. Classify tier within trade
   Kitchen tiers:
   - "Paint", "Hardware" only → cosmetic
   - "Refacing", "Counters" → refresh
   - "Cabinet replacement" → minor
   - "Gut", "Layout change" → major
   - "Wolf", "Sub-Zero", "Custom" → upscale

4. Multi-trade detection
   - If >3 trades detected → general-contractor
   - Check labor ratio: if <40% → GC (subcontracted work)
```

### 8.3 Change Order Risk Scoring

**Pattern Matching:**
```typescript
const VAGUE_PATTERNS = [
  { phrase: "as needed", risk: "high", category: "unquantified" },
  { phrase: "TBD", risk: "high", category: "undefined" },
  { phrase: "allowance", risk: "medium", category: "budget-placeholder" },
  { phrase: "or equivalent", risk: "medium", category: "material-vagueness" },
  // ... 25+ patterns
];

function calculateChangeOrderRisk(bidText: string) {
  const matches = [];
  for (const pattern of VAGUE_PATTERNS) {
    if (bidText.toLowerCase().includes(pattern.phrase)) {
      matches.push(pattern);
    }
  }
  
  const highRiskCount = matches.filter(m => m.risk === "high").length;
  const mediumRiskCount = matches.filter(m => m.risk === "medium").length;
  
  riskScore = (highRiskCount * 20) + (mediumRiskCount * 10);
  riskScore = Math.min(100, riskScore);
  
  return { riskScore, matches };
}
```

---

## 9. Authentication & Authorization

### 9.1 Google OAuth Flow

1. User clicks "Sign in with Google"
2. Frontend redirects to `/auth/google/login`
3. Backend generates OAuth URL with Mocha callback
4. User authorizes on Google
5. Google redirects to `/auth/callback` with code
6. Backend exchanges code for user profile
7. Backend creates/updates `user_profiles` record
8. Backend creates session cookie (via Mocha SDK)
9. Frontend receives user object

### 9.2 Magic Link Flow

1. User enters email on `/login` or `/auth/magic-link`
2. Frontend calls `POST /auth/magic-link/request`
3. Backend:
   - Generates random token (32 chars)
   - Invalidates old tokens for email
   - Stores in `magic_link_tokens` (30min expiry)
   - Sends email via Cloudflare Email Workers
4. User clicks link in email
5. Link goes to `/auth/verify?token=XXX`
6. Frontend calls `GET /auth/magic-link/verify?token=XXX`
7. Backend:
   - Validates token (not expired, not used)
   - Creates/updates user_profile
   - Generates session token (60-day JWT)
   - Stores in `user_sessions`
   - Sets `riq_session` cookie
8. Frontend redirects to home page (authenticated)

### 9.3 Session Management

**Cookie:** `riq_session`
- HttpOnly, Secure, SameSite=Lax
- 60-day expiration
- JWT format: `{ userId, email, exp }`

**Validation:** `authMiddleware` in protected routes
- Parses cookie
- Looks up session in `user_sessions`
- Checks expiration
- Attaches user to request context

### 9.4 Tier System

| Tier | Access | Analysis Limit |
|------|--------|----------------|
| **Guest** (anonymous) | Basic bid analysis only | 3 total (localStorage) |
| **Free** (signed up) | + Price Analysis | 1/day |
| **Premium** ($29.99/year) | All features | Unlimited |

**Enforcement:**
- `usage_tracking` table logs each analysis
- Frontend checks `anonymousUploadCount` in localStorage
- Backend validates user tier before returning premium features
- Premium features wrapped in `<PremiumGate>` component

---

## 10. External Integrations

### 10.1 BLS OEWS API

**Purpose:** Fetch hourly wage data for construction trades

**Endpoint:** `https://api.bls.gov/publicAPI/v2/timeseries/data/`

**Series IDs:** 
- OEUM003SA47210002103 - Carpenters (national)
- OEUM003SA47210002104 - Electricians (national)
- (14 more trades...)

**Usage:**
- Called by `getStateAdjustedWages()` in `blsLaborRates.ts`
- Cached in memory (not DB)
- Used for labor rate comparison in Market Analysis

### 10.2 FRED API

**Purpose:** Inflation and material price trends

**Endpoint:** `https://api.stlouisfed.org/fred/series/observations`

**Series:**
- `WPUSI012011` - PPI Building Materials
- `CUUR0000SA0` - CPI All Urban Consumers
- `PCUOMFGOMFG` - Construction Cost Index

**Flow:**
1. `POST /api/fred/refresh` triggers fetch
2. `fetchFredSeries()` calls FRED API
3. Data stored in `fred_cache` table
4. `calculateInflationFactor()` computes 2021-2024 multiplier (~5.9%)
5. Applied to all Houzz benchmark costs

### 10.3 Google Places API

**Purpose:** Contractor search and verification

**Endpoint:** `https://maps.googleapis.com/maps/api/place/textsearch/json`

**Flow:**
1. User searches contractor name + state
2. `GET /api/contractor/google-places?name=ABC&state=GA`
3. Backend calls Places API with radius filter
4. Returns: name, rating, review_count, address, phone, website
5. Cached in `trusted_contractors` table (24hr TTL)

**Trust Radar Map:**
- Uses Leaflet to display contractors on map
- Fetches within radius of user location
- Shows license status, BBB grade, ratings

### 10.4 Stripe Integration

**Product:** $29.99/year Premium Membership

**Flow:**
1. User clicks "Upgrade to Premium"
2. Frontend calls `POST /api/checkout/create-session`
3. Backend creates Stripe Checkout session:
   - `mode: 'payment'` (one-time, not subscription)
   - `success_url: /settings?payment=success`
   - `cancel_url: /premium`
4. User completes payment on Stripe
5. Stripe calls `POST /api/webhooks/stripe`
6. Webhook handler:
   - Verifies signature
   - Updates `user_profiles.is_premium = 1`
   - Sets `premium_ends_at = +1 year`
   - Sends welcome email with magic link
7. Frontend shows welcome banner

**Guest Checkout:**
- No account required
- Webhook creates user_profile by email
- Email includes magic link to claim account

### 10.5 Cloudflare Email Workers

**Binding:** `EMAILS` (Durable Object)

**From:** `notifications@www.remodeleriq.com`

**Templates:**
1. **Magic Link Email**
   ```
   Subject: Sign in to RemodelerIQ
   Click here: /auth/verify?token=XXX
   Expires in 30 minutes
   ```

2. **Welcome Email (Premium)**
   ```
   Subject: 🎉 Welcome to RemodelerIQ Premium!
   Your access expires: [date]
   Magic link: /auth/verify?token=YYY (60min)
   ```

**Sending:**
```typescript
await env.EMAILS.send({
  from: "notifications@www.remodeleriq.com",
  to: email,
  subject: subject,
  html: htmlContent
});
```

---

## 11. Frontend Components

### 11.1 Key Pages

| Page | Route | Purpose |
|------|-------|---------|
| Home.tsx | `/` | Upload bid, view analysis |
| LaborRates.tsx | `/labor-rates` | BLS wage explorer |
| TrustedRadar.tsx | `/trusted-radar` | Map-based contractor search |
| Premium.tsx | `/premium` | Pricing/checkout |
| Settings.tsx | `/settings` | Account management |
| Login.tsx | `/login` | Unified login (Google + email) |

### 11.2 Key Components

**ReportView.tsx**
- Main analysis display
- 10+ cards: Price Analysis, Contractor Pulse, Scope Comparison, etc.
- Tabbed interface: Bid Analysis, Market Analysis, Negotiation
- PDF export wrapper (`id="report-content"`)

**TalkTrackView.tsx**
- Negotiation guidance tab
- UnifiedNegotiationCard with AI-generated script
- QuestionsToAskCard with categorized questions

**PriceAnalysisCard.tsx**
- Shows price verdict badge (Fair Price, Unusually Low, Overpriced)
- Breakdown: Labor vs. Material allocation
- Market comparison chart

**ContractorPulseCard.tsx**
- Google Places integration
- License verification
- BBB grade, review count, rating
- "Deep Analysis" button → AI summary

**ChangeOrderPredictorCard.tsx**
- Lists vague terms found in bid
- Risk score gauge (0-100)
- Suggested clarification questions
- Collapsible by default

**QuestionsToAskCard.tsx**
- Aggregates questions from multiple sources:
  - AI-generated
  - Regional insights (Reddit data)
  - Deal risk patterns
  - Scope gaps
  - Change order risks
- Deduplicates and categorizes
- Color-coded source badges

**PremiumGate.tsx**
- Wrapper component for premium features
- Shows blurred placeholder for free users
- "Upgrade to Premium" CTA
- Three variants: PremiumGate, CompactPremiumGate, NegotiationPremiumGate

---

## 12. Testing

### Test Coverage

**Scenario Tests:** `src/shared/testData/scenarioTestRunner.ts`
- 120 test cases covering:
  - Kitchen scenarios (cosmetic, minor, major, upscale)
  - Bathroom scenarios (refresh, standard, upscale, addition)
  - Exterior scenarios (roofing, siding, windows)
  - Infrastructure (HVAC, plumbing, electrical)
  - Specialty (ADU, garage conversion, basement)
- **Current Pass Rate:** 90.8% (109/120)

**Fingerprint Tests:** `docs/final-test-report.md`
- Scope classification accuracy
- Multi-trade detection
- Tier mismatch detection
- **Current Accuracy:** 92.5% (111/120)

**Auth Tests:** `src/tests/magicLinkAuth.test.ts`
- Magic link token generation
- Expiration validation
- Session creation
- **81 test cases**

**Payment Tests:** `src/tests/paymentFlow.test.ts`
- Stripe checkout creation
- Webhook handling
- Premium activation
- **39 test cases**

### Running Tests

```bash
# All tests
npx vitest run

# Specific suite
npx vitest run src/tests/magicLinkAuth.test.ts

# Scenario tests (manual)
POST /api/tests/scope-fingerprints
```

---

## 13. Deployment & Environment

### Environment Variables (Secrets)

| Name | Purpose |
|------|---------|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini API key |
| `BLS_API_KEY` | Bureau of Labor Statistics (optional) |
| `FRED_API_KEY` | Federal Reserve data |
| `GOOGLE_PLACES_API_KEY` | Google Places API |
| `STRIPE_SECRET_KEY` | Stripe payments (LIVE mode) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification |
| `MOCHA_USERS_SERVICE_API_URL` | Mocha auth service |
| `MOCHA_USERS_SERVICE_API_KEY` | Mocha auth key |

### Cloudflare Bindings

- `DB` - D1 database
- `R2_BUCKET` - Object storage (unused currently)
- `EMAILS` - Email sending service

### Published App

- **Production URL:** https://remodeleriq.com
- **Dev Preview:** https://hfcoqpyfvx56a.mocha.app
- **Hosting:** Cloudflare Pages + Workers
- **CDN:** Global edge network

### Domain Configuration

- **Custom Domain:** remodeleriq.com
- **OAuth Redirect:** Configured in Mocha dashboard
- **Stripe Webhooks:** Points to remodeleriq.com/api/webhooks/stripe

---

## 14. Data Sources & Benchmarks

### 14.1 Houzz Benchmarks (`src/shared/houzzBenchmarks.ts`)

**20+ project types with cost ranges:**

```typescript
MINIMUM_PROJECT_COSTS = {
  'kitchen-major': { low: 45000, high: 85000, laborPercent: 40 },
  'bathroom-standard': { low: 18000, high: 35000, laborPercent: 45 },
  'roof-replacement': { low: 8000, high: 22000, laborPercent: 30 },
  // ...
}
```

**Labor Percentage Benchmarks:**
- Kitchen remodels: 35-40%
- Bathroom remodels: 40-45%
- Roofing: 25-30%
- Flooring: 30-35%
- HVAC: 25-30%

### 14.2 BLS OEWS Data (`src/shared/blsOewsData.ts`)

**16 Construction Trades (May 2023):**

| Trade | SOC Code | Median Hourly |
|-------|----------|---------------|
| Carpenters | 47-2031 | $25.85 |
| Electricians | 47-2111 | $32.18 |
| Plumbers | 47-2152 | $30.49 |
| HVAC Mechanics | 47-2111 | $28.63 |
| Roofers | 47-2181 | $23.12 |
| Painters | 47-2141 | $23.47 |
| ... | ... | ... |

**Regional Multipliers:** 45+ MSA codes with cost-of-living adjustments
- San Francisco: 1.45x
- New York: 1.38x
- Atlanta: 1.02x
- Detroit: 0.92x

### 14.3 Regional Reddit Insights (`src/shared/regionalRedditInsights.ts`)

**State-specific construction concerns:**

```typescript
REGIONAL_INSIGHTS = {
  GA: {
    climateConcerns: ['High humidity', 'Termites', 'Foundation settling'],
    licensingNotes: ['No statewide contractor license', 'Local permits vary'],
    recommendations: ['Termite bond', 'Moisture barriers', 'Crawl space encapsulation']
  },
  CA: {
    climateConcerns: ['Seismic activity', 'Drought', 'Wildfire risk'],
    licensingNotes: ['CSLB license required', 'Workers comp mandatory'],
    recommendations: ['Seismic retrofitting', 'Fire-resistant materials']
  },
  // All 50 states + DC
}
```

### 14.4 Smart Pricing Rules (`src/shared/smartPricingRules.ts`)

**ROI-Based Guidance:**

```typescript
SMART_PRICING_RULES = [
  {
    projectType: 'kitchen-major',
    upgrade: 'quartz-countertops',
    costRange: { low: 3500, high: 8000 },
    roi: 85,
    verdict: 'excellent',
    reasoning: 'Quartz returns 85% at resale, lower maintenance than marble'
  },
  {
    projectType: 'bathroom-standard',
    upgrade: 'heated-floors',
    costRange: { low: 1200, high: 2500 },
    roi: 45,
    verdict: 'fair',
    reasoning: 'Appeals to buyers but only 45% ROI'
  },
  // 800+ lines of rules
]
```

---

## 15. Known Issues & Future Improvements

### Current Limitations

1. **Scope Fingerprinting:** 77.5% accuracy (target: 90%+)
   - Still misclassifies some multi-trade bids
   - Basement detection needs improvement

2. **Change Order Prediction:** Pattern-based only
   - No ML model for risk prediction
   - Some false positives on technical terms

3. **Contractor Verification:** Limited to Google Places
   - No BBB API integration (manual lookup)
   - License verification is state-specific (50 different systems)

4. **Market Data Freshness:**
   - BLS data is May 2023 (annual updates)
   - FRED data requires manual refresh
   - Houzz benchmarks are static (2021 baseline)

### Roadmap

**Phase 1 (Q1 2025):**
- [ ] Improve basement/foundation detection
- [ ] Add more MSA codes (currently 45, target 100+)
- [ ] Implement BBB API for automated grade fetching

**Phase 2 (Q2 2025):**
- [ ] ML model for change order risk (replace pattern matching)
- [ ] Automated FRED refresh (monthly cron job)
- [ ] PDF upload with OCR (currently text extraction only)

**Phase 3 (Q3 2025):**
- [ ] Remodeler Studio (proposal generation tool)
- [ ] Photo analysis (detect scope from before/after pics)
- [ ] Multi-bid comparison (side-by-side analysis)

---

## 16. Code Conventions

### TypeScript Style

- **Strict mode enabled** (`tsconfig.json`)
- **No implicit any**
- **Explicit return types** on public functions
- **Zod schemas** for external data validation

### File Naming

- **Components:** PascalCase (e.g., `PriceAnalysisCard.tsx`)
- **Utilities/Services:** camelCase (e.g., `dealRiskScoring.ts`)
- **Constants:** UPPER_SNAKE_CASE
- **Types/Interfaces:** PascalCase with descriptive names

### Import Aliases

```typescript
@/react-app/*   → src/react-app/*
@/shared/*      → src/shared/*
@/worker/*      → src/worker/*
```

### Component Structure

```typescript
// 1. Imports
import { useState } from 'react';
import { Type1 } from '@/shared/types';

// 2. Types/Interfaces
interface ComponentProps {
  data: Type1;
  onAction: () => void;
}

// 3. Constants (if needed)
const MAX_ITEMS = 10;

// 4. Component
export default function MyComponent({ data, onAction }: ComponentProps) {
  // State
  const [state, setState] = useState();
  
  // Effects
  useEffect(() => {}, []);
  
  // Handlers
  const handleClick = () => {};
  
  // Render
  return <div>...</div>;
}

// 5. Helper components (if needed)
function HelperComponent() {}
```

---

## 17. Quick Reference

### Common Tasks

**Add a new API endpoint:**
1. Add route in `src/worker/index.ts`
2. Create handler function
3. Use `apiResponse()` helper for JSON responses
4. Add to API Endpoints section in this doc

**Add a new analysis flag:**
1. Define in `src/shared/analysisEngine.ts` (AnalysisFlag interface)
2. Add detection logic in appropriate module (e.g., dealRiskScoring.ts)
3. Return flag in analysis result
4. Display in ReportView.tsx

**Add a new project type:**
1. Add classification in `src/shared/scopeFingerprints.ts`
2. Add cost benchmarks in `src/shared/houzzBenchmarks.ts`
3. Add test cases in `src/shared/testData/`
4. Update scope fingerprint logic

**Add a new premium feature:**
1. Wrap component in `<PremiumGate>`
2. Add backend tier check if API endpoint
3. Update Premium.tsx benefits list

### Debugging

**View logs:**
- Cloudflare dashboard → Workers → Logs
- Use `console.log()` liberally (shows in worker logs)

**Test API locally:**
```bash
curl -X POST http://localhost:5173/api/analyze/ai \
  -H "Content-Type: application/json" \
  -d '{"bidText": "..."}'
```

**Database queries:**
```bash
# Via wrangler CLI
npx wrangler d1 execute DB --command "SELECT * FROM user_profiles LIMIT 10"
```

**Check Stripe webhook:**
- Visit `/webhook-status` page
- Shows key configuration and test endpoint

---

## 18. Glossary

| Term | Definition |
|------|------------|
| **MSA** | Metropolitan Statistical Area - geographic region used by BLS for wage data |
| **SOC Code** | Standard Occupational Classification - 6-digit code for job types |
| **BLS OEWS** | Bureau of Labor Statistics Occupational Employment & Wage Statistics |
| **FRED** | Federal Reserve Economic Data - economic time series |
| **PPI** | Producer Price Index - measures inflation at wholesale level |
| **PSF** | Per Square Foot - common unit for construction pricing |
| **GC** | General Contractor - manages multiple trades |
| **Scope Fingerprint** | Pattern-based project classification system |
| **Deal Risk** | Composite score of price realism, financial terms, and trust signals |
| **Unified Score** | Overall bid confidence score (0-100) combining contract, scope, and price |
| **Vague Terms** | Ambiguous language in bids that increases change order risk |
| **Trust Buffer** | Bonus points for verified contractor credentials |

---

## 19. Contact & Support

**Maintainer:** RemodelerIQ Team  
**Support Email:** help@remodeleriq.com  
**GitHub:** (Private repository)  
**Mocha Platform:** https://www.getmocha.com

---

**Last Updated:** 2025-01-26  
**Document Version:** 1.0  
**Codebase Version:** Production (published at remodeleriq.com)
