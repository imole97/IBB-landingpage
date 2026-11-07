import { BookLink } from "@/components/book/BookLink";
import { InstagramIcon } from "@/components/ui/InstagramIcon";
import { Folio } from "@/components/ui/Ornament";
import { neighbour, pageLabel } from "@/lib/content";
import { site } from "@/lib/site";

const link =
  "text-[11px] tracking-[0.2em] text-ink-soft uppercase transition-colors hover:text-ink";

/**
 * The foot of every page: the studio's email and Instagram, always a
 * click away, and the way through the book — back to the cover, on to
 * the next page — with the page number in the corner.
 */
export function PageFooter({ path, folio }: { path: string; folio: string }) {
  const nextHref = neighbour(path, 1);
  const next = nextHref ? { href: nextHref, label: pageLabel(nextHref) } : undefined;

  return (
    <footer className="page-footer">
      <div className="page-footer-contact flex flex-wrap items-center gap-x-7 gap-y-2.5">
        <a href={`mailto:${site.email}`} className={link}>
          {site.email}
        </a>
        <a
          href={site.instagram}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${site.name} on Instagram`}
          className={`${link} inline-flex items-center gap-2.5`}
        >
          <InstagramIcon />
          {site.instagramHandle}
        </a>
      </div>

      <nav aria-label="Turn the page" className="page-footer-turns">
        <BookLink href="/" className="turn-link group">
          <span aria-hidden className="turn-arrow turn-arrow--back">
            &larr;
          </span>
          Cover
        </BookLink>
        {next && (
          <BookLink href={next.href} className="turn-link group">
            {next.label}
            <span aria-hidden className="turn-arrow">
              &rarr;
            </span>
          </BookLink>
        )}
      </nav>

      <Folio className="page-folio">{folio}</Folio>
    </footer>
  );
}
