"use client";

import { useEffect, useRef, useState } from "react";
import ConfirmDialog from "@/components/atoms/ConfirmDialog";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils/cn";

function initialsOf(name: string): string {
  const parts = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "");
  const value = parts.join("");
  return value || "?";
}

export default function AccountMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(event: MouseEvent) {
      if (containerRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;

  const name =
    user.displayName?.trim() || user.email?.split("@")[0] || "You";
  const email = user.email ?? "";
  const initials = initialsOf(name);

  async function handleSignOut() {
    setSubmitting(true);
    try {
      await signOut();
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Account menu for ${name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-10 h-10 rounded-full overflow-hidden shrink-0",
          "bg-surface-2 border border-border text-fg-muted",
          "flex items-center justify-center",
          "hover:border-border-strong transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
        )}
      >
        {user.photoURL ? (
          // Google profile URLs are dynamic; skip next/image to avoid
          // remote-pattern config for one small avatar.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.photoURL}
            alt=""
            width={40}
            height={40}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-sm font-medium tracking-tight">
            {initials}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className={cn(
            "absolute right-0 top-full mt-2 z-40 min-w-[16rem]",
            "surface p-1.5 shadow-2xl",
          )}
        >
          <div
            role="presentation"
            className="px-3 py-2.5 flex flex-col gap-0.5"
          >
            <span className="text-sm font-medium text-fg truncate">
              {name}
            </span>
            {email && (
              <span className="text-xs text-fg-subtle truncate">
                {email}
              </span>
            )}
          </div>

          <div className="h-px bg-border mx-1 my-1" aria-hidden />

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setConfirmOpen(true);
            }}
            className={cn(
              "w-full text-left px-3 py-2.5 rounded-[8px]",
              "text-sm text-fg-muted hover:text-fg hover:bg-surface-2",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
              "transition-colors",
            )}
          >
            Sign out
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Sign out of Perch?"
        message="Your data stays where it is. You'll need to sign in with Google again to open it."
        confirmLabel="Sign out"
        cancelLabel="Stay signed in"
        tone="danger"
        submitting={submitting}
        onConfirm={handleSignOut}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
