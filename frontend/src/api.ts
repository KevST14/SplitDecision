export type SortOption = "volume24hr" | "volume" | "endDate";

export interface Market {
  condition_id: string;
  slug: string;
  question: string;
  active: boolean;
  closed: boolean;
  end_date: string | null;
  volume: number;
  volume_24hr: number;
  liquidity: number;
  outcomes: string[];
  outcome_prices: number[];
  clob_token_ids: string[];
  icon: string | null;
  event_title: string | null;
  one_day_change: number | null;
}

export interface Snapshot {
  ts: number;
  outcome_prices: number[];
  volume: number | null;
  liquidity: number | null;
  one_day_change: number | null;
}

export interface WatchlistEntry {
  condition_id: string;
  slug: string;
  question: string;
  outcomes: string[];
  clob_token_ids: string[];
  icon: string | null;
  event_title: string | null;
  added_at: number;
  latest: Snapshot | null;
}

export class ApiError extends Error {}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError((body && body.detail) || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  topMarkets: (limit = 25, sort: SortOption = "volume24hr") =>
    fetch(`/api/markets/top?limit=${limit}&sort=${sort}`).then((r) => json<Market[]>(r)),

  searchMarkets: (q: string, limit = 30, sort: SortOption = "volume24hr") =>
    fetch(`/api/markets/search?q=${encodeURIComponent(q)}&limit=${limit}&sort=${sort}`).then((r) =>
      json<Market[]>(r),
    ),

  getWatchlist: () => fetch("/api/watchlist").then((r) => json<WatchlistEntry[]>(r)),

  addToWatchlist: (conditionId: string) =>
    fetch(`/api/watchlist/${encodeURIComponent(conditionId)}`, { method: "POST" }).then((r) => json(r)),

  removeFromWatchlist: (conditionId: string) =>
    fetch(`/api/watchlist/${encodeURIComponent(conditionId)}`, { method: "DELETE" }).then((r) => json(r)),

  getHistory: (conditionId: string) =>
    fetch(`/api/watchlist/${encodeURIComponent(conditionId)}/history`).then((r) => json<Snapshot[]>(r)),
};
