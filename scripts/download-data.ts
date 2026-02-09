import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";

const DATA_DIR = path.join(__dirname, "..", "data");
const ZIP_URL = "https://echo.epa.gov/files/echodownloads/SDWA_latest_downloads.zip";
const ZIP_PATH = path.join(DATA_DIR, "SDWA_latest_downloads.zip");

async function main() {
  // Create data directory
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  console.log("Downloading EPA SDWIS data...");
  console.log(`URL: ${ZIP_URL}`);
  console.log(`Destination: ${ZIP_PATH}\n`);

  // Download using curl (available on Windows 10+)
  try {
    execSync(`curl -L -o "${ZIP_PATH}" "${ZIP_URL}"`, {
      stdio: "inherit",
      timeout: 600000, // 10 minutes
    });
  } catch (e) {
    console.error("Download failed. Trying with PowerShell...");
    execSync(
      `powershell -Command "Invoke-WebRequest -Uri '${ZIP_URL}' -OutFile '${ZIP_PATH}'"`,
      { stdio: "inherit", timeout: 600000 }
    );
  }

  const stats = fs.statSync(ZIP_PATH);
  console.log(`\nDownloaded: ${(stats.size / 1024 / 1024).toFixed(1)} MB`);

  // Extract ZIP
  console.log("\nExtracting ZIP file...");
  try {
    execSync(`powershell -Command "Expand-Archive -Path '${ZIP_PATH}' -DestinationPath '${DATA_DIR}' -Force"`, {
      stdio: "inherit",
      timeout: 300000,
    });
  } catch (e) {
    console.error("Extraction failed:", e);
    process.exit(1);
  }

  // List extracted files
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".csv"));
  console.log(`\nExtracted ${files.length} CSV files:`);
  for (const f of files) {
    const fStats = fs.statSync(path.join(DATA_DIR, f));
    console.log(`  ${f} (${(fStats.size / 1024 / 1024).toFixed(1)} MB)`);
  }

  // Count rows in main table
  console.log("\nCounting rows in key CSV files...");
  for (const f of files) {
    const filePath = path.join(DATA_DIR, f);
    let lineCount = 0;
    const content = fs.readFileSync(filePath, "utf8");
    lineCount = content.split("\n").filter((l) => l.trim().length > 0).length - 1; // minus header
    console.log(`  ${f}: ${lineCount.toLocaleString()} records`);
  }

  console.log("\n✅ Download and extraction complete!");
}

main().catch(console.error);
