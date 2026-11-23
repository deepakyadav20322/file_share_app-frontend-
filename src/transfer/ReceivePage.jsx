import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowDownTrayIcon, ClockIcon, DocumentIcon, ExclamationCircleIcon, NoSymbolIcon, WifiIcon } from "@heroicons/react/24/outline";
import { fetchTransfer, fileUrl, formatSize, shortName, zipUrl } from "./api";
import useCountdown from "./useCountdown";
import Shell, { card, ghostBtn, primaryBtn, wrap } from "./Shell";
import ReceivePanel from "./ReceivePanel";

// Friendly wording for each way a key can fail to open.
const problem = (status) =>
  status === 404
    ? { icon: ExclamationCircleIcon, title: "We couldn't find that key", text: "Check the 6 digits and try again. If they are right, the files may have expired or been used up. SendAnyFile deletes files automatically when the timer ends." }
    : status === 429
    ? { icon: ClockIcon, title: "Too many tries", text: "Please wait a minute, then enter the key again." }
    : status
    ? { icon: ExclamationCircleIcon, title: "Something went wrong", text: "We couldn't open this transfer right now. Please try again in a moment." }
    : { icon: WifiIcon, title: "Can't reach SendAnyFile", text: "Check your internet connection and try again." };

export default function ReceivePage() {
  const { key } = useParams();
  const [transfer, setTransfer] = useState(null);
  const [error, setError] = useState(null); // { status } when the key could not be opened
  const { left, label } = useCountdown(transfer?.expiresAt);
  const outOfDownloads = transfer && transfer.downloadsLeft === 0;
  const timeUp = transfer && left === 0;
  const expired = transfer && (timeUp || outOfDownloads);
  const issue = error && problem(error.status);

  useEffect(() => {
    setTransfer(null);
    setError(null);
    // Keys are always 6 digits; anything else in the address is never sent to the API.
    if (!/^\d{6}$/.test(key)) return setError({ status: 404 });
    fetchTransfer(key)
      .then(setTransfer)
      .catch((err) => setError({ status: err?.response?.status || 0 }));
  }, [key]);

  // The browser handles the download itself, so re-read the counts a moment later.
  const refreshSoon = () => setTimeout(() => fetchTransfer(key).then(setTransfer).catch(() => {}), 1500);

  const hero = (
    <section className={`${wrap} flex justify-center pb-16 pt-6 sm:pt-12`}>
      <div className="w-full max-w-md">
        <p className="mb-4 text-center text-sm font-semibold text-white/60">
          Key <span className="ml-1 rounded-lg bg-brand px-2 py-0.5 font-mono font-bold tracking-widest text-ink-950">{key}</span>
        </p>

        <div className={`${card} animate-fade-in p-5 sm:p-6`}>
          {!error && !transfer && (
            <div className="space-y-3" aria-busy="true" aria-label="Loading">
              <div className="h-6 w-44 animate-pulse rounded-lg bg-ink-900/10" />
              <div className="h-14 animate-pulse rounded-2xl bg-ink-900/5" />
              <div className="h-14 animate-pulse rounded-2xl bg-ink-900/5" />
            </div>
          )}

          {error && (
            <div className="py-2 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-amber-600">
                <issue.icon className="h-8 w-8" />
              </span>
              <h1 className="mt-4 font-display text-xl font-extrabold">{issue.title}</h1>
              <p className="mb-5 mt-1 text-sm text-ink-900/60">{issue.text}</p>
              <div className="text-left">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-900/50">Try another key</p>
                <ReceivePanel />
              </div>
            </div>
          )}

          {transfer && (
            <>
              <div className="mb-4">
                <h1 className="font-display text-xl font-extrabold">
                  {outOfDownloads ? "All downloads used" : timeUp ? "This transfer has expired" : "Your files are ready"}
                </h1>
                <p className="mt-0.5 text-xs text-ink-900/55">
                  {transfer.files.length} file{transfer.files.length > 1 ? "s" : ""} · {formatSize(transfer.totalSize)}
                </p>
                {expired ? (
                  <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
                    <NoSymbolIcon className="mt-0.5 h-4 w-4 shrink-0" />
                    {outOfDownloads
                      ? "The download limit for this transfer has been reached. Ask the sender to share the files again."
                      : "The timer ran out, so the files are being deleted. Ask the sender to share them again."}
                  </p>
                ) : (
                  <p className={`mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl px-3 py-2 text-sm font-semibold ${left < 60 ? "bg-red-50 text-red-600" : "bg-brand-100 text-ink-900"}`} aria-live="off">
                    <ClockIcon className="h-4 w-4" />
                    <span>Expires in <span className="font-mono tabular-nums">{label}</span></span>
                    <span aria-hidden className="opacity-40">·</span>
                    <span>{transfer.downloadsLeft} download{transfer.downloadsLeft === 1 ? "" : "s"} left</span>
                  </p>
                )}
              </div>

              {/* Same compact rows as the send screen. Five rows show; more scroll (thin scrollbar). */}
              <ul className="max-h-[15.8rem] space-y-2 overflow-y-auto overscroll-contain pr-1 [scrollbar-color:rgba(10,30,19,0.25)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-ink-900/25 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5">
                {transfer.files.map((f) => (
                  <li key={f.index} title={f.name} className="flex items-center gap-2.5 rounded-xl bg-paper px-2.5 py-2 ring-1 ring-ink-900/5">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-100 text-brand-700">
                      <DocumentIcon className="h-4 w-4" />
                    </span>
                    <p className="min-w-0 flex-1 truncate text-[13px] font-medium">{shortName(f.name)}</p>
                    <span className="shrink-0 text-xs text-ink-900/45">{formatSize(f.size)}</span>
                    {!expired && f.downloadsLeft > 0 && (
                      <a href={fileUrl(key, f.index)} download={f.name} aria-label={`Download ${f.name}`} onClick={refreshSoon}
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand text-ink-950 transition hover:bg-brand-400">
                        <ArrowDownTrayIcon className="h-4 w-4" />
                      </a>
                    )}
                    {!expired && f.downloadsLeft === 0 && (
                      <span className="shrink-0 rounded-full bg-ink-900/5 px-2 py-0.5 text-[11px] font-bold text-ink-900/50">Done</span>
                    )}
                  </li>
                ))}
              </ul>

              {!expired && transfer.files.length > 1 && transfer.files.every((f) => f.downloadsLeft > 0) && (
                <a href={zipUrl(key)} download={`sendanyfile-${key}.zip`} onClick={refreshSoon} className={`${primaryBtn} mt-5`}>
                  <ArrowDownTrayIcon className="h-4 w-4" /> Download all (.zip)
                </a>
              )}
            </>
          )}

          <Link to="/transfer" className={`${ghostBtn} mt-4 w-full`}>Send your own files</Link>
        </div>
      </div>
    </section>
  );

  return <Shell title="Receive files" hero={hero} />;
}
