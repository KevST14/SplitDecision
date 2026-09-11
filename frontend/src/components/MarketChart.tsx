import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api, WatchlistEntry } from "../api";

const COLORS = ["#4f7cff", "#ff6b6b", "#3ccf9c", "#f5a623"];

export function MarketChart({ entry }: { entry: WatchlistEntry }) {
  const [rows, setRows] = useState<Record<string, number | string>[]>([]);

  useEffect(() => {
    let cancelled = false;
    api.getHistory(entry.condition_id).then((history) => {
      if (cancelled) return;
      setRows(
        history.map((snap) => {
          const row: Record<string, number | string> = {
            time: new Date(snap.ts * 1000).toLocaleString(),
          };
          entry.outcomes.forEach((outcome, i) => {
            row[outcome] = (snap.outcome_prices[i] ?? 0) * 100;
          });
          return row;
        }),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [entry]);

  if (rows.length < 2) {
    return <p className="muted">Not enough history yet — snapshots accumulate as the poller runs.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={rows}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="time" tick={{ fontSize: 10 }} minTickGap={40} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
        <Tooltip />
        {entry.outcomes.map((outcome, i) => (
          <Line key={outcome} type="monotone" dataKey={outcome} stroke={COLORS[i % COLORS.length]} dot={false} strokeWidth={2} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
