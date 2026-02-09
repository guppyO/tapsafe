import { supabase } from "./supabase";

// Water system by slug
export async function getWaterSystem(slug: string) {
  const { data } = await supabase
    .from("water_systems")
    .select("*")
    .eq("slug", slug)
    .single();
  return data;
}

// Violations for a water system
export async function getViolations(pwsid: string) {
  const { data } = await supabase
    .from("violations")
    .select("*")
    .eq("pwsid", pwsid)
    .order("begin_date", { ascending: false })
    .limit(100);
  return data || [];
}

// LCR samples for a water system
export async function getLcrSamples(pwsid: string) {
  const { data } = await supabase
    .from("lcr_samples")
    .select("*")
    .eq("pwsid", pwsid)
    .order("sampling_end_date", { ascending: false })
    .limit(50);
  return data || [];
}

// Related water systems (same city + state)
export async function getRelatedSystems(
  stateCode: string,
  cityName: string | null,
  excludePwsid: string,
  limit = 6
) {
  let query = supabase
    .from("water_systems")
    .select("pwsid, pws_name, slug, city_name, state_code, population_served, violation_count, health_violation_count")
    .eq("state_code", stateCode)
    .neq("pwsid", excludePwsid)
    .eq("pws_activity_code", "A")
    .order("population_served", { ascending: false })
    .limit(limit);

  if (cityName) {
    query = query.eq("city_name", cityName);
  }

  const { data } = await query;
  return data || [];
}

// State info by slug
export async function getState(slug: string) {
  const { data } = await supabase
    .from("states")
    .select("*")
    .eq("slug", slug)
    .single();
  return data;
}

// All states
export async function getAllStates() {
  const { data } = await supabase
    .from("states")
    .select("*")
    .order("name");
  return data || [];
}

// Water systems for a state (paginated)
export async function getStateWaterSystems(
  stateCode: string,
  page = 0,
  pageSize = 25,
  sortBy: "population_served" | "violation_count" | "pws_name" = "population_served"
) {
  const offset = page * pageSize;
  const { data, count } = await supabase
    .from("water_systems")
    .select("pwsid, pws_name, slug, city_name, population_served, violation_count, health_violation_count, lead_90th_percentile, pws_type_code, gw_sw_code", { count: "exact" })
    .eq("state_code", stateCode)
    .eq("pws_activity_code", "A")
    .order(sortBy, { ascending: sortBy === "pws_name" })
    .range(offset, offset + pageSize - 1);

  return { data: data || [], count: count || 0 };
}

// State stats
export async function getStateStats(stateCode: string) {
  const [systemsRes, violationsRes, populationRes] = await Promise.all([
    supabase
      .from("water_systems")
      .select("*", { count: "exact", head: true })
      .eq("state_code", stateCode)
      .eq("pws_activity_code", "A"),
    supabase
      .from("water_systems")
      .select("*", { count: "exact", head: true })
      .eq("state_code", stateCode)
      .eq("pws_activity_code", "A")
      .gt("violation_count", 0),
    supabase.rpc("get_state_total_population", { p_state_code: stateCode }),
  ]);

  const totalSystems = systemsRes.count || 0;
  const systemsWithViolations = violationsRes.count || 0;
  const totalPopulation = Number(populationRes.data) || 0;

  return { totalSystems, systemsWithViolations, totalPopulation };
}

// Cities in a state
export async function getStateCities(stateCode: string) {
  const { data } = await supabase.rpc("get_state_city_counts", { p_state_code: stateCode });

  return (data || []).map((row: { city_name: string; system_count: number }) => ({
    name: row.city_name,
    count: Number(row.system_count),
  }));
}

// Water systems for a city
export async function getCityWaterSystems(stateCode: string, cityName: string) {
  const { data } = await supabase
    .from("water_systems")
    .select("pwsid, pws_name, slug, city_name, state_code, population_served, violation_count, health_violation_count, lead_90th_percentile, copper_90th_percentile, pws_type_code, gw_sw_code, owner_type_code")
    .eq("state_code", stateCode)
    .eq("city_name", cityName)
    .eq("pws_activity_code", "A")
    .order("population_served", { ascending: false });

  return data || [];
}

// Search water systems
export async function searchWaterSystems(query: string, state?: string, page = 0, pageSize = 20) {
  let q = supabase
    .from("water_systems")
    .select("pwsid, pws_name, slug, city_name, state_code, population_served, violation_count, health_violation_count, pws_type_code", { count: "exact" })
    .eq("pws_activity_code", "A");

  if (state) {
    q = q.eq("state_code", state);
  }

  if (query) {
    // Try ZIP code first
    if (/^\d{5}$/.test(query)) {
      q = q.eq("zip_code", query);
    } else {
      q = q.ilike("pws_name", `%${query}%`);
    }
  }

  const offset = page * pageSize;
  const { data, count } = await q
    .order("population_served", { ascending: false })
    .range(offset, offset + pageSize - 1);

  return { data: data || [], count: count || 0 };
}

// Top violated systems in a state
export async function getTopViolatedSystems(stateCode: string, limit = 10) {
  const { data } = await supabase
    .from("water_systems")
    .select("pwsid, pws_name, slug, city_name, population_served, violation_count, health_violation_count")
    .eq("state_code", stateCode)
    .eq("pws_activity_code", "A")
    .gt("violation_count", 0)
    .order("violation_count", { ascending: false })
    .limit(limit);

  return data || [];
}

// Contaminant name lookup from ref_code_values
export async function getContaminantName(code: string) {
  const { data } = await supabase
    .from("ref_code_values")
    .select("value_description")
    .eq("value_type", "CONTAMINANT")
    .eq("value_code", code)
    .single();
  return data?.value_description || code;
}

// Code value lookup
export async function getCodeDescription(type: string, code: string) {
  const { data } = await supabase
    .from("ref_code_values")
    .select("value_description")
    .eq("value_type", type)
    .eq("value_code", code)
    .single();
  return data?.value_description || code;
}
