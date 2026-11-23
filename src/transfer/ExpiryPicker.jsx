import { useState } from "react";
import { toast } from "react-hot-toast";
import { PencilSquareIcon, PlusIcon } from "@heroicons/react/24/outline";
import { formatDuration } from "./api";

const chip =
  "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600";
const on = "bg-brand text-ink-950 shadow-[0_6px_16px_-8px_rgba(82,200,15,0.9)] ring-1 ring-brand-600/40";
const off = "bg-ink-900/5 text-ink-900/70 hover:bg-ink-900/10";

// Preset chips plus ONE last chip: "+ Custom", or the custom time once chosen (so the row never wraps).
export default function ExpiryPicker({ limits, value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState("min");

  const isCustom = !limits.expiryOptions.includes(value);

  const submit = () => {
    const minutes = Math.round(Number(amount) * (unit === "hours" ? 60 : 1));
    if (!Number.isFinite(minutes) || minutes < 1) return toast.error("Enter a time of at least 1 minute");
    if (minutes > limits.maxExpiryMinutes) return toast.error(`Maximum is ${formatDuration(limits.maxExpiryMinutes)}`);
    onChange(minutes);
    setOpen(false);
    setAmount("");
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "Escape") {
      e.stopPropagation();
      setOpen(false);
    }
  };

  return (
    <fieldset disabled={disabled} className="mt-4 animate-fade-in">
      <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-900/50">Delete files after</legend>
      <div className="flex flex-wrap items-center gap-2">
        {limits.expiryOptions.map((m) => (
          <button key={m} type="button" aria-pressed={value === m} onClick={() => onChange(m)}
            className={`${chip} ${value === m ? on : off}`}>
            {formatDuration(m)}
          </button>
        ))}

        <button type="button" aria-label="Custom time" aria-expanded={open} aria-pressed={isCustom}
          onClick={() => setOpen((o) => !o)}
          className={`${chip} inline-flex items-center gap-1 ${isCustom ? on : open ? "bg-brand-200 text-ink-900" : off}`}>
          {isCustom ? <PencilSquareIcon className="h-3.5 w-3.5" /> : <PlusIcon className="h-3.5 w-3.5" />}
          {isCustom ? formatDuration(value) : "Custom"}
        </button>
      </div>

      {open && (
        <div className="mt-2.5 flex animate-fade-in flex-wrap items-center gap-2 rounded-2xl bg-paper p-2 ring-1 ring-ink-900/10">
          <input
            autoFocus
            type="number"
            min="1"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="e.g. 45"
            aria-label="Custom expiry amount"
            className="w-20 rounded-xl bg-white px-3 py-1.5 text-sm font-semibold outline-none ring-1 ring-ink-900/10 focus:ring-brand-600"
          />
          <div className="flex rounded-xl bg-ink-900/10 p-0.5 text-xs font-bold" role="group" aria-label="Unit">
            {["min", "hours"].map((u) => (
              <button key={u} type="button" aria-pressed={unit === u} onClick={() => setUnit(u)}
                className={`rounded-[10px] px-2.5 py-1 transition ${unit === u ? "bg-white text-ink-900 shadow-sm" : "text-ink-900/50"}`}>
                {u === "min" ? "Minutes" : "Hours"}
              </button>
            ))}
          </div>
          <button type="button" onClick={submit}
            className="ml-auto rounded-xl bg-brand px-4 py-1.5 text-xs font-bold text-ink-950 transition hover:bg-brand-400">
            Set
          </button>
          <p className="w-full text-[11px] text-ink-900/50">Up to {formatDuration(limits.maxExpiryMinutes)}.</p>
        </div>
      )}
    </fieldset>
  );
}
