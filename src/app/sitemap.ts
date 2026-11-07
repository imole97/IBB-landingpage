import type { MetadataRoute } from "next";
import { sections, stageHref, studioProcess } from "@/lib/content";
import { absoluteUrl } from "@/lib/site";

/**
 * Every page of the book that's ready to be found: the sections and the
 * six stages of the process. The service pages join once they have more
 * than "Coming soon" on them.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const pages = sections.map((section, i) => ({
    url: absoluteUrl(section.href),
    lastModified,
    changeFrequency: "weekly" as const,
    priority: i === 0 ? 1 : 0.8,
    ...(i === 0 ? { images: [absoluteUrl("/opengraph-image")] } : {}),
  }));
  const stages = studioProcess.stages.map((stage) => ({
    url: absoluteUrl(stageHref(stage)),
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  return [...pages, ...stages];
}
