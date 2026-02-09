import { supabase } from "@/lib/supabase";
import { HeroSection } from "@/components/HeroSection";
import { StatsBar } from "@/components/StatsBar";
import { StateGrid } from "@/components/StateGrid";
import { RecentViolations } from "@/components/RecentViolations";

export const revalidate = 3600;

async function getStats() {
  const [systemsRes, violationsRes, statesRes, healthViolRes] =
    await Promise.all([
      supabase
        .from("water_systems")
        .select("*", { count: "exact", head: true }),
      supabase.from("violations").select("*", { count: "exact", head: true }),
      supabase.from("states").select("*", { count: "exact", head: true }),
      supabase
        .from("violations")
        .select("*", { count: "exact", head: true })
        .eq("is_health_based", true),
    ]);

  return {
    totalSystems: systemsRes.count ?? 0,
    totalViolations: violationsRes.count ?? 0,
    totalStates: statesRes.count ?? 0,
    healthViolations: healthViolRes.count ?? 0,
  };
}

async function getStates() {
  const { data } = await supabase
    .from("states")
    .select("code, name, slug, abbreviation")
    .order("name");
  return data ?? [];
}

async function getRecentViolations() {
  const { data } = await supabase
    .from("violations")
    .select(
      "pwsid, violation_id, contaminant_code, is_health_based, begin_date, violation_status"
    )
    .eq("is_health_based", true)
    .not("begin_date", "is", null)
    .order("begin_date", { ascending: false })
    .limit(8);

  if (!data || data.length === 0) return [];

  const pwsids = [...new Set(data.map((v) => v.pwsid))];
  const { data: systems } = await supabase
    .from("water_systems")
    .select("pwsid, pws_name, state_code, city_name, slug")
    .in("pwsid", pwsids);

  const systemMap = new Map(systems?.map((s) => [s.pwsid, s]) ?? []);

  return data.map((v) => ({
    ...v,
    system: systemMap.get(v.pwsid) ?? null,
  }));
}

export default async function HomePage() {
  const [stats, states, recentViolations] = await Promise.all([
    getStats(),
    getStates(),
    getRecentViolations(),
  ]);

  return (
    <>
      <HeroSection />
      <StatsBar stats={stats} />
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold mb-2">Browse by State</h2>
        <p className="text-muted-foreground mb-8">
          Select a state to see water quality data for every public water
          system.
        </p>
        <StateGrid states={states} />
      </section>
      <section className="bg-muted/30 border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-bold mb-2">
            Recent Health Violations
          </h2>
          <p className="text-muted-foreground mb-8">
            The latest health-based drinking water violations reported to the
            EPA.
          </p>
          <RecentViolations violations={recentViolations} />
        </div>
      </section>
    </>
  );
}
