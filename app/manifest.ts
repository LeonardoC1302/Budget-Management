import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PerchCR",
    short_name: "PerchCR",
    description: "A quiet place for your money to rest.",
    // Installed copies are identified by `id`. It was implicitly "/" (the old
    // start_url); pinning it keeps existing installs the same app now that
    // the app opens at /home ("/" shows the same dashboard).
    id: "/",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0a0b",
    theme_color: "#0a0a0b",
    categories: ["finance", "productivity"],
    // Long-press the installed icon on Android to jump straight to these.
    // Each one can also be dragged to the home screen as its own icon.
    shortcuts: [
      {
        name: "Add transaction",
        short_name: "Add",
        url: "/add",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Transactions",
        short_name: "Activity",
        url: "/transactions",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Budgets",
        short_name: "Budgets",
        url: "/budgets",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
