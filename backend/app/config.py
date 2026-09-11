import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = Path(os.environ.get("POLYMARKET_DB_PATH", BASE_DIR / "data" / "polymarket.db"))

GAMMA_API_BASE = os.environ.get("GAMMA_API_BASE", "https://gamma-api.polymarket.com")
CLOB_API_BASE = os.environ.get("CLOB_API_BASE", "https://clob.polymarket.com")

# How often the background poller refreshes watchlisted markets, in seconds.
POLL_INTERVAL_SECONDS = int(os.environ.get("POLL_INTERVAL_SECONDS", "300"))

DB_PATH.parent.mkdir(parents=True, exist_ok=True)
