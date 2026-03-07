// MDX utility functions for reading and parsing blog posts from the content directory
import fs from "fs";
import path from "path";
import matter from "gray-matter";

// Absolute path to the content/posts directory
export const POSTS_PATH = path.join(process.cwd(), "content", "posts");

export type PostFrontmatter = {
  title?: string;
  date?: string;
  summary?: string;
  tags?: string[];
  published?: boolean;
  type?: string;
  difficulty?: "easy" | "medium" | "hard";
  platform?: string;
  problemId?: string | number;
  description?: string;
};

export type Post = {
  slug: string;
  frontmatter: PostFrontmatter;
  content: string;
};

/**
 * Get all post slugs from the posts directory
 * @returns Array of slugs without the .mdx extension
 */
export function getPostSlugs(): string[] {
  if (!fs.existsSync(POSTS_PATH)) {
    return [];
  }

  const fileNames = fs.readdirSync(POSTS_PATH);
  return fileNames
    .filter((name) => name.endsWith(".mdx"))
    .map((name) => name.replace(/\.mdx$/, ""));
}

/**
 * Get a post by its slug
 * @param slug - The post slug (without .mdx extension)
 * @returns Post object with slug, frontmatter, and content
 */
export function getPostBySlug(slug: string): Post {
  const filePath = path.join(POSTS_PATH, `${slug}.mdx`);
  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);

  return {
    slug,
    frontmatter: data as PostFrontmatter,
    content,
  };
}

/**
 * Get all posts sorted by date (newest first)
 * @returns Array of posts sorted by frontmatter.date in descending order
 */
export function getAllPosts(): Post[] {
  const slugs = getPostSlugs();
  const posts = slugs.map((slug) => getPostBySlug(slug));

  return posts.sort((a, b) => {
    const dateA = a.frontmatter.date || "";
    const dateB = b.frontmatter.date || "";
    if (dateA < dateB) {
      return 1;
    } else {
      return -1;
    }
  });
}
