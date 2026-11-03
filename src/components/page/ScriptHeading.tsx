import { cn } from "@/lib/cn";

/**
 * A page's title in a hand like the wordmark's — "About Us", "Our
 * Services" — set as the page's real heading, so search engines and
 * screen readers read it as one. Focus lands here after a page turn.
 */
export function ScriptHeading({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h1
      data-turn-focus
      tabIndex={-1}
      className={cn("script-heading outline-none", className)}
    >
      {children}
    </h1>
  );
}
