import { Droplets, AlertTriangle, Shield, MapPin } from "lucide-react";

interface StatsBarProps {
  stats: {
    totalSystems: number;
    totalViolations: number;
    totalStates: number;
    healthViolations: number;
  };
}

const statItems = [
  {
    key: "totalSystems" as const,
    label: "Water Systems",
    icon: Droplets,
    format: (n: number) => n.toLocaleString(),
  },
  {
    key: "totalViolations" as const,
    label: "Violations Tracked",
    icon: AlertTriangle,
    format: (n: number) => n.toLocaleString(),
  },
  {
    key: "healthViolations" as const,
    label: "Health Violations",
    icon: Shield,
    format: (n: number) => n.toLocaleString(),
  },
  {
    key: "totalStates" as const,
    label: "States & Territories",
    icon: MapPin,
    format: (n: number) => n.toString(),
  },
];

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <section className="border-y border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {statItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.key} className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight">
                    {item.format(stats[item.key])}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
