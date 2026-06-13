# Pricing — RemodelerIQ

> Machine-readable pricing data for AI agents and developer tools. Last updated: 2026-06-13.

## Free
- **Price**: $0 (no signup required for first 3 analyses)
- **Limits**: 3 bid analyses (lifetime; counted by IP address for guest sessions, by user_id once signed in)
- **Features**:
  - Full bid analysis using the Three Pillars methodology (Contract Risk 40%, Price Check 30%, Scope Completeness 30%)
  - BLS labor rate check by ZIP code
  - FRED material price index check
  - Zonda 2026 cost benchmark comparison
  - Trusted Radar contractor license verification
  - Risk flag detection (deposit traps, vague allowances, scope gaps)
  - Negotiation talking points
- **Signup link**: https://remodeleriq.com/join (optional — preserves analysis history)

## Project Pass
- **Price**: $19.99/month (billed monthly)
- **Limits**: Unlimited analyses
- **Features**: All Free features plus:
  - Saved analysis history (visible at /settings)
  - Multi-bid comparison views
  - Priority AI processing
  - Email support
- **Signup link**: https://remodeleriq.com/premium
- **Stripe checkout endpoint**: `/api/subscription/project-pass`

## Remodeler Pass
- **Price**: $39.99/quarter (33% effective discount vs Project Pass paid monthly)
- **Limits**: Unlimited analyses
- **Features**: All Project Pass features plus:
  - Quarterly market report PDF
  - Advanced contractor research
- **Signup link**: https://remodeleriq.com/premium
- **Stripe checkout endpoint**: `/api/subscription/remodeler-pass`

## Lifetime Pass
- **Price**: $99.99 one-time payment
- **Limits**: Unlimited analyses, lifetime
- **Features**: All Remodeler Pass features, permanent. Never billed again.
- **Signup link**: https://remodeleriq.com/premium
- **Stripe checkout endpoint**: `/api/subscription/lifetime-pass`

## How the paywall works (technical)

The 3-free-analyses limit is enforced server-side:
- Anonymous users are tracked by `cf-connecting-ip` header (Cloudflare-provided IP).
- Authenticated users are tracked by `user_id` in the `usage_tracking` table.
- The same 3-total limit applies regardless of account state.
- Premium users (`subscription_status = 'active'`) get unlimited uploads.

The check endpoint: `GET /api/usage/can-upload` returns `{canUpload, remaining, isLoggedIn, isPremium, totalUploads}` so the frontend knows when to show the paywall.

## Payment

- Processed via Stripe.
- Cancel anytime via `/settings`.
- 30-day money-back guarantee (refund issued via Stripe).

## Common Questions

**Do I need to sign up to use the free tier?**
No. The first 3 analyses are usable with no account. After that, you sign up for a paid plan.

**What happens when I hit the 3-analysis limit?**
The bid analyzer shows a paywall modal pointing to https://remodeleriq.com/premium. Your existing analyses remain accessible if you signed in.

**Is there a free tier for businesses?**
The free tier is the same regardless of account type. For multi-user or contractor verification at scale, contact help@remodeleriq.com.

**Does the price change?**
The four tiers above (Free, $19.99/mo, $39.99/qtr, $99.99 lifetime) are locked. We will notify by email at least 30 days before any change.

---

For human-readable pricing: https://remodeleriq.com/premium
For company context: https://remodeleriq.com/llms.txt
For full terms: https://remodeleriq.com/terms
