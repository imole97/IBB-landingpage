import { BookLink } from "@/components/book/BookLink";
import { PageFit } from "@/components/PageFit";
import { CornerBrackets, Rule, Spine } from "@/components/ui/Ornament";
import { Reveal } from "@/components/ui/Reveal";
import { Wordmark } from "@/components/ui/Wordmark";
import { sections } from "@/lib/content";
import { site } from "@/lib/site";

/**
 * The cover: the wordmark, the tagline beneath it, and the book's
 * contents — About us, Our services, Our projects, Contact us. "Open"
 * turns to the first page.
 */
export default function CoverPage() {
  const contents = sections.slice(1);

  return (
    <main className="cover-page book-page-content relative flex flex-col items-center justify-center-safe px-8 text-center sm:px-12">
      <CornerBrackets corners="tr-bl" />
      <Spine>{site.name} &nbsp;·&nbsp; Interior Design Studio</Spine>

      <PageFit className="cover-fit flex w-full flex-col items-center">
        {/* The logo is the cover: the largest thing on the page. */}
        <Reveal className="cover-mark mb-8 w-[min(440px,86%)]">
          <h1 data-turn-focus tabIndex={-1} className="outline-none">
            <Wordmark
              priority
              sizes="(max-width: 640px) 86vw, (max-width: 999px) 440px, 56vw"
            />
            <span className="sr-only">
              {site.name} — interior design studio, London and Lagos
            </span>
          </h1>
        </Reveal>

        <Reveal delay={1} className="cover-tagline w-full">
          <Rule className="mb-6" />
          <p className="text-[13px] tracking-tagline text-ink-soft sm:text-[15px]">
            {site.tagline}
          </p>
        </Reveal>

        <Reveal delay={2} className="cover-contents w-full">
          <nav aria-label="Contents">
            <ol className="cover-contents-list">
              {contents.map((section) => (
                <li key={section.href}>
                  <BookLink href={section.href} className="cover-contents-link">
                    <span aria-hidden className="cover-contents-dash">
                      &mdash;
                    </span>
                    {section.label}
                  </BookLink>
                </li>
              ))}
            </ol>
          </nav>
        </Reveal>
      </PageFit>

      {/* The one hint that there's more, in the corner the page will curl
          from. Fades in once, never loops. */}
      <div className="book-hint absolute inset-x-0 bottom-7 flex justify-center sm:bottom-9">
        <BookLink href="/about" className="book-hint-link group">
          Open
          <span
            aria-hidden
            className="inline-block transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transition-none"
          >
            &rarr;
          </span>
        </BookLink>
      </div>
    </main>
  );
}
