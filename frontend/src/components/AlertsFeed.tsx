import { Alert } from "../api";
import { timeAgo } from "../utils";
import { MarketIcon } from "./MarketIcon";

export function AlertsFeed({ alerts, emptyHint }: { alerts: Alert[]; emptyHint?: string }) {
  if (alerts.length === 0) {
    return (
      <div className="empty-state empty-state-block">
        <p>No swing alerts yet.</p>
        <p className="muted">{emptyHint ?? "You'll see one here whenever a watched market's odds jump."}</p>
      </div>
    );
  }

  return (
    <ul className="alerts-feed stagger-in">
      {alerts.map((a) => {
        const up = a.change > 0;
        return (
          <li key={a.id} className={`alert-card ${up ? "alert-card-up" : "alert-card-down"}`}>
            <MarketIcon src={a.icon} alt={a.question} />
            <div className="alert-card-body">
              <p className="market-question">{a.question}</p>
              <p className="alert-card-detail">
                <strong>{a.outcome}</strong> moved{" "}
                <span className={up ? "change-up" : "change-down"}>
                  {up ? "▲" : "▼"} {(Math.abs(a.change) * 100).toFixed(1)}pp
                </span>{" "}
                ({(a.from_price * 100).toFixed(1)}% → {(a.to_price * 100).toFixed(1)}%)
              </p>
            </div>
            <span className="muted alert-card-time">{timeAgo(a.ts)}</span>
          </li>
        );
      })}
    </ul>
  );
}
