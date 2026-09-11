"""Thin client around Polymarket's public Gamma and CLOB APIs.

Both APIs are public/read-only and need no auth key for the endpoints used
here. Gamma serves market metadata (question, outcomes, volume, CLOB token
ids); CLOB serves live order-book/price data keyed by those token ids.

Docs: https://docs.polymarket.com/
"""
import json
from typing import Any

import httpx

from .config import CLOB_API_BASE, GAMMA_API_BASE

_client = httpx.Client(timeout=15.0)


class PolymarketAPIError(RuntimeError):
    """Raised when Polymarket's Gamma/CLOB APIs are unreachable or error out."""


def _get(url: str, params: dict) -> httpx.Response:
    try:
        resp = _client.get(url, params=params)
        resp.raise_for_status()
        return resp
    except httpx.HTTPError as exc:
        raise PolymarketAPIError(f"request to {url} failed: {exc}") from exc


def _parse_json_field(value: Any) -> Any:
    """Gamma returns some list fields (outcomes, outcomePrices, clobTokenIds)
    as JSON-encoded strings rather than native arrays."""
    if isinstance(value, str):
        try:
            return json.loads(value)
        except (json.JSONDecodeError, TypeError):
            return value
    return value


def _normalize_market(raw: dict) -> dict:
    outcomes = _parse_json_field(raw.get("outcomes")) or []
    outcome_prices = _parse_json_field(raw.get("outcomePrices")) or []
    clob_token_ids = _parse_json_field(raw.get("clobTokenIds")) or []
    events = raw.get("events") or []

    return {
        "condition_id": raw.get("conditionId"),
        "slug": raw.get("slug"),
        "question": raw.get("question"),
        "active": raw.get("active"),
        "closed": raw.get("closed"),
        "end_date": raw.get("endDate"),
        "volume": float(raw.get("volume") or 0),
        "volume_24hr": float(raw.get("volume24hr") or 0),
        "liquidity": float(raw.get("liquidity") or 0),
        "outcomes": outcomes,
        "outcome_prices": [float(p) for p in outcome_prices] if outcome_prices else [],
        "clob_token_ids": clob_token_ids,
        "icon": raw.get("icon") or raw.get("image"),
        "event_title": events[0]["title"] if events else None,
        "one_day_change": raw.get("oneDayPriceChange"),
    }


_SORT_ASCENDING = {"endDate"}


def _market_params(limit: int, sort: str, tag_id: int | None) -> dict:
    params = {
        "active": "true",
        "closed": "false",
        "limit": limit,
        "order": sort,
        "ascending": str(sort in _SORT_ASCENDING).lower(),
    }
    if tag_id is not None:
        params["tag_id"] = tag_id
    return params


def search_markets(query: str, limit: int = 20, sort: str = "volume24hr", tag_id: int | None = None) -> list[dict]:
    """Search active markets by keyword (matched against the question text)."""
    resp = _get(f"{GAMMA_API_BASE}/markets", params=_market_params(200, sort, tag_id))
    markets = [_normalize_market(m) for m in resp.json()]
    if query:
        needle = query.lower()
        markets = [m for m in markets if needle in (m["question"] or "").lower()]
    return markets[:limit]


def get_top_markets(limit: int = 25, sort: str = "volume24hr", tag_id: int | None = None) -> list[dict]:
    resp = _get(f"{GAMMA_API_BASE}/markets", params=_market_params(limit, sort, tag_id))
    return [_normalize_market(m) for m in resp.json()]


def get_movers(limit: int = 6, min_volume_24hr: float = 20_000) -> list[dict]:
    """The biggest 24h odds swings among markets that actually have volume.

    Sorting the whole catalog by oneDayPriceChange surfaces illiquid,
    near-zero-volume markets whose "swings" are just noise. Instead, take a
    pool of currently-active markets and rank by absolute change within it.
    """
    resp = _get(f"{GAMMA_API_BASE}/markets", params=_market_params(100, "volume24hr", None))
    markets = [_normalize_market(m) for m in resp.json()]
    liquid = [m for m in markets if m["volume_24hr"] >= min_volume_24hr and m["one_day_change"] is not None]
    liquid.sort(key=lambda m: abs(m["one_day_change"]), reverse=True)
    return liquid[:limit]


def get_market_by_slug(slug: str) -> dict | None:
    resp = _get(f"{GAMMA_API_BASE}/markets", params={"slug": slug})
    data = resp.json()
    if not data:
        return None
    return _normalize_market(data[0])


def get_market_by_condition_id(condition_id: str) -> dict | None:
    resp = _get(f"{GAMMA_API_BASE}/markets", params={"condition_ids": condition_id})
    data = resp.json()
    if not data:
        return None
    return _normalize_market(data[0])


def get_midpoint(token_id: str) -> float | None:
    try:
        resp = _get(f"{CLOB_API_BASE}/midpoint", params={"token_id": token_id})
    except PolymarketAPIError:
        return None
    mid = resp.json().get("mid")
    return float(mid) if mid is not None else None


def get_price_history(token_id: str, interval: str = "1d", fidelity: int = 60) -> list[dict]:
    """Returns [{"t": unix_ts, "p": price}, ...] for a given CLOB token id.

    interval: one of "1h", "6h", "1d", "1w", "1m", "max" (per CLOB API).
    fidelity: resolution in minutes.
    """
    resp = _get(
        f"{CLOB_API_BASE}/prices-history",
        params={"market": token_id, "interval": interval, "fidelity": fidelity},
    )
    return resp.json().get("history", [])
