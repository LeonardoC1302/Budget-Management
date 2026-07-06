import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppShell from "@/components/organisms/AppShell";

export const metadata: Metadata = {
  title: "Budget",
  description: "Track your income and expenses.",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  width: "device-width",
  initialScale: 1,
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
      </body>
    </html>
  );
}
