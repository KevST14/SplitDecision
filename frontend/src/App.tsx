import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Toaster, toast } from "sonner";
import { Alert, ApiError, AppConfig, api, Prediction, PredictionSummary, WatchlistEntry } from "./api";
import { AboutView } from "./components/AboutView";
import { AlertBell } from "./components/AlertBell";
import { AlertsView } from "./components/AlertsView";
import { CalibrateView } from "./components/CalibrateView";
import { CorrelateView } from "./components/CorrelateView";
import { MarketList } from "./components/MarketList";
import { MatrixRain } from "./components/MatrixRain";
import { NavTabs } from "./components/NavTabs";
import { OverviewView } from "./components/OverviewView";
import { Watchlist } from "./components/Watchlist";
import { useCountUp, useHashTab } from "./hooks";

const LAST_SEEN_ALERT_KEY = "split-decision:last-seen-alert-id";

const EMPTY_SUMMARY: PredictionSummary = {
  total: 0,
  resolved: 0,
  pending: 0,
  your_avg_brier: null,
  market_avg_brier: null,
  wins: 0,
};

export default function App() {
  const [tab, setTab] = useHashTab();
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [predictionSummary, setPredictionSummary] = useState<PredictionSummary>(EMPTY_SUMMARY);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [lastSeenAlertId, setLastSeenAlertId] = useState<number>(() => {
    const stored = Number(localStorage.getItem(LAST_SEEN_ALERT_KEY));
    return Number.isFinite(stored) ? stored : 0;
  });
  const knownAlertIds = useRef<Set<number> | null>(null);

  const refreshWatchlist = useCallback(() => {
    api
      .getWatchlist()
      .then((data) => {
        setWatchlist(data);
        setLastUpdated(new Date());
      })
      .catch(() => {
        // Silent on background refresh — the panels already show their own errors.
      });
  }, []);

  const refreshPredictions = useCallback(() => {
    api
      .getPredictions()
      .then(({ predictions, summary }) => {
        setPredictions(predictions);
        setPredictionSummary(summary);
      })
      .catch(() => {});
  }, []);

  const refreshAlerts = useCallback(() => {
    api
      .getAlerts(50)
      .then((data) => {
        setAlerts(data);
        if (knownAlertIds.current === null) {
          // First load: don't toast for alerts that already existed before the app opened.
          knownAlertIds.current = new Set(data.map((a) => a.id));
          return;
        }
        const fresh = data.filter((a) => !knownAlertIds.current!.has(a.id));
        fresh.forEach((a) => knownAlertIds.current!.add(a.id));
        fresh.slice(0, 3).forEach((a) => {
          const up = a.change > 0;
          const toastFn = up ? toast.success : toast.error;
          toastFn(`${up ? "▲" : "▼"} ${a.question}`, {
            description: `${a.outcome} ${(a.from_price * 100).toFixed(0)}% → ${(a.to_price * 100).toFixed(0)}%`,
          });
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    api.getConfig().then(setConfig).catch(() => {});
    refreshWatchlist();
    refreshAlerts();
    refreshPredictions();
    const watchlistId = setInterval(refreshWatchlist, 30_000);
    const alertsId = setInterval(refreshAlerts, 20_000);
    const predictionsId = setInterval(refreshPredictions, 30_000);
    return () => {
      clearInterval(watchlistId);
      clearInterval(alertsId);
      clearInterval(predictionsId);
    };
  }, [refreshWatchlist, refreshAlerts, refreshPredictions]);

  const watchedIds = useMemo(() => new Set(watchlist.map((w) => w.condition_id)), [watchlist]);
  const unreadAlertCount = useMemo(() => alerts.filter((a) => a.id > lastSeenAlertId).length, [alerts, lastSeenAlertId]);
  const animatedWatchedCount = useCountUp(watchlist.length);

  const markAlertsSeen = useCallback(() => {
    setLastSeenAlertId((prev) => {
      const maxId = alerts.reduce((max, a) => Math.max(max, a.id), prev);
      localStorage.setItem(LAST_SEEN_ALERT_KEY, String(maxId));
      return maxId;
    });
  }, [alerts]);

  // Mark alerts as seen whenever the Alerts tab becomes active, however we got there.
  useEffect(() => {
    if (tab === "alerts") markAlertsSeen();
  }, [tab, markAlertsSeen]);

  const handleWatch = async (conditionId: string) => {
    try {
      await api.addToWatchlist(conditionId);
      toast.success("Added to watchlist");
      refreshWatchlist();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't add market to watchlist");
    }
  };

  const handleRemove = async (conditionId: string) => {
    try {
      await api.removeFromWatchlist(conditionId);
      toast("Removed from watchlist");
      refreshWatchlist();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't remove market");
    }
  };

  return (
    <>
      <MatrixRain />
      <div className="app">
        <Toaster theme="dark" richColors position="bottom-right" />
        <header className="app-header">
          <div>
            <h1>
              Split<span className="header-accent">Decision</span>
            </h1>
            <p className="muted">
              A student's odds-watching, calibration-testing side project built on top of Polymarket's public data.
            </p>
          </div>
          <div className="header-right">
            <div className="header-stats">
              <div className="stat">
                <span className="stat-value">{Math.round(animatedWatchedCount)}</span>
                <span className="stat-label">watched</span>
              </div>
              {lastUpdated && (
                <div className="stat">
                  <span className="stat-value">
                    {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="stat-label">updated</span>
                </div>
              )}
            </div>
            <AlertBell unreadCount={unreadAlertCount} onClick={() => setTab("alerts")} />
          </div>
        </header>

        <NavTabs active={tab} onChange={setTab} />

        <main className="app-main">
          <div key={tab} className="tab-transition">
            {tab === "overview" && (
              <OverviewView
                watchlist={watchlist}
                alerts={alerts}
                watchedIds={watchedIds}
                onWatch={handleWatch}
                onNavigate={setTab}
              />
            )}
            {tab === "markets" && <MarketList onWatch={handleWatch} watchedIds={watchedIds} />}
            {tab === "watchlist" && (
              <Watchlist entries={watchlist} predictions={predictions} onRemove={handleRemove} onPredicted={refreshPredictions} />
            )}
            {tab === "calibrate" && <CalibrateView predictions={predictions} summary={predictionSummary} />}
            {tab === "correlate" && <CorrelateView entries={watchlist} />}
            {tab === "alerts" && <AlertsView alerts={alerts} config={config} />}
            {tab === "about" && <AboutView />}
          </div>
        </main>
      </div>
    </>
  );
}
