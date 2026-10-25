import { PageFit } from "@/components/PageFit";
import { TurnBackLink } from "@/components/TurnBackLink";
import { InstagramIcon } from "@/components/ui/InstagramIcon";
import { Label } from "@/components/ui/Label";
import {
  CornerBrackets,
  Folio,
  GhostNumeral,
  Rule,
  RunningHead,
} from "@/components/ui/Ornament";
import { Wordmark } from "@/components/ui/Wordmark";
import { site } from "@/lib/site";

/**
 * Page 3 — only reached by joining the list. Laid out like the cover so
 * the book ends where it began.
 */
export function ThanksPage() {
  return (
    <div className="thanks-page book-page-content relative flex flex-col items-center justify-center-safe px-8 text-center sm:px-12">
      <CornerBrackets corners="tr-bl" />
      <RunningHead left={site.name} right="London · Lagos" />
      <GhostNumeral>03</GhostNumeral>
      <Folio className="page-folio">iii</Folio>

      <PageFit className="flex w-full flex-col items-center">
        <Label size="lg" className="thanks-label mb-7">
          You&rsquo;re on the list
        </Label>

        <div className="thanks-mark mb-7 w-[min(240px,58%)]">
          <Wordmark sizes="(max-width: 640px) 58vw, 240px" />
        </div>

        <Rule className="thanks-rule mb-7" />

        <h2
          // Focus lands here after the turn, so the page is announced.
          data-turn-focus
          tabIndex={-1}
          className="thanks-title mb-4 text-[26px] leading-[1.35] text-paper outline-none sm:text-[32px]"
        >
          Thank you.
        </h2>

        <div className="thanks-detail flex flex-col items-center">
          <p className="mb-10 max-w-[380px] text-[15px] leading-[1.8] text-paper/70 sm:text-[16px]">
            We&rsquo;ll be in touch to begin your story.
          </p>

          <p className="mb-3 text-[13px] leading-relaxed text-taupe-light">
            Until then, the work is on Instagram.
          </p>

          <a
            href={site.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 text-[12px] tracking-[0.2em] text-paper uppercase transition-colors hover:text-taupe sm:text-[13px]"
          >
            <InstagramIcon />
            {site.instagramHandle}
          </a>

          <div className="mt-12">
            <TurnBackLink />
          </div>
        </div>
      </PageFit>
    </div>
  );
}
