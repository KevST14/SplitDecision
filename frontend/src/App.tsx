import { useCallback, useEffect, useMemo, useState } from "react";
import { Toaster, toast } from "sonner";
import { ApiError, api, WatchlistEntry } from "./api";
import { MarketList } from "./components/MarketList";
import { Watchlist } from "./components/Watchlist";

export default function App() {
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refreshWatchlist = useCallback(() => {
    api
      .getWatchlist()
      .then((data) => {
        setWatchlist(data);
        setLastUpdated(new Date());
      })
      .catch(() => {
        // Silent on background refresh — the panels already show their own errors.
      });
  }, []);

  useEffect(() => {
    refreshWatchlist();
    const id = setInterval(refreshWatchlist, 30_000);
    return () => clearInterval(id);
  }, [refreshWatchlist]);

  const watchedIds = useMemo(() => new Set(watchlist.map((w) => w.condition_id)), [watchlist]);

  const handleWatch = async (conditionId: string) => {
    try {
      await api.addToWatchlist(conditionId);
      toast.success("Added to watchlist");
      refreshWatchlist();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't add market to watchlist");
    }
  };

  const handleRemove = async (conditionId: string) => {
    try {
      await api.removeFromWatchlist(conditionId);
      toast("Removed from watchlist");
      refreshWatchlist();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't remove market");
    }
  };

  return (
    <div className="app">
      <Toaster theme="dark" richColors position="bottom-right" />
      <header className="app-header">
        <div>
          <h1>Polymarket Monitor</h1>
          <p className="muted">Track odds, volume, and movement on prediction markets you care about.</p>
        </div>
        <div className="header-stats">
          <div className="stat">
            <span className="stat-value">{watchlist.length}</span>
            <span className="stat-label">watched</span>
          </div>
          {lastUpdated && (
            <div className="stat">
              <span className="stat-value">{lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              <span className="stat-label">updated</span>
            </div>
          )}
        </div>
      </header>
      <main className="app-grid">
        <MarketList onWatch={handleWatch} watchedIds={watchedIds} />
        <Watchlist entries={watchlist} onRemove={handleRemove} />
      </main>
    </div>
  );
}
