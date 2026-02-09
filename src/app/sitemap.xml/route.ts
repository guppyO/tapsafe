import { supabase } from "@/lib/supabase";

export const revalidate = 86400;

export async function GET() {
  const { count: systemCount } = await supabase
    .from("water_systems")
    .select("*", { count: "exact", head: true });

  const { count: stateCount } = await supabase
    .from("states")
    .select("*", { count: "exact", head: true });

  const systemSitemapCount = Math.ceil((systemCount || 0) / 10000);

  const sitemaps: string[] = [];

  // Static pages sitemap
  sitemaps.push(
    `<sitemap><loc>https://tapsafe.org/sitemap/static</loc></sitemap>`
  );

  // State pages sitemap
  sitemaps.push(
    `<sitemap><loc>https://tapsafe.org/sitemap/states</loc></sitemap>`
  );

  // City pages sitemap
  sitemaps.push(
    `<sitemap><loc>https://tapsafe.org/sitemap/cities</loc></sitemap>`
  );

  // Water system sitemaps (chunked by 10K)
  for (let i = 0; i < systemSitemapCount; i++) {
    sitemaps.push(
      `<sitemap><loc>https://tapsafe.org/sitemap/systems-${i}</loc></sitemap>`
    );
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.join("\n")}
</sitemapindex>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
