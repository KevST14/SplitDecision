from app.polymarket_client import _normalize_market

RAW_MARKET = {
    "conditionId": "0xabc",
    "slug": "will-it-happen",
    "question": "Will it happen?",
    "active": True,
    "closed": False,
    "endDate": "2026-12-31T00:00:00Z",
    "volume": "12345.67",
    "volume24hr": "890.12",
    "liquidity": "500.0",
    "outcomes": '["Yes", "No"]',
    "outcomePrices": '["0.6", "0.4"]',
    "clobTokenIds": '["111", "222"]',
    "icon": "https://example.com/icon.png",
    "oneDayPriceChange": 0.03,
    "events": [{"title": "Some Event"}],
}


def test_normalize_market_parses_json_encoded_fields():
    market = _normalize_market(RAW_MARKET)

    assert market["condition_id"] == "0xabc"
    assert market["outcomes"] == ["Yes", "No"]
    assert market["outcome_prices"] == [0.6, 0.4]
    assert market["clob_token_ids"] == ["111", "222"]


def test_normalize_market_coerces_numeric_fields():
    market = _normalize_market(RAW_MARKET)

    assert market["volume"] == 12345.67
    assert market["volume_24hr"] == 890.12
    assert market["liquidity"] == 500.0


def test_normalize_market_extracts_event_and_change():
    market = _normalize_market(RAW_MARKET)

    assert market["event_title"] == "Some Event"
    assert market["one_day_change"] == 0.03
    assert market["icon"] == "https://example.com/icon.png"


def test_normalize_market_handles_missing_optional_fields():
    minimal = {"conditionId": "0xdef", "question": "Q?"}

    market = _normalize_market(minimal)

    assert market["volume"] == 0
    assert market["outcomes"] == []
    assert market["event_title"] is None
    assert market["one_day_change"] is None
