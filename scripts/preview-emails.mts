/**
 * Renders the transactional emails to HTML so they can be opened in a
 * browser without sending anything.
 *
 * Email clients are the least forgiving renderer we target and the one we
 * can't hot-reload, so being able to eyeball these matters.
 *
 * Run: npm run emails:preview  →  .preview/emails/*.html
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { confirmationEmail, notificationEmail, type Letter } from "../src/lib/emails.js";

const OUT = ".preview/emails";
await mkdir(OUT, { recursive: true });

/**
 * The images are referenced at the live site. The preview shows the ones
 * in public/ now instead, written into the page itself — browsers won't
 * let a page opened from disk load images from elsewhere on the disk.
 */
const localise = async ({ html }: Letter) => {
  const paths = [...new Set([...html.matchAll(/src="https:\/\/[^"/]+\/([^"]+\.png)"/g)].map((m) => m[1]))];
  let out = html;
  for (const path of paths) {
    const data = (await readFile(`public/${path}`)).toString("base64");
    out = out.replace(
      new RegExp(`src="https://[^"/]+/${path.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}"`, "g"),
      `src="data:image/png;base64,${data}"`,
    );
  }
  return out;
};

const files = {
  "confirmation.html": confirmationEmail({
    name: "Adaeze Okonkwo",
    message:
      "We've just bought a Victorian terrace and would love help with the ground floor.\nKitchen, living room and a small study — somewhere calm to work from, with room for the children to read beside me. We're hoping to start in the spring.",
  }),
  "notification.html": notificationEmail({
    name: "Adaeze Okonkwo",
    email: "adaeze.okonkwo@gmail.com",
    message:
      "We've just bought a Victorian terrace and would love help with the ground floor.\nKitchen, living room and a small study.",
    heard: "A friend's home — she worked with you last year.",
  }),
};

for (const [name, letter] of Object.entries(files)) {
  await writeFile(`${OUT}/${name}`, await localise(letter));
  console.log(`${OUT}/${name}`);
}
