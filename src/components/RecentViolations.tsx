import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface Violation {
  pwsid: string;
  violation_id: string;
  contaminant_code: string | null;
  is_health_based: boolean;
  begin_date: string | null;
  violation_status: string | null;
  system: {
    pwsid: string;
    pws_name: string;
    state_code: string;
    city_name: string | null;
    slug: string;
  } | null;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Unknown";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function RecentViolations({
  violations,
}: {
  violations: Violation[];
}) {
  if (violations.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No recent health violations found.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {violations.map((v) => (
        <Card
          key={`${v.pwsid}-${v.violation_id}`}
          className="hover:border-destructive/50 transition-colors"
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <div className="min-w-0">
                {v.system ? (
                  <Link
                    href={`/water-system/${v.system.slug}`}
                    className="text-sm font-medium hover:text-primary transition-colors line-clamp-2"
                  >
                    {v.system.pws_name}
                  </Link>
                ) : (
                  <span className="text-sm font-medium">{v.pwsid}</span>
                )}
                {v.system?.city_name && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {v.system.city_name}, {v.system.state_code}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {formatDate(v.begin_date)}
              </span>
              <Badge
                variant={
                  v.violation_status === "Resolved"
                    ? "secondary"
                    : "destructive"
                }
                className="text-xs"
              >
                {v.contaminant_code || "Violation"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
