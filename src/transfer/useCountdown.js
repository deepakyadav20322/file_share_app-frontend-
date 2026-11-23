import { useEffect, useState } from "react";

// Seconds left until `expiresAt` (ISO string), ticking every second.
export default function useCountdown(expiresAt) {
  const calc = () => (expiresAt ? Math.max(0, Math.round((new Date(expiresAt) - Date.now()) / 1000)) : 0);
  const [left, setLeft] = useState(calc);

  useEffect(() => {
    setLeft(calc());
    if (!expiresAt) return;
    const id = setInterval(() => setLeft(calc()), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const h = Math.floor(left / 3600);
  const mm = String(Math.floor((left % 3600) / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  return { left, label: h ? `${h}:${mm}:${ss}` : `${mm}:${ss}` };
}
