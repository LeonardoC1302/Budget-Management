"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const items: NavItem[] = [
  { href: "/", label: "Home", icon: "◐" },
  { href: "/transactions", label: "Activity", icon: "≡" },
  { href: "/add", label: "Add", icon: "+" },
  { href: "/budgets", label: "Budgets", icon: "◧" },
  { href: "/accounts", label: "Accounts", icon: "◫" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 inset-x-0 border-t border-border bg-bg/90 backdrop-blur"
    >
      <ul className="max-w-2xl mx-auto grid grid-cols-5">
        {items.map((item) => {
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
    </nav>
  );
}
