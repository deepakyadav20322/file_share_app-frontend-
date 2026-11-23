import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { authed, getSession, subscribe } from "./adminSession";

// Sessions already confirmed with the server (keyed by their end time), so moving between admin pages
// does not ask again and does not flash a loading screen.
const confirmed = new Set();

// Shows its children only to a signed-in admin. The page opens straight away for a session that says
// "admin", and the role is confirmed with the server (/auth/me) in the background; if the server says no,
// or the session ends, the visitor goes back to the admin sign-in page. The data on these pages comes
// from admin-only API calls, so nothing private is shown before the check.
export default function AdminOnly({ children }) {
  const [session, setSession] = useState(getSession());
  const [denied, setDenied] = useState(false);

  useEffect(() => subscribe(setSession), []);

  const id = session?.sessionExpiresAt;
  useEffect(() => {
    if (!session || confirmed.has(id)) return;
    let live = true;
    authed({ method: "get", url: "/auth/me" })
      .then((d) => {
        if (d?.user?.role === "admin") confirmed.add(id);
        else if (live) setDenied(true);
      })
      .catch(() => live && setDenied(true));
    return () => {
      live = false;
    };
  }, [id]);

  if (!session || session.user?.role !== "admin" || denied) return <Navigate to="/admin/config" replace />;
  return children;
}
