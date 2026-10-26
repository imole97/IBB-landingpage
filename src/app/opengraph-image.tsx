import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ogFonts } from "@/lib/ogFonts";
import { site } from "@/lib/site";

export const alt = `${site.name} — ${site.tagline} Interior design studio.`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TAUPE = "#9A8876";
const TAUPE_LIGHT = "#C2B3A1";
const HAIRLINE = "rgba(184, 168, 147, 0.22)";

/**
 * The social card is the desktop cover in miniature — the same page, set
 * the same way: the wordmark as the largest thing on it with the tagline
 * small beneath, the services ruled and numbered at the foot on the
 * right, the title running up the spine and the corner lifted to turn.
 *
 * Satori supports neither CSS filters nor mask-image, so this uses the
 * pre-recoloured wordmark from `npm run logo:light` rather than the
 * browser's invert filter.
 */
export default async function OpengraphImage() {
  const [logo, fonts] = await Promise.all([
    readFile(join(process.cwd(), "public", "logo-light.png")),
    ogFonts(),
  ]);
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background:
            "linear-gradient(135deg, #1A1611 0%, #2C2419 50%, #1F1A14 100%)",
          fontFamily: "Comfortaa",
          color: TAUPE_LIGHT,
        }}
      >
        {/* The binding: shadow pooled along the left edge. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: 56,
            background:
              "linear-gradient(to right, rgba(0,0,0,0.45), rgba(0,0,0,0.12) 45%, transparent)",
          }}
        />

        {/* Spine title, reading upward. */}
        <div
          style={{
            position: "absolute",
            left: 34,
            top: 315,
            width: 520,
            marginLeft: -260,
            marginTop: -8,
            display: "flex",
            justifyContent: "center",
            transform: "rotate(-90deg)",
            fontSize: 11,
            letterSpacing: 4.5,
            textTransform: "uppercase",
            color: TAUPE,
            opacity: 0.75,
          }}
        >
          {`${site.name}  ·  Interior Design Studio`}
        </div>

        {/* Top-right corner bracket. */}
        <div
          style={{
            position: "absolute",
            top: 28,
            right: 28,
            width: 48,
            height: 48,
            borderTop: `1px solid ${TAUPE}`,
            borderRight: `1px solid ${TAUPE}`,
            opacity: 0.6,
          }}
        />

        {/* Edition, top left. */}
        <div
          style={{
            position: "absolute",
            top: 56,
            left: 96,
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: 7,
            textTransform: "uppercase",
            color: TAUPE,
          }}
        >
          {site.edition}
        </div>

        {/* The wordmark, largest on the page, with the tagline beneath. */}
        <div
          style={{
            position: "absolute",
            top: 196,
            left: 96,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Satori renders plain <img>; next/image has no meaning here. */}
          <img src={logoSrc} alt="" width={640} height={134} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 22,
              marginTop: 40,
              paddingLeft: 6,
            }}
          >
            <div style={{ width: 56, height: 1, background: TAUPE }} />
            <div style={{ fontSize: 18, letterSpacing: 3.2 }}>
              {site.tagline}
            </div>
          </div>
        </div>

        {/* Services at the foot on the right, ruled and numbered. */}
        <div
          style={{
            position: "absolute",
            right: 96,
            bottom: 92,
            width: 350,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              marginBottom: 14,
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: 5,
              textTransform: "uppercase",
              color: TAUPE,
            }}
          >
            Services
          </div>
          {site.services.map((service, i) => (
            <div
              key={service}
              style={{
                display: "flex",
                gap: 18,
                padding: "10px 0",
                borderTop: `1px solid ${HAIRLINE}`,
                borderBottom:
                  i === site.services.length - 1
                    ? `1px solid ${HAIRLINE}`
                    : "none",
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: 2.6,
                textTransform: "uppercase",
              }}
            >
              <span style={{ color: TAUPE }}>{`0${i + 1}`}</span>
              <span>{service}</span>
            </div>
          ))}
        </div>

        {/* Foot of the page: the address, and the corner lifted to turn. */}
        <div
          style={{
            position: "absolute",
            right: 96,
            bottom: 40,
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: 5,
            textTransform: "uppercase",
            color: TAUPE,
          }}
        >
          {new URL(site.url).host.replace(/^www\./, "")}
        </div>
        <div
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            width: 64,
            height: 64,
            background:
              "linear-gradient(315deg, #1A1714 0%, #1A1714 50%, rgba(0,0,0,0.55) 50%, #4D4136 52%, #2C2419 100%)",
          }}
        />
      </div>
    ),
    { ...size, fonts },
  );
}
