import { useEffect, useState } from "react";
import { api, Market, SortOption } from "../api";
import { useDebouncedValue } from "../hooks";
import { CategoryChips } from "./CategoryChips";
import { MarketCard } from "./MarketCard";
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
  const [category, setCategory] = useState("trending");
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const fetcher = debouncedQuery.trim()
      ? api.searchMarkets(debouncedQuery.trim(), 30, sort, category)
      : api.topMarkets(24, sort, category);
    fetcher
      .then((data) => !cancelled && setMarkets(data))
      .catch((err) => !cancelled && setError(err.message ?? "Failed to load markets"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, sort, category]);

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

      <CategoryChips active={category} onChange={setCategory} />

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

      <div className="market-grid stagger-in">
        {loading && <MarketListSkeleton rows={8} />}
        {!loading && !error && markets.length === 0 && (
          <p className="empty-state">No markets match "{query}".</p>
        )}
        {!loading &&
          markets.map((m) => (
            <MarketCard key={m.condition_id} market={m} isWatched={watchedIds.has(m.condition_id)} onWatch={onWatch} />
          ))}
      </div>
    </div>
  );
}
