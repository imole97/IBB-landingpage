import { cn } from "@/lib/cn";

/**
 * Ports .form-input (prototype lines 1317–1331): no box, no fill — only
 * a hairline bottom rule that turns taupe on focus.
 */
export function Field({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full border-0 border-b border-white/20 bg-transparent py-3 text-[16px] text-paper transition-colors outline-none",
        "placeholder:text-white/30",
        // The focus ring itself comes from the global :focus-visible rule.
        "focus:border-taupe",
        "aria-invalid:border-taupe-light",
        "disabled:opacity-50",
        className,
      )}
    />
  );
}

/**
 * Ports .form-submit (lines 1333–1346) — solid taupe, ink text,
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
        "inline-flex items-center justify-center gap-4 bg-taupe px-9 py-5 text-[13px] font-semibold tracking-label text-ink uppercase",
        "transition-[background-color,transform] duration-300",
        "hover:not-disabled:-translate-y-0.5 hover:not-disabled:bg-taupe-light",
        "disabled:cursor-not-allowed disabled:opacity-60",
        "motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        className,
      )}
    >
      {children}
    </button>
  );
}
