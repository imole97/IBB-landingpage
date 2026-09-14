"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { useMediaQuery } from "@/lib/useMediaQuery";

/** Matches .page-turn's transition in globals.css. */
const TURN_MS = 850;

/**
 * The page turn, as a two-faced panel.
 *
 * This is the prototype's signature gesture (lines 129–156) reduced to its
 * reusable form: when the real pages get built, section-to-section turns
 * are this component, not a reimplementation.
 *
 * The face turned away is `inert` and `aria-hidden`, swapped at the
 * midpoint — so a keyboard user can never tab into an invisible form, the
 * way flip cards usually let you. Under reduced motion there is no turn at
 * all: the faces swap instantly.
 */
export function Flipper({
  turned,
  front,
  back,
  className,
}: {
  turned: boolean;
  front: React.ReactNode;
  back: React.ReactNode;
  className?: string;
}) {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  // Which face is "live" for assistive tech and the tab order. Lags the
  // visual turn by half its duration so it swaps as the panel goes edge-on.
  const [backLive, setBackLive] = useState(turned);
  const firstRun = useRef(true);

  useEffect(() => {
    if (reducedMotion || firstRun.current) {
      firstRun.current = false;
      setBackLive(turned);
      return;
    }
    const t = setTimeout(() => setBackLive(turned), TURN_MS / 2);
    return () => clearTimeout(t);
  }, [turned, reducedMotion]);

  if (reducedMotion) {
    return <div className={className}>{turned ? back : front}</div>;
  }

  return (
    <div className={cn("[perspective:1400px]", className)}>
      <div
        className="page-turn relative"
        data-turned={turned ? "" : undefined}
      >
        <Face live={!backLive} face="front">
          {front}
        </Face>
        {/* Absolutely positioned so both faces share one footprint; the
            front face keeps the panel's natural height. */}
        <Face live={backLive} face="back" className="absolute inset-0">
          {back}
        </Face>
      </div>
    </div>
  );
}

function Face({
  children,
  live,
  face,
  className,
}: {
  children: React.ReactNode;
  live: boolean;
  face: "front" | "back";
  className?: string;
}) {
  return (
    <div
      className={cn("page-turn-face", className)}
      data-face={face}
      inert={!live}
      aria-hidden={!live || undefined}
    >
      {children}
    </div>
  );
}
