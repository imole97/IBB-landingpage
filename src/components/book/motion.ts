import type { Pt } from "./curl";

/** How long a full turn takes — a touch unhurried, like a hand turning paper. */
export const FLIP_MS = 1100;

/**
 * Time moves on by at most this much a frame. If the page stalls — a
 * route rendering, images decoding — the paper waits for a moment and
 * carries on from where it was, rather than jumping ahead to catch up.
 */
export const MAX_STEP_MS = 34;

/** Slow to lift, quick across, gentle to land. */
export const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/**
 * Where the corner is, `t` of the way through a full turn: from its place
 * on the page to the far side of the spine, rising a little on the way.
 * The rise is what slants the fold. It's held to a gentle lean, and on a
 * tall page to less, since there a little goes a long way.
 */
export function turnPath(t: number, corner: Pt, W: number, H: number): Pt {
  const travel = 2 * W * t;
  const down = corner.y > 0 ? 1 : -1;
  const lift = Math.min(
    0.14 * Math.min(W, H) * Math.sin(Math.PI * t),
    (0.35 * W * travel) / H,
  );
  return { x: W - travel, y: corner.y - down * lift };
}

/**
 * A critically damped spring: the quickest way to come to rest without
 * overshooting. Paper has a little weight — following a hand it trails a
 * touch behind, and let go it eases to a stop rather than snapping or
 * bouncing. `omega` is its stiffness; higher follows more tightly.
 *
 * Solved exactly each step, so it's steady at any frame rate.
 */
export class Spring {
  pos: Pt;
  vel: Pt = { x: 0, y: 0 };

  constructor(pos: Pt) {
    this.pos = { ...pos };
  }

  step(target: Pt, omega: number, dt: number) {
    const e = Math.exp(-omega * dt);
    for (const k of ["x", "y"] as const) {
      const d = this.pos[k] - target[k];
      const v = this.vel[k];
      const c = v + omega * d;
      this.pos[k] = target[k] + (d + c * dt) * e;
      this.vel[k] = (v - omega * c * dt) * e;
    }
  }

  /** At rest on `target`, near enough. */
  restsOn(target: Pt) {
    return (
      Math.abs(this.pos.x - target.x) < 0.5 &&
      Math.abs(this.pos.y - target.y) < 0.5 &&
      Math.abs(this.vel.x) < 20 &&
      Math.abs(this.vel.y) < 20
    );
  }
}

/** How tightly the paper follows a hand. */
export const FOLLOW = 32;
/** How briskly a page let go settles where it's going. */
export const SETTLE = 12;

/**
 * A page let go: does it carry on over, or fall back? Like paper, it goes
 * whichever way it's nearer to — unless it was flicked. `t` is how far
 * through its turn the page is (0 flat, 1 turned over) and `rate` how fast
 * that's changing, in turns a second.
 */
export function letGo(t: number, rate: number): "over" | "back" {
  const FLICK = 0.6;
  if (rate > FLICK) return "over";
  if (rate < -FLICK) return "back";
  return t > 0.5 ? "over" : "back";
}
