import { renderAppIcon } from "@/lib/pwa/appIcon";

export const dynamic = "force-static";
export const contentType = "image/png";

export function GET() {
  return renderAppIcon({ size: 192 });
}
