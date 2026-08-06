import type { ComponentType, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

export const HomeIcon: ComponentType<IconProps> = (props) => (
  <svg {...base(props)}>
    <path d="M3.5 11 12 4l8.5 7" />
    <path d="M5.5 10v9a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-9" />
    <path d="M10 20v-5h4v5" />
  </svg>
);

export const ActivityIcon: ComponentType<IconProps> = (props) => (
  <svg {...base(props)}>
    <path d="M4 6h16" />
    <path d="M4 12h16" />
    <path d="M4 18h10" />
  </svg>
);

export const AddIcon: ComponentType<IconProps> = (props) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 8v8" />
    <path d="M8 12h8" />
  </svg>
);

export const RecurringIcon: ComponentType<IconProps> = (props) => (
  <svg {...base(props)}>
    <path d="M20 12a8 8 0 0 1-13.7 5.6" />
    <path d="M4 12a8 8 0 0 1 13.7-5.6" />
    <path d="M17 3v4h-4" />
    <path d="M7 21v-4h4" />
  </svg>
);

export const BudgetsIcon: ComponentType<IconProps> = (props) => (
  <svg {...base(props)}>
    <path d="M4 20V10" />
    <path d="M10 20V4" />
    <path d="M16 20v-8" />
    <path d="M3 20h18" />
  </svg>
);

export const AccountsIcon: ComponentType<IconProps> = (props) => (
  <svg {...base(props)}>
    <rect x="3" y="6" width="18" height="13" rx="2" />
    <path d="M3 10h18" />
    <path d="M16 15h2" />
  </svg>
);

export const CardsIcon: ComponentType<IconProps> = (props) => (
  <svg {...base(props)}>
    <rect x="3" y="6" width="18" height="12" rx="2.5" />
    <path d="M3 10h18" />
    <path d="M7 14.5h4" />
  </svg>
);

export const InvestIcon: ComponentType<IconProps> = (props) => (
  <svg {...base(props)}>
    <path d="M4 17l6-6 3 3 7-8" />
    <path d="M14 6h6v6" />
  </svg>
);

export const GoalsIcon: ComponentType<IconProps> = (props) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);

export const MoreIcon: ComponentType<IconProps> = (props) => (
  <svg {...base(props)}>
    <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);
