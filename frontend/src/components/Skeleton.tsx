export function MarketCardSkeleton() {
  return (
    <div className="market-card skeleton-card">
      <div className="market-card-top">
        <div className="skeleton skeleton-avatar" />
        <div className="skeleton-row-body">
          <div className="skeleton skeleton-line" style={{ width: "85%" }} />
          <div className="skeleton skeleton-line" style={{ width: "45%" }} />
        </div>
      </div>
      <div className="skeleton skeleton-line" style={{ width: "100%", height: 20 }} />
    </div>
  );
}

export function MarketListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <MarketCardSkeleton key={i} />
      ))}
    </>
  );
}
