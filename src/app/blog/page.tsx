import Link from "next/link";
import type { Metadata } from "next";
import { Calendar, User, Tag } from "lucide-react";
import { getAllPosts } from "@/lib/blog";
import { blogMetadata } from "@/lib/metadata";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = blogMetadata();

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="max-w-4xl mx-auto px-4">
      <Breadcrumbs items={[{ label: "Blog" }]} />

      <h1 className="text-2xl md:text-3xl font-bold mb-2">Water Quality Blog</h1>
      <p className="text-muted-foreground mb-8">
        Articles about drinking water safety, contaminants, filtration, and how to read your water quality data.
      </p>

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Articles coming soon. Check back shortly.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <Card key={post.slug} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(post.publishedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {post.author}
                  </span>
                  {post.category && (
                    <Badge variant="outline" className="text-xs">
                      {post.category}
                    </Badge>
                  )}
                </div>

                <Link href={`/blog/${post.slug}`}>
                  <h2 className="text-xl font-semibold hover:text-primary transition-colors mb-2">
                    {post.title}
                  </h2>
                </Link>

                <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                  {post.excerpt}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex gap-1.5">
                    {post.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    Read more
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
