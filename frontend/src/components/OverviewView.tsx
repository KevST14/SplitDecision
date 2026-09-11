import { Alert, WatchlistEntry } from "../api";
import { TabId } from "../hooks";
import { AlertsFeed } from "./AlertsFeed";
import { MoversHero } from "./MoversHero";

export function OverviewView({
  watchlist,
  alerts,
  watchedIds,
  onWatch,
  onNavigate,
}: {
  watchlist: WatchlistEntry[];
  alerts: Alert[];
  watchedIds: Set<string>;
  onWatch: (id: string) => void;
  onNavigate: (tab: TabId) => void;
}) {
  return (
    <div className="overview-grid">
      <MoversHero onWatch={onWatch} watchedIds={watchedIds} />

      <div className="panel">
        <div className="panel-header">
          <h2>Recent alerts</h2>
          {alerts.length > 0 && (
            <button className="link-btn" onClick={() => onNavigate("alerts")}>
              View all →
            </button>
          )}
        </div>
        <AlertsFeed alerts={alerts.slice(0, 4)} />
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Your watchlist</h2>
          {watchlist.length > 0 && (
            <button className="link-btn" onClick={() => onNavigate("watchlist")}>
              View all →
            </button>
          )}
        </div>
        {watchlist.length === 0 ? (
          <div className="empty-state empty-state-block">
            <p>Nothing watched yet.</p>
            <p className="muted">Watch a mover above, or head to Markets to browse.</p>
            <button onClick={() => onNavigate("markets")}>Browse markets</button>
          </div>
        ) : (
          <ul className="watchlist-preview">
            {watchlist.slice(0, 5).map((w) => (
              <li key={w.condition_id} className="watchlist-preview-row">
                <span className="market-question">{w.question}</span>
                {w.latest && (
                  <span className="market-row-prices">
                    {w.outcomes.map((o, i) => (
                      <span key={o} className="price-chip">
                        {o}: {((w.latest!.outcome_prices[i] ?? 0) * 100).toFixed(1)}%
                      </span>
                    ))}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
