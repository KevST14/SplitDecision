import importlib

import pytest


@pytest.fixture
def storage(tmp_path, monkeypatch):
    """Reimport app.storage against an isolated, temp SQLite file per test."""
    monkeypatch.setenv("POLYMARKET_DB_PATH", str(tmp_path / "test.db"))
    from app import config

    importlib.reload(config)
    from app import storage as storage_module

    importlib.reload(storage_module)
    storage_module.init_db()
    return storage_module


SAMPLE_MARKET = {
    "condition_id": "0xabc",
    "slug": "will-it-happen",
    "question": "Will it happen?",
    "outcomes": ["Yes", "No"],
    "outcome_prices": [0.6, 0.4],
    "clob_token_ids": ["111", "222"],
    "icon": "https://example.com/icon.png",
    "event_title": "Some Event",
}


def test_watchlist_round_trip(storage):
    storage.add_to_watchlist(SAMPLE_MARKET)
    entries = storage.list_watchlist()
    assert len(entries) == 1
    assert entries[0]["condition_id"] == "0xabc"
    assert entries[0]["outcomes"] == ["Yes", "No"]
    assert entries[0]["icon"] == "https://example.com/icon.png"


def test_watchlist_upsert_does_not_duplicate(storage):
    storage.add_to_watchlist(SAMPLE_MARKET)
    storage.add_to_watchlist({**SAMPLE_MARKET, "question": "Updated question?"})
    entries = storage.list_watchlist()
    assert len(entries) == 1
    assert entries[0]["question"] == "Updated question?"


def test_remove_from_watchlist_also_clears_snapshots(storage):
    storage.add_to_watchlist(SAMPLE_MARKET)
    storage.record_snapshot("0xabc", [0.6, 0.4], volume=100.0, liquidity=50.0, one_day_change=0.02)
    assert storage.get_latest_snapshot("0xabc") is not None

    storage.remove_from_watchlist("0xabc")

    assert storage.list_watchlist() == []
    assert storage.get_history("0xabc") == []


def test_snapshot_history_orders_oldest_first(storage):
    storage.add_to_watchlist(SAMPLE_MARKET)
    storage.record_snapshot("0xabc", [0.5, 0.5], volume=10.0, liquidity=5.0)
    storage.record_snapshot("0xabc", [0.7, 0.3], volume=20.0, liquidity=6.0)

    history = storage.get_history("0xabc")

    assert len(history) == 2
    assert history[0]["outcome_prices"] == [0.5, 0.5]
    assert history[1]["outcome_prices"] == [0.7, 0.3]


def test_latest_snapshot_is_most_recent(storage):
    storage.add_to_watchlist(SAMPLE_MARKET)
    storage.record_snapshot("0xabc", [0.5, 0.5], volume=10.0, liquidity=5.0)
    storage.record_snapshot("0xabc", [0.9, 0.1], volume=30.0, liquidity=7.0)

    latest = storage.get_latest_snapshot("0xabc")

    assert latest["outcome_prices"] == [0.9, 0.1]
    assert latest["volume"] == 30.0


def test_create_and_list_alerts(storage):
    storage.create_alert("0xabc", "Will it happen?", "icon.png", "Yes", from_price=0.5, to_price=0.62)
    storage.create_alert("0xabc", "Will it happen?", "icon.png", "No", from_price=0.5, to_price=0.38)

    alerts = storage.list_alerts()

    assert len(alerts) == 2
    # Most recent first.
    assert alerts[0]["outcome"] == "No"
    assert alerts[0]["change"] == pytest.approx(-0.12)
    assert alerts[1]["change"] == pytest.approx(0.12)


def test_list_alerts_respects_limit(storage):
    for i in range(5):
        storage.create_alert("0xabc", "Q", None, "Yes", from_price=0.5, to_price=0.5 + i * 0.01)

    assert len(storage.list_alerts(limit=2)) == 2


def test_get_watchlist_entry(storage):
    storage.add_to_watchlist(SAMPLE_MARKET)

    assert storage.get_watchlist_entry("0xabc")["question"] == "Will it happen?"
    assert storage.get_watchlist_entry("0xdoesnotexist") is None


def test_prediction_round_trip_starts_unresolved(storage):
    storage.add_to_watchlist(SAMPLE_MARKET)

    created = storage.create_prediction("0xabc", "Will it happen?", "Yes", your_probability=0.7, market_probability=0.6)

    assert created["resolved_at"] is None
    predictions = storage.list_predictions()
    assert len(predictions) == 1
    assert storage.get_open_predictions("0xabc") == predictions


def test_resolve_prediction(storage):
    storage.add_to_watchlist(SAMPLE_MARKET)
    created = storage.create_prediction("0xabc", "Will it happen?", "Yes", your_probability=0.7, market_probability=0.6)

    storage.resolve_prediction(created["id"], actual_outcome=1.0, your_brier=0.09, market_brier=0.16)

    resolved = storage.list_predictions()[0]
    assert resolved["resolved_at"] is not None
    assert resolved["your_brier"] == pytest.approx(0.09)
    assert storage.get_open_predictions("0xabc") == []
