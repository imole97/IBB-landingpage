"use client";

import Link from "next/link";
import { useTurn } from "@/components/book/BookShell";

/**
 * A link to another page of the book. It's a real link — crawlers follow
 * it, it works without JavaScript, and a modified click (new tab, new
 * window) still does what the reader asked — but a plain click turns the
 * page instead of jumping to it.
 */
export function BookLink({
  href,
  onClick,
  ...props
}: React.ComponentProps<typeof Link> & { href: string }) {
  const { turnTo } = useTurn();

  return (
    <Link
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }
        event.preventDefault();
        turnTo(href);
      }}
      {...props}
    />
  );
}
