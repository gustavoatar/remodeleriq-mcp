-- Test Cycle 001 — 4 voice-calibrated drafts for editor-in-chief review
-- All hit Three Pillars proportionally, rotate signature phrases, founder origin in 1 of 3

-- DRAFT 1: Yingxin Wu (Nextdoor Easthampton) — Basement water seepage
-- Pillars: price_check (primary), scope, contract_risk
-- Signature phrase: "Most homeowners don't know this, but..."
-- Has founder origin: YES
INSERT INTO content_drafts (
  cycle_id, platform, source_url, source_excerpt, source_author,
  source_subreddit_or_hood, pillar_tags, draft_reddit, draft_nextdoor,
  blog_brief, feature_ticket, status
) VALUES (
  'cycle-001',
  'nextdoor',
  'https://nextdoor.com/news_feed/?profile_id=27794634',
  'During the recent heavy rain, I noticed water seeping through my basement concrete walls (joints of the concrete slab) and am looking for contractor recommendations.',
  'Yingxin Wu',
  'Easthampton',
  'price_check,scope,contract_risk',
  NULL,
  'Hey Yingxin — water through the cold joint (where your slab meets the wall) is one of the most common issues I see in Atlanta after a heavy storm. Most homeowners don''t know this, but waterproofing quotes for that exact problem range wildly: $1,800–$4,500 for an interior drain-tile fix, jumping to $8,000–$15,000 if a contractor pushes full exterior excavation. Before signing anything, ask which method they''re recommending and exactly why your situation needs it. Also: vague line items like "install waterproofing system" are change-order traps. Every quote should name the brand of membrane, the sump pump model, and whether a battery backup is included.

I built RemodelerIQ to protect homeowners — primarily myself, as I started doing projects. What was once a spreadsheet turned into this tool. First 3 bid checks are free if you want a sanity check. Hope it helps!',
  'Title: Basement Seepage After a Storm: $1,800 Fix or $15,000 Mistake? Atlanta Edition
Target keyword: basement waterproofing cost atlanta
Length: 1,800 words
Structure: cold-joint vs. crack vs. floor seepage diagnosis | three repair tiers with cost ranges | jargon decoded (drain tile, sump, membrane, battery backup) | change-order traps in waterproofing quotes | when to call which specialist | regional callout for Atlanta humid clay soil
Internal links: /how-we-score, /trusted-radar, /labor-rates',
  'Add "waterproofing" as a distinct project type to the analyzer. Currently lumped under "basement remodel" but the trade mix (concrete + waterproofing specialist + plumber) is distinct enough that it deserves its own scoring profile with cold-joint vs. excavation pricing tiers. Est. 3-day build.',
  'in_review'
);

-- DRAFT 2: Jill Robinson (Nextdoor Valencia Hills) — Patio roof leak above garage
-- Pillars: scope (primary), price_check
-- Signature phrase: "Here's what I'd do if this were my house..." + "The honest truth is..."
-- No founder origin (rotating)
INSERT INTO content_drafts (
  cycle_id, platform, source_url, source_excerpt, source_author,
  source_subreddit_or_hood, pillar_tags, draft_reddit, draft_nextdoor,
  blog_brief, feature_ticket, status
) VALUES (
  'cycle-001',
  'nextdoor',
  'https://nextdoor.com/news_feed/',
  'Does anyone know a qualified professional who can fix a leak on a patio roof? I''m looking for someone experienced, not a jack-of-all-trades, master-of-none. The patio is part of a townhouse condo, located above the garage and covered, with no space on top. I think the leak might be from the flashing.',
  'Jill Robinson',
  'Valencia Hills',
  'scope,price_check',
  NULL,
  'Jill, here''s what I''d do if this were my house. A patio roof leak above a townhouse garage is almost always a flashing problem — where the roof meets the wall — not the membrane itself. So the first call isn''t a handyman OR a roofer, it''s a roofer who handles flashing repairs specifically. Most jacks of all trades will charge $400–$800 to caulk it and you''ll see the leak again next storm.

A proper flashing repair runs $850–$1,800 if it''s just the joint, $2,400–$4,500 if the membrane underneath has been compromised by sitting water. The honest truth is: if a quote comes in under $500, they''re not opening it up to inspect — they''re betting you won''t call back when it leaks again. Get someone who''ll show you photos of what''s under the flashing before they re-seal.',
  NULL,
  NULL,
  'in_review'
);

-- DRAFT 3: Reddit r/HomeImprovement — "$48k Kitchen Quote, fair?"
-- Pillars: price_check (primary), contract_risk, scope
-- Signature phrase: "The honest truth is..." + "This is negotiable—here''s how..."
-- No founder origin (rotating)
INSERT INTO content_drafts (
  cycle_id, platform, source_url, source_excerpt, source_author,
  source_subreddit_or_hood, pillar_tags, draft_reddit, draft_nextdoor,
  blog_brief, feature_ticket, status
) VALUES (
  'cycle-001',
  'reddit',
  'https://reddit.com/r/HomeImprovement/sample-kitchen-48k',
  'Got a $48k quote for a kitchen remodel. 12x14 kitchen, semi-custom shaker cabinets, quartz counters, mid-range KitchenAid appliances, LVP flooring. Plumbing/electrical mostly stays where it is. Located in suburb of St Louis, MO. Is this fair?',
  'u/kitchen_questioner',
  'r/HomeImprovement',
  'price_check,contract_risk,scope',
  'OP, $48k for what you described — semi-custom shakers, quartz, mid-range KitchenAid, LVP, no plumbing relocation — sits right in the middle of fair. National median for a mid-range kitchen of that size in 2026 is around $58k, but you''re in a lower-cost metro (Missouri trades run ~15–20% below the national baseline for finish carpentry per BLS OEWS data), so $48k tracks.

The honest truth is: the dollar total isn''t where this quote will or won''t break you. The line items are. Three things to look for before you sign:

1. Cabinet install labor — should be 15–22% of cabinet material cost. If the bid lumps it into a flat number that''s 35%+ of materials, that''s where they''re padding.

2. General conditions / project supervision — industry standard is 5–8%. Anything north of 12% means they''re double-billing supervision into the labor line AND charging it as overhead.

3. Allowances — "tile allowance: $8/sqft" without naming a brand and sqft count means you''ll pay the upcharge plus the contractor''s markup on whatever you actually pick.

This is negotiable—here''s how: ask for the bid rewritten with specific brand and model numbers, install labor broken out separately from materials, and a written list of which allowances cover what. A solid contractor will rewrite it. A padder will get defensive.',
  'Saw a question recently about a $48k kitchen quote — figured I''d share the framework I use to sanity-check any bid this size. The total isn''t where most kitchens break the budget. The line items are. Three things to look for before signing: (1) cabinet install labor should be 15–22% of cabinet material cost, not 35%+. (2) Project supervision should be 5–8%, not 12%+. (3) Any "allowance" line without a specific brand and sqft is a change order waiting to happen. This is negotiable — ask the contractor to rewrite with specific brands and allowance scope. A real contractor will do it; a padder will push back.',
  'Title: The 3 Hidden Lines in a Kitchen Quote That Cost Homeowners Thousands
Target keyword: kitchen remodel quote breakdown
Length: 1,500 words
Structure: walk through each of the 3 lines (cabinet install %, GC fee %, allowance specificity) with examples, real % ranges by region, push-back scripts. Cross-link "What a Kitchen Remodel Really Costs in 2026"',
  NULL,
  'in_review'
);

-- DRAFT 4: Reddit r/HomeImprovement — "$32k Bathroom, contractor wants 50% upfront"
-- Pillars: contract_risk (100% — pure contract pillar)
-- Signature phrase: "Red flag alert:" + "This is negotiable—here''s how..."
-- No founder origin (rotating)
INSERT INTO content_drafts (
  cycle_id, platform, source_url, source_excerpt, source_author,
  source_subreddit_or_hood, pillar_tags, draft_reddit, draft_nextdoor,
  blog_brief, feature_ticket, status
) VALUES (
  'cycle-001',
  'reddit',
  'https://reddit.com/r/HomeImprovement/sample-bath-50pct-deposit',
  'Bathroom remodel contractor sent over the contract for a $32k full bath gut. He wants 50% as a deposit before he orders materials. Is this normal?',
  'u/bath_quote_anon',
  'r/HomeImprovement',
  'contract_risk',
  'Red flag alert: no, that''s not normal — at least not in a way that protects you.

A fair payment schedule for a $32k full bath in 2026 looks roughly like this: 10% deposit at signing, 20% at material delivery, 20% at rough-in, 20% at drywall complete, 20% at substantial completion, 10% final at punch-list + lien releases. That''s the industry standard residential remodel structure.

When a contractor asks for 50% upfront before any work happens, one of three things is going on: (1) they''re undercapitalized and using your cash to pay for their last job, (2) they have a personal credit problem and suppliers won''t extend them terms anymore, or (3) they''re inexperienced and this is just how they were taught.

None of those three are reasons for you to take the financial risk for them. If they push back when you propose the milestone-based schedule above, that tells you everything: they don''t have the cash flow to operate without your money fronting their business.

This is negotiable—here''s how. Send back: "I can do 15% deposit at signing, 25% on material delivery, with the remainder tied to written completion milestones." If they walk, you saved yourself from a project that was already in trouble before it started.',
  NULL,
  'Title: Why a 50% Upfront Deposit Means Your Contractor Is Already in Trouble
Target keyword: contractor deposit too high
Length: 1,600 words
Structure: industry-standard residential payment schedule by project size | three reasons contractors ask for 50% (none are protective for you) | counter-proposal script | what happens when 50% deposits go wrong (case patterns) | when a higher deposit IS justified (custom orders, structural)',
  'Add a "Payment Schedule Risk Score" to the analyzer output. Currently the contract-risk pillar checks for missing terms but doesn''t score deposit-percentage vs. industry benchmark. Adding a simple deposit-too-high flag would catch one of the most common scams. Est. 1-day build.',
  'in_review'
);
