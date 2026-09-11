import { useState } from "react";
import { toast } from "sonner";
import { api, Prediction, WatchlistEntry } from "../api";

export function PredictionForm({
  entry,
  prediction,
  onPredicted,
}: {
  entry: WatchlistEntry;
  prediction: Prediction | undefined;
  onPredicted: () => void;
}) {
  const [draft, setDraft] = useState(50);
  const [submitting, setSubmitting] = useState(false);
  const outcome = entry.outcomes[0];

  if (prediction) {
    if (prediction.resolved_at) {
      const won = (prediction.your_brier ?? 1) < (prediction.market_brier ?? 0);
      return (
        <div className="prediction-box prediction-resolved">
          <span className="prediction-label">YOUR CALL: RESOLVED</span>
          <p className="prediction-line">
            You said <strong>{(prediction.your_probability * 100).toFixed(0)}%</strong> · market said{" "}
            {(prediction.market_probability * 100).toFixed(0)}% · actual: {prediction.actual_outcome ? "YES" : "NO"}
          </p>
          <p className={`prediction-verdict ${won ? "change-up" : "change-down"}`}>
            {won ? "▲ you beat the market" : "▼ the market beat you"} (your brier {prediction.your_brier?.toFixed(3)}{" "}
            vs {prediction.market_brier?.toFixed(3)})
          </p>
        </div>
      );
    }
    return (
      <div className="prediction-box">
        <span className="prediction-label">YOUR CALL: PENDING</span>
        <p className="prediction-line">
          You said <strong>{(prediction.your_probability * 100).toFixed(0)}%</strong> on "{prediction.outcome}" ·
          market said {(prediction.market_probability * 100).toFixed(0)}% at the time — waiting for resolution.
        </p>
      </div>
    );
  }

  const submit = async () => {
    setSubmitting(true);
    try {
      await api.addPrediction(entry.condition_id, outcome, draft / 100);
      toast.success(`Call locked in: ${draft}% on "${outcome}"`);
      onPredicted();
    } catch {
      toast.error("Couldn't lock in that call");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="prediction-box">
      <span className="prediction-label">YOUR CALL, BEFORE YOU PEEK AT THE MARKET</span>
      <div className="prediction-input-row">
        <input
          type="range"
          min={1}
          max={99}
          value={draft}
          onChange={(e) => setDraft(Number(e.target.value))}
          className="prediction-slider"
        />
        <span className="prediction-value">{draft}%</span>
        <button onClick={submit} disabled={submitting}>
          Lock in "{outcome}"
        </button>
      </div>
    </div>
  );
}
