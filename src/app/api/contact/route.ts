import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { site } from "@/lib/site";
import { confirmationEmail, notificationEmail } from "@/lib/emails";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email().max(254),
  message: z.string().trim().min(10).max(5000),
  /** "How did you hear about us?" — optional. */
  heard: z.string().trim().max(200).optional(),
  /** Honeypot — must stay empty. */
  website: z.string().max(200).optional(),
});

/** What to say about each field that fails — in the form's own voice. */
const FIELD_ERRORS: Record<string, string> = {
  name: "Please tell us your name — 120 characters at most.",
  email: "That address doesn't look right. Mind checking it?",
  message: "Tell us a little about your space — between a sentence and 5,000 characters.",
  heard: "That's a little long — 200 characters at most.",
};

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
    // Say which field is wrong, so the form can point at it.
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    return NextResponse.json(
      { ok: false, field, error: FIELD_ERRORS[field] ?? "Please check the form and try again." },
      { status: 400 },
    );
  }

  const { name, email, message, website } = parsed.data;
  const heard = parsed.data.heard || undefined;

  // Honeypot tripped: look successful, do nothing.
  if (website) return NextResponse.json({ ok: true });

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
   * form's success path can be exercised. Never in production: a
   * deployment missing its keys must fail loudly rather than quietly tell
   * people their message arrived when it didn't.
   *
   * MOCK_CONTACT=1 forces it on for a local production build.
   */
  const mocking =
    process.env.MOCK_CONTACT === "1" ||
    (!configured && process.env.NODE_ENV !== "production");

  if (mocking) {
    console.warn(
      `[contact] MOCK — nothing sent. Would have told ${notify ?? "NOTIFY_EMAIL (unset)"} about a message from ${name} <${email}>`,
    );
    // Stand in for the provider round-trip, so the sending state lasts
    // about as long as it will in production.
    await new Promise((resolve) => setTimeout(resolve, 600));
    return NextResponse.json({ ok: true, mocked: true });
  }

  if (!apiKey || !from || !notify) {
    console.error("[contact] Resend env vars are not configured");
    return NextResponse.json(
      { ok: false, error: `Messages aren't reaching us just now. Please email ${site.email}.` },
      { status: 503 },
    );
  }

  const resend = new Resend(apiKey);

  try {
    // The studio's copy is the one that must land — if it fails, the
    // message is lost, so its result decides the response.
    const notification = await resend.emails.send({
      from,
      to: notify,
      replyTo: email,
      ...notificationEmail({ name, email, message, heard }),
    });

    if (notification.error) throw new Error(notification.error.message);

    // The confirmation is best-effort: a bounce here should not tell
    // someone their message failed when it didn't.
    const confirmation = await resend.emails.send({
      from,
      to: email,
      replyTo: site.email,
      ...confirmationEmail({ name, message }),
    });

    if (confirmation.error) {
      console.error("[contact] confirmation failed:", confirmation.error);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    // Never surface the provider's message to the client.
    console.error("[contact] send failed:", error);
    return NextResponse.json(
      { ok: false, error: "We couldn't send that just now. Please try again." },
      { status: 502 },
    );
  }
}
