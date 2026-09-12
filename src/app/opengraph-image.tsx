import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { site } from "@/lib/site";

export const alt = `${site.name} — interior design studio, London and Lagos`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The social card is the front cover: ink gradient, corner brackets,
 * wordmark, taupe rule, tagline. Same composition as src/app/page.tsx.
 *
 * Satori supports neither CSS filters nor mask-image, so this uses the
 * pre-recoloured wordmark from `npm run logo:light` rather than the
 * browser's invert filter.
 */
export default async function OpengraphImage() {
  const logo = await readFile(join(process.cwd(), "public", "logo-light.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  const TAUPE = "#9A8876";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #1A1611 0%, #2C2419 50%, #1F1A14 100%)",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Corner brackets */}
        <div
          style={{
            position: "absolute",
            top: 48,
            right: 48,
            width: 72,
            height: 72,
            borderTop: `2px solid ${TAUPE}`,
            borderRight: `2px solid ${TAUPE}`,
            opacity: 0.6,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 48,
            left: 48,
            width: 72,
            height: 72,
            borderBottom: `2px solid ${TAUPE}`,
            borderLeft: `2px solid ${TAUPE}`,
            opacity: 0.6,
          }}
        />

        <div
          style={{
            fontSize: 20,
            letterSpacing: 11,
            textTransform: "uppercase",
            color: TAUPE,
            marginBottom: 56,
          }}
        >
          London · Lagos
        </div>

        {/* Satori renders plain <img>; next/image has no meaning here. */}
        <img src={logoSrc} alt="" width={620} height={130} />

        <div
          style={{
            width: 110,
            height: 2,
            background: TAUPE,
            marginTop: 44,
            marginBottom: 36,
          }}
        />

        <div style={{ fontSize: 34, letterSpacing: 5, color: "#F4EEE5" }}>
          {site.tagline}
        </div>

        <div
          style={{
            fontSize: 22,
            color: "#C2B3A1",
            marginTop: 28,
            fontStyle: "italic",
          }}
        >
          {site.motto}
        </div>
      </div>
    ),
    size,
  );
}
