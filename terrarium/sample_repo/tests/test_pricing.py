from src.pricing import apply_discount,calculate_total
def test_gold():assert apply_discount(100,'gold')==80
def test_silver():assert apply_discount(100,'silver')==90
def test_standard():assert apply_discount(100,'standard')==100
def test_total():assert calculate_total([50,50],'gold')==80
