import { useState } from "react";
import { toast } from "react-hot-toast";
import { QRCodeSVG } from "qrcode.react";
import { CheckIcon, ClipboardDocumentIcon, EnvelopeIcon } from "@heroicons/react/24/outline";
import { copyText, formatSize } from "./api";
import useCountdown from "./useCountdown";
import EmailModal from "./EmailModal";
import { ghostBtn, primaryBtn } from "./Shell";

export default function ResultPanel({ transfer, onReset, emailEnabled = true }) {
  const [emailOpen, setEmailOpen] = useState(false);
  const [copied, setCopied] = useState(null);
  const { left, label } = useCountdown(transfer.expiresAt);
  const expired = left === 0;
  const shareLink = `${window.location.origin}/receive/${transfer.key}`;

  const copy = async (what, text, message) => {
    if (!(await copyText(text))) return toast.error("Could not copy");
    toast.success(message);
    setCopied(what);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="animate-fade-in">
      {emailOpen && <EmailModal transferKey={transfer.key} onClose={() => setEmailOpen(false)} />}

      <div className="mb-4 flex items-center justify-between">
        <span className={`inline-flex items-center gap-2 text-sm font-bold ${expired ? "text-amber-600" : "text-brand-700"}`}>
          <span className={`h-2 w-2 rounded-full ${expired ? "bg-amber-500" : "animate-pulse bg-brand-600"}`} />
          {expired ? "Key expired" : "Ready to receive"}
        </span>
        <span className={`rounded-full px-3 py-1 font-mono text-xs font-bold tabular-nums ${!expired && left < 60 ? "bg-red-50 text-red-600" : "bg-brand-100 text-ink-900"}`}>
          {label}
        </span>
      </div>

      {expired ? (
        <div className="rounded-2xl bg-amber-50 px-4 py-6 text-center text-sm text-amber-800">
          This key is no longer valid and the files were removed. Start a new transfer to share again.
        </div>
      ) : (
        <>
          <p className="mb-2 text-xs text-ink-900/55">Enter this key on the other device · tap to copy</p>
          <button
            type="button"
            onClick={() => copy("key", transfer.key, "Key copied")}
            title="Copy key"
            className="group flex w-full items-center gap-1.5 rounded-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 sm:gap-2"
          >
            {transfer.key.split("").map((d, i) => (
              <span key={i} className="flex-1 rounded-lg bg-brand-50 py-2 text-center font-mono text-lg font-bold text-ink-900 ring-1 ring-brand-600/30 transition group-hover:bg-brand-100 sm:text-xl">
                {d}
              </span>
            ))}
          </button>

          <div className="mt-5 flex flex-col items-center gap-4 sm:flex-row">
            <div className="shrink-0 rounded-lg bg-white p-2 shadow-md ring-1 ring-ink-900/10">
              <QRCodeSVG value={shareLink} size={96}fgColor="#06130C" />
            </div>

            <div className="w-full min-w-0 flex-1 space-y-2.5">
              <p className="text-xs text-ink-900/55">Or share this link</p>
              <div className="flex items-center gap-1 rounded-lg bg-paper py-0.5 pl-3 pr-1 ring-1 ring-ink-900/10">
                <input readOnly value={shareLink} onFocus={(e) => e.target.select()}
                  className="min-w-0 flex-1 bg-transparent text-xs text-ink-900/70 outline-none" aria-label="Share link" />
                <button type="button" onClick={() => copy("link", shareLink, "Link copied")} aria-label="Copy link"
                  className="rounded-xl p-2 text-ink-900/60 transition hover:bg-white hover:text-ink-900">
                  {copied === "link" ? <CheckIcon className="h-4 w-4 text-brand-700" /> : <ClipboardDocumentIcon className="h-4 w-4" />}
                </button>
              </div>
              {emailEnabled ? (
                <button type="button" onClick={() => setEmailOpen(true)} className={`${ghostBtn} w-full`}>
                  <EnvelopeIcon className="h-4 w-4" /> Send by email
                </button>
              ) : (
                <button type="button" disabled title="Email sharing is switched off right now. Share the key or link instead." className={`${ghostBtn} w-full !cursor-not-allowed`}>
                  <EnvelopeIcon className="h-4 w-4" /> Email · not active right now
                </button>
              )}
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-ink-900/45">
            {transfer.files.length} file{transfer.files.length > 1 ? "s" : ""} · {formatSize(transfer.totalSize)} · {transfer.maxDownloads} download{transfer.maxDownloads > 1 ? "s" : ""} allowed
          </p>
        </>
      )}

      <button type="button" onClick={onReset} className={`${expired ? primaryBtn : `${ghostBtn} mt-4 w-full`}`}>
        {expired ? "Start new transfer" : "Send more files"}
      </button>
    </div>
  );
}
