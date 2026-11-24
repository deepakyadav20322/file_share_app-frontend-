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
const serverUpload = (files, expiryMinutes, maxDownloads, onProgress, signal, remoteStorage = false) => {
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

// Direct upload (S3 storage): the server checks the file list and hands out signed links, the browser sends
// the bytes straight to S3 in parts (4 at a time, each retried up to 3 times), then the server checks what
// arrived and creates the transfer. The server never carries the bytes, so many people can send at once.
const PARALLEL_PARTS = 4;

const directUpload = async (files, expiryMinutes, maxDownloads, onProgress, signal) => {
  const { data: start } = await axios.post(
    `${baseURL}/transfer/direct/start`,
    { files: files.map((f) => ({ name: f.name, size: f.size, type: f.type })), expiryMinutes, maxDownloads },
    { signal }
  );
  const token = start.uploadToken;
  const abort = () => axios.post(`${baseURL}/transfer/direct/abort`, { uploadToken: token }).catch(() => {});

  // One job per part, with where it sits in its file.
  const jobs = [];
  start.files.forEach((sf, i) => {
    let offset = 0;
    for (const part of sf.parts) {
      jobs.push({ file: files[i], part, offset });
      offset += part.size;
    }
  });

  const total = files.reduce((sum, f) => sum + f.size, 0) || 1;
  const sentPerPart = new Map();
  const report = () => {
    const sent = [...sentPerPart.values()].reduce((a, b) => a + b, 0);
    onProgress(Math.min(99, Math.round((sent / total) * 100)), "send");
  };

  let anyPartDone = false;
  let next = 0;
  const sendPart = async ({ file, part, offset }, id) => {
    const body = file.slice(offset, offset + part.size);
    for (let attempt = 1; ; attempt++) {
      try {
        await axios.put(part.url, body, {
          signal,
          onUploadProgress: (e) => {
            sentPerPart.set(id, e.loaded || 0);
            report();
          },
        });
        sentPerPart.set(id, part.size);
        report();
        anyPartDone = true;
        return;
      } catch (err) {
        if (err?.code === "ERR_CANCELED" || attempt >= 3) throw err;
        sentPerPart.set(id, 0);
        await new Promise((r) => setTimeout(r, 800 * attempt)); // short pause, then try this part again
      }
    }
  };
  const worker = async () => {
    while (next < jobs.length) {
      const id = next++;
      await sendPart(jobs[id], id);
    }
  };

  try {
    await Promise.all(Array.from({ length: Math.min(PARALLEL_PARTS, jobs.length) }, worker));
  } catch (err) {
    abort();
    // S3 could not be reached at all (no answer, e.g. a missing bucket CORS rule): let the caller
    // fall back to uploading through the server, so sending still works.
    if (err?.code !== "ERR_CANCELED" && !err?.response && !anyPartDone) err.fallback = true;
    throw err;
  }

  onProgress(100, "save"); // all bytes are in S3; the server now checks them and creates the key
  const { data } = await axios.post(`${baseURL}/transfer/direct/complete`, { uploadToken: token }, { signal });
  return data;
};

// options: { direct } uploads straight to S3; { remote } means the server-side path saves to S3 afterwards.
export const createTransfer = async (files, expiryMinutes, maxDownloads, onProgress, signal, options = {}) => {
  const { direct = false, remote = false } = typeof options === "object" ? options : { remote: Boolean(options) };
  if (direct) {
    try {
      return await directUpload(files, expiryMinutes, maxDownloads, onProgress, signal);
    } catch (err) {
      if (!err?.fallback) throw err;
      console.warn("Direct upload to storage failed; sending through the server instead.");
    }
  }
  return serverUpload(files, expiryMinutes, maxDownloads, onProgress, signal, remote);
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
