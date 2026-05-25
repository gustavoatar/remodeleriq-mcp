# Scope Fingerprint Scenario Test Results

## Overview

This document tracks the scenario testing for the Scope Fingerprinting Engine. The engine classifies bid documents into project types (e.g., kitchen-cosmetic, bathroom-standard) based on detected scope items.

## Test Data Created

### Kitchen Scenarios (1-15)
**File:** `src/shared/testData/kitchenScenarios.ts`

| ID | Scenario | Classification | Price Range |
|----|----------|----------------|-------------|
| 1 | Cabinet Paint Only | kitchen-cosmetic | $4,500 |
| 2 | Paint + Hardware | kitchen-cosmetic | $6,800 |
| 3 | Budget Refresh | kitchen-cosmetic | $3,200 |
| 4 | Cabinet Refacing + Counters | kitchen-refresh | $28,500 |
| 5 | Premium Refacing | kitchen-refresh | $38,000 |
| 6 | Entry Level Refacing | kitchen-refresh | $19,500 |
| 7 | New Cabinets Same Layout | kitchen-minor | $48,000 |
| 8 | Budget New Cabinets | kitchen-minor | $28,000 |
| 9 | Mid-Range Complete | kitchen-minor | $58,000 |
| 10 | Full Gut with Layout Change | kitchen-major | $95,000 |
| 11 | Island Addition | kitchen-major | $82,000 |
| 12 | Entry Level Gut | kitchen-major | $62,000 |
| 13 | Luxury Chef's Kitchen | kitchen-upscale | $185,000 |
| 14 | Modern Luxury | kitchen-upscale | $168,000 |
| 15 | Estate Kitchen | kitchen-upscale | $245,000 |

### Bathroom Scenarios (16-30)
**File:** `src/shared/testData/bathroomScenarios.ts`

| ID | Scenario | Classification | Price Range |
|----|----------|----------------|-------------|
| 16 | Paint & Fixtures | bathroom-cosmetic | $3,200 |
| 17 | Minimal Update | bathroom-cosmetic | $2,400 |
| 18 | Budget Refresh | bathroom-cosmetic | $2,100 |
| 19 | Vanity + Fixtures | bathroom-refresh | $9,500 |
| 20 | Premium Fixtures | bathroom-refresh | $14,800 |
| 21 | Entry Level | bathroom-refresh | $6,800 |
| 22 | Full Tile Remodel | bathroom-standard | $28,500 |
| 23 | Tub to Shower Conversion | bathroom-standard | $38,000 |
| 24 | Budget Tile Remodel | bathroom-standard | $19,500 |
| 25 | Spa Master Bath | bathroom-upscale | $85,000 |
| 26 | Modern Luxury | bathroom-upscale | $108,000 |
| 27 | Entry Luxury | bathroom-upscale | $58,000 |
| 28 | New Full Bath | bathroom-addition | $52,000 |
| 29 | Basement Bath | bathroom-addition | $48,000 |
| 30 | Ensuite Master | bathroom-addition | $78,000 |

### Living/ADU Scenarios (31-50)
**File:** `src/shared/testData/livingAduScenarios.ts`

| ID | Scenario | Classification | Price Range |
|----|----------|----------------|-------------|
| 31 | Sunroom Addition | addition-room | $68,000 |
| 32 | Master Suite Addition | addition-room | $125,000 |
| 33 | Budget Home Office | addition-room | $45,000 |
| 34 | Garage to Living Room | garage-conversion | $62,000 |
| 35 | Garage to In-Law Suite | garage-conversion | $118,000 |
| 36 | Garage to Bedroom | garage-conversion | $52,000 |
| 37 | Backyard Cottage ADU | addition-adu | $185,000 |
| 38 | Premium Studio ADU | addition-adu | $225,000 |
| 39 | Economy ADU | addition-adu | $145,000 |
| 40 | LVP Whole House | flooring-install | $14,400 |
| 41 | Tile Kitchen/Bath | flooring-install | $3,800 |
| 42 | Carpet Bedrooms | flooring-install | $2,300 |
| 43 | Hardwood Refinish Full | flooring-refinish | $5,100 |
| 44 | Screen and Coat | flooring-refinish | $2,100 |
| 45 | Interior Paint Whole House | painting-interior | $9,600 |
| 46 | Interior Accent Rooms | painting-interior | $2,750 |
| 47 | Premium Interior Paint | painting-interior | $14,400 |
| 48 | Exterior Paint Full House | painting-exterior | $11,200 |
| 49 | Exterior Trim Only | painting-exterior | $3,800 |
| 50 | Exterior Large Home + Stain | painting-exterior | $31,500 |

### Exterior Scenarios (51-70)
**File:** `src/shared/testData/exteriorScenarios.ts`

| ID | Scenario | Classification | Price Range |
|----|----------|----------------|-------------|
| 51 | Roof Replacement Standard | roofing-replacement | $16,800 |
| 52 | Roof Replacement Premium | roofing-replacement | $28,500 |
| 53 | Metal Roof Installation | roofing-replacement | $34,000 |
| 54 | Roof Replacement Budget | roofing-replacement | $9,200 |
| 55 | Roof Repair Leak Fix | roofing-repair | $850 |
| 56 | Roof Repair Storm Damage | roofing-repair | $2,400 |
| 57 | Roof Repair Minor Patch | roofing-repair | $425 |
| 58 | Windows Whole House (18) | windows-replacement | $13,500 |
| 59 | Windows Living Room (4) | windows-replacement | $4,800 |
| 60 | Windows Budget (10) | windows-replacement | $4,500 |
| 61 | Impact Windows Florida | windows-replacement | $18,000 |
| 62 | Windows Bedroom Set (6) | windows-replacement | $4,200 |
| 63 | New Deck Composite | deck-new | $24,000 |
| 64 | New Deck Premium Multi-Level | deck-new | $48,000 |
| 65 | New Deck Pressure Treated | deck-new | $15,500 |
| 66 | New Deck Elevated | deck-new | $32,000 |
| 67 | Deck Repair Board Replacement | deck-repair | $4,200 |
| 68 | Deck Repair Full Refinish | deck-repair | $3,800 |
| 69 | Deck Repair Structural + Surface | deck-repair | $12,500 |
| 70 | Deck Repair Minor Fixes | deck-repair | $2,200 |

### Infrastructure Scenarios (71-85)
**File:** `src/shared/testData/infrastructureScenarios.ts`

| ID | Scenario | Classification | Price Range |
|----|----------|----------------|-------------|
| 71 | Panel Upgrade 200A | electrical-service | $4,200 |
| 72 | Whole House Rewire | electrical-service | $18,500 |
| 73 | EV Charger Install | electrical-service | $1,800 |
| 74 | Generator Install | electrical-service | $12,500 |
| 75 | Kitchen Circuit Add | electrical-service | $2,800 |
| 76 | Whole House Repipe | plumbing-service | $8,500 |
| 77 | Water Heater Replace | plumbing-service | $2,400 |
| 78 | Tankless Conversion | plumbing-service | $4,800 |
| 79 | Sewer Line Replace | plumbing-service | $6,200 |
| 80 | Fixture Replacements | plumbing-service | $1,200 |
| 81 | Duct Cleaning & Repair | hvac-service | $1,800 |
| 82 | AC Repair | hvac-service | $850 |
| 83 | Full System Replace | hvac-replacement | $12,500 |
| 84 | Heat Pump System | hvac-replacement | $16,000 |
| 85 | Mini-Split System | hvac-replacement | $9,500 |

### Specialty Scenarios (86-100)
**File:** `src/shared/testData/specialtyScenarios.ts`

| ID | Scenario | Classification | Price Range |
|----|----------|----------------|-------------|
| 86 | Basement Paint & Flooring | basement-refinishing | $12,500 |
| 87 | Basement Flood Restoration | basement-refinishing | $15,326 |
| 88 | Basement Update Fixtures | basement-refinishing | $18,000 |
| 89 | Basement Basic Build-Out | basement-finishing | $42,000 |
| 90 | Basement Full Suite | basement-finishing | $68,000 |
| 91 | Basement Entertainment | basement-finishing | $52,000 |
| 92 | Basement Budget Basic | basement-finishing | $28,000 |
| 93 | Basement Layout Change | basement-remodel | $72,000 |
| 94 | Basement Full Gut | basement-remodel | $95,000 |
| 95 | Basement ADU Convert | basement-remodel | $88,000 |
| 96 | Handyman Misc Repairs | general-handyman | $650 |
| 97 | Handyman Bath Refresh | general-handyman | $850 |
| 98 | Handyman Exterior | general-handyman | $1,200 |
| 99 | Handyman Cabinet/Shelving | general-handyman | $1,500 |
| 100 | Handyman TV/Fixture Install | general-handyman | $950 |

## Test Runner

**File:** `src/shared/testData/scenarioTestRunner.ts`

### Functions Available:
- `runKitchenTests()` - Run all 15 kitchen scenarios
- `runBathroomTests()` - Run all 15 bathroom scenarios
- `runAllTests()` - Run all scenarios
- `formatTestResults(summary)` - Format results for console output
- `getClassificationAccuracy(summary)` - Get accuracy by classification type

### Usage Example:
```typescript
import { runAllTests, formatTestResults } from './scenarioTestRunner';

const results = runAllTests();
console.log(formatTestResults(results));
```

## Test Batch Status

| Phase | Scenarios | Status |
|-------|-----------|--------|
| Phase 1: Kitchen | 1-15 | ✅ Complete |
| Phase 2: Bathroom | 16-30 | ✅ Complete |
| Phase 3: Living/ADU | 31-50 | ✅ Complete |
| Phase 4: Exterior | 51-70 | ✅ Complete |
| Phase 5: Infrastructure | 71-85 | ✅ Complete |
| Phase 6: Specialty | 86-100 | ✅ Complete |

**Total: 100 scenarios across 6 phases**

## Test Validation Criteria

Each scenario is validated on:
1. **Classification Match** - Does the engine detect the correct project type?
2. **Confidence Threshold** - Does confidence meet the minimum expected?
3. **Flag Detection** - Are expected flags raised (e.g., missing permits)?

Pass criteria: Classification matches AND confidence >= expected minimum
