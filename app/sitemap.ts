import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site/url";

// Only the public pages. App screens are behind sign-in and marked noindex.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const updated = new Date("2026-09-30");
  return [
    { url: `${base}/`, lastModified: updated, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/privacy`, lastModified: updated, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms`, lastModified: updated, changeFrequency: "yearly", priority: 0.3 },
  ];
}
