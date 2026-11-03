import type { MetadataRoute } from "next";
import { sections } from "@/lib/content";
import { absoluteUrl } from "@/lib/site";

/**
 * Every page of the book that's ready to be found. The service and project
 * pages join once they have more than "Coming soon" on them.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return sections.map((section, i) => ({
    url: absoluteUrl(section.href),
    lastModified,
    changeFrequency: "weekly" as const,
    priority: i === 0 ? 1 : 0.8,
    ...(i === 0 ? { images: [absoluteUrl("/opengraph-image")] } : {}),
  }));
}
