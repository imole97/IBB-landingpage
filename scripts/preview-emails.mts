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
    /src="https?:\/\/[^"]*\/logo-light\.png"/g,
    `src="file://${process.cwd()}/public/logo-light.png"`,
  );

const files = {
  "confirmation.html": confirmationEmail(),
  "notification.html": notificationEmail({
    email: "adaeze.okonkwo@gmail.com",
    company: "Okonkwo & Daughters",
    ip: "102.89.34.17",
  }),
};

for (const [name, html] of Object.entries(files)) {
  await writeFile(`${OUT}/${name}`, localise(html));
  console.log(`${OUT}/${name}`);
}
