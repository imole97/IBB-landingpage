import { BookLink } from "@/components/book/BookLink";
import { InnerPage } from "@/components/page/InnerPage";
import { ImagePlaceholder } from "@/components/page/ImagePlaceholder";
import { ScriptHeading } from "@/components/page/ScriptHeading";
import { Label } from "@/components/ui/Label";
import { projects, sectionByHref } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";

const section = sectionByHref("/projects")!;

export const metadata = pageMetadata({
  title: section.title,
  description: section.description,
  path: section.href,
});

export default function ProjectsPage() {
  return (
    <InnerPage
      path={section.href}
      title={section.title}
      folio={section.folio}
      className="projects-page"
    >
      <ScriptHeading>{section.title}</ScriptHeading>

      <ul className="project-grid">
        {projects.map((project) => (
          <li key={project.slug}>
            <BookLink href={`/projects/${project.slug}`} className="project-card group">
              <ImagePlaceholder
                src={project.image}
                alt={project.title}
                caption={project.title}
                sizes="(max-width: 640px) 100vw, 33vw"
                className="project-image"
              />
              <span className="project-open" aria-hidden>
                Open <span className="project-open-arrow">&rarr;</span>
              </span>
              <Label as="span" size="sm" className="project-kind">
                {project.kind}
              </Label>
              <span className="project-title">{project.title}</span>
            </BookLink>
          </li>
        ))}
      </ul>
    </InnerPage>
  );
}
