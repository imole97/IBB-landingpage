import { notFound } from "next/navigation";
import { InnerPage } from "@/components/page/InnerPage";
import { StagePage } from "@/components/page/StagePage";
import { sectionByHref, stageHref, studioProcess } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";

const section = sectionByHref("/process")!;

export const dynamicParams = false;

export function generateStaticParams() {
  return studioProcess.stages.map((stage) => ({ slug: stage.slug }));
}

export async function generateMetadata({ params }: PageProps<"/process/[slug]">) {
  const { slug } = await params;
  const stage = studioProcess.stages.find((s) => s.slug === slug);
  if (!stage) return {};
  return pageMetadata({
    title: `${stage.name} · ${section.title}`,
    description: stage.paragraphs[0],
    path: stageHref(stage),
  });
}

export default async function ProcessStagePage({ params }: PageProps<"/process/[slug]">) {
  const { slug } = await params;
  const index = studioProcess.stages.findIndex((s) => s.slug === slug);
  if (index === -1) notFound();
  const stage = studioProcess.stages[index];

  return (
    <InnerPage path={stageHref(stage)} title={section.title} folio={section.folio}>
      <StagePage eyebrow={`${section.title} · ${stage.draft}`} stage={stage} />
    </InnerPage>
  );
}
