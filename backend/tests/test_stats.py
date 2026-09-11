import pytest

from app.stats import brier_score, describe_correlation, pearson_correlation


def test_brier_score_perfect_call():
    assert brier_score(1.0, 1.0) == 0.0
    assert brier_score(0.0, 0.0) == 0.0


def test_brier_score_worst_call():
    assert brier_score(1.0, 0.0) == 1.0
    assert brier_score(0.0, 1.0) == 1.0


def test_brier_score_uncertain_call():
    assert brier_score(0.5, 1.0) == pytest.approx(0.25)


def test_pearson_correlation_perfect_positive():
    assert pearson_correlation([1, 2, 3, 4], [10, 20, 30, 40]) == pytest.approx(1.0)


def test_pearson_correlation_perfect_negative():
    assert pearson_correlation([1, 2, 3, 4], [40, 30, 20, 10]) == pytest.approx(-1.0)


def test_pearson_correlation_needs_at_least_three_points():
    assert pearson_correlation([1, 2], [1, 2]) is None


def test_pearson_correlation_no_variation_returns_none():
    assert pearson_correlation([1, 1, 1], [1, 2, 3]) is None


def test_describe_correlation_labels():
    assert "strongly" in describe_correlation(0.9)
    assert "opposite" in describe_correlation(-0.9)
    assert "no real relationship" in describe_correlation(0.05)
