import { site } from "@/lib/site";

/**
 * Ports .cover-spine-column / .cover-spine-title / .cover-spine-bottom.
 *
 * Renders two grid items, only one of which is ever displayed: the
 * vertical 70px gutter between the covers on the open spread (≥1024px),
 * and — below that, where the book "closes" — a horizontal taupe rule
 * with the same ornament on it. The prototype has no breakpoints, so
 * that second form is new.
 */
export function Spine() {
  return (
    <>
      {/* Vertical spine — the open spread */}
      <div className="surface-spine relative order-2 hidden h-full flex-col items-center justify-between border-x border-black/40 py-14 lg:flex">
        <span
          className="text-[12px] font-medium tracking-spine text-taupe uppercase"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          {site.name}
        </span>
        <span aria-hidden className="size-1.5 rotate-45 bg-taupe/70" />
        <span
          className="text-[12px] font-medium tracking-spine text-taupe/70"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          2026
        </span>
      </div>

      {/* Horizontal spine — the closed book */}
      <div
        aria-hidden
        className="order-2 flex items-center gap-5 bg-ink px-6 py-2 sm:px-10 lg:hidden"
      >
        <span className="h-px flex-1 bg-taupe/25" />
        <span className="size-1.5 rotate-45 bg-taupe" />
        <span className="h-px flex-1 bg-taupe/25" />
      </div>
    </>
  );
}
