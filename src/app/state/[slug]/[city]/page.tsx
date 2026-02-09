import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Droplets, Users, AlertTriangle, FlaskConical } from "lucide-react";
import { getState, getCityWaterSystems } from "@/lib/queries";
import { cityMetadata } from "@/lib/metadata";
import { formatNumber, pwsTypeLabel, waterSourceLabel } from "@/lib/utils";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SafetyGrade } from "@/components/SafetyGrade";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string; city: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, city } = await params;
  const state = await getState(slug);
  if (!state) return { title: "Not Found" };
  const cityName = decodeURIComponent(city).replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  return cityMetadata(cityName, state.name, state.slug, city);
}

export default async function CityPage({ params }: PageProps) {
  const { slug, city: citySlug } = await params;
  const state = await getState(slug);
  if (!state) notFound();

  // Convert slug back to city name for querying
  // We need to find the actual city name from the database
  const cityName = decodeURIComponent(citySlug).replace(/-/g, " ").toUpperCase();

  const systems = await getCityWaterSystems(state.code, cityName);
  if (systems.length === 0) notFound();

  const displayCity = systems[0].city_name || cityName;
  const totalPop = systems.reduce((sum, ws) => sum + (ws.population_served || 0), 0);
  const totalViolations = systems.reduce((sum, ws) => sum + (ws.violation_count || 0), 0);
  const totalHealthViolations = systems.reduce((sum, ws) => sum + (ws.health_violation_count || 0), 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: `${displayCity}, ${state.name} Water Quality`,
        url: `https://tapsafe.org/state/${state.slug}/${citySlug}`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://tapsafe.org" },
          { "@type": "ListItem", position: 2, name: "States", item: "https://tapsafe.org/state" },
          { "@type": "ListItem", position: 3, name: state.name, item: `https://tapsafe.org/state/${state.slug}` },
          { "@type": "ListItem", position: 4, name: displayCity },
        ],
      },
    ],
  };

  return (
    <div className="max-w-6xl mx-auto px-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Breadcrumbs
        items={[
          { label: "States", href: "/state" },
          { label: state.name, href: `/state/${state.slug}` },
          { label: displayCity },
        ]}
      />

      <h1 className="text-2xl md:text-3xl font-bold mb-2">
        {displayCity}, {state.name} Water Quality
      </h1>
      <p className="text-muted-foreground mb-8">
        {systems.length} public water system{systems.length !== 1 ? "s" : ""} serve {displayCity},
        covering {formatNumber(totalPop)} residents.
        {totalViolations > 0
          ? ` There are ${totalViolations} violation${totalViolations !== 1 ? "s" : ""} on record, including ${totalHealthViolations} health-based.`
          : " No violations on record."}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Droplets className="h-5 w-5 text-primary" />
              <span className="text-xs text-muted-foreground">Water Systems</span>
            </div>
            <p className="text-lg font-bold">{systems.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="text-xs text-muted-foreground">Population</span>
            </div>
            <p className="text-lg font-bold">{formatNumber(totalPop)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="text-xs text-muted-foreground">Violations</span>
            </div>
            <p className="text-lg font-bold">{formatNumber(totalViolations)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <FlaskConical className="h-5 w-5 text-orange-500" />
              <span className="text-xs text-muted-foreground">Health Violations</span>
            </div>
            <p className="text-lg font-bold">{formatNumber(totalHealthViolations)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Water Systems */}
      <h2 className="text-xl font-bold mb-4">Water Systems Serving {displayCity}</h2>
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {systems.map((ws) => (
          <Card key={ws.pwsid} className="hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/water-system/${ws.slug}`}
                    className="font-semibold text-primary hover:underline"
                  >
                    {ws.pws_name}
                  </Link>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{pwsTypeLabel(ws.pws_type_code)}</Badge>
                    <Badge variant="outline" className="text-xs">{waterSourceLabel(ws.gw_sw_code)}</Badge>
                  </div>
                </div>
                <SafetyGrade
                  violationCount={ws.violation_count || 0}
                  healthViolationCount={ws.health_violation_count || 0}
                  leadLevel={ws.lead_90th_percentile}
                  size="sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Population</span>
                  <p className="font-medium">{formatNumber(ws.population_served)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Violations</span>
                  <p className="font-medium">{ws.violation_count || 0}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Lead (ppb)</span>
                  <p className={`font-medium ${ws.lead_90th_percentile && ws.lead_90th_percentile > 15 ? "text-red-500" : ""}`}>
                    {ws.lead_90th_percentile != null ? ws.lead_90th_percentile : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
