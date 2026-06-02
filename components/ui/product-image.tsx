import { cn } from "@/lib/utils";
import type { ArtDescriptor } from "@/lib/types";

/**
 * Branded SVG artwork standing in for product photography during Phase 2.
 * Each pattern is a deterministic, technical-blueprint composition that fits the
 * MOTO aesthetic (motorsport timing-board / urban wayfinding / spec sheet). When
 * real photography arrives (Phase 0/3) this component is swapped for <Image />
 * behind the same call sites.
 */

const NAVY: Record<number, string> = {
  900: "#060e1a",
  800: "#0b1624",
  700: "#122035",
  600: "#1a3357",
  500: "#1e4080",
  400: "#2756aa",
  300: "#4a7bc8",
  200: "#8aaed9",
  100: "#c2d6ee",
  50: "#eaf1f8",
};

const TONES = {
  white: "#ffffff",
  warm: "#f2efe8",
  navy: "#0b1624",
} as const;

/** Stable pseudo-random in [0,1) from a string seed. */
function seeded(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function ProductImage({
  art,
  alt,
  className,
  priority,
}: {
  art: ArtDescriptor;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  const ground = TONES[art.tone];
  const isDark = art.tone === "navy";
  const ink = isDark ? "#ffffff" : "#0a0a0a";
  const accent = NAVY[art.accent as number] ?? NAVY[500];
  const rand = seeded(art.seed);
  const fig = isDark ? NAVY[200] : accent;
  const faint = isDark ? "rgba(255,255,255,0.14)" : "rgba(10,10,10,0.10)";

  return (
    <svg
      viewBox="0 0 400 400"
      role="img"
      aria-label={alt}
      className={cn("block h-full w-full", className)}
      preserveAspectRatio="xMidYMid slice"
      // priority just hints the browser; SVG inline has no network cost.
      data-priority={priority ? "" : undefined}
    >
      <rect width="400" height="400" fill={ground} />

      {/* hairline grid backdrop */}
      <g stroke={faint} strokeWidth="1">
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={`v${i}`} x1={(i + 1) * 40} y1="0" x2={(i + 1) * 40} y2="400" />
        ))}
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={(i + 1) * 40} x2="400" y2={(i + 1) * 40} />
        ))}
      </g>

      <Figure pattern={art.pattern} fig={fig} ink={ink} accent={accent} rand={rand} />

      {/* corner registration ticks — spec-sheet detail */}
      <g stroke={ink} strokeWidth="1.25" opacity={0.5}>
        <path d="M18 18h14M18 18v14" />
        <path d="M382 18h-14M382 18v14" />
        <path d="M18 382h14M18 382v-14" />
        <path d="M382 382h-14M382 382v-14" />
      </g>
    </svg>
  );
}

function Figure({
  pattern,
  fig,
  ink,
  accent,
  rand,
}: {
  pattern: ArtDescriptor["pattern"];
  fig: string;
  ink: string;
  accent: string;
  rand: () => number;
}) {
  switch (pattern) {
    case "pods":
      return (
        <g>
          {Array.from({ length: 3 }).map((_, i) => {
            const cx = 120 + i * 80;
            const cy = 160 + (i % 2) * 70;
            const r = 34 - i * 4;
            return (
              <g key={i}>
                <circle cx={cx} cy={cy} r={r} fill="none" stroke={fig} strokeWidth="2" />
                <circle cx={cx} cy={cy} r={r * 0.55} fill={accent} opacity={0.16} />
                <circle cx={cx} cy={cy} r="3" fill={fig} />
              </g>
            );
          })}
          <text x="200" y="320" textAnchor="middle" fill={ink} opacity={0.45}
            fontFamily="monospace" fontSize="13" letterSpacing="3">DRYLOCK · SiO₂</text>
        </g>
      );
    case "shield":
      return (
        <g>
          <path
            d="M200 70 280 100v70c0 55-38 92-80 110-42-18-80-55-80-110v-70L200 70Z"
            fill="none"
            stroke={fig}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path d="M200 90 262 113v57c0 44-30 74-62 89" fill={accent} opacity={0.12} />
          <path d="M168 168l24 24 44-52" fill="none" stroke={fig} strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    case "lock":
      return (
        <g>
          <rect x="135" y="175" width="130" height="100" fill="none" stroke={fig} strokeWidth="2.5" />
          <path d="M160 175v-22a40 40 0 0 1 80 0v22" fill="none" stroke={fig} strokeWidth="2.5" />
          <circle cx="200" cy="218" r="12" fill={accent} opacity={0.2} />
          <path d="M200 218v26" stroke={fig} strokeWidth="2.5" strokeLinecap="round" />
        </g>
      );
    case "rings":
      return (
        <g>
          {[70, 52, 34].map((r, i) => (
            <circle key={i} cx="200" cy="190" r={r} fill="none" stroke={fig}
              strokeWidth="2" opacity={1 - i * 0.18} />
          ))}
          <circle cx="200" cy="190" r="16" fill={accent} opacity={0.2} />
          <path d="M130 190h-30M300 190h-30M200 120v-30M200 290v-30" stroke={fig} strokeWidth="1.5" />
        </g>
      );
    case "absorb":
      return (
        <g>
          {Array.from({ length: 6 }).map((_, i) => {
            const x = 110 + (i % 3) * 70;
            const y = 150 + Math.floor(i / 3) * 70;
            return (
              <g key={i}>
                <rect x={x - 22} y={y - 22} width="44" height="44" fill="none" stroke={fig} strokeWidth="1.75" />
                <circle cx={x} cy={y} r={6 + rand() * 6} fill={accent} opacity={0.18} />
              </g>
            );
          })}
        </g>
      );
    case "compass":
    default:
      return (
        <g>
          <circle cx="200" cy="190" r="80" fill="none" stroke={fig} strokeWidth="2" />
          <path
            d="M200 110 214 176 280 190 214 204 200 270 186 204 120 190 186 176 200 110Z"
            fill={accent}
            opacity={0.85}
          />
          <circle cx="200" cy="190" r="80" fill="none" stroke={fig} strokeWidth="2" strokeDasharray="2 8" />
        </g>
      );
  }
}
