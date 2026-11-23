import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { errorMessage, sendTransferEmail } from "./api";
import { primaryBtn } from "./Shell";

const STORE = "sendanyfile:senderEmail";
const readSaved = () => {
  try { return localStorage.getItem(STORE) || ""; } catch { return ""; }
};
const save = (v) => {
  try { localStorage.setItem(STORE, v); } catch { /* storage unavailable */ }
};

export default function EmailModal({ transferKey, onClose }) {
  const [emailFrom, setEmailFrom] = useState(readSaved);
  const [emailTo, setEmailTo] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !sending && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sending, onClose]);

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await sendTransferEmail(transferKey, emailFrom.trim(), emailTo.trim());
      save(emailFrom.trim());
      toast.success(res.message || "Email sent successfully");
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't send the email. Please try again."));
      setSending(false);
    }
  };

  const field =
    "w-full rounded-2xl bg-paper px-4 py-3 text-sm font-medium outline-none ring-1 ring-ink-900/10 transition placeholder:text-ink-900/35 focus:bg-white focus:ring-2 focus:ring-brand-600";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/70 p-4 backdrop-blur-sm sm:items-center"
      onClick={() => !sending && onClose()}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Send by email"
        className="w-full max-w-sm animate-fade-in rounded-3xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl font-extrabold">Send by email</h2>
          <button type="button" aria-label="Close" onClick={onClose} disabled={sending}
            className="rounded-full p-1.5 text-ink-900/40 hover:bg-ink-900/10 hover:text-ink-900">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <label htmlFor="tx-from" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink-900/50">Your email</label>
        <input id="tx-from" type="email" required autoFocus={!emailFrom} className={`${field} mb-4`} placeholder="you@example.com"
          value={emailFrom} onChange={(e) => setEmailFrom(e.target.value)} />

        <label htmlFor="tx-to" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink-900/50">Send to</label>
        <input id="tx-to" type="email" required autoFocus={!!emailFrom} className={`${field} mb-6`} placeholder="friend@example.com"
          value={emailTo} onChange={(e) => setEmailTo(e.target.value)} />

        <button type="submit" disabled={sending} className={primaryBtn}>
          {sending ? "Sending…" : "Send email"}
        </button>
      </form>
    </div>
  );
}
