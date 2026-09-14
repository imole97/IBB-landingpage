import { Cursor } from "@/components/Cursor";
import { SignupForm } from "@/components/SignupForm";
import { Stage } from "@/components/Stage";
import { Body } from "@/components/ui/Body";
import { Label } from "@/components/ui/Label";
import { CornerBrackets, Rule } from "@/components/ui/Ornament";
import { Reveal } from "@/components/ui/Reveal";
import { Spine } from "@/components/ui/Spine";
import { Wordmark } from "@/components/ui/Wordmark";
import { site } from "@/lib/site";

/**
 * The coming-soon page is Page 0 of design/Interior By B.html — the open
 * book, back cover | spine | front cover — with the waitlist taking the
 * place the studio bio holds on the back cover.
 *
 * Below 1024px the book closes: the spread stacks to one column and the
 * spine lies down as a horizontal rule. The prototype has no breakpoints
 * at all, so everything responsive here is new.
 */
export default function Page() {
  return (
    <>
      <Cursor />
      <Stage>
        <main className="book grid min-h-dvh grid-cols-1 lg:grid-cols-[1fr_70px_1fr]">
          {/* ─── BACK COVER — the studio, and the list.
               This is the leaf that swings open on the spine. ─── */}
          <section className="book-leaf surface-cover-back relative order-3 flex flex-col justify-center gap-10 px-6 py-16 sm:px-10 lg:order-1 lg:border-r lg:border-white/5 lg:px-18 lg:py-20">
            <CornerBrackets corners="tl-br" />

            <Reveal>
              <Label size="lg">About the Studio</Label>
            </Reveal>

            <Reveal delay={1}>
              <Body tone="onDark">
                <em className="text-paper not-italic">{site.name}</em> is a
                residential and commercial design studio working across London
                and Lagos. We design intentional spaces that tell meaningful
                stories &mdash; rooted in purpose, shaped by context, and
                executed with quiet excellence.
              </Body>
            </Reveal>

            <Reveal delay={2} className="w-full">
              <Rule align="start" className="mb-10" />
              <Label size="sm" className="mb-5">
                The first edition
              </Label>
              <Body tone="onDark" className="mb-8 text-[15px] sm:text-[16px]">
                We&rsquo;re still writing it. Join the list and you&rsquo;ll be
                the first to read it.
              </Body>
              <SignupForm />
            </Reveal>

            <Reveal
              delay={3}
              className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3"
            >
              <a
                href={`mailto:${site.email}`}
                className="text-[12px] tracking-[0.2em] text-taupe-light uppercase transition-colors hover:text-taupe"
              >
                {site.email}
              </a>
              <a
                href={site.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${site.name} on Instagram`}
                className="group inline-flex items-center gap-2.5 text-[12px] tracking-[0.2em] text-taupe-light uppercase transition-colors hover:text-taupe"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden
                  className="size-4 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                >
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
                </svg>
                {site.instagramHandle}
              </a>
            </Reveal>
          </section>

          {/* ─── SPINE ─── */}
          <Spine />

          {/* ─── FRONT COVER — the wordmark ─── */}
          <section className="surface-cover-front relative order-1 flex flex-col items-center justify-center px-6 py-20 text-center sm:px-10 lg:order-3 lg:px-18">
            <CornerBrackets corners="tr-bl" />

            <Reveal on="cover">
              <Label size="lg" className="mb-10 sm:mb-12">
                {site.edition}
              </Label>
            </Reveal>

            <Reveal on="cover" delay={1} className="mb-9 w-[min(360px,72vw)] lg:w-[clamp(220px,26vw,360px)]">
              <h1>
                <Wordmark priority />
                <span className="sr-only">
                  {site.name} — interior design studio, London and Lagos
                </span>
              </h1>
            </Reveal>

            <Reveal on="cover" delay={2} className="w-full">
              <Rule className="mb-7" />
              <p className="mb-12 text-[16px] tracking-tagline text-paper sm:mb-14 sm:text-[18px] lg:text-[21px]">
                {site.tagline}
              </p>
            </Reveal>

            <Reveal on="cover" delay={3}>
              <p className="text-[15px] leading-relaxed text-taupe-light italic sm:text-[17px]">
                &ldquo;{site.motto}&rdquo;
              </p>
              <p className="mt-10 text-[11px] tracking-[0.3em] text-taupe/70 uppercase sm:text-[12px]">
                {site.colophon}
              </p>
            </Reveal>
          </section>
        </main>
      </Stage>
    </>
  );
}
