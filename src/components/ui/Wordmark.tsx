import Image from "next/image";
import { cn } from "@/lib/cn";
import { site } from "@/lib/site";

/**
 * The logo: black artwork on transparency (1179×248), shown as it is on
 * the bone paper.
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
      className={cn("h-auto w-full", className)}
    />
  );
}
