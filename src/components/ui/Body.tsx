import { cn } from "@/lib/cn";

/**
 * Ports .page-body (17px / 1.85, max-width 500px, text-wrap: pretty)
 * and its .large variant. `tone` picks the surface it sits on — the
 * prototype uses ink-soft on paper and rgba(255,255,255,.65) on ink.
 */
export function Body({
  children,
  size = "md",
  tone = "ink",
  className,
}: {
  children: React.ReactNode;
  size?: "md" | "lg";
  tone?: "ink" | "onDark";
  className?: string;
}) {
  return (
    <p
      className={cn(
        "max-w-[500px] text-pretty",
        size === "md" && "text-[16px] leading-[1.85] sm:text-[17px]",
        size === "lg" && "text-[19px] font-light leading-[1.7] sm:text-[21px]",
        tone === "ink" && "text-ink-soft",
        tone === "onDark" && "text-paper/65",
        className,
      )}
    >
      {children}
    </p>
  );
}
