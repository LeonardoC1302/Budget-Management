"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import MobileNavMenu from "@/components/organisms/MobileNavMenu";
import { NAV_ITEMS } from "@/lib/nav/items";
import { cn } from "@/lib/utils/cn";

export default function BottomNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const activeItem = NAV_ITEMS.find((i) => i.href === pathname);

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed bottom-0 inset-x-0 border-t border-border bg-bg/90 backdrop-blur pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="hidden md:grid max-w-3xl mx-auto grid-cols-8">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 py-3 text-xs transition-colors",
                    active ? "text-accent" : "text-fg-subtle hover:text-fg",
                  )}
                >
                  <span className="text-lg leading-none" aria-hidden>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

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
            <span aria-hidden className="text-lg leading-none">
              {activeItem?.icon ?? "☰"}
            </span>
            <span>{activeItem?.label ?? "Menu"}</span>
          </button>
        </div>
      </nav>

      <MobileNavMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
