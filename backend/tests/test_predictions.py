from app.poller import score_resolved_predictions


def make_prediction(id, outcome, your_probability, market_probability=0.5):
    return {
        "id": id,
        "condition_id": "0xabc",
        "outcome": outcome,
        "your_probability": your_probability,
        "market_probability": market_probability,
    }


def test_scores_correct_call_lower_than_wrong_call():
    predictions = [make_prediction(1, "Yes", your_probability=0.9), make_prediction(2, "Yes", your_probability=0.1)]

    results = score_resolved_predictions(["Yes", "No"], [1.0, 0.0], predictions)

    by_id = {r["prediction_id"]: r for r in results}
    assert by_id[1]["actual_outcome"] == 1.0
    assert by_id[1]["your_brier"] < by_id[2]["your_brier"]


def test_market_brier_uses_market_probability_at_prediction_time():
    predictions = [make_prediction(1, "Yes", your_probability=0.8, market_probability=0.6)]

    results = score_resolved_predictions(["Yes", "No"], [1.0, 0.0], predictions)

    assert results[0]["market_brier"] == (0.6 - 1.0) ** 2
    assert results[0]["your_brier"] == (0.8 - 1.0) ** 2


def test_prediction_on_unknown_outcome_is_skipped():
    predictions = [make_prediction(1, "Maybe", your_probability=0.5)]

    results = score_resolved_predictions(["Yes", "No"], [1.0, 0.0], predictions)

    assert results == []


def test_no_resolution_are_returned():
    results = score_resolved_predictions(["Yes", "No"], [1.0, 0.0], [])
    assert results == []
