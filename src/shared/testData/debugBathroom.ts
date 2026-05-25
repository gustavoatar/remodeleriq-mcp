/**
 * Debug script for failing bathroom tests
 */
import { extractScopeGroups, scoreFingerprint, ALL_FINGERPRINTS, SCOPE_GROUPS } from '../scopeFingerprints';
import { BATHROOM_TEST_SCENARIOS } from './bathroomScenarios';

const FAILING_TESTS = [16, 19, 23, 26, 29];

// Helper to show what scope items are extracted from bid text
function extractAndShow(bidText: string): Set<string> {
  const extractedArray = extractScopeGroups(bidText);
  return new Set(extractedArray);
}

// Run debug on each failing test
for (const testId of FAILING_TESTS) {
  const scenario = BATHROOM_TEST_SCENARIOS.find(s => s.id === testId);
  if (!scenario) {
    console.log(`\n❌ Test #${testId} not found`);
    continue;
  }
  
  console.log(`\n${'='.repeat(70)}`);
  console.log(`TEST #${testId}: ${scenario.name}`);
  console.log(`Expected: ${scenario.expectedClassification}`);
  console.log(`${'='.repeat(70)}`);
  
  // Extract scope items
  const extracted = extractAndShow(scenario.bidText);
  console.log(`\nExtracted scope items (${extracted.size}):`);
  const sortedExtracted = Array.from(extracted).sort();
  console.log(sortedExtracted.join(', '));
  
  // Key bathroom indicators
  const bathroomItems = [
    'bathroom-indicator', 'bath-vanity', 'bath-shower', 'bath-tub', 'bath-spa', 'bath-mirror',
    'tile-wall', 'tile-floor', 'tile-waterproof',
    'plumbing-fixture', 'plumbing-rough', 'plumbing-connect',
    'demo-full', 'demo-partial',
    'framing', 'drywall', 'electrical-rough',
    'flooring-lvp', 'paint-walls', 'permits',
    'basement-indicator'
  ];
  
  console.log(`\nKey bathroom indicators:`);
  for (const item of bathroomItems) {
    const hasIt = extracted.has(item);
    console.log(`  ${hasIt ? '✓' : '✗'} ${item}`);
  }
  
  // Score top 5 fingerprints
  console.log(`\nTop fingerprint matches:`);
  const scores: { classification: string; score: number; details: string }[] = [];
  
  for (const fp of ALL_FINGERPRINTS) {
    const result = scoreFingerprint(fp, extracted);
    const reqMet = fp.required?.filter(r => extracted.has(r)).length ?? 0;
    const reqTotal = fp.required?.length ?? 0;
    const expMet = fp.expected?.filter(e => extracted.has(e)).length ?? 0;
    const expTotal = fp.expected?.length ?? 0;
    const absentViolations = fp.absent?.filter(a => extracted.has(a)) ?? [];
    
    scores.push({
      classification: fp.classification,
      score: result.confidence,
      details: `req=${reqMet}/${reqTotal}, exp=${expMet}/${expTotal}, absent-violations=${absentViolations.length > 0 ? absentViolations.join(',') : 'none'}`
    });
  }
  
  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);
  
  // Show top 5
  for (let i = 0; i < Math.min(5, scores.length); i++) {
    const s = scores[i];
    const marker = s.classification === scenario.expectedClassification ? ' ← EXPECTED' : '';
    console.log(`  ${i + 1}. ${s.classification}: ${(s.score * 100).toFixed(1)}% (${s.details})${marker}`);
  }
  
  // Find expected classification position
  const expectedIdx = scores.findIndex(s => s.classification === scenario.expectedClassification);
  if (expectedIdx >= 5) {
    const expected = scores[expectedIdx];
    console.log(`  ...`);
    console.log(`  ${expectedIdx + 1}. ${expected.classification}: ${(expected.score * 100).toFixed(1)}% (${expected.details}) ← EXPECTED`);
  }
}

// Show bathroom-related scope groups for reference
console.log(`\n${'='.repeat(70)}`);
console.log(`BATHROOM-RELATED SCOPE GROUPS`);
console.log(`${'='.repeat(70)}`);

const bathroomGroups = ['bathroom-indicator', 'bath-vanity', 'bath-shower', 'bath-tub', 'bath-spa', 'bath-mirror', 'tile-wall', 'tile-floor', 'tile-waterproof'];
for (const group of bathroomGroups) {
  if (SCOPE_GROUPS[group]) {
    console.log(`\n${group}:`);
    console.log(`  ${SCOPE_GROUPS[group].slice(0, 5).map(p => p.source || p.toString()).join('\n  ')}${SCOPE_GROUPS[group].length > 5 ? `\n  ... (${SCOPE_GROUPS[group].length} total)` : ''}`);
  }
}
