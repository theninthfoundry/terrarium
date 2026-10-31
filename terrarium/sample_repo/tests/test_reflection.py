from src import pricing
def test_reflection_based_discount_path():
    target=getattr(pricing,'apply_discount')
    assert target(100,'gold')==80
