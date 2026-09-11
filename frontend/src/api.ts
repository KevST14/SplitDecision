export interface Market {
  condition_id: string;
  slug: string;
  question: string;
  active: boolean;
  closed: boolean;
  end_date: string | null;
  volume: number;
  liquidity: number;
  outcomes: string[];
  outcome_prices: number[];
  clob_token_ids: string[];
}

export interface Snapshot {
  ts: number;
  outcome_prices: number[];
  volume: number | null;
  liquidity: number | null;
}

export interface WatchlistEntry {
  condition_id: string;
  slug: string;
  question: string;
  outcomes: string[];
  clob_token_ids: string[];
  added_at: number;
  latest: Snapshot | null;
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  topMarkets: (limit = 25) => fetch(`/api/markets/top?limit=${limit}`).then((r) => json<Market[]>(r)),

  searchMarkets: (q: string, limit = 20) =>
    fetch(`/api/markets/search?q=${encodeURIComponent(q)}&limit=${limit}`).then((r) => json<Market[]>(r)),

  getWatchlist: () => fetch("/api/watchlist").then((r) => json<WatchlistEntry[]>(r)),

  addToWatchlist: (conditionId: string) =>
    fetch(`/api/watchlist/${encodeURIComponent(conditionId)}`, { method: "POST" }).then((r) => json(r)),

  removeFromWatchlist: (conditionId: string) =>
    fetch(`/api/watchlist/${encodeURIComponent(conditionId)}`, { method: "DELETE" }).then((r) => json(r)),

  getHistory: (conditionId: string) =>
    fetch(`/api/watchlist/${encodeURIComponent(conditionId)}/history`).then((r) => json<Snapshot[]>(r)),
};
