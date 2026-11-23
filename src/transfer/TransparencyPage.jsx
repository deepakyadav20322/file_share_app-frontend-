import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowPathIcon, ArrowRightIcon, ClockIcon, KeyIcon, ServerStackIcon, TrashIcon } from "@heroicons/react/24/outline";
import { formatBytesShort, formatDuration } from "./api";
import useStats from "./useStats";
import CountUp from "./CountUp";
import Shell, { PageHero, card, primaryBtn, wrap } from "./Shell";

const dayLabel = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

function Big({ icon: Icon, value, label, note, accent }) {
  return (
    <div className={`${card} p-5 sm:p-6`}>
      <span className={`grid h-10 w-10 place-items-center rounded-xl ${accent ? "bg-brand text-ink-950" : "bg-brand-100 text-brand-700"}`}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
        <CountUp value={value} />
      </p>
      <p className="mt-1 text-sm font-bold">{label}</p>
      <p className="mt-0.5 text-xs text-ink-900/55">{note}</p>
    </div>
  );
}

// Created vs deleted per day, last 14 days. Plain SVG so it stays light and prints well.
function DailyChart({ daily }) {
  const max = Math.max(1, ...daily.flatMap((d) => [d.created, d.deleted]));
  const W = 560, H = 160, pad = 6, slot = (W - pad * 2) / daily.length, bar = Math.min(12, slot / 2.6);
  const h = (n) => (n / max) * (H - 24);
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H + 18}`} className="w-full" role="img" aria-label="Transfers created and deleted per day over the last 14 days">
        {[0.5, 1].map((f) => (
          <line key={f} x1="0" x2={W} y1={H - f * (H - 24)} y2={H - f * (H - 24)} stroke="#0A1E13" strokeOpacity="0.08" strokeDasharray="3 4" />
        ))}
        <line x1="0" x2={W} y1={H} y2={H} stroke="#0A1E13" strokeOpacity="0.15" />
        {daily.map((d, i) => {
          const cx = pad + slot * i + slot / 2;
          return (
            <g key={d.date}>
              <rect x={cx - bar - 1} y={H - h(d.created)} width={bar} height={h(d.created)} rx="3" fill="#6EED1F">
                <title>{`${dayLabel(d.date)}: ${d.created} created`}</title>
              </rect>
              <rect x={cx + 1} y={H - h(d.deleted)} width={bar} height={h(d.deleted)} rx="3" fill="#10301E">
                <title>{`${dayLabel(d.date)}: ${d.deleted} deleted`}</title>
              </rect>
              {(i === 0 || i === daily.length - 1 || i === 7) && (
                <text x={cx} y={H + 14} textAnchor="middle" fontSize="10" fill="#0A1E13" fillOpacity="0.5">{dayLabel(d.date)}</text>
              )}
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-2 flex items-center gap-4 text-xs font-semibold text-ink-900/60">
        <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-brand" /> Created</span>
        <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-ink-800" /> Deleted</span>
      </figcaption>
    </figure>
  );
}

// Pulsing ring + dot, the "live" signal. Rings are static for users who prefer reduced motion.
function LiveDot({ ok }) {
  return (
    <span className="relative grid h-4 w-4 place-items-center" aria-hidden>
      {ok && <span className="absolute inset-0 animate-ping rounded-full bg-brand-600/50 motion-reduce:hidden" />}
      <span className={`relative h-2.5 w-2.5 rounded-full ${ok ? "bg-brand-600" : "bg-amber-500"}`} />
    </span>
  );
}

// Status bar: live indicator, "updated Xs ago" and a Refresh button.
function LiveBar({ stats, failed, refreshing, onRefresh }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const ago = stats ? Math.max(0, Math.round((now - new Date(stats.updatedAt)) / 1000)) : null;
  const agoText = ago === null ? "" : ago < 5 ? "just now" : ago < 60 ? `${ago}s ago` : `${Math.floor(ago / 60)} min ago`;

  return (
    <div className="mb-5 flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-2.5 text-sm shadow-sm ring-1 ring-ink-900/10">
      <p className="flex min-w-0 items-center gap-2.5" role="status" aria-live="polite">
        <LiveDot ok={!failed} />
        <span className="font-bold">{failed ? "Reconnecting…" : "Live"}</span>
        {agoText && <span className="truncate text-xs text-ink-900/55">Updated {agoText}</span>}
      </p>
      <button type="button" onClick={onRefresh} disabled={refreshing}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-100 px-3 py-1.5 text-xs font-bold text-ink-900 transition hover:bg-brand-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 disabled:opacity-60">
        <ArrowPathIcon className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        {refreshing ? "Refreshing" : "Refresh"}
      </button>
    </div>
  );
}

export default function TransparencyPage() {
  const { stats, failed, refreshing, refresh } = useStats();
  const empty = stats && stats.transfersCreated === 0;
  const pct = stats && stats.transfersCreated ? Math.round((stats.transfersDeleted / stats.transfersCreated) * 100) : 0;

  const hero = (
    <PageHero eyebrow="Live transparency" title="Every transfer, counted. Every file, deleted.">
      Real numbers straight from our database, updated every minute. We only count transfers. We never publish names, keys or contents.
    </PageHero>
  );

  return (
    <Shell title="Transparency" hero={hero}>
      <section className={`${wrap} py-8 sm:py-12`}>
        <LiveBar stats={stats} failed={failed} refreshing={refreshing} onRefresh={refresh} />
        {failed && !stats && (
          <div className={`${card} p-8 text-center text-sm text-ink-900/60`}>Live numbers are unavailable right now. Please try again in a moment.</div>
        )}

        {!stats && !failed && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-busy="true" aria-label="Loading">
            {[0, 1, 2].map((i) => <div key={i} className="h-44 animate-pulse rounded-xl bg-ink-900/5" />)}
          </div>
        )}

        {stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Big icon={KeyIcon} value={stats.transfersCreated} label="Share keys created" note={`${stats.filesShared.toLocaleString("en-US")} files · ${formatBytesShort(stats.bytesShared)} shared in total`} />
              <Big icon={TrashIcon} value={stats.transfersDeleted} label="Transfers deleted" note={`${stats.filesDeleted.toLocaleString("en-US")} files permanently removed from disk`} accent />
              <Big icon={ServerStackIcon} value={stats.storedTransfers} label="Stored right now" note={`${stats.storedFiles.toLocaleString("en-US")} files, each with a running timer`} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              <div className={`${card} p-5 sm:p-6`}>
                <h2 className="font-display text-lg font-extrabold">Last 14 days</h2>
                <p className="mb-4 text-xs text-ink-900/55">New transfers against transfers whose files were removed.</p>
                {empty ? (
                  <p className="rounded-xl bg-paper px-4 py-10 text-center text-sm text-ink-900/55">No transfers yet. The first one will show up here.</p>
                ) : (
                  <DailyChart daily={stats.daily} />
                )}
              </div>

              <div className={`${card} flex flex-col p-5 sm:p-6`}>
                <h2 className="font-display text-lg font-extrabold">Cleaned up</h2>
                <p className="mb-4 text-xs text-ink-900/55">Share of all transfers whose files are already gone.</p>
                <div className="relative mx-auto my-auto grid place-items-center">
                  <svg viewBox="0 0 120 120" className="h-36 w-36 -rotate-90" role="img" aria-label={`${pct} percent of transfers cleaned up`}>
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#E3FBCB" strokeWidth="12" />
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#6EED1F" strokeWidth="12" strokeLinecap="round"
                      strokeDasharray={`${(pct / 100) * 314} 314`} className="transition-[stroke-dasharray] duration-1000" />
                  </svg>
                  <p className="absolute font-display text-3xl font-extrabold">{pct}%</p>
                </div>
                <p className="mt-4 text-center text-xs text-ink-900/55">The rest are still inside their timer.</p>
              </div>
            </div>

            <div className={`${card} grid grid-cols-1 gap-5 p-5 sm:grid-cols-[auto_1fr] sm:items-center sm:p-6`}>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-100 text-brand-700"><ClockIcon className="h-6 w-6" /></span>
              <div>
                <h2 className="font-display text-lg font-extrabold">
                  Oldest file on our servers: {stats.storedTransfers ? formatDuration(Math.max(1, stats.oldestStoredMinutes)) : "none"}
                </h2>
                <p className="text-sm text-ink-900/60">
                  Nothing can stay longer than {formatDuration(stats.maxExpiryMinutes)}. If this number ever went past that, you would see it here first.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-ink-950 p-6 text-white sm:p-8">
              <h2 className="font-display text-xl font-extrabold">What we do and don&apos;t publish</h2>
              <div className="mt-4 grid grid-cols-1 gap-x-10 gap-y-2 text-sm text-white/70 sm:grid-cols-2">
                <p><b className="text-brand">Published:</b> totals, daily counts and sizes.</p>
                <p><b className="text-white">Never published:</b> keys, file names, contents or who sent them.</p>
                <p><b className="text-brand">Kept after deletion:</b> only the counts above, so these numbers stay honest.</p>
                <p><b className="text-white">Removed on expiry:</b> the files and their names.</p>
              </div>
              <Link to="/privacy" className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-brand hover:underline">
                Read the privacy policy <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>

            <div className="mx-auto max-w-xs"><Link to="/transfer" className={primaryBtn}>Send files now</Link></div>
            {stats.since && <p className="text-center text-xs text-ink-900/45">Counting since {new Date(stats.since).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} · updated {new Date(stats.updatedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</p>}
          </div>
        )}
      </section>
    </Shell>
  );
}
