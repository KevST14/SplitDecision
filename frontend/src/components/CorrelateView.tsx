import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api, CorrelationResult, WatchlistEntry } from "../api";

export function CorrelateView({ entries }: { entries: WatchlistEntry[] }) {
  const [idA, setIdA] = useState<string>("");
  const [idB, setIdB] = useState<string>("");
  const [result, setResult] = useState<CorrelationResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (entries.length >= 1 && !idA) setIdA(entries[0].condition_id);
    if (entries.length >= 2 && !idB) setIdB(entries[1].condition_id);
  }, [entries, idA, idB]);

  useEffect(() => {
    if (!idA || !idB || idA === idB) {
      setResult(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api
      .getCorrelation(idA, idB)
      .then((r) => !cancelled && setResult(r))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [idA, idB]);

  const marketA = entries.find((e) => e.condition_id === idA);
  const marketB = entries.find((e) => e.condition_id === idB);

  const rows =
    result?.points.map((p) => ({
      time: new Date(p.ts * 1000).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      A: p.a !== null ? p.a * 100 : null,
      B: p.b !== null ? p.b * 100 : null,
    })) ?? [];

  if (entries.length < 2) {
    return (
      <div className="panel">
        <div className="panel-header">
          <h2>Correlation explorer</h2>
        </div>
        <div className="empty-state empty-state-block">
          <p>Watch at least 2 markets to compare them.</p>
          <p className="muted">
            Do Fed-rate odds move with Bitcoin odds? Does one election market track another? Watch a couple of
            related markets and find out.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Correlation explorer</h2>
        <span className="muted">Do these two markets move together?</span>
      </div>

      <div className="correlate-pickers">
        <select className="sort-select" value={idA} onChange={(e) => setIdA(e.target.value)}>
          {entries.map((e) => (
            <option key={e.condition_id} value={e.condition_id}>
              {e.question}
            </option>
          ))}
        </select>
        <span className="muted">vs</span>
        <select className="sort-select" value={idB} onChange={(e) => setIdB(e.target.value)}>
          {entries.map((e) => (
            <option key={e.condition_id} value={e.condition_id}>
              {e.question}
            </option>
          ))}
        </select>
      </div>

      {idA === idB && <p className="error-text">Pick two different markets.</p>}

      {loading && <div className="chart-placeholder skeleton" style={{ height: 220 }} />}

      {!loading && result && idA !== idB && (
        <>
          {rows.length < 3 ? (
            <p className="empty-state">Not enough overlapping history yet — keep polling and check back.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={rows} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: "var(--muted)" }} minTickGap={50} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--muted)" }} unit="%" axisLine={false} tickLine={false} width={36} />
                  <Tooltip contentStyle={{ background: "var(--panel)", border: "1px solid var(--border)" }} />
                  <Line type="monotone" dataKey="A" name={marketA?.question ?? "A"} stroke="#5fd97a" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="B" name={marketB?.question ?? "B"} stroke="#ff9f43" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
              <p className="correlate-result">
                r = <strong>{result.correlation?.toFixed(2)}</strong> — these two{" "}
                <strong>{result.description}</strong>.
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}
