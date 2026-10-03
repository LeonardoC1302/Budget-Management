import { ImageResponse } from "next/og";

// The preview shown when a PerchCR link is shared: the mark on the app's warm
// night, the name and the tagline.
export const alt = "PerchCR — a quiet place for your money to rest";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background:
            "radial-gradient(900px 520px at 18% -10%, rgba(255,218,175,0.16), rgba(255,218,175,0.05) 40%, transparent 70%), #16181b",
          color: "#f0ede2",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width={64} height={64} viewBox="0 0 100 100" fill="none">
            <rect x="10" y="76" width="80" height="5" rx="2.5" fill="#f0ede2" />
            <circle cx="53" cy="54" r="17" fill="#f0ede2" />
            <circle cx="37" cy="42" r="9" fill="#f0ede2" />
            <path d="M 28 42 L 18 45 L 28 48 Z" fill="#f0ede2" />
            <rect x="48" y="70" width="2" height="7" fill="#f0ede2" />
            <rect x="56" y="70" width="2" height="7" fill="#f0ede2" />
            <circle cx="35" cy="40" r="1.8" fill="#a3d1c1" />
          </svg>
          <span style={{ fontSize: 30, letterSpacing: 10, textTransform: "uppercase" }}>
            PerchCR
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <span style={{ fontSize: 76, lineHeight: 1.04, letterSpacing: -2, maxWidth: 900 }}>
            A quiet place for your money to rest.
          </span>
          <span style={{ fontSize: 30, color: "#c1bcae" }}>
            Colones and dollars · budgets · goals · works offline
          </span>
        </div>
        <div style={{ height: 1, background: "rgba(255,255,255,0.16)" }} />
      </div>
    ),
    size,
  );
}
