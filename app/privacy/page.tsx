import type { Metadata } from "next";
import Link from "next/link";
import {
  PolicyLayout,
  PolicySection,
  PolicyCallout,
} from "@/components/legal/policy-layout";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How ASAI.One Private Limited collects, uses, and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <PolicyLayout
      title="Privacy Policy"
      updated="May 4, 2026"
      intro="Welcome to ASAI.One. We respect your privacy and are committed to protecting your personal information. This policy explains what we collect, how we use it, and the choices you have."
    >
      <PolicySection title="1. Introduction">
        <p>
          Welcome to ASAI.One. We respect your privacy and are committed to
          protecting your personal information. This Privacy Policy describes how we
          collect, use, share, and safeguard your data when you visit our website or
          purchase our products.
        </p>
      </PolicySection>

      <PolicySection title="2. About Us">
        <p>
          ASAI.One Private Limited operates from Pune, India. We design, source, and
          sell utility products for commuters across different modes of transportation —
          including two-wheelers, cars, and public transport.
        </p>
        <p className="text-ink">
          ASAI.One Private Limited
          <br />
          370, Shivaji Nagar, Pune, Maharashtra, India – 411005
        </p>
      </PolicySection>

      <PolicySection title="3. Information We Collect">
        <p>We may collect the following categories of information:</p>
        <p className="text-ink">Personal information</p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Full name, email address, and phone number</li>
          <li>Shipping and billing address</li>
          <li>Payment details (processed securely via third-party providers)</li>
        </ul>
        <p className="text-ink">Non-personal information</p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Browser type, IP address, and device information</li>
          <li>Pages visited, time spent, and referring websites</li>
        </ul>
        <p className="text-ink">Order information</p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Products purchased, order history, and transaction details</li>
        </ul>
      </PolicySection>

      <PolicySection title="4. How We Use Your Information">
        <p>We use the information we collect to:</p>
        <ul className="ml-4 list-disc space-y-1">
          <li>
            Process and deliver your order, including managing payments, fees, and
            charges
          </li>
          <li>Manage our relationship with you and provide customer support</li>
          <li>Operate, maintain, and improve our website</li>
          <li>Personalise advertising and content</li>
          <li>
            Send promotional and marketing communications, which you can opt out of at
            any time
          </li>
        </ul>
      </PolicySection>

      <PolicySection title="5. Sharing of Information">
        <PolicyCallout>We do not sell your personal data.</PolicyCallout>
        <p>
          We may share information with trusted service providers who help us operate
          our business (such as payment, shipping, and logistics partners), and with
          legal or regulatory authorities where required by law.
        </p>
      </PolicySection>

      <PolicySection title="6. Payment Security">
        <p>
          All payment transactions are processed through secure gateway providers and
          are not stored or processed on our servers.
        </p>
      </PolicySection>

      <PolicySection title="7. Cookies & Tracking Technologies">
        <p>
          Cookies are files with a small amount of data which may include an anonymous
          unique identifier. We use cookies and similar technologies to operate the
          site, remember your preferences, and understand how it is used. You can
          instruct your browser to refuse cookies, though some features may not
          function properly without them.
        </p>
      </PolicySection>

      <PolicySection title="8. Data Retention">
        <p>
          We retain your personal data only for as long as necessary for the purposes
          of satisfying any legal, regulatory, tax, accounting, or reporting
          requirements.
        </p>
      </PolicySection>

      <PolicySection title="9. Your Rights">
        <p>
          You may request access to, correction of, or erasure of your personal data,
          or opt out of marketing communications, at any time. To exercise these
          rights, contact us at{" "}
          <a
            href="mailto:support@asai.one"
            className="text-navy-500 underline-offset-4 hover:underline"
          >
            support@asai.one
          </a>
          .
        </p>
      </PolicySection>

      <PolicySection title="10. Data Security">
        <p>
          We implement appropriate technical and organisational measures to protect
          your information. However, no online system is 100% secure, and we cannot
          guarantee absolute security.
        </p>
      </PolicySection>

      <PolicySection title="11. Third-Party Links">
        <p>
          Our website may contain links to third-party sites. We are not responsible
          for the privacy practices or content of those websites.
        </p>
      </PolicySection>

      <PolicySection title="12. Children's Privacy">
        <p>
          We do not knowingly collect personally identifiable information from anyone
          under the age of 18. If you believe a child has provided us with personal
          data, please contact us so we can remove it.
        </p>
      </PolicySection>

      <PolicySection title="13. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. Any changes will be
          posted on this page with a revised &ldquo;Last updated&rdquo; date.
        </p>
      </PolicySection>

      <PolicySection title="14. Contact Us">
        <p>
          For any questions about this Privacy Policy, email us at{" "}
          <a
            href="mailto:support@asai.one"
            className="text-navy-500 underline-offset-4 hover:underline"
          >
            support@asai.one
          </a>
          . You can also reach us through our{" "}
          <Link
            href="/contact"
            className="text-navy-500 underline-offset-4 hover:underline"
          >
            contact page
          </Link>
          .
        </p>
      </PolicySection>

      <PolicySection title="15. Consent">
        <p>
          By using our website, you hereby consent to our Privacy Policy and agree to
          its terms.
        </p>
      </PolicySection>
    </PolicyLayout>
  );
}
