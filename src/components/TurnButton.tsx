"use client";

import { useTurnPage } from "@/components/Book";
import { cn } from "@/lib/cn";

/**
 * The visible, keyboard-reachable way to turn a page. Scrolling and
 * swiping do the same thing, but a gesture nobody can discover — or
 * perform without a trackpad — can't be the only way through the book.
 */
export function TurnButton({
  to,
  children,
  className,
}: {
  to: "open" | "close";
  children: React.ReactNode;
  className?: string;
}) {
  const { open, close } = useTurnPage();

  return (
    <button
      type="button"
      onClick={to === "open" ? open : close}
      className={cn(
        "group inline-flex items-center gap-3 text-[11px] tracking-[0.3em] text-taupe uppercase transition-colors hover:text-taupe-light sm:text-[12px]",
        className,
      )}
    >
      {children}
    </button>
  );
}
