import type { SVGProps } from "react";
import type { ModeIcon } from "@/lib/types";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/* ── Brand: 8-point compass / nautical star (the ASAI mark) ─────────────────── */
export function CompassMark(props: IconProps) {
  return (
    <svg {...base} fill="none" {...props}>
      <circle cx="12" cy="12" r="9.25" strokeWidth={1.25} />
      <path
        d="M12 2.5 13.4 10.6 21.5 12 13.4 13.4 12 21.5 10.6 13.4 2.5 12 10.6 10.6 12 2.5Z"
        fill="currentColor"
        stroke="none"
      />
      <path
        d="m17.3 6.7-2.6 2.6M9.3 14.7l-2.6 2.6M6.7 6.7l2.6 2.6M14.7 14.7l2.6 2.6"
        strokeWidth={1}
        opacity={0.5}
      />
    </svg>
  );
}

/* ── Commute mode icons ─────────────────────────────────────────────────────── */
export function TwoWheelerIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="5.5" cy="17" r="3.5" />
      <circle cx="18.5" cy="17" r="3.5" />
      <path d="M5.5 17 9 9h4l2.5 4M18.5 17l-3-7.5M9 9l-1.5-3H5.5M13 9h3.5" />
      <path d="M9 9h6" opacity={0.5} />
    </svg>
  );
}

export function FourWheelerIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 13.5 4.7 8.6A2 2 0 0 1 6.6 7.2h10.8a2 2 0 0 1 1.9 1.4L21 13.5" />
      <path d="M3 13.5h18v4.2a.8.8 0 0 1-.8.8h-1.6a.8.8 0 0 1-.8-.8V17H6.2v.7a.8.8 0 0 1-.8.8H3.8a.8.8 0 0 1-.8-.8V13.5Z" />
      <circle cx="7" cy="14.5" r="1" />
      <circle cx="17" cy="14.5" r="1" />
    </svg>
  );
}

export function PedestrianIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="4.2" r="1.8" />
      <path d="M12 7v6m0 0-3 7m3-7 3 7M8.5 10l3.5-1.5L15.5 10" />
    </svg>
  );
}

export function PublicTransportIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="3.5" width="16" height="14" rx="1" />
      <path d="M4 12h16M8 3.5v8.5M16 3.5v8.5" opacity={0.6} />
      <path d="M7 17.5 5.5 20.5M17 17.5l1.5 3" />
      <circle cx="8" cy="14.7" r=".7" fill="currentColor" />
      <circle cx="16" cy="14.7" r=".7" fill="currentColor" />
    </svg>
  );
}

export const MODE_ICONS: Record<ModeIcon, (p: IconProps) => React.ReactElement> = {
  "two-wheeler": TwoWheelerIcon,
  "four-wheeler": FourWheelerIcon,
  pedestrian: PedestrianIcon,
  "public-transport": PublicTransportIcon,
};

/* ── UI icons ───────────────────────────────────────────────────────────────── */
export function CartIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 4h2l1.5 11.5a1.2 1.2 0 0 0 1.2 1H18a1.2 1.2 0 0 0 1.2-1L20.5 7H6" />
      <circle cx="9" cy="19.5" r="1.2" />
      <circle cx="17" cy="19.5" r="1.2" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.5-4.5" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 5 19 19M19 5 5 19" />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m15 5-7 7 7 7" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m5 9 7 7 7-7" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 12h16M14 6l6 6-6 6" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function MinusIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 12h14" />
    </svg>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5l2.6 5.3 5.9.85-4.25 4.15 1 5.85L12 17l-5.25 2.7 1-5.85L3.5 9.65l5.9-.85L12 3.5Z" />
    </svg>
  );
}

export function HeartIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 20.5 4.2 12.9a4.6 4.6 0 0 1 0-6.6 4.7 4.7 0 0 1 6.6 0l1.2 1.2 1.2-1.2a4.7 4.7 0 0 1 6.6 0 4.6 4.6 0 0 1 0 6.6L12 20.5Z" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 12.5 9 17.5 20 6.5" />
    </svg>
  );
}

export function TruckIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 6.5h11v9H3zM14 9.5h4l3 3v3h-7z" />
      <circle cx="7" cy="17" r="1.5" />
      <circle cx="17.5" cy="17" r="1.5" />
    </svg>
  );
}

export function ReturnIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 5 4.5 9.5 9 14" />
      <path d="M4.5 9.5H15a4.5 4.5 0 0 1 0 9H8" />
    </svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3 5 5.5v5.7c0 4.3 3 7.4 7 9 4-1.6 7-4.7 7-9V5.5L12 3Z" />
      <path d="m9 11.5 2 2 4-4.5" />
    </svg>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="5" y="10.5" width="14" height="9.5" rx="1" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
      <circle cx="12" cy="15" r="1" fill="currentColor" />
    </svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5.5" width="18" height="13" rx="1" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 6.2 2 2 0 0 1 6.5 4Z" />
    </svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}

export function FilterIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 5h18M6 12h12M10 19h4" />
    </svg>
  );
}

export function PinIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

/* ── Social ─────────────────────────────────────────────────────────────────── */
export function InstagramIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17" cy="7" r=".9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function LinkedInIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
      <path d="M8 10.5V17M8 7.5v.01M12 17v-3.5a2 2 0 0 1 4 0V17" />
    </svg>
  );
}

export function YouTubeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="6" width="18" height="12" rx="3" />
      <path d="m10.5 9.5 4 2.5-4 2.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ── Admin nav icons ────────────────────────────────────────────────────────── */
export function GridIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="0.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="0.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="0.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="0.5" />
    </svg>
  );
}

export function BoxIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3 20.5 7.5v9L12 21 3.5 16.5v-9L12 3Z" />
      <path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" />
    </svg>
  );
}

export function ReceiptIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 3h14v18l-2.3-1.5L14.4 21 12 19.5 9.6 21 7.3 19.5 5 21V3Z" />
      <path d="M8.5 8h7M8.5 12h7M8.5 16h4" opacity={0.7} />
    </svg>
  );
}

export function FileTextIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M13 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V9L13 3Z" />
      <path d="M13 3v6h6" />
      <path d="M8.5 13h7M8.5 16.5h5" opacity={0.7} />
    </svg>
  );
}
