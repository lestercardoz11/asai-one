import type { Metadata } from "next";
import Link from "next/link";
import {
  PolicyLayout,
  PolicySection,
  PolicyCallout,
} from "@/components/legal/policy-layout";

export const metadata: Metadata = {
  title: "Shipping Policy",
  description:
    "How ASAI.One processes, ships, and delivers orders across India — timelines, costs, and address requirements.",
};

export default function ShippingPolicyPage() {
  return (
    <PolicyLayout
      title="Shipping Policy"
      updated="May 9, 2026"
      intro="We ship ASAI.One orders across India from Pune, Maharashtra. This policy covers how long orders take to process and arrive, shipping costs, and what we need from you for a smooth delivery."
    >
      <PolicySection title="1. Order Processing">
        <p>
          Orders are processed within 1–3 business days of being placed. You&apos;ll
          receive a confirmation once your order is on its way. Orders placed on
          weekends or public holidays begin processing on the next business day.
        </p>
      </PolicySection>

      <PolicySection title="2. Delivery Timelines">
        <p>
          Delivery typically takes 3–7 business days across India after dispatch, with
          exact timelines depending on your location and the courier serving it.
        </p>
      </PolicySection>

      <PolicySection title="3. Shipping Costs">
        <p>
          Shipping costs, where applicable, are calculated and shown clearly at checkout
          before you pay. Any promotional shipping offers will be applied automatically
          to eligible orders.
        </p>
      </PolicySection>

      <PolicySection title="4. Delays Outside Our Control">
        <PolicyCallout>
          ASAI.One is not liable for delivery delays caused by weather, courier, or
          other logistics disruptions.
        </PolicyCallout>
        <p>
          We dispatch promptly and track every order, but once a parcel is with the
          courier some factors are outside our control. We&apos;ll always help you
          follow up on a delayed shipment.
        </p>
      </PolicySection>

      <PolicySection title="5. Accurate Delivery Information">
        <p>
          Please make sure your shipping address and contact details are complete and
          accurate at checkout. ASAI.One is not responsible for orders delayed or
          returned due to an incorrect or incomplete address.
        </p>
      </PolicySection>

      <PolicySection title="6. Order Tracking & Support">
        <p>
          If you have a question about a shipment, email us at{" "}
          <a
            href="mailto:support@asai.one"
            className="text-navy-500 underline-offset-4 hover:underline"
          >
            support@asai.one
          </a>{" "}
          or visit our{" "}
          <Link
            href="/contact"
            className="text-navy-500 underline-offset-4 hover:underline"
          >
            contact page
          </Link>{" "}
          and we&apos;ll help you track it down.
        </p>
      </PolicySection>
    </PolicyLayout>
  );
}
