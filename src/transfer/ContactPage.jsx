import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  ArrowRightIcon, ChatBubbleLeftRightIcon, EnvelopeIcon, FlagIcon, SparklesIcon, TrashIcon,
} from "@heroicons/react/24/outline";
import { errorMessage, sendContact } from "./api";
import Shell, { card, primaryBtn, wrap } from "./Shell";

const TOPICS = [
  { id: "Question", icon: ChatBubbleLeftRightIcon, hint: "Ask us anything about how SendAnyFile works." },
  { id: "Feedback", icon: SparklesIcon, hint: "Tell us what to improve or what you loved." },
  { id: "Remove a file", icon: TrashIcon, hint: "Add the 6-digit key and we'll take the files down." },
  { id: "Report abuse", icon: FlagIcon, hint: "Add the 6-digit key and tell us what's wrong." },
];

const EMPTY = { name: "", email: "", message: "", fileKey: "", website: "" };
const field =
  "w-full rounded-2xl bg-paper px-4 py-3 text-sm font-medium outline-none ring-1 ring-ink-900/10 transition placeholder:text-ink-900/35 focus:bg-white focus:ring-2 focus:ring-brand-600";
const label = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink-900/50";
const directEmail = import.meta.env.VITE_CONTACT_EMAIL;

export default function ContactPage() {
  const [topic, setTopic] = useState(TOPICS[0].id);
  const [form, setForm] = useState(EMPTY);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const needsKey = topic === "Remove a file" || topic === "Report abuse";
  const current = TOPICS.find((t) => t.id === topic);
  const set = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (needsKey && !/^\d{6}$/.test(form.fileKey.trim())) return toast.error("Enter the 6-digit key of the transfer");
    setSending(true);
    try {
      await sendContact({
        name: form.name,
        email: form.email,
        message: form.message,
        topic,
        fileKey: needsKey ? form.fileKey.trim() : "",
        website: form.website,
      });
      setSent(true);
      setForm(EMPTY);
    } catch (err) {
      toast.error(errorMessage(err, "Could not send your message. Please try again."));
    } finally {
      setSending(false);
    }
  };

  const hero = (
    <section className={`${wrap} grid grid-cols-1 gap-10 pb-16 pt-8 sm:pt-14 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:pb-24`}>
      <div className="min-w-0 text-center lg:pt-6 lg:text-left">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand ring-1 ring-white/10">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" /> Contact
        </span>
        <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
          Talk to a <span className="text-brand">real person.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-md text-base text-white/70 sm:text-lg lg:mx-0">
          Questions, feedback, or a file that needs to come down. Pick a topic and tell us more. We read every message.
        </p>

        <ul className="mx-auto mt-8 max-w-md space-y-3 text-left lg:mx-0">
          <li className="flex gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <TrashIcon className="h-6 w-6 shrink-0 text-brand" />
            <p className="text-sm text-white/75"><b className="text-white">Need a file removed?</b> Choose "Remove a file" and add the 6-digit key.</p>
          </li>
          <li className="flex gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <FlagIcon className="h-6 w-6 shrink-0 text-brand" />
            <p className="text-sm text-white/75"><b className="text-white">Seen something that shouldn't be here?</b> Report it with the key and we'll look into it.</p>
          </li>
          {directEmail && (
            <li className="flex gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
              <EnvelopeIcon className="h-6 w-6 shrink-0 text-brand" />
              <p className="text-sm text-white/75"><b className="text-white">Prefer email?</b>{" "}
                <a href={`mailto:${directEmail}`} className="text-brand underline">{directEmail}</a></p>
            </li>
          )}
        </ul>
      </div>

      <div className={`${card} mx-auto w-full min-w-0 max-w-xl p-5 sm:p-8`}>
        {sent ? (
          <div className="animate-fade-in py-10 text-center">
            <span className="mx-auto grid h-20 w-20 animate-pop place-items-center rounded-full bg-brand shadow-[0_12px_40px_-10px_rgba(82,200,15,0.9)]">
              <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="#06130C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.5l4.5 4.5L19 7.5" strokeDasharray="30" strokeDashoffset="30" className="animate-draw-check" />
              </svg>
            </span>
            <h2 className="mt-6 font-display text-2xl font-extrabold">Message sent</h2>
            <p className="mx-auto mt-2 max-w-xs text-sm text-ink-900/60">Thanks for reaching out. We'll reply to the email you gave us.</p>
            <button type="button" onClick={() => setSent(false)} className="mt-6 text-sm font-bold text-brand-700 hover:underline">Send another message</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <fieldset>
              <legend className={label}>What's this about?</legend>
              <div className="grid grid-cols-2 gap-2">
                {TOPICS.map(({ id, icon: Icon }) => (
                  <button key={id} type="button" aria-pressed={topic === id} onClick={() => setTopic(id)}
                    className={`flex items-center gap-2 rounded-2xl px-3 py-2.5 text-left text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ${
                      topic === id ? "bg-brand text-ink-950 shadow-[0_6px_16px_-8px_rgba(82,200,15,0.9)] ring-1 ring-brand-600/40" : "bg-ink-900/5 text-ink-900/70 hover:bg-ink-900/10"
                    }`}>
                    <Icon className="h-4 w-4 shrink-0" /> {id}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-ink-900/50">{current.hint}</p>
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="c-name" className={label}>Your name</label>
                <input id="c-name" required maxLength={100} className={field} value={form.name} onChange={set("name")} autoComplete="name" />
              </div>
              <div>
                <label htmlFor="c-email" className={label}>Your email</label>
                <input id="c-email" type="email" required maxLength={200} className={field} value={form.email} onChange={set("email")} autoComplete="email" placeholder="you@example.com" />
              </div>
            </div>

            {needsKey && (
              <div className="animate-fade-in">
                <label htmlFor="c-key" className={label}>Transfer key (6 digits)</label>
                <input id="c-key" required inputMode="numeric" maxLength={6} className={`${field} font-mono tracking-[0.4em]`}
                  value={form.fileKey} onChange={(e) => setForm((f) => ({ ...f, fileKey: e.target.value.replace(/\D/g, "").slice(0, 6) }))} placeholder="000000" />
              </div>
            )}

            <div>
              <label htmlFor="c-msg" className={label}>Message</label>
              <textarea id="c-msg" required minLength={5} maxLength={2000} rows={5} className={`${field} resize-y`} value={form.message} onChange={set("message")} />
              <p className="mt-1 text-right text-[11px] text-ink-900/40">{form.message.length}/2000</p>
            </div>

            {/* Honeypot: hidden from people, bots tend to fill it in. */}
            <input tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" name="website" value={form.website} onChange={set("website")} />

            <button type="submit" disabled={sending} className={primaryBtn}>
              {sending ? "Sending…" : <>Send message <ArrowRightIcon className="h-4 w-4" /></>}
            </button>
            <p className="text-center text-xs text-ink-900/45">
              We only use your details to reply. See our <Link to="/privacy" className="underline hover:text-ink-900">Privacy Policy</Link>.
            </p>
          </form>
        )}
      </div>
    </section>
  );

  return <Shell title="Contact" hero={hero} />;
}
