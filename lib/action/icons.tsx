import type { ComponentType, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

export const EditIcon: ComponentType<IconProps> = (props) => (
  <svg {...base(props)}>
    <path d="M4 20h4l10-10-4-4L4 16v4z" />
    <path d="M13.5 6.5l4 4" />
  </svg>
);

export const DeleteIcon: ComponentType<IconProps> = (props) => (
  <svg {...base(props)}>
    <path d="M4 7h16" />
    <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    <path d="M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12" />
  </svg>
);

export const PauseIcon: ComponentType<IconProps> = (props) => (
  <svg {...base(props)}>
    <rect x="7" y="5" width="3" height="14" rx="1" />
    <rect x="14" y="5" width="3" height="14" rx="1" />
  </svg>
);

export const PlayIcon: ComponentType<IconProps> = (props) => (
  <svg {...base(props)}>
    <path d="M8 5l11 7-11 7V5z" />
  </svg>
);

export const TransferIcon: ComponentType<IconProps> = (props) => (
  <svg {...base(props)}>
    <path d="M4 8h14" />
    <path d="M14 4l4 4-4 4" />
    <path d="M20 16H6" />
    <path d="M10 12l-4 4 4 4" />
  </svg>
);

export const RefreshIcon: ComponentType<IconProps> = (props) => (
  <svg {...base(props)}>
    <path d="M20 12a8 8 0 0 1-13.7 5.6" />
    <path d="M4 12a8 8 0 0 1 13.7-5.6" />
    <path d="M17 3v4h-4" />
    <path d="M7 21v-4h4" />
  </svg>
);
