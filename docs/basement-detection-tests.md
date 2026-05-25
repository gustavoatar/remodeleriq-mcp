# Basement Detection Fix - Acceptance Tests

## Overview
Fix for basement projects incorrectly showing "Unusually Low" when comparing cosmetic/refinishing work against full basement remodel benchmarks ($43k-$55k Zonda) instead of basement-refinishing benchmarks ($12k-$35k Houzz).

**Root Cause**: `extractDetectedData()` returned generic "Basement" type, losing context like "flood repair" that indicates refinishing scope.

**Fix Applied**: 
- Enhanced `extractDetectedData()` (ProjectDataEditor.tsx) to return "Basement Refinishing" or "Basement Remodel" based on bid content keywords
- Updated `normalizeProjectType()` (mixedBidRateEngine.ts) to recognize explicit basement types

---

## Test Cases

### TC-BD-001: Basement Flood Repair Detection
**Scenario**: Bid titled "Basement Finishing and Flood Repair" should be classified as basement-refinishing

**Preconditions**:
- User is logged in
- Premium access enabled

**Test Steps**:
1. Upload bid PDF with title "Basement Finishing and Flood Repair"
2. Bid total: $15,326
3. Square footage: 678 sf
4. Wait for analysis to complete

**Expected Result**:
- Project type detected as "Basement Refinishing"
- Price Analysis shows comparison against $12k-$35k range (Houzz basement-refinishing benchmarks)
- Verdict shows "Fair Deal" or "Good Deal" NOT "Unusually Low -71%"
- PSF comparison shows ~$22/sf vs basement-refinishing rates, not full remodel rates

---

### TC-BD-002: Basement Cosmetic Work Detection
**Scenario**: Bid mentioning cosmetic basement updates should classify as refinishing

**Preconditions**:
- User has app access

**Test Steps**:
1. Upload bid with content: "Basement cosmetic refresh - drywall repair, paint, flooring"
2. Bid total: $18,000
3. Square footage: 800 sf
4. View analysis

**Expected Result**:
- Project type: "Basement Refinishing"
- Benchmark range: $12k-$35k
- Verdict: Within normal range (not "Unusually Low")

---

### TC-BD-003: Basement Restore/Repair Keywords
**Scenario**: Keywords "restore" and "repair" trigger refinishing classification

**Preconditions**:
- App accessible

**Test Steps**:
1. Upload bid: "Basement restore after water damage - drywall, flooring replacement"
2. Bid total: $22,000
3. Square footage: 1000 sf

**Expected Result**:
- Project type: "Basement Refinishing"
- Comparison against $12k-$35k range
- Verdict: Fair/reasonable range

---

### TC-BD-004: Full Basement Finish (Unfinished to Finished)
**Scenario**: Converting unfinished basement should classify as basement-remodel

**Preconditions**:
- User logged in

**Test Steps**:
1. Upload bid: "Finish unfinished basement - framing, electrical, plumbing, HVAC, drywall, flooring"
2. Bid total: $48,000
3. Square footage: 1200 sf

**Expected Result**:
- Project type: "Basement Remodel"
- Comparison against $43k-$55k range (Zonda basement-remodel benchmarks)
- Verdict: Fair Deal (within range)

---

### TC-BD-005: Basement Buildout Detection
**Scenario**: "Buildout" keyword triggers full remodel classification

**Preconditions**:
- App accessible

**Test Steps**:
1. Upload bid: "Complete basement buildout with bathroom, bedroom, and living area"
2. Bid total: $52,000
3. Square footage: 1500 sf

**Expected Result**:
- Project type: "Basement Remodel"
- Benchmark: Full remodel range ($43k-$55k)

---

### TC-BD-006: Ambiguous Basement (Default to Refinishing)
**Scenario**: Generic "basement work" without clear indicators defaults to refinishing

**Preconditions**:
- App accessible

**Test Steps**:
1. Upload bid: "Basement improvements"
2. Bid total: $16,000
3. Square footage: 600 sf

**Expected Result**:
- Project type: "Basement Refinishing" (default)
- Uses $12k-$35k benchmark range
- Verdict: Fair Deal

---

### TC-BD-007: Basement with Drywall/Paint/Flooring Only
**Scenario**: Cosmetic-only scope should be refinishing

**Preconditions**:
- Premium user

**Test Steps**:
1. Upload bid with line items: Drywall $4,000, Paint $3,500, LVP Flooring $6,000
2. No structural, electrical, plumbing work
3. Bid total: $13,500
4. Square footage: 700 sf

**Expected Result**:
- Project type: "Basement Refinishing"
- Trade mix: drywall 25%, painter 30%, flooring 25%
- Verdict: Fair Deal ($12k-$35k range)

---

### TC-BD-008: Basement "Finishing" Without Remodel Keywords
**Scenario**: Word "finishing" alone does NOT automatically mean full remodel

**Preconditions**:
- App accessible

**Test Steps**:
1. Upload bid: "Basement finishing work - new flooring and paint"
2. Bid total: $14,000
3. Square footage: 650 sf

**Expected Result**:
- Project type: "Basement Refinishing" (flooring/paint indicate cosmetic)
- NOT classified as full $43k+ remodel

---

## Integration Leakage Tests

### TC-BD-009: Price Score API Receives Correct Type
**Scenario**: Verify API receives normalized project type

**Test Steps**:
1. Upload basement flood repair bid
2. Open browser DevTools Network tab
3. Find `/api/price-score` request
4. Inspect request body

**Expected Result**:
- Request body contains `projectType: "Basement Refinishing"`
- Response uses basement-refinishing benchmarks

---

### TC-BD-010: Trade Mix Uses Correct Breakdown
**Scenario**: Verify trade mix percentages match refinishing scope

**Test Steps**:
1. Upload basement refinishing bid
2. View Market Analysis section

**Expected Result**:
- Trade mix shows: drywall 25%, painter 30%, flooring 25%
- NOT full remodel mix with framing, electrical, plumbing

---

## Permission/Access Tests

### TC-BD-011: Free User Sees Correct Classification
**Scenario**: Free users should see correct project type (not premium-gated)

**Preconditions**:
- User on free tier

**Test Steps**:
1. Upload basement flood repair bid
2. View report

**Expected Result**:
- Project type correctly shows "Basement Refinishing"
- Price analysis verdict visible (not hidden behind paywall)

---

### TC-BD-012: Anonymous User Access
**Scenario**: Anonymous users can analyze basement bids

**Preconditions**:
- Not logged in

**Test Steps**:
1. Visit app without logging in
2. Upload basement cosmetic bid
3. View analysis

**Expected Result**:
- Analysis completes successfully
- Basement type correctly detected

---

## Data Validation Tests

### TC-BD-013: Case Insensitivity
**Scenario**: Detection works regardless of case

**Test Steps**:
1. Upload bid with "BASEMENT FLOOD REPAIR" (uppercase)
2. Upload bid with "basement flood repair" (lowercase)
3. Upload bid with "Basement Flood Repair" (mixed)

**Expected Result**:
- All three detect as "Basement Refinishing"

---

### TC-BD-014: Keyword Proximity
**Scenario**: Keywords don't need to be adjacent

**Test Steps**:
1. Upload bid: "We will repair your basement after the recent flood damage"

**Expected Result**:
- Detects "flood" and "repair" → "Basement Refinishing"

---

### TC-BD-015: Multiple Keyword Triggers
**Scenario**: Multiple refinishing keywords reinforce classification

**Test Steps**:
1. Upload bid: "Basement restore, repair, and refresh - cosmetic updates only"

**Expected Result**:
- Strongly classified as "Basement Refinishing" (multiple triggers)

---

### TC-BD-016: Conflicting Keywords
**Scenario**: Refinishing keywords override ambiguity

**Test Steps**:
1. Upload bid: "Basement finishing and flood repair work" (has "finishing" AND "flood repair")

**Expected Result**:
- "flood repair" triggers refinishing
- NOT classified as full remodel despite "finishing"

---

## Test Results Summary

| Test ID | Description | Status |
|---------|-------------|--------|
| TC-BD-001 | Flood repair detection | [ ] |
| TC-BD-002 | Cosmetic work detection | [ ] |
| TC-BD-003 | Restore/repair keywords | [ ] |
| TC-BD-004 | Full basement finish | [ ] |
| TC-BD-005 | Buildout detection | [ ] |
| TC-BD-006 | Ambiguous default | [ ] |
| TC-BD-007 | Drywall/paint/floor only | [ ] |
| TC-BD-008 | Finishing without remodel | [ ] |
| TC-BD-009 | API receives correct type | [ ] |
| TC-BD-010 | Trade mix breakdown | [ ] |
| TC-BD-011 | Free user access | [ ] |
| TC-BD-012 | Anonymous user | [ ] |
| TC-BD-013 | Case insensitivity | [ ] |
| TC-BD-014 | Keyword proximity | [ ] |
| TC-BD-015 | Multiple triggers | [ ] |
| TC-BD-016 | Conflicting keywords | [ ] |
