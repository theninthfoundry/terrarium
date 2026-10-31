"""Small checkout pricing module used by Terrarium's reproducible demo."""


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
