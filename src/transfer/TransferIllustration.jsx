import { useEffect, useState } from "react";

const ARC ="M135 140 C 190 40, 285 40, 338 140";
const KEY = ["4", "8", "2", "9", "1", "7"];

const LIME = "#6EED1F";
const INK = "#06130C";
const PANEL = "#0F2D1D";
const EDGE = "#24573A";

// Animated hero graphic: files fly from a laptop to a phone while the share key sits above.
// Pure SVG (no image file); animation is skipped for users who prefer reduced motion.
export default function TransferIllustration({ className = "" }) {
  const still =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  // Speedometer-style roll: every 5 s each digit spins and locks onto a new value, left to right.
  const [digits, setDigits] = useState(KEY);
  const [rolling, setRolling] = useState(KEY.map(() => false));
  useEffect(() => {
    if (still) return undefined;
    const timers = [];
    const rnd = () => String(Math.floor(Math.random() * 10));
    const roll = () => {
      KEY.forEach((_, i) => {
        const stopAt = 600 + i * 220;
        setRolling((r) => r.map((v, j) => (j === i ? true : v)));
        const spin = setInterval(() => setDigits((d) => d.map((v, j) => (j === i ? rnd() : v))), 60);
        timers.push(spin, setTimeout(() => {
          clearInterval(spin);
          setRolling((r) => r.map((v, j) => (j === i ? false : v)));
        }, stopAt));
      });
    };
    const loop = setInterval(roll, 5000);
    timers.push(loop);
    return () => timers.forEach((t) => { clearInterval(t); clearTimeout(t); });
  }, [still]);

  const FileChip =({ begin }) =>
    still && begin !== "0s" ? null : (
      <g opacity={still ? 1 : 0} transform={still ? "translate(237 68)" : undefined}>
        <rect x="-10" y="-13" width="20" height="26" rx="4" fill="#F5FAEF" stroke={LIME} strokeWidth="1.6" />
        <path d="M2 -13 L10 -5 L2 -5 Z" fill="#C6F79A" />
        <rect x="-5" y="2" width="10" height="2" rx="1" fill={LIME} />
        <rect x="-5" y="7" width="7" height="2" rx="1" fill={LIME} />
        {!still && (
          <>
            <animateMotion dur="3.6s" begin={begin} repeatCount="indefinite" path={ARC} keyPoints="0;1" keyTimes="0;1" calcMode="linear" />
            <animate attributeName="opacity" dur="3.6s" begin={begin} repeatCount="indefinite" values="0;1;1;0" keyTimes="0;0.12;0.86;1" />
          </>
        )}
      </g>
    );

  const Pulse = ({ cx, cy, begin }) =>
    !still && (
      <circle cx={cx} cy={cy} r="20" fill="none" stroke={LIME} strokeWidth="1.5">
        <animate attributeName="r" dur="2.4s" begin={begin} repeatCount="indefinite" values="20;36" />
        <animate attributeName="opacity" dur="2.4s" begin={begin} repeatCount="indefinite" values="0.6;0" />
      </circle>
    );

  return (
    <svg viewBox="0 0 460 250" role="img" aria-label="Files moving from a laptop to a phone" className={className}>
      <defs>
        <radialGradient id="tx-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={LIME} stopOpacity="0.28" />
          <stop offset="100%" stopColor={LIME} stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="237" cy="135" r="120" fill="url(#tx-glow)">
        {!still && <animate attributeName="r" dur="6s" repeatCount="indefinite" values="112;124;112" />}
      </circle>

      {/* private / auto-delete badge */}
      <g transform="translate(237 122)">
        <circle r="30" fill="#0B1E14" stroke={EDGE} strokeWidth="5" />
        <circle r="30" fill="none" stroke={LIME} strokeWidth="5" strokeLinecap="round" strokeDasharray="188.5" strokeDashoffset="47" transform="rotate(-90)">
          {!still && <animate attributeName="stroke-dashoffset" dur="6s" repeatCount="indefinite" values="188;0;188" keyTimes="0;0.5;1" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" />}
        </circle>
        <path d="M0 -13 L11 -9 V1 C11 8 6 13 0 16 C-6 13 -11 8 -11 1 V-9 Z" fill={LIME} />
        <path d="M-4.5 1 L-1 4.5 L5 -3" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <text y="52" textAnchor="middle" fontSize="11" fontWeight="700" fill="#A4F365">Private · auto-delete</text>
      </g>

      {/* travel path */}
      <path d={ARC} fill="none" stroke={LIME} strokeOpacity="0.7" strokeWidth="2" strokeDasharray="4 8" strokeLinecap="round">
        {!still && <animate attributeName="stroke-dashoffset" dur="1.2s" repeatCount="indefinite" from="0" to="-12" />}
      </path>

      {/* laptop */}
      <rect x="20" y="108" width="112" height="74" rx="9" fill={PANEL} stroke={EDGE} strokeWidth="2" />
      <rect x="8" y="186" width="136" height="8" rx="4" fill="#163C28" />
      <Pulse cx="76" cy="145" begin="0s" />
      <circle cx="76" cy="145" r="18" fill={LIME} />
      <path d="M76 154 V137 M69 143 L76 136 L83 143" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

      {/* phone */}
      <rect x="338" y="86" width="72" height="124" rx="16" fill={PANEL} stroke={EDGE} strokeWidth="2" />
      <rect x="360" y="94" width="28" height="5" rx="2.5" fill={EDGE} />
      <Pulse cx="374" cy="148" begin="1.2s" />
      <circle cx="374" cy="148" r="18" fill={LIME} />
      <path d="M374 140 V157 M367 150 L374 157 L381 150" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="352" y="182" width="44" height="6" rx="3" fill={LIME} fillOpacity="0.5" />
      <rect x="352" y="192" width="30" height="6" rx="3" fill={EDGE} />

      <FileChip begin="0s" />
      <FileChip begin="1.2s" />
      <FileChip begin="2.4s" />

      {/* share key ticket */}
      <rect x="147" y="12" width="180" height="38" rx="19" fill={LIME} />
      <circle cx="147" cy="31" r="6" fill="#06130C" />
      <circle cx="327" cy="31" r="6" fill="#06130C" />
      {digits.map((d, i) => (
        <text key={i} x={237 + (i - 2.5) * 21} y="37" textAnchor="middle" fontSize="18" fontWeight="700" fill={INK}
          fontFamily='"JetBrains Mono", ui-monospace, monospace' opacity={rolling[i] ? 0.55 : 1}>
          {d}
        </text>
      ))}
    </svg>
  );
}
