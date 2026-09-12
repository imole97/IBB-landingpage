import { site, absoluteUrl } from "@/lib/site";

/**
 * Email-safe HTML: tables, inline styles, no web fonts (Comfortaa won't
 * render in most clients, so these fall back to a rounded system stack
 * and lean on the palette and tracking to carry the brand instead).
 */

const INK = "#1A1714";
const TAUPE = "#9A8876";
const TAUPE_LIGHT = "#C2B3A1";
const PAPER = "#F4EEE5";
const FONT =
  "ui-rounded, 'Segoe UI', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";

const shell = (inner: string, preheader: string) => `
<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${site.name}</title>
</head>
<body style="margin:0;padding:0;background:${INK};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${INK};">
  <tr>
    <td align="center" style="padding:48px 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background:#1F1A14;">
        <tr><td style="padding:48px 40px;font-family:${FONT};">${inner}</td></tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

const rule = `<div style="width:80px;height:1px;background:${TAUPE};margin:28px 0;"></div>`;

const label = (text: string) =>
  `<div style="font-size:12px;font-weight:600;letter-spacing:0.45em;text-transform:uppercase;color:${TAUPE};">${text}</div>`;

/** Sent to the studio when someone joins the list. */
export function notificationEmail({ email, ip }: { email: string; ip: string }) {
  return shell(
    `
    ${label("New signup")}
    ${rule}
    <p style="margin:0 0 8px;font-size:20px;color:${PAPER};">
      <a href="mailto:${email}" style="color:${PAPER};text-decoration:none;">${email}</a>
    </p>
    <p style="margin:0;font-size:13px;line-height:1.8;color:${TAUPE_LIGHT};">
      ${new Date().toUTCString()}<br>IP ${ip}
    </p>
    ${rule}
    <p style="margin:0;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:${TAUPE};">
      ${site.colophon}
    </p>
  `,
    `New waitlist signup — ${email}`,
  );
}

/** Sent to the subscriber. */
export function confirmationEmail() {
  return shell(
    `
    ${label(site.edition)}
    ${rule}
    <p style="margin:0 0 24px;font-size:22px;line-height:1.5;color:${PAPER};">
      Thank you. We&rsquo;ll be in touch to begin your story.
    </p>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.85;color:rgba(244,238,229,0.65);">
      ${site.name} is a residential and commercial design studio working across
      London and Lagos. We&rsquo;re putting the finishing touches to our first
      edition &mdash; you&rsquo;ll be among the first to see it.
    </p>
    <p style="margin:0;font-size:16px;letter-spacing:0.18em;color:${TAUPE_LIGHT};">
      ${site.tagline}
    </p>
    ${rule}
    <p style="margin:0;font-size:12px;line-height:2;letter-spacing:0.15em;text-transform:uppercase;color:${TAUPE};">
      <a href="${absoluteUrl("/")}" style="color:${TAUPE};text-decoration:none;">interiorsbyb.net</a>
      &nbsp;&middot;&nbsp;
      <a href="${site.instagram}" style="color:${TAUPE};text-decoration:none;">Instagram</a>
      <br>${site.colophon}
    </p>
  `,
    "You're on the list.",
  );
}
