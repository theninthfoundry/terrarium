import { AnalysisReport, SampleSourceFile } from '../types/terrarium';

export const SAMPLE_FILES: SampleSourceFile[] = [
  {
    path: 'src/pricing.py',
    title: 'pricing.py',
    language: 'python',
    isTestFile: false,
    functions: ['apply_discount', 'calculate_total'],
    content: `"""Small checkout pricing module used by Terrarium's reproducible demo."""


def apply_discount(subtotal: float, customer_tier: str) -> float:
    """Apply the loyalty discount for a customer tier."""
    if customer_tier == "gold":
        return subtotal * 0.80
    if customer_tier == "silver":
        return subtotal * 0.90
    return subtotal


def calculate_total(items: list[float], customer_tier: str) -> float:
    """Calculate a rounded order total after loyalty discount."""
    subtotal = sum(items)
    return round(apply_discount(subtotal, customer_tier), 2)
`,
  },
  {
    path: 'tests/test_pricing.py',
    title: 'test_pricing.py',
    language: 'python',
    isTestFile: true,
    functions: [
      'test_gold_discount_is_twenty_percent',
      'test_silver_discount_is_ten_percent',
      'test_regular_customer_gets_no_discount',
      'test_cart_total_applies_gold_discount',
      'test_cart_total_rounds_to_two_decimals',
    ],
    content: `import pytest
from src.pricing import apply_discount, calculate_total


def test_gold_discount_is_twenty_percent():
    assert apply_discount(100.0, "gold") == 80.0


def test_silver_discount_is_ten_percent():
    assert apply_discount(100.0, "silver") == 90.0


def test_regular_customer_gets_no_discount():
    assert apply_discount(100.0, "bronze") == 100.0
    assert apply_discount(100.0, "standard") == 100.0


def test_cart_total_applies_gold_discount():
    items = [25.0, 75.0]
    assert calculate_total(items, "gold") == 80.0


def test_cart_total_rounds_to_two_decimals():
    items = [19.99, 10.05]
    total = calculate_total(items, "silver")
    assert total == 27.04
`,
  },
  {
    path: 'tests/test_reflection.py',
    title: 'test_reflection.py',
    language: 'python',
    isTestFile: true,
    functions: ['test_reflection_based_discount_path'],
    content: `import src.pricing as pricing


def test_reflection_based_discount_path():
    # Deliberately indirect: a simple static name-call graph cannot resolve this.
    operation = getattr(pricing, "apply_discount")
    assert operation(200.0, "gold") == 160.0
`,
  },
];

export const INITIAL_DEMO_REPORT: AnalysisReport = {
  repository: "sample_repo",
  graph_source: "Python AST fallback (Graphify graph not found)",
  changed_files: [
    "src/pricing.py"
  ],
  changed_functions: [
    "src/pricing.py::apply_discount",
    "src/pricing.py::calculate_total"
  ],
  predicted_tests: [
    "tests/test_pricing.py::test_cart_total_applies_gold_discount",
    "tests/test_pricing.py::test_cart_total_rounds_to_two_decimals",
    "tests/test_pricing.py::test_gold_discount_is_twenty_percent",
    "tests/test_pricing.py::test_regular_customer_gets_no_discount",
    "tests/test_pricing.py::test_silver_discount_is_ten_percent"
  ],
  dependency_paths: [
    [
      "tests/test_pricing.py::test_gold_discount_is_twenty_percent",
      "src/pricing.py::apply_discount"
    ],
    [
      "tests/test_pricing.py::test_silver_discount_is_ten_percent",
      "src/pricing.py::apply_discount"
    ],
    [
      "tests/test_pricing.py::test_regular_customer_gets_no_discount",
      "src/pricing.py::apply_discount"
    ],
    [
      "tests/test_pricing.py::test_cart_total_applies_gold_discount",
      "src/pricing.py::calculate_total",
      "src/pricing.py::apply_discount"
    ],
    [
      "tests/test_pricing.py::test_cart_total_rounds_to_two_decimals",
      "src/pricing.py::calculate_total",
      "src/pricing.py::apply_discount"
    ],
    [
      "tests/test_pricing.py::test_cart_total_applies_gold_discount",
      "src/pricing.py::calculate_total"
    ],
    [
      "tests/test_pricing.py::test_cart_total_rounds_to_two_decimals",
      "src/pricing.py::calculate_total"
    ]
  ],
  baseline_passed: true,
  baseline_summary: "Baseline passed (6/6 tests passing in clean virtualenv)",
  mutations: [
    {
      mutation_id: "M01",
      file: "src/pricing.py",
      function: "src/pricing.py::apply_discount",
      description: "comparison: Eq → NotEq",
      status: "killed",
      predicted_tests: [
        "tests/test_pricing.py::test_cart_total_applies_gold_discount",
        "tests/test_pricing.py::test_cart_total_rounds_to_two_decimals",
        "tests/test_pricing.py::test_gold_discount_is_twenty_percent",
        "tests/test_pricing.py::test_regular_customer_gets_no_discount",
        "tests/test_pricing.py::test_silver_discount_is_ten_percent"
      ],
      failing_tests: [
        "tests/test_pricing.py::test_cart_total_applies_gold_discount",
        "tests/test_pricing.py::test_cart_total_rounds_to_two_decimals",
        "tests/test_pricing.py::test_gold_discount_is_twenty_percent",
        "tests/test_pricing.py::test_regular_customer_gets_no_discount",
        "tests/test_pricing.py::test_silver_discount_is_ten_percent",
        "tests/test_reflection.py::test_reflection_based_discount_path"
      ],
      duration_seconds: 2.365,
      error: null
    },
    {
      mutation_id: "M02",
      file: "src/pricing.py",
      function: "src/pricing.py::apply_discount",
      description: "arithmetic: Mult → FloorDiv",
      status: "killed",
      predicted_tests: [
        "tests/test_pricing.py::test_cart_total_applies_gold_discount",
        "tests/test_pricing.py::test_cart_total_rounds_to_two_decimals",
        "tests/test_pricing.py::test_gold_discount_is_twenty_percent",
        "tests/test_pricing.py::test_regular_customer_gets_no_discount",
        "tests/test_pricing.py::test_silver_discount_is_ten_percent"
      ],
      failing_tests: [
        "tests/test_pricing.py::test_cart_total_applies_gold_discount",
        "tests/test_pricing.py::test_gold_discount_is_twenty_percent",
        "tests/test_reflection.py::test_reflection_based_discount_path"
      ],
      duration_seconds: 2.288,
      error: null
    },
    {
      mutation_id: "M03",
      file: "src/pricing.py",
      function: "src/pricing.py::apply_discount",
      description: "comparison: Eq → NotEq",
      status: "killed",
      predicted_tests: [
        "tests/test_pricing.py::test_cart_total_applies_gold_discount",
        "tests/test_pricing.py::test_cart_total_rounds_to_two_decimals",
        "tests/test_pricing.py::test_gold_discount_is_twenty_percent",
        "tests/test_pricing.py::test_regular_customer_gets_no_discount",
        "tests/test_pricing.py::test_silver_discount_is_ten_percent"
      ],
      failing_tests: [
        "tests/test_pricing.py::test_cart_total_rounds_to_two_decimals",
        "tests/test_pricing.py::test_regular_customer_gets_no_discount",
        "tests/test_pricing.py::test_silver_discount_is_ten_percent"
      ],
      duration_seconds: 2.374,
      error: null
    },
    {
      mutation_id: "M04",
      file: "src/pricing.py",
      function: "src/pricing.py::apply_discount",
      description: "arithmetic: Mult → FloorDiv",
      status: "killed",
      predicted_tests: [
        "tests/test_pricing.py::test_cart_total_applies_gold_discount",
        "tests/test_pricing.py::test_cart_total_rounds_to_two_decimals",
        "tests/test_pricing.py::test_gold_discount_is_twenty_percent",
        "tests/test_pricing.py::test_regular_customer_gets_no_discount",
        "tests/test_pricing.py::test_silver_discount_is_ten_percent"
      ],
      failing_tests: [
        "tests/test_pricing.py::test_silver_discount_is_ten_percent"
      ],
      duration_seconds: 2.317,
      error: null
    }
  ],
  mutation_tested_recall: 0.8462,
  valid_mutants: 4,
  total_mutants: 4,
  missed_tests: [
    "tests/test_reflection.py::test_reflection_based_discount_path"
  ],
  explanation: "The experiment observed 4 killed mutants and 6 distinct failing tests. 1 failing test was absent from the impact prediction: tests/test_reflection.py::test_reflection_based_discount_path. This is direct evidence of an impact-analysis blind spot; the current run does not establish whether it came from dynamic dispatch, reflection, import indirection, or incomplete graph data. Gemma explanation unavailable (GEMMA_API_KEY is not configured).",
  warnings: [
    "Graphify graph.json was not available; this run used the built-in Python AST graph. Dynamic and cross-language edges may be missing."
  ]
};
