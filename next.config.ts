import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Supabase project origin (for connect-src). Derived from the public URL so the
// CSP follows the configured project without hand-editing.
const supabaseOrigin = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
      : "";
  } catch {
    return "";
  }
})();
const supabaseWs = supabaseOrigin ? supabaseOrigin.replace(/^https/, "wss") : "";

/**
 * Content-Security-Policy.
 *  • script-src allows Razorpay's checkout.js. 'unsafe-inline' is required for
 *    Next's inline bootstrap/hydration scripts (no nonce pipeline here); 'unsafe-eval'
 *    is added only in dev for Fast Refresh.
 *  • connect-src allows Supabase REST + Realtime (wss) and Razorpay APIs.
 *  • frame-src allows the Razorpay checkout iframe. frame-ancestors 'none' stops
 *    our own pages being framed (clickjacking).
 */
const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://checkout.razorpay.com`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: https:`,
  `font-src 'self' data:`,
  `connect-src 'self' ${supabaseOrigin} ${supabaseWs} https://api.razorpay.com https://checkout.razorpay.com https://lumberjack.razorpay.com`
    .replace(/\s+/g, " ")
    .trim(),
  `frame-src https://api.razorpay.com https://checkout.razorpay.com`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'none'`,
  `upgrade-insecure-requests`,
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Force HTTPS for two years incl. subdomains. Harmless on localhost (HTTP).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // Lock down powerful features we don't use.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  images: {
    // `images.domains` is deprecated in Next 16 — use remotePatterns. Allow
    // product imagery served from the Supabase Storage bucket (public objects).
    remotePatterns: supabaseOrigin
      ? [
          {
            protocol: "https",
            hostname: new URL(supabaseOrigin).hostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
