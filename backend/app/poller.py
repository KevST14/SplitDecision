import logging

from . import polymarket_client, storage
from .config import ODDS_SWING_THRESHOLD
from .stats import brier_score

log = logging.getLogger("poller")


def detect_swings(
    outcomes: list[str],
    previous_prices: list[float],
    new_prices: list[float],
    threshold: float = ODDS_SWING_THRESHOLD,
) -> list[tuple[str, float, float]]:
    """Compare two consecutive snapshots and return (outcome, from, to) for
    every outcome whose price moved by at least `threshold` (e.g. 0.05 = 5pp)."""
    swings = []
    for i, outcome in enumerate(outcomes):
        if i >= len(previous_prices) or i >= len(new_prices):
            continue
        before, after = previous_prices[i], new_prices[i]
        if abs(after - before) >= threshold:
            swings.append((outcome, before, after))
    return swings


def score_resolved_predictions(
    outcomes: list[str], final_outcome_prices: list[float], open_predictions: list[dict]
) -> list[dict]:
    """Once a market closes, its outcome prices settle near 0 or 1 (the
    realized result). Score every still-open prediction against that."""
    results = []
    for pred in open_predictions:
        if pred["outcome"] not in outcomes:
            continue
        idx = outcomes.index(pred["outcome"])
        if idx >= len(final_outcome_prices):
            continue
        actual = round(final_outcome_prices[idx])
        results.append(
            {
                "prediction_id": pred["id"],
                "actual_outcome": float(actual),
                "your_brier": brier_score(pred["your_probability"], actual),
                "market_brier": brier_score(pred["market_probability"], actual),
            }
        )
    return results


def poll_once() -> None:
    watchlist = storage.list_watchlist()
    for entry in watchlist:
        condition_id = entry["condition_id"]
        try:
            market = polymarket_client.get_market_by_condition_id(condition_id)
            if market is None:
                log.warning("market %s no longer found via Gamma API", condition_id)
                continue

            previous = storage.get_latest_snapshot(condition_id)
            if previous is not None:
                for outcome, before, after in detect_swings(
                    entry["outcomes"], previous["outcome_prices"], market["outcome_prices"]
                ):
                    log.info("swing alert: %s (%s) %.1f%% -> %.1f%%", entry["question"], outcome, before * 100, after * 100)
                    storage.create_alert(
                        condition_id=condition_id,
                        question=entry["question"],
                        icon=entry["icon"],
                        outcome=outcome,
                        from_price=before,
                        to_price=after,
                    )

            storage.record_snapshot(
                condition_id=condition_id,
                outcome_prices=market["outcome_prices"],
                volume=market["volume"],
                liquidity=market["liquidity"],
                one_day_change=market["one_day_change"],
            )

            if market["closed"]:
                open_predictions = storage.get_open_predictions(condition_id)
                for result in score_resolved_predictions(entry["outcomes"], market["outcome_prices"], open_predictions):
                    storage.resolve_prediction(**result)
                    log.info("prediction %s resolved: actual=%s", result["prediction_id"], result["actual_outcome"])
        except Exception:
            log.exception("failed to poll market %s", condition_id)


def run_forever(interval_seconds: int) -> None:
    import time

    logging.basicConfig(level=logging.INFO)
    log.info("starting poller, interval=%ss", interval_seconds)
    while True:
        poll_once()
        time.sleep(interval_seconds)
