import { useEffect, useState } from "react";
import { api, Market } from "../api";
import { ChangeBadge } from "./ChangeBadge";
import { MarketIcon } from "./MarketIcon";
import { MarketListSkeleton } from "./Skeleton";

export function MoversHero({ onWatch, watchedIds }: { onWatch: (id: string) => void; watchedIds: Set<string> }) {
  const [movers, setMovers] = useState<Market[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.getMovers(6).then((data) => !cancelled && setMovers(data));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="panel movers-panel">
      <div className="panel-header">
        <h2>Biggest movers today</h2>
        <span className="muted">Ranked by 24h odds swing among liquid markets</span>
      </div>
      {movers === null && (
        <div className="movers-grid">
          <MarketListSkeleton rows={6} />
        </div>
      )}
      {movers !== null && movers.length === 0 && <p className="empty-state">No notable moves right now.</p>}
      <div className="movers-grid stagger-in">
        {movers?.map((m) => (
          <div key={m.condition_id} className="mover-card">
            <div className="mover-card-top">
              <MarketIcon src={m.icon} alt={m.question} />
              <ChangeBadge change={m.one_day_change} />
            </div>
            <p className="mover-question">{m.question}</p>
            <div className="market-row-prices">
              {m.outcomes.map((o, i) => (
                <span key={o} className="price-chip">
                  {o}: {((m.outcome_prices[i] ?? 0) * 100).toFixed(1)}%
                </span>
              ))}
            </div>
            <button
              className={watchedIds.has(m.condition_id) ? "watch-btn watch-btn-active" : "watch-btn"}
              disabled={watchedIds.has(m.condition_id)}
              onClick={() => onWatch(m.condition_id)}
            >
              {watchedIds.has(m.condition_id) ? "Watching" : "+ Watch"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
