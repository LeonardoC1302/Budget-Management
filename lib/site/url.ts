// Absolute base URL for metadata, robots.txt and sitemap.xml.
// Set NEXT_PUBLIC_SITE_URL once the custom domain exists (e.g.
// https://perchcr.dev). Until then Vercel's production URL is used, and local
// builds fall back to localhost.
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}
