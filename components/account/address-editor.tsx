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
