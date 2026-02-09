import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() || "";

  if (q.length < 2) {
    return NextResponse.json({ systems: [], cities: [] });
  }

  const isZip = /^\d{3,5}$/.test(q);

  // Run system search and city search in parallel
  const [systemsResult, citiesResult] = await Promise.all([
    // Water systems: search by name, city, or ZIP
    isZip
      ? supabase
          .from("water_systems")
          .select("pwsid, pws_name, slug, city_name, state_code, zip_code, population_served, violation_count")
          .eq("pws_activity_code", "A")
          .like("zip_code", `${q}%`)
          .order("population_served", { ascending: false })
          .limit(6)
      : supabase
          .from("water_systems")
          .select("pwsid, pws_name, slug, city_name, state_code, zip_code, population_served, violation_count")
          .eq("pws_activity_code", "A")
          .ilike("pws_name", `%${q}%`)
          .order("population_served", { ascending: false })
          .limit(6),

    // City aggregation: find cities matching the query
    isZip
      ? Promise.resolve({ data: [] })
      : supabase.rpc("search_cities", { p_query: q }),
  ]);

  const systems = (systemsResult.data || []).map((ws) => ({
    type: "system" as const,
    id: ws.pwsid,
    name: ws.pws_name,
    slug: ws.slug,
    city: ws.city_name,
    state: ws.state_code,
    zip: ws.zip_code,
    population: ws.population_served,
    violations: ws.violation_count || 0,
  }));

  const cities = (citiesResult.data || []).slice(0, 4).map((c: { city_name: string; state_code: string; system_count: number; state_slug: string }) => ({
    type: "city" as const,
    name: c.city_name,
    state: c.state_code,
    count: c.system_count,
    stateSlug: c.state_slug,
  }));

  return NextResponse.json({ systems, cities });
}
