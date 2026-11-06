import { site, absoluteUrl } from "@/lib/site";

/**
 * The studio's letters.
 *
 * Each email is set as a loose page of the book: bone paper on a deeper
 * ground, one corner turned down, the book's running head across the top
 * and the pages it came from stacked beneath it. Everything else is left
 * out — the quiet is the point.
 *
 * Email-safe throughout: tables, inline styles, nothing that needs
 * JavaScript or a stylesheet to make sense. Comfortaa is offered to the
 * clients that can load it (Apple Mail, iOS); everywhere else falls back
 * to a rounded system face. The page titles' script hand can't be relied
 * on in any client, so "Thank you" is lettering in an image, with alt
 * text styled to stand in when images are blocked.
 *
 * Images are served from the live site (site.url), so they appear in
 * real emails once that deploy is up. The preview script points them at
 * public/ instead.
 */

// ─── Bone & Ink (src/app/globals.css) ───
const GROUND = "#ECE6DB"; // around the page — page-deep
const PAPER = "#F4F0E8"; // the page
const FLAP = "#DFD6C8"; // the turned-down corner's underside
const EDGE_1 = "#E4DDD1"; // pages stacked beneath, nearest first
const EDGE_2 = "#DCD4C6";
const HAIRLINE = "#DDD7CD"; // ink at 14% on bone, flattened for Outlook
const ACCENT = "#9A8876"; // rules and ornaments only, never small text
const LABEL = "#6E6052"; // small capitals
const SOFT = "#55504A"; // running copy
const INK = "#1C1B19"; // headings and primary text

const FONT =
  "Comfortaa, ui-rounded, 'SF Pro Rounded', 'Segoe UI', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";

/** The page's side margin; narrowed on a phone by the .ibb-pad rule. */
const MARGIN = 56;
const CORNER = 30;

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

/** "Thursday 6 November 2026 at 14:32", in London, where the studio reads it. */
const londonTime = (at = new Date()) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(at);

// ─── The page ───

/**
 * The text a client shows beside the subject line, then enough invisible
 * filler that it doesn't carry on into the letter's own first words.
 */
const preheader = (text: string) =>
  `<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:${GROUND};">${text}${"&#847;&zwnj;&nbsp;".repeat(60)}</div>`;

/**
 * The turned-down corner: the top-right of the page folded over, showing
 * the ground behind it and the paper's underside. Two borders meeting on
 * a diagonal draw it — no image, nothing to block.
 */
const turnedCorner = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="height:${CORNER}px;font-size:0;line-height:0;background:${PAPER};">&nbsp;</td>
    <td width="${CORNER}" style="width:${CORNER}px;height:${CORNER}px;font-size:0;line-height:0;background:${PAPER};">
      <div style="width:0;height:0;border-top:${CORNER}px solid ${GROUND};border-left:${CORNER}px solid ${FLAP};font-size:0;line-height:0;"></div>
    </td>
  </tr>
</table>`;

/** The book's running head: the wordmark small, a title at the far margin, ruled beneath. */
const runningHead = (title: string) => `
<tr>
  <td class="ibb-pad" style="padding:0 ${MARGIN}px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td valign="bottom" style="padding:0 0 16px;">
          <a href="${absoluteUrl("/")}" style="text-decoration:none;">
            <img src="${absoluteUrl("/logo.png")}" width="112" alt="${site.name}"
                 style="display:block;width:112px;height:auto;border:0;font-family:${FONT};font-size:14px;color:${INK};">
          </a>
        </td>
        <td valign="bottom" align="right" style="padding:0 0 18px;font-family:${FONT};font-size:10px;line-height:1;letter-spacing:0.45em;text-transform:uppercase;color:${LABEL};white-space:nowrap;">
          ${title}
        </td>
      </tr>
    </table>
    <div style="height:1px;line-height:1px;font-size:0;background:${HAIRLINE};">&nbsp;</div>
  </td>
</tr>`;

/** The 80×1px taupe rule. */
const rule = (space = 28) =>
  `<div style="width:80px;height:1px;line-height:1px;font-size:0;background:${ACCENT};margin:${space}px 0;">&nbsp;</div>`;

/** The site's ornament: a small taupe diamond, and a hairline running from it. */
const ornament = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td width="8" style="width:8px;padding:0 14px 0 1px;">
      <div style="width:6px;height:6px;background:${ACCENT};transform:rotate(45deg);font-size:0;line-height:0;">&nbsp;</div>
    </td>
    <td style="width:100%;">
      <div style="height:1px;line-height:1px;font-size:0;background:${HAIRLINE};">&nbsp;</div>
    </td>
  </tr>
</table>`;

const label = (text: string, space = 0) =>
  `<div style="margin:0 0 ${space}px;font-family:${FONT};font-size:11px;line-height:1.4;font-weight:600;letter-spacing:0.45em;text-transform:uppercase;color:${LABEL};">${text}</div>`;

/** The pages the letter came from, stacked beneath it — the book's edges. */
const pagesBeneath = `
<tr><td style="padding:0 4px;"><div style="height:3px;line-height:3px;font-size:0;background:${EDGE_1};">&nbsp;</div></td></tr>
<tr><td style="padding:0 9px;"><div style="height:3px;line-height:3px;font-size:0;background:${EDGE_2};">&nbsp;</div></td></tr>`;

/** The page's foot: the ornament, the way back to the studio, the motto. */
const pageFoot = `
<tr>
  <td class="ibb-pad" style="padding:0 ${MARGIN}px 48px;">
    ${ornament}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:22px;">
      <tr>
        <td class="ibb-stack" valign="top" style="font-family:${FONT};font-size:10px;line-height:2;letter-spacing:0.3em;text-transform:uppercase;">
          <a href="${absoluteUrl("/")}" style="color:${SOFT};text-decoration:none;">interiorsbyb.net</a><span style="color:${ACCENT};">&nbsp;&nbsp;&middot;&nbsp;&nbsp;</span><a href="${site.instagram}" style="color:${SOFT};text-decoration:none;">Instagram</a>
        </td>
        <td class="ibb-stack ibb-motto" valign="top" align="right" style="font-family:${FONT};font-size:12px;line-height:1.7;font-style:italic;color:${LABEL};white-space:nowrap;">
          ${site.motto}
        </td>
      </tr>
    </table>
  </td>
</tr>`;

const page = ({
  head,
  body,
  preview,
  postscript,
}: {
  head: string;
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
    .ibb-ground { padding:24px 10px !important; }
    .ibb-pad { padding-left:28px !important; padding-right:28px !important; }
    .ibb-stack { display:block !important; width:100% !important; text-align:left !important; }
    .ibb-lettering { width:220px !important; }
    .ibb-key { border-bottom:0 !important; padding-bottom:0 !important; }
    .ibb-value { padding-top:4px !important; }
    .ibb-motto { padding-top:6px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${GROUND};-webkit-font-smoothing:antialiased;-webkit-text-size-adjust:100%;">
${preheader(preview)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${GROUND};">
  <tr>
    <td class="ibb-ground" align="center" style="padding:56px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
        <tr>
          <td style="background:${PAPER};">
            ${turnedCorner}
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              ${runningHead(head)}
              ${body}
              ${pageFoot}
            </table>
          </td>
        </tr>
        ${pagesBeneath}
        ${
          postscript
            ? `<tr><td align="center" style="padding:28px 24px 0;font-family:${FONT};font-size:11px;line-height:1.8;color:${LABEL};">${postscript}</td></tr>`
            : ""
        }
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

const bodyRow = (inner: string) =>
  `<tr><td class="ibb-pad" style="padding:52px ${MARGIN}px 52px;font-family:${FONT};">${inner}</td></tr>`;

export type Letter = { subject: string; html: string; text: string };

// ─── To the person who wrote in ───

/**
 * A thank-you, written as a letter: the script heading from the site, a
 * few lines from the studio, and their own words handed back to them so
 * they know exactly what arrived.
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
    head: "Correspondence",
    preview: "Your note has reached the studio — we’ll be in touch within two working days.",
    postscript: `You&rsquo;re receiving this because you wrote to us at interiorsbyb.net.<br>${site.name} &middot; London &amp; Lagos`,
    body: bodyRow(`
      <img class="ibb-lettering" src="${absoluteUrl("/email/thank-you.png")}" width="260" alt="Thank you"
           style="display:block;width:260px;max-width:100%;height:auto;border:0;margin:0 0 0 -10px;font-family:Georgia,serif;font-style:italic;font-size:40px;line-height:1.2;color:${INK};">

      ${rule(30)}

      <p style="margin:0 0 22px;font-family:${FONT};font-size:18px;line-height:1.5;color:${INK};">
        Dear ${name},
      </p>
      <p style="margin:0 0 20px;font-family:${FONT};font-size:15px;line-height:1.9;color:${SOFT};">
        Your note has reached the studio, and we&rsquo;re already curious
        about your space. We&rsquo;ll be in touch within two working days to
        begin your story.
      </p>
      <p style="margin:0 0 40px;font-family:${FONT};font-size:15px;line-height:1.9;color:${SOFT};">
        If anything else comes to mind in the meantime &mdash; a photograph,
        a floor plan, a feeling about a room &mdash; simply reply to this
        letter.
      </p>

      ${label("Your note", 16)}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 44px;">
        <tr>
          <td style="border-left:1px solid ${ACCENT};padding:2px 0 2px 22px;font-family:${FONT};font-size:14px;line-height:1.85;font-style:italic;color:${SOFT};">
            &ldquo;${note}&rdquo;
          </td>
        </tr>
      </table>

      <p style="margin:0 0 6px;font-family:${FONT};font-size:15px;line-height:1.7;color:${SOFT};">
        With warmth,
      </p>
      <p style="margin:0 0 4px;font-family:${FONT};font-size:17px;line-height:1.6;color:${INK};">
        ${site.name}
      </p>
      <p style="margin:0;font-family:${FONT};font-size:10px;line-height:1.8;letter-spacing:0.45em;text-transform:uppercase;color:${LABEL};">
        Interior Design Studio
      </p>
    `),
  });

  const text = [
    `Thank you, ${first}.`,
    "",
    "Your note has reached the studio, and we're already curious about your space. We'll be in touch within two working days to begin your story.",
    "",
    "If anything else comes to mind in the meantime — a photograph, a floor plan, a feeling about a room — simply reply to this letter.",
    "",
    "Your note:",
    `“${excerpt(rawMessage)}”`,
    "",
    "With warmth,",
    site.name,
    "",
    "—",
    `${site.motto}`,
    `${site.url} · ${site.instagram}`,
  ].join("\n");

  return { subject: `Thank you for writing — ${site.name}`, html, text };
}

// ─── To the studio ───

/**
 * A new enquiry, set to be read at a glance: who, how to answer them, what
 * they said, and the details after. Replying to it goes straight to them.
 */
export function notificationEmail({
  name: rawName,
  email: rawEmail,
  message: rawMessage,
  heard: rawHeard,
  ip: rawIp,
  at = new Date(),
}: {
  name: string;
  email: string;
  message: string;
  /** Their answer to "How did you hear about us?", if they gave one. */
  heard?: string;
  ip: string;
  at?: Date;
}): Letter {
  const name = escapeHtml(rawName);
  const first = escapeHtml(firstName(rawName));
  const email = escapeHtml(rawEmail);
  const reply = `mailto:${encodeURIComponent(rawEmail)}?subject=${encodeURIComponent(`Your enquiry — ${site.name}`)}`;
  const when = londonTime(at);

  const detail = (key: string, value: string, last = false) => `
    <tr>
      <td class="ibb-stack ibb-key" valign="top" width="130" style="width:130px;padding:14px 0;${last ? "" : `border-bottom:1px solid ${HAIRLINE};`}font-family:${FONT};font-size:10px;line-height:1.9;letter-spacing:0.35em;text-transform:uppercase;color:${LABEL};">${key}</td>
      <td class="ibb-stack ibb-value" valign="top" style="padding:14px 0;${last ? "" : `border-bottom:1px solid ${HAIRLINE};`}font-family:${FONT};font-size:13px;line-height:1.7;color:${SOFT};">${value}</td>
    </tr>`;

  const details = [
    rawHeard ? ["Heard of us", escapeHtml(rawHeard)] : null,
    ["Received", `${when} <span style="color:${LABEL};">London</span>`],
    ["Sent from", escapeHtml(rawIp)],
  ].filter((d): d is string[] => !!d);

  const html = page({
    head: "Enquiry",
    preview: `${name} wrote: ${escapeHtml(excerpt(rawMessage, 110))}`,
    body: bodyRow(`
      ${label("A new enquiry", 22)}
      <p style="margin:0 0 8px;font-family:${FONT};font-size:28px;line-height:1.3;color:${INK};">${name}</p>
      <p style="margin:0;font-family:${FONT};font-size:14px;line-height:1.6;">
        <a href="mailto:${email}" style="color:${SOFT};text-decoration:none;">${email}</a>
      </p>

      ${rule(32)}

      <p style="margin:0 0 40px;font-family:${FONT};font-size:15px;line-height:1.9;color:${INK};">${paragraphs(rawMessage)}</p>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 44px;">
        <tr>
          <td style="background:${INK};">
            <a href="${reply}" style="display:inline-block;padding:15px 30px;font-family:${FONT};font-size:11px;line-height:1;font-weight:600;letter-spacing:0.35em;text-transform:uppercase;color:${PAPER};text-decoration:none;">Reply to ${first}</a>
          </td>
        </tr>
      </table>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${HAIRLINE};">
        ${details.map(([k, v], i) => detail(k, v, i === details.length - 1)).join("")}
      </table>
    `),
  });

  const text = [
    `New enquiry from ${rawName} <${rawEmail}>`,
    "",
    rawMessage,
    "",
    "—",
    rawHeard ? `Heard of us: ${rawHeard}` : null,
    `Received: ${when} (London)`,
    `Sent from: ${rawIp}`,
    "",
    "Replying to this email goes straight back to them.",
  ]
    .filter((l) => l !== null)
    .join("\n");

  return { subject: `New enquiry — ${rawName}`, html, text };
}
