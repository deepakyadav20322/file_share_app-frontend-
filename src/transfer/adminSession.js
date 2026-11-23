import axios from "axios";
import baseURL from "../config";

// Admin sign-in state. Tokens live in sessionStorage (cleared when the tab closes). The access token
// is short-lived and is renewed with the refresh token; the whole session ends after a fixed time.

const KEY = "sendanyfile.admin";
let session = null; // { accessToken, refreshToken, accessExpiresAt, sessionExpiresAt, user }
let refreshing = null;
const listeners = new Set();

const read = () => {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
};
const write = (s) => {
  try {
    if (s) sessionStorage.setItem(KEY, JSON.stringify(s));
    else sessionStorage.removeItem(KEY);
  } catch {
    /* storage blocked: the session just lives in memory */
  }
};
const set = (s) => {
  session = s;
  write(s);
  listeners.forEach((fn) => fn(s));
};

session = read();
if (session && new Date(session.sessionExpiresAt) <= Date.now()) set(null);

export const getSession = () => session;
export const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const login = async (username, password) => {
  const { data } = await axios.post(`${baseURL}/auth/login`, { username, password });
  set(data);
  return data;
};

// One refresh at a time, even when several requests notice the expiry together.
export const refresh = () => {
  if (!session) return Promise.reject(new Error("signed out"));
  refreshing ||= axios
    .post(`${baseURL}/auth/refresh`, { refreshToken: session.refreshToken })
    .then(({ data }) => {
      set(data);
      return data;
    })
    .catch((err) => {
      if (err?.response) set(null); // refused: the session is over
      throw err;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
};

export const logout = async () => {
  const token = session?.refreshToken;
  set(null);
  if (token) await axios.post(`${baseURL}/auth/logout`, { refreshToken: token }).catch(() => {});
};

// Authenticated request: renews the access token shortly before it ends and retries once on 401.
export const authed = async (config) => {
  if (!session) throw Object.assign(new Error("signed out"), { response: { status: 401 } });
  if (new Date(session.accessExpiresAt) - Date.now() < 10_000) await refresh();
  const run = () =>
    axios({ ...config, url: `${baseURL}${config.url}`, headers: { ...config.headers, Authorization: `Bearer ${session.accessToken}` } });
  try {
    return (await run()).data;
  } catch (err) {
    if (err?.response?.status !== 401) throw err;
    await refresh();
    return (await run()).data;
  }
};

export const loadConfig = () => authed({ method: "get", url: "/admin/config" });
export const saveConfig = (id, password, values) =>
  authed({ method: "put", url: "/admin/config", data: { values }, headers: { "X-Admin-Id": id, "X-Admin-Password": password } });

// Contact messages: list with filters ({ topic, status, page }) and mark done / reopen.
export const loadMessages = (params) => authed({ method: "get", url: "/admin/messages", params });
export const updateMessage = (id, done, note = "") =>
  authed({ method: "patch", url: `/admin/messages/${id}`, data: { done, note } });
// Deletes the files of the transfer named in a message (Remove a file / Report abuse).
export const deleteMessageTransfer = (id) => authed({ method: "post", url: `/admin/messages/${id}/delete-transfer` });
