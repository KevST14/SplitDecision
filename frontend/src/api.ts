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

export interface Category {
  id: string;
  label: string;
  tag_id: number | null;
}

export interface Alert {
  id: number;
  condition_id: string;
  question: string;
  icon: string | null;
  outcome: string;
  from_price: number;
  to_price: number;
  change: number;
  ts: number;
}

export interface AppConfig {
  odds_swing_threshold: number;
  poll_interval_seconds: number;
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
  topMarkets: (limit = 25, sort: SortOption = "volume24hr", category = "trending") =>
    fetch(`/api/markets/top?limit=${limit}&sort=${sort}&category=${category}`).then((r) => json<Market[]>(r)),

  searchMarkets: (q: string, limit = 30, sort: SortOption = "volume24hr", category = "trending") =>
    fetch(
      `/api/markets/search?q=${encodeURIComponent(q)}&limit=${limit}&sort=${sort}&category=${category}`,
    ).then((r) => json<Market[]>(r)),

  getMovers: (limit = 6) => fetch(`/api/markets/movers?limit=${limit}`).then((r) => json<Market[]>(r)),

  getCategories: () => fetch("/api/categories").then((r) => json<Category[]>(r)),

  getConfig: () => fetch("/api/config").then((r) => json<AppConfig>(r)),

  getWatchlist: () => fetch("/api/watchlist").then((r) => json<WatchlistEntry[]>(r)),

  addToWatchlist: (conditionId: string) =>
    fetch(`/api/watchlist/${encodeURIComponent(conditionId)}`, { method: "POST" }).then((r) => json(r)),

  removeFromWatchlist: (conditionId: string) =>
    fetch(`/api/watchlist/${encodeURIComponent(conditionId)}`, { method: "DELETE" }).then((r) => json(r)),

  getHistory: (conditionId: string) =>
    fetch(`/api/watchlist/${encodeURIComponent(conditionId)}/history`).then((r) => json<Snapshot[]>(r)),

  getAlerts: (limit = 50) => fetch(`/api/alerts?limit=${limit}`).then((r) => json<Alert[]>(r)),
};
