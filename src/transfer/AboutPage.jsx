import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRightIcon, CheckIcon, ClockIcon, EnvelopeIcon, KeyIcon, QrCodeIcon, UserMinusIcon, XMarkIcon,
  ArrowUpTrayIcon, DevicePhoneMobileIcon, DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";
import { DEFAULT_LIMITS, fetchLimits, formatDuration, formatSize } from "./api";
import Shell, { PageHero, wrap } from "./Shell";
import Stats from "./Stats";

export default function AboutPage() {
  const [limits, setLimits] = useState(DEFAULT_LIMITS);
  useEffect(() => {
    fetchLimits().then(setLimits);
  }, []);

  const steps = [
    { icon: ArrowUpTrayIcon, title: "Add your files", text: `Drop or pick up to ${limits.maxFiles} files, and choose when they should disappear.` },
    { icon: KeyIcon, title: "Get a share key", text: "You get a 6-digit key, a QR code and a link. Share whichever is easiest." },
    { icon: DevicePhoneMobileIcon, title: "Receive anywhere", text: "Type the key or scan the code on any device. Download one file or all as a zip." },
  ];

  const does = [
    "Delete files automatically when the timer ends",
    "Limit repeated key guesses",
    "Keep no accounts and show no ads",
    "Explain plainly how it all works",
  ];
  const doesnt = [
    "End-to-end encrypt files, so keep truly sensitive data off it",
    "Keep files as a backup. Expiry is final",
    "Sell your data",
  ];

  const faqs = [
    ["How long are my files kept?", `Until the expiry you pick (${formatDuration(limits.expiryMinutes)} by default, up to ${formatDuration(limits.maxExpiryMinutes)}). After that the files and the key are removed automatically.`],
    ["What are the size limits?", `${limits.maxFiles} files per transfer, ${formatSize(limits.maxFileSize)} per file and ${formatSize(limits.maxTotalSize)} in total.`],
    ["Do I need an account?", "No. Add your files and share the key. The person receiving doesn't need an account either."],
    ["Can the files be downloaded more than once?", "Each file can be downloaded once by default. The sender can allow up to 5 downloads, within the expiry time. After that the file is no longer available, so share the key only with people you trust."],
    ["Are my files end-to-end encrypted?", "No. Files are stored temporarily on our server and removed after expiry. Avoid sending highly sensitive documents."],
    ["I need a file removed sooner.", "Use the Contact page, choose \"Remove a file\" and include the 6-digit key."],
  ];

  const hero = (
    <PageHero eyebrow="About SendAnyFile" title={<>File sharing without the <span className="text-brand">sign&#8209;up wall.</span></>}>
      <p>
        SendAnyFile moves files between people and devices in seconds. No accounts, no app, no clutter: add your files, share a key, and they're gone when the time is up.
      </p>
      <Link to="/transfer" className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-brand px-6 py-3.5 text-sm font-bold text-ink-950 shadow-[0_12px_30px_-12px_rgba(82,200,15,0.9)] transition hover:bg-brand-400">
        Start sharing <ArrowRightIcon className="h-4 w-4" />
      </Link>
    </PageHero>
  );

  return (
    <Shell title="About" hero={hero}>
      <section className="border-b border-ink-900/10 bg-white/60 py-10">
        <div className={wrap}><Stats limits={limits} /></div>
      </section>

      <section className={`${wrap} py-16`} aria-labelledby="how">
        <h2 id="how" className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">How it works</h2>
        <ol className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="relative">
              <span aria-hidden className="font-display text-7xl font-extrabold leading-none text-brand-600/25">0{i + 1}</span>
              <span className="-mt-6 mb-4 ml-1 grid h-12 w-12 place-items-center rounded-2xl bg-ink-900 text-brand shadow-lg">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="font-display text-xl font-extrabold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-900/65">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={`${wrap} pb-16`} aria-labelledby="why">
        <h2 id="why" className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Built to stay out of your way</h2>
        <ul className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <li className="rounded-3xl bg-brand p-7 text-ink-950 md:col-span-2">
            <UserMinusIcon className="h-8 w-8" />
            <h3 className="mt-8 font-display text-3xl font-extrabold">No signup. Ever.</h3>
            <p className="mt-2 max-w-md text-sm font-medium opacity-80">Nothing to install and no account to create, for you or for the person receiving.</p>
          </li>
          <li className="rounded-3xl bg-ink-900 p-7 text-white">
            <ClockIcon className="h-8 w-8 text-brand" />
            <h3 className="mt-8 font-display text-3xl font-extrabold">You set the clock</h3>
            <p className="mt-2 text-sm text-white/65">From {formatDuration(Math.min(...limits.expiryOptions))} to {formatDuration(limits.maxExpiryMinutes)}. Then it's gone.</p>
          </li>
          <li className="rounded-3xl bg-white p-7 ring-1 ring-ink-900/10">
            <DocumentDuplicateIcon className="h-8 w-8 text-brand-700" />
            <h3 className="mt-6 font-display text-xl font-extrabold">Several files at once</h3>
            <p className="mt-1.5 text-sm text-ink-900/65">Up to {limits.maxFiles}, {formatSize(limits.maxFileSize)} each. Grab them one by one or as a single zip.</p>
          </li>
          <li className="rounded-3xl bg-white p-7 ring-1 ring-ink-900/10">
            <QrCodeIcon className="h-8 w-8 text-brand-700" />
            <h3 className="mt-6 font-display text-xl font-extrabold">Key, QR or link</h3>
            <p className="mt-1.5 text-sm text-ink-900/65">Whatever is quickest: say it, scan it or paste it.</p>
          </li>
          <li className="rounded-3xl bg-white p-7 ring-1 ring-ink-900/10">
            <EnvelopeIcon className="h-8 w-8 text-brand-700" />
            <h3 className="mt-6 font-display text-xl font-extrabold">Email in one step</h3>
            <p className="mt-1.5 text-sm text-ink-900/65">Send the download link straight from the page.</p>
          </li>
        </ul>
      </section>

      <section className={`${wrap} pb-16`} aria-labelledby="promise">
        <div className="overflow-hidden rounded-[2rem] bg-ink-950 p-7 text-white sm:p-12">
          <h2 id="promise" className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Straight talk about privacy</h2>
          <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-brand">What we do</h3>
              <ul className="space-y-3">
                {does.map((t) => (
                  <li key={t} className="flex gap-3 text-sm text-white/80">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand text-ink-950"><CheckIcon className="h-3.5 w-3.5" strokeWidth={3} /></span>{t}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-white/50">What we don't</h3>
              <ul className="space-y-3">
                {doesnt.map((t) => (
                  <li key={t} className="flex gap-3 text-sm text-white/80">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/15 text-white"><XMarkIcon className="h-3.5 w-3.5" strokeWidth={3} /></span>{t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <Link to="/privacy" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-brand hover:underline">
            Read the full privacy policy <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className={`${wrap} max-w-3xl pb-20`} aria-labelledby="faq">
        <h2 id="faq" className="mb-6 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Questions</h2>
        <div className="divide-y divide-ink-900/10 rounded-3xl bg-white ring-1 ring-ink-900/10">
          {faqs.map(([q, a]) => (
            <details key={q} className="group px-6 py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {q}
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink-900/5 text-lg leading-none transition group-open:rotate-45 group-open:bg-brand">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-ink-900/65">{a}</p>
            </details>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-ink-900/60">
          Still curious? <Link to="/contact" className="font-bold text-brand-700 hover:underline">Talk to us</Link>
        </p>
      </section>
    </Shell>
  );
}
