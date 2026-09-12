import { useEffect, useRef, useState } from "react";

// Weighted toward 0/1 (binary) with a sprinkle of %, $, Y, N — code rain
// that still nods at "probabilities and markets" rather than generic katakana.
const CHARS = "0101010101010101%$YN0123456789";
const FONT_SIZE = 15;
const FRAME_DELAY_MS = 50;

// Elements that count as "content" — hovering these should NOT trigger the
// rain, only genuinely empty background (gaps, margins, padding) should.
const CONTENT_SELECTOR = ".panel, .nav-tabs, .app-header, button, a, input, select, textarea";

const prefersReducedMotion =
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(false);
  const activeRef = useRef(false);
  activeRef.current = active;

  // Track whether the cursor is over empty background vs. actual UI.
  useEffect(() => {
    if (prefersReducedMotion) return;
    let ticking = false;

    const handleMove = (e: MouseEvent) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const overContent = !!el?.closest(CONTENT_SELECTOR);
        setActive(!overContent);
        ticking = false;
      });
    };
    const handleLeave = () => setActive(false);

    window.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseleave", handleLeave);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  // The actual rain — a persistent rAF loop that only draws while active, so
  // toggling hover on/off is cheap and the effect picks back up where it froze.
  useEffect(() => {
    if (prefersReducedMotion) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let columns = 0;
    let drops: number[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      columns = Math.floor(canvas.width / FONT_SIZE);
      drops = new Array(columns).fill(0).map(() => Math.random() * -50);
    };
    resize();
    window.addEventListener("resize", resize);

    let raf: number;
    let lastTime = 0;

    const draw = (time: number) => {
      raf = requestAnimationFrame(draw);
      if (!activeRef.current || time - lastTime < FRAME_DELAY_MS) return;
      lastTime = time;

      ctx.fillStyle = "rgba(10, 11, 15, 0.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${FONT_SIZE}px "JetBrains Mono", monospace`;
      for (let i = 0; i < drops.length; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        const x = i * FONT_SIZE;
        const y = drops[i] * FONT_SIZE;

        // Leading character brighter/whiter, trailing ones the theme's green.
        ctx.fillStyle = Math.random() > 0.93 ? "#c8ffd8" : "#5fd97a";
        ctx.fillText(char, x, y);

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  if (prefersReducedMotion) return null;

  return <canvas ref={canvasRef} className={`matrix-rain ${active ? "matrix-rain-active" : ""}`} aria-hidden="true" />;
}
