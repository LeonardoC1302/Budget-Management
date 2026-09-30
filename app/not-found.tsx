import type { Metadata } from "next";
import NotFoundContent from "@/components/public/NotFoundContent";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

export default function NotFound() {
  return <NotFoundContent />;
}
