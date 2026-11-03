import { notFound } from "next/navigation";
import { ComingSoon } from "@/components/page/ComingSoon";
import { InnerPage } from "@/components/page/InnerPage";
import { projects, sectionByHref } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";

const section = sectionByHref("/projects")!;

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) return {};
  return pageMetadata({
    title: project.title,
    description: project.summary,
    path: `/projects/${project.slug}`,
    // Not worth a search result until the page is written.
    index: false,
  });
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) notFound();

  return (
    <InnerPage
      path={`/projects/${project.slug}`}
      title={section.title}
      folio={section.folio}
    >
      <ComingSoon
        eyebrow={`${section.title} · ${project.kind}`}
        title={project.title}
        summary={project.summary}
        back={{ href: "/projects", label: "All projects" }}
      />
    </InnerPage>
  );
}
