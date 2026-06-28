"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LabeledInput } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { UserIcon, MailIcon, PhoneIcon, LockIcon } from "@/components/icons";
import {
  updateProfile,
  requestEmailChange,
  updatePhone,
  changePassword,
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

type Section = "profile" | "email" | "phone" | "password" | null;

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
          current={data.phone}
          onCancel={() => setSection(null)}
          onSaved={(phone) => {
            setData((d) => ({ ...d, phone }));
            setSection(null);
          }}
        />
      ) : (
        <Row Icon={PhoneIcon} label="Phone" value={data.phone || "—"} onEdit={() => setSection("phone")} />
      )}

      {section === "password" ? (
        <PasswordEditor onCancel={() => setSection(null)} onSaved={() => setSection(null)} />
      ) : (
        <Row Icon={LockIcon} label="Password" value="••••••••" onEdit={() => setSection("password")} />
      )}
    </dl>
  );
}

function PasswordEditor({
  onCancel,
  onSaved,
}: {
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!current) errs.current = "Enter your current password";
    if (next.length < 8) errs.next = "Use at least 8 characters";
    if (confirm !== next) errs.confirm = "Passwords don't match";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setPending(true);
    const result = await changePassword({ currentPassword: current, newPassword: next });
    setPending(false);
    if (result.ok) {
      toast({ title: "Password updated", description: result.message, variant: "success" });
      onSaved();
    } else {
      setErrors({ current: result.message });
      toast({ title: "Couldn't update", description: result.message, variant: "error" });
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4 bg-white p-5">
      <LabeledInput
        label="Current password"
        type="password"
        autoComplete="current-password"
        required
        value={current}
        error={errors.current}
        onChange={(e) => {
          setCurrent(e.target.value);
          setErrors((p) => ({ ...p, current: "" }));
        }}
      />
      <LabeledInput
        label="New password"
        type="password"
        autoComplete="new-password"
        required
        hint="At least 8 characters."
        value={next}
        error={errors.next}
        onChange={(e) => {
          setNext(e.target.value);
          setErrors((p) => ({ ...p, next: "" }));
        }}
      />
      <LabeledInput
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        required
        value={confirm}
        error={errors.confirm}
        onChange={(e) => {
          setConfirm(e.target.value);
          setErrors((p) => ({ ...p, confirm: "" }));
        }}
      />
      <div className="flex gap-3">
        <Button type="submit" size="md" disabled={pending}>
          {pending ? "Saving…" : "Update password"}
        </Button>
        <Button type="button" variant="secondary" size="md" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
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
  current,
  onCancel,
  onSaved,
}: {
  current: string;
  onCancel: () => void;
  onSaved: (phone: string) => void;
}) {
  const [phone, setPhone] = useState(current);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = phone.trim();
    // Accept a 10-digit number or a +E.164 number; empty clears it.
    if (v && !PHONE_RE.test(v) && !/^\+\d{10,15}$/.test(v)) {
      setError("Enter a 10-digit number");
      return;
    }
    setPending(true);
    const result = await updatePhone(phone);
    setPending(false);
    if (result.ok) {
      toast({ title: "Saved", description: result.message, variant: "success" });
      onSaved(result.phone ?? "");
    } else {
      setError(result.message);
      toast({ title: "Couldn't save", description: result.message, variant: "error" });
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4 bg-white p-5">
      <LabeledInput
        label="Phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="10-digit mobile number"
        hint="Used for delivery updates. Leave blank to remove."
        value={phone}
        error={error}
        onChange={(e) => {
          setPhone(e.target.value);
          setError("");
        }}
      />
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
