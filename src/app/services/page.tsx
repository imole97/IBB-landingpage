import { BookLink } from "@/components/book/BookLink";
import { InnerPage } from "@/components/page/InnerPage";
import { ImagePlaceholder } from "@/components/page/ImagePlaceholder";
import { ScriptHeading } from "@/components/page/ScriptHeading";
import { sectionByHref, services, servicesImage } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";

const section = sectionByHref("/services")!;

export const metadata = pageMetadata({
  title: section.title,
  description: section.description,
  path: section.href,
});

export default function ServicesPage() {
  return (
    <InnerPage
      path={section.href}
      title={section.title}
      folio={section.folio}
      className="services-page"
    >
      <ScriptHeading>{section.title}</ScriptHeading>

      {/* Each service turns to its own page: what it is and how it runs. */}
      <ol className="service-list">
        {services.map((service, i) => (
          <li key={service.slug}>
            <BookLink href={`/services/${service.slug}`} className="service-row group">
              <span className="service-number">{String(i + 1).padStart(2, "0")}</span>
              <span className="service-name">{service.name}</span>
              <span aria-hidden className="service-arrow">
                &rarr;
              </span>
            </BookLink>
          </li>
        ))}
      </ol>

      <ImagePlaceholder
        src={servicesImage}
        alt="A finished interior by Interiors By B."
        sizes="100vw"
        className="services-image"
      />
    </InnerPage>
  );
}
