import { ImageResponse } from "next/og";

interface IconOptions {
  size: number;
  padding?: number;
}

/**
 * Perch app icon: white bird on a horizontal perch, on a dark
 * canvas that matches the app background. Renders identically at
 * any size — the eye is a small purple accent that disappears at
 * favicon scale, leaving a clean silhouette.
 *
 * The canvas is a full-bleed dark square (not a transparent disc)
 * so iOS and Android don't show wallpaper through the corners
 * when installed as a PWA.
 */
export function renderAppIcon({ size, padding = 0 }: IconOptions) {
  const inner = size - padding * 2;
  const markSize = Math.round(inner * 0.72);

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
        <svg
          width={markSize}
          height={markSize}
          viewBox="0 0 100 100"
          fill="none"
        >
          <rect x="10" y="76" width="80" height="5" rx="2.5" fill="white" />
          <circle cx="53" cy="54" r="17" fill="white" />
          <circle cx="37" cy="42" r="9" fill="white" />
          <path d="M 28 42 L 18 45 L 28 48 Z" fill="white" />
          <rect x="48" y="70" width="2" height="7" fill="white" />
          <rect x="56" y="70" width="2" height="7" fill="white" />
          <circle cx="35" cy="40" r="1.8" fill="#4f46e5" />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
