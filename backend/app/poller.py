import logging

from . import polymarket_client, storage
from .config import ODDS_SWING_THRESHOLD

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
        except Exception:
            log.exception("failed to poll market %s", condition_id)


def run_forever(interval_seconds: int) -> None:
    import time

    logging.basicConfig(level=logging.INFO)
    log.info("starting poller, interval=%ss", interval_seconds)
    while True:
        poll_once()
        time.sleep(interval_seconds)
