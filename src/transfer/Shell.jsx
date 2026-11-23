import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ArrowUpTrayIcon } from "@heroicons/react/24/solid";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import useInstallPrompt from "./useInstallPrompt";

const NAV = [
  { to: "/transfer", label: "Transfer" },
  { to: "/about", label: "About" },
  { to: "/transparency", label: "Live stats" },
  { to: "/contact", label: "Contact" },
];

// Shared building blocks used across the transfer pages.
export const wrap = "mx-auto w-full max-w-6xl px-4 sm:px-6";
export const card = "rounded-xl bg-white text-ink-900 shadow-2xl shadow-ink-950/25 ring-1 ring-ink-900/5";
export const primaryBtn =
  "inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand px-5 py-3.5 text-sm font-bold text-ink-950 shadow-[0_12px_30px_-12px_rgba(82,200,15,0.9)] transition hover:bg-brand-400 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none";
export const ghostBtn =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-ink-900/10 bg-white px-4 py-2.5 text-sm font-semibold text-ink-900 transition hover:bg-ink-900/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 disabled:opacity-50";

export function Logo({ className = "" }) {
  return (
    <Link to="/transfer" className={`flex items-center gap-2.5 font-display text-xl font-extrabold tracking-tight ${className}`}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-ink-950 shadow-[0_0_24px_-4px_rgba(110,237,31,0.7)]">
        <ArrowUpTrayIcon className="h-5 w-5" />
      </span>
      SendAnyFile
    </Link>
  );
}

const navClass = ({ isActive }) =>
  `rounded-full px-4 py-2 text-sm font-semibold transition ${
    isActive ? "bg-white/10 text-brand" : "text-white/70 hover:text-white"
  }`;

// Dark hero area on top (nav + `hero`), light content area below (`children`), dark footer.
export default function Shell({ title, hero, children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const { canInstall, install } = useInstallPrompt();

  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    document.title = title ? `${title} | SendAnyFile` : "SendAnyFile - Simple & secure file sharing";
  }, [title]);

  return (
    <div className="flex min-h-screen flex-col bg-paper font-sans text-ink-900 antialiased">
      <Toaster position="top-center" toastOptions={{ className: "!text-sm !font-medium !shadow-xl" }} />

      <div className={`relative overflow-hidden bg-ink-950 text-white ${children ? "" : "flex-1"}`}>
        {/* glow + dot grid */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_60%_at_85%_0%,rgba(110,237,31,0.20),transparent_70%),radial-gradient(40%_50%_at_0%_100%,rgba(110,237,31,0.09),transparent_70%)]" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />

        <header className={`${wrap} relative z-30 py-4`}>
          <div className="flex items-center justify-between">
            <Logo />
            <nav aria-label="Main" className="hidden items-center gap-1 sm:flex">
              {NAV.map((l) => (
                <NavLink key={l.to} to={l.to} className={navClass}>{l.label}</NavLink>
              ))}
            </nav>
            <Link to="/transfer" className={`hidden rounded-full bg-brand px-4 py-2 text-sm font-bold text-ink-950 transition hover:bg-brand-400 sm:inline-flex ${pathname === "/transfer" ? "invisible" : ""}`}>
              Send files
            </Link>
            <button
              type="button"
              className="rounded-xl p-2 text-white/80 hover:bg-white/10 sm:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
          </div>

          {menuOpen && (
            <nav aria-label="Mobile" className="mt-3 flex animate-fade-in flex-col gap-1 rounded-2xl bg-ink-900 p-2 ring-1 ring-white/10 sm:hidden">
              {NAV.map((l) => (
                <NavLink key={l.to} to={l.to} className={navClass}>{l.label}</NavLink>
              ))}
              {canInstall && (
                <button type="button" onClick={install} className="rounded-full px-4 py-2 text-left text-sm font-semibold text-brand">Install app</button>
              )}
            </nav>
          )}
        </header>

        <div className="relative">{hero}</div>
      </div>

      {children && <main className="flex-1">{children}</main>}

      <footer className="bg-ink-950 text-white/60">
        <div className={`${wrap} flex flex-col items-center justify-between gap-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-8 text-sm sm:flex-row`}>
          <div className="flex flex-col items-center gap-1 sm:items-start">
            <Logo className="text-white" />
            <p className="text-xs">© {new Date().getFullYear()} SendAnyFile. Files that delete themselves.</p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs">
            <Link to="/about" className="hover:text-brand">About</Link>
            <Link to="/transparency" className="hover:text-brand">Live stats</Link>
            <Link to="/contact" className="hover:text-brand">Contact</Link>
            <Link to="/privacy" className="hover:text-brand">Privacy</Link>
            <Link to="/terms" className="hover:text-brand">Terms</Link>
            {canInstall && (
              <button type="button" onClick={install} className="font-semibold text-brand hover:underline">Install app</button>
            )}
          </nav>
        </div>
      </footer>
    </div>
  );
}

// Dark page header used by About, Legal pages etc.
export function PageHero({ eyebrow, title, children }) {
  return (
    <section className={`${wrap} pb-14 pt-8 sm:pb-20 sm:pt-14`}>
      {eyebrow && (
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand ring-1 ring-white/10">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" /> {eyebrow}
        </span>
      )}
      <h1 className="mt-4 max-w-3xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">{title}</h1>
      {children && <div className="mt-5 max-w-2xl text-base text-white/70 sm:text-lg">{children}</div>}
    </section>
  );
}
