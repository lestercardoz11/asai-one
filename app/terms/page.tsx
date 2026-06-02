import type { Metadata } from "next";
import Link from "next/link";
import {
  PolicyLayout,
  PolicySection,
  PolicyCallout,
} from "@/components/legal/policy-layout";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "The terms governing your use of the ASAI.One website and the purchase of ASAI.One products.",
};

export default function TermsPage() {
  return (
    <PolicyLayout
      title="Terms & Conditions"
      updated="May 9, 2026"
      intro="These Terms & Conditions govern your use of the ASAI.One website and your purchase of our products. By accessing this site or placing an order, you agree to be bound by them."
    >
      <PolicySection title="1. Agreement to Terms">
        <p>
          By using this website and our services, you accept these Terms &amp;
          Conditions and all applicable laws and regulations. If you do not agree with
          any part of these terms, you may not use the site.
        </p>
      </PolicySection>

      <PolicySection title="2. Use License">
        <p>
          You may temporarily download materials from our website for personal,
          non-commercial viewing only. You may not modify or copy the materials,
          reverse-engineer any software, remove any copyright or proprietary notices,
          or transfer the materials to another person or &ldquo;mirror&rdquo; them on
          any other server.
        </p>
      </PolicySection>

      <PolicySection title="3. Disclaimer">
        <p>
          The materials on our website are provided &ldquo;as is.&rdquo; ASAI.One makes
          no warranties, expressed or implied, and disclaims all other warranties
          including, without limitation, implied warranties of merchantability, fitness
          for a particular purpose, or non-infringement of intellectual property.
        </p>
      </PolicySection>

      <PolicySection title="4. Limitations of Liability">
        <p>
          ASAI.One shall not be held liable for any damages — including loss of data or
          profit, or business interruption — arising out of the use of, or inability to
          use, our website, even if we have been notified of the possibility of such
          damage.
        </p>
      </PolicySection>

      <PolicySection title="5. Governing Law">
        <p>
          These terms are governed by and construed in accordance with the laws of
          India, and you irrevocably submit to the exclusive jurisdiction of the courts
          of Pune, Maharashtra.
        </p>
      </PolicySection>

      <PolicySection title="6. Pricing & Payments">
        <p>
          All prices are displayed in Indian Rupees (INR) with applicable GST clearly
          indicated. We reserve the right to change prices at any time without prior
          notice.
        </p>
      </PolicySection>

      <PolicySection title="7. Products & Description">
        <p>
          We strive to describe our products as accurately as possible, but minor
          variations in colour, finish, or specification may occur. Unless explicitly
          stated, our products are not certified safety equipment and should be used
          with appropriate judgement.
        </p>
      </PolicySection>

      <PolicySection title="8. Intellectual Property">
        <p>
          All logos, brand names, text, images, and graphics on this website are the
          property of ASAI.One and may not be used without our prior written permission.
        </p>
      </PolicySection>

      <PolicySection title="9. Shipping & Delivery">
        <p>
          Orders are processed within 1–3 business days, and delivery typically takes
          3–7 business days across India. Shipping costs, where applicable, are shown at
          checkout. We are not liable for delays caused by weather, courier, or other
          logistics disruptions, and customers are responsible for providing an accurate
          delivery address. See our{" "}
          <Link
            href="/shipping-policy"
            className="text-navy-500 underline-offset-4 hover:underline"
          >
            Shipping Policy
          </Link>{" "}
          for full details.
        </p>
      </PolicySection>

      <PolicySection title="10. Refund, Return & Cancellation">
        <PolicyCallout>
          Returns are accepted only for items that are unused, in their original
          packaging, and in resalable condition.
        </PolicyCallout>
        <p>
          Approved refunds are processed within 5–10 business days to your original
          payment method. Full details are set out in our{" "}
          <Link
            href="/refund-policy"
            className="text-navy-500 underline-offset-4 hover:underline"
          >
            Refund Policy
          </Link>
          .
        </p>
      </PolicySection>

      <PolicySection title="11. Cancellations">
        <p>
          Orders may be cancelled before dispatch by contacting our support team. Once
          an order has shipped it cannot be cancelled; you may initiate a return instead
          where eligible.
        </p>
      </PolicySection>

      <PolicySection title="12. Changes to These Terms">
        <p>
          ASAI.One may revise these Terms &amp; Conditions at any time. Changes take
          effect as soon as they are posted on this page.
        </p>
      </PolicySection>

      <PolicySection title="13. Contact Information">
        <p className="text-ink">
          ASAI.One Private Limited
          <br />
          370, Shivaji Nagar, Pune, Maharashtra 411005
          <br />
          <a
            href="mailto:support@asai.one"
            className="text-navy-500 underline-offset-4 hover:underline"
          >
            support@asai.one
          </a>
        </p>
      </PolicySection>
    </PolicyLayout>
  );
}
