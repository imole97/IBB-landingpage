"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { neighbour, pageOrder, sections } from "@/lib/content";
import { bindGestures } from "./gestures";
import { PageTurner } from "./turner";

type TurnApi = {
  /** Turn to another page of the book, in whichever direction it lies. */
  turnTo: (href: string) => void;
};

const TurnContext = createContext<TurnApi>({ turnTo: () => {} });

export const useTurn = () => useContext(TurnContext);

const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const isTypingTarget = (t: EventTarget | null) =>
  t instanceof HTMLElement &&
  (t.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(t.tagName));

/**
 * The book every page of the site is printed in.
 *
 * Each route renders into the live page; PageTurner (turner.ts) turns the
 * paper over it. Direction follows the book's reading order, whether the
 * turn came from a link, a key, a gesture, or the browser's own Back and
 * Forward buttons. A hand can also take hold of the page and turn it part
 * way, to peek — see gestures.ts.
 */
export function BookShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const frame = useRef<HTMLDivElement>(null);
  const live = useRef<HTMLDivElement>(null);
  const holdLayer = useRef<HTMLDivElement>(null);
  const turner = useRef<PageTurner | null>(null);
  const pathRef = useRef(pathname);

  /** Focus follows the page, so a keyboard or screen reader user lands on the page they turned to. */
  const focusPage = useCallback(() => {
    requestAnimationFrame(() => {
      live.current
        ?.querySelector<HTMLElement>("[data-turn-focus]")
        ?.focus({ preventScroll: true });
    });
  }, []);

  const turnTo = useCallback(
    (href: string) => {
      const from = pathRef.current;
      const t = turner.current;
      if (href === from || t?.busy) return;
      // Without motion (or before the turner is ready) the page just changes.
      if (!t || reducedMotion()) router.push(href, { scroll: false });
      else void t.auto(pageOrder(href) >= pageOrder(from), href, true);
    },
    [router],
  );

  useEffect(() => {
    const host = frame.current;
    const page = live.current;
    const hold = holdLayer.current;
    if (!host || !page || !hold) return;
    const t = new PageTurner({
      frame: host,
      live: page,
      hold,
      push: (href) => router.push(href, { scroll: false }),
      back: () => router.back(),
      landed: (changed) => changed && focusPage(),
    });
    turner.current = t;
    const unbind = bindGestures({
      frame: host,
      turner: t,
      neighbour: (step) => neighbour(pathRef.current, step),
      go: (step) => {
        const href = neighbour(pathRef.current, step);
        if (href) turnTo(href);
      },
    });
    return () => {
      unbind();
      t.dispose();
      turner.current = null;
    };
  }, [router, focusPage, turnTo]);

  // The route has changed underneath the hold: let the turn carry on.
  // Without a turn in progress (reduced motion, first load) the page simply
  // changes. Either way, the pages either side are fetched ahead, so a hand
  // taking hold of the page finds the next one already there.
  useEffect(() => {
    const previous = pathRef.current;
    pathRef.current = pathname;
    for (const step of [1, -1] as const) {
      const href = neighbour(pathname, step);
      if (href) router.prefetch(href);
    }
    const t = turner.current;
    void (async () => {
      const turning = t ? await t.arrived() : false;
      if (!turning && previous !== pathname) focusPage();
    })();
  }, [pathname, router, focusPage]);

  // Keys, and the browser's own Back and Forward.
  useEffect(() => {
    const go = (step: 1 | -1) => {
      const href = neighbour(pathRef.current, step);
      if (href) turnTo(href);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || isTypingTarget(e.target)) return;
      if (["ArrowRight", "ArrowDown", "PageDown"].includes(e.key)) {
        e.preventDefault();
        go(1);
      } else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) {
        e.preventDefault();
        go(-1);
      }
    };

    // Back and Forward: the address has already changed, but Next hasn't
    // re-rendered yet, so the page being left can still be photographed.
    // (A page that fell back after a peek goes back this way too; the
    // turner is busy with it, so it's left alone.)
    const onPop = () => {
      const to = window.location.pathname;
      const from = pathRef.current;
      const t = turner.current;
      if (to === from || !t || t.busy || reducedMotion()) return;
      void t.auto(pageOrder(to) >= pageOrder(from), to, false);
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPop);
    };
  }, [turnTo]);

  // The book's thickness: pages already read stack under the left edge,
  // pages still to come under the right, so the edges thin and thicken as
  // the reader moves through it.
  const api = useMemo(() => ({ turnTo }), [turnTo]);
  const read = Math.floor(pageOrder(pathname));
  const toCome = sections.length - 1 - read;

  return (
    <TurnContext.Provider value={api}>
      <div className="book-scene">
        <div ref={frame} className="book-frame">
          <div ref={live} className="book-page book-live">
            {children}
          </div>
          <div ref={holdLayer} aria-hidden className="book-hold" />
          <div
            aria-hidden
            className="book-edges book-edges--left"
            style={{ "--pages": read } as React.CSSProperties}
          />
          <div
            aria-hidden
            className="book-edges book-edges--right"
            style={{ "--pages": toCome } as React.CSSProperties}
          />
        </div>
      </div>
    </TurnContext.Provider>
  );
}
