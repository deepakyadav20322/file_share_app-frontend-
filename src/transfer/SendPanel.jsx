import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-hot-toast";
import { ArrowUpTrayIcon, DocumentIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { createTransfer, errorMessage, formatDuration, formatSize, shortName } from "./api";
import ExpiryPicker from "./ExpiryPicker";
import DownloadsOption from "./DownloadsOption";
import { primaryBtn } from "./Shell";

export default function SendPanel({ limits, onSent, onFilesAdded }) {
  const paused = limits.features?.uploads === false; // switched off from the admin panel
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const dragDepth = useRef(0); // enters minus leaves; lives outside renders so it never resets mid-drag
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState("send"); // "send" = browser to SendAnyFile, "save" = SendAnyFile stores the files
  const [expiry, setExpiry] = useState(null); // null = server default
  const [downloads, setDownloads] = useState(null); // null = server default (1)

  const selectedExpiry =
    expiry && expiry <= limits.maxExpiryMinutes ? expiry : limits.expiryMinutes;

  const selectedDownloads = downloads || limits.defaultDownloads || 1;

  const total = files.reduce((sum, f) => sum + f.size, 0);
  const full = files.length >= limits.maxFiles;

  const addFiles = (list) => {
    const next = [...files];
    for (const f of list) {
      if (next.some((x) => x.name === f.name && x.size === f.size)) continue;
      if (next.length >= limits.maxFiles) {
        toast.error(`Up to ${limits.maxFiles} files at a time`);
        break;
      }
      if (f.size > limits.maxFileSize) {
        toast.error(`${f.name} is over ${formatSize(limits.maxFileSize)}`);
        continue;
      }
      if (next.reduce((s, x) => s + x.size, f.size) > limits.maxTotalSize) {
        toast.error(`Total can't exceed ${formatSize(limits.maxTotalSize)}`);
        continue;
      }
      next.push(f);
    }
    setFiles(next);
  };

  const send = async () => {
    const controller = new AbortController();
    abortRef.current = controller;
    setUploading(true);
    setProgress(0);
    setStep("send");
    try {
      const transfer = await createTransfer(
        files,
        selectedExpiry,
        selectedDownloads,
        (percent, which) => {
          setProgress((p) => Math.max(p, percent)); // never moves backwards
          setStep(which);
        },
        controller.signal,
        { direct: limits.directUpload === true, remote: limits.storage === "s3" }
      );
      onSent(transfer);
      setFiles([]);
    } catch (err) {
      if (err?.code === "ERR_CANCELED") toast("Upload cancelled");
      else toast.error(errorMessage(err, "Upload failed. Please try again."));
    } finally {
      abortRef.current = null;
      setUploading(false);
    }
  };

  const cancel = () => abortRef.current?.abort();

  // Files go out one after another in a single request, so each file's share of the progress is
  // worked out from how many bytes came before it.
  const fileProgress = (index) => {
    const sent = (progress / 100) * total;
    const before = files.slice(0, index).reduce((s, f) => s + f.size, 0);
    return Math.max(0, Math.min(100, Math.round(((sent - before) / (files[index].size || 1)) * 100)));
  };

  // Whole-page drop: dragging files anywhere over the window shows the overlay.
  const dropEnabled = !uploading && !paused;
  useEffect(() => {
    const hasFiles = (e) => Array.from(e.dataTransfer?.types || []).includes("Files");
    const enter = (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragDepth.current++;
      if (dropEnabled) setDragging(true);
    };
    const over = (e) => hasFiles(e) && e.preventDefault(); // allows the drop
    const leave = (e) => {
      if (!hasFiles(e)) return;
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (!dragDepth.current) setDragging(false); // every element was left: the drag left the window
    };
    const drop = (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragDepth.current = 0;
      setDragging(false);
      if (dropEnabled) {
        addFiles(Array.from(e.dataTransfer.files));
        onFilesAdded?.();
      }
    };
    window.addEventListener("dragenter", enter);
    window.addEventListener("dragover", over);
    window.addEventListener("dragleave", leave);
    window.addEventListener("drop", drop);
    return () => {
      window.removeEventListener("dragenter", enter);
      window.removeEventListener("dragover", over);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("drop", drop);
    };
  });

  // Ctrl+V anywhere on the page adds copied files (e.g. from Explorer or a screenshot).
  useEffect(() => {
    const onPaste = (e) => {
      const pasted = Array.from(e.clipboardData?.files || []);
      if (pasted.length && !uploading && !paused) addFiles(pasted);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  });

  const pick = () => !paused && !uploading && !full && inputRef.current?.click();

  return (
    <div className="animate-fade-in">
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          addFiles(Array.from(e.target.files));
          e.target.value = "";
        }}
      />

      {files.length === 0 ? (
        <button
          type="button"
          onClick={pick}
          disabled={paused}
          title={paused ? "Sending is paused for maintenance. Please try again soon." : undefined}
          className={`group flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-4 py-10 text-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ${
            paused
              ? "cursor-not-allowed border-ink-900/20 bg-ink-900/5 opacity-60"
              : dragging ? "scale-[1.01] border-brand-600 bg-brand-100" : "border-brand-600/40 bg-brand-50 hover:border-brand-600 hover:bg-brand-100"
          }`}
        >
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand text-ink-950 shadow-[0_10px_24px_-8px_rgba(82,200,15,0.9)] transition group-enabled:group-hover:-translate-y-0.5">
            <ArrowUpTrayIcon className="h-7 w-7" />
          </span>
          <span className="text-sm font-semibold text-ink-900">
            {paused ? "File selection is paused" : <>Drop files here or <span className="underline decoration-brand-600 decoration-2 underline-offset-4">browse</span></>}
          </span>
          <span className="text-xs text-ink-900/50">
            Up to {limits.maxFiles} files · {formatSize(limits.maxFileSize)} each · {formatSize(limits.maxTotalSize)} total
          </span>
        </button>
      ) : (
        <div>
          {/* Shows five rows; more files scroll inside this box (thin scrollbar). */}
          <ul className="max-h-[15.8rem] space-y-2 overflow-y-auto overscroll-contain pr-1 [scrollbar-color:rgba(10,30,19,0.25)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-ink-900/25 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5">
            {files.map((f, i) => (
              <li key={f.name + f.size} title={f.name} className="group relative flex items-center gap-2.5 overflow-hidden rounded-xl bg-paper px-2.5 py-2 ring-1 ring-ink-900/5">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-100 text-brand-700">
                  <DocumentIcon className="h-4 w-4" />
                </span>
                <p className="min-w-0 flex-1 truncate text-[13px] font-medium">{shortName(f.name)}</p>
                {/* One slot at the right: the size normally, the red delete icon on hover (always the icon on touch screens). */}
                <span className="grid h-7 min-w-[3.5rem] shrink-0 items-center justify-items-end">
                  <span className={`col-start-1 row-start-1 text-xs text-ink-900/45 ${uploading ? "" : "group-hover:invisible group-focus-within:invisible [@media(hover:none)]:invisible"}`}>
                    {uploading ? `${fileProgress(i)}%` : formatSize(f.size)}
                  </span>
                  {!uploading && (
                    <button
                      type="button"
                      aria-label={`Remove ${f.name}`}
                      onClick={() => setFiles(files.filter((x) => x !== f))}
                      title="Remove"
                      className="invisible col-start-1 row-start-1 rounded-full p-1.5 text-red-500 transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:visible focus-visible:ring-2 focus-visible:ring-red-500 group-hover:visible group-focus-within:visible [@media(hover:none)]:visible"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </span>
                {uploading && (
                  <span className="absolute inset-x-0 bottom-0 h-1 bg-ink-900/10" aria-hidden>
                    <span className="block h-full bg-brand-600 transition-[width] duration-200" style={{ width: `${fileProgress(i)}%` }} />
                  </span>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-3 flex items-center justify-between text-xs text-ink-900/60">
            <span>
              {files.length}/{limits.maxFiles} files · {formatSize(total)} of {formatSize(limits.maxTotalSize)}
            </span>
            {!uploading && (
              <span className="flex items-center gap-3">
                <button type="button" onClick={pick} disabled={full}
                  className="inline-flex items-center gap-1 font-bold text-brand-700 hover:underline disabled:text-ink-900/25 disabled:no-underline">
                  <PlusIcon className="h-3.5 w-3.5" /> Add more
                </button>
                <button type="button" onClick={() => setFiles([])} className="hover:text-ink-900 hover:underline">Clear</button>
              </span>
            )}
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-900/10">
            <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${(total / limits.maxTotalSize) * 100}%` }} />
          </div>
        </div>
      )}

      {files.length > 0 && (
        <>
          <ExpiryPicker limits={limits} value={selectedExpiry} onChange={setExpiry} disabled={uploading} />
          <DownloadsOption value={selectedDownloads} max={limits.maxDownloads || 5} expiryLabel={formatDuration(selectedExpiry)} onChange={setDownloads} disabled={uploading} />
        </>
      )}

      <button type="button" onClick={send} disabled={paused || uploading || files.length === 0} title={paused ? "Sending is paused for maintenance. Please try again soon." : undefined} className={`${primaryBtn} relative mt-5 overflow-hidden`}>
        {uploading && <span className="absolute inset-y-0 left-0 bg-ink-950/15 transition-all" style={{ width: `${progress}%` }} />}
        <span className="relative">{paused ? "Sending is paused" : uploading ? (step === "save" ? `Saving securely… ${progress}%` : `Uploading… ${progress}%`) : "Get share key"}</span>
      </button>
      {uploading && (
        <button type="button" onClick={cancel} className="mt-2 w-full rounded-xl py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
          Cancel upload
        </button>
      )}
      {paused && <p className="mt-2 text-center text-xs font-semibold text-amber-700">Maintenance in progress. Sending will be back soon.</p>}

      {dragging && createPortal(
        <div className="pointer-events-none fixed inset-0 z-[100] bg-paper/90 backdrop-blur-[2px]" aria-hidden>
          {/* Dashed frame around the whole window, plus a big plus in the middle. */}
          <div className="absolute inset-3 rounded-2xl border-2 border-dashed border-brand-600" />
          <div className="absolute inset-0 grid place-items-center">
            <div className="flex flex-col items-center gap-4 text-ink-900">
              <PlusIcon className="h-20 w-20 text-brand-600" strokeWidth={1.25} />
              <p className="font-display text-2xl font-extrabold">Drop files here</p>
              <p className="text-sm text-ink-900/55">
                Up to {limits.maxFiles} files · {formatSize(limits.maxFileSize)} each
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
