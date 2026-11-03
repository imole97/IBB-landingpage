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
import { confirmationEmail, notificationEmail } from "../src/lib/emails.js";

const OUT = ".preview/emails";
await mkdir(OUT, { recursive: true });

/**
 * The wordmark is referenced at the production origin, which isn't live
 * yet — point it at the local file so the preview shows what the real
 * email will show.
 */
const localise = (html: string) =>
  html.replace(
    /src="https?:\/\/[^"]*\/logo\.png"/g,
    `src="file://${process.cwd()}/public/logo.png"`,
  );

const files = {
  "confirmation.html": confirmationEmail({ name: "Adaeze" }),
  "notification.html": notificationEmail({
    name: "Adaeze Okonkwo",
    email: "adaeze.okonkwo@gmail.com",
    message:
      "We've just bought a Victorian terrace and would love help with the ground floor.\nKitchen, living room and a small study.",
    heard: "A friend's home — she worked with you last year.",
    ip: "102.89.34.17",
  }),
};

for (const [name, html] of Object.entries(files)) {
  await writeFile(`${OUT}/${name}`, localise(html));
  console.log(`${OUT}/${name}`);
}
