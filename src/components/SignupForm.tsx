"use client";

import { useId, useState } from "react";
import { Field, SubmitButton } from "@/components/ui/Field";
import { Label } from "@/components/ui/Label";

type Status = "idle" | "submitting" | "done" | "error";

export function SignupForm() {
  const emailId = useId();
  const statusId = useId();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") ?? "").trim();

    // Mirror the server's validation so an obvious typo costs no round trip.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setStatus("error");
      setMessage("That address doesn't look right. Mind checking it?");
      return;
    }

    setStatus("submitting");
    setMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          // Honeypot — a real person never fills this.
          company: String(data.get("company") ?? ""),
        }),
      });
      const body = (await res.json()) as { ok: boolean; error?: string };

      if (!res.ok || !body.ok) {
        setStatus("error");
        setMessage(body.error ?? "Something went wrong. Please try again.");
        return;
      }

      setStatus("done");
      form.reset();
    } catch {
      setStatus("error");
      setMessage("We couldn't reach the studio. Please try again in a moment.");
    }
  }

  if (status === "done") {
    // Ports .form-success — 20px taupe, the prototype's own copy.
    return (
      <p
        role="status"
        className="max-w-[440px] text-[18px] leading-relaxed text-taupe sm:text-[20px]"
      >
        Thank you. We&rsquo;ll be in touch to begin your story.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-[440px]">
      <Label as="label" htmlFor={emailId} size="sm" className="mb-2.5 block">
        Email
      </Label>

      <Field
        id={emailId}
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="your@email.com"
        required
        disabled={status === "submitting"}
        aria-invalid={status === "error" || undefined}
        aria-describedby={message ? statusId : undefined}
        onChange={() => {
          if (status === "error") {
            setStatus("idle");
            setMessage("");
          }
        }}
      />

      {/* Honeypot: off-screen, untabbable, never announced. */}
      <div aria-hidden className="absolute left-[-9999px] h-px w-px overflow-hidden">
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      <SubmitButton type="submit" disabled={status === "submitting"} className="mt-7">
        {status === "submitting" ? "Sending…" : "Notify me"}
        <span aria-hidden>&rarr;</span>
      </SubmitButton>

      <p
        id={statusId}
        aria-live="polite"
        className="mt-4 min-h-[1.25rem] text-[13px] leading-relaxed text-taupe-light"
      >
        {message}
      </p>
    </form>
  );
}
