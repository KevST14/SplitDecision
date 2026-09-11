# Polymarket Monitor

A monitoring/analytics dashboard for [Polymarket](https://polymarket.com) prediction
markets: search markets, watchlist the ones you care about, and watch a
background poller build up odds/volume history you can chart over time.

No trading logic here — this is read-only tracking against Polymarket's public
Gamma (market metadata) and CLOB (price/order-book) APIs, no API key required.

## Architecture

- `backend/` — Python (FastAPI). Polls watchlisted markets on an interval
  (APScheduler) and stores snapshots (outcome prices, volume, liquidity) in
  SQLite. Exposes a small REST API for the frontend.
- `frontend/` — React + TypeScript (Vite). Search/browse markets, add to a
  watchlist, and view price-history charts (Recharts).

## Setup

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Runs on `http://localhost:8000`. On startup it initializes `backend/data/polymarket.db`
and starts polling any watchlisted markets every `POLL_INTERVAL_SECONDS` (default 300s).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173` and proxies `/api` to the backend.

## How it works

1. Browse or search markets (pulled live from Polymarket's Gamma API, sorted by volume).
2. Click "Watch" on a market — it's saved to the watchlist and an initial snapshot is recorded.
3. The backend's scheduler re-fetches each watchlisted market's current prices/volume
   every poll interval and appends a snapshot row to SQLite.
4. The watchlist panel charts accumulated snapshots per market as history builds up.

## Notes / next steps

- Polymarket's public API surface can change; if `polymarket_client.py` starts
  returning empty results, check https://docs.polymarket.com/ for updated
  endpoint shapes.
- History only exists from the moment a market is watchlisted onward — there's
  no backfill of past odds.
- Natural extensions: alerting on big odds swings, cross-market arbitrage
  detection, exporting snapshots to CSV/Parquet for offline analysis, or
  swapping SQLite for Postgres if the watchlist grows large.
