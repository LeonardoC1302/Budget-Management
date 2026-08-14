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
      <div className="flex flex-col gap-6">
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
}

function NavGroup({ heading, items, pathname, onClose }: NavGroupProps) {
  return (
    <div className="flex flex-col gap-3">
      <span className="kicker">{heading}</span>
      <div
        className="rooms"
        style={{ background: "var(--color-surface-2)" }}
      >
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.Icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 px-4 py-3.5 transition-colors min-h-11",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
                active
                  ? "text-fg"
                  : "text-fg-muted hover:text-fg hover:bg-surface",
              )}
            >
              {active && (
                <span
                  aria-hidden
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "var(--color-celadon)" }}
                />
              )}
              <Icon width={20} height={20} aria-hidden />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
