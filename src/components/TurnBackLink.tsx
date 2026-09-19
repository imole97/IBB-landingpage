"use client";

/**
 * The way back from the thank-you page. Reaching it pushed a history
 * entry, so this goes through history.back() — the link and the browser's
 * back button are the same gesture, and <Book> turns the page for both.
 */
export function TurnBackLink() {
  return (
    <button
      type="button"
      onClick={() => window.history.back()}
      className="group inline-flex items-center gap-3 text-[12px] tracking-[0.25em] text-taupe uppercase transition-colors hover:text-taupe-light"
    >
      <span
        aria-hidden
        className="inline-block transition-transform duration-300 group-hover:-translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
      >
        &larr;
      </span>
      Turn back
    </button>
  );
}
