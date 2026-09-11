import { useEffect, useRef, useState } from "react";

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}

const prefersReducedMotion =
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Animates a number tweening toward `target` whenever it changes. */
export function useCountUp(target: number, durationMs = 500): number {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);

  useEffect(() => {
    if (prefersReducedMotion) {
      setValue(target);
      return;
    }
    const from = fromRef.current;
    if (from === target) return;
    const start = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(from + (target - from) * eased);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return value;
}

/** Returns 'up' | 'down' | null for a brief moment right after `value` changes. */
export function usePriceFlash(value: number | null | undefined, holdMs = 900): "up" | "down" | null {
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const prevRef = useRef(value);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = value;
    if (prefersReducedMotion || prev == null || value == null || value === prev) return;
    setFlash(value > prev ? "up" : "down");
    const id = setTimeout(() => setFlash(null), holdMs);
    return () => clearTimeout(id);
  }, [value, holdMs]);

  return flash;
}

const VALID_TABS = ["overview", "markets", "watchlist", "alerts"] as const;
export type TabId = (typeof VALID_TABS)[number];

function readHashTab(): TabId {
  const hash = window.location.hash.replace("#", "");
  return (VALID_TABS as readonly string[]).includes(hash) ? (hash as TabId) : "overview";
}

/** Keeps the active tab in the URL hash so back/forward and bookmarking work. */
export function useHashTab(): [TabId, (tab: TabId) => void] {
  const [tab, setTab] = useState<TabId>(readHashTab);

  useEffect(() => {
    const onHashChange = () => setTab(readHashTab());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = (next: TabId) => {
    window.location.hash = next;
    setTab(next);
  };

  return [tab, navigate];
}
