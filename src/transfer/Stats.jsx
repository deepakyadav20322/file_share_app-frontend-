import { formatDuration } from "./api";

const mb = (bytes) => `${Math.round(bytes / 1048576)} MB`;

// Big-number strip fed by the real backend limits (no invented figures).
export default function Stats({ limits, dark = false }) {
  const items = [
    { value: "6", label: "digits to remember" },
    { value: String(limits.maxFiles), label: "files per transfer" },
    { value: mb(limits.maxTotalSize), label: "per transfer" },
    { value: limits.maxExpiryMinutes % 60 === 0 ? `${limits.maxExpiryMinutes / 60}h` : formatDuration(limits.maxExpiryMinutes), label: "longest expiry" },
  ];

  return (
    <dl className={`grid grid-cols-2 gap-y-6 lg:grid-cols-4 ${dark ? "text-white" : "text-ink-900"}`}>
      {items.map((s, i) => (
        <div key={s.label} className={`px-2 text-center sm:px-6 ${i > 0 ? "lg:border-l" : ""} ${i === 2 ? "border-l lg:border-l" : ""} ${dark ? "border-white/10" : "border-ink-900/10"}`}>
          <dd className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{s.value}</dd>
          <dt className={`mt-1 text-xs font-semibold uppercase tracking-wider ${dark ? "text-white/50" : "text-ink-900/50"}`}>{s.label}</dt>
        </div>
      ))}
    </dl>
  );
}
