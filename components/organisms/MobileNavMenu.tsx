"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Modal from "@/components/atoms/Modal";
import { NAV_ITEMS, type NavItem } from "@/lib/nav/items";
import { cn } from "@/lib/utils/cn";

interface MobileNavMenuProps {
  open: boolean;
  onClose: () => void;
}

const REMAINDER_COLS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
};

export default function MobileNavMenu({ open, onClose }: MobileNavMenuProps) {
  const pathname = usePathname();

  const perRow = 3;
  const fullCount = Math.floor(NAV_ITEMS.length / perRow) * perRow;
  const fullRows = NAV_ITEMS.slice(0, fullCount);
  const remainder = NAV_ITEMS.slice(fullCount);

  const renderTile = (item: NavItem) => {
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
  };

  return (
    <Modal open={open} onClose={onClose} title="Navigate">
      <div className="flex flex-col gap-3">
        {fullRows.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {fullRows.map(renderTile)}
          </div>
        )}
        {remainder.length > 0 && (
          <div
            className={cn(
              "grid gap-3",
              REMAINDER_COLS[remainder.length] ?? "grid-cols-3",
            )}
          >
            {remainder.map(renderTile)}
          </div>
        )}
      </div>
    </Modal>
  );
}
