import { PageFit } from "@/components/PageFit";
import { PageFooter } from "@/components/page/PageFooter";
import { CornerBrackets, RunningHead } from "@/components/ui/Ornament";
import { cn } from "@/lib/cn";

/**
 * Every page after the cover is set the same way: the running head
 * across the top, the content, and the footer with the email, Instagram
 * and the way on.
 *
 * A page is exactly the screen and never scrolls. Sizes inside scale with
 * the page's height; on an unusually short screen PageFit shrinks the
 * content the last little way so it still fits.
 */
export function InnerPage({
  path,
  title,
  folio,
  className,
  children,
}: {
  path: string;
  title: string;
  folio: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <main className={cn("inner-page book-page-content", className)}>
      <CornerBrackets corners="tl-br" />
      <RunningHead title={title} />
      <div className="inner-body">
        <PageFit className="inner-fit" min={0.55}>
          {children}
        </PageFit>
      </div>
      <PageFooter path={path} folio={folio} />
    </main>
  );
}
