import Link from "next/link";
import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import { getAllStates } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Badge } from "@/components/ui/badge";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Browse by State",
  description:
    "View drinking water quality data for all 50 US states and territories. Find water systems, violations, and lead testing results in your state.",
  alternates: { canonical: "https://tapsafe.org/state" },
};

export default async function StatesIndexPage() {
  const states = await getAllStates();

  // Get system counts per state
  const { data: stateCounts } = await supabase
    .from("water_systems")
    .select("state_code")
    .eq("pws_activity_code", "A");

  const counts = new Map<string, number>();
  for (const row of stateCounts || []) {
    counts.set(row.state_code, (counts.get(row.state_code) || 0) + 1);
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      <Breadcrumbs items={[{ label: "States" }]} />

      <h1 className="text-2xl md:text-3xl font-bold mb-2">Browse Water Quality by State</h1>
      <p className="text-muted-foreground mb-8">
        Select a state to view water system data, violation records, and lead testing results.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {states.map((state) => (
          <Link
            key={state.code}
            href={`/state/${state.slug}`}
            className="flex items-center gap-3 border rounded-lg p-4 hover:border-primary/50 hover:bg-muted/30 transition-colors"
          >
            <Badge variant="outline" className="text-base font-bold px-2.5 py-1 shrink-0">
              {state.abbreviation}
            </Badge>
            <div className="min-w-0">
              <p className="font-medium truncate">{state.name}</p>
              <p className="text-xs text-muted-foreground">
                {(counts.get(state.code) || 0).toLocaleString()} water systems
              </p>
            </div>
            <MapPin className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
