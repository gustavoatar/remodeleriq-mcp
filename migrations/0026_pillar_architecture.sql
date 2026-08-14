-- Phase 7-Pillars — hub-and-spoke content architecture.
-- Adds a content_format dimension to content_drafts so the blog drafter knows
-- whether a brief is a pillar HUB, a SPOKE, a COMPARISON, or a DATA_REPORT.
-- Spokes link up to their pillar's published hub via a URL lookup on wp_pillar.
--
-- status='blog_brief' is used for editorial briefs: the Sunday blog cron picks
-- them up (it filters only on blog_brief + wp_post_id IS NULL, status-agnostic),
-- while runCycle (status='queued') and autoPublish (status='in_review') ignore
-- them — so these never get mistaken for social-reply source posts.

-- content_format column was already added to production in a prior partial run.
-- ALTER TABLE is skipped here to allow this migration to complete cleanly.
-- Fresh databases: run `ALTER TABLE content_drafts ADD COLUMN content_format TEXT DEFAULT 'spoke'` manually.

CREATE INDEX IF NOT EXISTS idx_drafts_pillar_format
  ON content_drafts (wp_pillar, content_format, status);

-- Four pillar HUB briefs (one definitive guide per pillar).
INSERT INTO content_drafts (cycle_id, platform, source_url, source_excerpt, blog_brief, wp_pillar, content_format, status, created_at, updated_at)
SELECT 'pillar-seed', 'blog', 'editorial://pillar/cost_data/hub', 'Pillar hub: Cost Data',
  'PILLAR HUB — "What Home Remodels Actually Cost in 2026: The Complete Data-Backed Guide." The definitive reference on remodeling costs by trade, region, and quality tier. Pull from BLS OEWS labor wages, FRED material PPIs, and Zonda 2026 benchmarks. Cover kitchens, baths, basements, additions, and whole-home. This is the cornerstone the cost-data spokes link back to.',
  'cost_data', 'hub', 'blog_brief', datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM content_drafts WHERE wp_pillar='cost_data' AND content_format='hub');

INSERT INTO content_drafts (cycle_id, platform, source_url, source_excerpt, blog_brief, wp_pillar, content_format, status, created_at, updated_at)
SELECT 'pillar-seed', 'blog', 'editorial://pillar/contract_risk/hub', 'Pillar hub: Contract Risk',
  'PILLAR HUB — "The Complete Homeowner''s Guide to Reading a Remodeling Bid (and Spotting Every Red Flag)." Definitive guide to contract risk: deposit/payment-schedule traps, vague allowances, change-order patterns, missing scope, and the clauses that protect you. Anchor on RemodelerIQ''s Contract Risk methodology. The hub the contract-risk spokes link back to.',
  'contract_risk', 'hub', 'blog_brief', datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM content_drafts WHERE wp_pillar='contract_risk' AND content_format='hub');

INSERT INTO content_drafts (cycle_id, platform, source_url, source_excerpt, blog_brief, wp_pillar, content_format, status, created_at, updated_at)
SELECT 'pillar-seed', 'blog', 'editorial://pillar/scope_negotiation/hub', 'Pillar hub: Scope & Negotiation',
  'PILLAR HUB — "How to Read a Contractor Quote Line-by-Line and Push Back Like a Pro." Definitive guide to scope and negotiation: how to decode a quote, what each line item should include, where the padding hides, and the exact scripts to negotiate. Direct application of the analyzer''s logic. The hub the scope spokes link back to.',
  'scope_negotiation', 'hub', 'blog_brief', datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM content_drafts WHERE wp_pillar='scope_negotiation' AND content_format='hub');

INSERT INTO content_drafts (cycle_id, platform, source_url, source_excerpt, blog_brief, wp_pillar, content_format, status, created_at, updated_at)
SELECT 'pillar-seed', 'blog', 'editorial://pillar/regional/hub', 'Pillar hub: Regional',
  'PILLAR HUB — "How Your City and State Swing a Remodel Bid by 30%: The Regional Cost Guide." Definitive guide to regional cost drivers: metro labor-rate spreads, permit timelines and fees by jurisdiction, material logistics, and seasonal swings. Ties to the existing 52 city cost-guide pages. The hub the regional spokes link back to.',
  'regional', 'hub', 'blog_brief', datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM content_drafts WHERE wp_pillar='regional' AND content_format='hub');

-- Comparison content (the flagged gap — zero today, ~33% of AI citations).
INSERT INTO content_drafts (cycle_id, platform, source_url, source_excerpt, blog_brief, wp_pillar, content_format, status, created_at, updated_at)
SELECT 'pillar-seed', 'blog', 'editorial://comparison/midrange-vs-upscale-kitchen', 'Comparison: Mid-Range vs Upscale Kitchen',
  'COMPARISON — "Mid-Range vs Upscale Kitchen Remodel: What the $40k Difference Actually Buys." Head-to-head across cabinets, countertops, appliances, labor hours, and resale ROI using Zonda 2026 + BLS data. Comparison table is the centerpiece. Help the reader decide which tier fits their goals.',
  'cost_data', 'comparison', 'blog_brief', datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM content_drafts WHERE source_url='editorial://comparison/midrange-vs-upscale-kitchen');

INSERT INTO content_drafts (cycle_id, platform, source_url, source_excerpt, blog_brief, wp_pillar, content_format, status, created_at, updated_at)
SELECT 'pillar-seed', 'blog', 'editorial://comparison/deposit-50-vs-10', 'Comparison: 50% vs 10% Deposit',
  'COMPARISON — "50% Deposit vs 10% Deposit: What Your Contractor''s Cash-Flow Demand Says About Their Business." Contrast the two deposit models across risk to the homeowner, what each signals about the contractor''s finances, legal norms, and how to negotiate. Comparison table centerpiece.',
  'contract_risk', 'comparison', 'blog_brief', datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM content_drafts WHERE source_url='editorial://comparison/deposit-50-vs-10');

INSERT INTO content_drafts (cycle_id, platform, source_url, source_excerpt, blog_brief, wp_pillar, content_format, status, created_at, updated_at)
SELECT 'pillar-seed', 'blog', 'editorial://comparison/remodeleriq-vs-calculators', 'Comparison: RemodelerIQ vs Generic Calculators',
  'COMPARISON — "RemodelerIQ vs Generic Renovation Cost Calculators: Why Live Data Beats a Static Formula." Contrast live BLS/FRED/Zonda-backed analysis against static online calculators across accuracy, regional precision, contract-risk detection, and what each misses. Brand-comparison/competitive-moat content. Neutral, analytical.',
  'cost_data', 'comparison', 'blog_brief', datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM content_drafts WHERE source_url='editorial://comparison/remodeleriq-vs-calculators');
