import type { ComponentType, SVGProps } from "react";
import {
  AccountsIcon,
  ActivityIcon,
  AddIcon,
  BudgetsIcon,
  GoalsIcon,
  HomeIcon,
  InvestIcon,
  RecurringIcon,
} from "@/lib/nav/icons";

export type NavGroup = "primary" | "secondary";

export interface NavItem {
  href: string;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  group: NavGroup;
}

/**
 * Bottom-nav grouping:
 * - primary: the four most frequent actions (Home, Activity, Add, Budgets).
 * - secondary: reference and less frequent surfaces.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", Icon: HomeIcon, group: "primary" },
  { href: "/transactions", label: "Activity", Icon: ActivityIcon, group: "primary" },
  { href: "/add", label: "Add", Icon: AddIcon, group: "primary" },
  { href: "/budgets", label: "Budgets", Icon: BudgetsIcon, group: "primary" },
  { href: "/goals", label: "Goals", Icon: GoalsIcon, group: "secondary" },
  { href: "/recurring", label: "Recurring", Icon: RecurringIcon, group: "secondary" },
  { href: "/accounts", label: "Accounts", Icon: AccountsIcon, group: "secondary" },
  { href: "/investments", label: "Invest", Icon: InvestIcon, group: "secondary" },
];

export const PRIMARY_ITEMS = NAV_ITEMS.filter((i) => i.group === "primary");
export const SECONDARY_ITEMS = NAV_ITEMS.filter((i) => i.group === "secondary");
