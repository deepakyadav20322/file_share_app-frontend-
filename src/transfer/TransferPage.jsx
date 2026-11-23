import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EnvelopeIcon, KeyIcon, LinkIcon, QrCodeIcon, WrenchScrewdriverIcon } from "@heroicons/react/24/outline";
import { DEFAULT_LIMITS, fetchLimits, formatDuration, formatSize } from "./api";
import Shell, { card, wrap } from "./Shell";
import SendPanel from "./SendPanel";
import ResultPanel from "./ResultPanel";
import ReceivePanel from "./ReceivePanel";
import TransferIllustration from "./TransferIllustration";
import Stats from "./Stats";
import LiveStrip from "./LiveStrip";

export default function TransferPage() {
  const [limits, setLimits] = useState(DEFAULT_LIMITS);
  const [transfer, setTransfer] = useState(null);

  // Re-read the limits now and then, so switching sending off (or on) in the admin panel shows up
  // without a page reload.
  useEffect(() => {
    const load = () => fetchLimits().then(setLimits);
    load();
    const timer = setInterval(load, 60_000);
    const onVisible = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  const maintenance = limits.features?.uploads === false;
  const emailOff = limits.features?.email === false;

  const chips = [
    `Up to ${limits.maxFiles} files · ${formatSize(limits.maxTotalSize)}`,
    `Auto-delete from ${formatDuration(Math.min(...limits.expiryOptions))} to ${formatDuration(limits.maxExpiryMinutes)}`,
    "No signup",
  ];

  const ways = [
    { icon: KeyIcon, title: "6-digit key", text: "Read it out loud or type it on any device.", tone: "bg-brand text-ink-950" },
    { icon: QrCodeIcon, title: "QR code", text: "Point a phone camera at the screen. Done.", tone: "bg-white text-ink-900 ring-1 ring-ink-900/10" },
    { icon: LinkIcon, title: "Share link", text: "Paste it into any chat or document.", tone: "bg-white text-ink-900 ring-1 ring-ink-900/10" },
    { icon: EnvelopeIcon, title: "Email", text: "We send the link for you, from the page.", tone: "bg-ink-900 text-white" },
  ];

  const hero = (
    <>
    {maintenance && (
      <div className={`${wrap} pt-2`}>
        <div role="alert" className="flex items-center gap-3 rounded-2xl bg-amber-400 px-4 py-3.5 text-ink-950 shadow-[0_12px_32px_-10px_rgba(251,191,36,0.7)] sm:px-5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink-950 text-amber-300">
            <WrenchScrewdriverIcon className="h-6 w-6" />
          </span>
          <p className="text-sm font-medium sm:text-base">
            <span className="block font-display text-base font-extrabold sm:text-lg">Maintenance in progress</span>
            Sending files is paused for now. You can still receive files with a key. Please check back soon.
          </p>
        </div>
      </div>
    )}
    <section className={`${wrap} grid grid-cols-1 items-center gap-6 pb-10 pt-2 sm:gap-10 sm:pb-12 sm:pt-6 lg:grid-cols-[1.1fr_1fr] lg:gap-14 lg:pb-20 lg:pt-12`}>
      <div className="min-w-0 text-center lg:text-left">
        <span className="hidden items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand ring-1 ring-white/10 sm:inline-flex">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" /> Free · No signup · Files delete themselves
        </span>
        <h1 className="font-display text-3xl font-extrabold leading-[1.1] tracking-tight sm:mt-5 sm:text-5xl sm:leading-[1.05] lg:text-6xl">
          Share files with just a{" "}
          <span className="inline-block -rotate-1 rounded-lg bg-brand px-2.5 text-ink-950 shadow-[0_0_40px_-6px_rgba(110,237,31,0.65)]">6-digit key</span>
        </h1>
        <p className="mx-auto mt-5 hidden max-w-xl text-base text-white/70 sm:block sm:text-lg lg:mx-0">
          Drop your files, hand over the key, and they're gone when the timer runs out. Nothing to install and no account to make.
        </p>
        <ul className="mt-6 hidden flex-wrap justify-center gap-2 sm:flex lg:justify-start">
          {chips.map((c) => (
            <li key={c} className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-white/80 ring-1 ring-white/15">{c}</li>
          ))}
        </ul>
        <TransferIllustration className="mx-auto mt-8 hidden w-full max-w-md lg:mx-0 lg:block" />
      </div>

      <div className="mx-auto w-full min-w-0 max-w-md space-y-4 lg:mx-0 lg:ml-auto">
        <section className={`${card} p-5`} aria-label="Send">
          <h2 className="mb-4 font-display text-xl font-extrabold">Send</h2>
          {transfer && <ResultPanel transfer={transfer} onReset={() => setTransfer(null)} emailEnabled={limits.features?.email !== false} />}
          {/* Always mounted (hidden after a send) so a file dropped on the page works from the result screen too. */}
          <div hidden={Boolean(transfer)}>
            <SendPanel limits={limits} onSent={setTransfer} onFilesAdded={() => setTransfer(null)} />
          </div>
        </section>

        <section className={`${card} p-5`} aria-label="Receive">
          <h2 className="mb-3 font-display text-xl font-extrabold">Receive</h2>
          <ReceivePanel />
        </section>

        <p className="px-1 text-center text-xs text-white/45">
          By sharing files you agree to our <Link to="/terms" className="underline hover:text-white">Terms</Link> and{" "}
          <Link to="/privacy" className="underline hover:text-white">Privacy Policy</Link>.
        </p>
      </div>
    </section>
    </>
  );

  return (
    <Shell title="Share files in seconds" hero={hero}>
      <section className={`${wrap} py-16`} aria-labelledby="ways">
        <h2 id="ways" className="max-w-xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Four ways to hand it over
        </h2>
        <p className="mt-2 max-w-xl text-ink-900/60">Pick whatever suits the moment. Everyone gets the same files, for the same time.</p>
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ways.map(({ icon: Icon, title, text, tone }) => {
            const off = title === "Email" && emailOff; // switched off from the admin panel
            return (
              <li
                key={title}
                title={off ? "Email sharing is switched off right now. Use the key, QR code or link instead." : undefined}
                className={`rounded-3xl p-6 ${tone} ${off ? "cursor-not-allowed opacity-60" : ""}`}
              >
                <Icon className="h-7 w-7" />
                <h3 className="mt-6 flex flex-wrap items-center gap-2 font-display text-xl font-extrabold">
                  {title}
                  {off && <span className="rounded-full bg-white/15 px-2.5 py-0.5 font-sans text-[11px] font-bold uppercase tracking-wide">Not active right now</span>}
                </h3>
                <p className="mt-1 text-sm opacity-75">{off ? "This option is temporarily switched off. It will be back soon." : text}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="border-y border-ink-900/10 bg-white/60 py-12">
        <div className={`${wrap} space-y-10`}>
          <LiveStrip />
          <Stats limits={limits} />
        </div>
      </section>

      <section className={`${wrap} py-16 text-center`}>
        <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Ready when you are</h2>
        <p className="mx-auto mt-2 max-w-md text-ink-900/60">Curious how it works or what happens to your files?</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/about" className="rounded-2xl bg-ink-900 px-6 py-3 text-sm font-bold text-brand transition hover:bg-ink-800">How SendAnyFile works</Link>
          <Link to="/privacy" className="rounded-2xl bg-white px-6 py-3 text-sm font-bold ring-1 ring-ink-900/10 transition hover:bg-ink-900/5">Read the privacy policy</Link>
        </div>
      </section>
    </Shell>
  );
}
