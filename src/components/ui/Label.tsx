import { cn } from "@/lib/cn";

/**
 * Eyebrow / section label.
 * Ports .chapter-label, .form-label and .cover-front-edition — the same
 * rule at three sizes. Uppercase, 600 weight, heavy tracking, taupe.
 */
export function Label({
  children,
  as: Tag = "div",
  size = "md",
  htmlFor,
  className,
}: {
  children: React.ReactNode;
  as?: "div" | "span" | "p" | "h2" | "label";
  size?: "sm" | "md" | "lg";
  htmlFor?: string;
  className?: string;
}) {
  return (
    <Tag
      htmlFor={htmlFor}
      className={cn(
        "font-semibold uppercase text-taupe",
        size === "sm" && "text-[12px] tracking-label",
        size === "md" && "text-[13px] tracking-label",
        size === "lg" && "text-[13px] tracking-label-wide",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
