import type { Metadata, Viewport } from "next";
import { Geist, Newsreader, Geist_Mono } from "next/font/google";
import "./globals.css";
import PWARegister from "@/components/atoms/PWARegister";
import ThemeProvider from "@/components/atoms/ThemeProvider";
import RootProviders from "@/components/organisms/RootProviders";
import { siteUrl } from "@/lib/site/url";

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

const DESCRIPTION =
  "Track accounts, spending, budgets and savings goals in colones and dollars. Log purchases in seconds, even offline, and see where your month stands.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Perch — a quiet place for your money to rest",
    template: "%s · Perch",
  },
  description: DESCRIPTION,
  applicationName: "Perch",
  keywords: [
    "presupuesto",
    "finanzas personales",
    "control de gastos",
    "colones y dólares",
    "Costa Rica",
    "budget app",
    "expense tracker",
    "personal finance",
  ],
  openGraph: {
    type: "website",
    siteName: "Perch",
    title: "Perch — a quiet place for your money to rest",
    description: DESCRIPTION,
    locale: "en_US",
    alternateLocale: ["es_CR"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Perch — a quiet place for your money to rest",
    description: DESCRIPTION,
  },
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
          <RootProviders>{children}</RootProviders>
        </ThemeProvider>
        <PWARegister />
      </body>
    </html>
  );
}
