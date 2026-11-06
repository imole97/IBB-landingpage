import { constrain, createCurl, progress, type Curl, type Pt } from "./curl";
import {
  FLIP_MS,
  FOLLOW,
  MAX_STEP_MS,
  SETTLE,
  Spring,
  easeInOut,
  letGo,
  turnPath,
} from "./motion";

/** Never wait longer than this for a new page's images before turning. */
const SETTLE_CAP_MS = 700;

/** If a page let go hasn't come to rest by now, something went wrong: put it down. */
const TURN_TIMEOUT_MS = 6000;

/** How long the stand-in sheet takes to give way to the page it stood in for. */
const REVEAL_MS = 140;

type Deps = {
  frame: HTMLElement;
  live: HTMLElement;
  hold: HTMLElement;
  push(href: string): void;
  back(): void;
  /** A turn has come to rest; `changed` if it landed on another page. */
  landed(changed: boolean): void;
};

type Turn = {
  /** Forward: the page being read turns away. Back: the one before comes back over it. */
  forward: boolean;
  /** Where the turn goes; null past the end of the book. */
  target: string | null;
  W: number;
  H: number;
  corner: Pt;
  curl: Curl;
  /** A plain sheet standing in for the other page until it's drawn. */
  blank: HTMLElement | null;
  /**
   * lifted: the mouse is near the corner and it's raised a little.
   * held: a hand (or fingers on a trackpad) has hold of the page.
   * auto: turning all the way by itself, for a link, a key, the wheel.
   * settling: let go, and coming to rest one way or the other.
   */
  phase: "lifted" | "held" | "auto" | "settling";
  spring: Spring;
  /** Where the hand would put the corner. */
  hand: Pt;
  /** Where the hand took hold, and where the corner was then. */
  grip: { at: Pt; from: Pt } | null;
  /** Where the hand has put the corner lately, and when: how fast it's going. */
  trail: { t: number; x: number }[];
  /** Let go: is the reader turning to the other page, or back to this one? */
  turning: boolean;
  elapsed: number;
  /** The route is changing (or has changed) to the target. */
  navigating: boolean;
  /** The target page has rendered underneath. */
  arrived: boolean;
  /** The other page is in place, so the turn can come to rest on it. */
  ready: boolean;
  /** Fell back after the route had changed: on its way back to the start. */
  returning: boolean;
  /** Came to rest before the route was ready for it. */
  waiting: boolean;
  /** Lifted by the mouse, which has since moved away. */
  letDown: boolean;
};

const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** An empty sheet. */
function blankSheet() {
  const page = document.createElement("div");
  page.className = "book-page";
  return page;
}

/**
 * A still of the page as it looks right now. Its images are asked to
 * decode eagerly and synchronously, so the copy never shows an empty frame
 * where a picture should be.
 */
function snapshot(live: HTMLElement) {
  const leaf = live.cloneNode(true) as HTMLElement;
  leaf.classList.remove("book-live");
  leaf.setAttribute("aria-hidden", "true");
  leaf.setAttribute("inert", "");
  leaf.querySelectorAll("img").forEach((img) => {
    img.loading = "eager";
    img.decoding = "sync";
  });
  return leaf;
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
 * Turns the pages of the book.
 *
 * Each route renders into the live page. To turn, the page being read is
 * photographed (cloned) onto a layer laid over it — the hold — so the
 * route can change underneath unseen. The turning sheet lives on the hold
 * too: going forward it's the photograph, folding away to show the new
 * page beneath; going back it's a photograph of the earlier page, folding
 * back over the one being left.
 *
 * Every turn is the same sheet of paper, moved by its corner. A link or a
 * key moves the corner along a full turn by itself. A hand — mouse,
 * finger, trackpad — moves it wherever it likes: part way to peek at the
 * next page, then let go, and the page falls back or carries on over,
 * whichever it's nearer to. Peeking needs the next page to be there
 * beneath, so the route changes as soon as the page is taken hold of, and
 * changes back if it falls.
 */
export class PageTurner {
  private turn: Turn | null = null;
  private raf = 0;
  private last = 0;
  private timeout: ReturnType<typeof setTimeout> | undefined;

  constructor(private deps: Deps) {}

  /** A turn is under way that a new one mustn't interrupt. */
  get busy() {
    return this.turn !== null && this.turn.phase !== "lifted";
  }

  get holding() {
    return this.turn?.phase === "held";
  }

  /** Turn all the way, by itself. `navigate` is false when the route is already changing. */
  async auto(forward: boolean, target: string, navigate: boolean) {
    if (this.busy) return;
    if (reducedMotion()) {
      if (navigate) this.deps.push(target);
      return;
    }
    // The corner may already be lifted under the mouse: carry on from there.
    const lifted = this.turn;
    const turn =
      lifted && lifted.forward === forward && lifted.target === target
        ? lifted
        : this.begin(forward, target, "bottom");
    turn.phase = "auto";
    turn.turning = true;
    turn.navigating = true;
    this.arm();
    if (turn !== lifted && navigate) {
      // A click can afford a moment for the photograph's images to decode
      // before it's shown; the browser's Back button can't — the route is
      // already changing.
      await decoded(turn.curl.leaf, 150);
      if (this.turn !== turn) return;
    }
    this.show();
    if (lifted === turn) {
      // Already lifted: let go of it toward turning, from where it is.
      turn.phase = "settling";
      this.loop();
    }
    if (navigate) this.deps.push(target);
  }

  /**
   * The mouse is near a corner that can be turned (`p`), or has left it
   * (null): lift the corner a little, as a hint, or let it down.
   */
  lift(forward: boolean, target: string | null, p: Pt | null) {
    if (this.busy || reducedMotion()) return;
    let turn = this.turn;
    if (!p) {
      if (turn) {
        turn.hand = turn.forward ? turn.corner : this.away(turn);
        turn.letDown = true;
        this.loop();
      }
      return;
    }
    if (turn && turn.forward !== forward) return;
    if (!turn) {
      turn = this.begin(forward, target, "bottom");
      turn.phase = "lifted";
      this.show();
    }
    turn.letDown = false;
    const { W, H } = turn;
    // Closer to the corner, higher it lifts; and it leans a little toward
    // the pointer, as though drawn to the hand.
    const R = 110;
    const near = 1 - Math.min(1, Math.hypot(p.x - (forward ? W : 0), p.y - H) / R);
    const a = (forward ? 22 : 12) + (forward ? 26 : 14) * near;
    turn.hand = forward
      ? { x: W - a + 0.12 * (p.x - W), y: H - 0.6 * a + 0.12 * (p.y - H) }
      : { x: -W + 2 * a, y: H - 0.35 * a };
    this.loop();
  }

  /**
   * A hand takes hold of the page at `at`, to turn it forward or back.
   * Returns false if it can't be taken hold of just now.
   */
  grab(forward: boolean, target: string | null, at: Pt, corner: "top" | "bottom") {
    if (this.busy || reducedMotion()) return false;
    // Going back from the first page there's nothing to bring back over.
    if (!forward && !target) return false;
    let turn = this.turn;
    if (turn && turn.forward !== forward) {
      this.finish(false);
      turn = null;
    }
    if (!turn) {
      turn = this.begin(forward, target, corner);
      this.show();
    }
    turn.phase = "held";
    turn.grip = { at, from: { ...turn.spring.pos } };
    turn.trail = [];
    turn.hand = turn.grip.from;
    if (target && !turn.navigating) {
      turn.navigating = true;
      this.deps.push(target);
    }
    this.loop();
    return true;
  }

  /** The hand holding the page has moved to `p`. */
  drag(p: Pt) {
    const turn = this.turn;
    if (!turn || turn.phase !== "held" || !turn.grip) return;
    const { W, H, corner, grip } = turn;
    // The corner moves twice as far as the hand: across half the page is
    // halfway over, across all of it a full turn.
    let x = grip.from.x + 2 * (p.x - grip.at.x);
    if (!turn.target) {
      // No page to turn to: it gives a little, reluctantly, and no more.
      const R = 0.1 * W;
      const pull = Math.max(0, W - x);
      x = W - R * (1 - Math.exp(-pull / R));
    }
    x = Math.max(-W, Math.min(W, x));
    // Paper rises a little as it turns; the hand can lift it more.
    const t = progress({ x, y: corner.y }, W);
    const rise = turnPath(t, corner, W, H).y - corner.y;
    turn.hand = { x, y: corner.y + rise + 0.6 * (p.y - grip.at.y) };
    const now = performance.now();
    turn.trail.push({ t: now, x });
    while (turn.trail.length > 2 && now - turn.trail[0].t > 100) turn.trail.shift();
  }

  /**
   * How fast the hand was moving the corner as it let go, in px/s. Taken
   * from the hand rather than the paper, which may have fallen a frame or
   * two behind while the next page was arriving.
   */
  private speed(turn: Turn) {
    const now = performance.now();
    const recent = turn.trail.filter((s) => now - s.t < 100);
    if (recent.length < 2) return 0;
    const a = recent[0];
    const b = recent[recent.length - 1];
    return b.t > a.t ? ((b.x - a.x) * 1000) / (b.t - a.t) : 0;
  }

  /**
   * The hand lets go. `flung` says the hand was already sending the page
   * one way as it let go — a trackpad left coasting — so it goes that way.
   */
  release(flung?: "over" | "back") {
    const turn = this.turn;
    if (!turn || turn.phase !== "held") return;
    const { W } = turn;
    const t = progress(turn.spring.pos, W);
    const rate = -this.speed(turn) / (2 * W);
    // For the reader, "over" means on to the other page — for a page coming
    // back, that's down flat.
    const way = flung ?? (turn.forward ? letGo(t, rate) : letGo(1 - t, -rate));
    turn.turning = !!turn.target && way === "over";
    turn.phase = "settling";
    turn.grip = null;
    this.arm();
    this.loop();
  }

  /** The route has changed underneath. */
  async arrived() {
    const turn = this.turn;
    if (!turn) return false;
    const stale = () => this.turn !== turn;

    if (turn.returning) {
      // Back where it started: the page underneath is the one in the
      // photograph again, so the photograph can be lifted away.
      await decoded(this.deps.live, SETTLE_CAP_MS);
      await nextFrame();
      if (!stale()) this.finish(false);
      return true;
    }
    if (!turn.navigating || turn.arrived) return true;
    turn.arrived = true;
    if (turn.phase === "settling" && !turn.turning) {
      // It's falling back, or already fell, before the page arrived: once
      // it's down, go straight back.
      if (turn.waiting) this.goBack(turn);
      return true;
    }

    // Let the new page's own images arrive before showing it.
    await decoded(this.deps.live, SETTLE_CAP_MS);
    await nextFrame();
    if (stale() || turn.returning) return true;

    const fade = turn.phase !== "auto";
    if (turn.forward) {
      this.reveal(turn.blank, fade);
    } else {
      // The page coming back over: its photograph goes beneath the stand-in.
      const page = snapshot(this.deps.live);
      turn.curl.leaf.prepend(page);
      await decoded(page, 300);
      if (stale()) return true;
      this.reveal(turn.blank, fade);
    }
    turn.blank = null;
    turn.ready = true;
    if (turn.waiting) this.rest(turn);
    else this.loop();
    return true;
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    clearTimeout(this.timeout);
  }

  // ─────────────────────────────────────────────────────────────

  private begin(forward: boolean, target: string | null, corner: "top" | "bottom") {
    const { frame, live, hold } = this.deps;
    const W = frame.clientWidth;
    const H = frame.clientHeight;
    const c = { x: W, y: corner === "bottom" ? H : 0 };
    const base = snapshot(live);
    const blank = blankSheet();
    hold.replaceChildren();
    // Forward, the page being read is the sheet that turns, over a blank
    // until the next page is beneath it. Back, it lies beneath, and the
    // sheet coming over is a blank until the earlier page is ready.
    if (forward) hold.append(blank);
    else hold.append(base);
    const curl = createCurl(hold, W, H, c);
    curl.leaf.append(forward ? base : blank);
    const start = forward ? c : { x: -W, y: c.y };
    curl.draw(start);
    const turn: Turn = {
      forward,
      target,
      W,
      H,
      corner: c,
      curl,
      blank,
      phase: "lifted",
      spring: new Spring(start),
      hand: start,
      grip: null,
      trail: [],
      turning: false,
      elapsed: 0,
      navigating: false,
      arrived: false,
      ready: !target,
      returning: false,
      waiting: false,
      letDown: false,
    };
    this.turn = turn;
    return turn;
  }

  private show() {
    this.deps.frame.setAttribute("data-holding", "");
  }

  /** The far side of the spine, where a turned page lies. */
  private away(turn: Turn) {
    return { x: -turn.W, y: turn.corner.y };
  }

  /** Where the page is coming to rest. */
  private goal(turn: Turn) {
    const flat = turn.forward !== turn.turning;
    return flat ? turn.corner : this.away(turn);
  }

  /** Whatever happens, a page let go must come to rest. */
  private arm() {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => this.finish(true), TURN_TIMEOUT_MS);
  }

  /** Let the stand-in sheet give way to the page now beneath it. */
  private reveal(blank: HTMLElement | null, fade: boolean) {
    if (!blank) return;
    if (!fade) {
      blank.remove();
      return;
    }
    blank.style.transition = `opacity ${REVEAL_MS}ms ease`;
    blank.style.opacity = "0";
    setTimeout(() => blank.remove(), REVEAL_MS + 40);
  }

  private loop() {
    if (this.raf) return;
    this.last = 0;
    this.raf = requestAnimationFrame(this.frame);
  }

  private frame = (ts: number) => {
    this.raf = 0;
    const turn = this.turn;
    if (!turn) return;
    const dt = this.last ? Math.min(ts - this.last, MAX_STEP_MS) / 1000 : 0;
    this.last = ts;
    const { spring, W, H, corner } = turn;
    let resting = false;

    if (turn.phase === "auto") {
      // Waits, at rest, until the page it's turning to is in place.
      if (turn.ready) {
        turn.elapsed += dt * 1000;
        const p = Math.min(1, turn.elapsed / FLIP_MS);
        const t = easeInOut(p);
        spring.pos = turnPath(turn.forward ? t : 1 - t, corner, W, H);
        resting = p >= 1;
      }
    } else if (turn.phase === "settling") {
      const goal = this.goal(turn);
      spring.step(goal, SETTLE, dt);
      if (spring.restsOn(goal)) {
        spring.pos = { ...goal };
        resting = true;
      }
    } else {
      spring.step(turn.hand, FOLLOW, dt);
      // Let down after a hover, and lying flat again: put it away.
      if (turn.phase === "lifted" && turn.letDown && spring.restsOn(turn.hand)) {
        this.finish(false);
        return;
      }
    }

    spring.pos = constrain(spring.pos, corner, W, H);
    turn.curl.draw(spring.pos);
    if (resting) this.rest(turn);
    else this.raf = requestAnimationFrame(this.frame);
  };

  /** The page has come to rest where it was going. */
  private rest(turn: Turn) {
    if (this.turn !== turn) return;
    if (turn.turning) {
      // Over on the other page — once that page is really there.
      if (turn.ready) this.finish(true);
      else turn.waiting = true;
      return;
    }
    // Fell back where it started.
    if (!turn.navigating) this.finish(false);
    else if (turn.arrived) this.goBack(turn);
    // Otherwise arrived() takes it back once the route has changed.
    else turn.waiting = true;
  }

  /** The page fell back after the route changed: change it back. */
  private goBack(turn: Turn) {
    if (turn.returning) return;
    turn.returning = true;
    this.arm();
    this.deps.back();
  }

  private finish(changed: boolean) {
    clearTimeout(this.timeout);
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    const turn = this.turn;
    this.turn = null;
    turn?.curl.dispose();
    this.deps.hold.replaceChildren();
    this.deps.frame.removeAttribute("data-holding");
    if (turn) this.deps.landed(changed);
  }
}
