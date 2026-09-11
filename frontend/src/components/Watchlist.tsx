import { Prediction, WatchlistEntry } from "../api";
import { usePriceFlash } from "../hooks";
import { ChangeBadge } from "./ChangeBadge";
import { MarketChart } from "./MarketChart";
import { MarketIcon } from "./MarketIcon";
import { PredictionForm } from "./PredictionForm";
import { ProbabilityBar } from "./ProbabilityBar";

function WatchlistCard({
  entry,
  prediction,
  onRemove,
  onPredicted,
}: {
  entry: WatchlistEntry;
  prediction: Prediction | undefined;
  onRemove: (id: string) => void;
  onPredicted: () => void;
}) {
  const flash = usePriceFlash(entry.latest?.outcome_prices[0] ?? null);

  return (
    <div className={`watchlist-card ${flash ? `flash-${flash}` : ""}`}>
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
        <div className="watchlist-card-prices">
          <ProbabilityBar outcomes={entry.outcomes} prices={entry.latest.outcome_prices} />
          <div className="watchlist-card-change">
            <ChangeBadge change={entry.latest.one_day_change} />
            <span className="muted">24h</span>
          </div>
        </div>
      )}
      <MarketChart entry={entry} />
      <PredictionForm entry={entry} prediction={prediction} onPredicted={onPredicted} />
    </div>
  );
}

export function Watchlist({
  entries,
  predictions,
  onRemove,
  onPredicted,
}: {
  entries: WatchlistEntry[];
  predictions: Prediction[];
  onRemove: (conditionId: string) => void;
  onPredicted: () => void;
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
          <p className="muted">Add markets from the Markets tab to start tracking odds over time.</p>
        </div>
      )}
      {entries.map((entry) => (
        <WatchlistCard
          key={entry.condition_id}
          entry={entry}
          prediction={predictions.find((p) => p.condition_id === entry.condition_id)}
          onRemove={onRemove}
          onPredicted={onPredicted}
        />
      ))}
    </div>
  );
}
