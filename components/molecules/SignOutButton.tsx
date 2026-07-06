"use client";

import { useState } from "react";
import Button from "@/components/atoms/Button";
import { useAuth } from "@/contexts/AuthContext";

export default function SignOutButton() {
  const { signOut } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  async function handleClick() {
    setSubmitting(true);
    try {
      await signOut();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={submitting}
    >
      {submitting ? "…" : "Sign out"}
    </Button>
  );
}
