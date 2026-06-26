# Edit Account Details Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a signed-in user update their name, communication preferences, default delivery address, email, and phone — inline on the `/account` page.

**Architecture:** A new `lib/account/actions.ts` holds five Server Actions that validate input server-side and write via the user-scoped Supabase client (RLS owns the rows). The account page stays a server component; its read-only "Account details" panel becomes two client islands (`AccountDetails`, `AddressEditor`) that toggle inline between a read view and edit forms, reusing existing UI primitives.

**Tech Stack:** Next.js 16.2.7 (App Router, React 19), Supabase (`@supabase/ssr`), TypeScript, Tailwind v4.

## Global Constraints

- This repo runs a **modified Next.js 16.2.7** — read `node_modules/next/dist/docs/` before using unfamiliar APIs (see `AGENTS.md`).
- ESLint rule `react-hooks/set-state-in-effect` is an **error**: never call a `useState` setter synchronously inside `useEffect`. (All state changes in this plan happen in event handlers, not effects — keep it that way.)
- No automated test harness exists. Verification per task = `npx tsc --noEmit` (typecheck) + `pnpm lint`, plus manual browser checks on UI tasks. Do **not** add a test framework.
- Server Actions must validate authoritatively server-side and return generic messages — never echo raw Supabase auth errors (account-enumeration guard, matching `lib/auth/actions.ts`).
- Phone numbers normalise to E.164 (`+91` default for 10-digit Indian mobiles), matching `toE164` in `lib/auth/actions.ts` / `lib/checkout/order-actions.ts`.
- Commit message trailer for every commit: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

---

### Task 1: Server actions — profile + default address

**Files:**
- Create: `lib/account/actions.ts`

**Interfaces:**
- Consumes: `createClient` from `@/lib/supabase/server`, `getUser` from `@/lib/auth/user`.
- Produces:
  - `type AccountResult = { ok: boolean; message: string }`
  - `updateProfile(input: { fullName: string; marketingOptIn: boolean; whatsappOptIn: boolean }): Promise<AccountResult>`
  - `interface AddressInput { fullName: string; phone: string; line1: string; line2: string; city: string; state: string; pin: string }`
  - `updateDefaultAddress(input: AddressInput): Promise<AccountResult>`

- [ ] **Step 1: Create the file with profile + address actions**

Create `lib/account/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/user";

export type AccountResult = { ok: boolean; message: string };

/** Normalise a 10-digit Indian mobile (or a +E.164 number) to E.164. */
function toE164(phone: string): string | null {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+") && digits.length >= 7 && digits.length <= 15) {
    return `+${digits}`;
  }
  if (digits.length === 10) return `+91${digits}`;
  return null;
}

/** Log the real error server-side; hand the client a generic message. */
function actionError(context: string, error: unknown, message: string): AccountResult {
  console.error(`account:${context}`, error);
  return { ok: false, message };
}

export async function updateProfile(input: {
  fullName: string;
  marketingOptIn: boolean;
  whatsappOptIn: boolean;
}): Promise<AccountResult> {
  const name = input.fullName.trim();
  if (!name) return { ok: false, message: "Please enter your name." };
  if (name.length > 120) return { ok: false, message: "That name is too long." };

  const user = await getUser();
  if (!user) return { ok: false, message: "Please sign in again." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: name,
      marketing_opt_in: input.marketingOptIn,
      whatsapp_opt_in: input.whatsappOptIn,
    })
    .eq("id", user.id);
  if (error) {
    return actionError("update_profile", error, "Could not save your details. Please try again.");
  }

  revalidatePath("/account");
  return { ok: true, message: "Your details have been updated." };
}

export interface AddressInput {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pin: string;
}

function validateAddress(a: AddressInput): string | null {
  const required: [keyof AddressInput, number][] = [
    ["fullName", 120],
    ["line1", 200],
    ["city", 80],
    ["state", 80],
  ];
  for (const [key, max] of required) {
    const v = (a[key] ?? "").trim();
    if (!v) return "Please complete all required address fields.";
    if (v.length > max) return "One of the address fields is too long.";
  }
  if ((a.line2 ?? "").length > 200) return "One of the address fields is too long.";
  if (!toE164(a.phone)) return "Please enter a valid phone number.";
  if (!/^\d{4,10}$/.test(a.pin.trim())) return "Please enter a valid PIN code.";
  return null;
}

export async function updateDefaultAddress(input: AddressInput): Promise<AccountResult> {
  const validationError = validateAddress(input);
  if (validationError) return { ok: false, message: validationError };

  const user = await getUser();
  if (!user) return { ok: false, message: "Please sign in again." };

  const supabase = await createClient();
  const row = {
    user_id: user.id,
    full_name: input.fullName.trim(),
    phone: toE164(input.phone)!,
    line1: input.line1.trim(),
    line2: input.line2.trim() || null,
    city: input.city.trim(),
    state: input.state.trim(),
    postal_code: input.pin.trim(),
    country: "IN",
    is_default: true,
  };

  // Upsert the single default address: update the existing row if present,
  // otherwise insert. RLS (auth.uid() = user_id) scopes this to the caller.
  const { data: existing } = await supabase
    .from("addresses")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_default", true)
    .maybeSingle();

  const { error } = existing
    ? await supabase.from("addresses").update(row).eq("id", existing.id)
    : await supabase.from("addresses").insert(row);
  if (error) {
    return actionError("update_address", error, "Could not save your address. Please try again.");
  }

  revalidatePath("/account");
  return { ok: true, message: "Your default address has been saved." };
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors referencing `lib/account/actions.ts`.

- [ ] **Step 3: Lint**

Run: `npx eslint lib/account/actions.ts`
Expected: clean (no output).

- [ ] **Step 4: Commit**

```bash
git add lib/account/actions.ts
git commit -m "feat: account actions for profile and default address" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Server actions — email + phone change

**Files:**
- Modify: `lib/account/actions.ts`

**Interfaces:**
- Consumes: `clientIp`, `withinRateLimit` from `@/lib/security/rate-limit`; `toE164`, `actionError`, `EMAIL_RE`, `AccountResult` from Task 1 (same file); `createClient`.
- Produces:
  - `requestEmailChange(email: string): Promise<AccountResult>`
  - `requestPhoneChange(phone: string): Promise<AccountResult & { phone?: string }>`
  - `confirmPhoneChange(phone: string, token: string): Promise<AccountResult>`

- [ ] **Step 1: Add the rate-limit import**

At the top of `lib/account/actions.ts`, add below the existing imports:

```ts
import { clientIp, withinRateLimit } from "@/lib/security/rate-limit";
```

- [ ] **Step 2: Append the three auth-identity actions**

Append to the end of `lib/account/actions.ts` (the `EMAIL_RE` const sits with the other module-level helpers — place it just after the `toE164` declaration near the top, or directly above `requestEmailChange`):

```ts
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Begin an email change. Supabase emails a confirmation link to the new
 * address; the change only takes effect once the user clicks it. We therefore
 * do NOT touch profiles.email here — it reconciles out-of-band.
 */
export async function requestEmailChange(email: string): Promise<AccountResult> {
  const trimmed = email.trim();
  if (!EMAIL_RE.test(trimmed) || trimmed.length > 254) {
    return { ok: false, message: "Please enter a valid email address." };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ email: trimmed });
  if (error) {
    // Fail closed on provider/SMTP misconfiguration — generic message, no raw leak.
    return actionError("email_change", error, "Email change is temporarily unavailable. Please try again later.");
  }
  return { ok: true, message: "Check your inbox — we've sent a link to confirm your new email." };
}

/** Begin a phone change: send an OTP to the new number via Supabase. */
export async function requestPhoneChange(
  phone: string,
): Promise<AccountResult & { phone?: string }> {
  const e164 = toE164(phone);
  if (!e164) return { ok: false, message: "Enter a valid 10-digit number." };
  // Prevent SMS toll-fraud: 3 sends per number per hour + a per-IP cap.
  const ip = await clientIp();
  if (
    !(await withinRateLimit({ key: `phonechange:${e164}`, limit: 3, windowSeconds: 3600 })) ||
    !(await withinRateLimit({ key: `phonechange-ip:${ip}`, limit: 15, windowSeconds: 3600 }))
  ) {
    return { ok: false, message: "Too many code requests. Please wait before trying again." };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ phone: e164 });
  if (error) {
    return actionError("phone_change", error, "Phone verification is temporarily unavailable. Please try again later.");
  }
  return { ok: true, message: `OTP sent to ${e164}.`, phone: e164 };
}

/** Confirm a phone change with the OTP, then sync the profiles.phone copy. */
export async function confirmPhoneChange(phone: string, token: string): Promise<AccountResult> {
  const e164 = toE164(phone);
  if (!e164) return { ok: false, message: "Invalid phone number." };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    phone: e164,
    token: token.trim(),
    type: "phone_change",
  });
  if (error) {
    return actionError("phone_change_verify", error, "That code is invalid or expired.");
  }
  if (data.user) {
    await supabase.from("profiles").update({ phone: e164 }).eq("id", data.user.id);
  }
  revalidatePath("/account");
  return { ok: true, message: "Your phone number has been updated." };
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. (`verifyOtp` accepts `type: "phone_change"` — it is part of supabase-js's `MobileOtpType`.)

- [ ] **Step 4: Lint**

Run: `npx eslint lib/account/actions.ts`
Expected: clean — `EMAIL_RE`, `clientIp`, `withinRateLimit` are now all used.

- [ ] **Step 5: Commit**

```bash
git add lib/account/actions.ts
git commit -m "feat: account actions for email and phone change" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: AccountDetails client island (name, prefs, email, phone)

**Files:**
- Create: `components/account/account-details.tsx`

**Interfaces:**
- Consumes: `updateProfile`, `requestEmailChange`, `requestPhoneChange`, `confirmPhoneChange` from `@/lib/account/actions`; `Button` from `@/components/ui/button`; `LabeledInput` from `@/components/ui/field`; `toast` from `@/components/ui/toast`; `UserIcon`, `MailIcon`, `PhoneIcon` from `@/components/icons`.
- Produces:
  - `interface AccountDetailsData { fullName: string; email: string; phone: string; marketingOptIn: boolean; whatsappOptIn: boolean }`
  - `function AccountDetails({ initial }: { initial: AccountDetailsData }): React.ReactElement`

- [ ] **Step 1: Create the component file**

Create `components/account/account-details.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LabeledInput } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { UserIcon, MailIcon, PhoneIcon } from "@/components/icons";
import {
  updateProfile,
  requestEmailChange,
  requestPhoneChange,
  confirmPhoneChange,
} from "@/lib/account/actions";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9]{10}$/;

export interface AccountDetailsData {
  fullName: string;
  email: string;
  phone: string;
  marketingOptIn: boolean;
  whatsappOptIn: boolean;
}

type Section = "profile" | "email" | "phone" | null;

const checkboxClass =
  "mt-0.5 h-4 w-4 shrink-0 appearance-none border border-ink-12 bg-white " +
  "checked:border-navy-800 checked:bg-navy-800 focus:outline-none focus-visible:border-navy-500";

export function AccountDetails({ initial }: { initial: AccountDetailsData }) {
  const [data, setData] = useState(initial);
  const [section, setSection] = useState<Section>(null);

  return (
    <dl className="mt-4 flex flex-col gap-px border border-ink-12 bg-ink-12">
      {section === "profile" ? (
        <ProfileEditor
          initial={data}
          onCancel={() => setSection(null)}
          onSaved={(next) => {
            setData((d) => ({ ...d, ...next }));
            setSection(null);
          }}
        />
      ) : (
        <Row Icon={UserIcon} label="Name" value={data.fullName || "—"} onEdit={() => setSection("profile")}>
          <p className="mt-1 text-xs text-ink-30">
            {data.marketingOptIn ? "Marketing on" : "Marketing off"} ·{" "}
            {data.whatsappOptIn ? "WhatsApp on" : "WhatsApp off"}
          </p>
        </Row>
      )}

      {section === "email" ? (
        <EmailEditor current={data.email} onCancel={() => setSection(null)} onDone={() => setSection(null)} />
      ) : (
        <Row Icon={MailIcon} label="Email" value={data.email || "—"} onEdit={() => setSection("email")} />
      )}

      {section === "phone" ? (
        <PhoneEditor
          onCancel={() => setSection(null)}
          onSaved={(phone) => {
            setData((d) => ({ ...d, phone }));
            setSection(null);
          }}
        />
      ) : (
        <Row Icon={PhoneIcon} label="Phone" value={data.phone || "—"} onEdit={() => setSection("phone")} />
      )}
    </dl>
  );
}

type IconType = (p: { className?: string; "aria-hidden"?: boolean }) => React.ReactElement;

function Row({
  Icon,
  label,
  value,
  onEdit,
  children,
}: {
  Icon: IconType;
  label: string;
  value: string;
  onEdit: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 bg-white p-5">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-navy-500" aria-hidden />
        <div>
          <dt className="type-mono text-ink-30">{label}</dt>
          <dd className="mt-1 text-[15px] text-navy-800">{value}</dd>
          {children}
        </div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="type-mono text-[10px] text-navy-500 underline-offset-2 hover:text-navy-800 hover:underline"
      >
        Edit
      </button>
    </div>
  );
}

function ProfileEditor({
  initial,
  onCancel,
  onSaved,
}: {
  initial: AccountDetailsData;
  onCancel: () => void;
  onSaved: (next: Pick<AccountDetailsData, "fullName" | "marketingOptIn" | "whatsappOptIn">) => void;
}) {
  const [fullName, setFullName] = useState(initial.fullName);
  const [marketingOptIn, setMarketingOptIn] = useState(initial.marketingOptIn);
  const [whatsappOptIn, setWhatsappOptIn] = useState(initial.whatsappOptIn);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("Please enter your name");
      return;
    }
    setPending(true);
    const result = await updateProfile({ fullName, marketingOptIn, whatsappOptIn });
    setPending(false);
    if (result.ok) {
      toast({ title: "Saved", description: result.message, variant: "success" });
      onSaved({ fullName: fullName.trim(), marketingOptIn, whatsappOptIn });
    } else {
      setError(result.message);
      toast({ title: "Couldn't save", description: result.message, variant: "error" });
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4 bg-white p-5">
      <LabeledInput
        label="Name"
        autoComplete="name"
        required
        value={fullName}
        error={error}
        onChange={(e) => {
          setFullName(e.target.value);
          setError("");
        }}
      />
      <label className="flex cursor-pointer items-start gap-3 text-sm text-ink-60">
        <input type="checkbox" checked={marketingOptIn} onChange={(e) => setMarketingOptIn(e.target.checked)} className={checkboxClass} />
        Send me ride-ready drops &amp; offers
      </label>
      <label className="flex cursor-pointer items-start gap-3 text-sm text-ink-60">
        <input type="checkbox" checked={whatsappOptIn} onChange={(e) => setWhatsappOptIn(e.target.checked)} className={checkboxClass} />
        Send order &amp; reminder updates on WhatsApp
      </label>
      <div className="flex gap-3">
        <Button type="submit" size="md" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        <Button type="button" variant="secondary" size="md" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function EmailEditor({
  current,
  onCancel,
  onDone,
}: {
  current: string;
  onCancel: () => void;
  onDone: () => void;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="flex flex-col gap-3 bg-white p-5">
        <p className="text-sm text-navy-800">
          Check your inbox to confirm the change. Until you do, {current || "your current email"} stays active.
        </p>
        <Button type="button" variant="secondary" size="md" onClick={onDone}>
          Done
        </Button>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setError("Enter a valid email");
      return;
    }
    setPending(true);
    const result = await requestEmailChange(email);
    setPending(false);
    if (result.ok) {
      setSent(true);
      toast({ title: "Confirm your email", description: result.message, variant: "success" });
    } else {
      setError(result.message);
      toast({ title: "Couldn't update email", description: result.message, variant: "error" });
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4 bg-white p-5">
      <LabeledInput
        label="New email"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        hint={current ? `Current: ${current}` : undefined}
        value={email}
        error={error}
        onChange={(e) => {
          setEmail(e.target.value);
          setError("");
        }}
      />
      <div className="flex gap-3">
        <Button type="submit" size="md" disabled={pending}>
          {pending ? "Sending…" : "Send confirmation"}
        </Button>
        <Button type="button" variant="secondary" size="md" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function PhoneEditor({
  onCancel,
  onSaved,
}: {
  onCancel: () => void;
  onSaved: (phone: string) => void;
}) {
  const [phone, setPhone] = useState("");
  const [e164, setE164] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState<"input" | "otp">("input");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!PHONE_RE.test(phone.trim())) {
      setError("Enter a 10-digit number");
      return;
    }
    setPending(true);
    const result = await requestPhoneChange(phone);
    setPending(false);
    if (result.ok) {
      setE164(result.phone ?? phone);
      setOtp(["", "", "", "", "", ""]);
      setStep("otp");
      toast({ title: "OTP sent", description: result.message, variant: "success" });
    } else {
      setError(result.message);
      toast({ title: "Couldn't send code", description: result.message, variant: "error" });
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (otp.some((d) => d === "")) {
      setError("Enter all 6 digits");
      return;
    }
    setPending(true);
    const result = await confirmPhoneChange(e164, otp.join(""));
    setPending(false);
    if (result.ok) {
      toast({ title: "Phone updated", description: result.message, variant: "success" });
      onSaved(e164);
    } else {
      setError(result.message);
    }
  }

  function updateOtp(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    setOtp((prev) => {
      const copy = [...prev];
      copy[index] = digit;
      return copy;
    });
    setError("");
    if (digit) document.getElementById(`acc-otp-${index + 1}`)?.focus();
  }

  if (step === "otp") {
    return (
      <form onSubmit={verify} noValidate className="flex flex-col gap-4 bg-white p-5">
        <div className="flex flex-col gap-1.5">
          <span className="type-mono text-ink-60">Enter OTP</span>
          <div className="flex gap-2">
            {otp.map((digit, i) => (
              <input
                key={i}
                id={`acc-otp-${i}`}
                inputMode="numeric"
                maxLength={1}
                aria-label={`OTP digit ${i + 1}`}
                value={digit}
                onChange={(e) => updateOtp(i, e.target.value)}
                className="h-12 w-full border bg-white text-center text-lg text-ink transition-colors focus:border-navy-500 focus:outline-none"
              />
            ))}
          </div>
          {error && <p className="type-mono text-[10px] text-error">{error}</p>}
          <p className="text-xs text-ink-30">We sent a 6-digit code to {e164}.</p>
        </div>
        <div className="flex gap-3">
          <Button type="submit" size="md" disabled={pending}>
            {pending ? "Verifying…" : "Verify & save"}
          </Button>
          <Button type="button" variant="secondary" size="md" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={sendOtp} noValidate className="flex flex-col gap-4 bg-white p-5">
      <LabeledInput
        label="New phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        required
        placeholder="10-digit mobile number"
        value={phone}
        error={error}
        onChange={(e) => {
          setPhone(e.target.value);
          setError("");
        }}
      />
      <div className="flex gap-3">
        <Button type="submit" size="md" disabled={pending}>
          {pending ? "Sending…" : "Send OTP"}
        </Button>
        <Button type="button" variant="secondary" size="md" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors referencing `components/account/account-details.tsx`.

- [ ] **Step 3: Lint**

Run: `npx eslint components/account/account-details.tsx`
Expected: clean. In particular, no `react-hooks/set-state-in-effect` (this component uses no `useEffect`).

- [ ] **Step 4: Commit**

```bash
git add components/account/account-details.tsx
git commit -m "feat: inline account details editor (name, prefs, email, phone)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: AddressEditor client island (default address)

**Files:**
- Create: `components/account/address-editor.tsx`

**Interfaces:**
- Consumes: `updateDefaultAddress`, `AddressInput` from `@/lib/account/actions`; `Button` from `@/components/ui/button`; `LabeledInput`, `Field`, `Select` from `@/components/ui/field`; `toast` from `@/components/ui/toast`; `PinIcon` from `@/components/icons`.
- Produces:
  - `function AddressEditor({ initial, hasAddress }: { initial: AddressInput; hasAddress: boolean }): React.ReactElement`

- [ ] **Step 1: Create the component file**

Create `components/account/address-editor.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LabeledInput, Field, Select } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { PinIcon } from "@/components/icons";
import { updateDefaultAddress, type AddressInput } from "@/lib/account/actions";

// Mirrors the canned list on the checkout shipping form.
const STATES = [
  "Maharashtra", "Karnataka", "Delhi", "Tamil Nadu", "Telangana", "Gujarat",
  "West Bengal", "Rajasthan", "Uttar Pradesh", "Kerala", "Punjab", "Haryana",
];

type Errors = Partial<Record<keyof AddressInput, string>>;

export function AddressEditor({ initial, hasAddress }: { initial: AddressInput; hasAddress: boolean }) {
  const [saved, setSaved] = useState<AddressInput>(initial);
  const [present, setPresent] = useState(hasAddress);
  const [editing, setEditing] = useState(false);

  if (!editing) {
    const summary = [saved.line1, saved.line2, saved.city, saved.state, saved.pin]
      .filter(Boolean)
      .join(", ");
    return (
      <div className="mt-4 flex items-start justify-between gap-3 border border-ink-12 bg-white p-5">
        <div className="flex items-start gap-3">
          <PinIcon className="mt-0.5 h-5 w-5 shrink-0 text-navy-500" aria-hidden />
          <div>
            <p className="type-mono text-ink-30">Default address</p>
            <p className={`mt-1 text-[15px] ${present ? "text-navy-800" : "text-ink-30"}`}>
              {present ? summary : "Add a default delivery address"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="type-mono text-[10px] text-navy-500 underline-offset-2 hover:text-navy-800 hover:underline"
        >
          {present ? "Edit" : "Add"}
        </button>
      </div>
    );
  }

  return (
    <AddressForm
      initial={saved}
      onCancel={() => setEditing(false)}
      onSaved={(next) => {
        setSaved(next);
        setPresent(true);
        setEditing(false);
      }}
    />
  );
}

function AddressForm({
  initial,
  onCancel,
  onSaved,
}: {
  initial: AddressInput;
  onCancel: () => void;
  onSaved: (next: AddressInput) => void;
}) {
  const [form, setForm] = useState<AddressInput>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [pending, setPending] = useState(false);

  const set = (k: keyof AddressInput) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((p) => ({ ...p, [k]: "" }));
  };

  function validate(): boolean {
    const next: Errors = {};
    if (!form.fullName.trim()) next.fullName = "Required";
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ""))) next.phone = "Enter a 10-digit phone";
    if (!form.line1.trim()) next.line1 = "Required";
    if (!form.city.trim()) next.city = "Required";
    if (!/^\d{6}$/.test(form.pin)) next.pin = "Enter a 6-digit PIN";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setPending(true);
    const result = await updateDefaultAddress(form);
    setPending(false);
    if (result.ok) {
      toast({ title: "Address saved", description: result.message, variant: "success" });
      onSaved(form);
    } else {
      toast({ title: "Couldn't save address", description: result.message, variant: "error" });
    }
  }

  const stateOptions = STATES.includes(form.state) ? STATES : [form.state, ...STATES].filter(Boolean);

  return (
    <form onSubmit={onSubmit} noValidate className="mt-4 flex flex-col gap-5 border border-ink-12 bg-white p-5">
      <LabeledInput label="Full name" required value={form.fullName} onChange={set("fullName")} error={errors.fullName} autoComplete="name" />
      <LabeledInput label="Phone" type="tel" inputMode="tel" required value={form.phone} onChange={set("phone")} error={errors.phone} autoComplete="tel" />
      <LabeledInput
        label="Address" required value={form.line1} onChange={set("line1")} error={errors.line1}
        autoComplete="address-line1" placeholder="Flat / House no, building, street, area"
      />
      <LabeledInput label="Apartment, suite, etc. (optional)" value={form.line2} onChange={set("line2")} autoComplete="address-line2" />
      <div className="grid gap-5 sm:grid-cols-3">
        <LabeledInput label="City" required value={form.city} onChange={set("city")} error={errors.city} autoComplete="address-level2" />
        <Field label="State" htmlFor="addr-state" required>
          <Select id="addr-state" value={form.state} onChange={set("state")}>
            {stateOptions.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </Field>
        <LabeledInput label="PIN code" inputMode="numeric" required value={form.pin} onChange={set("pin")} error={errors.pin} autoComplete="postal-code" maxLength={6} />
      </div>
      <div className="flex gap-3">
        <Button type="submit" size="md" disabled={pending}>
          {pending ? "Saving…" : "Save address"}
        </Button>
        <Button type="button" variant="secondary" size="md" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
```

Note: the default `form.state` arrives from the page as `"Maharashtra"` when no address exists (Task 5 sets that fallback), so the `<Select>` always has a valid selection.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors referencing `components/account/address-editor.tsx`.

- [ ] **Step 3: Lint**

Run: `npx eslint components/account/address-editor.tsx`
Expected: clean (no `useEffect`, so no set-state-in-effect risk).

- [ ] **Step 4: Commit**

```bash
git add components/account/address-editor.tsx
git commit -m "feat: inline default-address editor" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Wire the islands into the account page

**Files:**
- Modify: `app/account/page.tsx`

**Interfaces:**
- Consumes: `AccountDetails`, `AccountDetailsData` from `@/components/account/account-details`; `AddressEditor` from `@/components/account/address-editor`; `AddressInput` from `@/lib/account/actions`.
- Produces: nothing for later tasks (terminal task).

- [ ] **Step 1: Update imports**

In `app/account/page.tsx`, below the existing component imports add:

```tsx
import { AccountDetails } from "@/components/account/account-details";
import { AddressEditor } from "@/components/account/address-editor";
import type { AddressInput } from "@/lib/account/actions";
```

The page no longer renders the local `Detail` helper or the `MailIcon`/`PhoneIcon`/`PinIcon` rows directly (the islands own those). Leave the existing `UserIcon` import (still used for the section headings). Remove `MailIcon`, `PhoneIcon`, `PinIcon` from the `@/components/icons` import line **only if** the editor components now own all their uses — verify nothing else in the file references them before deleting (the `Detail` helper is being removed in Step 3, which is their only other use).

- [ ] **Step 2: Widen the address query**

Replace the existing address query:

```tsx
  const { data: address } = await supabase
    .from("addresses")
    .select("line1, line2, city, state, postal_code")
    .eq("is_default", true)
    .maybeSingle();
```

with one that also pulls the name/phone the editor needs:

```tsx
  const { data: address } = await supabase
    .from("addresses")
    .select("full_name, phone, line1, line2, city, state, postal_code")
    .eq("is_default", true)
    .maybeSingle();

  const detailsData: AccountDetailsData = {
    fullName: profile.full_name ?? "",
    email: profile.email ?? "",
    phone: profile.phone ?? "",
    marketingOptIn: profile.marketing_opt_in ?? false,
    whatsappOptIn: profile.whatsapp_opt_in ?? false,
  };

  const addressForm: AddressInput = {
    fullName: address?.full_name ?? profile.full_name ?? "",
    phone: address?.phone ?? profile.phone ?? "",
    line1: address?.line1 ?? "",
    line2: address?.line2 ?? "",
    city: address?.city ?? "",
    state: address?.state || "Maharashtra",
    pin: address?.postal_code ?? "",
  };
```

Add the import for the type at the top:

```tsx
import type { AccountDetailsData } from "@/components/account/account-details";
```

- [ ] **Step 3: Replace the read-only details panel**

Replace the entire `{/* Account details */}` `<section>` block (the one containing the `<dl>` with the four `Detail` rows) with:

```tsx
          {/* Account details */}
          <section aria-labelledby="details-heading">
            <div className="flex items-center gap-3">
              <UserIcon className="h-5 w-5 text-navy-500" aria-hidden />
              <h2 id="details-heading" className="type-condensed text-sm text-navy-800">
                Account details
              </h2>
            </div>

            <AccountDetails initial={detailsData} />
            <AddressEditor initial={addressForm} hasAddress={!!address} />
          </section>
```

- [ ] **Step 4: Delete the now-unused `Detail` helper**

Remove the `function Detail({ ... }) { ... }` declaration at the bottom of `app/account/page.tsx` (it has no remaining callers).

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. If `MailIcon`/`PhoneIcon`/`PinIcon` are reported unused, remove them from the icons import line.

- [ ] **Step 6: Lint**

Run: `npx eslint app/account/page.tsx`
Expected: clean.

- [ ] **Step 7: Manual verification in the browser**

Run: `pnpm dev`, sign in, visit `/account`. Confirm:
1. **Name + prefs**: click Edit on Name → change name, toggle the checkboxes → Save → toast appears, row reflects the new name and the "Marketing/WhatsApp on/off" line updates. Reload — values persist.
2. **Default address**: click Edit/Add → fill the form → Save address → toast, summary updates. Reload — persists. (Insert path when you had no address; update path when you did.)
3. **Email**: click Edit on Email → enter a new email → Send confirmation → "check your inbox" note shows; the displayed email does NOT change. (If SMTP is unconfigured, you instead get the generic "temporarily unavailable" toast — that is the expected graceful fallback.)
4. **Phone**: click Edit on Phone → enter a 10-digit number → Send OTP. With SMS configured, the 6-digit step appears and a correct code updates the phone. With SMS unconfigured, expect the "Phone verification is temporarily unavailable" message.

- [ ] **Step 8: Commit**

```bash
git add app/account/page.tsx
git commit -m "feat: enable inline detail editing on the account page" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Notes for the implementer

- **profiles.email is never written here.** Email changes flow through Supabase's confirmation link; the page keeps showing the confirmed email. Do not try to optimistically update it.
- **profiles.phone IS synced** inside `confirmPhoneChange` after a successful OTP verify.
- The `addresses` upsert is user-scoped (RLS), unlike the service-role path in `lib/checkout/order-actions.ts` — a signed-in user may write only their own rows, which is exactly what we want.
- If `verifyOtp({ type: "phone_change" })` fails to typecheck, confirm the installed `@supabase/supabase-js` version (`2.108.2`) exposes `phone_change` in `MobileOtpType`; it does.
