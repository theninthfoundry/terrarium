import { AnalysisReport, ExperimentParams, MutationResult } from '../types/terrarium';

export async function runTerrariumAnalysis(params: ExperimentParams): Promise<AnalysisReport> {
  // Simulate asynchronous execution steps:
  // 1. Baseline verification
  // 2. Dependency graph traversal
  // 3. Isolated AST mutation generation
  // 4. Test execution on isolated mutant copies
  await new Promise((resolve) => setTimeout(resolve, 850));

  const isAST = params.graphType === 'ast';
  const graphSource = isAST
    ? 'Python AST fallback (Graphify graph not found)'
    : 'Graphify code-property graph (AST + semantic import index)';

  const changedFiles = params.changedFiles.length > 0 ? params.changedFiles : ['src/pricing.py'];
  const changedFunctions = [
    'src/pricing.py::apply_discount',
    'src/pricing.py::calculate_total',
  ];

  const predictedTests = [
    'tests/test_pricing.py::test_cart_total_applies_gold_discount',
    'tests/test_pricing.py::test_cart_total_rounds_to_two_decimals',
    'tests/test_pricing.py::test_gold_discount_is_twenty_percent',
    'tests/test_pricing.py::test_regular_customer_gets_no_discount',
    'tests/test_pricing.py::test_silver_discount_is_ten_percent',
  ];

  const dependencyPaths: string[][] = [
    [
      'tests/test_pricing.py::test_gold_discount_is_twenty_percent',
      'src/pricing.py::apply_discount',
    ],
    [
      'tests/test_pricing.py::test_silver_discount_is_ten_percent',
      'src/pricing.py::apply_discount',
    ],
    [
      'tests/test_pricing.py::test_regular_customer_gets_no_discount',
      'src/pricing.py::apply_discount',
    ],
    [
      'tests/test_pricing.py::test_cart_total_applies_gold_discount',
      'src/pricing.py::calculate_total',
      'src/pricing.py::apply_discount',
    ],
    [
      'tests/test_pricing.py::test_cart_total_rounds_to_two_decimals',
      'src/pricing.py::calculate_total',
      'src/pricing.py::apply_discount',
    ],
    [
      'tests/test_pricing.py::test_cart_total_applies_gold_discount',
      'src/pricing.py::calculate_total',
    ],
    [
      'tests/test_pricing.py::test_cart_total_rounds_to_two_decimals',
      'src/pricing.py::calculate_total',
    ],
  ];

  const reflectionTest = 'tests/test_reflection.py::test_reflection_based_discount_path';

  // Mutation operator templates
  const allMutationsPool: Array<{
    operator: string;
    description: string;
    fn: string;
    failing: string[];
  }> = [
    {
      operator: 'comparison',
      description: 'comparison: Eq → NotEq',
      fn: 'src/pricing.py::apply_discount',
      failing: [
        'tests/test_pricing.py::test_cart_total_applies_gold_discount',
        'tests/test_pricing.py::test_cart_total_rounds_to_two_decimals',
        'tests/test_pricing.py::test_gold_discount_is_twenty_percent',
        'tests/test_pricing.py::test_regular_customer_gets_no_discount',
        'tests/test_pricing.py::test_silver_discount_is_ten_percent',
        ...(params.includeReflectionTest ? [reflectionTest] : []),
      ],
    },
    {
      operator: 'arithmetic',
      description: 'arithmetic: Mult → FloorDiv',
      fn: 'src/pricing.py::apply_discount',
      failing: [
        'tests/test_pricing.py::test_cart_total_applies_gold_discount',
        'tests/test_pricing.py::test_gold_discount_is_twenty_percent',
        ...(params.includeReflectionTest ? [reflectionTest] : []),
      ],
    },
    {
      operator: 'comparison',
      description: 'comparison: Eq → NotEq',
      fn: 'src/pricing.py::apply_discount',
      failing: [
        'tests/test_pricing.py::test_cart_total_rounds_to_two_decimals',
        'tests/test_pricing.py::test_regular_customer_gets_no_discount',
        'tests/test_pricing.py::test_silver_discount_is_ten_percent',
      ],
    },
    {
      operator: 'arithmetic',
      description: 'arithmetic: Mult → FloorDiv',
      fn: 'src/pricing.py::apply_discount',
      failing: [
        'tests/test_pricing.py::test_silver_discount_is_ten_percent',
      ],
    },
    {
      operator: 'constant',
      description: 'constant: 0.80 → 0.85',
      fn: 'src/pricing.py::apply_discount',
      failing: [
        'tests/test_pricing.py::test_gold_discount_is_twenty_percent',
        'tests/test_pricing.py::test_cart_total_applies_gold_discount',
        ...(params.includeReflectionTest ? [reflectionTest] : []),
      ],
    },
    {
      operator: 'round',
      description: 'rounding: round(, 2) → round(, 0)',
      fn: 'src/pricing.py::calculate_total',
      failing: [
        'tests/test_pricing.py::test_cart_total_rounds_to_two_decimals',
      ],
    },
  ];

  const selectedCount = Math.min(params.maxMutations, allMutationsPool.length);
  const mutations: MutationResult[] = allMutationsPool.slice(0, selectedCount).map((item, index) => {
    const id = `M${String(index + 1).padStart(2, '0')}`;
    const baseDuration = 2.1 + (index * 0.08) + Math.random() * 0.25;
    return {
      mutation_id: id,
      file: 'src/pricing.py',
      function: item.fn,
      description: item.description,
      status: 'killed',
      predicted_tests: [...predictedTests],
      failing_tests: item.failing,
      duration_seconds: Math.round(baseDuration * 1000) / 1000,
      error: null,
    };
  });

  const killed = mutations.filter((m) => m.status === 'killed');
  
  // Calculate recall:
  // actual_pairs = {(test, mutation_id) for item in killed for test in item.failing_tests}
  // predicted_pairs = {(test, mutation_id) for item in killed for test in item.predicted_tests}
  let actualPairsCount = 0;
  let intersectionCount = 0;
  const actualTestsSet = new Set<string>();

  for (const m of killed) {
    const predSet = new Set(m.predicted_tests);
    for (const test of m.failing_tests) {
      actualPairsCount++;
      actualTestsSet.add(test);
      if (predSet.has(test)) {
        intersectionCount++;
      }
    }
  }

  const recall = actualPairsCount > 0 ? Math.round((intersectionCount / actualPairsCount) * 10000) / 10000 : null;

  // Missed tests:
  const predTestsSet = new Set(predictedTests);
  const missedTests = Array.from(actualTestsSet).filter((t) => !predTestsSet.has(t)).sort();

  const warnings: string[] = [];
  if (isAST) {
    warnings.push(
      'Graphify graph.json was not available; this run used the built-in Python AST graph. Dynamic and cross-language edges may be missing.'
    );
  } else {
    warnings.push(
      'Graphify graph loaded: Static property graph resolved all local AST tokens; runtime reflection remains non-manifest in static symbol tables.'
    );
  }

  let explanation = '';
  if (killed.length === 0) {
    explanation = 'No valid killed mutants were observed. The trust score is unavailable.';
  } else if (missedTests.length > 0) {
    explanation = `The experiment observed ${killed.length} killed mutants and ${actualTestsSet.size} distinct failing tests. ${missedTests.length} failing tests were absent from the impact prediction: ${missedTests.join(', ')}. This is direct evidence of an impact-analysis blind spot; the current run does not establish whether it came from dynamic dispatch, reflection, import indirection, or incomplete graph data.`;
  } else {
    explanation = `The experiment observed ${killed.length} killed mutants and ${actualTestsSet.size} distinct failing tests. Every observed failing test appeared in the prediction for this sample. This is encouraging sample evidence, not a guarantee for other changes or repositories.`;
  }

  return {
    repository: params.repositoryPath || 'sample_repo',
    graph_source: graphSource,
    changed_files: changedFiles,
    changed_functions: changedFunctions,
    predicted_tests: predictedTests,
    dependency_paths: dependencyPaths,
    baseline_passed: true,
    baseline_summary: 'Baseline passed (6/6 tests passing in clean virtualenv)',
    mutations,
    mutation_tested_recall: recall,
    valid_mutants: killed.length,
    total_mutants: mutations.length,
    missed_tests: missedTests,
    explanation,
    warnings,
  };
}
