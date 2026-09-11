import { useCallback, useEffect, useState } from "react";
import { api, WatchlistEntry } from "./api";
import { MarketList } from "./components/MarketList";
import { Watchlist } from "./components/Watchlist";

export default function App() {
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);

  const refreshWatchlist = useCallback(() => {
    api.getWatchlist().then(setWatchlist);
  }, []);

  useEffect(() => {
    refreshWatchlist();
    const id = setInterval(refreshWatchlist, 30_000);
    return () => clearInterval(id);
  }, [refreshWatchlist]);

  const handleWatch = async (conditionId: string) => {
    await api.addToWatchlist(conditionId);
    refreshWatchlist();
  };

  const handleRemove = async (conditionId: string) => {
    await api.removeFromWatchlist(conditionId);
    refreshWatchlist();
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Polymarket Monitor</h1>
        <p className="muted">Track odds, volume, and movement on prediction markets you care about.</p>
      </header>
      <main className="app-grid">
        <MarketList onWatch={handleWatch} />
        <Watchlist entries={watchlist} onRemove={handleRemove} />
      </main>
    </div>
  );
}
