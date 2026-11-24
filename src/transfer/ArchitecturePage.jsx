import { useEffect, useMemo, useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import Shell, { PageHero, card, ghostBtn, wrap } from "./Shell";
import {
  AUTH_POINTS, CODE_BACK, CODE_FRONT, DEPLOY, DOWNLOAD_STEPS, ENDPOINTS, FLOW_DOWNLOAD, FLOW_UPLOAD, JOBS,
  LIMITS_KNOWN, MODELS, PITCH, QA, SECURITY, STACK, TESTING, UPLOAD_STEPS,
} from "./architectureData";

// Internal documentation page for admins: /admin/architecture, behind the admin sign-in (see AdminOnly.jsx).
// The facts live in architectureData.js; keep them in sync when models, routes or limits change.

function Table({ head, rows, mono = true }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[34rem] text-left text-sm">
        <thead>
          <tr className="border-b border-ink-900/10 text-xs uppercase tracking-wider text-ink-900/50">
            {head.map((h) => <th key={h} className="py-2 pr-4 font-bold">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0] + r[1]} className="border-b border-ink-900/5 align-top last:border-0">
              {r.map((c, i) => (
                <td key={i} className={`py-2.5 pr-4 ${i === 0 && mono ? "font-mono text-[13px] font-semibold" : "text-ink-900/70"}`}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Section({ id, title, intro, children }) {
  return (
    <section id={id} className={`${card} scroll-mt-6 p-5 sm:p-7`}>
      <h2 className="font-display text-xl font-extrabold sm:text-2xl">{title}</h2>
      {intro ? <p className="mb-4 mt-1 max-w-3xl text-sm text-ink-900/60">{intro}</p> : <div className="h-3" />}
      {children}
    </section>
  );
}

// Numbered explanation list: [title, text].
function Steps({ items }) {
  return (
    <ol className="space-y-3">
      {items.map(([title, text], i) => (
        <li key={title} className="flex gap-3">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">{i + 1}</span>
          <div className="min-w-0">
            <p className="text-sm font-bold">{title}</p>
            <p className="mt-0.5 text-sm text-ink-900/70">{text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Flow({ children }) {
  return (
    <pre className="mb-5 overflow-x-auto rounded-xl bg-ink-950 p-4 font-mono text-[11.5px] leading-relaxed text-white/85 sm:text-xs">{children}</pre>
  );
}

const Box = ({ title, lines, dark }) => (
  <div className={`rounded-xl p-4 ${dark ? "bg-ink-950 text-white" : "bg-brand-50 ring-1 ring-brand-600/25"}`}>
    <p className={`text-sm font-extrabold ${dark ? "text-brand" : ""}`}>{title}</p>
    {lines.map((l) => <p key={l} className={`mt-1 text-xs ${dark ? "text-white/65" : "text-ink-900/65"}`}>{l}</p>)}
  </div>
);

const Arrow = ({ label }) => (
  <div className="flex flex-col items-center justify-center gap-0.5 py-1 text-ink-900/45 lg:py-0">
    <span className="text-[11px] font-semibold">{label}</span>
    <span className="text-lg leading-none lg:hidden">↓</span>
    <span className="hidden text-lg leading-none lg:block">→</span>
  </div>
);

// Interview questions: search across questions and answers, open one or all.
function Interview() {
  const [query, setQuery] = useState("");
  const [openAll, setOpenAll] = useState(false);
  const [version, setVersion] = useState(0); // remounts the <details> so "Expand/Collapse all" applies

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return QA.map((g) => ({
      ...g,
      items: q ? g.items.filter(([question, answer]) => (question + " " + answer).toLowerCase().includes(q)) : g.items,
    })).filter((g) => g.items.length);
  }, [query]);
  const count = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="relative min-w-[14rem] flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-900/35" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search questions, e.g. presigned, race, token"
            aria-label="Search interview questions"
            className="w-full rounded-xl bg-paper py-2 pl-9 pr-3 text-sm outline-none ring-1 ring-ink-900/10 focus:bg-white focus:ring-2 focus:ring-brand-600" />
        </label>
        <button type="button" onClick={() => { setOpenAll((o) => !o); setVersion((v) => v + 1); }} className={`${ghostBtn} !py-2 text-xs`}>
          {openAll ? "Collapse all" : "Expand all"}
        </button>
        <span className="text-xs text-ink-900/50">{count} question{count === 1 ? "" : "s"}</span>
      </div>

      <div className="space-y-6">
        {groups.map((g) => (
          <div key={g.group}>
            <h3 className="mb-2 font-display text-base font-extrabold">{g.group}</h3>
            <div className="space-y-2">
              {g.items.map(([question, answer]) => (
                <details key={question + version} open={openAll || undefined} className="group rounded-xl bg-paper ring-1 ring-ink-900/5 open:bg-white open:ring-brand-600/30">
                  <summary className="flex cursor-pointer list-none items-start gap-2 px-4 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                    <span className="mt-0.5 text-brand-700 transition group-open:rotate-90">▸</span>
                    <span>{question}</span>
                  </summary>
                  <p className="px-4 pb-4 pl-9 text-sm leading-relaxed text-ink-900/75">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        ))}
        {!count && <p className="text-sm text-ink-900/55">No question matches “{query}”.</p>}
      </div>
    </>
  );
}

export default function ArchitecturePage() {
  // Internal page: keep it out of search results.
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex,nofollow";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  const toc = [
    ["pitch", "In 1 minute"], ["stack", "Tech stack"], ["overview", "Big picture"], ["upload", "Upload flow"],
    ["download", "Download flow"], ["models", "Data models"], ["api", "API"], ["auth", "Admin & auth"],
    ["security", "Security"], ["jobs", "Background jobs"], ["code", "Code layout"], ["deploy", "Deployment"],
    ["limits", "Trade-offs"], ["testing", "Testing"], ["interview", "Interview Q&A"],
  ];

  const hero = (
    <PageHero eyebrow="Admin only" title="How SendAnyFile is built">
      Everything you need to understand and explain the project: how each part works, why it was designed that way,
      and the questions you are likely to be asked, with answers.
    </PageHero>
  );

  return (
    <Shell title="Architecture" hero={hero}>
      <div className={`${wrap} grid grid-cols-1 gap-6 py-10 lg:grid-cols-[200px_minmax(0,1fr)] lg:py-14`}>
        <nav aria-label="Sections" className="hidden lg:block">
          <ul className="sticky top-6 space-y-1 text-sm">
            {toc.map(([id, label]) => (
              <li key={id}><a href={`#${id}`} className="block rounded-lg px-3 py-1.5 font-semibold text-ink-900/60 hover:bg-white hover:text-ink-900">{label}</a></li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-6">
          <Section id="pitch" title="The project in one minute" intro="Say this first in an interview; every later answer builds on it.">
            <div className="space-y-3">
              {PITCH.map((p) => <p key={p} className="text-sm leading-relaxed text-ink-900/80">{p}</p>)}
            </div>
          </Section>

          <Section id="stack" title="Tech stack and why" intro="Every tool has a reason. Interviewers often ask 'why X and not Y'.">
            <Table head={["Technology", "Where", "Why"]} rows={STACK} />
          </Section>

          <Section id="overview" title="Big picture" intro="The server is the gatekeeper, not the pipe: it checks rules and hands out short-lived links; file bytes go between the browser and S3.">
            <div className="grid grid-cols-1 items-stretch gap-2 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
              <Box title="Browser (React app)" lines={["Pick files, show key/QR/link", "Uploads parts straight to S3", "Downloads straight from S3"]} />
              <Arrow label="JSON over HTTPS" />
              <Box dark title="API (Node + Express)" lines={["Checks rules, rate limits", "Signed links, download counting", "Admin, email, cleanup jobs"]} />
              <Arrow label="metadata / files" />
              <div className="grid gap-2">
                <Box title="MongoDB" lines={["transfers, pendinguploads, users", "authsessions, contactmessages, settings"]} />
                <Box title="Amazon S3 (private)" lines={["transfers/<uuid>.<ext>", "signed links only, auto-cleanup"]} />
              </div>
            </div>
            <p className="mt-4 text-sm text-ink-900/65">
              Without S3 (development), files are stored on local disk in uploads/transfers and go through the server. The same storage interface (save, read, remove) hides which one is used.
            </p>
          </Section>

          <Section id="upload" title="Upload flow (direct to S3)" intro="Three small calls to the server; the bytes go straight to S3. Every rule is still checked on the server.">
            <Flow>{FLOW_UPLOAD}</Flow>
            <Steps items={UPLOAD_STEPS} />
          </Section>

          <Section id="download" title="Download flow" intro="Viewing never counts; clicking counts once, atomically, then the file comes straight from S3.">
            <Flow>{FLOW_DOWNLOAD}</Flow>
            <Steps items={DOWNLOAD_STEPS} />
          </Section>

          <Section id="models" title="Data models (MongoDB)" intro="What each collection stores and why.">
            <div className="space-y-6">
              {MODELS.map((m) => (
                <div key={m.name}>
                  <h3 className="mb-1 font-display text-base font-extrabold">
                    {m.name} <span className="font-sans text-xs font-semibold text-ink-900/50">({m.file})</span>
                  </h3>
                  <Table head={["Field", "Type", "Meaning"]} rows={m.rows} />
                </div>
              ))}
            </div>
          </Section>

          <Section id="api" title="API" intro="All routes live under /api (plus the classic /files pages).">
            <Table head={["Method", "Path", "What it does"]} rows={ENDPOINTS} mono={false} />
          </Section>

          <Section id="auth" title="Admin sign-in and sessions" intro="One admin user, stored in the database. Short tokens, a fixed 15-minute session and server-checked sessions.">
            <Table head={["Topic", "How it works"]} rows={AUTH_POINTS} mono={false} />
          </Section>

          <Section id="security" title="Security and abuse protection" intro="Public site, no accounts: every threat below has a concrete control in the code.">
            <Table head={["Threat", "Protection"]} rows={SECURITY} mono={false} />
          </Section>

          <Section id="jobs" title="Background jobs and automatic cleanup">
            <Table head={["When", "What"]} rows={JOBS} mono={false} />
          </Section>

          <Section id="code" title="Code layout" intro="Where to look for each part.">
            <h3 className="mb-1 font-display text-base font-extrabold">Backend <span className="font-sans text-xs font-semibold text-ink-900/50">(file_share_app-backend)</span></h3>
            <Table head={["File", "Role"]} rows={CODE_BACK} />
            <h3 className="mb-1 mt-6 font-display text-base font-extrabold">Frontend <span className="font-sans text-xs font-semibold text-ink-900/50">(file_share_app-frontend-/src)</span></h3>
            <Table head={["File", "Role"]} rows={CODE_FRONT} />
          </Section>

          <Section id="deploy" title="Deployment (AWS)" intro="One server is enough because the file traffic goes to S3.">
            <Table head={["Part", "Setup"]} rows={DEPLOY} mono={false} />
          </Section>

          <Section id="limits" title="Trade-offs and known limits" intro="Saying these yourself shows you understand the design.">
            <Table head={["Limit", "Why / what next"]} rows={LIMITS_KNOWN} mono={false} />
          </Section>

          <Section id="testing" title="How it was tested">
            <Table head={["Kind", "What"]} rows={TESTING} mono={false} />
          </Section>

          <Section id="interview" title="Interview questions and answers" intro="Model answers in plain words. Read them, then practise saying them in your own words.">
            <Interview />
          </Section>
        </div>
      </div>
    </Shell>
  );
}
