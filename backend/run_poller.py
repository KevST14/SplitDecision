"""Standalone poller loop, for running data collection without the API server
(e.g. under cron/systemd). The FastAPI server also polls in-process via
APScheduler, so you only need this if you run collection separately."""
from app import storage
from app.config import POLL_INTERVAL_SECONDS
from app.poller import run_forever

if __name__ == "__main__":
    storage.init_db()
    run_forever(POLL_INTERVAL_SECONDS)
