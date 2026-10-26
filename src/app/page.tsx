import { Book } from "@/components/Book";
import { PageFit } from "@/components/PageFit";
import { Cursor } from "@/components/Cursor";
import { SignupForm } from "@/components/SignupForm";
import { Stage } from "@/components/Stage";
import { ThanksPage } from "@/components/ThanksPage";
import { TurnButton } from "@/components/TurnButton";
import { Body } from "@/components/ui/Body";
import { InstagramIcon } from "@/components/ui/InstagramIcon";
import { Label } from "@/components/ui/Label";
import {
  CornerBrackets,
  Folio,
  GhostNumeral,
  Rule,
  RunningHead,
  Spine,
} from "@/components/ui/Ornament";
import { Reveal } from "@/components/ui/Reveal";
import { Wordmark } from "@/components/ui/Wordmark";
import { site } from "@/lib/site";

/**
 * The coming-soon page is a book, read one page at a time:
 *
 *   1. the cover — Limited Edition · 2026
 *   2. About the Studio — the bio, the waitlist, the links
 *   3. the thank-you, reached only by joining the list
 *
 * Scrolling, swiping or the arrow keys turn between the first two; <Book>
 * does the turning. All three pages are in the server HTML, so crawlers
 * and no-JS readers get every word.
 */
export default function Page() {
  return (
    <>
      <Cursor />
      <Stage>
        <main>
          <Book
            pages={[
              <CoverPage key="cover" />,
              <AboutPage key="about" />,
              <ThanksPage key="thanks" />,
            ]}
          />
        </main>
      </Stage>
    </>
  );
}

function CoverPage() {
  return (
    <div className="cover-page book-page-content relative flex flex-col items-center justify-center-safe px-8 text-center sm:px-12">
      <CornerBrackets corners="tr-bl" />
      <Spine>{site.name} &nbsp;·&nbsp; Interior Design Studio</Spine>

      <PageFit className="flex w-full flex-col items-center">
        <Reveal className="cover-edition">
          <Label size="lg" className="mb-10 sm:mb-12">
            {site.edition}
          </Label>
        </Reveal>

        {/* The logo is the cover: the largest thing on the page. */}
        <Reveal delay={1} className="cover-mark mb-8 w-[min(440px,86%)]">
          <h1 data-turn-focus tabIndex={-1} className="outline-none">
            <Wordmark
              priority
              sizes="(max-width: 640px) 86vw, (max-width: 999px) 440px, 60vw"
            />
            <span className="sr-only">
              {site.name} — interior design studio, London and Lagos
            </span>
          </h1>
        </Reveal>

        <Reveal delay={2} className="cover-tagline w-full">
          <Rule className="mb-6" />
          <p className="text-[13px] tracking-tagline text-taupe-light sm:text-[15px]">
            {site.tagline}
          </p>
        </Reveal>

        {/* Pipe-separated with the last on its own line; a ruled list on
            larger pages. Both are the same list — see .services in
            globals.css. */}
        <Reveal delay={3} className="cover-services mt-12 sm:mt-14">
          <Label as="h2" size="sm" className="mb-4">
            Services
          </Label>
          <ul className="services text-[10px] tracking-[0.3em] text-taupe/70 uppercase sm:text-[11px]">
            {site.services.map((service) => (
              <li key={service}>{service}</li>
            ))}
          </ul>
        </Reveal>
      </PageFit>

      {/* The one hint that there's more. Fades in once, never loops. */}
      <div className="book-hint absolute inset-x-0 bottom-7 flex justify-center sm:bottom-9">
        <TurnButton to="open">
          Open
          <span
            aria-hidden
            className="inline-block transition-transform duration-300 group-hover:translate-y-0.5 motion-reduce:transition-none"
          >
            &rarr;
          </span>
        </TurnButton>
      </div>
    </div>
  );
}

function AboutPage() {
  return (
    <div className="about-page book-page-content relative flex flex-col justify-center-safe px-8 sm:px-12">
      <CornerBrackets corners="tl-br" />
      <RunningHead />
      <GhostNumeral>02</GhostNumeral>
      <Folio className="page-folio">ii</Folio>

      <PageFit className="flex w-full flex-col">
        <div className="about-heading">
          <h2 data-turn-focus tabIndex={-1} className="outline-none">
            <Label as="span" size="lg" className="block">
              About the Studio
            </Label>
          </h2>
        </div>

        <Body
          tone="onDark"
          className="about-bio text-[14px] leading-[1.75] sm:text-[15px]"
        >
          <em className="text-paper not-italic">{site.name}</em> is a
          residential and commercial interior design studio. We design
          intentional spaces that tell meaningful stories
          &mdash; rooted in purpose, shaped by context, and executed with quiet
          excellence.
        </Body>

        <div className="about-form w-full">
          <Rule align="start" className="mb-5" />
          <Label size="sm" className="mb-3">
            The limited edition
          </Label>
          <Body
            tone="onDark"
            className="mb-4 text-[14px] leading-[1.7] sm:text-[15px]"
          >
            We&rsquo;re still writing it. Join the list and you&rsquo;ll be the
            first to read it.
          </Body>
          <SignupForm />
        </div>

        <div className="about-links flex flex-wrap items-center gap-x-7 gap-y-2.5">
          <a
            href={`mailto:${site.email}`}
            className="text-[11px] tracking-[0.2em] text-taupe-light uppercase transition-colors hover:text-taupe"
          >
            {site.email}
          </a>
          <a
            href={site.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${site.name} on Instagram`}
            className="inline-flex items-center gap-2.5 text-[11px] tracking-[0.2em] text-taupe-light uppercase transition-colors hover:text-taupe"
          >
            <InstagramIcon />
            {site.instagramHandle}
          </a>
        </div>

        <div className="about-back">
          <TurnButton to="close">
            <span
              aria-hidden
              className="inline-block transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transition-none"
            >
              &larr;
            </span>
            Cover
          </TurnButton>
        </div>
      </PageFit>
    </div>
  );
}
