import { BookLink } from "@/components/book/BookLink";
import { ScriptHeading } from "@/components/page/ScriptHeading";
import { Label } from "@/components/ui/Label";
import { Rule } from "@/components/ui/Ornament";

/**
 * A page that's been planned but not yet written — a service's process,
 * a project's story. It says so plainly, says what it will hold, and
 * offers the way back and the way to get in touch.
 */
export function ComingSoon({
  eyebrow,
  title,
  summary,
  back,
}: {
  eyebrow: string;
  title: string;
  summary: string;
  back: { href: string; label: string };
}) {
  return (
    <div className="coming-soon">
      <Label size="sm" className="mb-6">
        {eyebrow}
      </Label>
      <ScriptHeading className="script-heading--long">{title}</ScriptHeading>
      <Rule align="start" className="my-8" />
      <p className="coming-soon-summary">{summary}</p>
      <Label size="lg" className="mt-10 mb-4">
        Coming soon
      </Label>
      <p className="max-w-[34rem] text-[15px] leading-[1.8] text-ink-soft">
        We&rsquo;re writing this page now. In the meantime, we&rsquo;d love to
        hear about your space.
      </p>
      <div className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
        <BookLink href={back.href} className="turn-link group">
          <span aria-hidden className="turn-arrow turn-arrow--back">
            &larr;
          </span>
          {back.label}
        </BookLink>
        <BookLink href="/contact" className="turn-link group">
          Contact us
          <span aria-hidden className="turn-arrow">
            &rarr;
          </span>
        </BookLink>
      </div>
    </div>
  );
}
