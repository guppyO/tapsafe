import { createClient } from "@supabase/supabase-js";
import { parse } from "csv-parse";
import { createReadStream, readdirSync, statSync } from "node:fs";
import * as path from "node:path";

const SUPABASE_URL = "https://zntfnmuozhmmqqxlzgfn.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpudGZubXVvemhtbXFxeGx6Z2ZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDYxMTI1NCwiZXhwIjoyMDg2MTg3MjU0fQ.-9XX4wamftIDgyq5TclUz3pSFVZfFQgujRTpx4quOLY";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const BATCH_SIZE = 1000;
const DATA_DIR = path.join(__dirname, "..", "data");

// Slug generation helper
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 200);
}

// Parse boolean fields
function parseBool(val: string | undefined): boolean {
  if (!val) return false;
  return val.trim().toUpperCase() === "Y" || val.trim() === "1" || val.trim().toUpperCase() === "TRUE";
}

// Parse int safely
function parseInt2(val: string | undefined): number {
  if (!val || val.trim() === "") return 0;
  const n = parseInt(val.trim(), 10);
  return isNaN(n) ? 0 : n;
}

// Parse numeric safely
function parseNum(val: string | undefined): number | null {
  if (!val || val.trim() === "") return null;
  const n = parseFloat(val.trim());
  return isNaN(n) ? null : n;
}

// Parse date safely
function parseDate(val: string | undefined): string | null {
  if (!val || val.trim() === "" || val.trim() === "00000000") return null;
  const trimmed = val.trim();
  // Try ISO format first
  if (trimmed.match(/^\d{4}-\d{2}-\d{2}/)) return trimmed.substring(0, 10);
  // Try YYYYMMDD
  if (trimmed.match(/^\d{8}$/)) {
    return `${trimmed.substring(0, 4)}-${trimmed.substring(4, 6)}-${trimmed.substring(6, 8)}`;
  }
  // Try MM/DD/YYYY
  const parts = trimmed.split("/");
  if (parts.length === 3) {
    const [m, d, y] = parts;
    if (y && m && d) return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return null;
}

// Generic batch insert function
async function batchInsert(tableName: string, rows: any[]): Promise<number> {
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from(tableName).insert(batch);
    if (error) {
      // Try upsert for duplicate handling (updates existing with latest data)
      if (error.code === "23505") {
        const { error: upsertError } = await supabase
          .from(tableName)
          .upsert(batch, { onConflict: "pwsid" });
        if (upsertError) {
          console.error(`  Error upserting batch to ${tableName}:`, upsertError.message);
        }
      } else {
        console.error(`  Error inserting batch to ${tableName}:`, error.message);
      }
    }
    inserted += batch.length;
    if (inserted % 10000 === 0 || inserted === rows.length) {
      console.log(`  ${tableName}: ${inserted.toLocaleString()} / ${rows.length.toLocaleString()}`);
    }
  }
  return inserted;
}

// Stream and insert from CSV
async function streamInsert(
  tableName: string,
  csvFile: string,
  transformer: (row: any) => any,
  conflictColumn?: string
): Promise<number> {
  const filePath = path.join(DATA_DIR, csvFile);
  console.log(`\nIngesting ${csvFile} → ${tableName}...`);

  let batch: any[] = [];
  let totalIngested = 0;
  let skipped = 0;

  return new Promise((resolve, reject) => {
    const parser = createReadStream(filePath).pipe(
      parse({
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true,
        relax_quotes: true,
        trim: true,
      })
    );

    parser.on("data", async (row: any) => {
      try {
        const transformed = transformer(row);
        if (transformed) {
          batch.push(transformed);
        } else {
          skipped++;
        }
      } catch (e) {
        skipped++;
      }

      if (batch.length >= BATCH_SIZE) {
        parser.pause();
        const toInsert = [...batch];
        batch = [];

        try {
          const { error } = await supabase.from(tableName).insert(toInsert);
          if (error) {
            if (error.code === "23505" && conflictColumn) {
              // Upsert WITHOUT ignoreDuplicates so later records (newer quarters) UPDATE existing
              await supabase
                .from(tableName)
                .upsert(toInsert, { onConflict: conflictColumn });
            } else if (error.code === "23505") {
              // No conflict column defined - skip duplicates silently
            } else {
              console.error(`  Error: ${error.message}`);
            }
          }
          totalIngested += toInsert.length;
          if (totalIngested % 10000 === 0) {
            console.log(`  ${tableName}: ${totalIngested.toLocaleString()} ingested...`);
          }
        } catch (e: any) {
          console.error(`  Batch error: ${e.message}`);
        }

        parser.resume();
      }
    });

    parser.on("end", async () => {
      // Flush remaining batch
      if (batch.length > 0) {
        try {
          const { error } = await supabase.from(tableName).insert(batch);
          if (error && error.code === "23505" && conflictColumn) {
            await supabase
              .from(tableName)
              .upsert(batch, { onConflict: conflictColumn });
          } else if (error && error.code !== "23505") {
            console.error(`  Final batch error: ${error.message}`);
          }
          totalIngested += batch.length;
        } catch (e: any) {
          console.error(`  Final batch error: ${e.message}`);
        }
      }
      console.log(`  ✅ ${tableName}: ${totalIngested.toLocaleString()} ingested, ${skipped} skipped`);
      resolve(totalIngested);
    });

    parser.on("error", (err: any) => {
      console.error(`  ⚠️ CSV parse error at line ${err.lines || "?"}: ${err.message}`);
      console.error(`  Continuing with ${totalIngested.toLocaleString()} records ingested so far...`);
      // Flush remaining batch instead of crashing
      if (batch.length > 0) {
        supabase.from(tableName).insert(batch).then(({ error }) => {
          if (error && error.code === "23505" && conflictColumn) {
            supabase.from(tableName).upsert(batch, { onConflict: conflictColumn });
          }
          totalIngested += batch.length;
          console.log(`  ✅ ${tableName}: ${totalIngested.toLocaleString()} ingested (partial - parse error), ${skipped} skipped`);
          resolve(totalIngested);
        });
      } else {
        console.log(`  ✅ ${tableName}: ${totalIngested.toLocaleString()} ingested (partial - parse error), ${skipped} skipped`);
        resolve(totalIngested);
      }
    });
  });
}

// ===== TABLE-SPECIFIC TRANSFORMERS =====

function transformWaterSystem(row: any) {
  const pwsid = (row.PWSID || "").trim();
  const name = (row.PWS_NAME || "").trim();
  if (!pwsid || !name) return null;

  const stateCode = (row.STATE_CODE || row.PRIMACY_AGENCY_CODE || "").trim().substring(0, 2);
  if (!stateCode) return null;

  return {
    pwsid,
    pws_name: name,
    slug: slugify(`${pwsid}-${name}`),
    primacy_agency_code: (row.PRIMACY_AGENCY_CODE || "").trim() || null,
    epa_region: (row.EPA_REGION || "").trim() || null,
    pws_activity_code: (row.PWS_ACTIVITY_CODE || "A").trim(),
    pws_type_code: (row.PWS_TYPE_CODE || "").trim() || null,
    gw_sw_code: (row.GW_SW_CODE || "").trim() || null,
    owner_type_code: (row.OWNER_TYPE_CODE || "").trim() || null,
    population_served: parseInt2(row.POPULATION_SERVED_COUNT),
    service_connections: parseInt2(row.SERVICE_CONNECTIONS_COUNT),
    primary_source_code: (row.PRIMARY_SOURCE_CODE || "").trim() || null,
    is_wholesaler: parseBool(row.IS_WHOLESALER_IND),
    is_school_or_daycare: parseBool(row.IS_SCHOOL_OR_DAYCARE_IND),
    org_name: (row.ORG_NAME || "").trim() || null,
    admin_name: (row.ADMIN_NAME || "").trim() || null,
    phone_number: (row.PHONE_NUMBER || "").trim() || null,
    address_line1: (row.ADDRESS_LINE1 || "").trim() || null,
    address_line2: (row.ADDRESS_LINE2 || "").trim() || null,
    city_name: (row.CITY_NAME || "").trim() || null,
    state_code: stateCode,
    zip_code: (row.ZIP_CODE || "").trim() || null,
    county_served: (row.COUNTY_SERVED || "").trim() || null,
    source_water_protection_code: (row.SOURCE_WATER_PROTECTION_CODE || "").trim() || null,
    outstanding_performer: parseBool(row.OUTSTANDING_PERFORMER),
    seasonal_system: parseBool(row.SEASONAL_STARTUP_SYSTEM),
  };
}

function transformViolation(row: any) {
  const pwsid = (row.PWSID || "").trim();
  const violationId = (row.VIOLATION_ID || "").trim();
  if (!pwsid || !violationId) return null;

  return {
    pwsid,
    violation_id: violationId,
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
    public_notification_tier: (row.PUBLIC_NOTIFICATION_TIER || "").trim() || null,
    rule_code: (row.RULE_CODE || "").trim() || null,
    rule_group_code: (row.RULE_GROUP_CODE || "").trim() || null,
    rule_family_code: (row.RULE_FAMILY_CODE || "").trim() || null,
    enforcement_id: (row.ENFORCEMENT_ID || "").trim() || null,
    enforcement_date: parseDate(row.ENFORCEMENT_DATE),
    enforcement_action_type_code: (row.ENFORCEMENT_ACTION_TYPE_CODE || "").trim() || null,
    begin_date: parseDate(row.NON_COMPL_PER_BEGIN_DATE),
    end_date: parseDate(row.NON_COMPL_PER_END_DATE),
  };
}

// Track seen LCR samples to deduplicate across quarterly snapshots
const seenLcrSamples = new Set<string>();
function transformLcrSample(row: any) {
  const pwsid = (row.PWSID || "").trim();
  if (!pwsid) return null;

  // Deduplicate by SAR_ID (unique sample analytical result) or composite key
  const sarId = (row.SAR_ID || "").trim();
  const key = sarId || `${pwsid}|${(row.CONTAMINANT_CODE || "").trim()}|${(row.SAMPLING_END_DATE || "").trim()}|${(row.SAMPLE_MEASURE || "").trim()}`;
  if (seenLcrSamples.has(key)) return null;
  seenLcrSamples.add(key);

  return {
    pwsid,
    sample_id: (row.SAMPLE_ID || "").trim() || null,
    contaminant_code: (row.CONTAMINANT_CODE || "").trim() || null,
    sample_measure: parseNum(row.SAMPLE_MEASURE),
    unit_of_measure: (row.UNIT_OF_MEASURE || "").trim() || null,
    result_sign_code: (row.RESULT_SIGN_CODE || "").trim() || null,
    sampling_start_date: parseDate(row.SAMPLING_START_DATE),
    sampling_end_date: parseDate(row.SAMPLING_END_DATE),
  };
}

function transformSiteVisit(row: any) {
  const pwsid = (row.PWSID || "").trim();
  const visitId = (row.VISIT_ID || "").trim();
  if (!pwsid || !visitId) return null;

  return {
    pwsid,
    visit_id: visitId,
    visit_date: parseDate(row.VISIT_DATE),
    visit_reason_code: (row.VISIT_REASON_CODE || "").trim() || null,
    compliance_eval: (row.COMPLIANCE_EVAL_CODE || "").trim() || null,
    treatment_eval: (row.TREATMENT_EVAL_CODE || "").trim() || null,
    distribution_eval: (row.DISTRIBUTION_EVAL_CODE || "").trim() || null,
    source_water_eval: (row.SOURCE_WATER_EVAL_CODE || "").trim() || null,
    financial_eval: (row.FINANCIAL_EVAL_CODE || "").trim() || null,
    security_eval: (row.SECURITY_EVAL_CODE || "").trim() || null,
  };
}

// Track seen geographic areas to deduplicate across quarterly snapshots
const seenGeoAreas = new Set<string>();
function transformGeographicArea(row: any) {
  const pwsid = (row.PWSID || "").trim();
  if (!pwsid) return null;

  // Deduplicate by composite key
  const key = `${pwsid}|${(row.AREA_TYPE_CODE || "").trim()}|${(row.STATE_SERVED || "").trim()}|${(row.COUNTY_SERVED || "").trim()}|${(row.CITY_SERVED || "").trim()}|${(row.ZIP_CODE_SERVED || "").trim()}`;
  if (seenGeoAreas.has(key)) return null;
  seenGeoAreas.add(key);

  return {
    pwsid,
    area_type_code: (row.AREA_TYPE_CODE || "").trim() || null,
    state_served: (row.STATE_SERVED || "").trim() || null,
    county_served: (row.COUNTY_SERVED || "").trim() || null,
    city_served: (row.CITY_SERVED || "").trim() || null,
    zip_code_served: (row.ZIP_CODE_SERVED || "").trim() || null,
    tribal_code: (row.TRIBAL_CODE || "").trim() || null,
  };
}

function transformRefCodeValues(row: any) {
  const valueType = (row.VALUE_TYPE || "").trim();
  const valueCode = (row.VALUE_CODE || "").trim();
  if (!valueType || !valueCode) return null;

  return {
    value_type: valueType,
    value_code: valueCode,
    value_description: (row.VALUE_DESCRIPTION || "").trim() || null,
  };
}

// US States data for lookup table
const US_STATES = [
  { code: "AL", name: "Alabama", slug: "alabama", abbreviation: "AL", epa_region: "4" },
  { code: "AK", name: "Alaska", slug: "alaska", abbreviation: "AK", epa_region: "10" },
  { code: "AZ", name: "Arizona", slug: "arizona", abbreviation: "AZ", epa_region: "9" },
  { code: "AR", name: "Arkansas", slug: "arkansas", abbreviation: "AR", epa_region: "6" },
  { code: "CA", name: "California", slug: "california", abbreviation: "CA", epa_region: "9" },
  { code: "CO", name: "Colorado", slug: "colorado", abbreviation: "CO", epa_region: "8" },
  { code: "CT", name: "Connecticut", slug: "connecticut", abbreviation: "CT", epa_region: "1" },
  { code: "DE", name: "Delaware", slug: "delaware", abbreviation: "DE", epa_region: "3" },
  { code: "FL", name: "Florida", slug: "florida", abbreviation: "FL", epa_region: "4" },
  { code: "GA", name: "Georgia", slug: "georgia", abbreviation: "GA", epa_region: "4" },
  { code: "HI", name: "Hawaii", slug: "hawaii", abbreviation: "HI", epa_region: "9" },
  { code: "ID", name: "Idaho", slug: "idaho", abbreviation: "ID", epa_region: "10" },
  { code: "IL", name: "Illinois", slug: "illinois", abbreviation: "IL", epa_region: "5" },
  { code: "IN", name: "Indiana", slug: "indiana", abbreviation: "IN", epa_region: "5" },
  { code: "IA", name: "Iowa", slug: "iowa", abbreviation: "IA", epa_region: "7" },
  { code: "KS", name: "Kansas", slug: "kansas", abbreviation: "KS", epa_region: "7" },
  { code: "KY", name: "Kentucky", slug: "kentucky", abbreviation: "KY", epa_region: "4" },
  { code: "LA", name: "Louisiana", slug: "louisiana", abbreviation: "LA", epa_region: "6" },
  { code: "ME", name: "Maine", slug: "maine", abbreviation: "ME", epa_region: "1" },
  { code: "MD", name: "Maryland", slug: "maryland", abbreviation: "MD", epa_region: "3" },
  { code: "MA", name: "Massachusetts", slug: "massachusetts", abbreviation: "MA", epa_region: "1" },
  { code: "MI", name: "Michigan", slug: "michigan", abbreviation: "MI", epa_region: "5" },
  { code: "MN", name: "Minnesota", slug: "minnesota", abbreviation: "MN", epa_region: "5" },
  { code: "MS", name: "Mississippi", slug: "mississippi", abbreviation: "MS", epa_region: "4" },
  { code: "MO", name: "Missouri", slug: "missouri", abbreviation: "MO", epa_region: "7" },
  { code: "MT", name: "Montana", slug: "montana", abbreviation: "MT", epa_region: "8" },
  { code: "NE", name: "Nebraska", slug: "nebraska", abbreviation: "NE", epa_region: "7" },
  { code: "NV", name: "Nevada", slug: "nevada", abbreviation: "NV", epa_region: "9" },
  { code: "NH", name: "New Hampshire", slug: "new-hampshire", abbreviation: "NH", epa_region: "1" },
  { code: "NJ", name: "New Jersey", slug: "new-jersey", abbreviation: "NJ", epa_region: "2" },
  { code: "NM", name: "New Mexico", slug: "new-mexico", abbreviation: "NM", epa_region: "6" },
  { code: "NY", name: "New York", slug: "new-york", abbreviation: "NY", epa_region: "2" },
  { code: "NC", name: "North Carolina", slug: "north-carolina", abbreviation: "NC", epa_region: "4" },
  { code: "ND", name: "North Dakota", slug: "north-dakota", abbreviation: "ND", epa_region: "8" },
  { code: "OH", name: "Ohio", slug: "ohio", abbreviation: "OH", epa_region: "5" },
  { code: "OK", name: "Oklahoma", slug: "oklahoma", abbreviation: "OK", epa_region: "6" },
  { code: "OR", name: "Oregon", slug: "oregon", abbreviation: "OR", epa_region: "10" },
  { code: "PA", name: "Pennsylvania", slug: "pennsylvania", abbreviation: "PA", epa_region: "3" },
  { code: "RI", name: "Rhode Island", slug: "rhode-island", abbreviation: "RI", epa_region: "1" },
  { code: "SC", name: "South Carolina", slug: "south-carolina", abbreviation: "SC", epa_region: "4" },
  { code: "SD", name: "South Dakota", slug: "south-dakota", abbreviation: "SD", epa_region: "8" },
  { code: "TN", name: "Tennessee", slug: "tennessee", abbreviation: "TN", epa_region: "4" },
  { code: "TX", name: "Texas", slug: "texas", abbreviation: "TX", epa_region: "6" },
  { code: "UT", name: "Utah", slug: "utah", abbreviation: "UT", epa_region: "8" },
  { code: "VT", name: "Vermont", slug: "vermont", abbreviation: "VT", epa_region: "1" },
  { code: "VA", name: "Virginia", slug: "virginia", abbreviation: "VA", epa_region: "3" },
  { code: "WA", name: "Washington", slug: "washington", abbreviation: "WA", epa_region: "10" },
  { code: "WV", name: "West Virginia", slug: "west-virginia", abbreviation: "WV", epa_region: "3" },
  { code: "WI", name: "Wisconsin", slug: "wisconsin", abbreviation: "WI", epa_region: "5" },
  { code: "WY", name: "Wyoming", slug: "wyoming", abbreviation: "WY", epa_region: "8" },
  { code: "DC", name: "District of Columbia", slug: "district-of-columbia", abbreviation: "DC", epa_region: "3" },
  { code: "AS", name: "American Samoa", slug: "american-samoa", abbreviation: "AS", epa_region: "9" },
  { code: "GU", name: "Guam", slug: "guam", abbreviation: "GU", epa_region: "9" },
  { code: "MP", name: "Northern Mariana Islands", slug: "northern-mariana-islands", abbreviation: "MP", epa_region: "9" },
  { code: "PR", name: "Puerto Rico", slug: "puerto-rico", abbreviation: "PR", epa_region: "2" },
  { code: "VI", name: "US Virgin Islands", slug: "us-virgin-islands", abbreviation: "VI", epa_region: "2" },
];

// Find CSV files
function findCsvFile(pattern: string): string | null {
  const files = readdirSync(DATA_DIR);
  const match = files.find((f) =>
    f.toUpperCase().includes(pattern.toUpperCase()) && f.endsWith(".csv")
  );
  return match || null;
}

async function main() {
  console.log("═══════════════════════════════════════════════");
  console.log("  TapSafe Data Ingestion");
  console.log("═══════════════════════════════════════════════\n");

  // Support --skip-to argument to resume from a specific step
  const skipToArg = process.argv.find(a => a.startsWith("--skip-to="));
  const skipTo = skipToArg ? parseInt(skipToArg.split("=")[1]) : 0;
  if (skipTo > 0) console.log(`Skipping to step ${skipTo}...\n`);

  // Check data directory
  const csvFiles = readdirSync(DATA_DIR).filter((f) => f.endsWith(".csv"));
  if (csvFiles.length === 0) {
    console.error("No CSV files found in data/. Run download-data.ts first.");
    process.exit(1);
  }
  console.log(`Found ${csvFiles.length} CSV files:\n`);
  for (const f of csvFiles) {
    const size = statSync(path.join(DATA_DIR, f)).size;
    console.log(`  ${f} (${(size / 1024 / 1024).toFixed(1)} MB)`);
  }

  // 1. Insert states lookup
  if (skipTo <= 1) {
    console.log("\n\n1️⃣  Inserting states lookup...");
    const { error: statesError } = await supabase
      .from("states")
      .upsert(US_STATES, { onConflict: "code", ignoreDuplicates: true });
    if (statesError) console.error("States error:", statesError.message);
    else console.log(`  ✅ States: ${US_STATES.length} inserted`);
  }

  // 2. Insert ref_code_values
  if (skipTo <= 2) {
    const refFile = findCsvFile("REF_CODE_VALUES");
    if (refFile) {
      console.log("\n2️⃣  Inserting reference code values...");
      await streamInsert("ref_code_values", refFile, transformRefCodeValues, "value_type,value_code");
    }
  }

  // 3. Insert water systems (main table)
  if (skipTo <= 3) {
    const wsFile = findCsvFile("PUB_WATER_SYSTEMS");
    if (wsFile) {
      console.log("\n3️⃣  Inserting water systems (main table)...");
      await streamInsert("water_systems", wsFile, transformWaterSystem, "pwsid");
    }
  }

  // 4. Insert violations
  if (skipTo <= 4) {
    const violFile = findCsvFile("VIOLATIONS_ENFORCEMENT");
    if (violFile) {
      console.log("\n4️⃣  Inserting violations & enforcement...");
      await streamInsert("violations", violFile, transformViolation, "pwsid,violation_id");
    }
  }

  // 5. Insert LCR samples
  if (skipTo <= 5) {
    const lcrFile = findCsvFile("LCR_SAMPLE");
    if (lcrFile) {
      console.log("\n5️⃣  Inserting lead/copper samples...");
      await streamInsert("lcr_samples", lcrFile, transformLcrSample);
    }
  }

  // 6. Insert site visits
  if (skipTo <= 6) {
    const svFile = findCsvFile("SITE_VISITS");
    if (svFile) {
      console.log("\n6️⃣  Inserting site visits...");
      await streamInsert("site_visits", svFile, transformSiteVisit, "pwsid,visit_id");
    }
  }

  // 7. Insert geographic areas
  if (skipTo <= 7) {
    const gaFile = findCsvFile("GEOGRAPHIC_AREAS");
    if (gaFile) {
      console.log("\n7️⃣  Inserting geographic areas...");
      await streamInsert("geographic_areas", gaFile, transformGeographicArea);
    }
  }

  // 8. Update computed fields on water_systems
  console.log("\n8️⃣  Updating computed fields (violation counts, etc.)...");
  // This will be done via SQL after ingestion

  console.log("\n═══════════════════════════════════════════════");
  console.log("  ✅ Ingestion Complete!");
  console.log("═══════════════════════════════════════════════");
  console.log("\nRun verification queries to confirm counts.");
}

main().catch(console.error);
