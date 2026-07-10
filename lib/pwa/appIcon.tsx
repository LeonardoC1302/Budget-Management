import { ImageResponse } from "next/og";

export const dynamic = "force-static";

interface IconOptions {
  size: number;
  padding?: number;
}

export function renderAppIcon({ size, padding = 0 }: IconOptions) {
  const inner = size - padding * 2;
  const badgeRadius = Math.round(inner * 0.22);
  const fontSize = Math.round(inner * 0.58);

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          background: "#0a0a0b",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: inner,
            height: inner,
            borderRadius: badgeRadius,
            background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            fontSize,
            fontWeight: 700,
            fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
            letterSpacing: -2,
          }}
        >
          $
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
