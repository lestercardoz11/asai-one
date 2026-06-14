import Link from "next/link";
import { Logo } from "@/components/shell/logo";
import {
  InstagramIcon,
  LinkedInIcon,
  YouTubeIcon,
  MailIcon,
  PinIcon,
} from "@/components/icons";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Shop",
    links: [
      { label: "All Products", href: "/shop" },
      { label: "2-Wheeler", href: "/commute/2-wheeler" },
      { label: "Best Sellers", href: "/shop?sort=best" },
      { label: "New Arrivals", href: "/shop?sort=new" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Account", href: "/account" },
    ],
  },
  {
    title: "Policies",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms & Conditions", href: "/terms" },
      { label: "Shipping Policy", href: "/shipping-policy" },
      { label: "Refund Policy", href: "/refund-policy" },
    ],
  },
];

const SOCIAL = [
  { label: "Instagram", href: "https://instagram.com", Icon: InstagramIcon },
  { label: "LinkedIn", href: "https://linkedin.com", Icon: LinkedInIcon },
  { label: "YouTube", href: "https://youtube.com", Icon: YouTubeIcon },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-warm-white text-ink-60">
      <div className="container-page grid grid-cols-2 gap-x-6 gap-y-10 py-16 md:grid-cols-12">
        {/* brand */}
        <div className="col-span-2 md:col-span-4">
          <Logo href={null} />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-60">
            Mode-based commuter essentials. Functional, minimal kit engineered for
            how you actually get there — starting with two wheels.
          </p>
          <div className="mt-6 flex flex-col gap-2 text-sm text-ink-60">
            <a href="mailto:support@asai.one" className="inline-flex items-center gap-2 transition-colors hover:text-navy-800">
              <MailIcon className="h-4 w-4" /> support@asai.one
            </a>
            <span className="inline-flex items-center gap-2">
              <PinIcon className="h-4 w-4" /> Pune, Maharashtra
            </span>
          </div>
        </div>

        {/* link columns */}
        {COLUMNS.map((col) => (
          <nav
            key={col.title}
            aria-label={col.title}
            className="md:col-span-2 lg:col-span-2"
          >
            <h3 className="type-mono text-navy-500">{col.title}</h3>
            <ul className="mt-4 flex flex-col gap-2.5">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-60 transition-colors hover:text-navy-800"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        {/* social */}
        <div className="col-span-2 md:col-span-2">
          <h3 className="type-mono text-navy-500">Follow</h3>
          <div className="mt-4 flex gap-2">
            {SOCIAL.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                target="_blank"
                rel="noopener noreferrer"
                className="grid h-10 w-10 place-items-center border border-ink-12 text-ink-60 transition-colors hover:border-navy-800 hover:text-navy-800"
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-ink-12">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 sm:flex-row">
          <p className="type-mono text-[10px] text-ink-30">
            © {new Date().getFullYear()} ASAI.One Private Limited — All rights reserved
          </p>
          <p className="type-mono text-[10px] text-ink-30">
            Designed in Pune · Built for the commute
          </p>
        </div>
      </div>
    </footer>
  );
}
