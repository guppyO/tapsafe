import Link from "next/link";
import type { Metadata } from "next";
import { Search, MapPin, Users, AlertTriangle, Droplets } from "lucide-react";
import { searchWaterSystems, getAllStates } from "@/lib/queries";
import { searchMetadata } from "@/lib/metadata";
import { formatNumber } from "@/lib/utils";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SafetyGrade } from "@/components/SafetyGrade";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = searchMetadata();

interface PageProps {
  searchParams: Promise<{ q?: string; state?: string; page?: string }>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const query = sp.q || "";
  const stateFilter = sp.state || "";
  const page = parseInt(sp.page || "0");

  const [results, states] = await Promise.all([
    query || stateFilter
      ? searchWaterSystems(query, stateFilter || undefined, page, 20)
      : Promise.resolve({ data: [], count: 0 }),
    getAllStates(),
  ]);

  const totalPages = Math.ceil((results.count || 0) / 20);

  return (
    <div className="max-w-6xl mx-auto px-4">
      <Breadcrumbs items={[{ label: "Search" }]} />

      <h1 className="text-2xl md:text-3xl font-bold mb-6">Search Water Systems</h1>

      {/* Search Form */}
      <form className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Enter ZIP code, city, or utility name..."
            aria-label="Search water systems"
            className="w-full pl-10 pr-4 py-2.5 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select
          name="state"
          defaultValue={stateFilter}
          aria-label="Filter by state"
          className="px-3 py-2.5 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">All States</option>
          {states.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Search
        </button>
      </form>

      {/* Results */}
      {(query || stateFilter) && (
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {results.count > 0
              ? `Found ${formatNumber(results.count)} water system${results.count !== 1 ? "s" : ""}${query ? ` matching "${query}"` : ""}${stateFilter ? ` in ${states.find((s) => s.code === stateFilter)?.name || stateFilter}` : ""}`
              : `No water systems found${query ? ` matching "${query}"` : ""}. Try a different search term.`}
          </p>
        </div>
      )}

      {results.data.length > 0 && (
        <div className="space-y-3 mb-8">
          {results.data.map((ws) => (
            <Card key={ws.pwsid} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/water-system/${ws.slug}`}
                      className="font-semibold text-primary hover:underline text-lg"
                    >
                      {ws.pws_name}
                    </Link>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {ws.city_name && `${ws.city_name}, `}{ws.state_code}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {formatNumber(ws.population_served)} served
                      </span>
                      {(ws.violation_count || 0) > 0 && (
                        <span className="flex items-center gap-1 text-red-500">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {ws.violation_count} violations
                        </span>
                      )}
                    </div>
                  </div>
                  <SafetyGrade
                    violationCount={ws.violation_count || 0}
                    healthViolationCount={ws.health_violation_count || 0}
                    size="sm"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mb-8">
          {page > 0 && (
            <Link
              href={`/search?q=${encodeURIComponent(query)}&state=${stateFilter}&page=${page - 1}`}
              className="px-4 py-2 border rounded-lg text-sm hover:bg-muted/50 transition-colors"
            >
              Previous
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          {page < totalPages - 1 && (
            <Link
              href={`/search?q=${encodeURIComponent(query)}&state=${stateFilter}&page=${page + 1}`}
              className="px-4 py-2 border rounded-lg text-sm hover:bg-muted/50 transition-colors"
            >
              Next
            </Link>
          )}
        </div>
      )}

      {/* No search yet */}
      {!query && !stateFilter && (
        <div className="text-center py-12">
          <Droplets className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-lg text-muted-foreground mb-2">Search for a water system</p>
          <p className="text-sm text-muted-foreground">
            Enter a ZIP code, city name, or water utility name to get started.
          </p>
        </div>
      )}
    </div>
  );
}
