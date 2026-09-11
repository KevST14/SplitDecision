import { useEffect, useState } from "react";
import { api, Market, SortOption } from "../api";
import { useDebouncedValue } from "../hooks";
import { ChangeBadge } from "./ChangeBadge";
import { MarketIcon } from "./MarketIcon";
import { MarketListSkeleton } from "./Skeleton";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "volume24hr", label: "Trending (24h volume)" },
  { value: "volume", label: "All-time volume" },
  { value: "endDate", label: "Ending soon" },
];

export function MarketList({
  onWatch,
  watchedIds,
}: {
  onWatch: (conditionId: string) => void;
  watchedIds: Set<string>;
}) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [sort, setSort] = useState<SortOption>("volume24hr");
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const fetcher = debouncedQuery.trim()
      ? api.searchMarkets(debouncedQuery.trim(), 30, sort)
      : api.topMarkets(25, sort);
    fetcher
      .then((data) => !cancelled && setMarkets(data))
      .catch((err) => !cancelled && setError(err.message ?? "Failed to load markets"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, sort]);

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Browse markets</h2>
        <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value as SortOption)}>
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className="search-wrap">
        <span className="search-icon">⌕</span>
        <input
          className="search-input"
          placeholder="Search markets (e.g. election, fed rate)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {error && <p className="error-text">{error}</p>}

      <ul className="market-list">
        {loading && <MarketListSkeleton />}
        {!loading && !error && markets.length === 0 && (
          <li className="empty-state">No markets match "{query}".</li>
        )}
        {!loading &&
          markets.map((m) => {
            const isWatched = watchedIds.has(m.condition_id);
            return (
              <li key={m.condition_id} className="market-row">
                <MarketIcon src={m.icon} alt={m.question} />
                <div className="market-row-body">
                  <div className="market-row-top">
                    <span className="market-question">{m.question}</span>
                    <ChangeBadge change={m.one_day_change} />
                  </div>
                  <div className="market-row-meta">
                    {m.event_title && <span className="event-chip">{m.event_title}</span>}
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
                </div>
                <button
                  className={isWatched ? "watch-btn watch-btn-active" : "watch-btn"}
                  disabled={isWatched}
                  onClick={() => onWatch(m.condition_id)}
                >
                  {isWatched ? "Watching" : "+ Watch"}
                </button>
              </li>
            );
          })}
      </ul>
    </div>
  );
}
