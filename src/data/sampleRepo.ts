import { SampleSourceFile } from '../types/terrarium';

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
