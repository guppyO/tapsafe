import * as fs from "node:fs";

const PROJECT_ID = "zntfnmuozhmmqqxlzgfn";

const tokenFile = fs.readFileSync(
  "c:/Users/beres/Desktop/Websites/Supabase-Token.txt",
  "utf8"
);
let accessToken = tokenFile.trim();
if (accessToken.includes("=")) {
  accessToken = accessToken.split("=").slice(1).join("=").trim();
}

async function runQuery(query: string, label: string) {
  console.log(`Running: ${label}...`);
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
    console.error(`  FAILED (${response.status}): ${text}`);
    return false;
  }

  const result = await response.json();
  console.log(`  ✅ Done`);
  return result;
}

async function main() {
  console.log("Updating computed fields on water_systems...\n");

  // Update violation counts
  await runQuery(
    `UPDATE water_systems ws SET
      violation_count = COALESCE(v.cnt, 0),
      health_violation_count = COALESCE(v.health_cnt, 0),
      last_violation_date = v.last_date
    FROM (
      SELECT pwsid,
        COUNT(*) as cnt,
        COUNT(*) FILTER (WHERE is_health_based = true) as health_cnt,
        MAX(begin_date) as last_date
      FROM violations
      GROUP BY pwsid
    ) v
    WHERE ws.pwsid = v.pwsid`,
    "Update violation counts"
  );

  // Update last site visit date
  await runQuery(
    `UPDATE water_systems ws SET
      last_site_visit_date = sv.last_visit
    FROM (
      SELECT pwsid, MAX(visit_date) as last_visit
      FROM site_visits
      GROUP BY pwsid
    ) sv
    WHERE ws.pwsid = sv.pwsid`,
    "Update last site visit dates"
  );

  // Update lead/copper 90th percentile (most recent sample per system)
  await runQuery(
    `UPDATE water_systems ws SET
      lead_90th_percentile = lcr.lead_val,
      copper_90th_percentile = lcr.copper_val
    FROM (
      SELECT pwsid,
        MAX(CASE WHEN contaminant_code = 'PB90' THEN sample_measure END) as lead_val,
        MAX(CASE WHEN contaminant_code = 'CU90' THEN sample_measure END) as copper_val
      FROM lcr_samples
      WHERE sampling_end_date = (
        SELECT MAX(sampling_end_date) FROM lcr_samples l2 WHERE l2.pwsid = lcr_samples.pwsid
      )
      GROUP BY pwsid
    ) lcr
    WHERE ws.pwsid = lcr.pwsid`,
    "Update lead/copper 90th percentile"
  );

  // Update county_served from geographic_areas if not set
  await runQuery(
    `UPDATE water_systems ws SET
      county_served = ga.county_served
    FROM (
      SELECT DISTINCT ON (pwsid) pwsid, county_served
      FROM geographic_areas
      WHERE county_served IS NOT NULL AND county_served != ''
      ORDER BY pwsid
    ) ga
    WHERE ws.pwsid = ga.pwsid AND (ws.county_served IS NULL OR ws.county_served = '')`,
    "Update county from geographic areas"
  );

  console.log("\n✅ All computed fields updated!");
}

main().catch(console.error);
