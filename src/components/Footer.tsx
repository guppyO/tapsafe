import Link from "next/link";
import { Droplets } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const footerLinks = {
  explore: [
    { href: "/search", label: "Find Your Water System" },
    { href: "/state", label: "Browse by State" },
    { href: "/blog", label: "Water Quality Blog" },
  ],
  resources: [
    { href: "/about", label: "About TapSafe" },
    { href: "/contact", label: "Contact Us" },
    { href: "/disclaimer", label: "Disclaimer" },
  ],
  legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg mb-3">
              <Droplets className="h-5 w-5 text-primary" />
              <span className="text-foreground">
                Tap<span className="text-primary">Safe</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Free water quality data for every public water system in the
              United States. Powered by EPA SDWIS data.
            </p>
          </div>

          {/* Explore */}
          <div>
            <p className="font-semibold text-sm mb-3">Explore</p>
            <ul className="space-y-2">
              {footerLinks.explore.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <p className="font-semibold text-sm mb-3">Resources</p>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="font-semibold text-sm mb-3">Legal</p>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>
            Data sourced from the{" "}
            <a
              href="https://www.epa.gov/ground-water-and-drinking-water/safe-drinking-water-information-system-sdwis-federal-reporting"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              EPA Safe Drinking Water Information System
            </a>
            . Updated quarterly.
          </p>
          <p>&copy; {new Date().getFullYear()} TapSafe. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
