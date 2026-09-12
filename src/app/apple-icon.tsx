import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          color: "#C2B3A1",
        }}
      >
        <div style={{ fontSize: 92, fontWeight: 600, letterSpacing: -2 }}>B.</div>
        <div style={{ width: 44, height: 2, background: "#9A8876", marginTop: 12 }} />
      </div>
    ),
    size,
  );
}
