import { extractScopeGroups, classifyProject, ALL_FINGERPRINTS, scoreFingerprint } from '../scopeFingerprints';
import { BATHROOM_TEST_SCENARIOS } from './bathroomScenarios';

// Debug bathroom-cosmetic tests #16, #17, #18
const testIds = [16, 17, 18];

for (const id of testIds) {
  const test = BATHROOM_TEST_SCENARIOS.find(t => t.id === id);
  if (!test) continue;
  
  const extracted = extractScopeGroups(test.bidText);
  const extractedSet = new Set(extracted);
  const result = classifyProject(test.bidText);
  
  console.log(`\n${'='.repeat(50)}`);
  console.log(`#${id}: ${test.name} (expect: ${test.expectedClassification})`);
  console.log(`Got: ${result.classification} @ ${result.confidence.toFixed(1)}%`);
  console.log(`Detected items: ${extracted.join(', ')}`);
  
  // Score both cosmetic and refresh
  const cosmetic = ALL_FINGERPRINTS.find(f => f.classification === 'bathroom-cosmetic');
  const refresh = ALL_FINGERPRINTS.find(f => f.classification === 'bathroom-refresh');
  
  if (cosmetic && refresh) {
    const cosmeticResult = scoreFingerprint(cosmetic, extractedSet);
    const refreshResult = scoreFingerprint(refresh, extractedSet);
    console.log(`bathroom-cosmetic score: ${cosmeticResult.confidence.toFixed(1)}%`);
    console.log(`bathroom-refresh score: ${refreshResult.confidence.toFixed(1)}%`);
    
    // Check absent items (contradictions)
    console.log(`cosmetic contradictions: ${cosmeticResult.contradictions.join(', ') || 'none'}`);
    console.log(`refresh contradictions: ${refreshResult.contradictions.join(', ') || 'none'}`);
    
    // Check expected items
    console.log(`cosmetic expected matched: ${cosmeticResult.matchedExpected.join(', ') || 'none'}`);
    console.log(`refresh expected matched: ${refreshResult.matchedExpected.join(', ') || 'none'}`);
    
    // Show absent lists from fingerprints
    console.log(`cosmetic absent list: ${cosmetic.absent.join(', ')}`);
    console.log(`refresh absent list: ${refresh.absent.join(', ')}`);
  }
}
