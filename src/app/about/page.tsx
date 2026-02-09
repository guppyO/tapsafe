import type { Metadata } from "next";
import { Droplets, Database, Shield, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "About TapSafe",
  description:
    "TapSafe provides free drinking water quality data for every public water system in the United States, sourced directly from EPA records.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold mb-6">About TapSafe</h1>

      <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
        <p className="text-lg text-muted-foreground leading-relaxed">
          TapSafe makes EPA drinking water data accessible to everyone. We
          believe that every person has the right to know what is in the water
          flowing from their tap, without having to navigate complex government
          databases or rely on incomplete third-party reports.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-4 flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          Our Data Source
        </h2>
        <p>
          Every data point on TapSafe comes from the{" "}
          <strong>
            EPA Safe Drinking Water Information System (SDWIS)
          </strong>
          . This is the same federal database that state regulators use to
          track compliance with the Safe Drinking Water Act. We download the
          full SDWIS bulk dataset quarterly, which includes records for more
          than 430,000 public water systems across all 50 states, the District
          of Columbia, and US territories.
        </p>
        <p>
          The dataset covers violation history, enforcement actions, lead and
          copper sampling results, site inspection evaluations, and detailed
          geographic service area information. We process every row and make it
          searchable by ZIP code, city, county, or water system name.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Why This Matters
        </h2>
        <p>
          The EPA sets legal limits called Maximum Contaminant Levels (MCLs)
          for more than 90 contaminants in drinking water. When a water
          utility exceeds an MCL or fails to test on schedule, it creates a
          violation record in SDWIS. Some of these violations are classified
          as health-based, meaning the water delivered to customers exceeded
          a level considered safe for human consumption.
        </p>
        <p>
          Between reporting delays and dense government formatting, many
          people have no idea whether their water utility has a history of
          violations. TapSafe puts that information directly in front of
          you. We show violation counts, contaminant names, measured levels
          compared to federal limits, and whether the violation has been
          resolved.
        </p>
        <p>
          Lead and copper are tracked separately under the EPA Lead and
          Copper Rule. Utilities sample tap water at customer homes and
          report 90th percentile results. If the 90th percentile result
          exceeds the action level (15 ppb for lead, 1,300 ppb for copper),
          the utility must take corrective steps. TapSafe displays these
          sampling results so you can see how your water system compares.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-4 flex items-center gap-2">
          <Droplets className="h-5 w-5 text-primary" />
          What TapSafe Covers
        </h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>432,000+ public water systems</strong> from community
            water systems serving millions down to small transient systems
            at campgrounds and rest stops
          </li>
          <li>
            <strong>415,000+ violation records</strong> including both
            health-based and monitoring/reporting violations
          </li>
          <li>
            <strong>913,000+ lead and copper sample results</strong> with
            90th percentile values and EPA action level comparisons
          </li>
          <li>
            <strong>1.4 million+ site inspection records</strong> with
            compliance, treatment, distribution, and source water evaluations
          </li>
          <li>
            <strong>577,000+ geographic service area records</strong>{" "}
            connecting water systems to the cities, counties, and ZIP codes
            they serve
          </li>
        </ul>

        <h2 className="text-xl font-semibold mt-10 mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Who We Are
        </h2>
        <p>
          TapSafe is an independent data transparency project. We are not
          affiliated with the EPA, any water utility, or any water treatment
          product manufacturer. Our goal is to organize public drinking water
          data into a format that regular people can actually use.
        </p>
        <p>
          We do not test water ourselves. We do not produce water quality
          reports. Everything on this site reflects data that water utilities
          have reported to state and federal regulators, as published in the
          EPA SDWIS database. If you spot an error or have questions about a
          specific record, we encourage you to contact your local water
          utility directly or file an inquiry through the EPA.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-4">
          How Often Is Data Updated?
        </h2>
        <p>
          The EPA publishes SDWIS bulk downloads on a quarterly cycle. We
          download and process the full dataset within one week of each
          quarterly release. The data you see on TapSafe reflects the most
          recent quarterly snapshot available from the EPA.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-4">Contact</h2>
        <p>
          Have a question, correction, or suggestion? Visit our{" "}
          <a href="/contact" className="text-primary hover:underline">
            contact page
          </a>{" "}
          to reach us directly.
        </p>
      </div>
    </div>
  );
}
