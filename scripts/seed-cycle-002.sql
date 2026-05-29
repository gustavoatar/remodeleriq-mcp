-- CYCLE 002 — Calibrated from Gustavo's cycle 1 feedback
-- Pattern: "wordy" on all 4. #3 added: "create a hook, don't give away the farm"
--
-- Calibration applied:
-- • Nextdoor: 2-3 sentences max (~60-80 words)
-- • Reddit: 4-6 sentences max (~90-120 words)
-- • Tease the framework, not the full answer — promise value without dumping it
-- • Founder origin compressed to one line, only on 1 of 3
-- • Three Pillars still hit — but as callouts, not paragraphs
-- • Signature phrases preserved

-- New voice guardrails — copywriter reads these first next cycle
INSERT INTO content_voice_guardrails (rule, source_kill_id) VALUES
  ('Nextdoor replies: 2-3 sentences max. Hard cap ~80 words. Punchy beats thorough.', NULL),
  ('Reddit replies: 4-6 sentences max. Hard cap ~120 words. One framework, not the whole playbook.', NULL),
  ('HOOK, do not give away the farm. Name WHERE the value is (e.g. "three line items hide $3-8k") without revealing the EXACT percentages or scripts. Make the reader curious enough to DM, click profile, or visit RemodelerIQ.com.', NULL),
  ('Founder origin sentence: compress to ONE line when used. Example: "Built RemodelerIQ to sanity-check quotes like this — first 3 free." Not the full backstory.', NULL),
  ('Cut every adjective that does not earn its place. "Most common" beats "one of the most common". "Huge" beats "wildly varying".', NULL);

-- DRAFT 1: Yingxin Wu — calibrated
UPDATE content_drafts SET
  cycle_id = 'cycle-002',
  draft_nextdoor = 'Hey Yingxin — water at the cold joint after a storm is the most common basement issue here. The fix runs $1,800–$4,500 for interior drain tile, jumping to $8,000–$15,000 if a contractor pushes exterior excavation. Ask which method they recommend and why — that one question tells you everything. Built RemodelerIQ to sanity-check quotes like this — first 3 free.',
  status = 'in_review',
  updated_at = datetime('now')
WHERE id = 1;

-- DRAFT 2: Jill Robinson — calibrated
UPDATE content_drafts SET
  cycle_id = 'cycle-002',
  draft_nextdoor = 'Jill, here''s what I''d do if this were my house. Townhouse patio leaks above a garage are almost always a flashing problem — skip the handyman, find a roofer who does flashing repairs specifically. A real fix runs $850–$1,800 if it''s the joint, $2,400–$4,500 if water has compromised what''s underneath. Anything under $500 means they''re caulking it and betting you won''t call back.',
  status = 'in_review',
  updated_at = datetime('now')
WHERE id = 2;

-- DRAFT 3: Reddit Kitchen $48k — hook over farm
UPDATE content_drafts SET
  cycle_id = 'cycle-002',
  draft_reddit = '$48k for that scope in a Missouri suburb is right in the middle of fair — 2026 national median for a mid-range kitchen that size is around $58k, and MO trades run 15–20% under the BLS baseline.

But the dollar total isn''t where this quote will or won''t break you. The three line items I''d scan first: cabinet install labor %, general conditions %, and how "allowances" are worded. Each one is where most quotes quietly hide $3–8k.

Happy to point at the specific lines if you DM the bid.',
  draft_nextdoor = 'Saw a question about a $48k kitchen quote. The total isn''t usually where the budget breaks — three line items are: cabinet install labor, general conditions, and how "allowances" are worded. Each one hides $3–8k on most quotes. RemodelerIQ.com runs that scan in 90 seconds. First 3 free.',
  status = 'in_review',
  updated_at = datetime('now')
WHERE id = 3;

-- DRAFT 4: Reddit Bath 50% deposit — hook over farm
UPDATE content_drafts SET
  cycle_id = 'cycle-002',
  draft_reddit = 'Red flag alert: not normal — at least not in a way that protects you. Industry standard for a $32k bath is 10% deposit max, rest tied to milestones (material delivery, rough-in, drywall, completion).

When a contractor needs 50% upfront, it''s almost always cash flow — they''re funding the last job with your money. None of the reasons are reasons for YOU to absorb their risk.

This is negotiable — counter with "15% at signing, 25% on material delivery, balance on milestones." If they walk, you saved yourself.',
  status = 'in_review',
  updated_at = datetime('now')
WHERE id = 4;
