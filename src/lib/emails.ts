import { site, absoluteUrl } from "@/lib/site";

/**
 * Email-safe HTML: tables, inline styles, no web fonts.
 *
 * Comfortaa won't render in most clients, so the brand is carried by the
 * palette, the heavy label tracking, the taupe rule and the wordmark
 * image instead of by the typeface.
 */

// Bone & Ink — the site's palette (src/app/globals.css).
const BACKDROP = "#ECE6DB"; // around the card
const CARD = "#F4F0E8"; // the paper
const ACCENT = "#9A8876"; // rules and brackets only
const LABEL = "#6E6052"; // small capitals
const SOFT = "#55504A"; // secondary text and links
const INK = "#1C1B19"; // headings and primary text
const MUTED = "#55504A";
const FONT =
  "ui-rounded, 'Segoe UI', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";

const shell = (inner: string, preheader: string) => `
<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${site.name}</title>
</head>
<body style="margin:0;padding:0;background:${BACKDROP};-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BACKDROP};">
  <tr>
    <td align="center" style="padding:40px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:${CARD};">
        <tr><td style="padding:0 40px;font-family:${FONT};">${inner}</td></tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

/** The 80×1px taupe rule. */
const rule = (align: "left" | "center" = "left") =>
  `<div style="width:80px;height:1px;background:${ACCENT};margin:28px ${align === "center" ? "auto" : "0"};"></div>`;

const label = (text: string, align: "left" | "center" = "left") =>
  `<div style="font-size:12px;font-weight:600;letter-spacing:0.45em;text-transform:uppercase;color:${LABEL};text-align:${align};">${text}</div>`;

/**
 * The L-shaped corner brackets. Plain bordered divs — Outlook's Word
 * renderer draws these as well as it draws anything, and where a client
 * drops them the layout is unaffected.
 */
const bracket = (corner: "tr" | "bl") => {
  const edges =
    corner === "tr"
      ? `border-top:1px solid ${ACCENT};border-right:1px solid ${ACCENT};`
      : `border-bottom:1px solid ${ACCENT};border-left:1px solid ${ACCENT};`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="${corner === "tr" ? "right" : "left"}" style="padding:${corner === "tr" ? "36px 0 0" : "30px 0 36px"};"><div style="width:40px;height:40px;${edges}opacity:0.6;font-size:0;line-height:0;">&nbsp;</div></td></tr></table>`;
};

/**
 * Anything a visitor typed goes through this before it touches the HTML —
 * a company name of `<a href=…>` would otherwise land in the studio's
 * inbox as live markup.
 */
const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/**
 * Sent to the studio when someone writes in through the contact page.
 * Deliberately plain — this one is an alert, meant to be scanned in a
 * notification shade, not admired. Replying goes straight back to them.
 */
export function notificationEmail({
  name: rawName,
  email: rawEmail,
  message: rawMessage,
  heard: rawHeard,
  ip: rawIp,
}: {
  name: string;
  email: string;
  message: string;
  /** Their answer to "How did you hear about us?", if they gave one. */
  heard?: string;
  ip: string;
}) {
  const name = escapeHtml(rawName);
  const email = escapeHtml(rawEmail);
  const heard = rawHeard ? escapeHtml(rawHeard) : "";
  const message = escapeHtml(rawMessage).replace(/\r?\n/g, "<br>");
  const ip = escapeHtml(rawIp);
  return shell(
    `
    <div style="height:44px;"></div>
    ${label("New enquiry")}
    ${rule()}
    <p style="margin:0 0 6px;font-size:21px;line-height:1.4;color:${INK};">${name}</p>
    <p style="margin:0 0 6px;font-size:15px;line-height:1.6;">
      <a href="mailto:${email}" style="color:${SOFT};text-decoration:none;">${email}</a>
    </p>
    <p style="margin:24px 0 28px;font-size:15px;line-height:1.8;color:${INK};">${message}</p>
    ${
      heard
        ? `<p style="margin:0 0 28px;font-size:13px;line-height:1.7;color:${SOFT};">Heard about us: ${heard}</p>`
        : ""
    }
    <p style="margin:0 0 28px;font-size:13px;line-height:1.9;color:${SOFT};">
      ${new Date().toUTCString()}<br>IP ${ip}
    </p>
    <p style="margin:0;font-size:13px;line-height:1.7;color:${MUTED};">
      Replying to this email goes straight back to them.
    </p>
    ${rule()}
    <p style="margin:0 0 44px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${LABEL};">
      ${site.colophon}
    </p>
  `,
    `New enquiry from ${name}`,
  );
}

/**
 * Sent to the person who wrote in — a brand touchpoint, so it's built as
 * the book's front cover: brackets, wordmark, rule, tagline.
 */
export function confirmationEmail({ name: rawName }: { name: string }) {
  const name = escapeHtml(rawName);
  return shell(
    `
    ${bracket("tr")}

    <div style="text-align:center;">
      <!-- Wordmark, black on the paper; the alt text is styled so a
           client that blocks images still shows the name. -->
      <img src="${absoluteUrl("/logo.png")}"
           width="260" alt="${site.name}"
           style="width:260px;max-width:70%;height:auto;border:0;display:block;margin:0 auto;font-family:${FONT};font-size:20px;color:${INK};">

      ${rule("center")}

      <p style="margin:0 0 40px;font-size:15px;letter-spacing:0.16em;color:${INK};">
        ${site.tagline}
      </p>
    </div>

    <p style="margin:0 0 22px;font-size:20px;line-height:1.55;color:${INK};">
      Dear ${name}, thank you for getting in touch.
    </p>

    <p style="margin:0 0 22px;font-size:15px;line-height:1.85;color:${MUTED};">
      Your message has reached the studio. We&rsquo;ll be in touch to begin
      your story &mdash; and if anything comes to mind in the meantime,
      simply reply to this email.
    </p>

    <p style="margin:0;font-size:15px;line-height:1.8;color:${SOFT};font-style:italic;">
      &ldquo;${site.motto}&rdquo;
    </p>

    ${rule()}

    <p style="margin:0 0 6px;font-size:12px;line-height:2;letter-spacing:0.14em;text-transform:uppercase;">
      <a href="${absoluteUrl("/")}" style="color:${SOFT};text-decoration:none;">interiorsbyb.net</a>
      <span style="color:${LABEL};">&nbsp;&middot;&nbsp;</span>
      <a href="${site.instagram}" style="color:${SOFT};text-decoration:none;">Instagram</a>
    </p>
    <p style="margin:0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${LABEL};">
      ${site.colophon}
    </p>

    ${bracket("bl")}
  `,
    "Thank you for getting in touch.",
  );
}
