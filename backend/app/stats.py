"""Small pure-math helpers — no numpy dependency needed for numbers this small."""
import math


def brier_score(probability: float, actual_outcome: float) -> float:
    """Mean squared error between a stated probability and the realized
    outcome (0 or 1). Lower is better; 0 is a perfect call."""
    return (probability - actual_outcome) ** 2


def pearson_correlation(xs: list[float], ys: list[float]) -> float | None:
    """Standard Pearson correlation coefficient. Returns None when there isn't
    enough variation or data to compute a meaningful value."""
    n = len(xs)
    if n < 3 or n != len(ys):
        return None
    mean_x = sum(xs) / n
    mean_y = sum(ys) / n
    cov = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys))
    var_x = sum((x - mean_x) ** 2 for x in xs)
    var_y = sum((y - mean_y) ** 2 for y in ys)
    denom = math.sqrt(var_x * var_y)
    if denom == 0:
        return None
    return cov / denom


def describe_correlation(r: float) -> str:
    magnitude = abs(r)
    direction = "together" if r >= 0 else "in opposite directions"
    if magnitude >= 0.7:
        strength = "strongly"
    elif magnitude >= 0.4:
        strength = "moderately"
    elif magnitude >= 0.15:
        strength = "weakly"
    else:
        return "show no real relationship"
    return f"move {strength} {direction}"
