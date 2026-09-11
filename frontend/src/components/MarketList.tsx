import { useEffect, useState } from "react";
import { api, Market } from "../api";

export function MarketList({ onWatch }: { onWatch: (conditionId: string) => void }) {
  const [query, setQuery] = useState("");
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const fetcher = query.trim() ? api.searchMarkets(query.trim()) : api.topMarkets();
    fetcher.then(setMarkets).finally(() => setLoading(false));
  }, [query]);

  return (
    <div className="panel">
      <h2>Browse markets</h2>
      <input
        className="search-input"
        placeholder="Search markets (e.g. election, fed rate)..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {loading && <p className="muted">Loading...</p>}
      <ul className="market-list">
        {markets.map((m) => (
          <li key={m.condition_id} className="market-row">
            <div className="market-row-main">
              <span className="market-question">{m.question}</span>
              <span className="muted">
                vol ${Math.round(m.volume).toLocaleString()} · liq ${Math.round(m.liquidity).toLocaleString()}
              </span>
            </div>
            <div className="market-row-prices">
              {m.outcomes.map((o, i) => (
                <span key={o} className="price-chip">
                  {o}: {((m.outcome_prices[i] ?? 0) * 100).toFixed(1)}%
                </span>
              ))}
            </div>
            <button onClick={() => onWatch(m.condition_id)}>+ Watch</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
