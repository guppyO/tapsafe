import * as fs from "node:fs";

const PROJECT_ID = "zntfnmuozhmmqqxlzgfn";

const tokenFile = fs.readFileSync(
  "c:/Users/beres/Desktop/Websites/Supabase-Token.txt",
  "utf8"
);
// Token file may be raw token or key=value format
let accessToken = tokenFile.trim();
if (accessToken.includes("=")) {
  accessToken = accessToken.split("=").slice(1).join("=").trim();
}

if (!accessToken) {
  console.error("Could not find access token in Supabase-Token.txt");
  process.exit(1);
}

const schema = `
-- Enable pg_trgm for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ===== REFERENCE/LOOKUP TABLES =====

CREATE TABLE IF NOT EXISTS states (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  abbreviation TEXT NOT NULL,
  epa_region TEXT
);

CREATE TABLE IF NOT EXISTS contaminants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  mcl NUMERIC,
  mclg NUMERIC,
  unit TEXT,
  health_effects TEXT,
  sources TEXT,
  treatment TEXT,
  description TEXT,
  is_pfas BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS ref_code_values (
  value_type TEXT NOT NULL,
  value_code TEXT NOT NULL,
  value_description TEXT,
  PRIMARY KEY (value_type, value_code)
);

-- ===== MAIN TABLES =====

CREATE TABLE IF NOT EXISTS water_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pwsid TEXT UNIQUE NOT NULL,
  pws_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  primacy_agency_code TEXT,
  epa_region TEXT,
  pws_activity_code TEXT DEFAULT 'A',
  pws_type_code TEXT,
  gw_sw_code TEXT,
  owner_type_code TEXT,
  population_served INT DEFAULT 0,
  service_connections INT DEFAULT 0,
  primary_source_code TEXT,
  is_wholesaler BOOLEAN DEFAULT FALSE,
  is_school_or_daycare BOOLEAN DEFAULT FALSE,
  org_name TEXT,
  admin_name TEXT,
  phone_number TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city_name TEXT,
  state_code TEXT NOT NULL,
  zip_code TEXT,
  county_served TEXT,
  source_water_protection_code TEXT,
  outstanding_performer BOOLEAN DEFAULT FALSE,
  seasonal_system BOOLEAN DEFAULT FALSE,
  violation_count INT DEFAULT 0,
  health_violation_count INT DEFAULT 0,
  last_violation_date DATE,
  last_site_visit_date DATE,
  lead_90th_percentile NUMERIC,
  copper_90th_percentile NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pwsid TEXT NOT NULL,
  violation_id TEXT NOT NULL,
  facility_id TEXT,
  contaminant_code TEXT,
  violation_code TEXT,
  violation_category_code TEXT,
  is_health_based BOOLEAN DEFAULT FALSE,
  viol_measure NUMERIC,
  unit_of_measure TEXT,
  federal_mcl NUMERIC,
  state_mcl NUMERIC,
  is_major_violation BOOLEAN DEFAULT FALSE,
  violation_status TEXT,
  public_notification_tier TEXT,
  rule_code TEXT,
  rule_group_code TEXT,
  rule_family_code TEXT,
  enforcement_id TEXT,
  enforcement_date DATE,
  enforcement_action_type_code TEXT,
  begin_date DATE,
  end_date DATE,
  UNIQUE(pwsid, violation_id)
);

CREATE TABLE IF NOT EXISTS lcr_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pwsid TEXT NOT NULL,
  sample_id TEXT,
  contaminant_code TEXT,
  sample_measure NUMERIC,
  unit_of_measure TEXT,
  result_sign_code TEXT,
  sampling_start_date DATE,
  sampling_end_date DATE
);

CREATE TABLE IF NOT EXISTS site_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pwsid TEXT NOT NULL,
  visit_id TEXT,
  visit_date DATE,
  visit_reason_code TEXT,
  compliance_eval TEXT,
  treatment_eval TEXT,
  distribution_eval TEXT,
  source_water_eval TEXT,
  financial_eval TEXT,
  security_eval TEXT,
  UNIQUE(pwsid, visit_id)
);

CREATE TABLE IF NOT EXISTS geographic_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pwsid TEXT NOT NULL,
  area_type_code TEXT,
  state_served TEXT,
  county_served TEXT,
  city_served TEXT,
  zip_code_served TEXT,
  tribal_code TEXT
);
`;

const indexes = `
CREATE INDEX IF NOT EXISTS idx_ws_state ON water_systems(state_code);
CREATE INDEX IF NOT EXISTS idx_ws_city ON water_systems(city_name);
CREATE INDEX IF NOT EXISTS idx_ws_zip ON water_systems(zip_code);
CREATE INDEX IF NOT EXISTS idx_ws_county ON water_systems(county_served);
CREATE INDEX IF NOT EXISTS idx_ws_type ON water_systems(pws_type_code);
CREATE INDEX IF NOT EXISTS idx_ws_activity ON water_systems(pws_activity_code);
CREATE INDEX IF NOT EXISTS idx_ws_population ON water_systems(population_served DESC);
CREATE INDEX IF NOT EXISTS idx_ws_slug ON water_systems(slug);
CREATE INDEX IF NOT EXISTS idx_ws_violations ON water_systems(violation_count DESC);
CREATE INDEX IF NOT EXISTS idx_ws_name_trgm ON water_systems USING gin(pws_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_viol_pwsid ON violations(pwsid);
CREATE INDEX IF NOT EXISTS idx_viol_contaminant ON violations(contaminant_code);
CREATE INDEX IF NOT EXISTS idx_viol_health ON violations(is_health_based);
CREATE INDEX IF NOT EXISTS idx_viol_date ON violations(begin_date DESC);
CREATE INDEX IF NOT EXISTS idx_viol_status ON violations(violation_status);

CREATE INDEX IF NOT EXISTS idx_lcr_pwsid ON lcr_samples(pwsid);
CREATE INDEX IF NOT EXISTS idx_lcr_contaminant ON lcr_samples(contaminant_code);

CREATE INDEX IF NOT EXISTS idx_sv_pwsid ON site_visits(pwsid);
CREATE INDEX IF NOT EXISTS idx_sv_date ON site_visits(visit_date DESC);

CREATE INDEX IF NOT EXISTS idx_ga_pwsid ON geographic_areas(pwsid);
CREATE INDEX IF NOT EXISTS idx_ga_state ON geographic_areas(state_served);
CREATE INDEX IF NOT EXISTS idx_ga_city ON geographic_areas(city_served);
CREATE INDEX IF NOT EXISTS idx_ga_county ON geographic_areas(county_served);
CREATE INDEX IF NOT EXISTS idx_ga_zip ON geographic_areas(zip_code_served);
`;

async function runQuery(query: string, label: string) {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_ID}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    console.error(`${label} failed (${response.status}): ${text}`);
    return false;
  }

  console.log(`✅ ${label}`);
  return true;
}

async function main() {
  console.log("Setting up TapSafe database schema...\n");

  // Execute table creation
  const tablesOk = await runQuery(schema, "Tables created");
  if (!tablesOk) process.exit(1);

  // Execute indexes
  const indexesOk = await runQuery(indexes, "Indexes created");
  if (!indexesOk) process.exit(1);

  // Verify tables
  const verifyResponse = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_ID}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query:
          "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name",
      }),
    }
  );

  if (verifyResponse.ok) {
    const tables = await verifyResponse.json();
    console.log("\n📋 Tables in database:");
    for (const t of tables) {
      console.log(`   ✅ ${t.table_name}`);
    }
    console.log(`\n✅ Schema setup complete! (${tables.length} tables)`);
  }
}

main().catch(console.error);
