"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import MobileNavMenu from "@/components/organisms/MobileNavMenu";
import { NAV_ITEMS, PRIMARY_ITEMS, SECONDARY_ITEMS, type NavItem } from "@/lib/nav/items";
import { cn } from "@/lib/utils/cn";

export default function BottomNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const activeItem = NAV_ITEMS.find((i) => i.href === pathname);
  const ActiveIcon = activeItem?.Icon;

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed bottom-0 inset-x-0 border-t border-border bg-bg/90 backdrop-blur pb-[env(safe-area-inset-bottom)]"
      >
        <div className="hidden md:flex max-w-3xl mx-auto items-stretch">
          <ul className="grid grid-cols-4 flex-1">
            {PRIMARY_ITEMS.map((item) => (
              <NavCell key={item.href} item={item} active={pathname === item.href} />
            ))}
          </ul>
          <div className="w-px my-3 bg-border" aria-hidden />
          <ul className="grid grid-cols-4 flex-1">
            {SECONDARY_ITEMS.map((item) => (
              <NavCell
                key={item.href}
                item={item}
                active={pathname === item.href}
                muted
              />
            ))}
          </ul>
        </div>

        <div className="md:hidden flex items-center justify-center py-3">
          <button
            type="button"
            aria-label="Open navigation menu"
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className={cn(
              "flex items-center gap-2 px-5 h-11 rounded-full",
              "bg-accent text-white font-medium text-sm shadow-lg",
              "active:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
            )}
          >
            {ActiveIcon ? (
              <ActiveIcon width={18} height={18} aria-hidden />
            ) : null}
            <span>{activeItem?.label ?? "Menu"}</span>
          </button>
        </div>
      </nav>

      <MobileNavMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

interface NavCellProps {
  item: NavItem;
  active: boolean;
  muted?: boolean;
}

function NavCell({ item, active, muted }: NavCellProps) {
  const Icon = item.Icon;
  return (
    <li>
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative flex flex-col items-center justify-center gap-1 py-3 text-xs transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 rounded-md",
          active
            ? "text-accent"
            : muted
              ? "text-fg-subtle/80 hover:text-fg"
              : "text-fg-muted hover:text-fg",
        )}
      >
        {active && (
          <span
            aria-hidden
            className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full bg-accent"
          />
        )}
        <Icon width={22} height={22} aria-hidden />
        <span>{item.label}</span>
      </Link>
    </li>
  );
}
