import { extractScopeGroups, classifyProject, matchFingerprint, HANDYMAN_FINGERPRINTS, BATHROOM_FINGERPRINTS, PAINTING_FINGERPRINTS, PLUMBING_FINGERPRINTS } from '../scopeFingerprints';
import { SPECIALTY_TEST_SCENARIOS } from './specialtyScenarios';

const testIds = [97, 98, 100];

for (const id of testIds) {
  const test = SPECIALTY_TEST_SCENARIOS.find(t => t.id === id);
  if (!test) continue;
  
  console.log(`\n=== Test #${id} (${test.name}) ===`);
  
  const extracted = extractScopeGroups(test.bidText);
  const extractedSet = new Set(extracted);
  const extractedList = extracted.sort();
  console.log('Extracted scope groups:', extractedList);
  
  // Check handyman indicator
  const hasHandymanIndicator = extractedSet.has('handyman-indicator');
  console.log('Has handyman-indicator:', hasHandymanIndicator);
  
  // Check trade indicators
  const tradeIndicators = extractedList.filter(e => e.startsWith('trade-'));
  console.log('Trade indicators detected:', tradeIndicators);
  
  // Check bathroom/painting/plumbing indicators
  const hasPlumbingFixture = extractedSet.has('plumbing-fixture');
  const hasPaintWalls = extractedSet.has('paint-walls');
  const hasBathroomIndicator = extractedSet.has('bathroom-indicator');
  console.log('Has plumbing-fixture:', hasPlumbingFixture);
  console.log('Has paint-walls:', hasPaintWalls);
  console.log('Has bathroom-indicator:', hasBathroomIndicator);
  
  // Check for absent list items
  const handymanFP = HANDYMAN_FINGERPRINTS[0];
  const absentMatches = handymanFP.absent?.filter(a => extractedSet.has(a)) || [];
  console.log('Absent list violations:', absentMatches);
  
  // Check winning classification
  const result = classifyProject(test.bidText);
  console.log(`Winning: ${result.classification} @ ${result.confidence.toFixed(1)}%`);
}
