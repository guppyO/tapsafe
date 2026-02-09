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
CREATE OR REPLACE FUNCTION get_state_system_counts()
RETURNS TABLE(state_code TEXT, system_count BIGINT)
LANGUAGE sql STABLE
AS $$
  SELECT state_code, COUNT(*) as system_count
  FROM water_systems
  WHERE pws_activity_code = 'A'
  GROUP BY state_code
  ORDER BY state_code;
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

  console.log("✅ RPC function get_state_system_counts created!");
}

main().catch(console.error);
