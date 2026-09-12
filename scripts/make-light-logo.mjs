/**
 * Generates public/logo-light.png — the wordmark in paper (#F4EEE5).
 *
 * public/logo.png is pure black artwork whose shape lives entirely in the
 * alpha channel. The browser recolours it with `invert(1) brightness(2.6)`
 * (see the `wordmark-on-ink` utility), but Satori — which renders the OG
 * card — supports neither CSS filters nor mask-image, so it needs a real
 * light-coloured file.
 *
 * Run: npm run logo:light   (only needed if public/logo.png changes)
 */
import sharp from "sharp";

const SRC = "public/logo.png";
const OUT = "public/logo-light.png";
const PAPER = { r: 0xf4, g: 0xee, b: 0xe5 };

const src = sharp(SRC);
const { width, height } = await src.metadata();
if (!width || !height) throw new Error(`Could not read dimensions from ${SRC}`);

const alpha = await src.clone().extractChannel("alpha").raw().toBuffer();

await sharp({
  create: { width, height, channels: 3, background: PAPER },
})
  .joinChannel(alpha, { raw: { width, height, channels: 1 } })
  .png()
  .toFile(OUT);

console.log(`${OUT} — ${width}×${height}`);
