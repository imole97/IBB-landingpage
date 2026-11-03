import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * Where a photograph will go. Until the client's images arrive it's an
 * on-brand plate — the page's own ink, a hairline frame, a quiet caption.
 * Its size comes from the page's layout (so every page can fit the screen),
 * or from `ratio` where one is given. Pass `src` (a path under /public)
 * and the photograph takes its place, cropped to fill.
 */
export function ImagePlaceholder({
  src,
  alt = "",
  ratio,
  caption = "Image",
  sizes = "(max-width: 640px) 100vw, 50vw",
  className,
}: {
  src?: string;
  alt?: string;
  ratio?: string;
  caption?: string;
  sizes?: string;
  className?: string;
}) {
  return (
    <div
      className={cn("image-plate relative overflow-hidden", className)}
      style={ratio ? { aspectRatio: ratio } : undefined}
    >
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />
      ) : (
        <span aria-hidden className="image-plate-caption">
          {caption}
        </span>
      )}
    </div>
  );
}
