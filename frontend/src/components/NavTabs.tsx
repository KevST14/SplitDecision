import { useLayoutEffect, useRef, useState } from "react";
import { TabId } from "../hooks";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "◆" },
  { id: "markets", label: "Markets", icon: "⌕" },
  { id: "watchlist", label: "Watchlist", icon: "★" },
  { id: "alerts", label: "Alerts", icon: "⚡" },
];

export function NavTabs({ active, onChange }: { active: TabId; onChange: (tab: TabId) => void }) {
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const el = buttonRefs.current.get(active);
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [active]);

  return (
    <nav className="nav-tabs">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          ref={(el) => {
            if (el) buttonRefs.current.set(tab.id, el);
          }}
          className={`nav-tab ${active === tab.id ? "nav-tab-active" : ""}`}
          onClick={() => onChange(tab.id)}
        >
          <span className="nav-tab-icon">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
      {indicator && (
        <span
          className="nav-tab-indicator"
          style={{ transform: `translateX(${indicator.left}px)`, width: indicator.width }}
        />
      )}
    </nav>
  );
}
