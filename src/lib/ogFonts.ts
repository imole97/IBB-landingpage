import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Comfortaa for next/og images (the share card, the icons). Satori needs
 * the font files themselves — the Comfortaa the site loads through
 * next/font isn't reachable from an image route — so static TTFs live in
 * assets/fonts. Satori can't read variable fonts; these are single weights.
 */
export async function ogFonts() {
  const [light, medium] = await Promise.all(
    ["Comfortaa-Light.ttf", "Comfortaa-Medium.ttf"].map((file) =>
      readFile(join(process.cwd(), "assets", "fonts", file)),
    ),
  );
  return [
    { name: "Comfortaa", data: light, weight: 300 as const, style: "normal" as const },
    { name: "Comfortaa", data: medium, weight: 500 as const, style: "normal" as const },
  ];
}
