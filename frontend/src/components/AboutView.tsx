export function AboutView() {
  return (
    <div className="about-grid">
      <div className="panel about-panel">
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

      <div className="panel about-panel">
        <p className="terminal-prompt">$ man polymarket</p>
        <h2 className="about-heading">how polymarket actually works</h2>
        <ul className="about-list">
          <li>
            <strong>A market is a question with shares.</strong> "Will X happen by date Y?" gets a "Yes" share and
            a "No" share. Each pays out exactly $1 if it's correct, and $0 if it's not.
          </li>
          <li>
            <strong>The price IS the probability.</strong> If "Yes" shares trade at 62¢, the market is saying
            "62% likely." Why? Arbitrage: if Yes + No didn't add up to roughly $1, you could buy both sides and
            lock in free money — so traders push the prices back until they do.
          </li>
          <li>
            <strong>It's a real order book (a CLOB),</strong> not a slot machine — buyers and sellers are matched
            directly, same as a stock exchange, just for probabilities instead of shares of a company.
          </li>
          <li>
            <strong>Settlement is on-chain</strong> (Polygon, in USDC), and resolution uses an optimistic oracle
            (UMA): someone proposes the real-world outcome, and there's a window for anyone to dispute it with a
            bond before it's finalized. No single company just "decides" who won.
          </li>
        </ul>
      </div>

      <div className="panel about-panel">
        <p className="terminal-prompt">$ cat README.md</p>
        <h2 className="about-heading">how split decision works</h2>
        <p>
          This isn't a Polymarket clone and it doesn't touch real money — no wallet, no trading, nothing
          on-chain. It's a read-only layer on top of Polymarket's own public API that does the three things I
          actually wanted and couldn't get from the site itself:
        </p>
        <ol className="about-list about-list-ordered">
          <li>
            <strong>Remembers history.</strong> Polymarket shows you the current price. A small poller here
            checks watchlisted markets every few minutes and keeps every snapshot, so you can actually see the
            shape of how a market moved, not just where it landed.
          </li>
          <li>
            <strong>Tells you when something moves.</strong> Comparing consecutive snapshots catches odds swings
            past a threshold and turns them into an alert — the site itself won't tap you on the shoulder for
            that.
          </li>
          <li>
            <strong>Scores you against the market.</strong> The calibration tracker and correlation explorer
            don't exist on Polymarket at all — they're for asking "am I actually well-calibrated?" and "do these
            two markets move together?", which is the part I found genuinely interesting.
          </li>
        </ol>
        <p className="about-signoff muted">
          Known rough edges: alerts only catch moves between polls (so a fast spike-and-recovery can slip through),
          and there's no backfill — history starts the moment you hit "watch."
        </p>
      </div>
    </div>
  );
}
