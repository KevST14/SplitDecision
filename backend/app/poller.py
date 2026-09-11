import logging

from . import polymarket_client, storage

log = logging.getLogger("poller")


def poll_once() -> None:
    watchlist = storage.list_watchlist()
    for entry in watchlist:
        condition_id = entry["condition_id"]
        try:
            market = polymarket_client.get_market_by_condition_id(condition_id)
            if market is None:
                log.warning("market %s no longer found via Gamma API", condition_id)
                continue
            storage.record_snapshot(
                condition_id=condition_id,
                outcome_prices=market["outcome_prices"],
                volume=market["volume"],
                liquidity=market["liquidity"],
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
