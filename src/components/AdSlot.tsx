"use client";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

const AD_HEIGHTS: Record<string, string> = {
  rectangle: "min-h-[250px]",
  leaderboard: "min-h-[90px]",
  mobile: "min-h-[100px]",
};

interface AdSlotProps {
  format?: "rectangle" | "leaderboard" | "mobile";
  slot: string;
  className?: string;
}

export function AdSlot({ format = "rectangle", slot, className = "" }: AdSlotProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "500px" }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (visible) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        // AdSense not loaded yet
      }
    }
  }, [visible]);

  return (
    <div
      ref={ref}
      className={`${AD_HEIGHTS[format]} bg-muted/30 rounded-lg overflow-hidden ${className}`}
    >
      {visible && (
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      )}
    </div>
  );
}
