/**
 * Scenario Test Runner
 * Validates test scenarios against the scope fingerprinting engine
 * 
 * Usage:
 * - Import scenarios from kitchenScenarios.ts or bathroomScenarios.ts
 * - Call runScenarioTests() with the scenarios array
 * - Review results for pass/fail and classification accuracy
 */

import { 
  matchFingerprint, 
  type ProjectClassification 
} from '../scopeFingerprints';
import { KITCHEN_TEST_SCENARIOS, type KitchenTestScenario, type ScenarioTestResult, type TestRunSummary } from './kitchenScenarios';
import { BATHROOM_TEST_SCENARIOS, type BathroomTestScenario } from './bathroomScenarios';
import { LIVING_ADU_TEST_SCENARIOS, type LivingAduTestScenario } from './livingAduScenarios';
import { EXTERIOR_TEST_SCENARIOS, type ExteriorTestScenario } from './exteriorScenarios';
import { INFRASTRUCTURE_TEST_SCENARIOS, type InfrastructureTestScenario } from './infrastructureScenarios';
import { SPECIALTY_TEST_SCENARIOS, type SpecialtyTestScenario } from './specialtyScenarios';
import { EDGE_CASE_TEST_SCENARIOS, type EdgeCaseTestScenario } from './edgeCaseScenarios';

// Union type for all scenario types
export type TestScenario = KitchenTestScenario | BathroomTestScenario | LivingAduTestScenario | ExteriorTestScenario | InfrastructureTestScenario | SpecialtyTestScenario | EdgeCaseTestScenario;

/**
 * Run a single scenario test
 */
export function runSingleScenario(scenario: TestScenario): ScenarioTestResult {
  // Match the bid text against fingerprints
  const match = matchFingerprint(scenario.bidText);
  
  const actualClassification = match?.classification || 'unknown';
  const actualConfidence = match?.confidence || 0;
  
  // Check if classification matches
  const classificationMatch = actualClassification === scenario.expectedClassification;
  
  // Check if confidence meets minimum
  const confidenceMet = actualConfidence >= scenario.expectedConfidenceMin;
  
  // For now, flag checking is simplified - would need full analysis for real flags
  const matchedFlags: string[] = [];
  const missingFlags: string[] = scenario.expectedFlags; // All expected flags are "missing" in this simple test
  const unexpectedFlags: string[] = [];
  
  const passed = classificationMatch && confidenceMet;
  
  let notes = '';
  if (!classificationMatch) {
    notes = `Classification mismatch: expected ${scenario.expectedClassification}, got ${actualClassification}`;
  } else if (!confidenceMet) {
    notes = `Confidence too low: expected >= ${scenario.expectedConfidenceMin}, got ${actualConfidence}`;
  } else {
    notes = 'All checks passed';
  }
  
  return {
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    passed,
    actualClassification: actualClassification as ProjectClassification,
    expectedClassification: scenario.expectedClassification,
    actualConfidence,
    expectedConfidenceMin: scenario.expectedConfidenceMin,
    matchedFlags,
    missingFlags,
    unexpectedFlags,
    notes,
  };
}

/**
 * Run all scenarios in a batch
 */
export function runScenarioTests(scenarios: TestScenario[]): TestRunSummary {
  const results = scenarios.map(runSingleScenario);
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  return {
    totalScenarios: scenarios.length,
    passed,
    failed,
    passRate: passed / scenarios.length,
    results,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Run kitchen scenario tests
 */
export function runKitchenTests(): TestRunSummary {
  return runScenarioTests(KITCHEN_TEST_SCENARIOS);
}

/**
 * Run bathroom scenario tests
 */
export function runBathroomTests(): TestRunSummary {
  return runScenarioTests(BATHROOM_TEST_SCENARIOS);
}

/**
 * Run Living/ADU scenario tests
 */
export function runLivingAduTests(): TestRunSummary {
  return runScenarioTests(LIVING_ADU_TEST_SCENARIOS);
}

/**
 * Run Exterior scenario tests
 */
export function runExteriorTests(): TestRunSummary {
  return runScenarioTests(EXTERIOR_TEST_SCENARIOS);
}

/**
 * Run Infrastructure scenario tests
 */
export function runInfrastructureTests(): TestRunSummary {
  return runScenarioTests(INFRASTRUCTURE_TEST_SCENARIOS);
}

/**
 * Run Specialty scenario tests
 */
export function runSpecialtyTests(): TestRunSummary {
  return runScenarioTests(SPECIALTY_TEST_SCENARIOS);
}

/**
 * Run Edge Case scenario tests (lock-in threshold validation)
 */
export function runEdgeCaseTests(): TestRunSummary {
  return runScenarioTests(EDGE_CASE_TEST_SCENARIOS);
}

/**
 * Run all scenario tests
 */
export function runAllTests(): TestRunSummary {
  const allScenarios = [
    ...KITCHEN_TEST_SCENARIOS,
    ...BATHROOM_TEST_SCENARIOS,
    ...LIVING_ADU_TEST_SCENARIOS,
    ...EXTERIOR_TEST_SCENARIOS,
    ...INFRASTRUCTURE_TEST_SCENARIOS,
    ...SPECIALTY_TEST_SCENARIOS,
    ...EDGE_CASE_TEST_SCENARIOS,
  ];
  return runScenarioTests(allScenarios);
}

/**
 * Format test results for console output
 */
export function formatTestResults(summary: TestRunSummary): string {
  const lines: string[] = [
    '='.repeat(60),
    `SCENARIO TEST RESULTS - ${summary.timestamp}`,
    '='.repeat(60),
    '',
    `Total: ${summary.totalScenarios} | Passed: ${summary.passed} | Failed: ${summary.failed} | Rate: ${(summary.passRate * 100).toFixed(1)}%`,
    '',
  ];
  
  // Group by pass/fail
  const passed = summary.results.filter(r => r.passed);
  const failed = summary.results.filter(r => !r.passed);
  
  if (failed.length > 0) {
    lines.push('FAILED SCENARIOS:');
    lines.push('-'.repeat(40));
    failed.forEach(r => {
      lines.push(`#${r.scenarioId}: ${r.scenarioName}`);
      lines.push(`  Expected: ${r.expectedClassification} (>=${r.expectedConfidenceMin}%)`);
      lines.push(`  Actual: ${r.actualClassification} (${r.actualConfidence}%)`);
      lines.push(`  Note: ${r.notes}`);
      lines.push('');
    });
  }
  
  if (passed.length > 0) {
    lines.push('PASSED SCENARIOS:');
    lines.push('-'.repeat(40));
    passed.forEach(r => {
      lines.push(`✓ #${r.scenarioId}: ${r.scenarioName} (${r.actualClassification} @ ${r.actualConfidence}%)`);
    });
  }
  
  lines.push('');
  lines.push('='.repeat(60));
  
  return lines.join('\n');
}

/**
 * Get classification accuracy by type
 */
export function getClassificationAccuracy(summary: TestRunSummary): Record<string, { total: number; correct: number; rate: number }> {
  const byType: Record<string, { total: number; correct: number }> = {};
  
  summary.results.forEach(r => {
    const type = r.expectedClassification;
    if (!byType[type]) {
      byType[type] = { total: 0, correct: 0 };
    }
    byType[type].total++;
    if (r.actualClassification === r.expectedClassification) {
      byType[type].correct++;
    }
  });
  
  const result: Record<string, { total: number; correct: number; rate: number }> = {};
  Object.entries(byType).forEach(([type, stats]) => {
    result[type] = {
      ...stats,
      rate: stats.correct / stats.total,
    };
  });
  
  return result;
}

// Run tests when executed directly
const summary = runAllTests();
console.log(formatTestResults(summary));
console.log('\nACCURACY BY CLASSIFICATION:');
const accuracy = getClassificationAccuracy(summary);
Object.entries(accuracy).sort((a, b) => a[1].rate - b[1].rate).forEach(([type, stats]) => {
  console.log(`  ${type}: ${stats.correct}/${stats.total} (${(stats.rate * 100).toFixed(0)}%)`);
});
