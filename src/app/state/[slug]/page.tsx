import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { MapPin, Users, AlertTriangle, Droplets, Building2 } from "lucide-react";
import { getState, getStateStats, getStateCities, getTopViolatedSystems, getStateWaterSystems } from "@/lib/queries";
import { stateMetadata } from "@/lib/metadata";
import { formatNumber } from "@/lib/utils";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SafetyGrade } from "@/components/SafetyGrade";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const state = await getState(slug);
  if (!state) return { title: "State Not Found" };
  return stateMetadata({ name: state.name, slug: state.slug });
}

export default async function StatePage({ params }: PageProps) {
  const { slug } = await params;
  const state = await getState(slug);
  if (!state) notFound();

  const [stats, cities, topViolated, topSystems] = await Promise.all([
    getStateStats(state.code),
    getStateCities(state.code),
    getTopViolatedSystems(state.code, 10),
    getStateWaterSystems(state.code, 0, 20),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: `${state.name} Water Quality`,
        description: `Drinking water quality data for ${state.name}`,
        url: `https://tapsafe.org/state/${state.slug}`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://tapsafe.org" },
          { "@type": "ListItem", position: 2, name: "States", item: "https://tapsafe.org/state" },
          { "@type": "ListItem", position: 3, name: state.name },
        ],
      },
    ],
  };

  return (
    <div className="max-w-6xl mx-auto px-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Breadcrumbs items={[{ label: "States", href: "/state" }, { label: state.name }]} />

      <h1 className="text-2xl md:text-3xl font-bold mb-2">
        {state.name} Water Quality
      </h1>
      <p className="text-muted-foreground mb-8">
        Drinking water data for {formatNumber(stats.totalSystems)} active public water systems in {state.name},
        serving {formatNumber(stats.totalPopulation)} people.
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Droplets className="h-5 w-5 text-primary" />
              <span className="text-xs text-muted-foreground">Water Systems</span>
            </div>
            <p className="text-lg font-bold">{formatNumber(stats.totalSystems)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="text-xs text-muted-foreground">Population Served</span>
            </div>
            <p className="text-lg font-bold">{formatNumber(stats.totalPopulation)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="text-xs text-muted-foreground">Systems with Violations</span>
            </div>
            <p className="text-lg font-bold">{formatNumber(stats.systemsWithViolations)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-5 w-5 text-green-500" />
              <span className="text-xs text-muted-foreground">Cities</span>
            </div>
            <p className="text-lg font-bold">{formatNumber(cities.length)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mb-8">
        {/* Largest Systems */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Largest Water Systems in {state.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-3">System</th>
                    <th className="pb-2 pr-3">City</th>
                    <th className="pb-2 pr-3 text-right">Population</th>
                    <th className="pb-2 pr-3 text-right">Violations</th>
                    <th className="pb-2">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {topSystems.data.map((ws) => (
                    <tr key={ws.pwsid} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-2 pr-3">
                        <Link href={`/water-system/${ws.slug}`} className="text-primary hover:underline font-medium">
                          {ws.pws_name}
                        </Link>
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground">{ws.city_name || "—"}</td>
                      <td className="py-2 pr-3 text-right">{formatNumber(ws.population_served)}</td>
                      <td className="py-2 pr-3 text-right">{ws.violation_count || 0}</td>
                      <td className="py-2">
                        <SafetyGrade
                          violationCount={ws.violation_count || 0}
                          healthViolationCount={ws.health_violation_count || 0}
                          leadLevel={ws.lead_90th_percentile}
                          size="sm"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Most Violated */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Most Violations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topViolated.map((ws, i) => (
                <Link
                  key={ws.pwsid}
                  href={`/water-system/${ws.slug}`}
                  className="flex items-center gap-2 hover:bg-muted/50 rounded-md p-1.5 -mx-1.5 transition-colors"
                >
                  <span className="text-xs text-muted-foreground w-5 shrink-0">{i + 1}.</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate text-primary">{ws.pws_name}</p>
                    <p className="text-xs text-muted-foreground">{ws.city_name}</p>
                  </div>
                  <Badge variant="destructive" className="text-xs shrink-0">{ws.violation_count}</Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cities */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Cities in {state.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {cities.slice(0, 100).map((city) => {
              const citySlug = city.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
              return (
                <Link
                  key={city.name}
                  href={`/state/${state.slug}/${citySlug}`}
                  className="text-sm px-3 py-2 border rounded-md hover:border-primary/50 hover:bg-muted/30 transition-colors truncate"
                >
                  {city.name}
                  <span className="text-muted-foreground ml-1 text-xs">({city.count})</span>
                </Link>
              );
            })}
          </div>
          {cities.length > 100 && (
            <p className="text-sm text-muted-foreground mt-4">
              Showing 100 of {cities.length} cities. Use the search to find a specific city.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
