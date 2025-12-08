import { compileMDX } from "next-mdx-remote/rsc";
import { getPostBySlug, getAllPosts } from "@/lib/mdx";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import AlgorithmPostHeader from "@/components/AlgorithmPostHeader";

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = getPostBySlug(slug);
    return {
      title: post.frontmatter.title,
      description: post.frontmatter.description || "",
    };
  } catch {
    return {};
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let post;
  try {
    post = getPostBySlug(slug);
  } catch {
    notFound();
  }

  const { content } = await compileMDX({
    source: post.content,
    options: {
      parseFrontmatter: false,
    },
  });

  const isAlgorithm = post.frontmatter.type === "algorithm";

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      {isAlgorithm ? (
        <>
          <AlgorithmPostHeader
            title={post.frontmatter.title ?? post.slug}
            platform={post.frontmatter.platform}
            problemId={post.frontmatter.problemId}
            difficulty={post.frontmatter.difficulty}
            tags={post.frontmatter.tags}
            date={post.frontmatter.date}
          />
          <div className="prose prose-neutral max-w-none mt-6">
            {content}
          </div>
        </>
      ) : (
        <article>
          <h1 className="text-4xl font-bold mb-4">
            {post.frontmatter.title || post.slug}
          </h1>
          {post.frontmatter.date && (
            <time className="text-gray-600 text-sm block mb-6">
              {new Date(post.frontmatter.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          )}
          <div className="prose prose-neutral max-w-none mt-6">
            {content}
          </div>
        </article>
      )}
    </div>
  );
}

