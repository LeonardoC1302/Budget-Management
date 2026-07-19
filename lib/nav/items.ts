export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: "◐" },
  { href: "/transactions", label: "Activity", icon: "≡" },
  { href: "/add", label: "Add", icon: "+" },
  { href: "/recurring", label: "Recurring", icon: "↻" },
  { href: "/budgets", label: "Budgets", icon: "◧" },
  { href: "/accounts", label: "Accounts", icon: "◫" },
  { href: "/investments", label: "Invest", icon: "▲" },
  { href: "/goals", label: "Goals", icon: "◎" },
];
