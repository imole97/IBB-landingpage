import { cn } from "@/lib/cn";

/**
 * Ports .form-input (prototype lines 1317–1331): no box, no fill — only
 * a hairline bottom rule that darkens to ink on focus.
 */
export function Field({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full border-0 border-b border-ink/20 bg-transparent py-3 text-[16px] text-ink transition-colors outline-none",
        "placeholder:text-ink/35",
        // The focus ring itself comes from the global :focus-visible rule.
        "focus:border-ink",
        "aria-invalid:border-accent",
        "disabled:opacity-50",
        className,
      )}
    />
  );
}

/** The same hairline field, for longer answers. */
export function TextArea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full resize-y border-0 border-b border-ink/20 bg-transparent py-3 text-[16px] leading-[1.7] text-ink transition-colors outline-none",
        "placeholder:text-ink/35",
        "focus:border-ink",
        "aria-invalid:border-accent",
        "disabled:opacity-50",
        className,
      )}
    />
  );
}

/**
 * Ports .form-submit (lines 1333–1346) — solid ink, bone text,
 * .45em tracking, lifts 2px on hover.
 */
export function SubmitButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-4 bg-ink px-9 py-5 text-[13px] font-semibold tracking-label text-page uppercase",
        "transition-[background-color,transform] duration-300",
        "hover:not-disabled:-translate-y-0.5 hover:not-disabled:bg-ink-soft",
        "disabled:cursor-not-allowed disabled:opacity-60",
        "motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        className,
      )}
    >
      {children}
    </button>
  );
}
