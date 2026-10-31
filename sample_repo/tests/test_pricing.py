from src.pricing import apply_discount, calculate_total


def test_gold_discount_is_twenty_percent():
    assert apply_discount(100.0, "gold") == 80.0


def test_silver_discount_is_ten_percent():
    assert apply_discount(100.0, "silver") == 90.0


def test_regular_customer_gets_no_discount():
    assert apply_discount(100.0, "regular") == 100.0


def test_cart_total_applies_gold_discount():
    assert calculate_total([40.0, 60.0], "gold") == 80.0


def test_cart_total_rounds_to_two_decimals():
    assert calculate_total([12.345], "regular") == 12.35
