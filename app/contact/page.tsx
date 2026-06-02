import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/section";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { MailIcon, PinIcon, InstagramIcon, LinkedInIcon, YouTubeIcon } from "@/components/icons";
import { ContactForm } from "@/components/contact/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with the ASAI.One crew. Questions on orders, products or partnerships — reach us by email or social.",
};

const SOCIALS = [
  { label: "Instagram", href: "https://instagram.com", Icon: InstagramIcon },
  { label: "LinkedIn", href: "https://linkedin.com", Icon: LinkedInIcon },
  { label: "YouTube", href: "https://youtube.com", Icon: YouTubeIcon },
] as const;

export default function ContactPage() {
  return (
    <section className="bg-near-white py-16">
      <div className="container-page">
        <Breadcrumb
          items={[{ label: "Home", href: "/" }, { label: "Contact" }]}
          className="mb-8"
        />

        <div className="flex max-w-2xl flex-col gap-3 animate-reveal">
          <Eyebrow>Talk to us</Eyebrow>
          <h1 className="type-display text-5xl text-navy-800 sm:text-6xl">
            Get in touch
          </h1>
          <p className="text-ink-60">
            Have a question? We&apos;d love to hear from you. Send us a message and
            we&apos;ll respond as soon as possible.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
          {/* LEFT — form */}
          <ContactForm />

          {/* RIGHT — business info */}
          <aside className="flex flex-col gap-px border border-ink-12 bg-ink-12">
            <div className="bg-white p-6">
              <h2 className="type-condensed text-sm text-navy-800">Reach us direct</h2>
              <p className="mt-2 text-sm text-ink-60">
                Prefer to skip the form? Here&apos;s where to find us.
              </p>
            </div>

            <div className="flex items-start gap-3 bg-white p-6">
              <MailIcon className="mt-0.5 h-5 w-5 shrink-0 text-navy-500" aria-hidden />
              <div>
                <p className="type-mono text-ink-30">Email</p>
                <a
                  href="mailto:support@asai.one"
                  className="mt-1 block text-[15px] text-navy-800 transition-colors hover:text-navy-500"
                >
                  support@asai.one
                </a>
                <p className="mt-1 text-[13px] text-ink-60">
                  We&apos;ll respond within 24 hours.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white p-6">
              <PinIcon className="mt-0.5 h-5 w-5 shrink-0 text-navy-500" aria-hidden />
              <div>
                <p className="type-mono text-ink-30">Address</p>
                <p className="mt-1 text-[15px] text-navy-800">
                  ASAI.One Private Limited
                  <br />
                  370, Shivaji Nagar, Pune,
                  <br />
                  Maharashtra 411005, India
                </p>
              </div>
            </div>

            <div className="bg-white p-6">
              <p className="type-mono text-ink-30">Follow</p>
              <div className="mt-3 flex items-center gap-2">
                {SOCIALS.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="inline-flex h-11 w-11 items-center justify-center border border-ink-12 text-navy-800 transition-colors hover:bg-navy-800 hover:text-white"
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </a>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
