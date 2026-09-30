"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Signed-in visitors who land on "/" go straight to the app. Links from
 * inside the app add `?stay` so people can still reach this page on purpose.
 */
export default function SignedInRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;
    if (new URLSearchParams(window.location.search).has("stay")) return;
    router.replace("/home");
  }, [user, loading, router]);

  return null;
}
