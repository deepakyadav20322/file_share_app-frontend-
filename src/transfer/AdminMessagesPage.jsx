import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  ArrowLeftIcon, ArrowPathIcon, ChatBubbleLeftRightIcon, CheckCircleIcon, EnvelopeIcon, FlagIcon, InboxIcon,
  KeyIcon, SparklesIcon, TrashIcon,
} from "@heroicons/react/24/outline";
import { deleteMessageTransfer, loadMessages, updateMessage } from "./adminSession";
import { formatSize } from "./api";
import Shell, { PageHero, card, ghostBtn, wrap } from "./Shell";

// Admin page: everything sent from the Contact page, filtered by topic and status.
// Each message can be marked done with an optional note, or opened again.

const TOPICS = [
  { id: "Question", icon: ChatBubbleLeftRightIcon, tone: "bg-sky-100 text-sky-700" },
  { id: "Feedback", icon: SparklesIcon, tone: "bg-violet-100 text-violet-700" },
  { id: "Remove a file", icon: TrashIcon, tone: "bg-amber-100 text-amber-700" },
  { id: "Report abuse", icon: FlagIcon, tone: "bg-red-100 text-red-700" },
];
const STATUSES = [
  { id: "open", label: "Open" },
  { id: "done", label: "Done" },
  { id: "", label: "All" },
];
const TRANSFER_TONE = {
  active: "bg-brand-100 text-brand-700",
  expired: "bg-ink-900/5 text-ink-900/60",
  deleted: "bg-ink-900/5 text-ink-900/60",
  "not found": "bg-red-50 text-red-600",
};

const when = (iso) =>
  new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });

const chip = (active) =>
  `inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
    active ? "bg-ink-900 text-brand" : "bg-white text-ink-900/70 ring-1 ring-ink-900/10 hover:bg-ink-900/5"
  }`;

function TransferStatus({ transfer }) {
  if (!transfer) return null;
  const { status } = transfer;
  const detail =
    status === "active"
      ? `${transfer.fileCount} file${transfer.fileCount === 1 ? "" : "s"} · ${formatSize(transfer.totalSize)} · expires ${when(transfer.expiresAt)}`
      : status === "deleted"
      ? `files deleted ${when(transfer.deletedAt)}`
      : status === "expired"
      ? `expired ${when(transfer.expiresAt)}, cleanup pending`
      : "no transfer with this key before the message";
  return (
    <span className={`inline-flex flex-wrap items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-semibold ${TRANSFER_TONE[status]}`}>
      <span className="uppercase tracking-wide">{status}</span>
      <span className="font-normal opacity-80">· {detail}</span>
    </span>
  );
}

function MessageCard({ m, onChanged }) {
  const [closing, setClosing] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const topic = TOPICS.find((t) => t.id === m.topic) || TOPICS[0];
  const done = m.status === "done";
  // Files still exist while the transfer is active, or expired but not yet cleaned up.
  const canDelete = m.fileKey && ["active", "expired"].includes(m.transfer?.status);

  const deleteFiles = async () => {
    setBusy(true);
    try {
      const { message } = await deleteMessageTransfer(m._id);
      onChanged(message, { keep: true });
      setConfirmDelete(false);
      toast.success(`Files for key ${m.fileKey} deleted`);
      // Next step is usually closing the message: open the done form with a ready note.
      if (!done) {
        setNote("Files deleted.");
        setClosing(true);
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || "Could not delete the files");
    } finally {
      setBusy(false);
    }
  };

  const save = async (makeDone) => {
    setBusy(true);
    try {
      const { message } = await updateMessage(m._id, makeDone, makeDone ? note : "");
      onChanged(message);
      setClosing(false);
      setNote("");
      toast.success(makeDone ? "Marked as done" : "Opened again");
    } catch {
      toast.error("Could not update the message");
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className={`${card} p-4 sm:p-5 ${done ? "opacity-80" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${topic.tone}`}>
            <topic.icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{m.name}</p>
            <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1 truncate text-xs text-brand-700 hover:underline">
              <EnvelopeIcon className="h-3.5 w-3.5" /> {m.email}
            </a>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className={`rounded-full px-2.5 py-0.5 font-bold ${topic.tone}`}>{m.topic}</span>
          <span className="text-ink-900/45">{when(m.createdAt)}</span>
        </div>
      </div>

      {m.fileKey && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-lg bg-ink-900 px-2 py-0.5 font-mono text-xs font-bold tracking-widest text-brand">
            <KeyIcon className="h-3.5 w-3.5" /> {m.fileKey}
          </span>
          <TransferStatus transfer={m.transfer} />
          {canDelete && !confirmDelete && (
            <button type="button" onClick={() => setConfirmDelete(true)}
              className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-red-600 ring-1 ring-red-200 transition hover:bg-red-50">
              <TrashIcon className="h-3.5 w-3.5" /> Delete files now
            </button>
          )}
        </div>
      )}

      {confirmDelete && (
        <div role="alertdialog" aria-label="Confirm deleting files" className="mt-3 rounded-xl bg-red-50 px-3.5 py-3 ring-1 ring-red-200">
          <p className="text-sm font-semibold text-red-700">
            Delete {m.transfer?.fileCount ?? "all"} file{m.transfer?.fileCount === 1 ? "" : "s"} for key {m.fileKey}?
          </p>
          <p className="mt-0.5 text-xs text-red-700/80">The files are removed from storage and the key stops working. This cannot be undone.</p>
          <div className="mt-2.5 flex justify-end gap-2">
            <button type="button" onClick={() => setConfirmDelete(false)} disabled={busy} className={`${ghostBtn} !py-1.5 text-xs`}>Cancel</button>
            <button type="button" onClick={deleteFiles} disabled={busy}
              className="rounded-xl bg-red-600 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-50">
              {busy ? "Deleting…" : "Delete files"}
            </button>
          </div>
        </div>
      )}

      <p className="mt-3 whitespace-pre-wrap break-words rounded-xl bg-paper px-3.5 py-3 text-sm text-ink-900/80">{m.message}</p>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-900/45">
        <span title="Sender's network address (for spotting abuse)">IP {m.ip || "unknown"}</span>
        {done ? (
          <button type="button" disabled={busy} onClick={() => save(false)} className="font-semibold text-ink-900/60 hover:text-ink-900 hover:underline">
            Open again
          </button>
        ) : (
          !closing && (
            <button type="button" onClick={() => setClosing(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3 py-1.5 text-xs font-bold text-ink-950 transition hover:bg-brand-400">
              <CheckCircleIcon className="h-4 w-4" /> Mark as done
            </button>
          )
        )}
      </div>

      {done && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm text-ink-900 ring-1 ring-brand-600/20">
          <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
          <div>
            <p className="text-xs font-bold text-brand-700">Done by {m.doneBy || "admin"} · {when(m.doneAt)}</p>
            {m.doneNote && <p className="mt-0.5 whitespace-pre-wrap break-words">{m.doneNote}</p>}
          </div>
        </div>
      )}

      {closing && (
        <form onSubmit={(e) => { e.preventDefault(); save(true); }} className="mt-3 space-y-2">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={2} autoFocus
            placeholder="Optional note, e.g. files deleted, replied by email"
            className="w-full rounded-xl bg-paper px-3.5 py-2.5 text-sm outline-none ring-1 ring-ink-900/10 focus:bg-white focus:ring-2 focus:ring-brand-600" />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => { setClosing(false); setNote(""); }} className={`${ghostBtn} !py-1.5 text-xs`}>Cancel</button>
            <button type="submit" disabled={busy} className="rounded-xl bg-ink-900 px-4 py-1.5 text-xs font-bold text-brand transition hover:bg-ink-800 disabled:opacity-50">
              {busy ? "Saving…" : "Confirm done"}
            </button>
          </div>
        </form>
      )}
    </li>
  );
}

export default function AdminMessagesPage() {
  const [topic, setTopic] = useState("");
  const [status, setStatus] = useState("open");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null); // { items, total, pages, counts }
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  // Keep this page out of search results.
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex,nofollow";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    setFailed(false);
    loadMessages({ topic: topic || undefined, status: status || undefined, page })
      .then(setData)
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [topic, status, page]);
  useEffect(load, [load]);

  const pick = (fn) => (value) => {
    fn(value);
    setPage(1);
  };

  // After marking done / reopening, drop the card if it no longer matches the status filter.
  const changed = (message, { keep = false } = {}) => {
    setData((d) => {
      const fits = keep || !status || message.status === status;
      const items = fits ? d.items.map((x) => (x._id === message._id ? message : x)) : d.items.filter((x) => x._id !== message._id);
      return { ...d, items };
    });
    if (status && !keep) setTimeout(load, 400); // refresh the counts
  };

  const topicCount = (id) => (id ? data?.counts.topic[id] || 0 : Object.values(data?.counts.topic || {}).reduce((a, b) => a + b, 0));
  const statusCount = (id) => (id ? data?.counts.status[id] || 0 : Object.values(data?.counts.status || {}).reduce((a, b) => a + b, 0));

  const hero = (
    <PageHero eyebrow="Admin only" title="Messages">
      Everything sent from the Contact page. Mark a message done when it's handled, with a short note if useful.
    </PageHero>
  );

  return (
    <Shell title="Messages" hero={hero}>
      <div className={`${wrap} py-10 sm:py-14`}>
        <div className="mx-auto max-w-3xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link to="/admin/config" className={`${ghostBtn} !py-1.5 text-xs`}><ArrowLeftIcon className="h-4 w-4" /> Admin</Link>
            <button type="button" onClick={load} className={`${ghostBtn} !py-1.5 text-xs`} disabled={loading}>
              <ArrowPathIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>

          <div className="space-y-2.5">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
              {STATUSES.map((s) => (
                <button key={s.id || "all"} type="button" onClick={() => pick(setStatus)(s.id)} className={chip(status === s.id)}>
                  {s.label} <span className="opacity-60">{statusCount(s.id)}</span>
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by topic">
              <button type="button" onClick={() => pick(setTopic)("")} className={chip(!topic)}>
                All topics <span className="opacity-60">{topicCount("")}</span>
              </button>
              {TOPICS.map((t) => (
                <button key={t.id} type="button" onClick={() => pick(setTopic)(t.id)} className={chip(topic === t.id)}>
                  <t.icon className="h-3.5 w-3.5" /> {t.id} <span className="opacity-60">{topicCount(t.id)}</span>
                </button>
              ))}
            </div>
          </div>

          {failed && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">Could not load the messages. Try Refresh.</p>}

          {!failed && data && data.items.length === 0 && !loading && (
            <div className={`${card} flex flex-col items-center gap-2 px-6 py-14 text-center`}>
              <InboxIcon className="h-10 w-10 text-ink-900/25" />
              <p className="font-display text-lg font-extrabold">Nothing here</p>
              <p className="text-sm text-ink-900/55">{status === "open" ? "No open messages. Everything is handled." : "No messages match these filters."}</p>
            </div>
          )}

          {data && data.items.length > 0 && (
            <ul className="space-y-3">
              {data.items.map((m) => <MessageCard key={m._id} m={m} onChanged={changed} />)}
            </ul>
          )}

          {data && data.pages > 1 && (
            <div className="flex items-center justify-center gap-3 text-sm">
              <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)} className={`${ghostBtn} !py-1.5`}>Newer</button>
              <span className="text-ink-900/55">Page {page} of {data.pages}</span>
              <button type="button" disabled={page >= data.pages || loading} onClick={() => setPage((p) => p + 1)} className={`${ghostBtn} !py-1.5`}>Older</button>
            </div>
          )}

          {!data && loading && <p className="py-10 text-center text-sm text-ink-900/50">Loading messages…</p>}
        </div>
      </div>
    </Shell>
  );
}
