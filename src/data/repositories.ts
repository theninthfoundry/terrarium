import { RepositoryWorkspace, SampleSourceFile } from '../types/terrarium';

export const DEFAULT_REPOSITORIES: RepositoryWorkspace[] = [
  {
    id: 'terrarium-sample',
    name: 'terrarium-sample',
    branch: 'main',
    description: 'E-commerce pricing & loyalty tier calculator with reflection dispatch test.',
    language: 'Python 3.10',
    revision: 'main @ 8f3c1a',
    defaultChangedFile: 'src/pricing.py',
    files: [
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
    ],
  },
  {
    id: 'auth-service',
    name: 'auth-service',
    branch: 'release/v2.4',
    description: 'RBAC permission evaluator and security token policy validator.',
    language: 'Python 3.10',
    revision: 'release/v2.4 @ c4b901',
    defaultChangedFile: 'src/auth.py',
    files: [
      {
        path: 'src/auth.py',
        title: 'auth.py',
        language: 'python',
        isTestFile: false,
        functions: ['check_permission', 'validate_session'],
        content: `"""Role-Based Access Control and Session Verification."""


def check_permission(role: str, action: str) -> bool:
    """Evaluate RBAC matrix permissions for an action."""
    if role == "admin":
        return True
    if role == "editor":
        return action == "write"
    return False


def validate_session(role: str, action: str) -> bool:
    """Validate permission for an active user session."""
    return check_permission(role, action)
`,
      },
      {
        path: 'tests/test_auth.py',
        title: 'test_auth.py',
        language: 'python',
        isTestFile: true,
        functions: [
          'test_admin_has_full_access',
          'test_editor_has_write_access',
          'test_viewer_denied_write_access',
          'test_session_delegates_to_permission',
        ],
        content: `from src.auth import check_permission, validate_session


def test_admin_has_full_access():
    assert check_permission("admin", "delete") == True
    assert check_permission("admin", "read") == True


def test_editor_has_write_access():
    assert check_permission("editor", "write") == True
    assert check_permission("editor", "delete") == False


def test_viewer_denied_write_access():
    assert check_permission("viewer", "write") == False


def test_session_delegates_to_permission():
    assert validate_session("admin", "export") == True
`,
      },
      {
        path: 'tests/test_dynamic_policy.py',
        title: 'test_dynamic_policy.py',
        language: 'python',
        isTestFile: true,
        functions: ['test_dynamic_plugin_policy'],
        content: `import src.auth as auth


def test_dynamic_plugin_policy():
    # Dynamic policy lookup via getattr bypasses AST call analysis
    checker = getattr(auth, "check_permission")
    assert checker("admin", "audit") == True
`,
      },
    ],
  },
  {
    id: 'billing-service',
    name: 'billing-service',
    branch: 'main',
    description: 'Invoice reconciliation and regional tax compliance microservice.',
    language: 'Python 3.10',
    revision: 'main @ 91e2f7',
    defaultChangedFile: 'src/billing.py',
    files: [
      {
        path: 'src/billing.py',
        title: 'billing.py',
        language: 'python',
        isTestFile: false,
        functions: ['calculate_tax', 'generate_invoice_total'],
        content: `"""Billing calculations and regional sales tax."""


def calculate_tax(amount: float, region: str) -> float:
    """Calculate sales tax multiplier for region."""
    if region == "US":
        return amount * 0.08
    if region == "EU":
        return amount * 0.20
    return 0.0


def generate_invoice_total(subtotal: float, region: str) -> float:
    """Calculate final order balance with regional tax."""
    tax = calculate_tax(subtotal, region)
    return round(subtotal + tax, 2)
`,
      },
      {
        path: 'tests/test_billing.py',
        title: 'test_billing.py',
        language: 'python',
        isTestFile: true,
        functions: [
          'test_us_tax_calculation',
          'test_eu_tax_calculation',
          'test_zero_tax_default',
          'test_invoice_total_sums_subtotal_and_tax',
        ],
        content: `from src.billing import calculate_tax, generate_invoice_total


def test_us_tax_calculation():
    assert calculate_tax(100.0, "US") == 8.0


def test_eu_tax_calculation():
    assert calculate_tax(100.0, "EU") == 20.0


def test_zero_tax_default():
    assert calculate_tax(100.0, "GLOBAL") == 0.0


def test_invoice_total_sums_subtotal_and_tax():
    total = generate_invoice_total(200.0, "US")
    assert total == 216.0
`,
      },
      {
        path: 'tests/test_gateway_webhook.py',
        title: 'test_gateway_webhook.py',
        language: 'python',
        isTestFile: true,
        functions: ['test_webhook_tax_override'],
        content: `import src.billing as billing


def test_webhook_tax_override():
    # Dynamic dispatch via getattr
    tax_calculator = getattr(billing, "calculate_tax")
    assert tax_calculator(50.0, "EU") == 10.0
`,
      },
    ],
  },
];

const CUSTOM_REPOS_KEY = 'terrarium_custom_repositories_v1';

export function getCustomRepositories(): RepositoryWorkspace[] {
  try {
    const raw = localStorage.getItem(CUSTOM_REPOS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCustomRepository(repo: RepositoryWorkspace): void {
  try {
    const current = getCustomRepositories();
    const updated = [repo, ...current.filter((r) => r.id !== repo.id)];
    localStorage.setItem(CUSTOM_REPOS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save custom repo:', err);
  }
}

export function getAllRepositories(): RepositoryWorkspace[] {
  const custom = getCustomRepositories();
  return [...DEFAULT_REPOSITORIES, ...custom];
}
