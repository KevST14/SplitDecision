import logging
from contextlib import asynccontextmanager

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from . import polymarket_client, storage
from .categories import CATEGORIES, tag_id_for
from .config import FRONTEND_ORIGIN, ODDS_SWING_THRESHOLD, POLL_INTERVAL_SECONDS
from .poller import poll_once
from .polymarket_client import PolymarketAPIError

log = logging.getLogger("api")

scheduler = BackgroundScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    storage.init_db()
    scheduler.add_job(poll_once, "interval", seconds=POLL_INTERVAL_SECONDS, id="poll_watchlist")
    scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(title="Polymarket Monitor", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(PolymarketAPIError)
def handle_polymarket_error(request: Request, exc: PolymarketAPIError):
    log.warning("polymarket API error on %s: %s", request.url.path, exc)
    return JSONResponse(status_code=502, content={"detail": "Polymarket API is unreachable right now."})


@app.get("/api/config")
def get_config():
    return {"odds_swing_threshold": ODDS_SWING_THRESHOLD, "poll_interval_seconds": POLL_INTERVAL_SECONDS}


@app.get("/api/categories")
def get_categories():
    return CATEGORIES


@app.get("/api/markets/top")
def top_markets(limit: int = 25, sort: str = "volume24hr", category: str = "trending"):
    try:
        tag_id = tag_id_for(category)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Unknown category '{category}'")
    return polymarket_client.get_top_markets(limit=limit, sort=sort, tag_id=tag_id)


@app.get("/api/markets/search")
def search_markets(q: str = "", limit: int = 20, sort: str = "volume24hr", category: str = "trending"):
    try:
        tag_id = tag_id_for(category)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Unknown category '{category}'")
    return polymarket_client.search_markets(q, limit=limit, sort=sort, tag_id=tag_id)


@app.get("/api/markets/movers")
def movers(limit: int = 6):
    return polymarket_client.get_movers(limit=limit)


@app.get("/api/watchlist")
def get_watchlist():
    entries = storage.list_watchlist()
    for entry in entries:
        entry["latest"] = storage.get_latest_snapshot(entry["condition_id"])
    return entries


@app.post("/api/watchlist/{condition_id}")
def add_watchlist(condition_id: str):
    market = polymarket_client.get_market_by_condition_id(condition_id)
    if market is None:
        raise HTTPException(status_code=404, detail="Market not found")
    storage.add_to_watchlist(market)
    storage.record_snapshot(
        condition_id=market["condition_id"],
        outcome_prices=market["outcome_prices"],
        volume=market["volume"],
        liquidity=market["liquidity"],
        one_day_change=market["one_day_change"],
    )
    return {"status": "ok"}


@app.delete("/api/watchlist/{condition_id}")
def delete_watchlist(condition_id: str):
    storage.remove_from_watchlist(condition_id)
    return {"status": "ok"}


@app.get("/api/watchlist/{condition_id}/history")
def watchlist_history(condition_id: str, since_ts: float | None = None):
    return storage.get_history(condition_id, since_ts=since_ts)


@app.get("/api/alerts")
def get_alerts(limit: int = 50, since_ts: float | None = None):
    return storage.list_alerts(limit=limit, since_ts=since_ts)


@app.get("/api/health")
def health():
    return {"status": "ok"}
