import { ExplainerSection } from "./ExplainerSection";

export function AboutView() {
  return (
    <div className="about-grid">
      <div className="panel about-panel about-panel-personal">
        <p className="terminal-prompt">$ whoami</p>
        <h2 className="about-heading">why I built this</h2>
        <p>
          What got me into prediction markets wasn't the trading — it was the range. On the same site, at the
          same time, you can find people putting real money on whether a tweet count crosses a threshold nobody
          will remember in a week, right next to a market pricing in whether the Fed moves interest rates, which
          will actually move a lot of other people's money. Same mechanism, wildly different stakes. That gap is
          what made me want to actually open the hood on how this stuff works, rather than just scrolling past it.
        </p>
        <p>
          The other half of it is more personal: I wanted to know if I'm actually any good at estimating
          probabilities, or if I just <em>feel</em> confident. Markets are a decent scoreboard for that — they're
          forced to put a number on "how likely," and so am I now, every time I lock in a call before I look at
          the price. <span className="terminal-cursor" /> That's the whole reason the calibration tracker exists.
        </p>
        <p className="about-signoff muted">— built while procrastinating on other coursework.</p>
      </div>

      <ExplainerSection
        prompt="$ man polymarket"
        title="how polymarket actually works"
        simple={
          <>
            <p>
              Polymarket is a website where people put real money on yes-or-no questions about the future — will
              it rain tomorrow, will a certain team win, will a law pass. Instead of a bookmaker setting the odds,
              the price you see is set by everyone else buying and selling, kind of like a stock market — except
              instead of buying a piece of a company, you're buying a side of a bet.
            </p>
            <p>
              If lots of people think "yes" is likely, the price of the "yes" side goes up. That price, read as a
              percentage, is basically the crowd's best collective guess at how likely the answer is.
            </p>
          </>
        }
        deeper={
          <ul className="about-list">
            <li>
              <strong>Shares, not bets in the usual sense.</strong> Every market mints a "Yes" share and a "No"
              share. Whichever one turns out correct pays exactly $1; the other pays $0. So a share's price is
              really just what the market thinks it's worth in expectation.
            </li>
            <li>
              <strong>Price = probability, and here's why:</strong> if Yes and No together cost noticeably less
              than $1, you could buy both and be guaranteed a profit no matter what happens. Traders chase that
              free money until it disappears — which only happens once the two prices add back up to roughly $1.
              That constant pressure is what makes "62¢" and "62% likely" mean the same thing.
            </li>
            <li>
              <strong>It's a real order book (a CLOB).</strong> Same matching engine style as a stock exchange —
              buyers and sellers post prices and get matched directly. There's no house setting a line against
              you; the "odds" are just wherever supply and demand happen to land.
            </li>
            <li>
              <strong>Resolution runs through an optimistic oracle (UMA).</strong> Once the real-world event
              happens, someone proposes what the outcome was. There's a challenge window (usually about a day)
              where anyone can dispute it by staking a bond; undisputed proposals just finalize automatically,
              disputed ones get settled by UMA token-holder votes. No single company unilaterally "decides" who
              won — but it also means resolution isn't always instant.
            </li>
            <li>
              <strong>Money moves in USDC, on Polygon.</strong> Trades settle on-chain, so once a market resolves,
              payouts are automatic rather than something a company has to manually process.
            </li>
          </ul>
        }
      />

      <ExplainerSection
        prompt="$ cat README.md"
        title="how split decision works"
        simple={
          <>
            <p>
              This site doesn't let you place any bets — it just watches Polymarket for you. You pick markets
              you're curious about, and it remembers how their odds changed over time (Polymarket itself only
              really shows you the current price), tells you when something moves a lot, and lets you test your
              own guessing skills against the crowd.
            </p>
            <p>No wallet, no real money, nothing on-chain — it only reads Polymarket's own public data.</p>
          </>
        }
        deeper={
          <>
            <ul className="about-list">
              <li>
                <strong>A small poller does the remembering.</strong> Every few minutes, a background job checks
                every market you're watching and saves a timestamped snapshot (price, volume, ...) to a local
                database — so you can see the shape of how a market moved, not just where it landed.
              </li>
              <li>
                <strong>Alerts come from comparing two snapshots.</strong> Each time it polls, it checks the new
                price against the last one; if any outcome moved more than a set threshold (5 percentage points
                by default) between those two polls, that becomes a swing alert.
              </li>
              <li>
                <strong>Calibration and correlation both read from that same snapshot history</strong> — they're
                just different ways of asking questions about data this project already collected, rather than
                anything Polymarket exposes directly.
              </li>
            </ul>
            <p className="about-rough-edges-label">honest rough edges:</p>
            <ul className="about-list">
              <li>Alerts only catch moves <em>between</em> polls — a quick spike-and-recovery can slip through invisibly.</li>
              <li>History starts the moment you hit "watch" — there's no going back to see how a market looked before that.</li>
              <li>It leans entirely on Polymarket's public API staying available and unchanged; if they reshape it, something here could quietly break.</li>
            </ul>
          </>
        }
      />

      <ExplainerSection
        prompt="$ man calibrate"
        title="how calibrate works"
        simple={
          <>
            <p>
              Before you see what the market thinks, you type in your own guess — like "70% yes." Once the real
              answer is known, this checks: was your gut instinct closer to the truth than the crowd's price was?
            </p>
            <p>Do that enough times and you start to find out whether you're actually good at judging likelihood, or just confident.</p>
          </>
        }
        deeper={
          <>
            <p>
              Both your guess and the market's price (at the moment you locked in) get compared to the real
              outcome — 1 if it happened, 0 if it didn't — using a <strong>Brier score</strong>: take the
              difference between the stated probability and the actual outcome, and square it.
            </p>
            <ul className="about-list">
              <li>Confidently right (said 95%, it happened) → score near <code>0</code> — great.</li>
              <li>Confidently wrong (said 95%, it didn't happen) → score near <code>1</code> — terrible.</li>
              <li>Hedged at 50% either way → score is always <code>0.25</code>, so playing it safe caps how well you can do.</li>
            </ul>
            <p>
              The reason it's squared error specifically, and not something simpler, is that it's a{" "}
              <strong>proper scoring rule</strong>: the mathematically best strategy for minimizing your expected
              score is to honestly state what you actually believe. There's no way to game a good Brier score
              other than genuinely being well-calibrated — meaning that out of everything you've said "70%" on,
              roughly 7 in 10 should actually happen.
            </p>
          </>
        }
      />

      <ExplainerSection
        prompt="$ man correlate"
        title="how correlate works"
        simple={
          <>
            <p>
              Pick two markets you're watching — say, a Fed interest-rate market and a Bitcoin-price market. This
              plots both of their price histories on one chart, so you can see just by eye whether they tend to
              move up and down together.
            </p>
          </>
        }
        deeper={
          <>
            <p>
              Underneath the chart it computes a <strong>Pearson correlation coefficient</strong> — a single
              number from −1 to 1 — from the two markets' snapshots, matched up by closest timestamp.
            </p>
            <ul className="about-list">
              <li><code>+1</code> — they move in perfect lockstep.</li>
              <li><code>−1</code> — they move in perfect opposite directions.</li>
              <li><code>0</code> — no relationship at all.</li>
            </ul>
            <p className="about-signoff muted">
              Worth being skeptical of it, too: with only a handful of snapshots the number gets noisy and can
              look meaningful by pure chance, and correlation never proves one market <em>causes</em> the other to
              move — they might just both be reacting to the same news.
            </p>
          </>
        }
      />
    </div>
  );
}
