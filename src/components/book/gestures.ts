import type { Pt } from "./curl";
import type { PageTurner } from "./turner";

/**
 * A wheel fires dozens of events per swipe and keeps firing them through
 * its inertia. A gesture is over only once the stream has gone quiet for
 * this long — an up-and-down gesture turns at most one page.
 */
const WHEEL_QUIET_MS = 260;
const WHEEL_THRESHOLD = 40;
/** Quiet this long, the trackpad has truly stopped: whatever comes next is a new gesture. */
const SILENCE_MS = 600;
/** A sideways trackpad swipe's stream has paused when it's been quiet this long. */
const SWIPE_QUIET_MS = 140;
/**
 * How long a page held still to peek stays held before it's let go: a
 * little longer on phones and tablets than on a desktop.
 *
 * On a trackpad this is the only way to know: fingers resting there send
 * nothing, so a hand holding the page still looks just like one that's
 * been lifted. When the swipe slowed to a stop, rather than coasting off,
 * the page is held for this long — and picks up again if the fingers move.
 */
const RESTING_MS = { handheld: 3000, desktop: 2000 };
/** A finger moving less than this is holding still. */
const STILL_PX = 3;
const SWIPE_THRESHOLD = 50;
/** A press becomes a drag after moving this far. */
const DEAD_ZONE = 8;
/** With a mouse, the page is taken hold of by its outer edge, this much of its width. */
const EDGE = 0.15;
/** The mouse lifts a corner from this far away. */
const CORNER = 110;

type Options = {
  frame: HTMLElement;
  turner: PageTurner;
  /** The page `step` away from the one being read, if there is one. */
  neighbour(step: 1 | -1): string | undefined;
  /** Turn a whole page, the way a link would. */
  go(step: 1 | -1): void;
};

const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const restingMs = (frame: HTMLElement) =>
  window.matchMedia("(pointer: coarse)").matches || frame.clientWidth < 1024
    ? RESTING_MS.handheld
    : RESTING_MS.desktop;

const canHover = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;

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

/** Somewhere to type, where a drag means selecting text. */
const isField = (t: EventTarget | null) =>
  t instanceof HTMLElement &&
  (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName));

/**
 * Taking hold of the page.
 *
 * - Drag it: by its outer edge with a mouse, from anywhere with a finger.
 *   Right to left turns forward, left to right back. Let go part way and
 *   it falls back; past halfway, or flicked, it carries on over.
 * - With a mouse, the corner lifts as the pointer comes near it. Click
 *   there and the page turns.
 * - Swipe sideways on a trackpad and the page follows the fingers.
 * - Scroll up or down, or swipe up or down on a touch screen, and a whole
 *   page turns. Something inside a page that scrolls, like a long message
 *   being typed, keeps the gesture for itself until it reaches its end.
 */
export function bindGestures({ frame, turner, neighbour, go }: Options) {
  const local = (e: { clientX: number; clientY: number }): Pt => {
    const r = frame.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  // ── Pressing and dragging ─────────────────────────────────────────
  type Press = {
    id: number;
    mouse: boolean;
    at: Pt;
    target: EventTarget | null;
    /** For a mouse, decided by which edge was pressed; for a finger, by the drag. */
    forward: boolean | null;
    /** Pressed on a corner the mouse had lifted. */
    corner: boolean;
    /** ignored: not a turn. dropped: held still too long, and let go. */
    state: "pending" | "held" | "vertical" | "ignored" | "dropped";
    /** Where a finger holding the page last came to a stop. */
    still: Pt | null;
  };
  let press: Press | null = null;
  /** A drag ends in a pointerup that the browser follows with a click. */
  let swallowClick = false;
  /** The corner the mouse is lifting, if any. */
  let lifted: boolean | null = null;
  /** Lets go of a page a finger has held still for too long. */
  let stillTimer: ReturnType<typeof setTimeout> | undefined;

  const holdStill = (p: Pt) => {
    if (!press || press.mouse || press.state !== "held") return;
    if (press.still && Math.hypot(p.x - press.still.x, p.y - press.still.y) < STILL_PX) return;
    press.still = p;
    clearTimeout(stillTimer);
    const held = press;
    stillTimer = setTimeout(() => {
      if (press !== held || held.state !== "held") return;
      held.state = "dropped";
      turner.release();
    }, restingMs(frame));
  };

  const unlift = () => {
    if (lifted === null) return;
    lifted = null;
    turner.lift(true, null, null);
  };

  /** Text selection, off while a hand has hold of the page. */
  const selecting = (on: boolean) => {
    const style = document.documentElement.style;
    style.userSelect = on ? "" : "none";
    style.setProperty("-webkit-user-select", on ? "" : "none");
  };

  const onPointerDown = (e: PointerEvent) => {
    swallowClick = false;
    if (!e.isPrimary || e.button !== 0 || turner.busy || isField(e.target)) return;
    const at = local(e);
    const W = frame.clientWidth;
    const mouse = e.pointerType === "mouse";
    let forward: boolean | null = null;
    if (mouse) {
      if (lifted !== null) forward = lifted;
      else if (at.x > W * (1 - EDGE)) forward = true;
      else if (at.x < W * EDGE) forward = false;
      else return;
      // Keep the press from starting a text selection.
      e.preventDefault();
    }
    // A finger held still mustn't start selecting text under it.
    if (!mouse) selecting(false);
    press = {
      id: e.pointerId,
      mouse,
      at,
      target: e.target,
      forward,
      corner: lifted !== null,
      state: "pending",
      still: null,
    };
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!press) {
      if (e.pointerType === "mouse" && e.buttons === 0) hover(local(e));
      return;
    }
    if (e.pointerId !== press.id || (press.state !== "pending" && press.state !== "held")) {
      return;
    }
    const p = local(e);
    if (press.state === "pending") {
      const dx = p.x - press.at.x;
      const dy = p.y - press.at.y;
      if (Math.hypot(dx, dy) < DEAD_ZONE) return;
      if (!press.mouse) {
        if (Math.abs(dy) > Math.abs(dx)) {
          press.state = "vertical";
          return;
        }
        press.forward = dx < 0;
      }
      const forward = press.forward ?? true;
      if (reducedMotion()) {
        press.state = "ignored";
        return;
      }
      const corner = press.at.y < frame.clientHeight / 2 ? "top" : "bottom";
      if (!turner.grab(forward, neighbour(forward ? 1 : -1) ?? null, press.at, corner)) {
        press.state = "ignored";
        return;
      }
      lifted = null;
      press.state = "held";
      swallowClick = true;
      selecting(false);
      window.getSelection()?.removeAllRanges();
    }
    turner.drag(p);
    holdStill(p);
  };

  const onPointerUp = (e: PointerEvent) => {
    if (!press || e.pointerId !== press.id) return;
    const done = press;
    press = null;
    clearTimeout(stillTimer);
    selecting(true);
    if (done.state === "held") turner.release();
    if (done.state === "held" || done.state === "dropped") return;
    const p = local(e);
    const dx = p.x - done.at.x;
    const dy = done.at.y - p.y; // positive = swiped up = read on
    if (!done.mouse) {
      // Swiped up or down, or (without motion) sideways: a whole page.
      if (Math.abs(dx) >= Math.abs(dy)) {
        if (reducedMotion() && Math.abs(dx) >= SWIPE_THRESHOLD) go(dx > 0 ? -1 : 1);
      } else if (Math.abs(dy) > SWIPE_THRESHOLD && !scrollsInside(done.target, dy)) {
        go(dy > 0 ? 1 : -1);
      }
      return;
    }
    // A click on a lifted corner turns the page — unless it was on a link.
    if (done.corner && done.state === "pending" && !(done.target as Element)?.closest?.("a,button")) {
      go(done.forward === false ? -1 : 1);
    }
  };

  const onPointerCancel = (e: PointerEvent) => {
    if (!press || e.pointerId !== press.id) return;
    if (press.state === "held") turner.release();
    press = null;
    clearTimeout(stillTimer);
    selecting(true);
  };

  const onClick = (e: MouseEvent) => {
    if (!swallowClick) return;
    swallowClick = false;
    e.preventDefault();
    e.stopPropagation();
  };

  // A finger held still on a phone is a long press: the browser would offer
  // a menu or start selecting text, and take the page from the hand.
  const onContextMenu = (e: Event) => {
    if (press && !press.mouse) e.preventDefault();
  };

  // Links and images are draggable by default; here a drag turns the page.
  const onDragStart = (e: DragEvent) => e.preventDefault();

  // ── The mouse near a corner ───────────────────────────────────────
  const hover = (p: Pt) => {
    if (!canHover() || turner.busy) return;
    const W = frame.clientWidth;
    const H = frame.clientHeight;
    const next = neighbour(1);
    const prev = neighbour(-1);
    const nearNext = !!next && Math.hypot(p.x - W, p.y - H) < CORNER;
    const nearPrev = !!prev && Math.hypot(p.x, p.y - H) < CORNER * 0.8;
    if (nearNext || nearPrev) {
      if (lifted !== null && lifted !== nearNext) unlift();
      lifted = nearNext;
      turner.lift(nearNext, (nearNext ? next : prev) ?? null, p);
    } else {
      unlift();
    }
  };
  const onLeave = (e: PointerEvent) => {
    if (e.pointerType === "mouse" && !press) unlift();
  };

  // ── The wheel and the trackpad ────────────────────────────────────
  let lastWheel = 0;
  let mode: "new" | "vertical" | "sideways" | "spent" = "new";
  let sumX = 0;
  let sumY = 0;
  let swipe: { at: Pt; forward: boolean } | null = null;
  let quiet: ReturnType<typeof setTimeout> | undefined;
  /** The swipe's latest sideways steps, to tell coasting from stopping. */
  let steps: number[] = [];
  /** The last step of a swipe that's over, still dying away. */
  let lastStep = 0;
  /** The finished swipe was sideways, and may be coasting on through a pause. */
  let coastable = false;
  /** How many steps of steady shrinking it takes to call it coasting. */
  const COAST_STEPS = 6;
  /** A coasting trackpad is moving at least this much a step: a flick, not a slowing hand. */
  const FLING_STEP = 4;

  /**
   * Fingers lifted mid-swipe leave the trackpad coasting: a run of steps,
   * each a little smaller than the last, dying away. Fingers that slow to a
   * stop and rest there don't.
   */
  const coasting = () => {
    const tail = steps.slice(-COAST_STEPS);
    if (tail.length < COAST_STEPS) return false;
    // Coasting shrinks smoothly, a little every step. A hand slowing to a
    // stop drops off sharply; a hand moving on steadily doesn't shrink.
    let level = 0;
    for (let i = 1; i < tail.length; i++) {
      const r = tail[i] / tail[i - 1];
      if (r < 0.7 || r > 1) return false;
      if (r === 1 && ++level > 1) return false;
    }
    return tail[tail.length - 1] < tail[0] * 0.8;
  };

  const letGoOfSwipe = (resting = false) => {
    clearTimeout(quiet);
    if (!swipe) return;
    if (!resting && !coasting()) {
      // Stopped, not coasting: most likely resting on the page to peek.
      quiet = setTimeout(() => letGoOfSwipe(true), restingMs(frame) - SWIPE_QUIET_MS);
      return;
    }
    // Quiet by the clock may only mean the page was busy — the next page
    // arriving — with the fingers' events still queued behind it. Give
    // them two frames to come in before deciding the fingers have lifted.
    const at = lastWheel;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (swipe && lastWheel === at) release();
      }),
    );
  };
  const release = (flung?: "over" | "back") => {
    if (!swipe) return;
    swipe = null;
    mode = "spent";
    coastable = true;
    clearTimeout(quiet);
    turner.release(flung);
  };

  const onWheel = (e: WheelEvent) => {
    const now = performance.now();
    const gap = now - lastWheel;
    lastWheel = now;
    if (gap > WHEEL_QUIET_MS && !swipe && mode !== "spent") {
      mode = "new";
      sumX = 0;
      sumY = 0;
    }
    const scale = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? frame.clientHeight : 1;
    if (mode === "spent") {
      // A finished swipe's coasting only ever dies away. A new swipe shows
      // itself by a step that grows sharply, or by coming after a real
      // silence — not just a pause while the page was busy turning, which
      // the coasting can sit through and then carry on.
      const step = Math.abs(e.deltaX * scale) + Math.abs(e.deltaY * scale);
      const fresh =
        gap > (coastable ? SILENCE_MS : WHEEL_QUIET_MS) || step > Math.max(6, lastStep * 1.8);
      lastStep = step;
      if (!fresh) return;
      mode = "new";
      sumX = 0;
      sumY = 0;
    }

    sumX += e.deltaX * scale;
    sumY += e.deltaY * scale;
    if (mode === "new") {
      if (Math.abs(sumX) + Math.abs(sumY) < 6) return;
      mode = Math.abs(sumX) > Math.abs(sumY) ? "sideways" : "vertical";
    }

    if (mode === "vertical") {
      if (Math.abs(sumY) > WHEEL_THRESHOLD && !scrollsInside(e.target, e.deltaY)) {
        mode = "spent";
        coastable = false;
        go(sumY > 0 ? 1 : -1);
      }
      return;
    }

    // Sideways: the page follows the fingers. A swipe to the left reports
    // positive deltaX and reads on.
    if (!swipe) {
      if (reducedMotion()) {
        if (Math.abs(sumX) > WHEEL_THRESHOLD) {
          mode = "spent";
          coastable = true;
          go(sumX > 0 ? 1 : -1);
        }
        return;
      }
      const forward = sumX > 0;
      const W = frame.clientWidth;
      const at = { x: forward ? W : 0, y: frame.clientHeight * 0.85 };
      unlift();
      if (turner.busy) {
        // The last page is still landing: catch this swipe as soon as it has.
        sumX = 0;
        return;
      }
      if (!turner.grab(forward, neighbour(forward ? 1 : -1) ?? null, at, "bottom")) {
        mode = "spent";
        coastable = true;
        return;
      }
      swipe = { at, forward };
      steps = [];
    }
    const step = e.deltaX * scale;
    steps.push(Math.abs(step));
    if (steps.length > 8) steps.shift();
    turner.drag({ x: swipe.at.x - sumX, y: swipe.at.y });
    if (coasting() && steps[steps.length - COAST_STEPS] >= FLING_STEP) {
      // The fingers have lifted and left the page coasting: a flick. Let go
      // now, the way it was flung, rather than trailing the whole coast.
      // (A swipe to the left, positive deltaX, sends the page forward.)
      const onward = step > 0 === swipe.forward;
      lastStep = Math.abs(step);
      release(onward ? "over" : "back");
      return;
    }
    clearTimeout(quiet);
    quiet = setTimeout(() => letGoOfSwipe(), SWIPE_QUIET_MS);
  };

  window.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerCancel);
  document.documentElement.addEventListener("pointerleave", onLeave);
  window.addEventListener("click", onClick, true);
  window.addEventListener("contextmenu", onContextMenu);
  frame.addEventListener("dragstart", onDragStart);
  window.addEventListener("wheel", onWheel, { passive: true });
  return () => {
    clearTimeout(quiet);
    clearTimeout(stillTimer);
    window.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerCancel);
    document.documentElement.removeEventListener("pointerleave", onLeave);
    window.removeEventListener("click", onClick, true);
    window.removeEventListener("contextmenu", onContextMenu);
    frame.removeEventListener("dragstart", onDragStart);
    window.removeEventListener("wheel", onWheel);
  };
}
