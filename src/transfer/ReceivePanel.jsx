import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRightIcon } from "@heroicons/react/24/solid";

// One input for the 6-digit key. Typing or pasting only keeps digits, the phone shows the number
// keypad, and the page opens by itself once the sixth digit is in.
export default function ReceivePanel() {
  const navigate = useNavigate();
  const [key, setKey] = useState("");

  const go = (value) => value.length === 6 && navigate(`/receive/${value}`);

  const change = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setKey(value);
    go(value);
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); go(key); }}>
      <div className="flex items-center rounded-2xl bg-paper p-1.5 ring-1 ring-ink-900/10 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-600">
        <input
          aria-label="Enter the 6-digit key"
          value={key}
          onChange={change}
          inputMode="numeric"
          pattern="[0-9]*"
          enterKeyHint="go"
          autoComplete="one-time-code"
          placeholder="Enter 6-digit key"
          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 font-mono text-base font-bold tracking-[0.3em] outline-none placeholder:font-sans placeholder:text-sm placeholder:font-medium placeholder:tracking-normal placeholder:text-ink-900/40"
        />
        <button
          type="submit"
          aria-label="Get files"
          disabled={key.length !== 6}
          className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-ink-950 transition enabled:hover:bg-brand-400 disabled:bg-ink-900/10 disabled:text-ink-900/30"
        >
          <ArrowRightIcon className="h-5 w-5" />
        </button>
      </div>
    </form>
  );
}
