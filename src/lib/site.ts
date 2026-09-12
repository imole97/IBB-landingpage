/**
 * Single source of truth for brand facts and URLs.
 * Copy here is lifted from design/Interior By B.html so the coming-soon
 * page and the full landing page never drift apart.
 */

export const site = {
  name: "Interiors By B.",
  shortName: "IBB",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.interiorsbyb.net",
  tagline: "Curated. Curious. Connected.",
  motto: "Every space has a story.",
  edition: "First Edition · 2026",
  colophon: "IBB · 2026 · London · Lagos",
  locations: "London · Lagos · 2026",
  email: "hello@interiorsbyb.net",
  instagram: "https://www.instagram.com/interiors_by_bee/",
  instagramHandle: "@interiors_by_bee",
  /** Prototype line 1461 — the studio bio on the back cover. */
  description:
    "Interiors By B. is a residential and commercial design studio working across London and Lagos. Curated. Curious. Connected. We design intentional spaces that tell meaningful stories — rooted in purpose, shaped by context, and executed with quiet excellence.",
  /** Trimmed for meta description (~155 chars). */
  metaDescription:
    "A residential and commercial interior design studio working across London and Lagos. Intentional spaces that tell meaningful stories. Every space has a story.",
} as const;

export const absoluteUrl = (path = "/") => new URL(path, site.url).toString();
