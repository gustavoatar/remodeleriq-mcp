// Worker environment additions beyond what wrangler generates in
// worker-configuration.d.ts.
//
// Secrets are populated via `wrangler secret put NAME` and exposed on Env.
// Wrangler's auto-generated types include the bindings (DB, R2_BUCKET).

declare global {
  interface Env {
    // Secrets (set via wrangler secret put or .dev.vars locally)
    RESEND_API_KEY?: string;
    RESEND_FROM?: string;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    GOOGLE_PLACES_API_KEY?: string;
    GEMINI_API_KEY?: string;
    BLS_API_KEY?: string;
    FRED_API_KEY?: string;
    STRIPE_SECRET_KEY?: string;
    STRIPE_WEBHOOK_SECRET?: string;
    STRIPE_PROJECT_PASS?: string;
    STRIPE_REMODELER_PASS?: string;
    STRIPE_LIFETIME_PASS?: string;
    NEXTDOOR_CLIENT_ID?: string;
    NEXTDOOR_CLIENT_SECRET?: string;
    REDDIT_CLIENT_ID?: string;
    REDDIT_CLIENT_SECRET?: string;
  }
}

export {};
