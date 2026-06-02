"use client";

import { useState, type FormEvent } from "react";
import { LabeledInput, Field, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

interface Values {
  name: string;
  email: string;
  subject: string;
  message: string;
}

type Errors = Partial<Record<keyof Values, string>>;

const EMPTY: Values = { name: "", email: "", subject: "", message: "" };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values: Values): Errors {
  const errors: Errors = {};
  if (!values.name.trim()) errors.name = "Please enter your name";
  if (!values.email.trim()) errors.email = "Please enter your email";
  else if (!EMAIL_RE.test(values.email.trim())) errors.email = "Enter a valid email";
  if (!values.subject.trim()) errors.subject = "Please add a subject";
  if (!values.message.trim()) errors.message = "Please write a message";
  return errors;
}

export function ContactForm() {
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});

  function update<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next = validate(values);
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    // Phase 2 mock: no real send.
    toast({
      title: "Message sent",
      description: "Thanks — we'll get back to you shortly.",
      variant: "success",
    });
    setValues(EMPTY);
    setErrors({});
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="border border-ink-12 bg-white p-6 sm:p-8"
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <LabeledInput
          label="Name"
          required
          autoComplete="name"
          value={values.name}
          error={errors.name}
          onChange={(e) => update("name", e.target.value)}
        />
        <LabeledInput
          label="Email"
          type="email"
          inputMode="email"
          required
          autoComplete="email"
          value={values.email}
          error={errors.email}
          onChange={(e) => update("email", e.target.value)}
        />
      </div>

      <div className="mt-5">
        <LabeledInput
          label="Subject"
          required
          value={values.subject}
          error={errors.subject}
          onChange={(e) => update("subject", e.target.value)}
        />
      </div>

      <div className="mt-5">
        <Field label="Message" htmlFor="contact-message" error={errors.message} required>
          <Textarea
            id="contact-message"
            required
            rows={6}
            value={values.message}
            aria-invalid={errors.message ? true : undefined}
            onChange={(e) => update("message", e.target.value)}
            placeholder="Tell us what's on your mind…"
          />
        </Field>
      </div>

      <Button type="submit" size="lg" full className="mt-7">
        Send message
      </Button>
    </form>
  );
}
