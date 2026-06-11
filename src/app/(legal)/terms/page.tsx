import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms for using the BookKit social reading platform.",
};

export default function TermsOfServicePage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1>Terms of Service</h1>
      <p className="lead text-muted-foreground">
        Last updated: 10 June 2026
      </p>

      <p>
        By creating an account or using BookKit, you agree to these terms. If
        you do not agree, do not use the service.
      </p>

      <h2>The service</h2>
      <p>
        BookKit lets you discover books, track reading progress, and connect with
        other readers. Book PDFs are provided for in-app reading only unless
        otherwise stated by the rights holder.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>You must provide accurate registration information.</li>
        <li>You are responsible for keeping your password secure.</li>
        <li>You must be at least 16 years old to use BookKit.</li>
        <li>One person per account — do not share credentials.</li>
      </ul>

      <h2>Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Redistribute, scrape, or publicly share PDFs from BookKit</li>
        <li>Harass, threaten, or impersonate others</li>
        <li>Post illegal, infringing, or malicious content</li>
        <li>Spam, automate abusive actions, or attempt to bypass security</li>
        <li>Probe or disrupt the platform or other users&apos; accounts</li>
      </ul>

      <h2>Content you post</h2>
      <p>
        You retain ownership of content you create. You grant BookKit a
        non-exclusive licence to host, display, and distribute that content
        within the service so features like the feed and profiles work. You are
        responsible for what you post.
      </p>

      <h2>Moderation</h2>
      <p>
        We may remove content, suspend accounts, or block users who violate
        these terms or receive valid reports. Users can report posts and profiles
        from within the app.
      </p>

      <h2>Availability</h2>
      <p>
        BookKit is provided &quot;as is&quot;. We may change features, perform
        maintenance, or discontinue parts of the service. We aim for reliability
        but do not guarantee uninterrupted access.
      </p>

      <h2>Privacy</h2>
      <p>
        Our use of personal data is described in the{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>Termination</h2>
      <p>
        You may delete your account at any time from Privacy settings. We may
        terminate or suspend access for violations of these terms.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. Material changes will be reflected on this
        page with an updated date. Continued use after changes constitutes
        acceptance.
      </p>
    </article>
  );
}
