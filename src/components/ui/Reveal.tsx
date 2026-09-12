import { cn } from "@/lib/cn";

const DELAYS = ["", "rev-d1", "rev-d2", "rev-d3", "rev-d4", "rev-d5"] as const;

/**
 * Ports .rev / .rev-d1…d5 — the staggered fade-up used on every page of
 * the prototype. Stays a server component: it only emits class names.
 * <Stage> flips the `data-revealed` attribute that triggers them, and
 * under prefers-reduced-motion the rules don't exist at all, so content
 * renders visible with no JS involved.
 */
export function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className,
}: {
  children: React.ReactNode;
  delay?: 0 | 1 | 2 | 3 | 4 | 5;
  as?: "div" | "section" | "li";
  className?: string;
}) {
  return (
    <Tag className={cn("rev", DELAYS[delay], className)}>{children}</Tag>
  );
}
