import { Market } from "../api";
import { ChangeBadge } from "./ChangeBadge";
import { MarketIcon } from "./MarketIcon";
import { ProbabilityBar } from "./ProbabilityBar";

export function MarketCard({
  market,
  isWatched,
  onWatch,
}: {
  market: Market;
  isWatched: boolean;
  onWatch: (conditionId: string) => void;
}) {
  return (
    <div className="market-card">
      <div className="market-card-top">
        <MarketIcon src={market.icon} alt={market.question} />
        <div className="market-card-heading">
          <p className="market-question">{market.question}</p>
          {market.event_title && <span className="event-chip">{market.event_title}</span>}
        </div>
        <ChangeBadge change={market.one_day_change} />
      </div>
      <ProbabilityBar outcomes={market.outcomes} prices={market.outcome_prices} />
      <div className="market-card-footer">
        <span className="muted">
          vol ${Math.round(market.volume).toLocaleString()} · liq ${Math.round(market.liquidity).toLocaleString()}
        </span>
        <button
          className={isWatched ? "watch-btn watch-btn-active" : "watch-btn"}
          disabled={isWatched}
          onClick={() => onWatch(market.condition_id)}
        >
          {isWatched ? "Watching" : "+ Watch"}
        </button>
      </div>
    </div>
  );
}
