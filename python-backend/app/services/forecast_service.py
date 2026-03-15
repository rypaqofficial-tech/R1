def build_forecast(base_irr: float, gdp: float, inflation: float, horizon: int = 5):
    """Simple 3-scenario forecast"""
    base = [base_irr * (1 + (gdp/100 - inflation/100))**i for i in range(horizon)]
    bull = [x * 1.15 for x in base]
    bear = [x * 0.85 for x in base]
    return {"base": base, "bull": bull, "bear": bear}