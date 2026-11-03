import type { Metadata } from "next";
import { site } from "@/lib/site";

/**
 * The site-wide share card from src/app/opengraph-image.tsx. A page that
 * sets its own share tags replaces the inherited ones wholesale, so each
 * page names the card explicitly.
 */
const shareImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: site.name,
};

/**
 * A page's own title, description and canonical address, carried through
 * to the cards it makes when shared.
 *
 * `index: false` keeps a page out of search results — for the "Coming
 * soon" pages, until they have something to say.
 */
export function pageMetadata({
  title,
  description,
  path,
  index = true,
}: {
  title: string;
  description: string;
  path: string;
  index?: boolean;
}): Metadata {
  const shareTitle = `${title} | ${site.name}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "en_GB",
      siteName: site.name,
      url: path,
      title: shareTitle,
      description,
      images: [shareImage],
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description,
      images: [shareImage],
    },
    ...(index ? {} : { robots: { index: false, follow: true } }),
  };
}
