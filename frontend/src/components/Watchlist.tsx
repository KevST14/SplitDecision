import { WatchlistEntry } from "../api";
import { MarketChart } from "./MarketChart";

export function Watchlist({
  entries,
  onRemove,
}: {
  entries: WatchlistEntry[];
  onRemove: (conditionId: string) => void;
}) {
  return (
    <div className="panel">
      <h2>Watchlist</h2>
      {entries.length === 0 && <p className="muted">Nothing watched yet — add markets from the browse panel.</p>}
      {entries.map((entry) => (
        <div key={entry.condition_id} className="watchlist-card">
          <div className="watchlist-card-header">
            <span className="market-question">{entry.question}</span>
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
            </div>
          )}
          <MarketChart entry={entry} />
        </div>
      ))}
    </div>
  );
}
