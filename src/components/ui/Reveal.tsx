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
  on = "open",
  as: Tag = "div",
  className,
}: {
  children: React.ReactNode;
  delay?: 0 | 1 | 2 | 3 | 4 | 5;
  /**
   * "open" — waits for the book to be most of the way open. For content
   * on the leaf, which isn't visible until then anyway.
   * "cover" — comes in while the book is still shut. For content printed
   * on the cover itself.
   */
  on?: "open" | "cover";
  as?: "div" | "section" | "li";
  className?: string;
}) {
  return (
    <Tag
      className={cn("rev", on === "cover" && "rev-cover", DELAYS[delay], className)}
    >
      {children}
    </Tag>
  );
}
