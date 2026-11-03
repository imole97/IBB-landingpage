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

/** How long a turn takes — a touch unhurried, like a hand turning paper. */
const FLIP_MS = 1100;

/** Never wait longer than this for a new page's images before turning. */
const SETTLE_CAP_MS = 700;

/** If a turn hasn't finished by now, something went wrong: put the page down. */
const TURN_TIMEOUT_MS = 6000;

/**
 * A trackpad fires dozens of wheel events per swipe and keeps firing them
 * through its inertia. A gesture is over only once the stream has gone
 * quiet for this long — each gesture turns at most one page.
 */
const WHEEL_QUIET_MS = 260;
const WHEEL_THRESHOLD = 40;
const SWIPE_THRESHOLD = 50;

type TurnApi = {
  /** Turn to another page of the book, in whichever direction it lies. */
  turnTo: (href: string) => void;
};

const TurnContext = createContext<TurnApi>({ turnTo: () => {} });

export const useTurn = () => useContext(TurnContext);

// page-flip ships no types; this is the slice of its API we use.
type PageFlipInstance = {
  loadFromHTML(items: HTMLElement[]): void;
  updateFromHtml(items: HTMLElement[]): void;
  flipNext(corner?: "top" | "bottom"): void;
  flipPrev(corner?: "top" | "bottom"): void;
  turnToPage(page: number): void;
  on(event: "changeState", cb: (e: { data: string }) => void): void;
  getState(): string;
  getRender(): PageFlipRender;
  getFlipController(): FlipController;
  getSettings(): { width: number; height: number };
  update(): void;
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

/** Slow to lift, quick across, gentle to land. */
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/**
 * Turn BACK the way a real page does: the page that curled away curls
 * back over, its fold travelling from the far side to the corner, and
 * settles flat.
 *
 * page-flip's own flipPrev can't do this in single-page mode — the previous
 * page lives off-screen to the left, so it just slides it back in flat. But
 * a forward turn is `start()` from the bottom-right corner followed by an
 * animation from that corner to the far left. So: make the previous page
 * current, set up exactly that forward turn, and play a path back from
 * the far side, marked as not turned so it comes to rest on that page.
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

  // The corner comes back along exactly the path a forward turn takes,
  // reversed: from the far side of the spine to just short of its place,
  // lifted a little, then settling flat. (A higher, arcing path looks
  // tempting, but once the page's top corner crosses the spine page-flip
  // snaps the page to a different shape for a few frames.)
  //
  // Eased out: quick at first, past the moment the page enters upright at
  // the spine, then slowing to land gently. Points are spaced by the ease,
  // since page-flip plays them at an even rate.
  const lift = height / 10;
  const from = { x: -pageWidth, y: height };
  const lifted = { x: pageWidth - lift, y: height - lift };
  const flat = { x: pageWidth - 0.5, y: height - 0.5 };
  const toLifted = Math.hypot(lifted.x - from.x, lifted.y - from.y);
  const toFlat = Math.hypot(flat.x - lifted.x, flat.y - lifted.y);
  const along = (a: Point, b: Point, k: number) => ({
    x: a.x + (b.x - a.x) * k,
    y: a.y + (b.y - a.y) * k,
  });
  const at = (s: number) => {
    const d = s * (toLifted + toFlat);
    return d <= toLifted
      ? along(from, lifted, d / toLifted)
      : along(lifted, flat, (d - toLifted) / toFlat);
  };
  const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
  const steps = Math.round((FLIP_MS / 1000) * 120);
  const path = Array.from({ length: steps + 1 }, (_, k) => at(easeOut(k / steps)));

  controller.setState("flipping");
  controller.getCalculation()?.calc(path[0]);
  render.startAnimation(
    path.map((p) => () => controller.do(p)),
    FLIP_MS,
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
 *
 * The clock is also kept from leaping. page-flip picks each frame of a
 * turn by elapsed time, so if the page stalls — a route rendering, images
 * decoding — the turn skips ahead and the paper jumps. Here time advances
 * by at most two frames' worth per frame drawn: a stall holds the paper
 * still for a moment, then it carries on from where it was.
 */
const MAX_STEP_MS = 34;

function drawOnlyWhenNeeded(book: PageFlipInstance) {
  const render = book.getRender();
  const draw = render.render.bind(render);
  let pending = 60; // settle the first layout before going quiet
  let last = 0;
  let clock = 0;
  render.render = (ts) => {
    clock += last ? Math.min(ts - last, MAX_STEP_MS) : 0;
    last = ts;
    if (render.animation !== null || book.getState() !== "read" || pending > 0) {
      if (pending > 0) pending--;
      draw(clock);
    } else {
      render.timer = clock;
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

/** An empty sheet, standing in until the page it represents exists. */
function blankPage() {
  const page = document.createElement("div");
  page.className = "book-page";
  return page;
}

/**
 * A still of the page as it looks right now — the leaf that will turn.
 * Its images are asked to decode eagerly and synchronously, so the copy
 * never shows an empty frame where a picture should be.
 */
function snapshot(live: HTMLElement) {
  const leaf = live.cloneNode(true) as HTMLElement;
  leaf.classList.remove("book-live");
  leaf.setAttribute("aria-hidden", "true");
  leaf.setAttribute("inert", "");
  eager(leaf);
  return leaf;
}

function eager(el: HTMLElement) {
  el.querySelectorAll("img").forEach((img) => {
    img.loading = "eager";
    img.decoding = "sync";
  });
}

/** Resolves once every image inside `el` can be painted, or after `cap` ms. */
function decoded(el: HTMLElement, cap: number) {
  const images = Array.from(el.querySelectorAll("img")).map((img) =>
    img.decode().catch(() => {}),
  );
  const limit = new Promise((resolve) => setTimeout(resolve, cap));
  return Promise.race([Promise.all(images), limit]);
}

const nextFrame = () =>
  new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

/**
 * Is the page taller than it is wide? page-flip's curl is drawn for a
 * landscape page; on a tall one its fold becomes a long slanted band
 * across the screen. A tall page is folded by fold() below instead.
 */
const isPortrait = (el: HTMLElement) => el.clientHeight > el.clientWidth;

type Pt = { x: number; y: number };

/** The part of a polygon on the side of the line (p - m)·n <= 0. */
function clipHalf(poly: Pt[], m: Pt, n: Pt) {
  const side = (p: Pt) => (p.x - m.x) * n.x + (p.y - m.y) * n.y;
  const out: Pt[] = [];
  poly.forEach((a, i) => {
    const b = poly[(i + 1) % poly.length];
    const sa = side(a);
    const sb = side(b);
    if (sa <= 0) out.push(a);
    if ((sa < 0 && sb > 0) || (sa > 0 && sb < 0)) {
      const k = sa / (sa - sb);
      out.push({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k });
    }
  });
  return out;
}

const polygon = (poly: Pt[]) =>
  poly.length < 3
    ? "polygon(0 0, 0 0, 0 0)"
    : `polygon(${poly.map((p) => `${p.x}px ${p.y}px`).join(", ")})`;

/**
 * Turn a tall page the way paper turns: the bottom corner lifts and is
 * folded over, and the fold travels across the page to the spine, the
 * page's blank back showing on the folded part. The same model page-flip
 * uses on wide screens — the fold is the line halfway between where the
 * corner was and where it is now — with the corner's path shaped for a
 * tall page, so the fold stays near upright rather than a long diagonal.
 *
 * Forward, `leaf` (the page being left) folds away to reveal the page
 * beneath. Back, `leaf` (the earlier page) unfolds back over.
 */
function fold(
  layer: HTMLElement,
  leaf: HTMLElement,
  forward: boolean,
  width: number,
  height: number,
  onEnd: () => void,
) {
  const W = width;
  const H = height;
  const corner = { x: W, y: H };
  const page: Pt[] = [
    { x: 0, y: 0 },
    { x: W, y: 0 },
    { x: W, y: H },
    { x: 0, y: H },
  ];

  // The shadow the lifted paper casts on the page beneath, along the fold.
  const cast = document.createElement("div");
  cast.className = "book-fold-cast";
  // The back of the page, folded over.
  const flap = document.createElement("div");
  flap.className = "book-fold-flap";
  const shade = document.createElement("div");
  shade.className = "book-fold-shade";
  flap.appendChild(shade);
  layer.insertBefore(cast, leaf);
  leaf.after(flap);

  const reach = Math.hypot(W, H) * 2;
  const place = (el: HTMLElement, m: Pt, angle: number) => {
    el.style.width = `${reach}px`;
    el.style.height = `${reach}px`;
    el.style.transform = `translate(${m.x}px, ${m.y}px) rotate(${angle}rad) translateY(-50%)`;
  };

  const draw = (t: number) => {
    // Where the corner is: from its place, lifted a little on the way,
    // to the far side of the spine. The lift is what slants the fold, and
    // on a tall page a little goes a long way — so it's held to what keeps
    // the fold's lean across the page's height within a third of its width.
    const travel = 2 * W * t;
    const lift = Math.min(0.14 * W * Math.sin(Math.PI * t), (0.35 * W * travel) / H);
    const q = { x: W - travel, y: H - lift };
    const dx = corner.x - q.x;
    const dy = corner.y - q.y;
    const len = Math.hypot(dx, dy);
    if (len < 1) {
      leaf.style.clipPath = "";
      flap.style.visibility = cast.style.visibility = "hidden";
      return;
    }
    flap.style.visibility = cast.style.visibility = "";
    // The fold: through the midpoint, square to the corner's travel.
    const n = { x: dx / len, y: dy / len };
    const m = { x: (corner.x + q.x) / 2, y: (corner.y + q.y) / 2 };
    const angle = Math.atan2(n.y, n.x);

    leaf.style.clipPath = polygon(clipHalf(page, m, n));
    // The folded part: what lies past the fold, mirrored across it.
    const beyond = clipHalf(page, m, { x: -n.x, y: -n.y });
    flap.style.clipPath = polygon(beyond);
    const k = m.x * n.x + m.y * n.y;
    flap.style.transform = `matrix(${1 - 2 * n.x * n.x}, ${-2 * n.x * n.y}, ${
      -2 * n.x * n.y
    }, ${1 - 2 * n.y * n.y}, ${2 * k * n.x}, ${2 * k * n.y})`;
    place(shade, m, angle);
    place(cast, m, angle);
    // Lifted paper casts the deepest shadow mid-turn.
    cast.style.opacity = String(Math.min(1, 0.25 + Math.sin(Math.PI * t)));
  };

  return new Promise<void>((resolve) => {
    // Time advances by at most MAX_STEP_MS a frame, so a stall pauses the
    // paper rather than letting it jump (see drawOnlyWhenNeeded).
    let last = 0;
    let elapsed = 0;
    const tick = (ts: number) => {
      elapsed += last ? Math.min(ts - last, MAX_STEP_MS) : 0;
      last = ts;
      const p = Math.min(1, elapsed / FLIP_MS);
      const t = easeInOut(p);
      draw(forward ? t : 1 - t);
      if (p < 1) requestAnimationFrame(tick);
      else resolve();
    };
    draw(forward ? 0 : 1);
    requestAnimationFrame(tick);
  }).then(onEnd);
}

type Turn = {
  leaf: HTMLElement;
  forward: boolean;
  /** Set once the curl itself has started. */
  animating: boolean;
};

/**
 * The book every page of the site is printed in.
 *
 * Each route renders into the live page. When the reader moves to another
 * route, the page they're leaving is photographed (cloned) onto a leaf in
 * front of it, the route changes underneath, and page-flip curls the leaf
 * away to reveal the new page — or, going back, curls the earlier page
 * back over the one being left. Direction follows the book's reading
 * order, whether the turn came from a link, a gesture or the browser's
 * own Back and Forward buttons.
 *
 * Nothing is ever left uncovered. The photograph goes onto a plain layer
 * (the "hold") the instant the turn begins, before the route changes.
 * page-flip loads its own copies out of sight, and only once they're drawn
 * and their images decoded does it take over — in the same frame the hold
 * is lifted, so the swap can't be seen.
 *
 * page-flip is created once and never destroyed (it can't be fully torn
 * down); each turn just reloads its two pages.
 */
export function BookShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const frame = useRef<HTMLDivElement>(null);
  const live = useRef<HTMLDivElement>(null);
  const holdLayer = useRef<HTMLDivElement>(null);
  const flip = useRef<PageFlipInstance | null>(null);
  const redrawRef = useRef<() => void>(() => {});
  const turnPages = useRef(new Set<Element>());
  const turn = useRef<Turn | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pathRef = useRef(pathname);

  /** Seat these two sheets in page-flip and remember they're the real pages. */
  const seat = useCallback((pages: [HTMLElement, HTMLElement], show: 0 | 1) => {
    const book = flip.current;
    if (!book) return;
    turnPages.current = new Set(pages);
    book.updateFromHtml(pages);
    book.turnToPage(show);
    redrawRef.current();
  }, []);

  /** The turn is over: lift the leaf away and hand the page back. */
  const finish = useCallback(() => {
    clearTimeout(timeout.current);
    turn.current = null;
    const host = frame.current;
    host?.removeAttribute("data-turning");
    host?.removeAttribute("data-holding");
    holdLayer.current?.replaceChildren();
    seat([blankPage(), blankPage()], 0);
    // Focus follows the page, so a keyboard or screen reader user lands on
    // the page they turned to rather than wherever focus was left.
    requestAnimationFrame(() => {
      live.current
        ?.querySelector<HTMLElement>("[data-turn-focus]")
        ?.focus({ preventScroll: true });
    });
  }, [seat]);

  /**
   * Start a turn: photograph the page being left and lay the photograph
   * over it, so the route can change underneath unseen. With `wait`, the
   * photograph's images are decoded before it's shown (a link click can
   * afford the moment; the browser's Back button can't — the route is
   * already changing).
   */
  const begin = useCallback(
    async (forward: boolean, wait: boolean) => {
      const page = live.current;
      const layer = holdLayer.current;
      if (!page || !layer || !flip.current) return;
      const leaf = snapshot(page);
      turn.current = { leaf, forward, animating: false };
      clearTimeout(timeout.current);
      timeout.current = setTimeout(finish, TURN_TIMEOUT_MS);
      layer.replaceChildren(leaf);
      if (wait) await decoded(leaf, 150);
      frame.current?.setAttribute("data-holding", "");
    },
    [finish],
  );

  const turnTo = useCallback(
    async (href: string) => {
      const from = pathRef.current;
      if (href === from || turn.current) return;
      // Without motion (or before page-flip has loaded) the page just changes.
      if (!reducedMotion()) await begin(pageOrder(href) >= pageOrder(from), true);
      router.push(href, { scroll: false });
    },
    [begin, router],
  );

  // Mount page-flip once, on a root of its own laid over the live page.
  useEffect(() => {
    const host = frame.current;
    if (!host || flip.current) return;

    let cancelled = false;
    const root = document.createElement("div");
    root.className = "book-root";

    import("page-flip").then(({ PageFlip }) => {
      if (cancelled || flip.current) return;
      host.appendChild(root);

      const { width, height } = host.getBoundingClientRect();
      const book = new PageFlip(root, {
        // Only the RATIO of these matters: in stretch mode page-flip fills
        // its container at this aspect. They're kept equal to the frame on
        // every resize below, so the page always matches it exactly.
        width: Math.round(width),
        height: Math.round(height),
        size: "stretch",
        // page-flip lays out a two-page spread whenever its container is at
        // least twice minWidth wide. An unreachable minWidth means it is
        // always a single page, at any size. (It also writes minWidth onto
        // the root as an inline min-width; globals.css overrides that.)
        minWidth: 100_000,
        maxWidth: 100_000,
        minHeight: 1,
        maxHeight: 100_000,
        usePortrait: true,
        showCover: false,
        drawShadow: true,
        maxShadowOpacity: 0.35,
        flippingTime: FLIP_MS,
        useMouseEvents: false,
        mobileScrollSupport: false,
        autoSize: true,
      }) as PageFlipInstance;

      const initial = [blankPage(), blankPage()];
      turnPages.current = new Set(initial);
      book.loadFromHTML(initial);

      // In single-page mode page-flip draws the back of a turning page with
      // a temporary clone of its front — so the page's text would show,
      // the right way round, on the underside of the paper. Real paper has
      // a blank back. Mark the clones as they appear so CSS can blank them.
      new MutationObserver((records) => {
        for (const r of records) {
          r.addedNodes.forEach((n) => {
            if (
              n instanceof HTMLElement &&
              n.classList.contains("book-page") &&
              !turnPages.current.has(n)
            ) {
              n.classList.add("book-page--back");
              n.setAttribute("aria-hidden", "true");
              n.setAttribute("inert", "");
            }
          });
        }
      }).observe(root, { childList: true, subtree: true });
      redrawRef.current = drawOnlyWhenNeeded(book);

      // The frame is the window, so its shape changes with it. page-flip
      // keeps the aspect it was created with, so keep its settings equal to
      // the frame and have it re-lay out.
      const settings = book.getSettings();
      new ResizeObserver(([entry]) => {
        const { width: w, height: h } = entry.contentRect;
        if (!w || !h) return;
        settings.width = Math.round(w);
        settings.height = Math.round(h);
        redrawRef.current();
        book.update();
      }).observe(host);

      book.on("changeState", (e) => {
        redrawRef.current();
        if (e.data === "read" && turn.current?.animating) finish();
      });

      flip.current = book;
    });

    return () => {
      cancelled = true;
    };
  }, [finish]);

  // The route has changed underneath the leaf: photograph the new page
  // and turn. Without a turn in progress (reduced motion, first load) the
  // page simply changes.
  useEffect(() => {
    const previous = pathRef.current;
    pathRef.current = pathname;
    const current = turn.current;
    const page = live.current;
    const book = flip.current;
    const layer = holdLayer.current;

    if (!current || !page || !book || !layer) {
      if (previous !== pathname) {
        requestAnimationFrame(() =>
          page?.querySelector<HTMLElement>("[data-turn-focus]")?.focus({ preventScroll: true }),
        );
      }
      return;
    }

    let cancelled = false;
    const stale = () => cancelled || turn.current !== current;
    (async () => {
      // Let the new page's own images arrive before photographing it.
      await decoded(page, SETTLE_CAP_MS);
      await nextFrame();
      if (stale()) return;

      // A tall page is folded over by hand, all on the hold: the live page
      // underneath is already the new one.
      if (frame.current && isPortrait(frame.current)) {
        current.animating = true;
        const { clientWidth: w, clientHeight: h } = frame.current;
        const done = () => !stale() && finish();
        if (current.forward) {
          fold(layer, current.leaf, true, w, h, done);
        } else {
          const next = snapshot(page);
          next.style.clipPath = "polygon(0 0, 0 0, 0 0)";
          layer.appendChild(next);
          await decoded(next, 300);
          if (stale()) return;
          fold(layer, next, false, w, h, done);
        }
        return;
      }

      // page-flip's copies: the hold keeps showing the original leaf while
      // these are seated and drawn out of sight.
      const next = snapshot(page);
      const leaf = current.leaf.cloneNode(true) as HTMLElement;
      eager(leaf);
      if (current.forward) seat([leaf, next], 0);
      else seat([next, leaf], 1);
      const root = frame.current?.querySelector<HTMLElement>(".book-root");
      if (root) await decoded(root, 300);
      await nextFrame();
      await nextFrame();
      if (stale()) return;

      // The swap. Start the turn underneath the hold, then lift the hold
      // once page-flip has drawn it: on a turn's first frame page-flip
      // paints the leaf's blank back across the whole page before it has
      // worked out the fold, which would flash a bare sheet.
      frame.current?.setAttribute("data-turning", "");
      current.animating = true;
      // Forward from the bottom corner — the one you'd lift in a real book.
      // Back is that same turn in reverse: the page uncurls back over.
      if (current.forward) book.flipNext("bottom");
      else if (!flipBack(book, 0)) book.flipPrev("top");
      // Whatever happens meanwhile, the hold must come off: left on, it
      // would hide the whole turn. (finish() also clears it.)
      await nextFrame();
      await nextFrame();
      if (turn.current === current) frame.current?.removeAttribute("data-holding");
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname, seat, finish]);

  // Scroll, swipe and keys, and the browser's own Back and Forward.
  //
  // Every page fits the screen, so nothing scrolls: scrolling (or swiping)
  // down reads on, up reads back, and a sideways swipe turns the way a
  // hand would — swipe right to go back, left to go forward. Something
  // inside a page that does scroll, like a long message being typed, keeps
  // the gesture for itself until it reaches its end.
  useEffect(() => {
    const go = (step: 1 | -1) => {
      const href = neighbour(pathRef.current, step);
      if (href) turnTo(href);
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
          go(-1);
        } else if (sumX > WHEEL_THRESHOLD) {
          gestureUsed = true;
          go(1);
        }
      } else if (Math.abs(sumY) > WHEEL_THRESHOLD && !scrollsInside(e.target, e.deltaY)) {
        gestureUsed = true;
        go(sumY > 0 ? 1 : -1);
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
        go(dx > 0 ? -1 : 1);
      } else if (Math.abs(dy) > SWIPE_THRESHOLD && !scrollsInside(touchTarget, dy)) {
        go(dy > 0 ? 1 : -1);
      }
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
    const onPop = () => {
      const to = window.location.pathname;
      const from = pathRef.current;
      if (to === from || turn.current || reducedMotion()) return;
      void begin(pageOrder(to) >= pageOrder(from), false);
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
  }, [begin, turnTo]);

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
