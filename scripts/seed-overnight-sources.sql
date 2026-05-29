-- Overnight pre-stage: 12 realistic source posts based on actual r/HomeImprovement patterns
-- These will be drafted by the Gemini swarm runner into in_review drafts
-- Sourced from canonical bid-question shapes observed in the subreddit

INSERT INTO content_drafts (cycle_id, platform, source_url, source_excerpt, source_author, source_subreddit_or_hood, status) VALUES
('overnight-stage', 'reddit', 'https://www.reddit.com/r/HomeImprovement/sample-deck-rebuild',
 'Deck rebuild quote — $28,500 for ~340 sqft pressure-treated, removal of existing rotted deck, new footings, railing system, single 10ft staircase. Contractor wants 35% upfront, balance on completion. Located in Charlotte NC suburbs. Sound right?',
 'u/deck_dilemma', 'r/HomeImprovement', 'queued'),

('overnight-stage', 'reddit', 'https://www.reddit.com/r/HomeImprovement/sample-bathroom-32k',
 'Bathroom remodel quote — $32k for a 7x10 master bath gut. New tile shower with frameless glass, double vanity with quartz, freestanding tub, heated tile floor, new plumbing for relocated toilet. Located Austin TX. Contractor says "$32k includes everything you saw on Pinterest" but the bid is one page with no breakdown. Should I push back for itemization?',
 'u/austin_bath_first', 'r/HomeImprovement', 'queued'),

('overnight-stage', 'reddit', 'https://www.reddit.com/r/Renovations/sample-basement-finish',
 'Basement finish quote came in at $54k for 950 sqft. Includes framing, drywall, electrical (new circuits for entertainment area), LVP flooring, drop ceiling, half bath with shower, egress window install. Bid lists "general conditions: $9,800" which seems high — that''s like 18%. Is this normal or am I being upcharged?',
 'u/basement_questioner', 'r/Renovations', 'queued'),

('overnight-stage', 'reddit', 'https://www.reddit.com/r/HomeImprovement/sample-roof-15k',
 'Got 3 roof replacement quotes for a ranch home, ~2200 sqft, single layer tear-off, 30-year architectural shingles. Quotes came in at $14,800, $16,400, and $22,500. Middle quote includes "premium synthetic underlayment" — is that worth the $1,600 difference? The high quote includes copper flashing — necessary or upsell? Phoenix AZ.',
 'u/roof_3_bids', 'r/HomeImprovement', 'queued'),

('overnight-stage', 'reddit', 'https://www.reddit.com/r/HomeRenovations/sample-kitchen-allowances',
 'Kitchen remodel quote, $76k. Contractor included these allowances: cabinets $14k, countertops $6k, appliances $8k, tile $3k. No brand names. He says I "pick during selection meetings." Wife and I want semi-custom shaker, Cambria quartz, KitchenAid appliances, ceramic subway tile. Should we be worried about overage charges?',
 'u/kitchen_allow_anon', 'r/HomeRenovations', 'queued'),

('overnight-stage', 'reddit', 'https://www.reddit.com/r/HomeImprovement/sample-window-replacement',
 'Window replacement: 14 windows, double-hung vinyl, Anderson 100 series. Contractor quoted $18,200 install + materials. Online shows the windows at ~$8500 retail so install would be $9700 for ~14 windows = ~$700/window install. Reasonable? Or padded? Northern NJ.',
 'u/window_math', 'r/HomeImprovement', 'queued'),

('overnight-stage', 'reddit', 'https://www.reddit.com/r/HomeImprovement/sample-plumber-rough-in',
 'Plumber rough-in for new master bath: $9,800. Includes relocating drain stack 4 feet, new water lines for double vanity + freestanding tub + shower with 2 heads + toilet. Bid does NOT include fixtures. Suburb of Chicago. Is this fair or should I get another quote?',
 'u/plumb_question', 'r/HomeImprovement', 'queued'),

('overnight-stage', 'reddit', 'https://www.reddit.com/r/Renovations/sample-electrical-panel',
 'Quoted $4,800 to upgrade my electrical panel from 100A to 200A, plus 6 new circuits for a basement finish I''m doing myself. Includes permit + inspection. Located in Denver. Got one other quote at $6,200. Is $4,800 too cheap to trust? Both contractors are licensed.',
 'u/denver_panel', 'r/Renovations', 'queued'),

('overnight-stage', 'reddit', 'https://www.reddit.com/r/HomeImprovement/sample-foundation-crack',
 'Foundation crack repair — water seeping through a vertical crack on the basement wall during heavy rain. Two quotes: $2,400 for interior epoxy injection only, $9,500 for exterior excavation + waterproofing membrane. House is 1962 in Cleveland OH. Sales rep for the $9,500 says interior fix "won''t last." Is that true or upsell?',
 'u/crack_quote', 'r/HomeImprovement', 'queued'),

('overnight-stage', 'nextdoor', 'https://nextdoor.com/p/sample-tile-installer',
 'Looking for a tile installer recommendation — kitchen backsplash, ~28 sqft, glass subway tile (I have the material already). Got one quote at $1,800 just for install which seems steep for less than 30 sqft. Is this fair or am I being quoted "homeowner doesn''t know" pricing?',
 'Sarah K.', 'Shallowford Park', 'queued'),

('overnight-stage', 'nextdoor', 'https://nextdoor.com/p/sample-painter-interior',
 'Interior painter quote — 4 bedrooms, hallway, 2 bathrooms (walls only, no trim), 1850 sqft total. Quoted $6,400 for walls including 2 coats, low-VOC paint included. Reasonable for Atlanta metro? Or should I get more bids?',
 'Marcus T.', 'Easthampton', 'queued'),

('overnight-stage', 'nextdoor', 'https://nextdoor.com/p/sample-driveway-concrete',
 'Driveway replacement quote — old concrete driveway, ~600 sqft, full tear out and pour new with 4-inch slab, basic broom finish. Quoted $9,200 in Roswell. Contractor wants 50% upfront before he schedules the pour. Is the price fair? And is 50% upfront a red flag for this kind of job?',
 'Karen M.', 'Valencia Hills', 'queued');
