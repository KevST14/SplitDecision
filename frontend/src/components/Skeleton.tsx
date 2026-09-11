export function MarketRowSkeleton() {
  return (
    <div className="market-row skeleton-row">
      <div className="skeleton skeleton-avatar" />
      <div className="skeleton-row-body">
        <div className="skeleton skeleton-line" style={{ width: "80%" }} />
        <div className="skeleton skeleton-line" style={{ width: "40%" }} />
      </div>
    </div>
  );
}

export function MarketListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <MarketRowSkeleton key={i} />
      ))}
    </>
  );
}
