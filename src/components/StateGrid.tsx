import Link from "next/link";

interface State {
  code: string;
  name: string;
  slug: string;
  abbreviation: string;
}

export function StateGrid({ states }: { states: State[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {states.map((state) => (
        <Link
          key={state.code}
          href={`/state/${state.slug}`}
          className="group flex items-center gap-2 rounded-lg border border-border bg-card p-3 hover:border-primary/50 hover:bg-primary/5 transition-all"
        >
          <span className="text-xs font-bold text-primary bg-primary/10 rounded px-1.5 py-0.5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            {state.abbreviation}
          </span>
          <span className="text-sm font-medium truncate">{state.name}</span>
        </Link>
      ))}
    </div>
  );
}
