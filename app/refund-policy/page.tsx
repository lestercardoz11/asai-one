import type { Metadata } from "next";
import Link from "next/link";
import {
  PolicyLayout,
  PolicySection,
  PolicyCallout,
} from "@/components/legal/policy-layout";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "ASAI.One's returns, refunds, and cancellation terms — eligibility, condition requirements, and refund timelines.",
};

export default function RefundPolicyPage() {
  return (
    <PolicyLayout
      title="Refund Policy"
      updated="May 9, 2026"
      intro="We want you to be happy with your ASAI.One order. This policy explains when returns are accepted, the condition items must be in, how refunds are processed, and how to cancel an order."
    >
      <PolicySection title="1. Return Eligibility">
        <PolicyCallout>
          Refund eligibility varies by product. Customers are advised to review the
          specific product page for detailed return and refund information before
          making a purchase.
        </PolicyCallout>
        <p>
          Items must be unused, in their original packaging, and in resalable
          condition to be eligible for a return.
        </p>
        <p>
          Each product page clearly displays whether the item is{" "}
          <strong className="font-semibold text-navy-800">Returnable</strong> or{" "}
          <strong className="font-semibold text-navy-800">Non-Returnable</strong> —
          please check the return badge before ordering. Where a product page states a
          return policy, that product-specific policy takes precedence over this general
          policy. Items that arrive damaged or defective are always eligible; contact us
          right away.
        </p>
      </PolicySection>

      <PolicySection title="2. How to Start a Return">
        <p>
          To begin a return, email{" "}
          <a
            href="mailto:support@asai.one"
            className="text-navy-500 underline-offset-4 hover:underline"
          >
            support@asai.one
          </a>{" "}
          with your order ID and the reason for the return. Our team will confirm
          eligibility and share the next steps.
        </p>
      </PolicySection>

      <PolicySection title="3. Refunds">
        <p>
          Once your return is received and inspected, approved refunds are processed
          within 5–10 business days to your original payment method. Depending on your
          bank or payment provider, it may take a few additional days for the credit to
          appear.
        </p>
      </PolicySection>

      <PolicySection title="4. Cancellations">
        <p>
          Orders may be cancelled before dispatch by contacting our support team. Once
          an order has shipped it can no longer be cancelled — you may initiate a return
          instead, where the item is eligible.
        </p>
      </PolicySection>

      <PolicySection title="5. Questions">
        <p>
          For anything to do with returns, refunds, or cancellations, reach us at{" "}
          <a
            href="mailto:support@asai.one"
            className="text-navy-500 underline-offset-4 hover:underline"
          >
            support@asai.one
          </a>{" "}
          or through our{" "}
          <Link
            href="/contact"
            className="text-navy-500 underline-offset-4 hover:underline"
          >
            contact page
          </Link>
          .
        </p>
      </PolicySection>
    </PolicyLayout>
  );
}
