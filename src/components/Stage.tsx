"use client";

import { useEffect, useState } from "react";
import { Wordmark } from "@/components/ui/Wordmark";
import { site } from "@/lib/site";

/** Prototype loader runs 2600ms. That's a bounce on a holding page. */
const LOADER_MS = 900;

/**
 * Ports #loader (prototype lines 55–87) and owns the reveal handoff:
 * when the loader lifts, `data-revealed` lands on the wrapper and every
 * <Reveal> beneath it fades up on its own delay step.
 *
 * Content is in the DOM the whole time — the loader is an overlay, not a
 * gate — so it is fully present for crawlers. Reduced motion is handled
 * entirely in CSS: the loader is display:none and .rev has no rules, so
 * the page is simply visible with no timing involved.
 */
export function Stage({ children }: { children: React.ReactNode }) {
  const [revealed, setRevealed] = useState(false);
  const [loaderGone, setLoaderGone] = useState(false);

  useEffect(() => {
    const lift = setTimeout(() => setRevealed(true), LOADER_MS);
    const clear = setTimeout(() => setLoaderGone(true), LOADER_MS + 800);
    return () => {
      clearTimeout(lift);
      clearTimeout(clear);
    };
  }, []);

  return (
    <>
      {!loaderGone && (
        <div
          aria-hidden
          data-loader=""
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink transition-[opacity,visibility] duration-700 ${
            revealed ? "invisible opacity-0" : "visible opacity-100"
          }`}
        >
          <div className="loader-logo w-[min(280px,60vw)]">
            <Wordmark priority sizes="(max-width: 480px) 60vw, 280px" />
          </div>
          <div className="loader-line mt-8 h-px bg-taupe" />
          <div className="loader-text mt-6 text-[11px] font-medium tracking-label text-taupe-light uppercase sm:text-[13px]">
            {site.locations}
          </div>
        </div>
      )}

      <div data-revealed={revealed ? "" : undefined} className="contents">
        {children}
      </div>
    </>
  );
}
