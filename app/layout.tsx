import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Barlow_Condensed, Barlow, DM_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart/cart-context";
import { SiteHeader } from "@/components/shell/site-header";
import { SiteFooter } from "@/components/shell/site-footer";
import { ToastViewport } from "@/components/ui/toast";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

const barlow = Barlow({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-barlow",
  display: "swap",
});

const dmMono = DM_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-dm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://asai.one"),
  title: {
    default: "ASAI.One — Mode-based commuter essentials",
    template: "%s · ASAI.One",
  },
  description:
    "Shop by how you commute. Functional, minimal essentials engineered for the daily ride — starting with 2-Wheeler.",
  keywords: [
    "commuter essentials",
    "2-wheeler accessories",
    "ASAI",
    "minimal",
    "India",
  ],
  openGraph: {
    title: "ASAI.One — Mode-based commuter essentials",
    description: "Shop by how you commute.",
    type: "website",
    locale: "en_IN",
    siteName: "ASAI.One",
  },
  twitter: { card: "summary_large_image" },
  // Renders <meta name="apple-mobile-web-app-title" content="ASAI.One" />.
  // The favicon, icons, apple-icon and manifest are auto-detected by Next.js
  // from the matching files in the app/ directory.
  appleWebApp: { title: "ASAI.One" },
};

export const viewport: Viewport = {
  themeColor: "#0b1624",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bebas.variable} ${barlowCondensed.variable} ${barlow.variable} ${dmMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-near-white text-ink">
        <CartProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-navy-800 focus:px-4 focus:py-2 focus:text-white type-condensed text-xs"
          >
            Skip to content
          </a>
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
          <ToastViewport />
        </CartProvider>
      </body>
    </html>
  );
}
