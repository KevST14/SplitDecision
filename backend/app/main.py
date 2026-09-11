import logging
from contextlib import asynccontextmanager

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from . import polymarket_client, storage
from .categories import CATEGORIES, tag_id_for
from .config import FRONTEND_ORIGIN, ODDS_SWING_THRESHOLD, POLL_INTERVAL_SECONDS
from .poller import poll_once
from .polymarket_client import PolymarketAPIError
from .stats import describe_correlation, pearson_correlation

log = logging.getLogger("api")

scheduler = BackgroundScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    storage.init_db()
    scheduler.add_job(poll_once, "interval", seconds=POLL_INTERVAL_SECONDS, id="poll_watchlist")
    scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(title="Split Decision", lifespan=lifespan)

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


class PredictionRequest(BaseModel):
    condition_id: str
    outcome: str
    your_probability: float


@app.post("/api/predictions")
def add_prediction(body: PredictionRequest):
    entry = storage.get_watchlist_entry(body.condition_id)
    if entry is None:
        raise HTTPException(status_code=400, detail="Watch this market before logging a call on it.")
    if body.outcome not in entry["outcomes"]:
        raise HTTPException(status_code=400, detail=f"'{body.outcome}' isn't an outcome of this market.")
    if not 0 <= body.your_probability <= 1:
        raise HTTPException(status_code=400, detail="your_probability must be between 0 and 1.")

    latest = storage.get_latest_snapshot(body.condition_id)
    idx = entry["outcomes"].index(body.outcome)
    market_probability = latest["outcome_prices"][idx] if latest else 0.5

    return storage.create_prediction(
        condition_id=body.condition_id,
        question=entry["question"],
        outcome=body.outcome,
        your_probability=body.your_probability,
        market_probability=market_probability,
    )


@app.get("/api/predictions")
def get_predictions():
    predictions = storage.list_predictions()
    resolved = [p for p in predictions if p["resolved_at"] is not None]
    summary = {
        "total": len(predictions),
        "resolved": len(resolved),
        "pending": len(predictions) - len(resolved),
        "your_avg_brier": sum(p["your_brier"] for p in resolved) / len(resolved) if resolved else None,
        "market_avg_brier": sum(p["market_brier"] for p in resolved) / len(resolved) if resolved else None,
        "wins": sum(1 for p in resolved if p["your_brier"] < p["market_brier"]),
    }
    return {"predictions": predictions, "summary": summary}


@app.get("/api/correlate")
def correlate(a: str, b: str):
    history_a = storage.get_history(a)
    history_b = storage.get_history(b)
    if len(history_a) < 3 or len(history_b) < 3:
        return {"points": [], "correlation": None, "description": None}

    # Pair up snapshots that landed within half a poll interval of each other.
    tolerance = POLL_INTERVAL_SECONDS / 2
    points = []
    j = 0
    for snap_a in history_a:
        while j + 1 < len(history_b) and abs(history_b[j + 1]["ts"] - snap_a["ts"]) <= abs(history_b[j]["ts"] - snap_a["ts"]):
            j += 1
        if abs(history_b[j]["ts"] - snap_a["ts"]) <= tolerance:
            points.append(
                {
                    "ts": snap_a["ts"],
                    "a": snap_a["outcome_prices"][0] if snap_a["outcome_prices"] else None,
                    "b": history_b[j]["outcome_prices"][0] if history_b[j]["outcome_prices"] else None,
                }
            )

    xs = [p["a"] for p in points if p["a"] is not None and p["b"] is not None]
    ys = [p["b"] for p in points if p["a"] is not None and p["b"] is not None]
    r = pearson_correlation(xs, ys)
    return {"points": points, "correlation": r, "description": describe_correlation(r) if r is not None else None}


@app.get("/api/health")
def health():
    return {"status": "ok"}
