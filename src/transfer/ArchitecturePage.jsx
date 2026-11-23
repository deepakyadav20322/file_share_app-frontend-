import { useEffect } from "react";
import Shell, { PageHero, card, wrap } from "./Shell";

// Internal documentation page for admins: /admin/architecture, behind the admin sign-in (see AdminOnly.jsx).
// Keep it in sync with the code when models, routes or env variables change.

const MODEL_TRANSFER = [
  ["key", "String", "6-digit share key. Indexed. Unique only among transfers that have not expired (checked in code)."],
  ["storage", "'local' | 's3'", "Which provider saved the files, so cleanup and downloads use the right one even if USE_S3 changes later."],
  ["files[]", "Array", "One entry per file: originalName, storageKey (name on disk / S3 key), size (bytes), mimeType, downloads (times served; a zip counts once per file). Emptied when the transfer is deleted."],
  ["fileCount", "Number", "Number of files. Survives deletion so public stats still work."],
  ["totalSize", "Number", "Sum of file sizes in bytes."],
  ["emailsSent", "Number", "How many link emails were sent for this transfer (capped at 3)."],
  ["maxDownloads", "Number", "How many times each file can be downloaded (1 to 5, chosen by the sender, default 1)."],
  ["expiresAt", "Date", "When the transfer stops working. Indexed. Set from the sender's chosen expiry."],
  ["deletedAt", "Date | null", "null while files exist. Set by the cleanup job when the files are removed. The row itself is kept."],
  ["createdAt / updatedAt", "Date", "Added automatically by Mongoose timestamps."],
];

const MODEL_FILE = [
  ["filename", "String", "Original file name."],
  ["path", "String", "Path on local disk (uploads/...)."],
  ["size", "Number", "Size in bytes."],
  ["uuid", "String", "Random id used in the share link /files/:uuid."],
  ["sender / receiver", "String", "Optional e-mail addresses, filled when the link is e-mailed."],
  ["createdAt / updatedAt", "Date", "Timestamps. The daily cron uses createdAt to find files older than 24 h."],
];

const ENDPOINTS = [
  ["GET", "/api/transfer/config", "Limits and expiry options for the UI (read from .env)."],
  ["POST", "/api/transfer", "Upload files (multipart) with expiryMinutes. Returns key + expiry."],
  ["GET", "/api/transfer/:key", "Transfer details: file list, sizes, expiry. 404 if expired or unknown."],
  ["GET", "/api/transfer/:key/files/:index", "Stream one file."],
  ["GET", "/api/transfer/:key/zip", "Stream all files as one zip (built on the fly, nothing stored)."],
  ["POST", "/api/transfer/:key/email", "E-mail the share link. Max 3 per transfer."],
  ["GET", "/api/stats", "Public counters. ?fresh=1 skips the 30 s cache (throttled to once per 3 s)."],
  ["POST", "/api/auth/login", "Sign in with username + password. Returns a 5-minute access token and a refresh token. 403 wrong, 429 locked out."],
  ["POST", "/api/auth/refresh", "Swap the refresh token for a new pair (rotates; reuse of an old one ends the session). Never extends the 15-minute session."],
  ["POST", "/api/auth/logout", "Ends the session."],
  ["GET/PUT", "/api/admin/config", "Admin settings (e-mail on/off, contact on/off, pause uploads). Needs an admin access token (Bearer); saving also re-checks ID and password. 401 without a valid token, 403 when wrong."],
  ["GET/PATCH", "/api/admin/messages", "Contact messages for admins: list with topic/status filters, mark done with a note, or open again."],
  ["POST", "/api/contact", "Contact form. Honeypot field, 5 per hour per IP."],
  ["POST/GET", "/api/files, /files/:uuid, /files/download/:uuid", "Classic flow, kept as it was."],
];

const ENV = [
  ["MAX_FILES / MAX_FILE_SIZE_MB / MAX_TOTAL_SIZE_MB", "Upload limits (default 5 / 20 / 100). One place, read by config/limits.js."],
  ["TRANSFER_EXPIRY_MINUTES, TRANSFER_EXPIRY_OPTIONS_MINUTES, MAX_EXPIRY_MINUTES", "Default expiry (10), preset chips (5,10,30) and the longest allowed (1440)."],
  ["USE_S3 + S3_BUCKET, S3_REGION, AWS_*, S3_ENDPOINT, S3_PREFIX", "false = local disk. true = S3 (or any S3-compatible store)."],
  ["MONGO_CONNECTION_URL, ALLOWED_CLIENTS, FRONTEND_URL", "Database, CORS origins, base URL used in e-mailed links."],
  ["MAIL_USER / SMTP settings, CONTACT_EMAIL", "Sender account for e-mails and where contact messages are delivered."],
  ["ADMIN_ID, ADMIN_SECRET", "Create the first admin user (once). The password is then stored only as a scrypt hash."],
  ["JWT_ACCESS_SECRET", "Signs access tokens (32+ random characters)."],
  ["ACCESS_TOKEN_MINUTES, SESSION_MINUTES", "Access token life (default 5) and total session length (default 15; refresh never extends it)."],
  ["VITE_API_URL, VITE_DEFAULT_HOME", "Frontend: backend address, and whether / opens /transfer or /classic."],
];

const STEPS = [
  ["Pick files", "The browser checks count and size against limits from /transfer/config. The sender also picks an expiry."],
  ["Upload", "POST /api/transfer. Multer holds the files in memory, the route re-checks every limit, then hands them to the storage provider."],
  ["Store", "The provider writes each file under a random name (disk: uploads/transfers, S3: bucket + prefix). Nothing user-controlled becomes a path."],
  ["Record", "A Transfer document is created with a fresh 6-digit key and expiresAt. The key is returned with the share link."],
  ["Receive", "Receiver enters the key or opens the link. The key lookup only matches transfers where expiresAt is in the future."],
  ["Expire", "Every minute node-cron finds expired, not yet deleted transfers, removes their files from storage and sets deletedAt."],
  ["Count", "The row stays (without file names) and feeds the public /transparency numbers."],
];

const FOLDERS_BACK = [
  ["server.js", "Express setup: CORS, trust proxy, mounts routes, starts cron jobs, connects MongoDB."],
  ["config/limits.js", "Every limit and expiry option, read from .env."],
  ["routes/transfer.js", "The whole new flow: upload, lookup, download, zip, e-mail."],
  ["routes/stats.js · contact.js", "Public counters and the contact form."],
  ["routes/files.js · show.js · download.js", "Classic flow."],
  ["models/transfer.js · file.js", "Mongoose schemas (see Data models)."],
  ["services/storage/", "index.js picks the provider; local.js and s3.js both expose save / stream / remove."],
  ["services/transferCleanup.js", "Per-minute job that deletes files and flags rows."],
  ["services/rateLimit.js", "Small in-memory limiter per IP (resets on restart)."],
  ["services/mailService.js", "Nodemailer wrapper, supports replyTo."],
];

const FOLDERS_FRONT = [
  ["AppRouter.jsx", "Routes: /transfer, /receive/:key, /about, /transparency, /contact, /privacy, /terms, /classic, /admin/config and /admin/architecture (this page, admin only)."],
  ["transfer/Shell.jsx", "Shared layout: dark header + nav, content area, footer, plus shared button and card styles."],
  ["transfer/TransferPage.jsx", "Home. Hero, SendPanel, ReceivePanel, live strip and info sections."],
  ["transfer/SendPanel.jsx · ExpiryPicker.jsx · ResultPanel.jsx", "Select files, choose expiry, show key + QR + link."],
  ["transfer/ReceivePanel.jsx · ReceivePage.jsx", "Enter a key, then list and download files or the zip."],
  ["transfer/api.js", "All HTTP calls and small helpers (formatting, copy)."],
  ["transfer/useStats.js · useCountdown.js · CountUp.jsx", "Reusable hooks and the animated number."],
  ["App.jsx (+ components/)", "The original page, untouched, served at /classic."],
];

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
            <tr key={r[0]} className="border-b border-ink-900/5 align-top last:border-0">
              {r.map((c, i) => (
                <td key={i} className={`py-2.5 pr-4 ${i === 0 && mono ? "font-mono text-[13px] font-semibold" : i === 1 && mono && r.length === 3 && head[1] === "Type" ? "font-mono text-[13px] text-brand-700" : "text-ink-900/70"}`}>{c}</td>
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
      {intro && <p className="mb-4 mt-1 max-w-3xl text-sm text-ink-900/60">{intro}</p>}
      {!intro && <div className="h-3" />}
      {children}
    </section>
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
    ["overview", "Big picture"], ["lifecycle", "Life of a transfer"], ["models", "Data models"], ["api", "API"],
    ["storage", "Storage"], ["jobs", "Background jobs"], ["code", "Code layout"], ["config", "Configuration"], ["security", "Safety"],
  ];

  const hero = (
    <PageHero eyebrow="Admin only" title="How SendAnyFile is built">
      Stack, data model, request flow and cleanup. Everything here reflects the code as it is today.
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
          <Section id="overview" title="Big picture" intro="A React single-page app talks to an Express API. The API keeps metadata in MongoDB and file bytes in a storage provider (local disk or S3).">
            <div className="grid grid-cols-1 items-stretch gap-2 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
              <Box title="Browser (React)" lines={["React 18 · Vite · Tailwind", "react-router, axios", "No file ever touches the DB"]} dark />
              <Arrow label="HTTPS / JSON + multipart" />
              <Box title="API (Express)" lines={["Multer (memory), archiver (zip)", "node-cron, nodemailer", "In-memory rate limiter"]} />
              <Arrow label="Mongoose / provider" />
              <div className="grid gap-2">
                <Box title="MongoDB" lines={["transfers (new flow)", "files (classic flow)"]} dark />
                <Box title="Storage" lines={["uploads/transfers (local)", "or S3 bucket (USE_S3=true)"]} dark />
              </div>
            </div>
            <p className="mt-4 text-sm text-ink-900/60">
              Metadata and bytes are deliberately separate. The database only knows <em>where</em> a file is, so storage can move to S3 without any schema change.
            </p>
          </Section>

          <Section id="lifecycle" title="Life of a transfer" intro="From the first click to the public counter.">
            <ol className="space-y-3">
              {STEPS.map(([t, d], i) => (
                <li key={t} className="flex gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand font-display text-sm font-extrabold text-ink-950">{i + 1}</span>
                  <p className="text-sm text-ink-900/70"><b className="text-ink-900">{t}.</b> {d}</p>
                </li>
              ))}
            </ol>
          </Section>

          <Section id="models" title="Data models" intro="MongoDB collections for transfers, admin sign-in and contact messages.">
            <h3 className="mb-1 font-display text-base font-extrabold">transfers <span className="font-sans text-xs font-semibold text-ink-900/50">(models/transfer.js · new flow)</span></h3>
            <Table head={["Field", "Type", "Meaning"]} rows={MODEL_TRANSFER} />

            <h3 className="mb-1 mt-6 font-display text-base font-extrabold">users <span className="font-sans text-xs font-semibold text-ink-900/50">(models/user.js)</span></h3>
            <Table head={["Field", "Type", "Meaning"]} rows={[["username", "String, unique", "Sign-in ID, lower case."], ["passwordHash", "String", "scrypt hash with its own random salt. The password itself is never stored."], ["role", "admin | user", "Admin routes need admin."], ["disabled", "Boolean", "Blocks sign-in and live sessions."]]} />
            <h3 className="mb-1 mt-6 font-display text-base font-extrabold">authsessions <span className="font-sans text-xs font-semibold text-ink-900/50">(models/authSession.js)</span></h3>
            <Table head={["Field", "Type", "Meaning"]} rows={[["userId", "ObjectId", "Owner of the session."], ["refreshHash", "String", "SHA-256 of the current refresh token (the token itself is not stored)."], ["prevRefreshHash", "String", "The previous token; seeing it again means theft, so the session is revoked."], ["expiresAt", "Date", "Fixed end of the session (15 minutes). A TTL index removes the row afterwards."], ["revokedAt", "Date", "Set on sign-out or reuse detection."]]} />
            <h3 className="mb-1 mt-6 font-display text-base font-extrabold">contactmessages <span className="font-sans text-xs font-semibold text-ink-900/50">(models/contactMessage.js)</span></h3>
            <Table head={["Field", "Type", "Meaning"]} rows={[["topic", "Question | Feedback | Remove a file | Report abuse", "Chosen on the Contact page."], ["name, email, message", "String", "What the visitor wrote."], ["fileKey", "String", "6-digit key for Remove a file / Report abuse."], ["status", "open | done", "Set by an admin on /admin/messages."], ["doneAt, doneBy, doneNote", "Date, String, String", "Who closed it, when, and an optional note."], ["createdAt", "Date", "A TTL index deletes messages after 12 months."]]} />

            <div className="mt-5 rounded-xl bg-paper p-4 text-xs text-ink-900/70 ring-1 ring-ink-900/5">
              <p className="mb-2 font-bold text-ink-900">Example document after deletion</p>
              <pre className="overflow-x-auto font-mono text-[12px] leading-relaxed">{`{
  key: "482917",   storage: "local",
  files: [],       fileCount: 2,      totalSize: 14336,
  emailsSent: 1,
  expiresAt: 2026-11-14T10:10:00Z,
  deletedAt: 2026-11-14T10:10:41Z,   // files are gone, row stays
  createdAt: 2026-11-14T10:00:00Z
}`}</pre>
            </div>

            <h3 className="mb-1 mt-8 font-display text-base font-extrabold">files <span className="font-sans text-xs font-semibold text-ink-900/50">(models/file.js · classic flow)</span></h3>
            <Table head={["Field", "Type", "Meaning"]} rows={MODEL_FILE} />
            <p className="mt-3 text-xs text-ink-900/55">The classic cron deletes the file from disk and then the record. The new flow keeps the record on purpose (for statistics).</p>
          </Section>

          <Section id="api" title="API" intro="All routes live under /api. Lookups (key, files, zip) are rate-limited to 30 per minute per IP.">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[34rem] text-left text-sm">
                <tbody>
                  {ENDPOINTS.map(([m, p, d]) => (
                    <tr key={p} className="border-b border-ink-900/5 align-top last:border-0">
                      <td className="py-2.5 pr-3"><span className={`rounded-md px-1.5 py-0.5 font-mono text-[11px] font-bold ${m === "GET" ? "bg-brand-100 text-brand-700" : "bg-ink-900 text-white"}`}>{m}</span></td>
                      <td className="py-2.5 pr-4 font-mono text-[13px] font-semibold">{p}</td>
                      <td className="py-2.5 text-ink-900/70">{d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="storage" title="Storage" intro="One small interface, two implementations.">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Box title="local (default)" lines={["Files in uploads/transfers under random names.", "Removed with fs.unlink by the cleanup job."]} />
              <Box title="s3 (USE_S3=true)" lines={["Objects under S3_BUCKET / S3_PREFIX.", "SDK is loaded lazily, so local installs never need it."]} />
            </div>
            <p className="mt-4 text-sm text-ink-900/60">
              Each transfer stores which provider saved it, so switching the flag only affects <em>new</em> transfers. Old ones are still read and cleaned from where they live.
              Uploads are buffered in memory before saving, so peak RAM is about the total upload size (up to 100 MB).
            </p>
          </Section>

          <Section id="jobs" title="Background jobs">
            <Table mono={false} head={["Job", "When", "What it does"]} rows={[
              ["Transfer cleanup", "Every minute", "Finds transfers with expiresAt in the past and deletedAt null. Removes files from storage, empties files[], sets deletedAt."],
              ["Classic cleanup", "Daily", "Deletes classic files older than 24 h from disk and DB, and sweeps stray top-level files in uploads/."],
            ]} />
            <p className="mt-3 text-xs text-ink-900/55">A key is already invalid the moment expiresAt passes. The job only reclaims space, so a short delay is harmless.</p>
          </Section>

          <Section id="code" title="Code layout">
            <h3 className="mb-1 font-display text-base font-extrabold">Backend</h3>
            <Table mono={false} head={["Path", "Role"]} rows={FOLDERS_BACK} />
            <h3 className="mb-1 mt-6 font-display text-base font-extrabold">Frontend</h3>
            <Table mono={false} head={["Path", "Role"]} rows={FOLDERS_FRONT} />
          </Section>

          <Section id="config" title="Configuration" intro="Behaviour is changed in .env, not in code.">
            <Table mono={false} head={["Variable", "Purpose"]} rows={ENV} />
          </Section>

          <Section id="security" title="Safety measures and known limits">
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-ink-900/70">
              <li>Random file names on disk; the original name is cleaned (no path parts, control or direction-override characters) before it is stored or sent.</li>
              <li>Wrong-key lockout per IP, a site-wide burst guard, and an upload cap per IP, concurrent-upload and zip gates, a total disk cap, a per-file download limit (1 to 5) and an executable-type blocklist (all in .env).</li>
              <li>E-mails always go out from SendAnyFile&apos;s own address (the visitor&apos;s address is only Reply-To), values are HTML-escaped, and there are per-IP, per-recipient and daily mail budgets.</li>
              <li>Strict CORS allow-list, security headers, JSON-only errors (no stack traces), request timeouts, and downloads are always sandboxed attachments.</li>
              <li>Takedown: <code>node scripts/remove-transfer.js &lt;key&gt;</code> removes a reported transfer immediately.</li>
              <li>Limits are enforced on the server, not just in the UI (count, per-file, total, expiry range).</li>
              <li>Per-IP rate limits on key lookups, e-mails and the contact form; a honeypot field on the contact form.</li>
              <li>Public stats expose counts only: no keys, names or contents.</li>
              <li><b>Limits:</b> files are not end-to-end encrypted; the 6-digit key space is small, so short expiry and rate limiting are the protection; the rate limiter is in memory (resets on restart, per server instance); uploads use RAM.</li>
            </ul>
          </Section>
        </div>
      </div>
    </Shell>
  );
}
