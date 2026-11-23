import { Link } from "react-router-dom";
import { HomeIcon } from "@heroicons/react/24/outline";
import Shell, { card, primaryBtn, wrap } from "./Shell";
import ReceivePanel from "./ReceivePanel";

// Shown for any address that does not exist (instead of silently jumping to the home page).
export default function NotFoundPage() {
  const hero = (
    <section className={`${wrap} flex justify-center pb-16 pt-6 sm:pt-12`}>
      <div className="w-full max-w-md text-center">
        <p className="font-display text-7xl font-extrabold tracking-tight text-brand sm:text-8xl">404</p>
        <h1 className="mt-2 font-display text-2xl font-extrabold">This page doesn't exist</h1>
        <p className="mt-2 text-sm text-white/65">The link may be old or mistyped. Head back home, or enter a 6-digit key to receive files.</p>

        <div className={`${card} mt-8 p-5 text-left`}>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-900/50">Have a key?</p>
          <ReceivePanel />
          <Link to="/transfer" className={`${primaryBtn} mt-4`}>
            <HomeIcon className="h-4 w-4" /> Back to SendAnyFile
          </Link>
        </div>
      </div>
    </section>
  );

  return <Shell title="Page not found" hero={hero} />;
}
