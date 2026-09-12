import { cn } from "@/lib/cn";

/** Ports .cover-front-rule — the 80×1px taupe rule. */
export function Rule({
  className,
  align = "center",
}: {
  className?: string;
  align?: "center" | "start";
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "h-px w-20 bg-taupe",
        align === "center" && "mx-auto",
        className,
      )}
    />
  );
}

/** Ports .ornament / .ornament-diamond — a 6px taupe square on its point. */
export function Ornament({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("flex items-center gap-3.5", className)}>
      <span className="size-1.5 rotate-45 bg-taupe" />
      <span className="h-px flex-1 bg-taupe/30" />
    </div>
  );
}

/**
 * Ports .cover-front-corner / -corner-bl — the L-shaped 1px brackets.
 * Rendered as a pair on opposite corners; hidden below 480px, where the
 * prototype's 80px padding no longer exists to hold them.
 */
export function CornerBrackets({
  corners = "tr-bl",
}: {
  corners?: "tr-bl" | "tl-br";
}) {
  const box =
    "pointer-events-none absolute hidden size-8 opacity-60 min-[480px]:block lg:size-12";
  return (
    <>
      {corners === "tr-bl" ? (
        <>
          <span
            aria-hidden
            className={cn(box, "top-6 right-6 border-t border-r border-taupe lg:top-8 lg:right-8")}
          />
          <span
            aria-hidden
            className={cn(box, "bottom-6 left-6 border-b border-l border-taupe lg:bottom-8 lg:left-8")}
          />
        </>
      ) : (
        <>
          <span
            aria-hidden
            className={cn(box, "top-6 left-6 border-t border-l border-taupe lg:top-8 lg:left-8")}
          />
          <span
            aria-hidden
            className={cn(box, "right-6 bottom-6 border-r border-b border-taupe lg:right-8 lg:bottom-8")}
          />
        </>
      )}
    </>
  );
}
