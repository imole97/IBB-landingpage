import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/**
 * The wordmark is 1179×248 — unreadable in a 64px square — so the icon
 * is a monogram in the system's own palette instead.
 */
export default function Icon() {
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
          color: "#C2B3A1",
          fontSize: 38,
          fontWeight: 600,
          letterSpacing: -1,
        }}
      >
        B.
      </div>
    ),
    size,
  );
}
