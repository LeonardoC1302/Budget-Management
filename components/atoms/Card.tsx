import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  as?: "div" | "section" | "article";
  padded?: boolean;
}

export default function Card({
  as: Tag = "div",
  padded = true,
  className,
  ...props
}: CardProps) {
  return (
    <Tag
      className={cn("surface", padded && "p-5", className)}
      {...props}
    />
  );
}
