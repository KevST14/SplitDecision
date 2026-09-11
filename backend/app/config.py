import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = Path(os.environ.get("POLYMARKET_DB_PATH", BASE_DIR / "data" / "polymarket.db"))

GAMMA_API_BASE = os.environ.get("GAMMA_API_BASE", "https://gamma-api.polymarket.com")
CLOB_API_BASE = os.environ.get("CLOB_API_BASE", "https://clob.polymarket.com")

# How often the background poller refreshes watchlisted markets, in seconds.
POLL_INTERVAL_SECONDS = int(os.environ.get("POLL_INTERVAL_SECONDS", "300"))

# Minimum absolute change (as a fraction, e.g. 0.05 = 5 percentage points) in
# an outcome's price between two consecutive polls to fire a swing alert.
ODDS_SWING_THRESHOLD = float(os.environ.get("ODDS_SWING_THRESHOLD", "0.05"))

# Origin allowed to call the API (the Vite dev server, or a deployed frontend).
FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")

DB_PATH.parent.mkdir(parents=True, exist_ok=True)
