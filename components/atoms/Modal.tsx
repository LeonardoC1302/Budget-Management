"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Alcove modal — a hairline-bordered sheet on mobile, a centered card on
 * desktop. No shadow — depth comes from the backdrop, not from a halo.
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />
      <div
        className={cn(
          "relative w-full sm:max-w-md",
          "bg-surface border border-border",
          "flex flex-col max-h-[90vh]",
          className,
        )}
      >
        <header className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 id="modal-title" className="heading-lg">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 flex items-center justify-center text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors"
            style={{ borderRadius: "var(--radius-control)" }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              aria-hidden
            >
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </header>
        <div className="p-5 overflow-y-auto scrollbar-thin">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
