"use client";

import Image from "next/image";
import { Droplets } from "lucide-react";
import { SearchAutocomplete } from "@/components/SearchAutocomplete";

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-b from-slate-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center py-16 sm:py-20 lg:py-24">
          {/* Text content */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Droplets className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium text-primary uppercase tracking-wider">
                Free EPA Water Data
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-gray-900 dark:text-white">
              Is Your Tap Water
              <br />
              <span className="text-primary">Safe to Drink?</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-lg">
              Search any ZIP code, city, or water utility to see violations, lead
              levels, and safety data from the EPA.
            </p>

            <SearchAutocomplete variant="hero" />

            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              Covering 432,000+ public water systems across all 50 states and
              territories
            </p>
          </div>

          {/* Image */}
          <div className="relative hidden lg:block">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
              <Image
                src="/images/hero-water.jpg"
                alt="Glass of clean drinking water"
                fill
                className="object-cover"
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
