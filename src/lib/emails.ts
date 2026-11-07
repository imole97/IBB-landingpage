import { site, absoluteUrl } from "@/lib/site";

/**
 * The studio's emails, set as pages of the site's book.
 *
 * Each one is built like an inner page of the site (InnerPage.tsx): bone
 * paper, taupe brackets in the top-left and bottom-right corners, the
 * running head — wordmark, ruled, with the title at the far margin — a
 * title in the wordmark's hand, labels in tracked small capitals, and the
 * page footer with the studio's email, Instagram, the way back to the
 * site and the folio.
 *
 * Email-safe throughout: tables, inline styles, nothing that needs
 * JavaScript or a stylesheet to make sense. Comfortaa is offered to the
 * clients that can load it (Apple Mail, iOS); everywhere else falls back
 * to a rounded system face. Dr Carbfred, the wordmark's hand, can't be
 * loaded by any client, so the title is lettering in an image, with alt
 * text styled to stand in when images are blocked.
 *
 * Images load from the live site. Email apps fetch them from the open
 * web, so the address must be public: a local build's own (localhost) is
 * unreachable from any inbox, and is swapped for the live domain. Images
 * attached to the email instead (cid:) were tried, and some apps didn't
 * show them.
 */

// ─── Bone & Ink (src/app/globals.css) ───
const GROUND = "#ECE6DB"; // around the page — page-deep
const PAPER = "#F4F0E8"; // the page
const PLATE = "#ECE6DB"; // image plates — page-deep
const PLATE_LINE = "#D9D1C4"; // the plate's inset frame
const HAIRLINE = "#DDD7CD"; // --color-rule (ink at 14%), flattened for Outlook
const ACCENT = "#9A8876"; // rules and brackets only, never small text
const LABEL = "#6E6052"; // small capitals, folios
const SOFT = "#55504A"; // running copy
const INK = "#1C1B19"; // headings and primary text

const FONT =
  "Comfortaa, ui-rounded, 'SF Pro Rounded', 'Segoe UI', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";

/** The page's margin; narrowed on a phone by the .ibb-pad rule. */
const MARGIN = 56;
/** How far the corner brackets sit in from the page's edge, and their size. */
const BRACKET_INSET = 22;
const BRACKET = 36;

/**
 * Where the emails' images are fetched from: the site's own address when
 * it's public, otherwise the live domain.
 */
const PUBLIC_ORIGIN =
  site.url.startsWith("https://") && !/localhost|127\.0\.0\.1/.test(site.url)
    ? site.url
    : "https://www.interiorsbyb.net";

const IMAGES = {
  logo: "/logo.png",
  thankYou: "/email/thank-you.png",
  instagram: "/email/instagram.png",
} as const;

/** An image from public/, at an address any inbox can reach. */
const image = (name: keyof typeof IMAGES) => new URL(IMAGES[name], PUBLIC_ORIGIN).toString();

/**
 * Anything a visitor typed goes through this before it touches the HTML —
 * a name of `<a href=…>` would otherwise land in an inbox as live markup.
 */
const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** Line breaks kept, as they were typed. */
const paragraphs = (text: string) => escapeHtml(text).replace(/\r?\n/g, "<br>");

/** A long message, cut at a word near `max` characters. */
const excerpt = (text: string, max = 280) => {
  const clean = text.trim().replace(/\s+/g, " ");
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,.;:—–-]+$/, "")}…`;
};

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

// ─── The page ───

/**
 * The text a client shows beside the subject line, then enough invisible
 * filler that it doesn't carry on into the email's own first words.
 */
const preheader = (text: string) =>
  `<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:${GROUND};">${text}${"&#847;&zwnj;&nbsp;".repeat(60)}</div>`;

/** The L-shaped corner brackets (CornerBrackets, "tl-br"). */
const bracket = (corner: "tl" | "br") => {
  const edges =
    corner === "tl"
      ? `border-top:1px solid ${ACCENT};border-left:1px solid ${ACCENT};`
      : `border-bottom:1px solid ${ACCENT};border-right:1px solid ${ACCENT};`;
  return `
<tr>
  <td align="${corner === "tl" ? "left" : "right"}" style="padding:${corner === "tl" ? `${BRACKET_INSET}px 0 0 ${BRACKET_INSET}px` : `0 ${BRACKET_INSET}px ${BRACKET_INSET}px 0`};font-size:0;line-height:0;">
    <div style="width:${BRACKET}px;height:${BRACKET}px;${edges}opacity:0.6;font-size:0;line-height:0;">&nbsp;</div>
  </td>
</tr>`;
};

const hairline = `<div style="height:1px;line-height:1px;font-size:0;background:${HAIRLINE};">&nbsp;</div>`;

/** The running head (RunningHead): the wordmark small, the title at the far margin, ruled beneath. */
const runningHead = (title: string) => `
<tr>
  <td class="ibb-pad" style="padding:0 ${MARGIN}px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td valign="bottom" style="padding:0 0 12px;">
          <a href="${absoluteUrl("/")}" style="text-decoration:none;">
            <img src="${image("logo")}" width="150" alt="${site.name}"
                 style="display:block;width:150px;max-width:150px;height:auto;border:0;font-family:${FONT};font-size:15px;color:${INK};">
          </a>
        </td>
        <td valign="bottom" align="right" style="padding:0 0 14px;font-family:${FONT};font-size:10px;line-height:1;letter-spacing:0.4em;text-transform:uppercase;color:${LABEL};white-space:nowrap;">
          ${title}
        </td>
      </tr>
    </table>
    ${hairline}
  </td>
</tr>`;

/** The 80×1px taupe rule (Rule). */
const rule = (space = 28) =>
  `<div style="width:80px;height:1px;line-height:1px;font-size:0;background:${ACCENT};margin:${space}px 0;">&nbsp;</div>`;

/** A label (Label, size "sm"): tracked small capitals, 600 weight. */
const label = (text: string, space = 0) =>
  `<div style="margin:0 0 ${space}px;font-family:${FONT};font-size:12px;line-height:1.4;font-weight:600;letter-spacing:0.45em;text-transform:uppercase;color:${LABEL};">${text}</div>`;

/** The page's title, in the wordmark's hand (ScriptHeading). */
const scriptTitle = (name: keyof typeof IMAGES, alt: string, width: number) =>
  `<img class="ibb-title" src="${image(name)}" width="${width}" alt="${alt}"
        style="display:block;width:${width}px;max-width:100%;height:auto;border:0;margin:0 0 30px;font-family:Georgia,serif;font-style:italic;font-size:44px;line-height:1.2;color:${INK};">`;

/**
 * A plate (.image-plate): the deeper paper, with a hairline frame inset
 * like a mount. Here it holds words rather than a photograph.
 */
const plate = (inner: string) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="background:${PLATE};padding:8px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td class="ibb-plate" style="border:1px solid ${PLATE_LINE};padding:26px 28px;font-family:${FONT};">${inner}</td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;

const footLink = `font-family:${FONT};font-size:11px;line-height:1.6;letter-spacing:0.2em;text-transform:uppercase;color:${SOFT};text-decoration:none;`;

/**
 * The page footer (PageFooter): the studio's email and Instagram on the
 * left, the folio at the far margin, and the way to the site beneath.
 */
const pageFooter = (folio: string) => `
<tr>
  <td class="ibb-pad" style="padding:0 ${MARGIN}px 18px;">
    ${hairline}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td valign="middle" style="padding:20px 0 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td class="ibb-stack" valign="middle" style="padding:0 26px 6px 0;">
                <a href="mailto:${site.email}" style="${footLink}">${site.email}</a>
              </td>
              <td class="ibb-stack" valign="middle" style="padding:0 0 6px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td valign="middle" style="padding:0 10px 0 0;font-size:0;line-height:0;">
                      <a href="${site.instagram}" style="text-decoration:none;">
                        <img src="${image("instagram")}" width="16" height="16" alt="" style="display:block;width:16px;height:16px;border:0;">
                      </a>
                    </td>
                    <td valign="middle">
                      <a href="${site.instagram}" style="${footLink}">${site.instagramHandle}</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
        <td valign="top" align="right" style="padding:20px 0 6px 20px;font-family:${FONT};font-size:11px;line-height:1.6;letter-spacing:0.3em;text-transform:uppercase;color:${LABEL};white-space:nowrap;">${folio}</td>
      </tr>
      <tr>
        <td colspan="2" style="padding:10px 0 0;">
          <a href="${absoluteUrl("/")}" style="${footLink}letter-spacing:0.3em;">Visit the studio&nbsp;&nbsp;&rarr;</a>
        </td>
      </tr>
    </table>
  </td>
</tr>`;

const page = ({
  head,
  folio,
  body,
  preview,
  postscript,
}: {
  head: string;
  folio: string;
  body: string;
  preview: string;
  /** A line in small type under the page, outside it. */
  postscript?: string;
}) => `<!doctype html>
<html lang="en-GB" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${site.name}</title>
<link href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;600&display=swap" rel="stylesheet">
<style>
  body { margin:0; padding:0; }
  a { text-decoration:none; }
  @media (max-width: 560px) {
    .ibb-ground { padding:16px 8px !important; }
    .ibb-pad { padding-left:26px !important; padding-right:26px !important; }
    .ibb-body { padding-top:36px !important; padding-bottom:40px !important; }
    .ibb-stack { display:block !important; width:100% !important; text-align:left !important; }
    .ibb-title { width:230px !important; }
    .ibb-plate { padding:20px 18px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${GROUND};-webkit-font-smoothing:antialiased;-webkit-text-size-adjust:100%;">
${preheader(preview)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${GROUND};">
  <tr>
    <td class="ibb-ground" align="center" style="padding:48px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;">
        <tr>
          <td style="background:${PAPER};">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              ${bracket("tl")}
              ${runningHead(head)}
              ${body}
              ${pageFooter(folio)}
              ${bracket("br")}
            </table>
          </td>
        </tr>
        ${
          postscript
            ? `<tr><td align="center" style="padding:24px 24px 0;font-family:${FONT};font-size:11px;line-height:1.8;color:${LABEL};">${postscript}</td></tr>`
            : ""
        }
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

const bodyRow = (inner: string) =>
  `<tr><td class="ibb-pad ibb-body" style="padding:48px ${MARGIN}px 56px;font-family:${FONT};">${inner}</td></tr>`;

export type Letter = { subject: string; html: string; text: string };

const letter = (subject: string, html: string, text: string): Letter => ({
  subject,
  html,
  text,
});

// ─── To the person who wrote in ───

/**
 * A thank-you, set like the site's Contact page: the title in the
 * wordmark's hand, a label, a few lines from the studio, and their own
 * words handed back to them on a plate, so they know exactly what arrived.
 */
export function confirmationEmail({
  name: rawName,
  message: rawMessage,
}: {
  name: string;
  message: string;
}): Letter {
  const first = firstName(rawName);
  const name = escapeHtml(first);
  const note = escapeHtml(excerpt(rawMessage));

  const html = page({
    head: "Contact Us",
    folio: "v",
    preview: "Your note has reached the studio — we’ll be in touch within two working days.",
    postscript: `You&rsquo;re receiving this because you wrote to us at interiorsbyb.net.<br>${site.name} &middot; London &amp; Lagos`,
    body: bodyRow(`
      ${scriptTitle("thankYou", "Thank you", 300)}

      ${label("Your story begins", 22)}

      <p style="margin:0 0 20px;font-family:${FONT};font-size:18px;line-height:1.6;color:${INK};">
        Dear ${name},
      </p>
      <p style="margin:0 0 18px;font-family:${FONT};font-size:16px;line-height:1.75;color:${SOFT};">
        Thank you for writing to us. Your note has reached the studio, and
        we&rsquo;re already curious about your space. We&rsquo;ll be in touch
        within two working days.
      </p>
      <p style="margin:0 0 40px;font-family:${FONT};font-size:14px;line-height:1.75;color:${SOFT};">
        If anything else comes to mind in the meantime &mdash; a photograph,
        a floor plan, a feeling about a room &mdash; simply reply to this email.
      </p>

      ${label("Your note", 16)}
      ${plate(`<p style="margin:0;font-family:${FONT};font-size:14px;line-height:1.85;font-style:italic;color:${SOFT};">&ldquo;${note}&rdquo;</p>`)}

      ${rule(40)}

      <p style="margin:0 0 6px;font-family:${FONT};font-size:15px;line-height:1.7;color:${SOFT};">
        With warmth,
      </p>
      <p style="margin:0 0 6px;font-family:${FONT};font-size:17px;line-height:1.6;color:${INK};">
        ${site.name}
      </p>
      <p style="margin:0;font-family:${FONT};font-size:11px;line-height:1.8;font-weight:600;letter-spacing:0.45em;text-transform:uppercase;color:${LABEL};">
        ${site.tagline}
      </p>
    `),
  });

  const text = [
    `Thank you, ${first}.`,
    "",
    "Thank you for writing to us. Your note has reached the studio, and we're already curious about your space. We'll be in touch within two working days.",
    "",
    "If anything else comes to mind in the meantime — a photograph, a floor plan, a feeling about a room — simply reply to this email.",
    "",
    "Your note:",
    `“${excerpt(rawMessage)}”`,
    "",
    "With warmth,",
    site.name,
    site.tagline,
    "",
    "—",
    `${site.email} · ${site.instagramHandle}`,
    site.url,
  ].join("\n");

  return letter(`Thank you for writing — ${site.name}`, html, text);
}

// ─── To the studio ───

/**
 * A new enquiry, set to be read at a glance: who, how to answer them, what
 * they said, and how they heard of the studio. Replying to it goes straight to them.
 */
export function notificationEmail({
  name: rawName,
  email: rawEmail,
  message: rawMessage,
  heard: rawHeard,
}: {
  name: string;
  email: string;
  message: string;
  /** Their answer to "How did you hear about us?", if they gave one. */
  heard?: string;
}): Letter {
  const name = escapeHtml(rawName);
  const first = escapeHtml(firstName(rawName));
  const email = escapeHtml(rawEmail);
  const reply = `mailto:${encodeURIComponent(rawEmail)}?subject=${encodeURIComponent(`Your enquiry — ${site.name}`)}`;

  // How they found the studio, if they said — the one detail worth keeping.
  // (When it arrived, the inbox already shows.)
  const heard = rawHeard
    ? `${label("Heard of us", 12)}
      <p style="margin:0 0 40px;font-family:${FONT};font-size:15px;line-height:1.75;color:${SOFT};">${escapeHtml(rawHeard)}</p>`
    : "";

  const html = page({
    head: "Enquiry",
    folio: "v",
    preview: `${name} wrote: ${escapeHtml(excerpt(rawMessage, 110))}`,
    body: bodyRow(`
      ${label("A new enquiry", 22)}
      <p style="margin:0 0 8px;font-family:${FONT};font-size:28px;line-height:1.3;color:${INK};">${name}</p>
      <p style="margin:0;font-family:${FONT};font-size:14px;line-height:1.6;">
        <a href="mailto:${email}" style="color:${SOFT};text-decoration:none;">${email}</a>
      </p>

      ${rule(32)}

      <p style="margin:0 0 40px;font-family:${FONT};font-size:15px;line-height:1.9;color:${INK};">${paragraphs(rawMessage)}</p>

      ${heard}

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0;">
        <tr>
          <td style="background:${INK};">
            <a href="${reply}" style="display:inline-block;padding:15px 30px;font-family:${FONT};font-size:11px;line-height:1;font-weight:600;letter-spacing:0.35em;text-transform:uppercase;color:${PAPER};text-decoration:none;">Reply to ${first}&nbsp;&nbsp;&rarr;</a>
          </td>
        </tr>
      </table>
    `),
  });

  const text = [
    `New enquiry from ${rawName} <${rawEmail}>`,
    "",
    rawMessage,
    "",
    rawHeard ? `Heard of us: ${rawHeard}\n` : null,
    "Replying to this email goes straight back to them.",
  ]
    .filter((l) => l !== null)
    .join("\n");

  return letter(`New enquiry — ${rawName}`, html, text);
}
