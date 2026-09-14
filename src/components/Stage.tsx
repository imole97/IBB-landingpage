"use client";

import { useEffect, useState } from "react";

/** Cap on waiting for fonts — a slow font can never hold the page shut. */
const FONT_WAIT_CAP_MS = 400;

/** The cover's own reveal is 0.6s; let it settle before the hinge moves. */
const OPEN_AT_MS = 620;

/** ~70% into the 1.1s swing, so the leaf's content overlaps the opening. */
const REVEAL_AFTER_OPEN_MS = 780;

/**
 * Choreographs the book opening, in three beats:
 *
 *   data-cover     the shut book's cover fades in
 *   data-opened    the leaf swings on the spine, shadow into the gutter
 *   data-revealed  the leaf's content fades up as it settles
 *
 * Under reduced motion none of the CSS reading these attributes exists,
 * so the spread renders open and still whatever happens here.
 */
export function Stage({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<"shut" | "cover" | "opened" | "revealed">(
    "shut",
  );

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let cancelled = false;

    const begin = () => {
      if (cancelled) return;
      // Next frame, so the folded start state is painted before anything
      // transitions away from it.
      requestAnimationFrame(() => {
        if (cancelled) return;
        setPhase("cover");
        timers.push(setTimeout(() => setPhase("opened"), OPEN_AT_MS));
        timers.push(
          setTimeout(
            () => setPhase("revealed"),
            OPEN_AT_MS + REVEAL_AFTER_OPEN_MS,
          ),
        );
      });
    };

    // The wordmark is `priority`, so fonts are the only thing worth
    // waiting on — and only briefly.
    const cap = setTimeout(begin, FONT_WAIT_CAP_MS);
    timers.push(cap);
    document.fonts?.ready.then(() => {
      clearTimeout(cap);
      begin();
    });

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  const reached = (target: typeof phase) =>
    ["shut", "cover", "opened", "revealed"].indexOf(phase) >=
    ["shut", "cover", "opened", "revealed"].indexOf(target);

  return (
    <div
      className="book-stage min-h-dvh overflow-hidden bg-ink"
      data-cover={reached("cover") ? "" : undefined}
      data-opened={reached("opened") ? "" : undefined}
      data-revealed={reached("revealed") ? "" : undefined}
    >
      {children}
    </div>
  );
}
