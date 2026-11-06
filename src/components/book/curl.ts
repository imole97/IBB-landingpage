/**
 * A sheet of paper, folded back from one corner.
 *
 * The page lies with its spine along the left edge (x = 0) and its free
 * edge on the right (x = W). Lift a corner and lay it down somewhere else
 * and the paper creases along the line halfway between where the corner
 * was and where it is now: everything past that line is folded over,
 * mirrored across it, showing the page's blank back. That one rule draws
 * every stage of a turn, from a corner barely lifted to a page lying flat
 * on the far side of the spine.
 *
 * All of it is drawn with clip-path and transform alone, so the browser
 * never lays anything out while the paper moves.
 */

export type Pt = { x: number; y: number };

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

/** Pull `q` back to within `r` of `c`. */
function within(q: Pt, c: Pt, r: number): Pt {
  const d = Math.hypot(q.x - c.x, q.y - c.y);
  if (d <= r) return q;
  return { x: c.x + ((q.x - c.x) * r) / d, y: c.y + ((q.y - c.y) * r) / d };
}

/**
 * Keep a lifted corner where real paper could put it. Paper doesn't
 * stretch: the corner can never be further from the spine's end on its own
 * edge than the page is wide, nor further from the spine's other end than
 * the page's diagonal. Holding to that is what makes a dragged page swing
 * round the spine like paper rather than stretch like rubber.
 *
 * On a tall page the fold's lean is held in too — a little lift slants a
 * long fold a long way, and a fold running corner to corner down a phone
 * reads as a tear, not a turn.
 */
export function constrain(q: Pt, corner: Pt, W: number, H: number): Pt {
  const down = corner.y > 0 ? 1 : -1; // bottom corner: lifting is upward
  let p = { x: Math.max(-W, Math.min(W, q.x)), y: q.y };
  // The corner doesn't go through the table or past its own edge.
  if (down * (p.y - corner.y) > 0) p.y = corner.y;
  if (H > W) {
    const lean = (0.35 * W * (W - p.x)) / H;
    if (Math.abs(p.y - corner.y) > lean) p.y = corner.y - down * lean;
  }
  for (let i = 0; i < 2; i++) {
    p = within(p, { x: 0, y: corner.y }, W);
    p = within(p, { x: 0, y: H - corner.y }, Math.hypot(W, H));
  }
  return p;
}

/** How far through its turn the page is: 0 lying flat, 1 turned over. */
export const progress = (q: Pt, W: number) => (W - q.x) / (2 * W);

export type Curl = {
  /** The page being turned. Put its content inside. */
  leaf: HTMLElement;
  /** Lay the page's corner at `q`. */
  draw(q: Pt): void;
  dispose(): void;
};

/**
 * Build a turning page on `layer`, over whatever is already in it, with
 * its corner resting at `corner` — (W, H) for the bottom corner, (W, 0)
 * for the top.
 */
export function createCurl(layer: HTMLElement, W: number, H: number, corner: Pt): Curl {
  const page: Pt[] = [
    { x: 0, y: 0 },
    { x: W, y: 0 },
    { x: W, y: H },
    { x: 0, y: H },
  ];

  // The shadow the lifted paper casts on the page beneath, along the fold.
  const cast = document.createElement("div");
  cast.className = "book-curl-cast";
  const leaf = document.createElement("div");
  leaf.className = "book-curl-leaf";
  // The back of the page, folded over, and the light across it.
  const flap = document.createElement("div");
  flap.className = "book-curl-flap";
  const shade = document.createElement("div");
  shade.className = "book-curl-shade";
  flap.appendChild(shade);
  layer.append(cast, leaf, flap);

  // The shading strips run along the fold, long enough to cross the page
  // at any angle. Each is drawn from its own left edge, so it's placed by
  // putting that edge on the fold.
  const reach = Math.hypot(W, H) * 2;
  for (const el of [cast, shade]) {
    el.style.width = `${reach}px`;
    el.style.height = `${reach}px`;
  }
  const place = (el: HTMLElement, m: Pt, angle: number, spread: number) => {
    el.style.transform = `translate(${m.x}px, ${m.y}px) rotate(${angle}rad) scaleX(${spread}) translateY(-50%)`;
  };

  let shown = true;
  const show = (on: boolean) => {
    if (on === shown) return;
    shown = on;
    flap.style.visibility = cast.style.visibility = on ? "" : "hidden";
  };

  return {
    leaf,
    draw(q) {
      const dx = corner.x - q.x;
      const dy = corner.y - q.y;
      const len = Math.hypot(dx, dy);
      if (len < 0.5) {
        leaf.style.clipPath = "";
        show(false);
        return;
      }
      show(true);
      // The fold: through the midpoint, square to the corner's travel.
      const n = { x: dx / len, y: dy / len };
      const m = { x: (corner.x + q.x) / 2, y: (corner.y + q.y) / 2 };
      const angle = Math.atan2(n.y, n.x);

      leaf.style.clipPath = polygon(clipHalf(page, m, n));
      // The folded part: what lies past the fold, mirrored across it.
      flap.style.clipPath = polygon(clipHalf(page, m, { x: -n.x, y: -n.y }));
      const k = m.x * n.x + m.y * n.y;
      flap.style.transform = `matrix(${1 - 2 * n.x * n.x}, ${-2 * n.x * n.y}, ${
        -2 * n.x * n.y
      }, ${1 - 2 * n.y * n.y}, ${2 * k * n.x}, ${2 * k * n.y})`;

      // How high the paper stands off the page. A corner just lifted
      // casts a small, close shadow; standing upright at the spine, the
      // page throws its broadest and darkest.
      const t = Math.min(1, Math.max(0, progress(q, W)));
      const stand = Math.sin(Math.PI * t);
      const near = Math.min(1, len / 60);
      place(cast, m, angle, 0.35 + 1.4 * stand);
      cast.style.opacity = String(near * Math.min(1, 0.3 + 0.9 * stand));
      // The fold rounds more broadly as the page stands up.
      place(shade, m, angle, 0.45 + 0.75 * stand);
    },
    dispose() {
      cast.remove();
      leaf.remove();
      flap.remove();
    },
  };
}
