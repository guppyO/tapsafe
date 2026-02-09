"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, Droplets } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    // Check if it looks like a ZIP code
    if (/^\d{5}$/.test(trimmed)) {
      router.push(`/zip/${trimmed}`);
    } else {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  }

  return (
    <section className="relative overflow-hidden bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text content */}
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-6">
              <Droplets className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium text-primary uppercase tracking-wider">
                Free EPA Water Data
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-white">
              Is Your Tap Water
              <br />
              <span className="text-primary">Safe to Drink?</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-400 mb-10 max-w-xl mx-auto lg:mx-0">
              Search any ZIP code, city, or water utility to see violations, lead
              levels, and safety data from the EPA.
            </p>

            <form
              onSubmit={handleSearch}
              className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto lg:mx-0"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Enter ZIP code, city, or utility name..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10 h-12 text-base bg-white/10 border-white/20"
                />
              </div>
              <Button type="submit" size="lg" className="h-12 px-8">
                Check Water Quality
              </Button>
            </form>

            <p className="mt-4 text-xs text-gray-500">
              Covering 432,000+ public water systems across all 50 states and
              territories
            </p>
          </div>

          {/* Right: Water glass image */}
          <div className="relative hidden lg:block">
            <div className="relative aspect-square max-w-md mx-auto">
              <Image
                src="/images/hero-water.jpg"
                alt="Glass of water being poured"
                fill
                className="object-cover rounded-2xl"
                priority
                quality={85}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
