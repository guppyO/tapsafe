import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number | null | undefined): string {
  if (n == null) return "N/A";
  return n.toLocaleString();
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function pwsTypeLabel(code: string | null): string {
  switch (code) {
    case "CWS": return "Community Water System";
    case "NTNCWS": return "Non-Transient Non-Community";
    case "TNCWS": return "Transient Non-Community";
    default: return code || "Unknown";
  }
}

export function waterSourceLabel(code: string | null): string {
  switch (code) {
    case "GW": return "Groundwater";
    case "SW": return "Surface Water";
    case "GU": return "Groundwater Under Influence";
    case "SWP": return "Purchased Surface Water";
    case "GWP": return "Purchased Groundwater";
    default: return code || "Unknown";
  }
}

export function ownerTypeLabel(code: string | null): string {
  switch (code) {
    case "F": return "Federal";
    case "S": return "State";
    case "L": return "Local Government";
    case "M": return "Public/Private";
    case "P": return "Private";
    case "N": return "Native American";
    default: return code || "Unknown";
  }
}

const CONTAMINANT_NAMES: Record<string, string> = {
  "0200": "Surface Water Treatment",
  "0300": "Enhanced Surface Water Treatment",
  "0400": "Disinfection Byproducts",
  "0999": "Chlorine",
  "1005": "Arsenic",
  "1020": "Chromium",
  "1025": "Fluoride",
  "1040": "Nitrate",
  "1041": "Nitrite",
  "2010": "Lindane (BHC-Gamma)",
  "2015": "Methoxychlor",
  "2020": "Toxaphene",
  "2039": "DEHP Phthalate",
  "2050": "Atrazine",
  "2065": "Heptachlor",
  "2067": "Heptachlor Epoxide",
  "2105": "2,4-D",
  "2110": "2,4,5-TP (Silvex)",
  "2326": "Pentachlorophenol",
  "2378": "1,2,4-Trichlorobenzene",
  "2380": "cis-1,2-Dichloroethylene",
  "2456": "Haloacetic Acids (HAA5)",
  "2946": "Ethylene Dibromide",
  "2950": "Total Trihalomethanes",
  "2955": "Xylenes",
  "2959": "Chlordane",
  "2964": "Dichloromethane",
  "2968": "o-Dichlorobenzene",
  "2969": "p-Dichlorobenzene",
  "2976": "Vinyl Chloride",
  "2977": "1,1-Dichloroethylene",
  "2979": "trans-1,2-Dichloroethylene",
  "2980": "1,2-Dichloroethane",
  "2981": "1,1,1-Trichloroethane",
  "2982": "Carbon Tetrachloride",
  "2983": "1,2-Dichloropropane",
  "2984": "Trichloroethylene",
  "2985": "1,1,2-Trichloroethane",
  "2987": "Tetrachloroethylene",
  "2989": "Chlorobenzene",
  "2990": "Benzene",
  "2991": "Toluene",
  "2992": "Ethylbenzene",
  "2996": "Styrene",
  "3014": "E. coli",
  "3100": "Total Coliform",
  "4006": "Combined Uranium",
  "4010": "Combined Radium",
  "5000": "Lead & Copper Rule",
  "7000": "Consumer Confidence",
  "7500": "Public Notice",
  "8000": "Revised Total Coliform",
};

export function contaminantName(code: string | null): string {
  if (!code) return "Unknown";
  return CONTAMINANT_NAMES[code] || code;
}
