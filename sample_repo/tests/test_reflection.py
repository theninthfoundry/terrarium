import src.pricing as pricing


def test_reflection_based_discount_path():
    # Deliberately indirect: a simple static name-call graph cannot resolve this.
    operation = getattr(pricing, "apply_discount")
    assert operation(200.0, "gold") == 160.0
