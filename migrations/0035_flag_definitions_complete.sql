-- Complete the flag_definitions taxonomy — all flags present in FLAG_ID_MAP.
-- The initial seed in 0034 only covered 16 flags; this adds the remaining ones.
-- Uses INSERT OR IGNORE so re-running is safe.

INSERT OR IGNORE INTO flag_definitions (flag_id, severity, category, title, introduced_in) VALUES
  -- Payment / deposit
  ('PAY_DEPOSIT_HIGH',         'high',     'payment_terms', 'Deposit percentage above recommended range',               '2026.08.1'),
  ('PAY_MILESTONE_RISKY',      'high',     'payment_terms', 'Payment milestone structure is risky',                     '2026.08.1'),

  -- Change orders
  ('CO_PROCESS_MISSING',       'medium',   'contract',      'No change-order process defined',                          '2026.08.1'),
  ('CO_MARKUP_RISKY',          'high',     'contract',      'Change order markup rate is elevated',                     '2026.08.1'),
  ('CO_MARKUP_MODERATE',       'medium',   'contract',      'Change order markup rate is moderately high',              '2026.08.1'),

  -- Contract risk
  ('CONTRACT_ARBITRATION',     'high',     'contract',      'Binding arbitration clause removes homeowner court access', '2026.08.1'),
  ('CONTRACT_LIABILITY_WAIVER','high',     'contract',      'Contractor liability waiver clause present',                '2026.08.1'),
  ('CONTRACT_AUTO_APPROVAL_EXTRAS','high', 'contract',      'Extras may be auto-approved without written sign-off',     '2026.08.1'),
  ('CONTRACT_UNCAPPED_TM',     'high',     'contract',      'Time-and-materials work is uncapped',                      '2026.08.1'),

  -- Permits
  ('PERMIT_HOMEOWNER_RISK',    'high',     'permits',       'Homeowner required to pull permits — increases liability',  '2026.08.1'),

  -- Schedule
  ('SCHED_NO_PENALTY',         'low',      'scope',         'Timeline present but no delay penalty clause',             '2026.08.1'),

  -- Scope / vagueness
  ('SCOPE_HIGHLY_VAGUE',       'high',     'scope',         'Scope is highly vague — many undefined allowances or TBDs','2026.08.1'),
  ('SCOPE_MODERATELY_VAGUE',   'medium',   'scope',         'Scope has moderate vagueness',                             '2026.08.1'),
  ('SCOPE_VAGUE_TERMS_CRITICAL','critical','scope',         'Scope contains critically vague language',                 '2026.08.1'),
  ('SCOPE_VAGUE_TERMS_HIGH',   'high',     'scope',         'Scope contains high-risk vague terms',                     '2026.08.1'),
  ('SCOPE_VAGUE_TERMS_MEDIUM', 'medium',   'scope',         'Scope contains moderately vague terms',                    '2026.08.1'),
  ('SCOPE_ITEM_UNCLEAR',       'medium',   'scope',         'Important scope items are unclear or unspecified',         '2026.08.1'),

  -- Price / labor
  ('PRICE_LABOR_HIGH',         'medium',   'pricing',       'Labor cost ratio is higher than market norm',              '2026.08.1'),
  ('PRICE_LABOR_LOW',          'medium',   'pricing',       'Labor cost ratio is suspiciously low',                     '2026.08.1'),
  ('PRICE_LOWBALL_RISK',       'high',     'pricing',       'Bid price is significantly below market — lowball risk',   '2026.08.1'),
  ('PRICE_ABOVE_MARKET',       'medium',   'pricing',       'Bid price is above market range',                          '2026.08.1'),
  ('PRICE_CONTING_LOW',        'low',      'pricing',       'Contingency budget is below recommended 10%',              '2026.08.1'),
  ('PRICE_CONTING_MISSING',    'medium',   'pricing',       'No contingency budget specified',                          '2026.08.1'),

  -- Safety
  ('SAFE_LEAD_MISSING',        'high',     'safety',        'Lead-safe practices not mentioned for pre-1978 home',      '2026.08.1'),
  ('SAFE_LEDGER_FLASHING',     'high',     'safety',        'Deck ledger flashing not specified',                       '2026.08.1'),
  ('SAFE_FOOTING_DEPTH',       'high',     'safety',        'Deck footing depth not specified to code',                 '2026.08.1'),

  -- Code compliance
  ('CODE_EGRESS_MISSING',      'high',     'safety',        'Egress window not specified for basement bedroom',         '2026.08.1'),

  -- Quality of life
  ('QOL_TASK_LIGHTING',        'low',      'scope',         'Kitchen task lighting not specified',                      '2026.08.1'),
  ('QOL_VENTILATION',          'low',      'scope',         'Kitchen ventilation not specified',                        '2026.08.1'),
  ('QOL_WORK_TRIANGLE',        'low',      'scope',         'Kitchen work triangle layout not addressed',               '2026.08.1'),
  ('QOL_SOUNDPROOFING',        'low',      'scope',         'Basement soundproofing not specified',                     '2026.08.1'),
  ('QOL_WATERPROOFING',        'medium',   'scope',         'Basement waterproofing method not specified',              '2026.08.1'),
  ('QOL_DEBRIS_REMOVAL',       'low',      'scope',         'Debris removal and haul-away not specified',               '2026.08.1'),
  ('QOL_DAILY_CLEANUP',        'low',      'scope',         'Daily site cleanup expectation not specified',             '2026.08.1'),
  ('QOL_FINAL_WALKTHROUGH',    'low',      'scope',         'Final walkthrough process not described',                  '2026.08.1');
