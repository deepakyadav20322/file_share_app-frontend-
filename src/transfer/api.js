import axios from "axios";
import baseURL from "../config";

export const DEFAULT_LIMITS = {
  maxFiles: 5,
  maxFileSize: 20 * 1024 * 1024,
  maxTotalSize: 100 * 1024 * 1024,
  expiryMinutes: 10,
  expiryOptions: [5, 10, 30],
  maxDownloads: 5,
  defaultDownloads: 1,
  maxExpiryMinutes: 24 * 60,
  features: { email: true, contact: true, uploads: true },
};

export const formatDuration = (minutes) => {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h} ${h === 1 ? "hour" : "hours"}${m ? ` ${m} min` : ""}`;
};

// Limits live in the backend .env; the frontend only reads them.
export const fetchLimits = () =>
  axios.get(`${baseURL}/transfer/config`).then((r) => r.data).catch(() => DEFAULT_LIMITS);

const newUploadId = () =>
  globalThis.crypto?.randomUUID?.() ||
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });

// Two steps: the browser sends the bytes to SendAnyFile, then (with S3 storage) the server saves them, which
// can take a while. onProgress(percent, step) reports one bar over both: the first half is sending and
// the second half is the server's own report of how much it has saved. Without S3 saving is instant,
// so sending is the whole bar.
export const createTransfer = (files, expiryMinutes, maxDownloads, onProgress, signal, remoteStorage = false) => {
  const form = new FormData();
  form.append("expiryMinutes", expiryMinutes);
  form.append("maxDownloads", maxDownloads);
  files.forEach((f) => form.append("files", f));

  const id = newUploadId();
  const sendShare = remoteStorage ? 50 : 100;
  let poller = null;
  const startPolling = () => {
    if (poller || !remoteStorage) return;
    poller = setInterval(() => {
      axios
        .get(`${baseURL}/transfer/progress/${id}`, { signal })
        .then((r) => onProgress(Math.min(99, sendShare + Math.round((r.data.percent / 100) * (100 - sendShare))), "save"))
        .catch(() => {});
    }, 600);
  };

  return axios
    .post(`${baseURL}/transfer`, form, {
      signal,
      headers: { "X-Upload-Id": id },
      onUploadProgress: (e) => {
        if (!e.total) return;
        const sent = e.loaded / e.total;
        onProgress(Math.min(sent >= 1 ? sendShare : 99, Math.round(sent * sendShare)), sent >= 1 ? "save" : "send");
        if (sent >= 1) startPolling();
      },
    })
    .then((r) => r.data)
    .finally(() => clearInterval(poller));
};

export const fetchTransfer = (key) => axios.get(`${baseURL}/transfer/${key}`).then((r) => r.data);

export const sendTransferEmail = (key, emailFrom, emailTo) =>
  axios.post(`${baseURL}/transfer/${key}/email`, { emailFrom, emailTo }).then((r) => r.data);

// Clipboard API needs https/localhost, so fall back to a hidden textarea elsewhere (e.g. LAN http).
export const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    el.remove();
    return ok;
  }
};

export const fetchStats = (fresh = false) =>
  axios.get(`${baseURL}/stats`, { params: fresh ? { fresh: 1 } : undefined }).then((r) => r.data);

// Long names show their first 30 characters; the full name stays in the row's tooltip.
export const shortName = (name, max = 30) => (name.length > max ? `${name.slice(0, max)}…` : name);

export const formatBytesShort = (bytes) => {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
};


export const sendContact = (payload) =>
  axios.post(`${baseURL}/contact`, payload).then((r) => r.data);

export const zipUrl = (key) => `${baseURL}/transfer/${key}/zip`;

export const fileUrl = (key, index) => `${baseURL}/transfer/${key}/files/${index}`;

export const errorMessage = (err, fallback = "Something went wrong.") =>
  err?.response?.data?.error || fallback;

export const formatSize = (bytes) =>
  bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(2)} MB`;
