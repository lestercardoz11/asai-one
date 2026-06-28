"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart/cart-context";
import { useCheckout, type ShippingInfo } from "@/lib/checkout/checkout-context";
import { getCheckoutDefaults } from "@/lib/checkout/order-actions";
import { Stepper } from "@/components/ui/stepper";
import { OrderSummary } from "@/components/cart/order-summary";
import { LabeledInput, Field, Select } from "@/components/ui/field";
import { Button, buttonVariants } from "@/components/ui/button";
import { ArrowRightIcon, MailIcon } from "@/components/icons";
import { CHECKOUT_STEPS } from "@/components/checkout/steps";

const STATES = [
  "Maharashtra", "Karnataka", "Delhi", "Tamil Nadu", "Telangana", "Gujarat",
  "West Bengal", "Rajasthan", "Uttar Pradesh", "Kerala", "Punjab", "Haryana",
];

type Errors = Partial<Record<keyof ShippingInfo, string>>;

const BLANK: ShippingInfo = {
  fullName: "", email: "", phone: "", line: "", city: "", state: "Maharashtra", pin: "",
};

export default function ShippingPage() {
  const router = useRouter();
  const { lines, ready } = useCart();
  const { shipping, saveAddress, setShipping, setSaveAddress } = useCheckout();

  // Two independent drafts: the buyer's own details (prefilled from their
  // account) and a one-off recipient when shipping to someone else.
  const [selfForm, setSelfForm] = useState<ShippingInfo>(shipping ?? BLANK);
  const [otherForm, setOtherForm] = useState<ShippingInfo>(BLANK);
  const [forSomeoneElse, setForSomeoneElse] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const prefilled = useRef(false);

  // Prefill the buyer's details from their account once, if they haven't already
  // entered shipping this session. Guests get null → blank form, no toggle.
  useEffect(() => {
    getCheckoutDefaults()
      .then((d) => {
        if (!d) return; // guest — no prefill, no toggle
        setLoggedIn(true);
        if (prefilled.current) return;
        prefilled.current = true;
        const accountForm: ShippingInfo = {
          fullName: d.fullName,
          email: d.email,
          phone: d.phone,
          line: d.line,
          city: d.city,
          state: d.state || "Maharashtra",
          pin: d.pin,
        };
        if (!shipping) {
          // First visit this session → prefill the buyer's own draft.
          setSelfForm(accountForm);
        } else if (!saveAddress) {
          // Returning after a "ship to someone else" submission: restore the
          // recipient into the other draft and keep the buyer's own prefilled.
          setForSomeoneElse(true);
          setOtherForm(shipping);
          setSelfForm(accountForm);
        }
        // else: returning from an own-order; selfForm already holds `shipping`.
      })
      .catch(() => {
        /* prefill is best-effort — leave the form blank on failure */
      });
  }, [shipping, saveAddress]);

  const form = forSomeoneElse ? otherForm : selfForm;
  const setActiveForm = forSomeoneElse ? setOtherForm : setSelfForm;

  const set = (k: keyof ShippingInfo) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => setActiveForm((f) => ({ ...f, [k]: e.target.value }));

  if (ready && lines.length === 0) return <EmptyGuard />;

  const validate = (): boolean => {
    const next: Errors = {};
    if (!form.fullName.trim()) next.fullName = "Required";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) next.email = "Enter a valid email";
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ""))) next.phone = "Enter a 10-digit phone";
    if (!form.line.trim()) next.line = "Required";
    if (!form.city.trim()) next.city = "Required";
    if (!/^\d{6}$/.test(form.pin)) next.pin = "Enter a 6-digit PIN";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setShipping(form);
    // Only persist the buyer's own address — never a one-off recipient's.
    setSaveAddress(loggedIn && !forSomeoneElse);
    router.push("/checkout/payment");
  };

  // Keep a saved state value selectable even if it isn't in the canned list.
  const stateOptions = STATES.includes(form.state) ? STATES : [form.state, ...STATES];

  return (
    <div>
      <Stepper steps={CHECKOUT_STEPS} current={0} className="mb-10 max-w-2xl" />
      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <form onSubmit={onSubmit} noValidate>
          <h1 className="type-display text-4xl text-navy-800 sm:text-5xl">Shipping</h1>

          {/* §11 — capturing contact early enables guest abandoned-cart reminders */}
          <p className="mt-2 inline-flex items-center gap-2 text-sm text-ink-60">
            <MailIcon className="h-4 w-4 text-navy-500" />
            We&apos;ll send order updates here — no spam.
          </p>

          {/* Logged-in buyers can ship to a different recipient without
              overwriting their own saved address. */}
          {loggedIn && (
            <label className="mt-6 flex cursor-pointer items-center gap-2.5 text-sm text-navy-800">
              <input
                type="checkbox"
                checked={forSomeoneElse}
                onChange={(e) => setForSomeoneElse(e.target.checked)}
                className="h-4 w-4 accent-navy-800"
              />
              Ship to someone else
            </label>
          )}

          <div className="mt-8 grid gap-5">
            <LabeledInput
              label="Full name" required value={form.fullName}
              onChange={set("fullName")} error={errors.fullName} autoComplete="name"
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <LabeledInput
                label="Email" type="email" inputMode="email" required value={form.email}
                onChange={set("email")} error={errors.email} autoComplete="email"
              />
              <LabeledInput
                label="Phone" type="tel" inputMode="tel" required value={form.phone}
                onChange={set("phone")} error={errors.phone} autoComplete="tel"
                hint="For delivery & WhatsApp updates"
              />
            </div>
            <LabeledInput
              label="Address" required value={form.line} onChange={set("line")}
              error={errors.line} autoComplete="street-address"
              placeholder="Flat / House no, building, street, area"
            />
            <div className="grid gap-5 sm:grid-cols-3">
              <LabeledInput
                label="City" required value={form.city} onChange={set("city")}
                error={errors.city} autoComplete="address-level2"
              />
              <Field label="State" htmlFor="state" required>
                <Select id="state" value={form.state} onChange={set("state")}>
                  {stateOptions.map((s) => <option key={s}>{s}</option>)}
                </Select>
              </Field>
              <LabeledInput
                label="PIN code" inputMode="numeric" required value={form.pin}
                onChange={set("pin")} error={errors.pin} autoComplete="postal-code" maxLength={6}
              />
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <Link href="/cart" className="type-condensed text-xs text-navy-500 hover:text-navy-800">
              ← Back to cart
            </Link>
            <Button type="submit" size="lg">
              Continue to Payment <ArrowRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </form>

        <div className="lg:sticky lg:top-28 lg:self-start">
          <OrderSummary />
        </div>
      </div>
    </div>
  );
}

function EmptyGuard() {
  return (
    <div className="mx-auto max-w-md border border-ink-12 bg-white px-8 py-16 text-center">
      <h1 className="type-display text-3xl text-navy-800">Your cart is empty</h1>
      <p className="mt-2 text-ink-60">Add something before checking out.</p>
      <Link href="/shop" className={buttonVariants({ size: "lg", className: "mt-6" })}>
        Go to Shop
      </Link>
    </div>
  );
}
