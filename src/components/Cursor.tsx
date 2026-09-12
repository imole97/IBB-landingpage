"use client";

import { useEffect, useRef } from "react";
import { useMediaQuery } from "@/lib/useMediaQuery";

/**
 * Ports #cursor (prototype lines 41–52) — a 10px paper dot in
 * mix-blend-mode: difference that swells to 40px over interactive
 * elements.
 *
 * Two deliberate departures from the prototype: it runs only on fine
 * pointers (no phantom dot on touch), and it does NOT set
 * `cursor: none`, so the real cursor stays where people expect it.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const finePointer = useMediaQuery("(pointer: fine)");
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const enabled = finePointer && !reducedMotion;

  useEffect(() => {
    if (!enabled) return;
    const el = dot.current;
    if (!el) return;

    let frame = 0;
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
        el.style.opacity = "1";
      });
    };

    const INTERACTIVE = "a, button, input, label, [role='button']";
    const over = (e: PointerEvent) => {
      const hit = (e.target as Element | null)?.closest?.(INTERACTIVE);
      if (hit) el.dataset.expand = "";
      else delete el.dataset.expand;
    };
    const leave = () => {
      el.style.opacity = "0";
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", over, { passive: true });
    document.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      document.removeEventListener("pointerleave", leave);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={dot}
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[9999] size-2.5 rounded-full bg-paper opacity-0 mix-blend-difference transition-[width,height,opacity] duration-200 data-[expand]:size-10"
    />
  );
}
