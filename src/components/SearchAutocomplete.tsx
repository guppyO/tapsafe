"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Droplets, MapPin, Users, AlertTriangle, Building2, Loader2 } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface SystemResult {
  type: "system";
  id: string;
  name: string;
  slug: string;
  city: string | null;
  state: string;
  zip: string | null;
  population: number | null;
  violations: number;
}

interface CityResult {
  type: "city";
  name: string;
  state: string;
  count: number;
  stateSlug: string;
}

interface SearchResults {
  systems: SystemResult[];
  cities: CityResult[];
}

interface SearchAutocompleteProps {
  variant?: "hero" | "page";
  defaultValue?: string;
  placeholder?: string;
}

export function SearchAutocomplete({
  variant = "hero",
  defaultValue = "",
  placeholder = "Enter ZIP code, city, or utility name...",
}: SearchAutocompleteProps) {
  const [query, setQuery] = useState(defaultValue);
  const [results, setResults] = useState<SearchResults>({ systems: [], cities: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const totalResults = results.systems.length + results.cities.length;

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults({ systems: [], cities: [] });
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      // Cancel previous request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Search failed");
        const data: SearchResults = await res.json();
        setResults(data);
        setIsOpen(data.systems.length > 0 || data.cities.length > 0);
        setActiveIndex(-1);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setResults({ systems: [], cities: [] });
          setIsOpen(false);
        }
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navigateTo = useCallback(
    (url: string) => {
      setIsOpen(false);
      router.push(url);
    },
    [router]
  );

  // Get flat list of all results for keyboard nav
  const getFlatItem = (index: number) => {
    if (index < results.cities.length) {
      return results.cities[index];
    }
    return results.systems[index - results.cities.length];
  };

  function handleSelect(item: SystemResult | CityResult) {
    if (item.type === "system") {
      navigateTo(`/water-system/${item.slug}`);
    } else {
      const citySlug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      navigateTo(`/state/${item.stateSlug}/${citySlug}`);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || totalResults === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => (prev < totalResults - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : totalResults - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0) {
          handleSelect(getFlatItem(activeIndex));
        } else {
          handleSubmit();
        }
        break;
      case "Escape":
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  }

  function handleSubmit() {
    const trimmed = query.trim();
    if (!trimmed) return;
    setIsOpen(false);
    if (/^\d{5}$/.test(trimmed)) {
      router.push(`/zip/${trimmed}`);
    } else {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  }

  const isHero = variant === "hero";

  return (
    <div className="relative w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className={
          isHero
            ? "flex flex-col sm:flex-row gap-3 max-w-lg"
            : "flex flex-col sm:flex-row gap-3"
        }
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (totalResults > 0) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            role="combobox"
            aria-label="Search water systems"
            aria-expanded={isOpen}
            aria-controls="search-listbox"
            aria-haspopup="listbox"
            aria-autocomplete="list"
            autoComplete="off"
            className={
              isHero
                ? "w-full pl-10 pr-10 h-12 text-base rounded-lg border bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 dark:bg-white/10 dark:border-white/20 dark:text-white dark:placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
                : "w-full pl-10 pr-10 py-2.5 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            }
          />
        </div>
        <button
          type="submit"
          className={
            isHero
              ? "h-12 px-8 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              : "px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          }
        >
          {isHero ? "Check Water Quality" : "Search"}
        </button>
      </form>

      {/* Autocomplete dropdown */}
      {isOpen && totalResults > 0 && (
        <div
          ref={dropdownRef}
          id="search-listbox"
          role="listbox"
          className={`absolute z-50 mt-1 w-full rounded-xl border bg-popover text-popover-foreground shadow-xl overflow-hidden ${
            isHero ? "max-w-lg" : ""
          }`}
        >
          {/* City suggestions */}
          {results.cities.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50">
                Cities
              </div>
              {results.cities.map((city, i) => (
                <button
                  key={`${city.name}-${city.state}`}
                  role="option"
                  aria-selected={activeIndex === i}
                  onClick={() => handleSelect(city)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors cursor-pointer ${
                    activeIndex === i
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">
                      {city.name}, {city.state}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {city.count} water system{city.count !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}

          {/* Water system suggestions */}
          {results.systems.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50">
                Water Systems
              </div>
              {results.systems.map((ws, i) => {
                const flatIndex = results.cities.length + i;
                return (
                  <button
                    key={ws.id}
                    role="option"
                    aria-selected={activeIndex === flatIndex}
                    onClick={() => handleSelect(ws)}
                    onMouseEnter={() => setActiveIndex(flatIndex)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors cursor-pointer ${
                      activeIndex === flatIndex
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <Droplets className="h-4 w-4 shrink-0 text-primary/60" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">{ws.name}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          {ws.city && `${ws.city}, `}
                          {ws.state}
                        </span>
                        {ws.population && (
                          <>
                            <span className="text-muted-foreground/40">|</span>
                            <span className="flex items-center gap-0.5">
                              <Users className="h-3 w-3" />
                              {formatNumber(ws.population)}
                            </span>
                          </>
                        )}
                        {ws.violations > 0 && (
                          <>
                            <span className="text-muted-foreground/40">|</span>
                            <span className="flex items-center gap-0.5 text-red-500">
                              <AlertTriangle className="h-3 w-3" />
                              {ws.violations}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* View all results footer */}
          <button
            onClick={handleSubmit}
            className="w-full px-3 py-2 text-xs text-center text-primary hover:bg-muted/50 transition-colors border-t font-medium cursor-pointer"
          >
            View all results for &ldquo;{query.trim()}&rdquo;
          </button>
        </div>
      )}
    </div>
  );
}
