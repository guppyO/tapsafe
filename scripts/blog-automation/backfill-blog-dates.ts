/**
 * BLOG DATE BACKFILL & YEAR UPDATE SCRIPT
 *
 * Fixes blog dates to look natural - as if posted 2x per week (Tue/Fri)
 * going BACKWARDS from today.
 *
 * Usage:
 *   cd [project-directory]
 *   npx tsx scripts/blog-automation/backfill-blog-dates.ts
 *
 * Dynamically calculates dates based on current date.
 * For 15 articles at 2/week = ~7.5 weeks of history.
 */

import fs from 'fs';
import path from 'path';

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');
const CURRENT_YEAR = new Date().getFullYear();

// ═══════════════════════════════════════════════════════════════════════════
// DATE GENERATION - Working BACKWARDS from today
// ═══════════════════════════════════════════════════════════════════════════

function generateStaggeredDates(count: number): string[] {
  const dates: string[] = [];

  const today = new Date();

  // Find the most recent Tuesday (2) or Friday (5) BEFORE today
  let currentDate = new Date(today);
  currentDate.setDate(currentDate.getDate() - 1); // Start from yesterday

  // Find the last posting day (Tue or Fri)
  while (currentDate.getDay() !== 2 && currentDate.getDay() !== 5) {
    currentDate.setDate(currentDate.getDate() - 1);
  }

  // Now generate dates going backwards
  // Pattern: Fri, Tue, Fri, Tue, Fri, Tue...
  for (let i = 0; i < count; i++) {
    dates.push(formatDate(currentDate));

    // Move to previous posting day
    const currentDay = currentDate.getDay();
    if (currentDay === 5) {
      // Friday -> go back to Tuesday (3 days)
      currentDate.setDate(currentDate.getDate() - 3);
    } else {
      // Tuesday -> go back to Friday (4 days)
      currentDate.setDate(currentDate.getDate() - 4);
    }
  }

  // Reverse so oldest is first (for display purposes - newest first on blog)
  return dates.reverse();
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// YEAR UPDATE IN TITLES AND CONTENT
// ═══════════════════════════════════════════════════════════════════════════

function updateYearReferences(content: string): string {
  // Split into frontmatter and body to avoid changing dates
  const parts = content.split('---');
  if (parts.length < 3) return content;

  const frontmatter = parts[1]; // Keep frontmatter as-is (dates are there)
  let body = parts.slice(2).join('---');

  // Only replace years in the BODY (title, headings, paragraphs), not in dates
  body = body.replace(/\b2025\b/g, String(CURRENT_YEAR));

  // For 2024 in titles that imply "current" analysis
  body = body.replace(/\bThe 2024 (State|Guide|Report|Analysis|Index)/gi,
    `The ${CURRENT_YEAR} $1`);
  body = body.replace(/\b2024 (State|Guide|Report|Analysis|Index)/gi,
    `${CURRENT_YEAR} $1`);

  // Also update title in frontmatter if it has outdated years
  let updatedFrontmatter = frontmatter
    .replace(/title:\s*["']([^"']*?)2025([^"']*)["']/g, `title: "$1${CURRENT_YEAR}$2"`)
    .replace(/title:\s*["']([^"']*?)The 2024 ([^"']*)["']/g, `title: "The ${CURRENT_YEAR} $2"`);

  return `---${updatedFrontmatter}---${body}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// FRONTMATTER PARSING AND UPDATING
// ═══════════════════════════════════════════════════════════════════════════

function updateFrontmatter(content: string, newDate: string): string {
  let updated = content.replace(
    /publishedAt:\s*["']?\d{4}-\d{2}-\d{2}["']?/,
    `publishedAt: "${newDate}"`
  );

  return updated.replace(
    /updatedAt:\s*["']?\d{4}-\d{2}-\d{2}["']?/,
    `updatedAt: "${newDate}"`
  );
}

function updateSlugIfNeeded(content: string): string {
  return content
    .replace(/slug:\s*["']([^"']*?)2025([^"']*)["']/g, `slug: "$1${CURRENT_YEAR}$2"`)
    .replace(/slug:\s*["']([^"']*?)2024([^"']*)["']/g, `slug: "$1${CURRENT_YEAR}$2"`);
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXECUTION
// ═══════════════════════════════════════════════════════════════════════════

function main() {
  console.log('🔧 Blog Date Backfill Script (CORRECTED)\n');
  console.log(`📁 Blog directory: ${BLOG_DIR}`);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const now = new Date();
  console.log(`📅 Today: ${formatDate(now)} (${days[now.getDay()]})`);
  console.log(`📅 Pattern: 2 posts per week (Tuesday & Friday)\n`);

  if (!fs.existsSync(BLOG_DIR)) {
    console.log('❌ No blog directory found. Skipping.');
    return;
  }

  const files = fs.readdirSync(BLOG_DIR)
    .filter(f => f.endsWith('.mdx') || f.endsWith('.md'))
    .filter(f => f !== 'topics.json');

  if (files.length === 0) {
    console.log('❌ No blog files found. Skipping.');
    return;
  }

  console.log(`📝 Found ${files.length} blog files\n`);

  // Generate staggered dates (oldest to newest)
  const staggeredDates = generateStaggeredDates(files.length);

  console.log(`📅 Date range: ${staggeredDates[0]} to ${staggeredDates[staggeredDates.length - 1]}\n`);

  // Sort files alphabetically for consistent ordering
  files.sort();

  let updatedCount = 0;
  let yearFixCount = 0;

  files.forEach((filename, index) => {
    const filePath = path.join(BLOG_DIR, filename);
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;

    const newDate = staggeredDates[index];
    content = updateFrontmatter(content, newDate);

    const beforeYearFix = content;
    content = updateYearReferences(content);
    content = updateSlugIfNeeded(content);

    if (content !== beforeYearFix) {
      yearFixCount++;
    }

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ ${filename.slice(0, 50)}...`);
      console.log(`   📅 ${newDate}`);
      updatedCount++;
    }
  });

  // Rename files with outdated years
  console.log('\n📁 Checking for files that need renaming...');
  const currentFiles = fs.readdirSync(BLOG_DIR)
    .filter(f => f.endsWith('.mdx') || f.endsWith('.md'))
    .filter(f => f !== 'topics.json');

  let renamedCount = 0;

  currentFiles.forEach(filename => {
    if (filename.includes('2025') || filename.includes('the-2024-')) {
      const newFilename = filename
        .replace(/2025/g, String(CURRENT_YEAR))
        .replace(/the-2024-/g, `the-${CURRENT_YEAR}-`);

      if (newFilename !== filename) {
        const oldPath = path.join(BLOG_DIR, filename);
        const newPath = path.join(BLOG_DIR, newFilename);

        if (!fs.existsSync(newPath)) {
          fs.renameSync(oldPath, newPath);
          console.log(`📝 Renamed: ${filename.slice(0, 40)}...`);
          renamedCount++;
        }
      }
    }
  });

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`✅ Updated ${updatedCount} files with staggered dates`);
  console.log(`🔄 Fixed year references in ${yearFixCount} files`);
  console.log(`📁 Renamed ${renamedCount} files`);
  console.log(`📅 All dates are now BEFORE today (${formatDate(new Date())})`);
  console.log('═══════════════════════════════════════════════════════════\n');
}

main();
