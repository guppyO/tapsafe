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
