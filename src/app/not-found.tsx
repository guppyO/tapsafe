import Link from "next/link";
import { Droplets, Search, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <Droplets className="h-16 w-16 text-muted-foreground/30 mx-auto mb-6" />
      <h1 className="text-3xl font-bold mb-3">Page Not Found</h1>
      <p className="text-muted-foreground mb-8">
        The page you are looking for does not exist or may have been moved.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Home className="h-4 w-4" />
          Go Home
        </Link>
        <Link
          href="/search"
          className="flex items-center gap-2 px-6 py-2.5 border rounded-lg text-sm font-medium hover:bg-muted/50 transition-colors"
        >
          <Search className="h-4 w-4" />
          Search Water Systems
        </Link>
      </div>
    </div>
  );
}
