"use client";

// Last resort when the root layout itself fails: no providers, fonts or
// stylesheet are guaranteed, so it's self-contained and bilingual.
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#16181b",
          color: "#f0ede2",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <main style={{ maxWidth: 480, padding: 24 }}>
          <p style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "#c1bcae" }}>
            PerchCR
          </p>
          <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 400, fontSize: 36, lineHeight: 1.1, margin: "12px 0" }}>
            Something went wrong.
          </h1>
          <p style={{ color: "#c1bcae", lineHeight: 1.6 }}>
            PerchCR couldn&apos;t load. Your data is safe.
            <br />
            PerchCR no pudo cargar. Tus datos están a salvo.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 16,
              height: 44,
              padding: "0 18px",
              border: 0,
              borderRadius: 4,
              background: "#a3d1c1",
              color: "#0f1613",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Try again · Reintentar
          </button>
        </main>
      </body>
    </html>
  );
}
