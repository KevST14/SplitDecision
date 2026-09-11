import { WatchlistEntry } from "../api";
import { ChangeBadge } from "./ChangeBadge";
import { MarketChart } from "./MarketChart";
import { MarketIcon } from "./MarketIcon";

export function Watchlist({
  entries,
  onRemove,
}: {
  entries: WatchlistEntry[];
  onRemove: (conditionId: string) => void;
}) {
  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Watchlist</h2>
        {entries.length > 0 && <span className="muted">{entries.length} tracked</span>}
      </div>
      {entries.length === 0 && (
        <div className="empty-state empty-state-block">
          <p>Nothing watched yet.</p>
          <p className="muted">Add markets from the browse panel to start tracking odds over time.</p>
        </div>
      )}
      {entries.map((entry) => (
        <div key={entry.condition_id} className="watchlist-card">
          <div className="watchlist-card-header">
            <MarketIcon src={entry.icon} alt={entry.question} />
            <div className="watchlist-card-title">
              <span className="market-question">{entry.question}</span>
              {entry.event_title && <span className="event-chip">{entry.event_title}</span>}
            </div>
            <button className="remove-btn" onClick={() => onRemove(entry.condition_id)}>
              Remove
            </button>
          </div>
          {entry.latest && (
            <div className="market-row-prices">
              {entry.outcomes.map((o, i) => (
                <span key={o} className="price-chip">
                  {o}: {((entry.latest!.outcome_prices[i] ?? 0) * 100).toFixed(1)}%
                </span>
              ))}
              <ChangeBadge change={entry.latest.one_day_change} />
              <span className="muted">24h</span>
            </div>
          )}
          <MarketChart entry={entry} />
        </div>
      ))}
    </div>
  );
}
