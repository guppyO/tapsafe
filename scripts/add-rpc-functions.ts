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

const sql = `
-- State stats: total population for a state
CREATE OR REPLACE FUNCTION get_state_total_population(p_state_code TEXT)
RETURNS BIGINT
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(SUM(population_served), 0)::BIGINT
  FROM water_systems
  WHERE state_code = p_state_code
    AND pws_activity_code = 'A'
    AND population_served IS NOT NULL;
$$;

-- City counts for a state
CREATE OR REPLACE FUNCTION get_state_city_counts(p_state_code TEXT)
RETURNS TABLE(city_name TEXT, system_count BIGINT)
LANGUAGE sql STABLE
AS $$
  SELECT city_name, COUNT(*) as system_count
  FROM water_systems
  WHERE state_code = p_state_code
    AND pws_activity_code = 'A'
    AND city_name IS NOT NULL
  GROUP BY city_name
  ORDER BY system_count DESC;
$$;
`;

async function main() {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_ID}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    console.error(`Failed (${response.status}): ${text}`);
    process.exit(1);
  }

  console.log("✅ RPC functions created (get_state_total_population, get_state_city_counts)!");
}

main().catch(console.error);
