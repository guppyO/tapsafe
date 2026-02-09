import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Droplets, MapPin, Users, AlertTriangle, Shield, Building2, Phone, Calendar, FlaskConical, ClipboardCheck } from "lucide-react";
import { getWaterSystem, getViolations, getLcrSamples, getRelatedSystems } from "@/lib/queries";
import { waterSystemMetadata } from "@/lib/metadata";
import { supabase } from "@/lib/supabase";
import { formatNumber, formatDate, pwsTypeLabel, waterSourceLabel, ownerTypeLabel } from "@/lib/utils";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SafetyGrade, calculateGrade } from "@/components/SafetyGrade";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const ws = await getWaterSystem(slug);
  if (!ws) return { title: "Water System Not Found" };
  return waterSystemMetadata(ws);
}

export default async function WaterSystemPage({ params }: PageProps) {
  const { slug } = await params;
  const ws = await getWaterSystem(slug);
  if (!ws) notFound();

  const [violations, lcrSamples, relatedSystems, stateData] = await Promise.all([
    getViolations(ws.pwsid),
    getLcrSamples(ws.pwsid),
    getRelatedSystems(ws.state_code, ws.city_name, ws.pwsid),
    supabase.from("states").select("name, slug").eq("code", ws.state_code).single(),
  ]);

  const stateName = stateData.data?.name || ws.state_code;
  const stateSlug = stateData.data?.slug || ws.state_code.toLowerCase();
  const citySlug = ws.city_name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "";

  const healthViolations = violations.filter((v) => v.is_health_based);
  const leadSamples = lcrSamples.filter((s) => s.contaminant_code === "PB90");
  const copperSamples = lcrSamples.filter((s) => s.contaminant_code === "CU90");

  const { grade, label, color } = calculateGrade(
    ws.violation_count || 0,
    ws.health_violation_count || 0,
    ws.lead_90th_percentile
  );

  // Get avg violations for state comparison via RPC (avoids 1000-row limit)
  const { data: avgViolationsData } = await supabase.rpc("get_state_avg_violations", { p_state_code: ws.state_code });
  const avgViolations = Number(avgViolationsData) || 0;

  // Build breadcrumbs
  const breadcrumbs = [
    { label: stateName, href: `/state/${stateSlug}` },
    ...(ws.city_name ? [{ label: ws.city_name, href: `/state/${stateSlug}/${citySlug}` }] : []),
    { label: ws.pws_name },
  ];

  // Dynamic FAQ
  const faqs = buildFaqs(ws, violations.length, healthViolations.length, stateName);

  // JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "GovernmentService",
        name: ws.pws_name,
        description: `Public water system in ${ws.city_name || ""}, ${stateName}`,
        areaServed: {
          "@type": "City",
          name: ws.city_name || stateName,
          containedInPlace: { "@type": "State", name: stateName },
        },
        serviceType: "Water Supply",
        ...(ws.phone_number && { telephone: ws.phone_number }),
        ...(ws.address_line1 && {
          address: {
            "@type": "PostalAddress",
            streetAddress: ws.address_line1,
            addressLocality: ws.city_name,
            addressRegion: ws.state_code,
            postalCode: ws.zip_code,
          },
        }),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://tapsafe.org" },
          { "@type": "ListItem", position: 2, name: stateName, item: `https://tapsafe.org/state/${stateSlug}` },
          ...(ws.city_name
            ? [{ "@type": "ListItem", position: 3, name: ws.city_name, item: `https://tapsafe.org/state/${stateSlug}/${citySlug}` }]
            : []),
          { "@type": "ListItem", position: ws.city_name ? 4 : 3, name: ws.pws_name },
        ],
      },
      ...(faqs.length > 0
        ? [{
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.question,
              acceptedAnswer: { "@type": "Answer", text: f.answer },
            })),
          }]
        : []),
    ],
  };

  return (
    <div className="max-w-6xl mx-auto px-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Breadcrumbs items={breadcrumbs} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{ws.pws_name}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {ws.city_name && `${ws.city_name}, `}{stateName}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {formatNumber(ws.population_served)} served
            </span>
            <Badge variant="outline">{ws.pwsid}</Badge>
          </div>
        </div>
        <SafetyGrade
          violationCount={ws.violation_count || 0}
          healthViolationCount={ws.health_violation_count || 0}
          leadLevel={ws.lead_90th_percentile}
          size="lg"
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<AlertTriangle className="h-5 w-5 text-red-500" />} label="Total Violations" value={formatNumber(ws.violation_count || 0)} />
        <StatCard icon={<Shield className="h-5 w-5 text-orange-500" />} label="Health Violations" value={formatNumber(ws.health_violation_count || 0)} />
        <StatCard
          icon={<FlaskConical className="h-5 w-5 text-blue-500" />}
          label="Lead (90th %)"
          value={ws.lead_90th_percentile != null ? `${ws.lead_90th_percentile} ppb` : "No data"}
          warning={ws.lead_90th_percentile != null && ws.lead_90th_percentile > 15}
        />
        <StatCard
          icon={<ClipboardCheck className="h-5 w-5 text-green-500" />}
          label="Last Inspection"
          value={formatDate(ws.last_site_visit_date)}
        />
      </div>

      {/* System Info */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Droplets className="h-5 w-5 text-primary" />
              System Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <DetailItem label="System Type" value={pwsTypeLabel(ws.pws_type_code)} />
              <DetailItem label="Water Source" value={waterSourceLabel(ws.gw_sw_code)} />
              <DetailItem label="Owner" value={ownerTypeLabel(ws.owner_type_code)} />
              <DetailItem label="Service Connections" value={formatNumber(ws.service_connections)} />
              <DetailItem label="EPA Region" value={ws.epa_region || "N/A"} />
              <DetailItem label="Status" value={ws.pws_activity_code === "A" ? "Active" : "Inactive"} />
              {ws.is_school_or_daycare && <DetailItem label="Serves" value="School or Daycare" />}
              {ws.seasonal_system && <DetailItem label="Seasonal" value="Yes" />}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {ws.org_name && <p className="font-medium">{ws.org_name}</p>}
            {ws.admin_name && <p className="text-muted-foreground">{ws.admin_name}</p>}
            {ws.address_line1 && <p className="text-muted-foreground">{ws.address_line1}</p>}
            {ws.city_name && (
              <p className="text-muted-foreground">
                {ws.city_name}, {ws.state_code} {ws.zip_code}
              </p>
            )}
            {ws.phone_number && (
              <p className="flex items-center gap-1 text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                {ws.phone_number}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Safety Assessment */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Safety Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            <div className={`h-16 w-16 rounded-xl flex items-center justify-center text-3xl font-bold text-white shrink-0 ${color}`}>
              {grade}
            </div>
            <div>
              <p className="font-semibold text-lg">{label} — Grade {grade}</p>
              <p className="text-muted-foreground mt-1">
                {ws.pws_name} has {ws.violation_count || 0} total violation{(ws.violation_count || 0) !== 1 ? "s" : ""} on record,
                including {ws.health_violation_count || 0} health-based violation{(ws.health_violation_count || 0) !== 1 ? "s" : ""}.
                {ws.lead_90th_percentile != null && (
                  <> The most recent lead test showed {ws.lead_90th_percentile} ppb
                  (EPA action level: 15 ppb).{ws.lead_90th_percentile > 15 ? " This exceeds the federal action level." : ""}</>
                )}
                {ws.violation_count && ws.violation_count > avgViolations
                  ? ` This system has more violations than the ${stateName} average of ${Math.round(avgViolations)}.`
                  : ws.violation_count
                  ? ` This is below the ${stateName} average of ${Math.round(avgViolations)} violations.`
                  : ""}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Violations Table */}
      {violations.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Violation History ({violations.length}{violations.length === 100 ? "+" : ""})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2 pr-4">Contaminant</th>
                    <th className="pb-2 pr-4">Type</th>
                    <th className="pb-2 pr-4">Measured</th>
                    <th className="pb-2 pr-4">MCL</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {violations.slice(0, 25).map((v, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-2 pr-4 whitespace-nowrap">{formatDate(v.begin_date)}</td>
                      <td className="py-2 pr-4">{v.contaminant_code}</td>
                      <td className="py-2 pr-4">
                        {v.is_health_based ? (
                          <Badge variant="destructive" className="text-xs">Health</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Other</Badge>
                        )}
                      </td>
                      <td className="py-2 pr-4">
                        {v.viol_measure != null ? `${v.viol_measure} ${v.unit_of_measure || ""}` : "—"}
                      </td>
                      <td className="py-2 pr-4">
                        {v.federal_mcl != null ? `${v.federal_mcl} ${v.unit_of_measure || ""}` : "—"}
                      </td>
                      <td className="py-2">
                        <Badge variant={v.violation_status === "Resolved" ? "outline" : "secondary"} className="text-xs">
                          {v.violation_status || "Unknown"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {violations.length > 25 && (
              <p className="text-sm text-muted-foreground mt-3">Showing 25 of {violations.length} violations.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lead & Copper */}
      {lcrSamples.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-blue-500" />
              Lead &amp; Copper Testing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Lead */}
              <div>
                <h2 className="font-semibold mb-2 text-base">Lead (90th Percentile)</h2>
                <p className="text-sm text-muted-foreground mb-3">EPA action level: 15 ppb</p>
                {leadSamples.length > 0 ? (
                  <div className="space-y-2">
                    {leadSamples.slice(0, 5).map((s, i) => {
                      const val = Number(s.sample_measure) || 0;
                      const pct = Math.min((val / 15) * 100, 100);
                      const over = val > 15;
                      return (
                        <div key={i} className="text-sm">
                          <div className="flex justify-between mb-1">
                            <span className="text-muted-foreground">{formatDate(s.sampling_end_date)}</span>
                            <span className={over ? "text-red-500 font-semibold" : ""}>{val} ppb</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${over ? "bg-red-500" : "bg-green-500"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No lead samples available.</p>
                )}
              </div>

              {/* Copper */}
              <div>
                <h2 className="font-semibold mb-2 text-base">Copper (90th Percentile)</h2>
                <p className="text-sm text-muted-foreground mb-3">EPA action level: 1,300 ppb</p>
                {copperSamples.length > 0 ? (
                  <div className="space-y-2">
                    {copperSamples.slice(0, 5).map((s, i) => {
                      const val = Number(s.sample_measure) || 0;
                      const pct = Math.min((val / 1300) * 100, 100);
                      const over = val > 1300;
                      return (
                        <div key={i} className="text-sm">
                          <div className="flex justify-between mb-1">
                            <span className="text-muted-foreground">{formatDate(s.sampling_end_date)}</span>
                            <span className={over ? "text-red-500 font-semibold" : ""}>{val} ppb</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${over ? "bg-red-500" : "bg-blue-500"}`}
                              style={{ width: `${Math.max(pct, 2)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No copper samples available.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FAQ */}
      {faqs.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {faqs.map((f, i) => (
              <div key={i}>
                <h2 className="font-semibold text-sm">{f.question}</h2>
                <p className="text-sm text-muted-foreground mt-1">{f.answer}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Related Systems */}
      {relatedSystems.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">
              Other Water Systems {ws.city_name ? `in ${ws.city_name}` : `in ${stateName}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {relatedSystems.map((rs) => (
                <Link
                  key={rs.pwsid}
                  href={`/water-system/${rs.slug}`}
                  className="border rounded-lg p-3 hover:border-primary/50 hover:bg-muted/30 transition-colors"
                >
                  <p className="font-medium text-sm truncate">{rs.pws_name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {rs.city_name && `${rs.city_name}, `}{rs.state_code}
                    {rs.population_served ? ` • ${formatNumber(rs.population_served)} served` : ""}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <SafetyGrade
                      violationCount={rs.violation_count || 0}
                      healthViolationCount={rs.health_violation_count || 0}
                      size="sm"
                    />
                    <span className="text-xs text-muted-foreground">
                      {rs.violation_count || 0} violations
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, warning }: { icon: React.ReactNode; label: string; value: string; warning?: boolean }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <p className={`text-lg font-bold ${warning ? "text-red-500" : ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function buildFaqs(
  ws: Record<string, unknown>,
  violationCount: number,
  healthCount: number,
  stateName: string
) {
  const faqs: { question: string; answer: string }[] = [];
  const name = ws.pws_name as string;
  const city = ws.city_name as string | null;
  const pop = ws.population_served as number | null;
  const lead = ws.lead_90th_percentile as number | null;

  faqs.push({
    question: `Is ${name} water safe to drink?`,
    answer: violationCount === 0
      ? `${name} has no violations on record with the EPA, which is a positive indicator. However, water quality can change over time. Regular testing by your utility ensures ongoing safety.`
      : healthCount > 0
      ? `${name} has ${violationCount} violation${violationCount !== 1 ? "s" : ""} on record, including ${healthCount} health-based violation${healthCount !== 1 ? "s" : ""}. Health-based violations mean the water exceeded a contaminant level the EPA considers harmful. Check the violation table above for details on specific contaminants.`
      : `${name} has ${violationCount} violation${violationCount !== 1 ? "s" : ""} on record, but none are classified as health-based. These are typically monitoring or reporting violations rather than contaminant exceedances.`,
  });

  if (lead != null) {
    faqs.push({
      question: `Does ${city || name} have lead in the water?`,
      answer: lead > 15
        ? `The most recent 90th percentile lead test for ${name} measured ${lead} ppb, which exceeds the EPA action level of 15 ppb. When lead exceeds this threshold, the utility must notify customers and take corrective steps such as corrosion control treatment or lead service line replacement.`
        : lead > 0
        ? `The most recent 90th percentile lead test for ${name} measured ${lead} ppb, which is below the EPA action level of 15 ppb. While no amount of lead exposure is considered completely safe, this result indicates the water meets federal standards.`
        : `The most recent lead test for ${name} showed non-detectable levels of lead, which is the best possible result.`,
    });
  }

  if (pop && pop > 0) {
    faqs.push({
      question: `How many people does ${name} serve?`,
      answer: `${name} serves approximately ${pop.toLocaleString()} people${city ? ` in the ${city}, ${stateName} area` : ` in ${stateName}`}. It is classified as a ${pwsTypeLabel(ws.pws_type_code as string)} using ${waterSourceLabel(ws.gw_sw_code as string).toLowerCase()} as its primary source.`,
    });
  }

  return faqs;
}
