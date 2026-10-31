def apply_discount(subtotal, customer_tier):
    if customer_tier=='gold':return subtotal*0.80
    if customer_tier=='silver':return subtotal*0.90
    return subtotal

def calculate_total(items,customer_tier):
    return round(apply_discount(sum(items),customer_tier),2)
