// Content of the admin Architecture page (/admin/architecture). Kept apart from the page layout so the
// facts are easy to update when the code changes. Everything here describes the code as it is.

export const PITCH = [
  "SendAnyFile is a file-sharing web app: you drop up to 5 files (20 MB each, 100 MB total), get a 6-digit key, QR code and link, and the receiver downloads with that key. Files delete themselves after the chosen time (5 min to 24 h) or after the allowed number of downloads (1 to 5). No sign-up.",
  "It is a React single-page app (Vite, Tailwind) talking to a Node.js + Express API. Metadata lives in MongoDB; file bytes live in Amazon S3 (or on local disk in development).",
  "The key design idea: the server is the gatekeeper, not the pipe. Browsers upload straight to S3 with short-lived signed links and download straight from S3 the same way. The server only checks rules, counts downloads and hands out links, so it stays light no matter how many people send at once.",
];

export const STACK = [
  ["React 18 + Vite", "Frontend", "Fast dev server and small production build; component model fits the pages (send, receive, admin)."],
  ["Tailwind CSS", "Frontend", "Design tokens (brand green, ink colours) in one config; no separate CSS files to keep in sync."],
  ["React Router 6", "Frontend", "Single-page routes such as /transfer, /receive/:key, /admin/*; lazy-loads the admin-only Architecture page."],
  ["axios", "Frontend", "HTTP calls with upload progress events and cancellation (AbortController)."],
  ["Node.js 20 + Express 4", "Backend", "Simple, well-known HTTP framework; streaming fits file downloads and zips."],
  ["MongoDB + Mongoose", "Backend", "Flexible documents (a transfer holds its files array); atomic updates for download counting; TTL indexes for automatic expiry of sessions and messages."],
  ["Amazon S3 (+ presigned URLs)", "Storage", "Cheap, durable object storage; signed links let browsers upload/download directly without AWS keys."],
  ["jsonwebtoken + scrypt (Node crypto)", "Admin auth", "Short-lived JWT access tokens; passwords stored only as salted scrypt hashes."],
  ["nodemailer", "Email", "Sends the share-link email and the contact-form copy through SMTP."],
  ["node-cron", "Jobs", "Cleanup every minute (expired transfers), every 10 minutes (unfinished uploads), daily (classic files)."],
  ["archiver", "Downloads", "Builds the 'Download all' zip as a stream, nothing stored."],
  ["nginx + pm2 on EC2", "Hosting", "nginx: HTTPS, serves the built frontend, proxies /api; pm2 keeps Node running and restarts it."],
];

export const UPLOAD_STEPS = [
  ["Pick files", "SendPanel checks count and sizes in the browser first (quick feedback), then the server checks everything again (the real check)."],
  ["1. Start  POST /api/transfer/direct/start", "Browser sends only the file list (name, size, type), expiry and download limit. Server checks: uploads switched on, max 5 files, 20 MB each, 100 MB total, blocked types (.exe…), empty files, expiry range, downloads 1-5, storage room, 20 uploads/hour per IP. For each file it starts an S3 multipart upload and creates one signed PUT link per 5 MB part (valid 30 min). It saves a PendingUpload record holding only the SHA-256 of a random upload token, and returns the token + links."],
  ["2. Upload parts straight to S3", "The browser cuts each file into 5 MB parts and PUTs them to the signed links, 4 at a time. A failed part is retried up to 3 times. The progress bar counts real bytes reaching S3. The server sees none of these bytes."],
  ["3. Complete  POST /api/transfer/direct/complete", "Server takes the PendingUpload with findOneAndDelete (so the same token can never create two transfers), asks S3 for the list of parts and checks every part size matches the declared file, joins the parts, checks the final object size with HEAD, then creates the Transfer with a fresh 6-digit key. Any mismatch: files deleted, request refused."],
  ["Result", "The sender gets key, link and QR. The expiry timer starts now."],
  ["Cancel / closed tab", "Cancel calls /direct/abort (S3 throws the parts away). A closed tab leaves a PendingUpload; a job aborts anything older than 2 hours, and an S3 lifecycle rule removes incomplete uploads after 1 day as a backup."],
  ["Fallback", "If S3 cannot be reached from the browser at all (for example the bucket CORS rule is missing), the page aborts and sends the files through the server instead (POST /api/transfer, multer). Local-disk mode always uses this path."],
];

export const DOWNLOAD_STEPS = [
  ["Open /receive/123456", "GET /api/transfer/:key returns files, sizes, expiry and downloads left. Only active transfers (expiresAt in the future) are found. Opening or refreshing never counts a download."],
  ["Click Download", "GET /api/transfer/:key/files/:i. The server counts the download with one atomic MongoDB update that only succeeds while downloads are left, so parallel clicks cannot go over the limit."],
  ["S3 mode", "Server answers 302 with a signed S3 GET link valid 30 seconds, forced to 'save as' with the real file name (Content-Disposition attachment). The browser downloads straight from S3."],
  ["Local mode", "Server streams the file from disk in chunks (no full copy in memory) with nosniff and a sandbox CSP."],
  ["Download all (.zip)", "Counts every file once (atomic), then builds the zip as a stream through the server with archiver. Max 4 zips at once, 6 per minute per IP."],
  ["HEAD requests", "Link checkers and download managers sometimes send HEAD first. HEAD gets the size and type but never counts a download."],
];

export const FLOW_UPLOAD = `BROWSER                          SERVER (Express)                         S3
   │── file list, expiry, limit ──▶│ check rules, rate limit, room            │
   │                               │── create multipart upload ─────────────▶│
   │◀── token + signed part links ─│  save PendingUpload (token hash only)    │
   │══════════ 5 MB parts, 4 at a time, retried ═══════════════════════════▶│
   │── "done" + token ────────────▶│── list parts, check sizes ─────────────▶│
   │                               │── complete + HEAD (final size) ────────▶│
   │◀── key + link + QR ───────────│  create Transfer (6-digit key)           │`;

export const FLOW_DOWNLOAD = `RECEIVER                         SERVER                                   S3
   │── GET /api/transfer/123456 ──▶│ active? → files, sizes, downloads left   │
   │── click: /files/0 ───────────▶│ atomic count (only if downloads left)    │
   │◀── 302 signed link (30 s) ────│                                          │
   │═════════════════ file bytes, saved as real name ═══════════════════════│`;

export const MODELS = [
  {
    name: "transfers",
    file: "models/transfer.js",
    rows: [
      ["key", "String (6 digits)", "Unique among active transfers; random from crypto.randomInt."],
      ["storage", "local | s3", "Where the bytes are, so switching USE_S3 never orphans old files."],
      ["files[]", "originalName, storageKey, size, mimeType, downloads", "storageKey is a UUID + safe extension (the real name is never used as a path). downloads counts per file."],
      ["fileCount, totalSize", "Number", "Kept after deletion for public statistics."],
      ["maxDownloads", "1..5", "Chosen by the sender (default 1)."],
      ["emailsSent", "Number", "Max 3 share emails per transfer."],
      ["expiresAt", "Date", "Lookups only find transfers whose expiresAt is in the future."],
      ["deletedAt", "Date | null", "Set by cleanup; files[] is emptied, the row stays for stats."],
    ],
  },
  {
    name: "pendinguploads",
    file: "models/pendingUpload.js",
    rows: [
      ["tokenHash", "String (unique)", "SHA-256 of the upload token; the token itself is never stored."],
      ["files[]", "name, size, mimeType, storageKey, uploadId", "The S3 multipart upload for each file."],
      ["totalSize, expiryMinutes, maxDownloads", "", "Copied into the Transfer on complete."],
      ["createdAt", "Date", "Older than 2 hours: aborted by the cleanup job."],
    ],
  },
  {
    name: "users",
    file: "models/user.js",
    rows: [
      ["username", "String (unique, lower case)", "Admin sign-in ID."],
      ["passwordHash", "scrypt$N$r$p$salt$hash", "Salted scrypt (N=32768, r=8, p=1, 64-byte key). No plain password anywhere."],
      ["role", "admin | user", "Admin routes need role admin."],
      ["disabled, lastLoginAt", "", "A disabled user cannot sign in and live sessions stop working."],
    ],
  },
  {
    name: "authsessions",
    file: "models/authSession.js",
    rows: [
      ["userId", "ObjectId", "Owner."],
      ["refreshHash / prevRefreshHash", "String", "SHA-256 of the current and previous refresh token (rotation + reuse detection)."],
      ["expiresAt", "Date (TTL index)", "Fixed end of the session (15 min). Refresh never extends it; MongoDB removes the row afterwards."],
      ["revokedAt", "Date | null", "Set on sign-out or when an old refresh token is reused."],
    ],
  },
  {
    name: "contactmessages",
    file: "models/contactMessage.js",
    rows: [
      ["topic", "Question | Feedback | Remove a file | Report abuse", "Chosen on the Contact page."],
      ["name, email, message, ip", "String", "What the visitor wrote; IP for spotting abuse."],
      ["fileKey", "6 digits", "Required for Remove a file and Report abuse."],
      ["status, doneAt, doneBy, doneNote", "", "Handled on /admin/messages."],
      ["createdAt", "Date (TTL 12 months)", "Deleted automatically after a year."],
    ],
  },
  {
    name: "settings, adminaudits",
    file: "models/setting.js, models/adminAudit.js",
    rows: [
      ["settings.app", "emailEnabled, contactEnabled, uploadsEnabled", "Runtime switches changed from /admin/config without a restart."],
      ["adminaudits", "by, ip, changes[{key, from, to}]", "Who changed which switch; kept 90 days (TTL)."],
    ],
  },
  {
    name: "files (classic)",
    file: "models/file.js",
    rows: [["uuid, filename, path, size, sender, receiver", "", "Old one-link flow at /classic. Deleted after 24 hours by the daily job."]],
  },
];

export const ENDPOINTS = [
  ["GET", "/api/transfer/config", "Limits and switches for the frontend (max files, sizes, expiry options, features, directUpload)."],
  ["POST", "/api/transfer/direct/start", "S3 mode: check the file list, start multipart uploads, return signed part links + upload token."],
  ["POST", "/api/transfer/direct/complete", "Check every part in S3, join, verify size, create the transfer and key."],
  ["POST", "/api/transfer/direct/abort", "Cancel an unfinished direct upload."],
  ["POST", "/api/transfer", "Upload through the server (local mode, or fallback). multer, in memory, max 4 at once."],
  ["GET", "/api/transfer/progress/:id", "Server-path S3 save progress (used only by the fallback path)."],
  ["GET", "/api/transfer/:key", "Transfer info for the receive page. Wrong keys count towards the guessing lockout."],
  ["GET/HEAD", "/api/transfer/:key/files/:i", "Download one file: atomic count, then 302 to a 30-second signed S3 link (or a stream in local mode). HEAD never counts."],
  ["GET", "/api/transfer/:key/zip", "All files as one streamed zip (counts every file)."],
  ["POST", "/api/transfer/:key/email", "Email the link (from our own address, Reply-To the sender, max 3 per transfer)."],
  ["GET", "/api/stats", "Public numbers for Live stats (cached 30 s)."],
  ["POST", "/api/contact", "Contact form: saved in MongoDB and emailed to the owner."],
  ["POST", "/api/auth/login · /refresh · /logout", "Admin sign-in, token refresh (rotation), sign-out."],
  ["GET", "/api/auth/me", "Who is signed in (used to confirm the admin role)."],
  ["GET/PUT", "/api/admin/config", "Admin switches. PUT also needs ID + password again (step-up)."],
  ["GET/PATCH", "/api/admin/messages", "List contact messages with filters; mark done with a note or reopen."],
  ["POST", "/api/admin/messages/:id/delete-transfer", "Delete the files of the transfer named in a message, at once."],
  ["*", "/api/files, /files/:uuid, /files/download/:uuid", "Classic one-link flow (kept for /classic)."],
];

export const AUTH_POINTS = [
  ["Password storage", "Only a salted scrypt hash. scrypt is slow on purpose (and memory-hard), so stolen hashes are very expensive to crack."],
  ["Sign-in password", "Base password + DDHHmm in IST (e.g. secret + 241535), accepted for the current minute ±1. Only the base part is compared with the hash, in constant time. Switch off with LOGIN_TIME_SUFFIX=false."],
  ["Unknown user", "A dummy hash is still checked, so a wrong username takes as long as a wrong password (no username probing by timing)."],
  ["Lockout", "5 wrong tries per IP or 20 site-wide in 15 minutes → 429 for 15 minutes; every failure waits 600 ms."],
  ["Access token", "JWT (HS256, issuer + audience checked, algorithm pinned) valid 5 minutes, holds user id, role and session id."],
  ["Refresh token", "32 random bytes, stored only as SHA-256. Every refresh returns a new pair (rotation). Using an old refresh token again revokes the whole session (theft detection)."],
  ["Session", "Absolute 15 minutes from sign-in. Refresh never extends it; after 15 minutes every token is dead."],
  ["Every admin request", "Valid JWT AND live session in the database AND active user AND role admin. Sign-out takes effect at once."],
  ["Step-up", "Saving settings asks for ID + password again on top of the token."],
  ["Browser side", "Tokens in sessionStorage (gone when the tab closes), sent in the Authorization header (no cookies, so no CSRF). Renewed 20 s before expiry."],
];

export const SECURITY = [
  ["Guessing 6-digit keys", "Only failed lookups count: 10 wrong keys per IP in 10 minutes → locked. Site-wide burst (120 wrong/min): IPs that already failed are blocked; 240/min: everyone waits a minute. Keys also expire quickly."],
  ["Downloading past the limit", "Atomic conditional update in MongoDB; tested with 10 parallel clicks → exactly 1 succeeds. Signed links last 30 s and are never shown on a page."],
  ["Upload lies (declared 1 MB, sent 50 MB)", "Every part size is checked in S3 before joining, and the final size is checked again. Mismatch → files deleted."],
  ["Malware types", "Blocked extensions (.exe, .bat, .ps1, .dll …) refused on every upload path."],
  ["Script tricks via files", "Downloads are always attachments; streamed downloads send nosniff + CSP sandbox; file names are cleaned; stored names are UUIDs."],
  ["Filling the disk / memory", "Size caps, storage cap (5 GB default), 20 uploads/hour per IP, max 4 server-path uploads and 4 zips at once, JSON bodies max 10 KB, slow-client timeouts."],
  ["Email abuse / spoofing", "Mail always comes from our own address (visitor only in Reply-To); 3 per transfer, 10/hour per IP, 3/hour per recipient, 300/day; values HTML-escaped; admin switch."],
  ["Contact spam", "Hidden honeypot field, 5/hour per IP, 100/day site-wide, admin switch."],
  ["Other websites calling the API", "CORS allows only the real frontend origins (ALLOWED_CLIENTS)."],
  ["Clickjacking, leaks", "X-Frame-Options DENY, Referrer-Policy no-referrer (keys live in URLs), Permissions-Policy, HSTS on HTTPS, API responses no-store."],
  ["Error details", "Unknown routes and errors answer short JSON; no stack traces or paths. Unhandled promise errors are logged, not fatal."],
  ["Admin panel", "Hidden route, hashed passwords, lockouts, short tokens, server-checked sessions, step-up on save, audit log."],
  ["AWS keys", "On EC2 an IAM role gives temporary credentials; no keys in code or .env. The bucket stays private."],
];

export const JOBS = [
  ["Every minute", "Expired transfers: files deleted from S3/disk, files[] emptied, deletedAt set. The row stays so statistics survive."],
  ["Every 10 minutes", "Direct uploads started more than 2 hours ago and never completed: S3 multipart uploads aborted, records removed."],
  ["Daily 00:00", "Classic flow: files older than 24 hours deleted from disk and database; stray files swept."],
  ["MongoDB TTL", "Auth sessions after their end, contact messages after 12 months, admin audit after 90 days."],
  ["S3 lifecycle (AWS)", "Safety net: incomplete multipart uploads removed after 1 day; transfers/ objects after 1 day."],
];

export const CODE_BACK = [
  ["server.js", "App setup: CORS, security headers, routes, admin seeding, cleanup jobs, error handler, timeouts."],
  ["routes/transfer.js", "Upload (direct + server path), info, download, zip, email."],
  ["routes/auth.js · routes/admin.js", "Admin sign-in/refresh/sign-out; settings, messages, delete transfer."],
  ["routes/contact.js · routes/stats.js", "Contact form; public statistics."],
  ["services/storage/{index,local,s3}.js", "One storage interface (save, read, remove, signed links), two implementations."],
  ["services/auth.js · password.js", "Tokens, sessions, lockouts, step-up; scrypt hashing."],
  ["services/abuseGuard.js · rateLimit.js · capacity.js", "Key-guess lockout, concurrency gates, mail budgets, safe names; rate limiters; storage room."],
  ["services/transferCleanup.js", "Expiry cleanup, stale upload cleanup, removeTransfer (also used by admin delete)."],
  ["services/settings.js", "Admin switches (definitions, validation, cached load)."],
  ["config/limits.js", "Every limit in one place, read from .env."],
  ["scripts/set-admin-password.js", "Change an admin password (hashes it, ends all sessions)."],
];

export const CODE_FRONT = [
  ["AppRouter.jsx · ScrollManager.jsx", "Routes; scroll to top on page change, smooth scroll for #section links."],
  ["transfer/TransferPage.jsx · SendPanel.jsx · ResultPanel.jsx", "Home, file picking (drag & drop anywhere, paste), progress, cancel, key/QR/link."],
  ["transfer/ReceivePage.jsx · ReceivePanel.jsx", "Enter a key; list files, expiry, downloads left; download one or all."],
  ["transfer/api.js", "All API calls; direct-to-S3 upload with parallel parts, retries and fallback."],
  ["transfer/adminSession.js · AdminOnly.jsx", "Admin tokens (sessionStorage), automatic refresh, admin-only route guard."],
  ["transfer/AdminConfigPage.jsx · AdminMessagesPage.jsx · ArchitecturePage.jsx", "Admin pages."],
  ["public/manifest.webmanifest · sw.js", "Installable app (PWA); service worker keeps the app shell offline, never caches /api."],
];

export const DEPLOY = [
  ["EC2 (Ubuntu, ap-south-1)", "One instance, same region as the S3 bucket. Security group: 22 from my IP only, 80/443 from anywhere."],
  ["nginx", "HTTPS (Let's Encrypt via certbot), serves the built frontend, proxies /api and /files to Node on 127.0.0.1:3000, client_max_body_size 110m, SPA fallback (try_files → index.html) so refresh on /receive/123456 works."],
  ["pm2", "Runs server.js, restarts on crash and on reboot."],
  ["MongoDB Atlas", "Managed database; network access limited to the server's Elastic IP."],
  ["S3 bucket", "Private. CORS allows PUT from the site (direct upload). Lifecycle rules as a safety net. IAM role on EC2: Put/Get/Delete/AbortMultipartUpload/ListMultipartUploadParts on transfers/*."],
  ["Domain", "sendanyfile.xyz (Namecheap) → A records to the Elastic IP."],
  ["Cost guard", "AWS Budgets alerts; admin switch 'Accept new transfers' acts as an instant maintenance mode."],
];

export const LIMITS_KNOWN = [
  ["Single instance", "Rate limits, lockouts and upload progress live in memory. Several servers would need a shared store such as Redis."],
  ["Not end-to-end encrypted", "S3 encrypts at rest and HTTPS protects transit, but the service could technically read files. E2E would mean encrypting in the browser and putting the key in the link fragment."],
  ["30-second link window", "The person who just downloaded could reuse their own signed link within 30 s. They already have the file, so the key's limit still holds."],
  ["Zip goes through the server", "S3 cannot build zips. Next step: build the zip in the browser from signed links, keep the server zip as fallback."],
  ["6-digit key space", "1,000,000 keys. Safe because of short expiry, download limits and guessing lockouts; a longer key would make links harder to read aloud."],
  ["No live progress for the sender", "Files are stored first, so the sender's page does not see the receiver's download live (Send Anywhere's key mode is peer-to-peer)."],
];

export const TESTING = [
  ["Local lab", "Separate MongoDB, a fake SMTP mailbox and a fake S3 (multipart, signed links, CORS, expiry), so tests never touch real AWS or email."],
  ["API scripts", "Upload/download round trips with byte comparison, wrong sizes, missing parts, double complete, cancel, blocked types, limits, expired links."],
  ["Race tests", "10 parallel download clicks on a one-time file → exactly one link."],
  ["Attack suite", "Key guessing, oversized bodies, header injection in contact names, CORS from foreign origins, admin brute force and token reuse."],
  ["Browser checks", "Real pages: drag-and-drop, progress, cancel, fallback without CORS, admin flows, mobile widths."],
];

// Interview questions with model answers, grouped by topic.
export const QA = [
  {
    group: "Overview",
    items: [
      ["Explain your project in one minute.", "SendAnyFile lets anyone share files with a 6-digit key, QR code or link, without signing up. The sender drops up to 5 files, picks how long they live and how many downloads are allowed, and gets a key. The receiver enters the key and downloads. Files delete themselves automatically. It's a React frontend and a Node/Express API with MongoDB for metadata and S3 for the files. The interesting part is that browsers upload to and download from S3 directly with short-lived signed links, so the server only enforces the rules and doesn't carry the file traffic."],
      ["What problem does it solve?", "Moving a file quickly between people or devices without accounts, apps or leaving files lying around in someone's cloud. Short expiry and download limits mean files don't stay online longer than needed."],
      ["Why did you choose this stack?", "React + Vite for a fast, component-based UI; Express because it's simple and streams well; MongoDB because a transfer is naturally one document with an array of files, and it gives atomic updates and TTL indexes for expiry; S3 because it's cheap, durable and supports presigned URLs, which removes the server from the file path."],
      ["What was the hardest part?", "Making the download limit strict under concurrency and making large uploads scale. For the limit I used a single conditional MongoDB update so two parallel clicks can't both succeed. For uploads I moved from 'browser → server → S3' to direct S3 multipart uploads with signed links, while keeping every validation on the server and checking part sizes before creating the key."],
    ],
  },
  {
    group: "Uploads",
    items: [
      ["How does an upload work end to end?", "Three calls. Start: the browser sends only the file list; the server validates everything and returns signed part links and an upload token. Upload: the browser PUTs 5 MB parts straight to S3, 4 at a time, with retries. Complete: the server lists the parts in S3, checks each size, joins them, checks the final size, and only then creates the transfer and the 6-digit key."],
      ["Why not just upload to your server?", "Then every byte crosses the server twice (in from the user, out to S3), uses memory while it waits, and the S3 step can only start after the user finishes. That caps how many people can upload at once. Direct upload makes the time depend only on the user's connection, and the server handles small JSON messages only."],
      ["How do you stop someone uploading something bigger than they declared?", "The signed links are per part, and before completing I call ListParts and compare every part's size with what the declared file size requires. After completing I HEAD the object and compare the final size again. Any mismatch deletes the files and refuses the request."],
      ["What is a presigned URL?", "A URL signed with the server's AWS credentials that allows exactly one operation (for example PUT part 3 of this upload) for a limited time. The browser can use it without having any AWS keys, and it can't be changed to do anything else."],
      ["Why multipart and why 5 MB parts?", "Multipart lets parts upload in parallel and lets a failed part be retried alone instead of restarting the whole file. 5 MB is S3's minimum part size (except the last part), and with a 20 MB limit it gives up to 4 parts per file, which matches 4 parallel uploads."],
      ["What happens if the user closes the tab mid-upload?", "The upload never completes, so no transfer or key exists. The PendingUpload record stays; a job every 10 minutes aborts uploads older than 2 hours, and an S3 lifecycle rule removes incomplete multipart uploads after a day as a backup."],
      ["What if the same 'complete' request is sent twice?", "I take the pending record with findOneAndDelete, which is atomic. The first request gets it and the second finds nothing and gets 404, so one upload can never produce two transfers."],
      ["What if S3 is not reachable from the browser?", "If no part could be uploaded and there was no response at all (typical when the bucket's CORS rule is missing), the page aborts the direct upload and falls back to uploading through the server. Sending still works, just slower."],
      ["Why is the upload token stored as a hash?", "If someone read the database, they still couldn't complete or abort other people's uploads, because only the SHA-256 of the token is stored. Same idea as storing password hashes."],
    ],
  },
  {
    group: "Downloads & limits",
    items: [
      ["How do downloads work?", "The receive page only reads info. When the user clicks Download, the server counts the download and redirects to a signed S3 GET link valid for 30 seconds that forces 'save as' with the original file name. The file comes straight from S3."],
      ["How do you enforce a one-time download when many people click at once?", "With one atomic MongoDB update: increment the file's downloads only if downloads is less than the limit. MongoDB applies it as a single operation, so only one request can match. I tested 10 parallel clicks on a one-time file and exactly one got a link."],
      ["Can someone reuse the signed link?", "Only within 30 seconds, and only someone who already got it, meaning the person who just downloaded. It's never shown on a page or in the share link; people share the key, and every use of the key is counted. A longer-term option is CloudFront signed URLs tied to the downloader's IP."],
      ["Does opening the download page use up a download?", "No. Viewing is a separate read-only endpoint. Only clicking Download counts. HEAD requests (link checkers) also never count."],
      ["How does 'Download all' work?", "The server counts every file once, then streams a zip built on the fly with archiver, reading each file from storage. Nothing is written to disk. It's limited to 4 zips at once and 6 per minute per IP because it's the one path where bytes still pass through the server."],
      ["Why stream instead of loading the file into memory?", "Streaming sends chunks as they arrive, so memory stays small and constant whether the file is 1 KB or 20 MB, and the receiver starts getting data immediately."],
    ],
  },
  {
    group: "Keys & expiry",
    items: [
      ["How is the 6-digit key generated?", "With crypto.randomInt (cryptographically secure), padded to 6 digits, and checked to be unused among active transfers; up to 10 tries. After expiry the key can be reused."],
      ["Isn't a 6-digit key easy to guess?", "There are a million keys, and only failed lookups count against an IP: 10 wrong keys in 10 minutes and that IP is locked. During a site-wide burst, IPs that already failed are blocked, and in a heavy attack everyone waits a minute. Combined with short expiry and download limits, guessing a live key is impractical."],
      ["How do files get deleted?", "A job runs every minute, finds expired transfers, deletes their files from S3 or disk, empties the files list and sets deletedAt. The database row stays so the public statistics stay correct."],
      ["Why keep the database row after deleting files?", "For transparency statistics: total transfers, files deleted and data moved. File names are scrubbed; only counts and sizes remain."],
    ],
  },
  {
    group: "Database",
    items: [
      ["Why MongoDB?", "A transfer is one document with its files array, which maps naturally to a document database. I need atomic conditional updates (download counting) and TTL indexes (sessions, messages), and Mongo has both. There are no complex joins in this app."],
      ["What indexes do you have and why?", "transfers.key, expiresAt and deletedAt for lookups and cleanup; unique tokenHash on pending uploads; unique username; TTL indexes on session expiry, message createdAt (12 months) and audit createdAt (90 days)."],
      ["What is a TTL index?", "An index on a date field that tells MongoDB to delete documents automatically once that time (plus an optional delay) has passed. I use it so expired sessions and old messages clean themselves up."],
      ["How do you avoid race conditions?", "By putting the condition inside the update itself, for example 'increment downloads where downloads < limit', or by using findOneAndDelete to claim a pending upload. The database applies each as one atomic step."],
    ],
  },
  {
    group: "Security",
    items: [
      ["How do you prevent abuse of a public, no-login site?", "Rate limits per IP (uploads, lookups, zips, emails, contact), a key-guessing lockout, size and storage caps, blocked file types, concurrency gates, small JSON body limits and slow-client timeouts. Admins also have switches to turn off uploads, email or the contact form instantly."],
      ["How do you stop the email feature being used for spam or spoofing?", "Emails always come from our own address; the visitor's address only goes in Reply-To. There are limits per transfer (3), per IP per hour (10), per recipient per hour (3) and per day (300). Every value in the email is HTML-escaped."],
      ["What security headers do you send and why?", "nosniff (the browser mustn't guess file types), X-Frame-Options DENY (clickjacking), Referrer-Policy no-referrer (keys are in URLs and mustn't leak), Permissions-Policy (turn off camera/mic/location), HSTS on HTTPS, and no-store on API responses."],
      ["How do you handle CORS?", "Only origins listed in ALLOWED_CLIENTS (the real frontend) may call the API from a browser. Requests without an Origin header pass, because CORS only protects browsers. The S3 bucket has its own CORS rule that allows PUT from the site."],
      ["Could an uploaded file run code on your site?", "Downloads are always attachments, never shown inline. Streamed downloads also send nosniff and a sandbox CSP. File names are cleaned, and the stored name is a UUID, so the user's file name never becomes a path. S3 downloads come from the S3 domain, not ours."],
      ["Are files encrypted?", "In transit with HTTPS, and at rest by S3. They're not end-to-end encrypted, so the service could technically read them. End-to-end encryption would mean encrypting in the browser and putting the key in the link fragment, which the server never sees."],
      ["Where are AWS credentials?", "On EC2, nowhere in the code or .env: an IAM role gives the server short-lived credentials automatically, limited to the transfers/ folder of one bucket."],
    ],
  },
  {
    group: "Admin & authentication",
    items: [
      ["How does admin login work?", "Users are in MongoDB with scrypt password hashes. Login returns a 5-minute JWT access token and a random refresh token. The whole session lasts 15 minutes and refresh never extends it. Every admin request checks the JWT, the live session in the database, the user and the admin role."],
      ["Why access AND refresh tokens?", "A short access token limits the damage if it leaks, and the refresh token renews it without asking for the password again. Refresh tokens rotate on every use, and reusing an old one revokes the session, which detects theft."],
      ["Why scrypt and not SHA-256 for passwords?", "SHA-256 is fast, which helps attackers try billions of guesses. scrypt is deliberately slow and memory-hard, and each password has its own random salt, so cracking stolen hashes is very expensive."],
      ["Where do you store tokens in the browser and why?", "In sessionStorage, cleared when the tab closes, and sent in the Authorization header. Because the browser never attaches them automatically, CSRF isn't possible. The trade-off is that XSS could read them; HttpOnly cookies would protect against that but need CSRF protection and same-site hosting."],
      ["How do you stop brute force on the admin login?", "5 wrong tries per IP or 20 across the site in 15 minutes lock login for 15 minutes; every failure waits 600 ms; unknown usernames take the same time as wrong passwords; and the password includes the current IST time."],
      ["What is step-up authentication?", "Asking for the password again for a sensitive action even though the user is signed in. Saving admin settings requires the ID and password again."],
      ["What can the admin do?", "Switch uploads, email and contact on or off; read contact messages by topic and status, mark them done with a note, and delete the files of a reported transfer at once; read this architecture page."],
    ],
  },
  {
    group: "Performance & scaling",
    items: [
      ["Where would it break first under heavy load?", "The zip download (still through the server) and the in-memory rate limits if I ran several servers. Single uploads and downloads go directly to S3, so they scale with S3, not with my server."],
      ["How would you scale to many servers?", "Move rate limits, lockouts and progress into Redis; run several API instances behind a load balancer; keep MongoDB on Atlas; build zips in the browser. Nothing else depends on one machine, because files are in S3."],
      ["Why was a 20 MB upload taking 25 seconds before, and what changed?", "It was two sequential hops: the user's upload to the server, then the server's upload to S3. Now it's one hop straight to S3 with 4 parallel parts, so the time is just the user's upload speed. Running the server in the same region as the bucket also matters."],
      ["How do you keep costs under control?", "Files auto-delete; S3 lifecycle rules as a safety net; size, count and rate limits; AWS Budgets alerts; and an admin switch that pauses new uploads instantly."],
    ],
  },
  {
    group: "Reliability & failures",
    items: [
      ["What happens if a part upload fails?", "That part is retried up to 3 times with a short pause. If it still fails, the whole upload is aborted in S3 and the user sees an error; nothing half-finished is kept."],
      ["What if creating a signed download link fails?", "The server falls back to streaming the file itself, so the download still works."],
      ["What if the email server is down?", "Contact messages are saved in the database first, so nothing is lost; the email copy is sent in the background. For share-link emails, a failed send releases the counted email so it can be tried again."],
      ["How do you avoid one bad request crashing the server?", "Every route has try/catch, there's a final error handler that returns short JSON, unhandled promise rejections are logged instead of crashing, and pm2 restarts the process if it ever does exit."],
    ],
  },
  {
    group: "Deployment & AWS",
    items: [
      ["How is it deployed?", "One EC2 instance in Mumbai with nginx (HTTPS via Let's Encrypt, serves the React build, proxies /api to Node) and pm2 running the API. MongoDB Atlas for the database, a private S3 bucket for files, and the domain pointing to an Elastic IP."],
      ["Why nginx in front of Node?", "It handles HTTPS, serves static files efficiently, sets the upload size limit and the SPA fallback, and keeps Node off the public port. The app trusts one proxy hop so rate limits see the real visitor IP."],
      ["Why does refreshing /receive/123456 not give a 404?", "Because nginx's try_files sends unknown paths to index.html, and React Router then shows the right page. Without that, the server would look for a real folder called /receive and return 404."],
      ["What AWS settings does the bucket need?", "Block public access on; a CORS rule allowing PUT from the site; lifecycle rules for incomplete uploads and old objects; and an IAM role on EC2 allowing Put, Get, Delete, AbortMultipartUpload and ListMultipartUploadParts on transfers/*."],
      ["How are secrets managed?", "In a .env file on the server that's never committed (.gitignore covers .env and .env.*); .env.example lists the names. AWS uses the instance role, and the admin password is hashed on first start and changed with a script."],
    ],
  },
  {
    group: "Frontend",
    items: [
      ["How is the frontend organised?", "A router with pages (Transfer, Receive, About, Live stats, Contact, Privacy, Terms, 404, admin pages), shared layout components (Shell, PageHero), and one api.js file that owns all HTTP calls, including the direct-upload logic."],
      ["How does the progress bar work?", "Each part upload reports bytes sent through axios's onUploadProgress; the page adds the bytes of all parts and divides by the total size. It never moves backwards, even if a part is retried."],
      ["How is the admin area protected in the frontend?", "AdminOnly checks the session and confirms the admin role with /auth/me before showing admin pages. The real protection is on the server, since every admin API call checks the token and role; the frontend guard is for user experience."],
      ["What is the PWA part?", "A manifest and icons make it installable, and a small service worker keeps the app shell available offline. It loads pages network-first so new deploys show immediately, and it never caches API calls."],
    ],
  },
  {
    group: "Testing & what next",
    items: [
      ["How did you test it?", "In a local lab: a separate MongoDB, a fake SMTP mailbox and a fake S3 that supports multipart uploads, signed links, CORS and link expiry. Scripted tests covered round trips with byte comparison, size cheating, missing parts, double completion, cancel, limits, races and expiry, plus an attack suite and browser checks."],
      ["What would you improve next?", "Build 'Download all' zips in the browser; show the sender live status (download started or finished); move rate limits to Redis for multiple servers; optional end-to-end encryption; and a live device-to-device mode with WebRTC like Send Anywhere's key mode."],
      ["How is this different from Send Anywhere?", "Send Anywhere's key mode is live device-to-device (both online, peer-to-peer with a relay fallback). SendAnyFile stores first and lets the receiver download later, like their link mode, so the sender can close the page."],
    ],
  },
];
