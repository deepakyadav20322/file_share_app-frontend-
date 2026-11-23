import { useCallback, useEffect, useRef, useState } from "react";
import { fetchStats } from "./api";

// Public counters from the backend; auto-refreshed every minute, or on demand via refresh().
export default function useStats() {
  const [stats, setStats] = useState(null);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const live = useRef(true);

  const load = useCallback(async (fresh = false) => {
    setRefreshing(true);
    try {
      // Keep the spinner up for a moment on manual refresh so the click visibly does something.
      const [s] = await Promise.all([fetchStats(fresh), fresh ? new Promise((r) => setTimeout(r, 600)) : null]);
      if (live.current) (setStats(s), setFailed(false));
    } catch {
      if (live.current) setFailed(true);
    } finally {
      if (live.current) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    live.current = true;
    load();
    const id = setInterval(load, 60000);
    return () => {
      live.current = false;
      clearInterval(id);
    };
  }, [load]);

  return { stats, failed, refreshing, refresh: () => load(true) };
}
