import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site/url";

// Public pages are crawlable. App screens stay crawlable too (so crawlers can
// read their noindex tag) except /api, which has nothing to index.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${siteUrl()}/sitemap.xml`,
    host: siteUrl(),
  };
}
