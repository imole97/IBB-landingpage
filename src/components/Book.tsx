"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

/** The pages, in order. The thank-you page is only reached by signing up. */
export const PAGE = { cover: 0, about: 1, thanks: 2 } as const;

/** How long a turn takes. page-flip animates it; we only need to know. */
const FLIP_MS = 900;

/**
 * A trackpad fires dozens of wheel events per swipe and keeps firing
 * them through its inertia, long after the turn has finished. A gesture
 * is over only once the stream has gone quiet for this long — each
 * gesture turns at most one page.
 */
const WHEEL_QUIET_MS = 260;
const WHEEL_THRESHOLD = 40;
const SWIPE_THRESHOLD = 50;

type TurnApi = {
  page: number;
  /** Cover → About. Does nothing anywhere else. */
  open: () => void;
  /** About → cover. */
  close: () => void;
  /** About → thank-you. Only the signup form calls this. */
  showThanks: () => void;
};

const TurnContext = createContext<TurnApi>({
  page: 0,
  open: () => {},
  close: () => {},
  showThanks: () => {},
});

export const useTurnPage = () => useContext(TurnContext);

// page-flip ships no types; this is the slice of its API we use.
type PageFlipInstance = {
  loadFromHTML(items: HTMLElement[]): void;
  flipNext(corner?: "top" | "bottom"): void;
  flipPrev(corner?: "top" | "bottom"): void;
  turnToPage(page: number): void;
  getCurrentPageIndex(): number;
  on(event: "flip", cb: (e: { data: number }) => void): void;
  on(event: "changeState", cb: (e: { data: string }) => void): void;
  getState(): string;
  getRender(): PageFlipRender;
  getFlipController(): FlipController;
  getSettings(): { width: number; height: number };
  update(): void;
  destroy(): void;
};

type PageFlipRender = {
  render(timestamp: number): void;
  animation: unknown;
  timer: number;
  getRect(): { left: number; height: number; pageWidth: number };
  startAnimation(frames: (() => void)[], duration: number, onEnd: () => void): void;
  setBottomPage(page: null): void;
  setFlippingPage(page: null): void;
  clearShadow(): void;
};

type Point = { x: number; y: number };
type FlipController = {
  start(globalPoint: Point): boolean;
  setState(state: string): void;
  getBoundsRect(): { height: number; pageWidth: number };
  getCalculation(): { calc(point: Point): void } | null;
  do(point: Point): void;
  reset(): void;
  getAnimationDuration(points: number): number;
};

/** page-flip's own path: one point per pixel along the longer axis. */
function line(a: Point, b: Point): Point[] {
  const steps = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y));
  const out: Point[] = [];
  for (let k = 0; k <= steps; k++) {
    out.push({ x: a.x + ((b.x - a.x) * k) / steps, y: a.y + ((b.y - a.y) * k) / steps });
  }
  return out;
}

/**
 * Turn BACK the way a real page does: the page that curled away uncurls
 * back over, its fold travelling from the far side to the corner, and
 * settles flat.
 *
 * page-flip's own flipPrev can't do this in single-page mode — the previous
 * page lives off-screen to the left, so it just slides it back in flat. But
 * a forward turn is `start()` from the bottom-right corner followed by an
 * animation from that corner to the far left. So: make the previous page
 * current, set up exactly that forward turn, and play its path the other
 * way, marked as not turned so it comes to rest on the previous page.
 * Returns false if page-flip refuses, so the caller can fall back.
 */
function flipBack(book: PageFlipInstance, target: number): boolean {
  const controller = book.getFlipController();
  const rect = book.getRender().getRect();
  book.turnToPage(target);
  // The same point flipNext("bottom") starts from.
  if (!controller.start({ x: rect.left + 2 * rect.pageWidth - 10, y: rect.height - 2 })) {
    return false;
  }
  const { pageWidth, height } = controller.getBoundsRect();
  const render = book.getRender();

  // A forward turn runs from the lifted corner to the far left. Back is
  // that path reversed — then the corner settles flat, the way a page
  // comes to rest (the forward turn skips this; it starts already lifted).
  const lift = height / 10;
  const curledAway = { x: -pageWidth, y: height };
  const cornerLifted = { x: pageWidth - lift, y: height - lift };
  const cornerFlat = { x: pageWidth - 0.5, y: height - 0.5 };
  const path = [...line(curledAway, cornerLifted), ...line(cornerLifted, cornerFlat).slice(1)];

  controller.setState("flipping");
  controller.getCalculation()?.calc(curledAway);
  render.startAnimation(
    path.map((p) => () => controller.do(p)),
    controller.getAnimationDuration(path.length),
    () => {
      render.setBottomPage(null);
      render.setFlippingPage(null);
      render.clearShadow();
      controller.setState("read");
      controller.reset();
    },
  );
  return true;
}

/**
 * page-flip redraws every page on every animation frame for as long as the
 * page is open — 60 style recalculations a second while someone is simply
 * reading, which on a phone is battery for nothing. Its loop calls
 * `render.render(ts)` each frame, so shadow that one method: draw while a
 * turn is animating or something has just changed, and otherwise only
 * advance its clock. The clock matters — page-flip times the next turn
 * from it, and a stale one makes the turn jump straight to its end.
 */
function drawOnlyWhenNeeded(book: PageFlipInstance) {
  const render = book.getRender();
  const draw = render.render.bind(render);
  let pending = 60; // settle the first layout before going quiet
  render.render = (ts) => {
    if (render.animation !== null || book.getState() !== "read" || pending > 0) {
      if (pending > 0) pending--;
      draw(ts);
    } else {
      render.timer = ts;
    }
  };
  return () => {
    pending = 30;
  };
}

const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Would this event scroll something inside the page, rather than the page? */
function scrollsInside(target: EventTarget | null, dy: number) {
  let el = target instanceof Element ? target : null;
  while (el && !el.classList.contains("book-page")) {
    if (el.scrollHeight > el.clientHeight + 1) {
      const atTop = el.scrollTop <= 0;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
      if ((dy > 0 && !atBottom) || (dy < 0 && !atTop)) return true;
    }
    el = el.parentElement;
  }
  return false;
}

const isTypingTarget = (t: EventTarget | null) =>
  t instanceof HTMLElement &&
  (t.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(t.tagName));

/**
 * The book. Each page turns with page-flip, which curls the paper from the
 * corner with a travelling shadow — the thing a rotating panel can't do.
 *
 * Ownership matters here. page-flip MOVES the page nodes into its own
 * wrapper, and its destroy() deletes that wrapper and the root it was
 * given. So React renders the pages into a source container it owns, and
 * page-flip gets a root we create ourselves — and is created once and
 * never destroyed, so React never finds its DOM missing.
 */
export function Book({ pages }: { pages: ReactNode[] }) {
  const frame = useRef<HTMLDivElement>(null);
  const source = useRef<HTMLDivElement>(null);
  const flip = useRef<PageFlipInstance | null>(null);
  const busy = useRef(false);
  const redrawRef = useRef<() => void>(() => {});
  const [page, setPage] = useState(0);
  const pageRef = useRef(0);
  const [ready, setReady] = useState(false);

  const goTo = useCallback((target: number) => {
    const book = flip.current;
    const from = pageRef.current;
    if (!book || busy.current || target === from) return;

    if (reducedMotion()) {
      redrawRef.current();
      book.turnToPage(target);
      pageRef.current = target;
      setPage(target);
      return;
    }
    busy.current = true;
    redrawRef.current();
    // Forward from the bottom corner — the one you'd lift in a real book.
    // Back is that same turn in reverse: the page uncurls back over.
    if (target > from) {
      book.flipNext("bottom");
    } else if (flipBack(book, target)) {
      // Unlike a forward turn, this one changes page before animating.
      pageRef.current = target;
      setPage(target);
    } else {
      book.flipPrev("top");
    }
  }, []);

  const open = useCallback(() => {
    if (pageRef.current === PAGE.cover) goTo(PAGE.about);
  }, [goTo]);

  const close = useCallback(() => {
    if (pageRef.current === PAGE.about) goTo(PAGE.cover);
  }, [goTo]);

  const showThanks = useCallback(() => {
    if (pageRef.current !== PAGE.about) return;
    goTo(PAGE.thanks);
    // Same URL, new history entry: Back turns back rather than leaving.
    window.history.pushState({ ibbPage: PAGE.thanks }, "");
  }, [goTo]);

  // Mount page-flip once. It keeps its own requestAnimationFrame loop
  // running for the life of the page and can't be fully torn down, so a
  // second instance must never be created — including under StrictMode,
  // which runs this effect twice in development.
  useEffect(() => {
    const host = frame.current;
    const src = source.current;
    if (!host || !src || flip.current) return;

    let cancelled = false;
    const pageEls = Array.from(src.children) as HTMLElement[];
    const root = document.createElement("div");
    root.className = "book-root";

    import("page-flip").then(({ PageFlip }) => {
      if (cancelled || flip.current) return;
      host.appendChild(root);

      const { width, height } = host.getBoundingClientRect();
      const book = new PageFlip(root, {
        // Only the RATIO of these matters: in stretch mode page-flip fills
        // its container at this aspect. They're kept equal to the frame
        // on every resize below, so the page always matches it exactly.
        width: Math.round(width),
        height: Math.round(height),
        size: "stretch",
        // page-flip lays out a two-page spread whenever its container is
        // at least twice minWidth wide. An unreachable minWidth means it is
        // always a single page, at any size — including after the window
        // grows. (It also writes minWidth onto the root as an inline
        // min-width; globals.css overrides that.) Likewise nothing caps the
        // page's size: the frame's CSS decides that.
        minWidth: 100_000,
        maxWidth: 100_000,
        minHeight: 1,
        maxHeight: 100_000,
        usePortrait: true,
        showCover: false,
        drawShadow: true,
        maxShadowOpacity: 0.55,
        flippingTime: FLIP_MS,
        useMouseEvents: false,
        mobileScrollSupport: false,
        autoSize: true,
      }) as PageFlipInstance;

      book.loadFromHTML(pageEls);

      // In single-page mode page-flip draws the back of a turning page with
      // a temporary clone of its front — so the cover's text would show,
      // the right way round, on the underside of the paper. Real paper has
      // a blank back. Mark the clones as they appear so CSS can blank them.
      const originals = new Set<Element>(pageEls);
      new MutationObserver((records) => {
        for (const r of records) {
          r.addedNodes.forEach((n) => {
            if (n instanceof HTMLElement && n.classList.contains("book-page") && !originals.has(n)) {
              n.classList.add("book-page--back");
              n.setAttribute("aria-hidden", "true");
              n.setAttribute("inert", "");
            }
          });
        }
      }).observe(root, { childList: true, subtree: true });
      const redraw = drawOnlyWhenNeeded(book);
      redrawRef.current = redraw;

      // The frame's shape changes with the window — a phone's tall page, a
      // desktop's 3:4 one. page-flip keeps the aspect it was created with,
      // so keep its settings equal to the frame and have it re-lay out.
      const settings = book.getSettings();
      new ResizeObserver(([entry]) => {
        const { width: w, height: h } = entry.contentRect;
        if (!w || !h) return;
        settings.width = Math.round(w);
        settings.height = Math.round(h);
        redraw();
        book.update();
      }).observe(host);

      book.on("flip", (e) => {
        redraw();
        pageRef.current = e.data;
        setPage(e.data);
      });
      book.on("changeState", (e) => {
        redraw();
        if (e.data === "read") busy.current = false;
      });

      flip.current = book;
      setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Scroll, swipe and keys. One gesture turns at most one page.
  //
  // Vertical movement only ever reads forward — scrolling is how people
  // move down a page, and scrolling back up shouldn't unexpectedly turn one
  // back. Going back is a sideways swipe, the way you turn a page back:
  // swipe right to go back, left to go forward.
  useEffect(() => {
    // Back from the thank-you page goes through history, so the browser's
    // Back button and a swipe land in the same place.
    const back = () => {
      if (pageRef.current === PAGE.thanks) window.history.back();
      else close();
    };

    let lastWheel = 0;
    let gestureUsed = false;
    let sumX = 0;
    let sumY = 0;

    const onWheel = (e: WheelEvent) => {
      const now = performance.now();
      if (now - lastWheel > WHEEL_QUIET_MS) {
        gestureUsed = false;
        sumX = 0;
        sumY = 0;
      }
      lastWheel = now;
      if (gestureUsed) return;

      sumX += e.deltaX;
      sumY += e.deltaY;
      const sideways = Math.abs(sumX) > Math.abs(sumY);

      if (sideways) {
        // A trackpad swipe to the right reports negative deltaX.
        if (sumX < -WHEEL_THRESHOLD) {
          gestureUsed = true;
          back();
        } else if (sumX > WHEEL_THRESHOLD) {
          gestureUsed = true;
          open();
        }
      } else if (sumY > WHEEL_THRESHOLD && !scrollsInside(e.target, e.deltaY)) {
        gestureUsed = true;
        open();
      }
    };

    let touchX = 0;
    let touchY = 0;
    let touchTarget: EventTarget | null = null;
    const onTouchStart = (e: TouchEvent) => {
      touchX = e.touches[0].clientX;
      touchY = e.touches[0].clientY;
      touchTarget = e.target;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      const dx = t.clientX - touchX; // positive = finger moved right
      const dy = touchY - t.clientY; // positive = swiped up = scroll down
      if (Math.abs(dx) >= Math.abs(dy)) {
        if (Math.abs(dx) < SWIPE_THRESHOLD) return;
        if (dx > 0) back();
        else open();
      } else if (dy > SWIPE_THRESHOLD && !scrollsInside(touchTarget, dy)) {
        open();
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || isTypingTarget(e.target)) return;
      if (["ArrowDown", "PageDown", " ", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        open();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        back();
      }
    };

    // The thank-you page pushed a history entry; Back turns back to it.
    const onPop = (e: PopStateEvent) => {
      const state = e.state as { ibbPage?: number } | null;
      if (state?.ibbPage !== PAGE.thanks && pageRef.current === PAGE.thanks) {
        busy.current = false;
        goTo(PAGE.about);
      }
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPop);
    };
  }, [open, close, goTo]);

  // Focus follows the page, so a keyboard or screen reader user lands on
  // the page they turned to rather than wherever focus was left.
  const firstPage = useRef(true);
  useEffect(() => {
    if (firstPage.current) {
      firstPage.current = false;
      return;
    }
    // `page` only changes once a turn has finished (page-flip's `flip`
    // event fires at the end), so the page is already in place.
    const frameId = requestAnimationFrame(() => {
      document
        .querySelector<HTMLElement>(
          `.book-page[data-page="${page}"] [data-turn-focus]`,
        )
        ?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frameId);
  }, [page]);

  return (
    <TurnContext.Provider value={{ page, open, close, showThanks }}>
      <div className="book-scene">
        <div ref={frame} className="book-frame" data-ready={ready ? "" : undefined}>
          <div ref={source} className="contents">
            {pages.map((content, i) => (
              <div key={i} className="book-page" data-page={i}>
                {content}
              </div>
            ))}
          </div>
        </div>
      </div>
    </TurnContext.Provider>
  );
}
