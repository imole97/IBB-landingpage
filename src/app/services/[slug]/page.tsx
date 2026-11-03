import { notFound } from "next/navigation";
import { ComingSoon } from "@/components/page/ComingSoon";
import { InnerPage } from "@/components/page/InnerPage";
import { sectionByHref, services } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";

const section = sectionByHref("/services")!;

export const dynamicParams = false;

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: PageProps<"/services/[slug]">) {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);
  if (!service) return {};
  return pageMetadata({
    title: service.name,
    description: service.summary,
    path: `/services/${service.slug}`,
    // Not worth a search result until the page is written.
    index: false,
  });
}

export default async function ServicePage({ params }: PageProps<"/services/[slug]">) {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);
  if (!service) notFound();

  return (
    <InnerPage
      path={`/services/${service.slug}`}
      title={section.title}
      folio={section.folio}
    >
      <ComingSoon
        eyebrow={section.title}
        title={service.name}
        summary={service.summary}
        back={{ href: "/services", label: "All services" }}
      />
    </InnerPage>
  );
}
