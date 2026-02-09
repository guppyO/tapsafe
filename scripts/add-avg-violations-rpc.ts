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
CREATE OR REPLACE FUNCTION get_state_avg_violations(p_state_code TEXT)
RETURNS NUMERIC
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(AVG(violation_count), 0)
  FROM water_systems
  WHERE state_code = p_state_code
    AND pws_activity_code = 'A'
    AND violation_count > 0;
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

  console.log("✅ RPC function get_state_avg_violations created!");
}

main().catch(console.error);
