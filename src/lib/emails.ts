import { site, absoluteUrl } from "@/lib/site";

/**
 * Email-safe HTML: tables, inline styles, no web fonts.
 *
 * Comfortaa won't render in most clients, so the brand is carried by the
 * palette, the heavy label tracking, the taupe rule and the wordmark
 * image instead of by the typeface.
 */

const INK = "#1A1714";
const CARD = "#1F1A14";
const TAUPE = "#9A8876";
const TAUPE_LIGHT = "#C2B3A1";
const PAPER = "#F4EEE5";
const MUTED = "rgba(244,238,229,0.70)";
const FONT =
  "ui-rounded, 'Segoe UI', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";

const shell = (inner: string, preheader: string) => `
<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${site.name}</title>
</head>
<body style="margin:0;padding:0;background:${INK};-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${INK};">
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
  `<div style="width:80px;height:1px;background:${TAUPE};margin:28px ${align === "center" ? "auto" : "0"};"></div>`;

const label = (text: string, align: "left" | "center" = "left") =>
  `<div style="font-size:12px;font-weight:600;letter-spacing:0.45em;text-transform:uppercase;color:${TAUPE};text-align:${align};">${text}</div>`;

/**
 * The L-shaped corner brackets. Plain bordered divs — Outlook's Word
 * renderer draws these as well as it draws anything, and where a client
 * drops them the layout is unaffected.
 */
const bracket = (corner: "tr" | "bl") => {
  const edges =
    corner === "tr"
      ? `border-top:1px solid ${TAUPE};border-right:1px solid ${TAUPE};`
      : `border-bottom:1px solid ${TAUPE};border-left:1px solid ${TAUPE};`;
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
 * Sent to the studio when someone joins the list.
 * Deliberately plain — this one is an alert, meant to be scanned in a
 * notification shade, not admired.
 */
export function notificationEmail({
  email: rawEmail,
  company: rawCompany,
  ip: rawIp,
}: {
  email: string;
  company?: string;
  ip: string;
}) {
  const email = escapeHtml(rawEmail);
  const company = rawCompany ? escapeHtml(rawCompany) : "";
  const ip = escapeHtml(rawIp);
  return shell(
    `
    <div style="height:44px;"></div>
    ${label("New signup")}
    ${rule()}
    <p style="margin:0 0 6px;font-size:21px;line-height:1.4;color:${PAPER};">
      <a href="mailto:${email}" style="color:${PAPER};text-decoration:none;">${email}</a>
    </p>
    ${
      company
        ? `<p style="margin:0 0 6px;font-size:15px;line-height:1.5;color:${TAUPE_LIGHT};">${company}</p>`
        : ""
    }
    <p style="margin:0 0 28px;font-size:13px;line-height:1.9;color:${TAUPE_LIGHT};">
      ${new Date().toUTCString()}<br>IP ${ip}
    </p>
    <p style="margin:0;font-size:13px;line-height:1.7;color:${MUTED};">
      Replying to this email goes straight back to them.
    </p>
    ${rule()}
    <p style="margin:0 0 44px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${TAUPE};">
      ${site.colophon}
    </p>
  `,
    `New waitlist signup — ${company ? `${company}, ` : ""}${email}`,
  );
}

/**
 * Sent to the subscriber — a brand touchpoint, so it's built as the
 * book's front cover: brackets, edition line, wordmark, rule, tagline.
 */
export function confirmationEmail() {
  return shell(
    `
    ${bracket("tr")}

    <div style="text-align:center;">
      ${label(site.edition, "center")}

      <div style="height:34px;"></div>

      <!-- Wordmark. Pre-recoloured for dark backgrounds; the alt text is
           styled so a client that blocks images still shows the name. -->
      <img src="${absoluteUrl("/logo-light.png")}"
           width="260" alt="${site.name}"
           style="width:260px;max-width:70%;height:auto;border:0;display:block;margin:0 auto;font-family:${FONT};font-size:20px;color:${PAPER};">

      ${rule("center")}

      <p style="margin:0 0 40px;font-size:15px;letter-spacing:0.16em;color:${PAPER};">
        ${site.tagline}
      </p>
    </div>

    <p style="margin:0 0 22px;font-size:20px;line-height:1.55;color:${PAPER};">
      Thank you. We&rsquo;ll be in touch to begin your story.
    </p>

    <p style="margin:0 0 22px;font-size:15px;line-height:1.85;color:${MUTED};">
      ${site.name} is a residential and commercial design studio working
      across London and Lagos. We&rsquo;re putting the finishing touches to
      our first edition &mdash; you&rsquo;ll be among the first to see it.
    </p>

    <p style="margin:0;font-size:15px;line-height:1.8;color:${TAUPE_LIGHT};font-style:italic;">
      &ldquo;${site.motto}&rdquo;
    </p>

    ${rule()}

    <p style="margin:0 0 6px;font-size:12px;line-height:2;letter-spacing:0.14em;text-transform:uppercase;">
      <a href="${absoluteUrl("/")}" style="color:${TAUPE_LIGHT};text-decoration:none;">interiorsbyb.net</a>
      <span style="color:${TAUPE};">&nbsp;&middot;&nbsp;</span>
      <a href="${site.instagram}" style="color:${TAUPE_LIGHT};text-decoration:none;">Instagram</a>
    </p>
    <p style="margin:0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${TAUPE};">
      ${site.colophon}
    </p>

    ${bracket("bl")}
  `,
    "You're on the list.",
  );
}
