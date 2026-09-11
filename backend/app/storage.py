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
    added_at REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    condition_id TEXT NOT NULL,
    ts REAL NOT NULL,
    outcome_prices TEXT NOT NULL, -- JSON list, aligned with watchlist.outcomes
    volume REAL,
    liquidity REAL,
    FOREIGN KEY (condition_id) REFERENCES watchlist (condition_id)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_condition_ts ON snapshots (condition_id, ts);
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
            INSERT INTO watchlist (condition_id, slug, question, outcomes, clob_token_ids, added_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(condition_id) DO UPDATE SET
                slug=excluded.slug, question=excluded.question,
                outcomes=excluded.outcomes, clob_token_ids=excluded.clob_token_ids
            """,
            (
                market["condition_id"],
                market["slug"],
                market["question"],
                json.dumps(market["outcomes"]),
                json.dumps(market["clob_token_ids"]),
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


def _row_to_watchlist_dict(row: sqlite3.Row) -> dict:
    return {
        "condition_id": row["condition_id"],
        "slug": row["slug"],
        "question": row["question"],
        "outcomes": json.loads(row["outcomes"]),
        "clob_token_ids": json.loads(row["clob_token_ids"]),
        "added_at": row["added_at"],
    }


def record_snapshot(condition_id: str, outcome_prices: list[float], volume: float | None, liquidity: float | None) -> None:
    with get_db() as conn:
        conn.execute(
            "INSERT INTO snapshots (condition_id, ts, outcome_prices, volume, liquidity) VALUES (?, ?, ?, ?, ?)",
            (condition_id, time.time(), json.dumps(outcome_prices), volume, liquidity),
        )


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
        return [
            {
                "ts": r["ts"],
                "outcome_prices": json.loads(r["outcome_prices"]),
                "volume": r["volume"],
                "liquidity": r["liquidity"],
            }
            for r in rows
        ]


def get_latest_snapshot(condition_id: str) -> dict | None:
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM snapshots WHERE condition_id = ? ORDER BY ts DESC LIMIT 1", (condition_id,)
        ).fetchone()
        if row is None:
            return None
        return {
            "ts": row["ts"],
            "outcome_prices": json.loads(row["outcome_prices"]),
            "volume": row["volume"],
            "liquidity": row["liquidity"],
        }
