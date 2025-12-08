import Link from "next/link";
import { getAllPosts } from "@/lib/mdx";

export default async function Page() {
  const posts = getAllPosts();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Blog</h1>
      <div className="space-y-8">
        {posts.length === 0 ? (
          <p className="text-gray-600">No posts yet.</p>
        ) : (
          posts.map((post) => (
            <article key={post.slug} className="border-b border-gray-200 pb-6 last:border-b-0">
              <Link
                href={`/blog/${post.slug}`}
                className="block group"
              >
                <h2 className="text-2xl font-semibold mb-2 group-hover:underline">
                  {post.frontmatter.title || "Untitled"}
                </h2>
              </Link>
              <div className="text-gray-600 text-sm space-y-1">
                {post.frontmatter.date && (
                  <time>
                    {new Date(post.frontmatter.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                )}
                {post.frontmatter.description && (
                  <p className="text-gray-700 mt-2">
                    {post.frontmatter.description}
                  </p>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

