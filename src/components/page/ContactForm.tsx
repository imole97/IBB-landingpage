"use client";

import { useId, useState } from "react";
import { Field, SubmitButton, TextArea } from "@/components/ui/Field";
import { InstagramIcon } from "@/components/ui/InstagramIcon";
import { Label } from "@/components/ui/Label";
import { Rule } from "@/components/ui/Ornament";
import { site } from "@/lib/site";

type Status = "idle" | "submitting" | "done" | "error";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * The enquiry form: name, email, the space, and — optionally — how they
 * heard about the studio. It posts to /api/contact, which emails the studio and sends
 * the person a confirmation. Once sent, the form gives way to a thank-you.
 */
export function ContactForm() {
  const ids = {
    name: useId(),
    email: useId(),
    heard: useId(),
    message: useId(),
    status: useId(),
  };
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [field, setField] = useState<string | null>(null);

  const fail = (text: string, which: string | null = null) => {
    setStatus("error");
    setMessage(text);
    setField(which);
  };

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const values = {
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      message: String(data.get("message") ?? "").trim(),
      heard: String(data.get("heard") ?? "").trim(),
      // Honeypot — a real person never fills this.
      website: String(data.get("website") ?? ""),
    };

    // Mirror the server's validation so an obvious slip costs no round trip.
    if (!values.name) return fail("Please tell us your name.", "name");
    if (!EMAIL.test(values.email))
      return fail(
        "That address doesn't look right. Mind checking it?",
        "email",
      );
    if (values.message.length < 10)
      return fail(
        "Tell us a little about your space — a sentence or two.",
        "message",
      );

    setStatus("submitting");
    setMessage("");
    setField(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = (await res.json()) as {
        ok: boolean;
        error?: string;
        field?: string;
      };
      if (!res.ok || !body.ok) {
        return fail(
          body.error ?? "Something went wrong. Please try again.",
          body.field ?? null,
        );
      }
      setStatus("done");
    } catch {
      fail("We couldn't reach the studio. Please try again in a moment.");
    }
  }

  if (status === "done") {
    return (
      <div className="contact-thanks" role="status">
        <Label size="lg" className="mb-6">
          Message sent
        </Label>
        <p className="contact-thanks-title">Thank you.</p>
        <Rule align="start" className="my-7" />
        <p className="max-w-[26rem] text-[15px] leading-[1.8] text-ink-soft">
          We&rsquo;ll be in touch to begin your story. Until then, the work is
          on Instagram.
        </p>
        <a
          href={site.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2.5 text-[12px] tracking-[0.2em] text-ink uppercase transition-colors hover:text-label"
        >
          <InstagramIcon />
          {site.instagramHandle}
        </a>
      </div>
    );
  }

  const busy = status === "submitting";
  const invalid = (name: string) =>
    (status === "error" && field === name) || undefined;
  const clear = () => {
    if (status === "error") {
      setStatus("idle");
      setMessage("");
      setField(null);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="contact-form">
      <div className="contact-fields grid grid-cols-1">
        <div>
          <Label
            as="label"
            htmlFor={ids.name}
            size="sm"
            className="mb-2.5 block"
          >
            Your name
          </Label>
          <Field
            id={ids.name}
            name="name"
            autoComplete="name"
            placeholder="What should we call you?"
            maxLength={120}
            required
            disabled={busy}
            aria-invalid={invalid("name")}
            aria-describedby={field === "name" ? ids.status : undefined}
            onChange={clear}
          />
        </div>
        <div>
          <Label
            as="label"
            htmlFor={ids.email}
            size="sm"
            className="mb-2.5 block"
          >
            Your email
          </Label>
          <Field
            id={ids.email}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="We’ll get back to you within two working days."
            maxLength={254}
            required
            disabled={busy}
            aria-invalid={invalid("email")}
            aria-describedby={field === "email" ? ids.status : undefined}
            onChange={clear}
          />
        </div>
        <div>
          <Label
            as="label"
            htmlFor={ids.message}
            size="sm"
            className="mb-2.5 block"
          >
            Tell us about your space
          </Label>
          <TextArea
            id={ids.message}
            name="message"
            rows={3}
            placeholder="Where is it, what’s it for, and what’s the story so far?"
            maxLength={5000}
            required
            disabled={busy}
            aria-invalid={invalid("message")}
            aria-describedby={field === "message" ? ids.status : undefined}
            onChange={clear}
          />
        </div>
        <div>
          <Label
            as="label"
            htmlFor={ids.heard}
            size="sm"
            className="mb-2.5 block"
          >
            How did you hear about us?
          </Label>
          <Field
            id={ids.heard}
            name="heard"
            placeholder="Optional — just curious."
            maxLength={200}
            disabled={busy}
            aria-invalid={invalid("heard")}
            aria-describedby={field === "heard" ? ids.status : undefined}
            onChange={clear}
          />
        </div>
      </div>

      {/* Honeypot: off-screen, untabbable, never announced. */}
      <div
        aria-hidden
        className="absolute left-[-9999px] h-px w-px overflow-hidden"
      >
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      <SubmitButton type="submit" disabled={busy} className="contact-submit">
        {busy ? "Sending…" : "Send your story"}
        <span aria-hidden>&rarr;</span>
      </SubmitButton>

      <p
        id={ids.status}
        aria-live="polite"
        className="mt-4 min-h-[1.25rem] text-[13px] leading-relaxed text-label"
      >
        {message}
      </p>
    </form>
  );
}
