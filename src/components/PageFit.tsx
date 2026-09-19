"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

/**
 * The smallest the content may be scaled. Below this it's too small to read
 * comfortably; the page scrolls instead, which Book already handles.
 */
const MIN_SCALE = 0.7;

/**
 * Keeps a page's content inside the page, on any screen.
 *
 * A page is a fixed size — the book frame — so content that's taller than
 * it would spill. Spacing already shrinks with the page's height (see
 * `.book-page` in globals.css), which handles most screens; this is for
 * the rest. It measures the content against the room its page has and,
 * only when it doesn't fit, scales it down by exactly enough — then
 * re-measures whenever the page is resized, shown, or the fonts land.
 *
 * `zoom` rather than `transform: scale` because zoom reflows: text
 * re-wraps at the new size and the box really is smaller, so centring
 * and hit-testing stay honest.
 */
export function PageFit({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const page = el?.parentElement;
    if (!el || !page) return;

    let frame = 0;
    const fit = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const cs = getComputedStyle(page);
        const room =
          page.clientHeight -
          parseFloat(cs.paddingTop) -
          parseFloat(cs.paddingBottom);
        // A hidden page (not the one showing) has no size to fit to yet.
        if (room <= 0) return;

        el.style.zoom = "";
        let height = el.getBoundingClientRect().height;
        if (height <= room) return;

        // Zoom re-wraps text, so the new height isn't exactly proportional;
        // converge in a couple of steps.
        let scale = 1;
        for (let i = 0; i < 4 && height > room + 0.5; i++) {
          scale = Math.max(MIN_SCALE, scale * (room / height));
          el.style.zoom = String(scale);
          height = el.getBoundingClientRect().height;
          if (scale === MIN_SCALE) break;
        }
      });
    };

    const observer = new ResizeObserver(fit);
    observer.observe(page);
    document.fonts?.ready.then(fit);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={ref} className={cn("page-fit", className)}>
      {children}
    </div>
  );
}
