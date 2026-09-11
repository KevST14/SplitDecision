import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api, WatchlistEntry } from "../api";

const COLORS = ["#5fd97a", "#ff5470", "#ffb454", "#7c9cff"];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-time">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="chart-tooltip-row">
          <span className="chart-tooltip-dot" style={{ background: p.stroke }} />
          {p.dataKey}: <strong>{p.value.toFixed(1)}%</strong>
        </div>
      ))}
    </div>
  );
}

export function MarketChart({ entry }: { entry: WatchlistEntry }) {
  const [rows, setRows] = useState<Record<string, number | string>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getHistory(entry.condition_id)
      .then((history) => {
        if (cancelled) return;
        setRows(
          history.map((snap) => {
            const row: Record<string, number | string> = {
              time: new Date(snap.ts * 1000).toLocaleString([], {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }),
            };
            entry.outcomes.forEach((outcome, i) => {
              row[outcome] = (snap.outcome_prices[i] ?? 0) * 100;
            });
            return row;
          }),
        );
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [entry]);

  if (loading) {
    return <div className="chart-placeholder skeleton" style={{ height: 200 }} />;
  }

  if (rows.length < 2) {
    return (
      <div className="chart-placeholder">
        <p className="muted">Not enough history yet — snapshots accumulate as the poller runs.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={rows} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
        <defs>
          {entry.outcomes.map((outcome, i) => (
            <linearGradient key={outcome} id={`fill-${entry.condition_id}-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.35} />
              <stop offset="100%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="time" tick={{ fontSize: 10, fill: "var(--muted)" }} minTickGap={50} axisLine={false} tickLine={false} />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: "var(--muted)" }}
          unit="%"
          axisLine={false}
          tickLine={false}
          width={36}
        />
        <Tooltip content={<CustomTooltip />} />
        {entry.outcomes.map((outcome, i) => (
          <Area
            key={outcome}
            type="monotone"
            dataKey={outcome}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            fill={`url(#fill-${entry.condition_id}-${i})`}
            dot={false}
            activeDot={{ r: 3 }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
