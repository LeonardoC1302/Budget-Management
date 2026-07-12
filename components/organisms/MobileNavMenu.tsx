"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Modal from "@/components/atoms/Modal";
import { NAV_ITEMS } from "@/lib/nav/items";
import { cn } from "@/lib/utils/cn";

interface MobileNavMenuProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileNavMenu({ open, onClose }: MobileNavMenuProps) {
  const pathname = usePathname();

  return (
    <Modal open={open} onClose={onClose} title="Navigate">
      <div className="grid grid-cols-3 gap-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex flex-col items-center justify-center gap-2 h-24 rounded-[14px]",
                "border transition-colors",
                active
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-surface-2 text-fg-muted hover:text-fg hover:border-border-strong",
              )}
            >
              <span className="text-2xl leading-none" aria-hidden>
                {item.icon}
              </span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </Modal>
  );
}
