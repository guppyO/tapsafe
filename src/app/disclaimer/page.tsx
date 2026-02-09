import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Disclaimer",
  description:
    "Important disclaimer about the accuracy and intended use of water quality data on TapSafe.",
};

export default function DisclaimerPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle className="h-7 w-7 text-warning" />
        <h1 className="text-3xl font-bold">Disclaimer</h1>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-5 mb-8">
          <p className="text-sm font-medium m-0">
            TapSafe is an informational resource only. It is not a substitute
            for professional water quality testing, medical advice, or official
            regulatory guidance.
          </p>
        </div>

        <h2 className="text-xl font-semibold mt-10 mb-4">Data Source and Limitations</h2>
        <p>
          All water quality data displayed on TapSafe comes from the EPA Safe
          Drinking Water Information System (SDWIS) bulk data download. This
          data is reported by water utilities to state regulators, who then
          submit it to the EPA. There are several important limitations:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Reporting delays:</strong> The EPA publishes SDWIS data on
            a quarterly cycle. Violations and test results may not appear for
            several months after they occur.
          </li>
          <li>
            <strong>Data completeness:</strong> Some water systems may have
            incomplete records, missing sample results, or unreported
            violations. Not all contaminants are regulated or tested.
          </li>
          <li>
            <strong>Historical data:</strong> Violation records may span
            decades. A system with many historical violations may have since
            upgraded its treatment and now deliver fully compliant water.
          </li>
          <li>
            <strong>Processing errors:</strong> While we take care to process
            data accurately, errors can occur during data transformation.
            Always verify critical information with your water utility.
          </li>
        </ul>

        <h2 className="text-xl font-semibold mt-10 mb-4">Not Medical or Health Advice</h2>
        <p>
          TapSafe does not provide medical advice, health diagnoses, or
          treatment recommendations. The safety grades, contaminant
          comparisons, and violation summaries on this site are based on EPA
          regulatory limits and should not be interpreted as medical guidance.
          If you have health concerns related to your drinking water, consult a
          healthcare professional.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-4">No Endorsement of Products</h2>
        <p>
          TapSafe may display advertisements or include links to water
          treatment products, testing kits, or filtration systems. These are
          provided for informational purposes and may include affiliate links
          that generate revenue for TapSafe. The inclusion of any product or
          service does not constitute an endorsement, guarantee of
          effectiveness, or recommendation.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-4">Verify with Official Sources</h2>
        <p>
          For the most current and accurate information about your drinking
          water, we recommend:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            Contacting your local water utility and requesting their annual
            Consumer Confidence Report (CCR)
          </li>
          <li>
            Visiting your state&apos;s drinking water program website
          </li>
          <li>
            Checking the EPA&apos;s{" "}
            <a
              href="https://www.epa.gov/ground-water-and-drinking-water"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Ground Water and Drinking Water page
            </a>
          </li>
          <li>
            Getting your water independently tested if you have specific
            concerns about contaminants not covered by EPA regulations
          </li>
        </ul>

        <h2 className="text-xl font-semibold mt-10 mb-4">Limitation of Liability</h2>
        <p>
          TapSafe provides information on an &quot;as is&quot; basis. We make
          no warranties, express or implied, regarding the accuracy,
          completeness, or suitability of the data for any particular purpose.
          In no event shall TapSafe be liable for any damages arising from
          reliance on information presented on this website.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-4">Questions</h2>
        <p>
          If you believe any data on TapSafe is inaccurate, please let us know
          through our{" "}
          <a href="/contact" className="text-primary hover:underline">
            contact page
          </a>
          . We will investigate and correct verified errors as quickly as
          possible.
        </p>
      </div>
    </div>
  );
}
