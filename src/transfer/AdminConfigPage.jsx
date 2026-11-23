import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  ArrowRightOnRectangleIcon, ClockIcon, Cog6ToothIcon, EyeIcon, EyeSlashIcon, KeyIcon,
  LockClosedIcon, ShieldCheckIcon, UserIcon, XMarkIcon,
} from "@heroicons/react/24/outline";
import { getSession, loadConfig, login, logout, refresh, saveConfig, subscribe } from "./adminSession";
import Shell, { PageHero, card, ghostBtn, primaryBtn, wrap } from "./Shell";

// Hidden admin page: open /admin/config directly, nothing links here.
// Sign in gives a short access token that is renewed with a refresh token; the whole session ends
// after a fixed time. Saving asks for the ID and password again. Passwords are never stored in the browser.

const field =
  "w-full rounded-xl bg-paper px-4 py-2.5 text-sm font-medium outline-none ring-1 ring-ink-900/10 transition focus:bg-white focus:ring-2 focus:ring-brand-600";

const failMessage = (err) =>
  err?.response?.status === 403
    ? "Wrong ID or password."
    : err?.response?.status === 429
    ? "Too many attempts. Please try again in a few minutes."
    : err?.response?.data?.error || "Could not reach the server.";

const clock = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

function Spinner() {
  return <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />;
}

function PasswordInput({ id, value, onChange, onCaps }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <KeyIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-900/35" />
      <input
        id={id} type={visible ? "text" : "password"} className={`${field} pl-11 pr-11`} value={value}
        onChange={(e) => onChange(e.target.value)} autoComplete="new-password" required
        onKeyUp={(e) => onCaps?.(e.getModifierState?.("CapsLock"))}
      />
      <button type="button" onClick={() => setVisible((v) => !v)} aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-900/45 hover:text-ink-900">
        {visible ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
      </button>
    </div>
  );
}

function Credentials({ onSubmit, busy, error, submitLabel, notice }) {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [caps, setCaps] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(id.trim(), password);
        setPassword(""); // never keep the password around
      }}
      className="space-y-4"
      autoComplete="off"
    >
      <div>
        <label htmlFor="admin-id" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink-900/50">ID</label>
        <div className="relative">
          <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-900/35" />
          <input id="admin-id" className={`${field} pl-11`} value={id} onChange={(e) => setId(e.target.value)} autoComplete="off" autoFocus required maxLength={64} />
        </div>
      </div>
      <div>
        <label htmlFor="admin-pw" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink-900/50">Password</label>
        <PasswordInput id="admin-pw" value={password} onChange={setPassword} onCaps={setCaps} />
        {caps && <p className="mt-1.5 text-xs font-semibold text-amber-600">Caps Lock is on.</p>}
      </div>
      {notice && <p role="status" className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">{notice}</p>}
      {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>}
      <button type="submit" disabled={busy} className={`${primaryBtn} inline-flex w-full items-center justify-center gap-2`}>
        {busy ? <><Spinner /> Checking…</> : submitLabel}
      </button>
    </form>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 ${checked ? "bg-brand-600" : "bg-ink-900/20"}`}>
      <span className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
    </button>
  );
}

function Control({ def, value, onChange }) {
  if (def.type === "boolean") return <Toggle checked={value} onChange={onChange} label={def.label} />;
  if (def.type === "number") {
    return <input type="number" className={`${field} w-28`} min={def.min} max={def.max} value={value}
      onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))} aria-label={def.label} />;
  }
  return <input className={`${field} w-56`} value={value} maxLength={def.max} onChange={(e) => onChange(e.target.value)} aria-label={def.label} />;
}

const when = (iso) => new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });
const show = (v) => (typeof v === "boolean" ? (v ? "on" : "off") : String(v));

// Last loaded settings, kept while signed in so coming back from Messages/Architecture shows the page
// immediately (fresh data still loads in the background).
let lastConfig = null;

export default function AdminConfigPage() {
  const [tokens, setTokens] = useState(getSession()); // null when signed out
  const [config, setConfig] = useState(() => (getSession() ? lastConfig : null)); // { definitions, values, audit, openMessages }
  const [draft, setDraft] = useState(() => (getSession() && lastConfig ? lastConfig.values : {}));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Keep this page out of search results.
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex,nofollow";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  // Follow sign-in state (also changes from refreshes and from the session ending).
  useEffect(() => subscribe(setTokens), []);

  // Clock for the countdown.
  useEffect(() => {
    if (!tokens) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [tokens]);

  // Renew the access token shortly before it ends; quietly fails when the session is over.
  useEffect(() => {
    if (!tokens) return;
    const wait = Math.max(1000, new Date(tokens.accessExpiresAt) - Date.now() - 20_000);
    const t = setTimeout(() => refresh().catch(() => {}), wait);
    return () => clearTimeout(t);
  }, [tokens]);

  // Session over (time ran out or the server refused): back to the sign-in form.
  const ended = tokens && new Date(tokens.sessionExpiresAt) <= now;
  useEffect(() => {
    if (ended) {
      logout();
      setNotice("Your session ended. Please sign in again.");
    }
  }, [ended]);
  useEffect(() => {
    if (!tokens) {
      lastConfig = null;
      setConfig(null);
      setConfirming(false);
    }
  }, [tokens]);

  // Load the settings when the page opens signed in (or right after signing in).
  const signedIn = Boolean(tokens);
  useEffect(() => {
    if (!signedIn) return;
    loadConfig()
      .then((data) => {
        lastConfig = data;
        setConfig(data);
        setDraft(data.values);
      })
      .catch((err) => {
        if (err?.response?.status === 403) setError("This account is not allowed to open the settings.");
      });
    import("./ArchitecturePage"); // download the Architecture page now, so opening it is instant
  }, [signedIn]);

  const changed = useMemo(
    () => (config ? Object.fromEntries(Object.entries(draft).filter(([k, v]) => v !== config.values[k])) : {}),
    [config, draft]
  );
  const changedCount = Object.keys(changed).length;
  const groups = useMemo(() => {
    const map = new Map();
    (config?.definitions || []).forEach((d) => map.set(d.group, [...(map.get(d.group) || []), d]));
    return [...map];
  }, [config]);

  const signIn = async (id, password) => {
    setBusy(true);
    setError("");
    try {
      await login(id, password);
      setNotice("");
    } catch (err) {
      setError(failMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const save = async (id, password) => {
    setBusy(true);
    setError("");
    try {
      const data = await saveConfig(id, password, changed);
      setConfig((c) => (lastConfig = { ...c, values: data.values, audit: data.audit }));
      setDraft(data.values);
      setConfirming(false);
      toast.success("Saved");
    } catch (err) {
      setError(failMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const remaining = tokens ? new Date(tokens.sessionExpiresAt) - now : 0;

  // ---- signed out: sign-in screen -------------------------------------------------------------------
  if (!tokens) {
    return (
      <Shell title="Admin sign in" hero={null}>
        <div className="relative isolate overflow-hidden bg-ink-950">
          <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-brand-600/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-brand/20 blur-3xl" />
          <div className={`${wrap} relative grid min-h-[78vh] place-items-center py-12`}>
            <div className="w-full max-w-md">
              <div className="mb-6 text-center text-white">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
                  <LockClosedIcon className="h-7 w-7 text-brand" />
                </span>
                <h1 className="mt-4 font-display text-2xl font-extrabold">Admin sign in</h1>
                <p className="mt-1 text-sm text-white/60">Restricted area. Not linked from the site.</p>
              </div>
              <div className={`${card} animate-fade-in p-6 sm:p-7`}>
                <Credentials onSubmit={signIn} busy={busy} error={error} notice={notice} submitLabel="Sign in" />
                <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-ink-900/50">
                  <ShieldCheckIcon className="h-4 w-4" /> Sessions last 15 minutes, then you sign in again.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  // ---- signed in --------------------------------------------------------------------------------------
  const hero = (
    <PageHero eyebrow="Admin · not linked from the site" title="Configuration">
      Change how SendAnyFile behaves without touching the server. Every save asks for your ID and password again.
    </PageHero>
  );

  return (
    <Shell title="Admin" hero={hero}>
      <div className={`${wrap} py-10 sm:py-14`}>
        <div className="mx-auto max-w-3xl space-y-6">
          <div className={`${card} flex flex-wrap items-center justify-between gap-3 px-5 py-3`}>
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-brand-700"><UserIcon className="h-5 w-5" /></span>
              <div className="leading-tight">
                <p className="text-sm font-bold">{tokens.user.username}</p>
                <p className="text-xs capitalize text-ink-900/50">{tokens.user.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span title="Time left in this session" className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tabular-nums ${remaining < 120_000 ? "bg-red-50 text-red-600" : "bg-ink-900/5 text-ink-900/70"}`}>
                <ClockIcon className="h-4 w-4" /> {clock(remaining)}
              </span>
              <Link to="/admin/messages" className={`${ghostBtn} !py-1.5`}>
                Messages
                {config?.openMessages > 0 && (
                  <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">{config.openMessages}</span>
                )}
              </Link>
              <Link to="/admin/architecture" className={`${ghostBtn} !py-1.5`}>Architecture</Link>
              <Link to="/classic" className={`${ghostBtn} !py-1.5`}>Classic version</Link>
              <button type="button" onClick={() => logout()} className={`${ghostBtn} inline-flex items-center gap-1.5 !py-1.5`}>
                <ArrowRightOnRectangleIcon className="h-4 w-4" /> Sign out
              </button>
            </div>
          </div>

          {!config && !error && <p className="py-10 text-center text-sm text-ink-900/50">Loading settings…</p>}
          {error && !config && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>}

          {config && (
            <>
              {groups.map(([group, defs]) => (
                <section key={group} className={`${card} p-5 sm:p-6`}>
                  <h2 className="mb-1 font-display text-lg font-extrabold">{group}</h2>
                  <ul className="divide-y divide-ink-900/5">
                    {defs.map((d) => (
                      <li key={d.key} className="flex items-center justify-between gap-4 py-4">
                        <div className="min-w-0">
                          <p className="text-sm font-bold">
                            {d.label}
                            {draft[d.key] !== config.values[d.key] && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">unsaved</span>}
                          </p>
                          <p className="mt-0.5 text-xs text-ink-900/55">{d.description}</p>
                        </div>
                        <Control def={d} value={draft[d.key]} onChange={(v) => setDraft((x) => ({ ...x, [d.key]: v }))} />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}

              <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-xl bg-ink-950 px-4 py-3 text-white shadow-xl">
                <p className="text-sm text-white/70">{changedCount ? `${changedCount} unsaved change${changedCount > 1 ? "s" : ""}` : "No changes"}</p>
                <div className="flex gap-2">
                  {changedCount > 0 && (
                    <button type="button" onClick={() => setDraft(config.values)} className="rounded-xl px-3 py-2 text-sm font-semibold text-white/70 hover:text-white">Discard</button>
                  )}
                  <button type="button" disabled={!changedCount} onClick={() => { setError(""); setConfirming(true); }}
                    className="rounded-xl bg-brand px-5 py-2 text-sm font-bold text-ink-950 transition hover:bg-brand-400 disabled:opacity-40">
                    Save
                  </button>
                </div>
              </div>

              {config.audit?.length > 0 && (
                <section className={`${card} p-5 sm:p-6`}>
                  <h2 className="mb-3 font-display text-lg font-extrabold">Recent changes</h2>
                  <ul className="space-y-2 text-sm">
                    {config.audit.map((a) => (
                      <li key={a._id} className="flex flex-wrap items-baseline gap-x-3 text-ink-900/70">
                        <span className="font-mono text-xs text-ink-900/45">{when(a.createdAt)}</span>
                        {a.by && <span className="text-xs font-bold text-ink-900/60">{a.by}</span>}
                        <span>{a.changes.map((c) => `${config.definitions.find((d) => d.key === c.key)?.label || c.key}: ${show(c.from)} → ${show(c.to)}`).join(", ")}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>
      </div>

      {confirming && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink-950/70 p-4" role="dialog" aria-modal="true" aria-label="Confirm with ID and password">
          <div className={`${card} w-full max-w-sm animate-fade-in p-6`}>
            <div className="flex items-start justify-between">
              <div>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-100 text-brand-700"><Cog6ToothIcon className="h-5 w-5" /></span>
                <h2 className="mt-3 font-display text-xl font-extrabold">Confirm changes</h2>
                <p className="mb-4 mt-1 text-sm text-ink-900/60">Enter your ID and password to save {changedCount} change{changedCount > 1 ? "s" : ""}.</p>
              </div>
              <button type="button" onClick={() => setConfirming(false)} aria-label="Close" className={`${ghostBtn} !p-1.5`}><XMarkIcon className="h-5 w-5" /></button>
            </div>
            <Credentials onSubmit={save} busy={busy} error={error} submitLabel="Save changes" />
          </div>
        </div>
      )}
    </Shell>
  );
}
