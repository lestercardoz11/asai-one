import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Phase 2 runs on synchronous mock data, so every route renders as a static
  // shell — client navigations are already instant via static prerender + Link
  // prefetch. Cache Components / `unstable_instant` validation only earns its
  // keep once real async data lands behind Suspense (Phase 3). See
  // docs/PHASE-0-2-DELIVERY.md for the rationale.
  images: {
    // `images.domains` is deprecated in Next 16 — use remotePatterns. We ship
    // branded SVG art instead of external photography, so none are needed yet.
    remotePatterns: [],
  },
};

export default nextConfig;
