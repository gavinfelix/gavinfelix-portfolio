// Algorithms page displaying filtered algorithm posts with statistics and difficulty breakdown
import Link from "next/link";
import { getAllPosts } from "@/lib/mdx";

export default async function Page() {
  const allPosts = getAllPosts();
  
  // Filter only algorithm posts
  const posts = allPosts.filter(
    (post) => post.frontmatter.type === "algorithm"
  );

  // Compute stats
  const totalCount = posts.length;
  const easyCount = posts.filter(
    (post) => post.frontmatter.difficulty === "easy"
  ).length;
  const mediumCount = posts.filter(
    (post) => post.frontmatter.difficulty === "medium"
  ).length;
  const hardCount = posts.filter(
    (post) => post.frontmatter.difficulty === "hard"
  ).length;

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Algorithms</h1>
      
      {posts.length === 0 ? (
        <p className="text-gray-600">No algorithm posts yet.</p>
      ) : (
        <>
          <section className="mb-8 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            <div className="flex flex-wrap items-center gap-4">
              <span>总题数: <strong>{totalCount}</strong></span>
              <span>Easy: <strong>{easyCount}</strong></span>
              <span>Medium: <strong>{mediumCount}</strong></span>
              <span>Hard: <strong>{hardCount}</strong></span>
            </div>
          </section>
          
          <div>
          {posts.map((post) => (
            <article
              key={post.slug}
              className="border-b border-gray-200 py-4 last:border-b-0"
            >
              <Link href={`/blog/${post.slug}`}>
                <h2 className="text-lg font-semibold hover:underline mb-1">
                  {post.frontmatter.title || "Untitled"}
                </h2>
              </Link>
              
              <div className="text-sm text-gray-500">
                {post.frontmatter.platform && (
                  <span className="capitalize">{post.frontmatter.platform}</span>
                )}
                {post.frontmatter.problemId && (
                  <span>
                    {post.frontmatter.platform ? " " : ""}
                    #{post.frontmatter.problemId}
                  </span>
                )}
                {post.frontmatter.difficulty && (
                  <span className="ml-2 capitalize">
                    {post.frontmatter.difficulty}
                  </span>
                )}
              </div>
              
              {post.frontmatter.description && (
                <p className="text-sm text-gray-600 mt-1">
                  {post.frontmatter.description}
                </p>
              )}
            </article>
          ))}
          </div>
        </>
      )}
    </div>
  );
}

