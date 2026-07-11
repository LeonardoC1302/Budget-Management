import type { Metadata, Viewport } from "next";
import "./globals.css";
import PWARegister from "@/components/atoms/PWARegister";
import AppShell from "@/components/organisms/AppShell";

export const metadata: Metadata = {
  title: "Perch",
  description: "Perch — track your income and expenses.",
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
  themeColor: "#0a0a0b",
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
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">
        <AppShell>{children}</AppShell>
        <PWARegister />
      </body>
    </html>
  );
}
