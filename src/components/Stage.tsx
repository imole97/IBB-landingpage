"use client";

import { useEffect, useState } from "react";

/** Cap on waiting for fonts — a slow font can never hold the cover back. */
const FONT_WAIT_CAP_MS = 400;

/**
 * Releases the cover's staggered fade-in (`data-cover`) once the fonts are
 * ready, so the type doesn't settle in and then reflow.
 *
 * Under reduced motion the reveal CSS doesn't exist, so the cover is
 * simply visible whatever happens here.
 */
export function Stage({ children }: { children: React.ReactNode }) {
  const [cover, setCover] = useState(false);

  useEffect(() => {
    let done = false;
    const show = () => {
      if (done) return;
      done = true;
      // Next frame, so the hidden start state is painted first.
      requestAnimationFrame(() => setCover(true));
    };
    const cap = setTimeout(show, FONT_WAIT_CAP_MS);
    document.fonts?.ready.then(show);
    return () => clearTimeout(cap);
  }, []);

  return (
    <div className="min-h-dvh bg-ink" data-cover={cover ? "" : undefined}>
      {children}
    </div>
  );
}
