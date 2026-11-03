import { ContactForm } from "@/components/page/ContactForm";
import { InnerPage } from "@/components/page/InnerPage";
import { ScriptHeading } from "@/components/page/ScriptHeading";
import { Label } from "@/components/ui/Label";
import { sectionByHref } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

const section = sectionByHref("/contact")!;

export const metadata = pageMetadata({
  title: section.title,
  description: section.description,
  path: section.href,
});

export default function ContactPage() {
  return (
    <InnerPage
      path={section.href}
      title={section.title}
      folio={section.folio}
      className="contact-page"
    >
      <ScriptHeading>{section.title}</ScriptHeading>

      <div className="contact-layout">
        <div className="contact-intro">
          <Label size="sm" className="mb-6">
            Begin your story
          </Label>
          <p className="contact-lede">
            Tell us about your space — what it is, what it could be, and when
            you&rsquo;d like to begin. We&rsquo;ll be in touch.
          </p>
          <p className="contact-intro-note text-[14px] leading-[1.7] text-ink-soft">
            Or write to us directly at{" "}
            <a
              href={`mailto:${site.email}`}
              className="text-ink underline decoration-accent/60 underline-offset-4 transition-colors hover:text-label"
            >
              {site.email}
            </a>
            .
          </p>
        </div>
        <ContactForm />
      </div>
    </InnerPage>
  );
}
