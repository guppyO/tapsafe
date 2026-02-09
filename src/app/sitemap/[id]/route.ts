import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

export const revalidate = 86400;

const DOMAIN = "https://tapsafe.org";
const URLS_PER_SITEMAP = 10000;

function urlEntry(loc: string, lastmod?: string, priority?: string) {
  return `<url><loc>${loc}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}${priority ? `<priority>${priority}</priority>` : ""}</url>`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let urls: string[] = [];

  if (id === "static") {
    urls = [
      urlEntry(`${DOMAIN}/`, undefined, "1.0"),
      urlEntry(`${DOMAIN}/search`, undefined, "0.8"),
      urlEntry(`${DOMAIN}/state`, undefined, "0.9"),
      urlEntry(`${DOMAIN}/blog`, undefined, "0.7"),
      urlEntry(`${DOMAIN}/about`, undefined, "0.5"),
      urlEntry(`${DOMAIN}/contact`, undefined, "0.4"),
      urlEntry(`${DOMAIN}/privacy`, undefined, "0.3"),
      urlEntry(`${DOMAIN}/terms`, undefined, "0.3"),
      urlEntry(`${DOMAIN}/disclaimer`, undefined, "0.3"),
    ];
  } else if (id === "states") {
    const { data } = await supabase.from("states").select("slug");
    urls = (data || []).map((s) => urlEntry(`${DOMAIN}/state/${s.slug}`, undefined, "0.9"));
  } else if (id === "cities") {
    const { data } = await supabase
      .from("geographic_areas")
      .select("city_served, state_served")
      .eq("area_type_code", "CT")
      .not("city_served", "is", null)
      .not("state_served", "is", null)
      .limit(URLS_PER_SITEMAP);

    const seen = new Set<string>();
    for (const row of data || []) {
      const stateSlug = row.state_served?.toLowerCase();
      const citySlug = row.city_served
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const key = `${stateSlug}/${citySlug}`;
      if (!seen.has(key) && stateSlug && citySlug) {
        seen.add(key);
        urls.push(urlEntry(`${DOMAIN}/state/${stateSlug}/${citySlug}`, undefined, "0.7"));
      }
    }
  } else if (id.startsWith("systems-")) {
    const page = parseInt(id.replace("systems-", ""));
    const offset = page * URLS_PER_SITEMAP;

    const { data } = await supabase
      .from("water_systems")
      .select("slug, updated_at")
      .order("pwsid")
      .range(offset, offset + URLS_PER_SITEMAP - 1);

    urls = (data || []).map((ws) =>
      urlEntry(
        `${DOMAIN}/water-system/${ws.slug}`,
        ws.updated_at ? new Date(ws.updated_at).toISOString().split("T")[0] : undefined,
        "0.6"
      )
    );
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
