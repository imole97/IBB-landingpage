import { InnerPage } from "@/components/page/InnerPage";
import { ImagePlaceholder } from "@/components/page/ImagePlaceholder";
import { ScriptHeading } from "@/components/page/ScriptHeading";
import { Label } from "@/components/ui/Label";
import { Rule } from "@/components/ui/Ornament";
import { about, sectionByHref } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

const section = sectionByHref("/about")!;

export const metadata = pageMetadata({
  title: section.title,
  description: section.description,
  path: section.href,
});

export default function AboutPage() {
  return (
    <InnerPage
      path={section.href}
      title={section.title}
      folio={section.folio}
      className="about-page"
    >
      <div className="about-layout">
        <div className="about-text">
          <ScriptHeading>{section.title}</ScriptHeading>
          <Label size="sm" className="about-label">
            About the studio
          </Label>
          <p className="about-bio">
            <em className="text-ink not-italic">{site.name}</em> {about.bio}
          </p>
        </div>
        <ImagePlaceholder
          src={about.image}
          alt="Inside a space designed by Interiors By B."
          className="about-image"
        />

        <section className="philosophy" aria-labelledby="philosophy-title">
          <Rule align="start" className="philosophy-rule" />
          <Label as="h2" size="sm" className="philosophy-label">
            <span id="philosophy-title">Our Design Philosophy</span>
          </Label>
          <div className="philosophy-grid">
            {about.philosophy.map((item) => (
              <article key={item.title} className="philosophy-item">
                <h3 className="philosophy-title">{item.title}</h3>
                <p className="philosophy-body">{item.body}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </InnerPage>
  );
}
