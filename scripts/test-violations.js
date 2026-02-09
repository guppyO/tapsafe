const { parse } = require("csv-parse/sync");
const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

const sb = createClient(
  "https://zntfnmuozhmmqqxlzgfn.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpudGZubXVvemhtbXFxeGx6Z2ZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDYxMTI1NCwiZXhwIjoyMDg2MTg3MjU0fQ.-9XX4wamftIDgyq5TclUz3pSFVZfFQgujRTpx4quOLY",
  { auth: { persistSession: false } }
);

function parseNum(val) {
  if (!val || val.trim() === "") return null;
  const n = parseFloat(val.trim());
  return isNaN(n) ? null : n;
}
function parseBool(val) {
  if (!val) return false;
  return val.trim().toUpperCase() === "Y" || val.trim() === "1";
}
function parseDate(val) {
  if (!val || val.trim() === "" || val.trim() === "00000000") return null;
  const t = val.trim();
  if (t.match(/^\d{4}-\d{2}-\d{2}/)) return t.substring(0, 10);
  if (t.match(/^\d{8}$/))
    return (
      t.substring(0, 4) + "-" + t.substring(4, 6) + "-" + t.substring(6, 8)
    );
  const parts = t.split("/");
  if (parts.length === 3) {
    const [m, d, y] = parts;
    return y + "-" + m.padStart(2, "0") + "-" + d.padStart(2, "0");
  }
  return null;
}

async function main() {
  // Read first 5 lines using readline
  const { execSync } = require("child_process");
  const firstLines = execSync('head -6 "data/SDWA_VIOLATIONS_ENFORCEMENT.csv"', { encoding: "utf8" });
  const lines = firstLines.split("\n");
  const rows = parse(lines.join("\n"), {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    relax_quotes: true,
    trim: true,
  });

  const transformed = rows.map((row) => ({
    pwsid: (row.PWSID || "").trim(),
    violation_id: (row.VIOLATION_ID || "").trim(),
    facility_id: (row.FACILITY_ID || "").trim() || null,
    contaminant_code: (row.CONTAMINANT_CODE || "").trim() || null,
    violation_code: (row.VIOLATION_CODE || "").trim() || null,
    violation_category_code: (row.VIOLATION_CATEGORY_CODE || "").trim() || null,
    is_health_based: parseBool(row.IS_HEALTH_BASED_IND),
    viol_measure: parseNum(row.VIOL_MEASURE),
    unit_of_measure: (row.UNIT_OF_MEASURE || "").trim() || null,
    federal_mcl: parseNum(row.FEDERAL_MCL),
    state_mcl: parseNum(row.STATE_MCL),
    is_major_violation: parseBool(row.IS_MAJOR_VIOL_IND),
    violation_status: (row.VIOLATION_STATUS || "").trim() || null,
    public_notification_tier:
      (row.PUBLIC_NOTIFICATION_TIER || "").trim() || null,
    rule_code: (row.RULE_CODE || "").trim() || null,
    rule_group_code: (row.RULE_GROUP_CODE || "").trim() || null,
    rule_family_code: (row.RULE_FAMILY_CODE || "").trim() || null,
    enforcement_id: (row.ENFORCEMENT_ID || "").trim() || null,
    enforcement_date: parseDate(row.ENFORCEMENT_DATE),
    enforcement_action_type_code:
      (row.ENFORCEMENT_ACTION_TYPE_CODE || "").trim() || null,
    begin_date: parseDate(row.NON_COMPL_PER_BEGIN_DATE),
    end_date: parseDate(row.NON_COMPL_PER_END_DATE),
  }));

  console.log("Sample transformed data:");
  console.log(JSON.stringify(transformed[0], null, 2));

  // Try batch insert
  console.log("\nInserting batch of " + transformed.length + " rows...");
  const { data, error } = await sb.from("violations").insert(transformed);
  console.log("Insert error:", JSON.stringify(error));

  // Check count
  const { data: countData } = await sb
    .from("violations")
    .select("*", { count: "exact", head: true });
  console.log("Current count:", countData);

  const { count } = await sb
    .from("violations")
    .select("*", { count: "exact", head: true });
  console.log("Count:", count);

  // Cleanup
  for (const t of transformed) {
    await sb
      .from("violations")
      .delete()
      .eq("pwsid", t.pwsid)
      .eq("violation_id", t.violation_id);
  }
  console.log("Cleaned up test data");
}

main().catch(console.error);
