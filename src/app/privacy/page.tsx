import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "TapSafe privacy policy covering data collection, cookies, and third-party services.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
      </p>

      <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
        <p>
          TapSafe (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates
          the tapsafe.org website. This Privacy Policy explains what information
          we collect, how we use it, and your choices regarding that information.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-4">Information We Collect</h2>
        <p>
          <strong>Automatically collected data:</strong> When you visit TapSafe,
          our hosting provider and analytics tools may automatically collect
          standard server log data including your IP address, browser type,
          referring URL, pages visited, and the date and time of your visit.
        </p>
        <p>
          <strong>Contact form submissions:</strong> If you use our contact form,
          we collect the message content and email address you voluntarily
          provide. We use Web3Forms to process these submissions, and their
          privacy policy applies to that service.
        </p>
        <p>
          <strong>Search queries:</strong> When you search for a ZIP code, city,
          or water system on TapSafe, those queries are processed on our servers.
          We do not store individual search histories.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-4">Cookies and Tracking Technologies</h2>
        <p>
          TapSafe uses cookies for essential site functionality, including
          storing your light/dark mode preference.
        </p>
        <p>
          <strong>Google AdSense:</strong> We use Google AdSense to display
          advertisements. Google may use cookies and web beacons to serve ads
          based on your prior visits to this website or other websites. Google's
          use of advertising cookies enables it and its partners to serve ads
          based on your visit to TapSafe and/or other sites on the Internet.
          You may opt out of personalized advertising by visiting{" "}
          <a
            href="https://www.google.com/settings/ads"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Google Ads Settings
          </a>
          .
        </p>
        <p>
          <strong>Third-party cookies:</strong> Our advertising partners,
          including Google, may place and read cookies on your browser or use
          web beacons to collect information. These third-party cookies are
          governed by the respective privacy policies of those third parties.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-4">How We Use Information</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>To provide and improve the TapSafe website and service</li>
          <li>To respond to your contact form submissions</li>
          <li>To analyze usage patterns and improve user experience</li>
          <li>To serve relevant advertisements through Google AdSense</li>
          <li>To comply with legal obligations</li>
        </ul>

        <h2 className="text-xl font-semibold mt-10 mb-4">Data Sharing</h2>
        <p>
          We do not sell your personal information. We share data only with
          service providers necessary to operate the website (hosting, analytics,
          ad serving) and when required by law.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-4">GDPR and CCPA Rights</h2>
        <p>
          If you are located in the European Economic Area (EEA) or California,
          you have certain rights regarding your personal data, including the
          right to access, correct, delete, or port your data, and the right
          to opt out of the sale of personal information (we do not sell
          personal information). To exercise these rights, contact us through
          our{" "}
          <a href="/contact" className="text-primary hover:underline">
            contact page
          </a>
          .
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-4">Data Retention</h2>
        <p>
          Server logs are retained for up to 90 days. Contact form submissions
          are retained until the inquiry is resolved. We do not maintain
          user accounts or store personal profiles.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-4">Children&apos;s Privacy</h2>
        <p>
          TapSafe is not directed at children under 13. We do not knowingly
          collect personal information from children.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-4">Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Any changes will
          be posted on this page with an updated revision date.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-4">Contact</h2>
        <p>
          If you have questions about this Privacy Policy, please reach out
          through our{" "}
          <a href="/contact" className="text-primary hover:underline">
            contact page
          </a>
          .
        </p>
      </div>
    </div>
  );
}
