-- CYCLE 003 — Three nuanced calibrations from cycle 2 feedback
-- 1. Draft 1: closing line needs PERMISSION framing, not transactional
-- 2. Draft 2: append the EXACT closing Gustavo suggested
-- 3. Draft 3: REMOVE CTA — let profile do work. CTA presence should be ~50/50 random.
-- 4. Draft 4: format locked in — preserve

-- Track cycle requests from the dashboard (refresh button writes here)
CREATE TABLE IF NOT EXISTS cycle_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  requested_at TEXT NOT NULL DEFAULT (datetime('now')),
  requested_by TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending|fulfilled
  fulfilled_at TEXT,
  cycle_id TEXT,
  note TEXT
);

-- New voice guardrails from cycle 2 learning
INSERT INTO content_voice_guardrails (rule, source_kill_id) VALUES
  ('CTA presence on Reddit + Nextdoor replies is ~50/50 RANDOM. NOT every reply ends with a RemodelerIQ.com mention. Sometimes pure helpful advice is the play — let readers click the profile if they want more.', NULL),
  ('When CTA is included, frame as PROTECTION and PERMISSION, not as sale. Canonical template: "Check out RemodelerIQ.com — I built this site and its tools so homeowners could be in the know of things like this before they sign." Never lead with "first 3 free" — that goes secondary if at all.', NULL),
  ('Closing lines should reduce friction perception. "90 seconds" / "no signup" / "before you sign" / "in the know" all earn their place. "First 3 free" is acceptable but secondary, never primary.', NULL);

-- DRAFT 1: Yingxin Wu — permission-framed closing
UPDATE content_drafts SET
  cycle_id = 'cycle-003',
  draft_nextdoor = 'Hey Yingxin — water at the cold joint after a storm is the most common basement issue here. The fix runs $1,800–$4,500 for interior drain tile, jumping to $8,000–$15,000 if a contractor pushes exterior excavation. Ask which method they recommend and exactly why — that one question separates the careful contractors from the upsellers. When the quote comes back, RemodelerIQ.com is a quick way to double-check before you sign — I built it so homeowners could catch issues like this in the know, not after the fact.',
  status = 'in_review',
  updated_at = datetime('now')
WHERE id = 1;

-- DRAFT 2: Jill Robinson — append Gustavo's exact suggested closing
UPDATE content_drafts SET
  cycle_id = 'cycle-003',
  draft_nextdoor = 'Jill, here''s what I''d do if this were my house. Townhouse patio leaks above a garage are almost always a flashing problem — skip the handyman, find a roofer who does flashing repairs specifically. A real fix runs $850–$1,800 if it''s the joint, $2,400–$4,500 if water has compromised what''s underneath. Anything under $500 means they''re caulking it and betting you won''t call back. Check out RemodelerIQ.com — I built this site and its tools so homeowners could be in the know of things like this before they sign.',
  status = 'in_review',
  updated_at = datetime('now')
WHERE id = 2;

-- DRAFT 3: Reddit Kitchen $48k — REMOVE CTA. Let profile do the work.
UPDATE content_drafts SET
  cycle_id = 'cycle-003',
  draft_reddit = '$48k for that scope in a Missouri suburb is right in the middle of fair — 2026 national median for a mid-range kitchen that size is around $58k, and MO trades run 15–20% under the BLS baseline.

But the dollar total isn''t where this quote will or won''t break you. The three line items I''d scan first: cabinet install labor %, general conditions %, and how "allowances" are worded. Each one is where most quotes quietly hide $3–8k.',
  draft_nextdoor = 'Saw a question recently about a $48k kitchen quote. The total isn''t usually where the budget breaks — three line items are: cabinet install labor, general conditions, and how "allowances" are worded. Each one quietly hides $3–8k on most quotes. Worth knowing before you sign anything.',
  status = 'in_review',
  updated_at = datetime('now')
WHERE id = 3;

-- DRAFT 4: Bath 50% — format locked. Preserve exactly.
UPDATE content_drafts SET
  cycle_id = 'cycle-003',
  status = 'in_review',
  updated_at = datetime('now')
WHERE id = 4;
