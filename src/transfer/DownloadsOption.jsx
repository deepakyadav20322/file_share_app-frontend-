import { useEffect, useState } from "react";
import { ArrowDownTrayIcon, ShieldCheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { card, ghostBtn } from "./Shell";

// A quiet one-line setting ("Downloads allowed: 1 · Change"). The dialog only opens on click.
// Only the numbers 1..max can be chosen: tap a tile, or press a digit / arrow key.
export default function DownloadsOption({ value, max, expiryLabel, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState(value);
  const numbers = Array.from({ length: max }, (_, i) => i + 1);

  const openDialog = () => {
    setPick(value);
    setOpen(true);
  };
  const save = () => {
    onChange(pick);
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
      else if (e.key === "Enter") {
        onChange(pick);
        setOpen(false);
      } else if (/^[1-9]$/.test(e.key) && Number(e.key) <= max) setPick(Number(e.key));
      else if (e.key === "ArrowRight" || e.key === "ArrowUp") setPick((p) => Math.min(max, p + 1));
      else if (e.key === "ArrowLeft" || e.key === "ArrowDown") setPick((p) => Math.max(1, p - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, pick, max, onChange]);

  return (
    <>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-ink-900/55">
          Downloads allowed: <b className="text-ink-900">{value}</b>
        </span>
        <button type="button" onClick={openDialog} disabled={disabled}
          className="font-bold text-brand-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 disabled:opacity-50">
          Change
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="dl-title"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className={`${card} w-full max-w-md animate-fade-in p-6 sm:p-7`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-100 text-brand-700">
                  <ArrowDownTrayIcon className="h-6 w-6" />
                </span>
                <div>
                  <h2 id="dl-title" className="font-display text-xl font-extrabold leading-tight">Allowed downloads</h2>
                  <p className="text-xs text-ink-900/50">Per file, until the files expire</p>
                </div>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close"
                className="rounded-lg p-1.5 text-ink-900/45 transition hover:bg-ink-900/5 hover:text-ink-900">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-5 text-sm leading-relaxed text-ink-900/65">
              Choose how many times each file can be downloaded. The default is 1. You can allow up to {max}, within the{" "}
              <b className="text-ink-900">{expiryLabel}</b> you chose.
            </p>

            <div role="radiogroup" aria-label="Number of downloads" className="mt-5 grid grid-cols-5 gap-2.5">
              {numbers.map((n) => (
                <button key={n} type="button" role="radio" aria-checked={pick === n} onClick={() => setPick(n)}
                  className={`rounded-xl py-3.5 font-display text-2xl font-extrabold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 ${
                    pick === n
                      ? "bg-brand text-ink-950 shadow-[0_8px_20px_-10px_rgba(82,200,15,0.95)] ring-1 ring-brand-600/40"
                      : "bg-paper text-ink-900/70 ring-1 ring-ink-900/10 hover:bg-brand-100"
                  }`}>
                  {n}
                </button>
              ))}
            </div>

            <p className="mt-4 flex items-start gap-2 rounded-xl bg-brand-50 px-3.5 py-3 text-sm text-ink-900/75 ring-1 ring-brand-600/20">
              <ShieldCheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" />
              <span>
                {pick === 1
                  ? "Safest: each file can be downloaded once, then it is no longer available."
                  : `Each file can be downloaded ${pick} times. After that it is no longer available.`}
              </span>
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setOpen(false)} className={`${ghostBtn} py-3`}>Cancel</button>
              <button type="button" onClick={save}
                className="inline-flex items-center justify-center rounded-2xl bg-brand px-5 py-3 text-sm font-bold text-ink-950 shadow-[0_12px_30px_-12px_rgba(82,200,15,0.9)] transition hover:bg-brand-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900 focus-visible:ring-offset-2">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
