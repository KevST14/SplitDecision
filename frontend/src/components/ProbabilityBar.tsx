const SEGMENT_COLORS = ["#5fd97a", "#ff5470", "#ffb454", "#7c9cff"];

export function ProbabilityBar({ outcomes, prices }: { outcomes: string[]; prices: number[] }) {
  return (
    <div className="prob-bar-wrap">
      <div className="prob-bar">
        {outcomes.map((outcome, i) => {
          const pct = (prices[i] ?? 0) * 100;
          if (pct <= 0) return null;
          return (
            <div
              key={outcome}
              className="prob-bar-segment"
              style={{ width: `${pct}%`, background: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }}
              title={`${outcome}: ${pct.toFixed(1)}%`}
            />
          );
        })}
      </div>
      <div className="prob-bar-labels">
        {outcomes.map((outcome, i) => (
          <span key={outcome} className="prob-bar-label">
            <span
              className="prob-bar-dot"
              style={{ background: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }}
            />
            {outcome} {((prices[i] ?? 0) * 100).toFixed(1)}%
          </span>
        ))}
      </div>
    </div>
  );
}
