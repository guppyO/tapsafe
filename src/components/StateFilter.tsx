"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface StateFilterProps {
  states: { code: string; name: string }[];
  currentState: string;
}

export function StateFilter({ states, currentState }: StateFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    const state = e.target.value;
    if (state) {
      params.set("state", state);
    } else {
      params.delete("state");
    }
    params.delete("page"); // Reset pagination
    router.push(`/search?${params.toString()}`);
  }

  return (
    <select
      value={currentState}
      onChange={handleChange}
      aria-label="Filter by state"
      className="px-3 py-2.5 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
    >
      <option value="">All States</option>
      {states.map((s) => (
        <option key={s.code} value={s.code}>
          {s.name}
        </option>
      ))}
    </select>
  );
}
