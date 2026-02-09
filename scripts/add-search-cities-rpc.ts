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
CREATE OR REPLACE FUNCTION search_cities(p_query TEXT)
RETURNS TABLE(city_name TEXT, state_code TEXT, system_count BIGINT, state_slug TEXT)
LANGUAGE sql STABLE
AS $$
  SELECT
    ws.city_name,
    ws.state_code,
    COUNT(*) AS system_count,
    s.slug AS state_slug
  FROM water_systems ws
  JOIN states s ON s.code = ws.state_code
  WHERE ws.pws_activity_code = 'A'
    AND ws.city_name IS NOT NULL
    AND ws.city_name ILIKE '%' || p_query || '%'
  GROUP BY ws.city_name, ws.state_code, s.slug
  ORDER BY COUNT(*) DESC
  LIMIT 4;
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

  console.log("✅ search_cities RPC function created");
}

main().catch(console.error);
