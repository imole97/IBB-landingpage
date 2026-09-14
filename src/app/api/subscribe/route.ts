import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { site } from "@/lib/site";
import { confirmationEmail, notificationEmail } from "@/lib/emails";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.email().max(254),
  /** Honeypot — must stay empty. */
  company: z.string().max(200).optional(),
});

/**
 * Per-IP throttle. In-memory, so it is per serverless instance only —
 * enough to stop a bored visitor hammering submit, not a determined
 * attacker. If volume ever justifies it, swap in Upstash Redis.
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 3;
const hits = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);

  // Opportunistic cleanup so the map can't grow without bound.
  if (hits.size > 5_000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }
  return recent.length > MAX_PER_WINDOW;
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request." },
      { status: 400 },
    );
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "That address doesn't look right. Mind checking it?" },
      { status: 400 },
    );
  }

  const { email, company } = parsed.data;

  // Honeypot tripped: look successful, do nothing.
  if (company) return NextResponse.json({ ok: true });

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (rateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "One moment — please try again shortly." },
      { status: 429 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  const notify = process.env.NOTIFY_EMAIL;

  const configured = Boolean(apiKey && from && notify);

  /**
   * Local development with no Resend keys succeeds without sending, so the
   * form's success path and the page-turn can be exercised. Never in
   * production: a deployment missing its keys must fail loudly rather than
   * quietly tell people they're on a list they aren't on.
   *
   * MOCK_SIGNUP=1 forces it on for a local production build.
   */
  const mocking =
    process.env.MOCK_SIGNUP === "1" ||
    (!configured && process.env.NODE_ENV !== "production");

  if (mocking) {
    console.warn(
      `[subscribe] MOCK — nothing sent. Would have told ${notify ?? "NOTIFY_EMAIL (unset)"} about ${email}`,
    );
    // Stand in for the provider round-trip, so the submitting state lasts
    // about as long as it will in production.
    await new Promise((resolve) => setTimeout(resolve, 600));
    return NextResponse.json({ ok: true, mocked: true });
  }

  if (!apiKey || !from || !notify) {
    console.error("[subscribe] Resend env vars are not configured");
    return NextResponse.json(
      { ok: false, error: "Signups aren't open just yet. Please try again soon." },
      { status: 503 },
    );
  }

  const resend = new Resend(apiKey);

  try {
    // The studio notification is the one that must land — if it fails,
    // the signup is lost, so its result decides the response.
    const notification = await resend.emails.send({
      from,
      to: notify,
      replyTo: email,
      subject: `New waitlist signup — ${email}`,
      html: notificationEmail({ email, ip }),
      text: `New waitlist signup: ${email}\nIP: ${ip}\nAt: ${new Date().toISOString()}`,
    });

    if (notification.error) throw new Error(notification.error.message);

    // The subscriber confirmation is best-effort: a bounce here should
    // not tell someone their signup failed when it didn't.
    const confirmation = await resend.emails.send({
      from,
      to: email,
      subject: `You're on the list — ${site.name}`,
      html: confirmationEmail(),
      text: `Thank you. We'll be in touch to begin your story.\n\n${site.name} — ${site.tagline}\n${site.url}`,
    });

    if (confirmation.error) {
      console.error("[subscribe] confirmation failed:", confirmation.error);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    // Never surface the provider's message to the client.
    console.error("[subscribe] send failed:", error);
    return NextResponse.json(
      { ok: false, error: "We couldn't save that just now. Please try again." },
      { status: 502 },
    );
  }
}
