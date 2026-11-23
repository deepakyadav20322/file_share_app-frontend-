import { useEffect, useRef, useState } from "react";

// Counts up to `value` once on mount and eases to new values later. Shows the final number
// straight away for users who prefer reduced motion.
export default function CountUp({ value, duration = 900 }) {
  const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const [shown, setShown] = useState(reduce ? value : 0);
  const from = useRef(0);

  useEffect(() => {
    if (reduce) return setShown(value);
    const start = performance.now();
    const base = from.current;
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setShown(Math.round(base + (value - base) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, reduce]);

  return <span className="tabular-nums">{shown.toLocaleString("en-US")}</span>;
}
