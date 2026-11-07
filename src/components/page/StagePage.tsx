import { BookLink } from "@/components/book/BookLink";
import { ScriptHeading } from "@/components/page/ScriptHeading";
import { Label } from "@/components/ui/Label";
import { Rule } from "@/components/ui/Ornament";
import type { Stage } from "@/lib/content";

/**
 * One stage of the studio's process — Discovery, Concept Development and
 * on to the final reveal — in its own words, with the way back to all
 * six. The way on to the next stage is in the page's footer.
 */
export function StagePage({
  eyebrow,
  stage,
}: {
  eyebrow: string;
  stage: Stage;
}) {
  return (
    <article className="stage-page">
      <Label size="sm" className="mb-6">
        {eyebrow}
      </Label>
      <ScriptHeading className="script-heading--long">{stage.name}</ScriptHeading>
      <Rule align="start" className="stage-rule" />
      <div className="stage-body">
        {stage.paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{paragraph}</p>
        ))}
      </div>
      <BookLink href="/process" className="stage-back turn-link group">
        <span aria-hidden className="turn-arrow turn-arrow--back">
          &larr;
        </span>
        All stages
      </BookLink>
    </article>
  );
}
