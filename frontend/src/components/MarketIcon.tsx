import { useState } from "react";

export function MarketIcon({ src, alt }: { src: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <div className="market-icon market-icon-fallback">{alt.charAt(0).toUpperCase()}</div>;
  }

  return <img className="market-icon" src={src} alt="" onError={() => setFailed(true)} />;
}
