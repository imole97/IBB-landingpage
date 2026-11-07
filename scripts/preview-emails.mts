/**
 * Renders the transactional emails to HTML so they can be opened in a
 * browser without sending anything.
 *
 * Email clients are the least forgiving renderer we target and the one we
 * can't hot-reload, so being able to eyeball these matters.
 *
 * Run: npm run emails:preview  →  .preview/emails/*.html
 */
import { mkdir, writeFile } from "node:fs/promises";
import { confirmationEmail, notificationEmail, type Letter } from "../src/lib/emails.js";

const OUT = ".preview/emails";
await mkdir(OUT, { recursive: true });

/**
 * The images travel as inline attachments, referenced by `cid:` — which a
 * browser can't follow — so the preview swaps each for the attachment's
 * own bytes.
 */
const localise = ({ html, attachments }: Letter) =>
  attachments.reduce(
    (out, a) =>
      out.replaceAll(
        `cid:${a.contentId}`,
        `data:${a.contentType};base64,${a.content.toString("base64")}`,
      ),
    html,
  );

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
  await writeFile(`${OUT}/${name}`, localise(letter));
  console.log(`${OUT}/${name}`);
}
