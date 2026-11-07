import { BookLink } from "@/components/book/BookLink";
import { InnerPage } from "@/components/page/InnerPage";
import { ScriptHeading } from "@/components/page/ScriptHeading";
import { Label } from "@/components/ui/Label";
import { sectionByHref, stageHref, studioProcess } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";

const section = sectionByHref("/process")!;

export const metadata = pageMetadata({
  title: section.title,
  description: section.description,
  path: section.href,
});

/** The final reveal has no draft number; it's simply the end. */
const number = (draft: string) => draft.match(/\d+/)?.[0] ?? "Fin";

export default function ProcessPage() {
  return (
    <InnerPage
      path={section.href}
      title={section.title}
      folio={section.folio}
      className="process-page"
    >
      <ScriptHeading>{section.title}</ScriptHeading>

      <div className="process-layout">
        <div className="process-text">
          <Label size="sm" className="process-label">
            {studioProcess.heading}
          </Label>
          <p className="process-intro">
            {studioProcess.lede}{" "}
            {studioProcess.intro.map((part, i) =>
              "word" in part ? (
                <strong key={i} className="process-word">
                  {part.word}
                </strong>
              ) : (
                part.text
              ),
            )}
          </p>
        </div>

        {/* Each stage turns to its own page, in the studio's words. */}
        <ol className="service-list process-list">
          {studioProcess.stages.map((stage) => (
            <li key={stage.slug}>
              <BookLink href={stageHref(stage)} className="service-row group">
                <span className="service-number">{number(stage.draft)}</span>
                <span className="service-name">{stage.name}</span>
                <span aria-hidden className="service-arrow">
                  &rarr;
                </span>
              </BookLink>
            </li>
          ))}
        </ol>
      </div>
    </InnerPage>
  );
}
