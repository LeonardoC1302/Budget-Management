import type { Metadata, Viewport } from "next";
import { Geist, Newsreader, Geist_Mono } from "next/font/google";
import "./globals.css";
import PWARegister from "@/components/atoms/PWARegister";
import ThemeProvider from "@/components/atoms/ThemeProvider";
import AppShell from "@/components/organisms/AppShell";

const geistSans = Geist({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-geist-sans",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Perch",
  description: "Perch — a quiet place for your money to rest.",
  applicationName: "Perch",
  appleWebApp: {
    capable: true,
    title: "Perch",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e6e4de" },
    { media: "(prefers-color-scheme: dark)", color: "#16181b" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full ${geistSans.variable} ${newsreader.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
        <PWARegister />
      {/* impeccable-live-start */}
<script src="http://localhost:8400/live.js?token=64fc7728-1c24-41ab-8411-ba08c0053771"></script>
{/* impeccable-live-end */}
</body>
    </html>
  );
}
