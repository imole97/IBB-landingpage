import { ImageResponse } from "next/og";
import { ogFonts } from "@/lib/ogFonts";

/** Google shows favicons from 48px up, in multiples of 48 — so 96. */
export const size = { width: 96, height: 96 };
export const contentType = "image/png";

/**
 * The wordmark is 1179×248 — unreadable in a small square — so the icon
 * is a monogram in the system's own palette and typeface instead.
 */
export default async function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F4F0E8",
          color: "#1C1B19",
          fontFamily: "Comfortaa",
          fontSize: 58,
          fontWeight: 500,
          letterSpacing: -2,
        }}
      >
        B.
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
