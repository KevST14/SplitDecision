import { Prediction, PredictionSummary } from "../api";
import { timeAgo } from "../utils";

function ScoreCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="score-card">
      <span className="score-card-value">{value}</span>
      <span className="score-card-label">{label}</span>
      {hint && <span className="score-card-hint muted">{hint}</span>}
    </div>
  );
}

export function CalibrateView({
  predictions,
  summary,
}: {
  predictions: Prediction[];
  summary: PredictionSummary;
}) {
  const verdict =
    summary.your_avg_brier === null
      ? null
      : summary.your_avg_brier < (summary.market_avg_brier ?? 1)
        ? "you're beating the market"
        : "the market's beating you (so far)";

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Calibration scoreboard</h2>
        <span className="muted">Lower Brier score = better. 0 is a perfect call, 1 is a total whiff.</span>
      </div>

      <p className="calibrate-intro">
        Before you see the market's price, lock in your own gut probability from a watchlist card. Once the
        market resolves, this tracks whether your gut or the crowd's money called it better — the whole point of
        calibration practice is finding out where your confidence lies to you.
      </p>

      <div className="score-grid">
        <ScoreCard label="calls made" value={String(summary.total)} />
        <ScoreCard label="resolved" value={String(summary.resolved)} hint={`${summary.pending} pending`} />
        <ScoreCard
          label="your avg brier"
          value={summary.your_avg_brier !== null ? summary.your_avg_brier.toFixed(3) : "—"}
        />
        <ScoreCard
          label="market avg brier"
          value={summary.market_avg_brier !== null ? summary.market_avg_brier.toFixed(3) : "—"}
        />
      </div>

      {verdict && <p className="calibrate-verdict">{`So far, ${verdict} — ${summary.wins}/${summary.resolved} calls beat it.`}</p>}

      {predictions.length === 0 ? (
        <div className="empty-state empty-state-block">
          <p>No calls yet.</p>
          <p className="muted">Watch a market and lock in your gut probability before checking the price.</p>
        </div>
      ) : (
        <ul className="calibrate-list stagger-in">
          {predictions.map((p) => (
            <li key={p.id} className="calibrate-row">
              <div className="calibrate-row-main">
                <span className="market-question">{p.question}</span>
                <span className="muted">
                  called "{p.outcome}" at {(p.your_probability * 100).toFixed(0)}% (market:{" "}
                  {(p.market_probability * 100).toFixed(0)}%) · {timeAgo(p.created_at)}
                </span>
              </div>
              {p.resolved_at ? (
                <span className={`change-badge ${(p.your_brier ?? 1) < (p.market_brier ?? 0) ? "change-up" : "change-down"}`}>
                  {(p.your_brier ?? 1) < (p.market_brier ?? 0) ? "WIN" : "LOSS"}
                </span>
              ) : (
                <span className="change-badge change-neutral">PENDING</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
