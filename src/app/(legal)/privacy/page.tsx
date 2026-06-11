import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How BookKit collects, uses, and protects your personal data.",
};

export default function PrivacyPolicyPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1>Privacy Policy</h1>
      <p className="lead text-muted-foreground">
        Last updated: 10 June 2026
      </p>

      <p>
        BookKit (&quot;we&quot;, &quot;us&quot;) is a social reading platform. This policy
        explains what personal data we process, why we process it, and your
        rights under GDPR and UK GDPR.
      </p>

      <h2>Data we collect</h2>
      <ul>
        <li>
          <strong>Account data:</strong> email, name, username, optional phone
          number, password (stored as a secure hash), profile bio, genre
          preferences, and avatar.
        </li>
        <li>
          <strong>Reading activity:</strong> books on your shelf, ratings,
          reviews, reading progress, and showcase selections.
        </li>
        <li>
          <strong>Social data:</strong> posts, comments, likes, follows, blocks,
          and reports you submit.
        </li>
        <li>
          <strong>Technical data:</strong> session cookies required for
          authentication and security logs (e.g. IP address on sign-in and API
          requests for abuse prevention).
        </li>
      </ul>

      <h2>How we use your data</h2>
      <ul>
        <li>Provide and secure your account</li>
        <li>Sync your bookshelf and reading progress across devices</li>
        <li>Power social features such as the feed, profiles, and recommendations</li>
        <li>Respond to support requests and enforce our terms</li>
        <li>Detect spam, abuse, and security incidents</li>
      </ul>

      <h2>Legal bases (GDPR)</h2>
      <ul>
        <li>
          <strong>Contract:</strong> processing needed to deliver the service you
          signed up for.
        </li>
        <li>
          <strong>Legitimate interests:</strong> security, fraud prevention, and
          improving the product — balanced against your rights.
        </li>
        <li>
          <strong>Consent:</strong> where required for optional communications
          (we do not send marketing emails without opt-in).
        </li>
      </ul>

      <h2>Cookies</h2>
      <p>
        We use essential session cookies only (via Auth.js) to keep you signed
        in. We do not use advertising or third-party tracking cookies.
      </p>

      <h2>Data sharing</h2>
      <p>
        We use infrastructure providers (hosting, database, file storage) to run
        BookKit. They process data on our behalf under data-processing
        agreements. We do not sell your personal data.
      </p>

      <h2>Retention</h2>
      <p>
        We keep your data while your account is active. When you delete your
        account, we remove your profile and associated user-generated content
        from our primary database. Backups may retain data for a limited period
        before automatic expiry.
      </p>

      <h2>Your rights</h2>
      <p>You may:</p>
      <ul>
        <li>Access and download your data</li>
        <li>Correct inaccurate profile information in Settings</li>
        <li>Delete your account and associated data</li>
        <li>Object to or restrict certain processing</li>
        <li>Lodge a complaint with your local data protection authority</li>
      </ul>
      <p>
        Signed-in users can export or delete their account from{" "}
        <Link href="/settings/privacy">Privacy settings</Link>.
      </p>

      <h2>Children</h2>
      <p>
        BookKit is not directed at children under 16. If you believe a child has
        provided us personal data, contact us so we can delete it.
      </p>

      <h2>Contact</h2>
      <p>
        For privacy requests, email the project maintainer at the address listed
        on your BookKit deployment or open an issue in the project repository.
      </p>
    </article>
  );
}
