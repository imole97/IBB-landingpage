import Image from "next/image";
import { cn } from "@/lib/cn";
import { site } from "@/lib/site";

/**
 * The logo ships as dark artwork on transparency (1179×248). The
 * prototype shows it on ink via invert(1) brightness(2.6); that lives in
 * the `wordmark-on-ink` utility so it is never re-typed per usage.
 */
export function Wordmark({
  className,
  priority = false,
  sizes = "(max-width: 1023px) 60vw, 26vw",
}: {
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <Image
      src="/logo.png"
      alt={site.name}
      width={1179}
      height={248}
      priority={priority}
      sizes={sizes}
      className={cn("wordmark-on-ink h-auto w-full", className)}
    />
  );
}
