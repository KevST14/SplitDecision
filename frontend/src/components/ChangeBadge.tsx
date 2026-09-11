export function ChangeBadge({ change }: { change: number | null | undefined }) {
  if (change === null || change === undefined) {
    return <span className="change-badge change-neutral">—</span>;
  }
  const pct = change * 100;
  const isFlat = Math.abs(pct) < 0.05;
  const direction = isFlat ? "neutral" : pct > 0 ? "up" : "down";
  const arrow = isFlat ? "" : pct > 0 ? "▲" : "▼";

  return (
    <span className={`change-badge change-${direction}`}>
      {arrow} {Math.abs(pct).toFixed(1)}%
    </span>
  );
}
