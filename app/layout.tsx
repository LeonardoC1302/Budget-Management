import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/organisms/BottomNav";

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
        <main className="flex-1 w-full max-w-2xl mx-auto px-4 pt-6 pb-28 sm:px-6">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
