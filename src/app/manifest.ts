import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/** Lets the site be saved to a home screen as itself, in its own colours. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name} — Interior Design Studio`,
    short_name: site.shortName,
    description: site.metaDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#1A1714",
    theme_color: "#1A1714",
    categories: ["lifestyle", "design"],
    icons: [
      { src: "/icon", sizes: "96x96", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
