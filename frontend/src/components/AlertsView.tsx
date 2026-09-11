import { Alert, AppConfig } from "../api";
import { AlertsFeed } from "./AlertsFeed";

export function AlertsView({ alerts, config }: { alerts: Alert[]; config: AppConfig | null }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Swing alerts</h2>
        {config && (
          <span className="muted">
            Fires when a watched market moves ≥ {(config.odds_swing_threshold * 100).toFixed(0)}pp between polls
            (every {Math.round(config.poll_interval_seconds / 60)}m)
          </span>
        )}
      </div>
      <AlertsFeed alerts={alerts} emptyHint="Watch some markets — you'll see one here whenever their odds jump." />
    </div>
  );
}
