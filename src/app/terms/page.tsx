import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of service for using the TapSafe website.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
      </p>

      <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
        <p>
          By accessing and using TapSafe (&quot;the Site&quot;), you agree to
          the following terms and conditions. If you do not agree with any part
          of these terms, you should not use the Site.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-4">Use of the Site</h2>
        <p>
          TapSafe is a free, publicly accessible website that presents drinking
          water quality data sourced from the EPA Safe Drinking Water Information
          System (SDWIS). You may use the Site for personal, non-commercial
          purposes. You may also reference or link to TapSafe from other
          websites, provided you do not misrepresent the source or imply
          endorsement.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-4">Data Accuracy</h2>
        <p>
          All water quality data on TapSafe is derived from publicly available
          EPA records. While we make reasonable efforts to process and display
          this data accurately, we do not guarantee the completeness, accuracy,
          or timeliness of any information on the Site. Data may be delayed,
          incomplete, or contain errors originating from the source dataset.
        </p>
        <p>
          TapSafe should not be used as the sole basis for decisions about
          drinking water safety. For current and verified water quality
          information, contact your local water utility or state regulatory
          agency directly.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-4">Intellectual Property</h2>
        <p>
          The design, layout, code, and original text content of TapSafe are
          protected by copyright. The underlying water quality data is public
          domain, as it originates from a US government source. You may freely
          use and share the data itself, but you may not copy the Site&apos;s
          design, branding, or original written content without permission.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-4">Third-Party Links and Services</h2>
        <p>
          TapSafe may contain links to third-party websites, including
          affiliate product links. We are not responsible for the content,
          accuracy, or practices of any third-party site. Clicking on a
          third-party link or making a purchase through an affiliate link
          is at your own discretion.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-4">Advertisements</h2>
        <p>
          TapSafe displays advertisements served by Google AdSense and
          potentially other advertising partners. The presence of an
          advertisement on TapSafe does not constitute an endorsement of the
          advertised product or service.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-4">Limitation of Liability</h2>
        <p>
          TapSafe is provided &quot;as is&quot; without warranties of any kind,
          either express or implied. To the fullest extent permitted by law, we
          disclaim all liability for any damages arising from your use of or
          inability to use the Site, including but not limited to direct,
          indirect, incidental, or consequential damages.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-4">User Conduct</h2>
        <p>You agree not to:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Attempt to access restricted areas of the Site or its servers</li>
          <li>Use automated tools to scrape or overload the Site</li>
          <li>Submit false, misleading, or abusive content through the contact form</li>
          <li>Use the Site for any unlawful purpose</li>
        </ul>

        <h2 className="text-xl font-semibold mt-10 mb-4">Modifications</h2>
        <p>
          We reserve the right to modify these Terms of Service at any time.
          Changes take effect immediately upon posting. Your continued use of
          the Site after changes are posted constitutes acceptance of the
          revised terms.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-4">Governing Law</h2>
        <p>
          These terms are governed by the laws of the United States. Any
          disputes shall be resolved in accordance with applicable federal and
          state law.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-4">Contact</h2>
        <p>
          Questions about these terms? Reach out via our{" "}
          <a href="/contact" className="text-primary hover:underline">
            contact page
          </a>
          .
        </p>
      </div>
    </div>
  );
}
