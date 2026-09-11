import json
import sqlite3
import time
from contextlib import contextmanager

from .config import DB_PATH

SCHEMA = """
CREATE TABLE IF NOT EXISTS watchlist (
    condition_id TEXT PRIMARY KEY,
    slug TEXT,
    question TEXT,
    outcomes TEXT,        -- JSON list, e.g. ["Yes", "No"]
    clob_token_ids TEXT,  -- JSON list, aligned with outcomes
    icon TEXT,
    event_title TEXT,
    added_at REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    condition_id TEXT NOT NULL,
    ts REAL NOT NULL,
    outcome_prices TEXT NOT NULL, -- JSON list, aligned with watchlist.outcomes
    volume REAL,
    liquidity REAL,
    one_day_change REAL,
    FOREIGN KEY (condition_id) REFERENCES watchlist (condition_id)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_condition_ts ON snapshots (condition_id, ts);

CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    condition_id TEXT NOT NULL,
    question TEXT NOT NULL,
    icon TEXT,
    outcome TEXT NOT NULL,
    from_price REAL NOT NULL,
    to_price REAL NOT NULL,
    change REAL NOT NULL,
    ts REAL NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_alerts_ts ON alerts (ts DESC);

CREATE TABLE IF NOT EXISTS predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    condition_id TEXT NOT NULL,
    question TEXT NOT NULL,
    outcome TEXT NOT NULL,
    your_probability REAL NOT NULL,
    market_probability REAL NOT NULL,
    created_at REAL NOT NULL,
    resolved_at REAL,
    actual_outcome REAL,
    your_brier REAL,
    market_brier REAL
);

CREATE INDEX IF NOT EXISTS idx_predictions_condition ON predictions (condition_id);
"""


@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    with get_db() as conn:
        conn.executescript(SCHEMA)


def add_to_watchlist(market: dict) -> None:
    with get_db() as conn:
        conn.execute(
            """
            INSERT INTO watchlist (condition_id, slug, question, outcomes, clob_token_ids, icon, event_title, added_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(condition_id) DO UPDATE SET
                slug=excluded.slug, question=excluded.question,
                outcomes=excluded.outcomes, clob_token_ids=excluded.clob_token_ids,
                icon=excluded.icon, event_title=excluded.event_title
            """,
            (
                market["condition_id"],
                market["slug"],
                market["question"],
                json.dumps(market["outcomes"]),
                json.dumps(market["clob_token_ids"]),
                market.get("icon"),
                market.get("event_title"),
                time.time(),
            ),
        )


def remove_from_watchlist(condition_id: str) -> None:
    with get_db() as conn:
        conn.execute("DELETE FROM watchlist WHERE condition_id = ?", (condition_id,))
        conn.execute("DELETE FROM snapshots WHERE condition_id = ?", (condition_id,))


def list_watchlist() -> list[dict]:
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM watchlist ORDER BY added_at DESC").fetchall()
        return [_row_to_watchlist_dict(r) for r in rows]


def get_watchlist_entry(condition_id: str) -> dict | None:
    with get_db() as conn:
        row = conn.execute("SELECT * FROM watchlist WHERE condition_id = ?", (condition_id,)).fetchone()
        return _row_to_watchlist_dict(row) if row is not None else None


def _row_to_watchlist_dict(row: sqlite3.Row) -> dict:
    return {
        "condition_id": row["condition_id"],
        "slug": row["slug"],
        "question": row["question"],
        "outcomes": json.loads(row["outcomes"]),
        "clob_token_ids": json.loads(row["clob_token_ids"]),
        "icon": row["icon"],
        "event_title": row["event_title"],
        "added_at": row["added_at"],
    }


def record_snapshot(
    condition_id: str,
    outcome_prices: list[float],
    volume: float | None,
    liquidity: float | None,
    one_day_change: float | None = None,
) -> None:
    with get_db() as conn:
        conn.execute(
            "INSERT INTO snapshots (condition_id, ts, outcome_prices, volume, liquidity, one_day_change) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (condition_id, time.time(), json.dumps(outcome_prices), volume, liquidity, one_day_change),
        )


def _row_to_snapshot_dict(row: sqlite3.Row) -> dict:
    return {
        "ts": row["ts"],
        "outcome_prices": json.loads(row["outcome_prices"]),
        "volume": row["volume"],
        "liquidity": row["liquidity"],
        "one_day_change": row["one_day_change"],
    }


def get_history(condition_id: str, since_ts: float | None = None) -> list[dict]:
    with get_db() as conn:
        if since_ts is not None:
            rows = conn.execute(
                "SELECT * FROM snapshots WHERE condition_id = ? AND ts >= ? ORDER BY ts ASC",
                (condition_id, since_ts),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM snapshots WHERE condition_id = ? ORDER BY ts ASC", (condition_id,)
            ).fetchall()
        return [_row_to_snapshot_dict(r) for r in rows]


def get_latest_snapshot(condition_id: str) -> dict | None:
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM snapshots WHERE condition_id = ? ORDER BY ts DESC LIMIT 1", (condition_id,)
        ).fetchone()
        return _row_to_snapshot_dict(row) if row is not None else None


def create_alert(
    condition_id: str,
    question: str,
    icon: str | None,
    outcome: str,
    from_price: float,
    to_price: float,
) -> None:
    with get_db() as conn:
        conn.execute(
            "INSERT INTO alerts (condition_id, question, icon, outcome, from_price, to_price, change, ts) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (condition_id, question, icon, outcome, from_price, to_price, to_price - from_price, time.time()),
        )


def list_alerts(limit: int = 50, since_ts: float | None = None) -> list[dict]:
    with get_db() as conn:
        if since_ts is not None:
            rows = conn.execute(
                "SELECT * FROM alerts WHERE ts >= ? ORDER BY ts DESC LIMIT ?", (since_ts, limit)
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM alerts ORDER BY ts DESC LIMIT ?", (limit,)).fetchall()
        return [
            {
                "id": r["id"],
                "condition_id": r["condition_id"],
                "question": r["question"],
                "icon": r["icon"],
                "outcome": r["outcome"],
                "from_price": r["from_price"],
                "to_price": r["to_price"],
                "change": r["change"],
                "ts": r["ts"],
            }
            for r in rows
        ]


def _row_to_prediction_dict(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "condition_id": row["condition_id"],
        "question": row["question"],
        "outcome": row["outcome"],
        "your_probability": row["your_probability"],
        "market_probability": row["market_probability"],
        "created_at": row["created_at"],
        "resolved_at": row["resolved_at"],
        "actual_outcome": row["actual_outcome"],
        "your_brier": row["your_brier"],
        "market_brier": row["market_brier"],
    }


def create_prediction(
    condition_id: str, question: str, outcome: str, your_probability: float, market_probability: float
) -> dict:
    with get_db() as conn:
        cursor = conn.execute(
            "INSERT INTO predictions (condition_id, question, outcome, your_probability, market_probability, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (condition_id, question, outcome, your_probability, market_probability, time.time()),
        )
        row = conn.execute("SELECT * FROM predictions WHERE id = ?", (cursor.lastrowid,)).fetchone()
        return _row_to_prediction_dict(row)


def list_predictions() -> list[dict]:
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM predictions ORDER BY created_at DESC").fetchall()
        return [_row_to_prediction_dict(r) for r in rows]


def get_open_predictions(condition_id: str) -> list[dict]:
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM predictions WHERE condition_id = ? AND resolved_at IS NULL", (condition_id,)
        ).fetchall()
        return [_row_to_prediction_dict(r) for r in rows]


def resolve_prediction(prediction_id: int, actual_outcome: float, your_brier: float, market_brier: float) -> None:
    with get_db() as conn:
        conn.execute(
            "UPDATE predictions SET resolved_at = ?, actual_outcome = ?, your_brier = ?, market_brier = ? "
            "WHERE id = ?",
            (time.time(), actual_outcome, your_brier, market_brier, prediction_id),
        )
