import type { Metadata } from "next";

const SITE_NAME = "TapSafe";
const DOMAIN = "https://tapsafe.org";

export function waterSystemMetadata(ws: {
  pws_name: string;
  slug: string;
  city_name?: string | null;
  state_code: string;
  violation_count?: number | null;
  population_served?: number | null;
}): Metadata {
  const city = ws.city_name ? `${ws.city_name}, ` : "";
  const violations = ws.violation_count || 0;
  const pop = ws.population_served
    ? `serving ${ws.population_served.toLocaleString()} people`
    : "";
  const desc = `Water quality report for ${ws.pws_name} in ${city}${ws.state_code}. ${violations} violations on record${pop ? `, ${pop}` : ""}. View lead levels, contaminants, and safety data.`;

  return {
    title: `${ws.pws_name} Water Quality Report`,
    description: desc,
    alternates: { canonical: `${DOMAIN}/water-system/${ws.slug}` },
    openGraph: {
      title: `${ws.pws_name} - Water Quality Report | ${SITE_NAME}`,
      description: desc,
      url: `${DOMAIN}/water-system/${ws.slug}`,
    },
  };
}

export function stateMetadata(state: {
  name: string;
  slug: string;
  systemCount?: number;
}): Metadata {
  const count = state.systemCount
    ? `${state.systemCount.toLocaleString()} public water systems`
    : "public water systems";
  const desc = `${state.name} drinking water quality data. View violations, lead levels, and safety reports for ${count}.`;

  return {
    title: `${state.name} Water Quality`,
    description: desc,
    alternates: { canonical: `${DOMAIN}/state/${state.slug}` },
    openGraph: {
      title: `${state.name} Drinking Water Quality | ${SITE_NAME}`,
      description: desc,
      url: `${DOMAIN}/state/${state.slug}`,
    },
  };
}

export function cityMetadata(city: string, stateName: string, stateSlug: string, citySlug: string): Metadata {
  const desc = `Tap water quality data for ${city}, ${stateName}. See violation records, lead testing results, and safety ratings for local water systems.`;

  return {
    title: `${city}, ${stateName} Water Quality`,
    description: desc,
    alternates: { canonical: `${DOMAIN}/state/${stateSlug}/${citySlug}` },
    openGraph: {
      title: `${city}, ${stateName} Tap Water Quality | ${SITE_NAME}`,
      description: desc,
      url: `${DOMAIN}/state/${stateSlug}/${citySlug}`,
    },
  };
}

export function searchMetadata(): Metadata {
  return {
    title: "Search Water Systems",
    description:
      "Search any water utility, city, ZIP code, or state to find drinking water quality data, violation history, and lead test results.",
    robots: { index: false, follow: true },
  };
}

export function blogMetadata(article?: {
  title: string;
  slug: string;
  excerpt: string;
}): Metadata {
  if (!article) {
    return {
      title: "Water Quality Blog",
      description:
        "Articles about drinking water safety, contaminants, filtration, and water quality data analysis.",
      alternates: { canonical: `${DOMAIN}/blog` },
    };
  }
  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: `${DOMAIN}/blog/${article.slug}` },
    openGraph: {
      title: `${article.title} | ${SITE_NAME}`,
      description: article.excerpt,
      url: `${DOMAIN}/blog/${article.slug}`,
      type: "article",
    },
  };
}
