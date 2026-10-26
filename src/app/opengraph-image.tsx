import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { site } from "@/lib/site";

export const alt = site.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The social card is the wordmark alone, centred on the cover's ink
 * gradient — nothing else on the page.
 *
 * Satori supports neither CSS filters nor mask-image, so this uses the
 * pre-recoloured wordmark from `npm run logo:light` rather than the
 * browser's invert filter.
 */
export default async function OpengraphImage() {
  const logo = await readFile(join(process.cwd(), "public", "logo-light.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #1A1611 0%, #2C2419 50%, #1F1A14 100%)",
        }}
      >
        {/* Satori renders plain <img>; next/image has no meaning here. */}
        <img src={logoSrc} alt="" width={780} height={164} />
      </div>
    ),
    size,
  );
}
