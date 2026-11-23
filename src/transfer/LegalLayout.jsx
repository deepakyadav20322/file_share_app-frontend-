import { Link } from "react-router-dom";
import Shell, { PageHero, wrap } from "./Shell";

export const LEGAL_UPDATED = "13 November 2026";

// Shared layout for Privacy and Terms. sections: [{ heading, body: [string | { list: string[] }] }]
export default function LegalLayout({ title, intro, sections }) {
  const hero = (
    <PageHero eyebrow="Legal" title={title}>
      <p>{intro}</p>
      <p className="mt-3 text-sm text-white/45">Last updated {LEGAL_UPDATED}</p>
    </PageHero>
  );

  return (
    <Shell title={title} hero={hero}>
      <div className={`${wrap} grid grid-cols-1 gap-10 py-14 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-14`}>
        <nav aria-label="On this page" className="hidden lg:block">
          <ol className="sticky top-8 space-y-1 border-l border-ink-900/10 text-sm">
            {sections.map((s, i) => (
              <li key={s.heading}>
                <a href={`#sec-${i}`} className="-ml-px block border-l-2 border-transparent py-1.5 pl-4 font-medium text-ink-900/55 transition hover:border-brand-600 hover:text-ink-900">
                  {s.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="max-w-3xl space-y-10">
          {sections.map((s, i) => (
            <section key={s.heading} id={`sec-${i}`} className="scroll-mt-8">
              <h2 className="flex items-center gap-3 font-display text-2xl font-extrabold tracking-tight">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink-900 text-sm text-brand">{i + 1}</span>
                {s.heading}
              </h2>
              <div className="mt-3 space-y-3 text-[15px] leading-7 text-ink-900/75">
                {s.body.map((b, j) =>
                  typeof b === "string" ? (
                    <p key={j}>{b}</p>
                  ) : (
                    <ul key={j} className="space-y-2">
                      {b.list.map((item) => (
                        <li key={item} className="flex gap-3">
                          <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )
                )}
              </div>
            </section>
          ))}

          <p className="rounded-3xl bg-white p-6 text-sm text-ink-900/65 ring-1 ring-ink-900/10">
            Questions about this page? <Link to="/contact" className="font-bold text-brand-700 hover:underline">Contact us</Link>.
          </p>
        </article>
      </div>
    </Shell>
  );
}
