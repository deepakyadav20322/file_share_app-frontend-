import { Link } from "react-router-dom";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import useStats from "./useStats";
import CountUp from "./CountUp";

// Small live-proof strip for the Transfer page. Renders nothing until real numbers exist.
export default function LiveStrip() {
  const { stats } = useStats();
  if (!stats || stats.transfersCreated === 0) return null;

  const items = [
    { value: stats.transfersCreated, label: "transfers shared" },
    { value: stats.filesDeleted, label: "files auto-deleted" },
    { value: stats.storedFiles, label: "stored right now" },
  ];

  return (
    <div className="flex flex-col items-center justify-between gap-5 sm:flex-row">
      <p className="flex items-center gap-2 text-sm font-bold">
        <span className="h-2 w-2 animate-pulse rounded-full bg-brand-600" /> Live from our servers
      </p>
      <dl className="grid w-full grid-cols-3 gap-2 sm:w-auto sm:gap-10">
        {items.map((s) => (
          <div key={s.label} className="text-center sm:text-left">
            <dd className="font-display text-2xl font-extrabold sm:text-3xl"><CountUp value={s.value} /></dd>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-900/50">{s.label}</dt>
          </div>
        ))}
      </dl>
      <Link to="/transparency" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:underline">
        See all numbers <ArrowRightIcon className="h-4 w-4" />
      </Link>
    </div>
  );
}
