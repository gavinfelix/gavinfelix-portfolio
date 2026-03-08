import Link from "next/link";
import { getAllPosts } from "@/lib/mdx";

export default async function Home() {
  const allPosts = getAllPosts();
  const recentPosts = allPosts.slice(0, 5);
  const algorithmPosts = allPosts
    .filter((post) => (post.frontmatter as { type?: string }).type === "algorithm")
    .slice(0, 5);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12 sm:py-16">
        {/* Hero */}
        <section className="mb-16 sm:mb-20">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-2">
            Gavin Felix Sun
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-4">
            Software Engineer · AI · Web Development
          </p>
          <p className="text-neutral-600 dark:text-neutral-400 max-w-xl mb-8 leading-relaxed">
            Building AI products and sharing learning notes on engineering,
            algorithms, and web development.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/blog"
              className="inline-flex items-center justify-center rounded-md bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Read Blog
            </Link>
            <Link
              href="/algorithms"
              className="inline-flex items-center justify-center rounded-md border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Algorithms
            </Link>
          </div>
        </section>

        {/* Recent Posts */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">Recent Posts</h2>
          {recentPosts.length === 0 ? (
            <p className="text-neutral-600 dark:text-neutral-400 text-sm">No posts yet.</p>
          ) : (
            <ul className="space-y-6">
              {recentPosts.map((post) => (
                <li key={post.slug}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="block group rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/50 p-4 hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors"
                  >
                    <h3 className="font-semibold group-hover:underline mb-1">
                      {post.frontmatter.title || "Untitled"}
                    </h3>
                    {post.frontmatter.date && (
                      <time className="text-sm text-neutral-500 dark:text-neutral-400">
                        {new Date(post.frontmatter.date).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </time>
                    )}
                    {(post.frontmatter.description ||
                      post.frontmatter.summary) && (
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 line-clamp-2">
                        {post.frontmatter.description ||
                          post.frontmatter.summary}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Algorithm Notes */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Algorithm Notes</h2>
          {algorithmPosts.length === 0 ? (
            <p className="text-neutral-600 dark:text-neutral-400 text-sm">
              No algorithm notes yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {algorithmPosts.map((post) => (
                <li key={post.slug}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="flex flex-wrap items-baseline gap-2 text-sm hover:underline"
                  >
                    <span className="font-medium">
                      {post.frontmatter.title || "Untitled"}
                    </span>
                    {post.frontmatter.platform && (
                      <span className="text-neutral-500 dark:text-neutral-400 capitalize">
                        {post.frontmatter.platform}
                      </span>
                    )}
                    {post.frontmatter.difficulty && (
                      <span
                        className={`text-xs capitalize px-1.5 py-0.5 rounded ${
                          post.frontmatter.difficulty === "easy"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : post.frontmatter.difficulty === "medium"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {post.frontmatter.difficulty}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 mt-auto">
        <div className="max-w-3xl mx-auto w-full px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              GitHub
            </a>
            <span>© {new Date().getFullYear()} Gavin Felix Sun</span>
          </div>
          <span>Built with Next.js</span>
        </div>
      </footer>
    </div>
  );
}
