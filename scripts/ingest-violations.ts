import { createClient } from "@supabase/supabase-js";
import { parse } from "csv-parse";
import { createReadStream } from "node:fs";
import * as path from "node:path";

const SUPABASE_URL = "https://zntfnmuozhmmqqxlzgfn.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpudGZubXVvemhtbXFxeGx6Z2ZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDYxMTI1NCwiZXhwIjoyMDg2MTg3MjU0fQ.-9XX4wamftIDgyq5TclUz3pSFVZfFQgujRTpx4quOLY";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const BATCH_SIZE = 500; // Smaller batches for reliability
const DATA_DIR = path.join(__dirname, "..", "data");

function parseNum(val: string | undefined): number | null {
  if (!val || val.trim() === "") return null;
  const n = parseFloat(val.trim());
  return isNaN(n) ? null : n;
}
function parseBool(val: string | undefined): boolean {
  if (!val) return false;
  return val.trim().toUpperCase() === "Y" || val.trim() === "1";
}
function parseDate(val: string | undefined): string | null {
  if (!val || val.trim() === "" || val.trim() === "00000000") return null;
  const trimmed = val.trim();
  if (trimmed.match(/^\d{4}-\d{2}-\d{2}/)) return trimmed.substring(0, 10);
  if (trimmed.match(/^\d{8}$/)) {
    return `${trimmed.substring(0, 4)}-${trimmed.substring(4, 6)}-${trimmed.substring(6, 8)}`;
  }
  const parts = trimmed.split("/");
  if (parts.length === 3) {
    const [m, d, y] = parts;
    if (y && m && d)
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return null;
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
    violation_category_code:
      (row.VIOLATION_CATEGORY_CODE || "").trim() || null,
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
  };
}

async function insertBatch(
  batch: any[],
  batchNum: number
): Promise<{ success: number; failed: number }> {
  // Deduplicate within batch (keep last occurrence of each key)
  const deduped = new Map<string, any>();
  for (const row of batch) {
    deduped.set(`${row.pwsid}|${row.violation_id}`, row);
  }
  const uniqueBatch = Array.from(deduped.values());

  // Try upsert directly (handles both new and existing rows)
  const { error } = await supabase
    .from("violations")
    .upsert(uniqueBatch, { onConflict: "pwsid,violation_id" });

  if (error) {
    console.error(
      `  Batch ${batchNum} FAILED: [${error.code}] ${error.message.substring(0, 200)}`
    );
    // Try inserting in smaller chunks
    let success = 0;
    const chunkSize = 100;
    for (let i = 0; i < uniqueBatch.length; i += chunkSize) {
      const chunk = uniqueBatch.slice(i, i + chunkSize);
      const { error: chunkError } = await supabase
        .from("violations")
        .upsert(chunk, { onConflict: "pwsid,violation_id" });
      if (chunkError) {
        // Try one by one
        for (const row of chunk) {
          const { error: singleError } = await supabase
            .from("violations")
            .upsert(row, { onConflict: "pwsid,violation_id" });
          if (!singleError) success++;
        }
      } else {
        success += chunk.length;
      }
    }
    return { success, failed: uniqueBatch.length - success };
  }

  return { success: uniqueBatch.length, failed: 0 };
}

async function main() {
  console.log("═══════════════════════════════════════════════");
  console.log("  TapSafe Violations Ingestion (Dedicated)");
  console.log("═══════════════════════════════════════════════\n");

  // First, clear dead tuples
  console.log("Clearing existing violations (clean slate)...");
  // Delete in batches to avoid timeouts
  let deleted = 0;
  while (true) {
    const { data, error } = await supabase
      .from("violations")
      .select("id")
      .limit(10000);
    if (error || !data || data.length === 0) break;
    const ids = data.map((d: any) => d.id);
    await supabase.from("violations").delete().in("id", ids);
    deleted += ids.length;
    if (deleted % 50000 === 0) console.log(`  Deleted ${deleted}...`);
  }
  console.log(`  Cleared ${deleted} existing rows\n`);

  const csvFile = "SDWA_VIOLATIONS_ENFORCEMENT.csv";
  const filePath = path.join(DATA_DIR, csvFile);
  console.log(`Ingesting ${csvFile}...`);
  console.log(`Batch size: ${BATCH_SIZE}\n`);

  let batch: any[] = [];
  let totalSuccess = 0;
  let totalFailed = 0;
  let skipped = 0;
  let batchNum = 0;
  let processing = false;

  return new Promise<void>((resolve, reject) => {
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
        const transformed = transformViolation(row);
        if (transformed) {
          batch.push(transformed);
        } else {
          skipped++;
        }
      } catch (e) {
        skipped++;
      }

      if (batch.length >= BATCH_SIZE && !processing) {
        processing = true;
        parser.pause();
        const toInsert = [...batch];
        batch = [];
        batchNum++;

        const result = await insertBatch(toInsert, batchNum);
        totalSuccess += result.success;
        totalFailed += result.failed;

        if ((totalSuccess + totalFailed) % 10000 < BATCH_SIZE) {
          console.log(
            `  Progress: ${(totalSuccess + totalFailed).toLocaleString()} processed, ${totalSuccess.toLocaleString()} success, ${totalFailed.toLocaleString()} failed`
          );
        }

        processing = false;
        parser.resume();
      }
    });

    parser.on("end", async () => {
      // Flush remaining
      if (batch.length > 0) {
        batchNum++;
        const result = await insertBatch(batch, batchNum);
        totalSuccess += result.success;
        totalFailed += result.failed;
      }
      console.log(
        `\n✅ Violations: ${totalSuccess.toLocaleString()} success, ${totalFailed.toLocaleString()} failed, ${skipped} skipped`
      );
      resolve();
    });

    parser.on("error", async (err: any) => {
      console.error(`\n⚠️ CSV parse error at line ${err.lines || "?"}: ${err.message}`);
      // Flush remaining batch
      if (batch.length > 0) {
        batchNum++;
        const result = await insertBatch(batch, batchNum);
        totalSuccess += result.success;
        totalFailed += result.failed;
      }
      console.log(
        `\n✅ Violations (partial): ${totalSuccess.toLocaleString()} success, ${totalFailed.toLocaleString()} failed, ${skipped} skipped`
      );
      resolve();
    });
  });
}

main().catch(console.error);
