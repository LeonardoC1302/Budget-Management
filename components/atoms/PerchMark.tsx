interface PerchMarkProps {
  size?: number;
  className?: string;
}

/**
 * The bird-on-a-perch mark. Uses `currentColor` for the silhouette
 * so it inherits its host's text color, plus an accent-colored eye
 * that stays indigo at every scale.
 */
export default function PerchMark({ size = 24, className }: PerchMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden
      className={className}
    >
      <rect x="10" y="76" width="80" height="5" rx="2.5" fill="currentColor" />
      <circle cx="53" cy="54" r="17" fill="currentColor" />
      <circle cx="37" cy="42" r="9" fill="currentColor" />
      <path d="M 28 42 L 18 45 L 28 48 Z" fill="currentColor" />
      <rect x="48" y="70" width="2" height="7" fill="currentColor" />
      <rect x="56" y="70" width="2" height="7" fill="currentColor" />
      <circle cx="35" cy="40" r="2.4" fill="var(--color-accent)" />
    </svg>
  );
}
