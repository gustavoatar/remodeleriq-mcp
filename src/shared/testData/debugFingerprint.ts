import { extractScopeGroups, matchFingerprint, ALL_FINGERPRINTS, scoreFingerprint } from '../scopeFingerprints';

// Test case #37: ADU - Backyard Cottage - should be addition-adu
const bidText = `DETACHED ADU - 600 SF
      
      SITE WORK:
      - Grading and excavation
      - Utility trenching
      
      FOUNDATION:
      - Concrete footings
      - Slab on grade
      
      FRAMING:
      - 2x6 walls
      - Engineered trusses
      - Windows and doors
      
      PLUMBING ROUGH:
      - Kitchen rough
      - Bathroom rough
      - Water heater
      - Gas line
      
      ELECTRICAL ROUGH:
      - Panel (100A)
      - Kitchen circuits
      - Bath circuit
      - General circuits
      
      HVAC:
      - Mini-split heat pump (2 zone)
      
      EXTERIOR:
      - Hardie siding
      - Comp shingle roof
      - Gutters
      
      INSULATION & DRYWALL
      
      KITCHEN:
      - Cabinets (16 LF)
      - Quartz counters
      - Full appliances
      
      BATHROOM:
      - Tile shower
      - Vanity, toilet
      
      FLOORING:
      - LVP throughout
      - Tile in bath
      
      PAINT
      
      PERMITS & ENGINEERING
      
      Total: $185,000
      Timeline: 4-5 months`;

const groups = extractScopeGroups(bidText);
console.log('=== Scope Groups Detected ===');
console.log(Array.from(groups).sort());

// Score each fingerprint manually
console.log('\n=== Fingerprint Scores (top 10) ===');
const groupsSet = new Set(groups);
const scores = ALL_FINGERPRINTS.map(fp => ({
  classification: fp.classification,
  result: scoreFingerprint(fp, groupsSet)
})).sort((a, b) => b.result.confidence - a.result.confidence);

scores.slice(0, 10).forEach((s, i) => {
  const r = s.result;
  console.log(`${i + 1}. ${s.classification}: ${r.confidence.toFixed(1)}%`);
  if (r.contradictions.length > 0) {
    console.log(`   Contradictions: ${r.contradictions.join(', ')}`);
  }
});

const result = matchFingerprint(bidText, null);
console.log('\n=== Final Fingerprint Result ===');
console.log('Classification:', result.classification);
console.log('Confidence:', result.confidence);
