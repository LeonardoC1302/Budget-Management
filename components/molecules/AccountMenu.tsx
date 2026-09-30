"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ConfirmDialog from "@/components/atoms/ConfirmDialog";
import { useAuth } from "@/contexts/AuthContext";
import { hasUnsyncedChanges } from "@/lib/offline/syncStatus";
import { cn } from "@/lib/utils/cn";

import { t } from "@/lib/i18n";
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
  // Signing out clears this device's offline copy, so changes that haven't
  // reached the server yet would be lost. Block it until they sync.
  const [unsynced, setUnsynced] = useState(false);
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
    user.displayName?.trim() || user.email?.split("@")[0] || t("You");
  const email = user.email ?? "";
  const initials = initialsOf(name);

  async function handleSignOut() {
    if (hasUnsyncedChanges()) {
      setUnsynced(true);
      return;
    }
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
        aria-label={t("Account menu for {name}", { name })}
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
          aria-label={t("Account")}
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

          <Link
            href="/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className={cn(
              "block w-full text-left px-3 py-2.5 rounded-[8px]",
              "text-sm text-fg-muted hover:text-fg hover:bg-surface-2",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
              "transition-colors",
            )}
          >
            {t("Settings")}
          </Link>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setUnsynced(false);
              setConfirmOpen(true);
            }}
            className={cn(
              "w-full text-left px-3 py-2.5 rounded-[8px]",
              "text-sm text-fg-muted hover:text-fg hover:bg-surface-2",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
              "transition-colors",
            )}
          >
            {t("Sign out")}
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={t("Sign out of Perch?")}
        message={
          unsynced
            ? t("Some changes on this device haven't synced yet. Connect to the internet and wait for “Syncing changes” to finish, or they'll be lost.")
            : t("Your data stays where it is. You'll need to sign in with Google again to open it.")
        }
        confirmLabel={t("Sign out")}
        cancelLabel={t("Stay signed in")}
        tone="danger"
        submitting={submitting}
        onConfirm={handleSignOut}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
