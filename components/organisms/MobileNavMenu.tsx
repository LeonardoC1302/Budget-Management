"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Modal from "@/components/atoms/Modal";
import {
  PRIMARY_ITEMS,
  SECONDARY_ITEMS,
  type NavItem,
} from "@/lib/nav/items";
import { cn } from "@/lib/utils/cn";

interface MobileNavMenuProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileNavMenu({ open, onClose }: MobileNavMenuProps) {
  const pathname = usePathname();

  return (
    <Modal open={open} onClose={onClose} title="Navigate">
      <div className="flex flex-col gap-5">
        <NavGroup
          heading="Everyday"
          items={PRIMARY_ITEMS}
          pathname={pathname}
          onClose={onClose}
        />
        <NavGroup
          heading="Reference"
          items={SECONDARY_ITEMS}
          pathname={pathname}
          onClose={onClose}
          muted
        />
      </div>
    </Modal>
  );
}

interface NavGroupProps {
  heading: string;
  items: NavItem[];
  pathname: string;
  onClose: () => void;
  muted?: boolean;
}

function NavGroup({ heading, items, pathname, onClose, muted }: NavGroupProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="label-sm px-1">{heading}</span>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item, idx) => {
          const active = pathname === item.href;
          const Icon = item.Icon;
          const isLastOdd = idx === items.length - 1 && items.length % 2 === 1;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex flex-col items-center justify-center gap-2 h-24 rounded-[14px]",
                "border transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
                isLastOdd && "col-span-2",
                active
                  ? "border-accent bg-accent/10 text-accent"
                  : muted
                    ? "border-border bg-surface-2 text-fg-subtle hover:text-fg hover:border-border-strong"
                    : "border-border bg-surface-2 text-fg-muted hover:text-fg hover:border-border-strong",
              )}
            >
              <Icon width={22} height={22} aria-hidden />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
