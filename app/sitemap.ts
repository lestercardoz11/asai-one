import type { MetadataRoute } from "next";
import { getModes, getProducts } from "@/lib/data";

const BASE = "https://asai.one";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [modes, products] = await Promise.all([getModes(), getProducts()]);

  const staticRoutes = [
    "",
    "/shop",
    "/about",
    "/contact",
    "/login",
    "/register",
    "/terms",
    "/privacy",
    "/shipping-policy",
    "/refund-policy",
  ].map((path) => ({
    url: `${BASE}${path}`,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const modeRoutes = modes.map((m) => ({
    url: `${BASE}/commute/${m.slug}`,
    changeFrequency: "weekly" as const,
    priority: m.status === "live" ? 0.8 : 0.4,
  }));

  const productRoutes = products.map((p) => ({
    url: `${BASE}/product/${p.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  return [...staticRoutes, ...modeRoutes, ...productRoutes];
}
